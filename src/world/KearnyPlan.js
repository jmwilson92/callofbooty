import { POIS } from '../config.js';

// Kearny Mesa: San Diego's flat-topped commercial mesa, split into quadrants by
// the I-15 and SR-52 corridors that cross at the anchor. Big-box retail and the
// dealership row cluster on the freeway-adjacent quadrants (which is where they
// really are), and the residential tracts sit on the two quiet ones.
//
// Roads.js paints the streets from this plan; structures/KearnyMesa.js fills the
// lots, so the two cannot drift.

function anchor() {
  const p = POIS.find((q) => q.id === 'kearnymesa');
  return { x: p?.x ?? 140, z: p?.z ?? -380 };
}

export function kearnyPlan() {
  const a = anchor();
  // Quadrants, kept clear of the two freeway corridors crossing the mesa.
  const tractA = { id: 'tractA', x: a.x - 190, z: a.z - 170, w: 140, d: 150 };
  const tractB = { id: 'tractB', x: a.x + 55, z: a.z - 170, w: 145, d: 150 };
  const retail = { id: 'retail', x: a.x - 190, z: a.z + 25, w: 140, d: 150 };
  const business = { id: 'business', x: a.x + 55, z: a.z + 25, w: 145, d: 150 };

  // Residential streets: a north-south collector with cross streets off it.
  const STREET_W = 8;
  const rows = 3;
  const tractStreets = (t) => {
    const out = [];
    const cx = t.x + t.w * 0.5;
    out.push({
      id: `${t.id}-collector`,
      width: 9,
      blend: 4,
      kind: 'street',
      pts: [{ x: cx, z: t.z + 6 }, { x: cx, z: t.z + t.d - 6 }],
    });
    for (let i = 0; i < rows; i++) {
      const z = t.z + 30 + i * ((t.d - 60) / (rows - 1));
      out.push({
        id: `${t.id}-cross-${i}`,
        width: STREET_W,
        blend: 4,
        kind: 'street',
        pts: [{ x: t.x + 8, z }, { x: t.x + t.w - 8, z }],
      });
    }
    // One cul-de-sac stub off the middle cross street
    const cz = t.z + 30 + ((t.d - 60) / (rows - 1));
    out.push({
      id: `${t.id}-culdesac`,
      width: 7,
      blend: 3,
      kind: 'street',
      pts: [{ x: t.x + 20, z: cz }, { x: t.x + 20, z: cz + 34 }],
    });
    return out;
  };

  // Commercial access spine. A frontage loop reads better on paper but its four
  // legs plus their blend swallowed the whole quadrant interior, leaving nowhere
  // to put a big box — so each commercial quadrant gets one road up the middle
  // and the lots hang off either side of it.
  const spine = (t, id) => ([{
    id: `${id}-spine`,
    width: 11,
    blend: 5,
    kind: 'street',
    pts: [
      { x: t.x + t.w * 0.5, z: t.z + 6 },
      { x: t.x + t.w * 0.5, z: t.z + t.d - 6 },
    ],
  }]);

  return {
    cx: a.x,
    cz: a.z,
    tracts: [tractA, tractB],
    retail,
    business,
    rows,
    streetW: STREET_W,
    streets: [
      ...tractStreets(tractA),
      ...tractStreets(tractB),
      ...spine(retail, 'retail'),
      ...spine(business, 'business'),
    ],
    bounds: {
      x0: tractA.x, z0: tractA.z,
      x1: tractB.x + tractB.w, z1: retail.z + retail.d,
    },
  };
}

/** District footprint, for road keep-out. */
export function kearnyBounds() {
  return kearnyPlan().bounds;
}

/** Street polylines for the heightfield pass. */
export function kearnyStreetLines() {
  return kearnyPlan().streets;
}

/** Parking aprons in front of the big boxes, stamped like any other lot. */
export function kearnyParkingLots() {
  const p = kearnyPlan();
  const r = p.retail;
  const b = p.business;
  // Aprons in front of each big box, either side of the access spine.
  return [
    { x: r.x + 6, z: r.z + 84, w: 46, d: 38 },
    { x: r.x + 84, z: r.z + 74, w: 48, d: 36 },
    { x: b.x + 6, z: b.z + 86, w: 46, d: 34 },
    { x: b.x + 88, z: b.z + 80, w: 48, d: 34 },
  ];
}
