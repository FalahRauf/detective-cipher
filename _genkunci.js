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

function stepCell(L, y, res) {
  const t = y + ' ' + (L.b < 0 ? '+ ' + (-L.b) : '\u2212 ' + L.b);
  const raw = y - L.b;
  if (L.a === 1) {
    if (raw <= 0 || raw > 26) return `${t} = ${raw} \u2261 **${res}**`;
    return `${t} = **${res}**`;
  }
  return `${L.inv}(${t}) = ${L.inv * raw} \u2261 **${res}**`;
}
function fx(L) { return L.a === 1 ? `x ${L.b < 0 ? '\u2212 ' + (-L.b) : '+ ' + L.b}` : `${L.a}x ${L.b < 0 ? '\u2212 ' + (-L.b) : '+ ' + L.b}`; }

for (const id of ['easy', 'normal', 'hard']) {
  G.setDifficulty(id);
  G.resetGame();
  const C = G.CASE;
  console.log(`\n### Mode ${id.toUpperCase()}`);
  console.log('');
  console.log('| Fungsi | Rumus | Invers |');
  console.log('|---|---|---|');
  for (const L of C.layers) {
    const inv = L.a === 1
      ? `y ${L.b < 0 ? '+ ' + (-L.b) : '\u2212 ' + L.b} mod 26`
      : `${L.inv}(y ${L.b < 0 ? '+ ' + (-L.b) : '\u2212 ' + L.b}) mod 26`;
    console.log(`| \`${L.name}(x)\` | \`${fx(L)}\` | \`${inv}\` |`);
  }
  console.log('');
  console.log('```');
  console.log(C.cipher.split('').join(' ') + '   (cipherteks)');
  console.log('```');
  console.log('');
  console.log('| Cipher | ' + C.layers.map(L => `Langkah ${L.name}\u207b\u00b9`).join(' | ') + ' | Plainteks |');
  console.log('|---|' + C.layers.map(() => '---').join('|') + '|---|');
  for (const cell of G.state.cells) {
    if (cell.space) { console.log('| \u2400 | ' + C.layers.map(() => 'spasi').join(' | ') + ' | \u2400 |'); continue; }
    const steps = C.layers.map((L, s) => stepCell(L, cell.chain[s], cell.chain[s + 1]));
    console.log('| **' + cell.c + '** (' + cell.chain[0] + ') | ' + steps.join(' | ') + ' | **' + cell.plain + '** |');
  }
}
