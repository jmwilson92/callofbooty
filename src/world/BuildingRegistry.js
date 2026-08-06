// Floors / footprints registered while buildings are generated.
// Used for interior pelican-case loot placement.

export const worldBuildings = [];

export function clearBuildingRegistry() {
  worldBuildings.length = 0;
}

/**
 * @param {{ x:number, z:number, w:number, d:number, floors:number, baseY:number, floorYs?: number[] }} b
 * floorYs[i] = absolute Y of floor slab top for floor i (0 = ground)
 */
export function registerBuilding(b) {
  if (!b || b.w < 4 || b.d < 4) return;
  worldBuildings.push(b);
}
