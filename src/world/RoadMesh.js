import * as THREE from 'three';
import { ROADS } from '../config.js';

// Road surfaces as their own geometry.
//
// Roads used to be drawn purely as vertex colours on the terrain mesh, which is
// one vertex per 4 m cell — and `roadAt()` is a nearest-cell lookup, so the
// asphalt was quantised to 4 m squares and then linearly smeared across each
// triangle. That is the "pixelated / lumpy square blobs" look: a 9 m street
// painted on a 4 m grid can only ever be two or three cells wide, with edges
// that stagger a whole cell at a time.
//
// The fix is to stop asking the heightfield to draw the road at all. The
// heightfield still *grades* the corridor — the ground has to be level under a
// road, and collision comes from the heightfield — but the visible surface is a
// ribbon built along the actual polyline at whatever resolution we like, laid a
// few centimetres proud of the graded ground. Edges are then exact, straight
// where the road is straight, and independent of WORLD.CELL.

const ASPHALT = 0x2e3033;
const ASPHALT_WORN = 0x35383c;
const SHOULDER = 0x54514a;
const LANE = 0xd8d4c4;

/** Sample step along a polyline. Short enough to follow terrain undulation. */
const STEP = 2.5;
/** Lift above the graded ground, enough to beat z-fighting at draw distance. */
const LIFT = 0.07;

function pushQuad(pos, col, nrm, a, b, c, d, colour) {
  // Two triangles, flat-shaded upward — roads are ground, so the normal is up
  for (const v of [a, b, c, a, c, d]) {
    pos.push(v[0], v[1], v[2]);
    nrm.push(0, 1, 0);
    col.push(colour.r, colour.g, colour.b);
  }
}

/**
 * Ribbon one polyline. Walks the line in fixed steps, offsets left and right by
 * the half width, and seats every sample on the graded terrain, so the surface
 * follows the ground the road pass already levelled.
 */
function ribbon(terrain, pts, halfW, pos, col, nrm, colour, lift) {
  for (let s = 0; s < pts.length - 1; s++) {
    const a = pts[s];
    const b = pts[s + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    if (len < 0.01) continue;
    // Perpendicular in the ground plane
    const px = -dz / len;
    const pz = dx / len;
    const steps = Math.max(1, Math.round(len / STEP));

    let prevL = null;
    let prevR = null;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const cx = a.x + dx * t;
      const cz = a.z + dz * t;
      const lx = cx + px * halfW;
      const lz = cz + pz * halfW;
      const rx = cx - px * halfW;
      const rz = cz - pz * halfW;
      // Seat each edge on its own ground height so the ribbon does not float on
      // a cambered corridor or cut into the shoulder on a side slope.
      const ly = terrain.heightAt(lx, lz) + lift;
      const ry = terrain.heightAt(rx, rz) + lift;
      const L = [lx, ly, lz];
      const R = [rx, ry, rz];
      if (prevL) pushQuad(pos, col, nrm, prevL, L, R, prevR, colour);
      prevL = L;
      prevR = R;
    }
  }
}

/** Dashed centre line down a polyline. */
function centreLine(terrain, pts, pos, col, nrm, colour, halfW) {
  const dashOn = 4.5;
  const dashOff = 5.5;
  let carry = 0;
  for (let s = 0; s < pts.length - 1; s++) {
    const a = pts[s];
    const b = pts[s + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    if (len < 0.01) continue;
    const px = -dz / len;
    const pz = dx / len;
    let d = 0;
    while (d < len) {
      const on = carry > 0 ? Math.min(carry, len - d) : Math.min(dashOn, len - d);
      if (carry > 0) carry -= on;
      const t0 = d / len;
      const t1 = (d + on) / len;
      const x0 = a.x + dx * t0;
      const z0 = a.z + dz * t0;
      const x1 = a.x + dx * t1;
      const z1 = a.z + dz * t1;
      const hw = 0.22;
      const A = [x0 + px * hw, terrain.heightAt(x0, z0) + LIFT + 0.02, z0 + pz * hw];
      const B = [x1 + px * hw, terrain.heightAt(x1, z1) + LIFT + 0.02, z1 + pz * hw];
      const Cc = [x1 - px * hw, terrain.heightAt(x1, z1) + LIFT + 0.02, z1 - pz * hw];
      const D = [x0 - px * hw, terrain.heightAt(x0, z0) + LIFT + 0.02, z0 - pz * hw];
      pushQuad(pos, col, nrm, A, B, Cc, D, colour);
      d += on;
      if (d >= len) { carry = 0; break; }
      const off = Math.min(dashOff, len - d);
      d += off;
      if (off < dashOff) carry = 0;
    }
    void halfW;
  }
}

/**
 * Build one mesh carrying every road surface in the world.
 *
 * @param {import('./Terrain.js').Terrain} terrain
 * @param {Array} roadLines  polylines from buildRoadPolylines()
 */
export function buildRoadMesh(terrain, roadLines) {
  const pos = [];
  const col = [];
  const nrm = [];
  const asphalt = new THREE.Color(ASPHALT);
  const worn = new THREE.Color(ASPHALT_WORN);
  const shoulder = new THREE.Color(SHOULDER);
  const lane = new THREE.Color(LANE);

  for (const line of roadLines || []) {
    const pts = line.pts;
    if (!pts || pts.length < 2) continue;
    const w = line.width ?? ROADS.ARTERIAL_WIDTH ?? 10;
    const isFreeway = line.kind !== 'street';

    // Graded shoulder just outside the carriageway, so the asphalt does not end
    // on raw grass with a hard colour step.
    ribbon(terrain, pts, w * 0.5 + 1.8, pos, col, nrm, shoulder, LIFT - 0.02);
    ribbon(terrain, pts, w * 0.5, pos, col, nrm, isFreeway ? asphalt : worn, LIFT);
    if (isFreeway && w >= 9) centreLine(terrain, pts, pos, col, nrm, lane, w * 0.5);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeBoundingSphere();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    // Asphalt: rough, faintly damp-looking, never shiny. Standard rather than
    // Lambert so it responds to the scene environment like everything else.
    roughness: 0.86,
    metalness: 0.0,
    // Roads sit millimetres above the terrain they were graded into; the offset
    // keeps them from fighting it at grazing angles across the whole map.
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'roadSurfaces';
  mesh.receiveShadow = true;
  mesh.frustumCulled = true;
  return mesh;
}
