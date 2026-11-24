/* Whole Truth Maps: Bengaluru - the moving layer.
   Sprites are drawn with the same iso primitives as the city, depth-tested against the static
   depth buffer so a bus really does pass behind a building. Only dirty 32px tiles are repainted.

   Two moods:
   truth  -> calm afternoon: traffic, metro, pedal boats, pelicans, foam, kites, a run club, petals.
   whole  -> dusk: head and tail lights, string bulbs, a concert, floodlights, the evening shower,
             and small reaction icons rising from each place (what people feel there). */
(function (root) {
  'use strict';
  const PK = (root.PK = root.PK || {});
  const E = PK.E, L = PK.L;
  if (!E || !L) return;
  const W = E.W, H = E.H, C = E.C;
  const TS = 32, TX = Math.ceil(W / TS), TY = Math.ceil(H / TS);

  let ctx, img, abuf, cur = new Uint8Array(TX * TY), prev = new Uint8Array(TX * TY);
  let whole = false, emissive = false, started = false, reduced = false, raf = 0, last = 0, clock = 0, wholeT = 0;
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

  const R = E.rng(20261125);
  const pick = (a) => a[(R() * a.length) | 0];
  const rnd = Math.random;
  const hs = E.hs;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const placeAt = (id, fb) => { const p = (PK.places || []).find((q) => q.id === id); return p ? p.at : fb; };

  /* ---------- traffic ---------- */
  // lane = ordered list of vehicles, p = progress along the direction of travel (ascending = ahead).
  const lanes = [];
  const HALF = { auto: 0.3, scooter: 0.25, car: 0.475, bus: 0.9, taxi: 0.475 };
  const SCOOT = ['#ff7a1f', '#6a3fb0', '#f7c531', '#ef5f9e'].map(C);
  const CAR_COLS = ['#f2efe6', '#c8382e', '#3f6fb5', '#8f98a3', '#2f2c36'].map(C);
  const BUS_BLUE = C('#2f6fc0'), BUS_RED = C('#c8382e'), BUS_GREEN = C('#2f8f5a'), TAXI_W = C('#f2efe6');
  const HEAD = C('#fff3b0'), TAIL = C('#ff4a3a'), TAIL2 = C('#ff7a5a');
  const J = L.jam;
  const flowAt = (i, j) => {
    const dx = i - J.i, dy = j - J.j;
    if (dx > J.r || dx < -J.r || dy > J.r || dy < -J.r) return 1;
    return L.flow(i, j);
  };

  function mkVeh(kind) {
    let variant, drawKind = kind;
    if (kind === 'scooter') variant = pick(SCOOT);
    else if (kind === 'car') variant = pick(CAR_COLS);
    else if (kind === 'taxi') { drawKind = 'car'; variant = TAXI_W; }
    else if (kind === 'bus') { const q = R(); variant = q < 0.6 ? BUS_BLUE : q < 0.8 ? BUS_RED : BUS_GREEN; }
    const sp = (1.35 + R() * 0.35) * (kind === 'bus' ? 0.85 : kind === 'scooter' ? 1.1 : 1);
    return { kind, dk: drawKind, variant, half: HALF[kind], speed: sp, p: 0, lat: 0, side: R() < 0.5 ? -1 : 1, ph: R() * 6.28, fl: 1, s: 0, i: 0, j: 0, z: 0 };
  }
  function rollKind() { const q = R(); return q < 0.34 ? 'auto' : q < 0.6 ? 'scooter' : q < 0.82 ? 'car' : q < 0.94 ? 'bus' : 'taxi'; }
  function placeVeh(ln, a) {
    const r = ln.r, s = ln.dir > 0 ? r.from - 2 + a.p : r.to + 2 - a.p, lane = ln.lane + a.lat;
    a.s = s;
    if (r.axis === 'i') { a.i = s; a.j = r.at + lane; } else { a.i = r.at + lane; a.j = s; }
    a.z = r.z ? r.z(s) : 0;
  }
  function buildTraffic() {
    const routes = L.roads.map((r) => ({ id: r.id, axis: r.axis, at: r.at, from: r.from, to: r.to }));
    if (L.hebbal) routes.push({ id: 'hebbal', axis: 'j', at: L.hebbal.i, from: L.hebbal.j0, to: L.hebbal.j1, z: L.hebbal.z, single: true });
    for (const r of routes) {
      const len = r.to - r.from, span = len + 4, jamRoad = r.id === 'hosur' || r.id === 'ringsouth';
      for (const dir of r.single ? [1] : [1, -1]) {
        const lane = r.single ? 0.5 : r.axis === 'i' ? (dir > 0 ? 0.5 : 1.5) : (dir > 0 ? 1.5 : 0.5);
        const n = Math.max(1, Math.floor(len / (jamRoad ? 9.6 : 8.5))), gap = span / n, phase = R() * gap;
        const ln = { r, dir, lane, span, v: [] };
        for (let k = 0; k < n; k++) {
          const a = mkVeh(rollKind());
          a.p = (((phase + k * gap + (R() - 0.5) * 1.2) % span) + span) % span;
          ln.v.push(a);
        }
        ln.v.sort((x, y) => x.p - y.p);
        for (const a of ln.v) placeVeh(ln, a);
        lanes.push(ln);
      }
    }
    for (let k = 0; k < 1300; k++) for (const ln of lanes) stepLane(ln, 0.1, k * 0.1);   // let the Silk Board queue form
  }
  function stepLane(ln, dt, t) {
    const v = ln.v, n = v.length; if (!n) return;
    for (let k = n - 1; k >= 0; k--) {
      const a = v[k], lead = k === n - 1 ? v[0] : v[k + 1], lp = k === n - 1 ? lead.p + ln.span : lead.p;
      const fl = flowAt(a.i, a.j); a.fl = fl;
      const g = fl < 0.7 ? 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 1.2 + a.ph)) : 1;   // stop-and-go inside the jam
      const room = lp - lead.half - a.half - (a.kind === 'scooter' ? 0.1 : 0.15) - a.p;
      const b = room <= 0 ? 0 : room >= 0.6 ? 1 : room / 0.6;
      const adv = Math.min(a.speed * fl * g * b * dt, room > 0 ? room : 0);
      a.p += adv;
      if (a.kind === 'scooter') { const tg = room < 0.5 ? a.side * 0.22 : 0; a.lat += (tg - a.lat) * Math.min(1, dt * 4); }
      placeVeh(ln, a);
    }
    const top = v[n - 1];
    if (top.p >= ln.span) { top.p -= ln.span; v.unshift(v.pop()); placeVeh(ln, top); }
  }
  function drawLanes() {
    for (const ln of lanes) {
      const ai = ln.r.axis === 'i', dir = ln.dir;
      for (const a of ln.v) {
        E.vehicle(a.dk, a.i, a.j, a.z, ln.r.axis, a.variant);
        if (whole) {
          const h = a.half, di = ai ? dir * h : 0, dj = ai ? 0 : dir * h, zz = a.z + (a.kind === 'bus' ? 4 : 2);
          glowAt(a.i + di, a.j + dj, zz, HEAD);
          glowAt(a.i - di, a.j - dj, zz, TAIL);
          if (a.fl < 0.5) glowAt(a.i - di, a.j - dj, zz + 1, TAIL2);
        }
      }
    }
  }

  /* ---------- metro ---------- */
  const trains = [];
  const ease = (u) => u * u * (3 - 2 * u);
  function buildTrains() {
    for (const ln of L.metro) for (const run of ln.runs) {
      const len = run[1] - run[0], lo = run[0] + 3.3, hi = run[1] - 3.3;
      if (hi - lo < 2) continue;
      const stops = [lo];
      L.stations.filter((s) => s[0] === ln.id && s[1] >= lo && s[1] <= hi).map((s) => s[1]).sort((a, b) => a - b)
        .forEach((p) => { if (p - stops[stops.length - 1] > 1.5 && hi - p > 1.5) stops.push(p); });
      stops.push(hi);
      const nT = len < 25 ? 1 : 2, cols = [C(ln.c[0]), C(ln.c[1])];
      for (let k = 0; k < nT; k++) {
        const startIdx = k === 0 ? 0 : stops.length - 1;
        trains.push({ ln, stops, cols, idx: startIdx, dir: k === 0 ? 1 : -1, state: 'dwell', timer: 0.4 + R() * 2 + k * 3.5, u: 0, nxt: 0, dur: 1,
          lat: ln.w / 2 + (k === 0 ? -0.22 : 0.22), pos: stops[startIdx] });
      }
    }
    for (let k = 0; k < 900; k++) for (const tr of trains) stepTrain(tr, 0.1);
  }
  function stepTrain(tr, dt) {
    if (tr.state === 'dwell') {
      tr.timer -= dt;
      if (tr.timer <= 0) {
        if (tr.idx + tr.dir < 0 || tr.idx + tr.dir >= tr.stops.length) tr.dir *= -1;
        tr.nxt = tr.idx + tr.dir; tr.u = 0;
        tr.dur = Math.max(1.4, Math.abs(tr.stops[tr.nxt] - tr.stops[tr.idx]) / 4.5);
        tr.state = 'move';
      }
    } else {
      tr.u += dt / tr.dur;
      if (tr.u >= 1) { tr.idx = tr.nxt; tr.pos = tr.stops[tr.idx]; tr.state = 'dwell'; tr.timer = 2; }
      else tr.pos = tr.stops[tr.idx] + (tr.stops[tr.nxt] - tr.stops[tr.idx]) * ease(tr.u);
    }
  }
  function drawTrain(tr) {
    const ln = tr.ln, ai = ln.axis === 'i', c = ln.at + tr.lat;
    const i = ai ? tr.pos : c, j = ai ? c : tr.pos;
    E.vehicle('train', i, j, ln.z, ln.axis, tr.cols);
    if (whole) {
      const f = 3.1 * tr.dir;
      glowAt(ai ? i + f : i, ai ? j : j + f, ln.z + 3, HEAD);
      glowAt(ai ? i - f : i, ai ? j : j - f, ln.z + 3, TAIL);
      for (let k = -2; k <= 2; k++) glowAt(ai ? i + k * 1.1 : i, ai ? j : j + k * 1.1, ln.z + 4, C('#fff6d0'));
    }
  }

  /* ---------- lakes ---------- */
  const ulsoor = L.lakes.ulsoor[0], hebbalLake = L.lakes.hebbal[0];
  const pedals = [
    { a: 0.5, w: 0.16, c: C('#f7c531'), rf: 0.72 },
    { a: 0.5 + Math.PI, w: 0.15, c: C('#ef5f9e'), rf: 0.72 },
  ];
  function drawPedals(dt) {
    for (const b of pedals) {
      b.a += b.w * dt;
      const i = ulsoor[0] + Math.cos(b.a) * ulsoor[2] * b.rf, j = ulsoor[1] + Math.sin(b.a) * ulsoor[3] * b.rf;
      const vi = -Math.sin(b.a) * ulsoor[2], vj = Math.cos(b.a) * ulsoor[3];
      E.vehicle('pedal', i, j, 0, Math.abs(vi) > Math.abs(vj) ? 'i' : 'j', b.c);
      if (whole) glowAt(i, j, 5, C('#ffb347'));
    }
  }

  // Pelicans at Hebbal lift off, circle, and land somewhere else.
  const pelicans = [];
  const PEL = C('#fbfaf3'), PEL2 = C('#f0a050');
  function restSpot() {
    for (let g = 0; g < 30; g++) {
      const a = R() * 6.283, f = 0.25 + R() * 0.55, i = hebbalLake[0] + Math.cos(a) * hebbalLake[2] * f, j = hebbalLake[1] + Math.sin(a) * hebbalLake[3] * f;
      if (L.inLake('hebbal', i, j)) return [i, j];
    }
    return [hebbalLake[0], hebbalLake[1]];
  }
  function buildPelicans() {
    for (let k = 0; k < 4; k++) { const s = restSpot(); pelicans.push({ st: 'rest', t: 0, dur: 2 + R() * 9 + k * 2, i: s[0], j: s[1], z: 0, ri: s[0], rj: s[1], a: 0, dir: R() < 0.5 ? 1 : -1, ti: 0, tj: 0 }); }
  }
  const orbitPt = (a) => [hebbalLake[0] + Math.cos(a) * hebbalLake[2] * 1.3, hebbalLake[1] + Math.sin(a) * hebbalLake[3] * 1.3];
  function drawPelicans(dt, t) {
    for (const p of pelicans) {
      p.t += dt;
      if (p.st === 'rest') {
        if (p.t > p.dur) { p.st = 'lift'; p.t = 0; p.a = Math.atan2((p.j - hebbalLake[1]) / hebbalLake[3], (p.i - hebbalLake[0]) / hebbalLake[2]); }
      } else if (p.st === 'lift') {
        const u = Math.min(1, p.t / 2.2), e = ease(u), o = orbitPt(p.a);
        p.i = p.ri + (o[0] - p.ri) * e; p.j = p.rj + (o[1] - p.rj) * e; p.z = 14 * e;
        if (u >= 1) { p.st = 'circle'; p.t = 0; p.dur = 8 + R() * 5; }
      } else if (p.st === 'circle') {
        p.a += 0.55 * p.dir * dt; const o = orbitPt(p.a); p.i = o[0]; p.j = o[1]; p.z = 14 + Math.sin(t * 1.3 + p.dur) * 1.5;
        if (p.t > p.dur) { p.st = 'land'; p.t = 0; const s = restSpot(); p.ti = s[0]; p.tj = s[1]; p.oi = p.i; p.oj = p.j; }
      } else {
        const u = Math.min(1, p.t / 2.4), e = ease(u);
        p.i = p.oi + (p.ti - p.oi) * e; p.j = p.oj + (p.tj - p.oj) * e; p.z = 14 * (1 - e);
        if (u >= 1) { p.st = 'rest'; p.t = 0; p.dur = 5 + R() * 9; p.ri = p.i = p.ti; p.rj = p.j = p.tj; p.z = 0; }
      }
      const x = Math.round(E.sx(p.i, p.j)), y = Math.round(E.sy(p.i, p.j, p.z)), d = p.z > 1 ? p.i + p.j + 2 : p.i + p.j + 0.5;
      aput(x - 1, y, PEL, d); aput(x, y, PEL, d); aput(x + 1, y, PEL, d);
      if (p.st === 'rest') aput(x + 2, y - 1, PEL2, d);
      else if (Math.sin(t * 7 + p.dur * 3) > 0) { aput(x - 2, y - 1, PEL, d); aput(x + 2, y - 1, PEL, d); } else { aput(x - 2, y + 1, PEL, d); aput(x + 2, y + 1, PEL, d); }
    }
  }

  // Bellandur foam drifting off the east and south shore, up and over the road.
  const foam = [];
  const FOAM = [C('#ffffff'), C('#f1ead2'), C('#e6dec0')];
  function spawnFoam(f, aged) {
    const es = L.lakes.bellandur, e = es[(R() * es.length) | 0], a = -0.3 + R() * 2.0;   // south-east quadrant
    f.i = e[0] + Math.cos(a) * e[2] * 1.02; f.j = e[1] + Math.sin(a) * e[3] * 1.02;
    f.age = aged ? R() * 16 : 0; f.life = 12 + R() * 8; f.ph = R() * 6.28; f.shape = (R() * 4) | 0; f.c = pick(FOAM); f.vi = 0.16 + R() * 0.12; f.vj = -0.02 - R() * 0.04;
  }
  function buildFoam() { for (let k = 0; k < 54; k++) { const f = {}; spawnFoam(f, true); foam.push(f); } }
  const FSHAPE = [[0, 0, 1, 0], [0, 0, 0, 1, 1, 1], [0, 0, 1, 0, 0, 1, 1, 1], [0, 0, 1, 1, 2, 0]];
  function drawFoam(dt, t) {
    const n = whole ? 54 : 40;
    for (let k = 0; k < n; k++) {
      const f = foam[k]; f.age += dt;
      if (f.age > f.life) spawnFoam(f, false);
      const wob = Math.sin(t * 0.9 + f.ph);
      const i = f.i + f.vi * f.age + wob * 0.12, j = f.j + f.vj * f.age + Math.cos(t * 0.7 + f.ph) * 0.1, z = 1 + f.age * 0.55;
      const x = Math.round(E.sx(i, j)), y = Math.round(E.sy(i, j, z)), d = i + j + 1.5, fade = f.age > f.life - 4 || f.age < 1.5;
      const sp = FSHAPE[f.shape];
      for (let q = 0; q < sp.length; q += 2) {
        if (fade && ((x + y + q) & 1)) continue;
        aput(x + sp[q], y + sp[q + 1], f.c, d);
      }
    }
  }

  // Sparkles on ponds.
  let sparks = [];
  function buildSparks() {
    const T = E.T; let guard = 0;
    while (sparks.length < 520 && guard++ < 60000) {
      const x = (R() * W) | 0, y = (R() * H) | 0, k = y * W + x;
      const v = (y + 0.5 - E.OY) / E.QH, u = (x + 0.5 - E.OX) / E.HW, t = E.gAt((u + v) / 2, (v - u) / 2);
      if (t === T.POND && Math.abs(E.dep[k] - v) < 0.01) sparks.push(x, y);
    }
  }
  const SPK_DAY = C('#dfe6bd'), SPK_NIGHT = C('#bcd2ff');

  /* ---------- sky ---------- */
  const BIRD = C('#2b2733'), CHEEL = C('#6b4a33'), KITE = C('#1d1b24');
  const birds = [], kites = [];
  const plane = { st: 'wait', t: 6, i: 97, j: 9, z: 0, v: 0, tc: 0 };
  function buildSky() {
    for (let k = 0; k < 11; k++) birds.push({ x: R() * W, y: 150 + R() * (H - 320), vx: (R() < 0.5 ? -1 : 1) * (13 + R() * 12), vy: (R() - 0.5) * 5, ph: R() * 9, c: k % 4 === 0 ? CHEEL : BIRD });
    for (let k = 0; k < 3; k++) kites.push({ a: R() * 6.28, w: (0.22 + R() * 0.08) * (k % 2 ? -1 : 1), rx: 40 + k * 14, ry: 14 + k * 5, h: 52 + k * 8, ph: R() * 9 });
  }
  function drawBird(a, dt, t) {
    a.x += a.vx * dt; a.y += a.vy * dt + Math.sin(t * 0.7 + a.ph) * 0.15;
    if (a.x < -10) a.x = W + 10; else if (a.x > W + 10) a.x = -10;
    if (a.y < 120 || a.y > H - 120) a.vy *= -1;
    const x = a.x | 0, y = a.y | 0, up = Math.sin(t * 9 + a.ph) > 0;
    aput(x, y, a.c, TOP); aput(x - 1, y + (up ? -1 : 0), a.c, TOP); aput(x + 1, y + (up ? -1 : 0), a.c, TOP);
    if (!up) { aput(x - 2, y + 1, a.c, TOP); aput(x + 2, y + 1, a.c, TOP); }
  }
  function drawKite(k, dt, t) {
    k.a += k.w * dt;
    const cub = placeAt('cubbon', [57, 35]), cx = E.sx(cub[0], cub[1]), cy = E.sy(cub[0], cub[1], k.h);
    const x = Math.round(cx + Math.cos(k.a) * k.rx), y = Math.round(cy + Math.sin(k.a) * k.ry), tilt = Math.cos(k.a + 1.5) > 0 ? 1 : 0, flap = Math.sin(t * 2 + k.ph) > 0.85;
    for (let q = -2; q <= 2; q++) aput(x + q, y, KITE, TOP);
    aput(x - 3, y - 1 + tilt, KITE, TOP); aput(x + 3, y - tilt, KITE, TOP);
    if (flap) { aput(x - 4, y - 2, KITE, TOP); aput(x + 4, y - 2, KITE, TOP); }
    aput(x, y + 1, KITE, TOP); aput(x - 1, y + 2, KITE, TOP); aput(x + 1, y + 2, KITE, TOP);
  }
  function drawPlane(dt, t) {
    const p = plane;
    if (p.st === 'wait') { p.t -= dt; if (p.t > 0) return; p.st = 'roll'; p.i = 97; p.j = 9; p.z = 0; p.v = 0; p.tc = 0; }
    else if (p.st === 'roll') { p.v += 1.0 * dt; p.i += p.v * dt; if (p.i >= 107) { p.i = 107; p.st = 'climb'; } }
    else {
      p.tc += dt; p.i += 2.4 * dt; p.j -= 1.5 * dt; p.z += (10 + p.tc * 9) * dt;
      if (E.sx(p.i, p.j) > W + 24 || E.sy(p.i, p.j, p.z) < -10) { p.st = 'wait'; p.t = 25; return; }
    }
    const x = Math.round(E.sx(p.i, p.j)), y = Math.round(E.sy(p.i, p.j, p.z + 3)), d = p.z > 2 ? TOP : p.i + p.j + 0.6;
    const w = C('#f4f4f0'), g = C('#b9c2cc');
    for (let k = -5; k <= 5; k++) aput(x + k, y - (k > 3 && p.st === 'climb' ? 1 : 0), w, d);
    aput(x + 6, y - 1, g, d);
    for (let k = 0; k < 4; k++) { aput(x - 1 - k, y - 1 - k, g, d); aput(x - 1 - k, y + 1 + k, g, d); }
    aput(x - 5, y - 1, w, d); aput(x - 5, y - 2, w, d);
    if (whole && ((t * 2) | 0) & 1) glow(x, y + 1, TAIL);
    if (whole) glow(x - 4, y + 4, C('#5fe08a'));
  }

  // Nandi cloud: two dithered layers sliding around the hill's upper half.
  function mkCloud(w, h, seed) {
    const a = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const nx = (x + 0.5) / w * 2 - 1, ny = (y + 0.5) / h * 2 - 1, base = 1.15 - (nx * nx * 1.1 + ny * ny * 1.5), n = (hs((x >> 2) + seed, (y >> 1) + seed * 3) % 100) / 100;
      a[y * w + x] = base + (n - 0.5) * 0.55;
    }
    return { w, h, a };
  }
  const CLOUDS = [{ m: mkCloud(60, 14, 3), c: C('#f6efdc'), z: 36, sx: 22, sp: 0.11, ph: 0, dy: 3 }, { m: mkCloud(48, 11, 9), c: C('#e9dfc8'), z: 27, sx: 26, sp: -0.085, ph: 2.1, dy: 2 }];
  function drawClouds(t) {
    const n = placeAt('nandi', [113, 6]), cx = E.sx(n[0], n[1]);
    for (const cl of CLOUDS) {
      const ox = Math.round(cx + Math.sin(t * cl.sp + cl.ph) * cl.sx) - (cl.m.w >> 1), oy = Math.round(E.sy(n[0], n[1], cl.z) + Math.sin(t * 0.06 + cl.ph) * cl.dy) - (cl.m.h >> 1);
      for (let y = 0; y < cl.m.h; y++) for (let x = 0; x < cl.m.w; x++) {
        const al = cl.m.a[y * cl.m.w + x];
        if (al > 0 && al * 16 > BAYER[(x & 3) + ((y & 3) << 2)] + 1) aput(ox + x, oy + y, y > cl.m.h * 0.6 && (x + y) & 1 ? E.sh(cl.c, 0.93) : cl.c, TOP);
      }
    }
  }

  /* ---------- people ---------- */
  const SHIRTS = ['#e9e2d0', '#d8452f', '#2f66b0', '#f0c63a', '#3f9a5a', '#e48fb0', '#7a4fa0', '#f39a1d'].map(C);
  const BRIGHT = ['#ff3d71', '#ffd23f', '#3fe0d0', '#7a7cff', '#ff7a3f', '#9dff6a', '#ff4fa3'].map(C);
  const WALKABLE = new Set([E.T.PAVE, E.T.PLAZA, E.T.LANE, E.T.GRASS, E.T.LAWN, E.T.DIRT, E.T.REDPATH, E.T.CLAY, E.T.FLOWER, E.T.BRICK, E.T.STEPS, E.T.DARKGRASS]);
  const walkers = [], joggers = [], runners = [], dogs = [];
  const RC = { ci: 57, cj: 34, ri: 6.5, rj: 5, a: 0, w: 0.3 };
  function buildPeople() {
    (PK.places || []).forEach((p) => {
      for (let k = 0; k < 3; k++) walkers.push({ i: p.at[0] + (R() - 0.5) * 5, j: p.at[1] + (R() - 0.5) * 5 + 1.2, ax: R() < 0.5, u: R(), span: 1.5 + R() * 2.5, dir: 1, speed: 0.25 + R() * 0.2, c: pick(SHIRTS) });
    });
    const addLake = (id, ell, n) => { for (let k = 0; k < n; k++) joggers.push({ id, a: R() * 6.28, w: (0.1 + R() * 0.08) * (k % 3 ? 1 : -1), ci: ell[0], cj: ell[1], ri: ell[2] + 0.75, rj: ell[3] + 0.7, c: pick(SHIRTS) }); };
    addLake('sankey', L.lakes.sankey[0], 6); addLake('lalbagh', L.lakes.lalbagh[0], 5);
    for (let k = 0; k < 14; k++) runners.push({ off: -k * 0.032, rad: ((k % 3) - 1) * 0.28, c: BRIGHT[k % BRIGHT.length] });
    const dc = [C('#8a5a3c'), C('#2b2733'), C('#e9e2d0')];
    for (let k = 0; k < 3; k++) dogs.push({ i: RC.ci + (R() - 0.5) * 6, j: RC.cj + (R() - 0.5) * 4, c: dc[k], ti: RC.ci, tj: RC.cj, next: R() });
  }
  function runnerPos(r) { const a = RC.a + r.off; return [RC.ci + Math.cos(a) * (RC.ri + r.rad), RC.cj + Math.sin(a) * (RC.rj + r.rad * 0.8)]; }
  function drawPeople(dt) {
    for (const a of walkers) {
      a.u += a.dir * a.speed * dt / a.span; if (a.u > 1 || a.u < 0) { a.dir *= -1; a.u = Math.max(0, Math.min(1, a.u)); }
      const i = a.i + (a.ax ? (a.u - 0.5) * a.span : 0), j = a.j + (a.ax ? 0 : (a.u - 0.5) * a.span);
      if (WALKABLE.has(E.gAt(i, j)) && !E.OCC[(j | 0) * E.GW + (i | 0)]) E.person(i, j, a.c);
    }
    for (const a of joggers) { a.a += a.w * dt; const i = a.ci + Math.cos(a.a) * a.ri, j = a.cj + Math.sin(a.a) * a.rj; if (!L.inLake(a.id, i, j)) E.person(i, j, a.c); }
    RC.a += RC.w * dt;
    for (const r of runners) { const p = runnerPos(r); E.person(p[0], p[1], r.c); }
    for (let k = 0; k < dogs.length; k++) {
      const d = dogs[k];
      d.next -= dt;
      if (k === 0) { const p = runnerPos(runners[0]); d.ti = p[0] + 0.6; d.tj = p[1]; } else if (k === 1) { d.ti = dogs[0].i; d.tj = dogs[0].j; } else if (d.next <= 0) { d.ti = RC.ci + (Math.random() - 0.5) * 12; d.tj = RC.cj + (Math.random() - 0.5) * 8; d.next = 1.2 + Math.random() * 1.5; }
      const di = d.ti - d.i, dj = d.tj - d.j, dist = Math.hypot(di, dj) || 1, sp = Math.min(dist, 2.2 * dt);
      if (dist > 0.4) { d.i += di / dist * sp; d.j += dj / dist * sp; }
      const x = Math.round(E.sx(d.i, d.j)), y = Math.round(E.sy(d.i, d.j, 0)), dd = d.i + d.j + 0.25;
      aput(x, y - 1, d.c, dd); aput(x + 1, y - 1, d.c, dd);
    }
  }

  // Petals (truth mode): pink, drifting down and across in screen space.
  const petals = [];
  const PET = ['#f6a6c8', '#ef7fb0', '#fbc6dc'].map(C);
  let petalCentres = [];
  function spawnPetal(p, aged) {
    if (R() < 0.8) { const c = pick(petalCentres); p.x = c[0] + (R() - 0.5) * 170; p.y = c[1] - 70 + R() * 60; }
    else { p.x = R() * W; p.y = 150 + R() * (H - 300); }
    p.age = aged ? R() * 14 : 0; p.life = 11 + R() * 5; p.ph = R() * 6.28; p.c = pick(PET); p.vx = 4 + R() * 4; p.vy = 6 + R() * 4;
  }
  function buildPetals() {
    petalCentres = [['cubbon', [57, 35]], ['lalbagh', [37, 57]], ['jayanagar', [34, 80]], ['malleswaram', [36, 19]]].map((q) => { const a = placeAt(q[0], q[1]); return [E.sx(a[0], a[1]), E.sy(a[0], a[1], 8)]; });
    for (let k = 0; k < 30; k++) { const p = {}; spawnPetal(p, true); petals.push(p); }
  }
  function drawPetals(dt, t) {
    for (const p of petals) {
      p.age += dt; if (p.age > p.life) spawnPetal(p, false);
      const x = Math.round(p.x + p.vx * p.age + Math.sin(t * 1.3 + p.ph) * 4), y = Math.round(p.y + p.vy * p.age);
      if (p.age > p.life - 2 && ((x + y) & 1)) continue;
      aput(x, y, p.c, TOP);
    }
  }

  // Ferris wheel and steam.
  const WHEEL = { i: 13.5, j: 82.5 };
  const GONDOLA = ['#ff4fa3', '#ffd23f', '#3fe0d0', '#7a7cff', '#ff7a3f', '#9dff6a'].map(C);
  function drawWheel(t) {
    const cx = Math.round(E.sx(WHEEL.i, WHEEL.j)), cy = Math.round(E.sy(WHEEL.i, WHEEL.j, 17)), d = WHEEL.i + WHEEL.j + 0.8, rad = 12, th = t * 0.5, steel = C('#d8d2c4'), dark = C('#6f6a78');
    for (let k = 0; k <= 16; k++) { aput(cx - 5 + ((k * 5 / 16) | 0), cy + k, dark, d); aput(cx + 5 - ((k * 5 / 16) | 0), cy + k, dark, d); }
    for (let k = 0; k < 42; k++) { const an = (k / 42) * 6.283; aput(Math.round(cx + Math.cos(an) * rad), Math.round(cy + Math.sin(an) * rad), steel, d); }
    for (let k = 0; k < 8; k++) {
      const an = th + (k / 8) * 6.283, ex = cx + Math.cos(an) * rad, ey = cy + Math.sin(an) * rad;
      for (let q = 1; q < 6; q++) aput(Math.round(cx + (ex - cx) * q / 6), Math.round(cy + (ey - cy) * q / 6), dark, d);
      const gx = Math.round(ex) - 1, gy = Math.round(ey), gc = GONDOLA[k % GONDOLA.length];
      if (whole) emissive = true;
      for (let q = 0; q < 3; q++) { aput(gx + q, gy, gc, d); aput(gx + q, gy + 1, gc, d); }
      emissive = false;
    }
  }
  const SMOKE = [C('#efe9dc'), C('#cfc8bb')];
  const steams = [];
  function buildSteam() {
    [[15, 75], [17, 86], [36, 19], [89, 30]].forEach((q) => steams.push({ i: q[0], j: q[1], ps: [], acc: R() }));
  }
  function drawSteam(a, dt) {
    a.acc += dt; if (a.acc > 0.22) { a.acc = 0; a.ps.push({ age: 0, ph: Math.random() * 6 }); }
    const x0 = E.sx(a.i, a.j), y0 = E.sy(a.i, a.j, 4), d = a.i + a.j + 2;
    for (let n = a.ps.length - 1; n >= 0; n--) {
      const p = a.ps[n]; p.age += dt; if (p.age > 2.4) { a.ps.splice(n, 1); continue; }
      const x = Math.round(x0 + Math.sin(p.age * 2 + p.ph) * (1 + p.age * 1.5)), y = Math.round(y0 - p.age * 8);
      if (p.age > 1.5 && ((x + y) & 1)) continue;
      aput(x, y, p.age < 0.8 ? SMOKE[0] : SMOKE[1], d); if (p.age > 0.5 && p.age < 1.6) aput(x + 1, y, SMOKE[1], d);
    }
  }

  /* ---------- whole-truth effects ---------- */
  const BULB = ['#ff8dbd', '#f5a623', '#a06bff', '#5fe0d8'].map(C);
  function bulbs(t, j0, i0, i1, jc) {
    const tick = (t * 2.5) | 0;
    for (let i = i0; i <= i1; i += 2) for (let k = 0; k <= 6; k++) {
      const f = k / 6;
      if (hs(i * 31 + k + jc, tick) % 4) glowAt(i, j0 + f * 2, 9 - Math.sin(f * Math.PI) * 2.6, BULB[(i + k) & 3]);
    }
  }

  const BEAMS = ['#ff4fd8', '#4ff0ff', '#ffb02e', '#ff4fd8'].map(C);
  function concert(t) {
    const st = [64, 16], px = Math.round(E.sx(st[0], st[1])), py = Math.round(E.sy(st[0], st[1], 17));
    const beat = (t * 2) % 1, pulse = Math.exp(-beat * 4);
    for (let k = 0; k < 4; k++) {
      const th = -Math.PI / 2 + 0.85 * Math.sin(t * 0.8 + k * 1.6) + (k - 1.5) * 0.3, len = 40 + k * 4 + 14 * pulse, c = Math.cos(th), s = Math.sin(th);
      for (let q = 3; q < len; q++) if (((q + k) & 1) === 0) glow(Math.round(px + c * q), Math.round(py + s * q), BEAMS[k]);
    }
    for (let q = -8; q <= 8; q++) {
      if (beat < 0.3) glow(px + q, py + 1, q & 1 ? C('#ffffff') : C('#ff9cf0'));
      else if ((q & 3) === 0) glow(px + q, py + 1, C('#9a3a90'));
    }
    for (let n = 0; n < 16; n++) if (hs(n * 13, (t * 3) | 0) % 3) glowAt(60.5 + (n % 8) * 1.0, 18.2 + ((n / 8) | 0) * 1.6 + (hs(n, 5) % 10) * 0.05, 3, C('#fff6d8'));
  }

  const FLOOD = [[58, 38], [69, 38], [58, 45], [69, 45]];   // same spots as the masts in city.js
  function chinnaswamy(t) {
    FLOOD.forEach((m, n) => {
      const x = Math.round(E.sx(m[0], m[1])), y = Math.round(E.sy(m[0], m[1], 34)), tick = (t * 4) | 0;
      for (let dy = -5; dy <= 5; dy++) for (let dx = -8; dx <= 8; dx++) {
        if (dx * dx / 64 + dy * dy / 25 > 1 || ((dx + dy) & 1) || (Math.abs(dx) < 3 && Math.abs(dy) < 2)) continue;
        if (hs(dx * 7 + n, dy * 3 + tick) % 3) glow(x + dx, y + dy + 2, C('#ffeeaa'));
      }
      for (let dy = -1; dy <= 0; dy++) for (let dx = -1; dx <= 1; dx++) glow(x + dx, y + dy, C('#fffdf0'));
      glow(x - 2, y, C('#ffe9a0')); glow(x + 2, y, C('#ffe9a0')); glow(x, y - 2, C('#ffe9a0'));
    });
    const c = placeAt('chinnaswamy', [63.5, 41.5]), ph = t * 1.3;
    for (let k = 0; k < 44; k++) {
      const a = (k / 44) * 6.283, w = Math.cos(a - ph);
      if (w > 0.1) glowAt(c[0] + Math.cos(a) * 4.6, c[1] + Math.sin(a) * 3.7, 9 + w * 3, k & 1 ? C('#ff4a3a') : C('#ffc83a'));
    }
  }

  const SAFFRON = C('#ff9933'), WHITE = C('#fff3d8'), GREEN = C('#4ad06a');
  const vsPts = [];
  function buildVS() {
    const i0 = 29, i1 = 44, j0 = 29, j1 = 35;
    for (let i = i0; i < i1; i += 0.5) { vsPts.push(i, j0); vsPts.push(i + 0.5, j1); }
    for (let j = j0; j < j1; j += 0.5) { vsPts.push(i0, j + 0.5); vsPts.push(i1, j); }
  }
  function vidhana(t) {
    const tick = (t * 3) | 0;
    for (let n = 0; n < vsPts.length; n += 2) {
      if (hs(n, tick) % 5 === 0) continue;
      const ph = ((n * 0.04 + t * 0.25) | 0) % 3;
      glowAt(vsPts[n], vsPts[n + 1], 26, ph === 0 ? SAFFRON : ph === 1 ? WHITE : GREEN);
    }
  }

  const wfWin = [];
  function buildOffices() {
    for (let z = 6; z <= 30; z += 4) {
      for (let i = 104.5; i <= 110.5; i += 1) wfWin.push(i, 60, z);
      for (let j = 53.5; j <= 59.5; j += 1) wfWin.push(111, j, z);
    }
  }
  const EC = { c: [[105, 82], [110, 82], [110, 87], [105, 87]], ax: 107.5, ay: 84.5, az: 22, z0: 2 };
  function offices(t) {
    const tick = (t * 1.2) | 0;
    for (let n = 0; n < wfWin.length; n += 3) {
      const h = hs(n, tick) % 3;
      if (h === 0) glowAt(wfWin[n], wfWin[n + 1], wfWin[n + 2], (n / 3) & 1 ? C('#ffe08a') : C('#bfe6ff'));
    }
    for (let e = 0; e < 4; e++) {
      const c = EC.c[e], u = (t * 0.35 + e * 0.27) % 1;
      glowAt(c[0] + (EC.ax - c[0]) * u, c[1] + (EC.ay - c[1]) * u, EC.z0 + (EC.az - EC.z0) * u, C('#d8f6ff'));
    }
    if (((t * 2) | 0) & 1) glowAt(EC.ax, EC.ay, EC.az + 1, C('#ffffff'));
  }

  const laptops = [];
  function buildLaptops() {
    [[60, 59], [58, 85]].forEach((c) => { for (let k = 0; k < 6; k++) laptops.push({ i: c[0] + (R() - 0.5) * 7, j: c[1] + (R() - 0.5) * 6, z: 3 + R() * 6, k: laptops.length }); });
  }
  function laptopGlow(t) {
    const tick = (t * 3) | 0;
    for (const l of laptops) if (hs(l.k, tick) % 5) glowAt(l.i, l.j, l.z, l.k & 1 ? C('#5fe0d8') : C('#a8fff6'));
  }

  // Evening shower: a band of rain sweeping west to east.
  const RAIN_N = 220, rx = new Float32Array(RAIN_N), rly = new Float32Array(RAIN_N), rph = new Float32Array(RAIN_N).fill(99), DEAD = 50;
  const shower = { on: false, next: 8, t0: 0, p: 0 };
  const RAIN = C('#c9b8ff'), RAIN_H = C('#e8e0ff'), SPLASH = C('#d9ccff');
  const BAND = 420, SHOWER_LEN = 9, SHOWER_GAP = 40;
  function updateShower(dt) {
    wholeT += dt;
    if (!shower.on && wholeT >= shower.next) { shower.on = true; shower.t0 = wholeT; }
    if (shower.on) {
      shower.p = (wholeT - shower.t0) / SHOWER_LEN;
      if (shower.p >= 1) { shower.on = false; shower.next = shower.t0 + SHOWER_GAP; }
    }
  }
  function drawRain(dt) {
    if (!shower.on && !shower.live) return;
    const bx = -BAND / 2 + shower.p * (W + BAND);
    shower.live = false;
    for (let n = 0; n < RAIN_N; n++) {
      if (rph[n] >= DEAD) {   // idle slot: respawn inside the moving band while it is raining
        if (!shower.on) continue;
        rx[n] = bx + (rnd() + rnd() - 1) * BAND / 2; rly[n] = 40 + rnd() * (H - 70); rph[n] = -rnd() * 0.5; continue;
      }
      rph[n] += dt;
      const ph = rph[n];
      shower.live = true;
      if (ph < 0) continue;
      if (ph < 0.5) {
        const y = Math.round(rly[n] - 140 + ph * 280), x = Math.round(rx[n] - (140 - ph * 280) * 0.5);
        glow(x, y, RAIN); glow(x + 1, y + 1, RAIN); glow(x + 1, y + 2, RAIN_H);
      } else if (ph < 0.7) {
        const x = Math.round(rx[n]), y = Math.round(rly[n]);
        glow(x - 1, y, SPLASH); glow(x + 1, y, SPLASH); if (ph < 0.6) glow(x, y - 1, SPLASH);
      } else rph[n] = DEAD;
    }
  }

  /* ---------- reaction icons ---------- */
  const OUT = C('#2a2140');
  function mkIcon(rows, pal) {
    const h = rows.length, w = rows[0].length, cells = [];
    const has = (x, y) => x >= 0 && y >= 0 && x < w && y < h && pal[rows[y][x]] !== undefined;
    for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
      if (has(x, y)) cells.push([x, y, C(pal[rows[y][x]])]);
      else if (has(x - 1, y) || has(x + 1, y) || has(x, y - 1) || has(x, y + 1)) cells.push([x, y, OUT]);
    }
    return { w, h, cells };
  }
  const ICON = {
    mug: mkIcon(['.fff...', 'fffff..', 'gyyyg..', 'gyyygg.', 'gyyyg.g', 'gyyygg.', 'ggggg..'], { f: '#ffffff', y: '#f5a623', g: '#e4dcc4' }),
    tumbler: mkIcon(['.s.s...', '..s.s..', 'ttttttt', '.tlttt.', '.tlttt.', '.ttttt.', 'ddddddd'], { s: '#ffffff', t: '#c9ced6', l: '#f2f5f8', d: '#8c929c' }),
    laptop: mkIcon(['.ddddd.', '.dbbbd.', '.dbwbd.', '.ddddd.', 'ddddddd'], { d: '#aeb4c0', b: '#5fe0d8', w: '#d8fffb' }),
    horns: mkIcon(['s.....s', '.s...s.', '.s...s.', '.sssss.', '.sssss.', '.sssss.', '..sss..'], { s: '#f2c28a' }),
    dosa: mkIcon(['...t...', '..ttt..', '.ttdtt.', 'ttdtttt', 'wwwwwww'], { t: '#e0a85a', d: '#b9742a', w: '#f2efe6' }),
    drop: mkIcon(['...b...', '...b...', '..bbb..', '.bbbbb.', '.bwbbb.', '.bbbbb.', '..bbb..'], { b: '#5aa9ff', w: '#e0f0ff' }),
    pin: mkIcon(['..rrr..', '.rrrrr.', '.rrwrr.', '.rrrrr.', '..rrr..', '...r...', '...r...'], { r: '#e23b30', w: '#ffffff' }),
    car: mkIcon(['..rrr..', '.rgggr.', 'rrrrrrr', 'rrrrrrr', '.k...k.'], { r: '#e23b30', g: '#9fd0ff', k: '#26222b' }),
    heart: mkIcon(['.pp.pp.', 'ppppppp', 'ppppppp', '.ppppp.', '..ppp..', '...p...'], { p: '#ff8dbd' }),
    redheart: mkIcon(['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], { r: '#ff3b4d' }),
    wifi: mkIcon(['.aaaaa.', 'a.....a', '..aaa..', '.a...a.', '...a...'], { a: '#5fe0d8' }),
    book: mkIcon(['.rrrrr.', 'rwwrwwr', 'rwwrwwr', 'rwwrwwr', '.rrrrr.'], { r: '#e2452f', w: '#fff6d8' }),
  };
  const ALL_ICONS = Object.keys(ICON);
  const PLACE_ICONS = {
    indiranagar: ['mug'], palace: ['horns'], koramangala: ['laptop', 'wifi'], hsr: ['laptop', 'wifi'], whitefield: ['laptop', 'wifi'], 'electronic-city': ['laptop', 'wifi'],
    vidyarthi: ['dosa', 'tumbler'], malleswaram: ['dosa', 'tumbler'], 'vv-puram': ['dosa', 'tumbler'], 'silk-board': ['pin', 'car'], cubbon: ['heart', 'book'], chinnaswamy: ['redheart'],
  };
  const emotes = [];
  let emoteAcc = 0;
  function spawnEmote() {
    const ps = PK.places; if (!ps || !ps.length) return;
    let p = ps[(rnd() * ps.length) | 0];
    if (rnd() < 0.12) p = ps.find((q) => q.id === 'silk-board') || p;
    const own = PLACE_ICONS[p.id], name = own && rnd() < 0.85 ? own[(rnd() * own.length) | 0] : ALL_ICONS[(rnd() * ALL_ICONS.length) | 0];
    emotes.push({ x: E.sx(p.at[0], p.at[1]) + (rnd() - 0.5) * 22, y: E.sy(p.at[0], p.at[1], (p.z || 0) + 4), age: 0, ic: ICON[name], ph: rnd() * 6 });
  }
  function drawEmotes(dt) {
    emoteAcc += dt;
    if (emoteAcc > 0.3 && emotes.length < 24) { emoteAcc = 0; spawnEmote(); }
    emissive = true;
    for (let n = emotes.length - 1; n >= 0; n--) {
      const e = emotes[n]; e.age += dt;
      if (e.age > 2.6) { emotes.splice(n, 1); continue; }
      const pop = e.age < 0.12 ? 1 : 0;
      const x = Math.round(e.x + Math.sin(e.age * 3 + e.ph) * 2) - (e.ic.w >> 1), y = Math.round(e.y - 6 - e.age * 9) - pop - e.ic.h, fading = e.age > 2;
      for (const c of e.ic.cells) if (!(fading && ((x + c[0] + y + c[1]) & 1))) aput(x + c[0], y + c[1], c[2], TOP);
    }
    emissive = false;
  }

  /* ---------- frame ---------- */
  function paint(dt) {
    const t = clock;
    for (let ty = 0; ty < TY; ty++) for (let tx = 0; tx < TX; tx++) if (prev[ty * TX + tx]) {
      const x0 = tx * TS, x1 = Math.min(W, x0 + TS), y1 = Math.min(H, ty * TS + TS);
      for (let y = ty * TS; y < y1; y++) abuf.fill(0, y * W + x0, y * W + x1);
    }
    cur.fill(0);
    E.setPut(aput);
    const sc = whole ? SPK_NIGHT : SPK_DAY, tick = (t * 3) | 0;
    if (whole) emissive = true;
    for (let n = 0; n < sparks.length; n += 2) if (hs(n, tick) % 13 === 0) aput(sparks[n], sparks[n + 1], sc, TOP);
    emissive = false;

    if (dt > 0) for (const ln of lanes) stepLane(ln, dt, t);
    drawLanes();
    for (const tr of trains) { if (dt > 0) stepTrain(tr, dt); drawTrain(tr); }
    drawPedals(dt); drawPelicans(dt, t); drawFoam(dt, t);
    drawPeople(dt);
    drawWheel(t);
    for (const s of steams) drawSteam(s, dt);
    for (const b of birds) drawBird(b, dt, t);
    for (const k of kites) drawKite(k, dt, t);
    drawPlane(dt, t);
    drawClouds(t);
    if (whole) {
      bulbs(t, 41.2, 73, 94, 0); bulbs(t, 57.2, 74, 93, 400);
      concert(t); chinnaswamy(t); vidhana(t); offices(t); laptopGlow(t);
      drawEmotes(dt);
      if (dt > 0) updateShower(dt);
      drawRain(dt);
    } else if (!reduced) drawPetals(dt, t);
    E.setPut(null);
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
    if (el < 30) return;
    const dt = Math.min(0.1, el / 1000); last = now; clock += dt;
    paint(dt);
  }

  PK.anim = {
    start(canvas) {
      if (started) return; started = true;
      ctx = canvas.getContext('2d');
      img = ctx.createImageData(W, H);
      abuf = new Uint32Array(img.data.buffer);
      buildTraffic(); buildTrains(); buildPelicans(); buildFoam(); buildSky(); buildPeople(); buildPetals(); buildSteam(); buildSparks(); buildVS(); buildOffices(); buildLaptops();
      reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) { clock = 1; paint(0); return; }
      last = performance.now();
      raf = requestAnimationFrame(loop);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) cancelAnimationFrame(raf); else { last = performance.now(); raf = requestAnimationFrame(loop); }
      });
    },
    setMode(m) {
      const w = m === 'whole';
      if (w && !whole) { wholeT = 0; shower.on = false; shower.next = 8; shower.live = false; rph.fill(99); }
      whole = w;
      if (!whole) { emotes.length = 0; shower.on = false; }
      if (started && reduced) paint(0);
    },
    _debug: () => ({ icons: ICON, lanes, trains, pelicans, shower, plane }),
  };
})(typeof window !== 'undefined' ? window : globalThis);
