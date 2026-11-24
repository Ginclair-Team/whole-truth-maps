/* Whole Truth Maps: Bengaluru - shared world layout. Single source of truth for roads, metro lines,
   lakes and flyovers, used by city.js (static art) and anim.js (moving sprites).
   Cells: i runs west-east (0..120), j runs north-south (0..96). District (row r, col c) spans
   i in [24(c-1), 24c), j in [24(r-1), 24r).
   Bengaluru has no river. The metro is the spine here, and the lakes are the water. */
(function (root) {
  'use strict';
  const PK = (root.PK = root.PK || {});
  const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));

  // Ground-level roads. axis 'i' = runs along i at rows [at, at+w); axis 'j' = runs along j at columns [at, at+w).
  const roads = [
    { id: 'chord', axis: 'j', at: 23, from: 0, to: 96, w: 2 },      // Chord Road / Kanakapura Road, Green Line above
    { id: 'ballari', axis: 'j', at: 47, from: 0, to: 96, w: 2 },    // Ballari Road / Bannerghatta Road, Pink Line above (south)
    { id: 'hosur', axis: 'j', at: 71, from: 0, to: 96, w: 2 },      // Hosur Road
    { id: 'orr', axis: 'j', at: 95, from: 0, to: 96, w: 2 },        // Outer Ring Road
    { id: 'cvraman', axis: 'i', at: 23, from: 0, to: 120, w: 2 },   // CV Raman Avenue / Jayamahal
    { id: 'mgroad', axis: 'i', at: 47, from: 0, to: 120, w: 2 },    // Mysuru Road / MG Road / Old Madras Road, Purple Line above
    { id: 'ringsouth', axis: 'i', at: 71, from: 0, to: 120, w: 2 }, // Marenahalli Road / Silk Board / Electronic City, Yellow Line above
  ];

  // Elevated metro decks, running down the median. Each has one or more [from, to] elevated runs.
  // c = [train body, stripe]. z = deck height in px.
  const metro = [
    { id: 'green', axis: 'j', at: 23.6, w: 0.8, z: 11, runs: [[0, 41], [53, 96]], c: ['#eef2ea', '#1f9d55'] },
    { id: 'purple', axis: 'i', at: 47.6, w: 0.8, z: 11, runs: [[0, 20], [62, 120]], c: ['#f0ecf4', '#7a3fa8'] },
    { id: 'yellow', axis: 'i', at: 71.6, w: 0.8, z: 11, runs: [[25, 120]], c: ['#f6f2e0', '#f0b81c'] },
    { id: 'pink', axis: 'j', at: 47.6, w: 0.8, z: 11, runs: [[74, 96]], c: ['#f8eef3', '#ef5f9e'] },
  ];
  // Station halls straddling the deck: [line id, position along the line]
  const stations = [['green', 10], ['green', 34], ['green', 62], ['green', 72.5], ['green', 86],
    ['purple', 9], ['purple', 82], ['purple', 102], ['yellow', 36], ['yellow', 72], ['yellow', 107], ['pink', 78], ['pink', 90]];

  // Hebbal flyover
  const hebbal = { i: 83, w: 1, j0: 2, j1: 21, deckZ: 8,
    z: (j) => (j < 2 || j > 21 ? 0 : j < 5 ? lerp(0, 8, (j - 2) / 3) : j > 18 ? lerp(8, 0, (j - 18) / 3) : 8) };

  // Lakes: unions of ellipses [ci, cj, ri, rj]
  const lakes = {
    sankey: [[31, 13, 4.4, 3]],
    hebbal: [[89.5, 13, 4.2, 5.2], [92, 9.5, 2.2, 2.6]],
    ulsoor: [[103.5, 36, 4.6, 6], [106.5, 33.5, 2.4, 2.6]],
    lalbagh: [[33, 66.5, 5.5, 2.2], [29, 65.6, 2.6, 1.8]],
    bellandur: [[83.5, 87, 9, 5.4], [77.5, 89.5, 3.6, 3.4], [90, 85, 3.2, 3.2]],
  };
  const inEll = (list, i, j) => list.some((e) => Math.pow((i - e[0]) / e[2], 2) + Math.pow((j - e[1]) / e[3], 2) <= 1);
  const inLake = (id, i, j) => inEll(lakes[id], i, j);
  const inAnyLake = (i, j) => Object.keys(lakes).some((k) => inEll(lakes[k], i, j));

  // Silk Board: everything slows to a crawl inside this circle. 1 = free flow.
  const jam = { i: 72, j: 72, r: 15, min: 0.06 };
  const flow = (i, j) => { const d = Math.hypot(i - jam.i, j - jam.j); return d > jam.r ? 1 : jam.min + (1 - jam.min) * Math.pow(d / jam.r, 2); };

  PK.L = { lerp, roads, metro, stations, hebbal, lakes, inLake, inAnyLake, jam, flow };
  if (typeof module !== 'undefined') module.exports = PK;
})(typeof window !== 'undefined' ? window : globalThis);
