/* =========================================================
   DETEKTIF SANDI — main.js
   Mesin game: peta, gerak & tabrakan, interaksi, puzzle,
   alat dekripsi (komposisi fungsi), catatan, deduksi,
   interogasi, skor, dan alur antar-layar.
   ========================================================= */
(function () {
  'use strict';
  var DS = window.DS, A = DS.Art, SC = DS.Scenes;
  var T = 16, VW = 320, VH = 180;

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function strip(s) { return String(s).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' '); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  /* =========================================================
     1. AUDIO — efek suara sintetis (WebAudio), tanpa file
     ========================================================= */
  var AC = null, muted = false, noiseBuf = null;
  function ac() {
    if (AC) return AC;
    try { var C = window.AudioContext || window.webkitAudioContext; if (C) AC = new C(); } catch (e) { AC = null; }
    return AC;
  }
  function tone(type, f0, f1, dur, vol, delay) {
    var c = ac(); if (!c) return;
    var t = c.currentTime + (delay || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, lp) {
    var c = ac(); if (!c) return;
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    s.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.value = lp || 1200;
    var t = c.currentTime;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t + dur);
  }
  function sfx(n) {
    if (muted) return;
    try {
      switch (n) {
        case 'blip': tone('square', 520, 520, 0.05, 0.03); break;
        case 'type': tone('square', 900, 900, 0.015, 0.012); break;
        case 'pick': tone('triangle', 523, 1046, 0.16, 0.09); tone('triangle', 784, 1568, 0.16, 0.06, 0.08); break;
        case 'ok': tone('triangle', 660, 660, 0.1, 0.08); tone('triangle', 990, 990, 0.18, 0.08, 0.1); break;
        case 'bad': tone('sawtooth', 220, 110, 0.28, 0.06); break;
        case 'door': tone('square', 140, 70, 0.2, 0.05); noise(0.15, 0.05, 800); break;
        case 'drag': noise(0.7, 0.06, 300); break;
        case 'card': tone('sine', 110, 55, 1.2, 0.12); break;
        case 'static': noise(0.6, 0.08, 4000); break;
        case 'thunder': noise(1.6, 0.12, 200); break;
        case 'spray': noise(1.5, 0.07, 2500); break;
        case 'alarm': tone('square', 880, 880, 0.15, 0.05); tone('square', 660, 660, 0.15, 0.05, 0.17); tone('square', 880, 880, 0.15, 0.05, 0.34); break;
        case 'thud': tone('sine', 120, 40, 0.3, 0.15); noise(0.2, 0.06, 400); break;
        case 'switch': tone('square', 300, 300, 0.04, 0.05); break;
        case 'power': tone('sawtooth', 60, 240, 0.8, 0.06); break;
        case 'win': tone('triangle', 523, 523, 0.15, 0.08); tone('triangle', 659, 659, 0.15, 0.08, 0.15); tone('triangle', 784, 784, 0.3, 0.08, 0.3); break;
      }
    } catch (e) { /* audio tidak tersedia */ }
  }
  DS.sfx = sfx;

  /* =========================================================
     2. MATEMATIKA — enkripsi berlapis c = f(g(h(x)))  (mod 26)
     Lapis disimpan dari LUAR ke DALAM: layers[0] = f (terluar).
     ========================================================= */
  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var FN_NAMES = ['f', 'g', 'h', 'k'];
  function m26(n) { var m = ((n % 26) + 26) % 26; return m === 0 ? 26 : m; }
  function l2n(ch) { return LETTERS.indexOf(ch.toUpperCase()) + 1; }
  function n2l(n) { return LETTERS[n - 1]; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function ainv(a) { a = ((a % 26) + 26) % 26; for (var i = 1; i < 26; i++) if ((a * i) % 26 === 1) return i; return 0; }
  function fnStr(L) {
    var s = L.a === 1 ? 'x' : (L.a === -1 ? '-x' : L.a + 'x');
    if (L.b > 0) s += ' + ' + L.b; else if (L.b < 0) s += ' − ' + Math.abs(L.b);
    return s;
  }
  function invStr(L) {
    var inner = L.b === 0 ? 'y' : ('y ' + (L.b < 0 ? '+ ' + (-L.b) : '− ' + L.b));
    return L.inv === 1 ? inner : L.inv + '(' + inner + ')';
  }
  function composeLine(layers) {
    var s = 'x';
    for (var i = layers.length - 1; i >= 0; i--) s = FN_NAMES[i] + '(' + s + ')';
    return 'c = ' + s;
  }
  function encrypt(plain, layers) {
    var out = '';
    for (var i = 0; i < plain.length; i++) {
      var ch = plain.charAt(i);
      if (ch === ' ') { out += ' '; continue; }
      var x = l2n(ch);
      for (var k = layers.length - 1; k >= 0; k--) x = m26(layers[k].a * x + layers[k].b);
      out += n2l(x);
    }
    return out;
  }
  function decryptWith(cipher, fns) {
    var out = '';
    for (var i = 0; i < cipher.length; i++) {
      var ch = cipher.charAt(i).toUpperCase();
      if (ch === ' ') { out += ' '; continue; }
      if (ch < 'A' || ch > 'Z') return null;
      var v = l2n(ch);
      for (var j = 0; j < fns.length; j++) v = m26(fns[j].inv * (v - fns[j].b));
      out += n2l(v);
    }
    return out;
  }
  function scrambleCase(s) {
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      out += (ch !== ' ' && ((i * 7 + 3) % 5 < 2)) ? ch.toLowerCase() : ch;
    }
    return out;
  }
  function parseFnBody(s) {
    s = s.replace(/\s+/g, '').toLowerCase().replace(/−/g, '-');
    var m = s.match(/^([+-]?\d*)x([+-]\d+)?$/);
    if (!m) return null;
    var a = (m[1] === '' || m[1] === '+') ? 1 : (m[1] === '-' ? -1 : parseInt(m[1], 10));
    var b = m[2] ? parseInt(m[2], 10) : 0;
    if (!isFinite(a) || !isFinite(b)) return null;
    return { a: a, b: b };
  }
  function parseFns(text) {
    var lines = String(text).split(/\n+/), out = [];
    for (var i = 0; i < lines.length; i++) {
      var raw = lines[i].trim();
      if (!raw) continue;
      if (/^c\s*=/i.test(raw)) continue;
      var nm = raw.toLowerCase().match(/^([a-z])\s*\(\s*x\s*\)\s*=/);
      var eq = raw.indexOf('=');
      var f = parseFnBody(eq >= 0 ? raw.slice(eq + 1) : raw);
      if (!f) continue;
      f.name = nm ? nm[1] : (FN_NAMES[out.length] || '?');
      f.inv = ainv(f.a);
      f.line = raw;
      out.push(f);
    }
    return out;
  }

  /* =========================================================
     3. PROGRES (localStorage — aman kalau tidak tersedia)
     ========================================================= */
  var SAVE_KEY = 'detektifSandi.v2';
  function loadProg() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { return {}; } }
  function saveProg() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(PROG)); } catch (e) { /* abaikan */ } }
  var PROG = loadProg();
  PROG.solved = PROG.solved || {};
  PROG.best = PROG.best || {};
  function unlocked(i) { return i === 0 || !!PROG.all || !!PROG.solved[DS.CASES[i - 1].id]; }

  /* =========================================================
     4. STATE
     ========================================================= */
  var CASE = null, DIFF = null, BUILT = null, S = null;
  var MAP = null, PROPS = [], NPCS = [], DOORS = [];
  var player = { x: 0, y: 0, dir: 'down', moving: false, anim: 0 };
  var cam = { x: 0, y: 0 };
  var keys = {};
  var screen = 'scr-title';
  var ui = { dialog: null, modal: null };
  var traps = [], trapCd = 0;
  var tweens = [];
  var spray = null;
  var curRoom = '';
  var pending = [];
  var time = 0;
  var caseIdx = 0;

  /* =========================================================
     5. MEMBANGUN KASUS (sandi, kunci, sebaran petunjuk)
     ========================================================= */
  function buildCase() {
    var src = CASE.layers[DIFF.id];
    var layers = [];
    for (var i = 0; i < src.length; i++) layers.push({ name: FN_NAMES[i], a: src[i][0], b: src[i][1], inv: ainv(src[i][0]) });
    var plain = CASE.plain;
    var cipher = encrypt(plain, layers);
    var clues = [{ id: 'msg', kind: 'msg', title: 'PESAN TERENKRIPSI', body: scrambleCase(cipher) }];
    var frag = Math.max(1, Math.min(DIFF.frags, layers.length));
    var per = Math.ceil(layers.length / frag);
    for (var q = 0; q < frag; q++) {
      var from = q * per, to = Math.min(layers.length, (q + 1) * per);
      if (from >= to) break;
      var body = [];
      if (q === 0) body.push(composeLine(layers));
      for (var k = from; k < to; k++) body.push(FN_NAMES[k] + '(x) = ' + fnStr(layers[k]));
      clues.push({ id: 'k' + (q + 1), kind: 'key',
        title: frag === 1 ? 'KUNCI FUNGSI' : 'KUNCI — SOBEKAN ' + String.fromCharCode(65 + q), body: body.join('\n') });
    }
    BUILT = { layers: layers, plain: plain, cipher: cipher, clues: clues, spots: {} };
  }
  function clueById(id) { for (var i = 0; i < BUILT.clues.length; i++) if (BUILT.clues[i].id === id) return BUILT.clues[i]; return null; }
  function keyClues() { return BUILT.clues.filter(function (c) { return c.kind === 'key'; }); }
  function placeClues() {
    var pool = [];
    for (var i = 0; i < PROPS.length; i++) if (PROPS[i].def.spot) pool.push(PROPS[i].id);
    shuffle(pool);
    var ks = keyClues();
    BUILT.spots = {};
    for (var j = 0; j < ks.length && j < pool.length; j++) BUILT.spots[pool[j]] = ks[j].id;
  }

  /* =========================================================
     6. PETA, PERABOT, NPC, PINTU
     ========================================================= */
  function chAt(c, r) {
    if (!MAP || r < 0 || r >= MAP.h || c < 0 || c >= MAP.w) return '#';
    return MAP.rows[r].charAt(c) || '#';
  }
  function doorAt(c, r) { for (var i = 0; i < DOORS.length; i++) if (DOORS[i].c === c && DOORS[i].r === r) return DOORS[i]; return null; }
  function orientAt(c, r) { return (chAt(c - 1, r) === '#' && chAt(c + 1, r) === '#') ? 'h' : 'v'; }
  function wallLike(c, r) {
    var ch = chAt(c, r);
    if (ch === '#') return true;
    if ((ch === 'L' || ch === 'D') && orientAt(c, r) === 'v') return true;
    return false;
  }
  function tileSolid(c, r) {
    var ch = chAt(c, r);
    if (ch === '#' || ch === ' ') return true;
    if (ch === 'L') { var d = doorAt(c, r); return !(d && S.doors[d.id]); }
    return false;
  }
  function floorTheme(c, r) {
    var ch = chAt(c, r);
    var th = CASE.themes[ch];
    if (th) return th;
    var n = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (var i = 0; i < n.length; i++) { var t2 = CASE.themes[chAt(c + n[i][0], r + n[i][1])]; if (t2) return t2; }
    return CASE.themes['.'] || 'lab';
  }

  function loadMap() {
    MAP = { rows: CASE.map, w: CASE.map[0].length, h: CASE.map.length };
    DOORS = [];
    for (var i = 0; i < CASE.doors.length; i++) {
      var d = CASE.doors[i];
      DOORS.push({ def: d, id: d.id, c: d.c, r: d.r, x: d.c * T, y: d.r * T, orient: orientAt(d.c, d.r) });
    }
    PROPS = [];
    for (var j = 0; j < CASE.props.length; j++) {
      var p = CASE.props[j];
      var P = {
        def: p, id: p.id, type: p.type, x: p.c * T, y: p.r * T, w: p.w * T, h: p.h * T, tall: p.tall || 0,
        wall: !!p.wall, fire: !!p.fire, title: p.title || '', var: p.var, tag: p.tag, reader: p.reader,
        screen: p.screen, lines: p.lines, col: p.col, mug: p.mug, stack: p.stack, gap: p.gap, inside: p.inside,
        needPower: p.needPower, slot: p.slot, text: p.text,
        floor: !!p.floor || p.type === 'cable' || p.type === 'rug' || p.type === 'desk_clock',
        st: {}
      };
      P.solid = p.solid !== false && !p.wall && !P.floor;
      P.label = p.decor ? null : (p.label || ('Periksa ' + String(p.title || '').toLowerCase()));
      if (P.fire) P.st.fire = 1;
      PROPS.push(P);
    }
    NPCS = [];
    for (var k = 0; k < (CASE.npcs || []).length; k++) {
      var n = CASE.npcs[k];
      NPCS.push({ def: n, id: n.id, ch: DS.CHARS[n.ch], x: n.c * T + 8, y: n.r * T + 13, dir: n.dir || 'down', when: n.when, npc: true });
    }
  }
  function propById(id) { for (var i = 0; i < PROPS.length; i++) if (PROPS[i].id === id) return PROPS[i]; return null; }
  function npcVisible(n) { return !n.when || n.when(G); }
  function fireBurning(id) { var P = propById(id); return P && P.fire && P.st.fire > 0; }

  /* =========================================================
     7. TABRAKAN
     ========================================================= */
  function solidRects() {
    var out = [];
    for (var i = 0; i < PROPS.length; i++) {
      var P = PROPS[i];
      if (!P.solid) continue;
      if (P.fire && !(P.st.fire > 0)) continue;
      out.push({ x: P.x + (P.st.shift || 0), y: P.y, w: P.w, h: P.h });
    }
    for (var j = 0; j < NPCS.length; j++) {
      var n = NPCS[j];
      if (!npcVisible(n)) continue;
      out.push({ x: n.x - 5, y: n.y - 5, w: 10, h: 6 });
    }
    return out;
  }
  function boxBlocked(x, y) {
    var x0 = x - 4, x1 = x + 4, y0 = y - 4, y1 = y;
    var c0 = Math.floor(x0 / T), c1 = Math.floor((x1 - 0.01) / T), r0 = Math.floor(y0 / T), r1 = Math.floor((y1 - 0.01) / T);
    for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) if (tileSolid(c, r)) return true;
    var rs = solidRects();
    for (var i = 0; i < rs.length; i++) {
      var q = rs[i];
      if (x1 > q.x && x0 < q.x + q.w && y1 > q.y && y0 < q.y + q.h) return true;
    }
    return false;
  }

  /* =========================================================
     8. API UNTUK SKRIP KASUS (dipakai handler di data.js)
     ========================================================= */
  var G = {
    flag: function (k) { return !!S.flags[k]; },
    set: function (k, v) { S.flags[k] = v === undefined ? true : v; changed(); },
    has: function (it) { return !!S.items[it]; },
    give: function (it) {
      if (S.items[it]) return;
      S.items[it] = true; S.itemOrder.push(it);
      toast('Didapat: ' + ((CASE.items && CASE.items[it]) || it)); sfx('pick'); changed();
    },
    take: function (it) { delete S.items[it]; S.itemOrder = S.itemOrder.filter(function (x) { return x !== it; }); changed(); },
    knows: function (id) { return !!S.facts[id]; },
    fact: function (id) {
      if (S.facts[id] || !CASE.facts[id]) return;
      S.facts[id] = true; S.factOrder.push(id); S.unread++;
      toast('Catatan baru · ' + strip(CASE.facts[id]).slice(0, 52) + (strip(CASE.facts[id]).length > 52 ? '…' : ''));
      changed();
    },
    found: function (cid) { return !!S.found[cid]; },
    allKeys: function () { var ks = keyClues(); for (var i = 0; i < ks.length; i++) if (!S.found[ks[i].id]) return false; return true; },
    keysFound: function () { var ks = keyClues(), n = 0; for (var i = 0; i < ks.length; i++) if (S.found[ks[i].id]) n++; return n; },
    keysTotal: function () { return keyClues().length; },
    decrypted: function () { return !!S.decrypted; },
    plain: function () { return BUILT.plain; },
    doorOpen: function (id) { return !!S.doors[id]; },
    prop: propById,
    say: function (lines, after) { openDialog({ lines: lines, after: after }); },
    look: function (title, html, after) { openDialog({ title: title, html: html, after: after, buttons: [{ label: 'Tutup' }] }); },
    ask: function (title, html, buttons) { openDialog({ title: title, html: html, buttons: buttons }); },
    code: function (o) { openCode(o); },
    switches: function (o) { openSwitches(o); },
    pick: function (o) { openPick(o); },
    reveal: function (cid, P, lead) { revealClue(cid, P, lead); },
    examine: function (P) { examine(P); },
    scene: function (name, after) { playScene(name, after); },
    extinguish: function (P, after) { extinguish(P, after); },
    anim: function (P, key, to, dur, after) { tweens.push({ o: P.st, k: key, from: P.st[key] || 0, to: to, d: dur, t: 0, after: after }); },
    toast: function (m) { toast(m); },
    score: function (d) { addScore(d); },
    sfx: sfx,
    power: function (on) { S.power = !!on; sfx('power'); }
  };

  function changed() { updateHud(); checkReady(); }

  function stepsAll() {
    var out = [];
    for (var i = 0; i < CASE.steps.length; i++) {
      var st = CASE.steps[i];
      var label = st.label;
      if (st.keys) label += ' (' + G.keysFound() + '/' + G.keysTotal() + ')';
      out.push({ label: label, done: !!st.done(G), hint: st.hint });
    }
    return out;
  }
  function mainDone() { var s = stepsAll(); for (var i = 0; i < s.length; i++) if (!s[i].done) return false; return true; }
  function checkReady() {
    if (!S || S.readyShown || !mainDone()) return;
    S.readyShown = true;
    $('btn-deduce').classList.add('show');
    later(function () {
      sfx('win');
      G.ask('BUKTI SUDAH CUKUP', 'Semua kepingan sudah di tanganmu. Sebelum masuk ruang interogasi, susun dulu <b>deduksi</b>: kapan, bagaimana, dan siapa yang berbohong.', [
        { label: 'Susun deduksi', primary: true, fn: openDeduce },
        { label: 'Nanti dulu' }
      ]);
    });
  }
  // jalankan sesudah dialog / modal yang sedang tampil ditutup
  function later(fn) { pending.push(fn); flushPending(); }
  function busy() { return !!(ui.dialog || ui.modal || screen !== 'scr-play' || spray); }
  function flushPending() {
    if (busy() || !pending.length) return;
    setTimeout(function () {
      // cek ulang: bisa saja dialog/modal lain terbuka selama jeda
      if (busy() || !pending.length) return;
      var fn = pending.shift();
      fn();
    }, 60);
  }

  /* =========================================================
     9. INTERAKSI
     ========================================================= */
  function interactables() {
    var out = [];
    for (var i = 0; i < PROPS.length; i++) {
      var P = PROPS[i];
      if (!P.label) continue;
      if (P.fire && !(P.st.fire > 0)) continue;
      var vy = P.wall ? P.y : P.y;
      out.push({ kind: 'prop', o: P, rect: { x: P.x + (P.st.shift || 0), y: vy, w: P.w, h: P.h } });
    }
    for (var j = 0; j < NPCS.length; j++) {
      var n = NPCS[j];
      if (!npcVisible(n)) continue;
      out.push({ kind: 'npc', o: n, rect: { x: n.x - 7, y: n.y - 22, w: 14, h: 23 } });
    }
    for (var k = 0; k < DOORS.length; k++) {
      var d = DOORS[k];
      if (S.doors[d.id]) continue;
      out.push({ kind: 'door', o: d, rect: { x: d.x - (d.orient === 'v' ? 2 : 0), y: d.y, w: T + (d.orient === 'v' ? 4 : 0), h: T } });
    }
    return out;
  }
  function rectDist(px, py, r) {
    var dx = Math.max(r.x - px, 0, px - (r.x + r.w));
    var dy = Math.max(r.y - py, 0, py - (r.y + r.h));
    return Math.sqrt(dx * dx + dy * dy);
  }
  function nearest() {
    var list = interactables();
    var fx = 0, fy = 0;
    if (player.dir === 'up') fy = -7; else if (player.dir === 'down') fy = 5;
    else if (player.dir === 'left') fx = -8; else fx = 8;
    var px = player.x + fx, py = player.y - 3 + fy;
    var best = null, bd = 1e9;
    for (var i = 0; i < list.length; i++) {
      var it = list[i];
      var d = rectDist(px, py, it.rect);
      var d2 = rectDist(player.x, player.y - 2, it.rect);
      var score = Math.min(d, d2 + 3);
      if (score > 7) continue;
      if (it.kind === 'npc') score -= 1;
      if (it.kind === 'prop' && it.o.fire) score -= 1.5;
      if (score < bd) { bd = score; best = it; }
    }
    return best;
  }
  function labelOf(it) {
    if (!it) return '';
    if (it.kind === 'npc') return 'Bicara dengan ' + it.o.ch.name;
    if (it.kind === 'door') return (S.items[it.o.def.item] ? 'Buka ' : 'Periksa ') + it.o.def.name.toLowerCase();
    if (it.o.def.blockedBy && fireBurning(it.o.def.blockedBy)) return 'Padamkan api';
    return it.o.label;
  }

  function interact(it) {
    if (!it || ui.dialog || ui.modal || spray) return;
    sfx('blip');
    if (it.kind === 'npc') {
      var h = CASE.handlers[it.o.id];
      S.talked[it.o.id] = true;
      faceTo(it.o);
      if (h) h(G, it.o); else G.say([[it.o.def.ch, 'Ada yang bisa saya bantu, Detektif?']]);
      return;
    }
    if (it.kind === 'door') { useDoor(it.o); return; }
    var P = it.o;
    if (P.def.blockedBy && fireBurning(P.def.blockedBy)) {
      var F = propById(P.def.blockedBy);
      if (S.items.pemadam) { var hf = CASE.handlers[F.id]; if (hf) hf(G, F); else extinguish(F); return; }
      G.look(P.title, 'Api masih menjilat di dekatnya. Panasnya tidak mungkin didekati — <b>padamkan dulu</b> dengan tabung pemadam.');
      return;
    }
    var hd = CASE.handlers[P.id];
    if (hd) { hd(G, P); return; }
    if (P.fire) { extinguish(P); return; }
    examine(P);
  }
  function faceTo(n) {
    var dx = player.x - n.x, dy = player.y - n.y;
    n.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
  }
  function useDoor(d) {
    var def = d.def;
    if (S.items[def.item]) {
      S.doors[d.id] = true; sfx('door');
      changed();
      G.look(def.name, def.opened, function () {
        var h = CASE.onDoor && CASE.onDoor[d.id];
        if (h) h(G);
      });
    } else {
      G.look(def.name, def.locked);
    }
  }
  function examine(P) {
    var cid = BUILT.spots[P.id];
    if (cid && !S.found[cid]) {
      if (P.def.fact) G.fact(P.def.fact);
      var lead = (P.def.look ? P.def.look + '<br><br>' : '') + (P.def.spotText || 'Ada sobekan kertas berisi rumus:');
      revealClue(cid, P, lead);
      return;
    }
    if (P.def.fact) G.fact(P.def.fact);
    var txt = P.def.look || 'Tidak ada yang mencurigakan di sini.';
    if (cid && S.found[cid]) txt += '<br><span class="dim">Sobekan kunci dari sini sudah kamu catat.</span>';
    G.look(P.title, txt);
  }
  function revealClue(cid, P, lead) {
    var c = clueById(cid);
    if (!c) return;
    var first = !S.found[cid];
    if (first) { S.found[cid] = true; S.foundOrder.push(cid); sfx('pick'); }
    var tail = c.kind === 'msg'
      ? '<span class="dim">Disalin ke CATATAN. Cari kuncinya, lalu buka ALAT (T).</span>'
      : '<span class="dim">Sobekan kunci disalin ke CATATAN. (' + G.keysFound() + '/' + G.keysTotal() + ')</span>';
    var html = (lead || '') + '<pre class="clue">' + esc(c.body) + '</pre>' + tail;
    var btns = [{ label: 'Tutup' }];
    if (G.found('msg') && G.allKeys() && !S.decrypted) btns.unshift({ label: 'Buka ALAT', primary: true, fn: openTool });
    openDialog({ title: P ? P.title : c.title, html: html, buttons: btns });
    changed();
    if (first && G.found('msg') && G.allKeys() && !S.decrypted) toast('Pesan & kunci lengkap · tekan T untuk ALAT DEKRIPSI');
  }
  function extinguish(P, after) {
    if (!(P.st.fire > 0)) { G.look(P.title, 'Apinya sudah padam. Tinggal jelaga.'); return; }
    if (!S.items.pemadam) {
      G.look(P.title, 'Api menjilat tinggi, panasnya terasa sampai ke wajah. Tangan kosong tidak akan cukup — kamu butuh <b>tabung pemadam</b>.');
      return;
    }
    sfx('spray');
    spray = { P: P, t: 0, dur: 1.6, after: function () {
      P.st.fire = 0; S.flags['out_' + P.id] = true; changed();
      if (after) after(); else toast('Api padam');
    } };
  }
  function playScene(name, after) {
    var shots = CASE.scenes[name];
    if (!shots) { if (after) after(); return; }
    fadeTo(function () {
      showScreen('scr-cut');
      SC.playCut(shots, function () {
        fadeTo(function () { showScreen('scr-play'); if (after) after(); flushPending(); });
      });
    });
  }

  /* =========================================================
     10. DIALOG (potret + mesin ketik)
     ========================================================= */
  var dlgEl, dlgPort, dlgPg, dlgName, dlgRole, dlgText, dlgBtns, dlgTitle;
  function openDialog(o) {
    ui.dialog = { lines: o.lines || null, i: 0, after: o.after, html: o.html, title: o.title, buttons: o.buttons, typing: 0, len: 0, text: '' };
    showDialogPart();
    $('prompt').classList.remove('show');
  }
  function showDialogPart() {
    var d = ui.dialog;
    dlgBtns.innerHTML = '';
    if (d.lines) {
      var L = d.lines[d.i];
      var who = L[0], ch = who ? DS.CHARS[who] : null;
      var radio = ch && CASE && who === CASE.radio && screen === 'scr-play' && !npcHere(who);
      dlgEl.classList.toggle('has-port', !!ch);
      dlgEl.classList.remove('titled');
      if (ch) { dlgPg.clearRect(0, 0, 40, 40); dlgPg.drawImage(A.portrait(ch, L[2] || 'neutral'), 0, 0); }
      dlgName.textContent = ch ? ch.name : '';
      dlgRole.textContent = ch ? (ch.role + (radio ? ' · via HT' : '')) : '';
      d.text = L[1]; d.typing = 0; d.len = SC.typedHtml(L[1], 99999).replace(/<[^>]*>/g, '').length;
      dlgText.innerHTML = '';
      var more = d.i < d.lines.length - 1;
      addBtn(more ? 'Lanjut ▸' : 'Tutup', true, function () { advanceDialog(true); });
    } else {
      dlgEl.classList.remove('has-port');
      dlgEl.classList.add('titled');
      dlgName.textContent = d.title || '';
      dlgRole.textContent = '';
      d.text = d.html || ''; d.typing = 0; d.len = strip(d.text).length;
      dlgText.innerHTML = '';
      (d.buttons || [{ label: 'Tutup' }]).forEach(function (b, idx) {
        addBtn(b.label, !!b.primary || (d.buttons.length === 1), function () { closeDialog(b.fn); }, idx + 1);
      });
    }
    dlgEl.classList.add('show');
  }
  function npcHere(id) { for (var i = 0; i < NPCS.length; i++) if (NPCS[i].def.ch === id && npcVisible(NPCS[i])) return true; return false; }
  function addBtn(label, primary, fn, num) {
    var b = document.createElement('button');
    b.className = 'btn' + (primary ? ' primary' : '');
    b.innerHTML = (num && num > 0 ? '<i>' + num + '</i>' : '') + esc(label);
    b.addEventListener('click', function (e) { e.stopPropagation(); fn(); });
    dlgBtns.appendChild(b);
  }
  function tickDialog(dt) {
    var d = ui.dialog;
    if (!d || d.typing >= d.len) return;
    var before = Math.floor(d.typing);
    d.typing = Math.min(d.len, d.typing + dt * (d.lines ? 55 : 160));
    var now = Math.floor(d.typing);
    if (now !== before) {
      dlgText.innerHTML = d.typing >= d.len ? d.text : SC.typedHtml(d.text, now);
      if (d.lines && now % 3 === 0) sfx('type');
    }
  }
  function finishTyping() { var d = ui.dialog; if (d && d.typing < d.len) { d.typing = d.len; dlgText.innerHTML = d.text; return true; } return false; }
  function advanceDialog(fromBtn) {
    var d = ui.dialog;
    if (!d) return;
    if (finishTyping() && !fromBtn) return;
    if (d.lines) {
      if (d.i < d.lines.length - 1) { d.i++; sfx('blip'); showDialogPart(); return; }
      closeDialog(d.after);
      return;
    }
    // dialog berjudul: E = tombol utama (kalau cuma satu tombol / "Tutup")
    var btns = d.buttons || [];
    if (btns.length <= 1) { closeDialog(btns[0] && btns[0].fn); return; }
    for (var i = 0; i < btns.length; i++) if (btns[i].primary) { closeDialog(btns[i].fn); return; }
  }
  function closeDialog(fn) {
    var d = ui.dialog;
    ui.dialog = null;
    dlgEl.classList.remove('show');
    var after = fn || (d && !d.lines ? d.after : null);
    if (after) after();
    flushPending();
  }
  function pickDialogButton(n) {
    var d = ui.dialog;
    if (!d || d.lines) return;
    var b = (d.buttons || [])[n - 1];
    if (b) closeDialog(b.fn);
  }

  /* =========================================================
     11. PUZZLE: gembok angka, sakelar, pilih satu
     ========================================================= */
  function openModal(id) { ui.modal = id; $(id).classList.add('show'); $('prompt').classList.remove('show'); }
  function closeModal(id) {
    $(id || ui.modal).classList.remove('show');
    if (!id || ui.modal === id) ui.modal = null;
    flushPending();
  }

  /* ---- gembok angka ---- */
  var codeState = null;
  function openCode(o) {
    var len = o.answer.length;
    codeState = { o: o, d: [], cur: 0 };
    for (var i = 0; i < len; i++) codeState.d.push(0);
    $('code-title').textContent = o.title || 'GEMBOK';
    $('code-desc').innerHTML = o.desc || '';
    $('code-msg').textContent = ''; $('code-msg').className = 'pz-msg';
    renderCode();
    openModal('m-code');
  }
  function renderCode() {
    var wrap = $('code-wheels'); wrap.innerHTML = '';
    codeState.d.forEach(function (v, i) {
      var w = document.createElement('div');
      w.className = 'wheel' + (i === codeState.cur ? ' cur' : '');
      var up = document.createElement('button'); up.className = 'wb'; up.textContent = '▲';
      var dn = document.createElement('button'); dn.className = 'wb'; dn.textContent = '▼';
      var n = document.createElement('div'); n.className = 'wn'; n.textContent = v;
      up.onclick = function () { codeState.cur = i; codeState.d[i] = (v + 1) % 10; sfx('switch'); renderCode(); };
      dn.onclick = function () { codeState.cur = i; codeState.d[i] = (v + 9) % 10; sfx('switch'); renderCode(); };
      n.onclick = function () { codeState.cur = i; renderCode(); };
      w.appendChild(up); w.appendChild(n); w.appendChild(dn);
      wrap.appendChild(w);
    });
  }
  function codeKey(k) {
    if (!codeState) return;
    if (/^[0-9]$/.test(k)) { codeState.d[codeState.cur] = +k; codeState.cur = Math.min(codeState.d.length - 1, codeState.cur + 1); sfx('switch'); renderCode(); }
    else if (k === 'arrowleft') { codeState.cur = Math.max(0, codeState.cur - 1); renderCode(); }
    else if (k === 'arrowright') { codeState.cur = Math.min(codeState.d.length - 1, codeState.cur + 1); renderCode(); }
    else if (k === 'arrowup') { codeState.d[codeState.cur] = (codeState.d[codeState.cur] + 1) % 10; renderCode(); }
    else if (k === 'arrowdown') { codeState.d[codeState.cur] = (codeState.d[codeState.cur] + 9) % 10; renderCode(); }
    else if (k === 'backspace') { codeState.cur = Math.max(0, codeState.cur - 1); codeState.d[codeState.cur] = 0; renderCode(); }
    else if (k === 'enter') submitCode();
  }
  function submitCode() {
    if (!codeState) return;
    var v = codeState.d.join('');
    if (v === codeState.o.answer) {
      sfx('ok');
      var o = codeState.o; codeState = null;
      closeModal('m-code');
      if (o.onOk) o.onOk();
    } else {
      sfx('bad'); addScore(-15); S.mistakes++;
      var m = $('code-msg'); m.textContent = 'Tidak terbuka. (−15) Cek lagi catatanmu (N).'; m.className = 'pz-msg bad';
      var card = $('m-code').querySelector('.modal-card'); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
    }
  }

  /* ---- sakelar saling terkait (lights-out 1 dimensi) ---- */
  var swState = null;
  function openSwitches(o) {
    var n = 5, s = [true, true, true, true, true];
    var presses = DIFF.id === 'hard' ? 3 : 2;
    var used = {};
    for (var k = 0; k < presses; k++) {
      var i; do { i = Math.floor(Math.random() * n); } while (used[i]);
      used[i] = 1;
      for (var j = i - 1; j <= i + 1; j++) if (j >= 0 && j < n) s[j] = !s[j];
    }
    if (s.every(function (x) { return x; })) { s[0] = !s[0]; s[1] = !s[1]; }
    swState = { o: o, s: s, moves: 0 };
    $('sw-title').textContent = o.title || 'PANEL';
    $('sw-msg').textContent = ''; $('sw-msg').className = 'pz-msg';
    renderSwitches();
    openModal('m-switch');
  }
  function renderSwitches() {
    var wrap = $('sw-row'); wrap.innerHTML = '';
    swState.s.forEach(function (on, i) {
      var b = document.createElement('button');
      b.className = 'sw' + (on ? ' on' : '');
      b.innerHTML = '<span class="sw-lamp"></span><span class="sw-lever"></span><span class="sw-n">' + (i + 1) + '</span>';
      b.onclick = function () { pressSwitch(i); };
      wrap.appendChild(b);
    });
    $('sw-moves').textContent = 'Langkah: ' + swState.moves;
    var p = propById('panelListrik'); if (p) p.st.sw = swState.s.slice();
  }
  function pressSwitch(i) {
    if (!swState || swState.solved) return;
    for (var j = i - 1; j <= i + 1; j++) if (j >= 0 && j < swState.s.length) swState.s[j] = !swState.s[j];
    swState.moves++; sfx('switch');
    renderSwitches();
    if (swState.s.every(function (x) { return x; })) {
      swState.solved = true;
      var m = $('sw-msg'); m.textContent = 'Semua hijau!'; m.className = 'pz-msg good';
      setTimeout(function () {
        var o = swState.o; swState = null;
        closeModal('m-switch');
        var p = propById('panelListrik'); if (p) delete p.st.sw;
        if (o.onOk) o.onOk();
      }, 500);
    }
  }
  function resetSwitches() { if (!swState) return; var o = swState.o; closeModal('m-switch'); openSwitches(o); }

  /* ---- pilih satu (tanda tangan, dsb.) ---- */
  var pickState = null;
  function openPick(o) {
    pickState = { o: o };
    $('pk-title').textContent = o.title || 'PILIH';
    $('pk-desc').innerHTML = o.desc || '';
    $('pk-msg').textContent = ''; $('pk-msg').className = 'pz-msg';
    var wrap = $('pk-opts'); wrap.innerHTML = ''; wrap.className = 'pk-opts ' + (o.cls || '');
    var order = shuffle(o.options.map(function (x, i) { return i; }));
    order.forEach(function (idx) {
      var op = o.options[idx];
      var b = document.createElement('button');
      b.className = 'pk-opt'; b.innerHTML = op.html;
      b.onclick = function () {
        if (op.ok) {
          sfx('ok'); b.classList.add('good');
          setTimeout(function () { pickState = null; closeModal('m-pick'); if (o.onOk) o.onOk(); }, 450);
        } else {
          sfx('bad'); addScore(-30); S.mistakes++; b.classList.add('bad'); b.disabled = true;
          var m = $('pk-msg'); m.textContent = (o.wrong || 'Bukan yang ini.') + ' (−30)'; m.className = 'pz-msg bad';
        }
      };
      wrap.appendChild(b);
    });
    openModal('m-pick');
  }

  /* =========================================================
     12. ALAT DEKRIPSI
     ========================================================= */
  function openTool() {
    if (!S) return;
    if (ui.dialog) closeDialog();
    var inMsg = $('in-msg'), inKey = $('in-key');
    $('tool-msg').textContent = ''; $('tool-msg').className = 'tool-msg';
    if (S.decrypted) {
      inMsg.value = BUILT.clues[0].body;
      inKey.value = [composeLine(BUILT.layers)].concat(BUILT.layers.map(function (L, i) { return FN_NAMES[i] + '(x) = ' + fnStr(L); })).join('\n');
      $('tool-out').textContent = BUILT.plain;
      $('tool-msg').textContent = 'Pesan ini sudah terbuka.'; $('tool-msg').className = 'tool-msg good';
      renderSteps(BUILT.cipher, parseFns(inKey.value));
    } else if (!S.toolTouched) {
      inMsg.value = ''; inKey.value = ''; $('tool-out').textContent = '—'; $('tool-steps').innerHTML = '';
    }
    $('tool-lapis').textContent = BUILT.layers.length;
    renderEvidence();
    renderFnList();
    showScreen('scr-tool');
  }
  function closeTool() {
    showScreen('scr-play');
    if (S.decrypted && !S.decryptTalked) {
      S.decryptTalked = true;
      later(function () {
        G.say([[CASE.radio, 'Pesannya terbaca: <b>' + BUILT.plain + '</b>. Sekarang tinggal mencari tahu apa maksudnya di TKP.']]);
      });
    }
    flushPending();
  }
  function renderEvidence() {
    var wrap = $('tool-evidence'); wrap.innerHTML = '';
    BUILT.clues.forEach(function (c) {
      var f = !!S.found[c.id];
      var d = document.createElement('div'); d.className = 'ev-item' + (f ? '' : ' missing');
      d.innerHTML = '<h5>' + esc(c.title) + '</h5><pre>' + (f ? esc(c.body) : '— belum ditemukan —') + '</pre>';
      wrap.appendChild(d);
    });
  }
  function pasteClue(target) {
    S.toolTouched = true;
    var el = $(target), txt = '';
    if (target === 'in-msg') {
      if (S.found.msg) txt = clueById('msg').body;
      if (!txt) { toast('Pesan terenkripsinya belum ditemukan'); return; }
      el.value = txt;
    } else {
      var parts = [];
      for (var i = 0; i < S.foundOrder.length; i++) { var c = clueById(S.foundOrder[i]); if (c && c.kind === 'key') parts.push(c.body); }
      if (!parts.length) { toast('Belum ada sobekan kunci yang ditemukan'); return; }
      el.value = parts.join('\n');
    }
    renderFnList();
  }
  function keyLinesFromBox() {
    var lines = $('in-key').value.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
    var comp = lines.filter(function (l) { return /^c\s*=/i.test(l); });
    var fns = lines.filter(function (l) { return !/^c\s*=/i.test(l); });
    return { comp: comp, fns: fns };
  }
  function renderFnList() {
    var box = $('tool-fns'); box.innerHTML = '';
    var kl = keyLinesFromBox();
    var fns = parseFns(kl.fns.join('\n'));
    $('tool-comp').textContent = kl.comp[0] || (fns.length ? '(baris "c = ..." belum ada)' : '');
    fns.forEach(function (f, i) {
      var row = document.createElement('div'); row.className = 'fn-row';
      var ok = gcd(f.a, 26) === 1;
      row.innerHTML = '<span class="fn-ord">' + (i + 1) + (i === 0 ? ' · dibuka pertama' : '') + '</span>' +
        '<span class="fn-f">' + esc(f.name) + '(x) = ' + esc(fnStr(f)) + '</span>' +
        '<span class="fn-inv">' + (ok ? esc(f.name) + '⁻¹(y) = ' + esc(invStr(f)) + ' mod 26' : 'tidak punya invers!') + '</span>';
      var up = document.createElement('button'); up.className = 'btn tiny'; up.textContent = '▲'; up.disabled = i === 0;
      var dn = document.createElement('button'); dn.className = 'btn tiny'; dn.textContent = '▼'; dn.disabled = i === fns.length - 1;
      up.onclick = function () { moveFn(i, -1); };
      dn.onclick = function () { moveFn(i, 1); };
      row.appendChild(up); row.appendChild(dn);
      box.appendChild(row);
    });
  }
  function moveFn(i, d) {
    var kl = keyLinesFromBox();
    var j = i + d;
    if (j < 0 || j >= kl.fns.length) return;
    var t = kl.fns[i]; kl.fns[i] = kl.fns[j]; kl.fns[j] = t;
    $('in-key').value = kl.comp.concat(kl.fns).join('\n');
    sfx('switch');
    renderFnList();
  }
  function renderSteps(cipher, fns) {
    var html = '<table><tr><th>sandi</th>';
    for (var j = 0; j < fns.length; j++) html += '<th>' + esc(fns[j].name) + '⁻¹</th>';
    html += '<th>asli</th></tr>';
    var shown = 0;
    for (var i = 0; i < cipher.length && shown < 6; i++) {
      var ch = cipher.charAt(i).toUpperCase();
      if (ch === ' ') continue;
      var v = l2n(ch);
      html += '<tr><td><b>' + ch + '</b> = ' + v + '</td>';
      for (var k = 0; k < fns.length; k++) { v = m26(fns[k].inv * (v - fns[k].b)); html += '<td>' + v + '</td>'; }
      html += '<td class="st-c">' + n2l(v) + '</td></tr>';
      shown++;
    }
    $('tool-steps').innerHTML = html + '</table>';
  }
  function runDecrypt() {
    var msgEl = $('tool-msg'), outEl = $('tool-out');
    S.toolTouched = true;
    function bad(t) { msgEl.textContent = t; msgEl.className = 'tool-msg bad'; sfx('bad'); }
    var raw = $('in-msg').value.toUpperCase().replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!raw) return bad('Pesan terenkripsi masih kosong — klik TEMPEL.');
    var fns = parseFns(keyLinesFromBox().fns.join('\n'));
    if (!fns.length) return bad('Kunci belum terbaca. Format tiap baris: f(x) = 3x + 7');
    if (fns.length !== BUILT.layers.length) return bad('Jumlah fungsi belum pas: pesan ini dikunci ' + BUILT.layers.length + ' lapis, kamu memasukkan ' + fns.length + '. Ada sobekan yang belum ketemu?');
    for (var i = 0; i < fns.length; i++) if (gcd(fns[i].a, 26) !== 1) return bad('Koefisien ' + fns[i].a + ' tidak punya invers mod 26 — bukan kunci yang valid.');
    var res = decryptWith(raw, fns);
    if (!res) return bad('Sandi hanya boleh berisi huruf dan spasi.');
    outEl.textContent = res;
    renderSteps(raw, fns);
    if (res === BUILT.plain) {
      if (!S.decrypted) { S.decrypted = true; sfx('win'); changed(); }
      msgEl.textContent = 'Pesan terbaca! Urutan lapisnya benar.'; msgEl.className = 'tool-msg good';
      toast('Sandi terpecahkan');
    } else {
      S.wrongOrder = (S.wrongOrder || 0) + 1;
      bad('Hasilnya belum jadi kalimat — cek urutan lapisnya. Fungsi terluar (paling kiri di "c = ...") dibuka pertama.');
    }
  }

  /* =========================================================
     13. CATATAN DETEKTIF
     ========================================================= */
  var nbTab = 'fakta';
  function openNotes(tab) {
    if (!S || ui.dialog) return;
    nbTab = tab || nbTab;
    S.unread = 0;
    renderNotes();
    openModal('m-notes');
    updateHud();
  }
  function renderNotes() {
    var tabs = document.querySelectorAll('#m-notes .nb-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.toggle('on', tabs[i].getAttribute('data-tab') === nbTab);
    var b = $('nb-body'), h = '';
    if (nbTab === 'fakta') {
      if (!S.factOrder.length) h = '<p class="dim">Belum ada catatan. Periksa barang dan tanyai saksi.</p>';
      h += '<ol class="nb-facts">';
      for (var j = 0; j < S.factOrder.length; j++) h += '<li>' + CASE.facts[S.factOrder[j]] + '</li>';
      h += '</ol>';
    } else if (nbTab === 'sandi') {
      BUILT.clues.forEach(function (c) {
        var f = !!S.found[c.id];
        h += '<div class="ev-item' + (f ? '' : ' missing') + '"><h5>' + esc(c.title) + '</h5><pre>' + (f ? esc(c.body) : '— belum ditemukan —') + '</pre></div>';
      });
      if (S.decrypted) h += '<div class="ev-item solved"><h5>HASIL DEKRIPSI</h5><pre>' + esc(BUILT.plain) + '</pre></div>';
    } else {
      CASE.suspects.forEach(function (s) {
        var ch = DS.CHARS[s.ch];
        h += '<div class="nb-sus"><canvas width="40" height="40" data-ch="' + s.ch + '"></canvas><div><b>' + esc(ch.name) + '</b> <span class="dim">' + esc(ch.role) + '</span>' +
          '<p><i>Alibi:</i> ' + esc(s.alibi) + '</p><p class="dim">' + esc(s.note) + '</p></div></div>';
      });
    }
    b.innerHTML = h;
    var cvs = b.querySelectorAll('canvas[data-ch]');
    for (var k = 0; k < cvs.length; k++) {
      var g = cvs[k].getContext('2d'); g.imageSmoothingEnabled = false;
      g.drawImage(A.portrait(DS.CHARS[cvs[k].getAttribute('data-ch')]), 0, 0);
    }
  }

  /* =========================================================
     14. BANTUAN HT
     ========================================================= */
  function hint() {
    if (!S || ui.dialog || ui.modal) return;
    var st = stepsAll(), cur = null;
    for (var i = 0; i < st.length; i++) if (!st[i].done) { cur = st[i]; break; }
    var who = CASE.radio;
    if (!cur) {
      G.say([[who, S.deduced ? 'Tinggal satu langkah: tuduh pelakunya di ruang interogasi.' : 'Bukti sudah lengkap. Klik tombol DEDUKSI di atas untuk menyusun kesimpulan.']]);
      return;
    }
    addScore(-30); S.hints++;
    G.say([[who, '<i>(kresek...)</i> ' + cur.hint]]);
  }

  /* =========================================================
     15. DEDUKSI
     ========================================================= */
  var dedState = null;
  function openDeduce() {
    if (!S || !mainDone()) return;
    if (S.deduced) { openInterro(); return; }
    dedState = { i: 0 };
    renderDeduce();
    openModal('m-deduce');
  }
  function renderDeduce() {
    var q = CASE.deduce[dedState.i];
    $('dd-count').textContent = 'PERTANYAAN ' + (dedState.i + 1) + ' / ' + CASE.deduce.length;
    $('dd-q').textContent = q.q;
    $('dd-msg').textContent = ''; $('dd-msg').className = 'pz-msg';
    $('dd-next').style.display = 'none';
    var wrap = $('dd-opts'); wrap.innerHTML = '';
    var order = shuffle(q.a.map(function (x, i) { return i; }));
    order.forEach(function (idx) {
      var b = document.createElement('button');
      b.className = 'pk-opt dd-opt'; b.textContent = q.a[idx];
      b.onclick = function () {
        if (dedState.answered) return;
        if (idx === 0) {
          dedState.answered = true; sfx('ok'); b.classList.add('good');
          var m = $('dd-msg'); m.textContent = q.why; m.className = 'pz-msg good';
          $('dd-next').style.display = '';
          $('dd-next').textContent = dedState.i < CASE.deduce.length - 1 ? 'PERTANYAAN BERIKUTNYA →' : 'KE RUANG INTEROGASI →';
        } else {
          sfx('bad'); addScore(-50); S.mistakes++; b.classList.add('bad'); b.disabled = true;
          var m2 = $('dd-msg'); m2.textContent = 'Tidak cocok dengan bukti. Buka catatanmu lagi. (−50)'; m2.className = 'pz-msg bad';
        }
      };
      wrap.appendChild(b);
    });
  }
  function deduceNext() {
    if (!dedState) return;
    dedState.answered = false;
    if (dedState.i < CASE.deduce.length - 1) { dedState.i++; renderDeduce(); return; }
    S.deduced = true; changed();
    closeModal('m-deduce');
    openInterro();
  }

  /* =========================================================
     16. INTEROGASI
     ========================================================= */
  var iMouse = { x: 320, y: 200 }, iHover = -1, iSel = -1, iSus = [];
  function openInterro() {
    iSus = shuffle(CASE.suspects.slice());
    iSel = -1; iHover = -1;
    $('ic-card').classList.remove('show');
    fadeTo(function () { showScreen('scr-interro'); });
  }
  function selectSuspect(i) {
    if (i < 0 || i >= iSus.length) return;
    var s = iSus[i];
    if (S.accused[s.ch]) return;
    iSel = i; sfx('blip');
    var ch = DS.CHARS[s.ch];
    var pc = $('ic-port').getContext('2d'); pc.imageSmoothingEnabled = false; pc.clearRect(0, 0, 40, 40); pc.drawImage(A.portrait(ch), 0, 0);
    $('ic-name').textContent = ch.name; $('ic-role').textContent = ch.role;
    $('ic-alibi').textContent = s.alibi; $('ic-note').textContent = s.note;
    $('ic-card').classList.add('show');
  }
  function accuse() {
    if (iSel < 0) return;
    var s = iSus[iSel];
    $('ic-card').classList.remove('show');
    var win = s.ch === CASE.culprit;
    S.accused[s.ch] = true;
    S.picked = s.ch;
    fadeTo(function () {
      showScreen('scr-cut');
      SC.playCut(CASE.scenes[win ? 'win' : 'lose'], function () { finish(win); });
    });
  }

  /* =========================================================
     17. SKOR & AKHIR KASUS
     ========================================================= */
  function addScore(d) { S.score = Math.max(0, S.score + d); updateHud(); }
  function rankOf(raw) { return raw >= 1250 ? 'S' : raw >= 1050 ? 'A' : raw >= 850 ? 'B' : 'C'; }
  function finish(win, reason) {
    var bonus = win ? Math.floor(Math.max(0, S.timeLeft) / 2) : 0;
    var raw = S.score + bonus;
    var final = Math.round(raw * DIFF.mult);
    var rank = win ? rankOf(raw) : '-';
    if (win) {
      PROG.solved[CASE.id] = true;
      var key = CASE.id + '.' + DIFF.id;
      if (!PROG.best[key] || PROG.best[key].score < final) PROG.best[key] = { score: final, rank: rank };
      saveProg();
    }
    var E = CASE.ending[win ? 'win' : 'lose'];
    $('end-stamp').textContent = win ? 'TERBUKTI' : (reason === 'time' ? 'WAKTU HABIS' : 'SALAH TUDUH');
    $('end-stamp').className = 'stamp-big' + (win ? '' : ' bad');
    $('end-kicker').textContent = CASE.no + ' · ' + DIFF.label;
    $('end-title').textContent = reason === 'time' ? 'Jejaknya Menguap' : E.title;
    $('end-text').textContent = reason === 'time' ? 'Waktu habis. Berkas kasus ditarik dari mejamu sebelum kamu sempat menyusun bukti.' : E.text;
    var mm = Math.floor(Math.max(0, S.timeLeft) / 60), ss = Math.floor(Math.max(0, S.timeLeft) % 60);
    $('end-stats').innerHTML =
      stat('SKOR', final) + stat('PERINGKAT', rank) + stat('SISA WAKTU', (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss) +
      stat('BANTUAN HT', S.hints) + stat('KESALAHAN', S.mistakes) + stat('PERANGKAP', S.trapsHit);
    var next = DS.CASES[caseIdx + 1];
    $('btn-next').style.display = win && next ? '' : 'none';
    if (next) $('btn-next').textContent = 'LANJUT: ' + next.no + ' →';
    fadeTo(function () { showScreen('scr-end'); });
  }
  function stat(k, v) { return '<div class="stat"><span>' + k + '</span><b>' + v + '</b></div>'; }
  function timeUp() {
    if (S.timeOver) return;
    S.timeOver = true;
    if (ui.modal) closeModal();
    if (ui.dialog) { ui.dialog = null; dlgEl.classList.remove('show'); }
    pending = [];
    sfx('alarm');
    G.ask('WAKTU HABIS', 'Telepon dari kantor polisi: berkas kasus ini ditarik dari tanganmu. Jejaknya sudah terlalu dingin.', [
      { label: 'Lihat hasil', primary: true, fn: function () { finish(false, 'time'); } }
    ]);
  }

  /* =========================================================
     18. PERANGKAP
     ========================================================= */
  var TRAPS = {
    wire:  { label: 'KABEL ALARM', pen: 80, msg: 'Kakimu menyangkut kabel tipis — alarm kecil di sudut ruangan meraung! Pelaku memasangnya untuk tahu kalau ada yang menyelidik.' },
    trip:  { label: 'TALI JEBAKAN', pen: 50, msg: 'Kamu tersandung tali yang direntangkan rendah di lantai. Lututmu membentur lantai.' },
    floor: { label: 'PAPAN LEPAS', pen: 70, msg: 'Papan lantai itu sudah dilonggarkan! Kakimu terperosok, dan kamu terpaksa kembali ke titik masuk untuk membersihkan diri.' }
  };
  function spawnTraps() {
    traps = [];
    var n = DIFF.traps;
    if (!n) return;
    var sc = CASE.spawn.c, sr = CASE.spawn.r;
    var reserved = {};
    function res(c, r, rad) { for (var dc = -rad; dc <= rad; dc++) for (var dr = -rad; dr <= rad; dr++) reserved[(c + dc) + ',' + (r + dr)] = 1; }
    res(sc, sr, 3);
    PROPS.forEach(function (P) {
      var c0 = Math.floor(P.x / T), c1 = Math.ceil((P.x + P.w) / T) - 1, r0 = Math.floor(P.y / T), r1 = Math.ceil((P.y + P.h) / T) - 1;
      for (var c = c0 - 1; c <= c1 + 1; c++) for (var r = r0 - 1; r <= r1 + 1; r++) reserved[c + ',' + r] = 1;
      if (P.wall) for (var c2 = c0; c2 <= c1; c2++) { reserved[c2 + ',' + (r1 + 1)] = 1; reserved[c2 + ',' + (r1 + 2)] = 1; }
    });
    NPCS.forEach(function (N) { res(Math.floor(N.x / T), Math.floor(N.y / T), 1); });
    DOORS.forEach(function (d) { res(d.c, d.r, 1); });
    for (var r = 0; r < MAP.h; r++) for (var c = 0; c < MAP.w; c++) { var ch = chAt(c, r); if (ch === 'D') res(c, r, 1); }
    var pool = [];
    for (var rr = 0; rr < MAP.h; rr++) for (var cc = 0; cc < MAP.w; cc++) {
      var ch2 = chAt(cc, rr);
      if (ch2 === '#' || ch2 === 'L' || ch2 === 'D') continue;
      if (reserved[cc + ',' + rr]) continue;
      pool.push([cc, rr]);
    }
    shuffle(pool);
    var types = ['wire', 'trip', 'floor'];
    for (var i = 0; i < n && i < pool.length; i++) traps.push({ c: pool[i][0], r: pool[i][1], type: types[i % 3], done: false });
  }
  function updateTraps(dt) {
    if (trapCd > 0) trapCd -= dt;
    if (!traps.length || trapCd > 0 || ui.dialog) return;
    var pc = Math.floor(player.x / T), pr = Math.floor((player.y - 2) / T);
    for (var i = 0; i < traps.length; i++) {
      var t = traps[i];
      if (t.done || t.c !== pc || t.r !== pr) continue;
      t.done = true; trapCd = 1;
      var cfg = TRAPS[t.type];
      S.trapsHit++; addScore(-cfg.pen);
      sfx(t.type === 'wire' ? 'alarm' : 'thud');
      shake = 0.35;
      if (t.type === 'floor') { placePlayerAtSpawn(); }
      G.look('PERANGKAP · ' + cfg.label, cfg.msg + ' <b>(−' + cfg.pen + ')</b>');
      updateHud();
      return;
    }
  }
  function drawTraps(g) {
    if (!traps.length) return;
    var a = DIFF.id === 'hard' ? 0.3 : 0.9;
    for (var i = 0; i < traps.length; i++) {
      var t = traps[i]; if (t.done) continue;
      var x = t.c * T, y = t.r * T;
      g.globalAlpha = a;
      if (t.type === 'wire') {
        A.R(g, x, y + 10, 16, 1, '#c9a267'); A.R(g, x, y + 11, 16, 1, 'rgba(0,0,0,.4)');
        A.R(g, x + 3, y + 9, 2, 1, '#ffe9a8'); A.R(g, x + 13, y + 8, 2, 3, '#3a3d44'); A.R(g, x + 13, y + 8, 1, 1, (time * 3 | 0) % 2 ? '#e8564a' : '#5a1f1a');
      } else if (t.type === 'trip') {
        A.R(g, x, y + 12, 16, 1, '#d9cfa8'); A.R(g, x + 1, y + 10, 1, 3, '#6b5a3a'); A.R(g, x + 14, y + 10, 1, 3, '#6b5a3a');
      } else {
        A.R(g, x + 2, y + 2, 12, 12, 'rgba(0,0,0,.28)'); A.R(g, x + 2, y + 2, 12, 1, 'rgba(220,220,220,.25)');
        A.R(g, x + 5, y + 4, 1, 8, 'rgba(230,230,230,.35)'); A.R(g, x + 9, y + 6, 4, 1, 'rgba(230,230,230,.3)');
      }
    }
    g.globalAlpha = 1;
  }

  /* =========================================================
     19. UPDATE & RENDER DUNIA
     ========================================================= */
  var cv, ctx, lc, lg;
  var shake = 0;
  function placePlayerAtSpawn() {
    player.x = CASE.spawn.c * T + 8; player.y = CASE.spawn.r * T + 13; player.dir = CASE.spawn.dir || 'down';
    snapCam();
  }
  function snapCam() {
    var ww = MAP.w * T, wh = MAP.h * T;
    cam.x = ww <= VW ? (ww - VW) / 2 : clamp(player.x - VW / 2, 0, ww - VW);
    cam.y = wh <= VH ? (wh - VH) / 2 : clamp(player.y - 10 - VH / 2, 0, wh - VH);
  }
  function update(dt) {
    time += dt;
    for (var i = tweens.length - 1; i >= 0; i--) {
      var tw = tweens[i];
      tw.t += dt;
      var p = Math.min(1, tw.t / tw.d);
      tw.o[tw.k] = tw.from + (tw.to - tw.from) * (1 - Math.pow(1 - p, 3));
      if (p >= 1) { tweens.splice(i, 1); if (tw.after) tw.after(); }
    }
    if (spray) {
      spray.t += dt;
      spray.P.st.fire = Math.max(0, 1 - spray.t / spray.dur);
      if (spray.t >= spray.dur) { var sp = spray; spray = null; sp.after(); flushPending(); }
    }
    tickDialog(dt);
    if (!S.timeOver) {
      S.timeLeft -= dt;
      if (S.timeLeft <= 0) { S.timeLeft = 0; updateTimer(); timeUp(); }
      else updateTimer();
    }
    var dx = 0, dy = 0;
    if (!ui.dialog && !ui.modal && !spray && !S.timeOver) {
      if (keys.a || keys.arrowleft) dx -= 1;
      if (keys.d || keys.arrowright) dx += 1;
      if (keys.w || keys.arrowup) dy -= 1;
      if (keys.s || keys.arrowdown) dy += 1;
    }
    if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
    player.moving = !!(dx || dy);
    if (player.moving) {
      if (Math.abs(dx) > Math.abs(dy)) player.dir = dx < 0 ? 'left' : 'right';
      else player.dir = dy < 0 ? 'up' : 'down';
      player.anim += dt;
      var speed = (keys.shift ? 112 : 74) * dt;
      var nx = player.x + dx * speed, ny = player.y + dy * speed;
      if (!boxBlocked(nx, player.y)) player.x = nx;
      if (!boxBlocked(player.x, ny)) player.y = ny;
      $('p-keys').style.opacity = '0';
    } else player.anim = 0;
    updateTraps(dt);
    // ruangan
    var pc = Math.floor(player.x / T), pr = Math.floor((player.y - 2) / T), rn = '';
    for (var k = 0; k < CASE.rooms.length; k++) {
      var R2 = CASE.rooms[k];
      if (pc >= R2.c0 && pc <= R2.c1 && pr >= R2.r0 && pr <= R2.r1) { rn = R2.name; break; }
    }
    if (rn && rn !== curRoom) { curRoom = rn; $('hud-place').textContent = rn; banner(rn); }
    // kamera halus
    var ww = MAP.w * T, wh = MAP.h * T;
    var tx = ww <= VW ? (ww - VW) / 2 : clamp(player.x - VW / 2, 0, ww - VW);
    var ty = wh <= VH ? (wh - VH) / 2 : clamp(player.y - 10 - VH / 2, 0, wh - VH);
    cam.x += (tx - cam.x) * Math.min(1, dt * 8);
    cam.y += (ty - cam.y) * Math.min(1, dt * 8);
    if (shake > 0) shake -= dt;
    // prompt
    var it = (!ui.dialog && !ui.modal && !spray) ? nearest() : null;
    S.focus = it;
    var pe = $('prompt');
    if (it) { $('prompt-label').textContent = labelOf(it); pe.classList.add('show'); }
    else pe.classList.remove('show');
  }

  function render() {
    var g = ctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = '#05070b'; g.fillRect(0, 0, VW, VH);
    var sx = shake > 0 ? Math.round((Math.random() - 0.5) * 4) : 0;
    var ox = Math.round(cam.x) - sx, oy = Math.round(cam.y);
    g.setTransform(1, 0, 0, 1, -ox, -oy);
    var c0 = Math.max(0, Math.floor(ox / T) - 1), c1 = Math.min(MAP.w - 1, Math.ceil((ox + VW) / T) + 1);
    var r0 = Math.max(0, Math.floor(oy / T) - 1), r1 = Math.min(MAP.h - 1, Math.ceil((oy + VH) / T) + 1);
    var wallTh = CASE.wall;
    var r, c;
    // lantai, dinding, pintu
    for (r = r0; r <= r1; r++) {
      for (c = c0; c <= c1; c++) {
        var ch = chAt(c, r), x = c * T, y = r * T;
        if (ch === '#') {
          if (!wallLike(c, r + 1)) A.wallFace(g, wallTh, c, x, y, false);
          else if (r === 0 && !wallLike(c, r + 2)) A.wallFace(g, wallTh, c, x, y, true);
          else A.wallTop(g, wallTh, x, y, { l: !wallLike(c - 1, r) && c > 0, r: !wallLike(c + 1, r) && c < MAP.w - 1, u: r > 0 && !wallLike(c, r - 1) });
        } else if (ch === 'L' || ch === 'D') {
          var d = doorAt(c, r), o = orientAt(c, r), open = ch === 'D' || (d && S.doors[d.id]);
          var th = floorTheme(c, r);
          var ff = A.FLOORS[th] || A.FLOORS.lab;
          if (o === 'v') A.door(g, x, y, 'v', open, null, ff, c, r);
          else if (open) {
            ff(g, c, r, x, y);
            A.R(g, x, y, 2, 16, '#3a2c20'); A.R(g, x + 14, y, 2, 16, '#3a2c20');
            if (wallLike(c, r + 1)) { A.R(g, x + 2, y + 8, 12, 8, 'rgba(0,0,0,.45)'); A.R(g, x + 2, y + 12, 12, 4, 'rgba(0,0,0,.4)'); }
          } else A.door(g, x, y, 'h', false, '#5a4a3a');
        } else {
          (A.FLOORS[CASE.themes[ch]] || A.FLOORS.lab)(g, c, r, x, y);
          // bayangan dinding di lantai
          if (wallLike(c, r - 1)) A.R(g, x, y, 16, 3, 'rgba(0,0,0,.28)');
          if (wallLike(c - 1, r)) A.R(g, x, y, 2, 16, 'rgba(0,0,0,.2)');
        }
      }
    }
    // perabot dinding
    var Sv = { power: S.power, sky: CASE.sky };
    var i, P;
    for (i = 0; i < PROPS.length; i++) { P = PROPS[i]; if (P.wall) drawProp(g, P, Sv); }
    // perabot lantai datar
    for (i = 0; i < PROPS.length; i++) { P = PROPS[i]; if (P.floor) drawProp(g, P, Sv); }
    drawTraps(g);
    // entitas terurut kedalaman
    var ents = [];
    for (i = 0; i < PROPS.length; i++) { P = PROPS[i]; if (!P.wall && !P.floor) ents.push({ y: P.y + P.h + (P.type === 'fire_over' ? 0.5 : 0) + (P.type === 'fire_floor' ? 1 : 0), p: P }); }
    for (i = 0; i < NPCS.length; i++) if (npcVisible(NPCS[i])) ents.push({ y: NPCS[i].y, n: NPCS[i] });
    ents.push({ y: player.y, me: true });
    ents.sort(function (a, b) { return a.y - b.y; });
    for (i = 0; i < ents.length; i++) {
      var e = ents[i];
      if (e.p) drawProp(g, e.p, Sv);
      else if (e.n) A.drawChar(g, e.n.ch, e.n.x, e.n.y, e.n.dir, 0, 1);
      else {
        var fr = player.moving ? (Math.floor(player.anim * 8) % 4) : 0;
        A.drawChar(g, DS.CHARS.arsa, player.x, player.y, player.dir, fr, 1);
      }
    }
    drawSpray(g);
    drawLighting(g, ox, oy);
    drawGlints(g);
    drawFocus(g);
    // tanda seru NPC yang belum diajak bicara
    for (i = 0; i < NPCS.length; i++) {
      var n = NPCS[i];
      if (!npcVisible(n) || S.talked[n.id]) continue;
      var bob = Math.round(Math.sin(time * 4) * 1.5);
      A.R(g, n.x - 1, n.y - 33 + bob, 3, 6, '#f2b544'); A.R(g, n.x - 1, n.y - 25 + bob, 3, 2, '#f2b544');
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
  function drawProp(g, P, Sv) {
    var fn = A.PROPS[P.type];
    if (!fn) return;
    var x = P.x + (P.type === 'plant' ? 0 : (P.st.shift || 0));
    fn(g, x, P.y - P.tall, P.w, P.h + P.tall, P, Sv, time);
  }
  function drawLighting(g, ox, oy) {
    var dark = (S.power === false) ? CASE.dark : (CASE.darkLit != null ? CASE.darkLit : CASE.dark);
    if (dark <= 0) return;
    lg.globalCompositeOperation = 'source-over';
    lg.clearRect(0, 0, VW, VH);
    lg.fillStyle = 'rgba(4,6,14,' + dark + ')';
    lg.fillRect(0, 0, VW, VH);
    lg.globalCompositeOperation = 'destination-out';
    function hole(x, y, rad, k) {
      var gr = lg.createRadialGradient(x - ox, y - oy, 0, x - ox, y - oy, rad);
      gr.addColorStop(0, 'rgba(0,0,0,' + (k || 1) + ')'); gr.addColorStop(0.55, 'rgba(0,0,0,' + (0.55 * (k || 1)) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      lg.fillStyle = gr; lg.fillRect(x - ox - rad, y - oy - rad, rad * 2, rad * 2);
    }
    var Ls = CASE.lights || [];
    for (var i = 0; i < Ls.length; i++) {
      var L = Ls[i];
      if (L.power && !S.power) continue;
      hole(L.c * T + 8, L.r * T + 8, L.rad, 0.9);
    }
    var fires = [];
    for (var j = 0; j < PROPS.length; j++) {
      var P = PROPS[j];
      if (P.fire && P.st.fire > 0) {
        var fl = 0.85 + 0.15 * Math.sin(time * 13 + j) * Math.sin(time * 7.7);
        var fx = P.x + P.w / 2, fy = P.y + P.h / 2 - P.tall / 2;
        hole(fx, fy, 70 * P.st.fire * fl, 1);
        fires.push([fx, fy, P.st.fire * fl]);
      }
    }
    var fx2 = player.dir === 'left' ? -10 : player.dir === 'right' ? 10 : 0, fy2 = player.dir === 'up' ? -10 : player.dir === 'down' ? 8 : 0;
    hole(player.x + fx2, player.y - 10 + fy2, dark > 0.6 ? 62 : 54, 1);
    lg.globalCompositeOperation = 'source-over';
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(lc, 0, 0);
    g.globalCompositeOperation = 'lighter';
    for (var k = 0; k < fires.length; k++) {
      var f = fires[k];
      var gr2 = g.createRadialGradient(f[0] - ox, f[1] - oy, 0, f[0] - ox, f[1] - oy, 60 * f[2]);
      gr2.addColorStop(0, 'rgba(255,120,40,.35)'); gr2.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr2; g.fillRect(0, 0, VW, VH);
    }
    g.restore();
  }
  function drawGlints(g) {
    if (!DIFF.glint) return;
    for (var id in BUILT.spots) {
      var cid = BUILT.spots[id];
      if (S.found[cid]) continue;
      var P = propById(id);
      if (!P) continue;
      var cx = P.x + P.w / 2, cy = P.y - P.tall;
      if (Math.hypot(cx - player.x, P.y + P.h / 2 - player.y) > 78) continue;
      var a = 0.35 + 0.5 * Math.abs(Math.sin(time * 2.6 + P.x * 0.07));
      var yy = Math.round(cy - 3 + Math.sin(time * 2.2) * 1.5);
      g.globalAlpha = a;
      A.R(g, cx - 1, yy - 1, 2, 2, '#ffe08a'); A.R(g, cx - 4, yy, 2, 1, '#ffe08a'); A.R(g, cx + 2, yy, 2, 1, '#ffe08a'); A.R(g, cx - 1, yy - 4, 1, 2, '#fff3c4'); A.R(g, cx - 1, yy + 2, 1, 2, '#fff3c4');
      g.globalAlpha = 1;
    }
  }
  function drawFocus(g) {
    var it = S.focus;
    if (!it) return;
    var r = it.rect;
    var vy = r.y, vh = r.h;
    if (it.kind === 'prop') { vy = it.o.y - it.o.tall; vh = it.o.h + it.o.tall; }
    var k = 1 + Math.round(Math.sin(time * 6));
    var x0 = r.x - 2 - k, y0 = vy - 2 - k, x1 = r.x + r.w + 1 + k, y1 = vy + vh + 1 + k, L = 4, col = '#f2b544';
    A.R(g, x0, y0, L, 1, col); A.R(g, x0, y0, 1, L, col);
    A.R(g, x1 - L + 1, y0, L, 1, col); A.R(g, x1, y0, 1, L, col);
    A.R(g, x0, y1, L, 1, col); A.R(g, x0, y1 - L + 1, 1, L, col);
    A.R(g, x1 - L + 1, y1, L, 1, col); A.R(g, x1, y1 - L + 1, 1, L, col);
  }
  function drawSpray(g) {
    if (!spray) return;
    var P = spray.P;
    var tx = P.x + P.w / 2, ty = P.y + P.h / 2 - P.tall / 3;
    var px = player.x, py = player.y - 11;
    var dx = tx - px, dy = ty - py, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
    for (var i = 0; i < 60; i++) {
      var f = ((spray.t * 3 + i * 0.05) % 1);
      var d = 3 + f * len;
      var side = Math.sin(i * 2.7 + spray.t * 9) * (1 + f * 10);
      g.globalAlpha = (1 - f * 0.5) * 0.9;
      A.R(g, px + ux * d - uy * side - 1, py + uy * d + ux * side - 1, f < 0.3 ? 3 : 2, f < 0.3 ? 3 : 2, i % 4 ? '#eaf6ff' : '#ffffff');
    }
    g.globalAlpha = 1;
  }

  /* =========================================================
     20. HUD
     ========================================================= */
  function updateHud() {
    if (!S) return;
    $('hud-score').textContent = S.score;
    var st = stepsAll(), cur = -1;
    for (var i = 0; i < st.length; i++) if (!st[i].done) { cur = i; break; }
    var objective = cur >= 0 ? st[cur].label : (S.deduced ? 'Tuduh pelaku di ruang interogasi' : 'Susun deduksi · klik DEDUKSI');
    $('hud-obj').textContent = objective;
    // daftar tugas
    var html = '', shown = 0;
    for (var j = 0; j < st.length; j++) {
      if (st[j].done) html += '<li class="done"><i>✓</i>' + esc(st[j].label) + '</li>';
      else if (j === cur) html += '<li class="now"><i>▸</i>' + esc(st[j].label) + '</li>';
      else shown++;
    }
    if (cur < 0) html += '<li class="now"><i>▸</i>' + (S.deduced ? 'Tuduh pelaku' : 'Susun deduksi') + '</li>';
    if (shown) html += '<li class="more">+ ' + shown + ' langkah lagi…</li>';
    $('quest-steps').innerHTML = html;
    // barang
    var it = $('hud-items'); it.innerHTML = '';
    for (var k = 0; k < S.itemOrder.length; k++) {
      var s = document.createElement('span'); s.className = 'item-badge'; s.textContent = (CASE.items && CASE.items[S.itemOrder[k]]) || S.itemOrder[k];
      it.appendChild(s);
    }
    var nb = $('btn-notes');
    nb.classList.toggle('ping', S.unread > 0);
    $('notes-count').textContent = S.unread > 0 ? S.unread : '';
    var tb = $('btn-tool');
    tb.classList.toggle('ping', !S.decrypted && G.found('msg') && G.allKeys());
    var tr = $('hud-traps');
    if (traps.length) {
      tr.style.display = '';
      var left = traps.filter(function (x) { return !x.done; }).length;
      tr.textContent = 'PERANGKAP ' + left + '/' + traps.length;
      tr.classList.toggle('alert', S.trapsHit > 0);
    } else tr.style.display = 'none';
  }
  function updateTimer() {
    var sec = Math.max(0, Math.ceil(S.timeLeft));
    var mm = Math.floor(sec / 60), ss = sec % 60;
    var el = $('hud-timer');
    el.textContent = (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
    el.classList.toggle('low', sec <= 60);
  }
  var bannerT = null;
  function banner(txt) {
    var b = $('banner'); b.textContent = txt; b.classList.add('show');
    clearTimeout(bannerT); bannerT = setTimeout(function () { b.classList.remove('show'); }, 1800);
  }
  var toastQ = [], toastBusy = false;
  function toast(m) {
    toastQ.push(m);
    if (!toastBusy) nextToast();
  }
  function nextToast() {
    var el = $('toast');
    if (!toastQ.length) { toastBusy = false; return; }
    toastBusy = true;
    el.textContent = toastQ.shift(); el.classList.add('show');
    setTimeout(function () { el.classList.remove('show'); setTimeout(nextToast, 220); }, 2000);
  }

  /* =========================================================
     21. LAYAR & ALUR
     ========================================================= */
  function showScreen(id) {
    var all = document.querySelectorAll('.screen');
    for (var i = 0; i < all.length; i++) all[i].classList.remove('active');
    $(id).classList.add('active');
    screen = id;
    keys = {};
    if (id !== 'scr-play') $('prompt').classList.remove('show');
  }
  var fading = false;
  function fadeTo(fn) {
    var f = $('fade');
    if (fading) { fn(); return; }
    fading = true;
    f.classList.add('on');
    setTimeout(function () {
      try { fn(); } finally {
        setTimeout(function () { f.classList.remove('on'); fading = false; }, 40);
      }
    }, 260);
  }

  function renderCases() {
    var wrap = $('case-cards'); wrap.innerHTML = '';
    DS.CASES.forEach(function (C, i) {
      var open = unlocked(i), solved = !!PROG.solved[C.id];
      var b = document.createElement('button');
      b.className = 'case-card' + (open ? '' : ' locked') + (solved ? ' solved' : '');
      var best = '';
      ['easy', 'normal', 'hard'].forEach(function (d) { var x = PROG.best[C.id + '.' + d]; if (x) best += '<span>' + d.toUpperCase() + ' ' + x.rank + '</span>'; });
      b.innerHTML = '<div class="cc-tab">' + C.no + '</div>' +
        '<div class="cc-title">' + (open ? esc(C.title) : '???') + '</div>' +
        '<div class="cc-crime">' + (open ? esc(C.crime) + ' · ' + esc(C.place) : 'Terkunci') + '</div>' +
        '<p>' + (open ? esc(C.blurb) : 'Selesaikan ' + DS.CASES[i - 1].no + ' untuk membuka berkas ini.') + '</p>' +
        '<div class="cc-best">' + best + '</div>' +
        (solved ? '<div class="cc-stamp">SELESAI</div>' : '') + (!open ? '<div class="cc-lock">\u{1F512}</div>' : '');
      b.onclick = function () { if (open) openCasePopup(i); else { sfx('bad'); toast('Berkas ini masih tersegel'); } };
      wrap.appendChild(b);
    });
  }
  function openCasePopup(i) {
    var C = DS.CASES[i];
    sfx('blip');
    $('cp-tag').textContent = C.no;
    $('cp-title').textContent = C.title;
    $('cp-meta').textContent = C.crime + ' · ' + C.place + ' · ' + C.when;
    $('cp-desc').textContent = C.blurb;
    var wrap = $('cp-diffs'); wrap.innerHTML = '';
    ['easy', 'normal', 'hard'].forEach(function (id) {
      var D = DS.DIFFS[id];
      var b = document.createElement('button');
      b.className = 'diff-btn d-' + id;
      var tm = C.time[id], mm = Math.floor(tm / 60);
      b.innerHTML = '<b>' + D.label + '</b><span>' + esc(D.desc) + ' · ' + mm + ' menit</span>';
      b.onclick = function () { $('m-case').classList.remove('show'); startCase(i, id); };
      wrap.appendChild(b);
    });
    $('m-case').classList.add('show');
  }

  function startCase(i, diffId) {
    caseIdx = i; CASE = DS.CASES[i]; DIFF = DS.DIFFS[diffId];
    buildCase();
    S = {
      flags: {}, items: {}, itemOrder: [], facts: {}, factOrder: [], found: {}, foundOrder: [], doors: {}, talked: {},
      decrypted: false, score: 1000, timeLeft: CASE.time[DIFF.id], hints: 0, mistakes: 0, trapsHit: 0,
      deduced: false, accused: {}, picked: null, power: CASE.power !== false, unread: 0
    };
    loadMap();
    placeClues();
    placePlayerAtSpawn();
    spawnTraps();
    tweens = []; spray = null; pending = []; ui.dialog = null; ui.modal = null; curRoom = '';
    $('btn-deduce').classList.remove('show');
    $('p-keys').style.opacity = '1';
    $('hud-case').textContent = CASE.no + ' · ' + DIFF.label;
    updateHud(); updateTimer();
    fadeTo(function () {
      showScreen('scr-cut');
      SC.playCut(CASE.scenes.intro, function () {
        fadeTo(function () {
          showScreen('scr-play');
          later(function () {
            G.say([[CASE.radio === 'nayla' ? 'nayla' : 'hendra',
              CASE.id === 'c1'
                ? 'Gerak pakai <b>WASD</b> atau panah, <b>E</b> untuk memeriksa. <b>N</b> membuka catatan, <b>T</b> alat dekripsi, <b>H</b> memanggil saya lewat HT. Semoga berhasil, Detektif.'
                : 'Saya standby di HT, Detektif. Tekan <b>H</b> kalau butuh arahan.']]);
          });
        });
      });
    });
  }
  function goMenu() {
    S = null;
    renderCases();
    fadeTo(function () { showScreen('scr-select'); });
  }

  /* =========================================================
     22. INPUT
     ========================================================= */
  function wire() {
    dlgEl = $('dlg'); dlgPort = $('dlg-portrait'); dlgPg = dlgPort.getContext('2d'); dlgPg.imageSmoothingEnabled = false;
    dlgName = $('dlg-name'); dlgRole = $('dlg-role'); dlgText = $('dlg-text'); dlgBtns = $('dlg-btns');

    $('btn-start').onclick = function () { ac(); sfx('blip'); goMenu(); };
    $('btn-help').onclick = function () { $('m-help').classList.add('show'); };
    $('btn-help-close').onclick = function () { $('m-help').classList.remove('show'); };
    $('btn-select-back').onclick = function () { fadeTo(function () { showScreen('scr-title'); }); };
    $('btn-cp-close').onclick = function () { $('m-case').classList.remove('show'); };

    $('cut-skip').onclick = function (e) { e.stopPropagation(); SC.skipCut(); };
    $('scr-cut').addEventListener('click', function () { SC.advanceCut(); });

    $('btn-notes').onclick = function () { openNotes(); };
    $('btn-tool').onclick = function () { if (!ui.modal) openTool(); };
    $('btn-hint').onclick = function () { hint(); };
    $('btn-deduce').onclick = function () { if (!ui.dialog && !ui.modal) openDeduce(); };
    $('btn-mute').onclick = function () { muted = !muted; $('btn-mute').classList.toggle('off', muted); };
    $('btn-pause').onclick = function () { if (!ui.dialog && !ui.modal) openModal('m-pause'); };
    $('quest-toggle').onclick = function () { $('quest').classList.toggle('min'); };
    $('dlg').addEventListener('click', function (e) { if (e.target.tagName !== 'BUTTON') advanceDialog(false); });

    var tabs = document.querySelectorAll('#m-notes .nb-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].onclick = function () { nbTab = this.getAttribute('data-tab'); renderNotes(); };
    $('nb-close').onclick = function () { closeModal('m-notes'); };

    $('code-ok').onclick = submitCode;
    $('code-cancel').onclick = function () { codeState = null; closeModal('m-code'); };
    $('sw-reset').onclick = resetSwitches;
    $('sw-cancel').onclick = function () { swState = null; var p = propById('panelListrik'); if (p) delete p.st.sw; closeModal('m-switch'); };
    $('pk-cancel').onclick = function () { pickState = null; closeModal('m-pick'); };
    $('dd-next').onclick = deduceNext;
    $('dd-close').onclick = function () { closeModal('m-deduce'); };
    $('dd-notes').onclick = function () { closeModal('m-deduce'); openNotes('fakta'); };

    $('ps-resume').onclick = function () { closeModal('m-pause'); };
    $('ps-help').onclick = function () { $('m-help').classList.add('show'); };
    $('ps-quit').onclick = function () { closeModal('m-pause'); goMenu(); };

    var pastes = document.querySelectorAll('.tool-paste');
    for (var p = 0; p < pastes.length; p++) pastes[p].onclick = function () { pasteClue(this.getAttribute('data-target')); };
    $('in-key').addEventListener('input', function () { S.toolTouched = true; renderFnList(); });
    $('in-msg').addEventListener('input', function () { S.toolTouched = true; });
    $('btn-decrypt').onclick = runDecrypt;
    $('btn-tool-back').onclick = closeTool;
    $('btn-tool-clear').onclick = function () { $('in-msg').value = ''; $('in-key').value = ''; $('tool-out').textContent = '—'; $('tool-steps').innerHTML = ''; renderFnList(); };

    var icv = $('icv');
    icv.addEventListener('mousemove', function (e) {
      var r = icv.getBoundingClientRect(); if (!r.width) return;
      iMouse.x = (e.clientX - r.left) / r.width * 640; iMouse.y = (e.clientY - r.top) / r.height * 360;
      var h = SC.hitSeat(iMouse.x, iMouse.y);
      if (h >= 0 && iSus[h] && S.accused[iSus[h].ch]) h = -1;
      iHover = h;
    });
    icv.addEventListener('click', function () { if (iHover >= 0) selectSuspect(iHover); });
    $('ic-accuse').onclick = accuse;
    $('ic-cancel').onclick = function () { iSel = -1; $('ic-card').classList.remove('show'); };
    $('btn-interro-back').onclick = function () { fadeTo(function () { showScreen('scr-play'); }); };

    $('btn-again').onclick = function () { startCase(caseIdx, DIFF.id); };
    $('btn-next').onclick = function () { renderCases(); fadeTo(function () { showScreen('scr-select'); setTimeout(function () { openCasePopup(caseIdx + 1); }, 300); }); };
    $('btn-menu').onclick = goMenu;

    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', function (e) { keys[(e.key || '').toLowerCase()] = false; });
    window.addEventListener('blur', function () { keys = {}; });
    window.addEventListener('resize', fit);
  }
  function onKey(e) {
    var k = (e.key || '').toLowerCase();
    var tag = e.target && e.target.tagName;
    var typing = tag === 'TEXTAREA' || tag === 'INPUT';
    if (typing) { if (k === 'escape') e.target.blur(); return; }
    if ($('m-help').classList.contains('show')) { if (k === 'escape' || k === 'enter') $('m-help').classList.remove('show'); return; }
    if (screen === 'scr-cut') {
      if (k === ' ' || k === 'enter' || k === 'e') { e.preventDefault(); SC.advanceCut(); }
      else if (k === 'escape') SC.skipCut();
      return;
    }
    if (screen === 'scr-select') {
      if (k === 'escape') $('m-case').classList.remove('show');
      if (k === 'u' && e.shiftKey) { PROG.all = true; saveProg(); renderCases(); toast('Semua kasus dibuka (mode guru)'); }
      return;
    }
    if (screen === 'scr-title') { if (k === 'enter') $('btn-start').click(); return; }
    if (screen === 'scr-tool') { if (k === 'escape') closeTool(); return; }
    if (screen === 'scr-interro') {
      if (k >= '1' && k <= '3') selectSuspect(+k - 1);
      if (k === 'escape') { if (iSel >= 0) { iSel = -1; $('ic-card').classList.remove('show'); } }
      if (k === 'enter' && iSel >= 0) accuse();
      return;
    }
    if (screen !== 'scr-play' || !S) return;
    if (ui.modal) {
      if (ui.modal === 'm-code') { codeKey(k); if (k === 'escape') { codeState = null; closeModal('m-code'); } e.preventDefault(); return; }
      if (k === 'escape' || (ui.modal === 'm-notes' && k === 'n')) closeModal();
      if (ui.modal === 'm-switch' && k >= '1' && k <= '5') pressSwitch(+k - 1);
      return;
    }
    if (ui.dialog) {
      if (k === 'e' || k === ' ' || k === 'enter') { e.preventDefault(); advanceDialog(false); }
      else if (k >= '1' && k <= '4') pickDialogButton(+k);
      else if (k === 'escape') { if (!ui.dialog.lines && (ui.dialog.buttons || []).length <= 1) closeDialog(); }
      return;
    }
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].indexOf(k) >= 0) e.preventDefault();
    keys[k] = true;
    if (e.shiftKey) keys.shift = true;
    if (k === 'e' || k === ' ' || k === 'enter') { var it = nearest(); if (it) interact(it); }
    else if (k === 't') openTool();
    else if (k === 'n') openNotes();
    else if (k === 'h') hint();
    else if (k === 'm') $('btn-mute').click();
    else if (k === 'escape') openModal('m-pause');
  }

  function fit() {
    var s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    $('stage').style.transform = 'scale(' + s + ')';
  }

  /* =========================================================
     23. LOOP UTAMA
     ========================================================= */
  var last = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016);
    last = ts;
    step(dt);
  }
  function step(dt) {
    try {
      var tt = ts2();
      if (screen === 'scr-title') SC.drawTitle(dt, tt);
      else if (screen === 'scr-select') SC.drawSelect(dt, tt);
      else if (screen === 'scr-cut') SC.updateCut(dt);
      else if (screen === 'scr-play' && S) { update(dt); render(); }
      else if (screen === 'scr-interro' && S) SC.drawInterro(tt, iSus, iHover, iMouse, S.accused);
    } catch (err) {
      var e = $('err');
      if (e) { e.style.display = 'block'; e.textContent = String(err && err.stack ? err.stack : err); }
    }
  }
  var tBase = Date.now();
  function ts2() { return (Date.now() - tBase) / 1000; }

  /* =========================================================
     24. BOOT
     ========================================================= */
  window.onerror = function (msg, src, line, col) {
    var e = $('err'); if (!e) return;
    e.style.display = 'block'; e.textContent = msg + '  @' + line + ':' + col;
  };
  cv = $('cv'); ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
  var lk = A.makeCanvas(VW, VH); lc = lk.cv; lg = lk.g;
  SC.initCut(); SC.initTitle(); SC.initSelect(); SC.initInterro();
  wire();
  fit();
  requestAnimationFrame(frame);

  /* ---------- kait untuk uji otomatis (node _selftest.js) ---------- */
  window.DSG = {
    G: G, startCase: startCase, step: step, get S() { return S; }, get BUILT() { return BUILT; }, get CASE() { return CASE; },
    get PROPS() { return PROPS; }, get NPCS() { return NPCS; }, get DOORS() { return DOORS; }, get screen() { return screen; },
    get ui() { return ui; }, player: player, traps: function () { return traps; },
    tileSolid: tileSolid, boxBlocked: boxBlocked, nearest: nearest, interact: interact, interactables: interactables,
    advanceDialog: advanceDialog, closeDialog: closeDialog, pickDialogButton: pickDialogButton,
    submitCodeValue: function (v) { if (!codeState) return false; codeState.d = v.split('').map(Number); submitCode(); return true; },
    solveSwitches: function () {
      if (!swState) return false;
      // cari kombinasi tekan (maks 2^5) yang membuat semua menyala
      var n = swState.s.length;
      for (var m = 0; m < (1 << n); m++) {
        var s = swState.s.slice();
        for (var i = 0; i < n; i++) if (m & (1 << i)) for (var j = i - 1; j <= i + 1; j++) if (j >= 0 && j < n) s[j] = !s[j];
        if (s.every(function (x) { return x; })) { for (var q = 0; q < n; q++) if (m & (1 << q)) pressSwitch(q); return true; }
      }
      return false;
    },
    pickCorrect: function () { if (!pickState) return false; var btns = $('pk-opts').children; for (var i = 0; i < btns.length; i++) btns[i].click(); return true; },
    openTool: openTool, closeTool: closeTool, pasteClue: pasteClue, runDecrypt: runDecrypt, moveFn: moveFn,
    parseFns: parseFns, decryptWith: decryptWith, encrypt: encrypt, composeLine: composeLine, ainv: ainv,
    openDeduce: openDeduce, deduceNext: deduceNext, get dedState() { return dedState; },
    selectSuspect: selectSuspect, accuse: accuse, openInterro: openInterro, get iSus() { return iSus; }, finish: finish,
    SC: SC, unlockAll: function () { PROG.all = true; }, fadeInstant: function () { fading = true; },
    teleportNear: function (it) {
      // taruh pemain di tile kosong yang menempel kotak interaksi
      var r = it.rect, best = null, bd = 1e9;
      for (var y = Math.floor(r.y / T) - 2; y <= Math.ceil((r.y + r.h) / T) + 2; y++) {
        for (var x = Math.floor(r.x / T) - 2; x <= Math.ceil((r.x + r.w) / T) + 2; x++) {
          var px = x * T + 8, py = y * T + 13;
          if (boxBlocked(px, py)) continue;
          var d = rectDist(px, py - 3, r);
          if (d < bd) { bd = d; best = [px, py]; }
        }
      }
      if (!best) return false;
      player.x = best[0]; player.y = best[1];
      var cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      var dx = cx - player.x, dy = cy - (player.y - 6);
      player.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      return true;
    }
  };
})();
