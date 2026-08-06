import * as THREE from 'three';
import { CAMERA, PLAYER, SLIDE, VEHICLES } from '../config.js';
import { clamp, lerp } from '../core/Noise.js';

const DEG = Math.PI / 180;
const PITCH_LIMIT = CAMERA.PITCH_CLAMP_DEG * DEG;

// First-person on foot; third-person chase cam while riding a vehicle.
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
   */
  update(dt, controller, alpha, strafeInput, vehicle = null) {
    if (vehicle) {
      this._updateThirdPerson(dt, vehicle);
      return;
    }

    controller.interpolated(alpha, this._pos);
    const targetEyeY = this._pos.y + controller.eyeHeight;

    if (!this._initialised) {
      this.smoothEyeY = targetEyeY;
      this._initialised = true;
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
    const isHeli = vehicle.type === 'helicopter';
    const dist = isHeli ? (VEHICLES.CAM_HELI_DIST ?? 16) : (VEHICLES.CAM_MOTO_DIST ?? 7.5);
    const height = isHeli ? (VEHICLES.CAM_HELI_HEIGHT ?? 5.5) : (VEHICLES.CAM_MOTO_HEIGHT ?? 2.4);
    const lookY = VEHICLES.CAM_LOOK_Y ?? 1.15;

    // Slight pitch clamp so chase cam doesn't go under the ground as easily
    const pitch = clamp(this.pitch, -0.55, 0.75);
    const cosP = Math.cos(pitch);
    // Behind look direction: look is (−sin yaw, 0, −cos yaw) → offset = opposite
    const ox = Math.sin(this.yaw) * cosP * dist;
    const oy = height + Math.sin(-pitch) * dist * 0.85;
    const oz = Math.cos(this.yaw) * cosP * dist;

    const tx = vehicle.x;
    const ty = vehicle.y + lookY;
    const tz = vehicle.z;

    const wantX = tx + ox;
    const wantY = ty + oy;
    const wantZ = tz + oz;

    // Smooth follow
    const k = 1 - Math.exp(-10 * dt);
    if (!this._camTarget.x && !this._initialised) {
      this.camera.position.set(wantX, wantY, wantZ);
    } else {
      this.camera.position.x = lerp(this.camera.position.x, wantX, k);
      this.camera.position.y = lerp(this.camera.position.y, wantY, k);
      this.camera.position.z = lerp(this.camera.position.z, wantZ, k);
    }
    this._initialised = true;

    this._look.set(tx, ty, tz);
    this.camera.lookAt(this._look);

    // Wider FOV for vehicle
    const wantFov = isHeli ? 62 : 58;
    this.fov = lerp(this.fov, wantFov, 1 - Math.exp(-4 * dt));
    if (Math.abs(this.camera.fov - this.fov) > 0.05) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }
    this.roll = 0;
  }
}
