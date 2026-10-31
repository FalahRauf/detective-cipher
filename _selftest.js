/* Smoke test DOM-shim untuk Detektif Sandi — dijalankan: node _selftest.js */
'use strict';
const fs = require('fs');
const path = require('path');

/* ---------- DOM stubs ---------- */
function makeClassList() {
  const set = new Set();
  return {
    add: (...c) => c.forEach(x => set.add(x)),
    remove: (...c) => c.forEach(x => set.delete(x)),
    toggle: (c, force) => {
      const on = force === undefined ? !set.has(c) : !!force;
      if (on) set.add(c); else set.delete(c);
      return on;
    },
    contains: c => set.has(c)
  };
}
function makeEl(tag) {
  const listeners = {};
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    style: {}, value: '', disabled: false,
    innerHTML: '', textContent: '',
    classList: makeClassList(),
    dataset: {},
    attributes: {},
    setAttribute(k, v) { el.attributes[k] = v; if (k === 'id') registry[v] = el; },
    getAttribute(k) { return el.attributes[k] !== undefined ? el.attributes[k] : null; },
    removeAttribute(k) { delete el.attributes[k]; },
    addEventListener(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
    dispatch(ev) { (listeners[ev] || []).forEach(fn => fn({ key: '', preventDefault() {} })); },
    focus() {}, click() { el.dispatch('click'); },
    appendChild() {},
    querySelector() { return makeEl('div'); },
    querySelectorAll(sel) {
      if (sel === 'input') {
        const n = (el.innerHTML.match(/<input/g) || []).length;
        return Array.from({ length: n }, () => makeEl('input'));
      }
      return [];
    },
    getContext() { return ctxStub(); },
    parentElement: null
  };
  return el;
}
function ctxStub() {
  const grad = { addColorStop() {} };
  return new Proxy({}, {
    get(t, p) {
      if (p === 'createLinearGradient' || p === 'createRadialGradient' || p === 'createPattern') return () => grad;
      if (p === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      if (p === 'measureText') return () => ({ width: 10 });
      if (typeof p === 'string') return t[p] !== undefined ? t[p] : function () {};
      return undefined;
    },
    set(t, p, v) { t[p] = v; return true; }
  });
}
const registry = {};
global.document = {
  getElementById(id) { if (!registry[id]) registry[id] = makeEl('div'); return registry[id]; },
  createElement: tag => makeEl(tag),
  querySelectorAll: () => [],
  addEventListener() {}
};
global.window = global;
if (!global.addEventListener) global.addEventListener = () => {};
global.requestAnimationFrame = () => 0;

/* ---------- load game ---------- */
const code = fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8');
eval(code);
const G = global.GAME;

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  PASS  ' + msg); }
  else { fail++; console.log('  FAIL  ' + msg); }
}

/* ---------- uji math murni per difficulty ---------- */
for (const id of ['easy', 'normal', 'hard']) {
  console.log('\n== DIFFICULTY: ' + id.toUpperCase() + ' ==');
  G.setDifficulty(id);
  G.resetGame();
  const C = G.CASE;

  ok(C.cipher.toUpperCase() === G.encrypt(C.plain), 'cipher = enkripsi(plain)  [' + C.cipher + ']');
  ok(G.derivedPlain() === C.plain, 'rantai dekripsi menghasilkan plain  [' + G.derivedPlain() + ']');

  // tampilan cipherteks: NORMAL & HARD huruf besar-kecil campur, EASY bersih
  const hasLower = /[a-z]/.test(C.cipher);
  if (id === 'easy') ok(!hasLower, 'EASY: cipherteks huruf besar semua');
  else ok(hasLower, id.toUpperCase() + ': cipherteks huruf besar-kecil campur (seperti teks acak)');

  // semua koefisien a koprima dengan 26 dan inversnya benar
  let invOk = true;
  for (const L of C.layers) {
    let has = false;
    for (let i = 1; i < 26; i++) if ((L.a * i) % 26 === 1 && i === L.inv) has = true;
    if (!has) invOk = false;
  }
  ok(invOk, 'semua lapis punya invers mod 26 yang valid');

  // flow: kunci dari papan & sampah (tutup dialog antar interaksi, seperti pemain)
  G.interact('papan'); G.closeDialog();
  G.interact('sampah'); G.closeDialog();
  ok(G.state.collected.papan && G.state.collected.sampah, 'kunci f & g terkumpul');

  G.openDesk();

  // HARD: turunkan g lewat input derive sungguhan
  if (id === 'hard') {
    const a = document.getElementById('derive-a');
    const b = document.getElementById('derive-b');
    ok(!!a && !!b, 'input derive g(x) tampil di formula bar');
    a.value = '9'; b.value = '3'; a.dispatch('input');
    ok(!G.state.gSolved, 'tebakan g salah -> belum terbuka');
    a.value = '3'; a.dispatch('input'); b.value = '3'; b.dispatch('input');
    ok(G.state.gSolved, 'g(x) = 3x + 3 diterima -> gSolved');
  }

  ok(document.getElementById('btn-check').disabled === false, 'tombol PERIKSA aktif');

  // isi semua jawaban benar
  for (const cell of G.state.cells) {
    if (cell.space) continue;
    cell.fields.forEach((f, s) => {
      f.value = (s < C.layers.length - 1) ? String(cell.chain[s + 1]) : cell.plain;
    });
  }
  G.checkAll();
  ok(G.state.solved === true, 'sandi terpecahkan dengan jawaban benar');

  // alur barang bukti sampai tuduh
  G.state.keyFound = true;
  G.interact('lemari');
  ok(!!G.state.collected.lemari, 'lemari terbuka setelah kunci');
  G.finish(true);
  ok(document.getElementById('verdict-stamp').textContent === 'TERBUKTI', 'ending TERBUKTI tampil');

  // reset lalu uji jalur jawaban salah
  G.resetGame();
  G.state.collected.papan = true; G.state.collected.sampah = true;
  if (id === 'hard') G.state.gSolved = true;
  G.openDesk();
  const sc0 = G.state.score;
  for (const cell of G.state.cells) {
    if (cell.space) continue;
    cell.fields.forEach(f => { f.value = '1'; });
  }
  G.checkAll();
  ok(!G.state.solved && G.state.score < sc0, 'jawaban salah: tidak solve, skor dipotong (' + sc0 + ' -> ' + G.state.score + ')');
}

/* ---------- alur pilih kasus: hover, popup, konfirmasi ---------- */
console.log('\n== PILIH KASUS (jalanan + senter) ==');
(function () {
  let err = null;
  try { G.selectTick(0.1); } catch (e) { err = e; }
  ok(!err, 'layar jalanan tergambar tanpa error' + (err ? ' (' + err.message + ')' : ''));

  G.selectMouse(190, 280);
  ok(G.hoveredFig() === 'c1', 'senter di atas sosok 1 -> CASE 01 tersorot');
  G.selectMouse(330, 280);
  ok(G.hoveredFig() === 'c2', 'senter di atas sosok 2 -> CASE 02 tersorot');
  G.selectMouse(60, 60);
  ok(G.hoveredFig() === null, 'senter di langit -> tidak ada yang tersorot');

  // klik sosok 1 -> popup kasus
  G.selectMouse(190, 280);
  document.getElementById('scv').dispatch('click');
  ok(document.getElementById('cm-title').textContent === 'Rekaman 23.47', 'popup kasus terbuka: Rekaman 23.47');
  ok(document.getElementById('cm-locked').style.display === 'none', 'CASE 01 tidak terkunci, tombol tingkat tampil');

  // klik sosok 2 (terkunci)
  G.selectMouse(330, 280);
  document.getElementById('scv').dispatch('click');
  ok(document.getElementById('cm-locked').style.display === '', 'CASE 02 tampil sebagai SEGERA');

  // pilih CASE 01 lagi lalu mulai -> konfirmasi -> cutscene
  G.selectMouse(190, 280);
  document.getElementById('scv').dispatch('click');
  ok(document.getElementById('confirm-modal').classList.contains('show') === false, 'konfirmasi belum muncul sebelum pilih tingkat');
  document.getElementById('cf-tag').textContent = 'MODE HARD';
  document.getElementById('cf-start').dispatch('click');
  ok(G.screen() === 'scr-cutscene', 'MULAI KASUS -> langsung ke cutscene CCTV (brief dilewati)');
})();

/* ---------- smoke test kedua cutscene ---------- */
console.log('\n== CUTSCENE CCTV + PAPAN KASUS ==');
(function () {
  let err = null;
  try {
    for (let i = 0; i < 252; i++) G.cutTick(0.1);   // 25.2 detik — di bawah ambang auto-fade
  } catch (e) { err = e; }
  ok(!err, 'cutscene CCTV berjalan 0-25 detik tanpa error' + (err ? ' (' + err.message + ')' : ''));
  ok(document.getElementById('btn-cut-next').style.display === '', 'tombol LANJUT muncul di akhir rekaman');
  ok(document.getElementById('cut-caption').textContent.length > 0, 'caption rekaman terisi');

  err = null;
  try {
    for (let i = 0; i < 230; i++) G.boardTick(0.1); // 23.0 detik — di bawah ambang auto-fade
  } catch (e) { err = e; }
  ok(!err, 'papan kasus detektif berjalan 0-23 detik tanpa error' + (err ? ' (' + err.message + ')' : ''));
  ok(document.getElementById('btn-board-next').style.display === '', 'tombol TURUN KE TKP muncul di akhir scene');
  ok(document.getElementById('board-caption').textContent.length > 0, 'caption papan kasus terisi');
})();

/* ---------- transisi fade: cutscene -> papan -> gameplay ---------- */
function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
let finished = false;
function finish() {
  if (finished) return;
  finished = true;
  console.log('\n==============================');
  console.log(fail === 0 ? 'SEMUA TES LULUS (' + pass + ' assertions)' : fail + ' TES GAGAL dari ' + (pass + fail));
  process.exit(fail === 0 ? 0 : 1);
}

(async function () {
  console.log('\n== TRANSISI FADE ==');
  G.showScreen('scr-cutscene');
  document.getElementById('btn-cut-next').dispatch('click');
  ok(document.getElementById('fade').classList.contains('show'), 'LANJUT -> layar mulai fade-out');
  ok(G.screen() === 'scr-cutscene', 'masih di cutscene selama fade-out');
  await wait(480);
  ok(G.screen() === 'scr-board', 'layar berganti ke papan kasus saat gelap');
  ok(document.getElementById('fade').classList.contains('show'), 'layar masih gelap saat berganti');
  await wait(480);
  ok(!document.getElementById('fade').classList.contains('show'), 'fade-in selesai di papan kasus');

  document.getElementById('btn-board-next').dispatch('click');
  await wait(920);
  ok(G.screen() === 'scr-play', 'TURUN KE TKP -> fade in langsung di gameplay');

  // auto-advance: cutscene & papan berakhir sendiri dengan fade, tanpa klik
  G.showScreen('scr-cutscene');
  for (let i = 0; i < 266; i++) G.cutTick(0.1);   // 26.6 > 26.4 -> fade otomatis
  ok(document.getElementById('fade').classList.contains('show'), 'cutscene selesai -> fade-out OTOMATIS tanpa klik');
  await wait(480);
  ok(G.screen() === 'scr-board', 'auto: berganti ke papan kasus saat gelap');
  await wait(500);

  for (let i = 0; i < 240; i++) G.boardTick(0.1); // 24.0 > 23.9 -> fade otomatis
  await wait(480);
  ok(G.screen() === 'scr-play', 'papan selesai -> fade-out OTOMATIS ke gameplay');

  finish();
})();
setTimeout(finish, 6000); // pengaman kalau timer macet
