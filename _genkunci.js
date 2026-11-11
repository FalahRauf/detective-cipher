/* Cetak kunci jawaban semua kasus & tingkat:  node _genkunci.js
   Pesan, fungsi, dan sandi TETAP per kasus+tingkat (bisa dinilai),
   yang diacak tiap main hanya lokasi sobekan kunci. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { window: {}, console };
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'js/data.js'), 'utf8'), ctx);
const DS = ctx.DS;

const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', FN = ['f', 'g', 'h'];
const m26 = n => { const m = ((n % 26) + 26) % 26; return m === 0 ? 26 : m; };
const inv = a => { for (let i = 1; i < 26; i++) if ((a * i) % 26 === 1) return i; return 0; };
const fstr = ([a, b]) => (a === 1 ? 'x' : a + 'x') + (b > 0 ? ' + ' + b : b < 0 ? ' - ' + -b : '');
const istr = ([a, b]) => { const i = inv(a); const inner = b === 0 ? 'y' : 'y ' + (b < 0 ? '+ ' + -b : '- ' + b); return i === 1 ? inner : i + '(' + inner + ')'; };
function enc(p, ly) {
  return p.split('').map(ch => {
    if (ch === ' ') return ' ';
    let x = L.indexOf(ch) + 1;
    for (let k = ly.length - 1; k >= 0; k--) x = m26(ly[k][0] * x + ly[k][1]);
    return L[x - 1];
  }).join('');
}

const CODES = { c1: 'Laci Pak Dedi: 2317 (2-3 + nomor PC Nayla 17)', c2: 'Brankas Bu Ratna: 1642 (jam meja yang berhenti)', c3: 'Panel listrik: puzzle sakelar (acak, selalu bisa diselesaikan)' };

for (const C of DS.CASES) {
  console.log('\n==== ' + C.no + ' — ' + C.title + ' ====');
  console.log('Pesan asli : ' + C.plain);
  console.log('Kode       : ' + CODES[C.id]);
  console.log('Pelaku     : ' + DS.CHARS[C.culprit].name);
  for (const d of ['easy', 'normal', 'hard']) {
    const ly = C.layers[d];
    let comp = 'x'; for (let i = ly.length - 1; i >= 0; i--) comp = FN[i] + '(' + comp + ')';
    console.log('\n  [' + d.toUpperCase() + ']  c = ' + comp);
    ly.forEach((p, i) => console.log('    ' + FN[i] + '(x) = ' + fstr(p) + '      ' + FN[i] + '⁻¹(y) = ' + istr(p) + ' mod 26'));
    console.log('    sandi : ' + enc(C.plain, ly));
    console.log('    buka  : ' + ly.map((p, i) => FN[i] + '⁻¹').join(' lalu ') + '  (lapis terluar dulu)');
  }
}
console.log('');
