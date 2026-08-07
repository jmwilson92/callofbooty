import * as THREE from 'three';
import { CAMERA, PLAYER, SLIDE, VEHICLES, PARACHUTE } from '../config.js';
import { clamp, lerp } from '../core/Noise.js';

const DEG = Math.PI / 180;
const PITCH_LIMIT = CAMERA.PITCH_CLAMP_DEG * DEG;

// First-person on foot; third-person chase while riding or under parachute.
export class PlayerCamera {
  constructor(aspect) {
    this.camera = new THREE.PerspectiveCamera(CAMERA.FOV_BASE, aspect, CAMERA.NEAR, CAMERA.FAR);
    this.yaw = 0;
    this.pitch = 0;
    this.roll = 0;

    this.smoothEyeY = 0;
    this._initialised = false;

    this.fov = CAMERA.FOV_BASE;
    this.bobPhase = 0;

    // Recoil socket: Phase 2 writes visual kick here and it composes with look.
    this.recoilPitch = 0;
    this.recoilYaw = 0;

    this._pos = new THREE.Vector3();
    this._euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this._look = new THREE.Vector3();
    this._camTarget = new THREE.Vector3();
    /** @type {THREE.Vector3|null} smoothed chase focus (vehicle / chute) */
    this._vehSmooth = null;
    /** Last third-person mode so we snap cleanly on exit */
    this._tpMode = null;
  }

  setAspect(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  applyMouse(dx, dy) {
    this.yaw -= dx * CAMERA.SENSITIVITY;
    this.pitch -= dy * CAMERA.SENSITIVITY;
    this.pitch = clamp(this.pitch, -PITCH_LIMIT, PITCH_LIMIT);
    if (this.yaw > Math.PI) this.yaw -= Math.PI * 2;
    else if (this.yaw < -Math.PI) this.yaw += Math.PI * 2;
  }

  /**
   * @param {import('./Controller.js').Controller} controller
   * @param {object|null} vehicle  active vehicle from VehicleSystem (or null)
   * @param {{ parachute?: boolean }} [opts]
   */
  update(dt, controller, alpha, strafeInput, vehicle = null, opts = null) {
    if (vehicle) {
      this._updateThirdPerson(dt, vehicle);
      return;
    }
    if (opts?.parachute || controller.parachute) {
      this._updateParachuteChase(dt, controller, alpha);
      return;
    }

    // Left vehicle / chute — drop smoothed chase state so re-entry doesn't snap
    if (this._tpMode) {
      this._vehSmooth = null;
      this._tpMode = null;
      // Snap eye height so FP doesn't blend from mid-air chase
      controller.interpolated(alpha, this._pos);
      this.smoothEyeY = this._pos.y + controller.eyeHeight;
      this._initialised = true;
    }

    controller.interpolated(alpha, this._pos);
    const targetEyeY = this._pos.y + controller.eyeHeight;

    if (!this._initialised) {
      this.smoothEyeY = targetEyeY;
      this._initialised = true;
    } else if (controller.crawlMode) {
      // Drop to prone eye height quickly when downed (don't float at stand height)
      const k = 1 - Math.exp(-14 * dt);
      this.smoothEyeY = lerp(this.smoothEyeY, targetEyeY, k);
      if (Math.abs(this.smoothEyeY - targetEyeY) > 0.45) this.smoothEyeY = targetEyeY;
    } else {
      const k = 1 - Math.exp(-CAMERA.FOLLOW_RATE * dt);
      this.smoothEyeY = lerp(this.smoothEyeY, targetEyeY, k);
      if (Math.abs(this.smoothEyeY - targetEyeY) > 1.2) this.smoothEyeY = targetEyeY;
    }

    const wantFov = controller.sprinting || controller.sliding ? CAMERA.FOV_SPRINT : CAMERA.FOV_BASE;
    const fovTime = wantFov > this.fov ? CAMERA.FOV_UP_TIME : CAMERA.FOV_DOWN_TIME;
    const fk = 1 - Math.exp(-dt / Math.max(1e-4, fovTime / 3));
    this.fov = lerp(this.fov, wantFov, fk);
    if (Math.abs(this.fov - this.camera.fov) > 0.01) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }

    let bobX = 0, bobY = 0;
    if (controller.grounded && !controller.sliding && controller.speed > 0.4) {
      this.bobPhase = controller.distanceTravelled * CAMERA.BOB_FREQ_SCALE;
      const intensity = clamp(controller.speed / PLAYER.SPEED_WALK, 0, CAMERA.BOB_MAX_INTENSITY) *
        (controller.ads ? CAMERA.BOB_ADS_MULT : 1);
      const p = this.bobPhase * Math.PI * 2;
      bobY = Math.sin(p * 2) * CAMERA.BOB_AMP_VERT * intensity;
      bobX = Math.sin(p) * CAMERA.BOB_AMP_HORIZ * intensity;
    }

    let targetRoll = -strafeInput * CAMERA.STRAFE_ROLL_DEG * DEG;
    if (controller.sliding) {
      const s = Math.sign(strafeInput) || 1;
      targetRoll += -s * SLIDE.CAMERA_ROLL_DEG * DEG;
    }
    const rk = 1 - Math.exp(-CAMERA.ROLL_BLEND * dt);
    this.roll = lerp(this.roll, targetRoll, rk);

    this._euler.set(
      clamp(this.pitch + this.recoilPitch, -PITCH_LIMIT, PITCH_LIMIT),
      this.yaw + this.recoilYaw,
      this.roll
    );
    this.camera.quaternion.setFromEuler(this._euler);

    this.camera.position.set(this._pos.x, this.smoothEyeY + bobY, this._pos.z);
    this.camera.translateX(bobX);
  }

  /** Orbit chase cam behind the vehicle (mouse still steers look / vehicle). */
  _updateThirdPerson(dt, vehicle) {
    this._tpMode = 'vehicle';
    const isHeli = vehicle.type === 'helicopter';
    const dist = isHeli ? (VEHICLES.CAM_HELI_DIST ?? 18) : (VEHICLES.CAM_MOTO_DIST ?? 7.5);
    const height = isHeli ? (VEHICLES.CAM_HELI_HEIGHT ?? 6.2) : (VEHICLES.CAM_MOTO_HEIGHT ?? 2.4);
    const lookY = VEHICLES.CAM_LOOK_Y ?? 1.15;

    // Smooth vehicle sample so fixed-step sim doesn't shake the chase cam
    if (!this._vehSmooth) {
      this._vehSmooth = new THREE.Vector3(vehicle.x, vehicle.y, vehicle.z);
    }
    // Heli: softer follow (less jitter). Snap if teleported far.
    const followRate = isHeli ? (VEHICLES.CAM_HELI_FOLLOW ?? 7.5) : 12;
    const jump = Math.hypot(
      vehicle.x - this._vehSmooth.x,
      vehicle.y - this._vehSmooth.y,
      vehicle.z - this._vehSmooth.z
    );
    if (jump > 25 || !this._initialised) {
      this._vehSmooth.set(vehicle.x, vehicle.y, vehicle.z);
    } else {
      const sk = 1 - Math.exp(-followRate * dt);
      this._vehSmooth.x = lerp(this._vehSmooth.x, vehicle.x, sk);
      this._vehSmooth.y = lerp(this._vehSmooth.y, vehicle.y, sk);
      this._vehSmooth.z = lerp(this._vehSmooth.z, vehicle.z, sk);
    }

    // Slight pitch clamp so chase cam doesn't go under the ground as easily
    const pitch = clamp(this.pitch, -0.45, 0.65);
    const cosP = Math.cos(pitch);
    const ox = Math.sin(this.yaw) * cosP * dist;
    const oy = height + Math.sin(-pitch) * dist * 0.7;
    const oz = Math.cos(this.yaw) * cosP * dist;

    const tx = this._vehSmooth.x;
    const ty = this._vehSmooth.y + lookY;
    const tz = this._vehSmooth.z;

    const wantX = tx + ox;
    const wantY = ty + oy;
    const wantZ = tz + oz;

    // Camera spring — heli uses gentler rate so motion feels floaty, not juddery
    const camRate = isHeli ? (VEHICLES.CAM_HELI_SMOOTH ?? 6.5) : 10;
    const k = 1 - Math.exp(-camRate * dt);
    if (!this._initialised) {
      this.camera.position.set(wantX, wantY, wantZ);
      this._look.set(tx, ty, tz);
    } else {
      this.camera.position.x = lerp(this.camera.position.x, wantX, k);
      this.camera.position.y = lerp(this.camera.position.y, wantY, k);
      this.camera.position.z = lerp(this.camera.position.z, wantZ, k);
      // Smooth look target too (prevents lookAt micro-jitter)
      this._look.x = lerp(this._look.x, tx, k);
      this._look.y = lerp(this._look.y, ty, k);
      this._look.z = lerp(this._look.z, tz, k);
    }
    this._initialised = true;

    this.camera.lookAt(this._look);

    const wantFov = isHeli ? 60 : 58;
    this.fov = lerp(this.fov, wantFov, 1 - Math.exp(-3 * dt));
    if (Math.abs(this.camera.fov - this.fov) > 0.05) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
    this.roll = 0;
  }

  /**
   * Third-person chase under open parachute — body + canopy in frame.
   * Mouse still steers yaw/pitch (glide direction / look).
   */
  _updateParachuteChase(dt, controller, alpha) {
    const entering = this._tpMode !== 'chute';
    this._tpMode = 'chute';

    controller.interpolated(alpha, this._pos);
    const px = this._pos.x;
    const py = this._pos.y;
    const pz = this._pos.z;

    if (!this._vehSmooth || entering) {
      this._vehSmooth = new THREE.Vector3(px, py, pz);
    } else {
      const jump = Math.hypot(
        px - this._vehSmooth.x,
        py - this._vehSmooth.y,
        pz - this._vehSmooth.z
      );
      if (jump > 40) {
        this._vehSmooth.set(px, py, pz);
      } else {
        const sk = 1 - Math.exp(-(PARACHUTE.CAM_SMOOTH ?? 8) * dt);
        this._vehSmooth.x = lerp(this._vehSmooth.x, px, sk);
        this._vehSmooth.y = lerp(this._vehSmooth.y, py, sk);
        this._vehSmooth.z = lerp(this._vehSmooth.z, pz, sk);
      }
    }

    const dist = PARACHUTE.CAM_DIST ?? 6.5;
    const height = PARACHUTE.CAM_HEIGHT ?? 2.4;
    const lookY = PARACHUTE.CAM_LOOK_Y ?? 1.2;

    // Orbit behind look direction; pitch limited so canopy stays in frame
    const pitch = clamp(this.pitch, -0.55, 0.5);
    const cosP = Math.cos(pitch);
    const ox = Math.sin(this.yaw) * cosP * dist;
    const oy = height + Math.sin(-pitch) * dist * 0.55;
    const oz = Math.cos(this.yaw) * cosP * dist;

    const tx = this._vehSmooth.x;
    const ty = this._vehSmooth.y + lookY;
    const tz = this._vehSmooth.z;

    const wantX = tx + ox;
    const wantY = ty + oy;
    const wantZ = tz + oz;

    const camRate = PARACHUTE.CAM_SMOOTH ?? 8;
    const k = 1 - Math.exp(-camRate * dt);
    if (entering || !this._initialised) {
      this.camera.position.set(wantX, wantY, wantZ);
      this._look.set(tx, ty + 0.6, tz);
      this._initialised = true;
    } else {
      this.camera.position.x = lerp(this.camera.position.x, wantX, k);
      this.camera.position.y = lerp(this.camera.position.y, wantY, k);
      this.camera.position.z = lerp(this.camera.position.z, wantZ, k);
      this._look.x = lerp(this._look.x, tx, k);
      this._look.y = lerp(this._look.y, ty + 0.6, k);
      this._look.z = lerp(this._look.z, tz, k);
    }

    this.camera.lookAt(this._look);

    const wantFov = PARACHUTE.CAM_FOV ?? 62;
    this.fov = lerp(this.fov, wantFov, 1 - Math.exp(-4 * dt));
    if (Math.abs(this.camera.fov - this.fov) > 0.05) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
    this.roll = 0;
    // Keep FP eye smooth ready for landing snap
    this.smoothEyeY = py + controller.eyeHeight;
  }
}
