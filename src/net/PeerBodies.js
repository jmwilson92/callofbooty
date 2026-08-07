import * as THREE from 'three';
import { buildWorldAvatar, animateAvatar } from '../player/Avatar.js';

/**
 * Renders remote party members as humanoid bodies in the world.
 * Interpolates sparse party state (20 Hz) for smooth motion.
 * When a peer is in a vehicle, snaps them to that airframe's seat pose
 * so they don't float free while the shared heli moves.
 */
export class PeerBodies {
  /**
   * @param {THREE.Scene} scene
   * @param {import('./Party.js').PartyClient} party
   * @param {import('../world/Vehicles.js').VehicleSystem|null} [vehicles]
   */
  constructor(scene, party, vehicles = null) {
    this.scene = scene;
    this.party = party;
    this.vehicles = vehicles;
    this.group = new THREE.Group();
    this.group.name = 'peerBodies';
    this.scene.add(this.group);

    /** @type {Map<string, object>} */
    this._avatars = new Map();
    this._t = 0;
    this._colors = [0x3a8fd4, 0x4ec99a, 0xe0b040, 0xd46ad4, 0x6ab0e0, 0xe08060];
  }

  /** @param {import('../world/Vehicles.js').VehicleSystem|null} vehicles */
  setVehicles(vehicles) {
    this.vehicles = vehicles;
  }

  /**
   * @param {number} dt
   */
  update(dt) {
    this._t += dt;
    const live = new Set();

    for (const [id, p] of this.party.peers) {
      // Need at least one position sample (or a vehicle seat)
      const inVeh = !!(p.heliId && p.seat && this.vehicles);
      if (p.x == null && p.z == null && !inVeh) continue;
      live.add(id);

      let av = this._avatars.get(id);
      if (!av) {
        const color = this._colors[this._hash(id) % this._colors.length];
        const mesh = buildWorldAvatar({
          color,
          name: p.name || 'Friend',
          ally: true,
          nameColor: '#7fd4ff',
        });
        this.group.add(mesh);
        av = {
          mesh,
          x: p.x ?? 0,
          y: p.y ?? 0,
          z: p.z ?? 0,
          yaw: p.yaw ?? 0,
          tx: p.x ?? 0,
          ty: p.y ?? 0,
          tz: p.z ?? 0,
          tyaw: p.yaw ?? 0,
          speed: 0,
          name: p.name || 'Friend',
          seat: null,
          heliId: null,
        };
        this._avatars.set(id, av);
      }

      // Prefer shared vehicle seat pose over raw network feet position
      let seated = false;
      if (inVeh) {
        const pose = this.vehicles.getSeatWorldPoseForId(p.heliId, p.seat);
        if (pose) {
          av.tx = pose.x;
          av.ty = pose.y;
          av.tz = pose.z;
          av.tyaw = pose.yaw;
          av.seat = p.seat;
          av.heliId = p.heliId;
          seated = true;
        }
      }
      if (!seated) {
        if (p.x != null) {
          av.tx = p.x;
          av.ty = p.y ?? av.ty;
          av.tz = p.z;
          av.tyaw = p.yaw ?? av.tyaw;
        }
        av.seat = null;
        av.heliId = null;
      }

      if (p.name && p.name !== av.name) {
        av.name = p.name;
        av.mesh.userData.setName?.(p.name);
      }

      // Smooth toward target (snappier when seated so they stick to the bird)
      const rate = seated ? 22 : 12;
      const k = 1 - Math.exp(-rate * dt);
      const prevX = av.x;
      const prevZ = av.z;
      av.x += (av.tx - av.x) * k;
      av.y += (av.ty - av.y) * k;
      av.z += (av.tz - av.z) * k;
      av.yaw = this._lerpAngle(av.yaw, av.tyaw, k);

      // Hard snap if still far while seated (avoids lag ghost behind heli)
      if (seated) {
        const err = Math.hypot(av.tx - av.x, av.ty - av.y, av.tz - av.z);
        if (err > 2.5) {
          av.x = av.tx;
          av.y = av.ty;
          av.z = av.tz;
          av.yaw = av.tyaw;
        }
      }

      const dx = av.x - prevX;
      const dz = av.z - prevZ;
      const instSpeed = Math.hypot(dx, dz) / Math.max(1e-4, dt);
      av.speed = av.speed * 0.85 + instSpeed * 0.15;

      av.mesh.position.set(av.x, av.y, av.z);
      av.mesh.rotation.y = av.yaw;
      av.mesh.visible = true;

      if (seated) {
        const mode = (this.vehicles?.getById?.(p.heliId)?.type === 'motorcycle') ? 'moto' : 'heli';
        if (av.mesh.userData.gun) av.mesh.userData.gun.visible = false;
        animateAvatar(av.mesh, this._t + this._hash(id) * 0.1, 0, false, mode);
      } else {
        if (av.mesh.userData.gun) av.mesh.userData.gun.visible = true;
        animateAvatar(av.mesh, this._t + this._hash(id) * 0.1, av.speed, false);
      }
    }

    // Remove peers who left
    for (const [id, av] of this._avatars) {
      if (live.has(id)) continue;
      this.group.remove(av.mesh);
      av.mesh.traverse((o) => {
        if (o.isMesh) {
          o.geometry?.dispose?.();
          if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose?.());
          else o.material?.dispose?.();
        }
        if (o.isSprite) {
          o.material?.map?.dispose?.();
          o.material?.dispose?.();
        }
      });
      this._avatars.delete(id);
    }
  }

  getTargets() {
    const out = [];
    for (const [id, av] of this._avatars) {
      out.push({
        id,
        x: av.x,
        y: av.y,
        z: av.z,
        name: av.name,
        mesh: av.mesh,
        friendly: true,
      });
    }
    return out;
  }

  _hash(id) {
    let h = 0;
    const s = String(id);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  _lerpAngle(a, b, t) {
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  }

  dispose() {
    for (const [, av] of this._avatars) {
      this.group.remove(av.mesh);
    }
    this._avatars.clear();
    this.scene.remove(this.group);
  }
}
