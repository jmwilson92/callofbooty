import * as THREE from 'three';

// First-person gun meshes — bigger, brighter, class-specific shapes.

const metal = (hex, rough = 0.45, metalness = 0.55) =>
  new THREE.MeshStandardMaterial({
    color: hex, roughness: rough, metalness,
    emissive: hex, emissiveIntensity: 0.08,
  });

const polymer = (hex) =>
  new THREE.MeshStandardMaterial({
    color: hex, roughness: 0.7, metalness: 0.15,
    emissive: hex, emissiveIntensity: 0.06,
  });

const accent = (hex) =>
  new THREE.MeshStandardMaterial({
    color: hex, roughness: 0.4, metalness: 0.3,
    emissive: hex, emissiveIntensity: 0.25,
  });

function box(sx, sy, sz, mat, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}

function cyl(rTop, rBot, h, mat, x, y, z, parent, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 10), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  parent.add(m);
  return m;
}

/**
 * Build a first-person weapon mesh group.
 * Local space: +Z toward player, -Z down the barrel (Three camera looks -Z).
 * Returns { root, mag, muzzle }
 */
export function buildViewModel(def) {
  const root = new THREE.Group();
  root.name = `vm_${def.id}`;
  const magGroup = new THREE.Group();
  magGroup.name = 'mag';
  root.add(magGroup);

  const bodyCol = def.color;
  const dark = 0x1a1a1c;
  const steel = 0x8a8e94;
  const wood = 0x6a4a30;
  const matBody = polymer(bodyCol);
  const matDark = metal(dark, 0.5, 0.4);
  const matSteel = metal(steel, 0.35, 0.7);
  const matWood = polymer(wood);
  const matGlow = accent(0x7fd4ff);

  const cls = def.class;
  let muzzleZ = -0.55;

  if (cls === 'pistol') {
    // Grip
    box(0.09, 0.22, 0.12, matDark, 0.22, -0.28, -0.22, root);
    // Slide / upper
    box(0.1, 0.1, 0.28, matSteel, 0.22, -0.14, -0.32, root);
    // Barrel
    cyl(0.018, 0.018, 0.14, matSteel, 0.22, -0.12, -0.48, root, Math.PI / 2, 0, 0);
    // Mag in grip
    box(0.07, 0.16, 0.09, matBody, 0.22, -0.3, -0.22, magGroup);
    // Sight
    box(0.02, 0.03, 0.02, matGlow, 0.22, -0.08, -0.42, root);
    muzzleZ = -0.55;
  } else if (cls === 'shotgun') {
    box(0.1, 0.12, 0.2, matWood, 0.24, -0.22, -0.18, root); // stock
    box(0.11, 0.11, 0.45, matDark, 0.24, -0.16, -0.42, root); // receiver
    cyl(0.028, 0.028, 0.35, matSteel, 0.24, -0.12, -0.72, root, Math.PI / 2, 0, 0);
    cyl(0.022, 0.022, 0.32, matSteel, 0.24, -0.17, -0.68, root, Math.PI / 2, 0, 0); // tube
    box(0.08, 0.14, 0.1, matBody, 0.24, -0.26, -0.38, magGroup); // pump / shell area
    box(0.03, 0.04, 0.03, matGlow, 0.24, -0.06, -0.55, root);
    muzzleZ = -0.9;
  } else if (cls === 'sniper') {
    box(0.09, 0.1, 0.25, matWood, 0.24, -0.2, -0.15, root);
    box(0.1, 0.1, 0.5, matDark, 0.24, -0.15, -0.45, root);
    cyl(0.02, 0.02, 0.55, matSteel, 0.24, -0.12, -0.85, root, Math.PI / 2, 0, 0);
    // Scope
    cyl(0.035, 0.035, 0.22, matSteel, 0.24, -0.02, -0.4, root, Math.PI / 2, 0, 0);
    box(0.04, 0.03, 0.04, matGlow, 0.24, 0.02, -0.32, root);
    box(0.06, 0.16, 0.08, matBody, 0.24, -0.28, -0.35, magGroup);
    muzzleZ = -1.15;
  } else if (cls === 'smg') {
    box(0.09, 0.18, 0.14, matDark, 0.24, -0.26, -0.2, root); // grip
    box(0.11, 0.12, 0.35, matBody, 0.24, -0.14, -0.38, root);
    cyl(0.02, 0.02, 0.22, matSteel, 0.24, -0.12, -0.62, root, Math.PI / 2, 0, 0);
    box(0.12, 0.04, 0.18, matDark, 0.24, -0.08, -0.35, root); // top rail
    box(0.07, 0.18, 0.1, matBody, 0.24, -0.3, -0.32, magGroup);
    box(0.025, 0.035, 0.025, matGlow, 0.24, -0.05, -0.5, root);
    // Folded stock stub
    box(0.04, 0.06, 0.12, matDark, 0.24, -0.16, -0.08, root);
    muzzleZ = -0.75;
  } else if (cls === 'lmg') {
    box(0.12, 0.14, 0.55, matDark, 0.26, -0.16, -0.42, root);
    box(0.1, 0.2, 0.14, matDark, 0.26, -0.28, -0.22, root);
    cyl(0.025, 0.025, 0.4, matSteel, 0.26, -0.12, -0.8, root, Math.PI / 2, 0, 0);
    // Bipod tips
    box(0.02, 0.12, 0.02, matSteel, 0.2, -0.28, -0.7, root);
    box(0.02, 0.12, 0.02, matSteel, 0.32, -0.28, -0.7, root);
    // Big mag / box
    box(0.12, 0.2, 0.14, matBody, 0.26, -0.32, -0.4, magGroup);
    box(0.14, 0.05, 0.25, matDark, 0.26, -0.07, -0.38, root);
    box(0.03, 0.04, 0.03, matGlow, 0.26, -0.04, -0.55, root);
    muzzleZ = -1.0;
  } else {
    // AR / DMR default
    // Stock
    box(0.08, 0.1, 0.18, matDark, 0.24, -0.18, -0.12, root);
    // Receiver
    box(0.12, 0.13, 0.38, matBody, 0.24, -0.15, -0.38, root);
    // Handguard
    box(0.11, 0.1, 0.28, matDark, 0.24, -0.14, -0.62, root);
    // Barrel
    cyl(0.018, 0.018, 0.28, matSteel, 0.24, -0.12, -0.88, root, Math.PI / 2, 0, 0);
    // Muzzle brake
    box(0.04, 0.04, 0.06, matSteel, 0.24, -0.12, -1.02, root);
    // Carry handle / optic rail
    box(0.06, 0.04, 0.22, matDark, 0.24, -0.06, -0.4, root);
    box(0.03, 0.05, 0.08, matGlow, 0.24, -0.02, -0.36, root); // optic glow
    // Grip
    box(0.08, 0.18, 0.1, matDark, 0.24, -0.28, -0.28, root);
    // Mag (animated on reload)
    box(0.08, 0.22, 0.1, matBody, 0.24, -0.32, -0.36, magGroup);
    // Magwell hint
    box(0.09, 0.04, 0.11, matSteel, 0.24, -0.22, -0.36, root);
    muzzleZ = -1.05;
  }

  // Front sight glow so the gun always reads against dark scenes
  box(0.02, 0.02, 0.02, matGlow, 0.24, -0.08, muzzleZ + 0.08, root);

  const muzzle = new THREE.Object3D();
  muzzle.position.set(0.24, -0.12, muzzleZ);
  root.add(muzzle);

  // Overall pose: lower-right, big enough to own the corner of the screen
  root.scale.setScalar(1.15);
  root.position.set(0.02, -0.02, 0.05);
  root.rotation.set(0.04, 0.12, 0.02);

  return { root, mag: magGroup, muzzle };
}
