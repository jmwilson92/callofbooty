import * as THREE from 'three';

// Collects axis-aligned boxes from the building kit, then emits one
// InstancedMesh per colour (+ glass tag). Keeps static geometry to a
// handful of draw calls; every box doubles as a collision AABB.
// Explicit tag 'glass' → transparent material + breakable collision.

export class BoxSink {
  constructor() {
    /** @type {Map<string, object[]>} */
    this.byKey = new Map();
    this.total = 0;
  }

  // cx/cy/cz is the box CENTRE; sx/sy/sz are full extents.
  add(cx, cy, cz, sx, sy, sz, color, tag = 'solid') {
    if (sx <= 0 || sy <= 0 || sz <= 0) return;
    const col = color & 0xffffff;
    const t = tag === 'glass' ? 'glass' : tag;
    // Separate glass from solid even when they share a palette colour
    // (facades may use glass-blue as opaque cladding).
    const key = t === 'glass' ? `glass:${col}` : `solid:${col}:${t}`;
    let list = this.byKey.get(key);
    if (!list) {
      list = [];
      this.byKey.set(key, list);
    }
    list.push({ cx, cy, cz, sx, sy, sz, tag: t, color: col });
    this.total++;
  }

  // Convenience: add by min/max corners.
  addSpan(x0, y0, z0, x1, y1, z1, color, tag = 'solid') {
    this.add(
      (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2,
      Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0),
      color, tag
    );
  }

  buildMeshes(castShadow = true, receiveShadow = true) {
    const meshes = [];
    const unit = new THREE.BoxGeometry(1, 1, 1);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const scl = new THREE.Vector3();

    for (const [key, list] of this.byKey) {
      const isGlass = key.startsWith('glass:');
      const color = list[0].color;
      const mat = isGlass
        ? new THREE.MeshStandardMaterial({
          color,
          roughness: 0.08,
          metalness: 0.4,
          transparent: true,
          opacity: 0.28,
          depthWrite: false,
          side: THREE.DoubleSide,
        })
        : new THREE.MeshStandardMaterial({
          color,
          roughness: 0.9,
          metalness: 0.0,
        });

      const inst = new THREE.InstancedMesh(unit, mat, list.length);
      inst.castShadow = !isGlass && castShadow;
      inst.receiveShadow = receiveShadow;
      if (isGlass) {
        inst.renderOrder = 2;
        inst.name = 'glass';
      }

      for (let i = 0; i < list.length; i++) {
        const b = list[i];
        pos.set(b.cx, b.cy, b.cz);
        scl.set(b.sx, b.sy, b.sz);
        m.compose(pos, q, scl);
        inst.setMatrixAt(i, m);
        b.mesh = inst;
        b.instanceId = i;
      }
      inst.instanceMatrix.needsUpdate = true;
      inst.frustumCulled = false;
      inst.computeBoundingSphere();
      meshes.push(inst);
    }
    return meshes;
  }

  registerCollision(hash) {
    for (const [, list] of this.byKey) {
      for (const b of list) {
        const box = hash.add(
          new THREE.Vector3(b.cx - b.sx / 2, b.cy - b.sy / 2, b.cz - b.sz / 2),
          new THREE.Vector3(b.cx + b.sx / 2, b.cy + b.sy / 2, b.cz + b.sz / 2),
          b.tag
        );
        if (b.tag === 'glass') {
          box.userData = {
            mesh: b.mesh ?? null,
            instanceId: b.instanceId ?? null,
          };
        }
      }
    }
  }
}
