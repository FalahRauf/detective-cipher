/* =========================================================
   DETEKTIF SANDI — Kasus #01 "Pesan Terakhir di Lab"
   Pixel-art top-down 16px, kamera mengikuti pemain.

   Enkripsi berlapis:  c = f(g(...(x)))   (2 lapis easy, 3 lapis normal)
   Dekripsi selalu dari lapis terluar: x = ...⁻¹(g⁻¹(f⁻¹(c)))
   Tiga tingkat: EASY / NORMAL / HARD (lihat DIFFS di bawah).
   ========================================================= */
(function () {
  'use strict';

  /* =========================================================
     1. MATH — mesin enkripsi berlapis (data-driven)
     ========================================================= */
  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function m26(n) { var m = ((n % 26) + 26) % 26; return m === 0 ? 26 : m; }
  function l2n(ch) { return LETTERS.indexOf(ch.toUpperCase()) + 1; }
  function n2l(n) { return LETTERS[n - 1]; }
  function ainv(a) { for (var i = 1; i < 26; i++) if ((a * i) % 26 === 1) return i; return 1; }

  // Lapis disimpan dari LUAR ke DALAM: layers[0] dipakai terakhir saat enkripsi.
  function encLayer(L, x) { return m26(L.a * x + L.b); }
  function decLayer(L, y) { return m26(L.inv * (y - L.b)); }

  function fxStr(L) {
    return L.a === 1 ? ('x ' + (L.b < 0 ? '\u2212 ' + (-L.b) : '+ ' + L.b))
                     : (L.a + 'x ' + (L.b < 0 ? '\u2212 ' + (-L.b) : '+ ' + L.b));
  }
  function finvStr(L) {
    var inner = 'y ' + (L.b < 0 ? '+ ' + (-L.b) : '\u2212 ' + L.b);
    return L.a === 1 ? inner + ' mod 26' : L.inv + '(' + inner + ') mod 26';
  }

  /* =========================================================
     2. DATA — tingkat kesulitan & kasus
     ========================================================= */
  var SUSPECTS = [
    { id: 'rian',  name: 'Rian Pratama',   role: 'Siswa XI PPLG 4', initials: 'RP',
      alibi: 'Mengaku sudah di kos sejak pukul 20.30. Dua teman sekos membenarkan.',
      note: 'Tidak punya kartu akses ke gedung setelah jam 22.00.' },
    { id: 'dedi',  name: 'Pak Dedi',       role: 'Teknisi Lab',     initials: 'PD',
      alibi: 'Mengaku sudah pulang sejak pukul 21.00 dan tidak kembali lagi.',
      note: 'Kartu akses teknisi tercatat tap masuk pukul 23.40.' },
    { id: 'sinta', name: 'Sinta Maharani', role: 'Siswa XI PPLG 4', initials: 'SM',
      alibi: 'Terekam CCTV perpustakaan sampai pukul 22.00, lalu terlihat keluar gerbang.',
      note: 'Tidak pernah memegang kunci lemari arsip.' }
  ];

  // Pesan selalu menunjuk ke pot. Dipilih acak tiap kali main.
  var MESSAGES = [
    'KUNCI DI POT',
    'KUNCI LEMARI DI POT',
    'AMBIL KUNCI DI POT',
    'KUNCI ARSIP DI POT',
    'KUNCI ADA DI POT'
  ];

  var FN_NAMES = ['f', 'g', 'h', 'k'];

  var DIFFS = {
    easy: {
      id: 'easy', label: 'EASY',
      layers: [ { a: 3, b: 7 }, { a: 1, b: 5 } ],
      clueCount: 2,
      traps: 0,
      confirm: 'Mode EASY \u2014 pesan Nayla dienkripsi dua lapis. Cari pesannya dan kuncinya di lab, ' +
               'buka sandinya lewat alat dekripsi yang kamu bawa (tombol T). Tidak ada perangkap.'
    },
    normal: {
      id: 'normal', label: 'NORMAL',
      layers: [ { a: 3, b: 7 }, { a: 1, b: 5 }, { a: 1, b: -6 } ],
      clueCount: 2,
      traps: 2,
      confirm: 'Mode NORMAL \u2014 tiga lapis komposisi fungsi, plus DUA perangkap buatan pelaku tersembunyi di lantai. ' +
               'Kena = kehilangan poin. Perhatikan kilau & retakan di lantai.'
    },
    hard: {
      id: 'hard', label: 'HARD',
      layers: [ { a: 5, b: 2 }, { a: 3, b: 3 }, { a: 1, b: -4 } ],
      clueCount: 3,
      traps: 4,
      confirm: 'Mode HARD \u2014 kuncinya disobek jadi dua bagian dan disimpan terpisah, plus EMPAT perangkap ' +
               'termasuk lantai rapuh yang bisa membuatmu jatuh. Perhatikan lantai dengan teliti.'
    }
  };

  var diff = DIFFS.easy;
  var CASE = null;

  function fnStr(L) {
    var s;
    if (L.a === 1) s = 'x';
    else if (L.a === -1) s = '-x';
    else s = L.a + 'x';
    if (L.b > 0) s += ' + ' + L.b;
    else if (L.b < 0) s += ' \u2212 ' + Math.abs(L.b);
    return s;
  }

  function keyLines(layers, from, to) {
    var out = [];
    for (var i = from; i < to; i++) out.push(FN_NAMES[i] + '(x) = ' + fnStr(layers[i]));
    return out;
  }

  function composeLine(layers) {
    var s = 'x';
    for (var i = layers.length - 1; i >= 0; i--) s = FN_NAMES[i] + '(' + s + ')';
    return 'c = ' + s;
  }

  function pickOne(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // tampilkan sandi dengan huruf besar-kecil campur supaya terbaca seperti teks acak
  function scrambleCase(s) {
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      out += (ch !== ' ' && ((i * 7 + 3) % 5 < 2)) ? ch.toLowerCase() : ch;
    }
    return out;
  }

  function buildCase(d) {
    var layers = [];
    for (var i = 0; i < d.layers.length; i++) {
      layers.push({ name: FN_NAMES[i], a: d.layers[i].a, b: d.layers[i].b, inv: ainv(d.layers[i].a) });
    }
    // pesan dipilih stabil per kasus (bukan acak tiap reset, dan sama di semua mode)
    // supaya sandi tidak berubah saat pemain mengulang kasus atau ganti tingkat
    var msgs = (CUR && CUR.messages) || MESSAGES;
    var seed = (CUR ? CUR.id.charCodeAt(1) : 0) % msgs.length;
    var plain = msgs[seed];

    // enkripsi: lapis paling dalam dulu (ujung array) ke terluar (awal array)
    var cipher = '';
    for (var j = 0; j < plain.length; j++) {
      var ch = plain.charAt(j);
      if (ch === ' ') { cipher += ' '; continue; }
      var x = l2n(ch);
      for (var k = layers.length - 1; k >= 0; k--) x = encLayer(layers[k], x);
      cipher += n2l(x);
    }

    var clues = [];
    clues.push({ id: 'msg', kind: 'msg', title: 'PESAN TERENKRIPSI', body: scrambleCase(cipher) });

    var want = (((CUR && CUR.clueCount && CUR.clueCount[d.id]) || d.clueCount || 2)) - 1;
    var frag = Math.max(1, Math.min(want, layers.length));
    if (frag === 1) {
      clues.push({
        id: 'key1', kind: 'key', title: 'KUNCI',
        body: [composeLine(layers)].concat(keyLines(layers, 0, layers.length)).join('\n')
      });
    } else {
      var per = Math.ceil(layers.length / frag);
      for (var q = 0; q < frag; q++) {
        var from = q * per, to = Math.min(layers.length, (q + 1) * per);
        if (from >= to) break;
        var bd = (q === 0 ? [composeLine(layers)] : []).concat(keyLines(layers, from, to));
        clues.push({
          id: 'key' + (q + 1), kind: 'key',
          title: 'KUNCI \u2014 SOBEKAN ' + String.fromCharCode(65 + q),
          body: bd.join('\n')
        });
      }
    }

    return {
      diff: d, layers: layers, plain: plain, cipher: cipher,
      clues: clues, culprit: (CUR ? CUR.culprit : 'dedi'), suspects: (CUR ? CUR.suspects : SUSPECTS)
    };
  }
  var CORE = ['monitor', 'papan', 'sampah'];

  /* =========================================================
     3. DUNIA — data per kasus
     ========================================================= */
  var T = 16;
  var VW = 320, VH = 180;
  var MAP_W = 28, MAP_H = 18;
  var WORLD_W = MAP_W * T, WORLD_H = MAP_H * T;

  var FLOOR_SHADE = ['#171d26', '#1a212b', '#1c2430'];

  var grid = [];
  var INTERACTABLES = [];
  var LIGHTS = [];
  var CUR = null;                  // kasus yang sedang dimainkan

  function makeGrid(w, h, furniture) {
    var g = [];
    for (var r = 0; r < h; r++) {
      var row = [];
      for (var c = 0; c < w; c++) {
        var wall = (r <= 2 || r >= h - 1 || c <= 1 || c >= w - 2);
        row.push(wall ? 1 : 0);
      }
      g.push(row);
    }
    for (var i = 0; i < furniture.length; i++) {
      var d = furniture[i];
      for (var rr = d.r; rr < d.r + d.h; rr++) {
        for (var cc = d.c; cc < d.c + d.w; cc++) {
          if (g[rr] && cc >= 0 && cc < w) g[rr][cc] = 2;
        }
      }
    }
    return g;
  }

  /* ---------------------------------------------------------
     DENAH RUANGAN — lantai dibagi jadi beberapa ruang + lorong
     rooms: [{c,r,w,h}]  (koordinat tile)
     doors: [{c,r,w,h}]  (lubang penghubung; ditembus di dinding)
     corridors: [{c,r,w,h}] (lorong; lantainya tetap, bukan ruangan)

     Setelah digali, fungsi ini MEMVERIFIKASI bahwa semua lantai
     terhubung ke spawn. Kalau ada ruangan terputus, dibuatkan
     lorong penyambung otomatis (carve) sampai tersambung.
     --------------------------------------------------------- */
  function makeFloorPlan(w, h, rooms, doors, corridors, spawn) {
    var g = [];
    for (var r = 0; r < h; r++) {
      var row = [];
      for (var c = 0; c < w; c++) row.push(1);
      g.push(row);
    }
    function carve(rect) {
      for (var rr = rect.r; rr < rect.r + rect.h; rr++) {
        for (var cc = rect.c; cc < rect.c + rect.w; cc++) {
          if (rr > 0 && rr < h - 1 && cc > 0 && cc < w - 1) g[rr][cc] = 0;
        }
      }
    }
    for (var i = 0; i < rooms.length; i++) carve(rooms[i]);
    for (var j = 0; j < corridors.length; j++) carve(corridors[j]);
    for (var k = 0; k < doors.length; k++) carve(doors[k]);

    // --- verifikasi konektivitas ---
    function bfs(sc, sr) {
      var seen = {}, q = [[sc, sr]];
      seen[sc + ',' + sr] = 1;
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      while (q.length) {
        var cur = q.shift();
        for (var d = 0; d < 4; d++) {
          var nc = cur[0] + dirs[d][0], nr = cur[1] + dirs[d][1];
          var key = nc + ',' + nr;
          if (seen[key] || nc < 1 || nr < 1 || nc >= w - 1 || nr >= h - 1) continue;
          if (g[nr][nc] !== 0) continue;
          seen[key] = 1;
          q.push([nc, nr]);
        }
      }
      return seen;
    }

    var sp = spawn || { x: w * T / 2, y: h * T / 2 };
    var sc0 = Math.floor(sp.x / T), sr0 = Math.floor(sp.y / T);
    // pastikan spawn di lantai
    if (g[sr0] && g[sr0][sc0] !== 0) {
      // cari lantai terdekat
      var best = null, bd = 1e9;
      for (var rr2 = 1; rr2 < h - 1; rr2++) {
        for (var cc2 = 1; cc2 < w - 1; cc2++) {
          if (g[rr2][cc2] !== 0) continue;
          var dd = Math.hypot(cc2 - sc0, rr2 - sr0);
          if (dd < bd) { bd = dd; best = [cc2, rr2]; }
        }
      }
      if (best) { sc0 = best[0]; sr0 = best[1]; }
    }

    // sambungkan semua komponen lantai ke komponen spawn
    for (var guard = 0; guard < 40; guard++) {
      var seen = bfs(sc0, sr0);
      // cari tile lantai yang belum terjangkau
      var orphan = null;
      for (var rr3 = 1; rr3 < h - 1 && !orphan; rr3++) {
        for (var cc3 = 1; cc3 < w - 1; cc3++) {
          if (g[rr3][cc3] === 0 && !seen[cc3 + ',' + rr3]) { orphan = [cc3, rr3]; break; }
        }
      }
      if (!orphan) break;   // semua tersambung

      // gali lorong L-shape dari orphan menuju tile terdekat yang terjangkau
      var target = null, td = 1e9;
      for (var key in seen) {
        var parts = key.split(',');
        var tc = +parts[0], tr = +parts[1];
        var d2 = Math.abs(tc - orphan[0]) + Math.abs(tr - orphan[1]);
        if (d2 < td) { td = d2; target = [tc, tr]; }
      }
      if (!target) break;
      // horizontal dulu, lalu vertikal (1 tile lebar)
      var x0 = Math.min(orphan[0], target[0]), x1 = Math.max(orphan[0], target[0]);
      for (var cx = x0; cx <= x1; cx++) {
        if (g[orphan[1]] && cx > 0 && cx < w - 1 && orphan[1] > 0 && orphan[1] < h - 1) g[orphan[1]][cx] = 0;
      }
      var y0 = Math.min(orphan[1], target[1]), y1 = Math.max(orphan[1], target[1]);
      for (var cy = y0; cy <= y1; cy++) {
        if (g[cy] && target[0] > 0 && target[0] < w - 1 && cy > 0 && cy < h - 1) g[cy][target[0]] = 0;
      }
    }
    return g;
  }

  function furnitureProps(defs) {
    var list = [];
    for (var i = 0; i < defs.length; i++) {
      (function (d) {
        list.push({
          y: (d.r + d.h) * T,
          fn: function () { d.draw(d.c * T, d.r * T, d.w * T, d.h * T); }
        });
      })(defs[i]);
    }
    return list;
  }

  /* ---------- art perpustakaan ---------- */

  function drawShelfUnit(x, y, w, h) {
    R(x, y, w, h, '#2f2418');
    R(x + 1, y + 1, w - 2, h - 2, '#3d2f1f');
    var rows = Math.max(2, Math.floor(h / 15));
    var rh = (h - 4) / rows;
    var pal = ['#8c3b2e', '#2e5b8c', '#3f7a4a', '#8c7a2e', '#5a3f7a', '#8c5a2e', '#2e6b6b'];
    for (var i = 0; i < rows; i++) {
      var sy = y + 2 + i * rh;
      var bh = Math.max(5, Math.floor(rh) - 5);
      var bx = x + 3;
      while (bx < x + w - 4) {
        var bw = 2 + ((bx * 7 + i * 5) % 3);
        if (bx + bw > x + w - 3) break;
        R(bx, sy + rh - 4 - bh, bw, bh, pal[(bx + i * 5) % pal.length]);
        R(bx, sy + rh - 4 - bh, bw, 1, 'rgba(255,255,255,.13)');
        bx += bw + 1;
      }
      R(x + 2, sy + rh - 3, w - 4, 2, '#241a11');
    }
    R(x, y, w, 2, '#4a3826');
    R(x, y + h - 2, w, 2, '#241a11');
  }

  function drawLibTable(x, y, w, h) {
    var tw = Math.min(w - 4, 48);
    var tx = x + ((w - tw) / 2 | 0);
    shadow(tx, y + 9, tw, 5);
    R(tx, y, tw, 9, '#4a3a28');
    R(tx, y, tw, 2, '#5e4a34');
    R(tx + 2, y + 9, 3, 9, '#31261a');
    R(tx + tw - 5, y + 9, 3, 9, '#31261a');
    R(tx + 4, y + 2, 9, 5, '#ddd4bc');
    R(tx + 13, y + 2, 9, 5, '#ddd4bc');
    R(tx + 12, y + 2, 2, 5, '#a89878');
    var lx = tx + (tw / 2 | 0);
    R(lx - 1, y - 9, 2, 9, '#2a2a2a');
    R(lx - 5, y - 12, 10, 3, '#2f6b4a');
    R(lx - 5, y - 12, 10, 1, '#3f8a5e');
  }

  function drawCardCatalog(x, y, w, h) {
    shadow(x, y + h - 2, w, 5);
    R(x, y, w, h, '#3a2c1e');
    R(x + 2, y + 2, w - 4, h - 4, '#4a3826');
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 2; c++) {
        var dx = x + 4 + c * 13, dy = y + 4 + r * 9;
        R(dx, dy, 11, 7, '#5c4630');
        R(dx + 3, dy + 3, 5, 2, '#c9b48a');
      }
    }
    R(x, y, w, 2, '#5c4630');
  }

  function drawGlobe(x, y) {
    shadow(x + 4, y + 27, 18, 4);
    R(x + 5, y + 27, 16, 3, '#3a2c1e');
    R(x + 11, y + 21, 4, 7, '#5a4530');
    R(x + 5, y + 8, 16, 13, '#1e4a6e');
    R(x + 3, y + 11, 20, 7, '#1e4a6e');
    R(x + 7, y + 6, 12, 17, '#1e4a6e');
    R(x + 8, y + 10, 5, 4, '#3f7a4a');
    R(x + 14, y + 15, 4, 5, '#3f7a4a');
    R(x + 7, y + 9, 3, 2, '#4a86b8');
  }

  function drawBookCart(x, y) {
    shadow(x, y + 21, 28, 4);
    R(x + 2, y, 24, 3, '#6a6a6a');
    R(x + 2, y, 24, 1, '#8a8a8a');
    R(x + 3, y + 3, 2, 15, '#4a4a4a');
    R(x + 23, y + 3, 2, 15, '#4a4a4a');
    R(x + 5, y + 8, 18, 2, '#555');
    var pal = ['#8c3b2e', '#2e5b8c', '#3f7a4a', '#8c7a2e'];
    for (var i = 0; i < 5; i++) R(x + 5 + i * 4, y - 8, 3, 8, pal[i % pal.length]);
    for (var j = 0; j < 4; j++) R(x + 6 + j * 4, y + 10, 3, 6, pal[(j + 1) % pal.length]);
    R(x + 4, y + 18, 4, 4, '#1a1a1a');
    R(x + 20, y + 18, 4, 4, '#1a1a1a');
  }

  function drawLockerUnit(x, y, w, h) {
    shadow(x, y + h - 3, w, 5);
    R(x, y, w, h, '#2b333d');
    var hw = ((w - 2) / 2) | 0;
    R(x + 1, y + 1, hw, h - 2, '#3a444f');
    R(x + 2 + hw, y + 1, hw, h - 2, '#3a444f');
    for (var i = 0; i < 4; i++) {
      R(x + 4, y + 5 + i * 3, 7, 1, '#222a32');
      R(x + w - 11, y + 5 + i * 3, 7, 1, '#222a32');
    }
    R(x + hw - 1, y + 18, 2, 7, '#c9d3de');
    R(x + hw + 3, y + 18, 2, 7, '#c9d3de');
    R(x, y, w, 2, '#4a5460');
  }

  function drawSafeBox(x, y, w, h) {
    shadow(x, y + h - 2, w, 5);
    R(x, y, w, h, '#1f262e');
    R(x + 2, y + 2, w - 4, h - 4, '#333c47');
    R(x + (w / 2 | 0) - 6, y + 11, 12, 12, '#8f9aa6');
    R(x + (w / 2 | 0) - 4, y + 13, 8, 8, '#c9d3de');
    R(x + w - 7, y + 12, 3, 7, '#c9d3de');
    R(x, y, w, 2, '#4a5460');
  }

  function drawLibDesk(x, y, w, h) {
    var dw = w - 8, dx = x + 4;
    shadow(dx, y + 13, dw, 6);
    R(dx, y + 2, dw, 11, '#4a3a28');
    R(dx, y + 2, dw, 2, '#5e4a34');
    R(dx + 3, y + 13, 4, 9, '#31261a');
    R(dx + dw - 7, y + 13, 4, 9, '#31261a');
    drawMonitor(dx + (dw / 2 | 0) - 10, y - 14, 20, 16);
    R(dx + 2, y + 4, 12, 6, '#ddd4bc');
    R(dx + dw - 12, y + 4, 7, 5, '#c9b48a');
  }

  /* ---------- art ruang server ---------- */

  function drawServerRack(x, y, w, h) {
    shadow(x, y + h - 2, w, 5);
    R(x, y, w, h, '#151b22');
    R(x + 1, y + 1, w - 2, h - 2, '#232b34');
    var n = Math.floor((h - 4) / 9);
    for (var i = 0; i < n; i++) {
      var sy = y + 3 + i * 9;
      R(x + 2, sy, w - 4, 7, '#0e1319');
      R(x + 3, sy + 1, w - 10, 5, '#1b232c');
      R(x + w - 6, sy + 2, 2, 2, i % 3 === 0 ? '#46c98b' : (i % 3 === 1 ? '#f2b544' : '#e8564a'));
      R(x + w - 9, sy + 2, 2, 2, '#4a8cbe');
    }
    R(x, y, w, 2, '#39434e');
  }

  function drawCoolingUnit(x, y, w, h) {
    shadow(x, y + h - 2, w, 5);
    R(x, y, w, h, '#232b34');
    R(x + 2, y + 2, w - 4, h - 4, '#333c47');
    var n = Math.max(3, Math.floor((h - 16) / 3));
    for (var i = 0; i < n; i++) R(x + 4, y + 4 + i * 3, w - 8, 2, '#252d36');
    R(x + 6, y + h - 15, w - 12, 10, '#11161c');
    for (var j = 0; j < 3; j++) R(x + 8 + j * 6, y + h - 13, 2, 6, '#4a5460');
    R(x, y, w, 2, '#3f4954');
  }

  function drawTerminalDesk(x, y, w, h) {
    var dw = w - 4, dx = x + 2;
    shadow(dx, y + 13, dw, 6);
    R(dx, y + 2, dw, 11, '#2b333d');
    R(dx, y + 2, dw, 2, '#3f4954');
    R(dx + 3, y + 13, 4, 9, '#1c2229');
    R(dx + dw - 7, y + 13, 4, 9, '#1c2229');
    for (var i = 0; i < 2; i++) {
      var mx = dx + 8 + i * 36;
      R(mx, y - 22, 30, 22, '#0e1319');
      R(mx + 2, y - 20, 26, 18, '#0d3b2a');
      R(mx + 4, y - 18, 22, 2, '#2f8f6a');
      R(mx + 4, y - 14, 16, 2, '#2f8f6a');
      R(mx + 4, y - 10, 20, 2, '#2f8f6a');
      R(mx + 12, y - 1, 6, 2, '#0e1319');
    }
  }

  function drawVaultDoor(x, y, w, h) {
    shadow(x, y + h - 2, w, 5);
    R(x, y, w, h, '#151b22');
    R(x + 2, y + 2, w - 4, h - 4, '#252d38');
    R(x + 7, y + 7, w - 14, h - 14, '#39434e');
    R(x + 7, y + 7, w - 14, 2, '#4a5460');
    R(x + (w / 2 | 0) - 6, y + (h / 2 | 0) - 6, 12, 12, '#8f9aa6');
    R(x + (w / 2 | 0) - 3, y + (h / 2 | 0) - 3, 6, 6, '#c9d3de');
    R(x + w - 12, y + (h / 2 | 0) - 4, 3, 8, '#c9d3de');
    R(x, y, w, 2, '#39434e');
  }

  function drawPanelBox(x, y, w, h) {
    shadow(x, y + h - 2, w, 4);
    R(x, y, w, h, '#232b34');
    R(x + 2, y + 2, w - 4, h - 4, '#333c47');
    for (var i = 0; i < 3; i++) R(x + 4, y + 5 + i * 7, w - 8, 3, i === 0 ? '#46c98b' : (i === 1 ? '#f2b544' : '#4a5460'));
    R(x, y, w, 2, '#3f4954');
  }

  function drawBinAt(x, y) {
    R(x, y + 15, 16, 3, 'rgba(0,0,0,.3)');
    R(x, y, 14, 4, '#3a4a5e');
    R(x + 1, y + 1, 12, 2, '#232c3a');
    R(x + 1, y + 4, 12, 11, '#2a3444');
    R(x + 2, y + 5, 1, 10, '#333f52');
    R(x + 5, y + 5, 1, 10, '#333f52');
    R(x + 8, y + 5, 1, 10, '#333f52');
    R(x + 14, y + 10, 5, 4, '#cfc9b6');
  }

  function drawPlantAt(x, y) {
    R(x + 1, y + 22, 14, 3, 'rgba(0,0,0,.3)');
    R(x + 2, y + 8, 10, 12, '#6b4a33');
    R(x + 2, y + 8, 10, 1, '#7d5a40');
    R(x + 1, y + 6, 12, 3, '#7d5a40');
    R(x + 4, y - 8, 6, 15, '#2f6b3f');
    R(x + 0, y - 2, 5, 10, '#3a7d4a');
    R(x + 9, y - 4, 5, 12, '#26593a');
    R(x + 6, y - 12, 3, 6, '#3a7d4a');
  }

  function drawDispenserAt(x, y) {
    R(x, y + 18, 14, 3, 'rgba(0,0,0,.3)');
    R(x + 1, y, 12, 22, '#c9d3de');
    R(x + 1, y, 12, 2, '#dfe6ee');
    R(x + 2, y - 12, 10, 12, '#5a93d6');
    R(x + 4, y - 14, 6, 3, '#4a7fb8');
    R(x + 4, y + 10, 5, 6, '#3a4756');
  }

  function drawDoorAt(x, y) {
    R(x, y, 36, 18, '#1c2531');
    R(x + 2, y + 2, 32, 16, '#4a3524');
    R(x + 4, y + 4, 28, 14, '#6b4d33');
    R(x + 4, y + 4, 28, 2, '#7d5a40');
    R(x + 28, y + 10, 3, 3, '#e0c069');
    R(x + 16, y - 2, 8, 4, '#2b3644');
    R(x + 17, y - 1, 6, 2, '#8a99ad');
  }

  /* ---------- lantai & dinding ---------- */

  /* ---------- lantai & dinding: kontras ditegaskan supaya denah ruangan kebaca ---------- */
  function labFloor(c, r, x, y) {
    // lantai: gelap, rata, ubin besar
    R(x, y, T, T, ((c + r) % 2) ? '#141a22' : '#171d26');
    R(x, y, T, 1, 'rgba(140,180,220,.05)');
    R(x, y, 1, T, 'rgba(0,0,0,.35)');
  }

  function labWall(c, r, x, y) {
    // dinding: terang, bata, jelas beda dari lantai
    R(x, y, T, T, '#3a4452');
    R(x, y, T, 2, '#4e5a6b');            // sorot atas
    R(x, y + T - 3, T, 3, '#232b36');    // bayangan bawah
    // pola bata
    var off = (r % 2) ? 8 : 0;
    R(x + off, y + 6, 7, 1, 'rgba(20,26,34,.55)');
    R(x + ((off + 8) % 16), y + 12, 7, 1, 'rgba(20,26,34,.45)');
    R(x, y + 6, 1, 10, 'rgba(20,26,34,.30)');
    R(x + T - 1, y + 6, 1, 10, 'rgba(20,26,34,.30)');
  }

  function libFloor(c, r, x, y) {
    R(x, y, T, T, (r % 2) ? '#1e1710' : '#241c14');
    R(x, y, T, 1, 'rgba(210,180,130,.05)');
    R(x, y, 1, T, 'rgba(0,0,0,.30)');
  }

  function srvFloor(c, r, x, y) {
    R(x, y, T, T, ((c + r) % 2) ? '#12171e' : '#151b23');
    R(x, y, T, 1, 'rgba(120,160,200,.07)');
    R(x, y, 1, T, 'rgba(0,0,0,.30)');
  }

  function libWall(c, r, x, y) {
    R(x, y, T, T, '#4a3826');
    R(x, y, T, 2, '#5f4a33');
    R(x, y + T - 3, T, 3, '#2a1f14');
    var off = (r % 2) ? 8 : 0;
    R(x + off, y + 6, 7, 1, 'rgba(26,18,10,.55)');
    R(x + ((off + 8) % 16), y + 12, 7, 1, 'rgba(26,18,10,.45)');
  }

  function srvWall(c, r, x, y) {
    R(x, y, T, T, '#2b333d');
    R(x, y, T, 2, '#3d4854');
    R(x, y + T - 3, T, 3, '#171d24');
    if (c % 2 === 0) R(x + 2, y + 5, 12, 1, 'rgba(150,190,230,.10)');
    if (c % 2 !== 0) R(x + 2, y + 11, 12, 1, 'rgba(150,190,230,.07)');
  }

  /* ---------- dekorasi dinding per kasus ---------- */

  function decorLab() {
    drawTrunking();
    drawWindow();
    drawBoard();
    drawCorkBoard();
    drawClock();
    drawPoster();
    drawAC();
    drawCable(48, 128, 40);
    drawCable(88, 128, 2);
    drawCable(240, 160, 46);
    drawCable(286, 160, 2);
    drawCable(112, 96, 60);
    drawCable(336, 108, 44);
  }

  function decorLib() {
    R(40, 8, 460, 3, '#3a2c1e');
    R(40, 8, 460, 1, '#4a3826');
    R(60, 10, 70, 32, '#0c1420');
    R(62, 12, 66, 28, '#101c2c');
    R(95, 12, 2, 28, '#2b3644');
    R(62, 25, 66, 2, '#2b3644');
    ctx.globalAlpha = 0.20;
    R(66, 14, 24, 10, '#8fb4dd');
    ctx.globalAlpha = 1;
    R(160, 8, 96, 34, '#2b3644');
    R(162, 10, 92, 30, '#c9b48a');
    R(168, 16, 40, 2, '#8a7a5a');
    R(168, 22, 30, 2, '#8a7a5a');
    R(168, 28, 52, 2, '#8a7a5a');
    R(168, 34, 24, 2, '#8a7a5a');
    R(292, 8, 20, 20, 'rgba(0,0,0,.28)');
    R(295, 8, 14, 16, '#1c2531');
    R(297, 9, 10, 14, '#e8eef6');
    R(301, 11, 2, 6, '#232d3a');
    R(302, 16, 4, 2, '#232d3a');
    R(301, 16, 2, 2, '#c0392b');
    R(336, 10, 22, 28, '#39465a');
    R(337, 11, 20, 26, '#c9b48a');
    R(340, 16, 14, 2, '#8a7a5a');
    R(340, 22, 10, 2, '#8a7a5a');
    R(340, 28, 14, 2, '#8a7a5a');
    R(444, 12, 32, 13, '#c9d3de');
    R(444, 12, 32, 2, '#e6ecf4');
    for (var i = 0; i < 5; i++) R(447, 17 + i, 26, 1, '#8fa0b4');
    R(446, 24, 28, 2, '#6d7d92');
    for (var L = 0; L < 3; L++) {
      var lx = 120 + L * 140;
      R(lx, 36, 2, 14, '#2a2a2a');
      R(lx - 8, 50, 18, 4, '#2f6b4a');
      R(lx - 8, 50, 18, 1, '#3f8a5e');
    }
  }

  function decorSrv() {
    R(32, 8, 544, 4, '#2b333d');
    R(32, 8, 544, 1, '#3f4954');
    for (var i = 0; i < 18; i++) {
      var cx = 40 + i * 30;
      R(cx, 12, 4, 3, '#1c2229');
      R(cx + 1, 12, 2, 3, i % 2 ? '#4a8cbe' : '#8c4a3a');
    }
    R(150, 14, 60, 30, '#232b34');
    R(152, 16, 56, 26, '#2b333d');
    for (var s = 0; s < 3; s++) R(158, 20 + s * 7, 44, 3, s === 0 ? '#46c98b' : (s === 1 ? '#f2b544' : '#4a5460'));
    R(300, 14, 40, 20, '#0e1319');
    R(302, 16, 36, 16, '#0d1a14');
    for (var d = 0; d < 4; d++) R(306 + d * 7, 20, 4, 8, '#2f8f6a');
    for (var n = 0; n < 3; n++) {
      var nx = 100 + n * 180;
      R(nx, 38, 60, 4, '#39434e');
      R(nx + 2, 40, 56, 2, '#c8e0f0');
    }
    R(32, 44, 544, 3, '#2b333d');
    R(32, 44, 544, 1, '#3f4954');
  }

  /* ---------- daftar prop per kasus ---------- */

  // format: {x,y = pojok kiri atas px, w,h = ukuran px, fn = gambar, s = solid (default true)}
  function propsLab() {
    var L = [];
    function P(x, y, w, h, fn, s) { L.push({ x: x, y: y, w: w, h: h, fn: fn, s: s !== false }); }

    /* ===== LAB KOMPUTER 2 — x48-240 y64-176 ===== */
    P(56, 66, 116, 42, function () { drawBoard(56, 66); });           // papan tulis
    P(64, 110, 72, 22, function () { drawDeskTop(64, 110, 72); });    // meja guru
    P(76, 96, 36, 18, function () { drawMonitor(76, 96, 36, 18); });  // monitor di meja
    P(196, 96, 32, 68, function () { drawBookshelf(196, 96); });      // rak buku
    P(56, 156, 18, 18, function () { drawBin(56, 156); });            // tempat sampah
    var labDesks = [[64, 136], [120, 136], [64, 160], [120, 160]];
    for (var i = 0; i < labDesks.length; i++) {
      (function (dx, dy) {
        P(dx, dy, 32, 16, function () { drawStudentDesk(dx, dy); });
      })(labDesks[i][0], labDesks[i][1]);
    }

    /* ===== RUANG GURU — x320-496 y64-176 ===== */
    P(336, 80, 32, 46, function () { drawPrinterTable(336, 80); });   // printer
    P(424, 108, 32, 46, function () { drawCabinet(424, 108); });      // lemari arsip
    P(336, 120, 32, 68, function () { drawBookshelf(336, 120); });    // rak guru

    /* ===== GUDANG — x48-192 y240-336 ===== */
    P(64, 262, 20, 42, function () { drawPlant(64, 262); });          // pot
    P(108, 250, 18, 34, function () { drawDispenser(108, 250); });    // dispenser
    P(156, 282, 16, 44, function () { drawMop(156, 282); });          // alat pel

    /* ===== RUANG ISTIRAHAT — x320-496 y240-336 ===== */
    P(336, 270, 32, 16, function () { drawStudentDesk(336, 270); });
    P(408, 270, 32, 16, function () { drawStudentDesk(408, 270); });

    /* ===== lorong + pintu ===== */
    P(246, 338, 36, 22, function () { drawDoor(246, 338); });         // pintu keluar
    return L;
  }

  /* ---------- props KASUS 2: ruang guru / rapat / arsip / pantry ---------- */
  function propsTeacherRoom() {
    var L = [];
    function P(x, y, w, h, fn) { L.push({ x: x, y: y, w: w, h: h, fn: fn, s: true }); }

    /* ===== RUANG GURU (TKP) — x48-224 y64-176 ===== */
    P(56, 66, 116, 42, function () { drawBoard(56, 66); });           // papan tulis
    P(64, 110, 88, 22, function () { drawDeskTop(64, 110, 88); });    // meja korban
    P(76, 96, 36, 18, function () { drawMonitor(76, 96, 36, 18); });  // laptop

    /* ===== RUANG RAPAT — x320-528 y64-176 ===== */
    P(352, 112, 120, 20, function () { drawDeskTop(352, 112, 120); });// meja rapat
    P(336, 68, 34, 30, function () { drawCorkBoard(336, 68); });      // papan pengumuman
    P(488, 96, 32, 46, function () { drawPrinterTable(488, 96); });   // printer

    /* ===== ARSIP — x48-176 y240-352 ===== */
    P(56, 260, 32, 68, function () { drawBookshelf(56, 260); });      // rak arsip
    P(112, 248, 32, 46, function () { drawCabinet(112, 248); });      // lemari arsip

    /* ===== PANTRY — x320-528 y240-352 ===== */
    P(384, 248, 40, 58, function () { drawLockerUnit(384, 248); });   // loker guru
    P(464, 264, 32, 46, function () { drawCabinet(464, 264); });      // kabinet
    P(336, 286, 18, 34, function () { drawDispenser(336, 286); });    // dispenser

    /* ===== pintu ===== */
    P(262, 330, 36, 22, function () { drawDoor(262, 330); });
    return L;
  }

  /* ---------- props KASUS 3: server / panel / gudang / kontrol ---------- */
  function propsServerFire() {
    var L = [];
    function P(x, y, w, h, fn) { L.push({ x: x, y: y, w: w, h: h, fn: fn, s: true }); }

    /* ===== RUANG SERVER UTAMA — x48-256 y64-192 ===== */
    P(56, 72, 40, 48, function () { drawServerRack(56, 72, 40, 48); });
    P(104, 72, 40, 48, function () { drawServerRack(104, 72, 40, 48); });
    P(56, 132, 40, 44, function () { drawServerRack(56, 132, 40, 44); });
    P(104, 132, 40, 44, function () { drawServerRack(104, 132, 40, 44); });
    P(176, 148, 64, 22, function () { drawTerminalDesk(176, 148, 64); }); // terminal

    /* ===== RUANG PANEL — x352-592 y64-192 ===== */
    P(368, 76, 32, 34, function () { drawPanelBox(368, 76, 32, 32); });   // panel alarm
    P(428, 68, 40, 58, function () { drawCoolingUnit(428, 68, 40, 56); });// pendingin
    P(512, 92, 14, 34, function () { drawFireExt(512, 92); });            // pemadam
    P(472, 96, 24, 24, function () { drawCabinet(472, 96); });            // kabinet kecil

    /* ===== GUDANG — x48-208 y256-384 ===== */
    P(64, 296, 40, 48, function () { drawServerRack(64, 296, 40, 48); }); // rak lama
    P(136, 272, 32, 46, function () { drawCabinet(136, 272); });          // kabinet

    /* ===== RUANG KONTROL — x352-592 y256-384 ===== */
    P(368, 300, 48, 42, function () { drawSafeBox(368, 300, 48, 40); });  // vault
    P(440, 286, 80, 22, function () { drawTerminalDesk(440, 286, 80); }); // meja kontrol

    /* ===== pintu ===== */
    P(286, 362, 36, 22, function () { drawDoor(286, 362); });
    return L;
  }

  /* ---------- furniture tiap kasus ---------- */

  var FURN_LIB = [
    { c: 4,  r: 3,  w: 6, h: 2, draw: drawShelfUnit },
    { c: 13, r: 3,  w: 6, h: 2, draw: drawShelfUnit },
    { c: 22, r: 3,  w: 6, h: 2, draw: drawShelfUnit },
    { c: 2,  r: 7,  w: 2, h: 4, draw: drawShelfUnit },
    { c: 30, r: 7,  w: 2, h: 4, draw: drawShelfUnit },
    { c: 2,  r: 18, w: 3, h: 3, draw: drawShelfUnit },
    { c: 30, r: 18, w: 2, h: 3, draw: drawShelfUnit },
    { c: 5,  r: 7,  w: 3, h: 1, draw: drawLibTable },
    { c: 11, r: 7,  w: 3, h: 1, draw: drawLibTable },
    { c: 17, r: 7,  w: 3, h: 1, draw: drawLibTable },
    { c: 23, r: 7,  w: 3, h: 1, draw: drawLibTable },
    { c: 5,  r: 11, w: 3, h: 1, draw: drawLibTable },
    { c: 11, r: 11, w: 3, h: 1, draw: drawLibTable },
    { c: 17, r: 11, w: 3, h: 1, draw: drawLibTable },
    { c: 23, r: 11, w: 3, h: 1, draw: drawLibTable },
    { c: 5,  r: 15, w: 3, h: 1, draw: drawLibTable },
    { c: 11, r: 15, w: 3, h: 1, draw: drawLibTable },
    { c: 17, r: 15, w: 3, h: 1, draw: drawLibTable },
    { c: 23, r: 15, w: 3, h: 1, draw: drawLibTable },
    { c: 6,  r: 17, w: 2, h: 2, draw: drawCardCatalog },
    { c: 9,  r: 17, w: 2, h: 2, draw: drawSafeBox },
    { c: 13, r: 17, w: 3, h: 2, draw: drawLibDesk },
    { c: 27, r: 17, w: 2, h: 3, draw: drawLockerUnit },
    { c: 20, r: 5,  w: 2, h: 2, draw: drawBookCart },
    { c: 24, r: 5,  w: 2, h: 2, draw: drawGlobe },
    { c: 18, r: 18, w: 1, h: 1, draw: drawBinAt },
    { c: 20, r: 18, w: 1, h: 1, draw: drawPlantAt },
    { c: 22, r: 18, w: 1, h: 1, draw: drawDispenserAt }
  ];

  var FURN_SRV = (function () {
    var f = [];
    var cols = [4, 8, 12, 16, 20, 24, 28, 32];
    for (var i = 0; i < cols.length; i++) {
      f.push({ c: cols[i], r: 4,  w: 2, h: 4, draw: drawServerRack });
      f.push({ c: cols[i], r: 11, w: 2, h: 4, draw: drawServerRack });
      if (i % 2 === 0) f.push({ c: cols[i], r: 18, w: 2, h: 3, draw: drawServerRack });
    }
    f.push({ c: 34, r: 9,  w: 2, h: 3, draw: drawCoolingUnit });
    f.push({ c: 15, r: 21, w: 5, h: 1, draw: drawTerminalDesk });
    f.push({ c: 25, r: 21, w: 3, h: 2, draw: drawVaultDoor });
    f.push({ c: 2,  r: 20, w: 2, h: 2, draw: drawPanelBox });
    f.push({ c: 35, r: 20, w: 1, h: 1, draw: drawBinAt });
    f.push({ c: 33, r: 23, w: 1, h: 1, draw: drawPlantAt });
    return f;
  })();

  /* ---------- data kasus ---------- */

  var CASES = [

    /* ================= KASUS 1 — LAB KOMPUTER ================= */
    {
      id: 'c1', no: 'CASE FILE #01', title: 'Rekaman 23.47',
      place: 'LAB KOMPUTER 2', cam: 'CAM 02', loc: 'KORIDOR LANTAI 2',
      mapW: 34, mapH: 24, spawn: { x: 264, y: 344 },
      floor: labFloor, wall: labWall, decor: decorLab, props: propsLab,
      // denah: lorong berbentuk T + 4 ruangan (lab utama, ruang guru, gudang, ruang istirahat)
      plan: {
        rooms: [
          { c: 3,  r: 4,  w: 12, h: 7 },    // LAB KOMPUTER 2 (kiri atas)
          { c: 20, r: 4,  w: 11, h: 7 },    // RUANG GURU (kanan atas)
          { c: 3,  r: 15, w: 9,  h: 6 },    // GUDANG (kiri bawah)
          { c: 20, r: 15, w: 11, h: 6 }     // RUANG ISTIRAHAT (kanan bawah)
        ],
        corridors: [
          { c: 3,  r: 12, w: 28, h: 2 },    // lorong horizontal tengah
          { c: 15, r: 4,  w: 4,  h: 10 },   // lorong vertikal tengah-atas
          { c: 15, r: 15, w: 4,  h: 7 }     // lorong vertikal tengah-bawah
        ],
        doors: [
          { c: 8,  r: 11, w: 2, h: 1 },     // lab -> lorong
          { c: 24, r: 11, w: 2, h: 1 },     // ruang guru -> lorong
          { c: 7,  r: 14, w: 2, h: 1 },     // gudang -> lorong
          { c: 24, r: 14, w: 2, h: 1 },     // istirahat -> lorong
          { c: 16, r: 3,  w: 2, h: 1 }      // lorong atas (buntu / pintu darurat)
        ]
      },
      lights: [
        { x: 120, y: 100, r: 90 }, { x: 400, y: 100, r: 90 },
        { x: 264, y: 200, r: 110 }, { x: 120, y: 290, r: 80 }, { x: 400, y: 290, r: 80 }
      ],
      messages: ['KUNCI DI POT', 'KUNCI LEMARI DI POT', 'AMBIL KUNCI DI POT', 'KUNCI ARSIP DI POT', 'KUNCI ADA DI POT'],
      suspects: [
        { id: 'rian',  name: 'Rian Pratama',   role: 'Siswa XI PPLG 4', initials: 'RP' },
        { id: 'dedi',  name: 'Pak Dedi',       role: 'Teknisi Lab',     initials: 'PD' },
        { id: 'sinta', name: 'Sinta Maharani', role: 'Siswa XI PPLG 4', initials: 'SM' }
      ],
      culprit: 'dedi',
      clueCount: { easy: 2, normal: 2, hard: 3 },
      quest: {
        tool: 'monitor', toolTitle: 'KOMPUTER GURU',
        locks: [
          { at: 'pot', need: null, flag: 'key1', anim: true,
            obj: 'Periksa pot di sudut ruangan', title: 'POT TANAMAN',
            locked: 'Pot besar berisi tanah, cukup berat. Belum ada alasan untuk menggesernya.',
            ready: 'Pesan yang baru kamu buka berbunyi: <code>{plain}</code>. Pot besar di sudut ini kelihatan baru digeser.',
            action: 'Geser pot',
            after: 'Di bawah pot ada <b>kunci kecil</b> dengan label "ARSIP" \u2014 Nayla yang menyembunyikannya.',
            take: 'Ambil kunci',
            done: 'Pot ini sudah kamu geser. Bawahnya kosong sekarang.' },
          { at: 'lemari', need: 'key1', flag: 'evidence', final: true,
            obj: 'Buka lemari arsip', title: 'LEMARI ARSIP',
            locked: 'Terkunci. Lubang kuncinya kecil \u2014 ini butuh kunci fisik, bukan sandi.',
            ready: 'Kunci masuk dengan pas.',
            action: 'Buka lemari',
            after: 'Di dalamnya ada <b>flashdisk</b> berlabel "JANGAN FORMAT \u2014 BUKTI": salinan rekaman CCTV dan catatan penguntit yang Nayla tulis selama seminggu terakhir.',
            take: 'Bawa ke ruang interogasi',
            done: 'Lemari sudah kosong.' }
        ]
      },
      interactables: [
        /* --- LAB KOMPUTER 2 (x48-240 y64-176) --- */
        { id: 'monitor',  x: 94,  y: 124, range: 34, label: 'Pakai alat dekripsi', title: 'KOMPUTER GURU' },
        { id: 'papan',    x: 114, y: 90,  range: 36, label: 'Periksa papan tulis',  title: 'PAPAN TULIS',
          flavor: 'Sisa materi jaringan minggu lalu. Ada tulisan "praktek jumat" yang sudah setengah terhapus.' },
        { id: 'rak',      x: 212, y: 130, range: 34, label: 'Periksa rak buku',      title: 'RAK BUKU',
          flavor: 'Buku manual jaringan berdebu. Satu slot kosong, tapi lapisan debunya rata \u2014 sudah lama.' },
        { id: 'sampah',   x: 63,  y: 166, range: 30, label: 'Periksa tempat sampah', title: 'TEMPAT SAMPAH',
          flavor: 'Bungkus snack, sobekan kertas tugas, dan satu gelas plastik. Tidak ada yang berguna.' },
        { id: 'meja1',    x: 80,  y: 150, range: 28, label: 'Periksa meja siswa',    title: 'MEJA SISWA \u00b7 1',
          flavor: 'Ada tulisan "JANGAN DUDUK SINI" pakai tip-ex. Laci kosong.' },
        { id: 'meja2',    x: 136, y: 150, range: 28, label: 'Periksa meja siswa',    title: 'MEJA SISWA \u00b7 2',
          flavor: 'Serutan pensil dan satu penghapus karet. Monitor masih menyala di halaman login.' },
        { id: 'meja3',    x: 80,  y: 174, range: 28, label: 'Periksa meja siswa',    title: 'MEJA SISWA \u00b7 3',
          flavor: 'Coretan jadwal piket di permukaan meja. Tidak lebih dari itu.' },
        { id: 'meja4',    x: 136, y: 174, range: 28, label: 'Periksa meja siswa',    title: 'MEJA SISWA \u00b7 4',
          flavor: 'Kursinya ditarik agak jauh, seperti ditinggal buru-buru. Tapi tidak ada apa-apa.' },
        { id: 'kabel',    x: 190, y: 210, range: 28, label: 'Periksa kabel lantai',  title: 'KABEL LANTAI',
          flavor: 'Kabel LAN berserakan. Satu ujung lepas, tapi colokannya memang sudah longgar.' },
        /* --- RUANG GURU (x320-496 y64-176) --- */
        { id: 'printer',  x: 352, y: 110, range: 32, label: 'Periksa printer',       title: 'PRINTER',
          flavor: 'Baki kertasnya kosong. Ada sobekan nyangkut di roller, sudah mengering dan menguning.' },
        { id: 'lemari',   x: 440, y: 140, range: 34, label: 'Buka lemari arsip',     title: 'LEMARI ARSIP' },
        { id: 'rakGuru',  x: 352, y: 152, range: 30, label: 'Periksa rak guru',      title: 'RAK GURU',
          flavor: 'Binder administrasi kelas. Semua rapi menurut bulan.' },
        { id: 'papanGuru',x: 473, y: 90,  range: 34, label: 'Periksa papan pengumuman', title: 'PAPAN PENGUMUMAN',
          flavor: 'Jadwal piket dan surat edaran. Tidak ada yang mencurigakan.' },
        /* --- GUDANG (x48-192 y240-336) --- */
        { id: 'pot',      x: 71,  y: 292, range: 32, label: 'Periksa pot tanaman',   title: 'POT TANAMAN' },
        { id: 'dispenser',x: 118, y: 278, range: 30, label: 'Periksa dispenser',     title: 'DISPENSER',
          flavor: 'Galon hampir habis. Cuma tetesan air di lantai, bukan jejak kaki.' },
        { id: 'mop',      x: 167, y: 306, range: 28, label: 'Periksa alat pel',      title: 'ALAT PEL',
          flavor: 'Alat pel bersandar di dinding. Lantainya di sekitarnya masih lembap.' },
        /* --- RUANG ISTIRAHAT (x320-496 y240-336) --- */
        { id: 'sofa1',    x: 352, y: 290, range: 30, label: 'Periksa meja istirahat', title: 'MEJA ISTIRAHAT',
          flavor: 'Cangkir kopi kosong dan bungkus mie instan. Tidak ada yang aneh.' },
        { id: 'sofa2',    x: 416, y: 290, range: 30, label: 'Periksa sofa',          title: 'SOFA LUSUH',
          flavor: 'Bantalnya penyok, seperti baru dipakai tidur. Tidak ada yang tertinggal.' },
        /* --- pintu keluar (lorong bawah) --- */
        { id: 'door',     x: 264, y: 350, range: 40, label: 'Pintu keluar',          title: 'PINTU KELUAR' }
      ],
      clueExclude: { monitor: 1, pot: 1, lemari: 1, door: 1 },
      caps: [
        { t: 1.2,  s: 'Kamera 02 \u2014 koridor lantai dua.' },
        { t: 3.6,  s: 'Pukul 23.41 \u2014 sosok hitam masuk, tangan kosong.' },
        { t: 8.2,  s: 'Pukul 23.47 \u2014 keluar memikul tas besar.' },
        { t: 12.4, s: 'Tas itu tidak pernah keluar. Sama seperti Nayla.' },
        { t: 15.8, s: 'Di laptop lab ditemukan pesan terakhirnya: diketik pukul 23.45 \u2014 terenkripsi.' },
        { t: 20.4, s: 'Nayla mengenkripsinya sendiri \u2014 supaya pelakunya tidak bisa membaca.' }
      ],
      cutScene: cutSceneLab,
      clockBase: 23 * 3600 + 41 * 60 + 7, clockJumpAt: 7.0, clockJumpTo: 23 * 3600 + 47 * 60 + 13,
      boardCaps: [
        { t: 1.2,  s: 'Kartu akses tap masuk 23.40.' },
        { t: 4.4,  s: 'Enam menit kemudian, kamera menangkap tas besar itu keluar.' },
        { t: 9.2,  s: 'Dan satu-satunya yang tidak pulang malam itu... Nayla.' },
        { t: 13.6, s: 'Pesan terakhirnya dia enkripsi sendiri. Dia tahu ada yang menguntit.' },
        { t: 18.4, s: 'Kalau begitu, aku yang harus membacanya. Saatnya turun ke TKP.' }
      ],
      pins: [
        { x: 130, y: 100, kind: 'wajah', label: 'NAYLA' },
        { x: 252, y: 86,  kind: 'tas',   label: 'TAS 23.47' },
        { x: 348, y: 132, kind: 'kartu', label: 'KARTU 23.40' },
        { x: 206, y: 190, kind: 'lab',   label: 'LAB 2' }
      ],
      verdict: {
        win: [
          'Flashdisk itu bukan rekaman biasa \u2014 isinya catatan penguntit, ditulis Nayla selama seminggu.',
          'Kartu akses teknisi tercatat tap masuk pukul 23.40. Tujuh menit kemudian tas itu keluar.',
          'Pak Dedi mengaku pulang pukul 21.00. Tidak ada satu pun yang membenarkannya.',
          'Nayla ditemukan di gudang alat kebersihan. Selamat \u2014 dan dia masih memegang kuncinya.'
        ],
        lose: [
          'Alibi orang yang kamu tuduh berdiri tegak. Tidak ada satu celah pun.',
          'Sementara itu, orang yang benar sudah keluar dari gedung sejak tadi.',
          'Nayla tetap tidak ditemukan malam ini.'
        ]
      },
      ending: {
        win: {
          title: 'Kasus Selesai \u2014 Nayla Ditemukan',
          text: 'Flashdisk Nayla berisi catatan yang menunjuk satu nama: selama seminggu, orang yang sama selalu ada di sekolah setiap dia pulang malam. Dan semalam, kartu akses teknisi tercatat tap masuk pukul 23.40 \u2014 tujuh menit sebelum sosok hitam itu membawa tas besar keluar lewat kamera. Pak Dedi mengaku pulang pukul 21.00. Nayla ditemukan di gudang alat kebersihan dekat rumahnya, selamat dan segera dicek di klinik.'
        },
        lose: {
          title: 'Pelaku Lolos',
          text: 'Alibi orang yang kamu tuduh tidak terbantahkan. Pelakunya menghilang sebelum fajar, dan Nayla tetap tidak ditemukan.'
        }
      }
    },

    /* ================= KASUS 2 — PEMBUNUHAN DI RUANG GURU ================= */
    {
      id: 'c2', no: 'CASE FILE #02', title: 'Jam Terakhir Bu Ratna',
      place: 'RUANG GURU', cam: 'CAM 05', loc: 'SAYAP GURU LANTAI 1',
      mapW: 36, mapH: 26, spawn: { x: 120, y: 152 },
      floor: libFloor, wall: libWall, decor: decorLib, props: propsTeacherRoom,
      plan: {
        rooms: [
          { c: 3,  r: 4,  w: 11, h: 7 },    // RUANG GURU (kiri atas) - TKP
          { c: 20, r: 4,  w: 13, h: 7 },    // RUANG RAPAT (kanan atas)
          { c: 3,  r: 15, w: 8,  h: 7 },    // ARSIP (kiri bawah)
          { c: 20, r: 15, w: 13, h: 7 }     // PANTRY (kanan bawah)
        ],
        corridors: [
          { c: 3,  r: 12, w: 30, h: 2 },
          { c: 15, r: 4,  w: 4,  h: 10 },
          { c: 15, r: 15, w: 4,  h: 8 }
        ],
        doors: [
          { c: 8,  r: 11, w: 2, h: 1 },
          { c: 26, r: 11, w: 2, h: 1 },
          { c: 6,  r: 14, w: 2, h: 1 },
          { c: 26, r: 14, w: 2, h: 1 },
          { c: 16, r: 3,  w: 2, h: 1 }
        ]
      },
      lights: [
        { x: 120, y: 100, r: 88 }, { x: 420, y: 100, r: 92 },
        { x: 280, y: 210, r: 116 }, { x: 110, y: 300, r: 78 }, { x: 420, y: 300, r: 78 }
      ],
      messages: ['KUNCI DI LEMARI ARSIP', 'KUNCI DI ARSIP', 'KUNCI ADA DI LEMARI ARSIP', 'AMBIL KUNCI DI ARSIP'],
      suspects: [
        { id: 'ratna',  name: 'Bu Ratna',        role: 'Guru Matematika',      initials: 'RT' },
        { id: 'yoga',   name: 'Yoga Saputra',    role: 'Siswa XII TKJ 1',      initials: 'YS' },
        { id: 'slamet', name: 'Pak Slamet',      role: 'Petugas Kebersihan',   initials: 'SL' }
      ],
      culprit: 'yoga',
      clueCount: { easy: 3, normal: 3, hard: 4 },
      quest: {
        tool: 'komputer', toolTitle: 'LAPTOP BU RATNA',
        locks: [
          /* 1) Meja korban — titik awal, bukan lemari. Di laci ada kunci kecil. */
          { at: 'mejaKorban', need: null, flag: 'key1', anim: true,
            obj: 'Periksa meja korban', title: 'MEJA BU RATNA',
            locked: 'Meja kerja Bu Ratna. Kopinya masih setengah, kursinya tergeser ke belakang.',
            ready: 'Pesan yang baru kamu buka berbunyi: <code>{plain}</code>. Kamu membuka laci meja itu.',
            action: 'Buka laci meja',
            after: 'Laci pertama berisi alat tulis. Laci kedua — yang terkunci — terbuka dengan kunci kecil yang terselip di bawah tumpukan kertas: <b>kunci loker</b>.',
            take: 'Ambil kunci loker',
            done: 'Laci meja sudah kamu periksa. Sisanya cuma alat tulis.' },

          /* 2) Loker guru — berisi kunci brankas + petunjuk soal jas korban */
          { at: 'loker', need: 'key1', flag: 'key2',
            obj: 'Buka loker guru', title: 'LOKER GURU',
            locked: 'Baris loker besi di pantry. Satu pintu berlabel "R. RATNA".',
            ready: 'Kunci loker masuk dengan pas.',
            action: 'Buka loker',
            after: 'Di dalam loker: <b>kunci brankas</b>, catatan kecil bertulis — "brankas butuh jamnya. Dan jas cadangan ada di lemari arsip, periksa sakunya".',
            take: 'Simpan catatan',
            done: 'Loker sudah kosong. Cuma jas hujan tua di pintu sebelah.' },

          /* 3) Lemari arsip — bukan untuk kunci, tapi untuk JAS korban (kunci ketiga di saku) */
          { at: 'arsip', need: 'key2', flag: 'key3',
            obj: 'Periksa lemari arsip', title: 'LEMARI ARSIP',
            locked: 'Lemari arsip logam di sayap kiri. Pintunya tidak rapat — ada yang memaksanya.',
            ready: 'Kamu ingat catatan di loker: jas cadangan ada di sini.',
            action: 'Buka lemari',
            after: 'Di balik map-map lama ada <b>jas cadangan Bu Ratna</b>. Di saku kanannya, selembar kertas bertuliskan sandi tambahan — dan <b>kunci brankas kedua</b>.',
            take: 'Ambil kunci kedua',
            done: 'Lemari arsip sudah kamu periksa. Sisanya cuma map berdebu.' },

          /* 4) Brankas — bukti akhir, butuh DUA kunci */
          { at: 'brankas', need: 'key3', flag: 'evidence', final: true,
            obj: 'Buka brankas berkas', title: 'BRANKAS BERKAS',
            locked: 'Brankas besi di pantry. Lubang kuncinya dua — satu di kiri, satu di kanan.',
            ready: 'Kedua kunci masuk. Tuasnya berat, tapi berputar.',
            action: 'Buka brankas',
            after: 'Di dalamnya: <b>berkas nilai yang diubah</b> dan satu surat ancaman bertanda tangan — bukan tulisan Bu Ratna.',
            take: 'Bawa ke ruang interogasi',
            done: 'Brankas sudah kosong.' }
        ]
      },
      interactables: [
        /* ===== RUANG GURU (TKP) — c3-13 r4-10 → x48-224 y64-176 ===== */
        // meja korban di (64,88) w88 -> tengah (108,104)
        { id: 'mejaKorban', x: 106, y: 106, range: 34, label: 'Periksa meja korban', title: 'MEJA BU RATNA' },
        // laptop di (80,78) -> (98,90) — alat dekripsi, sedikit di atas meja
        { id: 'komputer', x: 96,  y: 88,  range: 32, label: 'Pakai alat dekripsi', title: 'LAPTOP BU RATNA' },
        // papan tulis (56,70) w116 -> (114,90)
        { id: 'papan',    x: 114, y: 92,  range: 36, label: 'Periksa papan tulis', title: 'PAPAN TULIS',
          flavor: 'Masih ada tulisan fungsi komposisi dari kelas tadi. Satu rumus dilingkari dua kali.' },
        // kursi (160,100) -> (168,116)
        { id: 'jam',      x: 190, y: 74,  range: 40, label: 'Periksa jam dinding', title: 'JAM DINDING',
          setsFlag: 'jam', setsFlagMsg: 'Petunjuk angka dicatat: 16.42',
          flavor: 'Jam berhenti di 16.42 — tepat saat kejadian. Baterainya baru diganti, ini bukan kebetulan. Kamu mencatat angkanya.' },
        { id: 'kursi',    x: 168, y: 118, range: 30, label: 'Periksa kursi korban', title: 'KURSI KORBAN',
          flavor: 'Tergeser jauh dari meja, seperti korban berdiri buru-buru sebelum sesuatu terjadi.' },
        // sampah (64,152) -> (72,166)
        { id: 'sampah',   x: 74,  y: 164, range: 28, label: 'Periksa tempat sampah', title: 'TEMPAT SAMPAH',
          flavor: 'Sobekan kertas, puntung pensil, dan satu gelas plastik kopi yang masih basah.' },
        /* ===== RUANG RAPAT — x320-528 y64-176 ===== */
        // meja rapat (352,96) w120 -> (412,112)
        { id: 'mejaRapat',x: 412, y: 114, range: 34, label: 'Periksa meja rapat',  title: 'MEJA RAPAT',
          flavor: 'Daftar hadir rapat pukul 15.00. Tiga nama, satu tanda tangan beda tinta.' },
        { id: 'printer',  x: 504, y: 112, range: 32, label: 'Periksa printer',     title: 'PRINTER',
          flavor: 'Baki kertasnya kosong. Ada sobekan nyangkut di roller, sudah mengering.' },
        { id: 'cork',     x: 353, y: 90,  range: 34, label: 'Periksa papan pengumuman', title: 'PAPAN PENGUMUMAN',
          flavor: 'Jadwal piket dan edaran. Tidak ada yang mencurigakan.' },
        /* ===== ARSIP — x48-176 y240-352 ===== */
        // rak (56,264) -> (72,296)
        { id: 'rakArsip', x: 72,  y: 296, range: 32, label: 'Periksa rak arsip',   title: 'RAK ARSIP',
          flavor: 'Map-map per tahun ajaran. Satu slot kosong, tapi debunya rata — sudah lama kosong.' },
        // lemari (120,248) -> (136,272)
        { id: 'arsip',    x: 136, y: 274, range: 34, label: 'Periksa lemari arsip', title: 'LEMARI ARSIP' },
        /* ===== PANTRY — x320-528 y240-352 ===== */
        // loker — perabot baru di pantry
        { id: 'loker',    x: 400, y: 274, range: 34, label: 'Buka loker guru',     title: 'LOKER GURU' },
        // brankas
        { id: 'brankas',  x: 480, y: 292, range: 34, label: 'Buka brankas',        title: 'BRANKAS BERKAS' },
        { id: 'dispenser',x: 342, y: 288, range: 28, label: 'Periksa dispenser',   title: 'DISPENSER',
          flavor: 'Galon masih penuh. Tidak ada tetesan di lantai.' },
        { id: 'kopi',     x: 432, y: 272, range: 28, label: 'Periksa mesin kopi',  title: 'MESIN KOPI',
          flavor: 'Saringan kopinya masih lembap. Ada dua cangkir kotor di nampan, bukan satu.' },
        /* ===== pintu ===== */
        { id: 'door',     x: 280, y: 344, range: 40, label: 'Pintu keluar',        title: 'PINTU KELUAR' }
      ],
      clueExclude: { komputer: 1, mejaKorban: 1, arsip: 1, loker: 1, brankas: 1, door: 1 },
      caps: [
        { t: 1.2,  s: 'Kamera 05 \u2014 sayap guru, lantai satu.' },
        { t: 3.6,  s: 'Pukul 16.12 \u2014 Bu Ratna masuk ruang guru sendirian.' },
        { t: 7.4,  s: 'Pukul 16.38 \u2014 seseorang menyusul. Wajahnya tertutup.' },
        { t: 11.8, s: 'Pukul 16.42 \u2014 jam dinding berhenti. Tidak ada yang keluar lewat pintu.' },
        { t: 16.0, s: 'Pukul 16.55 \u2014 orang yang sama keluar. Tangannya membawa map.' },
        { t: 20.8, s: 'Bu Ratna tidak pernah keluar dari ruangan itu.' }
      ],
      cutScene: cutSceneLib,
      clockBase: 16 * 3600 + 12 * 60 + 4, clockJumpAt: 7.0, clockJumpTo: 16 * 3600 + 38 * 60 + 51,
      boardCaps: [
        { t: 1.2,  s: 'Bu Ratna masuk pukul 16.12. Sendirian.' },
        { t: 4.6,  s: 'Dua puluh enam menit kemudian, seseorang menyusul \u2014 wajahnya tertutup.' },
        { t: 9.4,  s: 'Jam dinding berhenti 16.42. Tidak ada yang keluar lewat pintu.' },
        { t: 13.8, s: 'Tapi pukul 16.55, orang yang sama keluar membawa map.' },
        { t: 18.6, s: 'Dan laptop Bu Ratna masih menyala. Dia sempat menulis sesuatu.' }
      ],
      pins: [
        { x: 128, y: 104, kind: 'wajah', label: 'BU RATNA' },
        { x: 250, y: 84,  kind: 'kartu', label: 'JAM 16.42' },
        { x: 352, y: 130, kind: 'buku',  label: 'MAP HILANG' },
        { x: 208, y: 192, kind: 'lab',   label: 'RUANG GURU' }
      ],
      verdict: {
        win: [
          'Berkas di brankas itu daftar nilai yang diubah \u2014 dan surat ancaman bertanda tangan Yoga.',
          'Daftar hadir rapat menunjukkan tanda tangannya dipalsukan: tinta berbeda, dan dia tercatat di dua tempat sekaligus.',
          'Yoga masuk pukul 16.38, empat menit sebelum jam dinding berhenti.',
          'Bu Ratna sempat menulis pesan terakhirnya sebelum itu. Dia sudah menduga.'
        ],
        lose: [
          'Alibi orang yang kamu tuduh terbukti. Dia bahkan tidak ada di gedung saat itu.',
          'Sementara itu, berkas nilai yang diubah tidak pernah ditemukan.',
          'Kasus ini ditutup sebagai kecelakaan.'
        ]
      },
      ending: {
        win: {
          title: 'Kasus Selesai \u2014 Bu Ratna Terbunuh',
          text: 'Brankas di ruang guru menyimpan daftar nilai yang diubah dan surat ancaman bertanda tangan Yoga Saputra. Daftar hadir rapat menunjukkan tanda tangannya dipalsukan \u2014 tinta berbeda, dan namanya tercatat di dua tempat pada jam yang sama. Dia masuk pukul 16.38, empat menit sebelum jam dinding berhenti. Bu Ratna sempat menulis pesan terakhirnya di laptop sebelum itu: dia sudah menduga ada yang tidak beres dengan nilai kelasnya.'
        },
        lose: {
          title: 'Pelaku Lolos',
          text: 'Alibi orang yang kamu tuduh terbukti. Berkas nilai yang diubah tidak pernah ditemukan, dan kasus ini ditutup sebagai kecelakaan.'
        }
      }
    },

    /* ================= KASUS 3 — PEMBAKARAN SENGAJA ================= */
    {
      id: 'c3', no: 'CASE FILE #03', title: 'Api di Ruang Server',
      place: 'RUANG SERVER', cam: 'CAM 09', loc: 'RUANG SERVER LT. 3',
      mapW: 42, mapH: 28, spawn: { x: 136, y: 168 },
      floor: srvFloor, wall: srvWall, decor: decorSrv, props: propsServerFire,
      plan: {
        rooms: [
          { c: 3,  r: 4,  w: 13, h: 8 },    // RUANG SERVER UTAMA (kiri atas) - TKP
          { c: 22, r: 4,  w: 15, h: 8 },    // RUANG PANEL (kanan atas)
          { c: 3,  r: 16, w: 10, h: 8 },    // GUDANG PERANGKAT (kiri bawah)
          { c: 22, r: 16, w: 15, h: 8 }     // RUANG KONTROL (kanan bawah)
        ],
        corridors: [
          { c: 3,  r: 13, w: 34, h: 2 },
          { c: 17, r: 4,  w: 4,  h: 11 },
          { c: 17, r: 16, w: 4,  h: 9 }
        ],
        doors: [
          { c: 8,  r: 12, w: 2, h: 1 },
          { c: 28, r: 12, w: 2, h: 1 },
          { c: 6,  r: 15, w: 2, h: 1 },
          { c: 28, r: 15, w: 2, h: 1 },
          { c: 18, r: 3,  w: 2, h: 1 }
        ]
      },
      lights: [
        { x: 130, y: 100, r: 92 }, { x: 450, y: 100, r: 96 },
        { x: 328, y: 224, r: 120 }, { x: 110, y: 320, r: 84 }, { x: 450, y: 320, r: 84 }
      ],
      messages: ['KUNCI DI PANEL', 'KUNCI ADA DI PANEL', 'AMBIL KUNCI DI PANEL', 'KUNCI CADANGAN DI PANEL'],
      suspects: [
        { id: 'bagas',  name: 'Mas Bagas',    role: 'Admin Jaringan',  initials: 'BG' },
        { id: 'hendra', name: 'Pak Hendra',   role: 'Guru TKJ',        initials: 'HD' },
        { id: 'dinda',  name: 'Dinda Ayu',    role: 'Siswa XII TKJ 2', initials: 'DA' }
      ],
      culprit: 'hendra',
      clueCount: { easy: 3, normal: 4, hard: 4 },
      quest: {
        tool: 'terminal', toolTitle: 'TERMINAL KONTROL',
        locks: [
          { at: 'pemadam', need: null, flag: 'ext', anim: false,
            obj: 'Ambil tabung pemadam', title: 'TABUNG PEMADAM',
            locked: 'Tabung pemadam di dinding. Segelnya masih utuh \u2014 tidak pernah dipakai malam itu.',
            ready: 'Pesan yang baru kamu buka berbunyi: <code>{plain}</code>. Kamu melepas tabungnya dari dudukan.',
            action: 'Ambil tabung',
            after: 'Tabung pemadam terlepas dari dudukan. Berat, tapi bisa dibawa.',
            take: 'Bawa tabung',
            done: 'Dudukan tabung sudah kosong.' },
          { at: 'bekas', need: 'ext', flag: 'fireout', anim: true,
            obj: 'Padamkan api di lantai', title: 'API DI LANTAI',
            locked: 'Api masih menyala di lantai, memblokir jalan ke ruang kontrol. Kamu butuh pemadam.',
            ready: 'Kamu menyemprotkan isi tabung ke titik api.',
            action: 'Semprot pemadam',
            after: 'Api padam. Di bawah jelaga, lantainya menunjukkan pola aneh: lingkaran bekas bahan bakar \u2014 bukan korsleting.',
            take: 'Periksa bekasnya',
            done: 'Api sudah padam. Bekas lingkarannya masih jelas.' },
          { at: 'panel', need: 'fireout', flag: 'key1',
            obj: 'Buka panel alarm', title: 'PANEL ALARM',
            locked: 'Panel alarm di ruang panel. Bautnya masih rapat \u2014 tapi ada goresan baru di sekelilingnya.',
            ready: 'Jalan sudah aman. Panel ini jelas baru dibuka-tutup: bautnya mengkilap.',
            action: 'Buka panel alarm',
            after: 'Di dalam panel: kabel sensor yang <b>diputus</b>, dan terselip <b>kunci kartu</b> bertanda "RAK B".',
            take: 'Ambil kunci kartu',
            done: 'Panel sudah kamu buka. Kabel sensornya masih terputus.' },
          { at: 'rakB', need: 'key1', flag: 'key2',
            obj: 'Buka rak server B', title: 'RAK SERVER B',
            locked: 'Rak server terkunci. Pembaca kartunya berkedip merah \u2014 tidak ada catatan akses.',
            ready: 'Kartu itu pas. Lampu pembaca berubah hijau.',
            action: 'Tempel kartu',
            after: 'Di dalam rak: <b>kunci tabung</b>, dan sisa <b>kain berminyak</b> terselip di celah rak.',
            take: 'Ambil kunci tabung',
            done: 'Rak B sudah terbuka. Servernya hangus di bagian belakang.' },
          { at: 'cooling', need: 'key2', flag: 'key3',
            obj: 'Buka unit pendingin', title: 'UNIT PENDINGIN',
            locked: 'Unit pendingin besar. Baut penutupnya butuh kunci tabung.',
            ready: 'Kunci tabung masuk ke dua baut penutup.',
            action: 'Buka penutup',
            after: 'Di balik penutup: <b>kunci induk</b>, dan <b>botol akseleran</b> yang disembunyikan di sela sirip pendingin.',
            take: 'Ambil kunci induk',
            done: 'Unit pendingin sudah kamu tutup lagi. Bau bahan bakar masih terasa.' },
          { at: 'vault', need: 'key3', flag: 'evidence', final: true,
            obj: 'Buka vault bukti', title: 'VAULT BUKTI',
            locked: 'Pintu besi setebal dua jari. Ada slot kunci induk di samping dial.',
            ready: 'Kunci induk masuk. Dial berputar, bautnya mundur satu per satu.',
            action: 'Buka vault',
            after: 'Di dalam vault: <b>log alarm</b> yang dicetak sebelum diputus, dan <b>rekaman CCTV</b> yang sempat disalin. Keduanya menunjuk satu jam: 23.12.',
            take: 'Bawa ke ruang interogasi',
            done: 'Vault sudah kosong.' }
        ]
      },
      interactables: [
        { id: 'rakA',     x: 76,  y: 96,  range: 32, label: 'Periksa rak server A', title: 'RAK SERVER A',
          flavor: 'Delapan unit server, semuanya hangus di sisi belakang. Kerangkanya masih panas.' },
        { id: 'rakB',     x: 140, y: 96,  range: 34, label: 'Periksa rak server B', title: 'RAK SERVER B' },
        { id: 'rakC',     x: 76,  y: 156, range: 32, label: 'Periksa rak server C', title: 'RAK SERVER C',
          flavor: 'Kipasnya meleleh. Debu di filter menghitam \u2014 bukan debu biasa, ini jelaga.' },
        { id: 'rakD',     x: 140, y: 156, range: 32, label: 'Periksa rak server D', title: 'RAK SERVER D',
          flavor: 'Satu unit mati total. Kabelnya masih terpasang rapi, tapi konektornya meleleh.' },
        { id: 'terminal', x: 216, y: 162, range: 34, label: 'Pakai alat dekripsi', title: 'TERMINAL KONTROL' },
        { id: 'bekas',    x: 128, y: 172, range: 30, label: 'Periksa lantai',       title: 'API DI LANTAI' },
        { id: 'panel',    x: 384, y: 98,  range: 34, label: 'Periksa panel alarm',  title: 'PANEL ALARM' },
        { id: 'cooling',  x: 452, y: 100, range: 34, label: 'Periksa unit pendingin', title: 'UNIT PENDINGIN' },
        { id: 'pemadam',  x: 520, y: 96,  range: 32, label: 'Periksa tabung pemadam', title: 'TABUNG PEMADAM' },
        { id: 'sensor',   x: 400, y: 72,  range: 34, label: 'Periksa panel sensor', title: 'PANEL SENSOR',
          flavor: 'Sensor suhu dan asap. Catatannya berhenti pukul 23.11 \u2014 satu menit sebelum api.' },
        { id: 'jam',      x: 496, y: 72,  range: 34, label: 'Periksa jam digital', title: 'JAM DIGITAL',
          flavor: 'Menunjukkan 23.58, masih berjalan. Ini jam yang tidak bisa dipalsukan.' },
        { id: 'binPanel', x: 560, y: 168, range: 28, label: 'Periksa tempat sampah', title: 'TEMPAT SAMPAH',
          flavor: 'Sobekan kabel, isolasi bekas, dan sarung tangan karet sekali pakai.' },
        { id: 'rakLama',  x: 84,  y: 320, range: 32, label: 'Periksa rak lama',    title: 'RAK LAMA',
          flavor: 'Rak tua yang sudah tidak dipakai. Debu di depannya tidak tersentuh.' },
        { id: 'kardus',   x: 152, y: 300, range: 30, label: 'Periksa kardus',      title: 'KARDUS BEKAS',
          flavor: 'Kardus bekas unit server. Sudah dilipat rapi, tidak ada isinya.' },
        { id: 'tangga',   x: 84,  y: 352, range: 28, label: 'Periksa tangga',      title: 'TANGGA LIPAT',
          flavor: 'Tangga lipat untuk menjangkau rak atas. Debu di pijakannya tipis \u2014 baru dipakai.' },
        { id: 'jerigen',  x: 152, y: 348, range: 30, label: 'Periksa jerigen',     title: 'JERIGEN KOSONG',
          flavor: 'Jerigen plastik kosong. Tutupnya terbuka, dan baunya menyengat \u2014 bukan air.' },
        { id: 'vault',    x: 392, y: 326, range: 34, label: 'Buka vault',          title: 'VAULT BUKTI' },
        { id: 'mejaKontrol', x: 480, y: 306, range: 32, label: 'Periksa meja kontrol', title: 'MEJA KONTROL',
          flavor: 'Monitor pemantauan, semuanya mati. Satu keyboard-nya berlubang bekas terbakar.' },
        { id: 'cctv',     x: 552, y: 296, range: 32, label: 'Periksa kamera CCTV', title: 'KAMERA CCTV',
          flavor: 'Kamera 09. Lampu rekamnya mati. Kabelnya tertekuk \u2014 diputar ke dinding sebelum api.' },
        { id: 'ac',       x: 552, y: 340, range: 32, label: 'Periksa AC',          title: 'AC RUANG SERVER',
          flavor: 'AC presisi, setelan 18 derajat. Filternya menghitam, sama seperti rak.' },
        { id: 'kabel',    x: 320, y: 300, range: 28, label: 'Periksa kabel lantai', title: 'KABEL LANTAI',
          flavor: 'Kabel daya di bawah raised floor. Semua masih terpasang, tidak ada yang dicabut.' },
        { id: 'door',     x: 304, y: 368, range: 40, label: 'Pintu keluar',        title: 'PINTU KELUAR' }
      ],
      clueExclude: { terminal: 1, pemadam: 1, bekas: 1, panel: 1, rakB: 1, cooling: 1, vault: 1, door: 1 },
      caps: [
        { t: 1.2,  s: 'Kamera 09 \u2014 ruang server, lantai tiga.' },
        { t: 3.4,  s: 'Pukul 23.08 \u2014 semua rak normal. Lampu hijau, suhu stabil.' },
        { t: 7.6,  s: 'Pukul 23.12 \u2014 satu sosok berdiri di panel alarm. Tangannya di dalam panel.' },
        { t: 11.8, s: 'Pukul 23.13 \u2014 kabel sensor diputus. Alarm ruangan mati.' },
        { t: 16.2, s: 'Pukul 23.19 \u2014 api muncul dari lantai, bukan dari rak. Titiknya di tengah ruangan.' },
        { t: 20.8, s: 'Api tidak berasal dari korsleting. Ada yang menuangkannya.' }
      ],
      cutScene: cutSceneSrv,
      clockBase: 23 * 3600 + 8 * 60 + 2, clockJumpAt: 7.0, clockJumpTo: 23 * 3600 + 12 * 60 + 26,
      boardCaps: [
        { t: 1.2,  s: 'Api mulai dari lantai, bukan dari rak. Titiknya di tengah ruangan.' },
        { t: 4.6,  s: 'Tapi alarm tidak berbunyi. Kabel sensornya diputus pukul 23.13.' },
        { t: 9.2,  s: 'Siapa pun yang memutus itu tahu persis panel mana yang harus dibuka.' },
        { t: 13.6, s: 'Dan api bukan korsleting \u2014 ada botol akseleran di sela pendingin.' },
        { t: 18.4, s: 'Ini bukan kecelakaan. Ini pembakaran, dan pelakunya masih di gedung.' }
      ],
      pins: [
        { x: 126, y: 102, kind: 'wajah', label: 'TERSANGKA' },
        { x: 250, y: 84,  kind: 'tas',   label: 'API 23.19' },
        { x: 352, y: 130, kind: 'kartu', label: 'ALARM 23.13' },
        { x: 208, y: 192, kind: 'lab',   label: 'RUANG SERVER' }
      ],
      verdict: {
        win: [
          'Log alarm yang dicetak sebelum diputus: panel dibuka pukul 23.12 \u2014 bukan dipaksa, tapi dibuka.',
          'Hanya tiga orang yang tahu urutan kabel di panel itu. Dua sudah pulang lebih awal.',
          'Botol akseleran di sela pendingin masih berlabel inventaris lab TKJ.',
          'Pak Hendra memutus alarm, lalu menuangkan bahan bakar. Dia lupa satu hal: log alarm tercetak otomatis.'
        ],
        lose: [
          'Alibi orang yang kamu tuduh didukung dua saksi. Dia bahkan tidak ada di lantai tiga.',
          'Sementara itu, botol akseleran itu sudah hilang dari lokasi.',
          'Kasus ini ditutup sebagai korsleting listrik.'
        ]
      },
      ending: {
        win: {
          title: 'Kasus Selesai \u2014 Pembakaran Terbongkar',
          text: 'Log alarm yang tercetak sebelum kabelnya diputus menunjukkan panel dibuka pukul 23.12 \u2014 dibuka dengan kunci, bukan dipaksa. Hanya tiga orang yang tahu urutan kabel di panel itu, dan dua di antaranya sudah pulang lebih awal dengan alibi yang kuat. Botol akseleran yang disembunyikan di sela unit pendingin masih berlabel inventaris lab TKJ. Pak Hendra memutus alarm untuk mengelabui penyelidikan, lalu menuangkan bahan bakar ke lantai. Dia lupa satu hal: log alarm tercetak otomatis begitu panel dibuka.'
        },
        lose: {
          title: 'Pelaku Lolos',
          text: 'Alibi orang yang kamu tuduh didukung dua saksi. Botol akseleran hilang dari lokasi, dan kasus ini ditutup sebagai korsleting listrik.'
        }
      }
    }
  ];

  /* ---------- muat kasus ---------- */

  function loadCase(idx) {
    var c = CASES[idx] || CASES[0];
    CUR = c;
    MAP_W = c.mapW;
    MAP_H = c.mapH;
    WORLD_W = MAP_W * T;
    WORLD_H = MAP_H * T;
    // denah ruangan (lorong + banyak ruangan) atau grid lama
    if (c.plan) {
      grid = makeFloorPlan(MAP_W, MAP_H, c.plan.rooms, c.plan.doors, c.plan.corridors, c.spawn);
    } else {
      grid = makeGrid(MAP_W, MAP_H, c.furniture || []);
    }
    // COLLISION DARI FOOTPRINT PERABOT — satu sumber data untuk gambar & tabrakan
    var propsNow = c.props ? c.props() : [];
    for (var pi2 = 0; pi2 < propsNow.length; pi2++) {
      var pr = propsNow[pi2];
      if (pr.s === false) continue;
      var c0 = Math.floor(pr.x / T), c1 = Math.ceil((pr.x + (pr.w || 0)) / T);
      var r0 = Math.floor(pr.y / T), r1 = Math.ceil((pr.y + (pr.h || 0)) / T);
      for (var rr2 = r0; rr2 < r1; rr2++) {
        for (var cc2 = c0; cc2 < c1; cc2++) {
          if (grid[rr2] && cc2 >= 0 && cc2 < MAP_W) grid[rr2][cc2] = 2;
        }
      }
    }
    if (c.furniture) {
      for (var fi = 0; fi < c.furniture.length; fi++) {
        var d = c.furniture[fi];
        for (var rr2 = d.r; rr2 < d.r + d.h; rr2++) {
          for (var cc2 = d.c; cc2 < d.c + d.w; cc2++) {
            if (grid[rr2] && cc2 >= 0 && cc2 < MAP_W) grid[rr2][cc2] = 2;
          }
        }
      }
    }
    if (c.walls) {
      for (var i = 0; i < c.walls.length; i++) {
        var q = c.walls[i];
        for (var rr = q[1]; rr <= q[3]; rr++) {
          for (var cc = q[0]; cc <= q[2]; cc++) {
            if (grid[rr] && cc >= 0 && cc < MAP_W) grid[rr][cc] = 2;
          }
        }
      }
    }
    INTERACTABLES = c.interactables;
    LIGHTS = c.lights;
    // titik interaksi menempel ke lantai terdekat yang valid
    (function () {
      var sp0 = c.spawn;
      var sc0 = Math.floor(sp0.x / T), sr0 = Math.floor(sp0.y / T);
      if (!grid[sr0] || grid[sr0][sc0] !== 0) {
        // spawn juga dipindah ke LANTAI KOSONG terdekat (val 0, bukan perabot)
        var bestS = null, bdS = 1e9;
        for (var rr3 = 1; rr3 < MAP_H - 1; rr3++) {
          for (var cc3 = 1; cc3 < MAP_W - 1; cc3++) {
            if (grid[rr3][cc3] !== 0) continue;
            var dd = Math.hypot(cc3 - sc0, rr3 - sr0);
            if (dd < bdS) { bdS = dd; bestS = [cc3, rr3]; }
          }
        }
        if (bestS) { c.spawn = { x: bestS[0] * T + T / 2, y: bestS[1] * T + T / 2 }; }
      }
      // BFS dari spawn
      var seen2 = {};
      var q2 = [[Math.floor(c.spawn.x / T), Math.floor(c.spawn.y / T)]];
      seen2[q2[0].join(',')] = 1;
      var dirs2 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      while (q2.length) {
        var cu2 = q2.shift();
        for (var d2 = 0; d2 < 4; d2++) {
          var nc2 = cu2[0] + dirs2[d2][0], nr2 = cu2[1] + dirs2[d2][1];
          var k2 = nc2 + ',' + nr2;
          if (seen2[k2] || nc2 < 0 || nr2 < 0 || nc2 >= MAP_W || nr2 >= MAP_H) continue;
          if (grid[nr2][nc2] !== 0) continue;
          seen2[k2] = 1; q2.push([nc2, nr2]);
        }
      }
      snapInteractables(seen2);
    })();
    var hp = $('hud-place');
    if (hp) hp.innerHTML = 'TKP &middot; ' + c.place;
    return c;
  }

  function placeClues() {
    var pool = [], ex = (CUR && CUR.clueExclude) || {};
    for (var i = 0; i < INTERACTABLES.length; i++) {
      if (!ex[INTERACTABLES[i].id]) pool.push(INTERACTABLES[i].id);
    }
    for (var j = pool.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var t = pool[j]; pool[j] = pool[k]; pool[k] = t;
    }
    state.clueMap = {};
    for (var c = 0; c < CASE.clues.length; c++) state.clueMap[pool[c]] = CASE.clues[c];
  }

  // geser titik interaksi ke tile lantai terdekat yang BISA dicapai —
  // dipanggil setelah collision dibangun, jadi titik interaksi selalu valid
  function snapInteractables(seen) {
    // kumpulkan semua tile reachable sekali
    var tiles = [];
    for (var key in seen) {
      var parts = key.split(',');
      tiles.push([+parts[0], +parts[1]]);
    }
    for (var i = 0; i < INTERACTABLES.length; i++) {
      var it = INTERACTABLES[i];
      var best = null, bd = 1e9;
      for (var t = 0; t < tiles.length; t++) {
        var wx = tiles[t][0] * T + T / 2, wy = tiles[t][1] * T + T / 2 + 6;
        var d = Math.hypot(wx - it.x, wy - it.y);
        if (d < bd) { bd = d; best = { x: wx, y: wy, d: d }; }
      }
      if (best) {
        it.ox = it.x; it.oy = it.y;
        it.x = best.x; it.y = best.y;
        // objek jauh dari perabotnya -> perbesar range biar tetap bisa diinteraksi
        if (best.d > (it.range || 30)) it.range = Math.ceil(best.d) + 18;
      }
    }
  }

  function propById(id) {
    for (var i = 0; i < INTERACTABLES.length; i++) if (INTERACTABLES[i].id === id) return INTERACTABLES[i];
    return null;
  }

  /* =========================================================
     4. SPRITE PEMAIN (16 x 24)
     ========================================================= */
  var SPR_DOWN = [
    '.....tttttt.....',
    '....tttttttt....',
    '...tttttttttt...',
    '..tttttttttttt..',
    '.tttttttttttttt.',
    '....ssssssss....',
    '....sesssses....',
    '....ssssssss....',
    '....ssssssss....',
    '...cccccccccc...',
    '..cccccccccccc..',
    '.ccCccccccccCcc.',
    '.ccCccccccccCcc.',
    '.cccccccccccccc.',
    '.cccccccccccccc.',
    '..cccccccccccc..',
    '..cccccccccccc..',
    '...cccccccccc...',
    '...pppppppppp...',
    '...pppppppppp...',
    '...pppp..pppp...',
    '...pppp..pppp...',
    '...oooo..oooo...',
    '...oooo..oooo...'
  ];
  var SPR_UP = [
    '.....tttttt.....',
    '....tttttttt....',
    '...tttttttttt...',
    '..tttttttttttt..',
    '.tttttttttttttt.',
    '....tttttttt....',
    '....tttttttt....',
    '....tttttttt....',
    '....tttttttt....',
    '...cccccccccc...',
    '..cccccccccccc..',
    '.ccCccccccccCcc.',
    '.ccCccccccccCcc.',
    '.cccccccccccccc.',
    '.cccccccccccccc.',
    '..cccccccccccc..',
    '..cccccccccccc..',
    '...cccccccccc...',
    '...pppppppppp...',
    '...pppppppppp...',
    '...pppp..pppp...',
    '...pppp..pppp...',
    '...oooo..oooo...',
    '...oooo..oooo...'
  ];
  var SPR_SIDE = [
    '.....tttttt.....',
    '....tttttttt....',
    '...tttttttttt...',
    '..tttttttttttt..',
    '.tttttttttttttt.',
    '.....ssssssss...',
    '.....sssssses...',
    '.....ssssssss...',
    '.....ssssssss...',
    '....ccccccccc...',
    '...cccccccccc...',
    '..cCccccccccc...',
    '..cCccccccccc...',
    '..ccccccccccc...',
    '..ccccccccccc...',
    '...ccccccccc....',
    '...ccccccccc....',
    '...ccccccccc....',
    '...pppppppp.....',
    '...pppppppp.....',
    '...pppppppp.....',
    '....pppp.ppp....',
    '...oooo..ooo....',
    '...oooo..ooo....'
  ];

  var PAL = {
    '.': null,
    't': '#3a2a18',                     // fedora
    's': '#e8b48a',                     // kulit
    'e': '#14181f',                     // mata
    'c': '#8a7455', 'C': '#6e5c42',     // mantel khaki
    'p': '#2a2d38',                     // celana
    'o': '#12141b'                      // sepatu
  };


  /* =========================================================
     5. STATE
     ========================================================= */
  var state = { collected: {}, score: 1000, found: {}, clueMap: {},
                decrypted: false, potSlid: false, keyFound: false,
                flags: {}, caseId: 0, accused: {},
                win: false, picked: null };
  var potAnim = 0;   // 0..1 animasi pot digeser
  var player = { x: 216, y: 240, dir: 'down', moving: false, anim: 0 };
  var cam = { x: 0, y: 0 };
  var keys = {};
  var dialogOpen = false;
  var lastTs = 0;
  var activeScreen = 'scr-title';
  var dust = [];
  var t0 = 0;

  /* =========================================================
     6. DOM
     ========================================================= */
  function $(id) { return document.getElementById(id); }
  var cv = $('cv');
  var ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  var cellsEl = $('cells');
  var workEl = $('work');
  var toastEl = $('toast');
  var modalEl = $('modal');
  var dialogEl = $('dialog');
  var promptEl = $('prompt');

  /* =========================================================
     7. HELPERS GAMBAR
     ========================================================= */
  function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); }
  function shadow(x, y, w, h) { R(x, y, w, h, 'rgba(0,0,0,.30)'); }

  function drawSprite(rows, x, y, flip, pal) {
    var P = pal || PAL;
    for (var r = 0; r < rows.length; r++) {
      var line = rows[r];
      for (var c = 0; c < line.length; c++) {
        var col = P[line[c]];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(flip ? (x + line.length - 1 - c) : (x + c), y + r, 1, 1);
      }
    }
  }

  /* ---------- lantai & tembok ---------- */
  function drawFloorTile(c, r, x, y) {
    R(x, y, T, T, FLOOR_SHADE[(c * 7 + r * 13) % 3]);
    R(x, y, T, 1, 'rgba(0,0,0,.12)');
    R(x, y, 1, T, 'rgba(0,0,0,.12)');
    if ((c * 31 + r * 17) % 6 === 0) R(x + 7, y + 10, 2, 1, 'rgba(255,255,255,.025)');
    if ((c * 13 + r * 29) % 9 === 0) R(x + 4, y + 5, 1, 1, 'rgba(255,255,255,.03)');
  }

  function drawWallTile(c, r, x, y) {
    R(x, y, T, T, '#1e2731');
    R(x, y + 7, T, 1, 'rgba(0,0,0,.22)');
    if ((c + r) % 2 === 0) R(x + 3, y, 1, 7, 'rgba(0,0,0,.16)');
    else R(x + 11, y + 8, 1, 7, 'rgba(0,0,0,.16)');
    if (r === 2) {
      R(x, y + T - 4, T, 4, '#2b3746');
      R(x, y + T - 4, T, 1, '#3a4a5e');
    }
    if (r === 0) R(x, y, T, 2, '#141b23');
  }

  /* ---------- properti ---------- */
  function drawDeskTop(x, y, w) {
    R(x + 1, y + 13, w, 3, 'rgba(0,0,0,.32)');   // bayangan
    R(x, y, w, 10, '#4a3826');                   // permukaan
    R(x, y, w, 2, '#5f4a33');                    // highlight
    R(x, y + 10, w, 5, '#33261a');               // muka depan
    R(x + 2, y + 11, w - 4, 2, '#3d2d1f');
  }

  function drawMonitor(x, y, w, h) {
    R(x, y + h - 2, w, 2, '#20262f');
    R(x, y, w, h - 2, '#0a0d12');
    R(x + 1, y + 1, w - 2, h - 4, '#16283f');
    var glow = 0.55 + 0.25 * Math.sin(t0 * 2.2);
    ctx.globalAlpha = glow;
    R(x + 2, y + 2, Math.floor(w * 0.45), 1, '#7fb8ee');
    R(x + 2, y + 4, Math.floor(w * 0.7), 1, '#4f7fae');
    ctx.globalAlpha = 1;
  }

  function drawChair(x, y) {
    R(x, y + 10, 12, 2, 'rgba(0,0,0,.28)');
    R(x, y, 12, 10, '#243040');
    R(x, y, 12, 3, '#33455c');
    R(x + 1, y + 10, 10, 2, '#1a2330');
  }

  function drawTeacherDesk() {
    drawDeskTop(176, 80, 48);
    drawMonitor(190, 68, 18, 15);
    R(212, 84, 6, 5, '#d8dde4');
    R(213, 85, 4, 1, '#9aa6b4');
    R(204, 86, 5, 4, '#c9d3de');
  }

  function drawStudentDesk(x, y) {
    drawDeskTop(x, y, 32);
    drawMonitor(x + 11, y - 7, 10, 8);
    R(x + 24, y + 3, 4, 4, '#d8dde4');
  }

  function drawCabinet(px, py) {
    var x = (px === undefined) ? 352 : px, y = (py === undefined) ? 48 : py;
    var locked = !state.flags.key1;
    R(x, y + 46, 32, 4, 'rgba(0,0,0,.35)');
    R(x, y, 32, 5, '#2f4d70');
    R(x, y + 5, 32, 41, '#1d3552');
    for (var i = 0; i < 3; i++) {
      var sy = y + 8 + i * 13;
      R(x + 3, sy, 26, 10, '#25405f');
      R(x + 3, sy, 26, 1, '#325476');
      R(x + 13, sy + 4, 8, 2, '#4d7296');
    }
    R(x, y + 45, 32, 2, '#12202f');
    R(x, y + 5, 1, 41, '#16283c');
    R(x + 31, y + 5, 1, 41, '#16283c');
    if (locked) {
      R(x + 10, y + 18, 13, 11, '#f2b544');
      R(x + 13, y + 21, 7, 6, '#0d1118');
      R(x + 9, y + 15, 15, 4, '#f2b544');
    } else {
      ctx.globalAlpha = 0.18;
      R(x, y + 5, 32, 41, '#46c98b');
      ctx.globalAlpha = 1;
    }
  }

  function drawPrinterTable(px, py) {
    var x = (px === undefined) ? 320 : px, y = (py === undefined) ? 50 : py;
    R(x, y + 44, 32, 3, 'rgba(0,0,0,.32)');
    R(x, y + 14, 32, 10, '#4a3826');
    R(x, y + 14, 32, 2, '#5f4a33');
    R(x, y + 24, 32, 20, '#33261a');
    R(x + 2, y + 28, 28, 12, '#3d2d1f');
    R(x + 6, y + 32, 20, 3, '#2b2015');
    R(x + 4, y + 4, 24, 12, '#2b3440');
    R(x + 4, y + 4, 24, 3, '#3a4656');
    R(x + 7, y + 8, 18, 5, '#d8dde4');
    R(x + 7, y + 8, 18, 1, '#eef2f7');
    R(x + 10, y, 12, 5, '#d8dde4');
  }

  function drawFireExt(px, py) {
    var x = px, y = py;
    R(x + 2, y + 28, 12, 3, 'rgba(0,0,0,.32)');
    R(x + 3, y + 4, 10, 26, '#8c2b22');       // tabung
    R(x + 3, y + 4, 10, 2, '#a8382c');
    R(x + 3, y + 12, 10, 2, '#6e211a');
    R(x + 3, y + 20, 10, 2, '#6e211a');
    R(x + 5, y, 6, 5, '#2a2a2a');             // kepala
    R(x + 12, y + 6, 6, 2, '#3a3a3a');        // selang
    R(x + 16, y + 6, 2, 6, '#3a3a3a');
    R(x + 5, y + 9, 6, 3, '#e8e2d2');         // label
  }

  function drawLockerUnit(px, py) {
    var x = px, y = py;
    R(x, y + 56, 40, 4, 'rgba(0,0,0,.34)');
    R(x, y, 40, 56, '#2a3440');
    R(x, y, 40, 2, '#3a4656');
    // 2 pintu
    R(x + 2, y + 4, 17, 50, '#333f4d');
    R(x + 21, y + 4, 17, 50, '#333f4d');
    R(x + 2, y + 4, 17, 1, '#455364');
    R(x + 21, y + 4, 17, 1, '#455364');
    // ventilasi
    for (var i = 0; i < 3; i++) {
      R(x + 5, y + 8 + i * 3, 11, 1, '#212a34');
      R(x + 24, y + 8 + i * 3, 11, 1, '#212a34');
    }
    // handle
    R(x + 15, y + 28, 3, 6, '#8a99ad');
    R(x + 22, y + 28, 3, 6, '#8a99ad');
    // label
    R(x + 5, y + 44, 11, 5, '#d8dde4');
    R(x + 24, y + 44, 11, 5, '#d8dde4');
  }

  function drawCorkBoard(px, py) {
    var x = (px === undefined) ? 272 : px, y = (py === undefined) ? 8 : py;
    R(x, y, 34, 30, '#39465a');
    R(x + 1, y + 1, 32, 28, '#8a6a45');
    R(x + 4, y + 5, 10, 8, '#e8e2d2');
    R(x + 18, y + 4, 11, 10, '#d8e0e8');
    R(x + 5, y + 17, 12, 7, '#e8d8c8');
    R(x + 20, y + 17, 8, 8, '#c9d3de');
    R(x + 9, y + 8, 1, 1, '#c0392b');
    R(x + 23, y + 8, 1, 1, '#2b6ea8');
  }

  function drawAC() {
    R(384, 12, 30, 12, '#c9d3de');
    R(384, 12, 30, 3, '#dfe6ee');
    R(386, 17, 26, 2, '#9aa6b4');
    R(386, 21, 26, 1, '#9aa6b4');
  }

  function drawMop(px, py) {
    var x = (px === undefined) ? 400 : px, y = (py === undefined) ? 148 : py;
    R(x, y + 28, 14, 3, 'rgba(0,0,0,.28)');
    R(x + 2, y + 12, 10, 16, '#4a5a6a');
    R(x + 2, y + 12, 10, 3, '#5d7183');
    R(x + 5, y, 3, 14, '#8a6a45');
    R(x + 4, y + 26, 6, 3, '#3a4756');
  }

  function drawRug(px, py) {
    var x = (px === undefined) ? 98 : px, y = (py === undefined) ? 114 : py;
    R(x, y, 120, 40, '#22303a');
    for (var i = 0; i < 6; i++) {
      for (var j = 0; j < 4; j++) {
        R(x + 4 + i * 18, y + 4 + j * 8, 14, 1, ((i + j) % 2) ? '#1c2830' : '#26353f');
      }
    }
    R(x, y, 120, 2, '#4a2f36');
    R(x, y + 38, 120, 2, '#4a2f36');
    R(x, y, 2, 40, '#4a2f36');
    R(x + 118, y, 2, 40, '#4a2f36');
  }

  function drawBookshelf(px, py) {
    var x = (px === undefined) ? 32 : px, y = (py === undefined) ? 64 : py;
    R(x, y + 60, 32, 4, 'rgba(0,0,0,.32)');
    R(x, y, 32, 4, '#4a3728');
    R(x, y + 4, 32, 60, '#2a1d14');
    for (var s = 0; s < 3; s++) {
      var sy = y + 7 + s * 19;
      R(x + 2, sy, 28, 16, '#1c130d');
      var cols = ['#7a3b3b', '#3b5a7a', '#4a7a4a', '#7a6a3b', '#5a3b7a'];
      for (var b = 0; b < 6; b++) {
        var bh = 10 + ((s + b) % 3);
        R(x + 3 + b * 4, sy + 16 - bh, 3, bh, cols[(s * 3 + b) % 5]);
      }
    }
    R(x, y + 4, 32, 2, '#3a2a1e');
  }

  function drawBin(px, py) {
    var x = (px === undefined) ? 256 : px, y = (py === undefined) ? 111 : py;
    R(x, y + 15, 16, 3, 'rgba(0,0,0,.3)');
    R(x, y, 14, 4, '#3a4a5e');
    R(x + 1, y + 1, 12, 2, '#232c3a');
    R(x + 1, y + 4, 12, 11, '#2a3444');
    R(x + 2, y + 5, 1, 10, '#333f52');
    R(x + 5, y + 5, 1, 10, '#333f52');
    R(x + 8, y + 5, 1, 10, '#333f52');
    R(x + 14, y + 10, 5, 4, '#cfc9b6');
    R(x + 15, y + 11, 3, 2, '#e6e1d2');
  }

  function drawDispenser(px, py) {
    var x = (px === undefined) ? 384 : px, y = (py === undefined) ? 178 : py;
    R(x + 1, y + 30, 14, 3, 'rgba(0,0,0,.3)');
    R(x + 2, y + 12, 12, 22, '#c9d3de');
    R(x + 2, y + 12, 12, 2, '#dfe6ee');
    R(x + 3, y, 10, 12, '#5a93d6');
    R(x + 5, y - 2, 6, 3, '#4a7fb8');
    R(x + 5, y + 22, 5, 6, '#3a4756');
  }

  function drawPlant(px, py) {
    var x = (px === undefined) ? 400 : px, y = (py === undefined) ? 224 : py;
    var ox = Math.round(potAnim * -15);
    // bekas pot + kunci (hanya di kasus yang punya lock pot)
    if (potAnim > 0.25) {
      R(x + 3, y + 9, 10, 11, '#1e2732');
      R(x + 2, y + 11, 12, 7, '#1e2732');
      R(x + 3, y + 9, 10, 1, '#252f3b');
      if (!state.flags.key1) {
        R(x + 4, y + 16, 8, 1, 'rgba(0,0,0,.35)');
        R(x + 4, y + 13, 6, 2, '#d8ac33');
        R(x + 4, y + 13, 6, 1, '#f2cd63');
        R(x + 9, y + 11, 3, 5, '#d8ac33');
        R(x + 10, y + 12, 1, 3, '#0d1218');
        R(x + 5, y + 15, 1, 2, '#d8ac33');
        R(x + 7, y + 15, 1, 2, '#d8ac33');
      }
    }
    R(x + 1 + ox, y + 22, 14, 3, 'rgba(0,0,0,.3)');
    R(x + 2 + ox, y + 8, 10, 12, '#6b4a33');
    R(x + 2 + ox, y + 8, 10, 1, '#7d5a40');
    R(x + 1 + ox, y + 6, 12, 3, '#7d5a40');
    R(x + 4 + ox, y - 8, 6, 15, '#2f6b3f');
    R(x + 0 + ox, y - 2, 5, 10, '#3a7d4a');
    R(x + 9 + ox, y - 4, 5, 12, '#26593a');
    R(x + 6 + ox, y - 12, 3, 6, '#3a7d4a');
  }

  /* ---------- dekorasi dinding ---------- */
  function drawWindow() {
    R(48, 8, 64, 34, '#0c1420');
    R(50, 10, 60, 30, '#101c2c');
    ctx.globalAlpha = 0.5;
    R(86, 14, 10, 10, '#8fb4dd');
    ctx.globalAlpha = 0.15;
    R(78, 10, 26, 22, '#8fb4dd');
    ctx.globalAlpha = 1;
    R(78, 8, 2, 34, '#2b3644');
    R(48, 24, 64, 2, '#2b3644');
    R(48, 8, 64, 2, '#39465a');
    R(46, 42, 68, 2, '#2b3644');
  }

  function drawBoard(px, py) {
    var x = (px === undefined) ? 142 : px, y = (py === undefined) ? 6 : py;
    var got = !!state.collected.papan;
    R(x, y, 116, 38, '#2b3644');
    R(x + 2, y + 2, 112, 34, '#d5dee9');
    R(x + 2, y + 2, 112, 2, '#eef2f7');
    R(x + 10, y + 9, 40, 2, '#8fa0b4');
    R(x + 10, y + 15, 26, 2, '#8fa0b4');
    R(x + 10, y + 21, 54, 2, '#8fa0b4');
    R(x + 10, y + 27, 34, 2, '#8fa0b4');
    if (got) {
      R(x + 8, y + 14, 34, 8, 'rgba(242,181,68,.28)');
      R(x + 10, y + 17, 28, 3, '#d99b2c');
    }
    R(x, y + 38, 116, 3, '#39465a');
    R(x + 8, y + 41, 6, 2, '#c9d3de');
    R(x + 18, y + 41, 6, 2, '#7fb8ee');
  }

  function drawClock() {
    // bayangan di dinding
    R(296, 8, 20, 20, 'rgba(0,0,0,.28)');
    // cincin gelap (bentuk lingkaran kasar)
    R(301, 6, 10, 1, '#1c2531');
    R(301, 25, 10, 1, '#1c2531');
    R(299, 8, 2, 16, '#1c2531');
    R(311, 8, 2, 16, '#1c2531');
    R(299, 8, 14, 16, '#1c2531');
    // muka jam
    R(301, 9, 10, 14, '#e8eef6');
    R(302, 8, 8, 1, '#e8eef6');
    R(302, 24, 8, 1, '#e8eef6');
    // angka 12/3/6/9
    R(305, 10, 2, 1, '#9aa6b4');
    R(305, 22, 2, 1, '#9aa6b4');
    R(302, 15, 1, 2, '#9aa6b4');
    R(309, 15, 1, 2, '#9aa6b4');
    // jarum jam + menit
    R(305, 11, 2, 6, '#232d3a');
    R(306, 16, 4, 2, '#232d3a');
    // poros merah
    R(305, 16, 2, 2, '#c0392b');
  }

  function drawPoster() {
    R(330, 10, 22, 28, '#39465a');
    R(331, 11, 20, 26, '#c9b48a');
    R(334, 15, 14, 2, '#8a7a5a');
    R(334, 20, 10, 2, '#8a7a5a');
    R(334, 25, 14, 2, '#8a7a5a');
    R(334, 30, 8, 2, '#8a7a5a');
  }

  function drawTrunking() {
    R(48, 50, 340, 3, '#2b3644');
    R(48, 50, 340, 1, '#39465a');
    R(96, 53, 4, 4, '#1c2531');
    R(216, 53, 4, 4, '#1c2531');
    R(336, 53, 4, 4, '#1c2531');
  }

  function drawDoor(px, py) {
    var x = (px === undefined) ? 190 : px, y = (py === undefined) ? 268 : py;
    R(x, y + 2, 36, 18, '#1c2531');
    R(x + 2, y + 4, 32, 16, '#4a3524');
    R(x + 4, y + 6, 28, 14, '#6b4d33');
    R(x + 4, y + 6, 28, 2, '#7d5a40');
    R(x + 28, y + 12, 3, 3, '#e0c069');
    R(x + 16, y, 8, 4, '#2b3644');
    R(x + 17, y + 1, 6, 2, '#8a99ad');
  }

  function drawCable(x, y, len) {
    R(x, y, len, 2, '#141a22');
    R(x, y, len, 1, '#1d2531');
  }

  /* ---------- pemain ---------- */
  function drawPlayerShadow(x, y) {
    ctx.globalAlpha = 0.34;
    R(x - 8, y - 3, 16, 3, '#000');
    ctx.globalAlpha = 1;
  }

  function drawPlayer() {
    var bob = (player.moving && Math.floor(player.anim * 10) % 2 === 1) ? -1 : 0;
    var x = Math.round(player.x) - 8;
    var y = Math.round(player.y) - 24 + bob;
    if (player.dir === 'left')       drawSprite(SPR_SIDE, x, y, true);
    else if (player.dir === 'right') drawSprite(SPR_SIDE, x, y, false);
    else if (player.dir === 'up')    drawSprite(SPR_UP, x, y, false);
    else                             drawSprite(SPR_DOWN, x, y, false);
  }

  /* =========================================================
     8. RENDER
     ========================================================= */
  var vig = null;
  function buildVignette() {
    vig = document.createElement('canvas');
    vig.width = VW; vig.height = VH;
    var v = vig.getContext('2d');
    var g = v.createRadialGradient(VW / 2, VH / 2, VH * 0.30, VW / 2, VH / 2, VH * 1.05);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.65, 'rgba(0,0,0,.22)');
    g.addColorStop(1, 'rgba(0,0,0,.62)');
    v.fillStyle = g;
    v.fillRect(0, 0, VW, VH);
  }

  function drawLights() {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < LIGHTS.length; i++) {
      var L = LIGHTS[i];
      var g = ctx.createRadialGradient(L.x, L.y, 6, L.x, L.y, L.r);
      g.addColorStop(0, 'rgba(255,214,150,.13)');
      g.addColorStop(0.45, 'rgba(255,198,120,.05)');
      g.addColorStop(1, 'rgba(255,190,110,0)');
      ctx.fillStyle = g;
      ctx.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
    }
    ctx.restore();
  }

  function initDust() {
    dust = [];
    for (var i = 0; i < 46; i++) {
      dust.push({
        x: Math.random() * VW,
        y: Math.random() * VH,
        vx: (Math.random() - 0.5) * 4,
        vy: -2 - Math.random() * 4,
        a: 0.10 + Math.random() * 0.28,
        p: Math.random() * 6.28
      });
    }
  }

  function updateDust(dt) {
    for (var i = 0; i < dust.length; i++) {
      var d = dust[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      if (d.y < -2) { d.y = VH + 2; d.x = Math.random() * VW; }
      if (d.x < -2) d.x = VW + 2;
      if (d.x > VW + 2) d.x = -2;
    }
  }

  function drawDust() {
    for (var i = 0; i < dust.length; i++) {
      var d = dust[i];
      ctx.globalAlpha = d.a * (0.55 + 0.45 * Math.sin(t0 * 1.6 + d.p));
      ctx.fillStyle = '#ffe0a8';
      ctx.fillRect(d.x | 0, d.y | 0, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    if (activeScreen !== 'scr-play') return;
    ctx.clearRect(0, 0, VW, VH);

    var ox = Math.round(cam.x), oy = Math.round(cam.y);
    ctx.save();
    ctx.translate(-ox, -oy);

    var c0 = Math.floor(ox / T), c1 = Math.ceil((ox + VW) / T);
    var r0 = Math.floor(oy / T), r1 = Math.ceil((oy + VH) / T);

    for (var r = r0; r <= r1; r++) {
      for (var c = c0; c <= c1; c++) {
        if (c < 0 || r < 0 || c >= MAP_W || r >= MAP_H) continue;
        if (grid[r][c] === 0) CUR.floor(c, r, c * T, r * T);
        else CUR.wall(c, r, c * T, r * T);
      }
    }

    drawLights();
    drawRug();
    CUR.decor();

    var list = [];
    var rawProps = CUR.props();
    for (var k2 = 0; k2 < rawProps.length; k2++) {
      var pr2 = rawProps[k2];
      if (pr2.fn) {
        list.push({ y: (pr2.y + (pr2.h || 0)), fn: pr2.fn, x: pr2.x, w: pr2.w || 0 });
      } else {
        list.push(pr2);
      }
    }
    list.push({ y: player.y, fn: function () { drawPlayerShadow(Math.round(player.x), Math.round(player.y)); } });
    list.push({ y: player.y, fn: drawPlayer });

    list.sort(function (a, b) { return a.y - b.y; });
    for (var k = 0; k < list.length; k++) list[k].fn();

    ctx.restore();

    drawTraps();
    drawDust();
    if (vig) ctx.drawImage(vig, 0, 0);
  }

  /* =========================================================
     8B. PERANGKAP — dipasang tersangka untuk menghalangi penyelidikan.
         Spawn ACAK tiap main. NORMAL = 2, HARD = 4. EASY = tidak ada.
     ========================================================= */
  var traps = [];
  var trapCooldown = 0;
  var trapHits = 0;

  var TRAP_TYPES = {
    wire:  { label: 'KABEL ALARM',   penalty: 100, msg: 'Kaki kamu menyentuh kabel alarm \u2014 alarm berbunyi nyaring!' },
    trip:  { label: 'TALI UMPAN',    penalty: 60,  msg: 'Kamu tersandung tali tipis di lantai. Lututmu berdarah.' },
    floor: { label: 'LANTAI RAPUH',  penalty: 80,  msg: 'Lantai itu rapuh! Kamu nyaris jatuh ke ruang bawah tanah.' }
  };

  function trapCfg() { return { easy: 0, normal: 2, hard: 4 }[diff.id] || 0; }

  function spawnTraps() {
    traps = [];
    var n = trapCfg();
    if (!n || !CUR) return;
    // kumpulkan tile lantai yang aman: bukan dekat spawn, bukan dekat objek penting
    var sp = CUR.spawn;
    var sc = Math.floor(sp.x / T), sr = Math.floor(sp.y / T);
    var reserved = {};
    for (var i = 0; i < INTERACTABLES.length; i++) {
      var it = INTERACTABLES[i];
      var tc = Math.floor(it.x / T), tr = Math.floor(it.y / T);
      for (var dc = -1; dc <= 1; dc++) for (var dr = -1; dr <= 1; dr++) reserved[(tc + dc) + ',' + (tr + dr)] = 1;
    }
    for (var dc2 = -4; dc2 <= 4; dc2++) for (var dr2 = -4; dr2 <= 4; dr2++) reserved[(sc + dc2) + ',' + (sr + dr2)] = 1;

    var pool = [];
    for (var r = 3; r < MAP_H - 1; r++) {
      for (var c = 2; c < MAP_W - 1; c++) {
        if (grid[r][c] !== 0) continue;
        if (reserved[c + ',' + r]) continue;
        pool.push([c, r]);
      }
    }
    // acak
    for (var j = pool.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = pool[j]; pool[j] = pool[k]; pool[k] = tmp;
    }
    var types = ['wire', 'trip', 'floor'];
    for (var t2 = 0; t2 < n && t2 < pool.length; t2++) {
      traps.push({ c: pool[t2][0], r: pool[t2][1], type: types[t2 % types.length], done: false });
    }
    trapHits = 0;
  }

  function updateTraps(dt) {
    if (trapCooldown > 0) trapCooldown -= dt;
    if (!traps.length || trapCooldown > 0 || dialogOpen) return;
    var pc = Math.floor(player.x / T), pr = Math.floor(player.y / T);
    for (var i = 0; i < traps.length; i++) {
      var t = traps[i];
      if (t.done || t.c !== pc || t.r !== pr) continue;
      t.done = true;
      trapHits++;
      trapCooldown = 1.2;
      var cfgT = TRAP_TYPES[t.type];
      state.score = Math.max(0, state.score - cfgT.penalty);
      updateScore();
      updateGuardHud();
      toast('PERANGKAP: ' + cfgT.label + ' \u00b7 \u2212' + cfgT.penalty + ' poin');
      if (t.type === 'floor') {
        // jatuh: kembali ke titik masuk
        var sp = CUR.spawn;
        player.x = sp.x; player.y = sp.y;
        cam.x = Math.round(Math.max(0, Math.min(WORLD_W - VW, player.x - VW / 2)));
        cam.y = Math.round(Math.max(0, Math.min(WORLD_H - VH, player.y - VH / 2)));
      }
      openDialog('PERANGKAP', cfgT.msg + ' ' +
        (t.type === 'floor' ? 'Kamu merangkak kembali ke titik masuk.' : 'Hati-hati \u2014 tersangka mungkin tahu ada yang menyelidik.'),
        [{ label: 'Aduh', fn: closeDialog }]);
      return;
    }
  }

  function drawTraps() {
    for (var i = 0; i < traps.length; i++) {
      var t = traps[i];
      if (t.done) continue;
      var x = t.c * T, y = t.r * T;
      if (t.type === 'wire') {
        // kabel tipis melintang dengan kilau kecil
        R(x, y + 9, T, 1, 'rgba(60,50,40,.85)');
        R(x + 5, y + 8, 2, 1, 'rgba(255,220,140,.75)');
        R(x + 11, y + 10, 2, 1, 'rgba(255,220,140,.45)');
      } else if (t.type === 'trip') {
        // tali umpan lebih rendah
        R(x, y + 13, T, 1, 'rgba(70,55,40,.8)');
        R(x + 3, y + 12, 2, 1, 'rgba(230,200,150,.55)');
      } else {
        // lantai rapuh: retakan halus
        R(x + 3, y + 3, 1, 10, 'rgba(0,0,0,.4)');
        R(x + 8, y + 2, 1, 12, 'rgba(0,0,0,.35)');
        R(x + 5, y + 7, 6, 1, 'rgba(0,0,0,.4)');
        R(x + 10, y + 4, 3, 1, 'rgba(255,255,255,.05)');
      }
    }
  }

  function solidTile(c, r) {
    if (c < 0 || r < 0 || c >= MAP_W || r >= MAP_H) return true;
    return grid[r][c] !== 0;
  }

  function blocked(x, y) {
    var hw = 5;
    var ys = [y - 15, y - 9, y - 2];
    var xs = [x - hw, x, x + hw];
    for (var i = 0; i < xs.length; i++) {
      for (var j = 0; j < ys.length; j++) {
        if (solidTile(Math.floor(xs[i] / T), Math.floor(ys[j] / T))) return true;
      }
    }
    return false;
  }

  function update(dt) {
    var dx = 0, dy = 0;
    if (keys['a'] || keys['arrowleft'])  dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;
    if (keys['w'] || keys['arrowup'])    dy -= 1;
    if (keys['s'] || keys['arrowdown'])  dy += 1;
    if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }

    player.moving = (dx !== 0 || dy !== 0);
    if (player.moving) {
      if (dx < 0) player.dir = 'left';
      else if (dx > 0) player.dir = 'right';
      else if (dy < 0) player.dir = 'up';
      else player.dir = 'down';
      player.anim += dt;
      var pk = $('p-keys');
      if (pk) pk.style.opacity = '0';
    }

    var sp = 62 * dt;
    if (dx !== 0 && !blocked(player.x + dx * sp, player.y)) player.x += dx * sp;
    if (dy !== 0 && !blocked(player.x, player.y + dy * sp)) player.y += dy * sp;

    updateTraps(dt);

    if (state.flags._s_key1 && potAnim < 1) potAnim = Math.min(1, potAnim + dt * 2.6);

    cam.x = Math.round(Math.max(0, Math.min(WORLD_W - VW, player.x - VW / 2)));
    cam.y = Math.round(Math.max(0, Math.min(WORLD_H - VH, player.y - VH / 2)));
    updatePrompt();
  }

  function nearest() {
    var best = null, bd = 1e9;
    for (var i = 0; i < INTERACTABLES.length; i++) {
      var it = INTERACTABLES[i];
      // pot baru bisa diperiksa setelah sandi terpecahkan
      if (it.id === 'pot' && !state.decrypted) continue;
      var d = Math.sqrt((player.x - it.x) * (player.x - it.x) + (player.y - it.y) * (player.y - it.y));
      if (d < it.range && d < bd) { bd = d; best = it; }
    }
    return best;
  }

  function updatePrompt() {
    var it = nearest();
    if (it && !dialogOpen) {
      $('prompt-label').textContent = it.label;
      promptEl.classList.add('show');
    } else {
      promptEl.classList.remove('show');
    }
  }

  /* =========================================================
     10. UI HELPERS
     ========================================================= */
  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }

  function showScreen(id) {
    var all = document.querySelectorAll('.screen');
    for (var i = 0; i < all.length; i++) all[i].classList.remove('active');
    $(id).classList.add('active');
    activeScreen = id;
    if (id !== 'scr-play') closeDialog();
    $('case-modal').classList.remove('show');
    $('confirm-modal').classList.remove('show');
  }

  function updateScore() {
    var ids = ['hud-score', 'hud-score-2', 'hud-score-3'];
    for (var i = 0; i < ids.length; i++) {
      var el = $(ids[i]);
      if (el) el.textContent = String(state.score);
    }
  }

  function openModal(tag, title, desc, payload, small) {
    $('modal-tag').textContent = tag;
    $('modal-title').textContent = title;
    $('modal-desc').textContent = desc;
    var p = $('modal-payload');
    p.textContent = payload;
    p.className = 'payload' + (small ? ' small' : '');
    modalEl.classList.add('show');
  }
  function closeModal() { modalEl.classList.remove('show'); }

  function openDialog(name, text, actions) {
    $('dlg-name').textContent = name;
    $('dlg-text').innerHTML = text;
    var box = $('dlg-actions');
    box.innerHTML = '';
    (actions || []).forEach(function (a) {
      var b = document.createElement('button');
      b.className = 'btn' + (a.primary ? ' primary' : '');
      b.textContent = a.label;
      b.addEventListener('click', a.fn);
      box.appendChild(b);
    });
    dialogEl.classList.add('show');
    dialogOpen = true;
  }
  function closeDialog() {
    dialogEl.classList.remove('show');
    dialogOpen = false;
  }

  function updateObjective() {
    var el = $('objective');
    if (!CASE || !CUR) return;
    var n = cluesFound();
    if (n < CASE.clues.length) { el.innerHTML = 'Cari petunjuk &middot; ' + n + '/' + CASE.clues.length; return; }
    if (!state.decrypted) { el.innerHTML = 'Buka <b>ALAT</b> (tombol T) &middot; masukkan petunjuk'; return; }
    var locks = CUR.quest.locks;
    for (var i = 0; i < locks.length; i++) {
      if (state.flags[locks[i].flag]) continue;
      if (locks[i].need && !state.flags[locks[i].need]) continue;
      el.innerHTML = locks[i].obj;
      return;
    }
    el.innerHTML = 'Interogasi <b>tersangka</b>';
  }

  function updateGuardHud() {
    var el = $('guard-badge');
    if (!el) return;
    var n = traps.length;
    if (!n) { el.classList.remove('show', 'alert'); return; }
    el.classList.add('show');
    el.classList.toggle('alert', trapHits > 0);
    el.textContent = trapHits > 0 ? 'PERANGKAP · ' + trapHits + ' TERPICU' : 'AWAS PERANGKAP × ' + n;
  }

  function keyCount() {
    if (!CUR) return 0;
    var n = 0, locks = CUR.quest.locks;
    for (var i = 0; i < locks.length; i++) if (state.flags[locks[i].flag] && !locks[i].final) n++;
    return n;
  }

  function updateKeyBadge() {
    var b = $('key-badge');
    if (!b) return;
    var n = keyCount();
    b.classList.toggle('show', n > 0);
    b.textContent = n > 1 ? 'KUNCI \u00d7 ' + n : 'KUNCI';
  }

  /* =========================================================
     11. INTERAKSI
     ========================================================= */
  function collect(id) {
    if (state.collected[id]) return false;
    state.collected[id] = true;
    updateObjective();
    return true;
  }

  function takeLock(L) {
    closeDialog();
    state.flags[L.flag] = true;
    if (L.flag === 'key1') state.keyFound = true;
    updateObjective();
    updateKeyBadge();
    if (L.final) {
      state.collected.evidence = true;
      toast('Bukti didapat');
      setTimeout(function () { if (activeScreen === 'scr-play') openInterro(); }, 700);
    } else {
      toast('Kunci didapat');
    }
  }

  function takeKey() {
    var locks = CUR.quest.locks;
    for (var i = 0; i < locks.length; i++) {
      if (!state.flags[locks[i].flag] && state.flags['_s_' + locks[i].flag]) { takeLock(locks[i]); return; }
    }
  }

  function runLock(L, p) {
    var title = L.title || p.title;
    var ready = L.need ? !!state.flags[L.need] : !!state.decrypted;
    if (!ready) {
      openDialog(title, L.locked, [{ label: 'Tutup', fn: closeDialog }]);
      return;
    }
    if (state.flags[L.flag]) {
      openDialog(title, L.done, [{ label: 'Tutup', fn: closeDialog }]);
      return;
    }
    var seen = '_s_' + L.flag;
    if (state.flags[seen]) {
      openDialog(title, L.after,
        [{ label: L.take, primary: true, fn: function () { takeLock(L); } }]);
      return;
    }
    openDialog(title, String(L.ready).replace('{plain}', CASE.plain), [
      { label: L.action, primary: true, fn: function () {
          state.flags[seen] = true;
          closeDialog();
          setTimeout(function () {
            if (activeScreen !== 'scr-play') return;
            openDialog(title, L.after,
              [{ label: L.take, primary: true, fn: function () { takeLock(L); } }]);
          }, L.anim ? 780 : 240);
        } },
      { label: 'Batal', fn: closeDialog }
    ]);
  }

  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function cluesFound() {
    var n = 0;
    for (var i = 0; i < CASE.clues.length; i++) if (state.found[CASE.clues[i].id]) n++;
    return n;
  }

  function checkAllClues() {
    if (cluesFound() >= CASE.clues.length && !state.decrypted) {
      toast('Petunjuk lengkap \u00b7 jalankan alat di komputer guru');
    }
  }

  function interact(id) {
    if (dialogOpen) return;
    var p = propById(id);
    if (!p) return;

    /* ---- komputer/terminal: tetap bisa membuka alat (selain tombol HUD) ---- */
    if (id === CUR.quest.tool) {
      openTool();
      return;
    }

    /* ---- rantai kunci kasus ini ---- */
    var locks = CUR.quest.locks, LK = null;
    for (var qi = 0; qi < locks.length; qi++) if (locks[qi].at === id) LK = locks[qi];
    if (LK) { runLock(LK, p); return; }

    /* ---- pintu ---- */
    if (id === 'door') {
      openDialog('PINTU KELUAR',
        state.collected.evidence ? 'Kasusnya sudah selesai. Waktunya melapor.' : 'Belum bisa keluar. Kasusnya belum selesai.',
        [{ label: 'Tutup', fn: closeDialog }]);
      return;
    }

    /* ---- barang yang menyimpan petunjuk ---- */
    var clue = state.clueMap[id];
    if (clue) {
      if (state.found[clue.id]) {
        openDialog(p.title,
          'Petunjuk dari sini sudah kamu catat. Tidak ada lagi yang tertinggal.',
          [{ label: 'Tutup', fn: closeDialog }]);
        return;
      }
      state.found[clue.id] = true;
      updateObjective();
      var lead = clue.kind === 'msg'
        ? 'Di baliknya ada lipatan kertas kecil. Bukan tulisan tangan \u2014 deretan huruf acak ' +
          'yang ditulis Nayla lewat alat dekripsi:'
        : 'Ada sobekan kertas dengan rumus tertulis rapi:';
      openDialog(p.title,
        lead + '<div class="found-clue">' + escHtml(clue.body) + '</div>',
        [
          { label: 'SALIN', primary: true, fn: function () { copyClue(clue); } },
          { label: 'Tutup', fn: function () { closeDialog(); checkAllClues(); } }
        ]);
      return;
    }

    /* ---- sisanya: alasan kenapa kosong ---- */
    openDialog(p.title, p.flavor || 'Tidak ada yang mencurigakan di sini.',
      [{ label: 'Tutup', fn: closeDialog }]);
  }

  function onInteractKey() {
    if (activeScreen !== 'scr-play' || dialogOpen) return;
    var it = nearest();
    if (it) interact(it.id);
  }

  /* =========================================================
     12. ALAT ENKRIPSI
     ========================================================= */
  var clipBuf = '';
  var toolOK = false;

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }

  function parseFnBody(s) {
    s = s.replace(/\s+/g, '').toLowerCase().replace(/\u2212/g, '-');
    var m = s.match(/^([+-]?\d*)x([+-]\d+)?$/);
    if (!m) return null;
    var a = (m[1] === '' || m[1] === '+') ? 1 : (m[1] === '-' ? -1 : parseInt(m[1], 10));
    var b = m[2] ? parseInt(m[2], 10) : 0;
    if (!isFinite(a) || !isFinite(b)) return null;
    return { a: a, b: b };
  }

  // baca teks kunci: baris "f(x) = 3x + 7" (nama opsional), urut dari lapis terluar
  function parseFns(text) {
    var lines = text.split(/\n+/);
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var raw = lines[i].trim();
      if (!raw) continue;
      var low = raw.toLowerCase();
      if (/^c\s*=/.test(low)) continue;                 // baris komposisi, dilewati
      var nm = low.match(/^([a-z])\s*\(\s*x\s*\)\s*=/);
      var eq = raw.indexOf('=');
      var body = eq >= 0 ? raw.slice(eq + 1) : raw;
      var f = parseFnBody(body);
      if (!f) continue;
      f.name = nm ? nm[1] : FN_NAMES[out.length] || '?';
      f.inv = ainv(f.a);
      out.push(f);
    }
    return out;
  }

  // buka lapis dari terluar (baris pertama kunci) ke terdalam
  function decryptWith(cipher, fns) {
    var out = '';
    for (var i = 0; i < cipher.length; i++) {
      var ch = cipher.charAt(i).toUpperCase();
      if (ch === ' ') { out += ' '; continue; }
      if (ch < 'A' || ch > 'Z') return null;
      var v = l2n(ch);
      for (var j = 0; j < fns.length; j++) v = m26(fns[j].inv * (v - fns[j].b));
      out += n2l(v);
    }
    return out;
  }

  function openTool() {
    toolOK = !!state.decrypted;
    $('in-msg').value = '';
    $('in-key').value = '';
    $('tool-out').textContent = '\u2014';
    $('tool-steps').innerHTML = '';
    $('tool-msg').textContent = '';
    $('tool-msg').className = 'tool-msg';
    $('btn-tool-done').style.display = state.decrypted ? '' : 'none';
    if (state.decrypted) {
      $('in-msg').value = scrambleCase(CASE.cipher);
      $('in-key').value = [composeLine(CASE.layers)].concat(keyLines(CASE.layers, 0, CASE.layers.length)).join('\n');
      $('tool-out').textContent = CASE.cipher;
      $('tool-msg').textContent = 'Pesan ini sudah pernah kamu buka di sini.';
      $('tool-msg').className = 'tool-msg good';
    }
    renderEvidence();
    showScreen('scr-tool');
  }

  function renderEvidence() {
    var wrap = $('tool-evidence');
    wrap.innerHTML = '';
    if (!CASE) return;
    for (var i = 0; i < CASE.clues.length; i++) {
      (function (c) {
        var found = !!state.found[c.id];
        var d = document.createElement('div');
        d.className = 'ev-item';

        var h = document.createElement('h5');
        var t = document.createElement('span');
        t.textContent = c.title;
        h.appendChild(t);

        var b = document.createElement('button');
        b.className = 'btn tiny';
        b.textContent = found ? 'SALIN' : 'BELUM';
        b.disabled = !found;
        b.addEventListener('click', function () { copyClue(c); });
        h.appendChild(b);
        d.appendChild(h);

        var body = document.createElement('div');
        body.className = 'ev-body' + (c.kind === 'msg' ? ' big' : '');
        body.textContent = found ? c.body : '\u2014 belum ditemukan \u2014';
        if (!found) body.style.color = '#46536a';
        d.appendChild(body);

        wrap.appendChild(d);
      })(CASE.clues[i]);
    }
  }

  function copyClue(c) {
    clipBuf = c.body;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(c.body);
    } catch (e) { /* file:// tanpa izin clipboard \u2014 buffer internal tetap jalan */ }
    toast('Disalin \u00b7 ' + c.title);
  }

  // TEMPEL: ambil petunjuk yang relevan (bukan sekadar clipboard, biar tak pernah gagal)
  function pasteClue(target) {
    var txt = '';
    if (target === 'in-msg') {
      for (var i = 0; i < CASE.clues.length; i++) {
        if (CASE.clues[i].kind === 'msg' && state.found[CASE.clues[i].id]) txt = CASE.clues[i].body;
      }
    } else {
      var parts = [];
      for (var j = 0; j < CASE.clues.length; j++) {
        if (CASE.clues[j].kind === 'key' && state.found[CASE.clues[j].id]) parts.push(CASE.clues[j].body);
      }
      txt = parts.join('\n');
    }
    if (!txt) { toast('Belum ada yang bisa ditempel'); return; }
    var el = $(target);
    var cur = el.value.trim();
    el.value = cur ? cur + '\n' + txt : txt;
    el.dispatchEvent(new Event('input'));
    el.focus();
  }

  function renderSteps(cipher, fns) {
    var html = '', shown = 0;
    for (var i = 0; i < cipher.length && shown < 4; i++) {
      var ch = cipher.charAt(i);
      if (ch === ' ') continue;
      var v = l2n(ch);
      var parts = ['<b>' + ch + '</b>(' + v + ')'];
      for (var j = 0; j < fns.length; j++) {
        v = m26(fns[j].inv * (v - fns[j].b));
        parts.push(fns[j].name + '\u207b\u00b9 \u2192 ' + v);
      }
      parts.push('<span class="st-c">' + n2l(v) + '</span>');
      html += parts.join(' &middot; ') + '<br>';
      shown++;
    }
    $('tool-steps').innerHTML = html;
  }

  function runDecrypt() {
    var msgEl = $('tool-msg'), outEl = $('tool-out');
    var raw = $('in-msg').value.toUpperCase().replace(/[^A-Z ]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!raw) {
      msgEl.textContent = 'Pesan terenkripsi masih kosong \u2014 tempel dulu yang kamu temukan.';
      msgEl.className = 'tool-msg bad';
      return;
    }
    var fns = parseFns($('in-key').value);
    if (!fns.length) {
      msgEl.textContent = 'Kunci belum terbaca. Format tiap baris: f(x) = 3x + 7';
      msgEl.className = 'tool-msg bad';
      return;
    }
    if (fns.length !== CASE.layers.length) {
      msgEl.textContent = 'Jumlah fungsi belum pas \u2014 mode ini butuh ' + CASE.layers.length +
                          ' lapis, kamu menempel ' + fns.length + '.';
      msgEl.className = 'tool-msg bad';
      return;
    }
    for (var i = 0; i < fns.length; i++) {
      if (gcd(fns[i].a, 26) !== 1) {
        msgEl.textContent = 'Koefisien ' + fns[i].a + ' tidak punya invers mod 26 \u2014 bukan kunci yang valid.';
        msgEl.className = 'tool-msg bad';
        return;
      }
    }

    var res = decryptWith(raw, fns);
    if (!res) { msgEl.textContent = 'Sandi cuma boleh huruf dan spasi.'; msgEl.className = 'tool-msg bad'; return; }
    outEl.textContent = res;

    if (res === CASE.plain) {
      toolOK = true;
      state.decrypted = true;
      msgEl.textContent = 'Pesan terbaca. Sandi ini menunjuk satu lokasi di ruangan.';
      msgEl.className = 'tool-msg good';
      $('btn-tool-done').style.display = '';
      renderSteps(raw, fns);
      updateObjective();
    } else {
      toolOK = false;
      msgEl.textContent = 'Hasilnya belum jadi kalimat \u2014 cek urutan lapisnya.';
      msgEl.className = 'tool-msg bad';
      $('btn-tool-done').style.display = 'none';
      $('tool-steps').innerHTML = '';
    }
  }

  /* =========================================================
     13. INTEROGASI & VONIS
     ========================================================= */
  var icv = null, ictx = null, ict = 0, ihover = -1;
  var vcv = null, vctx = null, vdTime = 0;

  var SEATS = [
    { x: 158, skin: '#e0aa7e', hair: '#241a14', top: '#3a4350', top2: '#4b5566' },
    { x: 320, skin: '#d9a377', hair: '#1d1a18', top: '#2f4a6e', top2: '#41669a' },
    { x: 482, skin: '#e8b48a', hair: '#2b1e17', top: '#4a3a2c', top2: '#5d4a38' }
  ];

  function TR4(x, y, w, h, c) { ictx.fillStyle = c; ictx.fillRect(x | 0, y | 0, w | 0, h | 0); }
  function TR5(x, y, w, h, c) { vctx.fillStyle = c; vctx.fillRect(x | 0, y | 0, w | 0, h | 0); }

  function pxText4(txt, x, y, sc, col) {
    ictx.fillStyle = col;
    for (var i = 0; i < txt.length; i++) {
      var gl = FONT3[txt.charAt(i)] || FONT3[' '];
      for (var r = 0; r < 5; r++) {
        for (var c = 0; c < 3; c++) {
          if (gl[r].charAt(c) === '1') ictx.fillRect(x + (i * 4 + c) * sc, y + r * sc, sc, sc);
        }
      }
    }
  }

  function initInterro() {
    icv = $('icv');
    if (icv) {
      ictx = icv.getContext('2d');
      ictx.imageSmoothingEnabled = false;
      icv.addEventListener('mousemove', function (e) {
        var r = icv.getBoundingClientRect();
        if (!r.width) return;
        var h = hitSeat((e.clientX - r.left) / r.width * 640, (e.clientY - r.top) / r.height * 360);
        // tersangka yang sudah dituduh tidak bisa disorot lagi
        if (h >= 0 && CASE && CASE.suspects[h] && state.accused && state.accused[CASE.suspects[h].id]) h = -1;
        ihover = h;
      });
      icv.addEventListener('mouseleave', function () { ihover = -1; });
      icv.addEventListener('click', function (e) {
        var r = icv.getBoundingClientRect();
        var i = hitSeat((e.clientX - r.left) / r.width * 640, (e.clientY - r.top) / r.height * 360);
        if (i < 0) return;
        var sp = CASE && CASE.suspects[i];
        if (sp && state.accused && state.accused[sp.id]) {
          toast('Orang ini sudah kamu tuduh \u2014 alibinya tidak berubah.');
          return;
        }
        chooseSuspect(i);
      });
    }
    vcv = $('vcv');
    if (vcv) {
      vctx = vcv.getContext('2d');
      vctx.imageSmoothingEnabled = false;
    }
  }

  function hitSeat(x, y) {
    for (var i = 0; i < SEATS.length; i++) {
      var s = SEATS[i];
      if (x > s.x - 58 && x < s.x + 58 && y > 160 && y < 316) return i;
    }
    return -1;
  }

  function openInterro() {
    ihover = -1;
    showScreen('scr-interro');
  }

  function chooseSuspect(i) {
    var s = CASE.suspects[i];
    if (!s) return;
    // tersangka yang sudah pernah dituduh tidak bisa dituduh ulang
    state.accused = state.accused || {};
    if (state.accused[s.id]) return;
    state.accused[s.id] = true;
    state.picked = s;
    state.win = (s.id === CASE.culprit);
    if (!state.win) state.score = Math.max(0, state.score - 250);
    vdTime = 0;
    $('btn-vd-next').style.display = 'none';
    showScreen('scr-verdict');
  }

  function cuffRing(x, y) {
    TR4(x - 7, y - 6, 14, 13, '#0c1119');
    TR4(x - 6, y - 5, 12, 11, '#cfd8e4');
    TR4(x - 6, y - 5, 12, 2, '#ffffff');
    TR4(x - 6, y + 4, 12, 2, '#8792a2');
    TR4(x - 3, y - 1, 6, 5, '#3b3226');   // lubang \u2014 warna permukaan meja
  }

  function drawSeat(cx, pal, hot) {
    // kursi
    TR4(cx - 34, 244, 68, 54, '#1a1f27');
    // badan
    TR4(cx - 27, 232, 54, 64, pal.top);
    TR4(cx - 27, 232, 54, 4, pal.top2);
    TR4(cx - 27, 232, 3, 64, pal.top2);
    // leher
    TR4(cx - 7, 224, 14, 12, pal.skin);
    TR4(cx - 7, 224, 14, 4, '#00000033');
    // kepala
    TR4(cx - 15, 196, 30, 30, pal.skin);
    TR4(cx + 12, 196, 3, 30, '#00000028');
    // rambut
    TR4(cx - 16, 191, 32, 11, pal.hair);
    TR4(cx - 16, 200, 5, 13, pal.hair);
    TR4(cx + 11, 200, 5, 13, pal.hair);
    // mata (menunduk)
    TR4(cx - 9, 210, 5, 3, '#14181f');
    TR4(cx + 4, 210, 5, 3, '#14181f');
    // mulut
    TR4(cx - 5, 218, 10, 2, '#8a6248');
    // lengan di atas meja
    TR4(cx - 32, 282, 64, 14, pal.top);
    TR4(cx - 32, 282, 64, 3, pal.top2);

    if (hot) {
      ictx.save();
      ictx.globalCompositeOperation = 'lighter';
      var hg = ictx.createRadialGradient(cx, 240, 10, cx, 240, 120);
      hg.addColorStop(0, 'rgba(255,226,170,.18)');
      hg.addColorStop(1, 'rgba(255,226,170,0)');
      ictx.fillStyle = hg;
      ictx.fillRect(cx - 130, 120, 260, 230);
      ictx.restore();
    }
  }

  function drawHands(cx, pal) {
    // dua tangan berdampingan di atas meja
    TR4(cx - 21, 300, 17, 12, pal.skin);
    TR4(cx + 4, 300, 17, 12, pal.skin);
    TR4(cx - 21, 300, 17, 2, '#ffffff22');
    TR4(cx + 4, 300, 17, 2, '#ffffff22');
    // borgol mengunci kedua pergelangan
    cuffRing(cx - 13, 306);
    cuffRing(cx + 13, 306);
    // rantai
    TR4(cx - 6, 304, 12, 3, '#9aa6b4');
    TR4(cx - 6, 304, 12, 1, '#e8eef6');
    TR4(cx - 2, 303, 4, 6, '#5d6878');
    TR4(cx + 1, 303, 4, 6, '#5d6878');
  }

  function drawInterro(dt) {
    if (!ictx) return;
    ict += dt;

    // dinding
    TR4(0, 0, 640, 360, '#0c1015');
    for (var i = 0; i < 640; i += 64) TR4(i, 0, 1, 300, '#141a21');
    // kaca satu arah
    TR4(120, 34, 400, 80, '#0a1219');
    TR4(120, 34, 400, 3, '#1e2c38');
    TR4(120, 111, 400, 3, '#1e2c38');
    ictx.globalAlpha = 0.10;
    for (var k = 0; k < 5; k++) TR4(150 + k * 76, 40, 22, 70, '#7fa8d6');
    ictx.globalAlpha = 1;
    pxText4('ONE WAY', 300, 24, 1, '#2c3b4a');

    // lampu gantung
    TR4(316, 0, 8, 26, '#1b222c');
    TR4(300, 26, 40, 8, '#2a333f');
    var tx = ihover >= 0 ? SEATS[ihover].x : 320;
    ictx.save();
    ictx.globalCompositeOperation = 'lighter';
    var lg = ictx.createLinearGradient(320, 30, tx, 300);
    lg.addColorStop(0, 'rgba(255,232,180,.18)');
    lg.addColorStop(1, 'rgba(255,232,180,0)');
    ictx.fillStyle = lg;
    ictx.beginPath();
    ictx.moveTo(312, 30); ictx.lineTo(328, 30);
    ictx.lineTo(tx + 150, 320); ictx.lineTo(tx - 150, 320);
    ictx.closePath(); ictx.fill();
    ictx.restore();

    // tiga tersangka
    for (var s = 0; s < SEATS.length; s++) drawSeat(SEATS[s].x, SEATS[s], s === ihover);

    // meja: permukaan lebar + muka depan
    TR4(40, 296, 560, 36, '#3b3226');
    TR4(40, 296, 560, 4, '#524736');
    TR4(40, 328, 560, 26, '#2a241b');
    TR4(40, 328, 560, 2, '#1a1610');
    ictx.globalAlpha = 0.5;
    TR4(40, 354, 560, 6, '#000');
    ictx.globalAlpha = 1;

    // tangan + borgol di atas permukaan meja
    for (var h = 0; h < SEATS.length; h++) drawHands(SEATS[h].x, SEATS[h]);

    // papan nama
    for (var n = 0; n < SEATS.length; n++) {
      var sp = CASE && CASE.suspects[n] ? CASE.suspects[n] : null;
      if (!sp) continue;
      var used = !!(state.accused && state.accused[sp.id]);
      var nm = sp.name.toUpperCase();
      var w = nm.length * 8 + 22;
      var cx2 = SEATS[n].x;
      var on = n === ihover && !used;
      TR4(cx2 - w / 2, 148, w, 26, '#0d1218');
      TR4(cx2 - w / 2, 148, w, 1, used ? '#3a2a2a' : (on ? '#f2b544' : '#2a3444'));
      TR4(cx2 - w / 2, 173, w, 1, used ? '#3a2a2a' : (on ? '#f2b544' : '#2a3444'));
      TR4(cx2 - w / 2, 148, 1, 26, used ? '#3a2a2a' : (on ? '#f2b544' : '#2a3444'));
      TR4(cx2 - w / 2 + w - 1, 148, 1, 26, used ? '#3a2a2a' : (on ? '#f2b544' : '#2a3444'));
      pxText4(nm, cx2 - nm.length * 4, 156, 2, used ? '#4a4244' : (on ? '#f2b544' : '#8d99ab'));
      if (used) {
        // coret: sudah pernah dituduh
        TR4(cx2 - nm.length * 4 - 2, 163, nm.length * 8 + 4, 2, '#7a3a34');
        pxText4('SUDAH', cx2 - 8, 178, 1, '#7a3a34');
      }
    }

    // vignette
    var vg = ictx.createRadialGradient(320, 200, 110, 320, 200, 400);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.76)');
    ictx.fillStyle = vg;
    ictx.fillRect(0, 0, 640, 360);
  }

  /* ---------- cutscene vonis ---------- */
  var VD_WIN = [
    'Pak Dedi menunduk lama sekali. Tangan yang diborgol itu tidak bergerak sedikit pun.',
    '"Kartu akses saya," katanya pelan. "Saya lupa kalau semuanya tercatat."',
    'Nayla ditemukan di gudang alat kebersihan dekat rumahnya. Selamat, dan sudah diperiksa di klinik.'
  ];
  var VD_LOSE = [
    'Alibi orang yang kamu tuduh tidak terbantahkan. Pengacaranya sudah menunggu di lobi.',
    'Sementara itu, satu pintu di ujung koridor terbuka dan tertutup lagi.',
    'Pelakunya menghilang sebelum fajar. Kasusnya dibuka lagi besok.'
  ];

  function vdWin() { return (CUR && CUR.verdict && CUR.verdict.win) || VD_WIN; }
  function vdLose() { return (CUR && CUR.verdict && CUR.verdict.lose) || VD_LOSE; }

  function drawVerdict(dt) {
    if (!vctx) return;
    vdTime += dt;
    var win = !!state.win;

    // ruangan
    TR5(0, 0, 640, 360, win ? '#0b0d12' : '#0a0c11');
    for (var i = 0; i < 640; i += 64) TR5(i, 0, 1, 340, win ? '#12161d' : '#111419');

    if (win) {
      // sorot lampu ke tersangka
      vctx.save();
      vctx.globalCompositeOperation = 'lighter';
      var lg = vctx.createRadialGradient(320, 200, 12, 320, 200, 200);
      lg.addColorStop(0, 'rgba(255,226,170,.22)');
      lg.addColorStop(1, 'rgba(255,226,170,0)');
      vctx.fillStyle = lg;
      vctx.fillRect(110, 20, 420, 330);
      vctx.restore();

      // meja
      TR5(232, 292, 216, 30, '#3b3226');
      TR5(232, 292, 216, 4, '#524736');
      TR5(232, 320, 216, 40, '#2a241b');
      TR5(232, 320, 216, 2, '#1a1610');

      // tersangka menunduk
      TR5(268, 212, 104, 84, '#1a2029');
      TR5(268, 212, 104, 4, '#242c38');
      TR5(268, 212, 3, 84, '#242c38');
      TR5(310, 198, 20, 16, '#c99a72');
      TR5(296, 166, 48, 36, '#c99a72');
      TR5(292, 158, 56, 14, '#1d1a18');
      TR5(296, 166, 48, 6, '#00000033');
      // mata tertutup + mulut
      TR5(304, 182, 8, 3, '#14181f');
      TR5(328, 182, 8, 3, '#14181f');
      TR5(314, 194, 12, 2, '#8a6248');

      // tangan + borgol di atas meja
      TR5(302, 296, 17, 12, '#c99a72');
      TR5(321, 296, 17, 12, '#c99a72');
      TR5(298, 294, 25, 17, '#0c1119');
      TR5(300, 296, 21, 13, '#cfd8e4');
      TR5(300, 296, 21, 2, '#ffffff');
      TR5(300, 306, 21, 2, '#8792a2');
      TR5(317, 294, 25, 17, '#0c1119');
      TR5(319, 296, 21, 13, '#cfd8e4');
      TR5(319, 296, 21, 2, '#ffffff');
      TR5(319, 306, 21, 2, '#8792a2');
      TR5(316, 300, 8, 4, '#9aa6b4');
      TR5(316, 300, 8, 1, '#e8eef6');

      // siluet detektif di foreground (kiri)
      var rimC = 'rgba(255,226,170,.30)';
      TR5(0, 246, 132, 114, '#04060a');
      TR5(6, 206, 150, 46, '#04060a');
      TR5(48, 186, 40, 26, '#04060a');
      TR5(40, 146, 56, 46, '#04060a');
      TR5(16, 136, 104, 16, '#04060a');
      TR5(48, 108, 52, 32, '#04060a');
      // rim cahaya di tepi kanan siluet
      TR5(152, 206, 3, 46, rimC);
      TR5(92, 146, 3, 46, rimC);
      TR5(116, 136, 3, 16, rimC);
      TR5(96, 108, 3, 32, rimC);
      TR5(128, 246, 3, 114, rimC);
      // kerah jas
      TR5(64, 200, 3, 46, '#0a0d13');
      TR5(46, 236, 3, 40, '#0a0d13');
    } else {
      // koridor
      TR5(0, 0, 640, 300, '#0e1319');
      for (var i2 = 0; i2 < 640; i2 += 64) TR5(i2, 0, 1, 300, '#171e26');
      // lantai
      TR5(0, 300, 640, 60, '#171d25');
      TR5(0, 300, 640, 2, '#2a3442');
      for (var f = 0; f < 7; f++) TR5(30 + f * 88, 322 + (f % 2) * 14, 52, 2, 'rgba(200,190,120,.12)');

      // pintu di ujung koridor
      TR5(228, 88, 184, 212, '#26333f');
      TR5(234, 94, 172, 206, '#0a0f15');
      // celah cahaya di balik pintu
      var p2 = Math.min(1, vdTime / 6);
      vctx.save();
      vctx.globalCompositeOperation = 'lighter';
      vctx.globalAlpha = 0.16 + 0.30 * p2;
      TR5(234, 94, 26, 206, '#8fb4dd');
      vctx.restore();

      // siluet berjalan keluar
      if (p2 > 0.12) {
        var mx = 296 + p2 * 56;
        var sc = 1 - p2 * 0.28;
        var hh = 108 * sc, bw = 36 * sc, hw = 24 * sc;
        TR5(mx - bw / 2, 300 - hh, bw, hh, '#05080c');
        TR5(mx - hw / 2, 300 - hh - 26 * sc, hw, 28 * sc, '#05080c');
        TR5(mx - hw / 2 - 6, 300 - hh - 31 * sc, hw + 12, 7 * sc, '#05080c');
        TR5(mx - hw / 2 - 4, 300 - hh - 45 * sc, hw + 8, 16 * sc, '#05080c');
      }

      // daun pintu kanan
      TR5(388, 94, 18, 206, '#26333f');
      TR5(400, 94, 6, 206, '#0a0f15');
    }

    // vignette
    var vg = vctx.createRadialGradient(320, 180, 100, 320, 180, 400);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.80)');
    vctx.fillStyle = vg;
    vctx.fillRect(0, 0, 640, 360);
  }

  function updateVerdictDom() {
    var arr = state.win ? vdWin() : vdLose();
    var idx = Math.min(arr.length - 1, Math.floor(vdTime / 4.2));
    $('vd-caption').textContent = arr[idx];
    var done = vdTime > arr.length * 4.2;
    $('btn-vd-next').style.display = done ? '' : 'none';
  }

  function finish(win) {
    var stamp = $('verdict-stamp');
    var end = (CUR && CUR.ending) || {};
    if (win) {
      stamp.textContent = 'TERBUKTI';
      stamp.className = 'verdict';
      $('end-title').textContent = (end.win && end.win.title) || 'Kasus Selesai';
      $('end-text').textContent = (end.win && end.win.text) || '';
    } else {
      stamp.textContent = 'SALAH TUDUH';
      stamp.className = 'verdict bad';
      $('end-title').textContent = (end.lose && end.lose.title) || 'Pelaku Lolos';
      $('end-text').textContent = (end.lose && end.lose.text) || '';
    }
    $('end-score').textContent = String(state.score);
    $('end-rank').textContent = rankOf(state.score);
    showScreen('scr-end');
  }

  function rankOf(s) {
    if (s >= 900) return 'Detektif Utama';
    if (s >= 700) return 'Detektif Madya';
    if (s >= 450) return 'Detektif Muda';
    return 'Detektif Magang';
  }

  /* =========================================================
     14. RESET & BRIEF
     ========================================================= */
  function resetGame() {
    state.collected = {};
    state.found = {};
    state.score = 1000;
    state.decrypted = false;
    state.potSlid = false;
    state.keyFound = false;
    state.flags = {};
    state.accused = {};
    state.win = false;
    state.picked = null;
    potAnim = 0;
    trapCooldown = 0;
    loadCase(state.caseId);
    CASE = buildCase(diff);
    placeClues();
    spawnTraps();
    updateGuardHud();
    updateScore();
    updateObjective();
    updateKeyBadge();
    var sp = CUR.spawn || { x: 216, y: 240 };
    player.x = sp.x; player.y = sp.y; player.dir = 'down'; player.moving = false; player.anim = 0;
    cam.x = Math.round(Math.max(0, Math.min(WORLD_W - VW, player.x - VW / 2)));
    cam.y = Math.round(Math.max(0, Math.min(WORLD_H - VH, player.y - VH / 2)));
    closeDialog();
    closeModal();
    var pk = $('p-keys');
    if (pk) pk.style.opacity = '1';
  }

  function setDifficulty(id) {
    diff = DIFFS[id] || DIFFS.easy;
    loadCase(state.caseId);
    CASE = buildCase(diff);
  }

  function setCase(idx) {
    state.caseId = idx;
    loadCase(idx);
    CASE = buildCase(diff);
  }

  /* =========================================================
     15. EVENTS
     ========================================================= */
  function startInvestigation() {
    $('confirm-modal').classList.remove('show');
    loadCase(state.caseId);
    resetGame();
    cutTime = 0;
    boardTime = 0;
    showScreen('scr-cutscene');
  }

  // fade-out -> ganti layar -> fade-in (dipakai transisi antar cutscene & ke gameplay)
  var fading = false;
  function fadeTo(fn) {
    if (fading) return;
    fading = true;
    var f = $('fade');
    f.classList.add('show');
    setTimeout(function () {
      fn();
      setTimeout(function () {
        f.classList.remove('show');
        fading = false;
      }, 380);
    }, 380);
  }

  function showBoard() {
    boardTime = 0;
    showScreen('scr-board');
  }

  function wire() {
    $('btn-start').addEventListener('click', function () { showScreen('scr-select'); });
    $('btn-help').addEventListener('click', function () {
      openModal('CARA MAIN', 'Alur penyelidikan',
        '1. Jalan dengan WASD atau panah, tekan E untuk memeriksa barang.  ' +
        '2. Semua barang bisa diperiksa \u2014 sebagian menyimpan petunjuk, sisanya cuma alasan.  ' +
        '3. Kumpulkan PESAN TERENKRIPSI dan KUNCI fungsinya.  ' +
        '4. Buka alat dekripsi di komputer guru, tempel sandi + kunci, lalu jalankan.  ' +
        '5. Sandi yang cocok menunjuk lokasi kunci.  ' +
        '6. Buka lemari arsip, lalu pilih tersangka di ruang interogasi.',
        'c = f(g(x))  \u2192  x = g\u207b\u00b9(f\u207b\u00b9(c))', true);
    });
    $('btn-select-back').addEventListener('click', function () { showScreen('scr-title'); });

    // cutscene CCTV -> (fade) -> papan kasus detektif
    $('btn-cut-skip').addEventListener('click', function () { fadeTo(showBoard); });
    $('btn-cut-next').addEventListener('click', function () { fadeTo(showBoard); });
    // papan kasus -> (fade) -> TKP
    $('btn-board-skip').addEventListener('click', function () { fadeTo(function () { showScreen('scr-play'); }); });
    $('btn-board-next').addEventListener('click', function () { fadeTo(function () { showScreen('scr-play'); }); });

    // popup kasus & konfirmasi mode
    $('cm-x').addEventListener('click', function () { $('case-modal').classList.remove('show'); });
    $('cf-cancel').addEventListener('click', function () {
      $('confirm-modal').classList.remove('show');
    });
    $('cf-start').addEventListener('click', startInvestigation);

    $('btn-tool-back').addEventListener('click', function () { showScreen('scr-play'); });
    $('btn-tool-done').addEventListener('click', function () {
      showScreen('scr-play');
      openDialog('KAMU MENGINGAT SESUATU',
        'Pesan yang baru kamu buka berbunyi: <code>' + CASE.plain + '</code>. ' +
        'Coba periksa pot tanaman di sudut ruangan.',
        [{ label: 'Ke pot', primary: true, fn: closeDialog }]);
    });
    $('btn-encrypt').addEventListener('click', runDecrypt);
    var pastes = document.querySelectorAll('.tool-paste');
    for (var pi = 0; pi < pastes.length; pi++) {
      (function (el) {
        el.addEventListener('click', function () { pasteClue(el.getAttribute('data-target')); });
      })(pastes[pi]);
    }
    $('btn-interro-back').addEventListener('click', function () { showScreen('scr-play'); });
    $('btn-vd-skip').addEventListener('click', function () { finish(state.win); });
    $('btn-vd-next').addEventListener('click', function () { finish(state.win); });
    $('btn-again').addEventListener('click', function () { resetGame(); showScreen('scr-select'); });

    $('modal-x').addEventListener('click', closeModal);
    $('modal-ok').addEventListener('click', function () { $('modal-x').click(); });
    modalEl.addEventListener('click', function (e) { if (e.target === modalEl) $('modal-x').click(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') $('modal-x').click();
    });

    window.addEventListener('keydown', function (e) {
      var k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'arrowdown' || k === 'arrowleft' || k === 'arrowright' || k === ' ') e.preventDefault();
      keys[k] = true;
      if (k === 'e') onInteractKey();
      if (k === 't' && activeScreen === 'scr-play' && !dialogOpen) openTool();
    });
    window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });
    window.addEventListener('blur', function () { keys = {}; });
  }

  /* =========================================================
     16. LOOP
     ========================================================= */
  function frame(ts) {
    requestAnimationFrame(frame);
    try {
      var dt = (ts - lastTs) / 1000;
      if (!isFinite(dt) || dt < 0) dt = 0;
      dt = Math.min(0.05, dt);
      lastTs = ts;
      t0 += dt;
      if (activeScreen === 'scr-play') {
        if (!dialogOpen) update(dt);
        updateDust(dt);
      }
      if (activeScreen === 'scr-cutscene') {
        cutTime += dt;
        drawCutscene();
        updateCutDom();
      }
      if (activeScreen === 'scr-board') {
        boardTime += dt;
        drawBoardScene();
        updateBoardDom();
      }
      if (activeScreen === 'scr-select') {
        selTime += dt;
        drawSelectScene();
      }
      if (activeScreen === 'scr-interro') drawInterro(dt);
      if (activeScreen === 'scr-verdict') { drawVerdict(dt); updateVerdictDom(); }
      if (activeScreen === 'scr-title') drawTitle(dt);
      draw();
    } catch (err) {
      var e = $('err');
      if (e) { e.style.display = 'block'; e.textContent = String(err && err.message ? err.message : err); }
    }
  }

  function fit() {
    var s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    $('stage').style.transform = 'scale(' + s + ')';
  }

  /* =========================================================
     17. TITLE SCENE — jalan hujan, TKP, minimarket
     ========================================================= */
  var tcv = null, tctx = null;
  var TW = 640, TH = 360;
  var tTime = 0;
  var rain = [];

  function TR(x, y, w, h, c) { tctx.fillStyle = c; tctx.fillRect(x | 0, y | 0, w | 0, h | 0); }

  var FONT3 = {
    'M': ['101', '111', '111', '101', '101'],
    'I': ['111', '010', '010', '010', '111'],
    'N': ['101', '111', '111', '111', '101'],
    'A': ['010', '101', '111', '101', '101'],
    'R': ['110', '101', '110', '101', '101'],
    'T': ['111', '010', '010', '010', '010'],
    ' ': ['000', '000', '000', '000', '000'],
    'S': ['011', '100', '010', '001', '110'],
    'O': ['010', '101', '101', '101', '010'],
    'P': ['110', '101', '110', '100', '100'],
    'E': ['111', '100', '110', '100', '111'],
    'L': ['100', '100', '100', '100', '111'],
    'C': ['011', '100', '100', '100', '011'],
    'K': ['101', '101', '110', '101', '101'],
    'Y': ['101', '101', '010', '010', '010'],
    'B': ['110', '101', '110', '101', '110'],
    'U': ['101', '101', '101', '101', '111'],
    'D': ['110', '101', '101', '101', '110'],
    'G': ['011', '100', '101', '101', '011'],
    'H': ['101', '101', '111', '101', '101'],
    '0': ['111', '101', '101', '101', '111'],
    '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'],
    '3': ['111', '001', '011', '001', '111'],
    '4': ['101', '101', '111', '001', '001'],
    '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'],
    '7': ['111', '001', '010', '010', '010'],
    '8': ['111', '101', '111', '101', '111'],
    '9': ['111', '101', '111', '001', '111'],
    ':': ['000', '010', '000', '010', '000'],
    '.': ['000', '000', '000', '000', '010']
  };

  function pxText(txt, x, y, sc, col) {
    tctx.fillStyle = col;
    for (var i = 0; i < txt.length; i++) {
      var gl = FONT3[txt.charAt(i)] || FONT3[' '];
      for (var r = 0; r < 5; r++) {
        for (var c = 0; c < 3; c++) {
          if (gl[r].charAt(c) === '1') tctx.fillRect(x + (i * 4 + c) * sc, y + r * sc, sc, sc);
        }
      }
    }
  }

  function initTitle() {
    tcv = $('tcv');
    if (!tcv) return;
    tctx = tcv.getContext('2d');
    tctx.imageSmoothingEnabled = false;
    rain = [];
    for (var i = 0; i < 112; i++) {
      rain.push({
        x: Math.random() * TW,
        y: Math.random() * TH,
        v: 170 + Math.random() * 150,
        l: 4 + Math.random() * 7,
        a: 0.07 + Math.random() * 0.17
      });
    }
  }

  function flicker() {
    var n = Math.sin(tTime * 13.7) + Math.sin(tTime * 6.1);
    if (n > 1.62) return 0.30;
    if (n > 1.45) return 0.70;
    if (n < -1.85) return 0.82;
    return 1;
  }

  /* ---------- rumah terbengkalai (kiri) ---------- */
  function drawAbandonedHouse() {
    // dinding dasar
    TR(0, 14, 288, 226, '#3a3128');

    // papan vertikal lapuk
    for (var i = 0; i < 288; i += 18) {
      TR(i, 14, 17, 226, (i % 36 === 0) ? '#423930' : '#352c24');
      TR(i + 17, 14, 1, 226, '#1e1712');
    }

    // noda air menurun
    for (var s = 0; s < 16; s++) {
      var sx = 6 + (s * 41) % 274;
      var sh = 28 + (s * 23) % 96;
      tctx.globalAlpha = 0.26;
      TR(sx, 26, 3, sh, '#150f0b');
      tctx.globalAlpha = 1;
    }

    // cat mengelupas
    for (var p = 0; p < 14; p++) {
      var px = 4 + (p * 37) % 264;
      var py = 34 + (p * 29) % 150;
      TR(px, py, 10 + (p % 4) * 6, 5 + (p % 3) * 4, '#524738');
    }

    // retak dinding
    var cr = [[14, 60], [166, 96], [252, 62], [96, 108]];
    for (var c = 0; c < cr.length; c++) {
      var cx = cr[c][0], cy = cr[c][1];
      for (var k = 0; k < 14; k++) {
        TR(cx + (k % 2 ? 1 : 0), cy + k * 3, 2, 3, '#1a1410');
      }
    }

    // atap / lis atas
    TR(0, 10, 288, 8, '#241d17');
    TR(0, 10, 288, 2, '#423930');
    // talang rusak
    TR(0, 18, 146, 3, '#4a4034');
    TR(146, 21, 44, 3, '#352c24');
    TR(190, 25, 98, 3, '#241d17');
    TR(230, 25, 6, 10, '#241d17');

    // ---- jendela pecah ----
    TR(28, 142, 76, 56, '#0b0806');
    TR(28, 142, 76, 4, '#54483a');
    TR(28, 194, 76, 4, '#54483a');
    TR(28, 142, 4, 56, '#54483a');
    TR(100, 142, 4, 56, '#54483a');
    TR(64, 142, 3, 56, '#423930');
    // sisa kaca + retak
    TR(34, 148, 9, 8, 'rgba(160,200,228,.30)');
    TR(36, 152, 2, 14, 'rgba(210,232,248,.42)');
    TR(38, 164, 11, 2, 'rgba(210,232,248,.42)');
    TR(48, 158, 9, 2, 'rgba(210,232,248,.32)');
    TR(56, 166, 2, 11, 'rgba(210,232,248,.32)');
    TR(92, 176, 7, 10, 'rgba(160,200,228,.24)');
    TR(94, 180, 2, 8, 'rgba(210,232,248,.34)');
    // serpihan kaca di tanah
    TR(34, 200, 4, 3, 'rgba(190,222,244,.50)');
    TR(42, 203, 3, 2, 'rgba(190,222,244,.42)');
    TR(50, 201, 5, 2, 'rgba(190,222,244,.34)');
    TR(80, 202, 3, 2, 'rgba(190,222,244,.30)');
    // sarang laba-laba di pojok
    TR(32, 146, 12, 1, 'rgba(220,228,238,.20)');
    TR(32, 146, 1, 12, 'rgba(220,228,238,.20)');
    TR(32, 146, 7, 7, 'rgba(220,228,238,.10)');
    // papan melintang
    TR(26, 160, 80, 6, '#63503a');
    TR(26, 160, 80, 2, '#7a6448');
    // papan diagonal + paku
    for (var b = 0; b < 50; b++) {
      TR(30 + b, 148 + Math.round(b * 0.55), 6, 4, '#6d5940');
      TR(30 + b, 148 + Math.round(b * 0.55), 6, 1, '#8a7355');
    }
    TR(34, 152, 3, 3, '#c9cfd8');
    TR(34, 154, 3, 1, '#1a1410');
    TR(74, 173, 3, 3, '#c9cfd8');
    TR(74, 175, 3, 1, '#1a1410');

    // ---- pintu menggantung ----
    TR(120, 162, 48, 78, '#0a0705');
    TR(120, 162, 48, 3, '#54483a');
    for (var d = 0; d < 74; d += 4) {
      var off = Math.floor(d / 17);
      TR(112 - off, 166 + d, 34, 4, (d % 8 === 0) ? '#4e3c2c' : '#463528');
    }
    TR(112, 166, 3, 74, '#66513a');
    TR(140, 198, 4, 4, '#a89470');
    TR(146, 170, 6, 3, '#6e6358');
    TR(146, 232, 6, 3, '#6e6358');
    // celah gelap di samping pintu
    TR(145, 166, 4, 72, '#050403');

    // lampu teras mati di atas pintu
    TR(136, 152, 14, 4, '#54483a');
    TR(139, 156, 8, 6, '#2e2822');

    // ---- jendela dipaku ----
    TR(186, 146, 70, 54, '#0b0806');
    TR(186, 146, 70, 4, '#54483a');
    TR(186, 196, 70, 4, '#54483a');
    TR(186, 146, 4, 54, '#54483a');
    TR(252, 146, 4, 54, '#54483a');
    // papan tidak rata + paku
    TR(182, 163, 78, 7, '#6d5940');
    TR(182, 163, 78, 2, '#8a7355');
    TR(184, 179, 74, 6, '#5f4d38');
    TR(184, 179, 74, 2, '#736044');
    TR(188, 165, 3, 3, '#c9cfd8');
    TR(250, 165, 3, 3, '#c9cfd8');
    TR(190, 181, 3, 3, '#c9cfd8');
    TR(248, 181, 3, 3, '#c9cfd8');
    // celah gelap
    TR(190, 150, 62, 12, '#050403');

    // ---- rumput liar (rumpun) ----
    var cl = [12, 54, 92, 148, 202, 244];
    for (var ci = 0; ci < cl.length; ci++) {
      var cx0 = cl[ci];
      for (var b2 = 0; b2 < 5; b2++) {
        var hh = 8 + ((ci * 7 + b2 * 5) % 15);
        TR(cx0 + b2 * 3, 240 - hh, 2, hh, (b2 % 3 === 0) ? '#455c34' : '#33452a');
        if (hh > 15) TR(cx0 + b2 * 3 + (b2 % 2 ? 1 : -1), 240 - hh - 2, 2, 3, '#3d5030');
      }
    }

    // ---- puing bata acak ----
    var rb = [[16, 232, 11, 5], [31, 238, 7, 4], [52, 236, 9, 4], [88, 239, 8, 3],
              [118, 237, 6, 4], [150, 239, 10, 4], [204, 233, 12, 5], [228, 239, 7, 4],
              [262, 236, 9, 4], [40, 231, 6, 3], [176, 234, 8, 3]];
    for (var r = 0; r < rb.length; r++) {
      TR(rb[r][0], rb[r][1], rb[r][2], rb[r][3], (r % 2) ? '#6a4034' : '#553229');
      TR(rb[r][0], rb[r][1], rb[r][2], 1, '#7d4c3d');
    }
    TR(20, 240, 4, 2, '#4a2d24');
    TR(58, 241, 3, 2, '#4a2d24');
    TR(212, 241, 4, 2, '#4a2d24');
  }

  function applyLeftShade() {
    var vg = tctx.createLinearGradient(0, 10, 0, 144);
    vg.addColorStop(0, 'rgba(3,4,7,.64)');
    vg.addColorStop(0.68, 'rgba(3,4,7,.34)');
    vg.addColorStop(1, 'rgba(3,4,7,0)');
    tctx.fillStyle = vg;
    tctx.fillRect(0, 10, 300, 136);
  }

  /* ---------- langit malam + bulan ---------- */
  function drawSky() {
    var g = tctx;
    var sky = g.createLinearGradient(0, 0, 0, 214);
    sky.addColorStop(0, '#060a12');
    sky.addColorStop(0.55, '#0b1220');
    sky.addColorStop(1, '#131b27');
    g.fillStyle = sky;
    g.fillRect(0, 0, 640, 214);

    // bintang
    for (var i = 0; i < 64; i++) {
      var sx = (i * 97) % 640, sy = 3 + (i * 41) % 104;
      g.globalAlpha = 0.18 + 0.40 * Math.abs(Math.sin(tTime * 0.8 + i * 1.7));
      TR(sx, sy, 1, 1, '#cfe0f5');
    }
    g.globalAlpha = 1;

    // halo bulan
    g.save();
    g.globalCompositeOperation = 'lighter';
    var mg = g.createRadialGradient(556, 42, 6, 556, 42, 96);
    mg.addColorStop(0, 'rgba(200,222,255,.26)');
    mg.addColorStop(0.42, 'rgba(168,198,240,.09)');
    mg.addColorStop(1, 'rgba(150,180,230,0)');
    g.fillStyle = mg;
    g.fillRect(452, -54, 208, 194);
    g.restore();

    // bulan
    TR(548, 34, 17, 17, '#dfe8f5');
    TR(550, 32, 13, 21, '#dfe8f5');
    TR(546, 36, 21, 13, '#dfe8f5');
    TR(552, 38, 5, 4, '#c2cee0');
    TR(557, 44, 6, 5, '#c2cee0');
    TR(550, 47, 4, 3, '#c2cee0');

    // silhouette pepohonan jauh
    for (var j = 0; j < 15; j++) {
      var bx = j * 44;
      var bh = 24 + (j * 23) % 30;
      TR(bx, 200 - bh, 46, bh, '#0a1018');
    }
    for (var k = 0; k < 13; k++) {
      var tx = 16 + k * 52;
      var th = 26 + (k * 17) % 24;
      TR(tx, 200 - th, 5, th, '#0a1018');
      TR(tx - 10, 200 - th - 12, 26, 15, '#0a1018');
      TR(tx - 4, 200 - th - 20, 15, 10, '#0a1018');
    }
  }

  /* ---------- lahan kosong (kanan) ---------- */
  function drawLot() {
    // tanah
    TR(294, 196, 346, 56, '#302a1f');
    TR(294, 196, 346, 5, '#3d3626');

    // bercak tanah & lumpur
    for (var i = 0; i < 30; i++) {
      var bx = 298 + (i * 53) % 338;
      var by = 202 + (i * 17) % 44;
      TR(bx, by, 8 + (i % 4) * 7, 3 + (i % 3) * 2, (i % 2) ? '#3b3422' : '#241f15');
    }

    // rumput
    for (var g = 0; g < 90; g++) {
      var gx = 294 + (g * 13) % 344;
      var gy = 196 + (g * 31) % 54;
      var gh = 3 + (g * 7) % 10;
      TR(gx, gy - gh, 2, gh, (g % 3 === 0) ? '#40542f' : '#2f3f26');
    }
    // rumpun tinggi
    var cl = [300, 340, 388, 430, 476, 528, 578, 620];
    for (var ci = 0; ci < cl.length; ci++) {
      for (var b = 0; b < 4; b++) {
        var hh = 7 + ((ci * 5 + b * 4) % 12);
        TR(cl[ci] + b * 3, 232 - hh, 2, hh, (b % 2) ? '#42582f' : '#33452a');
      }
    }

    // ---- pagar rusak ----
    TR(294, 186, 346, 4, '#3a3128');
    for (var p = 0; p < 15; p++) {
      var px = 296 + p * 23;
      var ph = 20 + (p * 11) % 12;
      var lean = (p % 5 === 0) ? 3 : 0;
      TR(px + lean, 192 - ph, 5, ph + 14, (p % 3 === 0) ? '#4a4034' : '#3d3529');
      TR(px + lean, 192 - ph, 5, 2, '#5a4e3e');
      if (p % 7 === 3) TR(px + lean, 192 - ph - 5, 5, 6, '#2b2519');
    }
    // papan pagar patah
    TR(340, 198, 26, 4, '#4a4034');
    TR(366, 202, 14, 4, '#3d3529');
    // bayangan pagar
    tctx.globalAlpha = 0.32;
    TR(294, 202, 346, 6, '#000');
    tctx.globalAlpha = 1;

    // ---- pohon ----
    drawTree(360, 200, 1.0);
    drawTree(608, 200, 1.15);
    drawTree(492, 198, 0.72);
  }

  function drawTree(cx, baseY, sc) {
    var tw = Math.round(11 * sc), th = Math.round(96 * sc);
    var rx = Math.round(44 * sc), ry = Math.round(38 * sc);
    var cy = baseY - th;

    // batang
    TR(cx - (tw >> 1), cy, tw, th, '#181410');
    TR(cx - (tw >> 1), cy, 2, th, '#241d16');
    // cabang
    TR(cx - Math.round(16 * sc), cy + Math.round(20 * sc), Math.round(16 * sc), 3, '#181410');
    TR(cx + Math.round(2 * sc), cy + Math.round(12 * sc), Math.round(15 * sc), 3, '#181410');

    // kanopi (3 lapis)
    var layers = [
      [cx, cy - ry * 0.30, rx * 1.00, ry * 1.00, '#101a12'],
      [cx - rx * 0.34, cy - ry * 0.06, rx * 0.72, ry * 0.74, '#0c150f'],
      [cx + rx * 0.30, cy - ry * 0.10, rx * 0.68, ry * 0.70, '#0c150f'],
      [cx - rx * 0.10, cy - ry * 0.52, rx * 0.62, ry * 0.58, '#0e1811']
    ];
    for (var l = 0; l < layers.length; l++) {
      tctx.fillStyle = layers[l][4];
      tctx.beginPath();
      tctx.ellipse(layers[l][0], layers[l][1], layers[l][2], layers[l][3], 0, 0, 6.283);
      tctx.fill();
    }

    // bayangan pohon di tanah
    tctx.globalAlpha = 0.38;
    tctx.fillStyle = '#000';
    tctx.beginPath();
    tctx.ellipse(cx - 10, baseY + 6, rx * 0.9, 6 * sc, 0, 0, 6.283);
    tctx.fill();
    tctx.globalAlpha = 1;

    // rim bulan di kanan atas kanopi
    tctx.save();
    tctx.globalAlpha = 0.20;
    tctx.strokeStyle = '#a9c4e8';
    tctx.lineWidth = 1.5;
    tctx.beginPath();
    tctx.ellipse(cx, cy - ry * 0.30, rx * 1.00, ry * 1.00, 0, -1.9, -0.55);
    tctx.stroke();
    tctx.restore();
  }

  /* ---------- jalan tanah ---------- */
  function drawRoad() {
    TR(0, 248, 640, 112, '#332f27');
    TR(0, 248, 640, 6, '#4e4636');
    TR(0, 252, 640, 108, '#2d2922');

    // bekas roda
    for (var x = 0; x < 640; x += 8) {
      var wob = Math.sin(x * 0.05) * 2;
      TR(x, 300 + wob, 8, 3, 'rgba(96,86,68,.50)');
      TR(x, 322 + wob, 8, 3, 'rgba(96,86,68,.42)');
    }
    // kerikil & tekstur
    for (var i = 0; i < 120; i++) {
      var gx = (i * 71) % 640;
      var gy = 254 + (i * 37) % 100;
      var gs = 1 + (i % 3);
      TR(gx, gy, gs, gs, (i % 4 === 0) ? 'rgba(150,138,112,.38)' : 'rgba(18,15,11,.45)');
    }
    // genangan air
    var pd = [[96, 300, 34, 9], [300, 320, 46, 11], [470, 292, 30, 8], [566, 334, 40, 10]];
    for (var p = 0; p < pd.length; p++) {
      tctx.save();
      var pg = tctx.createRadialGradient(pd[p][0], pd[p][1], 1, pd[p][0], pd[p][1], pd[p][2]);
      pg.addColorStop(0, 'rgba(132,170,210,.46)');
      pg.addColorStop(0.6, 'rgba(98,134,176,.22)');
      pg.addColorStop(1, 'rgba(70,100,140,0)');
      tctx.fillStyle = pg;
      tctx.beginPath();
      tctx.ellipse(pd[p][0], pd[p][1], pd[p][2], pd[p][3], 0, 0, 6.283);
      tctx.fill();
      tctx.globalAlpha = 0.34;
      tctx.fillStyle = '#d2e4f6';
      tctx.beginPath();
      tctx.ellipse(pd[p][0] + 7, pd[p][1] - 2, pd[p][2] * 0.32, pd[p][3] * 0.30, 0, 0, 6.283);
      tctx.fill();
      tctx.restore();
    }
    // tepi jalan (talud tanah berumput)
    TR(0, 242, 640, 6, '#544a38');
    TR(0, 242, 640, 2, '#665a44');
    TR(0, 248, 640, 2, '#221c14');
    for (var v = 0; v < 60; v++) {
      var vx = (v * 19) % 640;
      var vh = 3 + (v * 5) % 7;
      TR(vx, 243 - vh, 2, vh, (v % 3 === 0) ? '#4a5f38' : '#384a2c');
    }

    // rumput di tepi jalan
    for (var t = 0; t < 44; t++) {
      var tx = (t * 29) % 640;
      var th = 3 + (t * 7) % 7;
      TR(tx, 249 - th, 2, th, (t % 3 === 0) ? '#3d5030' : '#2f3f26');
    }

    // bayangan gelap dari bangunan
    var sg = tctx.createLinearGradient(0, 252, 0, 300);
    sg.addColorStop(0, 'rgba(0,0,0,.36)');
    sg.addColorStop(1, 'rgba(0,0,0,0)');
    tctx.fillStyle = sg;
    tctx.fillRect(0, 252, 640, 48);
  }

  /* ---------- pita TKP di depan rumah ---------- */
  function pxGlyph(ch, x, y, sc, col) {
    var gl = FONT3[ch] || FONT3[' '];
    tctx.fillStyle = col;
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 3; c++) {
        if (gl[r].charAt(c) === '1') tctx.fillRect(x + c * sc, y + r * sc, sc, sc);
      }
    }
  }

  function drawHouseTape() {
    var x1 = -14, x2 = 302;
    var yb = 218, sag = 10, H = 16;

    function ty(x) {
      var t = (x - x1) / (x2 - x1);
      return yb + Math.sin(t * Math.PI) * sag;
    }

    // tiang
    var p1 = ty(x1 + 10), p2 = ty(x2 - 10);
    TR(x1 + 8, p1 - 6, 5, 62, '#4a4034');
    TR(x1 + 9, p1 - 6, 1, 62, '#63574a');
    TR(x2 - 12, p2 - 6, 5, 62, '#4a4034');
    TR(x2 - 11, p2 - 6, 1, 62, '#63574a');
    tctx.globalAlpha = 0.35;
    tctx.fillStyle = '#000';
    tctx.beginPath(); tctx.ellipse(x1 + 10, p1 + 56, 8, 3, 0, 0, 6.283); tctx.fill();
    tctx.beginPath(); tctx.ellipse(x2 - 10, p2 + 56, 8, 3, 0, 0, 6.283); tctx.fill();
    tctx.globalAlpha = 1;

    // pita kuning
    for (var x = x1; x <= x2; x += 2) {
      var y = ty(x);
      TR(x, y, 3, H, '#e0b13c');
      TR(x, y, 3, 2, '#f5cf74');
      TR(x, y + H - 2, 3, 2, '#b8891c');
    }

    // tulisan POLICE LINE DO NOT CROSS
    var label = 'POLICE LINE DO NOT CROSS  ';
    var adv = 8, startX = 6;
    for (var i = 0; ; i++) {
      var gx = startX + i * adv;
      if (gx > x2 - 10) break;
      var ch = label.charAt(i % label.length);
      if (ch === ' ') continue;
      pxGlyph(ch, gx, ty(gx) + 3, 2, '#241a08');
    }
  }

  /* ---------- pencahayaan ---------- */
  function drawLighting() {
    // ambient bulan (dingin, dari kanan atas)
    tctx.save();
    tctx.globalCompositeOperation = 'lighter';
    var mg = tctx.createLinearGradient(640, 0, 180, 360);
    mg.addColorStop(0, 'rgba(116,162,224,.13)');
    mg.addColorStop(0.55, 'rgba(110,155,215,.05)');
    mg.addColorStop(1, 'rgba(100,145,205,0)');
    tctx.fillStyle = mg;
    tctx.fillRect(0, 0, 640, 360);
    tctx.restore();

    // strobo mobil polisi
    var ph = (tTime * 2.1) % 1;
    var isRed = ph < 0.5;
    var amp = 0.13 + 0.11 * Math.abs(Math.sin(tTime * 7));
    tctx.save();
    tctx.globalCompositeOperation = 'lighter';
    var pg = tctx.createRadialGradient(502, 250, 4, 502, 250, 128);
    pg.addColorStop(0, isRed ? 'rgba(232,86,74,' + amp.toFixed(3) + ')' : 'rgba(74,140,232,' + amp.toFixed(3) + ')');
    pg.addColorStop(0.5, isRed ? 'rgba(232,86,74,' + (amp * 0.34).toFixed(3) + ')' : 'rgba(74,140,232,' + (amp * 0.34).toFixed(3) + ')');
    pg.addColorStop(1, 'rgba(0,0,0,0)');
    tctx.fillStyle = pg;
    tctx.fillRect(320, 96, 320, 280);
    tctx.restore();
  }

  /* ---------- mobil polisi (menghadap kiri) ---------- */
  function drawCar() {
    var x = 428, y = 246;

    tctx.globalAlpha = 0.5;
    TR(x + 4, y + 54, 164, 7, '#000');
    tctx.globalAlpha = 1;

    // bodi utama
    TR(x, y + 24, 168, 22, '#1d2a44');
    TR(x, y + 24, 168, 3, '#2c3f63');
    TR(x, y + 42, 168, 4, '#141d30');

    // kap (depan, kiri) + bagasi (belakang, kanan)
    TR(x + 2, y + 17, 56, 9, '#e8ecf2');
    TR(x + 2, y + 17, 56, 2, '#ffffff');
    TR(x + 138, y + 17, 28, 9, '#e8ecf2');
    TR(x + 138, y + 17, 28, 2, '#ffffff');

    // kabin (atap lebih sempit + pilar miring)
    TR(x + 66, y + 4, 60, 5, '#e8ecf2');
    TR(x + 60, y + 9, 74, 10, '#e8ecf2');
    TR(x + 56, y + 11, 6, 8, '#e8ecf2');
    TR(x + 132, y + 11, 6, 8, '#e8ecf2');

    // kaca
    TR(x + 64, y + 7, 30, 9, '#8fb4dd');
    TR(x + 98, y + 7, 30, 9, '#8fb4dd');
    tctx.globalAlpha = 0.35;
    TR(x + 66, y + 8, 10, 4, '#ffffff');
    TR(x + 100, y + 8, 10, 4, '#ffffff');
    tctx.globalAlpha = 1;

    // garis pintu + tulisan
    TR(x + 98, y + 17, 2, 28, '#0e1526');
    TR(x + 22, y + 31, 34, 4, '#f2c14e');
    TR(x + 118, y + 31, 28, 4, '#f2c14e');

    // lampu
    TR(x + 1, y + 32, 6, 5, '#fff3c4');
    TR(x + 162, y + 32, 5, 5, '#e8564a');

    // rotator
    var blink = Math.floor(tTime * 4) % 2;
    TR(x + 66, y - 6, 18, 7, blink ? '#e8564a' : '#1b2230');
    TR(x + 88, y - 6, 18, 7, blink ? '#1b2230' : '#3b7fe0');
    tctx.globalAlpha = 0.22;
    tctx.globalCompositeOperation = 'lighter';
    TR(x + 52, y - 16, 70, 26, blink ? '#e8564a' : '#3b7fe0');
    tctx.globalCompositeOperation = 'source-over';
    tctx.globalAlpha = 1;

    // roda
    TR(x + 16, y + 38, 26, 18, '#0a0d12');
    TR(x + 20, y + 41, 18, 11, '#2a3340');
    TR(x + 126, y + 38, 26, 18, '#0a0d12');
    TR(x + 130, y + 41, 18, 11, '#2a3340');

    // sorot lampu depan ke kiri
    tctx.save();
    tctx.globalCompositeOperation = 'lighter';
    var hg = tctx.createLinearGradient(x - 150, 0, x, 0);
    hg.addColorStop(0, 'rgba(255,240,190,0)');
    hg.addColorStop(1, 'rgba(255,240,190,.20)');
    tctx.fillStyle = hg;
    tctx.beginPath();
    tctx.moveTo(x + 2, y + 31); tctx.lineTo(x + 2, y + 38);
    tctx.lineTo(x - 150, y + 62); tctx.lineTo(x - 150, y + 8);
    tctx.closePath(); tctx.fill();
    tctx.restore();
  }

  /* ---------- polisi + tersangka (kecil, di samping mobil) ---------- */
  function drawArrest() {
    var SK = '#e8b48a';
    var UNI = '#1f3a63', UNI2 = '#2a4c80';
    var HOOD = '#4a4f57', HOOD2 = '#383d44';

    // bayangan kontak
    tctx.globalAlpha = 0.58;
    tctx.fillStyle = '#000';
    tctx.beginPath(); tctx.ellipse(324, 252, 32, 6, 0, 0, 6.283); tctx.fill();
    tctx.beginPath(); tctx.ellipse(365, 252, 32, 6, 0, 0, 6.283); tctx.fill();
    tctx.globalAlpha = 1;

    /* tersangka */
    var sx = 316, sy = 250;
    TR(sx + 1, sy - 6, 24, 6, '#0f1218');
    TR(sx + 4, sy - 22, 16, 17, '#2b3038');
    TR(sx - 1, sy - 44, 26, 24, HOOD);
    TR(sx - 1, sy - 44, 26, 3, HOOD2);
    TR(sx + 21, sy - 42, 6, 15, HOOD2);
    TR(sx + 25, sy - 28, 7, 6, SK);
    TR(sx + 3, sy - 58, 16, 16, SK);
    TR(sx + 1, sy - 60, 20, 7, '#221a14');
    TR(sx + 6, sy - 50, 3, 2, '#14181f');
    TR(sx + 13, sy - 50, 3, 2, '#14181f');
    TR(sx + 6, sy - 45, 7, 1, '#b98f6c');

    /* borgol */
    TR(sx + 22, sy - 34, 20, 13, 'rgba(0,0,0,.45)');
    TR(sx + 23, sy - 32, 6, 6, '#e6ecf5');
    TR(sx + 23, sy - 32, 6, 1, '#ffffff');
    TR(sx + 29, sy - 30, 3, 2, '#cfd6e0');
    TR(sx + 32, sy - 32, 6, 6, '#e6ecf5');
    TR(sx + 32, sy - 32, 6, 1, '#ffffff');

    /* polisi */
    var px = 357, py = 250;
    TR(px + 1, py - 6, 24, 6, '#0f1218');
    TR(px + 4, py - 22, 16, 17, '#16233a');
    TR(px - 1, py - 46, 26, 26, UNI);
    TR(px - 1, py - 46, 26, 3, UNI2);
    TR(px + 1, py - 42, 8, 4, '#f2c14e');
    TR(px + 1, py - 28, 22, 4, '#0f1218');
    TR(px - 9, py - 44, 9, 12, UNI2);
    TR(px - 11, py - 34, 9, 6, SK);
    TR(px + 3, py - 64, 16, 18, SK);
    TR(px + 1, py - 68, 20, 6, '#16233a');
    TR(px + 6, py - 58, 3, 2, '#14181f');
    TR(px + 13, py - 58, 3, 2, '#14181f');
  }

  /* ---------- detektif sedang menyelidiki ---------- */
  function drawDetective() {
    var S = '#0b0e13';
    var L = '#171c25';
    var D = '#05070a';
    var rim = 'rgba(255,236,200,.90)';

    // backlight bulan (dingin) dari kanan atas
    tctx.save();
    tctx.globalCompositeOperation = 'lighter';
    var bg2 = tctx.createRadialGradient(318, 226, 8, 318, 226, 150);
    bg2.addColorStop(0, 'rgba(146,184,236,.13)');
    bg2.addColorStop(0.5, 'rgba(138,176,230,.05)');
    bg2.addColorStop(1, 'rgba(130,170,224,0)');
    tctx.fillStyle = bg2;
    tctx.fillRect(188, 146, 214, 206);
    tctx.restore();

    // sorot senter ke tembok rumah
    tctx.save();
    tctx.globalCompositeOperation = 'lighter';
    var pool = tctx.createRadialGradient(74, 214, 4, 74, 214, 76);
    pool.addColorStop(0, 'rgba(255,244,206,.34)');
    pool.addColorStop(0.55, 'rgba(255,240,196,.14)');
    pool.addColorStop(1, 'rgba(255,236,186,0)');
    tctx.fillStyle = pool;
    tctx.beginPath();
    tctx.ellipse(74, 214, 78, 62, 0, 0, 6.283);
    tctx.fill();

    var beam = tctx.createLinearGradient(222, 0, 30, 0);
    beam.addColorStop(0, 'rgba(255,244,206,.30)');
    beam.addColorStop(1, 'rgba(255,244,206,0)');
    tctx.fillStyle = beam;
    tctx.beginPath();
    tctx.moveTo(222, 260);
    tctx.lineTo(222, 276);
    tctx.lineTo(24, 268);
    tctx.lineTo(24, 158);
    tctx.closePath();
    tctx.fill();
    tctx.restore();

    // bayangan
    tctx.globalAlpha = 0.45;
    TR(242, 328, 68, 8, '#000');
    tctx.globalAlpha = 1;

    // sepatu + kaki
    TR(258, 328, 22, 8, S);
    TR(276, 328, 22, 8, S);
    TR(262, 310, 15, 20, S);
    TR(278, 310, 15, 20, S);
    TR(262, 310, 3, 20, D);

    // jas
    TR(254, 292, 44, 20, S);
    TR(256, 276, 42, 18, S);
    TR(258, 262, 40, 16, S);
    TR(260, 250, 38, 14, S);
    TR(276, 262, 22, 50, L);

    // lengan menjulur ke kiri memegang senter
    TR(258, 252, 14, 12, S);
    TR(250, 258, 14, 11, S);
    TR(242, 264, 14, 10, S);
    TR(234, 268, 11, 9, S);
    TR(250, 258, 14, 1, 'rgba(255,240,200,.22)');
    TR(242, 264, 14, 1, 'rgba(255,240,200,.22)');

    // kepala (profil menghadap KIRI)
    TR(270, 240, 14, 10, S);
    TR(266, 218, 26, 24, S);
    TR(260, 226, 6, 9, S);       // hidung
    TR(263, 238, 7, 5, S);       // dagu
    TR(252, 212, 48, 7, S);      // bibir topi
    TR(268, 198, 22, 15, S);     // mahkota topi

    // pita topi + kerah
    TR(268, 206, 22, 2, D);
    TR(278, 252, 3, 40, D);

    // rim light dari toko (sisi kanan, dipatah-patah)
    var rim2 = 'rgba(180,210,246,.60)';
    TR(292, 200, 2, 12, rim2);
    TR(297, 213, 2, 5, rim2);
    TR(292, 219, 2, 9, rim2);
    TR(292, 232, 2, 8, rim2);
    TR(298, 252, 2, 13, rim2);
    TR(298, 270, 2, 11, rim2);
    TR(298, 286, 2, 13, rim2);
    TR(298, 303, 2, 9, rim2);
    TR(293, 312, 2, 14, rim2);

    // pantulan hangat dari senter (sisi kiri)
    TR(254, 256, 2, 34, 'rgba(255,240,200,.16)');
    TR(266, 220, 2, 20, 'rgba(255,240,200,.12)');

    // senter
    TR(224, 265, 14, 7, '#3a4452');
    TR(224, 265, 14, 2, '#56637a');
    TR(230, 265, 2, 7, '#242c38');
    TR(236, 265, 2, 7, '#242c38');
    TR(220, 262, 6, 13, '#5a6678');
    TR(219, 264, 3, 9, '#fff6d8');

    // pipa rokok (menghadap kiri)
    TR(246, 236, 14, 3, '#8a6038');
    TR(246, 236, 14, 1, '#b08555');
    TR(235, 224, 12, 15, '#8a6038');
    TR(235, 224, 12, 3, '#b08555');
    TR(235, 236, 12, 3, '#6b4528');
    TR(235, 224, 2, 15, '#a67c4e');
    TR(237, 227, 8, 5, '#1a0f06');

    var ember = 0.78 + 0.22 * Math.sin(tTime * 5.5);
    tctx.globalAlpha = ember;
    TR(238, 227, 6, 4, '#ff7a3d');
    TR(239, 227, 4, 2, '#ffe8b8');
    tctx.globalAlpha = 1;
    tctx.save();
    tctx.globalCompositeOperation = 'lighter';
    tctx.globalAlpha = 0.20 * ember;
    TR(234, 221, 14, 12, '#ff8a3d');
    tctx.restore();

    // asap pipa
    for (var s = 0; s < 8; s++) {
      var ph = (tTime * 0.45 + s * 0.125) % 1;
      var sx2 = 238 + ph * 20 + Math.sin(ph * 5.5 + s * 1.3) * 8;
      var sy2 = 221 - ph * 56;
      tctx.globalAlpha = (1 - ph) * 0.30;
      tctx.fillStyle = '#dbe2ec';
      tctx.beginPath();
      tctx.arc(sx2, sy2, 1.8 + ph * 5.5, 0, 6.283);
      tctx.fill();
    }
    tctx.globalAlpha = 1;
  }

  /* ---------- hujan ---------- */
  function drawRain(dt) {
    tctx.strokeStyle = 'rgba(178,208,236,.55)';
    tctx.lineWidth = 1;
    for (var i = 0; i < rain.length; i++) {
      var d = rain[i];
      d.y += d.v * dt;
      d.x -= d.v * 0.16 * dt;
      if (d.y > TH) { d.y = -d.l; d.x = Math.random() * TW; }
      if (d.x < -10) d.x = TW + 10;
      tctx.globalAlpha = d.a;
      tctx.beginPath();
      tctx.moveTo(d.x, d.y);
      tctx.lineTo(d.x + d.l * 0.16, d.y + d.l);
      tctx.stroke();
    }
    tctx.globalAlpha = 1;

    tctx.strokeStyle = 'rgba(160,200,236,.45)';
    for (var s = 0; s < 26; s++) {
      var ph = (tTime * 1.5 + s * 0.37) % 1;
      var rx = 20 + (s * 79) % 600;
      var ry = 256 + (s * 41) % 96;
      tctx.globalAlpha = (1 - ph) * 0.42;
      tctx.beginPath();
      tctx.arc(rx, ry, 2 + ph * 5, 0, 6.283);
      tctx.stroke();
    }
    tctx.globalAlpha = 1;
  }

  function drawTitle(dt) {
    if (!tctx) return;
    tTime += dt;
    var g = tctx;

    drawSky();

    drawAbandonedHouse();
    applyLeftShade();
    drawLot();
    drawRoad();
    drawArrest();
    drawCar();
    drawHouseTape();
    drawDetective();
    drawLighting();
    drawRain(dt);

    var vg = g.createRadialGradient(360, 190, 120, 360, 190, 430);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(0.62, 'rgba(0,0,0,.16)');
    vg.addColorStop(1, 'rgba(0,0,0,.60)');
    g.fillStyle = vg;
    g.fillRect(0, 0, TW, TH);
  }

  /* =========================================================
     17B. CUTSCENE CCTV — rekaman malam kejadian
     ========================================================= */
  var ccv = null, cctx = null;
  var cutTime = 0;

  function TR2(x, y, w, h, c) { cctx.fillStyle = c; cctx.fillRect(x | 0, y | 0, w | 0, h | 0); }

  function initCutscene() {
    ccv = $('ccv');
    if (!ccv) return;
    cctx = ccv.getContext('2d');
    cctx.imageSmoothingEnabled = false;
  }

  function pxTextC(txt, x, y, sc, col) {
    cctx.fillStyle = col;
    for (var i = 0; i < txt.length; i++) {
      var gl = FONT3[txt.charAt(i)] || FONT3[' '];
      for (var r = 0; r < 5; r++) {
        for (var c = 0; c < 3; c++) {
          if (gl[r].charAt(c) === '1') cctx.fillRect(x + (i * 4 + c) * sc, y + r * sc, sc, sc);
        }
      }
    }
  }

  // siluet pelaku: benar-benar hitam total, tanpa detail
  function drawCtFig(x, y, ph, carry) {
    var amp = carry ? 2.2 : 1.2;
    var yy = y + Math.sin(ph * 2) * amp;
    var sw = Math.sin(ph * 2) * 5;
    // kaki (langkah bergantian)
    TR2(x - 6 + sw, yy - 21, 7, 21, '#000');
    TR2(x + 1 - sw, yy - 21, 7, 21, '#000');
    // badan
    TR2(x - 10, yy - 46, 20, 26, '#000');
    // kepala + tudung
    TR2(x - 7, yy - 62, 14, 16, '#000');
    TR2(x - 8, yy - 57, 16, 5, '#000');
    if (carry) {
      // tas besar bergantung di depan pinggul — jelas lebih lebar dari badan
      TR2(x - 22, yy - 34, 44, 22, '#000');
      TR2(x - 16, yy - 38, 32, 6, '#000');
      TR2(x - 14, yy - 44, 4, 7, '#000');
      TR2(x + 10, yy - 44, 4, 7, '#000');
    } else {
      // lengan kosong
      TR2(x - 14, yy - 44, 5, 18, '#000');
      TR2(x + 9, yy - 44, 5, 18, '#000');
    }
  }

  function ctClock() {
    var c = CUR || {};
    var jAt = c.clockJumpAt === undefined ? 7.0 : c.clockJumpAt;
    var base = c.clockBase === undefined ? (23 * 3600 + 41 * 60 + 7) : c.clockBase;
    var jump = c.clockJumpTo === undefined ? (23 * 3600 + 47 * 60 + 13) : c.clockJumpTo;
    var t = cutTime < jAt ? base + cutTime : jump + (cutTime - jAt);
    function p2(n) { return (n < 10 ? '0' : '') + n; }
    return p2(Math.floor(t / 3600) % 24) + ':' + p2(Math.floor(t / 60) % 60) + ':' + p2(Math.floor(t) % 60);
  }

  var CUT_END_FALLBACK = 24.8;
  var AUTO_DELAY = 1.6;   // jeda setelah caption terakhir selesai sebelum fade otomatis

  // akhir cutscene dihitung dari caption kasus: caption terakhir selesai ngetik + jeda baca
  function cutEndAt(caps) {
    if (!caps || !caps.length) return CUT_END_FALLBACK;
    var last = caps[caps.length - 1];
    return last.t + last.s.length / 18 + 1.0;
  }
  function boardEndAt(caps) {
    if (!caps || !caps.length) return 22.3;
    var last = caps[caps.length - 1];
    return last.t + last.s.length / 18 + 1.0;
  }
  var CAPS = [
    { t: 1.2,  s: 'Kamera 02 — koridor lantai dua.' },
    { t: 3.6,  s: 'Pukul 23.41 — sosok hitam masuk, tangan kosong.' },
    { t: 8.2,  s: 'Pukul 23.47 — keluar memikul tas besar.' },
    { t: 12.4, s: 'Tas itu tidak pernah keluar. Sama seperti Nayla.' },
    { t: 15.8, s: 'Di laptop lab ditemukan pesan terakhirnya: diketik pukul 23.45 — terenkripsi.' },
    { t: 20.4, s: 'Nayla mengenkripsinya sendiri — supaya pelakunya tidak bisa membaca.' }
  ];

  function typeCaption(caps, cps, t) {
    var cur = null;
    for (var i = 0; i < caps.length; i++) if (t >= caps[i].t) cur = caps[i];
    if (!cur) return { txt: '', done: false };
    var n = Math.floor((t - cur.t) * cps);
    return { txt: cur.s.slice(0, Math.min(cur.s.length, n)), done: n >= cur.s.length };
  }

  function updateCutDom() {
    var caps = (CUR && CUR.caps) || CAPS;
    var cap = typeCaption(caps, 18, cutTime);
    $('cut-caption').textContent = cap.txt;
    var end = cutEndAt(caps);
    $('btn-cut-next').style.display = cutTime > end ? '' : 'none';
    // selesai sendiri: jeda sejenak setelah caption terakhir, lalu fade tanpa klik
    if (cutTime > end + AUTO_DELAY) fadeTo(showBoard);
  }

  /* ---------- scene cutscene tiap kasus ---------- */

  function cutSceneLab(t) {
    // koridor: dinding, lantai, plafon
    TR2(0, 0, 640, 262, '#141b15');
    TR2(0, 262, 640, 98, '#0b0f0b');
    for (var fl = 0; fl < 6; fl++) TR2(0, 262 + fl * 16, 640, 1, 'rgba(200,220,200,.045)');
    TR2(0, 0, 640, 24, '#0a0f0a');
    TR2(0, 24, 640, 2, '#1d251d');

    // lampu koridor redup
    TR2(292, 24, 56, 7, '#0d120d');
    TR2(298, 31, 44, 4, '#394b39');
    cctx.globalAlpha = 0.07;
    cctx.fillStyle = '#9db59d';
    cctx.beginPath();
    cctx.ellipse(320, 120, 140, 100, 0, 0, 6.283);
    cctx.fill();
    cctx.globalAlpha = 0.06;
    cctx.beginPath();
    cctx.ellipse(320, 118, 80, 60, 0, 0, 6.283);
    cctx.fill();
    cctx.globalAlpha = 1;

    // pintu lab (kiri) — terbuka saat sosok keluar
    var doorOpen = t >= 7.1;
    TR2(112, 92, 100, 172, '#040704');
    if (doorOpen) {
      TR2(120, 100, 84, 164, '#1a231a');
      TR2(120, 100, 84, 3, '#394b39');
    } else {
      TR2(120, 100, 84, 164, '#0b100b');
      TR2(120, 100, 84, 2, '#232d23');
    }
    TR2(196, 176, 6, 6, '#2c382c'); // handle

    // jendela kelas di kanan
    TR2(420, 84, 130, 76, '#040704');
    TR2(428, 92, 114, 60, '#0e130e');
    TR2(483, 92, 4, 60, '#040704');
    TR2(428, 120, 114, 3, '#040704');
    // papan pengumuman OSIS
    TR2(190, 120, 90, 56, '#0a0e0a');
    TR2(196, 126, 78, 3, '#1c261c');
    TR2(196, 134, 62, 3, '#161f16');
    TR2(196, 142, 70, 3, '#1c261c');

    // sosok hitam
    var fx = null, carry = false, spd = 9;
    if (t >= 1.2 && t < 4.4) { fx = 700 - (t - 1.2) * 152; }                                  // masuk
    else if (t >= 7.5 && t < 11.4) { fx = 132 + (t - 7.5) * 155; carry = true; spd = 7.2; }   // keluar bawa tas
    if (fx !== null) {
      cctx.globalAlpha = 0.4;
      TR2(carry ? fx - 24 : fx - 17, 256, carry ? 48 : 38, 5, '#000');
      cctx.globalAlpha = 1;
      drawCtFig(fx, 256, t * spd, carry);
    }
  }

  /* ---------- CUTSCENE 2: RUANG GURU (pembunuhan) ---------- */
  function cutSceneLib(t) {
    // ruang guru: dinding kayu, jendela besar, meja-meja
    TR2(0, 0, 640, 300, '#1a1510');
    TR2(0, 300, 640, 60, '#0d0a07');
    for (var f = 0; f < 10; f++) TR2(0, 300 + f * 6, 640, 1, 'rgba(190,160,120,.05)');
    TR2(0, 0, 640, 22, '#100c08');
    TR2(0, 22, 640, 3, '#2a2118');

    // jendela besar di kiri — sore hari, cahaya oranye masuk
    TR2(30, 60, 150, 130, '#0a0806');
    TR2(38, 68, 134, 114, '#3a2a18');
    TR2(38, 68, 134, 6, '#5a4020');
    TR2(100, 68, 5, 114, '#0a0806');
    TR2(38, 120, 134, 4, '#0a0806');
    cctx.globalAlpha = 0.16;
    cctx.fillStyle = '#ffb060';
    cctx.beginPath();
    cctx.moveTo(38, 68); cctx.lineTo(172, 68); cctx.lineTo(300, 300); cctx.lineTo(0, 300);
    cctx.closePath(); cctx.fill();
    cctx.globalAlpha = 1;

    // papan tulis dengan rumus komposisi
    TR2(240, 60, 170, 100, '#0d1210');
    TR2(246, 66, 158, 88, '#1a2320');
    TR2(254, 78, 90, 2, 'rgba(220,230,220,.35)');
    TR2(254, 92, 120, 2, 'rgba(220,230,220,.28)');
    TR2(254, 106, 70, 2, 'rgba(220,230,220,.22)');
    TR2(254, 120, 100, 2, 'rgba(220,230,220,.30)');

    // meja guru (TKP) — kursi tergeser
    TR2(420, 190, 170, 14, '#3a2a1a');
    TR2(420, 190, 170, 3, '#4e3a24');
    TR2(426, 204, 10, 40, '#241a10');
    TR2(574, 204, 10, 40, '#241a10');
    TR2(490, 216, 40, 8, '#241a10');   // kursi tergeser jauh
    TR2(494, 224, 32, 6, '#1a1208');

    // cangkir kopi di meja
    TR2(470, 180, 12, 10, '#c8c0b0');
    TR2(470, 180, 12, 2, '#e0d8c8');

    // jam dinding berhenti
    TR2(560, 40, 30, 30, '#0a0806');
    TR2(562, 42, 26, 26, '#d8d0c0');
    TR2(574, 46, 2, 10, '#1a1410');    // jarum menunjuk 16.42
    TR2(574, 54, 9, 2, '#1a1410');

    // --- pelaku masuk dari kanan (siluet) ---
    var fx = null, spd = 8;
    if (t >= 2.0 && t < 6.0) { fx = 720 - (t - 2.0) * 90; }          // masuk
    else if (t >= 12.5 && t < 16.5) { fx = 480 + (t - 12.5) * 95; }   // keluar bawa map
    if (fx !== null) {
      var carry = t >= 12.5;
      cctx.globalAlpha = 0.4;
      TR2(fx - (carry ? 22 : 16), 300, carry ? 44 : 34, 5, '#000');
      cctx.globalAlpha = 1;
      drawCtFig(fx, 300, t * spd, false);
      if (carry) TR2(fx + 6, 262, 16, 20, '#000');   // map di tangan
    }

    // Bu Ratna duduk di meja sejak awal — siluet, tidak bergerak
    if (t > 4.0) {
      TR2(508, 268, 22, 30, '#0a0a0a');
      TR2(512, 250, 14, 18, '#0a0a0a');
      TR2(510, 244, 18, 7, '#080808');
    }

    // efek: jam berhenti (kedip merah halus)
    if (t > 8.0 && t < 8.6) {
      cctx.globalAlpha = 0.5;
      TR2(0, 0, 640, 360, 'rgba(120,20,20,.20)');
      cctx.globalAlpha = 1;
    }
  }

  /* ---------- CUTSCENE 3: KEBAKARAN RUANG SERVER ---------- */
  function cutSceneSrv(t) {
    // ruang server, awalnya gelap dan tenang
    TR2(0, 0, 640, 250, '#0b1016');
    TR2(0, 250, 640, 110, '#080c11');
    for (var f = 0; f < 8; f++) TR2(0, 250 + f * 14, 640, 1, 'rgba(140,180,220,.045)');
    TR2(0, 0, 640, 18, '#070a0e');
    TR2(0, 18, 640, 2, '#1a2430');

    // rak server — makin banyak yang mati seiring waktu
    function rack(x, y, w, h, dead) {
      TR2(x, y, w, h, '#12181f');
      TR2(x + 2, y + 2, w - 4, h - 4, '#1e2630');
      for (var i = 0; i < Math.floor(h / 14); i++) {
        TR2(x + 4, y + 4 + i * 14, w - 8, 10, '#0c1117');
        if (dead) {
          TR2(x + w - 10, y + 7 + i * 14, 3, 3, '#2a1a18');
          TR2(x + w - 15, y + 7 + i * 14, 3, 3, '#2a1a18');
        } else {
          var on = ((i * 7 + x) % 3);
          TR2(x + w - 10, y + 7 + i * 14, 3, 3, on === 0 ? '#46c98b' : (on === 1 ? '#f2b544' : '#e8564a'));
          TR2(x + w - 15, y + 7 + i * 14, 3, 3, '#4a8cbe');
        }
      }
    }
    var burning = t > 16.5;
    rack(20, 50, 60, 200, burning);
    rack(96, 50, 60, 200, burning);
    rack(484, 50, 60, 200, t > 15);
    rack(560, 50, 60, 200, t > 15);

    // lampu plafon — padam saat api membesar
    if (t < 16.5) {
      for (var n = 0; n < 3; n++) {
        TR2(120 + n * 150, 26, 90, 5, '#39434e');
        TR2(122 + n * 150, 28, 86, 3, '#b8d4e8');
      }
      cctx.globalAlpha = 0.08;
      cctx.fillStyle = '#a8c8e8';
      cctx.beginPath(); cctx.ellipse(320, 140, 240, 110, 0, 0, 6.283); cctx.fill();
      cctx.globalAlpha = 1;
    }

    // panel alarm di dinding kanan (tempat pelaku bekerja)
    TR2(300, 80, 44, 56, '#0e1319');
    TR2(304, 84, 36, 48, '#1a222c');
    TR2(308, 90, 28, 3, '#2a3440');
    TR2(308, 98, 20, 3, '#2a3440');
    if (t > 11.8) {
      // lampu alarm mati
      TR2(330, 122, 6, 6, '#3a1a18');
    } else {
      var blink = Math.floor(t * 3) % 2;
      TR2(330, 122, 6, 6, blink ? '#46c98b' : '#1e4a36');
    }

    // lantai: titik api pertama
    TR2(250, 250, 140, 14, '#232b34');
    TR2(250, 250, 140, 3, '#39434e');

    // --- pelaku: masuk, buka panel, pergi ---
    var fx = null, spd = 8;
    if (t >= 1.6 && t < 6.0) { fx = 700 - (t - 1.6) * 88; }        // masuk dari kanan
    else if (t >= 6.0 && t < 12.0) { fx = 322; spd = 0; }            // berhenti di panel
    else if (t >= 12.0 && t < 16.0) { fx = 322 - (t - 12.0) * 95; }  // pergi ke kiri
    if (fx !== null) {
      cctx.globalAlpha = 0.4;
      TR2(fx - 18, 300, 36, 5, '#000');
      cctx.globalAlpha = 1;
      drawCtFig(fx, 300, t * spd, false);
      // tangan di dalam panel saat berhenti
      if (t >= 7.0 && t < 11.8) {
        TR2(fx + 14, 262, 10, 8, '#000');
      }
      // membawa jerigen saat pergi
      if (t >= 13.0 && t < 16.0) {
        TR2(fx - 16, 274, 12, 16, '#0d1219');
        TR2(fx - 16, 274, 12, 3, '#1e2a36');
      }
    }

    // --- API MUNCUL ---
    if (t > 16.5) {
      var grow = Math.min(1, (t - 16.5) / 6);
      var flick = 0.7 + 0.3 * Math.sin(t * 11);
      // pijar di lantai
      cctx.save();
      cctx.globalCompositeOperation = 'lighter';
      var fg = cctx.createRadialGradient(320, 270, 4, 320, 270, 40 + grow * 180);
      fg.addColorStop(0, 'rgba(255,180,60,' + (0.55 * flick).toFixed(3) + ')');
      fg.addColorStop(0.5, 'rgba(220,90,30,' + (0.28 * flick).toFixed(3) + ')');
      fg.addColorStop(1, 'rgba(160,40,10,0)');
      cctx.fillStyle = fg;
      cctx.fillRect(0, 60, 640, 300);
      cctx.restore();

      // lidah api
      var h = 20 + grow * 120;
      for (var a = 0; a < 9; a++) {
        var ax = 270 + a * 12 + Math.sin(t * 4 + a) * 4;
        var ah = h * (0.5 + 0.5 * Math.abs(Math.sin(t * 3 + a * 1.7)));
        TR2(ax, 276 - ah, 8, ah, a % 2 ? 'rgba(255,150,40,.55)' : 'rgba(255,90,20,.45)');
        TR2(ax + 2, 276 - ah * 0.6, 4, ah * 0.6, 'rgba(255,230,150,.45)');
      }
      // asap
      for (var s = 0; s < 14; s++) {
        var ph = (t * 0.35 + s * 0.14) % 1;
        cctx.globalAlpha = (1 - ph) * 0.28 * grow;
        cctx.fillStyle = '#2a2a2a';
        cctx.beginPath();
        cctx.arc(280 + Math.sin(ph * 5 + s) * 50 + ph * 60, 260 - ph * 200, 10 + ph * 34, 0, 6.283);
        cctx.fill();
      }
      cctx.globalAlpha = 1;
    }
  }

  function drawCutscene() {
    if (!cctx) return;
    var t = cutTime;
    var jy = (Math.random() < 0.05) ? ((Math.random() * 2 | 0) - 1) : 0;
    cctx.save();
    cctx.translate(0, jy);

    CUR.cutScene(t);
    cctx.restore();

    // grain
    for (var n = 0; n < 120; n++) {
      cctx.globalAlpha = 0.04 + Math.random() * 0.12;
      cctx.fillStyle = Math.random() < 0.5 ? '#c8d8c8' : '#000';
      cctx.fillRect(Math.random() * 640 | 0, Math.random() * 360 | 0, 1 + (Math.random() * 2 | 0), 1);
    }
    cctx.globalAlpha = 1;

    // scanlines
    for (var sy = 0; sy < 360; sy += 3) TR2(0, sy, 640, 1, 'rgba(0,0,0,.10)');

    // glitch di tiap potongan rekaman
    if ((t > 4.35 && t < 4.7) || (t > 7.0 && t < 7.35)) {
      for (var g = 0; g < 9; g++) {
        TR2(0, Math.random() * 360 | 0, 640, 2 + Math.random() * 7, 'rgba(200,225,200,' + (0.06 + Math.random() * 0.14) + ')');
      }
    }
    // statis awal (belum sinyal)
    if (t < 0.9) {
      for (var s2 = 0; s2 < 800; s2++) {
        TR2(Math.random() * 640 | 0, Math.random() * 360 | 0, 2, 2, Math.random() < 0.5 ? '#93a393' : '#0a0d0a');
      }
    }

    // vignette
    var vg = cctx.createRadialGradient(320, 180, 90, 320, 180, 345);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.68)');
    cctx.fillStyle = vg;
    cctx.fillRect(0, 0, 640, 360);

    // OSD kamera
    pxTextC((CUR && CUR.cam) || 'CAM 02', 14, 12, 2, 'rgba(226,238,226,.85)');
    if (Math.floor(t * 2) % 2 === 0) {
      cctx.fillStyle = '#e05548';
      cctx.beginPath();
      cctx.arc(17, 34, 4, 0, 6.283);
      cctx.fill();
      pxTextC('REC', 26, 31, 2, 'rgba(226,238,226,.85)');
    }
    pxTextC(ctClock(), 640 - 76, 30, 2, 'rgba(226,238,226,.72)');
    pxTextC((CUR && CUR.loc) || 'KORIDOR LANTAI 2', 14, 342, 1, 'rgba(200,212,200,.5)');
  }

  /* =========================================================
     17C. CUTSCENE 2 — papan kasus detektif (berpikir)
     ========================================================= */
  var bcv = null, bctx = null;
  var boardTime = 0;
  var BOARD_END_FALLBACK = 22.3;

  function BR(x, y, w, h, c) { bctx.fillStyle = c; bctx.fillRect(x | 0, y | 0, w | 0, h | 0); }

  function initBoard() {
    bcv = $('bcv');
    if (!bcv) return;
    bctx = bcv.getContext('2d');
    bctx.imageSmoothingEnabled = false;
  }

  function pxTextB(txt, x, y, sc, col) {
    bctx.fillStyle = col;
    for (var i = 0; i < txt.length; i++) {
      var gl = FONT3[txt.charAt(i)] || FONT3[' '];
      for (var r = 0; r < 5; r++) {
        for (var c = 0; c < 3; c++) {
          if (gl[r].charAt(c) === '1') bctx.fillRect(x + (i * 4 + c) * sc, y + r * sc, sc, sc);
        }
      }
    }
  }

  var BOARD_CAPS = [
    { t: 1.2,  s: 'Kartu akses tap masuk 23.40.' },
    { t: 4.4,  s: 'Enam menit kemudian, kamera menangkap tas besar itu keluar.' },
    { t: 9.2,  s: 'Dan satu-satunya yang tidak pulang malam itu... Nayla.' },
    { t: 13.6, s: 'Pesan terakhirnya dia enkripsi sendiri. Dia tahu ada yang menguntit.' },
    { t: 18.4, s: 'Kalau begitu, aku yang harus membacanya. Saatnya turun ke TKP.' }
  ];

  function updateBoardDom() {
    var caps = (CUR && CUR.boardCaps) || BOARD_CAPS;
    var cap = typeCaption(caps, 18, boardTime);
    $('board-caption').textContent = cap.txt;
    var end = boardEndAt(caps);
    $('btn-board-next').style.display = boardTime > end ? '' : 'none';
    if (boardTime > end + AUTO_DELAY) fadeTo(function () { showScreen('scr-play'); });
  }

  // polaroid + pin + label di papan gabus
  var PINS = [
    { x: 130, y: 100, kind: 'wajah', label: 'NAYLA' },
    { x: 252, y: 86,  kind: 'tas',   label: 'TAS 23.47' },
    { x: 348, y: 132, kind: 'kartu', label: 'KARTU 23.40' },
    { x: 206, y: 190, kind: 'lab',   label: 'LAB 2' }
  ];
  var STRINGS = [[0, 1], [1, 2], [0, 3], [2, 3]];

  function drawBoardPin(p) {
    var PX = p.x, PY = p.y;
    BR(p.x - 23, p.y - 17, 46, 46, '#e8e4da');           // kertas polaroid
    BR(p.x - 19, p.y - 14, 38, 28, '#161c24');           // foto
    if (p.kind === 'wajah') {
      bctx.fillStyle = '#46536a';
      bctx.beginPath(); bctx.arc(p.x, p.y - 6, 8, 0, 6.283); bctx.fill();
      BR(p.x - 12, p.y + 2, 24, 10, '#39435a');
    } else if (p.kind === 'tas') {
      BR(p.x - 12, p.y - 8, 24, 16, '#05070a');
      BR(p.x - 7, p.y - 13, 14, 6, '#05070a');
    } else if (p.kind === 'kartu') {
      BR(p.x - 13, p.y - 8, 26, 17, '#2a4c80');
      BR(p.x - 13, p.y - 4, 26, 3, '#dfe6f0');
      BR(p.x - 9, p.y + 2, 12, 2, '#8fb4dd');
    } else if (p.kind === 'buku') {
      BR(p.x - 12, p.y - 9, 9, 18, '#8c3b2e');
      BR(p.x - 2, p.y - 9, 9, 18, '#2e5b8c');
      BR(p.x - 12, p.y - 9, 24, 2, '#dfe6f0');
    } else {
      BR(p.x - 11, p.y - 11, 22, 26, '#232d3a');
      BR(p.x - 7, p.y - 5, 14, 20, '#39455a');
      BR(p.x + 4, p.y + 3, 2, 2, '#f2c14e');
    }
    pxTextB(p.label, p.x - p.label.length * 2, p.y + 19, 1, '#3a352c');
    bctx.fillStyle = '#c9a23e';                           // pin
    bctx.beginPath(); bctx.arc(p.x, p.y - 19, 2.4, 0, 6.283); bctx.fill();
  }

  function drawBoardScene() {
    if (!bctx) return;
    var t = boardTime;

    // ruangan gelap
    BR(0, 0, 640, 320, '#0d100d');
    BR(0, 320, 640, 40, '#080a08');

    // papan gabus + bingkai kayu
    BR(52, 32, 384, 232, '#2a1f12');
    BR(60, 40, 368, 216, '#6b5433');
    for (var n = 0; n < 170; n++) {
      BR(62 + Math.random() * 364 | 0, 42 + Math.random() * 212 | 0, 2, 1,
         Math.random() < 0.5 ? 'rgba(40,28,14,.35)' : 'rgba(150,120,74,.30)');
    }

    // tali merah menghubungkan pin
    for (var sh = 0; sh < 2; sh++) {
      bctx.strokeStyle = sh ? '#b3402e' : 'rgba(40,20,10,.45)';
      bctx.lineWidth = sh ? 1.6 : 2.2;
      var dy = sh ? 0 : 1.5;
      for (var s = 0; s < STRINGS.length; s++) {
        var PT = (CUR && CUR.pins) || PINS;
        var a = PT[STRINGS[s][0]], b2 = PT[STRINGS[s][1]];
        bctx.beginPath();
        bctx.moveTo(a.x, a.y - 19 + dy);
        bctx.quadraticCurveTo((a.x + b2.x) / 2, (a.y + b2.y) / 2 + 16 + dy, b2.x, b2.y - 19 + dy);
        bctx.stroke();
      }
    }

    // foto-foto terpasang
    var PN = (CUR && CUR.pins) || PINS;
    for (var pi = 0; pi < PN.length; pi++) drawBoardPin(PN[pi]);

    // lampu meja hangat menyinari papan
    var warm = bctx.createRadialGradient(240, 140, 24, 240, 140, 270);
    warm.addColorStop(0, 'rgba(255,214,150,.16)');
    warm.addColorStop(0.6, 'rgba(255,214,150,.06)');
    warm.addColorStop(1, 'rgba(255,214,150,0)');
    bctx.fillStyle = warm;
    bctx.fillRect(0, 0, 640, 360);

    // lampu meja di pojok kanan bawah
    BR(596, 306, 34, 10, '#1a140c');                       // alas
    BR(578, 274, 5, 36, '#1a140c');                        // tiang
    BR(560, 268, 22, 9, '#1a140c');                        // kepala lampu
    bctx.fillStyle = '#ffd89a';
    bctx.beginPath(); bctx.arc(566, 280, 3.4, 0, 6.283); bctx.fill();

    // detektif berpikir (siluet hitam, menghadap papan)
    var x = 534, y = 344;
    BR(x - 9, y - 30, 8, 30, '#000');                      // kaki
    BR(x + 2, y - 30, 8, 30, '#000');
    BR(x - 16, y - 74, 34, 46, '#000');                    // jas
    BR(x - 11, y - 94, 22, 21, '#000');                    // kepala
    BR(x - 17, y - 89, 34, 6, '#000');                     // bibir topi
    BR(x - 13, y - 101, 26, 9, '#000');                    // mahkota topi
    BR(x - 26, y - 64, 15, 8, '#000');                     // lengan atas
    BR(x - 28, y - 78, 8, 16, '#000');                     // lengan bawah naik
    BR(x - 28, y - 80, 7, 5, '#000');                      // tangan di dagu
    // rim hangat dari lampu di sisi kiri jas
    BR(x - 17, y - 72, 2, 40, 'rgba(255,214,150,.22)');
    BR(x - 12, y - 92, 2, 18, 'rgba(255,214,150,.14)');

    // grain tipis + vignette
    for (var g = 0; g < 55; g++) {
      bctx.globalAlpha = 0.03 + Math.random() * 0.07;
      bctx.fillStyle = Math.random() < 0.5 ? '#cbb98a' : '#000';
      bctx.fillRect(Math.random() * 640 | 0, Math.random() * 360 | 0, 2, 1);
    }
    bctx.globalAlpha = 1;
    var vg = bctx.createRadialGradient(300, 170, 100, 300, 170, 350);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.62)');
    bctx.fillStyle = vg;
    bctx.fillRect(0, 0, 640, 360);
  }

  /* =========================================================
     17D. PILIH KASUS — jalanan malam, senter mengikuti kursor
     ========================================================= */
  var scv = null, sctx = null;
  var selTime = 0;
  var selMouse = { x: 320, y: 160 };
  var CASE_FIGS = [
    { id: 'c1', x: 190, y: 292, caseNo: 'CASE 01', title: 'REKAMAN 23.47' },
    { id: 'c2', x: 330, y: 292, caseNo: 'CASE 02', title: 'JAM TERAKHIR BU RATNA' },
    { id: 'c3', x: 470, y: 292, caseNo: 'CASE 03', title: 'API DI RUANG SERVER' }
  ];

  var CASES_META = {
    c1: { no: 'CASE FILE #01', title: 'Rekaman 23.47',
          desc: 'Nayla, ketua OSIS, hilang — CCTV merekam sosok hitam membawa tas besar keluar dari lab pukul 23.47. Pecahkan pesan terakhirnya, temukan buktinya, tuduh pelakunya.',
          locked: false, idx: 0 },
    c2: { no: 'CASE FILE #02', title: 'Jam Terakhir Bu Ratna',
          desc: 'Bu Ratna, guru matematika, ditemukan tewas di ruang guru. Jam dinding berhenti pukul 16.42, dan laptopnya masih menyala dengan pesan terenkripsi.',
          locked: false, idx: 1 },
    c3: { no: 'CASE FILE #03', title: 'Api di Ruang Server',
          desc: 'Ruang server terbakar, tapi alarm tidak pernah berbunyi. Api berasal dari lantai, bukan dari rak — dan ada botol akseleran di sela pendingin.',
          locked: false, idx: 2 }
  };

  function TR3(x, y, w, h, c) { sctx.fillStyle = c; sctx.fillRect(x | 0, y | 0, w | 0, h | 0); }

  function pxTextS(txt, x, y, sc, col) {
    sctx.fillStyle = col;
    for (var i = 0; i < txt.length; i++) {
      var gl = FONT3[txt.charAt(i)] || FONT3[' '];
      for (var r = 0; r < 5; r++) {
        for (var c = 0; c < 3; c++) {
          if (gl[r].charAt(c) === '1') sctx.fillRect(x + (i * 4 + c) * sc, y + r * sc, sc, sc);
        }
      }
    }
  }

  function initSelect() {
    scv = $('scv');
    if (!scv) return;
    sctx = scv.getContext('2d');
    sctx.imageSmoothingEnabled = false;
    scv.addEventListener('mousemove', function (e) {
      var r = scv.getBoundingClientRect();
      if (!r.width || !r.height) return;
      selMouse.x = (e.clientX - r.left) / r.width * 640;
      selMouse.y = (e.clientY - r.top) / r.height * 360;
    });
    scv.addEventListener('click', function () {
      var f = hoverCheck();
      if (f) openCasePopup(f.id);
    });
  }

  function hoverCheck() {
    for (var i = 0; i < CASE_FIGS.length; i++) {
      var f = CASE_FIGS[i];
      if (selMouse.x > f.x - 26 && selMouse.x < f.x + 26 &&
          selMouse.y > f.y - 64 && selMouse.y < f.y + 10) return f;
    }
    return null;
  }

  // sosok hitam berdiri diam (versi tanpa langkah)
  function drawCtStand(x, y, sway) {
    var yy = y + Math.sin(sway) * 0.8;
    TR3(x - 6, yy - 22, 7, 22, '#000');
    TR3(x + 1, yy - 22, 7, 22, '#000');
    TR3(x - 10, yy - 47, 20, 26, '#000');
    TR3(x - 7, yy - 63, 14, 16, '#000');
    TR3(x - 8, yy - 58, 16, 5, '#000');
  }

  function drawSelDetective() {
    var x = 74, y = 330;
    TR3(x - 8, y - 24, 7, 24, '#000');                     // kaki
    TR3(x + 1, y - 24, 7, 24, '#000');
    TR3(x - 13, y - 56, 26, 34, '#000');                   // jas
    TR3(x - 9, y - 74, 18, 19, '#000');                    // kepala
    TR3(x - 14, y - 70, 28, 6, '#000');                    // bibir topi
    TR3(x - 11, y - 80, 22, 8, '#000');                    // mahkota topi
    TR3(x + 8, y - 52, 16, 6, '#000');                     // lengan ke depan
    TR3(x + 20, y - 56, 10, 6, '#000');
    TR3(x + 28, y - 60, 10, 5, '#11161c');                 // senter
    TR3(x + 36, y - 59, 3, 3, '#ffe9b0');
  }

  function drawBeam(x0, y0, x1, y1) {
    sctx.save();
    sctx.globalCompositeOperation = 'lighter';
    var ang = Math.atan2(y1 - y0, x1 - x0);
    var len = Math.hypot(x1 - x0, y1 - y0) + 60;
    var ex = x0 + Math.cos(ang) * len, ey = y0 + Math.sin(ang) * len;
    var px2 = Math.cos(ang + Math.PI / 2), py2 = Math.sin(ang + Math.PI / 2);
    var g = sctx.createLinearGradient(x0, y0, ex, ey);
    g.addColorStop(0, 'rgba(255,242,205,.30)');
    g.addColorStop(1, 'rgba(255,242,205,.04)');
    sctx.fillStyle = g;
    sctx.beginPath();
    sctx.moveTo(x0, y0);
    sctx.lineTo(ex + px2 * len * 0.13, ey + py2 * len * 0.13);
    sctx.lineTo(ex - px2 * len * 0.13, ey - py2 * len * 0.13);
    sctx.closePath();
    sctx.fill();
    var hg = sctx.createRadialGradient(x1, y1, 2, x1, y1, 28);
    hg.addColorStop(0, 'rgba(255,246,220,.28)');
    hg.addColorStop(1, 'rgba(255,246,220,0)');
    sctx.fillStyle = hg;
    sctx.beginPath();
    sctx.arc(x1, y1, 28, 0, 6.283);
    sctx.fill();
    sctx.restore();
  }

  function drawCaseLabel(f) {
    var w1 = f.caseNo.length * 8, w2 = f.title.length * 4;
    var w = Math.max(w1, w2) + 20;
    var h = f.segera ? 54 : 42;
    var bx = f.x - w / 2, topY = f.y - 96;
    TR3(bx, topY - 8, w, h, 'rgba(8,11,16,.90)');
    TR3(bx, topY - 8, w, 2, 'rgba(242,181,68,.55)');
    pxTextS(f.caseNo, f.x - w1 / 2, topY, 2, '#f2b544');
    pxTextS(f.title, f.x - w2 / 2, topY + 14, 1, '#c3ccda');
    if (f.segera) pxTextS('SEGERA', f.x - 12, topY + 26, 1, '#e05548');
    TR3(f.x - 1, topY + h - 8, 2, 22, 'rgba(242,181,68,.4)');
  }

  function drawLampPost(x) {
    TR3(x, 180, 4, 82, '#0b0e11');
    TR3(x - 7, 176, 18, 5, '#0b0e11');
    TR3(x - 3, 181, 10, 4, '#f2c14e');
    sctx.save();
    sctx.globalCompositeOperation = 'lighter';
    sctx.globalAlpha = 0.10;
    sctx.fillStyle = '#f2c14e';
    sctx.beginPath();
    sctx.ellipse(x + 2, 210, 26, 44, 0, 0, 6.283);
    sctx.fill();
    sctx.restore();
  }

  function drawSelectScene() {
    if (!sctx) return;
    var t = selTime, mx = selMouse.x, my = selMouse.y;

    // langit + bintang + bulan
    var sky = sctx.createLinearGradient(0, 0, 0, 250);
    sky.addColorStop(0, '#05070d');
    sky.addColorStop(1, '#0c1220');
    sctx.fillStyle = sky;
    sctx.fillRect(0, 0, 640, 250);
    for (var s = 0; s < 46; s++) {
      TR3((s * 97) % 640, (s * 41) % 100, 1, 1,
          'rgba(207,224,245,' + (0.12 + 0.28 * Math.abs(Math.sin(t * 0.7 + s))).toFixed(2) + ')');
    }
    TR3(556, 24, 13, 13, '#dfe8f5');
    TR3(553, 27, 19, 7, '#dfe8f5');

    // siluet kota dengan jendela menyala
    for (var b = 0; b < 9; b++) {
      var bw = 58 + (b * 37) % 50, bh = 58 + (b * 53) % 92, bx2 = b * 74 - 12;
      TR3(bx2, 240 - bh, bw, bh, '#0a0f16');
      for (var w2 = 0; w2 < 6; w2++) {
        if ((b * 7 + w2) % 3 === 0) {
          TR3(bx2 + 8 + (w2 * 13) % (bw - 16), 240 - bh + 10 + (w2 * 23) % Math.max(20, bh - 34), 4, 6, 'rgba(242,181,68,.28)');
        }
      }
    }

    // trotoar + jalan
    TR3(0, 238, 640, 20, '#1b1f24');
    TR3(0, 258, 640, 102, '#15181c');
    for (var d = 0; d < 8; d++) TR3(14 + d * 82, 306, 42, 4, 'rgba(200,190,120,.14)');

    drawLampPost(88);
    drawLampPost(566);

    // tiga sosok hitam = tiga kasus (kelihatan saat tersapu cahaya)
    for (var fi = 0; fi < CASE_FIGS.length; fi++) {
      var f = CASE_FIGS[fi];
      sctx.globalAlpha = 0.35;
      TR3(f.x - 16, f.y - 3, 34, 4, '#000');
      sctx.globalAlpha = 1;
      drawCtStand(f.x, f.y - 2, t * 1.5 + fi * 2.1);
    }

    // kegelapan dengan lubang cahaya mengikuti kursor
    var dk = sctx.createRadialGradient(mx, my, 24, mx, my, 175);
    dk.addColorStop(0, 'rgba(3,5,8,0)');
    dk.addColorStop(0.5, 'rgba(3,5,8,.40)');
    dk.addColorStop(1, 'rgba(3,5,8,.88)');
    sctx.fillStyle = dk;
    sctx.fillRect(0, 0, 640, 360);

    // berkas senter + inti terang
    drawBeam(112, 272, mx, my);

    // detektif + senter (selalu terlihat)
    drawSelDetective();

    // label kasus melayang saat disorot
    var hf = hoverCheck();
    if (hf) drawCaseLabel(hf);

    // vignette
    var vg = sctx.createRadialGradient(320, 180, 120, 320, 180, 380);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.55)');
    sctx.fillStyle = vg;
    sctx.fillRect(0, 0, 640, 360);
  }

  function openCasePopup(id) {
    var m = CASES_META[id];
    if (!m) return;
    $('cm-tag').textContent = m.no + ' \u00b7 ' + (m.locked ? 'SEGERA' : 'TERBUKA');
    $('cm-title').textContent = m.title;
    $('cm-desc').textContent = m.desc;
    $('cm-locked').style.display = m.locked ? '' : 'none';
    $('cm-diff-wrap').style.display = m.locked ? 'none' : '';
    var wrap = $('cm-diffs');
    wrap.innerHTML = '';
    if (!m.locked) {
      var list = ['easy', 'normal', 'hard'];
      for (var i = 0; i < list.length; i++) {
        (function (d) {
          var b = document.createElement('button');
          b.className = 'btn';
          b.textContent = DIFFS[d].label;
          b.addEventListener('click', function () {
            setCase(m.idx || 0);
            setDifficulty(d);
            $('case-modal').classList.remove('show');
            openConfirm();
          });
          wrap.appendChild(b);
        })(list[i]);
      }
    }
    $('case-modal').classList.add('show');
  }

  function openConfirm() {
    $('cf-tag').textContent = 'MODE ' + diff.label;
    $('cf-text').textContent = diff.confirm + ' Kamu yakin ingin memainkan mode ini?';
    $('confirm-modal').classList.add('show');
  }

  /* =========================================================
     18. BOOT
     ========================================================= */
  window.onerror = function (msg, src, line, col) {
    var e = $('err');
    if (!e) return;
    e.style.display = 'block';
    e.textContent = msg + '  @' + line + ':' + col;
  };

  setDifficulty('easy');
  wire();
  resetGame();
  buildVignette();
  initDust();
  initTitle();
  initCutscene();
  initBoard();
  initSelect();
  initInterro();
  fit();
  window.addEventListener('resize', fit);
  requestAnimationFrame(frame);

  /* test hooks */
  window.GAME = {
    get CASE() { return CASE; },
    state: state, DIFFS: DIFFS, player: player, cam: cam,
    get grid() { return grid; },
    get INTERACTABLES() { return INTERACTABLES; },
    get CUR() { return CUR; },
    CASES: CASES, setCase: setCase, loadCase: loadCase, keyCount: keyCount,
    setDifficulty: setDifficulty,
    resetGame: resetGame,
    closeDialog: closeDialog,
    drawCutscene: drawCutscene,
    cutTick: function (dt) { cutTime += dt; drawCutscene(); updateCutDom(); },
    boardTick: function (dt) { boardTime += dt; drawBoardScene(); updateBoardDom(); },
    selectTick: function (dt) { selTime += dt; drawSelectScene(); },
    selectMouse: function (x, y) { selMouse.x = x; selMouse.y = y; },
    hoveredFig: function () { var f = hoverCheck(); return f ? f.id : null; },
    screen: function () { return activeScreen; },
    interact: interact, openTool: openTool, openInterro: openInterro,
    runDecrypt: runDecrypt, parseFns: parseFns, decryptWith: decryptWith,
    placeClues: placeClues, cluesFound: cluesFound, propById: propById,
    copyClue: copyClue, pasteClue: pasteClue, chooseSuspect: chooseSuspect,
    takeKey: takeKey,
    resolveLock: function (id) {
      var locks = CUR.quest.locks;
      for (var i = 0; i < locks.length; i++) {
        if (locks[i].at !== id) continue;
        var L = locks[i];
        if (L.need && !state.flags[L.need]) return 'locked';
        if (!L.need && !state.decrypted) return 'locked';
        if (state.flags[L.flag]) return 'done';
        state.flags['_s_' + L.flag] = true;
        takeLock(L);
        return 'ok';
      }
      return 'none';
    },
    hitSeat: hitSeat,
    traps: function () { return traps; },
    spawnTraps: spawnTraps,
    updateTraps: updateTraps,
    draw: function () { draw(); },
    trapCfg: trapCfg,
    setPlayer: function (x, y) { player.x = x; player.y = y; },
    showScreen: showScreen, finish: finish,
    resetBoard: function () { boardTime = 0; }, resetCut: function () { cutTime = 0; },
    teleport: function (x, y) { player.x = x; player.y = y; },
    potAnim: function () { return potAnim; },
    _dbg: { drawSprite: drawSprite, PAL: PAL, ctx: ctx,
            SPR: { SPR_DOWN: SPR_DOWN, SPR_UP: SPR_UP, SPR_SIDE: SPR_SIDE } },
    derivedPlain: function () { return CASE ? CASE.plain : ''; },
    encrypt: function (s) {
      var out = '';
      for (var i = 0; i < s.length; i++) {
        var ch = s.charAt(i);
        if (ch === ' ') { out += ' '; continue; }
        var x = l2n(ch);
        for (var k = CASE.layers.length - 1; k >= 0; k--) x = encLayer(CASE.layers[k], x);
        out += n2l(x);
      }
      return out;
    },
    reachableMap: function () {
      var seen = {};
      var start = [Math.floor(player.x / T), Math.floor(player.y / T)];
      var q = [start];
      seen[start.join(',')] = 1;
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      while (q.length) {
        var cur = q.shift();
        for (var i = 0; i < dirs.length; i++) {
          var nc = cur[0] + dirs[i][0], nr = cur[1] + dirs[i][1];
          var key = nc + ',' + nr;
          if (seen[key]) continue;
          if (nc < 0 || nr < 0 || nc >= MAP_W || nr >= MAP_H) continue;
          if (grid[nr][nc] !== 0) continue;
          seen[key] = 1;
          q.push([nc, nr]);
        }
      }
      return seen;
    },
    interactableReachable: function () {
      var seen = window.GAME.reachableMap();
      var out = {};
      for (var j = 0; j < INTERACTABLES.length; j++) {
        var it = INTERACTABLES[j];
        var tc = Math.floor(it.x / T), tr = Math.floor(it.y / T);
        var near = false;
        for (var dc = -2; dc <= 2; dc++) {
          for (var dr = -2; dr <= 2; dr++) {
            if (seen[(tc + dc) + ',' + (tr + dr)]) near = true;
          }
        }
        out[it.id] = near;
      }
      return out;
    }
  };

})();
