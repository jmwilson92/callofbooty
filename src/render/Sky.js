import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { WORLD, RENDER } from '../config.js';

// Atmospheric sky, and the environment light that comes off it.
//
// The scene background used to be a flat colour, which costs you twice. It
// looks like a flat colour, and — less obviously — it means there is nothing
// for the standard materials to reflect. Every material in this world is
// MeshStandardMaterial with a metalness value, and metalness without an
// environment map is just... darker. Glass in particular had a `metalness: 0.4`
// that was doing nothing at all.
//
// So the sky is generated physically (Rayleigh + Mie scattering from a sun
// direction), used as the background, and then pre-filtered into an environment
// map that lights every material in the scene. That single change is most of
// the difference between "flat shaded boxes" and "objects sitting in daylight".

/** Sun direction from the config's elevation/azimuth, as a unit vector. */
export function sunDirection() {
  const el = (WORLD.SUN_ELEVATION_DEG * Math.PI) / 180;
  const az = (WORLD.SUN_AZIMUTH_DEG * Math.PI) / 180;
  return new THREE.Vector3(
    Math.cos(el) * Math.sin(az),
    Math.sin(el),
    Math.cos(el) * Math.cos(az)
  ).normalize();
}

/**
 * Add the sky dome and generate the scene environment from it.
 *
 * @returns {{ sky: Sky, env: THREE.Texture, dispose: () => void }}
 */
export function setupSky(renderer, scene, opts = {}) {
  const sky = new Sky();
  // Big enough to sit outside the far plane at any view distance we use
  sky.scale.setScalar(45000);
  sky.name = 'sky';

  const u = sky.material.uniforms;
  // Coastal southern California at mid-morning: clean air, strong sun, the
  // slightly hazy horizon you get off the Pacific.
  u.turbidity.value = opts.turbidity ?? RENDER.SKY_TURBIDITY;
  u.rayleigh.value = opts.rayleigh ?? RENDER.SKY_RAYLEIGH;
  u.mieCoefficient.value = opts.mieCoefficient ?? RENDER.SKY_MIE;
  u.mieDirectionalG.value = opts.mieDirectionalG ?? RENDER.SKY_MIE_G;
  u.sunPosition.value.copy(sunDirection());

  scene.add(sky);

  // Pre-filter the sky into a mip-chained environment map. This is what gives
  // every metalness/roughness pair something to actually reflect.
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const target = pmrem.fromScene(sky, 0.04);
  scene.environment = target.texture;
  scene.environmentIntensity = opts.envIntensity ?? RENDER.ENV_INTENSITY;
  // The dome draws the sky, so the clear colour never shows; keep it matched
  // anyway so a frame before the dome renders does not flash.
  scene.background = null;
  pmrem.dispose();

  return {
    sky,
    env: target.texture,
    dispose() {
      target.dispose();
      sky.material.dispose();
      sky.geometry.dispose();
    },
  };
}
