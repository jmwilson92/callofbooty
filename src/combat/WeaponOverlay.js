import * as THREE from 'three';

/**
 * Separate scene + camera for FPS viewmodel.
 * Renders on top of the world after clearing depth so the gun is never
 * clipped by walls/terrain and is always visible.
 */
export class WeaponOverlay {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.01, 5);
    this.camera.position.set(0, 0, 0);

    // Soft key/fill so slim barrels and thin sights still catch light
    const key = new THREE.DirectionalLight(0xfff4e8, 2.6);
    key.position.set(0.5, 1.0, 0.7);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0x90b8e8, 1.0);
    fill.position.set(-0.7, 0.3, 0.5);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.85);
    rim.position.set(0.15, -0.2, -1.0);
    this.scene.add(rim);

    const ambient = new THREE.AmbientLight(0x9aa8b8, 0.6);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xd8ecff, 0x3a2a18, 0.5);
    this.scene.add(hemi);

    this.root = new THREE.Group();
    this.root.name = 'weaponOverlayRoot';
    this.scene.add(this.root);

    this._aspect = 1;
  }

  setAspect(aspect) {
    this._aspect = aspect;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  /** Parent for viewmodel meshes */
  get mount() {
    return this.root;
  }

  /**
   * Call after world render. Clears depth, draws weapon scene only.
   */
  render() {
    const r = this.renderer;
    const prevAuto = r.autoClear;
    r.autoClear = false;
    r.clearDepth();
    r.render(this.scene, this.camera);
    r.autoClear = prevAuto;
  }
}
