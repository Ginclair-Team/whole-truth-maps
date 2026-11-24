/* Whole Truth Maps: Bengaluru - the procedural city. Everything static is drawn here through the PK.E rasteriser.
   build() runs two identical deterministic passes: a dry pass (ground paint + cast shadows),
   E.renderGround(), then the real pass (all pixels). */
(function (root) {
  'use strict';
  const PK = (root.PK = root.PK || {});
  const E = PK.E, L = PK.L;
  if (!E || !L) throw new Error('city.js needs engine.js and layout.js loaded first');
  const T = E.T, C = E.C, sh = E.sh, GW = E.GW, GH = E.GH, OCC = E.OCC, RD = E.RD, hs = E.hs, sx = E.sx, sy = E.sy;
  const { box, wallM, roofM, stripeM, crowdM, drum, dome, spire, stack, pyr, gable, line3, pt, stamp, person, crowd, tree, vehicle, light, gRect, gFn, gDisc, claim, isFree, road } = E;

  /* ---------- tiny helpers ---------- */
  const ri = (r, n) => (r() * n) | 0;
  const pick = (r, a) => a[(r() * a.length) | 0];
  const lerp = L.lerp;
  const R = (x, y, w, h, c, d) => { if (!E.S.dry) E.rect(x, y, w, h, c, d); };
  const LN = (x0, y0, x1, y1, c, d) => { if (!E.S.dry) E.line(x0, y0, x1, y1, c, d); };
  const PCOL = ['#d8452f', '#2f66b0', '#e8c032', '#4d9a6a', '#e9e2d0', '#8a3f8f', '#f08a24', '#f1c6a8', '#c43a8a', '#2f9aa8'].map(C);
  const BLKT = ['#1c1c22', '#24242c', '#17171c', '#1c1c22', '#2a2a34'].map(C);
  const AW = [['#d8453a', '#f1ead8'], ['#2f8f5a', '#f1ead8'], ['#e8892a', '#f6d255'], ['#2f6fb5', '#f1ead8'], ['#c43a8a', '#f6d255'], ['#e5b82e', '#d8453a'], ['#7a3a9a', '#f6d255'], ['#18a0a0', '#f1ead8']].map((p) => p.map(C));
  const CAFE = [['#e8799c', '#f6e6ea'], ['#d9a521', '#f6ecc8'], ['#2f6b4a', '#e8efe0'], ['#e8799c', '#fbf3f0'], ['#d9a521', '#fbf3e0']].map((p) => p.map(C));
  const TARP = ['#3b78c2', '#e8892a', '#c9a55a', '#d8453a', '#2f8f5a', '#e8c032', '#c43a8a', '#18a0a0'].map(C);
  const ROOFS = ['#b8ac98', '#a79a86', '#c4b8a4', '#9d9283', '#b9654d', '#8d8478'].map(C);
  const TILE = ['#b5553c', '#a84a35', '#c4664a'].map(C);
  const BOOK = ['#d8453a', '#2f6fb5', '#e8c032', '#2f8f5a', '#f1ead8', '#7a3a9a', '#f08a24'].map(C);
  const WH = C('#f4f0e4'), GOLD = C('#e8b830'), STEEL = C('#9aa5ad'), STEELD = C('#7d8891'), BLK = C('#2a2a30'), WOOD = C('#9a7a52'), CREAM = C('#f1e6c8');
  const BRICK = C('#b4503a'), GRANITE = C('#8d8a90'), TEAK = C('#8a5a34'), GLASSD = C('#2a3550');
  const MARI = [C('#f08a24'), C('#f6c832'), C('#e8761c'), C('#f9d84a')];
  const JASM = [C('#f6f2e4'), C('#ece6d2'), C('#ffffff')];

  const shadeM = (m, f) => (a, t, h, x, y, d) => sh(m(a, t, h, x, y, d), f);
  const pairM = (mk, f) => [mk(), shadeM(mk(), f || 0.72)];
  const wl = (base, o) => pairM(() => wallM(base, o));
  function colM(base, o) {   // arcade / colonnade ground floor, windowed floors above
    o = o || {};
    const ch = o.ch || 8, per = o.per || 4, dk = o.dark || sh(base, 0.42), cap = o.cap || sh(base, 0.9), colc = o.colc || base;
    const up = wallM(base, { cw: o.cw || 4, ww: 2, wh: 3, b0: ch, win: o.win || sh(base, 0.5), litP: o.litP == null ? 0 : o.litP, band: o.band, cornice: o.cornice, rh: o.rh || 6, wy: o.wy == null ? 2 : o.wy });
    return (a, t, h, x, y, d) => {
      const fb = h - 1 - t;
      if (fb < ch) { if (fb === 0) return cap; if (fb === ch - 1) return colc; const m = a % per; return m === 0 ? colc : m === 1 ? sh(colc, 0.85) : dk; }
      return up(a, t, h, x, y, d);
    };
  }
  // arches in rows: cusped / round arch openings per floor
  function archM(base, dark, o) {
    o = o || {};
    const cw = o.cw || 6, rh = o.rh || 8, cap = o.cap || sh(base, 0.8), lit = o.lit || 0;
    return (a, t, h, x, y, d) => {
      const fb = h - 1 - t;
      if (t === 0) return cap;
      if (fb < 1) return sh(base, 0.8);
      const q = fb - 1, fm = q % rh, f = (q / rh) | 0, am = a % cw;
      if (fm >= 1 && fm < rh - 2 && am >= 1 && am < cw - 1) {
        const top = rh - 3 - fm;           // 0 at arch crown
        if (top === 0 && (am === 1 || am === cw - 2)) return base;
        if (top === 0 && am !== 1 && am !== cw - 2 && cw > 4 && am === (cw >> 1)) return sh(base, 0.9);
        if (lit && hs((a / cw) | 0, f + (o.seed || 0)) % lit === 0) light(x, y, C('#ffdf80'), d);
        return dark;
      }
      return fm === rh - 1 ? sh(base, 0.88) : base;
    };
  }
  function patM(c1, c2, c3) {
    return (a, t, h) => {
      const fb = h - 1 - t, u = (a + fb) % 8, v = (a - fb + 800) % 8;
      if (fb > h - 3 || fb < 2 || u < 1 || v < 1) return c2;
      return ((a >> 3) & 1) === 0 ? c1 : c3;
    };
  }
  const openF = (base) => (a, t) => (t === 0 || a % 7 === 0 ? base : C('#2a211c'));
  function creeper(m, seed, col) {
    const g = col || [C('#3f7a3a'), C('#4f8f44'), C('#2f6a35')];
    return (a, t, h, x, y, d) => {
      if (t > 1 && t < h - 1 && hs((a >> 2) + seed * 3, (t >> 2) + seed) % 6 === 0 && hs(a, t + seed) % 3 !== 0) return g[hs(a, t) % 3];
      return m(a, t, h, x, y, d);
    };
  }

  /* ---------- ground helpers ---------- */
  const LOW = [];
  function shield(i0, j0, i1, j1, cap) { LOW.push([i0, j0, i1, j1, cap]); }
  function capAt(i, j, w, d) { let c = 99; for (let k = 0; k < LOW.length; k++) { const z = LOW[k]; if (i < z[2] && i + w > z[0] && j < z[3] && j + d > z[1] && z[4] < c) c = z[4]; } return c; }
  function ground(i, j, w, d, t) { gRect(i, j, w, d, t); claim(i, j, w, d); }
  function claimFn(i0, j0, i1, j1, fn) {
    for (let b = Math.max(0, Math.floor(j0)); b < Math.min(GH, Math.ceil(j1)); b++)
      for (let a = Math.max(0, Math.floor(i0)); a < Math.min(GW, Math.ceil(i1)); a++) if (fn(a + 0.5, b + 0.5)) OCC[b * GW + a] = 1;
  }
  function groundFn(i0, j0, i1, j1, fn) { gFn(i0, j0, i1, j1, fn); claimFn(i0, j0, i1, j1, (i, j) => fn(i, j)); }
  function groundDisc(ci, cj, ri_, rj, t) { gDisc(ci, cj, ri_, rj, t); claimFn(ci - ri_, cj - rj, ci + ri_, cj + rj, (i, j) => ((i - ci) / ri_) ** 2 + ((j - cj) / rj) ** 2 <= 1.1); }
  function lakeNear(i, j, rad) {
    if (L.inAnyLake(i, j)) return true;
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; if (L.inAnyLake(i + rad * Math.cos(a), j + rad * Math.sin(a))) return true; }
    return false;
  }
  // lake-safe ground paint (never overwrites water or its walking ring)
  function landFn(i0, j0, i1, j1, t) { gFn(i0, j0, i1, j1, (i, j) => (lakeNear(i, j, 0.8) ? 0 : t)); }
  function cellOcc(i, j) { return OCC[(j | 0) * GW + (i | 0)]; }

  function B(i, j, w, d, h, base, o) {
    o = o || {};
    const z = o.z || 0, ins = o.ins || 0, m = o.mats || wl(base, o);
    if (!o.nc) claim(i, j, w, d);
    const roof = o.roof === undefined ? roofM(sh(base, 0.88)) : o.roof;
    box(i + ins, j + ins, w - 2 * ins, d - 2 * ins, h, z, roof, m[0], m[1], o.bo);
    return z + h;
  }
  function glow(i, j, z, c) { pt(i, j, z, c, 0.1); light(Math.round(sx(i, j)), Math.round(sy(i, j, z)), c, i + j + 0.1); }
  function bulbs(a, b, sag, cols, per) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.ceil(len * (per || 2.5)));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      glow(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t - sag * Math.sin(Math.PI * t), cols[k % cols.length]);
    }
  }
  function pole(i, j, h, c) { line3([i, j, 0], [i, j, h], c || C('#5a4a3a'), 0.12); }
  function lamp(i, j) { pole(i, j, 11, C('#3a3a44')); glow(i, j, 12, C('#ffe08a')); }
  function clock(i, j, z) {
    const x = Math.round(sx(i, j)), y = Math.round(sy(i, j, z)), d = i + j + 1.0, k = C('#2a2430'), c = C('#f6f0dc');
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const q = dx * dx + dy * dy; if (q <= 10) R(x + dx, y + dy, 1, 1, q > 5 ? k : c, d); }
    R(x, y - 2, 1, 3, k, d + 0.01); R(x, y, 2, 1, k, d + 0.01);
  }
  function mound(i, j, cols) {
    const x = Math.round(sx(i, j)), y = Math.round(sy(i, j)), d = i + j + 0.15;
    const rows = [[-2, 2, -1], [-1, 1, -2], [0, 0, -3]];
    for (const [a, b, dy] of rows) for (let dx = a; dx <= b; dx++) R(x + dx, y + dy, 1, 1, cols[hs(x + dx, y + dy) % cols.length], d);
  }
  function ring(ci, cj, rad, c, n) { for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; pt(ci + Math.cos(a) * rad, cj + Math.sin(a) * rad, 0, c, 0.3); } }
  function ellRing(ci, cj, ri_, rj, c, n, z) { for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; pt(ci + Math.cos(a) * ri_, cj + Math.sin(a) * rj, z || 0, c, 0.3); } }
  // flat painted disc from concentric colour rings (outer -> inner), drawn as points on the ground
  function flowerDisc(ci, cj, rad, cols, spk) {
    if (E.S.dry) return;
    const st = 1 / 14;
    for (let b = -rad; b <= rad; b += st) for (let a = -rad; a <= rad; a += st) {
      const q = Math.hypot(a, b) / rad; if (q > 1) continue;
      const k = Math.min(cols.length - 1, (q * cols.length) | 0), n = hs((ci + a) * 40, (cj + b) * 40);
      let c = cols[k]; if (spk && n % 6 === 0) c = sh(c, 0.82); else if (n % 11 === 0) c = sh(c, 1.1);
      pt(ci + a, cj + b, 0, c, 0.22);
    }
  }
  function chimney(i, j, h, c) { stack(i, j, 0.9, 0.9, h, 0, (t) => 0.07 * t, sh(c, 1.1), c, sh(c, 0.72)); stack(i + 0.04, j + 0.04, 0.82, 0.82, 2, h - 6, () => 0, BLK, sh(c, 0.5), sh(c, 0.4)); }

  /* ---------- little people ---------- */
  function upright(i, j, c, z) { // person with a raised arm
    if (E.S.dry) return;
    const x = Math.round(sx(i, j)), y = Math.round(sy(i, j, z)), d = i + j + 0.26;
    person(i, j, c, z, 0.25); R(x + 1, y - 4, 1, 2, c, d); R(x + 1, y - 5, 1, 1, E.C('#a8714a'), d);
  }
  function sitter(i, j, c, cloth) {
    if (E.S.dry) return;
    const x = Math.round(sx(i, j)), y = Math.round(sy(i, j)), d = i + j + 0.22;
    R(x - 2, y - 1, 5, 2, cloth, d); R(x, y - 3, 1, 1, E.C('#8a5a3c'), d + 0.02); R(x, y - 2, 1, 1, c, d + 0.02);
  }
  function dog(i, j, c) { const x = Math.round(sx(i, j)), y = Math.round(sy(i, j)), d = i + j + 0.22; R(x, y - 1, 2, 1, c, d); R(x + 2, y - 2, 1, 1, c, d); }
  function cyclist(i, j, c) { const x = Math.round(sx(i, j)), y = Math.round(sy(i, j)), d = i + j + 0.24; R(x - 1, y, 1, 1, BLK, d); R(x + 1, y, 1, 1, BLK, d); R(x, y - 1, 1, 1, c, d); R(x, y - 2, 1, 1, c, d); R(x, y - 3, 1, 1, E.C('#8a5a3c'), d); }
  function laptopPerson(i, j, c) { const x = Math.round(sx(i, j)), y = Math.round(sy(i, j)), d = i + j + 0.24; person(i, j, c, 0, 0.24); R(x + 1, y - 1, 2, 1, WH, d); }
  function umbrella(i, j, z, c) { const x = Math.round(sx(i, j)), y = Math.round(sy(i, j, z)), d = i + j + 0.8; R(x - 2, y - 4, 5, 1, c, d); R(x - 1, y - 5, 3, 1, c, d); R(x, y - 3, 1, 3, E.C('#6a5a4a'), d); }
  function pelican(i, j) { const x = Math.round(sx(i, j)), y = Math.round(sy(i, j)), d = i + j + 0.2; R(x - 1, y - 1, 4, 2, WH, d); R(x + 3, y - 3, 1, 3, WH, d); R(x + 4, y - 3, 2, 1, E.C('#f0b84a'), d); R(x - 1, y - 2, 2, 1, E.C('#dfe6ea'), d); }
  function bag(i, j, z, c) { box(i, j, 0.3, 0.3, 2, z || 0, c, c, sh(c, 0.75), { ns: 1, ng: 1 }); }
  function bush(i, j, c) { const x = Math.round(sx(i, j)), y = Math.round(sy(i, j)), d = i + j + 0.3; R(x - 1, y - 2, 3, 2, c, d); R(x, y - 3, 1, 1, c, d); }

  /* ---------- trees ---------- */
  function treeKind(r, i, j) {
    const cl = i === undefined ? -1 : hs((i >> 2) + 3, (j >> 2) + 7) % 9, u = r();
    if (cl === 0 && u < 0.72) return 8;
    if (cl === 1 && u < 0.72) return 9;
    if (cl === 2 && u < 0.45) return 3;
    const v = r();
    return v < 0.07 ? 8 : v < 0.14 ? 9 : v < 0.34 ? 7 : v < 0.46 ? 3 : v < 0.58 ? 6 : v < 0.69 ? 5 : v < 0.79 ? 0 : v < 0.87 ? 4 : v < 0.91 ? 1 : 2;
  }
  function plant(i, j, kind) { tree(i, j, kind, i * 31 + j * 17); claim(i, j, 1, 1); }
  function plant2(i, j, kind, r) { // dense canopy: two overlapping trees in one cell
    const k2 = r() < 0.7 ? kind : treeKind(r, i, j);
    tree(i + 0.25, j - 0.25, kind, i * 31 + j * 17); tree(i - 0.25, j + 0.25, k2, i * 13 + j * 7 + 5); claim(i, j, 1, 1);
  }
  function treeCell(i, j, r, court, kind) {
    if (court) gRect(i, j, 1, 1, T.PLAZA);
    plant(i, j, kind === undefined ? treeKind(r, i, j) : kind);
    if (court) { const n = 1 + ri(r, 3); for (let k = 0; k < n; k++) person(i + 0.15 + r() * 0.7, j + 0.5 + r() * 0.45, pick(r, PCOL)); }
  }
  // dense grove of free cells; o.kinds forces a kind list, o.skip(i,j) excludes
  function grove(i0, j0, i1, j1, r, p, o) {
    o = o || {};
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
      if (!isFree(i, j, 1, 1) || (o.skip && o.skip(i, j))) continue;
      if (r() < p) { const kd = o.kinds ? pick(r, o.kinds) : treeKind(r, i, j); if (o.dense) plant2(i, j, kd, r); else plant(i, j, kd); }
      else if (o.fill && r() < 0.5) { claim(i, j, 1, 1); if (r() < 0.4) person(i + r(), j + r(), pick(r, PCOL)); }
    }
  }
  function bamboo(i, j, seed) {
    if (E.S.dry) return;
    claim(i, j, 1, 1);
    const g = [C('#8fb04a'), C('#6f9a3a'), C('#a3c05a')];
    for (let k = 0; k < 6; k++) {
      const a = hs(seed * 7 + k, 3), bi = i + 0.15 + (a % 70) / 100, bj = j + 0.15 + ((a >> 8) % 70) / 100, h = 11 + (a >> 4) % 6, lean = ((a >> 12) % 3 - 1) * 0.12;
      line3([bi, bj, 0], [bi + lean, bj, h], g[k % 3], 0.9);
      if (k & 1) { pt(bi + lean, bj, h, g[2], 0.95); pt(bi + lean + 0.1, bj, h - 2, g[1], 0.95); }
    }
  }

  /* ---------- parks, stalls ---------- */
  function smallStall(i, j, r) {
    const c = pick(r, TARP), g = pick(r, TARP), alt = r() < 0.5;
    claim(i, j, 1, 1);
    box(i + 0.12, j + 0.15, 0.76, 0.7, 3, 0, stripeM(c, C('#f1ead8'), alt, 3),
      (a, t) => (t === 0 ? c : hs(a >> 1, i * 5 + j) % 3 === 0 ? C('#3a2a22') : g), (a, t) => sh(t === 0 ? c : g, 0.74), { ns: 1 });
  }
  function stalls(i0, j0, i1, j1, r, o) {
    o = o || {};
    const rs = o.rs || 2, p = o.p == null ? 0.7 : o.p;
    for (let cj = j0; cj < j1; cj += rs) {
      for (let ci = i0; ci < i1; ci++) {
        if (!isFree(ci, cj, 1, 1)) continue;
        if (r() < p) { smallStall(ci, cj, r); person(ci + 0.3 + r() * 0.4, cj + 1.05, pick(r, PCOL)); }
      }
      if (rs > 1) for (let ci = i0; ci < i1; ci++) {
        if (!isFree(ci, cj + 1, 1, 1)) continue;
        gRect(ci, cj + 1, 1, 1, T.LANE); claim(ci, cj + 1, 1, 1);
        if (r() < 0.45) person(ci + 0.2 + r() * 0.6, cj + 1 + r() * 0.8, pick(r, PCOL));
      }
    }
  }
  function park(i0, j0, i1, j1, r, o) { // lawn with paths, trees, walkers, benches
    o = o || {};
    gFn(i0, j0, i1, j1, (i, j) => (lakeNear(i, j, 0.8) || (o.ex && o.ex(i, j)) ? 0 : (o.t || T.LAWN)));
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
      if (!isFree(i, j, 1, 1) || (o.ex && o.ex(i + 0.5, j + 0.5))) continue;
      const u = r();
      if (u < (o.tp || 0.4)) { if (o.dense) plant2(i, j, treeKind(r, i, j), r); else plant(i, j, treeKind(r, i, j)); }
      else { claim(i, j, 1, 1); if (u < (o.tp || 0.4) + 0.08) person(i + r(), j + r(), pick(r, PCOL)); }
    }
  }
  // cobble or paved strip
  function strip(i, j, w, d, t) { ground(i, j, w, d, t); }
  // rooftop terrace with umbrellas + string bulbs
  function terrace(i, j, w, d, z, r, n) {
    for (let k = 0; k < (n || 2); k++) umbrella(i + 0.2 + r() * (w - 0.4), j + 0.2 + r() * (d - 0.4), z + 1, pick(r, [C('#e8799c'), C('#d9a521'), C('#2f6b4a'), C('#f1ead8'), C('#e2452f')]));
    if (r() < 0.6) bulbs([i, j + d, z + 4], [i + w, j + d, z + 4], 0.8, [C('#ffd27a'), C('#ff9ac0')], 2);
  }

  /* ---------- rocks, gopurams, domes ---------- */
  const GRY = [C('#9a958f'), C('#86827e'), C('#b0aaa2')];
  const GRYP = [C('#a39b98'), C('#908887'), C('#b8aea8')];
  function rockMat(cs, scrub, p, f) {
    return (a, t, h, x, y) => {
      const n = hs(x >> 1, y >> 1); let c = (scrub && n % (p || 9) === 0) ? scrub : cs[(n >>> 3) % cs.length];
      return sh(c, (f || 1) * ((y >> 3) & 1 ? 0.94 : 1.04));
    };
  }
  function rockTop(cs, scrub, p) { return (x, y) => { const n = hs(x >> 1, y >> 1); return (scrub && n % (p || 7) === 0) ? (p === 1 ? sh(scrub, 0.84 + (n >>> 4) % 4 * 0.1) : scrub) : cs[(n >>> 3) % cs.length]; }; }
  const domeFn = (t) => 0.5 * (1 - Math.sqrt(Math.max(0, 1 - t * t)));
  function hillStack(i, j, w, d, H, z0, fn, cs, scrub, p, ptop) {
    stack(i, j, w, d, H, z0, fn, rockTop(cs, scrub, ptop || p), rockMat(cs, scrub, p, 1.0), rockMat(cs, scrub, p, 0.76));
  }
  function gopuram(i, j, w, d, h, z, c, acc, o) {
    o = o || {};
    const n = o.n || 5, cx = i + w / 2, cy = j + d / 2, th = Math.max(2, Math.round(h / n)), tiers = o.tiers;
    let zz = z;
    for (let k = 0; k < n; k++) {
      const f = 1 - 0.14 * k, ww = w * f, dd = d * f, tc = tiers ? tiers[k % tiers.length] : c;
      const bd = k === n - 1 ? acc : (o.band || acc), m = (a, t, H) => (t === 0 ? bd : t === H - 1 ? sh(tc, 0.7) : (a % 4 === 2 && t > 1 && t < H - 1) ? sh(tc, 0.42) : tc);
      box(cx - ww / 2, cy - dd / 2, ww, dd, th, zz, sh(tc, 1.1), m, shadeM(m, 0.72), { ns: 1, ng: 1 });
      zz += th;
    }
    const f = 1 - 0.14 * n;
    gable(cx - w * f * 0.5, cy - d * f * 0.5, w * f, d * f, 3, zz, w >= d, o.roof || acc, true);
    box(cx - 0.07, cy - 0.07, 0.14, 0.14, 3, zz + 2, GOLD, GOLD, sh(GOLD, 0.8), { ns: 1, ng: 1 });
    return zz + 5;
  }
  function churchSpire(i, j, w, d, h, sp, base, tilec) {
    B(i, j, w, d, h, base, { cw: 4, ww: 1, wh: 3, litP: 0, band: sh(base, 0.85) });
    spire(i + w / 2, j + d / 2, h, w * 0.62, sp, tilec);
  }
  function signM(base, signC, o) { // storefront with a sign band near the top
    const m = wallM(base, o);
    return (a, t, h, x, y, d) => { if (t >= 1 && t <= 3) return t === 2 && a % 3 === 0 ? WH : signC; return m(a, t, h, x, y, d); };
  }
  function glassM(base, o) {
    o = o || {};
    const m = wallM(base, { cw: 3, ww: 2, wh: 4, wy: 1, rh: 6, win: o.win || sh(base, 0.55), litP: 2, b0: 1, band: o.band || sh(base, 0.92), plinth: sh(base, 0.8), seed: o.seed || 0 });
    return m;
  }
  function tower(i, j, w, d, h, base, r, o) { // glass tower with a stepped crown
    o = o || {};
    const m = pairM(() => glassM(base, { seed: (i * 5 + j) & 63 }));
    B(i, j, w, d, h, base, { mats: m, roof: sh(base, 0.8) });
    const w2 = w * 0.62, d2 = d * 0.62, ci = i + (w - w2) / 2, cj = j + (d - d2) / 2, c2 = sh(base, 0.86);
    box(ci, cj, w2, d2, 6, h, sh(c2, 0.8), pairM(() => glassM(c2))[0], pairM(() => glassM(c2))[1], { ns: 1, ng: 1 });
    if (o.crown) { box(ci + w2 * 0.3, cj + d2 * 0.3, w2 * 0.4, d2 * 0.4, 5, h + 6, GOLD, sh(GOLD, 0.9), sh(GOLD, 0.7), { ns: 1, ng: 1 }); line3([i + w / 2, j + d / 2, h + 11], [i + w / 2, j + d / 2, h + 17], C('#cfd6dc'), 0.2); }
    else { line3([i + w / 2, j + d / 2, h + 6], [i + w / 2, j + d / 2, h + 10], STEELD, 0.2); }
  }
  function glassPyr(i, j, w, d, h, z, c1, c2, line, litP) {
    const m = (c) => (a, t, H, x, y, dd) => { if (x % 4 === 0 || y % 4 === 0) return line; if (litP && hs(x >> 2, y >> 2) % litP === 0) light(x, y, C('#bff6ff'), dd); return c; };
    stack(i, j, w, d, h, z, (t) => 0.5 * t, (x, y) => ((x % 4 === 0 || y % 4 === 0) ? line : sh(c1, 1.12)), m(c1), m(c2));
  }
  // smooth rounded hill: octagonal slices of two overlapping rects
  function roundHill(cx, cy, rx, ry, H, z0, o) {
    const cs = o.cols, side = (f) => (a, t, h, x, y) => {
      const n = o.smooth ? hs(x >> 3, y >> 3) : hs(x >> 1, y >> 1); let c;
      if (o.scrub && hs(x >> 3, y >> 2) % (o.patch || 5) === 0 && n % 4 !== 0) c = sh(o.scrub, 0.85 + (n >>> 5) % 4 * 0.1); else c = cs[(n >>> 3) % cs.length];
      return sh(c, f * (((y >> 3) & 1) ? 0.97 : 1.02));
    }, top = (x, y) => side(1.05)(0, 0, 1, x, y), ml = side(1), mr = side(0.76);
    for (let k = 0; k < H; k++) {
      const t = k / H, s = Math.sqrt(1 - t * t); if (s < 0.08) break;
      const a = rx * s, b = ry * s;
      box(cx - a, cy - b * 0.72, 2 * a, 1.44 * b, 1, z0 + k, top, ml, mr, { ns: 1, ng: 1 });
      box(cx - a * 0.72, cy - b, 1.44 * a, 2 * b, 1, z0 + k, top, ml, mr, { ns: 1, ng: 1 });
      box(cx - a * 0.8, cy - b * 0.8, 1.6 * a, 1.6 * b, 1, z0 + k, top, ml, mr, { ns: 1, ng: 1 });
    }
    claim(cx - rx, cy - ry, 2 * rx, 2 * ry);
  }
  function crane(i, j, h) {
    const y = C('#e8b81c'), k = C('#4a4a50');
    for (const [a, b] of [[0, 0], [0.18, 0], [0, 0.18], [0.18, 0.18]]) line3([i + a, j + b, 0], [i + a, j + b, h], y, 0.15);
    for (let z = 4; z < h; z += 5) { line3([i, j, z], [i + 0.18, j + 0.18, z + 5], y, 0.2); line3([i + 0.18, j, z], [i, j + 0.18, z + 5], y, 0.2); }
    line3([i - 2.2, j + 0.09, h + 1], [i + 1.8, j + 0.09, h + 1], y, 0.2); line3([i - 2.2, j + 0.09, h + 2], [i + 1.8, j + 0.09, h + 2], y, 0.2);
    line3([i + 0.09, j + 0.09, h], [i + 0.09, j + 0.09, h + 4], y, 0.2); line3([i - 1.6, j + 0.09, h + 1], [i - 1.6, j + 0.09, h - 5], k, 0.2);
    glow(i - 2.2, j + 0.09, h + 2, C('#ff6a5a'));
  }

  /* ---------- the generic filler ---------- */
  const STY = {
    pete: { cols: ['#e9c46a', '#d98e5f', '#a8c5b5', '#f0e2c4', '#c97b84', '#8fb0c9', '#e7b7a0'], shut: ['#2f6b5a', '#7a3b2e'], fl: [2, 4], plinth: '#9c3b2c', mw: 2, md: 2, shopP: 0.55, base: T.PAVE, treeP: 0.05 },
    bungalow: { cols: ['#f4eddc', '#efe0c0', '#e8c9b0', '#dfe6d2', '#f2d6c8'], shut: ['#3f6b4a', '#8a3f2e', '#2f5f5a'], fl: [1, 2], plinth: '#9c3b2c', mw: 2, md: 2, shopP: 0, tile: 1, base: T.GRASS, treeP: 0.36, garden: 1 },
    cantonment: { cols: ['#f1e6cf', '#b4563f', '#d9c6a5', '#c8d2cf'], shut: ['#3d5a4a', '#7a3b2e', '#3d5a6b'], fl: [3, 4], plinth: '#8a4a38', mw: 2, md: 2, shopP: 0.4, band: 1, cornice: 1, base: T.PAVE, treeP: 0.08 },
    layout: { cols: ['#f2f0ea', '#d8dde0', '#e6cdb8', '#b9cfc5', '#a9b4bd', '#c98f6b', '#f2f0ea', '#e4e8d8', '#3f4a55'], shut: ['#3f4a55', '#7a8a92', '#2f5f5a'], fl: [2, 4], mw: 2, md: 2, shopP: 0.3, cafe: 1, band: 1, base: T.GRASS, treeP: 0.2 },
    tech: { cols: ['#6fb0c4', '#4f8fae', '#8cc4c0', '#b4c6d2', '#7d8fb8'], fl: [7, 12], mw: 3, md: 3, minw: 2, shopP: 0, cw: 3, glass: 1, base: T.LAWN, treeP: 0.2 },
    shed: { cols: ['#b4503a', '#8f9aa0', '#b4503a', '#a8452f', '#9aa3a8'], fl: [1, 2], mw: 3, md: 2, shopP: 0, shed: 1, chim: 2, cw: 7, base: T.CLAY, treeP: 0.03 },
    rail: { cols: ['#b8b4aa', '#a9a49a', '#c4bfb2', '#9d9a92'], shut: ['#4a4a50'], fl: [1, 2], mw: 3, md: 2, shopP: 0, base: T.CLAY, treeP: 0.04 },
  };

  function clutter(i, j, w, d, h, r, base) {
    if (r() < 0.5) { const sw = Math.min(0.45, w), sd = Math.min(0.45, d); B(i + r() * (w - sw), j + r() * (d - sd), sw, sd, 4, sh(base, 0.8), { z: h, nc: 1, mats: [sh(base, 0.95), sh(base, 0.7)], roof: sh(base, 0.8) }); }
    if (r() < 0.25) { const tw = Math.min(0.16, w, d); box(i + r() * (w - tw), j + r() * (d - tw), tw, tw, 2, h, BLK, BLK, BLK, { ns: 1 }); }
    if (r() < 0.35) { const lj = j + r() * Math.max(0.01, d - 0.1), li = i + r() * Math.max(0, w - 0.5), k0 = ri(r, PCOL.length); for (let k = 0; k < 4; k++) pt(li + k * 0.125, lj, h + 1, PCOL[(k0 + k) % PCOL.length], 0.15); }
    if (r() < 0.3) { pt(i + r() * w, j + r() * d, h + 1, C('#3f8a3f'), 0.15); pt(i + r() * w, j + r() * d, h + 1, C('#5aa84a'), 0.15); }
  }
  function building(i, j, w, d, s, r, o) {
    o = o || {};
    const base = C(pick(r, s.cols)), capF = Math.min(o.cap || 99, capAt(i, j, w, d));
    let fl = s.fl[0] + ri(r, s.fl[1] - s.fl[0] + 1);
    if (capF < 99) fl = Math.min(fl, Math.max(1, capF));
    const shop = r() < (o.shopP != null ? o.shopP : s.shopP), aw = pick(r, s.cafe && r() < 0.65 ? CAFE : AW), seed = (i * 7 + j * 13) & 255;
    const h = s.shed ? 7 + ri(r, 6) : fl * 6 + 2 + (shop ? 5 : 0);
    const winc = s.shut ? C(pick(r, s.shut)) : s.glass ? sh(base, 0.5) : s.shed ? BLK : undefined;
    const cw = s.cw || (r() < 0.3 ? 5 : 4);
    const wo = { cw, win: winc, seed, plinth: s.plinth ? C(s.plinth) : undefined, cornice: s.cornice ? sh(base, 1.12) : undefined, band: s.band ? sh(base, 0.84) : undefined, shop: shop ? [aw[0], aw[1], C('#2a2224')] : undefined, litP: s.glass ? 2 : 3 };
    if (s.glass) { wo.wy = 1; wo.wh = 4; wo.ww = 2; wo.band = sh(base, 0.92); wo.plinth = sh(base, 0.8); }
    if (s.shed) { wo.wy = 3; wo.wh = 2; wo.ww = 3; wo.litP = 6; }
    const m = pairM(() => wallM(base, wo)), rc = pick(r, ROOFS), ins = 0.125;
    claim(i, j, w, d);
    const bi = i + ins, bj = j + ins, ww = w - 2 * ins, dd = d - 2 * ins;
    const tc = pick(r, TILE);
    box(bi, bj, ww, dd, h, 0, s.tile ? roofM(tc) : roofM(rc), m[0], m[1]);
    if (s.shed) gable(bi, bj, ww, dd, 4, h, dd > ww, r() < 0.5 ? C('#8f9aa0') : C('#a8452f'), false);
    else if (s.tile) {
      const u = r(), gh = Math.max(2, Math.min(5, Math.round(Math.min(ww, dd) * 4.2)));
      if (u < 0.4) gable(bi - 0.05, bj - 0.05, ww + 0.1, dd + 0.1, gh, h, true, tc, false);
      else if (u < 0.78) gable(bi - 0.05, bj - 0.05, ww + 0.1, dd + 0.1, gh, h, false, tc, false);
      else pyr(bi - 0.05, bj - 0.05, ww + 0.1, dd + 0.1, gh + 1, h, tc);
    } else {
      clutter(bi, bj, ww, dd, h, r, base);
      if (s.cafe && shop && r() < 0.5) terrace(bi + 0.1, bj + 0.1, ww - 0.2, dd - 0.2, h, r, 1 + ri(r, 2));
    }
  }
  function lane(i, j, r, fr, s) {
    if (!fr(i, j, 1, 1)) return;
    gRect(i, j, 1, 1, T.LANE); claim(i, j, 1, 1);
    const u = r();
    if (u < 0.1) person(i + 0.2 + r() * 0.6, j + 0.3 + r() * 0.5, pick(r, PCOL));
    else if (u < 0.15) vehicle('scooter', i + 0.5, j + 0.5, 0, r() < 0.5 ? 'i' : 'j', r() < 0.5 ? C('#ff7a1f') : C('#e43f6f'));
    else if (u < 0.17 && s && s.cafe) vehicle('car', i + 0.5, j + 0.5, 0, r() < 0.5 ? 'i' : 'j', pick(r, [C('#f2efe6'), C('#9aa5ad'), C('#3b78c2'), C('#c8382e')]));
  }
  function fill(i0, j0, i1, j1, sty, r, o) {
    o = o || {};
    const s = STY[sty], ok = o.ok;
    i0 = Math.max(0, i0); j0 = Math.max(0, j0); i1 = Math.min(GW, i1); j1 = Math.min(GH, j1);
    const fr = (i, j, w, d) => {
      if (!isFree(i, j, w, d)) return false;
      if (ok) for (let b = j; b < j + d; b++) for (let a = i; a < i + w; a++) if (!ok(a, b)) return false;
      return true;
    };
    if (s.base && !o.nobase) gFn(i0, j0, i1, j1, (i, j) => (OCC[(j | 0) * GW + (i | 0)] ? 0 : s.base));
    if (!o.nolanes) {
      for (let li = i0 + 2 + ri(r, 3); li < i1 - 1; li += 5 + ri(r, 2)) for (let j = j0; j < j1; j++) lane(li, j, r, fr, s);
      for (let lj = j0 + 3 + ri(r, 3); lj < j1 - 1; lj += 6 + ri(r, 2)) for (let i = i0; i < i1; i++) lane(i, lj, r, fr, s);
    }
    if (s.chim) for (let n = 0; n < s.chim; n++) {
      for (let tries = 0; tries < 30; tries++) {
        const i = i0 + ri(r, Math.max(1, i1 - i0)), j = j0 + ri(r, Math.max(1, j1 - j0));
        if (fr(i, j, 1, 1)) { claim(i, j, 1, 1); chimney(i + 0.05, j + 0.05, 34 + ri(r, 12), BRICK); break; }
      }
    }
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) {
      if (!fr(i, j, 1, 1)) continue;
      const nr = RD[j * GW + i - 1] || RD[j * GW + i + 1] || RD[(j - 1) * GW + i] || RD[(j + 1) * GW + i];
      if (nr && !o.noav && r() < 0.9) continue;   // kerbside is left for the avenue trees
      const cap = capAt(i, j, 1, 1);
      if (cap <= 0) { claim(i, j, 1, 1); if (r() < 0.5) plant(i, j, 4); else if (r() < 0.3) person(i + r(), j + r(), pick(r, PCOL)); continue; }
      if (r() < (o.treeP != null ? o.treeP : s.treeP || 0.1)) { treeCell(i, j, r, !nr && s.base === T.PAVE && r() < 0.35); continue; }
      let w = 1 + Math.max(ri(r, s.mw), ri(r, s.mw)), d = 1 + Math.max(ri(r, s.md), ri(r, s.md));
      if (s.minw) { w = Math.max(w, s.minw); d = Math.max(d, s.minw); }
      while (w > 1 && !fr(i, j, w, d)) w--;
      while (d > 1 && !fr(i, j, w, d)) d--;
      const low = !s.glass && !s.shed && (RD[j * GW + i - 1] || RD[(j - 1) * GW + i]);
      const oo = low ? Object.assign({}, o, { cap: Math.min(2, o.cap || 99) }) : o;
      if (s.garden && w >= 2 && r() < 0.85 && fr(i, j, w, d)) {
        building(i, j, w - 1, d, s, r, oo);
        for (let k = 0; k < d; k++) { claim(i + w - 1, j + k, 1, 1); }
        if (r() < 0.5) plant2(i + w - 1, j + ri(r, d), treeKind(r, i, j), r); else plant(i + w - 1, j + ri(r, d), treeKind(r, i, j));
      } else building(i, j, w, d, s, r, oo);
    }
  }


  /* ---------- global layout ---------- */
  function baseGround() {
    gRect(0, 0, GW, GH, T.PAVE);
    for (const rd of L.roads) road(rd.axis, rd.at, rd.from, rd.to, rd.w, false);
  }

  function lakeBox(id) {
    let i0 = 1e9, j0 = 1e9, i1 = -1e9, j1 = -1e9;
    for (const e of L.lakes[id]) { i0 = Math.min(i0, e[0] - e[2]); i1 = Math.max(i1, e[0] + e[2]); j0 = Math.min(j0, e[1] - e[3]); j1 = Math.max(j1, e[1] + e[3]); }
    return [i0 - 2, j0 - 2, i1 + 2, j1 + 2];
  }
  function lakes() {
    for (const id of Object.keys(L.lakes)) {
      const [i0, j0, i1, j1] = lakeBox(id), wt = id === 'bellandur' ? T.MOAT : T.POND;
      // outer green apron first (not claimed), then the pond and its thin walking ring (claimed)
      gFn(i0, j0, i1, j1, (i, j) => { if (L.inLake(id, i, j)) return 0; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; if (L.inLake(id, i + 1.6 * Math.cos(a), j + 1.6 * Math.sin(a))) return T.GRASS; } return 0; });
      groundFn(i0, j0, i1, j1, (i, j) => {
        if (L.inLake(id, i, j)) return wt;
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; if (L.inLake(id, i + 0.6 * Math.cos(a), j + 0.6 * Math.sin(a))) return hs(Math.floor(i * 4), Math.floor(j * 4)) % 4 === 0 ? T.GRASS : T.REDPATH; }
        return 0;
      });
    }
  }

  function metroLines() {
    const conc = C('#d3cfc7'), concL = C('#bdb9b0'), concD = C('#9a968e');
    const crossing = (m, s) => L.roads.some((rd) => rd.axis !== m.axis && s > rd.at - 0.4 && s < rd.at + rd.w + 0.4);
    const END = (m) => (m.axis === 'j' ? GH : GW);
    for (const m of L.metro) {
      const stripe = C(m.c[1]), jx = m.axis === 'j';
      const topM = (x, y, fi, fj) => { const u = jx ? fi : fj; return u < 0.15 || u > 0.65 ? stripe : conc; };
      const sideL = (a, t) => (t === 0 ? stripe : concL), sideR = (a, t) => (t === 0 ? sh(stripe, 0.8) : concD);
      const deck = (s0, len, z, th) => (jx ? box(m.at, s0, m.w, len, th, z, topM, sideL, sideR, { ns: 1, ng: 1 }) : box(s0, m.at, len, m.w, th, z, topM, sideL, sideR, { ns: 1, ng: 1 }));
      for (const [a, b] of m.runs) {
        deck(a, b - a, m.z - 2, 2);
        for (let s = a + 1.5; s < b - 0.5; s += 3) {
          if (crossing(m, s)) continue;
          if (jx) box(m.at + 0.25, s, 0.3, 0.3, m.z - 2, 0, concL, concL, concD, { ns: 0 }); else box(s, m.at + 0.25, 0.3, 0.3, m.z - 2, 0, concL, concL, concD, { ns: 0 });
        }
        // ramps and portals where a run ends inside the map
        const RL = 2.4;
        const ramp = (s0, dir) => {   // dir -1: climbs up to the run start s0; dir +1: descends after the run end s0
          const base = dir < 0 ? s0 - RL : s0;
          for (let k = 0; k < 5; k++) {
            const sa = base + k * RL / 5, zk = Math.max(2, Math.round(m.z * (dir < 0 ? (k + 0.5) / 5 : 1 - (k + 0.5) / 5)));
            deck(sa, RL / 5, zk - 2, 2);
            if (zk > 5 && k % 2 === 0) { const sp = sa + RL / 10; if (jx) box(m.at + 0.25, sp, 0.3, 0.3, zk - 2, 0, concL, concL, concD, { ns: 1 }); else box(sp, m.at + 0.25, 0.3, 0.3, zk - 2, 0, concL, concL, concD, { ns: 1 }); }
          }
          const pe = dir < 0 ? s0 - RL - 0.3 : s0 + RL;
          if (jx) box(m.at - 0.2, pe, 1.2, 0.3, 5, 0, C('#4a4a52'), C('#2a2a30'), C('#222228'), { ns: 1 });
          else box(pe, m.at - 0.2, 0.3, 1.2, 5, 0, C('#4a4a52'), C('#2a2a30'), C('#222228'), { ns: 1 });
        };
        if (a > 0) ramp(a, -1);
        if (b < END(m)) ramp(b, 1);
      }
    }
    // station halls straddling the deck
    for (const [id, pos] of L.stations) {
      const m = L.metro.find((q) => q.id === id), stripe = C(m.c[1]), zb = 9, hh = m.z + 7 - zb, c0 = m.at + m.w / 2, jx = m.axis === 'j';
      const mats = pairM(() => wallM(C('#f2f1ea'), { cw: 3, ww: 1, wh: 3, wy: 3, rh: 9, b0: 0, win: C('#3a4a5e'), litP: 1, band: stripe, plinth: C('#f2f1ea') }));
      const roofC = roofM(sh(stripe, 0.95));
      if (jx) { box(c0 - 0.8, pos - 1.7, 1.6, 3.4, hh, zb, roofC, mats[0], mats[1], { ns: 1, ng: 1 }); box(c0 - 1.0, pos - 1.9, 2.0, 3.8, 1, zb + hh, sh(stripe, 1.1), sh(stripe, 0.9), sh(stripe, 0.7), { ns: 1, ng: 1 }); }
      else { box(pos - 1.7, c0 - 0.8, 3.4, 1.6, hh, zb, roofC, mats[0], mats[1], { ns: 1, ng: 1 }); box(pos - 1.9, c0 - 1.0, 3.8, 2.0, 1, zb + hh, sh(stripe, 1.1), sh(stripe, 0.9), sh(stripe, 0.7), { ns: 1, ng: 1 }); }
      // lit platform glow + stairs down on the road kerb
      glow(jx ? c0 + 0.9 : pos, jx ? pos : c0 + 0.9, zb + 4, C('#ffe9a8'));
    }
  }

  function hebbalFlyover() {
    const F = L.hebbal, a = (x, y, fi, fj) => ((((fj * 2) | 0) & 1) && fi > 0.45 && fi < 0.55 ? C('#d8cfa8') : (hs(x, y) % 9 === 0 ? C('#3f3b46') : C('#4a4652')));
    ground(F.i, F.j0, F.w, F.j1 - F.j0, T.ROAD);
    box(F.i, 5, F.w, 13, 2, F.deckZ - 2, a, STEEL, STEELD, { ns: 1 });
    for (let k = 0; k < 6; k++) {
      const jn = F.j0 + k * 0.5, js = 18 + k * 0.5;
      box(F.i, jn, F.w, 0.5, Math.max(1, Math.ceil(F.z(jn + 0.5))), 0, a, STEEL, STEELD, { ns: 1 });
      box(F.i, js, F.w, 0.5, Math.max(1, Math.ceil(F.z(js))), 0, a, STEEL, STEELD, { ns: 1 });
    }
    for (let j = 6; j < 18; j += 2.5) box(F.i + 0.3, j, 0.4, 0.4, F.deckZ - 2, 0, C('#cfc9bd'), C('#bdb7ab'), C('#8e897e'), { ns: 1 });
    for (const pi of [F.i - 0.06, F.i + F.w - 0.06]) box(pi, 5, 0.12, 13, 2, F.deckZ, C('#e6e2d8'), C('#e6e2d8'), C('#b9b4a8'), { ns: 1 });
    for (let k = 0; k < 6; k++) for (const pi of [F.i - 0.06, F.i + F.w - 0.06]) { const jn = F.j0 + k * 0.5, js = 18 + k * 0.5; box(pi, jn, 0.12, 0.5, 2, Math.ceil(F.z(jn + 0.5)), C('#e6e2d8'), C('#e6e2d8'), C('#b9b4a8'), { ns: 1 }); box(pi, js, 0.12, 0.5, 2, Math.ceil(F.z(js)), C('#e6e2d8'), C('#e6e2d8'), C('#b9b4a8'), { ns: 1 }); }
    for (let j = 5.5; j < 18; j += 3) { glow(F.i, j, F.deckZ + 3, C('#ffe9a8')); glow(F.i + F.w, j, F.deckZ + 3, C('#ffe9a8')); }
    for (let j = 5; j < 18; j += 0.5) { pt(F.i, j, F.deckZ + 0.5, C('#cfc9bd'), 0.3); pt(F.i + F.w, j, F.deckZ + 0.5, C('#cfc9bd'), 0.3); }
  }

  // second-level double decker flyover north of the yellow line, plus parked jam rows around Silk Board
  function silkBoard(r) {
    const asph = (x, y, fi, fj) => (((fi * 2) | 0) & 1 && fj > 0.45 && fj < 0.55 ? C('#d8cfa8') : (hs(x, y) % 9 === 0 ? C('#3f3b46') : C('#4a4652')));
    const j0 = 69.6, dz = 8;
    claim(52, 69, 20, 2); gRect(52, 69, 20, 2, T.LANE);
    box(58, j0, 10, 1, 2, dz - 2, asph, STEEL, STEELD, { ns: 1 });
    for (let k = 0; k < 6; k++) {
      const iw = 55 + k * 0.5, ie = 68 + k * 0.5, zw = Math.max(1, Math.round(dz * (0.5 + k) / 6)), ze = Math.max(1, Math.round(dz * (5.5 - k) / 6));
      box(iw, j0, 0.5, 1, zw, 0, asph, STEEL, STEELD, { ns: 1 }); box(ie, j0, 0.5, 1, ze, 0, asph, STEEL, STEELD, { ns: 1 });
    }
    for (let i = 58.5; i < 68; i += 2.5) box(i, j0 + 0.3, 0.4, 0.4, dz - 2, 0, C('#cfc9bd'), C('#bdb7ab'), C('#8e897e'), { ns: 1 });
    const vc = [C('#f2efe6'), C('#c8382e'), C('#3b78c2'), C('#2a2a30'), C('#e8c032'), C('#9aa5ad')];
    for (let k = 0; k < 7; k++) vehicle(k === 3 ? 'bus' : 'car', 58.7 + k * 1.35, j0 + 0.5, dz, 'i', k === 3 ? C('#2f6fc0') : vc[k % vc.length]);
    // parked jam on adjacent service lanes (never on the main road cells themselves)
    const lanes = [];
    for (let j = 62; j < 69; j++) lanes.push([70, j, 'j']);               // west of Hosur Road, north of the junction
    for (let j = 62; j < 81; j++) lanes.push([73, j, 'j']);               // east of Hosur Road
    for (let i = 62; i < 70; i++) lanes.push([i, 73, 'i']);               // south of the yellow line, west
    for (let i = 73; i < 82; i++) lanes.push([i, 70, 'i']);               // north of the yellow line, east
    for (let i = 74; i < 82; i++) lanes.push([i, 73, 'i']);
    for (let j = 74; j < 81; j++) lanes.push([70, j, 'j']);
    let n = 0;
    for (const [i, j, ax] of lanes) {
      if (!isFree(i, j, 1, 1) || Math.hypot(i + 0.5 - 72, j + 0.5 - 72) > 10) continue;
      gRect(i, j, 1, 1, T.LANE); claim(i, j, 1, 1);
      const kinds = ['car', 'car', 'bus', 'auto', 'scooter', 'car', 'auto'], kd = kinds[(n++ * 5 + hs(i, j)) % kinds.length];
      if (kd === 'bus') { vehicle('bus', i + 0.5, j + 0.5, 0, ax, pick(r, [C('#c8382e'), C('#2f6fc0'), C('#2f8f5a')])); continue; }
      for (let q = 0; q < 2; q++) {
        const ii = ax === 'i' ? i + (q ? 0.78 : 0.22) : i + 0.5, jj = ax === 'i' ? j + 0.5 : j + (q ? 0.78 : 0.22);
        vehicle(kd, ii, jj, 0, ax, kd === 'scooter' ? C('#ff7a1f') : kd === 'car' ? pick(r, vc) : undefined);
      }
    }
    // the tall signal mast that the whole junction is named for
    const mi = 73.2, mj = 70.5;
    box(mi, mj, 0.2, 0.2, 25, 0, STEELD, STEELD, STEELD, { ns: 1 });
    box(mi - 0.3, mj - 0.05, 0.9, 0.3, 4, 22, BLK, C('#3a3a42'), C('#222228'), { ns: 1 });
    glow(mi - 0.2, mj + 0.28, 24.2, C('#ff4a3a')); glow(mi + 0.25, mj + 0.28, 24.2, C('#ffc83a')); glow(mi + 0.6, mj + 0.28, 24.2, C('#4af08a'));
    claim(73, 70, 1, 1);
  }

  function streetLamps() {
    for (let i = 3; i < 118; i += 4) {
      if ((i > 21 && i < 26) || (i > 45 && i < 50) || (i > 69 && i < 74) || (i > 93 && i < 98)) continue;
      lamp(i + 0.5, 46.85); claim(i, 46, 1, 1);
      lamp(i + 0.5, 49.15); claim(i, 49, 1, 1);
    }
  }

  // avenue trees on both sides of the main roads wherever cells are still free (runs after every district)
  function avenues(r) {
    for (const rd of L.roads) {
      for (const side of [rd.at - 1, rd.at + rd.w]) {
        for (let s = rd.from; s < rd.to; s++) {
          const i = rd.axis === 'j' ? side : s, j = rd.axis === 'j' ? s : side;
          if (i < 0 || j < 0 || i >= GW || j >= GH || !isFree(i, j, 1, 1)) continue;
          const seg = (s / 7) | 0, hsh = hs(seg * 7 + rd.at, side * 3 + (rd.axis === 'j' ? 1 : 2)) % 10;
          const u = r();
          let kd = hsh < 2 ? 8 : hsh < 4 ? 9 : hsh === 4 ? 3 : hsh === 5 ? 6 : hsh === 6 ? 5 : 7;
          if (u < 0.2) kd = treeKind(r, i, j);
          gRect(i, j, 1, 1, T.GRASS);
          if (u < 0.86) plant(i, j, kd);
          else { claim(i, j, 1, 1); if (u < 0.92) person(i + r(), j + r(), pick(r, PCOL)); }
        }
      }
    }
  }

  function structures() {
    lakes();
    metroLines();
    hebbalFlyover();
  }

  function slab() {
    const sc = ['#6b9f45', '#b5533a', '#a3452f', '#c0643f', '#a3452f', '#b5533a', '#8d8a90', '#77757d', '#66646d', '#77757d', '#8d8a90', '#66646d'].map(C);
    const earth = (t, x, y) => {
      const k = t < 1 ? 0 : t < 2 ? 1 : t < 4 ? 2 : t < 6 ? 3 : t < 7 ? 4 : t < 8 ? 5 : t < 10 ? 6 : t < 12 ? 7 : t < 14 ? 8 : t < 16 ? 9 : t < 17 ? 10 : 11, n = hs(x, y);
      let c = sc[k]; if (n % 7 === 0) c = sh(c, 0.88); else if (n % 11 === 0) c = sh(c, 1.1);
      return c;
    };
    const left = (a, t, h, x, y) => earth(t, x, y);
    const right = (a, t, h, x, y) => sh(earth(t, x, y), 0.76);
    box(0, 0, GW, GH, 18, -18, null, left, right);
  }



  /* ---------- districts ---------- */
  function r1c1(r) {
    shield(5, 3, 23, 23, 2); shield(8, 13, 19, 23, 1);
    // railway-ish yard on the west edge
    ground(0, 13, 1, 10, T.RAILJ); ground(1, 13, 1, 10, T.RAILJ);
    vehicle('train', 0.5, 17, 0, 'j', [C('#e9edf2'), C('#2f66b0')]);
    vehicle('train', 1.5, 19.5, 0, 'j', [C('#a8452f'), C('#e8b830')]);
    B(2.1, 13.4, 1.6, 3, 5, C('#9aa3a8'), { cw: 7, win: BLK, litP: 0, roof: C('#8f9aa0') });
    // ISKCON on its granite hill
    const HH = 18, hfn = (t) => 0.1 * t;
    hillStack(6, 3.5, 12, 10, HH, 0, hfn, [C('#7c7872'), C('#6a6660'), C('#8e8a84')], C('#5f9a45'), 9, 1);
    claim(5, 3, 14, 11);
    const edge = (k) => 13.5 - hfn(k / HH) * 10, ext = (k) => 0.3 * (HH - 1 - k) + 0.25;
    for (let k = 0; k < HH; k++) { // long stairs down the front of the hill
      box(10.9, edge(k) - 0.3, 2.4, 0.3 + ext(k), 1, k, (k & 1) ? C('#ece6d8') : C('#d4cdbc'), C('#cfc8b8'), C('#aaa391'), { ns: 1, ng: 1 });
    }
    claim(10, 13, 4, 6);
    const zt = HH, tw = pairM(() => archM(C('#f4efe2'), C('#6a5a3a'), { cw: 5, rh: 10, cap: GOLD, lit: 3, seed: 2 }));
    box(8.6, 5.9, 6.8, 5.0, 10, zt, C('#e8e0cc'), tw[0], tw[1], { ns: 1, ng: 1 });
    glassPyr(10.2, 7.3, 3.6, 3.2, 12, zt + 10, C('#4f9fe0'), C('#2f6fb8'), C('#e4f2fc'), 0);
    const gt = [WH, C('#f1ead8'), WH, C('#f1ead8'), WH, C('#f1ead8'), WH];
    gopuram(8.8, 9.3, 1.5, 1.4, 27, zt + 10, WH, GOLD, { n: 7, tiers: gt, roof: GOLD, band: C('#d9c48a') });
    gopuram(13.0, 9.3, 1.5, 1.4, 27, zt + 10, WH, GOLD, { n: 7, tiers: gt, roof: GOLD, band: C('#d9c48a') });
    gopuram(11.2, 5.9, 1.7, 1.5, 28, zt + 10, WH, GOLD, { n: 7, tiers: gt, roof: GOLD, band: C('#d9c48a') });
    for (let k = 0; k < 9; k++) pt(9.3 + k * 0.62, 11.0, zt + 5, [C('#ffd24a'), C('#ffffff')][k & 1], 0.4);    for (let n = 0; n < 20; n++) { // the queue on the stairs
      const j = 18.3 - n * 0.22; let kk = 0;
      for (let k = 0; k < HH; k++) if (edge(k) + ext(k) >= j) kk = k;
      person(11.4 + (n & 1) * 1.2 + r() * 0.2, j, pick(r, PCOL), kk + 1, 0.45);
    }    crowd(9, 18.3, 6, 1.6, 22, r, PCOL);
    for (let k = 0; k < 8; k++) { const i = 5 + k * 1.7, j = 14.5 + (k & 1) * 0.6; if (isFree(i | 0, j | 0, 1, 1)) plant(i | 0, j | 0, treeKind(r, i | 0, j | 0)); }
    // Peenya
    fill(0, 0, 10, 13, 'shed', r);
    fill(0, 0, 23, 23, 'layout', r);
  }

  function r1c2(r) {
    shield(33, 6, 47, 10, 0); shield(30, 17, 46, 23, 1);
    const gr = C('#b3afa4'), dk = C('#4a4e56');
    ground(33, 6.2, 14, 3.4, T.LAWN); ground(39.5, 6.2, 1.1, 3.4, T.REDPATH);
    const am = pairM(() => colM(gr, { ch: 5, per: 4, dark: dk, win: dk, cornice: sh(gr, 0.8), band: sh(gr, 0.8), litP: 3, colc: sh(gr, 1.1) }));
    B(36, 3, 8, 3, 11, gr, { mats: am, roof: roofM(sh(gr, 0.78)) });
    B(33.4, 3.4, 2.6, 2.6, 8, gr, { mats: am, roof: roofM(sh(gr, 0.78)) });
    B(44, 3.4, 2.4, 2.6, 8, gr, { mats: am, roof: roofM(sh(gr, 0.78)) });
    B(38.6, 3.4, 2.8, 2.6, 11, gr, { z: 11, nc: 1, cw: 4, win: dk, band: sh(gr, 0.8), cornice: sh(gr, 0.7), litP: 2 });
    pyr(38.6, 3.4, 2.8, 2.6, 5, 22, C('#8a877d'));
    line3([40, 4.7, 27], [40, 4.7, 31], STEELD, 0.2); clock(40, 6.05, 17);
    for (let k = 0; k < 6; k++) cyclist(34 + r() * 12, 7 + r() * 2.2, pick(r, PCOL));
    for (let k = 0; k < 5; k++) { const i = 34 + k * 3 + r(), j = 6.6 + (k & 1) * 2.6; if (isFree(i | 0, j | 0, 1, 1) && false) plant(i | 0, j | 0, 7); }
    grove(25, 0, 47, 10, r, 0.85, { dense: 1 });
    grove(25, 10, 47, 16, r, 0.8, { dense: 1 });
    // Sankey Tank walkers
    for (let k = 0; k < 22; k++) { const a = k * Math.PI * 2 / 22 + 0.2; person(31 + 4.85 * Math.cos(a), 13 + 3.45 * Math.sin(a), pick(r, PCOL), 0, 0.4); }
    // Malleswaram: CTR crowd, 8th Cross flowers, Kadu Malleshwara
    B(35.2, 18.2, 2.3, 1.7, 9, C('#f4e8c8'), { mats: pairM(() => signM(C('#f4e8c8'), C('#c8302a'), { cw: 4, win: C('#6a4a38'), litP: 2 })), roof: C('#8a3a30') });
    crowd(34.2, 20.0, 4.2, 1.5, 16, r, PCOL);
    ground(41, 16, 1, 6, T.LANE);
    for (let k = 0; k < 6; k++) { mound(40.5, 16.9 + k, k & 1 ? MARI : JASM); mound(42.5, 17.1 + k, k & 1 ? JASM : MARI); if (k < 5) person(41.3 + r() * 0.4, 17.4 + k, pick(r, PCOL)); }
    ground(43.3, 16.2, 3, 3.4, T.PLAZA);
    gopuram(43.9, 16.8, 1.8, 1.5, 12, 0, C('#d9c9a5'), C('#c05a3a'), { n: 5, tiers: [C('#e8c8a0'), C('#d9a55a'), C('#e8c8a0'), C('#d98a6a'), C('#e8c8a0')], roof: C('#c05a3a') });
    claim(43, 16, 4, 4);
    fill(25, 16, 47, 23, 'bungalow', r);
  }

  function r1c3(r) {
    // Bangalore Palace
    const cr = C('#d3cdbb'), brk = C('#9b4a35'), grnc = C('#4f8f44');
    shield(61, 5, 70, 14, 1); shield(50, 12, 66, 14.5, 0);
    ground(50, 4, 16, 10, T.LAWN); ground(52, 12.2, 12, 1.8, T.LAWN);
    groundFn(57, 12.2, 59.2, 14.2, () => T.REDPATH);
    const tm = (seed) => pairM(() => creeper(wallM(cr, { cw: 4, ww: 2, wh: 3, win: C('#4a3a30'), band: brk, cornice: brk, plinth: brk, litP: 2 }), seed));
    const hm = tm(2);
    B(54, 8, 7, 3.2, 13, cr, { mats: hm, roof: roofM(C('#8a3a30')) });
    gable(54, 8, 7, 3.2, 4, 13, false, C('#a84a35'));
    const t1 = tm(5), t2 = tm(7), t3 = tm(9);
    B(57.2, 7.0, 2.4, 2.4, 25, cr, { mats: t1, roof: brk, nc: 1 }); pyr(57.2, 7.0, 2.4, 2.4, 7, 25, C('#a84a35')); line3([58.4, 8.2, 32], [58.4, 8.2, 35], STEELD, 0.2);
    B(54.1, 8.4, 1.7, 1.7, 20, cr, { mats: t2, roof: brk, nc: 1 }); pyr(54.1, 8.4, 1.7, 1.7, 5, 20, C('#a84a35'));
    B(59.5, 8.5, 1.6, 1.6, 22, cr, { mats: t3, roof: brk, nc: 1 }); pyr(59.5, 8.5, 1.6, 1.6, 6, 22, C('#a84a35'));
    for (const ci of [54.7, 60.3]) {   // round turrets with battlements
      drum(ci, 11.2, 0, 0.78, 22, brk, (a, t, h) => (t === 0 ? brk : (t % 7 === 3 && a % 5 < 3 ? C('#4a3a30') : cr)));
      drum(ci, 11.2, 22, 0.88, 2, brk, brk);
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; box(ci + Math.cos(a) * 0.78 - 0.07, 11.2 + Math.sin(a) * 0.78 - 0.07, 0.14, 0.14, 2, 24, brk, brk, sh(brk, 0.75), { ns: 1, ng: 1 }); }
    }
    for (let k = 0; k < 7; k++) pt(55.7 + k * 0.62, 11.25, 4, C('#3f8f4a'), 0.5);
    // lawn: hedges and a fountain
    for (let k = 0; k < 20; k++) { pt(52.2 + k * 0.55, 12.4, 0, C('#2f6a35'), 0.3); pt(52.2 + k * 0.55, 13.8, 0, C('#2f6a35'), 0.3); }
    groundDisc(58.2, 13.2, 0.9, 0.6, T.POND);
    for (const [i, j] of [[51, 12], [64, 12]]) plant(i, j, 3);
    for (let k = 0; k < 12; k++) plant(50 + k * 1.3 | 0, 4, treeKind(r, 50 + k, 4));
    // Palace Grounds: the concert
    ground(60, 14.2, 10, 8.6, T.DIRT);
    const stg = C('#23232b'), led = (a, t, h, x, y) => {
      const fb = h - 1 - t;
      if (t < 2) return (a & 1) ? C('#4a4a58') : stg;
      if (a > 5 && a < 43 && fb > 1) { const n = hs(x >> 1, y >> 1), u = ((a + fb * 2) >> 3) % 4; return [C('#e83ab0'), C('#2fd0e8'), C('#f6a028'), C('#8a3ae8')][(u + (n % 3 === 0 ? 1 : 0)) % 4]; }
      return stg;
    };
    B(62, 14.4, 6, 1.6, 12, stg, { mats: [led, shadeM(led, 0.7)], roof: C('#33333c'), nc: 1 });
    for (const sx_ of [61.1, 68.3]) { B(sx_, 14.7, 0.6, 0.6, 9, C('#1c1c22'), { mats: [(a, t) => (t % 3 === 1 ? C('#3a3a44') : C('#1c1c22')), C('#14141a')], roof: C('#2a2a32'), nc: 1 }); }
    claim(60, 14, 10, 2);
    ground(60, 16, 10, 5.8, T.DIRT);
    for (let k = 0; k < 270; k++) {
      const i = 60.4 + r() * 9.2, j = 16.4 + r() * 4.8, c = r() < 0.9 ? BLKT[ri(r, 5)] : pick(r, PCOL);
      if (r() < 0.07) upright(i, j, c, 0); else person(i, j, c, 0, 0.26);
    }
    const bm = [C('#ff3ac0'), C('#33e4ff'), C('#ff3ac0'), C('#33e4ff'), C('#ffd24a')];
    for (let k = 0; k < 5; k++) {
      const a = [62.4 + k * 1.1, 14.9, 12], b = [60.6 + k * 2.1, 19.5, 0];
      for (let q = 0; q <= 8; q++) { const t = q / 8, i = a[0] + (b[0] - a[0]) * t, j = a[1] + (b[1] - a[1]) * t, z = a[2] + (b[2] - a[2]) * t; pt(i, j, z, bm[k], 0.9); light(Math.round(sx(i, j)), Math.round(sy(i, j, z)), bm[k], i + j + 0.9); }
    }
    for (let k = 0; k < 14; k++) { glow(62.3 + k * 0.42, 15.9, 12.6, bm[k % 5]); }
    for (let i = 60; i < 70; i++) { plant(i, 21, treeKind(r, i, 21)); }
    for (let j = 14; j < 21; j++) { if (isFree(60, j, 1, 1)) plant(60, j, treeKind(r, 60, j)); if (isFree(69, j, 1, 1)) plant(69, j, treeKind(r, 69, j)); }
    fill(49, 0, 71, 23, 'bungalow', r, { treeP: 0.3 });
  }

  function r1c4(r) {
    shield(73, 0, 95, 23, 2); shield(80, 1, 88, 22, 1);
    const gl = [C('#6fb0c4'), C('#4f8fae'), C('#8cc4c0')];
    ground(73, 2, 8, 8.5, T.PLAZA);
    tower(74.4, 3.2, 2.8, 2.8, 52, gl[0], r, { crown: 1 }); tower(77.4, 5.4, 2.8, 2.8, 44, gl[1], r); tower(74.6, 6.6, 2.4, 2.4, 36, gl[2], r);
    for (const [i, j] of [[73, 3], [73, 5], [73, 7], [73, 9], [76, 10], [79, 10], [80, 8], [80, 4], [80, 2], [76, 2], [74, 2]]) if (isFree(i, j, 1, 1)) plant(i, j, 6);
    // pelicans and the lake
    for (const [i, j] of [[87.2, 8.6], [90, 9], [92.4, 10.6], [86.6, 12.4], [88.4, 13.6], [91.3, 14.5], [89.4, 16], [92.8, 12.8], [87.6, 16.4], [90.6, 11.6], [89.0, 10.2], [86.9, 14.6]]) pelican(i, j);
    for (let k = 0; k < 18; k++) { const a = k * Math.PI * 2 / 18; person(89.5 + 4.65 * Math.cos(a), 13 + 5.65 * Math.sin(a), pick(r, PCOL), 0, 0.4); }
    fill(73, 0, 95, 23, 'layout', r, { treeP: 0.22 });
  }

  function r1c5(r) {
    // farmland and vineyard rows
    gFn(97, 0, 120, 23, (i, j) => {
      const p = hs(i >> 3, j >> 3) % 3;
      if (p === 0) return ((j * 2) | 0) % 2 ? T.GRASS : T.DARKGRASS;
      if (p === 1) return ((i * 2) | 0) % 2 ? T.GRASS : T.DARKGRASS;
      return T.FIELD;
    });
    shield(97, 13, 108, 23, 1);
    // Nandi Hills: one smooth rounded dome with a switchback ledge
    const sg = C('#5f9a45'), cg = [C('#a39e98'), C('#9a958f'), C('#aca69e')], NH = 42, ncx = 113.2, ncy = 6.2, nrx = 5.1, nry = 4.2;
    roundHill(ncx, ncy, nrx, nry, NH, 0, { cols: cg, scrub: sg, patch: 4 });
    roundHill(ncx, ncy - 0.2, 2.5, 2.1, 47, 0, { cols: cg, scrub: sg, patch: 4 });
    const nz = (m) => Math.floor(47 * Math.sqrt(Math.max(0, 1 - m * m))), nzm = (m) => Math.floor(NH * Math.sqrt(Math.max(0, 1 - m * m)));
    const nsp = (a) => { const m = 0.97 - a / (2.2 * Math.PI * 2) * 0.5; return [ncx + Math.cos(a + 0.9) * m * nrx * 0.96, ncy + Math.sin(a + 0.9) * m * nry * 0.96, m]; };
    for (let a = 0; a < 2.2 * Math.PI * 2; a += 0.025) {
      const [wi, wj, m] = nsp(a), zz = nzm(m); if (m * m * 0 + zz < 3) continue;
      box(wi - 0.32, wj - 0.32, 0.64, 0.64, 2, zz, C('#efe2bc'), C('#e0d0a0'), C('#b8a878'), { ns: 1, ng: 1 });
    }
    for (const a of [0.4, 2.2, 4.3, 6.6, 9.0, 11.0, 12.6]) { const [wi, wj, m] = nsp(a), zz = nzm(m) + 2; vehicle(a > 8 ? 'scooter' : 'car', wi, wj, zz, 'i', a > 10 ? C('#ff7a1f') : pick(r, [C('#f2efe6'), C('#c8382e'), C('#3b78c2')])); }
    { const c0 = C('#e6d9bc'); for (let a = 0; a < 56; a++) { const t = a / 56 * Math.PI * 2, m = 0.5, wi = ncx + Math.cos(t) * m * nrx, wj = ncy + Math.sin(t) * m * nry, zz = nzm(m) + 0; box(wi - 0.14, wj - 0.14, 0.28, 0.28, a % 3 ? 3 : 4, zz, c0, c0, sh(c0, 0.75), { ns: 1, ng: 1 }); } }
    box(ncx - 0.7, ncy - 0.9, 1.4, 1.4, 5, 46.5, WH, WH, C('#cfc6b0'), { ns: 1, ng: 1 }); line3([ncx, ncy - 0.2, 51.5], [ncx, ncy - 0.2, 56], C('#e8e0cc'), 1.2);
    dome(ncx, ncy - 0.2, 51.5, 0.6, 4, GOLD);    for (let k = 0; k < 14; k++) person(108.5 + r() * 11, 9.5 + r() * 2.2, pick(r, PCOL), 0, 0.4);
    // Terminal 2: bamboo hall with a wavy slatted roof
    const bam = C('#c9a15f'), bamD = C('#b58a45'), glassp = C('#a7d4da');
    ground(97, 17.8, 12, 4.8, T.PLAZA);
    const wave = (x, y, fi, fj) => ((((fj * 5 + Math.sin(fi * 1.7) * 1.6) | 0) & 1) ? bam : bamD);
    const front = (a, t, h, x, y) => {
      if (t === 0) return bamD; if (t <= 2) return (a % 3 === 0 && t === 2) ? C('#3f8a3f') : bam;
      if (a > 52 && a < 57) return (t & 1) ? C('#e8f6fb') : C('#8fd0e6');          // waterfall strip
      if (a % 6 === 0) return bamD;
      return ((hs(a >> 1, t) % 17) === 0) ? C('#cfe8ec') : glassp;
    };
    B(98, 14.2, 9.4, 3.6, 8, bam, { mats: [front, shadeM(front, 0.76)], roof: wave });
    for (let k = 0; k < 40; k++) { const i = 98.2 + k * 0.23, x = Math.round(sx(i, 17.8)), y = Math.round(sy(i, 17.8, 8)); R(x, y + 1 + (k % 3), 1, 1 + hs(k, 5) % 3, k % 4 ? C('#3f8a3f') : C('#5aa84a'), i + 17.8 + 0.5); }
    for (let k = 0; k < 7; k++) vehicle('taxi', 99.2 + k * 1.3, 21.6, 0, 'i');
    for (let k = 0; k < 4; k++) vehicle('car', 99.8 + k * 2.2, 19.8, 0, 'i', pick(r, [C('#f2efe6'), C('#3b78c2'), C('#c8382e')]));
    crowd(98, 18, 10, 2.8, 26, r, PCOL);
    for (let k = 0; k < 6; k++) plant(97 + k * 2, 22, treeKind(r, 97 + k, 22));
    // the runway and its parked plane
    ground(97, 8, 10.5, 2, T.ROAD);
    for (let i = 98; i < 106.5; i += 1.0) line3([i, 9, 0], [i + 0.5, 9, 0], C('#f1ede0'), 0.2);
    const fus = (a, t, h) => (t === 1 && a % 2 === 0 ? C('#2f5f9a') : WH);
    box(100.4, 8.65, 6.2, 0.7, 2.6, 1.2, WH, fus, shadeM(fus, 0.78), { ns: 1 });
    box(106.6, 8.8, 0.7, 0.4, 2, 1.4, C('#dfe6ea'), C('#dfe6ea'), C('#b9c3c9'), { ns: 1 });
    box(100.5, 8.85, 1.0, 0.3, 4.2, 3.8, C('#d8302a'), C('#d8302a'), C('#a82420'), { ns: 1 });
    box(100.3, 8.1, 0.7, 1.8, 0.8, 3.6, C('#dfe6ea'), C('#dfe6ea'), C('#b9c3c9'), { ns: 1 });
    box(103.0, 7.3, 1.2, 3.4, 0.9, 1.9, C('#eef2f4'), C('#c8d0d6'), C('#a0aab2'), { ns: 1 });
    for (const j of [8.0, 9.6]) { box(103.1, j - 0.1, 0.7, 0.4, 1.0, 0.6, C('#9aa5ad'), C('#9aa5ad'), STEELD, { ns: 1 }); }
    for (const i of [101.4, 105.4]) box(i, 8.9, 0.15, 0.15, 1.2, 0, BLK, BLK, BLK, { ns: 1 });
    claim(100, 7, 8, 3);
    for (let k = 0; k < 4; k++) smallBox(98.4 + k * 0.5, 10.4);
    // farmhouse, greenhouses, vineyard rows
    B(109.6, 13.4, 2.0, 1.5, 5, C('#f4eddc'), { cw: 4, win: C('#8a3f2e'), litP: 3, roof: C('#b5553c') }); gable(109.5, 13.3, 2.2, 1.7, 3, 5, false, C('#b5553c'));
    for (const [gi, gj] of [[114, 16.2], [114, 18.6]]) { const gm = (a, t, h, x, y) => (t === 0 || a % 4 === 0 ? WH : C('#bfe8e2')); B(gi, gj, 3.2, 1.8, 3, C('#bfe8e2'), { mats: [gm, shadeM(gm, 0.8)], roof: C('#d5f0ec') }); gable(gi, gj, 3.2, 1.8, 2, 3, false, C('#d5f0ec')); }
    for (let jr = 13.2; jr < 22.4; jr += 0.5) for (let ir = 100.5; ir < 108.6; ir += 0.2) if ((jr < 8.5 || jr > 11) && isFree(ir | 0, jr | 0, 1, 1)) pt(ir, jr, 1, (hs(ir * 9 | 0, jr * 9 | 0) % 5) ? C('#2f6a35') : C('#5a9a45'), 0.3);
    for (const [i, j] of [[100, 3], [103, 4]]) { B(i, j, 1.6, 1.2, 4, C('#f4eddc'), { cw: 4, win: C('#8a3f2e'), litP: 0, roof: C('#b5553c') }); }    for (let k = 0; k < 24; k++) { const i = 108 + r() * 11, j = 12 + r() * 10; if (isFree(i | 0, j | 0, 1, 1)) plant(i | 0, j | 0, k % 3 ? 7 : treeKind(r, i | 0, j | 0)); }
    for (let k = 0; k < 16; k++) { const i = 97 + r() * 10, j = 1 + r() * 6; if (isFree(i | 0, j | 0, 1, 1)) plant(i | 0, j | 0, treeKind(r, i | 0, j | 0)); }
    for (const [i, j] of [[105, 10.4], [105, 11.4]]) if (isFree(i, j | 0, 1, 1)) plant(i, j | 0, 7);
  }
  function smallBox(i, j) { box(i, j, 0.4, 0.4, 2, 0, C('#e8e0cc'), C('#e8e0cc'), C('#b9b2a0'), { ns: 1 }); }


  const hoardM = (a, t, h) => {
    const x = a, y = t;
    if (x < 1 || x > 35 || t === 0 || t === h - 1) return C('#4a3222');
    const faces = [[18, 9, 7.6, 8.4, '#f0b890'], [6, 10, 4.4, 5.6, '#c98a60'], [31, 10, 4.4, 5.6, '#e8b090']];
    for (const [fx, fy, rx, ry, c] of faces) {
      const dx = (x - fx) / rx, dy = (y - fy) / ry;
      if (dx * dx + dy * dy <= 1) {
        if (dy < -0.42) return C('#2a1a20');
        if (dy > -0.2 && dy < 0.02 && Math.abs(Math.abs(dx) - 0.46) < 0.2) return Math.abs(Math.abs(dx) - 0.46) < 0.09 ? C('#2a1a20') : WH;
        if (dy > 0.5 && dy < 0.68 && Math.abs(dx) < 0.36) return C('#d8302a');
        return C(c);
      }
    }
    return [C('#f08a24'), C('#d8308a'), C('#f6c832'), C('#2fb0c8'), C('#d8308a')][(((x >> 2) + (y >> 2) + (y > 12 ? 1 : 0)) % 5 + 5) % 5];
  };
  function pathSeg(x0, y0, x1, y1, w, t) {
    const i0 = Math.min(x0, x1) - w, j0 = Math.min(y0, y1) - w, i1 = Math.max(x0, x1) + w, j1 = Math.max(y0, y1) + w, dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1;
    const dist = (i, j) => { const u = Math.max(0, Math.min(1, ((i - x0) * dx + (j - y0) * dy) / l2)); return Math.hypot(i - (x0 + dx * u), j - (y0 + dy * u)); };
    gFn(i0, j0, i1, j1, (i, j) => (!L.inAnyLake(i, j) && dist(i, j) < w / 2 ? (t || T.REDPATH) : 0));
    claimFn(i0, j0, i1, j1, (i, j) => dist(i, j) < w / 2 + 0.45 && !L.inAnyLake(i, j));
  }

  function r2c1(r) {
    shield(0, 25, 23, 47, 3);
    // KSR frontage (tracks lie in front of it so the trains are seen)
    const sc = C('#f1e3c4'), red = C('#b4402f');
    const km = pairM(() => archM(sc, C('#3a2a28'), { cw: 6, rh: 8, cap: red, lit: 3, seed: 3 }));
    B(2, 26, 9, 3, 15, sc, { mats: km, roof: roofM(C('#8a3a30')) });
    gable(2, 26, 9, 3, 3, 15, false, C('#a84a35'));
    for (const i of [2, 9.4]) { B(i, 26, 1.6, 3, 21, sc, { mats: pairM(() => archM(sc, C('#3a2a28'), { cw: 5, rh: 7, cap: red })), roof: red, nc: 1 }); pyr(i, 26, 1.6, 3, 5, 21, C('#a84a35')); }
    B(5.6, 26.6, 2.2, 2.2, 8, sc, { z: 15, nc: 1, cw: 4, win: C('#3a2a28'), band: red, cornice: red, litP: 0 });
    pyr(5.6, 26.6, 2.2, 2.2, 6, 23, C('#a84a35')); clock(6.7, 28.85, 19);
    ground(0, 29, 13, 1, T.PLAZA);
    for (let k = 0; k < 4; k++) ground(0, 30 + k, 12.5, 1, T.RAILI);
    ground(0, 34, 13, 0.8, T.PLAZA);
    vehicle('train', 5.6, 30.5, 0, 'i', [C('#e9edf2'), C('#2f66b0')]);
    vehicle('train', 7.2, 32.5, 0, 'i', [C('#c8382e'), C('#f1e3c4')]);
    box(0.4, 29.3, 12, 0.5, 1, 7, C('#8f9aa0'), C('#8f9aa0'), STEELD, { ns: 1 });
    for (let i = 1; i < 12; i += 2.4) box(i, 29.45, 0.15, 0.15, 7, 0, STEELD, STEELD, STEELD, { ns: 1 });
    crowd(0.5, 29.2, 12, 0.7, 24, r, PCOL);
    // Kempegowda bus station
    ground(4, 37, 16, 7.4, T.ROAD);
    ground(4.2, 38.8, 15.6, 0.9, T.PLAZA); ground(4.2, 41.3, 15.6, 0.9, T.PLAZA);
    const bc = [C('#2f6fc0'), C('#c8382e'), C('#2f8f5a')];
    for (const [rj, n] of [[37.95, 7], [40.35, 7], [42.95, 6]]) for (let k = 0; k < n; k++) vehicle('bus', 5.4 + k * 2.2, rj, 0, 'i', bc[(k * 2 + (rj * 3 | 0)) % 3]);
    for (const pj of [38.8, 41.3]) { box(4, pj, 16, 0.9, 1, 7, C('#8f9aa0'), C('#a9b3b9'), STEELD, { ns: 1 }); for (let i = 4.3; i < 20; i += 3.1) box(i, pj + 0.4, 0.14, 0.14, 7, 0, STEELD, STEELD, STEELD, { ns: 1 }); }
    crowd(4.2, 38.9, 15.6, 0.8, 36, r, PCOL); crowd(4.2, 41.4, 15.6, 0.8, 36, r, PCOL);
    claim(4, 37, 16, 8);
    // cinema with its hand-painted hoarding
    B(13, 30.5, 5.6, 3, 9, C('#c9bcd8'), { cw: 4, win: C('#5a4a6a'), band: C('#a898c0'), cornice: C('#f1ead8'), litP: 2, shop: [C('#d8302a'), C('#f6d255'), C('#2a2224')], roof: C('#8a7aa0') });
    box(13.4, 33.35, 4.8, 0.35, 19, 9, C('#4a3222'), hoardM, shadeM(hoardM, 0.7), { ns: 1, ng: 1 });
    for (const i of [14, 17.6]) box(i, 33.4, 0.2, 0.2, 9, 0, STEELD, STEELD, STEELD, { ns: 1 });
    crowd(13, 34.0, 5.6, 1.4, 14, r, PCOL);
    // metro interchange entrance
    B(17.6, 44.7, 2.6, 1.3, 6, WH, { cw: 3, win: C('#3a4a5e'), litP: 1, band: C('#7a3fa8'), roof: C('#7a3fa8') });
    for (let k = 0; k < 6; k++) person(17.6 + k * 0.4, 46.2, pick(r, PCOL));
    claim(17, 44, 4, 3);
    fill(0, 25, 23, 47, 'pete', r);
  }

  function r2c2(r) {
    const gS = C('#d9d4c8'), pl = C('#b3ad9e'), dk = C('#6a665c'), cs = C('#a79f8e');
    ground(25, 36, 22, 11, T.LAWN); ground(32.2, 36, 8.6, 2.6, T.PLAZA);
    ground(28, 38.6, 19, 1.4, T.LAWN); pathSeg(36.5, 36, 36.5, 40, 0.9, T.PLAZA);
    shield(44, 27, 47, 47, 2);
    const plm = (a, t) => (t === 0 ? sh(pl, 1.12) : (a % 8 === 0 ? sh(pl, 0.8) : pl));
    box(28.4, 28.6, 16.2, 7.4, 3, 0, sh(pl, 1.08), plm, shadeM(plm, 0.75), { ns: 1 }); claim(28, 28, 17, 8.4);
    const wm = pairM(() => wallM(gS, { cw: 5, ww: 2, wh: 3, win: dk, band: sh(gS, 0.88), cornice: cs, litP: 3, rh: 6 }));
    box(29, 29, 15, 5.2, 23, 3, roofM(C('#d6d0c2')), wm[0], wm[1], { ns: 1, ng: 1 });
    const pm = pairM(() => colM(gS, { ch: 11, per: 4, dark: dk, colc: sh(gS, 1.06), cornice: cs, win: dk, litP: 0 }));
    box(33.4, 34.0, 7.2, 1.8, 15, 3, sh(gS, 1.0), pm[0], pm[1], { ns: 1, ng: 1 });
    gable(33.4, 34.0, 7.2, 1.8, 3, 18, false, sh(gS, 0.95));
    for (let k = 0; k < 3; k++) box(33.8 - k * 0.0, 36.0 + 0, 5.6 + k * 0, 1.6 - k * 0.5, 1, k, k & 1 ? C('#e6e0d2') : C('#d2ccbc'), C('#cfc9b9'), C('#a8a292'), { ns: 1, ng: 1 });
    for (const [ci, cj] of [[30.2, 30.1], [42.8, 30.1], [30.2, 33.3], [42.8, 33.3]]) {   // corner pavilions with domes
      box(ci - 0.75, cj - 0.75, 1.5, 1.5, 5, 26, C('#e8e2d2'), (a, t) => (t === 0 ? C('#cfc8b8') : a % 4 === 1 ? C('#6a665c') : C('#e8e2d2')), (a, t) => (t === 0 ? C('#b3ad9e') : a % 4 === 1 ? C('#55514a') : C('#c4beaf')), { ns: 1, ng: 1 });
      drum(ci, cj, 31, 0.6, 1, C('#f0eadb'), C('#e8e2d2')); dome(ci, cj, 32, 0.6, 7, C('#f0eadb'), { rib: 3 }); pt(ci, cj, 39.5, GOLD, 0.8); pt(ci, cj, 40.5, GOLD, 0.8);
    }
    for (const [pi, pj, pw, pd] of [[28.9, 28.9, 15.2, 0.3], [28.9, 33.9, 15.2, 0.3], [28.9, 28.9, 0.3, 5.3], [43.8, 28.9, 0.3, 5.3]]) box(pi, pj, pw, pd, 2, 26, C('#e6e0d2'), C('#e6e0d2'), C('#bdb7a8'), { ns: 1, ng: 1 });
    box(33.2, 29.8, 6.6, 3.6, 3, 26, C('#e6e0d2'), (a, t) => (t === 0 ? C('#cfc8b8') : a % 4 === 1 ? C('#6a665c') : C('#e6e0d2')), C('#bdb7a8'), { ns: 1, ng: 1 });
    drum(36.5, 31.6, 29, 1.5, 8, C('#f0eadb'), (a, t, h) => (a % 4 === 1 ? sh(gS, 0.7) : (t > 5 ? C('#e0d9c6') : C('#f4efe2'))));
    dome(36.5, 31.6, 37, 1.5, 16, C('#f0eadb'), { rib: 3 });
    box(36.3, 31.4, 0.5, 0.5, 3, 51, GOLD, GOLD, sh(GOLD, 0.8), { ns: 1, ng: 1 });
    stamp(36.5, 31.6, 57, ['.g.g.', 'ggggg', 'g.g.g', '.ggg.', '.ggg.', 'ggggg'], { g: GOLD }, 1.4);
    light(Math.round(sx(36.5, 31.6)), Math.round(sy(36.5, 31.6, 55)), GOLD, 36.5 + 31.6 + 1.4);    for (const [a1, a2] of [[29, 29], [41.6, 29]]) { box(a1, 34.2, 2.4, 0.9, 25, 3, sh(gS, 1.0), pm[0], pm[1], { ns: 1, ng: 1 }); gable(a1 - 0.1, 34.1, 2.6, 1.1, 2, 28, false, sh(gS, 0.85)); void a2; }    for (let k = 0; k < 14; k++) person(32.4 + r() * 8, 36.4 + r() * 2.1, pick(r, PCOL));
    for (const i of [29.5, 44]) for (let j = 36.4; j < 40; j += 1.6) { bush(i, j, C('#3f8a3f')); }
    // High Court
    const hr = C('#b4402f');
    const hm = pairM(() => colM(hr, { ch: 7, per: 4, dark: C('#5a2a22'), colc: CREAM, cornice: CREAM, cw: 4, win: CREAM, litP: 3, rh: 7 }));
    B(29, 40, 17, 3, 14, hr, { mats: hm, roof: roofM(C('#6a2a22')) });
    B(35, 39.7, 6, 3.3, 17, hr, { mats: hm, roof: roofM(C('#6a2a22')), nc: 1 });
    gable(35, 39.7, 6, 3.3, 4, 17, false, CREAM);
    ground(29, 43.3, 17, 2.7, T.LAWN); pathSeg(38, 43.2, 38, 46, 1.1, T.REDPATH);
    for (const [i, j] of [[29, 44.5], [30.6, 45], [44, 44.5], [45, 45.2]]) { const q = ((i | 0) * 3 + (j | 0)) % 2; tree(i, j, q ? 8 : 3, i * 5 + j); }
    for (let k = 0; k < 14; k++) person(31 + r() * 13, 43.7 + r() * 1.8, pick(r, PCOL));
    for (let k = 0; k < 12; k++) bush(30.5 + k * 1.1, 45.7, C('#d8452f'));
    claim(25, 36, 22, 11);
    for (let j = 36; j < 47; j++) for (const i of [25, 26, 27, 45, 46]) if (r() < 0.8) { const v = r(); tree(i, j, v < 0.4 ? 8 : v < 0.7 ? 9 : 3, i * 7 + j); }
    grove(25, 25, 29, 36, r, 0.5);
    fill(25, 25, 47, 47, 'cantonment', r);
  }

  function r2c3(r) {
    const clr = [[56.7, 36.3, 4.6, 3.6], [53, 31, 4.5, 2.6], [66.2, 29.6, 4.4, 3.4], [52.4, 41.2, 3.4, 2.5], [63.5, 41.5, 6.6, 5.2], [60, 26.3, 12, 0.9], [63, 33, 6, 1]];
    const inClr = (i, j) => clr.some((e) => ((i - e[0]) / e[2]) ** 2 + ((j - e[1]) / e[3]) ** 2 < 1);
    gRect(49, 25, 22, 22, T.GRASS);
    for (let k = 0; k < 40; k++) { const ci = 50 + hs(k, 1) % 19, cj = 26 + hs(k, 2) % 19; gDisc(ci, cj, 1.5 + hs(k, 3) % 3 * 0.5, 1.2, T.LAWN); }
    shield(49, 25, 71, 47, 4);
    pathSeg(49, 32.4, 59.5, 32.4, 0.8); pathSeg(59.5, 32.4, 70, 34.6, 0.8); pathSeg(60, 25, 60, 37.2, 0.8); pathSeg(56, 32.4, 56.3, 34.2, 0.7);
    pathSeg(50, 38.6, 55, 38.6, 0.7); pathSeg(55, 38.6, 58.6, 40.8, 0.7); pathSeg(49.5, 26.4, 70, 26.4, 0.8); pathSeg(52, 26.4, 52, 31, 0.7);
    pathSeg(57.3, 36.2, 57.3, 38.6, 0.7); pathSeg(70, 34.6, 70, 44, 0.7); pathSeg(50, 45.4, 58, 45.4, 0.7);
    // Central Library
    const rd = C('#b23a34');
    B(51, 28, 4.8, 2.2, 12, rd, { cw: 4, win: CREAM, band: WH, cornice: WH, plinth: WH, litP: 2, roof: roofM(C('#8a2f26')) });
    gable(51, 28, 4.8, 2.2, 3, 12, false, C('#8a2f26'));
    B(54.3, 28.3, 1.3, 1.3, 11, rd, { z: 12, nc: 1, cw: 4, ww: 1, win: CREAM, band: WH, cornice: WH, litP: 0 });
    pyr(54.3, 28.3, 1.3, 1.3, 6, 23, WH); line3([54.95, 28.95, 29], [54.95, 28.95, 32], GOLD, 0.2);
    // bandstand
    const bx = 57.6, by = 35.6;
    drum(bx, by, 0, 1.15, 2, CREAM, C('#e8e0cc'));
    for (let b = -1; b <= 1; b += 0.08) for (let a = -1; a <= 1; a += 0.08) if (a * a + b * b <= 0.72) pt(bx + a, by + b, 2, (a * a + b * b < 0.3) ? C('#2a2630') : C('#4a3f4a'), 0.35);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + 0.39; line3([bx + Math.cos(a) * 1.0, by + Math.sin(a) * 1.0, 2], [bx + Math.cos(a) * 1.0, by + Math.sin(a) * 1.0, 11], WH, 0.6); }
    for (let k = 0; k < 6; k++) { const a = k * 1.05; person(bx + Math.cos(a) * 0.45, by + Math.sin(a) * 0.4, pick(r, PCOL), 2, 0.5); }
    box(bx - 1.25, by - 1.25, 2.5, 2.5, 1, 11, C('#3f9a62'), C('#3f9a62'), C('#1f6f45'), { ns: 1, ng: 1 });
    stack(bx - 1.2, by - 1.2, 2.4, 2.4, 6, 12, (t) => 0.5 * t * 0.95, C('#4faa72'), C('#2f8f5a'), C('#1f6f45')); pt(bx, by, 19, GOLD, 1.5);    // reading circle
    for (let k = 0; k < 26; k++) {
      const a = k * 2.399, rr = 0.9 + (k % 5) * 0.34, i = 55.9 + Math.cos(a) * rr * 1.1, j = 37.6 + Math.sin(a) * rr * 0.9, cl = pick(r, [C('#d8452f'), C('#2f66b0'), C('#e8c032'), C('#8a3f8f'), C('#4d9a6a'), C('#f08a24')]);
      sitter(i, j, pick(r, PCOL), cl); R(Math.round(sx(i, j)) + 2, Math.round(sy(i, j)) - 1, 1, 1, WH, i + j + 0.24);
    }
    // run club and dogs
    for (let k = 0; k < 13; k++) person(52 + k * 1.3 + (k & 1) * 0.15, 26.5 + (k & 1) * 0.25, [C('#ff3a5a'), C('#2fd0ff'), C('#b6ff3a'), C('#ffd23a')][k % 4], 0, 0.35);
    for (const [i, j, c] of [[56.2, 39.4, '#8a5a34'], [54.6, 34.6, '#e8e0cc'], [62, 32, '#2a2a30'], [53.3, 37.2, '#c98a50']]) dog(i, j, C(c));
    // lotus pond
    groundDisc(52.4, 41.2, 2.3, 1.55, T.POND);
    for (let k = 0; k < 16; k++) { const a = k * 2.399, rr = 0.3 + (k % 4) * 0.45; pt(52.4 + Math.cos(a) * rr * 1.5, 41.2 + Math.sin(a) * rr * 0.9, 0, k & 1 ? C('#f07fb4') : C('#4f9a45'), 0.3); }
    ellRing(52.4, 41.2, 2.6, 1.85, C('#c4704e'), 70, 0);
    // toy train loop
    const tcx = 66.2, tcy = 29.6, trx = 3.0, try_ = 1.9;
    groundDisc(tcx, tcy, trx + 0.5, try_ + 0.5, T.LAWN);
    ellRing(tcx, tcy, trx, try_, C('#8a8f98'), 150, 0); ellRing(tcx, tcy, trx - 0.14, try_ - 0.1, C('#8a8f98'), 140, 0);
    for (let k = 0; k < 4; k++) { const a = 0.6 + k * 0.17, i = tcx + Math.cos(a) * trx, j = tcy + Math.sin(a) * try_, c = k === 0 ? C('#2f8f5a') : [C('#d8302a'), C('#f4c531'), C('#2f66b0')][k - 1]; box(i - 0.2, j - 0.15, 0.4, 0.3, 2, 0, c, c, sh(c, 0.75), { ns: 1, ng: 1 }); }
    for (let k = 0; k < 8; k++) person(tcx - 1.4 + r() * 2.8, tcy - 0.9 + r() * 1.8, pick(r, PCOL));
    // Chinnaswamy Stadium
    const ci = 63.5, cj = 41.5, sri = 5, srj = 4;
    groundDisc(ci, cj, sri + 0.4, srj + 0.4, T.PLAZA);
    groundDisc(ci, cj, 2.9, 2.2, T.FIELD); ground(62.4, 41.1, 2.2, 0.8, T.PITCH);
    const SC = [C('#d8302a'), C('#e8b830'), C('#1c1c22'), C('#d8302a'), C('#f1ead8')];
    const outer = (a, t, h) => (a % 4 === 0 ? C('#b3ad9e') : (t > h - 3 ? C('#cfc9bb') : C('#e8e2d4')));
    for (let b = 36; b < 47; b++) for (let a = 56; a < 71; a++) {
      const rho = Math.hypot((a + 0.5 - ci) / sri, (b + 0.5 - cj) / srj);
      if (rho > 1.03 || rho < 0.58) continue;
      const tt = (rho - 0.58) / 0.45, h = 4 + Math.round(Math.min(1, tt) * 9), ang = Math.atan2(b + 0.5 - cj, a + 0.5 - ci), solar = tt > 0.62 && (Math.floor((ang + Math.PI) / (Math.PI / 5)) % 2 === 0);
      const top = solar ? ((x, y) => ((x + y) % 4 === 0 ? C('#9ec0e8') : C('#2f5f9a'))) : crowdM(SC, C('#2a2a30'));
      box(a, b, 1, 1, h, 0, top, outer, shadeM(outer, 0.76), { ns: 1 });
      claim(a, b, 1, 1);
    }
    for (const [mi, mj] of [[58.0, 38.0], [69.0, 38.0], [58.0, 45.0], [69.0, 45.0]]) {
      box(mi, mj, 0.18, 0.18, 32, 0, STEELD, STEELD, STEELD, { ns: 1 }); box(mi - 0.4, mj - 0.1, 1.0, 0.4, 3, 32, WH, WH, C('#cfd6dc'), { ns: 1 });
      for (let k = 0; k < 4; k++) glow(mi - 0.3 + k * 0.28, mj + 0.32, 33, C('#fff6d0'));
    }
    for (let k = 0; k < 14; k++) person(ci - 4.5 + r() * 9, cj + srj + 0.5 + r() * 0.5, pick(r, PCOL));
    // the park itself: dense clusters
    const bam = [[50, 34, 54, 38], [66, 34.5, 70, 37.5], [58, 29, 61, 31]];
    for (let j = 25; j < 47; j++) for (let i = 49; i < 71; i++) {
      if (!isFree(i, j, 1, 1) || inClr(i + 0.5, j + 0.5)) continue;
      const cl = hs((i >> 2) + 11, (j >> 2) + 5) % 6, u = r();
      if (bam.some((q) => i >= q[0] && i < q[2] && j >= q[1] && j < q[3]) && u < 0.8) { bamboo(i, j, i * 5 + j); continue; }
      if (u < 0.88) { const v = r(); plant2(i, j, cl === 0 && v < 0.85 ? 8 : cl === 1 && v < 0.85 ? 9 : cl === 2 && v < 0.5 ? 3 : treeKind(r, i, j), r); }
      else { claim(i, j, 1, 1); if (u < 0.8) person(i + r(), j + r(), pick(r, PCOL)); }
    }
  }

  function pub(i, j, w, d, h, r, n) {
    const bases = ['#f4e3d0', '#e8c9b0', '#d8e0d0', '#f1d6c8', '#cfd8e0', '#f6e6b8'], aw = pick(r, AW), base = C(bases[n % 6]);
    B(i, j, w, d, h, base, { cw: 4, win: C(['#3d5a4a', '#7a3b2e', '#3d5a6b'][n % 3]), band: sh(base, 0.84), cornice: sh(base, 1.1), litP: 2, shop: [aw[0], aw[1], C('#2a2224')], roof: roofM(sh(base, 0.8)) });
    if (r() < 0.55) terrace(i + 0.1, j + 0.1, w - 0.2, d - 0.2, h, r, 1 + ri(r, 2));
  }

  function r2c4(r) {
    shield(73, 38, 95, 47, 2);
    // UB City
    ground(73, 30, 6, 6.6, T.PLAZA);
    tower(74.1, 31.0, 2.6, 2.6, 56, C('#7f9fb4'), r, { crown: 1 }); tower(76.0, 32.7, 2.2, 2.2, 46, C('#8aa6b8'), r, { crown: 1 }); tower(73.8, 33.6, 2.0, 2.0, 36, C('#6f8fa6'), r);
    // Russell Market and the basilica
    const bk = C('#b4503a');
    B(87, 28.4, 4.6, 3.4, 9, bk, { cw: 4, win: CREAM, band: CREAM, cornice: CREAM, plinth: CREAM, litP: 3, roof: roofM(C('#8d4a38')) });
    gable(87, 28.4, 2.3, 3.4, 5, 9, true, C('#c9603a')); gable(89.3, 28.4, 2.3, 3.4, 5, 9, true, C('#c9603a'));
    B(91.2, 28.4, 1.3, 1.3, 20, bk, { cw: 4, ww: 1, wh: 3, win: CREAM, band: CREAM, litP: 0, roof: sh(bk, 0.8) }); pyr(91.2, 28.4, 1.3, 1.3, 7, 20, C('#6b3a2c')); clock(91.85, 29.75, 15);
    ground(86.6, 32.2, 7, 1.6, T.PLAZA);
    B(82.6, 27.8, 3.4, 2.3, 9, WH, { cw: 4, ww: 1, wh: 4, win: C('#7a8a96'), litP: 0 }); gable(82.6, 27.8, 3.4, 2.3, 3, 9, false, C('#8a8f9a'));
    churchSpire(83.4, 26.2, 1.4, 1.5, 17, 22, WH, C('#8a8f9a'));
    // Commercial Street
    ground(81, 27, 1, 8, T.BRICK);
    for (let k = 0; k < 5; k++) { pub(79.4, 27 + k * 1.6, 1.6, 1.5, 10 + (k & 1) * 6, r, k); if (k > 1) pub(82.1, 27 + k * 1.6, 1.6, 1.5, 10 + (k & 1) * 6, r, k + 3); }
    for (let k = 0; k < 7; k++) bulbs([79.9, 27.5 + k * 1.1, 12], [82.6, 27.5 + k * 1.1, 12], 0.8, [C('#ff9ac0'), C('#ffd27a')], 2);
    for (let k = 0; k < 30; k++) person(81.1 + r() * 0.8, 27.2 + r() * 7.5, pick(r, PCOL), 0, 0.4);
    // Church Street: a narrow, busy pub and bookshop lane
    ground(73, 41.6, 22, 1.5, T.BRICK); ground(73, 43.1, 22, 1.3, T.PLAZA);
    const FAC = ['#a8452f', '#2f8f8f', '#d9a521', '#6a3a6a', '#2a2a30', '#f1e6cf', '#c8452f', '#3f6fb5', '#e8799c'].map(C);
    const BLADE = ['#ff3a7a', '#ffd23a', '#2fe0e0', '#ff8a2a', '#a0ff3a', '#ffffff'].map(C);
    let i = 73.1, n = 0;
    while (i < 94.2) {
      const w = 1.6 + r() * 1.3, fl = 1 + ri(r, 3), h = fl * 6 + 7, base = FAC[(n * 4 + ri(r, 9)) % 9], aw = pick(r, AW), dk = base === FAC[4];
      B(i, 39.6, w, 2.0, h, base, { cw: 4, win: dk ? C('#ffdf80') : C(['#3d5a4a', '#2a2a30', '#f1e6cf'][n % 3]), band: sh(base, dk ? 1.5 : 0.8), cornice: dk ? C('#ff3a7a') : sh(base, 1.12), litP: 2, shop: [aw[0], aw[1], C('#2a2224')], roof: roofM(sh(base, 0.8)) });
      if (fl < 3 && r() < 0.7) terrace(i + 0.1, 39.7, w - 0.2, 1.8, h, r, 1 + ri(r, 2));
      const bc = BLADE[n % 6], bx_ = Math.round(sx(i + w - 0.12, 41.65)), by_ = Math.round(sy(i + w - 0.12, 41.65, h - 5));
      R(bx_, by_, 1, 6, bc, i + w + 41.65 + 1.5); R(bx_ - 1, by_ - 1, 3, 1, STEELD, i + w + 41.65 + 1.5); light(bx_, by_ + 3, bc, i + w + 41.65 + 1.5);
      i += w; n++;
    }
    i = 73.1;
    while (i < 94.2) {
      const w = 1.4 + r() * 1.4, h = 7 + ri(r, 2) * 3, base = FAC[(n * 5 + ri(r, 9)) % 9], aw = pick(r, AW);
      B(i, 44.4, w, 1.6, h, base, { cw: 4, win: C('#2a2224'), band: sh(base, 0.8), litP: 2, shop: [aw[0], aw[1], C('#2a2224')], roof: sh(base, 0.8) });
      terrace(i + 0.1, 44.5, w - 0.2, 1.4, h, r, 1 + ri(r, 2));
      const bc = BLADE[(n + 3) % 6], bx_ = Math.round(sx(i + w - 0.12, 46.05)), by_ = Math.round(sy(i + w - 0.12, 46.05, h - 4));
      R(bx_, by_, 1, 6, bc, i + w + 46.05 + 1.5); light(bx_, by_ + 3, bc, i + w + 46.05 + 1.5);
      i += w; n++;
    }
    for (let k = 74; k < 94; k += 2) bulbs([k, 41.6, 12], [k, 44.4, 8], 1.3, [C('#ff7ab0'), C('#ffc060')], 2.2);
    bulbs([73.3, 42.7, 10], [94.7, 42.7, 10], 2.0, [C('#ff7ab0'), C('#ffc060')], 2);
    for (let k = 0; k < 40; k++) book(74 + r() * 20, r() < 0.5 ? 41.7 : 43.3, r);
    for (let k = 0; k < 7; k++) { const cx_ = 75.2 + k * 3, c1 = pick(r, BOOK); box(cx_, 43.2, 0.8, 0.35, 2, 0, WOOD, WOOD, sh(WOOD, 0.7), { ns: 1 }); for (let q = 0; q < 5; q++) R(Math.round(sx(cx_ + 0.1 * q, 43.3)) + q - 1, Math.round(sy(cx_, 43.3, 2)) - 1, 1, 2, BOOK[(q + k) % BOOK.length], cx_ + 43.5); void c1; }
    for (let k = 0; k < 9; k++) { box(74.6 + k * 2.3, 43.7, 0.5, 0.25, 1, 0, WOOD, WOOD, sh(WOOD, 0.7), { ns: 1 }); bush(75.4 + k * 2.3 + 1.0, 41.75, C('#3f8a3f')); }
    for (const bx of [80.6, 88.2]) {
      person(bx, 42.5, C('#f1ead8')); R(Math.round(sx(bx, 42.5)) + 1, Math.round(sy(bx, 42.5)) - 2, 2, 1, C('#8a5a34'), bx + 42.5 + 0.3);
      for (let k = 0; k < 14; k++) { const a = k * 0.45; person(bx + Math.cos(a) * (0.55 + (k % 3) * 0.2), 42.5 + Math.sin(a) * (0.45 + (k % 3) * 0.12), pick(r, PCOL), 0, 0.3); }
    }
    for (let k = 0; k < 110; k++) person(73.4 + r() * 21.2, 41.7 + r() * 1.35, pick(r, PCOL), 0, 0.3);    // auto stand
    ground(90, 44.4, 4, 1.4, T.PLAZA);
    for (let k = 0; k < 6; k++) { vehicle('auto', 90.4 + k * 0.62, 45.0, 0, 'i'); if (k & 1) person(90.4 + k * 0.62, 45.7, pick(r, PCOL)); }
    claim(90, 44, 4, 2);
    fill(73, 25, 95, 47, 'cantonment', r);
  }
  function book(i, j, r) { const x = Math.round(sx(i, j)), y = Math.round(sy(i, j)); R(x, y - 1, 2, 1, pick(r, BOOK), i + j + 0.22); R(x, y - 2, 2, 1, pick(r, BOOK), i + j + 0.22); }

  function r2c5(r) {
    shield(108, 38, 120, 47, 1); shield(107, 27, 115, 34, 1);
    for (const [ci, cj, a, b] of [[102.2, 33.0, 1.0, 0.8], [105.6, 37.8, 1.1, 0.9], [101.6, 38.6, 0.9, 0.8], [107.2, 34.0, 0.8, 0.7], [103.6, 41.2, 0.7, 0.6]]) {
      gDisc(ci, cj, a, b, T.GRASS);
      tree(ci - 0.9, cj - 0.8, 7, ci * 3), tree(ci - 0.1, cj - 0.6, 6, cj * 5);
    }
    tree(103.2, 34.6, 8, 3);
    vehicle('pedal', 104.4, 35.4, 0, 'i', C('#f4f1e6')); vehicle('pedal', 102.6, 40.0, 0, 'j', C('#e8799c')); vehicle('pedal', 105.6, 32.0, 0, 'i', C('#f4c531'));
    for (let k = 0; k < 20; k++) { const a = k * Math.PI * 2 / 20 + 0.1; person(103.5 + 5.3 * Math.cos(a), 36 + 6.8 * Math.sin(a), pick(r, PCOL), 0, 0.4); }
    // Halasuru Someshwara
    const gr = C('#9a959b'), gd = C('#7d7880');
    ground(110.2, 39.6, 6, 4.8, T.PLAZA);
    B(111, 40, 4, 2.0, 4, gr, { mats: pairM(() => archM(gr, gd, { cw: 4, rh: 4, cap: sh(gr, 1.1) })), roof: sh(gr, 1.05) });
    pyr(112.2, 40.1, 1.6, 1.6, 7, 4, gr);
    gopuram(111.2, 41.8, 3.2, 2.2, 26, 0, gr, GOLD, { n: 7, tiers: ['#e8b84a', '#c8452f', '#4a8f5a', '#f4efe2', '#3f6fb5', '#e88aa8', '#f08a24'].map(C), roof: C('#c8452f') });
    for (let k = 0; k < 16; k++) person(110.6 + r() * 5, 43.7 + r() * 0.8, pick(r, PCOL));
    // Gurudwara
    ground(108, 28, 5.4, 4.6, T.PLAZA);
    B(108.8, 28.5, 3.4, 2.6, 9, WH, { cw: 4, ww: 1, wh: 3, win: C('#7a8a96'), band: C('#e8e0cc'), litP: 3 });
    drum(110.5, 29.8, 9, 1.0, 2, WH, WH); dome(110.5, 29.8, 11, 1.0, 7, GOLD, { rib: 3 });
    for (const [a, b] of [[109.2, 28.9], [111.9, 28.9], [109.2, 31.0], [111.9, 31.0]]) dome(a, b, 9, 0.3, 3, GOLD);
    line3([112.9, 31.8, 0], [112.9, 31.8, 14], C('#e8e0cc'), 0.3); R(Math.round(sx(112.9, 31.8)), Math.round(sy(112.9, 31.8, 14)), 3, 2, C('#f08a24'), 112.9 + 31.8 + 0.5);
    crowd(108.4, 32, 4.4, 1.6, 16, r, PCOL);
    fill(97, 25, 120, 47, 'bungalow', r);
  }


  function handcart(i, j, c) {
    box(i, j, 0.7, 0.36, 2, 0, stripeM(c, WH, false, 3), WOOD, sh(WOOD, 0.75), { ns: 1, ng: 1 });
    const x = Math.round(sx(i + 0.3, j + 0.4)), y = Math.round(sy(i + 0.3, j + 0.4)); R(x - 1, y - 1, 1, 1, BLK, i + j + 0.9); R(x + 3, y - 2, 1, 1, BLK, i + j + 0.9);
  }
  function basket(i, j, c) { const x = Math.round(sx(i, j)), y = Math.round(sy(i, j)); R(x - 1, y - 1, 3, 2, c, i + j + 0.25); R(x - 1, y - 2, 3, 1, sh(c, 1.15), i + j + 0.25); }

  function r3c1(r) {
    shield(14, 50, 23, 62, 2); shield(12, 64, 23, 71, 1); shield(5, 59, 15, 66, 1);
    const sc = C('#f1e3c4'), red = C('#b4402f');
    ground(5.4, 54.4, 9.2, 5.0, T.PLAZA);
    const mm = pairM(() => wallM(sc, { cw: 4, ww: 2, wh: 3, win: C('#6a3a30'), band: red, cornice: red, plinth: red, litP: 3, rh: 5 }));
    B(5.4, 52, 9.2, 2.4, 10, sc, { mats: mm, roof: roofM(C('#8a3a30')) });
    gable(5.4, 52, 9.2, 2.4, 2, 10, false, C('#a84a35'));
    B(9.0, 52.4, 1.8, 1.7, 4, sc, { z: 10, nc: 1, cw: 4, win: C('#6a3a30'), band: red, cornice: red, litP: 0 }); pyr(9.0, 52.4, 1.8, 1.7, 5, 14, C('#a84a35')); clock(9.9, 54.15, 11);
    const wm = pairM(() => archM(sc, C('#4a2a22'), { cw: 4, rh: 6, cap: red, lit: 3 }));
    B(5.4, 54.4, 1.7, 4.8, 8, sc, { mats: wm, roof: roofM(C('#8a3a30')) });
    flowerDisc(8.6, 56.4, 1.55, [C('#e8761c'), C('#f6c832'), C('#e8761c'), C('#f9d84a')], true);
    flowerDisc(11.4, 56.7, 1.5, [C('#c8305a'), C('#ee7a9a'), C('#f6e6ec'), C('#d8406a')], true);
    flowerDisc(10.0, 58.3, 1.1, [C('#f6f2e4'), C('#ffffff'), C('#ece6d2')], true);
    for (let k = 0; k < 16; k++) mound(7.2 + k * 0.38, 59.25, k % 3 === 0 ? JASM : k % 3 === 1 ? MARI : [C('#c8305a'), C('#ee7a9a')]);
    for (let k = 0; k < 5; k++) handcart(7.4 + k * 1.1, 54.9 + (k & 1) * 0.1, pick(r, TARP));
    for (let k = 0; k < 10; k++) basket(7.2 + r() * 5.4, 55 + r() * 4, pick(r, [C('#f08a24'), C('#c8305a'), C('#f1ead8'), C('#f6c832')]));
    crowd(7, 54.6, 5.8, 4.6, 52, r, PCOL);
    claim(5, 52, 10, 8);
    // fort gate and bastions
    const st = C('#8f8c88'), gate = (a, t, h) => ((a > 13 && a < 23 && t > 2) ? C('#2a2220') : (t === 0 && a % 4 < 2 ? sh(st, 1.2) : ((a >> 2) + t) % 5 === 0 ? sh(st, 0.88) : st));
    B(9.6, 60.2, 3.6, 1.6, 9, st, { mats: [gate, shadeM(gate, 0.76)], roof: sh(st, 1.05) });
    for (const ci of [9.1, 13.7]) { drum(ci, 61.0, 0, 0.82, 11, sh(st, 1.1), (a, t, h) => (t === 0 ? sh(st, 1.2) : ((a >> 2) + t) % 5 === 0 ? sh(st, 0.88) : st)); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; box(ci + Math.cos(a) * 0.74 - 0.07, 61.0 + Math.sin(a) * 0.74 - 0.07, 0.15, 0.15, 2, 11, st, st, sh(st, 0.72), { ns: 1, ng: 1 }); } }
    claim(8.6, 60, 6, 2);
    for (let k = 0; k < 6; k++) { person(10 + k * 0.5, 62.2, pick(r, PCOL)); }
    // Tipu's Summer Palace
    ground(13.4, 61.8, 6.4, 4.4, T.LAWN); pathSeg(16.3, 65.8, 16.3, 70, 0.9, T.REDPATH);
    const tk = pairM(() => archM(C('#b98350'), C('#5a3a20'), { cw: 5, rh: 7, cap: sh(TEAK, 0.7), lit: 2, seed: 4 }));
    B(14, 62.2, 4.6, 3.1, 14, C('#b98350'), { mats: tk, roof: C('#9a6636') });
    box(13.9, 62.1, 4.8, 3.3, 1, 14, sh(TEAK, 0.72), sh(TEAK, 0.72), sh(TEAK, 0.55), { ns: 1, ng: 1 });
    box(14.0, 65.2, 4.6, 0.35, 1, 7, sh(TEAK, 0.7), TEAK, sh(TEAK, 0.6), { ns: 1, ng: 1 });
    for (const [a, b] of [[14.2, 62.4], [17.6, 62.4], [14.2, 64.4], [17.6, 64.4]]) pyr(a, b, 0.7, 0.7, 4, 15, C('#e8d6a8'));
    for (const [i, j] of [[13.5, 63], [19.2, 63.2], [14, 66], [18.6, 66]]) tree(i, j, 3, i * 3);
    for (let k = 0; k < 8; k++) person(14.4 + r() * 4, 66 + r() * 1.5, pick(r, PCOL));
    claim(13, 61, 7, 6);
    fill(0, 49, 23, 71, 'pete', r);
  }

  function r3c2(r) {
    landFn(25, 49, 47, 70, T.GRASS);
    for (let k = 0; k < 36; k++) { const ci = 26 + hs(k, 1) % 20, cj = 50 + hs(k, 2) % 19; gFn(ci - 2, cj - 1.3, ci + 2, cj + 1.3, (i, j) => (!lakeNear(i, j, 0.8) && ((i - ci) / 2) ** 2 + ((j - cj) / 1.3) ** 2 <= 1 ? T.LAWN : 0)); }
    shield(25, 49, 47, 70, 4);
    pathSeg(25, 52.6, 47, 52.6, 0.8); pathSeg(37, 49, 37, 54, 0.8); pathSeg(26, 61.4, 46, 61.4, 0.8); pathSeg(30, 49, 30, 63, 0.7); pathSeg(44, 52, 44, 62, 0.7); pathSeg(26, 69, 40, 69, 0.7);
    // Glass House
    const aq = C('#bfe8e2'), gm = (a, t, h, x, y) => (t === 0 || a % 4 === 0 || (h - 1 - t) % 5 === 0 ? WH : (hs(x >> 1, y >> 1) % 13 === 0 ? C('#eefaf8') : aq));
    const gm2 = shadeM(gm, 0.8);
    B(33, 56, 8, 2, 5, aq, { mats: [gm, gm2], roof: aq }); gable(33, 56, 8, 2, 4, 5, false, aq);
    B(36, 54, 2, 6, 5, aq, { mats: [gm, gm2], roof: aq, nc: 1 }); gable(36, 54, 2, 6, 4, 5, true, aq);
    B(35.4, 55.4, 3.2, 3.2, 11, aq, { mats: [gm, gm2], roof: aq, nc: 1 });
    gable(35.4, 55.4, 3.2, 3.2, 6, 11, false, aq, true); gable(35.4, 55.4, 3.2, 3.2, 3, 17, true, WH, true);
    line3([37, 56, 20], [37, 58, 20], WH, 0.4); pt(37, 57, 21, GOLD, 0.6); pt(37, 57, 22, GOLD, 0.6);
    for (let k = 0; k < 8; k++) line3([33 + k, 58.02, 5], [33 + k, 58.02, 9], WH, 0.3);
    claim(33, 54, 8, 6);
    groundFn(31, 60.2, 43.5, 64.5, (i, j) => { const dx = i - 37, dy = j - 60.2; if (dy < 0 || Math.hypot(dx, dy * 1.2) > 5.2 || lakeNear(i, j, 0.8)) return 0; const s = Math.floor(Math.atan2(dy, dx) / (Math.PI / 12)); return s % 3 === 0 ? T.REDPATH : s % 3 === 1 ? T.FLOWER : T.LAWN; });
    for (let k = 0; k < 18; k++) person(32 + r() * 10, 60.4 + r() * 3.2, pick(r, PCOL));
    // floral clock
    flowerDisc(29.4, 60.2, 1.65, [C('#2f8f4a'), C('#f1ead8'), C('#e8b830'), C('#d8302a'), C('#f1ead8')], true);
    line3([29.4, 60.2, 0], [30.3, 59.7, 0], BLK, 0.5); line3([29.4, 60.2, 0], [29.0, 59.5, 0], BLK, 0.5);
    claim(27.5, 58.4, 4, 3.6);
    // rock hill with the watch tower
    const pk = [C('#b8a29c'), C('#a58f8c'), C('#c8b4ac')];
    roundHill(43.6, 65.7, 2.8, 3.7, 20, 0, { cols: [C('#cdb9b3'), C('#c9b5af'), C('#d1beb8')], smooth: 1 });
    for (const [a, b] of [[43.0, 65.1], [44.1, 65.1], [43.0, 66.2], [44.1, 66.2]]) box(a, b, 0.22, 0.22, 7, 18.5, C('#8a7a6a'), C('#8a7a6a'), C('#5a4a3c'), { ns: 1, ng: 1 });
    box(42.8, 64.9, 1.7, 1.7, 1, 25.5, WH, WH, C('#cfc9bb'), { ns: 1, ng: 1 }); dome(43.65, 65.75, 26.5, 0.7, 5, C('#e8d8a0')); pt(43.65, 65.75, 32, GOLD, 1.5);
    for (let k = 0; k < 46; k++) {
      const a = k * Math.PI * 2 / 46, i = 43.6 + Math.cos(a) * 3.3, j = 65.7 + Math.sin(a) * 4.3;
      if (i > 46.9 || j > 69.7) continue;
      person(i, j, pick(r, PCOL), 0, 0.4); const x = Math.round(sx(i, j)), y = Math.round(sy(i, j)); R(x - 1, y - 5, 3, 2, C('#2f9a4a'), i + j + 0.42); R(x, y - 5, 1, 1, WH, i + j + 0.43);
    }
    // the park
    const clr = [[37, 62.5, 6.2, 3.2], [37, 57, 5, 4], [29.4, 60.2, 2.8, 2.6], [43.6, 65.7, 4.6, 5.4]];
    const inClr = (i, j) => clr.some((e) => ((i - e[0]) / e[2]) ** 2 + ((j - e[1]) / e[3]) ** 2 < 1);
    for (let j = 49; j < 70; j++) for (let i = 25; i < 47; i++) {
      if (!isFree(i, j, 1, 1) || inClr(i + 0.5, j + 0.5)) continue;
      const u = r();
      if (u < 0.9) plant2(i, j, treeKind(r, i, j), r); else { claim(i, j, 1, 1); if (u < 0.95) person(i + r(), j + r(), pick(r, PCOL)); }
    }
  }

  function r3c3(r) {
    shield(54, 53, 61, 60, 2); shield(65, 64, 71, 70, 2);
    // lanes with a signal junction
    ground(65, 50, 1, 20, T.LANE); ground(49, 55, 22, 1, T.LANE);
    for (const [a, b] of [[64.6, 54.6], [66.3, 54.6], [64.6, 56.3], [66.3, 56.3]]) { pole(a, b, 8, C('#3a3a44')); glow(a, b, 9, a < 65 ? C('#ff4a3a') : C('#4af08a')); }
    for (let k = 0; k < 6; k++) { pt(63.7, 55.1 + k * 0.15, 0, WH, 0.3); pt(67.2, 55.1 + k * 0.15, 0, WH, 0.3); }
    for (let k = 0; k < 5; k++) { vehicle('scooter', 52 + k * 1.2, 55.5, 0, 'i', k & 1 ? C('#e43f6f') : C('#ff7a1f')); vehicle('car', 66 - 0.5 + 0, 58 + k * 1.1, 0, 'j', pick(r, [C('#f2efe6'), C('#9aa5ad'), C('#3b78c2')])); }
    // Nexus-like mall
    const fm = pairM(() => (a, t, h) => { const fb = h - 1 - t; if (t === 0) return C('#e8e8ee'); if (fb < 2) return C('#2f3a48'); const c = [C('#2fb0b0'), C('#f06a5a'), C('#f2c332'), C('#6a5ad8')][((a >> 3) + (fb > 6 ? 1 : 0)) % 4]; return (fb % 5 === 2 || fb % 5 === 3) ? (hs(a, fb) % 3 ? C('#bfe4ee') : C('#ffe8a8')) : c; });
    B(51.4, 52.4, 4.2, 3.2, 14, WH, { mats: fm, roof: C('#d8d8e0') });
    box(51.4, 55.55, 4.2, 0.5, 2, 0, C('#2fb0b0'), C('#2fb0b0'), C('#1f8888'), { ns: 1 });
    for (let k = 0; k < 14; k++) person(51.5 + r() * 4, 56.2 + r() * 1.2, pick(r, PCOL));
    // park of laptops
    park(57, 56.8, 64, 62.6, r, { tp: 0.3 });
    for (let k = 0; k < 14; k++) laptopPerson(57.4 + r() * 6, 57.2 + r() * 5, pick(r, PCOL));
    for (let k = 0; k < 4; k++) { const i = 58 + k * 1.6, j = 60.2; box(i, j, 0.5, 0.25, 1, 0, WOOD, WOOD, sh(WOOD, 0.7), { ns: 1 }); }
    // garage startup
    const cm = pairM(() => { const w = wallM(C('#f3eadb'), { cw: 4, ww: 2, wh: 3, win: C('#3d5a6b'), band: C('#d8c9b0'), litP: 2, b0: 6, plinth: C('#d8c9b0') }); return (a, t, h, x, y, d) => { const fb = h - 1 - t; if (fb < 5 && a > 3 && a < 13) return fb % 2 ? C('#8a8f98') : C('#6a6f78'); return w(a, t, h, x, y, d); }; });
    B(66.2, 61.4, 2.2, 2.2, 24, C('#f3eadb'), { mats: cm, roof: C('#d8c9b0') });
    for (let k = 0; k < 6; k++) bag(66.3 + (k % 3) * 0.4, 63.8 + (k >> 1) * 0.1, 0, C('#b8905a'));
    bag(66.5, 63.85, 2, C('#a8804a')); bag(66.9, 63.85, 2, C('#c0985c')); bag(67.3, 63.85, 2, C('#a8804a')); bag(66.7, 63.85, 4, C('#c0985c'));
    crowd(66.1, 64.2, 3, 1.4, 12, r, PCOL);
    claim(66, 61, 3, 4);
    for (const [i, j, w, h, c] of [[59.2, 51.2, 2.2, 2.2, '#6fb0c4'], [68, 52, 2.2, 2.2, '#8cc4c0'], [56.6, 66.2, 2.2, 2.2, '#4f8fae']]) { if (isFree(i | 0, j | 0, 3, 3)) tower(i, j, w, w, 16 + (i % 5), C(c), r); }
    fill(49, 49, 71, 71, 'layout', r);
  }

  function copperTank(i, j, z) { drum(i, j, z, 0.3, 6, C('#d8a070'), (a, t, h) => (t === 0 || t === h - 1 ? C('#8a5a30') : C('#c0733a'))); }
  function brewpub(i, j, w, d, r, n, h) {
    const base = C(['#f1d6c8', '#d8e0d0', '#cfd8e0', '#f6e6b8'][n % 4]), aw = CAFE[n % CAFE.length];
    B(i, j, w, d, h, base, { cw: 4, win: C('#3f4a55'), band: sh(base, 0.84), cornice: C('#f2f0ea'), litP: 2, shop: [aw[0], aw[1], C('#2a2224')], roof: C('#d8d4cc') });
    for (let k = 0; k < 3; k++) copperTank(i + 0.5 + k * (w - 1) / 2, j + d * 0.45, h);
    umbrella(i + 0.4, j + d - 0.3, h + 1, aw[0]); umbrella(i + w - 0.6, j + d - 0.3, h + 1, aw[0]);
    bulbs([i, j + d, h + 5], [i + w, j + d, h + 5], 1.0, [C('#ffd27a'), C('#ff9ac0')], 2.2);
    for (let k = 0; k < 2; k++) copperTank(i + 0.4 + k * 0.7, j + d + 0.75, 0);
    crowd(i - 0.2, j + d + 0.1, w + 0.4, 1.2, 14, r, PCOL);
    bulbs([i - 0.3, j + d + 1.4, 6], [i + w + 0.3, j + d + 1.4, 6], 0.8, [C('#ffd27a'), C('#ff9ac0')], 2.4);
  }
  function r3c4(r) {
    shield(76, 56, 94, 68, 2);
    ground(84, 49, 1, 21, T.ROAD); ground(73, 58, 22, 1, T.LANE);
    for (let j = 49; j < 70; j++) for (const i of [83, 85]) { if (j === 58 || !isFree(i, j, 1, 1)) continue; if (r() < 0.82) { gRect(i, j, 1, 1, T.GRASS); plant(i, j, 7); } }
    brewpub(78.6, 55.6, 3.0, 2.2, r, 0, 14); brewpub(86.4, 55.4, 3.4, 2.4, r, 1, 14); brewpub(80.4, 60.4, 2.8, 2.2, r, 2, 14); brewpub(86.4, 61.6, 3.2, 2.2, r, 3, 14);
    for (let k = 0; k < 7; k++) bulbs([74 + k * 3, 58.1, 8], [75.6 + k * 3, 58.9, 7], 0.5, [C('#ff9ac0'), C('#ffd27a')], 2);
    for (let k = 0; k < 20; k++) vehicle('scooter', 84.5, 50 + k * 1.0, 0, 'j', k & 1 ? C('#e43f6f') : C('#ff7a1f'));
    fill(73, 49, 95, 58, 'layout', r);
    fill(73, 59, 95, 71, 'bungalow', r);
  }

  function r3c5(r) {
    shield(100, 58, 120, 70, 3); shield(113, 52, 120, 60, 3);
    ground(103, 52, 10, 9, T.PLAZA);
    tower(104.0, 53.0, 2.6, 2.6, 66, C('#6fb0c4'), r, { crown: 1 }); tower(107.2, 53.6, 2.6, 2.6, 56, C('#4f8fae'), r); tower(110.2, 54.2, 2.4, 2.4, 48, C('#8cc4c0'), r);
    tower(100.6, 56.2, 2.4, 2.4, 44, C('#7d8fb8'), r); tower(112.2, 57.2, 2.4, 2.4, 50, C('#6fb0c4'), r);
    const pm = pairM(() => glassM(C('#b4c6d2'), {}));
    B(104.4, 57.4, 7.4, 3.2, 6, C('#b4c6d2'), { mats: pm, roof: C('#9fb2c0') });
    for (let k = 0; k < 6; k++) { const i = 104.6 + k * 1.2; box(i, 60.9, 0.2, 0.2, 5, 0, WH, WH, C('#cfd6dc'), { ns: 1 }); }
    for (let k = 0; k < 4; k++) plant(104 + k * 2.4 | 0, 61, 3);
    crowd(103, 60.8, 10, 1.6, 26, r, PCOL);
    // Inner Circle
    groundFn(98.4, 63.4, 103.8, 69.6, (i, j) => { const q = ((i - 101.1) / 2.7) ** 2 + ((j - 66.5) / 2.9) ** 2; return q <= 1 ? (q > 0.45 ? T.LANE : T.LAWN) : 0; });
    for (let k = 0; k < 9; k++) { const a = k * Math.PI * 2 / 9 + 0.3, i = 101.1 + Math.cos(a) * 2.3, j = 66.5 + Math.sin(a) * 2.45; B(i - 0.5, j - 0.4, 1.0, 0.8, 4, pick(r, [C('#f4eddc'), C('#efe0c0'), C('#e8c9b0')]), { cw: 4, win: C('#8a3f2e'), litP: 3, nc: 1, roof: pick(r, TILE) }); gable(i - 0.5, j - 0.4, 1.0, 0.8, 3, 4, k & 1, pick(r, TILE), false); }
    B(100.5, 66.0, 1.2, 1.0, 5, WH, { cw: 4, ww: 1, wh: 3, win: C('#7a8a96'), litP: 0, nc: 1 }); gable(100.5, 66.0, 1.2, 1.0, 3, 5, true, C('#8a8f9a')); spire(101.1, 66.5, 8, 0.25, 6, WH);
    for (let k = 0; k < 24; k++) { const a = k * Math.PI * 2 / 24, i = 101.1 + Math.cos(a) * 2.75, j = 66.5 + Math.sin(a) * 2.95; bush(i, j, C('#2f6a35')); }
    for (let k = 0; k < 8; k++) person(99.6 + r() * 3, 64.4 + r() * 4, pick(r, PCOL));
    claim(98, 63, 6, 7);
    crane(99.5, 52.4, 40); crane(114.6, 55.6, 34); crane(110.6, 63.2, 28);
    fill(97, 49, 120, 70, 'tech', r, { treeP: 0.22, cap: 5 });
  }


  function steam(i, j, z) { const x = Math.round(sx(i, j)), y = Math.round(sy(i, j, z)), d = i + j + 0.9; R(x, y - 1, 1, 1, C('#eef0f2'), d); R(x + 1, y - 3, 1, 1, C('#dfe3e6'), d); R(x, y - 5, 1, 1, C('#cfd5d9'), d); }

  function r4c1(r) {
    shield(4, 82, 12, 86, 1); shield(14, 87, 23, 96, 1); shield(15, 85, 23, 88, 1);
    // VV Puram food street
    ground(6, 75, 17, 1, T.LANE);
    for (let i = 6; i < 22; i++) for (const j of [74, 76]) if (isFree(i, j, 1, 1) && r() < 0.82) { smallStall(i, j, r); if (r() < 0.6) steam(i + 0.5, j + 0.5, 4); if (r() < 0.5) glow(i + 0.5, j + (j === 74 ? 1 : 0), 6, C('#ffd27a')); }
    for (let k = 0; k < 4; k++) bulbs([6 + k * 4.2, 75.5, 10], [10 + k * 4.2, 75.5, 10], 1.6, [C('#ffd27a'), C('#ff9ac0'), C('#ffd27a')], 2);
    crowd(6, 75, 16.5, 1, 44, r, PCOL);
    // Bull Temple
    hillStack(4.6, 76.8, 6.6, 5.4, 5, 0, (t) => 0.1 * t, GRY, C('#6a9a48'), 6, 3); claim(4, 76.6, 8, 6);
    gopuram(5.0, 77.2, 3.4, 2.6, 15, 5, C('#a9a49c'), C('#f1ead8'), { n: 5, tiers: [C('#a9a49c'), C('#c9c2b4'), C('#a9a49c'), C('#c9c2b4'), C('#a9a49c')], roof: C('#c8b79a') });
    for (const [a, b] of [[8.6, 79.9], [10.7, 79.9], [8.6, 81.7], [10.7, 81.7]]) box(a, b, 0.28, 0.28, 12, 5, C('#b9b4ac'), C('#b9b4ac'), C('#8d8890'), { ns: 1, ng: 1 });
    box(8.4, 79.7, 2.8, 2.4, 1, 17, C('#b9b4ac'), C('#b9b4ac'), C('#8d8890'), { ns: 1, ng: 1 }); pyr(8.5, 79.8, 2.6, 2.2, 4, 18, C('#8f8c88')); pt(9.8, 80.9, 23, GOLD, 1.5);
    const nd = C('#3f3f48'), nl = C('#4f4f5a');
    for (const [a, b] of [[9.1, 81.05], [10.0, 81.05], [9.1, 81.6], [10.0, 81.6]]) box(a, b, 0.15, 0.15, 2.5, 5, nd, nd, nd, { ns: 1, ng: 1 });
    box(9.0, 81.0, 1.5, 0.7, 3.5, 7.5, nl, nd, sh(nd, 0.8), { ns: 1, ng: 1 }); box(9.2, 81.05, 0.6, 0.6, 2, 11, nl, nd, sh(nd, 0.8), { ns: 1, ng: 1 });
    box(10.35, 81.0, 0.6, 0.55, 3, 8.5, nl, nd, sh(nd, 0.8), { ns: 1, ng: 1 }); pt(10.4, 81.05, 13, C('#e8e0d0'), 1.4); pt(10.95, 81.05, 13, C('#e8e0d0'), 1.4);
    for (let k = 0; k < 14; k++) person(5 + r() * 8, 82.4 + r() * 0.5, pick(r, PCOL), 0, 0.4);
    // Kadalekai Parishe
    ground(0, 83, 11.8, 1, T.LANE);
    for (let k = 0; k < 22; k++) mound(0.5 + k * 0.5, 83.4 + (k % 2) * 0.1, [C('#c99a5b'), C('#b8884a'), C('#d8aa6a')]);
    for (let i = 0; i < 11; i += 1) if (isFree(i, 84, 1, 1) && r() < 0.55) smallStall(i, 84, r);
    for (let k = 0; k < 10; k++) { const c = pick(r, PCOL), i = 0.6 + k * 1.1; box(i, 82.5, 0.3, 0.3, 3, 0, c, c, sh(c, 0.75), { ns: 1 }); }
    crowd(0, 83, 11.8, 1.2, 50, r, PCOL);
    gRect(11, 80, 6, 5.4, T.GRASS); groundDisc(13.5, 82.5, 1.6, 1.6, T.DIRT); claim(11, 80, 6, 5);
    // Vidyarthi Bhavan
    B(15, 85, 3.2, 2.0, 9, C('#f6e6a8'), { mats: pairM(() => signM(C('#f6e6a8'), C('#2f6b4a'), { cw: 4, win: C('#6a4a38'), litP: 2, shop: [C('#2f6b4a'), WH, C('#2a2224')] })), roof: C('#a84a35') });
    for (let k = 0; k < 14; k++) person(18.3 + (k & 1) * 0.35, 86.6 + k * 0.34, pick(r, PCOL), 0, 0.4);
    for (let k = 0; k < 4; k++) { box(15.2 + k * 0.8, 87.4, 0.4, 0.4, 2, 0, WOOD, WOOD, sh(WOOD, 0.7), { ns: 1 }); person(15.4 + k * 0.8, 88.1, pick(r, PCOL)); }
    claim(15, 85, 4, 4);
    // Gandhi Bazaar flower sellers
    ground(20, 79, 1, 11, T.LANE);
    for (let k = 0; k < 10; k++) { mound(19.5, 79.6 + k * 1.05, k & 1 ? MARI : JASM); mound(21.3, 80.0 + k * 1.05, k & 1 ? JASM : MARI); if (k % 2 === 0) person(20.4 + r() * 0.3, 79.8 + k * 1.05, pick(r, PCOL)); }
    fill(0, 73, 23, 96, 'bungalow', r);
  }

  function r4c2(r) {
    shield(30, 82, 41, 88, 1); shield(35, 91, 44, 96, 1); shield(40, 87, 46, 92, 1);
    ground(30, 77, 9, 6.6, T.PLAZA);
    const cn = C('#bdb7a8'), shopc = [C('#2f6fb5'), C('#d8302a'), C('#e8b830'), C('#2f8f5a')];
    const fm = (a, t, h, x, y, d) => {
      const fb = h - 1 - t;
      if (t === 0) return sh(cn, 1.1);
      if (fb < 5) { if (fb === 4) return shopc[(a >> 2) % 4]; if (fb === 0) return sh(cn, 0.8); return a % 4 === 3 ? WH : (hs(a >> 2, 7) % 2 ? C('#2a2224') : sh(shopc[(a >> 2) % 4], 0.7)); }
      if (a % 4 === 0) return WH;
      return ((fb - 5) % 5 === 2 || (fb - 5) % 5 === 3) ? (hs(a >> 2, fb) % 4 === 0 ? (light(x, y, C('#ffdf80'), d), C('#ffdf80')) : C('#4a4e56')) : cn;
    };
    B(31, 78, 6.4, 3.8, 15, cn, { mats: [fm, shadeM(fm, 0.74)], roof: sh(cn, 0.9) });
    for (let k = 0; k < 4; k++) box(31.6 + k * 1.6, 78.6, 0.6, 0.6, 3, 15, C('#8a8f98'), C('#8a8f98'), C('#6a6f78'), { ns: 1 });
    for (let k = 0; k < 24; k++) person(30.4 + r() * 8, 82 + r() * 1.2, pick(r, PCOL));
    for (const [i, j] of [[30.3, 77.6], [38.2, 77.6], [30.3, 82.8], [38.2, 82.8]]) tree(i, j, 3, i + j);
    // Ranga Shankara
    B(36, 89, 4, 2.2, 12, BRICK, { mats: pairM(() => { const w = wallM(BRICK, { cw: 4, ww: 1, wh: 3, win: C('#2a2224'), band: WH, cornice: WH, litP: 2, plinth: WH }); return (a, t, h, x, y, d) => ((a > 9 && a < 23 && t > 1 && t < 10) ? ((a === 15 || a === 16) && t > 4 && t < 7 ? WH : C('#d8302a')) : w(a, t, h, x, y, d)); }), roof: C('#8d4a38') });
    ground(36, 91.2, 4, 1.3, T.STEPS);
    crowd(36, 91.3, 4, 1.4, 22, r, PCOL);
    claim(35, 88, 6, 5);
    park(26, 84, 30, 91, r, { tp: 0.4 });
    for (let k = 0; k < 8; k++) person(26.5 + r() * 3, 84.5 + r() * 6, pick(r, PCOL));
    fill(25, 73, 47, 96, 'bungalow', r);
  }

  function r4c3(r) {
    shield(49, 73, 71, 96, 3);
    // pickleball court
    const cl = (x, y, fi, fj) => ((fi < 0.12 || fi > 3.48 || fj < 0.12 || fj > 6.68 || Math.abs(fj - 3.4) < 0.05 || (Math.abs(fj - 3.4) < 1.5 && Math.abs(fi - 1.8) < 0.04)) ? C('#f4f4f4') : (fi < 0.35 || fi > 3.25 || fj < 0.35 || fj > 6.45) ? C('#3f9a5a') : C('#3f7fd0'));
    ground(51.8, 76.8, 4.4, 7.8, T.LAWN);
    box(52.2, 77.2, 3.6, 6.8, 1, 0, cl, C('#3f9a5a'), C('#2f7a45'), { ns: 1, ng: 1 });
    for (let k = 0; k < 8; k++) person(52.7 + r() * 2.6, 77.7 + (k & 1 ? 0 : 3.6) + r() * 2.4, pick(r, PCOL));
    line3([52.2, 80.6, 2], [55.8, 80.6, 2], C('#e8e8e8'), 0.5);
    // matcha cafes
    for (const [i, j] of [[57.6, 76.8], [60.6, 76.8], [63.4, 76.8]]) { B(i, j, 2.2, 1.8, 9, pick(r, [C('#f2f0ea'), C('#e4efdc')]), { cw: 4, win: C('#2f5f4a'), band: C('#cfe0c8'), litP: 2, shop: [C('#3f9a4a'), C('#eef6e4'), C('#2a2224')], roof: C('#d8d4cc') }); terrace(i + 0.1, j + 0.1, 2.0, 1.6, 9, r, 2); }
    crowd(57.4, 78.8, 8.4, 0.8, 14, r, PCOL);
    // the park with a small lake
    const ex = (i, j) => ((i - 61.4) / 2.8) ** 2 + ((j - 88.2) / 2.0) ** 2 < 1.7;
    park(56, 83.4, 68, 94, r, { tp: 0.42, ex });
    groundDisc(61.4, 88.2, 2.5, 1.7, T.POND); ellRing(61.4, 88.2, 2.9, 2.1, C('#c4704e'), 80, 0);
    for (let k = 0; k < 14; k++) { const a = k * Math.PI * 2 / 14; person(61.4 + Math.cos(a) * 3.1, 88.2 + Math.sin(a) * 2.3, pick(r, PCOL), 0, 0.4); }
    for (let k = 0; k < 6; k++) pelican(60 + r() * 3, 87.4 + r() * 1.6);
    fill(49, 73, 71, 96, 'layout', r, { treeP: 0.25 });
  }

  function foam(i, j, r) {
    if (E.S.dry) return;
    const x = Math.round(sx(i, j)), y = Math.round(sy(i, j)), d = i + j + 0.25, n = 2 + (hs(x, y) % 3);
    for (let k = 0; k < n; k++) { const bw = 3 + (hs(k, x) % 3), bh = 2 + (hs(k, y) % 3), ox = k * 3 - n + (hs(k, y) % 2), oy = (hs(k, x) % 3) - 1, c = [C('#f6f3e6'), C('#fffdf4'), C('#e8e4cf')][hs(k, y) % 3];
      for (let row = 0; row < bh; row++) { const top = row === bh - 1 && bh > 2; R(x + ox + (top ? 1 : 0), y + oy - row, bw - (top ? 2 : 0), 1, row === 0 ? sh(c, 0.88) : c, d); } }
  }
  function r4c4(r) {
    // weeds ring (water hyacinth) around the lake, then foam
    gFn(72, 79, 96, 96, (i, j) => { if (L.inLake('bellandur', i, j)) return 0; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; if (L.inLake('bellandur', i + 0.9 * Math.cos(a), j + 0.9 * Math.sin(a))) return T.MARSH; } return 0; });
    const ell = [[83.5, 87, 9, 5.4], [77.5, 89.5, 3.6, 3.4], [90, 85, 3.2, 3.2]];
    let n = 0;
    for (const [ci, cj, a, b] of ell) for (let t = 0; t < 360; t += 11) {
      const an = t * Math.PI / 180, i = ci + (a + 0.2) * Math.cos(an), j = cj + (b + 0.2) * Math.sin(an);
      if (!(Math.cos(an) > 0.2 || Math.sin(an) > 0.3) || !L.inAnyLake(i - Math.cos(an) * 0.3, j - Math.sin(an) * 0.3)) continue;
      n++; const o = (hs(n, 3) % 10) / 6 - 0.5; foam(i + o * Math.cos(an) * 1.2, j + o * Math.sin(an) * 1.2, r); if (n % 3 === 0) foam(i - Math.cos(an) * 1.0, j - Math.sin(an) * 0.8, r);
    }
    for (const [i, j] of [[94.3, 85.6], [94.4, 88.2], [92.4, 92.6], [88.4, 93.4], [84, 93.6], [80.4, 93.3], [93.6, 83.2]]) foam(i, j, r);
    for (let k = 0; k < 6; k++) { const c = k < 3 ? WH : pick(r, PCOL); person(86.2 + k * 0.3, 93.6 + (k & 1) * 0.3, c, 0, 0.4); }
    { const x = Math.round(sx(87.4, 93)), y = Math.round(sy(87.4, 93, 14)), d = 87.4 + 93 + 1; R(x - 2, y, 5, 1, BLK, d); R(x, y - 1, 1, 3, C('#4a4a52'), d); R(x - 2, y - 1, 1, 1, C('#ff4a3a'), d); R(x + 2, y - 1, 1, 1, C('#4af08a'), d); }
    // campuses and low city
    shield(73, 79, 95, 96, 2); shield(93, 79, 96, 94, 2);
    shield(73, 70, 83, 85, 2); fill(73, 73, 95, 79, 'tech', r, { cap: 8 });
    fill(73, 79, 95, 96, 'layout', r);
  }

  function r4c5(r) {
    shield(97, 87, 120, 96, 1); shield(110, 80, 120, 90, 2); shield(103, 87, 112, 96, 0);
    ground(98, 75, 17, 17, T.LAWN); ground(102, 88.4, 18, 1.2, T.LANE);
    // glass pyramid
    const gp = (a, t, h, x, y, d) => { if (x % 6 === 0 || y % 6 === 0) return C('#e8fbff'); const n = hs(x / 6 | 0, y / 6 | 0); if (n % 6 === 0) light(x, y, C('#bff6ff'), d); return ((x / 6 | 0) + (y / 6 | 0)) % 2 ? C('#2fb0cf') : C('#2496b8'); };
    glassPyr(105, 82, 5, 5, 28, 0, C('#2f9fc4'), C('#1b6a8e'), C('#9fdcec'), 14);
    claim(104, 81, 7, 7);
    line3([107.5, 84.5, 28], [107.5, 84.5, 32], C('#cfd6dc'), 0.2); glow(107.5, 84.5, 32, C('#ff6a5a'));
    for (let k = 0; k < 24; k++) { const a = k * 0.8, rr = 3.3; if (r() < 0.5) glow(107.5 + Math.cos(a) * rr, 84.5 + Math.sin(a) * rr, 1, C('#bff6ff')); }
    // auditorium dome and office blocks
    drum(101.4, 85.2, 0, 1.5, 6, C('#e8eef2'), (a, t, h) => (((a >> 1) & 1) ? C('#f1ead8') : C('#2f8f9a'))); dome(101.4, 85.2, 6, 1.5, 9, C('#cfe3f2'), { rib: 5 }); claim(99.5, 83.5, 4, 4);
    const om = pairM(() => wallM(C('#f2f4f6'), { cw: 3, ww: 2, wh: 3, wy: 1, rh: 5, win: C('#4f8fae'), band: C('#c9d4da'), litP: 2, plinth: C('#c9d4da') }));
    B(111.4, 75.6, 7.2, 2.2, 14, C('#f2f4f6'), { mats: om, roof: C('#d8dde0') }); B(99, 75.6, 7.4, 2.2, 14, C('#f2f4f6'), { mats: om, roof: C('#d8dde0') });
    B(98.6, 79.4, 2.2, 5.2, 10, C('#f2f4f6'), { mats: om, roof: C('#d8dde0') });
    tower(112.4, 79.6, 2.6, 2.6, 40, C('#6fb0c4'), r, { crown: 1 }); tower(115.8, 77.6, 2.4, 2.4, 34, C('#4f8fae'), r); tower(116.2, 80.6, 2.2, 2.2, 28, C('#8cc4c0'), r);
    for (let k = 0; k < 6; k++) vehicle('bus', 100 + k * 2.6, 88.9, 0, 'i', k % 2 ? C('#f1ead8') : C('#2f6fb5'));
    for (let k = 0; k < 3; k++) vehicle('car', 104 + k * 1.5, 80.2, 0, 'i', WH);
    for (let i = 98; i < 119; i++) for (const j of [87, 89.8 | 0]) { if (isFree(i, j, 1, 1)) { if (r() < 0.8) { gRect(i, j, 1, 1, T.GRASS); plant(i, j, r() < 0.5 ? 7 : treeKind(r, i, j)); } } }
    for (let k = 0; k < 36; k++) { const i = 99 + r() * 18, j = 76 + r() * 12, x = Math.round(sx(i, j)), y = Math.round(sy(i, j)); person(i, j, pick(r, PCOL), 0, 0.3); R(x, y - 1, 1, 1, C('#ff3a3a'), i + j + 0.31); }
    fill(97, 73, 120, 96, 'tech', r, { cap: 4, treeP: 0.3 });
  }


  const STEPS = [
    ['Surveying the roads of the Garden City', baseGround],
    ['Hoisting the metro viaduct', () => { structures(); streetLamps(); }],
    ['Getting stuck at Silk Board', silkBoard],
    ['Chanting in the ISKCON gopurams', r1c1],
    ['Strolling around Sankey Tank', r1c2],
    ['Tuning up at Palace Grounds', r1c3],
    ['Watching pelicans at Hebbal', r1c4],
    ['Climbing Nandi Hills', r1c5],
    ['Boarding buses at Majestic', r2c1],
    ['Carving granite for Vidhana Soudha', r2c2],
    ['Raking the paths of Cubbon Park', r2c3],
    ['Stringing bulbs on Church Street', r2c4],
    ['Rowing across Ulsoor', r2c5],
    ['Heaping marigolds at KR Market', r3c1],
    ['Polishing the Glass House at Lalbagh', r3c2],
    ['Brewing filter coffee in Koramangala', r3c3],
    ['Pouring a pitcher in Indiranagar', r3c4],
    ['Raising towers in Whitefield', r3c5],
    ['Stacking dosas in Gandhi Bazaar', r4c1],
    ['Counting parks in Jayanagar', r4c2],
    ['Serving matcha in HSR', r4c3],
    ['Foaming Bellandur', r4c4],
    ['Lighting up the pyramid at Electronic City', r4c5],
    ['Planting rain trees', avenues],
    ['Laying the red laterite beneath', slab],
  ];

  function reset() { E.col.fill(0); E.dep.fill(-1e9); E.G.fill(0); E.SHD.fill(0); OCC.fill(0); RD.fill(0); E.lights.length = 0; LOW.length = 0; }
  const runStep = (k) => STEPS[k][1](E.rng(9000 + k * 131));

  function build() {
    reset();
    E.S.dry = true;
    try { for (let k = 0; k < STEPS.length; k++) runStep(k); } finally { E.S.dry = false; }
    E.renderGround();
    OCC.fill(0); LOW.length = 0;
    for (let k = 0; k < STEPS.length; k++) runStep(k);
    return PK.city;
  }
  function buildAsync(onProgress) {
    return new Promise((resolve, reject) => {
      reset();
      let pass = 0, k = 0;
      const N = STEPS.length;
      E.S.dry = true;
      const tick = () => {
        try {
          if (k < N) {
            runStep(k);
            if (onProgress) onProgress((pass * N + k + 1) / (2 * N), STEPS[k][0]);
            k++; setTimeout(tick, 0);
          } else if (pass === 0) {
            E.S.dry = false; E.renderGround(); OCC.fill(0); LOW.length = 0; pass = 1; k = 0; setTimeout(tick, 0);
          } else resolve(PK.city);
        } catch (e) { E.S.dry = false; reject(e); }
      };
      setTimeout(tick, 0);
    });
  }

  PK.city = { build, buildAsync, fill, steps: STEPS.map((s) => s[0]) };
  if (typeof module !== 'undefined') module.exports = PK;
})(typeof window !== 'undefined' ? window : globalThis);
