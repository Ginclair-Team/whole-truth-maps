/* Whole Truth Maps: software isometric pixel rasteriser, shared by every city.
   Pure JS (no DOM) so the same code runs in the browser and in tools/render.js.
   Everything is drawn into a colour buffer + depth buffer, so draw order never matters
   and animated sprites can be hidden behind buildings. */
(function (root) {
  'use strict';
  const PK = (root.PK = root.PK || {});
  const TH = PK.theme || {};   // per-city palette overrides, set in <city>/config.js

  const HW = 8, QH = 4;            // half tile width, quarter tile height (tile = 16x8)
  const GW = 120, GH = 96;         // world size in cells (5x4 districts of 24 cells)
  const PADT = 150, PADB = 34;
  const W = (GW + GH) * HW, H = (GW + GH) * QH + PADT + PADB;
  const OX = GH * HW, OY = PADT;
  const Q = 4, GW4 = GW * Q, GH4 = GH * Q;

  const col = new Uint32Array(W * H);
  const dep = new Float32Array(W * H).fill(-1e9);
  const G = new Uint8Array(GW4 * GH4);     // ground type, quarter-cell resolution
  const SHD = new Uint8Array(GW4 * GH4);   // cast shadow map
  const RD = new Uint8Array(GW * GH);      // road flags: 1 along-i, 2 along-j, 4 tram-i, 8 tram-j
  const OCC = new Uint8Array(GW * GH);     // cell occupancy for the filler
  const lights = [];                       // x, y, colour, depth (flat)
  const S = { dry: false };

  /* ---------- colour ---------- */
  const ccache = new Map();
  function C(hex) {
    let v = ccache.get(hex);
    if (v === undefined) {
      const n = parseInt(hex.slice(1), 16);
      v = (0xff000000 | ((n & 255) << 16) | (n & 0xff00) | ((n >> 16) & 255)) >>> 0;
      ccache.set(hex, v);
    }
    return v;
  }
  function sh(c, f) {
    let r = (c & 255) * f, g = ((c >> 8) & 255) * f, b = ((c >> 16) & 255) * f;
    r = r > 255 ? 255 : r | 0; g = g > 255 ? 255 : g | 0; b = b > 255 ? 255 : b | 0;
    return (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
  }
  function mixc(a, b, t) {
    const r = (a & 255) + (((b & 255) - (a & 255)) * t),
      g = ((a >> 8) & 255) + ((((b >> 8) & 255) - ((a >> 8) & 255)) * t),
      bl = ((a >> 16) & 255) + ((((b >> 16) & 255) - ((a >> 16) & 255)) * t);
    return (0xff000000 | ((bl | 0) << 16) | ((g | 0) << 8) | (r | 0)) >>> 0;
  }
  function hs(x, y) {
    let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return (n ^ (n >>> 16)) >>> 0;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- projection ---------- */
  const sx = (i, j) => OX + (i - j) * HW;
  const sy = (i, j, z) => OY + (i + j) * QH - (z || 0);

  /* ---------- pixel output (swappable so the sprite layer can reuse primitives) ---------- */
  function putS(x, y, c, d) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const k = y * W + x;
    if (d >= dep[k]) { col[k] = c; dep[k] = d; }
  }
  let put = putS;
  function setPut(fn) { put = fn || putS; }
  function light(x, y, c, d) { if (!S.dry) lights.push(x, y, c, d); }

  /* ---------- ground painting ---------- */
  function gRect(i, j, w, d, t) {
    const a0 = Math.max(0, Math.round(i * Q)), a1 = Math.min(GW4, Math.round((i + w) * Q));
    const b0 = Math.max(0, Math.round(j * Q)), b1 = Math.min(GH4, Math.round((j + d) * Q));
    for (let b = b0; b < b1; b++) for (let a = a0; a < a1; a++) G[b * GW4 + a] = t;
  }
  function gFn(i0, j0, i1, j1, fn) {
    const a0 = Math.max(0, Math.round(i0 * Q)), a1 = Math.min(GW4, Math.round(i1 * Q));
    const b0 = Math.max(0, Math.round(j0 * Q)), b1 = Math.min(GH4, Math.round(j1 * Q));
    for (let b = b0; b < b1; b++) for (let a = a0; a < a1; a++) {
      const t = fn((a + 0.5) / Q, (b + 0.5) / Q);
      if (t) G[b * GW4 + a] = t;
    }
  }
  function gDisc(ci, cj, ri, rj, t) {
    gFn(ci - ri, cj - rj, ci + ri, cj + rj, (i, j) => {
      const a = (i - ci) / ri, b = (j - cj) / rj; return a * a + b * b <= 1 ? t : 0;
    });
  }
  function gAt(i, j) {
    if (i < 0 || j < 0 || i >= GW || j >= GH) return 0;
    return G[((j * Q) | 0) * GW4 + ((i * Q) | 0)];
  }
  function claim(i, j, w, d) {
    const a0 = Math.max(0, Math.floor(i)), a1 = Math.min(GW, Math.ceil(i + w));
    const b0 = Math.max(0, Math.floor(j)), b1 = Math.min(GH, Math.ceil(j + d));
    for (let b = b0; b < b1; b++) for (let a = a0; a < a1; a++) OCC[b * GW + a] = 1;
  }
  function isFree(i, j, w, d) {
    if (i < 0 || j < 0 || i + w > GW || j + d > GH) return false;
    for (let b = j; b < j + d; b++) for (let a = i; a < i + w; a++) if (OCC[b * GW + a]) return false;
    return true;
  }
  function shadow(i, j, w, d, h) {
    const len = Math.min(2.25, h / 13);
    const a0 = Math.max(0, Math.round((i + w) * Q)), a1 = Math.min(GW4, Math.round((i + w + len) * Q));
    const b0 = Math.max(0, Math.round((j + 0.25) * Q)), b1 = Math.min(GH4, Math.round((j + d + 0.25) * Q));
    for (let b = b0; b < b1; b++) for (let a = a0; a < a1; a++) SHD[b * GW4 + a] = 1;
  }

  const T = {
    PAVE: 1, GRASS: 2, LAWN: 3, ROAD: 4, LANE: 5, PLAZA: 6, WATER: 7, POND: 8, DIRT: 9, CLAY: 10,
    PITCH: 11, FIELD: 12, RAILJ: 13, RAILI: 14, STEPS: 15, REDPATH: 16, MARSH: 17, FLOWER: 18,
    BRICK: 19, MOAT: 20, SAND: 21, DARKGRASS: 22,
  };

  function road(axis, at, from, to, wd, tram) {
    wd = wd || 2;
    for (let k = 0; k < wd; k++) for (let s = from; s < to; s++) {
      const i = axis === 'i' ? s : at + k, j = axis === 'i' ? at + k : s;
      if (i < 0 || j < 0 || i >= GW || j >= GH) continue;
      RD[j * GW + i] |= axis === 'i' ? (tram ? 5 : 1) : (tram ? 10 : 2);
      OCC[j * GW + i] = 1;
      gRect(i, j, 1, 1, T.ROAD);
    }
  }

  /* ---------- ground shader ---------- */
  const GC = {};
  function initGC() {
    const d = {
      pave: '#c6b69c', paveD: '#b7a78e', paveL: '#d2c4ab', grass: '#73a64c', grassD: '#5f9342', grassL: '#8aba5c',
      lawn: '#8fc35b', lawn2: '#84b853', road: '#625e6a', roadD: '#57535f', dash: '#e9e0bb', rail: '#c4c9cf',
      lane: '#978b80', laneD: '#8b7f75', plaza: '#e3d5b6', plazaD: '#d2c3a2', water: '#7d8a5b', waterD: '#6e7c52',
      waterL: '#a2ad79', foam: '#c3c99b', mud: '#6f6249', pond: '#4f9389', pondD: '#43807a', pondL: '#86bfae',
      rim: '#ddd2b9', dirt: '#cdae7c', dirtD: '#bf9f6e', clay: '#a9a091', clayD: '#998f80', pitch: '#dcc98f',
      field: '#62b04d', field2: '#70bf59', ballast: '#8f8377', tie: '#6b5a4c', step: '#d3c8b2', stepD: '#a99e89',
      red: '#cd8f63', redD: '#bf8258', marsh: '#7fa56c', flo1: '#ee9a26', flo2: '#f7c832', flo3: '#d9741c',
      flo4: '#5d9a45', brick: '#bb7560', brickD: '#a96652', moat: '#4f7d62', sand: '#e2cf9c', dgrass: '#4f8140',
      dgrassD: '#437236', shadow: '#33294d',
    };
    for (const k in d) GC[k] = C((TH.ground && TH.ground[k]) || d[k]);
  }
  initGC();

  function nbIs(gi, gj, t) {
    return (gi > 0 && G[gj * GW4 + gi - 1] === t) || (gi < GW4 - 1 && G[gj * GW4 + gi + 1] === t) ||
      (gj > 0 && G[(gj - 1) * GW4 + gi] === t) || (gj < GH4 - 1 && G[(gj + 1) * GW4 + gi] === t);
  }
  function nbNot(gi, gj, t, t2) {
    const f = (a, b) => { const v = G[b * GW4 + a]; return v !== t && v !== t2; };
    return (gi > 0 && f(gi - 1, gj)) || (gi < GW4 - 1 && f(gi + 1, gj)) || (gj > 0 && f(gi, gj - 1)) || (gj < GH4 - 1 && f(gi, gj + 1));
  }

  function gcol(t, fi, fj, x, y, gi, gj) {
    const n = hs(x, y), g = GC;
    switch (t) {
      case T.GRASS: return n % 11 === 0 ? g.grassD : n % 17 === 0 ? g.grassL : g.grass;
      case T.DARKGRASS: return n % 7 === 0 ? g.dgrassD : n % 19 === 0 ? g.grass : g.dgrass;
      case T.LAWN: return n % 23 === 0 ? g.grassL : (((fi + fj) | 0) & 1) ? g.lawn : g.lawn2;
      case T.ROAD: {
        const ci = fi | 0, cj = fj | 0, f = RD[cj * GW + ci], ai = f & 1, aj = f & 2;
        if (ai && (f & 4)) { const fr = fj - cj; if ((fr > 0.25 && fr < 0.375) || (fr > 0.625 && fr < 0.75)) return g.rail; }
        if (aj && (f & 8)) { const fr = fi - ci; if ((fr > 0.25 && fr < 0.375) || (fr > 0.625 && fr < 0.75)) return g.rail; }
        if (ai && !aj) { if (fj - cj < 0.125 && cj > 0 && (RD[(cj - 1) * GW + ci] & 1) && (fi % 1.5) < 0.75) return g.dash; }
        else if (aj && !ai) { if (fi - ci < 0.125 && ci > 0 && (RD[cj * GW + ci - 1] & 2) && (fj % 1.5) < 0.75) return g.dash; }
        if (nbNot(gi, gj, T.ROAD, T.ROAD)) return g.paveD;
        return n % 9 === 0 ? g.roadD : g.road;
      }
      case T.LANE: return n % 6 === 0 ? g.laneD : g.lane;
      case T.PLAZA: return ((fi * 2) % 1 < 0.13 || (fj * 2) % 1 < 0.13) ? g.plazaD : g.plaza;
      case T.WATER: {
        if (nbNot(gi, gj, T.WATER, T.STEPS)) return g.foam;
        if ((y + (hs(x >> 3, y >> 2) & 3)) % 5 === 0 && hs(x >> 2, y) % 3 === 0) return g.waterL;
        return hs(x >> 2, y >> 1) % 5 === 0 ? g.waterD : g.water;
      }
      case T.POND: case T.MOAT: {
        const b = t === T.POND ? g.pond : g.moat;
        if (nbNot(gi, gj, t, t)) return sh(b, 0.82);
        if (y % 4 === 0 && hs(x >> 2, y) % 4 === 0) return g.pondL;
        return hs(x >> 2, y >> 1) % 6 === 0 ? g.pondD : b;
      }
      case T.DIRT: return n % 7 === 0 ? g.dirtD : n % 29 === 0 ? g.grass : g.dirt;
      case T.CLAY: return n % 5 === 0 ? g.clayD : g.clay;
      case T.SAND: return n % 8 === 0 ? g.dirt : g.sand;
      case T.PITCH: return g.pitch;
      case T.FIELD: return (((fi + fj) / 1.5) | 0) & 1 ? g.field : g.field2;
      case T.RAILJ: {
        const fr = fi - (fi | 0);
        if ((fr > 0.25 && fr < 0.375) || (fr > 0.625 && fr < 0.75)) return g.rail;
        if (fr > 0.2 && fr < 0.8 && ((fj * 4) | 0) % 2 === 0) return g.tie;
        return n % 5 === 0 ? g.tie : g.ballast;
      }
      case T.RAILI: {
        const fr = fj - (fj | 0);
        if ((fr > 0.25 && fr < 0.375) || (fr > 0.625 && fr < 0.75)) return g.rail;
        if (fr > 0.2 && fr < 0.8 && ((fi * 4) | 0) % 2 === 0) return g.tie;
        return n % 5 === 0 ? g.tie : g.ballast;
      }
      case T.STEPS: return ((fi * 4) | 0) & 1 ? g.step : g.stepD;
      case T.REDPATH: return n % 6 === 0 ? g.redD : g.red;
      case T.MARSH: return n % 5 === 0 ? g.pond : n % 7 === 0 ? g.grassD : g.marsh;
      case T.FLOWER: { const m = n % 10; return m < 4 ? g.flo1 : m < 7 ? g.flo2 : m < 9 ? g.flo3 : g.flo4; }
      case T.BRICK: return (((fi * 4) | 0) + ((fj * 4) | 0)) & 1 ? g.brick : g.brickD;
      default: {
        if (nbIs(gi, gj, T.WATER)) return g.mud;
        if (nbIs(gi, gj, T.POND)) return g.rim;
        return n % 7 === 0 ? g.paveD : n % 13 === 0 ? g.paveL : g.pave;
      }
    }
  }

  function renderGround() {
    for (let y = 0; y < H; y++) {
      const v = (y + 0.5 - OY) / QH;
      for (let x = 0; x < W; x++) {
        const u = (x + 0.5 - OX) / HW, fi = (u + v) / 2, fj = (v - u) / 2;
        if (fi < 0 || fj < 0 || fi >= GW || fj >= GH) continue;
        const gi = (fi * Q) | 0, gj = (fj * Q) | 0, k4 = gj * GW4 + gi;
        let c = gcol(G[k4], fi, fj, x, y, gi, gj);
        if (SHD[k4]) c = mixc(c, GC.shadow, 0.3);
        const k = y * W + x; col[k] = c; dep[k] = v;
      }
    }
  }

  /* ---------- primitives ---------- */
  // Axis-aligned iso box. Footprint (i,j,w,d) in cells, height h px, base elevation z px.
  // mt: roof material (colour | fn(x,y,fi,fj) | null), ml / mr: left(+j) and right(+i) wall materials.
  function box(i, j, w, d, h, z, mt, ml, mr, o) {
    z = z || 0;
    if (S.dry) { if (z === 0 && h >= 5 && !(o && o.ns)) shadow(i, j, w, d, h); return; }
    const zh = z + h;
    const xL = Math.round(OX + (i - (j + d)) * HW), xR = Math.round(OX + (i + w - j) * HW);
    const xF = Math.round(OX + (i + w - (j + d)) * HW);
    const tn = typeof mt === 'number', ln = typeof ml === 'number', rn = typeof mr === 'number';
    const ground = z === 0 && !(o && o.ng);
    for (let x = xL; x < xR; x++) {
      const u = (x + 0.5 - OX) / HW;
      const vt = Math.max(u + 2 * j, 2 * i - u), a1 = u + 2 * (j + d), a2 = 2 * (i + w) - u, ve = Math.min(a1, a2);
      if (ve <= vt) continue;
      const yT = Math.ceil(OY + QH * vt - zh - 0.5), yB = Math.ceil(OY + QH * ve - zh - 0.5) - 1;
      if (mt !== null) for (let y = yT; y <= yB; y++) {
        const v = (y + 0.5 + zh - OY) / QH;
        let c = tn ? mt : mt(x, y, (u + v) / 2 - i, (v - u) / 2 - j);
        if (y === yB && h > 1) c = sh(c, 1.1);
        put(x, y, c, v + 0.01);
      }
      const left = a1 < a2, m = left ? ml : mr, mn = left ? ln : rn, a = left ? x - xL : x - xF;
      if (m === null || m === undefined) continue;
      for (let t = 0; t < h; t++) {
        const y = yB + 1 + t;
        let c = mn ? m : m(a, t, h, x, y, ve);
        if (ground && t === h - 1) c = sh(c, 0.78);
        put(x, y, c, ve + 0.02);
      }
    }
  }

  // Wall material with floors, windows, shopfronts. Lit windows are remembered for the night layer.
  function wallM(base, o) {
    o = o || {};
    const cw = o.cw || 4, rh = o.rh || 6, ww = o.ww || 2, wh = o.wh || 3, wy = o.wy == null ? 2 : o.wy, b0 = o.b0 == null ? 1 : o.b0;
    const win = o.win == null ? sh(base, 0.5) : o.win, lit = o.lit || C('#ffdf80'), seed = o.seed || 0;
    const litP = o.litP == null ? 3 : o.litP, band = o.band, cornice = o.cornice, shop = o.shop, shopH = o.shopH || 5;
    const plinth = o.plinth || base, ax = o.ax || 0;
    return function (a, t, h, x, y, d) {
      const fb = h - 1 - t;
      if (cornice && t === 0) return cornice;
      if (shop && fb < shopH) {
        if (fb === shopH - 1) return shop[0];
        if (fb === shopH - 2) return (a & 1) ? shop[0] : shop[1];
        const am = ((a % 5) + 5) % 5;
        if (am > 0 && am < 4 && fb > 0) { if (hs((a / 5) | 0, seed) % 2 === 0) light(x, y, C('#ffd27a'), d); return shop[2] || sh(base, 0.45); }
        return plinth;
      }
      const q = fb - b0 - (shop ? shopH : 0);
      if (q < 0) return plinth;
      const fm = q % rh, f = (q / rh) | 0;
      if (band && fm === rh - 1) return band;
      const am = (((a + ax) % cw) + cw) % cw;
      if (am >= 1 && am < 1 + ww && fm >= wy && fm < wy + wh && t >= 1) {
        if (litP && hs((((a + ax) / cw) | 0) + seed * 7, f + seed * 3) % litP === 0) light(x, y, lit, d);
        return win;
      }
      return base;
    };
  }
  function roofM(base) {
    const d = sh(base, 0.92), l = sh(base, 1.06);
    return function (x, y) { const n = hs(x, y) % 13; return n === 0 ? d : n === 1 ? l : base; };
  }
  function stripeM(c1, c2, alongJ, per) {
    per = per || 2;
    return function (x, y, fi, fj) { return (((alongJ ? fj : fi) * per + 100) | 0) & 1 ? c1 : c2; };
  }
  function crowdM(cols, dark) {
    return function (x, y) { const n = hs(x, y); return n % 5 < 3 ? cols[(n >> 4) % cols.length] : dark; };
  }

  function drum(ci, cj, z, r, h, top, side) {
    z = z || 0;
    if (S.dry) { if (!z && h >= 5) shadow(ci - r * 0.7, cj - r * 0.7, r * 1.4, r * 1.4, h); return; }
    const cx = Math.round(sx(ci, cj)), cy = Math.round(sy(ci, cj, z)), rx = Math.max(1, Math.round(r * 11.3)), ry = rx / 2, dc = ci + cj;
    const fnS = typeof side === 'function', sL = fnS ? 0 : sh(side, 1.08), sD = fnS ? 0 : sh(side, 0.8), sDD = fnS ? 0 : sh(side, 0.64);
    for (let dx = -rx; dx < rx; dx++) {
      const xn = (dx + 0.5) / rx, e = ry * Math.sqrt(1 - xn * xn), x = cx + dx;
      const yT = Math.round(cy - h - e), yM = Math.round(cy - h + e), yB = Math.round(cy + e);
      for (let y = yT; y < yM; y++) put(x, y, typeof top === 'number' ? top : top(x, y), (y + 0.5 + z + h - OY) / QH + 0.03);
      const d = dc + e / QH + 0.04;
      for (let y = yM; y < yB; y++) {
        let c;
        if (fnS) { c = side(dx + rx, y - yM, yB - yM, x, y, d); c = xn < -0.45 ? sh(c, 1.06) : xn < 0.25 ? c : xn < 0.7 ? sh(c, 0.8) : sh(c, 0.64); }
        else c = xn < -0.45 ? sL : xn < 0.25 ? side : xn < 0.7 ? sD : sDD;
        put(x, y, c, d);
      }
    }
  }
  function dome(ci, cj, z, r, hh, c, o) {
    if (S.dry) return;
    const cx = Math.round(sx(ci, cj)), cy = Math.round(sy(ci, cj, z)), rx = Math.max(1, Math.round(r * 11.3)), ry = rx / 2, dc = ci + cj;
    const c1 = sh(c, 1.14), c3 = sh(c, 0.84), c4 = sh(c, 0.68), rib = o && o.rib;
    for (let dx = -rx; dx < rx; dx++) {
      const xn = (dx + 0.5) / rx, s = Math.sqrt(1 - xn * xn), e = ry * s, x = cx + dx;
      const yT = Math.round(cy - hh * s), yB = Math.round(cy + e), d = dc + e / QH + 0.06;
      for (let y = yT; y < yB; y++) {
        const yn = (y - cy) / hh, L = -xn * 0.6 - yn * 0.55 - 0.25;
        let cc = L > 0.42 ? c1 : L > 0.02 ? c : L > -0.3 ? c3 : c4;
        if (rib && ((dx + rx) % rib === 0)) cc = sh(cc, 0.9);
        put(x, y, cc, d);
      }
    }
  }
  function spire(ci, cj, z, r, h, c, cd) {
    if (S.dry) return;
    const cx = Math.round(sx(ci, cj)), cy = Math.round(sy(ci, cj, z)), rx = Math.max(1, Math.round(r * 11.3)), d = ci + cj + r * 1.42 + 0.06;
    cd = cd || sh(c, 0.72);
    for (let t = 0; t <= h; t++) {
      const half = Math.max(0, Math.round(rx * (t / h))), y = cy - h + t;
      for (let dx = -half; dx <= half; dx++) put(cx + dx, y, dx < 0 || half === 0 ? c : cd, d);
    }
    for (let dx = -rx; dx < rx; dx++) {
      const xn = (dx + 0.5) / rx, e = Math.round((rx / 2) * Math.sqrt(1 - xn * xn));
      for (let y = cy; y < cy + e; y++) put(cx + dx, y, dx < 0 ? c : cd, d);
    }
  }
  function stack(i, j, w, d, h, z, fn, mt, ml, mr) { // stepped solid: fn(k/h) -> inset fraction 0..0.5 of each side
    for (let k = 0; k < h; k++) {
      const s = fn(k / h), si = s * w, sj = s * d;
      if (w - 2 * si <= 0.05 || d - 2 * sj <= 0.05) break;
      box(i + si, j + sj, w - 2 * si, d - 2 * sj, 1, z + k, mt, ml, mr, { ns: 1, ng: 1 });
    }
  }
  function pyr(i, j, w, d, h, z, c) { stack(i, j, w, d, h, z, (t) => t * 0.5, sh(c, 1.1), c, sh(c, 0.72)); }
  // ridge along i (alongJ=false) or along j
  function gable(i, j, w, d, h, z, alongJ, c, curve) {
    const f = curve ? (t) => 0.5 * (1 - Math.sqrt(1 - t * t)) : (t) => t * 0.5;
    for (let k = 0; k < h; k++) {
      const s = f(k / h);
      if (alongJ) box(i + s * w, j, w - 2 * s * w, d, 1, z + k, sh(c, 1.12), sh(c, 0.9), sh(c, 0.7), { ns: 1, ng: 1 });
      else box(i, j + s * d, w, d - 2 * s * d, 1, z + k, sh(c, 0.92), c, sh(c, 0.74), { ns: 1, ng: 1 });
    }
  }
  function rect(x, y, w, h, c, d) { if (S.dry) return; for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) put(x + a, y + b, c, d); }
  function line(x0, y0, x1, y1, c, d0, d1) {
    if (S.dry) return;
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    if (d1 === undefined) d1 = d0;
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), n = Math.max(dx, dy) || 1;
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      put(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t), c, d0 + (d1 - d0) * t);
    }
  }
  // 3D line between world points [i,j,z]
  function line3(a, b, c, bias) {
    bias = bias || 0.05;
    line(sx(a[0], a[1]), sy(a[0], a[1], a[2]), sx(b[0], b[1]), sy(b[0], b[1], b[2]), c, a[0] + a[1] + bias, b[0] + b[1] + bias);
  }
  function pt(i, j, z, c, bias) { if (S.dry) return; put(Math.round(sx(i, j)), Math.round(sy(i, j, z)), c, i + j + (bias || 0.1)); }
  function stamp(i, j, z, rows, pal, bias) {
    if (S.dry) return;
    const x0 = Math.round(sx(i, j)) - (rows[0].length >> 1), y0 = Math.round(sy(i, j, z)) - rows.length + 1, d = i + j + (bias || 0.3);
    for (let r = 0; r < rows.length; r++) for (let q = 0; q < rows[r].length; q++) {
      const c = pal[rows[r][q]]; if (c !== undefined) put(x0 + q, y0 + r, c, d);
    }
  }
  const SKIN = [C('#8a5a3c'), C('#a8714a'), C('#6f452e')];
  function person(i, j, c, z, bias) {
    if (S.dry) return;
    const x = Math.round(sx(i, j)), y = Math.round(sy(i, j, z)), d = i + j + (bias || 0.25);
    put(x, y - 2, SKIN[hs(x, y) % 3], d); put(x, y - 1, c, d); put(x, y, sh(c, 0.55), d);
  }
  function crowd(i, j, w, d, n, r, cols) {
    for (let k = 0; k < n; k++) person(i + r() * w, j + r() * d, cols[(r() * cols.length) | 0]);
  }

  const LEAF = {};
  function initLeaf() {
    const mk = (a, b, c) => [C(a), C(b), C(c)];
    LEAF.g = mk('#2f6a35', '#44893d', '#6daa49');
    LEAF.b = mk('#27573a', '#377a3f', '#5b9c47');
    LEAF.o = mk('#3e7a2f', '#5d9a38', '#8dbb4a');
    LEAF.p = mk('#2d6b46', '#3f8a4e', '#63ac5a');
    LEAF.tab = mk('#c9508c', '#f07fb4', '#ffb3d4');   // tabebuia rosea
    LEAF.jac = mk('#5c45a8', '#8463cf', '#b095ea');   // jacaranda
    LEAF.trunk = C('#6b4a33'); LEAF.red = C('#e2452f'); LEAF.yel = C('#f4c531'); LEAF.pink = C('#e48fb0');
  }
  initLeaf();
  function blob(cx, cy, rx, ry, cs, d, seed, speck) {
    for (let dy = -ry; dy <= ry; dy++) for (let dx = -rx; dx <= rx; dx++) {
      const q = (dx * dx) / (rx * rx + 0.5) + (dy * dy) / (ry * ry + 0.5);
      if (q > 1) continue;
      const n = hs(cx + dx * 3 + seed, cy + dy * 5);
      if (q > 0.72 && n % 3 === 0) continue;
      const L = -(dx / rx) * 0.5 - (dy / ry) * 0.75 + ((n % 7) - 3) * 0.09;
      let c = L > 0.4 ? cs[2] : L > -0.3 ? cs[1] : cs[0];
      if (speck && n % 5 === 0) c = speck;
      put(cx + dx, cy + dy, c, d);
    }
  }
  // kinds: 0 round, 1 banyan, 2 palm, 3 gulmohar / krishnachura (red), 4 bush, 5 tall (debdaru, silver oak), 6 copperpod / radhachura (yellow), 7 rain tree,
  // 8 tabebuia (pink), 9 jacaranda (violet)
  function tree(i, j, kind, seed) {
    seed = seed | 0;
    if (S.dry) { const r = kind === 1 ? 0.7 : kind === 4 ? 0.2 : 0.4; shadow(i + 0.5 - r * 0.2, j + 0.5 - r, r * 0.8, r * 2 - 0.25, kind === 1 ? 9 : 6); return; }
    const x = Math.round(sx(i + 0.5, j + 0.5)), y = Math.round(sy(i + 0.5, j + 0.5)), d = i + j + 1.3, n = hs(seed, kind + 11);
    if (kind === 2) {
      const lean = (n % 3) - 1, th = 8 + (n % 4);
      for (let k = 0; k < th; k++) put(x + ((lean * k / th) | 0), y - k, LEAF.trunk, d);
      const tx = x + lean, ty = y - th, l = LEAF.o[1], l2 = LEAF.o[2], l0 = LEAF.o[0];
      const rows = ['a..b.b..a', '.ab.b.ba.', '..abbba..', '.aa.c.aa.', 'c...c...c'];
      for (let r = 0; r < 5; r++) for (let q = 0; q < 9; q++) { const ch = rows[r][q]; if (ch !== '.') put(tx - 4 + q, ty - 3 + r, ch === 'a' ? l : ch === 'b' ? l2 : l0, d); }
      return;
    }
    if (kind === 4) { blob(x, y - 2, 2, 2, LEAF.p, d, seed); return; }
    if (kind === 5) { rect(x, y - 2, 1, 3, LEAF.trunk, d); blob(x, y - 9, 2, 6, LEAF.b, d, seed); return; }
    if (kind === 1) {
      rect(x - 1, y - 4, 2, 5, LEAF.trunk, d); put(x - 4, y - 1, LEAF.trunk, d); put(x - 4, y - 2, LEAF.trunk, d); put(x + 3, y - 1, LEAF.trunk, d); put(x + 3, y - 2, LEAF.trunk, d); put(x + 5, y - 2, LEAF.trunk, d);
      blob(x, y - 8, 8 + (n % 2), 5, LEAF.b, d, seed); blob(x - 3, y - 11, 4, 3, LEAF.g, d, seed + 3);
      return;
    }
    const big = kind === 7, rx = big ? 5 : 3 + (n % 2), ry = big ? 5 : 3 + ((n >> 2) % 2);
    rect(x, y - 3, 1, 4, LEAF.trunk, d);
    const cs = kind === 8 ? LEAF.tab : kind === 9 ? LEAF.jac : kind === 3 || kind === 6 ? LEAF.o : (n >> 4) % 2 ? LEAF.g : LEAF.p;
    blob(x, y - 3 - ry, rx, ry, cs, d, seed, kind === 3 ? LEAF.red : kind === 6 ? LEAF.yel : 0);
  }

  /* ---------- vehicles (used by both the static layer and the sprite layer) ---------- */
  const VC = {};
  function initVC() {
    const d = { taxi: '#f6c417', taxiD: '#c9950c', glass: '#2a3550', tyre: '#26222b', tramB: '#2b62ab', tramW: '#f1efe4', tramR: '#d8dbe0',
      busR: '#c8382e', busB: '#2f6fc0', busY: '#f0c63a', autoG: '#2f8f4f', white: '#f2efe6', hull: '#6d4a32', hullD: '#4f3524', thatch: '#c9a55a',
      ferryW: '#f0ece0', ferryB: '#2b5c9c', ferryR: '#b9382d', emuG: '#3f8a52', emuY: '#e8c94a', metro: '#e9edf2', metroB: '#3a66b0', ship: '#39424f', shipR: '#a8402f' };
    for (const k in d) VC[k] = C((TH.vehicles && TH.vehicles[k]) || d[k]);
  }
  initVC();
  // generic two-part vehicle: body + cabin, length L along axis, width Wd
  function vbox(i, j, z, axis, L, Wd, h, mt, side) {
    if (axis === 'i') box(i - L / 2, j - Wd / 2, L, Wd, h, z, mt, side, side && ((a, t, hh) => sh(side(a, t, hh), 0.76)), { ns: 1, ng: 1 });
    else box(i - Wd / 2, j - L / 2, Wd, L, h, z, mt, side && ((a, t, hh) => sh(side(a, t, hh), 1.0)), side && ((a, t, hh) => sh(side(a, t, hh), 0.76)), { ns: 1, ng: 1 });
  }
  function vehicle(kind, i, j, z, axis, variant) {
    if (S.dry) return;
    z = z || 0;
    const v = VC;
    switch (kind) {
      case 'taxi': case 'car': {
        const body = kind === 'taxi' ? v.taxi : variant || v.white;
        vbox(i, j, z, axis, 0.95, 0.44, 3, body, (a, t) => (t === 2 ? v.tyre : body));
        vbox(i, j, z + 3, axis, 0.5, 0.38, 2, sh(body, 1.08), () => v.glass);
        break;
      }
      case 'auto': vbox(i, j, z, axis, 0.6, 0.38, 2, v.autoG, (a, t) => (t === 1 ? v.tyre : v.autoG)); vbox(i, j, z + 2, axis, 0.5, 0.36, 3, v.taxi, (a, t) => (t === 0 ? v.taxi : v.glass)); break;
      case 'bus': {
        const body = variant || v.busB;
        vbox(i, j, z, axis, 1.8, 0.52, 7, sh(body, 1.15), (a, t) => (t === 6 ? v.tyre : t >= 1 && t <= 2 ? ((a % 3) ? v.glass : body) : t === 4 ? v.busY : body));
        break;
      }
      case 'tram': {
        const f = (a, t) => (t === 6 ? v.tyre : t === 0 ? v.tramW : t <= 2 ? ((a % 3) ? v.glass : v.tramW) : t === 3 ? v.tramW : v.tramB);
        const off = 0.78;
        if (axis === 'i') { vbox(i - off, j, z, axis, 1.45, 0.5, 7, v.tramR, f); vbox(i + off, j, z, axis, 1.45, 0.5, 7, v.tramR, f); }
        else { vbox(i, j - off, z, axis, 1.45, 0.5, 7, v.tramR, f); vbox(i, j + off, z, axis, 1.45, 0.5, 7, v.tramR, f); }
        // pantograph
        put(Math.round(sx(i, j)), Math.round(sy(i, j, z + 8)), v.tyre, i + j + 0.6); put(Math.round(sx(i, j)), Math.round(sy(i, j, z + 9)), v.tyre, i + j + 0.6);
        break;
      }
      case 'train': {
        const tv = variant === 1 ? [v.metro, v.metroB] : variant, top = tv ? tv[0] : v.emuY, b = tv ? tv[1] : v.emuG;   // variant = [body, stripe]
        for (let k = -1; k <= 1; k++) {
          const f = (a, t) => (t === 6 ? v.tyre : t >= 1 && t <= 2 ? ((a % 3) ? v.glass : top) : t === 4 ? b : top);
          if (axis === 'i') vbox(i + k * 2.1, j, z, axis, 2.0, 0.55, 7, sh(top, 0.95), f); else vbox(i, j + k * 2.1, z, axis, 2.0, 0.55, 7, sh(top, 0.95), f);
        }
        break;
      }
      case 'boat': {
        vbox(i, j, z, axis, 1.7, 0.4, 1, v.hull, () => v.hullD);
        vbox(i, j, z + 1, axis, 0.7, 0.36, 2, v.thatch, () => sh(v.thatch, 0.8));
        if (axis === 'i') person(i + 0.7, j, C('#e9e2d0'), z + 1, 0.5); else person(i, j + 0.7, C('#e9e2d0'), z + 1, 0.5);
        break;
      }
      case 'ferry': {
        vbox(i, j, z, axis, 2.6, 0.8, 3, v.ferryW, (a, t) => (t === 2 ? v.ferryB : t === 0 ? v.ferryW : v.ferryB));
        vbox(i, j, z + 3, axis, 1.7, 0.6, 3, v.ferryW, (a, t) => (t === 1 && a % 2 ? v.glass : v.ferryW));
        vbox(i, j, z + 6, axis, 0.3, 0.3, 3, v.ferryR, () => v.ferryR);
        break;
      }
      case 'ship': {
        vbox(i, j, z, axis, 6.5, 1.3, 5, C('#8b5a44'), (a, t) => (t >= 3 ? v.shipR : v.ship));
        const o = axis === 'i' ? [2.2, 0] : [0, 2.2];
        vbox(i - o[0], j - o[1], z + 5, axis, 1.2, 1.0, 8, v.white, (a, t) => (t % 3 === 1 && a % 2 ? v.glass : v.white));
        vbox(i - o[0], j - o[1], z + 13, axis, 0.4, 0.4, 4, v.shipR, () => v.shipR);
        const cc = [C('#c8553a'), C('#3f7fb5'), C('#e0b23c'), C('#4d9a6a')];
        for (let k = 0; k < 4; k++) { const q = -0.6 + k * 0.85; vbox(i + (axis === 'i' ? q : 0), j + (axis === 'i' ? 0 : q), z + 5, axis, 0.75, 0.9, 3, cc[k], () => sh(cc[k], 0.85)); }
        break;
      }
      case 'scooter': { // delivery rider; variant = box colour
        const bc = variant || C('#ff7a1f');
        vbox(i, j, z, axis, 0.5, 0.16, 2, C('#3a3846'), (a, t) => (t === 1 ? v.tyre : C('#4a4858')));
        person(i, j, bc, z + 3, 0.35);
        if (axis === 'i') vbox(i - 0.2, j, z + 2, axis, 0.22, 0.24, 3, bc, () => sh(bc, 0.85)); else vbox(i, j - 0.2, z + 2, axis, 0.22, 0.24, 3, bc, () => sh(bc, 0.85));
        break;
      }
      case 'pedal': { // pedal boat
        const bc = variant || C('#f4f1e6');
        vbox(i, j, z, axis, 0.8, 0.5, 2, bc, () => sh(bc, 0.82));
        const hx = axis === 'i' ? i + 0.4 : i, hy = axis === 'i' ? j : j + 0.4;
        vbox(hx, hy, z + 2, axis, 0.14, 0.14, 4, bc, () => sh(bc, 0.9));
        person(i - 0.05, j - 0.05, C('#e2452f'), z + 2, 0.3); person(i + 0.15, j + 0.1, C('#2f66b0'), z + 2, 0.3);
        break;
      }
      case 'shell': { // rowing shell
        vbox(i, j, z, axis, 1.8, 0.16, 1, C('#f1e9d2'), () => C('#b9a983'));
        for (let k = -1; k <= 1; k++) person(i + (axis === 'i' ? k * 0.45 : 0), j + (axis === 'i' ? 0 : k * 0.45), k ? C('#d8452f') : C('#2f66b0'), z + 1, 0.4);
        break;
      }
      case 'rick': { // hand-pulled rickshaw
        vbox(i, j, z, axis, 0.45, 0.34, 3, C('#3a3a44'), (a, t) => (t === 2 ? v.tyre : C('#b23a34')));
        if (axis === 'i') person(i + 0.5, j, C('#d9d2c0'), z); else person(i, j + 0.5, C('#d9d2c0'), z);
        break;
      }
      case 'carriage': { // Victoria's horse carriage
        vbox(i, j, z, axis, 0.7, 0.42, 4, C('#e8d27a'), (a, t) => (t === 3 ? v.tyre : t === 0 ? C('#d9b84a') : C('#f3ead0')));
        const hx = axis === 'i' ? i + 0.75 : i, hy = axis === 'i' ? j : j + 0.75;
        vbox(hx, hy, z, axis, 0.5, 0.2, 3, C('#f3efe6'), (a, t) => (t === 2 ? C('#8b8377') : C('#e6e0d2')));
        break;
      }
    }
  }

  /* ---------- finishing ---------- */
  function finalizeLights() {
    const out = [];
    for (let k = 0; k < lights.length; k += 4) {
      const x = lights[k], y = lights[k + 1];
      if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) continue;
      if (dep[y * W + x] <= lights[k + 3] + 0.05) out.push(x, y, lights[k + 2]);
    }
    return out;
  }
  // Dusk version of the static layer: cool tint + warm glowing lights.
  // dusk tint: [r, luma, +] [g, luma, +] [b, luma, +]
  const N = TH.dusk || [0.34, 0.08, 14, 0.36, 0.08, 12, 0.52, 0.14, 38];
  const NS = TH.duskSprite || [0.46, 16, 0.48, 14, 0.6, 40];   // same for moving sprites: r, +, g, +, b, +
  function makeNight(litList) {
    const out = new Uint32Array(W * H);
    for (let k = 0; k < W * H; k++) {
      const c = col[k]; if (!c) continue;
      const r = c & 255, g = (c >> 8) & 255, b = (c >> 16) & 255;
      const l = (r * 0.3 + g * 0.5 + b * 0.2);
      const nr = Math.max(0, (r * N[0] + l * N[1] + N[2]) | 0), ng = Math.max(0, (g * N[3] + l * N[4] + N[5]) | 0), nb = Math.min(255, (b * N[6] + l * N[7] + N[8]) | 0);
      out[k] = (0xff000000 | (nb << 16) | (ng << 8) | nr) >>> 0;
    }
    const glow = (k, c, t) => { if (out[k]) out[k] = mixc(out[k], c, t); };
    for (let q = 0; q < litList.length; q += 3) {
      const x = litList[q], y = litList[q + 1], c = litList[q + 2], k = y * W + x;
      glow(k - 1, c, 0.3); glow(k + 1, c, 0.3); glow(k - W, c, 0.25); glow(k + W, c, 0.35); glow(k + W * 2, c, 0.15);
    }
    for (let q = 0; q < litList.length; q += 3) { const k = litList[q + 1] * W + litList[q]; if (out[k]) out[k] = litList[q + 2]; }
    return out;
  }
  function nightTint(c) {
    const r = c & 255, g = (c >> 8) & 255, b = (c >> 16) & 255;
    return (0xff000000 | (Math.min(255, (b * NS[4] + NS[5]) | 0) << 16) | (((g * NS[2] + NS[3]) | 0) << 8) | ((r * NS[0] + NS[1]) | 0)) >>> 0;
  }

  PK.E = {
    HW, QH, GW, GH, W, H, OX, OY, Q, GW4, GH4, col, dep, G, SHD, RD, OCC, S, T, GC, VC, LEAF,
    C, sh, mixc, hs, rng, sx, sy, setPut, putS, getPut: () => put, light, lights,
    gRect, gFn, gDisc, gAt, claim, isFree, shadow, road, renderGround,
    box, wallM, roofM, stripeM, crowdM, drum, dome, spire, stack, pyr, gable, rect, line, line3, pt, stamp, person, crowd, tree, blob,
    vehicle, finalizeLights, makeNight, nightTint,
  };
  if (typeof module !== 'undefined') module.exports = PK;
})(typeof window !== 'undefined' ? window : globalThis);
