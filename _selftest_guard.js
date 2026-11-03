/* Probe sistem penjaga — node _probe3.js */
'use strict';
const fs = require('fs');
const path = require('path');

function makeEl(tag) {
  const L = {};
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    style: {}, value: '', disabled: false, innerHTML: '', textContent: '', className: '',
    classList: {
      _s: new Set(),
      add(...c) { c.forEach(x => this._s.add(x)); },
      remove(...c) { c.forEach(x => this._s.delete(x)); },
      toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); return on; },
      contains(c) { return this._s.has(c); }
    },
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

let bugs = 0;
const bug = m => { bugs++; console.log('  BUG  ' + m); };
const ok = m => console.log('  ok   ' + m);

console.log('\n=== 1. Jumlah penjaga per mode ===');
const want = { easy: 0, normal: 1, hard: 2 };
for (const d of ['easy', 'normal', 'hard']) {
  for (let ci = 0; ci < 3; ci++) {
    G.setCase(ci); G.setDifficulty(d); G.resetGame();
    const n = G.guards().length;
    if (n !== want[d]) bug(`kasus${ci + 1}/${d}: penjaga ${n}, harusnya ${want[d]}`);
  }
}
ok('cek jumlah selesai');

console.log('\n=== 2. EASY tidak ada penjaga & badge tersembunyi ===');
G.setCase(0); G.setDifficulty('easy'); G.resetGame();
if (G.guards().length !== 0) bug('EASY masih punya penjaga');
if (reg['guard-badge'].classList.contains('show')) bug('EASY badge penjaga tetap tampil');
else ok('EASY bersih tanpa penjaga');

console.log('\n=== 3. NORMAL/HARD badge tampil ===');
for (const d of ['normal', 'hard']) {
  G.setCase(0); G.setDifficulty(d); G.resetGame();
  if (!reg['guard-badge'].classList.contains('show')) bug(`${d}: badge penjaga tidak muncul`);
  else ok(`${d}: badge penjaga tampil`);
}

console.log('\n=== 4. Penjaga bergerak (posisi berubah) ===');
G.setCase(0); G.setDifficulty('hard'); G.resetGame();
const g0 = G.guards()[0];
const x0 = g0.x, y0 = g0.y;
for (let i = 0; i < 60; i++) G.updateGuards(1 / 60);
const moved = Math.hypot(g0.x - x0, g0.y - y0);
if (moved < 1) bug(`penjaga tidak bergerak (delta ${moved.toFixed(2)})`);
else ok(`penjaga bergerak ${moved.toFixed(1)} px dalam 1 detik`);

console.log('\n=== 5. Deteksi sorot: pemain tepat di depan penjaga ===');
G.setCase(0); G.setDifficulty('normal'); G.resetGame();
const g = G.guards()[0];
// taruh pemain 40px di depan arah hadap penjaga
G.setPlayer(g.x + Math.cos(g.angle) * 40, g.y + Math.sin(g.angle) * 40);
const seen = G.guardSees(0);
if (!seen) bug('pemain di depan sorot tidak terdeteksi');
else ok('pemain di depan sorot terdeteksi');

console.log('\n=== 6. Deteksi: pemain di belakang penjaga (aman) ===');
G.setPlayer(g.x - Math.cos(g.angle) * 40, g.y - Math.sin(g.angle) * 40);
if (G.guardSees(0)) bug('pemain di belakang penjaga malah terdeteksi');
else ok('pemain di belakang penjaga aman');

console.log('\n=== 7. Deteksi: pemain jauh (di luar jangkauan) ===');
G.setPlayer(g.x + Math.cos(g.angle) * 400, g.y + Math.sin(g.angle) * 400);
if (G.guardSees(0)) bug('pemain sangat jauh masih terdeteksi');
else ok('pemain jauh aman');

console.log('\n=== 8. Ketahuan: skor turun & pemain balik ke spawn ===');
G.setCase(0); G.setDifficulty('normal'); G.resetGame();
G.showScreen('scr-play');   // deteksi hanya aktif saat gameplay
const scoreBefore = G.state.score;
const gg = G.guards()[0];
G.setPlayer(gg.x + Math.cos(gg.angle) * 40, gg.y + Math.sin(gg.angle) * 40);
G.updateGuards(1 / 60);
const after = G.state.score;
if (after >= scoreBefore) bug(`ketahuan tidak mengurangi skor (${scoreBefore} -> ${after})`);
else ok(`ketahuan: skor ${scoreBefore} -> ${after}`);
const sp = G.CUR.spawn;
if (Math.abs(G.player.x - sp.x) > 2 || Math.abs(G.player.y - sp.y) > 2) {
  bug(`pemain tidak dikembalikan ke spawn (${G.player.x},${G.player.y}) vs (${sp.x},${sp.y})`);
} else ok('pemain dikembalikan ke titik masuk');

console.log('\n=== 9. Cooldown: tidak ketahuan berulang instan ===');
G.setCase(0); G.setDifficulty('normal'); G.resetGame();
G.showScreen('scr-play');
const s0 = G.state.score;
const g2 = G.guards()[0];
G.setPlayer(g2.x + Math.cos(g2.angle) * 40, g2.y + Math.sin(g2.angle) * 40);
G.updateGuards(1 / 60);   // ketahuan #1
const s1 = G.state.score;
G.setPlayer(g2.x + Math.cos(g2.angle) * 40, g2.y + Math.sin(g2.angle) * 40);
G.updateGuards(1 / 60);   // masih cooldown
if (G.state.score < s1) bug('ketahuan dua kali berturut tanpa jeda (skor turun lagi)');
else ok('cooldown mencegah penalti berulang');

console.log('\n=== 10. Penjaga tidak menembus dinding (rute valid) ===');
for (let ci = 0; ci < 3; ci++) {
  for (const d of ['normal', 'hard']) {
    G.setCase(ci); G.setDifficulty(d); G.resetGame();
    let bad = false;
    for (let step = 0; step < 400; step++) {
      G.updateGuards(1 / 60);
      for (const gq of G.guards()) {
        const tc = Math.floor(gq.x / 16), tr = Math.floor(gq.y / 16);
        if (tc < 0 || tr < 0 || tc >= G.CUR.mapW || tr >= G.CUR.mapH) { bad = true; break; }
        if (G.grid[tr] && G.grid[tr][tc] === 1) { bad = true; break; }
      }
      if (bad) break;
    }
    if (bad) bug(`kasus${ci + 1}/${d}: penjaga keluar peta / masuk dinding`);
  }
}
ok('cek rute selesai');

console.log('\n=== 11. Reset game mengosongkan penjaga (ganti mode) ===');
G.setCase(0); G.setDifficulty('hard'); G.resetGame();
if (G.guards().length !== 2) bug('HARD tidak spawn 2 penjaga');
G.setDifficulty('easy'); G.resetGame();
if (G.guards().length !== 0) bug('ganti ke EASY masih ada penjaga tersisa');
else ok('ganti mode membersihkan penjaga');

console.log('\n=== 12. Render penjaga tanpa error ===');
for (let ci = 0; ci < 3; ci++) {
  for (const d of ['normal', 'hard']) {
    G.setCase(ci); G.setDifficulty(d); G.resetGame();
    let err = null;
    try {
      for (let i = 0; i < 120; i++) { G.updateGuards(1 / 60); G.draw(); }
    } catch (e) { err = e; }
    if (err) bug(`kasus${ci + 1}/${d}: render error: ${err.message}`);
  }
}
ok('render semua kasus selesai');

console.log('\n==============================');
console.log(bugs === 0 ? 'SISTEM PENJAGA OK' : bugs + ' MASALAH DITEMUKAN');
