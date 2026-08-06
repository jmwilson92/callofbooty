import * as THREE from 'three';
import { COMBAT } from '../config.js';

// Static humanoid targets for the test range and world props.

function boxPart(name, cx, cy, cz, sx, sy, sz) {
  return {
    name,
    min: new THREE.Vector3(cx - sx / 2, cy - sy / 2, cz - sz / 2),
    max: new THREE.Vector3(cx + sx / 2, cy + sy / 2, cz + sz / 2),
    cx, cy, cz, sx, sy, sz,
  };
}

/**
 * Build hitboxes relative to feet at (x, z) with ground y.
 * Axis-aligned — use fat volumes so rotated meshes still register.
 */
export function makeHumanoidParts(x, feetY, z) {
  const eye = feetY + 1.68;
  return [
    boxPart('head', x, eye, z, 0.4, 0.4, 0.4),
    boxPart('chest', x, feetY + 1.25, z, 0.58, 0.6, 0.5),
    boxPart('abdomen', x, feetY + 0.85, z, 0.52, 0.45, 0.45),
    boxPart('arm', x - 0.32, feetY + 1.2, z, 0.28, 0.65, 0.35),
    boxPart('arm', x + 0.32, feetY + 1.2, z, 0.28, 0.65, 0.35),
    boxPart('leg', x - 0.14, feetY + 0.42, z, 0.28, 0.85, 0.35),
    boxPart('leg', x + 0.14, feetY + 0.42, z, 0.28, 0.85, 0.35),
  ];
}

/**
 * Bot hitboxes — fewer, fatter AABBs so yaw doesn't create misses.
 * Covers plate carrier + limbs regardless of facing.
 */
export function makeBotParts(x, feetY, z) {
  return [
    boxPart('head', x, feetY + 1.72, z, 0.45, 0.42, 0.45),
    // Full torso volume (wide in XZ so side-on shots still hit)
    boxPart('chest', x, feetY + 1.22, z, 0.75, 0.75, 0.75),
    // Legs as one lower mass
    boxPart('leg', x, feetY + 0.45, z, 0.6, 0.95, 0.6),
  ];
}

export function createTargetMesh(parts, color = 0xc44a3a) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.75 });
  const headMat = new THREE.MeshStandardMaterial({ color: 0xd4a070, roughness: 0.7 });
  for (const p of parts) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(p.sx, p.sy, p.sz),
      p.name === 'head' ? headMat : mat
    );
    m.position.set(p.cx, p.cy, p.cz);
    m.castShadow = true;
    g.add(m);
  }
  return g;
}

export class TargetRange {
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;
    this.targets = [];
    this.group = new THREE.Group();
    this.group.name = 'testRange';
    this.scene.add(this.group);
    this.active = false;
    this.stats = { shots: 0, hits: 0, damage: 0, headshots: 0 };
  }

  toggle(playerPos) {
    if (this.active) this.clear();
    else this.spawn(playerPos);
    return this.active;
  }

  clear() {
    this.active = false;
    while (this.group.children.length) this.group.remove(this.group.children[0]);
    this.targets.length = 0;
    this.stats = { shots: 0, hits: 0, damage: 0, headshots: 0 };
  }

  spawn(playerPos) {
    this.clear();
    this.active = true;
    // 12 targets 5–200 m forward of player
    const ranges = [5, 10, 15, 20, 30, 45, 60, 80, 100, 130, 160, 200];
    const yaw = 0; // world +Z forward-ish from spawn; offset from player
    // Place along +X from player for readability
    const baseX = playerPos.x;
    const baseZ = playerPos.z;
    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i];
      const x = baseX + 8 + (i % 3) * 4;
      const z = baseZ - r; // toward -Z (north-ish on our map)
      const y = this.terrain.heightAt(x, z);
      const parts = makeHumanoidParts(x, y, z);
      const mesh = createTargetMesh(parts, i % 2 === 0 ? 0xc44a3a : 0x3a6ac4);
      this.group.add(mesh);
      this.targets.push({
        id: i,
        range: r,
        x, y, z,
        parts,
        mesh,
        health: COMBAT.BASE_HEALTH,
        armor: 0,
        dead: false,
        maxHealth: COMBAT.BASE_HEALTH,
      });
    }
  }

  applyDamage(target, dmg, part) {
    if (target.dead) return { killed: false, applied: 0 };
    let remaining = dmg;
    if (target.armor > 0) {
      const absorbed = Math.min(target.armor, remaining);
      target.armor -= absorbed;
      remaining -= absorbed;
    }
    target.health -= remaining;
    this.stats.hits++;
    this.stats.damage += dmg;
    if (part === 'head') this.stats.headshots++;
    if (target.health <= 0) {
      target.health = 0;
      target.dead = true;
      // Darken mesh
      target.mesh.traverse((o) => {
        if (o.isMesh) o.material = o.material.clone(), o.material.color.setHex(0x333333);
      });
      return { killed: true, applied: dmg };
    }
    return { killed: false, applied: dmg };
  }

  getLiveTargets() {
    return this.targets;
  }
}
