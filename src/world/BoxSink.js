import * as THREE from 'three';

// Collects axis-aligned boxes from the building kit, then emits one
// InstancedMesh per colour. Keeps the whole world's static geometry to a
// handful of draw calls, and every box doubles as a collision AABB for free.
export class BoxSink {
  constructor() {
    this.byColor = new Map();
    this.total = 0;
  }

  // cx/cy/cz is the box CENTRE; sx/sy/sz are full extents.
  add(cx, cy, cz, sx, sy, sz, color, tag = 'solid') {
    if (sx <= 0 || sy <= 0 || sz <= 0) return;
    let list = this.byColor.get(color);
    if (!list) {
      list = [];
      this.byColor.set(color, list);
    }
    list.push({ cx, cy, cz, sx, sy, sz, tag });
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

    for (const [color, list] of this.byColor) {
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.9,
        metalness: 0.0,
      });
      const inst = new THREE.InstancedMesh(unit, mat, list.length);
      inst.castShadow = castShadow;
      inst.receiveShadow = receiveShadow;

      for (let i = 0; i < list.length; i++) {
        const b = list[i];
        pos.set(b.cx, b.cy, b.cz);
        scl.set(b.sx, b.sy, b.sz);
        m.compose(pos, q, scl);
        inst.setMatrixAt(i, m);
      }
      inst.instanceMatrix.needsUpdate = true;
      inst.frustumCulled = false; // one instanced mesh spans the whole map
      inst.computeBoundingSphere();
      meshes.push(inst);
    }
    return meshes;
  }

  registerCollision(hash) {
    for (const [, list] of this.byColor) {
      for (const b of list) {
        hash.add(
          new THREE.Vector3(b.cx - b.sx / 2, b.cy - b.sy / 2, b.cz - b.sz / 2),
          new THREE.Vector3(b.cx + b.sx / 2, b.cy + b.sy / 2, b.cz + b.sz / 2),
          b.tag
        );
      }
    }
  }
}
