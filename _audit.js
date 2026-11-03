/* AUDIT MENYELURUH: posisi, interaksi, keterjangkauan, konsistensi data */
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
const T = 16;

let bugs = 0;
const bug = m => { bugs++; console.log('   BUG  ' + m); };
const warn = m => console.log('   !    ' + m);

function reachable() {
  const W = G.CUR.mapW, H = G.CUR.mapH, g = G.grid, sp = G.CUR.spawn;
  const start = [Math.floor(sp.x / T), Math.floor(sp.y / T)];
  const seen = {}; const q = [start]; seen[start.join(',')] = 1;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (q.length) {
    const cur = q.shift();
    for (const d of dirs) {
      const nc = cur[0] + d[0], nr = cur[1] + d[1], k = nc + ',' + nr;
      if (seen[k] || nc < 0 || nr < 0 || nc >= W || nr >= H) continue;
      if (g[nr][nc] !== 0) continue;
      seen[k] = 1; q.push([nc, nr]);
    }
  }
  return seen;
}
function nearestDist(it, seen) {
  let best = Infinity;
  const rad = Math.ceil((it.range || 30) / T) + 2;
  const tc = Math.floor(it.x / T), tr = Math.floor(it.y / T);
  for (let dc = -rad; dc <= rad; dc++) for (let dr = -rad; dr <= rad; dr++) {
    const c = tc + dc, r = tr + dr;
    if (!seen[c + ',' + r]) continue;
    const d = Math.hypot(c * T + T / 2 - it.x, r * T + T / 2 - it.y);
    if (d < best) best = d;
  }
  return best;
}

for (let ci = 0; ci < 3; ci++) {
  console.log('\n══════ KASUS ' + (ci + 1) + ' ══════');
  G.setCase(ci); G.setDifficulty('easy'); G.resetGame();
  const C = G.CUR;
  console.log('  ' + C.title + '  [' + C.mapW + 'x' + C.mapH + ']  spawn=(' +
    Math.floor(C.spawn.x / T) + ',' + Math.floor(C.spawn.y / T) + ')');

  const seen = reachable();
  const floorTotal = (() => { let n = 0; for (let r = 0; r < C.mapH; r++) for (let c = 0; c < C.mapW; c++) if (G.grid[r][c] === 0) n++; return n; })();
  console.log('  lantai terjangkau: ' + Object.keys(seen).length + '/' + floorTotal);

  // --- spawn
  const stc = Math.floor(C.spawn.x / T), str = Math.floor(C.spawn.y / T);
  if (!G.grid[str] || G.grid[str][stc] !== 0) bug('spawn di tile padat');

  // --- interactables
  const ids = {};
  for (const it of G.INTERACTABLES) {
    if (ids[it.id]) bug('ID ganda: ' + it.id);
    ids[it.id] = 1;
    const tc = Math.floor(it.x / T), tr = Math.floor(it.y / T);
    if (tc < 0 || tr < 0 || tc >= C.mapW || tr >= C.mapH) { bug(it.id + ': di luar peta'); continue; }
    const d = nearestDist(it, seen);
    if (d > (it.range || 30)) bug(it.id + ' (' + it.title + '): TAK TERJANGKAU d=' + d.toFixed(0) + ' range=' + (it.range || 30));
  }

  // --- quest lock: objek harus ada
  for (const L of C.quest.locks) {
    if (!ids[L.at]) bug('lock "' + L.at + '" menunjuk objek yang tidak ada');
  }
  // --- quest tool harus ada
  if (!ids[C.quest.tool]) bug('alat dekripsi "' + C.quest.tool + '" tidak ada di interactables');

  // --- clue placement: cek pool cukup
  const ex = C.clueExclude || {};
  const pool = G.INTERACTABLES.filter(p => !ex[p.id]);
  const need = G.CASE.clues.length;
  if (pool.length < need) bug('pool petunjuk ' + pool.length + ' < butuh ' + need);

  // --- cek clue nyangkut di lock/tool
  for (const k of Object.keys(G.state.clueMap)) {
    if (C.quest.locks.some(l => l.at === k)) bug('petunjuk di objek lock: ' + k);
    if (k === C.quest.tool) bug('petunjuk di alat: ' + k);
  }

  // --- setiap lock punya teks lengkap
  for (const L of C.quest.locks) {
    for (const f of ['obj', 'title', 'locked', 'ready', 'action', 'after', 'take', 'done']) {
      if (!L[f]) bug('lock "' + L.at + '" kehilangan teks .' + f);
    }
    if (L.need && !C.quest.locks.some(x => x.flag === L.need)) {
      bug('lock "' + L.at + '" butuh flag "' + L.need + '" yang tidak pernah dihasilkan');
    }
  }

  // --- cutscene & board
  if (!C.caps || !C.caps.length) bug('caps kosong');
  if (!C.boardCaps || !C.boardCaps.length) bug('boardCaps kosong');
  if (!C.cutScene) bug('cutScene tidak ada');
  if (!C.pins || C.pins.length < 3) bug('pins kurang');

  // --- ending
  if (!C.ending || !C.ending.win || !C.ending.lose) bug('ending tidak lengkap');
  if (!C.verdict || !C.verdict.win || !C.verdict.lose) bug('verdict tidak lengkap');

  // --- culprit ada di suspects
  if (!C.suspects.some(s => s.id === C.culprit)) bug('culprit "' + C.culprit + '" tidak ada di suspects');

  // --- props: jumlah
  const props = C.props ? C.props() : [];
  console.log('  interactables=' + G.INTERACTABLES.length + ' props=' + props.length +
              ' locks=' + C.quest.locks.length + ' clues=' + G.CASE.clues.length);
}

console.log('\n══════════════════════════');
console.log(bugs === 0 ? '✅ AUDIT BERSIH' : '❌ ' + bugs + ' MASALAH');
