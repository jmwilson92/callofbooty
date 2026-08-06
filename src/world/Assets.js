import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { WORLD } from '../config.js';

// Loads Imagine→Blender (or gen_props) GLBs and scatters them with AABB collision.

const loader = new GLTFLoader();

/**
 * Fetch catalog + all glbs. Returns { props: { name: { template, collision } } }
 */
export async function loadPropLibrary(catalogUrl = '/assets/catalog.json') {
  const res = await fetch(catalogUrl);
  if (!res.ok) {
    console.warn('[assets] catalog missing', catalogUrl);
    return { props: {} };
  }
  const catalog = await res.json();
  const props = {};
  const entries = Object.entries(catalog.props || {});
  await Promise.all(entries.map(async ([name, def]) => {
    const url = '/' + def.glb.replace(/^\/?/, '');
    try {
      const gltf = await loader.loadAsync(url);
      // Normalize: feet on y=0, share materials
      const root = gltf.scene;
      root.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      props[name] = {
        template: root,
        collision: def.collision || [1, 1, 1],
        ref: def.ref || null,
      };
    } catch (e) {
      console.warn(`[assets] failed to load ${name}`, e.message || e);
    }
  }));
  console.info(`[assets] loaded ${Object.keys(props).length}/${entries.length} prop models`);
  return { props, catalog };
}

/**
 * Scatter loaded prop models across dry land. Adds meshes to `scene` and
 * AABB collision boxes to `hash`.
 */
export function scatterAssetProps(scene, hash, terrain, rng, library, opts = {}) {
  const count = opts.count ?? 180;
  const names = Object.keys(library.props || {});
  if (!names.length) return { placed: 0 };

  const half = WORLD.SIZE / 2 - 50;
  let placed = 0;
  let attempts = 0;
  const maxAttempts = count * 40;
  const group = new THREE.Group();
  group.name = 'assetProps';

  while (placed < count && attempts < maxAttempts) {
    attempts++;
    const x = (rng() * 2 - 1) * half;
    const z = (rng() * 2 - 1) * half;
    const h = terrain.heightAt(x, z);
    if (h < 2.8) continue;
    if (terrain.slopeDegAt(x, z) > 22) continue;
    if (terrain.roadAt(x, z) > 0.3) continue;
    // Prefer urban-ish mid map
    if (Math.abs(x) > 520 || z < -550 || z > 600) continue;

    const name = names[Math.floor(rng() * names.length) % names.length];
    // Palms denser near coast
    const preferPalm = x < -200 && rng() > 0.4;
    const pick = preferPalm && library.props.palm_tree ? 'palm_tree' : name;
    const def = library.props[pick];
    if (!def) continue;

    const [sx, sy, sz] = def.collision;
    const yaw = (Math.floor(rng() * 4) * Math.PI) / 2;
    const inst = def.template.clone(true);
    inst.position.set(x, h - 0.02, z);
    inst.rotation.y = yaw;
    // Mild scale variation
    const s = 0.9 + rng() * 0.25;
    inst.scale.setScalar(s);
    group.add(inst);

    // Collision AABB (axis-aligned; yaw is quarter-turn so swap xz when needed)
    const rot90 = Math.abs(Math.sin(yaw)) > 0.5;
    const cx = rot90 ? sz * s : sx * s;
    const cz = rot90 ? sx * s : sz * s;
    const cy = sy * s;
    hash.add(
      new THREE.Vector3(x - cx / 2, h - 0.02, z - cz / 2),
      new THREE.Vector3(x + cx / 2, h - 0.02 + cy, z + cz / 2),
      'prop'
    );
    placed++;
  }

  scene.add(group);
  return { placed, attempts };
}
