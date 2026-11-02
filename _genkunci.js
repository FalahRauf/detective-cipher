/* Cetak tabel kunci jawaban per difficulty — node _genkunci.js */
'use strict';
const fs = require('fs');
const path = require('path');

function makeEl() {
  const el = {
    style: {}, value: '', disabled: false, innerHTML: '', textContent: '',
    classList: { add() {}, remove() {}, toggle() {} },
    setAttribute() {}, getAttribute() { return null; }, removeAttribute() {},
    addEventListener() {}, focus() {}, appendChild() {},
    querySelector() { return makeEl(); },
    querySelectorAll(sel) {
      if (sel === 'input') return Array.from({ length: (el.innerHTML.match(/<input/g) || []).length }, makeEl);
      return [];
    },
    getContext() {
      const grad = { addColorStop() {} };
      return new Proxy({}, {
        get(t, p) {
          if (p === 'createLinearGradient' || p === 'createRadialGradient') return () => grad;
          if (typeof p === 'string') return t[p] !== undefined ? t[p] : function () {};
        },
        set(t, p, v) { t[p] = v; return true; }
      });
    }
  };
  return el;
}
const registry = {};
global.document = {
  getElementById(id) { if (!registry[id]) registry[id] = makeEl(); return registry[id]; },
  createElement: () => makeEl(),
  querySelectorAll: () => [],
  addEventListener() {}
};
global.window = global;
if (!global.addEventListener) global.addEventListener = () => {};
global.requestAnimationFrame = () => 0;

eval(fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8'));
const G = global.GAME;

const m26 = v => { const r = v % 26; return r <= 0 ? r + 26 : r; };
const n2l = n => String.fromCharCode(64 + m26(n));
const l2n = c => c.charCodeAt(0) - 64;

function fn(L) {
  const a = L.a === 1 ? 'x' : (L.a === -1 ? '\u2212x' : L.a + 'x');
  if (L.b > 0) return a + ' + ' + L.b;
  if (L.b < 0) return a + ' \u2212 ' + Math.abs(L.b);
  return a;
}

for (let ci = 0; ci < 3; ci++) {
for (const id of ['easy', 'normal', 'hard']) {
  G.setCase(ci);
  G.setDifficulty(id);
  G.resetGame();
  const C = G.CASE;

  console.log('\n### Kasus ' + (ci + 1) + ' · ' + G.CUR.title + ' — ' + id.toUpperCase() + ' (' + C.layers.length + ' lapis)');
  console.log('');
  console.log('| Lapis | Fungsi |');
  console.log('|---|---|');
  C.layers.forEach((L, i) => console.log('| ' + (i + 1) + ' | `' + L.name + '(x) = ' + fn(L) + '` |'));
  console.log('');
  console.log('Komposisi: `' + C.clues.filter(c => c.kind === 'key').map(c => c.body.split('\n')[0]).join(' ') + '`');
  console.log('');
  console.log('**Pesan asli:** `' + C.plain + '`  \u2192  **Sandi:** `' + C.cipher + '`');
  console.log('');
  console.log('| Huruf | ' + C.layers.slice().reverse().map((L, i) => 'L' + (C.layers.length - i) + ' ' + L.name).join(' | ') + ' | Sandi |');
  console.log('|---|' + C.layers.map(() => '---').join('|') + '|---|');

  for (let i = 0; i < C.plain.length; i++) {
    const ch = C.plain[i];
    if (ch === ' ') { console.log('| spasi | ' + C.layers.map(() => '\u2014').join(' | ') + ' | spasi |'); continue; }
    let v = l2n(ch);
    const steps = [];
    for (let k = C.layers.length - 1; k >= 0; k--) {
      v = m26(C.layers[k].a * v + C.layers[k].b);
      steps.push('**' + v + '**');
    }
    console.log('| **' + ch + '** (' + l2n(ch) + ') | ' + steps.join(' | ') + ' | **' + n2l(v) + '** |');
  }
}
}
