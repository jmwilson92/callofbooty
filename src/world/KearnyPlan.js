import { POIS } from '../config.js';

// Kearny Mesa: San Diego's flat-topped commercial mesa. Big-box retail and the
// dealership row cluster on the two freeway-adjacent quadrants (which is where
// they really are); six residential tracts spread over the rest of the mesa top.
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

  // Four more tracts on mesa the district was not using. The flat top runs well
  // past the original four quadrants — north of z −560 the ground is 35–55 m with
  // no freeway on it at all, and the shelf east of x 350 is nearly as clear — so
  // the suburb spreads onto it the way Clairemont and Mira Mesa really do.
  const tractC = { id: 'tractC', x: a.x - 190, z: a.z - 330, w: 140, d: 150 };
  const tractD = { id: 'tractD', x: a.x + 55, z: a.z - 330, w: 145, d: 150 };
  const tractE = { id: 'tractE', x: a.x + 210, z: a.z - 200, w: 120, d: 160 };
  // Fills the 105 m of bare mesa between C and D so the north reads as one
  // continuous suburb rather than two estates with a field between them.
  const tractF = { id: 'tractF', x: a.x - 45, z: a.z - 330, w: 95, d: 150 };

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

  // Neighbourhood collector tying the north tracts down to the original pair,
  // so the new blocks connect to the district instead of sitting beside it.
  const linkX = a.x - 190 + 70;
  const link = {
    id: 'kearny-link',
    width: 10,
    blend: 4,
    kind: 'street',
    pts: [
      { x: linkX, z: tractC.z + 6 },
      { x: linkX, z: tractA.z + tractA.d - 6 },
    ],
  };
  const linkE = {
    id: 'kearny-link-e',
    width: 10,
    blend: 4,
    kind: 'street',
    pts: [
      { x: tractB.x + tractB.w * 0.5, z: tractD.z + 6 },
      { x: tractE.x + tractE.w * 0.5, z: tractE.z + 20 },
    ],
  };

  const tracts = [tractA, tractB, tractC, tractD, tractE, tractF];

  return {
    cx: a.x,
    cz: a.z,
    tracts,
    retail,
    business,
    rows,
    streetW: STREET_W,
    streets: [
      ...tracts.flatMap(tractStreets),
      ...spine(retail, 'retail'),
      ...spine(business, 'business'),
      link,
      linkE,
    ],
    bounds: {
      x0: tractA.x, z0: tractC.z,
      x1: tractE.x + tractE.w, z1: retail.z + retail.d,
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
