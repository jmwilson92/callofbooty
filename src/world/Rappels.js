import * as THREE from 'three';
import { RAPPEL, WORLD } from '../config.js';
import { worldBuildings } from './BuildingRegistry.js';
import { worldLadders } from './Ladders.js';

/**
 * Roof rappel lines on tall buildings — grab the rope and hold W to zip up.
 * Visual cable + fast climb volume registered on worldLadders.
 */

function mulberry(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export class RappelSystem {
  /**
   * @param {THREE.Scene} scene
   * @param {import('./Terrain.js').Terrain} terrain
   */
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;
    this.group = new THREE.Group();
    this.group.name = 'rappels';
    this.scene.add(this.group);
    this.lines = [];
  }

  /** Place ropes after buildings are registered. */
  spawn(seed = WORLD.SEED ^ 0x2a11e1) {
    this.clear();
    const rng = mulberry(seed);
    const maxN = RAPPEL.MAX_COUNT ?? 28;
    const minF = RAPPEL.MIN_FLOORS ?? 5;
    const out = RAPPEL.FACADE_OUT ?? 0.55;
    const rad = RAPPEL.RADIUS ?? 0.55;
    const speed = RAPPEL.SPEED ?? 16;

    const candidates = (worldBuildings || [])
      .filter((b) => b.floors >= minF && b.w >= 8 && b.d >= 8)
      .map((b) => ({
        b,
        score: b.floors * 3 + b.w * 0.05 + rng() * 4,
      }))
      .sort((a, c) => c.score - a.score);

    let n = 0;
    const ropeMat = new THREE.MeshStandardMaterial({
      color: 0xc4a050,
      roughness: 0.55,
      metalness: 0.15,
    });
    const clampMat = new THREE.MeshStandardMaterial({
      color: 0x3a3a3e,
      roughness: 0.5,
      metalness: 0.55,
    });

    for (const { b } of candidates) {
      if (n >= maxN) break;
      // South facade center — clear of main entrance mid-door a bit offset
      const side = rng() > 0.5 ? 0.32 : 0.68;
      const x = b.x + b.w * side;
      const z = b.z - out;
      const bot = Math.max(
        this.terrain.heightAt(x, z) + 0.15,
        (b.baseY ?? this.terrain.heightAt(x, z)) - 0.05
      );
      const top = (b.roofY ?? (b.baseY + b.floors * 3.5)) + 0.2;
      if (top - bot < 12) continue;

      const h = top - bot;
      // Rope visual
      const rope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, h, 5),
        ropeMat
      );
      rope.position.set(x, bot + h * 0.5, z);
      rope.castShadow = true;
      this.group.add(rope);
      // Top clamp / roof anchor
      const clamp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.45), clampMat);
      clamp.position.set(x, top + 0.05, z + 0.15);
      this.group.add(clamp);
      // Bottom weight / stake
      const stake = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.35, 0.25), clampMat);
      stake.position.set(x, bot + 0.15, z);
      this.group.add(stake);
      // Glow tip so ropes read from far
      const tip = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.12, 0.18),
        new THREE.MeshStandardMaterial({
          color: 0xffc040,
          emissive: 0xaa6000,
          emissiveIntensity: 0.55,
        })
      );
      tip.position.set(x, bot + 1.2, z);
      this.group.add(tip);

      // Climb volume
      worldLadders.add(
        x - rad, bot, z - rad,
        x + rad, top + 0.4, z + rad,
        { speed, kind: 'rappel', topY: top, botY: bot }
      );

      this.lines.push({ x, z, bot, top });
      n++;
    }
    return n;
  }

  clear() {
    this.lines.length = 0;
    while (this.group.children.length) this.group.remove(this.group.children[0]);
  }

  /** Prompt when standing near a rope base or on the line. */
  prompt(px, py, pz) {
    const v = worldLadders.findAt(px, py + 0.8, pz, 0.55);
    if (v?.kind === 'rappel') {
      const nearTop = py > v.topY - 2.5;
      if (nearTop) return 'W / S · Rappel down';
      return 'W · Zip up rappel · S down';
    }
    // Near base (not yet in volume height)
    for (const line of this.lines) {
      if (Math.hypot(line.x - px, line.z - pz) < 1.4 && Math.abs(py - line.bot) < 2.2) {
        return 'W · Zip up rappel to roof';
      }
    }
    return null;
  }
}
