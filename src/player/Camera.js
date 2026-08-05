import * as THREE from 'three';
import { CAMERA, PLAYER, SLIDE } from '../config.js';
import { clamp, lerp } from '../core/Noise.js';

const DEG = Math.PI / 180;
const PITCH_LIMIT = CAMERA.PITCH_CLAMP_DEG * DEG;

// First-person camera. The camera is NOT parented to the capsule -- it rides a
// separate node whose height chases the eye position, which is what stops
// stair step-ups from jolting the view.
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
  }

  setAspect(aspect) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  applyMouse(dx, dy) {
    this.yaw -= dx * CAMERA.SENSITIVITY;
    this.pitch -= dy * CAMERA.SENSITIVITY;
    this.pitch = clamp(this.pitch, -PITCH_LIMIT, PITCH_LIMIT);
    // Keep yaw bounded so it never loses float precision over a long match.
    if (this.yaw > Math.PI) this.yaw -= Math.PI * 2;
    else if (this.yaw < -Math.PI) this.yaw += Math.PI * 2;
  }

  // Called once per rendered frame with the interpolated player state.
  update(dt, controller, alpha, strafeInput) {
    controller.interpolated(alpha, this._pos);
    const targetEyeY = this._pos.y + controller.eyeHeight;

    if (!this._initialised) {
      this.smoothEyeY = targetEyeY;
      this._initialised = true;
    } else {
      // Exponential smoothing -- frame-rate independent, unlike a raw lerp.
      const k = 1 - Math.exp(-CAMERA.FOLLOW_RATE * dt);
      this.smoothEyeY = lerp(this.smoothEyeY, targetEyeY, k);
      // Never let the smoothing lag so far that the view clips into geometry.
      if (Math.abs(this.smoothEyeY - targetEyeY) > 1.2) this.smoothEyeY = targetEyeY;
    }

    // --- FOV: sprint pushes it out, and back in faster than it went out ---
    const wantFov = controller.sprinting || controller.sliding ? CAMERA.FOV_SPRINT : CAMERA.FOV_BASE;
    const fovTime = wantFov > this.fov ? CAMERA.FOV_UP_TIME : CAMERA.FOV_DOWN_TIME;
    const fk = 1 - Math.exp(-dt / Math.max(1e-4, fovTime / 3));
    this.fov = lerp(this.fov, wantFov, fk);
    if (Math.abs(this.fov - this.camera.fov) > 0.01) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }

    // --- view bob, driven by distance travelled rather than a timer ---
    let bobX = 0, bobY = 0;
    if (controller.grounded && !controller.sliding && controller.speed > 0.4) {
      this.bobPhase = controller.distanceTravelled * CAMERA.BOB_FREQ_SCALE;
      const intensity = clamp(controller.speed / PLAYER.SPEED_WALK, 0, CAMERA.BOB_MAX_INTENSITY) *
        (controller.ads ? CAMERA.BOB_ADS_MULT : 1);
      const p = this.bobPhase * Math.PI * 2;
      bobY = Math.sin(p * 2) * CAMERA.BOB_AMP_VERT * intensity;
      bobX = Math.sin(p) * CAMERA.BOB_AMP_HORIZ * intensity;
    }

    // --- roll: a touch when strafing, more and directional while sliding ---
    let targetRoll = -strafeInput * CAMERA.STRAFE_ROLL_DEG * DEG;
    if (controller.sliding) {
      const s = Math.sign(strafeInput) || 1;
      targetRoll += -s * SLIDE.CAMERA_ROLL_DEG * DEG;
    }
    const rk = 1 - Math.exp(-CAMERA.ROLL_BLEND * dt);
    this.roll = lerp(this.roll, targetRoll, rk);

    // --- compose ---
    this._euler.set(
      clamp(this.pitch + this.recoilPitch, -PITCH_LIMIT, PITCH_LIMIT),
      this.yaw + this.recoilYaw,
      this.roll
    );
    this.camera.quaternion.setFromEuler(this._euler);

    this.camera.position.set(this._pos.x, this.smoothEyeY + bobY, this._pos.z);
    // Bob sideways in view space so it reads as gait, not as a world shove.
    this.camera.translateX(bobX);
  }
}
