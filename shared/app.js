/* Whole Truth Maps: application plumbing, shared by every city (boot, camera, pins, card, menu, hash).
   Plain script, shared global PK. Works from file://. */
(function () {
  'use strict';
  const PK = (window.PK = window.PK || {});
  const E = PK.E;
  if (!E) return;

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const MAXS = 8;
  const AREAS = PK.areas || [];
  const CITY = PK.city_cfg || { id: "", lang: "", intro: [60, 48] };
  const MODE_LINES = { truth: 'The facts. Dates, names, numbers.', whole: 'What the guidebook leaves out.' };

  const stage = $('stage'), world = $('world');
  const cDay = $('day'), cNight = $('night'), cFx = $('fx');
  const pinsEl = $('pins'), card = $('card'), menu = $('menu'), menuList = $('menu-list');
  const search = $('search'), toast = $('toast'), loader = $('loader');
  const mini = $('mini'), miniVp = $('mini-vp'), minimap = $('minimap');
  const btnPlaces = $('btn-places');
  const places = Array.isArray(PK.places) ? PK.places : [];
  const placeById = new Map();
  places.forEach((p) => placeById.set(p.id, p));

  let vw = 0, vh = 0, fitS = 1, minS = 0.5;
  const cam = { x: E.W / 2, y: E.H / 2, s: 1 };
  const target = { x: E.W / 2, y: E.H / 2, s: 1 };
  let tween = null, inertia = null;
  let raf = 0, lastT = 0;
  let mode = 'truth';
  let currentId = null;
  let armed = false;            // user has moved the camera, so the view may be written to the hash
  let hashTimer = 0, lastHash = location.hash, closeTimer = 0, toastTimer = 0;
  let introTimer = 0, introCancelled = false;
  const pinEls = new Map();
  const pinList = [];
  let applied = { x: NaN, y: NaN, s: NaN, w: 0, h: 0 };
  const miniCache = { day: null, night: null };
  let miniW = 200, miniH = 120;

  const reduced = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const wide = () => !!(window.matchMedia && matchMedia('(min-width: 720px)').matches);

  /* ---------- sizing ---------- */
  function measure() {
    vw = stage.clientWidth || window.innerWidth || 1;
    vh = stage.clientHeight || window.innerHeight || 1;
    const contain = Math.min(vw / E.W, vh / E.H);
    // On tall phone screens a strict fit leaves the city tiny, so open on a taller crop and let people pan sideways.
    fitS = Math.max(contain, (vh * 0.5) / E.H);
    minS = contain * 0.9;
  }
  function sizeCanvases() {
    [cDay, cNight, cFx].forEach((c) => {
      if (!c) return;
      c.width = E.W; c.height = E.H;
      c.style.width = E.W + 'px'; c.style.height = E.H + 'px';
    });
    world.style.width = E.W + 'px'; world.style.height = E.H + 'px';
  }

  /* ---------- camera ---------- */
  function clampCam(c) {
    c.s = clamp(c.s, minS, MAXS);
    const hw = vw / (2 * c.s), hh = vh / (2 * c.s), ox = 0.4 * vw / c.s, oy = 0.4 * vh / c.s;
    const lx = hw - ox, hx = E.W - hw + ox, ly = hh - oy, hy = E.H - hh + oy;
    c.x = lx > hx ? E.W / 2 : clamp(c.x, lx, hx);
    c.y = ly > hy ? E.H / 2 : clamp(c.y, ly, hy);
    return c;
  }
  function copy(a, b) { a.x = b.x; a.y = b.y; a.s = b.s; }
  function kick() { if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(frame); } }

  function userTouch() {
    armed = true;
    introCancelled = true;
    clearTimeout(introTimer);
    if (tween) { tween = null; copy(target, cam); }
    inertia = null;
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
    lastT = now;
    let moving = false;
    if (tween) {
      const k = (now - tween.t0) / tween.ms;
      if (k >= 1) { copy(cam, tween.to); tween = null; copy(target, cam); }
      else {
        const e = easeIO(Math.max(0, k)), f = tween.from, t = tween.to;
        cam.x = f.x + (t.x - f.x) * e;
        cam.y = f.y + (t.y - f.y) * e;
        cam.s = Math.exp(Math.log(f.s) + (Math.log(t.s) - Math.log(f.s)) * e);
        moving = true;
      }
    } else if (inertia) {
      const ms = dt * 1000;
      cam.x -= inertia.vx * ms / cam.s;
      cam.y -= inertia.vy * ms / cam.s;
      const px = cam.x, py = cam.y;
      clampCam(cam);
      if (cam.x !== px) inertia.vx = 0;
      if (cam.y !== py) inertia.vy = 0;
      const d = Math.exp(-ms / 320);
      inertia.vx *= d; inertia.vy *= d;
      copy(target, cam);
      if (Math.hypot(inertia.vx, inertia.vy) < 0.015) inertia = null; else moving = true;
    } else {
      const k = 1 - Math.exp(-dt * 12);
      const dx = target.x - cam.x, dy = target.y - cam.y, ls = Math.log(target.s) - Math.log(cam.s);
      if (Math.abs(dx) * cam.s < 0.05 && Math.abs(dy) * cam.s < 0.05 && Math.abs(ls) < 0.0005) {
        copy(cam, target);
      } else {
        cam.x += dx * k; cam.y += dy * k;
        cam.s = Math.exp(Math.log(cam.s) + ls * k);
        moving = true;
      }
    }
    apply();
    if (moving) kick();
  }

  function apply(force) {
    if (!force && applied.x === cam.x && applied.y === cam.y && applied.s === cam.s && applied.w === vw && applied.h === vh) return;
    applied = { x: cam.x, y: cam.y, s: cam.s, w: vw, h: vh };
    const s = cam.s;
    world.style.transform = 'translate3d(' + (vw / 2 - cam.x * s).toFixed(2) + 'px,' + (vh / 2 - cam.y * s).toFixed(2) + 'px,0) scale(' + s.toFixed(5) + ')';
    world.classList.toggle('crisp', s >= 1);
    pinsEl.classList.toggle('far', s < 1.1);
    placePins();
    updateMiniVp();
    if (armed && !currentId) scheduleHash();
  }

  function setTarget(x, y, s) {
    if (tween) { tween = null; }
    inertia = null;
    target.x = x; target.y = y; target.s = s;
    clampCam(target);
    kick();
  }
  function flyTo(x, y, s, ms) {
    const to = clampCam({ x: x, y: y, s: s });
    ms = ms == null ? 900 : ms;
    inertia = null;
    if (ms <= 0 || reduced()) {
      tween = null; copy(cam, to); copy(target, to); kick(); return;
    }
    tween = { from: { x: cam.x, y: cam.y, s: cam.s }, to: to, t0: performance.now(), ms: ms };
    copy(target, to);
    kick();
  }
  function fit(ms) { flyTo(E.W / 2, E.H / 2, fitS, ms == null ? 700 : ms); }

  function zoomAt(px, py, ns) { // px,py: offset from viewport centre in screen px
    ns = clamp(ns, minS, MAXS);
    const wx = target.x + px / target.s, wy = target.y + py / target.s;
    setTarget(wx - px / ns, wy - py / ns, ns);
  }
  function zoomBy(f) { userTouch(); zoomAt(0, 0, target.s * f); }

  /* ---------- pointer input ---------- */
  const ptrs = new Map();
  let drag = null, pinch = null, lastTap = null, suppressClick = false;

  function rectOff() { const r = stage.getBoundingClientRect(); return { l: r.left, t: r.top }; }

  function startPinch() {
    const a = Array.from(ptrs.values());
    const r = rectOff();
    const mx = (a[0].x + a[1].x) / 2 - r.l - vw / 2, my = (a[0].y + a[1].y) / 2 - r.t - vh / 2;
    pinch = {
      d0: Math.max(10, Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y)), s0: cam.s,
      wx: cam.x + mx / cam.s, wy: cam.y + my / cam.s,
    };
    ptrs.forEach((_, id) => { try { stage.setPointerCapture(id); } catch (e) { /* ignore */ } });
  }

  stage.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    userTouch();
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 1) {
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, cx: cam.x, cy: cam.y, moved: false, samples: [{ t: e.timeStamp, x: e.clientX, y: e.clientY }] };
      pinch = null;
    } else if (ptrs.size === 2) {
      drag = null; startPinch();
    }
  });

  stage.addEventListener('pointermove', (e) => {
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    p.x = e.clientX; p.y = e.clientY;
    if (pinch && ptrs.size >= 2) {
      const a = Array.from(ptrs.values()), r = rectOff();
      const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
      const mx = (a[0].x + a[1].x) / 2 - r.l - vw / 2, my = (a[0].y + a[1].y) / 2 - r.t - vh / 2;
      const ns = clamp(pinch.s0 * d / pinch.d0, minS, MAXS);
      cam.s = ns; cam.x = pinch.wx - mx / ns; cam.y = pinch.wy - my / ns;
      clampCam(cam); copy(target, cam);
      apply();
      return;
    }
    if (!drag || drag.id !== e.pointerId) return;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 5) return;
      drag.moved = true; suppressClick = true;
      drag.sx = e.clientX; drag.sy = e.clientY; drag.cx = cam.x; drag.cy = cam.y;
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      stage.classList.add('dragging');
    }
    cam.x = drag.cx - (e.clientX - drag.sx) / cam.s;
    cam.y = drag.cy - (e.clientY - drag.sy) / cam.s;
    clampCam(cam); copy(target, cam);
    drag.samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY });
    while (drag.samples.length > 2 && e.timeStamp - drag.samples[0].t > 100) drag.samples.shift();
    apply();
  });

  function endPointer(e, cancelled) {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    try { stage.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (pinch) {
      if (ptrs.size < 2) {
        pinch = null;
        if (ptrs.size === 1) { // continue as a drag with the remaining finger
          const id = ptrs.keys().next().value, p = ptrs.get(id);
          drag = { id: id, sx: p.x, sy: p.y, cx: cam.x, cy: cam.y, moved: true, samples: [{ t: e.timeStamp, x: p.x, y: p.y }] };
        }
      }
      return;
    }
    if (!drag || drag.id !== e.pointerId) return;
    const d = drag; drag = null;
    stage.classList.remove('dragging');
    if (d.moved) {
      setTimeout(() => { suppressClick = false; }, 0);
      if (cancelled) return;
      const sm = d.samples, a = sm[0], b = sm[sm.length - 1], dt = b.t - a.t;
      if (dt > 8 && e.timeStamp - b.t < 60) {
        const vx = (b.x - a.x) / dt, vy = (b.y - a.y) / dt;
        if (Math.hypot(vx, vy) > 0.05) { inertia = { vx: vx, vy: vy }; kick(); }
      }
      return;
    }
    if (cancelled) return;
    // a tap / click
    if (e.target && e.target.closest && e.target.closest('.pin')) { lastTap = null; return; }
    const now = e.timeStamp;
    if (lastTap && now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
      const r = rectOff();
      zoomAt(e.clientX - r.l - vw / 2, e.clientY - r.t - vh / 2, target.s * 2);
      lastTap = null;
    } else lastTap = { t: now, x: e.clientX, y: e.clientY };
  }
  stage.addEventListener('pointerup', (e) => endPointer(e, false));
  stage.addEventListener('pointercancel', (e) => endPointer(e, true));
  stage.addEventListener('click', (e) => { if (suppressClick) { e.stopPropagation(); e.preventDefault(); suppressClick = false; } }, true);

  stage.addEventListener('wheel', (e) => {
    e.preventDefault();
    userTouch();
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 16; else if (e.deltaMode === 2) dy *= 400;
    dy = clamp(dy, -240, 240);
    const f = Math.exp(-dy * (e.ctrlKey ? 0.01 : 0.0015));
    const r = rectOff();
    zoomAt(e.clientX - r.l - vw / 2, e.clientY - r.t - vh / 2, target.s * f);
  }, { passive: false });
  ['gesturestart', 'gesturechange'].forEach((n) => stage.addEventListener(n, (e) => e.preventDefault(), { passive: false }));

  /* ---------- minimap ---------- */
  function downscale(src, tw, th) {
    let cur = src, cw = src.width, ch = src.height;
    while (cw / 2 >= tw * 1.5) {
      const nw = Math.max(tw, Math.floor(cw / 2)), nh = Math.max(th, Math.floor(ch / 2));
      const c = document.createElement('canvas'); c.width = nw; c.height = nh;
      const x = c.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
      x.drawImage(cur, 0, 0, nw, nh); cur = c; cw = nw; ch = nh;
    }
    const out = document.createElement('canvas'); out.width = tw; out.height = th;
    const ox = out.getContext('2d'); ox.imageSmoothingEnabled = true; ox.imageSmoothingQuality = 'high';
    ox.drawImage(cur, 0, 0, tw, th);
    return out;
  }
  function buildMini() {
    if (!mini) return;
    miniW = 200; miniH = Math.max(1, Math.round(200 * E.H / E.W));
    mini.width = miniW; mini.height = miniH;
    try {
      miniCache.day = downscale(cDay, miniW, miniH);
      miniCache.night = downscale(cNight, miniW, miniH);
    } catch (e) { /* ignore */ }
    drawMini();
  }
  function drawMini() {
    if (!mini) return;
    const src = mode === 'whole' ? miniCache.night : miniCache.day;
    if (!src) return;
    const x = mini.getContext('2d');
    x.clearRect(0, 0, miniW, miniH);
    x.drawImage(src, 0, 0);
  }
  function updateMiniVp() {
    if (!miniVp || !mini) return;
    const m = miniW / E.W, hw = vw / (2 * cam.s), hh = vh / (2 * cam.s);
    const x0 = clamp((cam.x - hw) * m, 0, miniW), x1 = clamp((cam.x + hw) * m, 0, miniW);
    const y0 = clamp((cam.y - hh) * m, 0, miniH), y1 = clamp((cam.y + hh) * m, 0, miniH);
    miniVp.style.left = x0.toFixed(1) + 'px';
    miniVp.style.top = y0.toFixed(1) + 'px';
    miniVp.style.width = Math.max(2, x1 - x0).toFixed(1) + 'px';
    miniVp.style.height = Math.max(2, y1 - y0).toFixed(1) + 'px';
  }
  if (minimap && mini) {
    let mdrag = false;
    const toWorld = (e) => {
      const r = mini.getBoundingClientRect();
      return { x: clamp((e.clientX - r.left) / (r.width || miniW), 0, 1) * E.W, y: clamp((e.clientY - r.top) / (r.height || miniH), 0, 1) * E.H };
    };
    minimap.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      userTouch(); mdrag = true;
      try { minimap.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      const w = toWorld(e); setTarget(w.x, w.y, target.s);
    });
    minimap.addEventListener('pointermove', (e) => {
      if (!mdrag) return;
      const w = toWorld(e); setTarget(w.x, w.y, target.s);
    });
    const up = (e) => { mdrag = false; try { minimap.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ } };
    minimap.addEventListener('pointerup', up);
    minimap.addEventListener('pointercancel', up);
  }

  /* ---------- pins ---------- */
  function buildPins() {
    places.forEach((p) => {
      if (!p || !p.at) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pin'; b.dataset.id = p.id;
      b.setAttribute('aria-label', p.name + ': open details');
      const dot = document.createElement('span'); dot.className = 'pin-dot';
      const lab = document.createElement('span'); lab.className = 'pin-label'; lab.textContent = p.name;
      b.appendChild(dot); b.appendChild(lab);
      b.addEventListener('click', () => openPlace(p.id, { fly: true }));
      b.addEventListener('focus', () => {
        let kb = false;
        try { kb = b.matches(':focus-visible'); } catch (e) { kb = false; }
        if (kb) ensureVisible(p);
      });
      pinsEl.appendChild(b);
      const rec = { el: b, id: p.id, wx: E.sx(p.at[0], p.at[1]), wy: E.sy(p.at[0], p.at[1], p.z || 0) };
      pinEls.set(p.id, b); pinList.push(rec);
    });
  }
  function placePins() {
    const s = cam.s, cx = vw / 2 - cam.x * s, cy = vh / 2 - cam.y * s;
    for (let k = 0; k < pinList.length; k++) {
      const r = pinList[k];
      r.el.style.transform = 'translate3d(' + (r.wx * s + cx).toFixed(1) + 'px,' + (r.wy * s + cy).toFixed(1) + 'px,0)';
    }
  }
  function ensureVisible(p) {
    const wx = E.sx(p.at[0], p.at[1]), wy = E.sy(p.at[0], p.at[1], p.z || 0);
    const x = (wx - cam.x) * cam.s + vw / 2, y = (wy - cam.y) * cam.s + vh / 2, m = 80;
    if (x < m || y < m + 40 || x > vw - m || y > vh - m) {
      const v = viewFor(wx, wy, target.s);
      userTouch(); setTarget(v.x, v.y, target.s);
    }
  }

  /* ---------- card ---------- */
  function viewFor(wx, wy, s) {
    let dx = 0, dy = 0;
    if (!card.hidden) {
      if (wide()) dx = Math.min(card.offsetWidth || 420, vw * 0.6) / 2;
      else dy = Math.min(card.offsetHeight || vh * 0.5, vh * 0.6) / 2;
    }
    return { x: wx - dx / s, y: wy + dy / s };
  }
  function placeWorld(p) { return { x: E.sx(p.at[0], p.at[1]), y: E.sy(p.at[0], p.at[1], p.z || 0) }; }

  function fillCard(p) {
    const t = p.truth || {}, w = p.whole || {};
    const firstSentence = (s) => { s = String(s || ''); const m = /^[\s\S]*?[.!?](?=\s|$)/.exec(s); return (m ? m[0] : s).trim(); };
    card.querySelectorAll('[data-f]').forEach((el) => {
      const k = el.dataset.f;
      switch (k) {
        case 'bn': el.textContent = p.bn || ''; el.hidden = !p.bn; break;
        case 'name': el.textContent = p.name || ''; break;
        case 'area': el.textContent = p.area || ''; break;
        case 'truth': el.textContent = t.line || ''; break;
        case 'recap': el.textContent = firstSentence(t.line); break;
        case 'whole': el.textContent = w.line || ''; break;
        case 'genz': el.textContent = w.genz || ''; el.hidden = !w.genz; break;
        case 'facts':
          el.textContent = '';
          (t.facts || []).forEach((f) => {
            const d = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
            dt.textContent = f[0]; dd.textContent = f[1]; d.appendChild(dt); d.appendChild(dd); el.appendChild(d);
          });
          break;
        case 'meters':
          el.textContent = '';
          (w.meters || []).forEach((m) => {
            const n = clamp(Math.round(+m[1] || 0), 0, 5);
            const li = document.createElement('li'), lb = document.createElement('span'), bar = document.createElement('span');
            lb.className = 'm-label'; lb.textContent = m[0];
            bar.className = 'm-bar'; bar.dataset.n = String(n);
            for (let i = 0; i < 5; i++) { const b = document.createElement('i'); if (i < n) b.className = 'on'; bar.appendChild(b); }
            li.appendChild(lb); li.appendChild(bar); el.appendChild(li);
          });
          break;
        case 'tags':
          el.textContent = '';
          (w.tags || []).forEach((g) => { const li = document.createElement('li'); li.textContent = g; el.appendChild(li); });
          break;
        default: break;
      }
    });
    card.scrollTop = 0;
  }

  function openPlace(id, opts) {
    const p = placeById.get(id);
    if (!p || !p.at) return;
    opts = opts || {};
    userTouch();
    clearTimeout(closeTimer);
    currentId = id;
    fillCard(p);
    const wasHidden = card.hidden;
    card.hidden = false;
    if (wasHidden) void card.offsetWidth;
    card.classList.add('open');
    pinEls.forEach((el, k) => el.classList.toggle('active', k === id));
    clearTimeout(hashTimer);
    writeHash();
    if (opts.fly !== false) {
      const s = p.zoom || 3, w = placeWorld(p), v = viewFor(w.x, w.y, s);
      flyTo(v.x, v.y, s, opts.ms == null ? 1000 : opts.ms);
    }
  }

  function closeCard(opts) {
    opts = opts || {};
    if (!currentId && card.hidden) return;
    currentId = null;
    card.classList.remove('open');
    pinEls.forEach((el) => el.classList.remove('active'));
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => { if (!currentId) card.hidden = true; }, 350);
    if (!opts.noHash) { armed = true; writeHash(); }
  }

  function step(dir) {
    if (!places.length) return;
    let i = places.findIndex((p) => p.id === currentId);
    i = i < 0 ? 0 : (i + dir + places.length) % places.length;
    openPlace(places[i].id, { fly: true });
  }

  $('card-prev').addEventListener('click', () => step(-1));
  $('card-next').addEventListener('click', () => step(1));
  $('card-close').addEventListener('click', () => closeCard());
  $('card-zoom').addEventListener('click', () => {
    const p = placeById.get(currentId); if (!p) return;
    const w = placeWorld(p), v = viewFor(w.x, w.y, 5);
    userTouch(); flyTo(v.x, v.y, 5, 800);
  });
  card.querySelectorAll('.flip-btn.to-whole').forEach((b) => b.addEventListener('click', () => setMode('whole')));
  card.querySelectorAll('.flip-btn.to-truth').forEach((b) => b.addEventListener('click', () => setMode('truth')));

  /* ---------- mode ---------- */
  function setMode(m, opts) {
    if (m !== 'truth' && m !== 'whole') return;
    mode = m;
    document.documentElement.dataset.mode = m;
    document.querySelectorAll('.mode-btn').forEach((b) => b.setAttribute('aria-checked', b.dataset.mode === m ? 'true' : 'false'));
    try { if (PK.anim && PK.anim.setMode) PK.anim.setMode(m); } catch (e) { /* ignore */ }
    drawMini();
    const ml = $('mode-line'); if (ml) ml.textContent = MODE_LINES[m];
    syncTabs();
    if (!(opts && opts.noHash)) { clearTimeout(hashTimer); writeHash(); }
  }
  document.querySelectorAll('.mode-btn').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

  /* ---------- city tabs ---------- */
  // Switching city keeps the reading you are on, so dusk in Kolkata opens as dusk in Bengaluru.
  function syncTabs() {
    document.querySelectorAll('.city-tab').forEach((a) => {
      const base = a.dataset.href || (a.dataset.href = a.getAttribute('href'));
      a.href = base + (location.protocol === 'file:' ? 'index.html' : '') + (mode === 'whole' ? '#m=whole' : '');
    });
  }
  try { localStorage.setItem('wtm-city', CITY.id); } catch (e) { /* ignore */ }

  /* ---------- menu ---------- */
  function buildMenu() {
    if (!menuList) return;
    menuList.textContent = '';
    const groups = new Map();
    AREAS.forEach((a) => groups.set(a, []));
    places.forEach((p) => { const a = p.area || 'Other'; if (!groups.has(a)) groups.set(a, []); groups.get(a).push(p); });
    groups.forEach((list, area) => {
      if (!list.length) return;
      const h = document.createElement('h3'); h.textContent = area;
      const ul = document.createElement('ul');
      list.forEach((p) => {
        const li = document.createElement('li'), b = document.createElement('button');
        b.type = 'button'; b.dataset.id = p.id; b.appendChild(document.createTextNode(p.name));
        if (p.bn) { const s = document.createElement('span'); s.lang = CITY.lang; s.textContent = p.bn; b.appendChild(s); }
        li.dataset.q = [p.name, p.bn, p.keywords, p.area].join(' ').toLowerCase();
        li.appendChild(b); ul.appendChild(li);
      });
      menuList.appendChild(h); menuList.appendChild(ul);
    });
  }
  function filterMenu() {
    const q = search.value.trim().toLowerCase();
    const heads = menuList.querySelectorAll('h3');
    heads.forEach((h) => {
      const ul = h.nextElementSibling; let any = false;
      ul.querySelectorAll('li').forEach((li) => { const ok = !q || li.dataset.q.indexOf(q) >= 0; li.hidden = !ok; if (ok) any = true; });
      h.hidden = !any; ul.hidden = !any;
    });
  }
  function menuOpen() { return !menu.hidden; }
  function setMenu(open) {
    menu.hidden = !open;
    btnPlaces.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      let fine = true; try { fine = matchMedia('(pointer: fine)').matches; } catch (e) { /* ignore */ }
      if (fine) { try { search.focus({ preventScroll: true }); } catch (e) { search.focus(); } }
    }
  }
  btnPlaces.addEventListener('click', () => setMenu(!menuOpen()));
  menuList.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('button[data-id]');
    if (!b) return;
    setMenu(false); openPlace(b.dataset.id, { fly: true });
  });
  search.addEventListener('input', filterMenu);
  search.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const b = menuList.querySelector('li:not([hidden]) button[data-id]');
      if (b) { e.preventDefault(); setMenu(false); openPlace(b.dataset.id, { fly: true }); }
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (menuOpen() && !menu.contains(e.target) && !btnPlaces.contains(e.target)) setMenu(false);
  });

  /* ---------- share / about / brand ---------- */
  function showToast(msg) {
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }
  function copyLink() {
    const done = () => showToast('Link copied');
    const fallback = () => {
      try {
        const ta = document.createElement('textarea');
        ta.value = location.href; ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.opacity = '0'; ta.style.left = '-999px';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        done();
      } catch (e) { /* ignore */ }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(location.href).then(done, fallback);
    else fallback();
  }
  $('btn-share').addEventListener('click', () => {
    armed = true; clearTimeout(hashTimer); writeHash();
    if (navigator.share) {
      navigator.share({ title: document.title, url: location.href }).catch((e) => { if (!e || e.name !== 'AbortError') copyLink(); });
    } else copyLink();
  });
  $('btn-about').addEventListener('click', () => {
    const d = $('about');
    if (d.showModal) { try { d.showModal(); return; } catch (e) { /* fall through */ } }
    d.setAttribute('open', '');
  });
  $('brand').addEventListener('click', (e) => { e.preventDefault(); userTouch(); closeCard(); fit(800); });
  $('z-in').addEventListener('click', () => zoomBy(1.6));
  $('z-out').addEventListener('click', () => zoomBy(1 / 1.6));
  $('z-fit').addEventListener('click', () => { userTouch(); fit(700); });

  /* ---------- keyboard ---------- */
  document.addEventListener('keydown', (e) => {
    const t = e.target, tag = t && t.tagName;
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable);
    const dlg = $('about');
    if (dlg && dlg.open) return;
    if (e.key === 'Escape') {
      if (menuOpen()) { setMenu(false); try { btnPlaces.focus(); } catch (err) { /* ignore */ } e.preventDefault(); }
      else if (currentId) { closeCard(); e.preventDefault(); }
      return;
    }
    if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
    const pan = (dx, dy) => { userTouch(); setTarget(target.x + dx * vw * 0.2 / target.s, target.y + dy * vh * 0.2 / target.s, target.s); e.preventDefault(); };
    switch (e.key) {
      case 'ArrowLeft': pan(-1, 0); break;
      case 'ArrowRight': pan(1, 0); break;
      case 'ArrowUp': pan(0, -1); break;
      case 'ArrowDown': pan(0, 1); break;
      case '+': case '=': zoomBy(1.4); e.preventDefault(); break;
      case '-': case '_': zoomBy(1 / 1.4); e.preventDefault(); break;
      case '0': userTouch(); fit(700); e.preventDefault(); break;
      case 't': case 'T': setMode(mode === 'truth' ? 'whole' : 'truth'); break;
      default: break;
    }
  });

  /* ---------- hash ---------- */
  function setHash(h) {
    lastHash = h;
    try { history.replaceState(null, '', h); } catch (e) { try { location.hash = h; } catch (e2) { /* ignore */ } }
  }
  function writeHash() {
    let h = null;
    if (currentId) h = '#/place/' + encodeURIComponent(currentId) + (mode === 'whole' ? '?m=whole' : '');
    else if (armed || location.hash.length > 1) {
      h = '#x=' + Math.round(target.x) + '&y=' + Math.round(target.y) + '&z=' + target.s.toFixed(1) + '&m=' + mode;
    }
    if (h && h !== location.hash) setHash(h);
  }
  function scheduleHash() { clearTimeout(hashTimer); hashTimer = setTimeout(writeHash, 400); }
  function parseHash() {
    const h = location.hash.replace(/^#/, '');
    if (!h) return null;
    const mm = /(?:^|[?&])m=(truth|whole)/.exec(h);
    const m = mm ? mm[1] : null;
    if (h.indexOf('/place/') === 0) {
      let id = h.slice(7).split('?')[0];
      try { id = decodeURIComponent(id); } catch (e) { /* keep raw */ }
      return { place: id, m: m };
    }
    if (h.indexOf('=') >= 0) {
      const o = {};
      h.split('&').forEach((kv) => { const i = kv.indexOf('='); if (i > 0) o[kv.slice(0, i)] = kv.slice(i + 1); });
      const x = parseFloat(o.x), y = parseFloat(o.y), z = parseFloat(o.z);
      if (isFinite(x) && isFinite(y) && isFinite(z)) return { x: x, y: y, z: z, m: m };
      if (m) return { m: m, only: true };
    }
    return null;
  }
  function restoreHash(initial) {
    const hv = parseHash();
    if (!hv) {
      if (!initial) { closeCard({ noHash: true }); fit(700); }
      return false;
    }
    if (hv.m) setMode(hv.m, { noHash: true });
    if (hv.only) return false;
    const ms = initial ? 0 : undefined;
    if (hv.place) {
      if (!placeById.has(hv.place)) return false;   // a place from the other city: stay where we are
      openPlace(hv.place, { fly: true, ms: ms });
      return true;
    }
    if (currentId) closeCard({ noHash: true });
    const z = clamp(hv.z, minS, MAXS);
    flyTo(hv.x, hv.y, z, initial ? 0 : 900);
    return true;
  }
  window.addEventListener('hashchange', () => {
    if (location.hash === lastHash) return;
    lastHash = location.hash;
    restoreHash(false);
  });

  /* ---------- resize ---------- */
  function onResize() {
    const oldFit = fitS, wasFit = target.s <= oldFit * 1.001;
    measure();
    if (wasFit) { target.s = fitS; if (!tween) cam.s = Math.max(cam.s, minS); }
    clampCam(target);
    if (wasFit && !tween) copy(cam, target);
    clampCam(cam);
    apply(true);
    kick();
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(onResize, 120));

  /* ---------- boot ---------- */
  function setProgress(f, label) {
    const step = $('loader-step'), fill = $('loader-fill');
    if (step && label) step.textContent = label;
    if (fill) fill.style.width = Math.round(clamp(f || 0, 0, 1) * 100) + '%';
  }

  function afterBuild() {
    try {
      const x = cDay.getContext('2d');
      x.putImageData(new ImageData(new Uint8ClampedArray(E.col.buffer), E.W, E.H), 0, 0);
    } catch (e) { /* ignore */ }
    try {
      const night = E.makeNight(E.finalizeLights());
      cNight.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(night.buffer), E.W, E.H), 0, 0);
    } catch (e) { /* ignore */ }
    buildMini();
    buildPins();
    buildMenu();
    setProgress(1);

    const hv = parseHash();
    const hadView = !!(hv && !hv.only && (hv.place ? placeById.has(hv.place) : true));
    setMode(hv && hv.m ? hv.m : mode, { noHash: true });
    try { if (PK.anim && PK.anim.start) PK.anim.start(cFx, { getMode: () => mode }); } catch (e) { /* ignore */ }
    try { if (PK.anim && PK.anim.setMode) PK.anim.setMode(mode); } catch (e) { /* ignore */ }

    if (hadView) restoreHash(true);
    else if (reduced()) { flyTo(E.W / 2, E.H / 2, fitS, 0); }
    else {
      const hx = E.sx(CITY.intro[0], CITY.intro[1]), hy = E.sy(CITY.intro[0], CITY.intro[1], 0);
      const start = clampCam({ x: hx, y: hy, s: 3 });
      copy(cam, start); copy(target, start);
      introTimer = setTimeout(() => { if (!introCancelled) flyTo(E.W / 2, E.H / 2, fitS, 2200); }, 500);
    }
    apply(true);
    kick();

    loader.classList.add('done');
    setTimeout(() => { loader.hidden = true; }, 600);
  }

  function boot() {
    measure();
    sizeCanvases();
    cam.s = target.s = fitS;
    copy(cam, clampCam(target));
    apply(true);
    let p;
    try {
      p = PK.city && PK.city.buildAsync ? PK.city.buildAsync(setProgress) : Promise.resolve();
    } catch (e) { p = Promise.resolve(); }
    Promise.resolve(p).catch(() => { setProgress(1, 'Map could not be fully drawn'); }).then(afterBuild);
  }

  PK.app = {
    openPlace: openPlace,
    closeCard: closeCard,
    setMode: setMode,
    getMode: () => mode,
    flyTo: flyTo,
    fit: fit,
    zoomBy: zoomBy,
    getCamera: () => ({ x: cam.x, y: cam.y, s: cam.s }),
    setMenu: setMenu,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
