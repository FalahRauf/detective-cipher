/* =========================================================
   DETEKTIF SANDI — Kasus #01 "Pesan Terakhir di Lab"
   Pixel-art top-down 16px, kamera mengikuti pemain.

   Enkripsi dua lapis:  c = f(g(x))
   f(x) = 3x + 7   ->  f⁻¹(y) = 9(y − 7) mod 26
   g(x) = x + 5    ->  g⁻¹(y) = y − 5 mod 26
   ========================================================= */
(function () {
  'use strict';

  /* =========================================================
     1. MATH
     ========================================================= */
  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var A = 3, B = 7;      // f(x) = Ax + B
  var GB = 5;            // g(x) = x + GB
  var AINV = 9;          // 3 * 9 = 27 ≡ 1 (mod 26)

  function m26(n) { var m = ((n % 26) + 26) % 26; return m === 0 ? 26 : m; }
  function l2n(ch) { return LETTERS.indexOf(ch) + 1; }
  function n2l(n) { return LETTERS[n - 1]; }
  function fInv(c) { return m26(AINV * (c - B)); }
  function gInv(y) { return m26(y - GB); }
  function encryptLetter(x) { return m26(A * m26(x + GB) + B); }

  /* =========================================================
     2. DATA
     ========================================================= */
  var CASE = {
    cipher: 'CGLEW HW ROD',
    plain: 'KUNCI DI POT',
    culprit: 'dedi',
    suspects: [
      { id: 'rian',  name: 'Rian Pratama',   role: 'Siswa XI PPLG 4', initials: 'RP',
        alibi: 'Mengaku di kantin sampai pukul 17.00. Dua orang saksi melihatnya.',
        note: 'Tidak memegang kartu akses lab.' },
      { id: 'dedi',  name: 'Pak Dedi',       role: 'Teknisi Lab',     initials: 'PD',
        alibi: 'Mengaku sudah pulang sejak pukul 16.00 dan tidak kembali lagi.',
        note: 'Kartu akses teknisi tercatat tap masuk 16.40.' },
      { id: 'sinta', name: 'Sinta Maharani', role: 'Siswa XI PPLG 4', initials: 'SM',
        alibi: 'Berada di perpustakaan, terekam CCTV dari 16.00 sampai 17.00.',
        note: 'Tidak pernah memegang kunci lemari arsip.' }
    ]
  };

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

  var INTERACTABLES = [
    { id: 'monitor', x: 200, y: 118, range: 32, label: 'Periksa komputer' },
    { id: 'papan',   x: 200, y: 62,  range: 34, label: 'Periksa papan tulis' },
    { id: 'sampah',  x: 263, y: 132, range: 30, label: 'Periksa tempat sampah' },
    { id: 'pot',     x: 404, y: 240, range: 32, label: 'Periksa pot tanaman' },
    { id: 'lemari',  x: 368, y: 110, range: 32, label: 'Buka lemari arsip' },
    { id: 'door',    x: 208, y: 276, range: 30, label: 'Pintu keluar' }
  ];

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
  var state = { collected: {}, solved: false, score: 1000, hintUsed: false,
                potSlid: false, keyFound: false, cells: [] };
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
      if (it.id === 'pot' && !state.solved) continue;
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
    var n = 0;
    CORE.forEach(function (k) { if (state.collected[k]) n++; });
    var el = $('objective');
    if (!state.solved) el.innerHTML = 'Cari bukti &middot; ' + n + '/3';
    else if (!state.keyFound) el.innerHTML = 'Periksa <b>pot dekat dispenser</b>';
    else if (!state.collected.lemari) el.innerHTML = 'Buka <b>lemari arsip</b> dengan kunci';
    else el.innerHTML = 'Tuduh <b>tersangka</b>';
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

  function interact(id) {
    if (dialogOpen) return;

    if (id === 'monitor') {
      collect('monitor');
      openDialog('KOMPUTER MEJA GURU',
        'Satu-satunya file yang tersisa: <code>pesan.txt</code>. Isinya deretan huruf acak — ' +
        'kemungkinan besar terenkripsi lebih dari satu lapis.',
        [
          { label: 'Buka Meja Dekripsi', primary: true, fn: function () { closeDialog(); openDesk(); } },
          { label: 'Tutup', fn: closeDialog }
        ]);
      return;
    }

    if (id === 'papan') {
      collect('papan');
      openDialog('PAPAN TULIS',
        'Sisa spidol yang belum terhapus. Ini kunci <b>lapis luar</b> — fungsi yang dipakai terakhir saat enkripsi.',
        [{ label: 'Catat: f(x) = 3x + 7', primary: true, fn: closeDialog }]);
      return;
    }

    if (id === 'sampah') {
      collect('sampah');
      openDialog('TEMPAT SAMPAH',
        'Kertas kecil terlipat di dasar tempat sampah. Ini kunci <b>lapis dalam</b> — fungsi yang dipakai pertama saat enkripsi.',
        [{ label: 'Catat: g(x) = x + 5', primary: true, fn: closeDialog }]);
      return;
    }

    if (id === 'pot') {
      if (state.keyFound) {
        openDialog('POT TANAMAN',
          'Pot ini sudah kamu geser. Bawahnya kosong sekarang.',
          [{ label: 'Tutup', fn: closeDialog }]);
        return;
      }
      if (!state.solved) {
        openDialog('POT TANAMAN',
          'Pot besar berisi tanah, cukup berat. Belum ada alasan untuk menggesernya.',
          [{ label: 'Tutup', fn: closeDialog }]);
        return;
      }
      if (state.potSlid) {
        openDialog('POT TANAMAN',
          'Di bawah pot ada <b>kunci kecil</b> dengan label "LEMARI ARSIP".',
          [{ label: 'Ambil kunci', primary: true, fn: takeKey }]);
        return;
      }
      openDialog('POT TANAMAN',
        'Kamu ingat pesannya: <code>KUNCI DI POT</code>. Pot ini kelihatan sedikit bergeser dari tempatnya.',
        [
          { label: 'Geser pot', primary: true, fn: function () {
              closeDialog();
              state.potSlid = true;
              toast('Pot digeser...');
              setTimeout(function () {
                if (activeScreen !== 'scr-play') return;
                openDialog('POT TANAMAN',
                  'Di bawah pot ada <b>kunci kecil</b> dengan label "LEMARI ARSIP".',
                  [{ label: 'Ambil kunci', primary: true, fn: takeKey }]);
              }, 750);
            } },
          { label: 'Batal', fn: closeDialog }
        ]);
      return;
    }

    if (id === 'lemari') {
      if (!state.keyFound) {
        openDialog('LEMARI ARSIP',
          'Terkunci. Lubang kuncinya kecil — ini butuh kunci fisik, bukan sandi.',
          [{ label: 'Tutup', fn: closeDialog }]);
        return;
      }
      collect('lemari');
      openDialog('LEMARI ARSIP',
        'Kunci masuk dengan pas. Laci kedua terbuka — di dalamnya ada printout log pintu lab.',
        [
          { label: 'Tuduh Tersangka', primary: true, fn: function () {
              closeDialog(); renderSuspects(); showScreen('scr-accuse');
            } },
          { label: 'Tutup', fn: closeDialog }
        ]);
      return;
    }

    if (id === 'door') {
      openDialog('PINTU KELUAR',
        state.solved ? 'Kasusnya sudah selesai. Waktunya melapor.' : 'Belum bisa keluar. Kasusnya belum selesai.',
        [{ label: 'Tutup', fn: closeDialog }]);
    }
  }

  function onInteractKey() {
    if (activeScreen !== 'scr-play' || dialogOpen) return;
    var it = nearest();
    if (it) interact(it.id);
  }

  /* =========================================================
     12. MEJA DEKRIPSI
     ========================================================= */
  function buildCells() {
    var out = [];
    for (var i = 0; i < CASE.cipher.length; i++) {
      var ch = CASE.cipher[i];
      if (ch === ' ') { out.push({ space: true }); continue; }
      var cnum = l2n(ch);
      var mid = fInv(cnum);
      out.push({
        space: false, c: ch, cnum: cnum, mid: mid, plain: n2l(gInv(mid)),
        numEl: null, letEl: null, okNum: false, okLet: false, penalized: false
      });
    }
    return out;
  }

  function renderCells() {
    cellsEl.innerHTML = '';
    for (var i = 0; i < state.cells.length; i++) {
      (function (cell, idx) {
        var d = document.createElement('div');
        d.className = 'cell' + (cell.space ? ' gap' : '');
        if (!cell.space) {
          d.setAttribute('data-i', String(idx));
          d.innerHTML =
            '<div class="ciph">' + cell.c + '</div>' +
            '<div class="fld"><span class="lbl">f&#8315;&#185;</span>' +
            '<input class="in-num" type="text" inputmode="numeric" maxlength="2" autocomplete="off" spellcheck="false"></div>' +
            '<div class="fld"><span class="lbl">g&#8315;&#185;</span>' +
            '<input class="in-let" type="text" maxlength="1" autocomplete="off" spellcheck="false"></div>';
          cell.numEl = d.querySelector('.in-num');
          cell.letEl = d.querySelector('.in-let');
          wireCell(cell, idx);
        }
        cellsEl.appendChild(d);
      })(state.cells[i], i);
    }
  }

  function nextIndex(from) {
    for (var j = from + 1; j < state.cells.length; j++) if (!state.cells[j].space) return j;
    return -1;
  }
  function prevIndex(from) {
    for (var j = from - 1; j >= 0; j--) if (!state.cells[j].space) return j;
    return -1;
  }

  function wireCell(cell, idx) {
    cell.numEl.addEventListener('input', function () {
      var v = cell.numEl.value.replace(/[^0-9]/g, '').slice(0, 2);
      cell.numEl.value = v;
      cell.numEl.classList.remove('ok', 'bad');
      if (v.length === 2) {
        var n = nextIndex(idx);
        if (n >= 0) state.cells[n].numEl.focus();
      }
      renderWork(idx);
    });
    cell.numEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); cell.letEl.focus(); }
      else if (e.key === 'ArrowLeft') {
        var p = prevIndex(idx);
        if (p >= 0) { e.preventDefault(); state.cells[p].letEl.focus(); }
      }
    });
    cell.letEl.addEventListener('input', function () {
      var v = cell.letEl.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
      cell.letEl.value = v;
      cell.letEl.classList.remove('ok', 'bad');
      if (v.length === 1) {
        var n = nextIndex(idx);
        if (n >= 0) state.cells[n].numEl.focus();
      }
      renderWork(idx);
    });
    cell.letEl.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') {
        var p = prevIndex(idx);
        if (p >= 0) { e.preventDefault(); state.cells[p].numEl.focus(); }
      } else if (e.key === 'ArrowRight') {
        var n = nextIndex(idx);
        if (n >= 0) { e.preventDefault(); state.cells[n].numEl.focus(); }
      }
    });
    cell.numEl.addEventListener('focus', function () { renderWork(idx); });
    cell.letEl.addEventListener('focus', function () { renderWork(idx); });
  }

  function subStep(mid) {
    var raw = mid - GB;
    if (raw <= 0) return mid + ' &minus; ' + GB + ' = ' + raw + ' &equiv; ' + m26(raw) + ' (mod 26)';
    return mid + ' &minus; ' + GB + ' = ' + raw;
  }

  function renderWork(i) {
    var cell = state.cells[i];
    if (!cell || cell.space) {
      workEl.innerHTML = '<div class="work-idle">Klik salah satu kolom untuk melihat langkah pengerjaannya.</div>';
      return;
    }
    var raw1 = AINV * (cell.cnum - B);
    var s1 = 'f&#8315;&#185;(' + cell.cnum + ') = ' + AINV + '(' + cell.cnum + ' &minus; ' + B + ') = ' + raw1 +
             ' &equiv; <b>' + (cell.okNum ? cell.mid : '?') + '</b> (mod 26)';
    var s2;
    if (!cell.okNum) s2 = 'g&#8315;&#185;(?) = ? &minus; ' + GB + ' = ? &rarr; ?';
    else if (!cell.okLet) s2 = 'g&#8315;&#185;(' + cell.mid + ') = ' + subStep(cell.mid) + ' &rarr; <b>?</b>';
    else s2 = 'g&#8315;&#185;(' + cell.mid + ') = ' + subStep(cell.mid) + ' &rarr; <b>' + cell.plain + '</b>';
    workEl.innerHTML =
      '<div class="step"><i>Langkah 1</i><span>' + s1 + '</span></div>' +
      '<div class="step"><i>Langkah 2</i><span>' + s2 + '</span></div>';
  }

  function keysComplete() { return !!state.collected.papan && !!state.collected.sampah; }

  function updateDeskLocks() {
    var hasF = !!state.collected.papan;
    var hasG = !!state.collected.sampah;
    var complete = hasF && hasG;

    $('fx-f').textContent    = hasF ? '3x + 7' : '???';
    $('fx-g').textContent    = hasG ? 'x + 5' : '???';
    $('fx-finv').textContent = hasF ? '9(y \u2212 7) mod 26' : '???';
    $('fx-ginv').textContent = hasG ? 'y \u2212 5 mod 26' : '???';

    $('fx-f').parentElement.classList.toggle('locked', !hasF);
    $('fx-g').parentElement.classList.toggle('locked', !hasG);
    $('fx-finv').parentElement.classList.toggle('locked', !hasF);
    $('fx-ginv').parentElement.classList.toggle('locked', !hasG);

    $('cipher-label').textContent = complete ? 'CIPHERTEKS' : 'CIPHERTEKS — KUNCI BELUM LENGKAP';
    $('cipher-label').classList.toggle('locked', !complete);
    $('btn-check').disabled = !complete;

    for (var i = 0; i < state.cells.length; i++) {
      var c = state.cells[i];
      if (c.space) continue;
      c.numEl.disabled = !complete;
      c.letEl.disabled = !complete;
    }
  }

  function openDesk() {
    updateDeskLocks();
    renderWork(-1);
    showScreen('scr-desk');
    if (keysComplete()) {
      for (var i = 0; i < state.cells.length; i++) {
        if (!state.cells[i].space) { state.cells[i].numEl.focus(); break; }
      }
    }
  }

  function checkAll() {
    if (!keysComplete()) return;
    var allOk = true, wrongNow = 0;

    for (var i = 0; i < state.cells.length; i++) {
      var cell = state.cells[i];
      if (cell.space) continue;

      var nv = cell.numEl.value.trim();
      var lv = cell.letEl.value.trim().toUpperCase();
      var nOk = nv !== '' && parseInt(nv, 10) === cell.mid;
      var lOk = lv !== '' && lv === cell.plain;

      cell.okNum = nOk;
      cell.okLet = lOk;
      cell.numEl.classList.toggle('ok', nOk);
      cell.numEl.classList.toggle('bad', !nOk && nv !== '');
      cell.letEl.classList.toggle('ok', lOk);
      cell.letEl.classList.toggle('bad', !lOk && lv !== '');

      if (!nOk || !lOk) {
        allOk = false;
        if ((nv !== '' || lv !== '') && !cell.penalized) { cell.penalized = true; wrongNow++; }
      }
    }

    if (wrongNow > 0) {
      state.score = Math.max(0, state.score - wrongNow * 20);
      updateScore();
      toast(wrongNow + ' kolom salah \u00b7 \u2212' + wrongNow * 20 + ' poin');
    } else if (!allOk) {
      toast('Masih ada kolom yang kosong.');
    }

    if (allOk) { solve(); return; }

    for (var k = 0; k < state.cells.length; k++) {
      var c2 = state.cells[k];
      if (!c2.space && (!c2.okNum || !c2.okLet)) { c2.numEl.focus(); break; }
    }
  }

  function solve() {
    state.solved = true;
    updateObjective();
    modalEl.setAttribute('data-solve', '1');
    openModal('SANDI TERPECAHKAN', 'Pesan berhasil dibaca',
      'Dua lapis enkripsi terbuka dengan urutan terbalik: f⁻¹ dulu, baru g⁻¹. ' +
      'Pesannya menunjuk ke sebuah benda di ruangan ini, bukan ke orang.',
      CASE.plain, false);
  }

  function showHint() {
    if (!state.hintUsed) {
      state.hintUsed = true;
      state.score = Math.max(0, state.score - 100);
      updateScore();
    }
    openModal('PETUNJUK', 'Cara menemukan f\u207b\u00b9',
      'y = 3x + 7  \u2192  3x = y \u2212 7  \u2192  x = (y \u2212 7) / 3.  ' +
      'Karena 3 \u00b7 9 = 27 \u2261 1 (mod 26), membagi dengan 3 sama dengan mengalikan 9. ' +
      'Jadi f\u207b\u00b9(y) = 9(y \u2212 7) mod 26. Ingat: hasil 0 ditulis 26.',
      'f\u207b\u00b9(y) = 9(y \u2212 7) mod 26', true);
  }

  /* =========================================================
     13. TUDUH & ENDING
     ========================================================= */
  function renderSuspects() {
    var wrap = $('suspect-cards');
    var html = '';
    for (var i = 0; i < CASE.suspects.length; i++) {
      var s = CASE.suspects[i];
      html += '<button class="card" data-id="' + s.id + '">' +
                '<div class="avatar">' + s.initials + '</div>' +
                '<h4>' + s.name + '</h4>' +
                '<div class="role">' + s.role + '</div>' +
                '<div class="alibi">' + s.alibi + '</div>' +
                '<div class="note">' + s.note + '</div>' +
              '</button>';
    }
    wrap.innerHTML = html;
    var cards = wrap.querySelectorAll('.card');
    for (var j = 0; j < cards.length; j++) {
      (function (el) {
        el.addEventListener('click', function () { onAccuse(el.getAttribute('data-id'), el); });
      })(cards[j]);
    }
  }

  function onAccuse(id, el) {
    if (id === CASE.culprit) { finish(true); return; }
    state.score = Math.max(0, state.score - 250);
    updateScore();
    el.style.opacity = '.4';
    el.style.pointerEvents = 'none';
    toast('Alibi orang ini kuat. Salah tuduh \u00b7 \u2212250 poin');
  }

  function finish(win) {
    var stamp = $('verdict-stamp');
    if (win) {
      stamp.textContent = 'TERBUKTI';
      stamp.className = 'verdict';
      $('end-title').textContent = 'Kasus Selesai';
      $('end-text').textContent =
        'Pak Dedi memakai kartu aksesnya sendiri pukul 16.40, jauh setelah ia mengaku pulang. ' +
        'Laptop inventaris ditemukan di dalam lemari arsip, dan pesan terenkripsi itu adalah catatan ' +
        'yang ia tinggalkan untuk mengingat sandi lemari.';
    } else {
      stamp.textContent = 'SALAH TUDUH';
      stamp.className = 'verdict bad';
      $('end-title').textContent = 'Pelaku Lolos';
      $('end-text').textContent = 'Alibi orang yang kamu tuduh tidak terbantahkan. Pelakunya lolos malam itu.';
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
    state.solved = false;
    state.score = 1000;
    state.hintUsed = false;
    state.potSlid = false;
    state.keyFound = false;
    potAnim = 0;
    state.cells = buildCells();
    renderCells();
    renderWork(-1);
    updateScore();
    updateObjective();
    updateKeyBadge();
    updateDeskLocks();
    player.x = 216; player.y = 240; player.dir = 'down'; player.moving = false; player.anim = 0;
    cam.x = Math.round(Math.max(0, Math.min(WORLD_W - VW, player.x - VW / 2)));
    cam.y = Math.round(Math.max(0, Math.min(WORLD_H - VH, player.y - VH / 2)));
    closeDialog();
    closeModal();
    var pk = $('p-keys');
    if (pk) pk.style.opacity = '1';
  }

  function fillBrief() {
    $('brief-text').innerHTML =
      '<p>Pukul 07.10 pagi, <strong>Pak Rahmat</strong> menemukan Lab Komputer 2 dalam keadaan tidak terkunci. ' +
      'Satu unit laptop inventaris sekolah hilang dari meja guru.</p>' +
      '<p>Di komputer yang terakhir dipakai, hanya ada satu file bernama <em>pesan.txt</em>. Isinya bukan kalimat — ' +
      'melainkan deretan huruf acak.</p>' +
      '<p>Di sekitar meja ada dua catatan lain: sebuah fungsi tertinggal di papan tulis, dan sebuah sticky note ' +
      'terlipat di dasar tempat sampah. Keduanya tampak seperti kunci.</p>' +
      '<p><strong>Tugasmu:</strong> jalan-jalan di lab, kumpulkan bukti, pecahkan pesannya di meja dekripsi, ' +
      'lalu tuduh pelakunya.</p>';
  }

  /* =========================================================
     15. EVENTS
     ========================================================= */
  function wire() {
    $('btn-start').addEventListener('click', function () { resetGame(); showScreen('scr-brief'); });
    $('btn-help').addEventListener('click', function () {
      openModal('CARA MAIN', 'Alur penyelidikan',
        '1. Jalan dengan WASD atau tombol panah.  2. Dekati objek, tekan E untuk memeriksa.  ' +
        '3. Kumpulkan cipherteks dan kedua fungsi.  4. Buka meja dekripsi dari komputer.  ' +
        '5. Untuk tiap huruf, hitung f⁻¹ dulu lalu g⁻¹.  6. Buka lemari arsip, lalu tuduh tersangka.',
        'c = f(g(x))  \u2192  x = g\u207b\u00b9(f\u207b\u00b9(c))', true);
    });
    $('btn-brief-back').addEventListener('click', function () { showScreen('scr-title'); });
    $('btn-to-play').addEventListener('click', function () { showScreen('scr-play'); });
    $('btn-desk-help').addEventListener('click', function () { $('btn-help').click(); });

    $('btn-desk-back').addEventListener('click', function () {
      showScreen('scr-play');
      if (state.solved && !state.keyFound) {
        openDialog('KAMU MENGINGAT SESUATU',
          'Sandi dari pesan itu: <code>KUNCI DI POT</code>. Coba periksa pot tanaman di dekat dispenser, sudut kanan bawah.',
          [{ label: 'Ke pot', primary: true, fn: closeDialog }]);
      }
    });
    $('btn-hint').addEventListener('click', showHint);
    $('btn-check').addEventListener('click', checkAll);
    $('btn-accuse-back').addEventListener('click', function () { showScreen('scr-play'); });
    $('btn-again').addEventListener('click', function () { resetGame(); showScreen('scr-title'); });

    $('modal-x').addEventListener('click', function () {
      var wasSolve = modalEl.getAttribute('data-solve') === '1';
      closeModal();
      if (wasSolve) {
        modalEl.removeAttribute('data-solve');
        showScreen('scr-play');
        openDialog('KAMU MENGINGAT SESUATU',
          'Sandi dari pesan itu: <code>KUNCI DI POT</code>. Coba periksa pot tanaman di dekat dispenser, sudut kanan bawah.',
          [{ label: 'Ke pot', primary: true, fn: closeDialog }]);
      }
    });
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
    'H': ['101', '101', '111', '101', '101']
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

  /* ---------- garis TKP kuning ---------- */
  function drawTape() {
    var x1 = 300, y1 = 304, x2 = 636, y2 = 298;

    TR(x1 - 2, y1 - 8, 4, 58, '#4a4034');
    TR(x1 - 1, y1 - 8, 1, 58, '#5e5242');
    TR(x2 - 2, y2 - 8, 4, 58, '#4a4034');
    TR(x2 - 1, y2 - 8, 1, 58, '#5e5242');
    TR(x1 - 4, y1 - 10, 8, 4, '#5e5242');
    TR(x2 - 4, y2 - 10, 8, 4, '#5e5242');
    tctx.globalAlpha = 0.35;
    tctx.fillStyle = '#000';
    tctx.beginPath(); tctx.ellipse(x1, y1 + 50, 8, 3, 0, 0, 6.283); tctx.fill();
    tctx.beginPath(); tctx.ellipse(x2, y2 + 50, 8, 3, 0, 0, 6.283); tctx.fill();
    tctx.globalAlpha = 1;

    var steps = 76;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var x = x1 + (x2 - x1) * t;
      var sag = Math.sin(t * Math.PI) * 14;
      var y = y1 + (y2 - y1) * t + sag;
      TR(x, y, 5, 7, '#e0b13c');
      TR(x, y, 5, 1, '#f5cf74');
      if (i % 8 === 0) TR(x + 1, y + 2, 3, 3, '#2a2010');
    }
    for (var j = 0; j <= 62; j++) {
      var t2 = j / 62;
      var x3 = x1 + (x2 - x1) * t2;
      var sag2 = Math.sin(t2 * Math.PI) * 10;
      var y3 = y1 + 32 + sag2;
      TR(x3, y3, 4, 5, '#c69c34');
      if (j % 9 === 0) TR(x3 + 1, y3 + 1, 2, 2, '#2a2010');
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
    drawTape();
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
     18. BOOT
     ========================================================= */
  window.onerror = function (msg, src, line, col) {
    var e = $('err');
    if (!e) return;
    e.style.display = 'block';
    e.textContent = msg + '  @' + line + ':' + col;
  };

  fillBrief();
  wire();
  resetGame();
  buildVignette();
  initDust();
  initTitle();
  fit();
  window.addEventListener('resize', fit);
  requestAnimationFrame(frame);

  /* test hooks */
  window.GAME = {
    state: state, CASE: CASE, player: player, cam: cam, grid: grid,
    INTERACTABLES: INTERACTABLES,
    checkAll: checkAll, interact: interact, openDesk: openDesk,
    showScreen: showScreen, finish: finish,
    teleport: function (x, y) { player.x = x; player.y = y; },
    potAnim: function () { return potAnim; },
    _dbg: { drawSprite: drawSprite, PAL: PAL, ctx: ctx,
            SPR: { SPR_DOWN: SPR_DOWN, SPR_UP: SPR_UP, SPR_SIDE: SPR_SIDE } },
    derivedPlain: function () {
      return state.cells.map(function (c) { return c.space ? ' ' : c.plain; }).join('');
    },
    encryptLetter: encryptLetter,
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
