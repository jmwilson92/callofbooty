import * as THREE from 'three';

// Rideable elevators. Specs registered during world gen; car mesh + floor
// collision built once the spatial hash exists.

/** Registry filled while buildings are placed. */
export const worldElevators = {
  specs: [],
  clear() {
    this.specs.length = 0;
  },
  /**
   * @param {{
   *   x0: number, z0: number, x1: number, z1: number,
   *   baseY: number, floors: number, floorH: number,
   *   startFloor?: number,
   * }} spec  cabin interior AABB in XZ; floors from baseY
   */
  register(spec) {
    this.specs.push(spec);
  },
};

function cabinFloorY(spec, floor) {
  return spec.baseY + floor * spec.floorH + 0.08;
}

/**
 * Builds elevator cars, moves them between floors, carries the player.
 */
export class ElevatorSystem {
  constructor(hash) {
    this.hash = hash;
    this.cars = [];
    this.group = new THREE.Group();
    this.group.name = 'elevators';
    this._near = null;
  }

  clear() {
    this.cars.length = 0;
    while (this.group.children.length) this.group.remove(this.group.children[0]);
  }

  buildFromRegistry() {
    this.clear();
    for (const spec of worldElevators.specs) {
      this._addCar(spec);
    }
    return this.cars.length;
  }

  _addCar(spec) {
    const w = spec.x1 - spec.x0;
    const d = spec.z1 - spec.z0;
    const cx = (spec.x0 + spec.x1) * 0.5;
    const cz = (spec.z0 + spec.z1) * 0.5;
    const startF = Math.min(spec.floors - 1, Math.max(0, spec.startFloor ?? 0));
    const y = cabinFloorY(spec, startF);

    // Visual car: floor + low walls + ceiling
    const root = new THREE.Group();
    root.position.set(cx, y, cz);

    const floorMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.7, metalness: 0.2 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a6a8a, roughness: 0.55, metalness: 0.25 });
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x2a3540, roughness: 0.8 });

    const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, 0.12, d * 0.92), floorMat);
    floorMesh.position.y = 0.06;
    floorMesh.receiveShadow = true;
    root.add(floorMesh);

    // Side panels (leave door side open-ish — door openings are on shaft)
    const wallH = Math.min(2.4, spec.floorH - 0.6);
    const t = 0.06;
    const mkWall = (sx, sy, sz, px, py, pz) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), wallMat);
      m.position.set(px, py, pz);
      m.castShadow = true;
      root.add(m);
    };
    mkWall(w * 0.9, wallH, t, 0, wallH * 0.5 + 0.1, -d * 0.42);
    mkWall(w * 0.9, wallH, t, 0, wallH * 0.5 + 0.1, d * 0.42);
    mkWall(t, wallH, d * 0.75, -w * 0.42, wallH * 0.5 + 0.1, 0);
    mkWall(t, wallH, d * 0.75, w * 0.42, wallH * 0.5 + 0.1, 0);

    const ceil = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.08, d * 0.9), ceilMat);
    ceil.position.y = wallH + 0.2;
    root.add(ceil);

    // Indicator light on ceiling
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.06, 0.25),
      new THREE.MeshStandardMaterial({ color: 0xb0ff20, emissive: 0x406010, emissiveIntensity: 0.6 })
    );
    lamp.position.y = wallH + 0.15;
    root.add(lamp);

    this.group.add(root);

    // Walkable floor collision (updated each frame while moving)
    const pad = 0.02;
    const floorBox = this.hash.add(
      new THREE.Vector3(spec.x0 + pad, y, spec.z0 + pad),
      new THREE.Vector3(spec.x1 - pad, y + 0.14, spec.z1 - pad),
      'elevator'
    );

    this.cars.push({
      spec,
      root,
      floorBox,
      floor: startF,
      targetFloor: startF,
      y,
      targetY: y,
      moving: false,
      dir: 1, // 1 up, -1 down — used when calling without a floor pick
      ridePlayer: false,
      cx,
      cz,
      halfW: w * 0.5,
      halfD: d * 0.5,
    });
  }

  _setCarY(car, y) {
    car.y = y;
    car.root.position.y = y;
    car.floorBox.min.y = y;
    car.floorBox.max.y = y + 0.14;
  }

  /** True if feet are inside cabin XZ and near car floor. */
  playerInCabin(car, px, py, pz) {
    const s = car.spec;
    if (px < s.x0 - 0.15 || px > s.x1 + 0.15) return false;
    if (pz < s.z0 - 0.15 || pz > s.z1 + 0.15) return false;
    // Near the car floor (standing in it or just above)
    return py >= car.y - 0.35 && py <= car.y + 2.6;
  }

  /** Near any elevator (inside cabin or close to call area). */
  findNear(px, py, pz) {
    let best = null;
    let bestD = Infinity;
    for (const car of this.cars) {
      const s = car.spec;
      // Expand slightly for call panels outside the door
      const mx0 = s.x0 - 1.2;
      const mx1 = s.x1 + 1.2;
      const mz0 = s.z0 - 1.2;
      const mz1 = s.z1 + 1.2;
      if (px < mx0 || px > mx1 || pz < mz0 || pz > mz1) continue;
      // Vertical: any floor of this shaft
      const minY = s.baseY - 0.5;
      const maxY = s.baseY + s.floors * s.floorH + 1;
      if (py < minY || py > maxY) continue;
      const dist = Math.hypot(px - car.cx, pz - car.cz);
      if (dist < bestD) {
        bestD = dist;
        best = car;
      }
    }
    this._near = best;
    return best;
  }

  /**
   * Use nearest elevator. If inside cabin: ride to next floor.
   * If outside on a floor: call car to that floor.
   * Returns true if handled.
   */
  tryUse(controller) {
    const px = controller.pos.x;
    const py = controller.pos.y;
    const pz = controller.pos.z;
    const car = this.findNear(px, py, pz);
    if (!car) return false;
    if (car.moving) return true; // absorb E while moving

    const s = car.spec;
    const inCabin = this.playerInCabin(car, px, py, pz);

    if (inCabin) {
      // Ride: go up one floor, or down if at top / holding crouch intent via vel
      let dest = car.floor + car.dir;
      if (dest >= s.floors) {
        car.dir = -1;
        dest = car.floor - 1;
      } else if (dest < 0) {
        car.dir = 1;
        dest = car.floor + 1;
      }
      if (dest === car.floor) return true;
      this._startRide(car, dest, true);
      return true;
    }

    // Call from hallway: snap car to nearest floor under player
    const localY = py - s.baseY;
    let callF = Math.round(localY / s.floorH);
    callF = Math.max(0, Math.min(s.floors - 1, callF));
    if (callF === car.floor && !car.moving) {
      // Already here — if player is close, treat as board+ride up
      if (Math.hypot(px - car.cx, pz - car.cz) < car.halfW + 1.5) {
        this._startRide(car, Math.min(s.floors - 1, car.floor + 1), false);
      }
      return true;
    }
    this._startRide(car, callF, false);
    return true;
  }

  _startRide(car, floor, withPlayer) {
    const s = car.spec;
    floor = Math.max(0, Math.min(s.floors - 1, floor));
    car.targetFloor = floor;
    car.targetY = cabinFloorY(s, floor);
    car.moving = true;
    car.ridePlayer = withPlayer;
    if (floor > car.floor) car.dir = 1;
    else if (floor < car.floor) car.dir = -1;
  }

  /**
   * Animate cars; stick riding player to the cabin floor.
   */
  update(dt, controller) {
    const speed = 4.5; // m/s vertical
    for (const car of this.cars) {
      if (car.moving) {
        const dy = car.targetY - car.y;
        if (Math.abs(dy) < 0.02) {
          this._setCarY(car, car.targetY);
          car.floor = car.targetFloor;
          car.moving = false;
          car.ridePlayer = false;
        } else {
          const step = Math.sign(dy) * speed * dt;
          const next = Math.abs(step) > Math.abs(dy) ? car.targetY : car.y + step;
          this._setCarY(car, next);
        }
      }

      // Carry player if riding or standing in moving cabin
      if (!controller) continue;
      const px = controller.pos.x;
      const py = controller.pos.y;
      const pz = controller.pos.z;
      const inCabin = this.playerInCabin(car, px, py, pz);
      if (inCabin && (car.moving || car.ridePlayer)) {
        car.ridePlayer = true;
        // Stick to car floor
        controller.pos.y = car.y + 0.02;
        controller.vel.y = 0;
        controller.grounded = true;
        controller.coyote = 0.1;
        // Soft center so they don't clip walls mid-ride
        const pull = 2.5 * dt;
        controller.pos.x += (car.cx - controller.pos.x) * pull * 0.15;
        controller.pos.z += (car.cz - controller.pos.z) * pull * 0.15;
      } else if (!car.moving) {
        car.ridePlayer = false;
      }
    }
  }

  prompt(px, py, pz) {
    const car = this.findNear(px, py, pz);
    if (!car) return null;
    if (car.moving) return 'Elevator…';
    if (this.playerInCabin(car, px, py, pz)) {
      const next = car.floor + (car.dir >= 0 ? 1 : -1);
      if (next >= car.spec.floors) return 'E · Elevator down';
      if (next < 0) return 'E · Elevator up';
      return car.dir >= 0 ? 'E · Elevator up' : 'E · Elevator down';
    }
    return 'E · Call elevator';
  }
}
