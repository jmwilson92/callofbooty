import * as THREE from 'three';

// First-person viewmodels — classic FPS layout:
//   • Sight aperture / optic reticle sits on local (0, 0) so ADS zeros cleanly.
//   • Receiver, grip, mag, hands hang well *below* that plane (−Y).
//   • Thin posts / optic rings only — nothing bulky occludes the aim point.

function mat(hex, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness: opts.rough ?? 0.42,
    metalness: opts.metal ?? 0.45,
    emissive: new THREE.Color(hex).multiplyScalar(opts.em ?? 0.08),
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

function cyl(parent, rT, rB, h, material, x, y, z, rx = 0, ry = 0, rz = 0, segs = 10) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rT, rB, h, segs), material);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.frustumCulled = false;
  m.renderOrder = 999;
  parent.add(m);
  return m;
}

/** Thin iron-sight pair on the sight axis (y≈0). Front post + rear notch. */
function ironSights(root, glow, black, frontZ, rearZ, y = 0.002) {
  // Front post — needle thin
  box(root, 0.004, 0.014, 0.004, glow, 0, y + 0.007, frontZ);
  // Rear aperture wings (U-notch) — leave center open for aim
  box(root, 0.006, 0.01, 0.004, black, -0.01, y + 0.005, rearZ);
  box(root, 0.006, 0.01, 0.004, black, 0.01, y + 0.005, rearZ);
  box(root, 0.026, 0.004, 0.004, black, 0, y, rearZ); // base bar under notch
}

/** Compact red-dot / holo: thin frame ring, open glass, tiny reticle on axis. */
function redDot(root, dark, glass, glow, z = 0.0, y = 0.0) {
  // Housing base (under optic, not in FOV center)
  box(root, 0.028, 0.01, 0.04, dark, 0, y - 0.008, z);
  // Thin square frame (open center)
  box(root, 0.032, 0.003, 0.003, dark, 0, y + 0.014, z + 0.012); // top
  box(root, 0.032, 0.003, 0.003, dark, 0, y + 0.014, z - 0.012); // bottom of frame front
  box(root, 0.003, 0.028, 0.003, dark, -0.015, y + 0.0, z + 0.012); // left
  box(root, 0.003, 0.028, 0.003, dark, 0.015, y + 0.0, z + 0.012); // right
  // Glass pane (mostly transparent)
  box(root, 0.026, 0.026, 0.004, glass, 0, y + 0.0, z + 0.01);
  // Reticle — only solid thing on the crosshair
  box(root, 0.005, 0.005, 0.003, glow, 0, y + 0.0, z + 0.008);
}

/** Sniper scope: slim tube on axis, ocular/objective glass, thin mounts below. */
function scope(root, black, glass, glow, steel, zCenter = -0.06) {
  // Tube body — slender
  cyl(root, 0.014, 0.014, 0.16, black, 0, 0.0, zCenter, Math.PI / 2, 0, 0, 14);
  // Ocular ring (near eye)
  cyl(root, 0.016, 0.012, 0.028, black, 0, 0.0, zCenter + 0.09, Math.PI / 2, 0, 0, 12);
  box(root, 0.022, 0.022, 0.006, glass, 0, 0.0, zCenter + 0.105);
  // Objective (far)
  cyl(root, 0.012, 0.018, 0.03, black, 0, 0.0, zCenter - 0.09, Math.PI / 2, 0, 0, 12);
  box(root, 0.028, 0.028, 0.005, glass, 0, 0.0, zCenter - 0.108);
  // Center reticle glow
  box(root, 0.004, 0.004, 0.004, glow, 0, 0.0, zCenter);
  // Mount rings → rail (below tube so body doesn’t fill center)
  box(root, 0.018, 0.012, 0.018, steel, 0, -0.014, zCenter + 0.04);
  box(root, 0.018, 0.012, 0.018, steel, 0, -0.014, zCenter - 0.04);
}

/**
 * Build a viewmodel. Sight plane ≈ y=0, x=0.
 * Camera looks down −Z. Body lives at y ≤ −0.06.
 */
export function buildViewModel(def) {
  const root = new THREE.Group();
  root.name = `vm_${def.id}`;
  root.frustumCulled = false;

  const magGroup = new THREE.Group();
  magGroup.name = 'mag';
  magGroup.frustumCulled = false;
  root.add(magGroup);

  const body = mat(def.color, { rough: 0.48, metal: 0.32, em: 0.1 });
  const dark = mat(0x1a1c20, { rough: 0.5, metal: 0.55, em: 0.06 });
  const steel = mat(0xa8adb8, { rough: 0.26, metal: 0.82, em: 0.07 });
  const wood = mat(0x6a482c, { rough: 0.75, metal: 0.04, em: 0.06 });
  const black = mat(0x0c0e12, { rough: 0.55, metal: 0.4, em: 0.04 });
  const glow = mat(0xff3030, { rough: 0.25, metal: 0.1, em: 0.85 });
  const glass = mat(0x3a7090, { rough: 0.12, metal: 0.15, em: 0.18, alpha: 0.35 });
  const skin = mat(0xc4a07a, { rough: 0.88, metal: 0.03, em: 0.08 });

  const cls = def.class;
  let muzzlePos = new THREE.Vector3(0, -0.04, -0.5);

  // ── Body hangs at y ≈ −0.07…−0.14; only sights poke up to y≈0 ──
  if (cls === 'pistol') {
    // Slide (low)
    box(root, 0.038, 0.038, 0.18, steel, 0, -0.048, -0.1);
    // Frame under slide
    box(root, 0.036, 0.028, 0.14, dark, 0, -0.07, -0.06);
    // Grip
    box(root, 0.036, 0.1, 0.05, dark, 0, -0.13, 0.0, 0.22, 0, 0);
    // Barrel
    cyl(root, 0.008, 0.008, 0.07, steel, 0, -0.042, -0.22, Math.PI / 2, 0, 0);
    // Mag
    box(magGroup, 0.03, 0.085, 0.04, body, 0, -0.14, 0.0);
    // Trigger guard
    box(root, 0.01, 0.03, 0.04, dark, 0, -0.09, -0.04);
    ironSights(root, glow, black, -0.18, -0.02, -0.026);
    // Hands
    box(root, 0.038, 0.038, 0.06, skin, 0.005, -0.15, 0.02);
    muzzlePos.set(0, -0.042, -0.26);
  } else if (cls === 'shotgun') {
    // Stock
    box(root, 0.038, 0.042, 0.12, wood, 0, -0.06, 0.1);
    // Receiver
    box(root, 0.045, 0.045, 0.16, dark, 0, -0.055, -0.06);
    // Forend
    box(root, 0.04, 0.04, 0.14, wood, 0, -0.055, -0.22);
    // Twin barrels (under sight)
    cyl(root, 0.01, 0.01, 0.28, steel, 0, -0.04, -0.4, Math.PI / 2, 0, 0);
    cyl(root, 0.009, 0.009, 0.26, steel, 0, -0.058, -0.38, Math.PI / 2, 0, 0);
    // Pump
    box(magGroup, 0.042, 0.04, 0.08, body, 0, -0.07, -0.18);
    // Bead only on sight line
    box(root, 0.005, 0.012, 0.005, glow, 0, -0.01, -0.32);
    // Grip
    box(root, 0.038, 0.09, 0.045, dark, 0, -0.12, 0.02, 0.25, 0, 0);
    box(root, 0.038, 0.038, 0.06, skin, 0.0, -0.14, 0.04);
    box(root, 0.038, 0.038, 0.055, skin, 0.0, -0.08, -0.2);
    muzzlePos.set(0, -0.04, -0.55);
  } else if (cls === 'sniper') {
    // Stock
    box(root, 0.038, 0.04, 0.14, wood, 0, -0.065, 0.12);
    // Receiver
    box(root, 0.042, 0.04, 0.22, dark, 0, -0.055, -0.04);
    // Handguard
    box(root, 0.038, 0.035, 0.18, dark, 0, -0.05, -0.24);
    // Long barrel
    cyl(root, 0.008, 0.008, 0.36, steel, 0, -0.042, -0.48, Math.PI / 2, 0, 0);
    // Muzzle brake
    box(root, 0.016, 0.016, 0.03, steel, 0, -0.042, -0.67);
    // Thin top rail under scope
    box(root, 0.02, 0.008, 0.16, black, 0, -0.028, -0.06);
    // Scope ON axis — this is what you aim through
    scope(root, black, glass, glow, steel, -0.05);
    // Mag + grip
    box(magGroup, 0.03, 0.09, 0.04, body, 0, -0.12, -0.02);
    box(root, 0.036, 0.09, 0.042, dark, 0, -0.12, 0.04, 0.22, 0, 0);
    box(root, 0.036, 0.036, 0.055, skin, 0.0, -0.14, 0.05);
    box(root, 0.036, 0.036, 0.05, skin, 0.0, -0.075, -0.2);
    muzzlePos.set(0, -0.042, -0.7);
  } else if (cls === 'smg') {
    // Compact receiver
    box(root, 0.042, 0.04, 0.18, body, 0, -0.055, -0.06);
    // Upper
    box(root, 0.038, 0.022, 0.16, dark, 0, -0.032, -0.08);
    // Barrel + shroud
    cyl(root, 0.008, 0.008, 0.14, steel, 0, -0.04, -0.26, Math.PI / 2, 0, 0);
    box(root, 0.028, 0.028, 0.08, dark, 0, -0.04, -0.2);
    // Grip
    box(root, 0.036, 0.09, 0.045, dark, 0, -0.12, 0.02, 0.25, 0, 0);
    // Mag
    box(magGroup, 0.03, 0.1, 0.04, body, 0, -0.13, -0.04);
    // Folding stock stub
    box(root, 0.028, 0.028, 0.08, dark, 0, -0.05, 0.1);
    // Thin rail + irons
    box(root, 0.018, 0.006, 0.12, black, 0, -0.018, -0.06);
    ironSights(root, glow, black, -0.16, 0.0, -0.014);
    box(root, 0.036, 0.036, 0.055, skin, 0.0, -0.14, 0.04);
    box(root, 0.036, 0.036, 0.05, skin, 0.0, -0.08, -0.16);
    muzzlePos.set(0, -0.04, -0.34);
  } else if (cls === 'lmg') {
    // Thick-but-low receiver
    box(root, 0.05, 0.048, 0.28, dark, 0, -0.06, -0.06);
    // Barrel
    cyl(root, 0.01, 0.01, 0.3, steel, 0, -0.045, -0.38, Math.PI / 2, 0, 0);
    // Bipod legs (low, out of aim)
    box(root, 0.008, 0.07, 0.008, steel, -0.03, -0.1, -0.3);
    box(root, 0.008, 0.07, 0.008, steel, 0.03, -0.1, -0.3);
    // Box mag
    box(magGroup, 0.055, 0.11, 0.07, body, 0, -0.14, -0.04);
    // Grip + stock
    box(root, 0.038, 0.09, 0.045, dark, 0, -0.13, 0.06, 0.22, 0, 0);
    box(root, 0.04, 0.04, 0.12, dark, 0, -0.055, 0.14);
    // Thin rail + iron / low optic
    box(root, 0.02, 0.006, 0.14, black, 0, -0.03, -0.04);
    ironSights(root, glow, black, -0.2, 0.02, -0.024);
    box(root, 0.038, 0.038, 0.055, skin, 0.0, -0.15, 0.07);
    box(root, 0.038, 0.038, 0.05, skin, 0.0, -0.09, -0.18);
    muzzlePos.set(0, -0.045, -0.55);
  } else {
    // AR / DMR — modern carbine silhouette, red-dot on axis
    // Stock
    box(root, 0.032, 0.038, 0.12, dark, 0, -0.055, 0.12);
    // Buffer tube
    cyl(root, 0.012, 0.012, 0.08, black, 0, -0.048, 0.04, Math.PI / 2, 0, 0);
    // Lower receiver
    box(root, 0.04, 0.038, 0.12, body, 0, -0.065, -0.02);
    // Upper receiver
    box(root, 0.038, 0.032, 0.14, dark, 0, -0.04, -0.04);
    // Handguard (slim M-LOK style)
    box(root, 0.036, 0.032, 0.16, dark, 0, -0.042, -0.2);
    // Barrel
    cyl(root, 0.007, 0.007, 0.18, steel, 0, -0.038, -0.38, Math.PI / 2, 0, 0);
    // Gas block + muzzle device
    box(root, 0.014, 0.014, 0.02, steel, 0, -0.038, -0.3);
    box(root, 0.016, 0.016, 0.028, steel, 0, -0.038, -0.48);
    // Picatinny rail (thin, under optic)
    box(root, 0.018, 0.006, 0.18, black, 0, -0.02, -0.08);
    // Red-dot ON sight axis — open frame, only reticle blocks aim
    redDot(root, dark, glass, glow, -0.02, 0.0);
    // Front backup iron (folded tiny)
    box(root, 0.004, 0.01, 0.004, black, 0, -0.01, -0.28);
    // Pistol grip
    box(root, 0.032, 0.09, 0.04, dark, 0, -0.125, 0.02, 0.28, 0, 0);
    // Magwell + magazine
    box(root, 0.034, 0.02, 0.045, steel, 0, -0.085, -0.04);
    box(magGroup, 0.032, 0.11, 0.04, body, 0, -0.155, -0.04);
    // Hands — low, never on sight plane
    box(root, 0.036, 0.036, 0.055, skin, 0.0, -0.15, 0.04); // firing hand
    box(root, 0.036, 0.036, 0.05, skin, 0.0, -0.08, -0.18); // support
    muzzlePos.set(0, -0.038, -0.5);
  }

  const muzzle = new THREE.Object3D();
  muzzle.position.copy(muzzlePos);
  root.add(muzzle);

  // Overall scale — compact so hip doesn’t eat the screen
  root.scale.setScalar(0.78);
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
