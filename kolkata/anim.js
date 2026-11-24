/* Whole Truth Maps: Kolkata — the moving layer.
   Sprites are drawn with the same iso primitives as the city, depth-tested against the static
   depth buffer so a tram really does pass behind a building. Only dirty 32px tiles are repainted.

   Two moods:
   truth  → calm afternoon: traffic, trams, boats, birds.
   whole  → dusk: headlights, the bridge lit in colours, fairy lights, and small reaction icons
            rising from each place (what people feel there, not what the plaque says). */
(function (root) {
  'use strict';
  const PK = (root.PK = root.PK || {});
  const E = PK.E, L = PK.L;
  if (!E || !L) return;
  const W = E.W, H = E.H, C = E.C;
  const TS = 32, TX = Math.ceil(W / TS), TY = Math.ceil(H / TS);

  let ctx, img, abuf, cur = new Uint8Array(TX * TY), prev = new Uint8Array(TX * TY);
  let whole = false, emissive = false, started = false, reduced = false, raf = 0, last = 0, clock = 0;
  const tintCache = new Map();
  const tint = (c) => { let v = tintCache.get(c); if (v === undefined) { v = E.nightTint(c); tintCache.set(c, v); } return v; };

  function aput(x, y, c, d) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const k = y * W + x;
    if (d + 0.9 < E.dep[k]) return;
    abuf[k] = whole && !emissive ? tint(c) : c;
    cur[(y >> 5) * TX + (x >> 5)] = 1;
  }
  const TOP = 1e9;
  function glow(x, y, c) { emissive = true; aput(x | 0, y | 0, c, TOP); emissive = false; }
  function glowAt(i, j, z, c) { const x = Math.round(E.sx(i, j)), y = Math.round(E.sy(i, j, z)); emissive = true; aput(x, y, c, i + j + 0.5); emissive = false; }

  /* ---------- actors ---------- */
  const R = E.rng(20261116);
  const pick = (a) => a[(R() * a.length) | 0];
  const actors = [];

  // Road traffic. India drives on the left.
  function buildTraffic() {
    const skip = { howrahW: 1, brabourne: 1, hazra: 1 };
    const routes = L.roads.filter((r) => !skip[r.id]).map((r) => ({ axis: r.axis, at: r.at, from: r.from, to: r.to, tram: !!r.tram }));
    routes.push({ axis: 'i', at: L.howrahBridge.j, from: 0, to: 47, z: L.howrahBridge.z });
    routes.push({ axis: 'i', at: L.setu.j, from: 0, to: 47, z: L.setu.z });
    routes.push({ axis: 'j', at: L.flyover.i, from: L.flyover.j0, to: L.flyover.j1, z: L.flyover.z, single: true });
    const carCols = [C('#f2efe6'), C('#c8382e'), C('#3f6fb5'), C('#8f98a3'), C('#2f2c36')];
    const busCols = [C('#2f6fc0'), C('#c8382e'), C('#e9e4d4')];
    for (const r of routes) {
      const len = r.to - r.from;
      for (const dir of r.single ? [1] : [1, -1]) {
        const lane = r.single ? 0.5 : r.axis === 'i' ? (dir > 0 ? 0.5 : 1.5) : (dir > 0 ? 1.5 : 0.5);
        const speed = 1.25 + R() * 0.7, n = Math.max(1, Math.floor(len / 8.5)), gap = (len + 4) / n, phase = R() * gap;
        const tramSlot = r.tram ? (R() * n) | 0 : -1;
        for (let k = 0; k < n; k++) {
          const q = R();
          const kind = k === tramSlot ? 'tram' : q < 0.42 ? 'taxi' : q < 0.7 ? 'car' : q < 0.86 ? 'bus' : 'auto';
          actors.push({ t: 'veh', r, dir, lane, speed, kind, s: r.from - 2 + phase + k * gap + (R() - 0.5) * 1.2,
            variant: kind === 'car' ? pick(carCols) : kind === 'bus' ? pick(busCols) : undefined });
        }
      }
    }
  }
  function drawVeh(a, dt) {
    const r = a.r, span = r.to - r.from + 4;
    a.s += a.dir * a.speed * dt;
    if (a.s > r.to + 2) a.s -= span; else if (a.s < r.from - 2) a.s += span;
    const i = r.axis === 'i' ? a.s : r.at + a.lane, j = r.axis === 'i' ? r.at + a.lane : a.s;
    const z = r.z ? r.z(a.s) : 0;
    E.vehicle(a.kind, i, j, z, r.axis, a.variant);
    if (whole) { // headlight and tail light
      const h = a.kind === 'tram' ? 1.5 : a.kind === 'bus' ? 0.9 : 0.5, di = r.axis === 'i' ? a.dir * h : 0, dj = r.axis === 'i' ? 0 : a.dir * h;
      glowAt(i + di, j + dj, z + 2, HEAD); glowAt(i - di, j - dj, z + 2, TAIL);
    }
  }
  const HEAD = C('#fff3b0'), TAIL = C('#ff4a3a');

  function buildWater() {
    for (let k = 0; k < 7; k++) actors.push({ t: 'boat', s: R() * 96, dir: R() < 0.5 ? 1 : -1, off: (R() - 0.5) * 4.4, speed: 0.45 + R() * 0.45 });
    for (const j of [31, 12.5]) actors.push({ t: 'ferry', j, u: R(), dir: 1, wait: R() * 3 });
    actors.push({ t: 'shell', s: 55, dir: 1, j: 85.2, a: 53.5, b: 66.5, speed: 1.5 });
    actors.push({ t: 'shell', s: 64, dir: -1, j: 86.6, a: 55, b: 67, speed: 1.2 });
    actors.push({ t: 'metro', s: 40 });
  }

  // Birds and paper kites fly above everything, in screen space.
  const BIRD = C('#2b2733'), CHEEL = C('#6b4a33');
  function buildSky() {
    for (let k = 0; k < 11; k++) actors.push({ t: 'bird', x: R() * W, y: 150 + R() * (H - 320), vx: (R() < 0.5 ? -1 : 1) * (13 + R() * 12), vy: (R() - 0.5) * 5, ph: R() * 9, c: k % 4 === 0 ? CHEEL : BIRD });
    const spots = [[63, 66, 34], [79, 59, 38], [41, 54, 30], [88, 80, 42], [85, 78, 36], [66, 60, 44]];
    const cols = ['#e2452f', '#f6c417', '#2b62ab', '#e48fb0', '#3f9a5a', '#f39a1d'].map(C);
    spots.forEach((s, k) => actors.push({ t: 'kite', i: s[0], j: s[1], z: s[2], c: cols[k], ph: R() * 9 }));
    actors.push({ t: 'plane', x: -60, wait: 6 });
  }

  function buildLife() {
    // smoke: biryani cauldrons at Park Circus, dhunuchi at the pandal
    for (const p of [[103, 66.2], [106, 66.4], [109, 66.1], [107.6, 12.8], [109, 12.4]]) actors.push({ t: 'smoke', i: p[0], j: p[1], ps: [], acc: R() });
    actors.push({ t: 'wheel', i: 114.5, j: 15.5 });
    // joggers round the lake, footballers on the Maidan
    const lk = L.lake[0];
    for (let k = 0; k < 9; k++) actors.push({ t: 'jog', a: R() * 6.28, w: (0.1 + R() * 0.08) * (k % 3 ? 1 : -1), ci: lk[0], cj: lk[1], ri: lk[2] + 0.75, rj: lk[3] + 0.7, c: pick(SHIRTS) });
    for (let k = 0; k < 10; k++) actors.push({ t: 'play', i: 75.5 + R() * 5, j: 63.5 + R() * 4, ti: 78, tj: 65.5, c: k < 5 ? C('#3f8a52') : C('#b23a34'), next: R() * 2 });
    // strollers near every place
    (PK.places || []).forEach((p) => {
      for (let k = 0; k < 3; k++) {
        const ax = R() < 0.5;
        actors.push({ t: 'walk', i: p.at[0] + (R() - 0.5) * 5, j: p.at[1] + (R() - 0.5) * 5 + 1.2, ax, u: R(), span: 1.5 + R() * 2.5, dir: 1, speed: 0.25 + R() * 0.2, c: pick(SHIRTS) });
      }
    });
  }
  const SHIRTS = ['#e9e2d0', '#d8452f', '#2f66b0', '#f0c63a', '#3f9a5a', '#e48fb0', '#7a4fa0', '#f39a1d'].map(C);
  const WALKABLE = new Set([E.T.PAVE, E.T.PLAZA, E.T.LANE, E.T.GRASS, E.T.LAWN, E.T.DIRT, E.T.REDPATH, E.T.CLAY, E.T.FLOWER, E.T.BRICK, E.T.STEPS, E.T.DARKGRASS]);

  // Sparkles on the river and the lakes.
  let sparks = [];
  function buildSparks() {
    const T = E.T; let guard = 0;
    while (sparks.length < 520 && guard++ < 60000) {
      const x = (R() * W) | 0, y = (R() * H) | 0, k = y * W + x;
      const v = (y + 0.5 - E.OY) / E.QH, u = (x + 0.5 - E.OX) / E.HW, t = E.gAt((u + v) / 2, (v - u) / 2);
      if ((t === T.WATER || t === T.POND) && Math.abs(E.dep[k] - v) < 0.01) sparks.push(x, y);
    }
  }
  const SPK_DAY = C('#dfe6bd'), SPK_NIGHT = C('#bcd2ff');

  /* ---------- whole-truth effects ---------- */
  const NEON = ['#ff4fa3', '#ffd23f', '#3fe0d0', '#7a7cff', '#ff7a3f', '#9dff6a'].map(C);
  function bridgeLights(t) {
    const b = L.howrahBridge, top = b.deckZ + b.towerH, mid = b.deckZ + 16, a = b.towers[0], c = b.towers[1], m = (a + c) / 2, half = (c - a) / 2;
    const chord = (i) => (i < a ? L.lerp(b.deckZ, top, (i - (b.i0 + 1)) / (a - b.i0 - 1)) : i > c ? L.lerp(top, b.deckZ, (i - c) / (b.i1 - 1 - c)) : mid + (top - mid) * Math.pow((i - m) / half, 2));
    let n = 0;
    for (let i = b.i0 + 1; i <= b.i1 - 1; i += 0.25, n++) {
      const col = NEON[((n * 0.22 + t * 2.2) | 0) % NEON.length];
      glowAt(i, b.j + b.w, chord(i), col);
      if (n % 2 === 0) glowAt(i, b.j + b.w, b.deckZ + 1, C('#ffe9a8'));
    }
    for (const tw of b.towers) for (let z = b.deckZ + 4; z < top; z += 4) glowAt(tw, b.j + b.w, z, NEON[((z * 0.3 + t * 2.2) | 0) % NEON.length]);
  }
  function fairyLights(t) {
    for (let i = 98; i <= 116; i += 2) for (let k = 0; k <= 8; k++) {
      const f = k / 8, on = E.hs(i * 31 + k, (t * 2.5) | 0) % 4;
      if (on) glowAt(i, 47 + f * 2, 10 - Math.sin(f * Math.PI) * 3, NEON[(i + k) % NEON.length]);
    }
    // the Christmas tree in Allen Park
    for (let k = 0; k < 14; k++) if (E.hs(k, (t * 3) | 0) % 3) { const z = 4 + (k * 2) % 26, wd = (30 - z) / 30; glowAt(106 + (E.hs(k, 7) % 100 / 100 - 0.5) * wd, 40.6, z, NEON[k % NEON.length]); }
  }
  function pandalLights(t) {
    const step = (t * 6) | 0;
    for (let k = 0; k < 28; k++) { const f = k / 28; if ((k + step) % 4 < 2) { glowAt(105 + f * 6, 12.05, 13, NEON[1]); glowAt(111.05, 7 + f * 5, 13, NEON[0]); } }
  }

  // Reaction icons that rise from a place in whole-truth mode.
  const ICONS = [
    { rows: ['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'], pal: { r: C('#ff4d6d') } },                    // heart
    { rows: ['..www', '..w.w', '..w.w', 'ww.ww', 'ww.ww'], pal: { w: C('#fff6d8') } },                    // music
    { rows: ['..y..', '.yyy.', 'yyyyy', '.yyy.', '..y..'], pal: { y: C('#ffe14a') } },                    // camera flash
    { rows: ['.s.s.', '..s..', 'ccccc', '.ccc.', '.ccc.'], pal: { s: C('#ffffff'), c: C('#e59a5c') } },   // bhaar of cha
    { rows: ['wwwww', 'w.w.w', 'wwwww', '.ww..', '.w...'], pal: { w: C('#8ff0e0') } },                    // chatter
    { rows: ['.ooo.', 'oyyyo', 'oyyyo', 'oyyyo', '.ooo.'], pal: { o: C('#b86a1c'), y: C('#ffc94a') } },   // biryani pot / phuchka
  ];
  const emotes = [];
  let emoteAcc = 0;
  function spawnEmote() {
    const ps = PK.places; if (!ps || !ps.length) return;
    const p = ps[(Math.random() * ps.length) | 0];
    emotes.push({ x: E.sx(p.at[0], p.at[1]) + (Math.random() - 0.5) * 26, y: E.sy(p.at[0], p.at[1], (p.z || 0) + 4), age: 0, ic: ICONS[(Math.random() * ICONS.length) | 0], ph: Math.random() * 6 });
  }
  function drawEmotes(dt) {
    emoteAcc += dt;
    if (emoteAcc > 0.28 && emotes.length < 26) { emoteAcc = 0; spawnEmote(); }
    emissive = true;
    for (let n = emotes.length - 1; n >= 0; n--) {
      const e = emotes[n]; e.age += dt;
      if (e.age > 2.4) { emotes.splice(n, 1); continue; }
      const pop = e.age < 0.12 ? 1 : 0; // one frame of overshoot so it "pops"
      const x = Math.round(e.x + Math.sin(e.age * 3 + e.ph) * 2) - 2, y = Math.round(e.y - 6 - e.age * 9) - pop;
      const fading = e.age > 1.8;
      for (let r = 0; r < 5; r++) for (let q = 0; q < 5; q++) {
        const c = e.ic.pal[e.ic.rows[r][q]];
        if (c !== undefined && !(fading && ((x + q + y + r) & 1))) aput(x + q, y + r, c, TOP);
      }
    }
    emissive = false;
  }

  /* ---------- per-actor drawing ---------- */
  function drawActor(a, dt, t) {
    switch (a.t) {
      case 'veh': drawVeh(a, dt); break;
      case 'boat': {
        a.s += a.dir * a.speed * dt; if (a.s > 97) a.s = -1; else if (a.s < -1) a.s = 97;
        const half = (L.eb(a.s) - L.wb(a.s)) / 2 - 1, off = Math.max(-half, Math.min(half, a.off));
        E.vehicle('boat', L.mid(a.s) + off, a.s, 0, 'j');
        if (whole) glowAt(L.mid(a.s) + off, a.s, 4, C('#ffb347'));
        break;
      }
      case 'ferry': {
        if (a.wait > 0) a.wait -= dt; else { a.u += a.dir * dt * 0.09; if (a.u >= 1 || a.u <= 0) { a.u = Math.max(0, Math.min(1, a.u)); a.dir *= -1; a.wait = 3.5; } }
        const e = a.u * a.u * (3 - 2 * a.u), i0 = L.wb(a.j) + 1.9, i1 = L.eb(a.j) - 1.9, i = i0 + (i1 - i0) * e;
        E.vehicle('ferry', i, a.j, 0, 'i');
        if (whole) { glowAt(i - 0.6, a.j + 0.4, 5, HEAD); glowAt(i + 0.6, a.j + 0.4, 5, HEAD); }
        break;
      }
      case 'shell': a.s += a.dir * a.speed * dt; if (a.s > a.b || a.s < a.a) { a.dir *= -1; a.s = Math.max(a.a, Math.min(a.b, a.s)); } E.vehicle('shell', a.s, a.j, 0, 'i'); break;
      case 'metro': {
        a.s += 5 * dt; if (a.s > 125) a.s = 38;
        if (a.s < 100) { E.vehicle('train', L.viaduct.i + L.viaduct.w / 2, a.s, L.viaduct.z, 'j', 1); if (whole) glowAt(L.viaduct.i + 0.4, a.s + 3.2, L.viaduct.z + 3, HEAD); }
        break;
      }
      case 'bird': {
        a.x += a.vx * dt; a.y += a.vy * dt + Math.sin(t * 0.7 + a.ph) * 0.15;
        if (a.x < -10) a.x = W + 10; else if (a.x > W + 10) a.x = -10;
        if (a.y < 120 || a.y > H - 120) a.vy *= -1;
        const x = a.x | 0, y = a.y | 0, up = Math.sin(t * 9 + a.ph) > 0;
        aput(x, y, a.c, TOP); aput(x - 1, y + (up ? -1 : 0), a.c, TOP); aput(x + 1, y + (up ? -1 : 0), a.c, TOP);
        if (!up) { aput(x - 2, y + 1, a.c, TOP); aput(x + 2, y + 1, a.c, TOP); }
        break;
      }
      case 'kite': {
        const x = Math.round(E.sx(a.i, a.j) + Math.sin(t * 1.1 + a.ph) * 5), y = Math.round(E.sy(a.i, a.j, a.z) + Math.cos(t * 0.8 + a.ph) * 3);
        aput(x, y - 1, a.c, TOP); aput(x - 1, y, a.c, TOP); aput(x, y, E.sh(a.c, 1.2), TOP); aput(x + 1, y, a.c, TOP); aput(x, y + 1, a.c, TOP);
        const tail = Math.sin(t * 5 + a.ph) > 0 ? 1 : -1; aput(x + tail, y + 2, a.c, TOP); aput(x, y + 3, a.c, TOP);
        break;
      }
      case 'plane': {
        if (a.wait > 0) { a.wait -= dt; break; }
        a.x += 46 * dt; if (a.x > W + 60) { a.x = -60; a.wait = 25 + Math.random() * 30; }
        const x = a.x | 0, y = (70 + a.x * 0.06) | 0, w = C('#f4f4f0'), g = C('#b9c2cc');
        for (let k = -5; k <= 5; k++) aput(x + k, y, w, TOP);
        aput(x + 6, y, g, TOP); for (let k = 0; k < 4; k++) { aput(x - 1 - k, y - 1 - k, g, TOP); aput(x - 1 - k, y + 1 + k, g, TOP); }
        aput(x - 5, y - 1, w, TOP); aput(x - 5, y - 2, w, TOP);
        if (((t * 2) | 0) & 1) glow(x, y + 1, TAIL);
        break;
      }
      case 'smoke': {
        a.acc += dt; if (a.acc > 0.22) { a.acc = 0; a.ps.push({ age: 0, ph: Math.random() * 6 }); }
        const x0 = E.sx(a.i, a.j), y0 = E.sy(a.i, a.j, 4), d = a.i + a.j + 2;
        for (let n = a.ps.length - 1; n >= 0; n--) {
          const p = a.ps[n]; p.age += dt; if (p.age > 2.4) { a.ps.splice(n, 1); continue; }
          const x = Math.round(x0 + Math.sin(p.age * 2 + p.ph) * (1 + p.age * 1.5)), y = Math.round(y0 - p.age * 8);
          if (p.age > 1.5 && ((x + y) & 1)) continue;
          aput(x, y, p.age < 0.8 ? SMOKE[0] : SMOKE[1], d); if (p.age > 0.5 && p.age < 1.6) aput(x + 1, y, SMOKE[1], d);
        }
        break;
      }
      case 'wheel': {
        const cx = Math.round(E.sx(a.i, a.j)), cy = Math.round(E.sy(a.i, a.j, 17)), d = a.i + a.j + 0.8, rad = 13, th = t * 0.5, steel = C('#d8d2c4'), dark = C('#6f6a78');
        for (let k = 0; k <= 16; k++) { aput(cx - 5 + ((k * 5 / 16) | 0), cy + k, dark, d); aput(cx + 5 - ((k * 5 / 16) | 0), cy + k, dark, d); }
        for (let k = 0; k < 44; k++) { const an = (k / 44) * 6.283; aput(Math.round(cx + Math.cos(an) * rad), Math.round(cy + Math.sin(an) * rad), steel, d); }
        for (let k = 0; k < 8; k++) {
          const an = th + (k / 8) * 6.283, ex = cx + Math.cos(an) * rad, ey = cy + Math.sin(an) * rad;
          for (let q = 1; q < 6; q++) aput(Math.round(cx + (ex - cx) * q / 6), Math.round(cy + (ey - cy) * q / 6), dark, d);
          const gx = Math.round(ex) - 1, gy = Math.round(ey), gc = NEON[k % NEON.length];
          if (whole) emissive = true;
          aput(gx, gy, gc, d); aput(gx + 1, gy, gc, d); aput(gx, gy + 1, gc, d); aput(gx + 1, gy + 1, gc, d); aput(gx + 2, gy, gc, d); aput(gx + 2, gy + 1, gc, d);
          emissive = false;
        }
        break;
      }
      case 'jog': { a.a += a.w * dt; E.person(a.ci + Math.cos(a.a) * a.ri, a.cj + Math.sin(a.a) * a.rj, a.c); break; }
      case 'play': {
        a.next -= dt; if (a.next <= 0) { a.ti = 75.4 + Math.random() * 5.2; a.tj = 63.4 + Math.random() * 4.2; a.next = 0.8 + Math.random() * 2; }
        a.i += (a.ti - a.i) * dt * 0.9; a.j += (a.tj - a.j) * dt * 0.9; E.person(a.i, a.j, a.c); break;
      }
      case 'walk': {
        a.u += a.dir * a.speed * dt / a.span; if (a.u > 1 || a.u < 0) { a.dir *= -1; a.u = Math.max(0, Math.min(1, a.u)); }
        const i = a.i + (a.ax ? (a.u - 0.5) * a.span : 0), j = a.j + (a.ax ? 0 : (a.u - 0.5) * a.span);
        if (WALKABLE.has(E.gAt(i, j)) && !E.OCC[(j | 0) * E.GW + (i | 0)]) E.person(i, j, a.c);
        break;
      }
    }
  }
  const SMOKE = [C('#efe9dc'), C('#cfc8bb')];

  /* ---------- frame ---------- */
  function paint(dt) {
    const t = clock;
    // clear what was drawn last frame
    for (let ty = 0; ty < TY; ty++) for (let tx = 0; tx < TX; tx++) if (prev[ty * TX + tx]) {
      const x0 = tx * TS, x1 = Math.min(W, x0 + TS), y1 = Math.min(H, ty * TS + TS);
      for (let y = ty * TS; y < y1; y++) abuf.fill(0, y * W + x0, y * W + x1);
    }
    cur.fill(0);
    E.setPut(aput);
    // sparkles
    const sc = whole ? SPK_NIGHT : SPK_DAY, tick = (t * 3) | 0;
    if (whole) emissive = true;
    for (let n = 0; n < sparks.length; n += 2) if (E.hs(n, tick) % 13 === 0) aput(sparks[n], sparks[n + 1], sc, TOP);
    emissive = false;
    for (let n = 0; n < actors.length; n++) drawActor(actors[n], dt, t);
    if (whole) { bridgeLights(t); fairyLights(t); pandalLights(t); drawEmotes(dt); }
    E.setPut(null);
    // push dirty tiles, merging horizontal runs
    for (let ty = 0; ty < TY; ty++) {
      let run = -1;
      for (let tx = 0; tx <= TX; tx++) {
        const dty = tx < TX && (cur[ty * TX + tx] || prev[ty * TX + tx]);
        if (dty && run < 0) run = tx;
        else if (!dty && run >= 0) { ctx.putImageData(img, 0, 0, run * TS, ty * TS, (tx - run) * TS, TS); run = -1; }
      }
    }
    const sw = prev; prev = cur; cur = sw;
  }
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const el = now - last;
    if (el < 30) return;            // ~30 fps is plenty for pixel sprites and keeps panning buttery
    const dt = Math.min(0.1, el / 1000); last = now; clock += dt;
    paint(dt);
  }

  PK.anim = {
    start(canvas) {
      if (started) return; started = true;
      ctx = canvas.getContext('2d');
      img = ctx.createImageData(W, H);
      abuf = new Uint32Array(img.data.buffer);
      buildTraffic(); buildWater(); buildSky(); buildLife(); buildSparks();
      reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) { clock = 1; paint(0); return; }
      last = performance.now();
      raf = requestAnimationFrame(loop);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) cancelAnimationFrame(raf); else { last = performance.now(); raf = requestAnimationFrame(loop); }
      });
    },
    setMode(m) {
      whole = m === 'whole';
      if (!whole) emotes.length = 0;
      if (started && reduced) paint(0);
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
