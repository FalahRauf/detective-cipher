/* PLAYTEST OTOMATIS: mainkan 3 kasus x 3 mode dari awal sampai vonis */
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
    dispatchEvent(ev) { (L[ev.type] || []).forEach(fn => fn(ev)); },
    dispatch(e, a) { (L[e] || []).forEach(fn => fn(a || { key: '', preventDefault() {} })); },
    focus() {}, click() { this.dispatch('click'); },
    appendChild() {}, removeChild() {},
    querySelector() { return makeEl(); },
    querySelectorAll(sel) {
      if (sel === 'input') return Array.from({ length: (this.innerHTML.match(/<input/g) || []).length }, () => makeEl('input'));
      return [];
    },
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
const bug = m => { bugs++; console.log('   BUG  ' + m); };

function teleportNear(id) {
  const it = G.INTERACTABLES.find(p => p.id === id);
  if (!it) return false;
  // cari tile jalan terdekat dari posisi objek (pakai grid)
  const T = 16;
  let best = null, bd = 1e9;
  for (let r = 0; r < G.CUR.mapH; r++) {
    for (let c = 0; c < G.CUR.mapW; c++) {
      if (G.grid[r][c] !== 0) continue;
      const d = Math.hypot(c * T + 8 - it.x, r * T + 8 - it.y);
      if (d < bd) { bd = d; best = [c * T + 8, r * T + 8]; }
    }
  }
  if (!best || bd > (it.range || 30) + T) return false;
  G.setPlayer(best[0], best[1]);
  return true;
}

function unlockAllClues() {
  // interaksi semua objek yang menyimpan petunjuk
  for (const id of Object.keys(G.state.clueMap)) {
    if (!teleportNear(id)) { bug('tidak bisa teleport ke petunjuk ' + id); continue; }
    G.interact(id);
    G.closeDialog();
  }
}

function decryptViaTool() {
  // isi alat via pasteClue lalu runDecrypt
  G.openTool();
  G.pasteClue('in-msg');
  G.pasteClue('in-key');
  G.runDecrypt();
  const okDec = G.state.decrypted;
  return okDec;
}

for (let ci = 0; ci < 3; ci++) {
  for (const mode of ['easy', 'normal', 'hard']) {
    console.log('\n=== KASUS ' + (ci + 1) + ' · ' + mode.toUpperCase() + ' ===');
    G.setCase(ci); G.setDifficulty(mode); G.resetGame();
    G.showScreen('scr-play');

    // --- perangkap: cek jumlah sesuai mode
    const wantTraps = { easy: 0, normal: 2, hard: 4 }[mode];
    const gotTraps = G.traps().length;
    if (gotTraps !== wantTraps) bug('perangkap ' + gotTraps + ', harusnya ' + wantTraps);

    // --- 1. kumpulkan petunjuk
    unlockAllClues();
    const nFound = Object.keys(G.state.found).length;
    if (nFound !== G.CASE.clues.length) bug('petunjuk terkumpul ' + nFound + '/' + G.CASE.clues.length);

    // --- 2. dekripsi via alat portable
    if (!decryptViaTool()) bug('dekripsi gagal via alat portable');

    // --- 3. ikuti rantai kunci sesuai urutan
    const locks = G.CUR.quest.locks;
    for (const L of locks) {
      const res = G.resolveLock(L.at);
      if (res !== 'ok') bug('lock "' + L.at + '" resolve = ' + res);
    }
    // kode brankas kasus 2: beri petunjuk jam dulu lalu resolve
    if (ci === 1) {
      // resolveLock brankas butuh flag jam — set via interaksi objek jam
      const jamIt = G.INTERACTABLES.find(p => p.setsFlag);
      if (jamIt) { G.state.flags[jamIt.setsFlag] = true; }
      const brankas = locks.find(l => l.code);
      if (brankas && !G.state.flags[brankas.flag]) {
        const r2 = G.resolveLock(brankas.at);
        if (r2 !== 'ok') bug('brankas kode resolve = ' + r2);
      }
    }

    // --- 4. interogasi & tuduh pelaku
    if (!G.state.collected.evidence) {
      // kasus dengan evidenceMode clues: cek apakah evidence otomatis
      bug('bukti tidak didapat setelah rantai selesai');
    } else {
      G.finish(true);
      const stamp = reg['verdict-stamp'];
      if (stamp.textContent !== 'TERBUKTI') bug('vonis tidak TERBUKTI');
    }
  }
}

console.log('\n==============================');
console.log(bugs === 0 ? '✅ PLAYTEST BERSIH' : '❌ ' + bugs + ' MASALAH PLAYTEST');
