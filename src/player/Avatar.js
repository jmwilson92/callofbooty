import * as THREE from 'three';

/**
 * Low-poly humanoid avatars for first-person arms and world bodies (local + friends).
 * Feet at local origin; +Y up; facing −Z (matches camera forward).
 */

function mat(hex, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color: hex,
    roughness: opts.rough ?? 0.72,
    metalness: opts.metal ?? 0.08,
  });
}

function addMesh(parent, geo, material, x, y, z, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  m.receiveShadow = true;
  m.frustumCulled = false;
  parent.add(m);
  return m;
}

/** Canvas nameplate above friends' heads. */
function makeNameSprite(name, color = '#7fd4ff') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 256, 64);
  ctx.fillStyle = 'rgba(8,12,16,0.72)';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(8, 12, 240, 40, 8);
  } else {
    ctx.rect(8, 12, 240, 40);
  }
  ctx.fill();
  ctx.font = 'bold 28px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(String(name || 'Friend').slice(0, 12), 128, 34);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true })
  );
  sprite.scale.set(1.4, 0.35, 1);
  sprite.position.set(0, 2.15, 0);
  sprite.center.set(0.5, 0.5);
  return sprite;
}

/**
 * Full world body (friends + third-person self).
 * @param {{ color?: number, name?: string, nameColor?: string, ally?: boolean }} opts
 */
export function buildWorldAvatar(opts = {}) {
  const color = opts.color ?? (opts.ally ? 0x3a8fd4 : 0x4a7a4a);
  const g = new THREE.Group();
  g.name = 'worldAvatar';

  const bodyMat = mat(color, { rough: 0.78, metal: 0.08 });
  const darkMat = mat(0x1a1c20, { rough: 0.65, metal: 0.2 });
  const skinMat = mat(0xc9a07a, { rough: 0.82, metal: 0.02 });
  const vestMat = mat(0x252830, { rough: 0.55, metal: 0.25 });
  const bootMat = mat(0x141416, { rough: 0.7, metal: 0.1 });
  const gloveMat = mat(0x2a2e34, { rough: 0.7, metal: 0.1 });

  // Boots
  addMesh(g, new THREE.BoxGeometry(0.14, 0.1, 0.24), bootMat, -0.11, 0.05, 0.02);
  addMesh(g, new THREE.BoxGeometry(0.14, 0.1, 0.24), bootMat, 0.11, 0.05, 0.02);

  const makeLeg = (x) => {
    const root = new THREE.Group();
    root.position.set(x, 0.95, 0);
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.42, 8), darkMat);
    thigh.position.y = -0.21;
    thigh.castShadow = true;
    root.add(thigh);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.4, 8), darkMat);
    shin.position.y = -0.62;
    shin.castShadow = true;
    root.add(shin);
    const knee = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.1), vestMat);
    knee.position.y = -0.42;
    root.add(knee);
    g.add(root);
    return root;
  };
  const lLeg = makeLeg(-0.12);
  const rLeg = makeLeg(0.12);

  addMesh(g, new THREE.BoxGeometry(0.38, 0.14, 0.22), darkMat, 0, 0.98, 0);
  addMesh(g, new THREE.BoxGeometry(0.4, 0.48, 0.22), bodyMat, 0, 1.28, 0);
  const vest = addMesh(g, new THREE.BoxGeometry(0.42, 0.36, 0.26), vestMat, 0, 1.32, 0.01);
  vest.position.z = 0.01;
  for (const px of [-0.1, 0.1]) {
    addMesh(g, new THREE.BoxGeometry(0.1, 0.12, 0.08), darkMat, px, 1.22, 0.16);
  }

  const makeArm = (x, sign) => {
    const root = new THREE.Group();
    root.position.set(x, 1.48, 0);
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.32, 8), bodyMat);
    upper.position.y = -0.16;
    upper.castShadow = true;
    root.add(upper);
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.3, 8), bodyMat);
    lower.position.y = -0.45;
    lower.castShadow = true;
    root.add(lower);
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.1, 0.08), gloveMat);
    hand.position.y = -0.62;
    root.add(hand);
    // Aim-ready rest pose (arms forward)
    root.rotation.z = sign * 0.1;
    root.rotation.x = 0.55;
    g.add(root);
    return root;
  };
  const lArm = makeArm(-0.28, -1);
  const rArm = makeArm(0.28, 1);

  addMesh(g, new THREE.CylinderGeometry(0.06, 0.07, 0.1, 8), skinMat, 0, 1.58, 0);
  const head = addMesh(g, new THREE.SphereGeometry(0.13, 12, 10), skinMat, 0, 1.72, 0);
  head.scale.set(1, 1.05, 0.95);

  const helm = addMesh(
    g,
    new THREE.SphereGeometry(0.145, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55),
    darkMat,
    0,
    1.78,
    0
  );
  const nvg = addMesh(g, new THREE.BoxGeometry(0.06, 0.04, 0.08), vestMat, 0, 1.88, 0.08);
  nvg.userData.heliHide = true;
  const goggles = addMesh(g, new THREE.BoxGeometry(0.16, 0.04, 0.06), vestMat, 0, 1.76, 0.12);
  goggles.userData.heliHide = true;

  // Ally backpack tint
  addMesh(g, new THREE.BoxGeometry(0.28, 0.35, 0.14), darkMat, 0, 1.3, -0.18);

  // Held rifle silhouette
  const gun = new THREE.Group();
  gun.position.set(0.12, 1.2, 0.32);
  gun.rotation.set(-0.12, 0.2, 0.08);
  gun.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.34), darkMat));
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), vestMat);
  bar.rotation.x = Math.PI / 2;
  bar.position.z = 0.3;
  gun.add(bar);
  g.add(gun);

  // Ally accent stripe on vest
  if (opts.ally) {
    const stripe = addMesh(g, new THREE.BoxGeometry(0.38, 0.04, 0.02), mat(0x7fd4ff, { rough: 0.4 }), 0, 1.42, 0.15);
    stripe.castShadow = false;
  }

  let nameSprite = null;
  if (opts.name) {
    nameSprite = makeNameSprite(opts.name, opts.nameColor || '#7fd4ff');
    g.add(nameSprite);
  }

  g.userData.lLeg = lLeg;
  g.userData.rLeg = rLeg;
  g.userData.lArm = lArm;
  g.userData.rArm = rArm;
  g.userData.gun = gun;
  g.userData.heliHideParts = [nvg, goggles, helm];
  // Helmet is slightly tall — hide whole dome in heli, keep head skin
  helm.userData.heliHide = true;
  g.userData.nameSprite = nameSprite;
  g.userData.setName = (name) => {
    if (nameSprite) g.remove(nameSprite);
    if (nameSprite?.material?.map) nameSprite.material.map.dispose();
    if (nameSprite?.material) nameSprite.material.dispose();
    nameSprite = name ? makeNameSprite(name, opts.nameColor || '#7fd4ff') : null;
    g.userData.nameSprite = nameSprite;
    if (nameSprite) g.add(nameSprite);
  };

  return g;
}

/**
 * First-person hands parented under the weapon viewGroup (local gun space).
 * Camera looks -Z; gun body hangs -Y / barrel -Z.
 * Right hand = pistol grip, left hand = handguard — both ride the gun into ADS.
 */
export function buildFpArms() {
  const g = new THREE.Group();
  g.name = 'fpArms';
  g.userData.isFpArms = true;

  const sleeve = mat(0x2a4a6a, { rough: 0.7, metal: 0.1 });
  const skin = mat(0xc4a07a, { rough: 0.85, metal: 0.02 });
  const glove = mat(0x1a1e24, { rough: 0.62, metal: 0.14 });

  /** Compact hand + short forearm (no zombie T-pose limbs). */
  const makeHand = (side) => {
    // side: -1 left (support), +1 right (grip)
    const root = new THREE.Group();
    root.name = side < 0 ? 'fpLeftHand' : 'fpRightHand';

    // Short forearm cuff coming from off-screen toward the gun
    const fore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.032, 0.14, 8),
      sleeve
    );
    fore.rotation.x = Math.PI / 2;
    fore.position.set(side * 0.01, 0.01, 0.09);
    fore.frustumCulled = false;
    root.add(fore);

    const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.026, 0.03, 8), skin);
    wrist.rotation.x = Math.PI / 2;
    wrist.position.set(0, 0.005, 0.03);
    wrist.frustumCulled = false;
    root.add(wrist);

    // Palm
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.028, 0.07), glove);
    palm.position.set(0, 0, -0.01);
    palm.frustumCulled = false;
    root.add(palm);

    // Knuckles / fingers curled around grip
    for (let i = 0; i < 4; i++) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.016, 0.038), glove);
      f.position.set((i - 1.5) * 0.013, 0.008, -0.048);
      f.rotation.x = -0.85; // curl down around grip
      f.frustumCulled = false;
      root.add(f);
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.014, 0.022), glove);
      tip.position.set((i - 1.5) * 0.013, -0.006, -0.068);
      tip.rotation.x = -1.2;
      tip.frustumCulled = false;
      root.add(tip);
    }
    // Thumb
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.016, 0.032), glove);
    thumb.position.set(side * -0.028, 0.012, -0.015);
    thumb.rotation.y = side * 0.7;
    thumb.rotation.x = -0.35;
    thumb.frustumCulled = false;
    root.add(thumb);

    g.add(root);
    return root;
  };

  const left = makeHand(-1);
  const right = makeHand(1);

  // Rest (hip) grip points in viewmodel local space
  // Right: pistol grip under receiver; Left: handguard forward
  right.position.set(0.015, -0.13, 0.02);
  right.rotation.set(0.15, 0.05, 0.12);
  left.position.set(-0.01, -0.07, -0.2);
  left.rotation.set(0.05, -0.08, -0.18);

  g.userData.left = left;
  g.userData.right = right;
  // Store hip baselines for ADS lerp
  g.userData.hip = {
    right: { p: right.position.clone(), r: right.rotation.clone() },
    left: { p: left.position.clone(), r: left.rotation.clone() },
  };
  // ADS: both hands pull in under the optic line
  g.userData.ads = {
    right: {
      p: new THREE.Vector3(0.01, -0.1, 0.01),
      r: new THREE.Euler(0.08, 0.02, 0.06),
    },
    left: {
      p: new THREE.Vector3(-0.005, -0.055, -0.16),
      r: new THREE.Euler(0.02, -0.04, -0.1),
    },
  };

  g.traverse((o) => {
    if (o.isMesh) {
      o.frustumCulled = false;
      o.renderOrder = 1000;
    }
  });

  return g;
}

/**
 * Low-poly canopy + suspension lines parented under a world avatar (or scene).
 * Local origin = feet; canopy floats above the head.
 */
export function buildParachuteCanopy(opts = {}) {
  const g = new THREE.Group();
  g.name = 'parachuteCanopy';

  const r = opts.radius ?? 2.35;
  const hy = opts.height ?? 4.1;
  const fabric = mat(opts.color ?? 0xc84a3a, { rough: 0.88, metal: 0.02 });
  const stripe = mat(opts.stripe ?? 0xf0e8d8, { rough: 0.9, metal: 0.0 });
  const cordMat = mat(0x2a2a28, { rough: 0.7, metal: 0.15 });

  // Dome canopy (upper hemisphere)
  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(r, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
    fabric
  );
  canopy.position.y = hy;
  canopy.castShadow = true;
  canopy.receiveShadow = true;
  g.add(canopy);

  // Gore stripes
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.04, r * 1.05),
      stripe
    );
    panel.position.set(
      Math.sin(a) * r * 0.35,
      hy + 0.15,
      Math.cos(a) * r * 0.35
    );
    panel.rotation.y = a;
    panel.castShadow = false;
    g.add(panel);
  }

  // Center vent disc
  const vent = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 0.06, 10),
    stripe
  );
  vent.position.y = hy + r * 0.48;
  g.add(vent);

  // Suspension lines: shoulders / hips → canopy rim
  const attach = [
    [-0.22, 1.45, 0.05],
    [0.22, 1.45, 0.05],
    [-0.16, 1.05, -0.05],
    [0.16, 1.05, -0.05],
  ];
  const rimPts = 8;
  for (let i = 0; i < rimPts; i++) {
    const a = (i / rimPts) * Math.PI * 2;
    const top = new THREE.Vector3(
      Math.sin(a) * r * 0.92,
      hy - 0.05,
      Math.cos(a) * r * 0.92
    );
    const bot = attach[i % attach.length];
    const from = new THREE.Vector3(bot[0], bot[1], bot[2]);
    const mid = from.clone().lerp(top, 0.5);
    const len = from.distanceTo(top);
    const line = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, len, 4),
      cordMat
    );
    line.position.copy(mid);
    line.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      top.clone().sub(from).normalize()
    );
    line.castShadow = false;
    g.add(line);
  }

  // Pack on back (stowed look when closed — we just hide whole group)
  g.visible = false;
  g.userData.canopy = canopy;
  return g;
}

/**
 * Simple walk / idle / seated / downed / chute pose from speed + time.
 * @param {THREE.Group} avatar
 * @param {number} t seconds
 * @param {number} speed m/s
 * @param {boolean} [crouched]
 * @param {'none'|'heli'|'moto'|'downed'|'dead'|'chute'|boolean} [seated]
 */
export function animateAvatar(avatar, t, speed, crouched = false, seated = false) {
  if (!avatar?.userData) return;
  const { lLeg, rLeg, lArm, rArm, gun } = avatar.userData;
  const seatMode = seated === true ? 'heli' : seated;

  // Under canopy — arms up on risers, soft leg sway
  if (seatMode === 'chute') {
    avatar.scale.set(1, 1, 1);
    if (avatar.rotation.x < -0.5) {
      avatar.rotation.x = 0;
      avatar.rotation.z = 0;
    }
    const sway = Math.sin(t * 1.6) * 0.06;
    if (lLeg && rLeg) {
      lLeg.rotation.x = 0.35 + sway;
      rLeg.rotation.x = 0.4 - sway;
      lLeg.rotation.z = 0.08;
      rLeg.rotation.z = -0.08;
    }
    if (lArm && rArm) {
      // Reach up toward suspension lines
      lArm.rotation.x = -2.35 + sway * 0.3;
      rArm.rotation.x = -2.4 - sway * 0.3;
      lArm.rotation.z = -0.35;
      rArm.rotation.z = 0.35;
      lArm.rotation.y = 0.15;
      rArm.rotation.y = -0.15;
    }
    if (gun) gun.visible = false;
    return;
  }

  // Prone / permanently dead — flat on the ground
  if (seatMode === 'downed' || seatMode === 'dead') {
    avatar.scale.set(1, 1, 1);
    avatar.rotation.x = -Math.PI / 2;
    avatar.rotation.z = seatMode === 'dead' ? 0.15 : 0.05;
    if (lLeg && rLeg) {
      lLeg.rotation.x = 0.15;
      rLeg.rotation.x = -0.1;
      lLeg.rotation.z = 0.2;
      rLeg.rotation.z = -0.15;
    }
    if (lArm && rArm) {
      lArm.rotation.x = 0.4;
      rArm.rotation.x = 0.55;
      lArm.rotation.z = -0.5;
      rArm.rotation.z = 0.35;
    }
    if (gun) gun.visible = false;
    return;
  }
  // Clear prone tilt when not downed
  if (avatar.rotation.x < -0.5) {
    avatar.rotation.x = 0;
    avatar.rotation.z = 0;
  }

  if (seatMode === 'heli' || seatMode === 'moto') {
    // Strapped into vehicle — compact seated scale so helmet clears the cabin roof / rotors.
    // Standing head ~1.72; *0.62 ≈ 1.07 → with hip y≈0.28 head ~1.35 (cabin roof ~1.8).
    const sy = seatMode === 'heli' ? 0.62 : 0.78;
    avatar.scale.set(0.95, sy, 0.95);
    if (lLeg && rLeg) {
      if (seatMode === 'heli') {
        lLeg.rotation.x = 1.35;
        rLeg.rotation.x = 1.35;
        lLeg.rotation.z = 0.1;
        rLeg.rotation.z = -0.1;
      } else {
        lLeg.rotation.x = 0.95;
        rLeg.rotation.x = 0.95;
        lLeg.rotation.z = 0.2;
        rLeg.rotation.z = -0.2;
      }
    }
    if (lArm && rArm) {
      lArm.rotation.x = 0.95;
      rArm.rotation.x = 1.0;
      lArm.rotation.z = -0.3;
      rArm.rotation.z = 0.3;
    }
    if (gun) gun.visible = false;
    // Hide tall helmet bits while seated (NVG mount sticks into the rotor disc)
    for (const p of avatar.userData.heliHideParts || []) {
      if (p) p.visible = seatMode !== 'heli';
    }
    avatar.traverse((o) => {
      if (o.isMesh && o.userData?.heliHide) o.visible = seatMode !== 'heli';
    });
    return;
  }

  if (gun) gun.visible = true;
  for (const p of avatar.userData.heliHideParts || []) {
    if (p) p.visible = true;
  }
  avatar.traverse((o) => {
    if (o.isMesh && o.userData?.heliHide) o.visible = true;
  });
  const moving = speed > 0.35;
  const phase = moving ? t * Math.min(10, 4 + speed * 1.2) : t * 1.5;
  const amp = moving ? Math.min(0.55, 0.25 + speed * 0.06) : 0.04;

  if (lLeg && rLeg) {
    lLeg.rotation.x = Math.sin(phase) * amp;
    rLeg.rotation.x = Math.sin(phase + Math.PI) * amp;
    lLeg.rotation.z = 0;
    rLeg.rotation.z = 0;
  }
  if (lArm && rArm) {
    const baseX = crouched ? 0.75 : 0.55;
    const swing = moving ? Math.sin(phase + Math.PI) * amp * 0.45 : Math.sin(phase) * 0.03;
    lArm.rotation.x = baseX + swing;
    rArm.rotation.x = baseX - swing;
    lArm.rotation.z = -0.08;
    rArm.rotation.z = 0.08;
  }
  if (crouched) {
    avatar.scale.set(1, 0.72, 1);
  } else {
    avatar.scale.set(1, 1, 1);
  }
}

/**
 * Blend hands between hip grip and ADS grip. Parent is the weapon viewGroup.
 */
export function animateFpArms(arms, t, ads = 0, kick = 0) {
  if (!arms?.userData?.left || !arms?.userData?.right) return;
  const { left, right, hip, ads: adsPose } = arms.userData;
  const a = THREE.MathUtils.clamp(ads, 0, 1);
  const sm = a * a * (3 - 2 * a); // smoothstep

  // Stay locked to gun origin (parented); only micro kick
  arms.position.set(0, -kick * 0.004, kick * 0.01);
  arms.rotation.set(0, 0, 0);
  arms.scale.setScalar(1);

  const blendHand = (hand, from, to) => {
    hand.position.lerpVectors(from.p, to.p, sm);
    hand.rotation.x = THREE.MathUtils.lerp(from.r.x, to.r.x, sm);
    hand.rotation.y = THREE.MathUtils.lerp(from.r.y, to.r.y, sm);
    hand.rotation.z = THREE.MathUtils.lerp(from.r.z, to.r.z, sm);
  };
  blendHand(right, hip.right, adsPose.right);
  blendHand(left, hip.left, adsPose.left);

  // Tiny idle breathe on hip only
  if (sm < 0.95) {
    const wob = Math.sin(t * 1.8) * 0.003 * (1 - sm);
    right.position.y += wob;
    left.position.y += wob * 0.8;
  }
}
