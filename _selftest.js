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

/* ---------- smoke test cutscene CCTV ---------- */
console.log('\n== CUTSCENE ==');
(function () {
  let err = null;
  try {
    for (let t = 0; t <= 16.2; t += 0.1) G.cutTick(t);
  } catch (e) { err = e; }
  ok(!err, 'cutscene berjalan 0-16 detik tanpa error' + (err ? ' (' + err.message + ')' : ''));
  ok(document.getElementById('btn-cut-next').style.display === '', 'tombol LANJUT KE TKP muncul di akhir rekaman');
  ok(document.getElementById('cut-caption').textContent.length > 0, 'caption rekaman terisi');
})();

console.log('\n==============================');
console.log(fail === 0 ? 'SEMUA TES LULUS (' + pass + ' assertions)' : fail + ' TES GAGAL dari ' + (pass + fail));
process.exit(fail === 0 ? 0 : 1);
