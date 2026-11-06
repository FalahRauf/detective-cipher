/* Uji geometri peta: gambar == tabrakan == interaksi. Jalankan: node _geomtest.js */
'use strict';
const fs = require('fs');
const path = require('path');

/* ---------- DOM stubs (sama seperti _selftest.js) ---------- */
function makeClassList() {
  const set = new Set();
  return {
    add: (...c) => c.forEach(x => set.add(x)),
    remove: (...c) => c.forEach(x => set.delete(x)),
    toggle: (c, force) => { const on = force === undefined ? !set.has(c) : !!force; if (on) set.add(c); else set.delete(c); return on; },
    contains: c => set.has(c)
  };
}
function makeEl(tag) {
  const listeners = {};
  const el = {
    tagName: (tag || 'div').toUpperCase(), style: {}, value: '', disabled: false,
    innerHTML: '', textContent: '', classList: makeClassList(), dataset: {}, attributes: {},
    setAttribute(k, v) { el.attributes[k] = v; if (k === 'id') registry[v] = el; },
    getAttribute(k) { return el.attributes[k] !== undefined ? el.attributes[k] : null; },
    removeAttribute(k) { delete el.attributes[k]; },
    addEventListener(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); },
    dispatch(ev) { (listeners[ev] || []).forEach(fn => fn({ key: '', preventDefault() {} })); },
    dispatchEvent(ev) { el.dispatch((ev && ev.type) || 'input'); return true; },
    focus() {}, click() { el.dispatch('click'); }, appendChild() {},
    querySelector() { return makeEl('div'); }, querySelectorAll() { return []; },
    getContext() { return ctxStub(); }, parentElement: null
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
  createElement: tag => makeEl(tag), querySelectorAll: () => [], addEventListener() {}
};
global.window = global;
if (!global.addEventListener) global.addEventListener = () => {};
global.requestAnimationFrame = () => 0;

eval(fs.readFileSync(path.join(__dirname, 'game.js'), 'utf8'));
const G = global.GAME;
const T = 16;

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  PASS  ' + msg); }
  else { fail++; console.log('  FAIL  ' + msg); }
}

for (let ci = 0; ci < 3; ci++) {
  G.setCase(ci); G.setDifficulty('easy'); G.resetGame();
  const C = G.CUR;
  console.log('\n== ' + C.id.toUpperCase() + ' — ' + C.place + ' (' + C.mapW + 'x' + C.mapH + ') ==');
  const props = C.props();
  const W = C.mapW * T, H = C.mapH * T;
  const grid = G.grid;

  /* 1. semua perabot di dalam peta */
  const outOfMap = props.filter(p => p.x < 0 || p.y < 0 || p.x + p.w > W || p.y + p.h > H);
  ok(outOfMap.length === 0, 'semua perabot di dalam peta' + (outOfMap.length ? ' — keluar: ' + outOfMap.map(p => p.ix && p.ix.id).join(',') : ''));

  /* 2. tidak ada perabot yang tumpang tindih */
  const over = [];
  for (let a = 0; a < props.length; a++) {
    for (let b = a + 1; b < props.length; b++) {
      const A = props[a], B = props[b];
      if (A.x < B.x + B.w && B.x < A.x + A.w && A.y < B.y + B.h && B.y < A.y + A.h) {
        over.push((A.ix ? A.ix.id : '?') + ' x ' + (B.ix ? B.ix.id : '?'));
      }
    }
  }
  ok(over.length === 0, 'tidak ada perabot bertumpuk' + (over.length ? ' — ' + over.join('; ') : ''));

  /* 3. tidak ada perabot yang menembus dinding (kecuali pintu) */
  const inWall = [];
  props.forEach(p => {
    if (p.wall) return;                       // papan/jam memang nempel di dinding
    if (p.ix && p.ix.id === 'door') return;
    for (let r = Math.floor(p.y / T); r < Math.ceil((p.y + p.h) / T); r++) {
      for (let c = Math.floor(p.x / T); c < Math.ceil((p.x + p.w) / T); c++) {
        if (!grid[r] || grid[r][c] === 1) inWall.push((p.ix ? p.ix.id : '?') + '@' + c + ',' + r);
      }
    }
  });
  ok(inWall.length === 0, 'tidak ada perabot menembus dinding' + (inWall.length ? ' — ' + inWall.slice(0, 6).join(',') : ''));

  /* 4. gambar tidak keluar dari kotaknya */
  const ctx = G._dbg.ctx;
  let minX, minY, maxX, maxY;
  const origFill = ctx.fillRect;
  ctx.fillRect = function (x, y, w, h) {
    if (w > 0 && h > 0) {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w); maxY = Math.max(maxY, y + h);
    }
  };
  const bleed = [];
  props.forEach(p => {
    minX = minY = Infinity; maxX = maxY = -Infinity;
    ctx.save = function () {}; ctx.restore = function () {}; ctx.translate = function () {};
    p.fn();
    const bleedB = p.wall ? 4 : 0.5;          // perabot dinding boleh punya bayangan di bawahnya
    if (maxX > p.x + p.w + 0.5 || maxY > p.y + p.h + bleedB || minX < p.x - 0.5 || minY < p.y - 0.5) {
      bleed.push((p.ix ? p.ix.id : '?') + ' [' + minX + ',' + minY + ' -> ' + maxX + ',' + maxY + '] vs [' + p.x + ',' + p.y + ' -> ' + (p.x + p.w) + ',' + (p.y + p.h) + ']');
    }
  });
  ctx.fillRect = origFill;
  ok(bleed.length === 0, 'gambar tiap perabot muat di kotaknya' + (bleed.length ? '\n         ' + bleed.join('\n         ') : ''));

  /* 5. setiap titik interaksi menempel perabotnya sendiri */
  const its = G.INTERACTABLES;
  const wallPropsIds = {};
  props.filter(p => p.wall).forEach(p => { if (p.ix) wallPropsIds[p.ix.id] = 1; });
  const bad = [];
  its.forEach(it => {
    const r = it.rect;
    const c0 = Math.floor(r.x / T), c1 = Math.ceil((r.x + r.w) / T) - 1;
    const r0 = Math.floor(r.y / T), r1 = Math.ceil((r.y + r.h) / T) - 1;
    const tc = Math.floor(it.x / T), tr = Math.floor(it.y / T);
    // perabot dinding: baris tepat di bawah dinding tidak bisa dipijak (hitbox 15px),
    // jadi titik berdirinya boleh 1 tile lebih jauh
    const maxGap = (wallPropsIds[it.id] ? 2 : 1);
    const adjacent = (tc >= c0 && tc <= c1 && (tr === r0 - 1 || tr === r1 + 1 ||
                      (maxGap > 1 && tr === r1 + 2))) ||
                     (tr >= r0 && tr <= r1 && (tc === c0 - 1 || tc === c1 + 1));
    const walkable = grid[tr] && grid[tr][tc] === 0 && grid[tr - 1] && grid[tr - 1][tc] === 0;
    if (!adjacent || !walkable) bad.push(it.id + ' @' + tc + ',' + tr + (adjacent ? ' (tidak bisa berdiri)' : ' (tidak menempel)'));
  });
  ok(bad.length === 0, 'semua titik interaksi menempel perabot & bisa dipijak' + (bad.length ? ' — ' + bad.join(', ') : ''));

  /* 5b. dekorasi dinding tidak menimpa papan / jam */
  const wallProps = props.filter(p => p.wall);
  const deco = C.decorItems || [];
  const clashDeco = [];
  deco.forEach(d => {
    const dw = d.w || 20, dh = d.h || 18;
    wallProps.forEach(p => {
      if (d.x < p.x + p.w && p.x < d.x + dw && d.y < p.y + p.h && p.y < d.y + dh) {
        clashDeco.push((p.ix ? p.ix.id : '?') + ' x ' + d.t);
      }
    });
  });
  ok(clashDeco.length === 0, 'dekorasi dinding tidak menimpa perabot dinding' + (clashDeco.length ? ' — ' + clashDeco.join(', ') : ''));

  /* 6. jangkauan interaksi wajar (tidak bisa memeriksa dari seberang ruangan) */
  const longRange = its.filter(it => it.range > 30).map(it => it.id + '(' + it.range + ')');
  ok(longRange.length === 0, 'jangkauan interaksi maksimal 30px' + (longRange.length ? ' — ' + longRange.join(',') : ''));

  /* 7. setiap perabot harus bisa jadi prompt terdekat (tidak tertutup objek lain) */
  const shadowed = [];
  its.forEach(it => {
    let can = false;
    for (let r = 2; r < C.mapH - 1 && !can; r++) {
      for (let c = 1; c < C.mapW - 1; c++) {
        if (G.solidTile(c, r) || G.solidTile(c, r - 1)) continue;
        const px = c * T + T / 2, py = r * T + T / 2;
        const dSelf = G.rectDist(px, py, it.rect);
        if (dSelf > it.range) continue;
        const best = its.reduce((acc, o) => {
          const d = G.rectDist(px, py, o.rect);
          return (d <= o.range && d < acc) ? d : acc;
        }, 1e9);
        if (Math.abs(best - dSelf) < 0.001) { can = true; break; }
      }
    }
    if (!can) shadowed.push(it.id);
  });
  ok(shadowed.length === 0, 'setiap perabot bisa jadi prompt terdekat' + (shadowed.length ? ' — tertutup: ' + shadowed.join(',') : ''));

  /* 8. spawn sehat */
  const sct = Math.floor(C.spawn.x / T), srt = Math.floor(C.spawn.y / T);
  ok(G.solidTile(sct, srt) === false && G.solidTile(sct, srt - 1) === false, 'spawn berdiri di lantai kosong');

  /* 9. semua perabot bisa dihampiri dari spawn (api dianggap padam).
     fire_bekas = flag yang diset di akhir semprotan — blokir celah lepas di situ,
     bukan saat pemain menekan "Periksa bekasnya". */
  const savedFlags = G.state.flags;
  G.state.flags = Object.assign({}, savedFlags, { fire_bekas: true });
  const reachSet = (function () {
    const seen = {};
    const start = [Math.floor(G.SPAWN.x / T), Math.floor(G.SPAWN.y / T)];
    const q = [start];
    seen[start.join(',')] = 1;
    while (q.length) {
      const cur = q.shift();
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(d => {
        const nc = cur[0] + d[0], nr = cur[1] + d[1], k = nc + ',' + nr;
        if (seen[k] || nc < 1 || nr < 2 || nc >= C.mapW - 1 || nr >= C.mapH - 1) return;
        if (G.solidTile(nc, nr) || G.solidTile(nc, nr - 1)) return;
        seen[k] = 1; q.push([nc, nr]);
      });
    }
    return seen;
  })();
  G.state.flags = savedFlags;

  const lost = its.filter(it => {
    for (const k in reachSet) {
      const p2 = k.split(',');
      const px = +p2[0] * T + T / 2, py = +p2[1] * T + T / 2;
      const dx = Math.max(it.rect.x - px, 0, px - (it.rect.x + it.rect.w));
      const dy = Math.max(it.rect.y - py, 0, py - (it.rect.y + it.rect.h));
      if (Math.sqrt(dx * dx + dy * dy) <= it.range) return false;
    }
    return true;
  }).map(it => it.id);
  ok(lost.length === 0, 'semua perabot bisa dihampiri dari spawn' + (lost.length ? ' — tidak terjangkau: ' + lost.join(',') : ''));
}

/* 8b. draw() tiap kasus tidak boleh error (nangkep fungsi gambar yang hilang) */
for (let ci = 0; ci < 3; ci++) {
  let err = null;
  try {
    G.setCase(ci); G.setDifficulty('hard'); G.resetGame(); G.showScreen('scr-play');
    G.draw();
    G.traps().forEach(t => { t.done = false; });
    G.draw();
  } catch (e) { err = e; }
  ok(!err, 'draw() kasus ' + (ci + 1) + ' jalan tanpa error' + (err ? ' (' + err.message + ')' : ''));
}

/* 9. kasus 3: api memblokir satu-satunya jalan, terbuka setelah dipadamkan */
console.log('\n== KASUS 3 — API MEMBLOKIR JALAN ==');
G.setCase(2); G.setDifficulty('easy'); G.resetGame();
(function () {
  const fire = G.INTERACTABLES.find(i => i.id === 'bekas');
  ok(!!fire, 'api punya titik interaksi');
  ok(fire.rect.w === 32 && fire.rect.h === 32, 'kotak api 2x2 tile');

  const px = 14 * T + 8, py = 15 * T + 8;          // tepat di bawah api
  ok(G.blocked(px, 14 * T + 8) === true, 'api memblokir jalan saat menyala');

  // pemain tidak bisa naik melewati api
  G.setPlayer(px, py);
  for (let i = 0; i < 80; i++) {
    if (!G.blocked(G.player.x, G.player.y - 1)) G.player.y -= 1;
  }
  ok(G.player.y > 14 * T, 'pemain tidak bisa menembus api (y=' + G.player.y + ')');

  // padamkan (akhir semprotan: tickSpray menyetel fire_bekas, api hilang dari lantai)
  G.state.flags.fire_bekas = true;
  ok(G.blocked(px, 14 * T + 8) === false, 'setelah dipadamkan jalan terbuka');
  G.state.flags.fire_bekas = false;
})();

console.log('\n==============================');
console.log(fail === 0 ? 'GEOMETRI OK (' + pass + ' assertions)' : fail + ' GAGAL dari ' + (pass + fail));
process.exit(fail === 0 ? 0 : 1);
