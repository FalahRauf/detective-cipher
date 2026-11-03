/* Tes sistem perangkap — node _selftest_traps.js */
'use strict';
const fs = require('fs');
const path = require('path');

function makeEl(tag) {
  const L = {};
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    style: {}, value: '', disabled: false, innerHTML: '', textContent: '', className: '',
    classList: { _s: new Set(),
      add(...c) { c.forEach(x => this._s.add(x)); },
      remove(...c) { c.forEach(x => this._s.delete(x)); },
      toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); return on; },
      contains(c) { return this._s.has(c); } },
    attributes: {}, dataset: {},
    setAttribute(k, v) { this.attributes[k] = v; },
    getAttribute(k) { return this.attributes[k] === undefined ? null : this.attributes[k]; },
    removeAttribute(k) { delete this.attributes[k]; },
    addEventListener(e, fn) { (L[e] = L[e] || []).push(fn); },
    dispatch(e, a) { (L[e] || []).forEach(fn => fn(a || { key: '', preventDefault() {} })); },
    focus() {}, click() { this.dispatch('click'); },
    appendChild() {}, removeChild() {},
    querySelector() { return makeEl(); },
    querySelectorAll() { return []; },
    getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; },
    getContext() {
      const g = { addColorStop() {} };
      return new Proxy({}, {
        get(t, p) {
          if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => g;
          if (typeof p === 'string') return t[p] !== undefined ? t[p] : function () {};
        },
        set(t, p, v) { t[p] = v; return true; }
      });
    }
  };
  return el;
}
const reg = {};
global.document = {
  getElementById(id) { if (!reg[id]) reg[id] = makeEl(); return reg[id]; },
  createElement: t => makeEl(t),
  querySelectorAll: () => [],
  addEventListener() {}
};
global.window = global;
if (!global.addEventListener) global.addEventListener = () => {};
global.requestAnimationFrame = () => 0;
global.Event = function (t) { this.type = t; };

eval(fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8'));
const G = global.GAME;
const T = 16;

let bugs = 0;
const bug = m => { bugs++; console.log('  BUG  ' + m); };
const ok = m => console.log('  ok   ' + m);

console.log('\n=== 1. Jumlah perangkap per mode ===');
const want = { easy: 0, normal: 2, hard: 4 };
for (const d of ['easy', 'normal', 'hard']) {
  for (let ci = 0; ci < 3; ci++) {
    G.setCase(ci); G.setDifficulty(d); G.resetGame();
    const n = G.traps().length;
    if (n !== want[d]) bug(`kasus${ci + 1}/${d}: perangkap ${n}, harusnya ${want[d]}`);
  }
}
ok('cek jumlah selesai');

console.log('\n=== 2. Perangkap tidak di tile padat / objek / spawn ===');
for (let ci = 0; ci < 3; ci++) {
  for (const d of ['normal', 'hard']) {
    G.setCase(ci); G.setDifficulty(d); G.resetGame();
    const occ = {};
    for (const it of G.INTERACTABLES) {
      const tc = Math.floor(it.x / T), tr = Math.floor(it.y / T);
      occ[tc + ',' + tr] = 1;
    }
    const sp = G.CUR.spawn;
    const sc = Math.floor(sp.x / T), sr = Math.floor(sp.y / T);
    for (const t of G.traps()) {
      if (G.grid[t.r][t.c] !== 0) bug(`kasus${ci + 1}/${d}: perangkap di tile padat (${t.c},${t.r})`);
      if (occ[t.c + ',' + t.r]) bug(`kasus${ci + 1}/${d}: perangkap menutupi objek (${t.c},${t.r})`);
      if (Math.abs(t.c - sc) <= 3 && Math.abs(t.r - sr) <= 3) bug(`kasus${ci + 1}/${d}: perangkap terlalu dekat spawn`);
    }
  }
}
ok('cek penempatan selesai');

console.log('\n=== 3. Perangkap acak (posisi beda antar reset) ===');
G.setCase(0); G.setDifficulty('hard'); G.resetGame();
const pos1 = G.traps().map(t => t.c + ',' + t.r).join('|');
G.resetGame();
const pos2 = G.traps().map(t => t.c + ',' + t.r).join('|');
G.resetGame();
const pos3 = G.traps().map(t => t.c + ',' + t.r).join('|');
if (pos1 === pos2 && pos2 === pos3) bug('posisi perangkap selalu sama (tidak acak)');
else ok('posisi perangkap berubah tiap reset');

console.log('\n=== 4. Picu perangkap: skor turun sekali saja ===');
G.setCase(0); G.setDifficulty('normal'); G.resetGame();
G.showScreen('scr-play');
const t0 = G.traps()[0];
const s0 = G.state.score;
G.setPlayer(t0.c * T + 8, t0.r * T + 8);
G.updateTraps(1 / 60);
const s1 = G.state.score;
if (s1 >= s0) bug(`perangkap tidak mengurangi skor (${s0} -> ${s1})`);
else ok(`perangkap picu: ${s0} -> ${s1}`);
// langkah lagi di tile yang sama — tidak boleh dobel
G.setPlayer(t0.c * T + 8, t0.r * T + 8);
G.updateTraps(1 / 60);
if (G.state.score < s1) bug('perangkap yang sama picu dua kali');
else ok('perangkap yang sama hanya picu sekali');

console.log('\n=== 5. Perangkap lantai rapuh: pemain balik ke spawn ===');
G.setCase(0); G.setDifficulty('hard'); G.resetGame();
G.showScreen('scr-play');
const tf = G.traps().find(t => t.type === 'floor');
if (!tf) bug('HARD tidak punya perangkap lantai rapuh');
else {
  G.setPlayer(tf.c * T + 8, tf.r * T + 8);
  G.updateTraps(1 / 60);
  const sp = G.CUR.spawn;
  if (Math.abs(G.player.x - sp.x) > 2 || Math.abs(G.player.y - sp.y) > 2) {
    bug('lantai rapuh tidak mengembalikan pemain ke spawn');
  } else ok('lantai rapuh: pemain kembali ke titik masuk');
}

console.log('\n=== 6. Badge HUD perangkap ===');
G.setCase(0); G.setDifficulty('easy'); G.resetGame();
if (reg['guard-badge'].classList.contains('show')) bug('EASY badge perangkap tampil');
else ok('EASY: badge tersembunyi');
G.setDifficulty('hard'); G.resetGame();
if (!reg['guard-badge'].classList.contains('show')) bug('HARD badge perangkap tidak tampil');
else ok('HARD: badge tampil');

console.log('\n=== 7. Render perangkap tanpa error ===');
for (let ci = 0; ci < 3; ci++) {
  for (const d of ['normal', 'hard']) {
    G.setCase(ci); G.setDifficulty(d); G.resetGame();
    let err = null;
    try { for (let i = 0; i < 60; i++) { G.updateTraps(1 / 60); G.draw(); } } catch (e) { err = e; }
    if (err) bug(`kasus${ci + 1}/${d}: render error: ${err.message}`);
  }
}
ok('render selesai');

console.log('\n==============================');
console.log(bugs === 0 ? 'SISTEM PERANGKAP OK' : bugs + ' MASALAH');
