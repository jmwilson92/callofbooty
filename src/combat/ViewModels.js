import * as THREE from 'three';

// Slim first-person guns. Sight line sits on local origin (0,0) so ADS
// can zero the weapon transform and only iron sights / optics cover aim.

function mat(hex, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness: opts.rough ?? 0.42,
    metalness: opts.metal ?? 0.4,
    emissive: new THREE.Color(hex).multiplyScalar(opts.em ?? 0.1),
    emissiveIntensity: 1,
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
 * Guns are modeled so the *sight plane* is near y=0, x≈0.
 * Body/grip hang below (−Y). Camera looks −Z.
 */
export function buildViewModel(def) {
  const root = new THREE.Group();
  root.name = `vm_${def.id}`;
  root.frustumCulled = false;

  const magGroup = new THREE.Group();
  magGroup.name = 'mag';
  magGroup.frustumCulled = false;
  root.add(magGroup);

  const body = mat(def.color, { rough: 0.5, metal: 0.28, em: 0.12 });
  const dark = mat(0x1c1e22, { rough: 0.48, metal: 0.5, em: 0.07 });
  const steel = mat(0xb0b4bc, { rough: 0.28, metal: 0.78, em: 0.09 });
  const wood = mat(0x6e4c30, { rough: 0.72, metal: 0.05, em: 0.08 });
  const black = mat(0x0e1014, { rough: 0.55, metal: 0.35, em: 0.05 });
  const glow = mat(0xff4040, { rough: 0.3, metal: 0.15, em: 0.7 }); // iron sight / reticle
  const glass = mat(0x4a80a0, { rough: 0.15, metal: 0.2, em: 0.2 });

  const cls = def.class;
  let muzzlePos = new THREE.Vector3(0, 0, -0.55);

  // Slim proportions — receiver sits under the sight line
  if (cls === 'pistol') {
    // Slide centered under sights
    box(root, 0.055, 0.055, 0.22, steel, 0, -0.035, -0.12);
    box(root, 0.05, 0.12, 0.07, dark, 0, -0.1, -0.02); // grip
    cyl(root, 0.012, 0.012, 0.1, steel, 0, -0.028, -0.26, Math.PI / 2, 0, 0);
    box(magGroup, 0.04, 0.1, 0.055, body, 0, -0.12, -0.02);
    // Iron sights on the sight line (y≈0)
    box(root, 0.008, 0.018, 0.008, glow, 0, 0.008, -0.2); // front
    box(root, 0.02, 0.012, 0.01, black, 0, 0.006, -0.04); // rear
    muzzlePos.set(0, -0.028, -0.32);
  } else if (cls === 'shotgun') {
    box(root, 0.06, 0.06, 0.14, wood, 0, -0.04, 0.08);
    box(root, 0.065, 0.06, 0.32, dark, 0, -0.035, -0.12);
    cyl(root, 0.016, 0.016, 0.28, steel, 0, -0.02, -0.36, Math.PI / 2, 0, 0);
    cyl(root, 0.014, 0.014, 0.24, steel, 0, -0.045, -0.32, Math.PI / 2, 0, 0);
    box(magGroup, 0.05, 0.05, 0.09, body, 0, -0.08, -0.1);
    box(root, 0.01, 0.02, 0.01, glow, 0, 0.01, -0.28); // bead
    box(root, 0.05, 0.1, 0.06, dark, 0, -0.1, 0.02); // grip
    muzzlePos.set(0, -0.02, -0.52);
  } else if (cls === 'sniper') {
    box(root, 0.055, 0.055, 0.18, wood, 0, -0.04, 0.1);
    box(root, 0.06, 0.055, 0.36, dark, 0, -0.035, -0.12);
    cyl(root, 0.012, 0.012, 0.4, steel, 0, -0.022, -0.42, Math.PI / 2, 0, 0);
    // Scope ON the sight axis (center of screen when ADS)
    cyl(root, 0.022, 0.022, 0.18, black, 0, 0.02, -0.08, Math.PI / 2, 0, 0);
    cyl(root, 0.018, 0.024, 0.04, glass, 0, 0.02, 0.02, Math.PI / 2, 0, 0); // ocular
    cyl(root, 0.024, 0.018, 0.035, glass, 0, 0.02, -0.18, Math.PI / 2, 0, 0); // objective
    box(root, 0.012, 0.012, 0.012, glow, 0, 0.02, -0.08); // reticle glow inside
    box(magGroup, 0.04, 0.1, 0.055, body, 0, -0.1, -0.05);
    box(root, 0.05, 0.1, 0.055, dark, 0, -0.1, 0.02);
    muzzlePos.set(0, -0.022, -0.64);
  } else if (cls === 'smg') {
    box(root, 0.055, 0.1, 0.07, dark, 0, -0.08, 0.04); // grip
    box(root, 0.065, 0.06, 0.26, body, 0, -0.03, -0.1);
    cyl(root, 0.012, 0.012, 0.18, steel, 0, -0.02, -0.3, Math.PI / 2, 0, 0);
    box(root, 0.07, 0.025, 0.14, dark, 0, 0.01, -0.08); // thin rail
    box(magGroup, 0.04, 0.12, 0.055, body, 0, -0.1, -0.06);
    // Compact irons
    box(root, 0.008, 0.016, 0.008, glow, 0, 0.028, -0.2);
    box(root, 0.018, 0.01, 0.008, black, 0, 0.022, -0.02);
    box(root, 0.04, 0.04, 0.08, dark, 0, -0.03, 0.12); // stock stub
    muzzlePos.set(0, -0.02, -0.4);
  } else if (cls === 'lmg') {
    box(root, 0.07, 0.07, 0.4, dark, 0, -0.035, -0.1);
    box(root, 0.055, 0.12, 0.08, dark, 0, -0.1, 0.06);
    cyl(root, 0.014, 0.014, 0.32, steel, 0, -0.02, -0.4, Math.PI / 2, 0, 0);
    box(root, 0.012, 0.08, 0.012, steel, -0.04, -0.08, -0.32);
    box(root, 0.012, 0.08, 0.012, steel, 0.04, -0.08, -0.32);
    box(magGroup, 0.07, 0.14, 0.09, body, 0, -0.12, -0.06);
    box(root, 0.08, 0.03, 0.16, dark, 0, 0.02, -0.06);
    box(root, 0.01, 0.018, 0.01, glow, 0, 0.04, -0.18);
    muzzlePos.set(0, -0.02, -0.58);
  } else {
    // AR / DMR — slim modern rifle, optic on sight line
    // Stock (back, lower)
    box(root, 0.05, 0.055, 0.14, dark, 0, -0.03, 0.14);
    // Receiver under sights
    box(root, 0.065, 0.06, 0.28, body, 0, -0.035, -0.04);
    // Slim handguard
    box(root, 0.058, 0.05, 0.22, dark, 0, -0.03, -0.26);
    // Barrel
    cyl(root, 0.01, 0.01, 0.22, steel, 0, -0.02, -0.46, Math.PI / 2, 0, 0);
    // Muzzle brake (small)
    box(root, 0.022, 0.022, 0.04, steel, 0, -0.02, -0.58);
    // Top rail (thin)
    box(root, 0.035, 0.018, 0.2, black, 0, 0.01, -0.06);
    // Red-dot / holographic optic ON crosshair plane
    box(root, 0.04, 0.035, 0.055, dark, 0, 0.035, 0.0);
    box(root, 0.028, 0.028, 0.012, glass, 0, 0.04, 0.02);
    box(root, 0.008, 0.008, 0.008, glow, 0, 0.04, 0.01); // reticle
    // Front iron backup
    box(root, 0.008, 0.016, 0.008, black, 0, 0.02, -0.34);
    // Pistol grip (below)
    box(root, 0.045, 0.11, 0.055, dark, 0, -0.1, 0.02, 0.28, 0, 0);
    // Mag
    box(root, 0.05, 0.025, 0.06, steel, 0, -0.065, -0.04);
    box(magGroup, 0.045, 0.14, 0.055, body, 0, -0.14, -0.04);
    muzzlePos.set(0, -0.02, -0.62);
  }

  // Hands — smaller, lower, don’t cover sights
  const skin = mat(0xc4a07a, { rough: 0.85, metal: 0.04, em: 0.1 });
  box(root, 0.05, 0.05, 0.09, skin, 0.01, -0.12, 0.04); // trigger hand
  if (cls !== 'pistol') {
    box(root, 0.05, 0.05, 0.08, skin, -0.01, -0.07, -0.22); // support hand on handguard
  }

  const muzzle = new THREE.Object3D();
  muzzle.position.copy(muzzlePos);
  root.add(muzzle);

  // Built on sight axis — hip offset applied in WeaponSystem
  root.scale.setScalar(0.92);
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
