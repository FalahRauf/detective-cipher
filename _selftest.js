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

/* ---------- uji enkripsi & alur baru ---------- */
function gcdN(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; }
function cipherOf(plain, layers) {
  let out = '';
  for (const ch of plain) {
    if (ch === ' ') { out += ' '; continue; }
    let v = ch.charCodeAt(0) - 64;
    for (let k = layers.length - 1; k >= 0; k--) {
      v = (layers[k].a * v + layers[k].b) % 26;
      if (v <= 0) v += 26;
    }
    out += String.fromCharCode(64 + v);
  }
  return out;
}

for (const id of ['easy', 'normal', 'hard']) {
  console.log('\n== MODE ' + id.toUpperCase() + ' ==');
  G.setDifficulty(id);
  G.resetGame();
  const C = G.CASE;

  ok(C.cipher === cipherOf(C.plain, C.layers), 'cipher = enkripsi(plain)  [' + C.cipher + ']');
  ok(C.layers.length === (id === 'easy' ? 2 : 3), 'jumlah lapis = ' + C.layers.length);

  let cop = true;
  for (const L of C.layers) if (gcdN(L.a, 26) !== 1) cop = false;
  ok(cop, 'semua koefisien koprima dengan 26');

  const wantClues = (id === 'hard') ? 3 : 2;
  ok(C.clues.length === wantClues, 'jumlah petunjuk = ' + C.clues.length);
  ok(Object.keys(G.state.clueMap).length === wantClues,
     'petunjuk ditempatkan di ' + wantClues + ' barang acak');

  const banned = Object.keys(G.state.clueMap).filter(k => ['monitor', 'pot', 'lemari', 'door'].indexOf(k) >= 0);
  ok(banned.length === 0, 'petunjuk tidak menempel di alat/pot/lemari/pintu');
}

console.log('\n== ALAT ENKRIPSI ==');
G.setDifficulty('easy');
G.resetGame();
const C2 = G.CASE;
const keyText = C2.clues.filter(c => c.kind === 'key').map(c => c.body).join('\n');
const fns = G.parseFns(keyText);
ok(fns.length === C2.layers.length, 'parseFns membaca ' + fns.length + ' fungsi dari teks kunci');
ok(fns[0].a === C2.layers[0].a && fns[0].b === C2.layers[0].b, 'koefisien fungsi pertama terbaca benar');
ok(G.encryptWith(C2.plain, fns) === C2.cipher, 'encryptWith(kunci benar) = cipher kasus');

const swapped = fns.slice().reverse();
ok(G.encryptWith(C2.plain, swapped) !== C2.cipher, 'urutan lapis kebalik -> sandi berbeda');

ok(G.parseFns('f(x)=3x+7\ng(x)=x+5').length === 2, 'parser menerima format tanpa spasi');
ok(G.parseFns('3x + 7\nx - 4').length === 2, 'parser menerima baris tanpa nama fungsi');
ok(G.parseFns('c = f(g(x))\nf(x) = 3x + 7\ng(x) = x + 5').length === 2, 'baris komposisi tidak dihitung sebagai fungsi');

console.log('\n== ALUR LENGKAP ==');
G.setDifficulty('normal');
G.resetGame();
G.showScreen('scr-play');
const C3 = G.CASE;
const clueIds = Object.keys(G.state.clueMap);
ok(G.cluesFound() === 0, 'awal: 0 petunjuk');

const plainProp = G.INTERACTABLES.find(p =>
  clueIds.indexOf(p.id) < 0 && ['monitor', 'pot', 'lemari', 'door'].indexOf(p.id) < 0);
G.interact(plainProp.id);
ok(!!plainProp.flavor, 'barang tanpa petunjuk tetap bisa diperiksa (' + plainProp.id + ')');
G.closeDialog();

G.interact('pot');
ok(!G.state.potSlid, 'pot belum bisa digeser sebelum enkripsi');
G.closeDialog();

for (const id of clueIds) { G.interact(id); G.closeDialog(); }
ok(G.cluesFound() === C3.clues.length, 'semua petunjuk terkumpul (' + G.cluesFound() + '/' + C3.clues.length + ')');

G.openTool();
document.getElementById('in-msg').value = C3.plain;
document.getElementById('in-key').value = C3.clues.filter(c => c.kind === 'key').map(c => c.body).join('\n');
G.runEncrypt();
ok(G.state.encrypted === true, 'enkripsi lewat alat berhasil');
ok(document.getElementById('tool-out').textContent === C3.cipher, 'hasil di layar = cipher kasus');

G.state.potSlid = true;
G.interact('pot');
G.takeKey();
ok(G.state.keyFound === true, 'kunci lemari didapat dari pot');

G.interact('lemari');
ok(G.state.collected.lemari === true, 'lemari arsip terbuka');

G.openInterro();
ok(G.screen() === 'scr-interro', 'layar interogasi tampil');
ok(G.hitSeat(158, 240) === 0 && G.hitSeat(482, 240) === 2, 'tiga kursi terdeteksi klik');
ok(G.hitSeat(600, 60) === -1, 'klik di luar tersangka tidak memilih');

G.chooseSuspect(1);
ok(G.screen() === 'scr-verdict', 'pilih tersangka -> cutscene vonis');
ok(G.state.win === true, 'tersangka benar -> vonis benar');

G.finish(true);
ok(G.screen() === 'scr-end', 'ending tampil');
ok(document.getElementById('verdict-stamp').textContent === 'TERBUKTI', 'stempel TERBUKTI');

G.resetGame();
G.openInterro();
G.chooseSuspect(0);
ok(G.state.win === false, 'tersangka salah -> vonis salah');
ok(G.state.score === 750, 'salah tuduh memotong 250 poin (' + G.state.score + ')');

console.log('\n== ACAK TIAP MAIN ==');
G.setDifficulty('easy');
const seen = new Set();
for (let i = 0; i < 12; i++) { G.resetGame(); seen.add(Object.keys(G.state.clueMap).sort().join('+')); }
ok(seen.size > 1, 'penempatan petunjuk berubah-ubah tiap main (' + seen.size + ' variasi dari 12 kali)');

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
