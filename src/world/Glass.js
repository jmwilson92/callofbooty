import * as THREE from 'three';

// Breakable window panes: collision boxes tagged 'glass' with optional
// InstancedMesh instance refs. Shooting disables collision + hides the pane.

const _dummy = new THREE.Object3D();

/** Known glass palette (Catalog C.glass / glassDark + BuildingKit panes). */
export const GLASS_COLORS = new Set([
  0x6ab0d0,
  0x3a5a70,
  0x88c8e8,
  0x4a7088,
]);

export function isGlassColor(color) {
  return GLASS_COLORS.has(color & 0xffffff);
}

/**
 * Shatter a glass collision box: open the hole for movement + bullets,
 * and zero the instanced visual if linked.
 * @returns {boolean} true if something broke
 */
export function breakGlassBox(box, effects = null, point = null) {
  if (!box || box.tag !== 'glass' || box.disabled) return false;
  box.disabled = true;

  const ud = box.userData;
  if (ud?.mesh != null && ud.instanceId != null) {
    _dummy.position.set(0, -9999, 0);
    _dummy.scale.set(0, 0, 0);
    _dummy.updateMatrix();
    ud.mesh.setMatrixAt(ud.instanceId, _dummy.matrix);
    ud.mesh.instanceMatrix.needsUpdate = true;
  }

  if (effects?.spawnGlassBreak && point) {
    effects.spawnGlassBreak(point);
  } else if (effects?.spawnImpact && point) {
    effects.spawnImpact(point, 'glass');
  }
  return true;
}
