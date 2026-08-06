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
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.01, 5);
    this.camera.position.set(0, 0, 0);

    // Bright local lighting so guns always read
    const key = new THREE.DirectionalLight(0xfff2e0, 2.2);
    key.position.set(0.4, 0.8, 0.6);
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xa0c8ff, 0.9);
    fill.position.set(-0.6, 0.2, 0.4);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.6);
    rim.position.set(0.2, -0.3, -0.8);
    this.scene.add(rim);

    const ambient = new THREE.AmbientLight(0x8899aa, 0.55);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xd0e8ff, 0x3a2a18, 0.45);
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
