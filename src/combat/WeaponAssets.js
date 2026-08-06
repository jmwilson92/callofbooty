import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Loads Imagine→Blender weapon GLBs for FPS viewmodels.
 * Catalog: /assets/weapons_catalog.json keyed by weapon class
 * (ar, smg, lmg, sniper, dmr, shotgun, pistol).
 */

const loader = new GLTFLoader();

/** Per-class pose so Sight sits near origin for ADS. */
export const VM_POSE = {
  ar:      { scale: 1.0,  offset: new THREE.Vector3(0, -0.04, 0.06) },
  smg:     { scale: 1.05, offset: new THREE.Vector3(0, -0.03, 0.05) },
  lmg:     { scale: 0.95, offset: new THREE.Vector3(0, -0.04, 0.06) },
  sniper:  { scale: 0.95, offset: new THREE.Vector3(0, -0.05, 0.08) },
  dmr:     { scale: 1.0,  offset: new THREE.Vector3(0, -0.04, 0.06) },
  shotgun: { scale: 1.0,  offset: new THREE.Vector3(0, -0.03, 0.05) },
  pistol:  { scale: 1.15, offset: new THREE.Vector3(0, -0.02, 0.04) },
};

/**
 * @returns {Promise<{ byClass: Record<string, THREE.Object3D>, catalog: object }>}
 */
export async function loadWeaponLibrary(catalogUrl = '/assets/weapons_catalog.json') {
  const byClass = {};
  let catalog = { weapons: {} };
  try {
    const res = await fetch(catalogUrl);
    if (!res.ok) {
      console.warn('[weapons] catalog missing', catalogUrl);
      return { byClass, catalog };
    }
    catalog = await res.json();
  } catch (e) {
    console.warn('[weapons] catalog fetch failed', e);
    return { byClass, catalog };
  }

  const entries = Object.entries(catalog.weapons || {});
  await Promise.all(entries.map(async ([cls, def]) => {
    const url = '/' + String(def.glb || '').replace(/^\/?/, '');
    try {
      const gltf = await loader.loadAsync(url);
      const root = gltf.scene;
      root.traverse((o) => {
        if (o.isMesh) {
          o.frustumCulled = false;
          o.renderOrder = 999;
          o.castShadow = false;
          o.receiveShadow = false;
          // Boost metal/rough if missing
          if (o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            for (const m of mats) {
              if (m.isMeshStandardMaterial) {
                m.envMapIntensity = 0.8;
                m.needsUpdate = true;
              }
            }
          }
        }
        // Empties stay as Object3D
        o.frustumCulled = false;
      });
      byClass[cls] = root;
    } catch (e) {
      console.warn(`[weapons] failed to load ${cls}`, e.message || e);
    }
  }));

  console.info(`[weapons] loaded ${Object.keys(byClass).length}/${entries.length} viewmodel GLBs`);
  return { byClass, catalog };
}

/** Map weapon def.class → catalog key (dmr uses dmr model). */
export function classToModelKey(cls) {
  if (cls === 'ar') return 'ar';
  if (cls === 'smg') return 'smg';
  if (cls === 'lmg') return 'lmg';
  if (cls === 'sniper') return 'sniper';
  if (cls === 'dmr') return 'dmr';
  if (cls === 'shotgun') return 'shotgun';
  if (cls === 'pistol') return 'pistol';
  return 'ar';
}
