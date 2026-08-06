import * as THREE from 'three';

// First-person gun meshes — large, bright, class-specific.
// Built for the overlay weapon camera (looks down -Z).

function mat(hex, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness: opts.rough ?? 0.45,
    metalness: opts.metal ?? 0.35,
    emissive: new THREE.Color(hex).multiplyScalar(opts.em ?? 0.12),
    emissiveIntensity: 1,
    flatShading: false,
  });
}

function box(parent, sx, sy, sz, material, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = false;
  m.receiveShadow = false;
  m.frustumCulled = false;
  m.renderOrder = 999;
  parent.add(m);
  return m;
}

function cyl(parent, rT, rB, h, material, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, 12), material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.frustumCulled = false;
  m.renderOrder = 999;
  parent.add(m);
  return m;
}

/**
 * Build a first-person weapon. Units are metres in weapon-camera space.
 * Camera looks down -Z; gun sits lower-right of the frame.
 */
export function buildViewModel(def) {
  const root = new THREE.Group();
  root.name = `vm_${def.id}`;
  root.frustumCulled = false;

  const magGroup = new THREE.Group();
  magGroup.name = 'mag';
  magGroup.frustumCulled = false;
  root.add(magGroup);

  const body = mat(def.color, { rough: 0.55, metal: 0.25, em: 0.15 });
  const dark = mat(0x222428, { rough: 0.5, metal: 0.45, em: 0.08 });
  const steel = mat(0xa8acb4, { rough: 0.3, metal: 0.75, em: 0.1 });
  const wood = mat(0x7a5535, { rough: 0.75, metal: 0.05, em: 0.1 });
  const glow = mat(0x9ae8ff, { rough: 0.35, metal: 0.2, em: 0.55 });
  const black = mat(0x111214, { rough: 0.6, metal: 0.3, em: 0.05 });

  const cls = def.class;
  let muzzlePos = new THREE.Vector3(0.15, -0.08, -0.85);

  // Shared lower-right anchor for all guns
  const ax = 0.16;
  const ay = -0.12;
  const az = -0.35;

  if (cls === 'pistol') {
    box(root, 0.11, 0.26, 0.14, dark, ax, ay - 0.12, az + 0.08); // grip
    box(root, 0.12, 0.12, 0.32, steel, ax, ay + 0.02, az - 0.02); // slide
    cyl(root, 0.022, 0.022, 0.16, steel, ax, ay + 0.03, az - 0.22, Math.PI / 2, 0, 0);
    box(magGroup, 0.08, 0.18, 0.1, body, ax, ay - 0.14, az + 0.06);
    box(root, 0.025, 0.04, 0.025, glow, ax, ay + 0.1, az - 0.14);
    muzzlePos.set(ax, ay + 0.03, az - 0.32);
  } else if (cls === 'shotgun') {
    box(root, 0.12, 0.14, 0.22, wood, ax, ay - 0.04, az + 0.16); // stock
    box(root, 0.13, 0.13, 0.5, dark, ax, ay, az - 0.12);
    cyl(root, 0.032, 0.032, 0.42, steel, ax, ay + 0.02, az - 0.48, Math.PI / 2, 0, 0);
    cyl(root, 0.026, 0.026, 0.38, steel, ax, ay - 0.04, az - 0.44, Math.PI / 2, 0, 0);
    box(magGroup, 0.1, 0.1, 0.14, body, ax, ay - 0.1, az - 0.08); // pump
    box(root, 0.03, 0.045, 0.03, glow, ax, ay + 0.1, az - 0.28);
    muzzlePos.set(ax, ay + 0.02, az - 0.72);
  } else if (cls === 'sniper') {
    box(root, 0.11, 0.12, 0.28, wood, ax, ay - 0.02, az + 0.18);
    box(root, 0.12, 0.12, 0.55, dark, ax, ay, az - 0.12);
    cyl(root, 0.024, 0.024, 0.6, steel, ax, ay + 0.02, az - 0.55, Math.PI / 2, 0, 0);
    cyl(root, 0.04, 0.04, 0.28, steel, ax, ay + 0.1, az - 0.08, Math.PI / 2, 0, 0); // scope
    box(root, 0.045, 0.035, 0.045, glow, ax, ay + 0.14, az + 0.02);
    box(magGroup, 0.08, 0.18, 0.1, body, ax, ay - 0.14, az - 0.05);
    muzzlePos.set(ax, ay + 0.02, az - 0.88);
  } else if (cls === 'smg') {
    box(root, 0.1, 0.2, 0.14, dark, ax, ay - 0.1, az + 0.1); // grip
    box(root, 0.13, 0.13, 0.4, body, ax, ay, az - 0.08);
    cyl(root, 0.022, 0.022, 0.28, steel, ax, ay + 0.02, az - 0.4, Math.PI / 2, 0, 0);
    box(root, 0.14, 0.05, 0.22, dark, ax, ay + 0.08, az - 0.05); // rail
    box(magGroup, 0.08, 0.2, 0.1, body, ax, ay - 0.16, az - 0.02);
    box(root, 0.03, 0.04, 0.03, glow, ax, ay + 0.12, az - 0.22);
    box(root, 0.05, 0.07, 0.14, dark, ax, ay, az + 0.2); // stock stub
    muzzlePos.set(ax, ay + 0.02, az - 0.56);
  } else if (cls === 'lmg') {
    box(root, 0.14, 0.15, 0.6, dark, ax, ay, az - 0.1);
    box(root, 0.11, 0.22, 0.15, dark, ax, ay - 0.12, az + 0.12);
    cyl(root, 0.028, 0.028, 0.48, steel, ax, ay + 0.03, az - 0.52, Math.PI / 2, 0, 0);
    box(root, 0.025, 0.14, 0.025, steel, ax - 0.06, ay - 0.12, az - 0.4);
    box(root, 0.025, 0.14, 0.025, steel, ax + 0.06, ay - 0.12, az - 0.4);
    box(magGroup, 0.14, 0.22, 0.16, body, ax, ay - 0.16, az - 0.05);
    box(root, 0.16, 0.06, 0.28, dark, ax, ay + 0.1, az - 0.05);
    box(root, 0.035, 0.04, 0.035, glow, ax, ay + 0.14, az - 0.22);
    muzzlePos.set(ax, ay + 0.03, az - 0.78);
  } else {
    // AR / DMR — most detailed default
    // Stock
    box(root, 0.1, 0.12, 0.22, dark, ax, ay - 0.02, az + 0.2);
    // Receiver
    box(root, 0.14, 0.14, 0.42, body, ax, ay, az - 0.05);
    // Handguard
    box(root, 0.13, 0.12, 0.32, dark, ax, ay + 0.01, az - 0.35);
    // Barrel
    cyl(root, 0.02, 0.02, 0.32, steel, ax, ay + 0.03, az - 0.62, Math.PI / 2, 0, 0);
    // Muzzle device
    box(root, 0.045, 0.045, 0.07, steel, ax, ay + 0.03, az - 0.8);
    // Top rail + optic
    box(root, 0.07, 0.045, 0.28, black, ax, ay + 0.1, az - 0.08);
    box(root, 0.05, 0.06, 0.12, dark, ax, ay + 0.15, az - 0.02);
    box(root, 0.035, 0.04, 0.04, glow, ax, ay + 0.19, az + 0.02); // red-dot glow
    // Pistol grip
    box(root, 0.09, 0.2, 0.11, dark, ax, ay - 0.14, az + 0.05, 0.25, 0, 0);
    // Mag well + mag
    box(root, 0.1, 0.05, 0.12, steel, ax, ay - 0.08, az - 0.05);
    box(magGroup, 0.09, 0.24, 0.11, body, ax, ay - 0.2, az - 0.05);
    // Front sight
    box(root, 0.025, 0.04, 0.025, glow, ax, ay + 0.1, az - 0.48);
    muzzlePos.set(ax, ay + 0.03, az - 0.85);
  }

  // Hands (simple) so the gun feels held
  const skin = mat(0xc4a07a, { rough: 0.85, metal: 0.05, em: 0.12 });
  box(root, 0.08, 0.08, 0.16, skin, ax - 0.02, ay - 0.18, az + 0.08); // trigger hand
  if (cls !== 'pistol') {
    box(root, 0.08, 0.08, 0.14, skin, ax + 0.02, ay - 0.1, az - 0.28); // support hand
  }

  const muzzle = new THREE.Object3D();
  muzzle.position.copy(muzzlePos);
  root.add(muzzle);

  // Sit big in the lower-right of the FOV
  root.scale.setScalar(1.0);
  root.position.set(0, 0, 0);
  root.rotation.set(0.06, 0.18, 0.04);

  root.traverse((o) => {
    if (o.isMesh) {
      o.frustumCulled = false;
      o.renderOrder = 999;
    }
  });

  return { root, mag: magGroup, muzzle };
}
