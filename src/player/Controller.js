import * as THREE from 'three';
import { PLAYER, SLIDE, MANTLE, COLLISION } from '../config.js';
import { resolveCapsule, makeCollisionResult } from '../world/Collision.js';
import { supportTop, spanClear, groundProbe, findMantleTarget } from './Probes.js';
import { clamp, lerp } from '../core/Noise.js';

// Kinematic character controller. Deliberately not a rigid body -- physics
// driven FPS movement feels floaty, and slide-cancel-jump needs exact control
// over horizontal velocity preservation.

const MAX_SLOPE_COS = Math.cos((PLAYER.MAX_SLOPE_DEG * Math.PI) / 180);

export class Controller {
  constructor(terrain, hash, bus) {
    this.terrain = terrain;
    this.hash = hash;
    this.bus = bus;

    this.pos = new THREE.Vector3(PLAYER.SPAWN.x, 0, PLAYER.SPAWN.z);
    this.pos.y = terrain.heightAt(this.pos.x, this.pos.z) + 1;
    this.prevPos = this.pos.clone();
    this.vel = new THREE.Vector3();

    this.height = PLAYER.HEIGHT_STAND;
    this.radius = PLAYER.CAPSULE_RADIUS;

    this.grounded = false;
    this.groundY = this.pos.y;
    this.coyote = 0;
    this.jumpBuffer = 0;

    this.crouching = false;
    this.sprinting = false;
    this.ads = false;

    this.sliding = false;
    this.slideTimer = 0;
    this.slideCooldown = 0;
    this.slideDir = new THREE.Vector2(0, 1);

    this.mantling = false;
    this.mantleTimer = 0;
    this.mantleFrom = new THREE.Vector3();
    this.mantleTo = new THREE.Vector3();

    this.speed = 0; // horizontal speed, for camera bob and FOV
    this.distanceTravelled = 0;

    this._candidates = [];
    this._result = makeCollisionResult();
    this._ground = { grounded: false, groundY: -Infinity, steep: null, normal: new THREE.Vector3() };
    this._steepNormal = null;
    this._wish = new THREE.Vector3();
    this._step = new THREE.Vector3();
  }

  get eyeHeight() {
    if (this.sliding) return SLIDE.CAMERA_HEIGHT;
    const t = (this.height - PLAYER.HEIGHT_CROUCH) / (PLAYER.HEIGHT_STAND - PLAYER.HEIGHT_CROUCH);
    return lerp(PLAYER.EYE_CROUCH, PLAYER.EYE_STAND, clamp(t, 0, 1));
  }

  get eyePosition() {
    return _eye.set(this.pos.x, this.pos.y + this.eyeHeight, this.pos.z);
  }

  // Thin wrappers over the shared probes, so call sites stay readable.
  _supportTop(x, z, maxY) {
    return supportTop(this.terrain, this.hash, this._candidates, x, z, maxY, this.radius);
  }

  _spanClear(x, z, y0, y1) {
    return spanClear(this.hash, this._candidates, x, z, y0, y1, this.radius);
  }

  _groundProbe() {
    groundProbe(this.terrain, this.hash, this._candidates, this.pos, this.radius,
                MAX_SLOPE_COS, this._ground);

    this.grounded = this._ground.grounded;
    this._steepNormal = this._ground.steep;
    if (this._ground.groundY !== -Infinity) this.groundY = this._ground.groundY;

    if (this.grounded && this.vel.y <= 0) {
      this.pos.y = this._ground.groundY;
      this.vel.y = 0;
    }
  }

  _moveAndCollide(delta) {
    // Substep so a fast slide cannot tunnel through a wall.
    const dist = delta.length();
    const steps = Math.max(1, Math.ceil(dist / COLLISION.MAX_SUBSTEP));
    this._step.copy(delta).divideScalar(steps);

    let blocked = false;
    for (let i = 0; i < steps; i++) {
      this.pos.add(this._step);
      // Terrain is a hard floor: never fall through it, ever.
      const th = this.terrain.heightAt(this.pos.x, this.pos.z);
      if (this.pos.y < th) this.pos.y = th;

      resolveCapsule(this.pos, this.radius, this.height, this.hash, this._candidates, this._result);
      if (this._result.hitWall) blocked = true;
      if (this._result.hitCeiling && this.vel.y > 0) this.vel.y = 0;
    }
    return blocked;
  }

  /**
   * Walk up stairs and kerbs: rewind, lift, re-advance, settle.
   *
   * This runs whenever horizontal progress fell short of what was asked for --
   * NOT only when the contact was classified as a wall. A capsule climbing
   * stairs meets each tread on its top edge, which yields a mostly-vertical
   * normal that reads as "ground"; keying off the classification leaves the
   * player grinding against every step.
   */
  _tryStepUp(before, horiz) {
    const fallbackP = _saveP.copy(this.pos);
    const fallbackProgress = Math.hypot(this.pos.x - before.x, this.pos.z - before.z);

    // Probe just ahead to learn how high the obstruction actually is, and lift
    // by exactly that. Always lifting the full step budget needlessly fails
    // under low soffits -- a stairwell being the obvious case.
    const target = this._supportTop(
      before.x + horiz.x, before.z + horiz.z,
      before.y + PLAYER.MAX_STEP_HEIGHT + 0.01
    );
    const rise = target - before.y;
    if (target === -Infinity || rise <= 1e-3 || rise > PLAYER.MAX_STEP_HEIGHT) return false;

    // No point lifting into a ceiling.
    if (!this._spanClear(before.x, before.z, before.y + this.height,
                         before.y + this.height + rise + 0.02)) {
      return false;
    }

    this.pos.copy(before);
    this.pos.y = target + 0.02;

    resolveCapsule(this.pos, this.radius, this.height, this.hash, this._candidates, this._result);
    if (this._result.hitWall) {
      this.pos.copy(fallbackP);
      return false;
    }

    this._moveAndCollide(_tmpV3.copy(horiz));

    // Only keep the step if it actually bought us ground we did not already have.
    const progress = Math.hypot(this.pos.x - before.x, this.pos.z - before.z);
    if (progress <= fallbackProgress + 1e-4) {
      this.pos.copy(fallbackP);
      return false;
    }

    const top = this._supportTop(this.pos.x, this.pos.z, this.pos.y + 0.01);
    if (top === -Infinity ||
        this.pos.y - top > PLAYER.MAX_STEP_HEIGHT + 0.05 ||
        top < before.y - 0.01) {
      this.pos.copy(fallbackP);
      return false;
    }

    this.pos.y = top;
    return true;
  }

  _tryMantle(yaw) {
    const target = findMantleTarget(
      this.terrain, this.hash, this._candidates, this.pos, this.radius, yaw, _mantleTo
    );
    if (!target) return false;

    this.mantling = true;
    this.mantleTimer = 0;
    this.mantleFrom.copy(this.pos);
    this.mantleTo.copy(target);
    this.vel.set(0, 0, 0);
    this.bus.emit('player:mantle', { from: this.mantleFrom.clone(), to: this.mantleTo.clone() });
    return true;
  }

  tick(dt, input, yaw) {
    this.prevPos.copy(this.pos);

    if (this.mantling) {
      this.mantleTimer += dt;
      const t = clamp(this.mantleTimer / MANTLE.DURATION, 0, 1);
      const e = t * t * (3 - 2 * t); // smoothstep, reads as a deliberate pull-up
      this.pos.lerpVectors(this.mantleFrom, this.mantleTo, e);
      if (t >= 1) {
        this.mantling = false;
        this.grounded = true;
      }
      this.speed = 0;
      return;
    }

    // --- input -> wish direction in world space ---
    const fwd = (input.action('forward') ? 1 : 0) - (input.action('back') ? 1 : 0);
    const strafe = (input.action('right') ? 1 : 0) - (input.action('left') ? 1 : 0);
    const sinY = Math.sin(yaw), cosY = Math.cos(yaw);
    this._wish.set(
      -sinY * fwd + cosY * strafe,
      0,
      -cosY * fwd - sinY * strafe
    );
    if (this._wish.lengthSq() > 1e-6) this._wish.normalize();

    const wantSprint = input.action('sprint') && fwd > 0 && !this.crouching;
    const wantCrouch = input.action('crouch');

    if (this.jumpBuffer > 0) this.jumpBuffer -= dt;
    if (input.actionPressed('jump')) this.jumpBuffer = PLAYER.JUMP_BUFFER;
    if (this.slideCooldown > 0) this.slideCooldown -= dt;

    const horizSpeed = Math.hypot(this.vel.x, this.vel.z);

    // --- slide entry: crouch while sprinting on the ground ---
    if (!this.sliding && wantCrouch && this.sprinting && this.grounded &&
        this.slideCooldown <= 0 && horizSpeed > PLAYER.SPEED_WALK) {
      this.sliding = true;
      this.slideTimer = 0;
      const boosted = Math.min(horizSpeed * SLIDE.SPEED_MULT, SLIDE.SPEED_CAP);
      if (horizSpeed > 1e-4) {
        this.vel.x = (this.vel.x / horizSpeed) * boosted;
        this.vel.z = (this.vel.z / horizSpeed) * boosted;
      }
      this.slideDir.set(this.vel.x, this.vel.z).normalize();
      this.bus.emit('player:slide', { speed: boosted });
    }

    // --- jump, with coyote time and input buffering ---
    const canJump = this.grounded || this.coyote > 0;
    if (this.jumpBuffer > 0 && canJump) {
      // Mantle takes priority when there is a ledge in front of us.
      if (!this._tryMantle(yaw)) {
        this.vel.y = PLAYER.JUMP_IMPULSE;
        // Slide-cancel: jumping out of a slide preserves horizontal velocity.
        // This is the core movement skill expression -- do not "fix" it.
        this.sliding = false;
        this.slideCooldown = SLIDE.COOLDOWN;
        this.grounded = false;
        this.coyote = 0;
        this.jumpBuffer = 0;
        this.bus.emit('player:jump', {});
      } else {
        this.jumpBuffer = 0;
        return;
      }
    } else if (this.jumpBuffer > 0 && !this.grounded) {
      // Airborne mantle onto a ledge.
      if (this._tryMantle(yaw)) {
        this.jumpBuffer = 0;
        return;
      }
    }

    this.sprinting = wantSprint && !this.sliding;

    // --- crouch height, blocked by low ceilings ---
    const targetHeight = (wantCrouch || this.sliding) ? PLAYER.HEIGHT_CROUCH : PLAYER.HEIGHT_STAND;
    if (targetHeight > this.height) {
      const headroom = this._spanClear(this.pos.x, this.pos.z, this.pos.y + this.height + 0.02, this.pos.y + targetHeight);
      if (headroom) {
        this.height = Math.min(targetHeight, this.height + PLAYER.CROUCH_LERP * dt);
      }
    } else {
      this.height = Math.max(targetHeight, this.height - PLAYER.CROUCH_LERP * dt);
    }
    this.crouching = this.height < PLAYER.HEIGHT_STAND - 0.05;

    // --- horizontal acceleration ---
    if (this.sliding) {
      this._tickSlide(dt);
    } else {
      let target = PLAYER.SPEED_WALK;
      if (this.sprinting) target = PLAYER.SPEED_SPRINT;
      else if (this.crouching) target = PLAYER.SPEED_CROUCH;
      if (this.ads) target *= PLAYER.ADS_MOVE_MULT;

      if (this.grounded) {
        // Friction first, then acceleration toward the wish direction.
        const sp = Math.hypot(this.vel.x, this.vel.z);
        if (sp > 0) {
          const drop = sp * PLAYER.FRICTION_GROUND * dt;
          const scale = Math.max(0, sp - drop) / sp;
          this.vel.x *= scale;
          this.vel.z *= scale;
        }
        this._accelerate(this._wish, target, PLAYER.ACCEL_GROUND, dt);
      } else {
        this._accelerate(this._wish, target, PLAYER.ACCEL_AIR, dt, PLAYER.AIR_CONTROL);
      }
    }

    // Sliding down a face too steep to walk on.
    if (this._steepNormal) {
      const n = this._steepNormal;
      this.vel.x += n.x * SLIDE.SLOPE_ACCEL * dt;
      this.vel.z += n.z * SLIDE.SLOPE_ACCEL * dt;
    }

    // --- gravity ---
    if (!this.grounded) this.vel.y += PLAYER.GRAVITY * dt;

    // --- integrate ---
    const horiz = _tmpV.set(this.vel.x * dt, 0, this.vel.z * dt);
    const before = _beforeP.copy(this.pos);
    this._moveAndCollide(horiz);

    if (this.grounded || this.coyote > 0) {
      const moved = Math.hypot(this.pos.x - before.x, this.pos.z - before.z);
      const wanted = Math.hypot(horiz.x, horiz.z);
      if (wanted > 1e-4 && moved < wanted * 0.95) this._tryStepUp(before, horiz);
    }

    this._moveAndCollide(_tmpV.set(0, this.vel.y * dt, 0));

    // Kill horizontal velocity into a wall so we do not stick to it.
    if (this._result.hitWall) {
      const n = this._result.wallNormal;
      const into = this.vel.x * n.x + this.vel.z * n.z;
      if (into < 0) {
        this.vel.x -= n.x * into;
        this.vel.z -= n.z * into;
      }
    }

    const wasGrounded = this.grounded;
    this._groundProbe();

    if (this.grounded) {
      this.coyote = PLAYER.COYOTE_TIME;
      if (!wasGrounded) this.bus.emit('player:land', { speed: this.vel.y });
    } else if (this.coyote > 0) {
      this.coyote -= dt;
    }

    this.speed = Math.hypot(this.vel.x, this.vel.z);
    this.distanceTravelled += this.speed * dt;
  }

  _tickSlide(dt) {
    this.slideTimer += dt;

    // Slope influence: downhill accelerates, uphill bleeds speed faster.
    const n = this.terrain.normalAt(this.pos.x, this.pos.z, _n);
    const along = n.x * this.slideDir.x + n.z * this.slideDir.y;
    if (along > 0) {
      this.vel.x += n.x * SLIDE.SLOPE_ACCEL * dt;
      this.vel.z += n.z * SLIDE.SLOPE_ACCEL * dt;
    }

    const sp = Math.hypot(this.vel.x, this.vel.z);
    const frictionMult = along < 0 ? SLIDE.UPHILL_DECAY_MULT : 1;
    if (sp > 0) {
      const drop = sp * SLIDE.FRICTION * frictionMult * dt * 0.35;
      const scale = Math.max(0, sp - drop) / sp;
      this.vel.x *= scale;
      this.vel.z *= scale;
    }

    const speedNow = Math.hypot(this.vel.x, this.vel.z);
    if (this.slideTimer >= SLIDE.DURATION || speedNow < SLIDE.MIN_SPEED || !this.grounded) {
      this.sliding = false;
      this.slideCooldown = SLIDE.COOLDOWN;
    }
  }

  _accelerate(wishDir, wishSpeed, accel, dt, scale = 1) {
    if (wishDir.lengthSq() < 1e-8) return;
    const current = this.vel.x * wishDir.x + this.vel.z * wishDir.z;
    const add = wishSpeed - current;
    if (add <= 0) return;
    // Quake-style: the acceleration term scales with the target speed, which is
    // what lets friction and acceleration settle at exactly wishSpeed rather
    // than at some lower equilibrium.
    let a = accel * dt * wishSpeed * scale;
    if (a > add) a = add;
    this.vel.x += wishDir.x * a;
    this.vel.z += wishDir.z * a;
  }

  // Render-time interpolated feet position.
  interpolated(alpha, out) {
    return out.lerpVectors(this.prevPos, this.pos, alpha);
  }
}

const _eye = new THREE.Vector3();
const _n = new THREE.Vector3();
const _mantleTo = new THREE.Vector3();
const _tmpV = new THREE.Vector3();
const _tmpV3 = new THREE.Vector3();
const _saveP = new THREE.Vector3();
const _beforeP = new THREE.Vector3();
