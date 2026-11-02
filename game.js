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
      confirm: 'Mode EASY \u2014 pesan Nayla dienkripsi dua lapis. Cari pesannya dan kuncinya di lab, ' +
               'lalu buka sandinya dengan alat dekripsi di komputer guru.'
    },
    normal: {
      id: 'normal', label: 'NORMAL',
      layers: [ { a: 3, b: 7 }, { a: 1, b: 5 }, { a: 1, b: -6 } ],
      clueCount: 2,
      confirm: 'Mode NORMAL \u2014 tiga lapis komposisi fungsi. Kuncinya lebih panjang, ' +
               'tapi alatnya tetap satu.'
    },
    hard: {
      id: 'hard', label: 'HARD',
      layers: [ { a: 5, b: 2 }, { a: 3, b: 3 }, { a: 1, b: -4 } ],
      clueCount: 3,
      confirm: 'Mode HARD \u2014 kuncinya disobek jadi dua bagian dan disimpan terpisah. ' +
               'Kamu harus menemukan pesannya plus kedua sobekan kunci sebelum alat bisa jalan.'
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
    var plain = pickOne(MESSAGES);

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

    if (d.clueCount >= 3) {
      var mid = Math.ceil(layers.length / 2);
      clues.push({
        id: 'key1', kind: 'key', title: 'KUNCI \u2014 SOBEKAN A',
        body: [composeLine(layers)].concat(keyLines(layers, 0, mid)).join('\n')
      });
      clues.push({
        id: 'key2', kind: 'key', title: 'KUNCI \u2014 SOBEKAN B',
        body: keyLines(layers, mid, layers.length).join('\n')
      });
    } else {
      clues.push({
        id: 'key1', kind: 'key', title: 'KUNCI',
        body: [composeLine(layers)].concat(keyLines(layers, 0, layers.length)).join('\n')
      });
    }

    return {
      diff: d, layers: layers, plain: plain, cipher: cipher,
      clues: clues, culprit: 'dedi', suspects: SUSPECTS
    };
  }
  var CORE = ['monitor', 'papan', 'sampah'];

  /* =========================================================
     3. WORLD
     ========================================================= */
  var T = 16;                 // ukuran tile
  var MAP_W = 28, MAP_H = 18; // 448 x 288 px
  var VW = 320, VH = 180;     // viewport
  var WORLD_W = MAP_W * T, WORLD_H = MAP_H * T;

  var FLOOR_SHADE = ['#171d26', '#1a212b', '#1c2430'];

  var grid = [];
  (function buildGrid() {
    for (var r = 0; r < MAP_H; r++) {
      var row = [];
      for (var c = 0; c < MAP_W; c++) {
        var wall = (r <= 2 || r >= MAP_H - 1 || c <= 1 || c >= MAP_W - 2);
        row.push(wall ? 1 : 0);
      }
      grid.push(row);
    }
    function fill(c0, r0, c1, r1, v) {
      for (var rr = r0; rr <= r1; rr++) for (var cc = c0; cc <= c1; cc++) grid[rr][cc] = v;
    }
    fill(11, 5, 13, 6, 2);    // meja guru
    fill(22, 3, 23, 5, 2);    // lemari arsip
    fill(20, 4, 21, 5, 2);    // meja printer
    fill(2, 4, 3, 7, 2);      // rak buku
    fill(24, 12, 24, 13, 2);  // dispenser
    fill(16, 7, 16, 7, 2);    // tempat sampah
    fill(25, 14, 25, 15, 2);  // pot tanaman
    // meja siswa: 2 baris x 4 meja
    var deskCols = [4, 9, 14, 19];
    for (var i = 0; i < deskCols.length; i++) {
      fill(deskCols[i], 10, deskCols[i] + 1, 10, 2);
      fill(deskCols[i], 13, deskCols[i] + 1, 13, 2);
    }
  })();

  // Setiap barang bisa diperiksa. Dua/tiga di antaranya menyimpan petunjuk (diacak tiap main).
  var INTERACTABLES = [
    { id: 'monitor',  x: 200, y: 118, range: 34, label: 'Pakai alat dekripsi', title: 'KOMPUTER GURU' },
    { id: 'papan',    x: 200, y: 62,  range: 36, label: 'Periksa papan tulis',  title: 'PAPAN TULIS',
      flavor: 'Sisa materi jaringan minggu lalu. Ada tulisan "praktek jumat" yang sudah setengah terhapus.' },
    { id: 'sampah',   x: 263, y: 132, range: 30, label: 'Periksa tempat sampah', title: 'TEMPAT SAMPAH',
      flavor: 'Bungkus snack, sobekan kertas tugas, dan satu gelas plastik. Tidak ada yang berguna.' },
    { id: 'rak',      x: 48,  y: 110, range: 36, label: 'Periksa rak buku',      title: 'RAK BUKU',
      flavor: 'Buku manual jaringan berdebu. Satu slot kosong, tapi lapisan debunya rata \u2014 sudah lama.' },
    { id: 'printer',  x: 336, y: 100, range: 32, label: 'Periksa printer',       title: 'PRINTER',
      flavor: 'Baki kertasnya kosong. Ada sobekan nyangkut di roller, sudah mengering dan menguning.' },
    { id: 'dispenser',x: 392, y: 214, range: 30, label: 'Periksa dispenser',     title: 'DISPENSER',
      flavor: 'Galon hampir habis. Cuma tetesan air di lantai, bukan jejak kaki.' },
    { id: 'meja1',    x: 80,  y: 186, range: 26, label: 'Periksa meja siswa',    title: 'MEJA SISWA \u00b7 1',
      flavor: 'Ada tulisan "JANGAN DUDUK SINI" pakai tip-ex. Laci kosong.' },
    { id: 'meja2',    x: 160, y: 186, range: 26, label: 'Periksa meja siswa',    title: 'MEJA SISWA \u00b7 2',
      flavor: 'Serutan pensil dan satu penghapus karet. Monitor masih menyala di halaman login.' },
    { id: 'meja3',    x: 240, y: 186, range: 26, label: 'Periksa meja siswa',    title: 'MEJA SISWA \u00b7 3',
      flavor: 'Coretan jadwal piket di permukaan meja. Tidak lebih dari itu.' },
    { id: 'meja4',    x: 320, y: 186, range: 26, label: 'Periksa meja siswa',    title: 'MEJA SISWA \u00b7 4',
      flavor: 'Kursinya ditarik agak jauh dari meja, seperti ditinggal buru-buru. Tapi tidak ada apa-apa.' },
    { id: 'jam',      x: 120, y: 54,  range: 32, label: 'Periksa jam dinding',   title: 'JAM DINDING',
      flavor: 'Jamnya berhenti di 23.12. Baterainya mati sejak lama \u2014 ini bukan petunjuk.' },
    { id: 'ac',       x: 300, y: 54,  range: 32, label: 'Periksa AC',            title: 'AC',
      flavor: 'Masih dingin dan berdebu. Filternya belum dibersihkan sejak awal semester.' },
    { id: 'kabel',    x: 150, y: 240, range: 28, label: 'Periksa kabel lantai',  title: 'KABEL LANTAI',
      flavor: 'Kabel LAN berserakan. Satu ujung lepas, tapi colokannya memang sudah longgar.' },
    { id: 'poster',   x: 352, y: 54,  range: 30, label: 'Periksa poster',        title: 'POSTER TATA TERTIB',
      flavor: 'Sudut bawahnya terkelupas dan lembap. Isinya cuma aturan pemakaian lab.' },
    { id: 'pot',      x: 404, y: 240, range: 32, label: 'Periksa pot tanaman',   title: 'POT TANAMAN' },
    { id: 'lemari',   x: 368, y: 110, range: 32, label: 'Buka lemari arsip',     title: 'LEMARI ARSIP' },
    { id: 'door',     x: 208, y: 276, range: 30, label: 'Pintu keluar',          title: 'PINTU KELUAR' }
  ];

  var CLUE_POOL_EXCLUDE = { monitor: 1, pot: 1, lemari: 1, door: 1 };

  function placeClues() {
    var pool = [];
    for (var i = 0; i < INTERACTABLES.length; i++) {
      if (!CLUE_POOL_EXCLUDE[INTERACTABLES[i].id]) pool.push(INTERACTABLES[i].id);
    }
    for (var j = pool.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var t = pool[j]; pool[j] = pool[k]; pool[k] = t;
    }
    state.clueMap = {};
    for (var c = 0; c < CASE.clues.length; c++) state.clueMap[pool[c]] = CASE.clues[c];
  }

  function propById(id) {
    for (var i = 0; i < INTERACTABLES.length; i++) if (INTERACTABLES[i].id === id) return INTERACTABLES[i];
    return null;
  }

  // lampu langit-langit -> kolam cahaya di lantai
  var LIGHTS = [
    { x: 96,  y: 88,  r: 86 },
    { x: 216, y: 88,  r: 92 },
    { x: 336, y: 88,  r: 86 },
    { x: 216, y: 208, r: 104 }
  ];

  /* =========================================================
     4. SPRITE PEMAIN (16 x 24)
     ========================================================= */
  var PAL = {
    '.': null,
    'h': '#2b1e17', 'H': '#453122',
    's': '#e8b48a', 'S': '#c9936d',
    'e': '#14181f',
    'b': '#2f4a6e', 'B': '#41669a',
    'p': '#1c242f', 'o': '#0f141b'
  };

  var SPR_DOWN = [
    '.....hhhhhh.....',
    '....hhhhhhhh....',
    '...hhhhhhhhhh...',
    '..hhhhhhhhhhhh..',
    '.hhhhhhhhhhhhhh.',
    '....ssssssss....',
    '....sesssses....',
    '....ssssssss....',
    '....ssssssss....',
    '...bbbbbbbbbb...',
    '..bbbbbbbbbbbb..',
    '.bbBbbbbbbbbBbb.',
    '.bbBbbbbbbbbBbb.',
    '.bbbbbbbbbbbbbb.',
    '.bbbbbbbbbbbbbb.',
    '..bbbbbbbbbbbb..',
    '..bbbbbbbbbbbb..',
    '...bbbbbbbbbb...',
    '...pppppppppp...',
    '...pppppppppp...',
    '...pppp..pppp...',
    '...pppp..pppp...',
    '...oooo..oooo...',
    '...oooo..oooo...'
  ];
  var SPR_UP = [
    '.....hhhhhh.....',
    '....hhhhhhhh....',
    '...hhhhhhhhhh...',
    '..hhhhhhhhhhhh..',
    '.hhhhhhhhhhhhhh.',
    '....hhhhhhhh....',
    '....hhhhhhhh....',
    '....hhhhhhhh....',
    '....hhhhhhhh....',
    '...bbbbbbbbbb...',
    '..bbbbbbbbbbbb..',
    '.bbBbbbbbbbbBbb.',
    '.bbBbbbbbbbbBbb.',
    '.bbbbbbbbbbbbbb.',
    '.bbbbbbbbbbbbbb.',
    '..bbbbbbbbbbbb..',
    '..bbbbbbbbbbbb..',
    '...bbbbbbbbbb...',
    '...pppppppppp...',
    '...pppppppppp...',
    '...pppp..pppp...',
    '...pppp..pppp...',
    '...oooo..oooo...',
    '...oooo..oooo...'
  ];
  var SPR_SIDE = [
    '.....hhhhhh.....',
    '....hhhhhhhh....',
    '...hhhhhhhhhh...',
    '..hhhhhhhhhhhh..',
    '.hhhhhhhhhhhhhh.',
    '.....ssssssss...',
    '.....sssssses...',
    '.....ssssssss...',
    '.....ssssssss...',
    '....bbbbbbbbb...',
    '...bbbbbbbbbb...',
    '..bBbbbbbbbbb...',
    '..bBbbbbbbbbb...',
    '..bbbbbbbbbbb...',
    '..bbbbbbbbbbb...',
    '...bbbbbbbbb....',
    '...bbbbbbbbb....',
    '...bbbbbbbbb....',
    '...pppppppp.....',
    '...pppppppp.....',
    '...pppppppp.....',
    '....pppp.ppp....',
    '...oooo..ooo....',
    '...oooo..ooo....'
  ];

  /* =========================================================
     5. STATE
     ========================================================= */
  var state = { collected: {}, score: 1000, found: {}, clueMap: {},
                decrypted: false, potSlid: false, keyFound: false,
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

  function drawSprite(rows, x, y, flip) {
    for (var r = 0; r < rows.length; r++) {
      var line = rows[r];
      for (var c = 0; c < line.length; c++) {
        var col = PAL[line[c]];
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

  function drawCabinet() {
    var locked = !state.keyFound;
    R(352, 94, 32, 4, 'rgba(0,0,0,.35)');
    R(352, 48, 32, 5, '#2f4d70');
    R(352, 53, 32, 41, '#1d3552');
    for (var i = 0; i < 3; i++) {
      var y = 56 + i * 13;
      R(355, y, 26, 10, '#25405f');
      R(355, y, 26, 1, '#325476');
      R(365, y + 4, 8, 2, '#4d7296');
    }
    R(352, 93, 32, 2, '#12202f');
    R(352, 53, 1, 41, '#16283c');
    R(383, 53, 1, 41, '#16283c');
    if (locked) {
      R(362, 66, 13, 11, '#f2b544');
      R(365, 69, 7, 6, '#0d1118');
      R(361, 63, 15, 4, '#f2b544');
    } else {
      ctx.globalAlpha = 0.18;
      R(352, 53, 32, 41, '#46c98b');
      ctx.globalAlpha = 1;
    }
  }

  function drawPrinterTable() {
    R(320, 94, 32, 3, 'rgba(0,0,0,.32)');
    R(320, 64, 32, 10, '#4a3826');
    R(320, 64, 32, 2, '#5f4a33');
    R(320, 74, 32, 20, '#33261a');
    R(322, 78, 28, 12, '#3d2d1f');
    R(326, 82, 20, 3, '#2b2015');
    // printer
    R(324, 54, 24, 12, '#2b3440');
    R(324, 54, 24, 3, '#3a4656');
    R(327, 58, 18, 5, '#d8dde4');
    R(327, 58, 18, 1, '#eef2f7');
    R(330, 50, 12, 5, '#d8dde4');
  }

  function drawCorkBoard() {
    R(272, 8, 34, 30, '#39465a');
    R(273, 9, 32, 28, '#8a6a45');
    R(276, 13, 10, 8, '#e8e2d2');
    R(290, 12, 11, 10, '#d8e0e8');
    R(277, 25, 12, 7, '#e8d8c8');
    R(292, 25, 8, 8, '#c9d3de');
    R(281, 16, 1, 1, '#c0392b');
    R(295, 16, 1, 1, '#2b6ea8');
  }

  function drawAC() {
    R(384, 12, 30, 12, '#c9d3de');
    R(384, 12, 30, 3, '#dfe6ee');
    R(386, 17, 26, 2, '#9aa6b4');
    R(386, 21, 26, 1, '#9aa6b4');
  }

  function drawMop() {
    R(400, 176, 14, 3, 'rgba(0,0,0,.28)');
    R(402, 160, 10, 16, '#4a5a6a');
    R(402, 160, 10, 3, '#5d7183');
    R(405, 148, 3, 14, '#8a6a45');
    R(404, 174, 6, 3, '#3a4756');
  }

  function drawRug() {
    R(98, 114, 252, 44, '#22303a');
    for (var i = 0; i < 14; i++) {
      for (var j = 0; j < 5; j++) {
        R(102 + i * 18, 118 + j * 8, 14, 1, ((i + j) % 2) ? '#1c2830' : '#26353f');
      }
    }
    R(98, 114, 252, 2, '#4a2f36');
    R(98, 156, 252, 2, '#4a2f36');
    R(98, 114, 2, 44, '#4a2f36');
    R(348, 114, 2, 44, '#4a2f36');
    for (var k = 0; k < 20; k++) {
      R(99 + k * 13, 111, 1, 3, '#3a2a30');
      R(99 + k * 13, 158, 1, 3, '#3a2a30');
    }
  }

  function drawBookshelf() {
    R(32, 128, 32, 4, 'rgba(0,0,0,.32)');
    R(32, 64, 32, 4, '#4a3728');
    R(32, 68, 32, 60, '#2a1d14');
    for (var s = 0; s < 3; s++) {
      var y = 71 + s * 19;
      R(34, y, 28, 16, '#1c130d');
      var cols = ['#7a3b3b', '#3b5a7a', '#4a7a4a', '#7a6a3b', '#5a3b7a'];
      for (var b = 0; b < 6; b++) {
        var bh = 10 + ((s + b) % 3);
        R(35 + b * 4, y + 16 - bh, 3, bh, cols[(s * 3 + b) % 5]);
      }
    }
    R(32, 68, 32, 2, '#3a2a1e');
  }

  function drawBin() {
    R(256, 126, 16, 3, 'rgba(0,0,0,.3)');
    R(256, 111, 14, 4, '#3a4a5e');
    R(257, 112, 12, 2, '#232c3a');
    R(257, 115, 12, 11, '#2a3444');
    R(258, 116, 1, 10, '#333f52');
    R(261, 116, 1, 10, '#333f52');
    R(264, 116, 1, 10, '#333f52');
    R(270, 121, 5, 4, '#cfc9b6');
    R(271, 122, 3, 2, '#e6e1d2');
  }

  function drawDispenser() {
    R(384, 208, 14, 3, 'rgba(0,0,0,.3)');
    R(385, 190, 12, 22, '#c9d3de');
    R(385, 190, 12, 2, '#dfe6ee');
    R(386, 178, 10, 12, '#5a93d6');
    R(388, 176, 6, 3, '#4a7fb8');
    R(388, 200, 5, 6, '#3a4756');
  }

  function drawPlant() {
    var ox = Math.round(potAnim * -15);
    var x = 400, y = 224;

    // bekas pot: lantai yang lebih bersih + kunci
    if (potAnim > 0.25) {
      R(403, 233, 10, 11, '#1e2732');
      R(402, 235, 12, 7, '#1e2732');
      R(403, 233, 10, 1, '#252f3b');
      if (!state.keyFound) {
        R(404, 240, 8, 1, 'rgba(0,0,0,.35)');
        R(404, 237, 6, 2, '#d8ac33');
        R(404, 237, 6, 1, '#f2cd63');
        R(409, 235, 3, 5, '#d8ac33');
        R(410, 236, 1, 3, '#0d1218');
        R(405, 239, 1, 2, '#d8ac33');
        R(407, 239, 1, 2, '#d8ac33');
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

  function drawBoard() {
    var got = !!state.collected.papan;
    R(142, 6, 116, 38, '#2b3644');
    R(144, 8, 112, 34, '#d5dee9');
    R(144, 8, 112, 2, '#eef2f7');
    R(152, 15, 40, 2, '#8fa0b4');
    R(152, 21, 26, 2, '#8fa0b4');
    R(152, 27, 54, 2, '#8fa0b4');
    R(152, 33, 34, 2, '#8fa0b4');
    if (got) {
      R(150, 20, 34, 8, 'rgba(242,181,68,.28)');
      R(152, 23, 28, 3, '#d99b2c');
    }
    R(142, 44, 116, 3, '#39465a');
    R(150, 47, 6, 2, '#c9d3de');
    R(160, 47, 6, 2, '#7fb8ee');
  }

  function drawClock() {
    R(298, 10, 16, 16, '#2b3644');
    R(299, 11, 14, 14, '#d5dee9');
    R(305, 13, 2, 6, '#2b3644');
    R(306, 18, 4, 1, '#2b3644');
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

  function drawDoor() {
    R(190, 270, 36, 18, '#1c2531');
    R(192, 272, 32, 16, '#4a3524');
    R(194, 274, 28, 14, '#6b4d33');
    R(194, 274, 28, 2, '#7d5a40');
    R(218, 280, 3, 3, '#e0c069');
    R(206, 268, 8, 4, '#2b3644');
    R(207, 269, 6, 2, '#8a99ad');
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
        if (grid[r][c] === 0) drawFloorTile(c, r, c * T, r * T);
        else drawWallTile(c, r, c * T, r * T);
      }
    }

    drawLights();
    drawRug();

    // dekorasi dinding (selalu di belakang)
    drawTrunking();
    drawWindow();
    drawBoard();
    drawCorkBoard();
    drawClock();
    drawPoster();
    drawAC();

    // kabel lantai
    drawCable(48, 128, 40);
    drawCable(88, 128, 2);
    drawCable(240, 160, 46);
    drawCable(286, 160, 2);
    drawCable(112, 96, 60);
    drawCable(336, 108, 44);

    var list = [];
    list.push({ y: 96,  fn: drawTeacherDesk });
    list.push({ y: 96,  fn: drawPrinterTable });
    list.push({ y: 96,  fn: drawCabinet });
    list.push({ y: 128, fn: drawBookshelf });
    list.push({ y: 126, fn: drawBin });
    list.push({ y: 212, fn: drawDispenser });
    list.push({ y: 256, fn: drawPlant });
    list.push({ y: 179, fn: drawMop });

    var deskCols = [4, 9, 14, 19];
    for (var i = 0; i < deskCols.length; i++) {
      (function (col) {
        list.push({ y: 176, fn: function () { drawStudentDesk(col * T, 160); } });
        list.push({ y: 224, fn: function () { drawStudentDesk(col * T, 208); } });
        list.push({ y: 186, fn: function () { drawChair(col * T + 10, 172); } });
        list.push({ y: 234, fn: function () { drawChair(col * T + 10, 220); } });
      })(deskCols[i]);
    }

    list.push({ y: 288, fn: drawDoor });
    list.push({ y: player.y, fn: function () { drawPlayerShadow(Math.round(player.x), Math.round(player.y)); } });
    list.push({ y: player.y, fn: drawPlayer });

    list.sort(function (a, b) { return a.y - b.y; });
    for (var k = 0; k < list.length; k++) list[k].fn();

    ctx.restore();

    drawDust();
    if (vig) ctx.drawImage(vig, 0, 0);
  }

  /* =========================================================
     9. GERAK & COLLISION
     ========================================================= */
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

    if (state.potSlid && potAnim < 1) potAnim = Math.min(1, potAnim + dt * 2.6);

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
    if (!CASE) return;
    var n = cluesFound();
    if (n < CASE.clues.length) { el.innerHTML = 'Cari petunjuk &middot; ' + n + '/' + CASE.clues.length; return; }
    if (!state.decrypted) { el.innerHTML = 'Buka pesan di <b>alat dekripsi</b>'; return; }
    if (!state.keyFound) { el.innerHTML = 'Periksa <b>pot</b> di sudut ruangan'; return; }
    if (!state.collected.lemari) { el.innerHTML = 'Buka <b>lemari arsip</b>'; return; }
    el.innerHTML = 'Interogasi <b>tersangka</b>';
  }

  function updateKeyBadge() {
    var b = $('key-badge');
    if (!b) return;
    b.classList.toggle('show', !!state.keyFound);
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

  function takeKey() {
    closeDialog();
    state.keyFound = true;
    updateObjective();
    updateKeyBadge();
    toast('Kunci lemari didapat');
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

    /* ---- alat dekripsi ---- */
    if (id === 'monitor') {
      var n = cluesFound();
      if (n < CASE.clues.length) {
        openDialog('KOMPUTER GURU',
          'Alat dekripsi yang dipakai Nayla. Layarnya menunggu dua hal: <b>pesan terenkripsi</b> dan ' +
          '<b>kunci fungsinya</b>. Kamu baru punya <b>' + n + '/' + CASE.clues.length + '</b> petunjuk.',
          [{ label: 'Cari dulu', fn: closeDialog }]);
        return;
      }
      openDialog('KOMPUTER GURU',
        'Pesan terenkripsi dan kuncinya sudah lengkap. Alat ini bisa dijalankan sekarang.',
        [
          { label: 'Buka alat', primary: true, fn: function () { closeDialog(); openTool(); } },
          { label: 'Tutup', fn: closeDialog }
        ]);
      return;
    }

    /* ---- pot ---- */
    if (id === 'pot') {
      if (state.keyFound) {
        openDialog('POT TANAMAN', 'Pot ini sudah kamu geser. Bawahnya kosong sekarang.',
          [{ label: 'Tutup', fn: closeDialog }]);
        return;
      }
      if (!state.decrypted) {
        openDialog('POT TANAMAN',
          'Pot besar berisi tanah, cukup berat. Belum ada alasan untuk menggesernya.',
          [{ label: 'Tutup', fn: closeDialog }]);
        return;
      }
      if (state.potSlid) {
        openDialog('POT TANAMAN',
          'Di bawah pot ada <b>kunci kecil</b> dengan label "ARSIP" \u2014 Nayla yang menyembunyikannya.',
          [{ label: 'Ambil kunci', primary: true, fn: takeKey }]);
        return;
      }
      openDialog('POT TANAMAN',
        'Pesan yang baru kamu buka berbunyi: <code>' + CASE.plain + '</code>. ' +
        'Pot besar di sudut ini kelihatan baru digeser.',
        [
          { label: 'Geser pot', primary: true, fn: function () {
              closeDialog();
              state.potSlid = true;
              toast('Pot digeser...');
              setTimeout(function () {
                if (activeScreen !== 'scr-play') return;
                openDialog('POT TANAMAN',
                  'Di bawah pot ada <b>kunci kecil</b> dengan label "ARSIP".',
                  [{ label: 'Ambil kunci', primary: true, fn: takeKey }]);
              }, 750);
            } },
          { label: 'Batal', fn: closeDialog }
        ]);
      return;
    }

    /* ---- lemari ---- */
    if (id === 'lemari') {
      if (!state.keyFound) {
        openDialog('LEMARI ARSIP',
          'Terkunci. Lubang kuncinya kecil \u2014 ini butuh kunci fisik, bukan sandi.',
          [{ label: 'Tutup', fn: closeDialog }]);
        return;
      }
      state.collected.lemari = true;
      updateObjective();
      openDialog('LEMARI ARSIP',
        'Kunci masuk dengan pas. Di dalamnya ada <b>flashdisk</b> berlabel "JANGAN FORMAT \u2014 BUKTI": ' +
        'salinan rekaman CCTV dan catatan penguntit yang Nayla tulis selama seminggu terakhir.',
        [
          { label: 'Bawa ke ruang interogasi', primary: true, fn: function () {
              closeDialog(); openInterro();
            } },
          { label: 'Tutup', fn: closeDialog }
        ]);
      return;
    }

    /* ---- pintu ---- */
    if (id === 'door') {
      openDialog('PINTU KELUAR',
        state.collected.lemari ? 'Kasusnya sudah selesai. Waktunya melapor.' : 'Belum bisa keluar. Kasusnya belum selesai.',
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
        ihover = hitSeat((e.clientX - r.left) / r.width * 640, (e.clientY - r.top) / r.height * 360);
      });
      icv.addEventListener('mouseleave', function () { ihover = -1; });
      icv.addEventListener('click', function (e) {
        var r = icv.getBoundingClientRect();
        var i = hitSeat((e.clientX - r.left) / r.width * 640, (e.clientY - r.top) / r.height * 360);
        if (i >= 0) chooseSuspect(i);
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
      var nm = sp.name.toUpperCase();
      var w = nm.length * 8 + 22;
      var cx2 = SEATS[n].x;
      var on = n === ihover;
      TR4(cx2 - w / 2, 148, w, 26, '#0d1218');
      TR4(cx2 - w / 2, 148, w, 1, on ? '#f2b544' : '#2a3444');
      TR4(cx2 - w / 2, 173, w, 1, on ? '#f2b544' : '#2a3444');
      TR4(cx2 - w / 2, 148, 1, 26, on ? '#f2b544' : '#2a3444');
      TR4(cx2 - w / 2 + w - 1, 148, 1, 26, on ? '#f2b544' : '#2a3444');
      pxText4(nm, cx2 - nm.length * 4, 156, 2, on ? '#f2b544' : '#8d99ab');
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
    var arr = state.win ? VD_WIN : VD_LOSE;
    var idx = Math.min(arr.length - 1, Math.floor(vdTime / 4.2));
    $('vd-caption').textContent = arr[idx];
    var done = vdTime > arr.length * 4.2;
    $('btn-vd-next').style.display = done ? '' : 'none';
  }

    function finish(win) {
    var stamp = $('verdict-stamp');
    if (win) {
      stamp.textContent = 'TERBUKTI';
      stamp.className = 'verdict';
      $('end-title').textContent = 'Kasus Selesai — Nayla Ditemukan';
      $('end-text').textContent =
        'Flashdisk Nayla berisi catatan yang menunjuk satu nama: selama seminggu, orang yang sama selalu ada ' +
        'di sekolah setiap dia pulang malam. Dan semalam, kartu akses teknisi tercatat tap masuk pukul 23.40 — ' +
        'tujuh menit sebelum sosok hitam itu membawa tas besar keluar lewat kamera. Pak Dedi mengaku pulang ' +
        'pukul 21.00. Nayla ditemukan di gudang alat kebersihan dekat rumahnya, selamat dan seger setelah ' +
        'dicek di klinik.';
    } else {
      stamp.textContent = 'SALAH TUDUH';
      stamp.className = 'verdict bad';
      $('end-title').textContent = 'Pelaku Lolos';
      $('end-text').textContent = 'Alibi orang yang kamu tuduh tidak terbantahkan. Pelakunya menghilang sebelum fajar.';
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
    state.win = false;
    state.picked = null;
    potAnim = 0;
    if (!CASE) CASE = buildCase(diff);
    placeClues();
    updateScore();
    updateObjective();
    updateKeyBadge();
    player.x = 216; player.y = 240; player.dir = 'down'; player.moving = false; player.anim = 0;
    cam.x = Math.round(Math.max(0, Math.min(WORLD_W - VW, player.x - VW / 2)));
    cam.y = Math.round(Math.max(0, Math.min(WORLD_H - VH, player.y - VH / 2)));
    closeDialog();
    closeModal();
    var pk = $('p-keys');
    if (pk) pk.style.opacity = '1';
  }

  function setDifficulty(id) {
    diff = DIFFS[id] || DIFFS.easy;
    CASE = buildCase(diff);
  }

  /* =========================================================
     15. EVENTS
     ========================================================= */
  function startInvestigation() {
    $('confirm-modal').classList.remove('show');
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
    var t = cutTime < 7.0
      ? 23 * 3600 + 41 * 60 + 7 + cutTime
      : 23 * 3600 + 47 * 60 + 13 + (cutTime - 7.0);
    function p2(n) { return (n < 10 ? '0' : '') + n; }
    return p2(Math.floor(t / 3600) % 24) + ':' + p2(Math.floor(t / 60) % 60) + ':' + p2(Math.floor(t) % 60);
  }

  var CUT_END = 24.8;
  var AUTO_DELAY = 1.6;   // jeda setelah caption terakhir selesai sebelum fade otomatis
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
    var cap = typeCaption(CAPS, 18, cutTime);
    $('cut-caption').textContent = cap.txt;
    $('btn-cut-next').style.display = cutTime > CUT_END ? '' : 'none';
    // selesai sendiri: jeda sejenak setelah caption terakhir, lalu fade tanpa klik
    if (cutTime > CUT_END + AUTO_DELAY) fadeTo(showBoard);
  }

  function drawCutscene() {
    if (!cctx) return;
    var t = cutTime;
    var jy = (Math.random() < 0.05) ? ((Math.random() * 2 | 0) - 1) : 0;
    cctx.save();
    cctx.translate(0, jy);

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
    pxTextC('CAM 02', 14, 12, 2, 'rgba(226,238,226,.85)');
    if (Math.floor(t * 2) % 2 === 0) {
      cctx.fillStyle = '#e05548';
      cctx.beginPath();
      cctx.arc(17, 34, 4, 0, 6.283);
      cctx.fill();
      pxTextC('REC', 26, 31, 2, 'rgba(226,238,226,.85)');
    }
    pxTextC(ctClock(), 640 - 76, 30, 2, 'rgba(226,238,226,.72)');
    pxTextC('KORIDOR LANTAI 2', 14, 342, 1, 'rgba(200,212,200,.5)');
  }

  /* =========================================================
     17C. CUTSCENE 2 — papan kasus detektif (berpikir)
     ========================================================= */
  var bcv = null, bctx = null;
  var boardTime = 0;
  var BOARD_END = 22.3;

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
    var cap = typeCaption(BOARD_CAPS, 18, boardTime);
    $('board-caption').textContent = cap.txt;
    $('btn-board-next').style.display = boardTime > BOARD_END ? '' : 'none';
    if (boardTime > BOARD_END + AUTO_DELAY) fadeTo(function () { showScreen('scr-play'); });
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
        var a = PINS[STRINGS[s][0]], b2 = PINS[STRINGS[s][1]];
        bctx.beginPath();
        bctx.moveTo(a.x, a.y - 19 + dy);
        bctx.quadraticCurveTo((a.x + b2.x) / 2, (a.y + b2.y) / 2 + 16 + dy, b2.x, b2.y - 19 + dy);
        bctx.stroke();
      }
    }

    // foto-foto terpasang
    for (var pi = 0; pi < PINS.length; pi++) drawBoardPin(PINS[pi]);

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
    { id: 'c2', x: 330, y: 292, caseNo: 'CASE 02', title: 'BUKU BESAR PERPUS', segera: true },
    { id: 'c3', x: 470, y: 292, caseNo: 'CASE 03', title: 'SERVER TERKUNCI', segera: true }
  ];

  var CASES_META = {
    c1: { no: 'CASE FILE #01', title: 'Rekaman 23.47',
          desc: 'Nayla, ketua OSIS, hilang — CCTV merekam sosok hitam membawa tas besar keluar dari lab pukul 23.47. Pecahkan pesan terakhirnya, temukan buktinya, tuduh pelakunya.',
          locked: false },
    c2: { no: 'CASE FILE #02', title: 'Buku Besar Perpustakaan',
          desc: 'Koleksi langka menghilang dari perpustakaan. Urutan lapis enkripsinya bisa tertukar — jangan asal membalik fungsi.',
          locked: true },
    c3: { no: 'CASE FILE #03', title: 'Server Terkunci',
          desc: 'File soal ujian dienkripsi dan salah satu kuncinya hilang total. Turunkan fungsi yang tidak diketahui.',
          locked: true }
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
    state: state, DIFFS: DIFFS, player: player, cam: cam, grid: grid,
    INTERACTABLES: INTERACTABLES,
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
    hitSeat: hitSeat,
    showScreen: showScreen, finish: finish,
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
