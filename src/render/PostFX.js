import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RENDER } from '../config.js';

// Post-processing: ambient occlusion and tone mapping.
//
// Ambient occlusion is the single biggest visual win available to a world made
// of boxes. Without it every face is lit only by the sun and the sky, so a wall
// meeting a floor has no darkening in the corner and the two surfaces read as
// separate flat panels floating near each other. AO puts contact shading in
// every crease, and boxes start reading as solid mass with weight.
//
// GTAO (ground-truth AO) rather than SSAO — it is the newer of the two passes
// three ships, it handles thin geometry far better, which matters here because
// half this world is 0.1 m thin spans used as railings, wires and markings.

export class PostFX {
  /**
   * @param {THREE.WebGLRenderer} renderer
   * @param {THREE.Scene} scene
   * @param {THREE.Camera} camera
   */
  constructor(renderer, scene, camera, opts = {}) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    // Escape hatch. AO is the most expensive thing in the frame; `?fx=0` turns
    // the composer off and falls back to a straight render. That is also how the
    // screenshot tool captures — a software rasteriser cannot afford GTAO.
    let want = opts.enabled ?? RENDER.AO_ENABLED;
    try {
      const q = new URLSearchParams(location.search).get('fx');
      if (q === '0' || q === 'off') want = false;
    } catch { /* no location in a headless harness */ }
    this.enabled = want;

    const w = renderer.domElement.width;
    const h = renderer.domElement.height;

    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    // Radius is in world units. This world is metric and human-scaled, so ~1 m
    // catches wall/floor junctions, kerbs and window reveals without smearing
    // occlusion across a whole street.
    this.gtao = new GTAOPass(scene, camera, w, h, undefined, {
      radius: opts.aoRadius ?? RENDER.AO_RADIUS,
      distanceExponent: 1.6,
      thickness: 1.0,
      scale: opts.aoScale ?? 1.0,
      samples: opts.aoSamples ?? RENDER.AO_SAMPLES,
      screenSpaceRadius: false,
    });
    this.gtao.blendIntensity = opts.aoIntensity ?? RENDER.AO_INTENSITY;
    this.gtao.output = GTAOPass.OUTPUT.Default;
    this.composer.addPass(this.gtao);

    // OutputPass applies tone mapping and the output colour space, so the
    // renderer must not also do it or it happens twice.
    this.composer.addPass(new OutputPass());

    this.setSize(window.innerWidth, window.innerHeight);
  }

  setSize(width, height) {
    this.composer.setSize(width, height);
    const dpr = this.renderer.getPixelRatio();
    this.gtao.setSize(width * dpr, height * dpr);
  }

  /** Swap the camera the passes render from (free cam, spectator, etc.). */
  setCamera(camera) {
    this.camera = camera;
    for (const pass of this.composer.passes) {
      if (pass.camera) pass.camera = camera;
    }
  }

  setEnabled(on) {
    this.enabled = !!on;
  }

  render() {
    if (!this.enabled) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    this.composer.render();
  }
}
