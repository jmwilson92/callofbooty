import * as THREE from 'three';

// Interactive hinged doors. Specs are registered during world gen; meshes +
// collision are built once the spatial hash exists.

const DOOR_COLOR = 0x1e2830;
const GLASS_COLOR = 0x6ab0d0;
const FRAME_COLOR = 0x3a3834;
const HANDLE_COLOR = 0xa8a6a0;

/** Registry filled while buildings are placed. */
export const worldDoors = {
  specs: [],
  clear() {
    this.specs.length = 0;
  },
  /**
   * @param {{
   *   x: number, y: number, z: number,
   *   width: number, height: number,
   *   face?: 'S'|'N'|'E'|'W',
   *   thickness?: number,
   * }} spec  x,y,z = door center at floor / facade plane
   */
  register(spec) {
    this.specs.push(spec);
  },
};

function makeLeafMesh(halfW, height, thickness) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(halfW * 0.96, height - 0.08, thickness),
    new THREE.MeshStandardMaterial({ color: DOOR_COLOR, roughness: 0.85, metalness: 0.05 })
  );
  body.position.set(halfW * 0.5, height * 0.5, 0);
  body.castShadow = true;
  group.add(body);

  // Window pane
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(halfW * 0.55, height * 0.35, thickness * 0.4),
    new THREE.MeshStandardMaterial({
      color: GLASS_COLOR, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.65,
    })
  );
  glass.position.set(halfW * 0.5, height * 0.58, thickness * 0.2);
  group.add(glass);

  // Handle
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.22, 0.08),
    new THREE.MeshStandardMaterial({ color: HANDLE_COLOR, roughness: 0.4, metalness: 0.6 })
  );
  handle.position.set(halfW * 0.85, height * 0.45, thickness * 0.55);
  group.add(handle);

  return group;
}

/**
 * Builds and animates all registered doors.
 */
export class DoorSystem {
  constructor(hash) {
    this.hash = hash;
    this.doors = [];
    this.group = new THREE.Group();
    this.group.name = 'doors';
    this._near = null;
  }

  clear() {
    this.doors.length = 0;
    while (this.group.children.length) this.group.remove(this.group.children[0]);
  }

  /** Build meshes + collision from worldDoors registry. */
  buildFromRegistry() {
    this.clear();
    for (const spec of worldDoors.specs) {
      this._addDoor(spec);
    }
    return this.doors.length;
  }

  _addDoor(spec) {
    const width = spec.width;
    const height = spec.height;
    const thickness = spec.thickness ?? 0.12;
    const half = width * 0.5;
    const face = spec.face || 'S';

    // Root at door center, feet on y, facing outward
    const root = new THREE.Group();
    root.position.set(spec.x, spec.y, spec.z);
    // Rotate so local +Z is outward from building
    if (face === 'S') root.rotation.y = 0;
    else if (face === 'N') root.rotation.y = Math.PI;
    else if (face === 'E') root.rotation.y = -Math.PI / 2;
    else if (face === 'W') root.rotation.y = Math.PI / 2;

    // Left leaf — hinge on left edge, swings open outward (−Y rot in local)
    const leftPivot = new THREE.Group();
    leftPivot.position.set(-half, 0, 0);
    const leftLeaf = makeLeafMesh(half, height, thickness);
    leftPivot.add(leftLeaf);

    // Right leaf — hinge on right edge
    const rightPivot = new THREE.Group();
    rightPivot.position.set(half, 0, 0);
    const rightLeaf = makeLeafMesh(half, height, thickness);
    // Mirror right leaf so handle is on the meeting edge
    rightLeaf.scale.x = -1;
    rightPivot.add(rightLeaf);

    root.add(leftPivot);
    root.add(rightPivot);
    this.group.add(root);

    // Closed-state collision (two leaves as AABBs in world space)
    // Leaves sit on the facade plane, thin in depth
    const coll = this._closedCollision(spec, width, height, thickness, face);

    const door = {
      spec,
      root,
      leftPivot,
      rightPivot,
      leftBox: coll.left,
      rightBox: coll.right,
      open: false,
      openAmount: 0,
      targetOpen: 0,
      // Interaction sphere
      cx: spec.x,
      cy: spec.y + height * 0.5,
      cz: spec.z,
      reach: Math.max(2.4, width * 0.75 + 1.2),
    };
    this.doors.push(door);
    return door;
  }

  _closedCollision(spec, width, height, thickness, face) {
    const half = width * 0.5;
    const y0 = spec.y;
    const y1 = spec.y + height;
    const t = Math.max(0.14, thickness + 0.06);
    // Leaf depth centered slightly outside facade
    let leftMin, leftMax, rightMin, rightMax;
    if (face === 'S' || face === 'N') {
      const z0 = spec.z - t * 0.5;
      const z1 = spec.z + t * 0.5;
      leftMin = new THREE.Vector3(spec.x - half, y0, z0);
      leftMax = new THREE.Vector3(spec.x, y1, z1);
      rightMin = new THREE.Vector3(spec.x, y0, z0);
      rightMax = new THREE.Vector3(spec.x + half, y1, z1);
    } else {
      const x0 = spec.x - t * 0.5;
      const x1 = spec.x + t * 0.5;
      leftMin = new THREE.Vector3(x0, y0, spec.z - half);
      leftMax = new THREE.Vector3(x1, y1, spec.z);
      rightMin = new THREE.Vector3(x0, y0, spec.z);
      rightMax = new THREE.Vector3(x1, y1, spec.z + half);
    }
    return {
      left: this.hash.add(leftMin, leftMax, 'door'),
      right: this.hash.add(rightMin, rightMax, 'door'),
    };
  }

  findNearest(px, py, pz) {
    let best = null;
    let bestD = Infinity;
    for (const d of this.doors) {
      const dx = px - d.cx;
      const dy = py - d.cy;
      const dz = pz - d.cz;
      const dist = Math.hypot(dx, dy * 0.5, dz);
      if (dist < d.reach && dist < bestD) {
        bestD = dist;
        best = d;
      }
    }
    this._near = best;
    return best;
  }

  /** Toggle nearest door. Returns true if something toggled. */
  tryToggle(px, py, pz) {
    const d = this.findNearest(px, py, pz);
    if (!d) return false;
    d.open = !d.open;
    d.targetOpen = d.open ? 1 : 0;
    return true;
  }

  /**
   * Animate hinges and enable/disable collision.
   * Collision clears once door is halfway open so you can walk through.
   */
  update(dt) {
    const speed = 3.2; // ~0.3s full swing
    for (const d of this.doors) {
      const diff = d.targetOpen - d.openAmount;
      if (Math.abs(diff) < 1e-4) {
        d.openAmount = d.targetOpen;
      } else {
        const step = Math.sign(diff) * speed * dt;
        if (Math.abs(step) > Math.abs(diff)) d.openAmount = d.targetOpen;
        else d.openAmount += step;
      }
      const a = d.openAmount;
      // Outward swing: left −90°, right +90° in local Y
      d.leftPivot.rotation.y = -a * (Math.PI * 0.5);
      d.rightPivot.rotation.y = a * (Math.PI * 0.5);

      const blocking = a < 0.5;
      d.leftBox.disabled = !blocking;
      d.rightBox.disabled = !blocking;
    }
  }

  /** Prompt text when near a door, or null. */
  prompt(px, py, pz) {
    const d = this.findNearest(px, py, pz);
    if (!d) return null;
    return d.open || d.openAmount > 0.5 ? 'E · Close door' : 'E · Open door';
  }
}
