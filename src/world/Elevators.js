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
   *   doorFace?: 'N'|'S'|'E'|'W',
   * }} spec  cabin interior AABB in XZ; floors from baseY
   */
  register(spec) {
    this.specs.push(spec);
  },
};

function cabinFloorY(spec, floor) {
  // Align with building floor slab tops (Catalog slabs use baseY + f*floorH + deck)
  const deck = spec.deck ?? 0.16;
  return spec.baseY + floor * spec.floorH + deck;
}

/**
 * Builds elevator cars, moves them between floors, carries the player.
 * Car is open on the door face so you can walk out onto each floor.
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
    const face = spec.doorFace || 'S';

    const root = new THREE.Group();
    root.position.set(cx, y, cz);

    const floorMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, roughness: 0.7, metalness: 0.2 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a6a8a, roughness: 0.55, metalness: 0.25 });
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x2a3540, roughness: 0.8 });

    // Floor plate only — no sealed cabin collision (meshes are visual)
    const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.1, d * 0.96), floorMat);
    floorMesh.position.y = 0.05;
    floorMesh.receiveShadow = true;
    root.add(floorMesh);

    // Three low rails; door face fully open so player walks onto the landing
    // Keep walls short so they never read as a low ceiling / crouch trap
    const wallH = Math.min(1.35, spec.floorH * 0.35);
    const t = 0.04;
    const hw = w * 0.46;
    const hd = d * 0.46;
    const mkWall = (sx, sy, sz, px, py, pz) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), wallMat);
      m.position.set(px, py, pz);
      m.castShadow = true;
      root.add(m);
    };
    if (face !== 'S') mkWall(w * 0.88, wallH, t, 0, wallH * 0.5 + 0.08, -hd);
    if (face !== 'N') mkWall(w * 0.88, wallH, t, 0, wallH * 0.5 + 0.08, hd);
    if (face !== 'W') mkWall(t, wallH, d * 0.82, -hw, wallH * 0.5 + 0.08, 0);
    if (face !== 'E') mkWall(t, wallH, d * 0.82, hw, wallH * 0.5 + 0.08, 0);

    // Small overhead lamp only — no full ceiling mesh that looks like a crouch cage
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.05, 0.28),
      new THREE.MeshStandardMaterial({ color: 0xb0ff20, emissive: 0x406010, emissiveIntensity: 0.7 })
    );
    lamp.position.y = Math.min(2.4, spec.floorH - 0.9);
    root.add(lamp);
    // Tiny visual ceil plate (no collision — not in hash)
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(w * 0.45, 0.04, d * 0.45), ceilMat);
    ceil.position.y = lamp.position.y + 0.06;
    root.add(ceil);

    // Floor readout panel (canvas texture) — always visible in cabin
    const floorPanel = this._makeFloorPanel(w, d, face);
    root.add(floorPanel.mesh);
    this.group.add(root);

    // Walkable floor collision (moves with car) — thin so it never forms a wall pocket
    const pad = 0.02;
    const floorBox = this.hash.add(
      new THREE.Vector3(spec.x0 + pad, y - 0.02, spec.z0 + pad),
      new THREE.Vector3(spec.x1 - pad, y + 0.08, spec.z1 - pad),
      'elevator'
    );

    // Exit direction unit (into the hallway)
    let exitX = 0;
    let exitZ = 0;
    if (face === 'S') exitZ = -1;
    else if (face === 'N') exitZ = 1;
    else if (face === 'W') exitX = -1;
    else exitX = 1;

    const car = {
      spec,
      root,
      floorBox,
      floor: startF,
      targetFloor: startF,
      y,
      targetY: y,
      moving: false,
      dir: 1,
      ridePlayer: false,
      justArrived: false,
      arriveT: 0,
      cx,
      cz,
      halfW: w * 0.5,
      halfD: d * 0.5,
      doorFace: face,
      exitX,
      exitZ,
      floorPanel,
    };
    this._paintFloorPanel(car);
    this.cars.push(car);
  }

  /** Canvas panel on the wall opposite the door showing floor / TOP. */
  _makeFloorPanel(w, d, face) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), mat);
    // Mount on the wall opposite the open door, facing into the cabin
    const inset = 0.02;
    if (face === 'S') {
      mesh.position.set(0, 1.55, d * 0.42 - inset);
    } else if (face === 'N') {
      mesh.position.set(0, 1.55, -d * 0.42 + inset);
      mesh.rotation.y = Math.PI;
    } else if (face === 'W') {
      mesh.position.set(w * 0.42 - inset, 1.55, 0);
      mesh.rotation.y = -Math.PI / 2;
    } else {
      mesh.position.set(-w * 0.42 + inset, 1.55, 0);
      mesh.rotation.y = Math.PI / 2;
    }
    return { mesh, canvas, tex, mat };
  }

  _paintFloorPanel(car) {
    const fp = car.floorPanel;
    if (!fp) return;
    const ctx = fp.canvas.getContext('2d');
    const n = car.floor + 1;
    const max = car.spec.floors;
    const isTop = car.floor >= car.spec.floors - 1;
    const isG = car.floor <= 0;
    // Background
    ctx.fillStyle = isTop ? '#1a4020' : isG ? '#1a3040' : '#121820';
    ctx.fillRect(0, 0, 256, 128);
    ctx.strokeStyle = isTop ? '#60ff90' : '#40c0ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 248, 120);
    ctx.fillStyle = isTop ? '#80ffb0' : '#e8f4ff';
    ctx.font = 'bold 52px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${n} / ${max}`, 128, isTop || isG ? 48 : 64);
    ctx.font = 'bold 28px ui-monospace, Menlo, monospace';
    if (isTop) {
      ctx.fillStyle = '#a0ffc0';
      ctx.fillText('TOP FLOOR', 128, 96);
    } else if (isG) {
      ctx.fillStyle = '#80d0ff';
      ctx.fillText('GROUND', 128, 96);
    }
    fp.tex.needsUpdate = true;
  }

  _setCarY(car, y) {
    car.y = y;
    car.root.position.y = y;
    car.floorBox.min.y = y - 0.02;
    car.floorBox.max.y = y + 0.08;
  }

  playerInCabin(car, px, py, pz) {
    const s = car.spec;
    // Slightly loose so "still in cabin" covers the threshold while exiting
    if (px < s.x0 - 0.05 || px > s.x1 + 0.05) return false;
    if (pz < s.z0 - 0.05 || pz > s.z1 + 0.05) return false;
    return py >= car.y - 0.5 && py <= car.y + 2.6;
  }

  findNear(px, py, pz) {
    let best = null;
    let bestD = Infinity;
    for (const car of this.cars) {
      const s = car.spec;
      const mx0 = s.x0 - 1.4;
      const mx1 = s.x1 + 1.4;
      const mz0 = s.z0 - 1.4;
      const mz1 = s.z1 + 1.4;
      if (px < mx0 || px > mx1 || pz < mz0 || pz > mz1) continue;
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

  tryUse(controller) {
    const px = controller.pos.x;
    const py = controller.pos.y;
    const pz = controller.pos.z;
    const car = this.findNear(px, py, pz);
    if (!car) return false;
    if (car.moving) return true;

    const s = car.spec;
    const inCabin = this.playerInCabin(car, px, py, pz);

    if (inCabin) {
      let dest = car.floor + car.dir;
      if (dest >= s.floors) {
        car.dir = -1;
        dest = car.floor - 1;
      } else if (dest < 0) {
        car.dir = 1;
        dest = car.floor + 1;
      }
      if (dest === car.floor || dest < 0 || dest >= s.floors) return true;
      this._startRide(car, dest, true);
      return true;
    }

    // Call from hallway
    const localY = py - s.baseY;
    let callF = Math.round(localY / s.floorH);
    callF = Math.max(0, Math.min(s.floors - 1, callF));
    if (callF !== car.floor) {
      this._startRide(car, callF, false);
    }
    return true;
  }

  _startRide(car, floor, withPlayer) {
    const s = car.spec;
    floor = Math.max(0, Math.min(s.floors - 1, floor));
    if (floor === car.floor && !car.moving) return;
    car.targetFloor = floor;
    car.targetY = cabinFloorY(s, floor);
    car.moving = true;
    car.ridePlayer = withPlayer;
    car.justArrived = false;
    if (floor > car.floor) car.dir = 1;
    else if (floor < car.floor) car.dir = -1;
  }

  update(dt, controller) {
    const speed = 4.2;
    for (const car of this.cars) {
      if (car.moving) {
        const dy = car.targetY - car.y;
        if (Math.abs(dy) < 0.025) {
          this._setCarY(car, car.targetY);
          car.floor = car.targetFloor;
          car.moving = false;
          car.justArrived = false;
          car.ridePlayer = false;
          this._paintFloorPanel(car);
          // Only settle feet Y — never push XZ (that felt like a drag each floor)
          if (controller && this.playerInCabin(car, controller.pos.x, controller.pos.y, controller.pos.z)) {
            controller.pos.y = car.y + 0.04;
            controller.vel.y = 0;
            controller.grounded = true;
          }
        } else {
          const step = Math.sign(dy) * speed * dt;
          const next = Math.abs(step) > Math.abs(dy) ? car.targetY : car.y + step;
          this._setCarY(car, next);
        }
      }

      if (!controller) continue;
      const px = controller.pos.x;
      const py = controller.pos.y;
      const pz = controller.pos.z;
      const inCabin = this.playerInCabin(car, px, py, pz);

      // Stick Y only while moving — keep XZ free for the player
      if (inCabin && car.moving) {
        car.ridePlayer = true;
        controller.pos.y = car.y + 0.04;
        controller.vel.y = 0;
        controller.grounded = true;
        controller.coyote = 0.12;
      }
    }
  }

  prompt(px, py, pz) {
    const car = this.findNear(px, py, pz);
    if (!car) return null;
    const n = car.floor + 1;
    const max = car.spec.floors;
    const isTop = car.floor >= car.spec.floors - 1;
    const isG = car.floor <= 0;
    if (car.moving) {
      const dest = car.targetFloor + 1;
      return `Elevator · → ${dest}/${max}${car.targetFloor >= car.spec.floors - 1 ? ' TOP' : ''}…`;
    }
    if (this.playerInCabin(car, px, py, pz)) {
      if (isTop) return `E · TOP FLOOR ${n}/${max} · Down only`;
      if (isG) return `E · Floor ${n}/${max} GROUND · Up`;
      const next = car.dir >= 0 ? 'Up' : 'Down';
      return `E · Floor ${n}/${max} · ${next}`;
    }
    // Hallway call — show which floor you're on
    const s = car.spec;
    let callF = Math.round((py - s.baseY) / s.floorH);
    callF = Math.max(0, Math.min(s.floors - 1, callF));
    const here = callF + 1;
    const carAt = car.floor + 1;
    if (callF === car.floor) {
      if (isTop) return `E · Elevator here · TOP ${n}/${max}`;
      return `E · Elevator here · Floor ${n}/${max}`;
    }
    return `E · Call elevator · you ${here} · car ${carAt}${car.floor >= s.floors - 1 ? ' TOP' : ''}`;
  }
}
