/* Whole Truth Maps: Kolkata — shared world layout. Single source of truth for where the river, roads,
   bridges and elevated tracks are, used by city.js (static art) and anim.js (moving sprites).
   Cells: i runs west→east (0..120), j runs north→south (0..96). District (row r, col c) spans
   i in [24(c-1), 24c), j in [24(r-1), 24r). */
(function (root) {
  'use strict';
  const PK = (root.PK = root.PK || {});

  // The Hooghly hugs the west edge and swings east around Howrah (row 2).
  const bump = (j) => Math.exp(-Math.pow((j - 36) / 9, 2));
  const wob = (j) => 0.5 * Math.sin(j / 5.3) + 0.3 * Math.sin(j / 2.1 + 1);
  const wb = (j) => 3 + 11 * bump(j) + wob(j) * (1 - bump(j));       // west bank (land where i < wb)
  const eb = (j) => 11 + 11 * bump(j) + wob(j + 40) * (1 - bump(j));  // east bank (land where i > eb)
  const mid = (j) => (wb(j) + eb(j)) / 2;

  const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));

  // Ground-level road segments. axis 'i' = runs along i at rows [at, at+w); axis 'j' = runs along j at columns [at, at+w).
  const roads = [
    { id: 'strand', axis: 'j', at: 23, from: 0, to: 96, w: 2 },
    { id: 'chitpur', axis: 'j', at: 47, from: 0, to: 96, w: 2, tramFrom: 0, tramTo: 49 },
    { id: 'chowringhee', axis: 'j', at: 71, from: 0, to: 96, w: 2, tram: true },
    { id: 'circular', axis: 'j', at: 95, from: 0, to: 96, w: 2 },
    { id: 'bypass', axis: 'j', at: 117, from: 47, to: 96, w: 2 },
    { id: 'mgroad', axis: 'i', at: 23, from: 23, to: 120, w: 2, tram: true },
    { id: 'parkstreet', axis: 'i', at: 47, from: 23, to: 120, w: 2, tram: true },
    { id: 'ajcbose', axis: 'i', at: 71, from: 23, to: 120, w: 2 },
    { id: 'howrahW', axis: 'i', at: 35, from: 0, to: 12, w: 2 },      // Howrah side approach
    { id: 'brabourne', axis: 'i', at: 35, from: 24, to: 47, w: 2 },   // bridge → BBD Bagh
    { id: 'hazra', axis: 'i', at: 84, from: 19, to: 47, w: 2 },       // Setu landing → Kalighat
  ];

  // Elevated decks (drawn as boxes by city.js; vehicles use z()).
  const howrahBridge = {
    j: 35, w: 2, i0: 11, i1: 25, deckZ: 7, towers: [14.5, 21.5], towerH: 46,
    z: (i) => (i < 11 || i > 25 ? 0 : i < 13 ? lerp(0, 7, (i - 11) / 2) : i > 23 ? lerp(7, 0, (i - 23) / 2) : 7),
  };
  const setu = {
    j: 84, w: 2, i0: 0, i1: 19, deckZ: 9, pylons: [3.5, 11.5], pylonH: 52,
    z: (i) => (i > 19 ? 0 : i > 14 ? lerp(9, 0, (i - 14) / 5) : 9),
  };
  const viaduct = { i: 115.2, w: 0.8, j0: 49, j1: 96, z: 9 };          // Orange Line metro along the Bypass
  const flyover = { i: 83, w: 1, j0: 76, j1: 92, deckZ: 7,           // Gariahat flyover
    z: (j) => (j < 76 || j > 92 ? 0 : j < 78 ? lerp(0, 7, (j - 76) / 2) : j > 90 ? lerp(7, 0, (j - 90) / 2) : 7) };

  // Rabindra Sarobar lake outline (union of ellipses): [ci, cj, ri, rj]
  const lake = [[60, 85.5, 8.5, 5], [54, 83, 4, 3.5], [66, 87.5, 3.5, 3]];
  const inLake = (i, j) => lake.some((e) => Math.pow((i - e[0]) / e[2], 2) + Math.pow((j - e[1]) / e[3], 2) <= 1);

  PK.L = { bump, wb, eb, mid, lerp, roads, howrahBridge, setu, viaduct, flyover, lake, inLake };
  if (typeof module !== 'undefined') module.exports = PK;
})(typeof window !== 'undefined' ? window : globalThis);
