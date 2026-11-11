/* Uji otomatis Detektif Sandi — jalankan:  node _selftest.js
   Memainkan 3 kasus x 3 tingkat dari awal sampai vonis, tanpa browser.
   Setiap barang dicapai dengan jalur jalan kaki (BFS), bukan teleport buta. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* ---------------- DOM tiruan ---------------- */
const registry = {};
let timers = [];
function makeClassList() {
  const set = new Set();
  return {
    add: (...c) => c.forEach(x => set.add(x)), remove: (...c) => c.forEach(x => set.delete(x)),
    toggle: (c, f) => { const on = f === undefined ? !set.has(c) : !!f; if (on) set.add(c); else set.delete(c); return on; },
    contains: c => set.has(c)
  };
}
function ctxStub() {
  const grad = { addColorStop() {} };
  return new Proxy({}, {
    get(t, p) {
      if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => grad;
      if (p === 'measureText') return () => ({ width: 10 });
      if (p in t) return t[p];
      return function () {};
    },
    set(t, p, v) { t[p] = v; return true; }
  });
}
function makeEl(tag, id) {
  const listeners = {};
  let html = '';
  const el = {
    tagName: (tag || 'div').toUpperCase(), id: id || '', style: {}, value: '', disabled: false, textContent: '',
    classList: makeClassList(), attributes: {}, children: [], width: 40, height: 40, offsetWidth: 1, className: '',
    get innerHTML() { return html; },
    set innerHTML(v) { html = String(v); if (!v) el.children = []; },
    setAttribute(k, v) { el.attributes[k] = v; }, getAttribute(k) { return el.attributes[k] != null ? el.attributes[k] : null; },
    addEventListener(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
    dispatch(ev, e) { (listeners[ev] || []).forEach(fn => fn(e || { target: el, stopPropagation() {}, preventDefault() {} })); },
    click() { if (el.disabled) return; if (el.onclick) el.onclick({ stopPropagation() {} }); el.dispatch('click', { target: el, stopPropagation() {} }); },
    appendChild(c) { el.children.push(c); return c; },
    querySelector() { return makeEl('div'); }, querySelectorAll() { return []; },
    getContext() { return ctxStub(); }, getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; },
    focus() {}, blur() {}
  };
  return el;
}
function byId(id) { if (!registry[id]) registry[id] = makeEl('div', id); return registry[id]; }
const SCREENS = ['scr-title', 'scr-select', 'scr-cut', 'scr-play', 'scr-tool', 'scr-interro', 'scr-end'];
const tabs = ['fakta', 'sandi', 'orang'].map(t => { const e = makeEl('button'); e.setAttribute('data-tab', t); return e; });
const pastes = ['in-msg', 'in-key'].map(t => { const e = makeEl('button'); e.setAttribute('data-target', t); return e; });
const documentStub = {
  getElementById: byId,
  createElement: t => makeEl(t),
  querySelectorAll(sel) {
    if (sel === '.screen') return SCREENS.map(byId);
    if (sel === '#m-notes .nb-tab') return tabs;
    if (sel === '.tool-paste') return pastes;
    return [];
  }
};
const store = {};
const ctx = {
  document: documentStub, console, Math, Date, JSON, performance: { now: () => Date.now() },
  localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = String(v); } },
  setTimeout: (fn, ms) => { timers.push(fn); return timers.length; }, clearTimeout() {},
  requestAnimationFrame() {}, addEventListener() {}, innerWidth: 1280, innerHeight: 720
};
ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['js/art.js', 'js/data.js', 'js/scenes.js', 'js/main.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), ctx, { filename: f });
}
const D = ctx.DSG, DS = ctx.DS;

function flush() { let n = 0; while (timers.length && n < 5000) { const t = timers.shift(); t(); n++; } }

/* ---------------- alat uji ---------------- */
let pass = 0, fail = 0;
const failures = [];
function ok(cond, msg) { if (cond) pass++; else { fail++; failures.push(msg); } }
const T = 16;

function tick(n) { for (let i = 0; i < (n || 1); i++) { D.step(0.05); flush(); } }
function skipCuts() { let n = 0; while (D.screen === 'scr-cut' && n < 20) { D.SC.skipCut(); flush(); n++; } }
function resolveUI(answers) {
  for (let guard = 0; guard < 60; guard++) {
    flush();
    if (D.screen === 'scr-cut') { skipCuts(); continue; }
    const ui = D.ui;
    if (ui.modal === 'm-code') { D.submitCodeValue(answers.code[0] || '0000'); continue; }
    if (ui.modal === 'm-switch') { D.solveSwitches(); tick(1); continue; }
    if (ui.modal === 'm-pick') { D.pickCorrect(); tick(1); continue; }
    if (ui.modal) return;
    if (ui.dialog) {
      const d = ui.dialog;
      if (d.lines) { D.advanceDialog(true); continue; }
      const btns = d.buttons || [];
      const prim = btns.findIndex(b => b.primary);
      // jangan otomatis masuk deduksi di tengah uji
      if (prim >= 0 && btns[prim].label !== 'Susun deduksi') { D.pickDialogButton(prim + 1); continue; }
      D.closeDialog(); continue;
    }
    if (D.screen !== 'scr-play') return;
    tick(1);
    if (!D.ui.dialog && !D.ui.modal) return;
  }
}

// BFS jalan kaki dari posisi pemain sekarang
function reachable() {
  const S0 = D.player;
  const start = [Math.floor(S0.x / T), Math.floor((S0.y - 2) / T)];
  const seen = new Set([start.join(',')]), q = [start];
  const W = D.CASE.map[0].length, H = D.CASE.map.length;
  while (q.length) {
    const [c, r] = q.shift();
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc, nr = r + dr, k = nc + ',' + nr;
      if (seen.has(k) || nc < 0 || nr < 0 || nc >= W || nr >= H) continue;
      if (D.boxBlocked(nc * T + 8, nr * T + 13)) continue;
      seen.add(k); q.push([nc, nr]);
    }
  }
  return seen;
}
function findTarget(id) {
  return D.interactables().find(it => it.o.id === id);
}
// jalan ke barang: cari tile terjangkau yang membuat nearest() == barang itu
function walkTo(id) {
  const it = findTarget(id);
  if (!it) return { ok: false, why: 'tidak ada interaksi "' + id + '"' };
  const reach = reachable();
  const dirs = ['up', 'down', 'left', 'right'];
  const r = it.rect;
  const cands = [];
  for (let y = Math.floor(r.y / T) - 2; y <= Math.ceil((r.y + r.h) / T) + 2; y++) {
    for (let x = Math.floor(r.x / T) - 2; x <= Math.ceil((r.x + r.w) / T) + 2; x++) {
      if (!reach.has(x + ',' + y)) continue;
      cands.push([x, y]);
    }
  }
  for (const [x, y] of cands) {
    for (const off of [[8, 13], [4, 13], [12, 13], [8, 8], [8, 15]]) {
      for (const dir of dirs) {
        D.player.x = x * T + off[0]; D.player.y = y * T + off[1]; D.player.dir = dir;
        if (D.boxBlocked(D.player.x, D.player.y)) continue;
        const n = D.nearest();
        if (n && n.o.id === id) return { ok: true, it: n };
      }
    }
  }
  return { ok: false, why: '"' + id + '" tidak terjangkau dengan berjalan' };
}
function use(id, answers, label) {
  resolveUI(answers);
  const w = walkTo(id);
  ok(w.ok, label + ': ' + (w.why || ''));
  if (!w.ok) return false;
  D.interact(w.it);
  resolveUI(answers);
  // tunggu animasi (geser pot, semprot pemadam) selesai
  for (let k = 0; k < 50; k++) { tick(1); if (D.ui.dialog || D.ui.modal || D.screen !== 'scr-play') resolveUI(answers); }
  return true;
}
function decrypt(label) {
  D.openTool();
  D.pasteClue('in-msg'); D.pasteClue('in-key');
  D.runDecrypt();
  // coba urutan lain (tukar baris) sampai benar — sama seperti siswa
  const n = D.BUILT.layers.length;
  const perms = n === 2 ? [[0, 1]] : [[0, 1], [1, 2], [0, 1], [1, 2], [0, 1]];
  let i = 0;
  while (!D.S.decrypted && i < perms.length) { D.moveFn(perms[i][0], 1); D.runDecrypt(); i++; }
  ok(D.S.decrypted, label + ': dekripsi berhasil');
  D.closeTool(); flush();
  resolveUI({ code: [] });
}

/* ---------------- uji matematika ---------------- */
(function mathTests() {
  const L = [{ a: 3, b: 7, inv: 9 }, { a: 1, b: 5, inv: 1 }];
  ok(D.encrypt('K', L) === 'C', 'contoh buku: K -> C');
  ok(D.decryptWith('C', L) === 'K', 'contoh buku: C -> K');
  for (const C of DS.CASES) for (const d of ['easy', 'normal', 'hard']) {
    const ly = C.layers[d].map(p => ({ a: p[0], b: p[1], inv: D.ainv(p[0]) }));
    ly.forEach(x => ok(D.ainv(x.a) > 0, C.id + '.' + d + ': a=' + x.a + ' koprima 26'));
    const c = D.encrypt(C.plain, ly);
    ok(D.decryptWith(c, ly) === C.plain, C.id + '.' + d + ': dekripsi(enkripsi(x)) = x');
    if (ly.length > 1) ok(D.decryptWith(c, ly.slice().reverse()) !== C.plain, C.id + '.' + d + ': urutan terbalik gagal');
  }
})();

/* ---------------- uji tata letak peta ---------------- */
(function layoutTests() {
  DS.CASES.forEach((C, i) => {
    C.map.forEach((row, r) => ok(row.length === C.map[0].length, C.id + ': panjang baris peta ' + r));
    const ids = new Set();
    C.props.forEach(p => { ok(!ids.has(p.id), C.id + ': id ganda ' + p.id); ids.add(p.id); });
    // perabot lantai tidak menimpa dinding / perabot lain
    const occ = {};
    C.props.forEach(p => {
      if (p.wall || p.solid === false || p.type === 'fire_over') return;
      for (let r = p.r; r < p.r + p.h; r++) for (let c = p.c; c < p.c + p.w; c++) {
        const ch = C.map[r][c];
        ok(ch !== '#' && ch !== 'L' && ch !== 'D', C.id + ': ' + p.id + ' menimpa dinding/pintu di ' + c + ',' + r);
        ok(!occ[c + ',' + r], C.id + ': ' + p.id + ' bertumpuk dengan ' + occ[c + ',' + r]);
        occ[c + ',' + r] = p.id;
      }
    });
    C.props.forEach(p => {
      if (!p.wall) return;
      for (let c = p.c; c < p.c + p.w; c++) ok(C.map[p.r][c] === '#', C.id + ': ' + p.id + ' (dinding) tidak di dinding');
    });
    C.doors.forEach(d => ok(C.map[d.r][d.c] === 'L', C.id + ': pintu ' + d.id + ' di tile L'));
    ok(Object.keys(C.handlers).every(h => ids.has(h) || (C.npcs || []).some(n => n.id === h)), C.id + ': semua handler punya objek');
    C.deduce.forEach(q => ok(q.a.length >= 3, C.id + ': opsi deduksi'));
    ok(C.suspects.some(s => s.ch === C.culprit), C.id + ': pelaku ada di daftar tersangka');
    ['intro', 'win', 'lose'].forEach(s => ok(Array.isArray(C.scenes[s]), C.id + ': scene ' + s));
  });
})();

/* ---------------- main 9 mode ---------------- */
const WALK = {
  c1: { code: ['2317'], order: ['joko', 'mejaNayla', '@keys', '@decrypt', 'pot', 'dTeknisi', 'mejaDedi', 'dGudang'] },
  c2: { code: ['1642'], order: ['slamet', 'naylaNpc', 'mejaRatna', '@keys', '@decrypt', 'jamMeja', 'brankas', 'mejaKopi', 'mejaRapat', 'dWakasek', 'lemariBram'] },
  c3: { code: [], order: ['joko', 'hendraNpc', 'ext', 'apiLantai', 'apiRak', 'panelListrik', 'panelAlarm', 'terminalCad', '@keys', '@decrypt', 'rakB', 'terminalKontrol', 'kursiJaket'] }
};

DS.CASES.forEach((C, ci) => {
  ['easy', 'normal', 'hard'].forEach(diff => {
    const label = C.id + '.' + diff;
    D.unlockAll();
    D.startCase(ci, diff);
    flush();
    ok(D.screen === 'scr-cut', label + ': intro cutscene diputar');
    skipCuts(); flush();
    ok(D.screen === 'scr-play', label + ': masuk TKP');
    resolveUI({ code: [] });
    const S = D.S;
    ok(!D.boxBlocked(D.player.x, D.player.y), label + ': titik masuk tidak di dalam tembok');
    const nKeys = D.BUILT.clues.filter(c => c.kind === 'key').length;
    ok(nKeys === Math.min(DS.DIFFS[diff].frags, C.layers[diff].length), label + ': jumlah sobekan kunci');
    ok(Object.keys(D.BUILT.spots).length === nKeys, label + ': semua sobekan dapat tempat');
    ok(D.traps().length === DS.DIFFS[diff].traps, label + ': jumlah perangkap');
    // perangkap dimatikan supaya uji tidak terlempar ke titik masuk
    D.traps().forEach(t => t.done = true);

    const W = WALK[C.id];
    for (const step of W.order) {
      if (step === '@keys') {
        for (const pid of Object.keys(D.BUILT.spots)) use(pid, W, label + ' sobekan di ' + pid);
        ok(D.G.allKeys(), label + ': semua kunci ditemukan');
      } else if (step === '@decrypt') {
        ok(D.G.found('msg'), label + ': pesan ditemukan sebelum dekripsi');
        decrypt(label);
      } else {
        use(step, W, label + ' -> ' + step);
      }
    }
    // semua langkah tugas selesai
    const undone = C.steps.filter(s => !s.done(D.G)).map(s => s.label);
    ok(undone.length === 0, label + ': langkah belum selesai: ' + undone.join(' | '));
    // setiap barang lain juga bisa diperiksa tanpa error & terjangkau
    for (const it of D.interactables()) {
      if (it.kind === 'prop' && it.o.def.decor) continue;
      const id = it.o.id;
      const w = walkTo(id);
      ok(w.ok, label + ': objek "' + id + '" terjangkau');
      if (w.ok) { D.interact(w.it); resolveUI(W); }
    }
    // deduksi
    flush(); resolveUI(W);
    ok(D.S.readyShown, label + ': tombol deduksi muncul');
    if (!D.S.readyShown) return;
    D.openDeduce();
    for (let q = 0; q < C.deduce.length; q++) {
      const btn = (registry['dd-opts'] || { children: [] }).children.find(b => b.textContent === C.deduce[q].a[0]);
      ok(!!btn, label + ': opsi benar deduksi ' + (q + 1));
      if (btn) btn.click();
      D.deduceNext();
    }
    flush();
    ok(D.S.deduced, label + ': deduksi selesai');
    ok(D.screen === 'scr-interro', label + ': masuk ruang interogasi');
    const idx = D.iSus.findIndex(s => s.ch === C.culprit);
    D.selectSuspect(idx); D.accuse(); flush();
    skipCuts(); flush();
    ok(D.screen === 'scr-end', label + ': layar akhir');
    ok(registry['end-stamp'].textContent === 'TERBUKTI', label + ': vonis TERBUKTI');
  });
});

/* ---------------- tuduhan salah & waktu habis ---------------- */
(function wrong() {
  D.startCase(0, 'easy'); flush(); skipCuts(); resolveUI({ code: [] });
  // langsung paksa ke interogasi
  D.G.set('rescued');
  D.openDeduce && null;
  const sus = DS.CASES[0].suspects.find(s => s.ch !== DS.CASES[0].culprit);
  // buka interogasi langsung lewat finish salah
  D.finish(false); flush();
  ok(registry['end-stamp'].textContent === 'SALAH TUDUH', 'tuduhan salah: cap SALAH TUDUH');
  D.startCase(1, 'hard'); flush(); skipCuts(); resolveUI({ code: [] });
  D.S.timeLeft = 0.01; tick(2); resolveUI({ code: [] }); flush();
  ok(registry['end-stamp'].textContent === 'WAKTU HABIS', 'waktu habis: cap WAKTU HABIS');
})();

console.log('\n  Detektif Sandi selftest: ' + pass + ' lulus, ' + fail + ' gagal');
if (fail) { console.log('\n  GAGAL:'); failures.slice(0, 60).forEach(f => console.log('   - ' + f)); process.exit(1); }
