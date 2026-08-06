import * as THREE from 'three';

/**
 * Classic FPS viewmodels (camera looks −Z).
 *
 * Layout convention:
 *   - Sight / optic reticle sits near local (0, 0.02, −0.05) so ADS can
 *     put that point on screen center.
 *   - Receiver + grip hang below the sight line (−Y).
 *   - Barrel extends forward (−Z).
 *   - Hip pose (WeaponSystem) parks the whole group lower-right, still
 *     fully in front of the camera (negative world Z).
 */

function mat(hex, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness: opts.rough ?? 0.42,
    metalness: opts.metal ?? 0.45,
    emissive: new THREE.Color(hex).multiplyScalar(opts.em ?? 0.1),
    emissiveIntensity: 1,
    transparent: !!opts.alpha,
    opacity: opts.alpha ?? 1,
    depthWrite: opts.alpha ? false : true,
  });
}

function box(parent, sx, sy, sz, material, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.frustumCulled = false;
  m.renderOrder = 999;
  parent.add(m);
  return m;
}

function cyl(parent, rT, rB, h, material, x, y, z, rx = 0, ry = 0, rz = 0, segs = 12) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, segs), material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.frustumCulled = false;
  m.renderOrder = 999;
  parent.add(m);
  return m;
}

/** Front post + rear U-notch on the sight line (kept small so aim stays clear). */
function ironSights(root, glow, black, frontZ, rearZ, y = 0.02) {
  box(root, 0.0035, 0.011, 0.0035, glow, 0, y + 0.0055, frontZ);
  box(root, 0.0045, 0.008, 0.0035, black, -0.007, y + 0.004, rearZ);
  box(root, 0.0045, 0.008, 0.0035, black, 0.007, y + 0.004, rearZ);
  box(root, 0.018, 0.0025, 0.0035, black, 0, y, rearZ);
}

/** Red-dot: solid housing under a open glass window + center reticle. */
function redDot(root, dark, glass, glow, z = -0.04, y = 0.03) {
  box(root, 0.04, 0.018, 0.055, dark, 0, y - 0.01, z); // base
  // Window frame
  box(root, 0.038, 0.004, 0.004, dark, 0, y + 0.016, z + 0.014);
  box(root, 0.004, 0.032, 0.004, dark, -0.017, y + 0.0, z + 0.014);
  box(root, 0.004, 0.032, 0.004, dark, 0.017, y + 0.0, z + 0.014);
  box(root, 0.038, 0.004, 0.004, dark, 0, y - 0.016, z + 0.014);
  box(root, 0.03, 0.03, 0.006, glass, 0, y, z + 0.012);
  box(root, 0.007, 0.007, 0.004, glow, 0, y, z + 0.01); // reticle
}

/** Sniper scope tube on the sight axis. */
function scope(root, black, glass, glow, steel, zCenter = -0.06) {
  cyl(root, 0.02, 0.02, 0.2, black, 0, 0.03, zCenter, Math.PI / 2, 0, 0, 14);
  cyl(root, 0.022, 0.016, 0.035, black, 0, 0.03, zCenter + 0.11, Math.PI / 2, 0, 0, 12);
  box(root, 0.028, 0.028, 0.008, glass, 0, 0.03, zCenter + 0.128);
  cyl(root, 0.016, 0.024, 0.04, black, 0, 0.03, zCenter - 0.11, Math.PI / 2, 0, 0, 12);
  box(root, 0.034, 0.034, 0.006, glass, 0, 0.03, zCenter - 0.132);
  box(root, 0.006, 0.006, 0.006, glow, 0, 0.03, zCenter);
  box(root, 0.022, 0.016, 0.022, steel, 0, 0.01, zCenter + 0.05);
  box(root, 0.022, 0.016, 0.022, steel, 0, 0.01, zCenter - 0.05);
}

export function buildViewModel(def) {
  const root = new THREE.Group();
  root.name = `vm_${def.id}`;
  root.frustumCulled = false;

  const magGroup = new THREE.Group();
  magGroup.name = 'mag';
  magGroup.frustumCulled = false;
  root.add(magGroup);

  const body = mat(def.color, { rough: 0.48, metal: 0.3, em: 0.12 });
  const dark = mat(0x1c1e24, { rough: 0.5, metal: 0.55, em: 0.07 });
  const steel = mat(0xb0b6c0, { rough: 0.25, metal: 0.82, em: 0.08 });
  const wood = mat(0x6e4c30, { rough: 0.72, metal: 0.04, em: 0.08 });
  const black = mat(0x0e1014, { rough: 0.55, metal: 0.4, em: 0.05 });
  const glow = mat(0xff3030, { rough: 0.25, metal: 0.1, em: 0.9 });
  const glass = mat(0x4a80a0, { rough: 0.12, metal: 0.15, em: 0.22, alpha: 0.4 });
  const skin = mat(0xc4a07a, { rough: 0.85, metal: 0.03, em: 0.1 });

  const cls = def.class;
  let muzzlePos = new THREE.Vector3(0, -0.02, -0.55);

  // ── Readable proportions; body under sights, barrel −Z ──
  if (cls === 'pistol') {
    box(root, 0.055, 0.05, 0.2, steel, 0, -0.02, -0.1); // slide
    box(root, 0.05, 0.035, 0.15, dark, 0, -0.05, -0.06); // frame
    box(root, 0.048, 0.12, 0.06, dark, 0, -0.12, 0.0, 0.2, 0, 0); // grip
    cyl(root, 0.012, 0.012, 0.08, steel, 0, -0.015, -0.24, Math.PI / 2, 0, 0);
    box(magGroup, 0.04, 0.1, 0.05, body, 0, -0.14, 0.0);
    box(root, 0.012, 0.035, 0.045, dark, 0, -0.08, -0.04); // trigger guard
    ironSights(root, glow, black, -0.18, -0.02, 0.01);
    box(root, 0.05, 0.05, 0.08, skin, 0.01, -0.14, 0.02);
    muzzlePos.set(0, -0.015, -0.28);
  } else if (cls === 'shotgun') {
    box(root, 0.05, 0.055, 0.14, wood, 0, -0.04, 0.1);
    box(root, 0.06, 0.055, 0.28, dark, 0, -0.03, -0.1);
    box(root, 0.055, 0.05, 0.16, wood, 0, -0.035, -0.28);
    cyl(root, 0.016, 0.016, 0.32, steel, 0, -0.015, -0.42, Math.PI / 2, 0, 0);
    cyl(root, 0.014, 0.014, 0.28, steel, 0, -0.04, -0.38, Math.PI / 2, 0, 0);
    box(magGroup, 0.05, 0.05, 0.1, body, 0, -0.07, -0.2);
    box(root, 0.008, 0.018, 0.008, glow, 0, 0.02, -0.3); // bead
    box(root, 0.05, 0.11, 0.055, dark, 0, -0.11, 0.02, 0.22, 0, 0);
    box(root, 0.05, 0.05, 0.08, skin, 0.0, -0.13, 0.04);
    box(root, 0.05, 0.05, 0.07, skin, 0.0, -0.07, -0.24);
    muzzlePos.set(0, -0.015, -0.58);
  } else if (cls === 'sniper') {
    box(root, 0.05, 0.05, 0.16, wood, 0, -0.045, 0.12);
    box(root, 0.055, 0.05, 0.3, dark, 0, -0.035, -0.08);
    box(root, 0.05, 0.045, 0.2, dark, 0, -0.035, -0.3);
    cyl(root, 0.012, 0.012, 0.4, steel, 0, -0.02, -0.52, Math.PI / 2, 0, 0);
    box(root, 0.02, 0.02, 0.035, steel, 0, -0.02, -0.72);
    box(root, 0.028, 0.012, 0.2, black, 0, -0.005, -0.08);
    scope(root, black, glass, glow, steel, -0.06);
    box(magGroup, 0.04, 0.1, 0.05, body, 0, -0.12, -0.04);
    box(root, 0.048, 0.11, 0.05, dark, 0, -0.12, 0.04, 0.2, 0, 0);
    box(root, 0.048, 0.048, 0.07, skin, 0.0, -0.14, 0.05);
    box(root, 0.048, 0.048, 0.065, skin, 0.0, -0.07, -0.24);
    muzzlePos.set(0, -0.02, -0.75);
  } else if (cls === 'smg') {
    box(root, 0.055, 0.05, 0.22, body, 0, -0.035, -0.08);
    box(root, 0.05, 0.03, 0.18, dark, 0, -0.01, -0.1);
    cyl(root, 0.012, 0.012, 0.16, steel, 0, -0.02, -0.3, Math.PI / 2, 0, 0);
    box(root, 0.04, 0.04, 0.1, dark, 0, -0.02, -0.22);
    box(root, 0.048, 0.11, 0.055, dark, 0, -0.12, 0.02, 0.22, 0, 0);
    box(magGroup, 0.04, 0.12, 0.05, body, 0, -0.14, -0.05);
    box(root, 0.04, 0.04, 0.1, dark, 0, -0.04, 0.12);
    box(root, 0.025, 0.01, 0.14, black, 0, 0.01, -0.08);
    ironSights(root, glow, black, -0.18, 0.0, 0.02);
    box(root, 0.048, 0.048, 0.07, skin, 0.0, -0.14, 0.04);
    box(root, 0.048, 0.048, 0.065, skin, 0.0, -0.07, -0.18);
    muzzlePos.set(0, -0.02, -0.38);
  } else if (cls === 'lmg') {
    box(root, 0.065, 0.055, 0.34, dark, 0, -0.04, -0.1);
    cyl(root, 0.014, 0.014, 0.34, steel, 0, -0.02, -0.42, Math.PI / 2, 0, 0);
    box(root, 0.01, 0.08, 0.01, steel, -0.035, -0.1, -0.34);
    box(root, 0.01, 0.08, 0.01, steel, 0.035, -0.1, -0.34);
    box(magGroup, 0.07, 0.13, 0.08, body, 0, -0.14, -0.05);
    box(root, 0.05, 0.11, 0.055, dark, 0, -0.13, 0.06, 0.2, 0, 0);
    box(root, 0.05, 0.05, 0.14, dark, 0, -0.04, 0.14);
    box(root, 0.03, 0.012, 0.18, black, 0, 0.0, -0.06);
    ironSights(root, glow, black, -0.22, 0.02, 0.015);
    box(root, 0.05, 0.05, 0.07, skin, 0.0, -0.15, 0.07);
    box(root, 0.05, 0.05, 0.065, skin, 0.0, -0.08, -0.2);
    muzzlePos.set(0, -0.02, -0.6);
  } else {
    // AR / DMR
    box(root, 0.045, 0.05, 0.14, dark, 0, -0.04, 0.14); // stock
    cyl(root, 0.015, 0.015, 0.1, black, 0, -0.035, 0.04, Math.PI / 2, 0, 0);
    box(root, 0.055, 0.05, 0.16, body, 0, -0.05, -0.02); // lower
    box(root, 0.05, 0.042, 0.18, dark, 0, -0.02, -0.05); // upper
    box(root, 0.048, 0.042, 0.2, dark, 0, -0.025, -0.24); // handguard
    cyl(root, 0.01, 0.01, 0.2, steel, 0, -0.015, -0.42, Math.PI / 2, 0, 0);
    box(root, 0.018, 0.018, 0.025, steel, 0, -0.015, -0.32);
    box(root, 0.022, 0.022, 0.035, steel, 0, -0.015, -0.54); // muzzle
    box(root, 0.028, 0.012, 0.22, black, 0, 0.01, -0.1); // rail
    redDot(root, dark, glass, glow, -0.04, 0.035);
    box(root, 0.006, 0.014, 0.006, black, 0, 0.02, -0.32); // front iron
    box(root, 0.045, 0.12, 0.05, dark, 0, -0.13, 0.02, 0.28, 0, 0); // grip
    box(root, 0.045, 0.025, 0.055, steel, 0, -0.08, -0.04); // magwell
    box(magGroup, 0.042, 0.13, 0.05, body, 0, -0.16, -0.04);
    box(root, 0.05, 0.05, 0.075, skin, 0.0, -0.15, 0.04);
    box(root, 0.05, 0.05, 0.07, skin, 0.0, -0.07, -0.2);
    muzzlePos.set(0, -0.015, -0.58);
  }

  const muzzle = new THREE.Object3D();
  muzzle.position.copy(muzzlePos);
  root.add(muzzle);

  // Comfortable first-person size — not huge, not invisible
  root.scale.setScalar(1.05);
  root.position.set(0, 0, 0);
  root.rotation.set(0, 0, 0);

  root.traverse((o) => {
    if (o.isMesh) {
      o.frustumCulled = false;
      o.renderOrder = 999;
    }
  });

  return { root, mag: magGroup, muzzle, hasScope: cls === 'sniper' };
}
