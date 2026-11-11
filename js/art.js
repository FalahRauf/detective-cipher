/* =========================================================
   DETEKTIF SANDI — art.js
   Semua grafis digambar prosedural di <canvas>: tanpa aset luar.
   Isi: font piksel, sprite karakter, potret, lantai/dinding, perabot.
   ========================================================= */
(function () {
  'use strict';
  var DS = window.DS = window.DS || {};

  function R(g, x, y, w, h, c) {
    if (w <= 0 || h <= 0) return;
    g.fillStyle = c;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function hexRgb(h) {
    h = String(h).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function shade(h, f) {
    var c = hexRgb(h);
    return 'rgb(' + Math.min(255, Math.round(c[0] * f)) + ',' +
      Math.min(255, Math.round(c[1] * f)) + ',' + Math.min(255, Math.round(c[2] * f)) + ')';
  }
  function makeCanvas(w, h) {
    var cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    var g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    return { cv: cv, g: g };
  }

  /* ---------------------------------------------------------
     FONT PIKSEL 3x5
     --------------------------------------------------------- */
  var FONT = {
    A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'],
    C: ['011', '100', '100', '100', '011'], D: ['110', '101', '101', '101', '110'],
    E: ['111', '100', '110', '100', '111'], F: ['111', '100', '110', '100', '100'],
    G: ['011', '100', '101', '101', '011'], H: ['101', '101', '111', '101', '101'],
    I: ['111', '010', '010', '010', '111'], J: ['001', '001', '001', '101', '010'],
    K: ['101', '101', '110', '101', '101'], L: ['100', '100', '100', '100', '111'],
    M: ['101', '111', '111', '101', '101'], N: ['110', '101', '101', '101', '101'],
    O: ['010', '101', '101', '101', '010'], P: ['110', '101', '110', '100', '100'],
    Q: ['010', '101', '101', '110', '011'], R: ['110', '101', '110', '101', '101'],
    S: ['011', '100', '010', '001', '110'], T: ['111', '010', '010', '010', '010'],
    U: ['101', '101', '101', '101', '111'], V: ['101', '101', '101', '101', '010'],
    W: ['101', '101', '111', '111', '101'], X: ['101', '101', '010', '101', '101'],
    Y: ['101', '101', '010', '010', '010'], Z: ['111', '001', '010', '100', '111'],
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
    '2': ['110', '001', '010', '100', '111'], '3': ['110', '001', '010', '001', '110'],
    '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '110', '001', '110'],
    '6': ['011', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'],
    '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '110'],
    '.': ['000', '000', '000', '000', '010'], ':': ['000', '010', '000', '010', '000'],
    '-': ['000', '000', '111', '000', '000'], '/': ['001', '001', '010', '100', '100'],
    '#': ['101', '111', '101', '111', '101'], '!': ['010', '010', '010', '000', '010'],
    '?': ['110', '001', '010', '000', '010'], "'": ['010', '010', '000', '000', '000'],
    ',': ['000', '000', '000', '010', '100'], '(': ['010', '100', '100', '100', '010'],
    ')': ['010', '001', '001', '001', '010'], '+': ['000', '010', '111', '010', '000'],
    '=': ['000', '111', '000', '111', '000'], '>': ['100', '010', '001', '010', '100'],
    '<': ['001', '010', '100', '010', '001'], '_': ['000', '000', '000', '000', '111'],
    ' ': ['000', '000', '000', '000', '000']
  };
  function text(g, s, x, y, sc, col) {
    s = String(s).toUpperCase();
    sc = sc || 1;
    g.fillStyle = col || '#fff';
    for (var i = 0; i < s.length; i++) {
      var gl = FONT[s.charAt(i)] || FONT[' '];
      for (var r = 0; r < 5; r++) {
        for (var c = 0; c < 3; c++) {
          if (gl[r].charAt(c) === '1') g.fillRect(x + (i * 4 + c) * sc, y + r * sc, sc, sc);
        }
      }
    }
  }
  function textW(s, sc) { return String(s).length * 4 * (sc || 1) - (sc || 1); }

  /* ---------------------------------------------------------
     SPRITE KARAKTER 16x24 — dirakit dari spesifikasi karakter
     (kulit, gaya rambut/topi, baju, celana, aksesori).
     Titik kaki = (8, 23).
     --------------------------------------------------------- */
  var spriteCache = {};

  function charCols(ch) {
    return {
      skin: ch.skin, skinSh: shade(ch.skin, 0.8),
      hair: ch.hair || '#1c1612', hairHi: shade(ch.hair || '#1c1612', 1.5),
      top: ch.top, topSh: shade(ch.top, 0.72), topHi: shade(ch.top, 1.18),
      pants: ch.pants || '#2a2d38', shoes: ch.shoes || '#15161b',
      hat: ch.hat || '#3a2a18', hatBand: shade(ch.hat || '#3a2a18', 0.6),
      hijab: ch.hijab || '#ddd', hijabSh: shade(ch.hijab || '#ddd', 0.8),
      eye: '#14161c'
    };
  }
  function has(ch, a) { return ch.acc && ch.acc.indexOf(a) >= 0; }

  function drawSpriteDown(g, ch, C, frame, up) {
    var lUp = frame === 1 ? 1 : 0, rUp = frame === 3 ? 1 : 0;
    // kaki
    R(g, 5, 19, 3, 3 - lUp, C.pants); R(g, 4, 22 - lUp, 4, 2, C.shoes);
    R(g, 8, 19, 3, 3 - rUp, C.pants); R(g, 8, 22 - rUp, 4, 2, C.shoes);
    R(g, 7, 19, 1, 2, shade(ch.pants || '#2a2d38', 0.7));
    // badan
    R(g, 4, 12, 8, 7, C.top);
    R(g, 10, 12, 2, 7, C.topSh);
    R(g, 4, 12, 8, 1, C.topHi);
    if (ch.coat) { R(g, 4, 19, 8, 2, C.top); R(g, 10, 19, 2, 2, C.topSh); R(g, 4, 16, 8, 1, C.topSh); }
    // lengan
    var la = frame === 1 ? -1 : 0, ra = frame === 3 ? -1 : 0;
    R(g, 3, 12, 1, 6 + la, C.topSh); R(g, 3, 18 + la, 1, 1, C.skin);
    R(g, 12, 12, 1, 6 + ra, C.topSh); R(g, 12, 18 + ra, 1, 1, C.skin);
    if (!up) {
      if (ch.collar) { R(g, 6, 12, 1, 2, ch.collar); R(g, 9, 12, 1, 2, ch.collar); }
      R(g, 7, 12, 2, 1, C.skinSh);
      if (has(ch, 'tie')) R(g, 7, 13, 2, 4, ch.tie || '#7a1f24');
      if (has(ch, 'lanyard')) { R(g, 6, 13, 1, 2, '#c0392b'); R(g, 9, 13, 1, 2, '#c0392b'); R(g, 7, 15, 2, 2, '#e8e8e8'); }
      if (has(ch, 'badge')) R(g, 5, 13, 1, 1, '#e0b84a');
      if (has(ch, 'apron')) { R(g, 5, 14, 6, 6, '#3f6b4f'); R(g, 5, 14, 6, 1, '#4f8462'); }
    }
    // leher + kepala
    R(g, 7, 11, 2, 1, C.skinSh);
    R(g, 5, 4, 6, 6, C.skin); R(g, 6, 10, 4, 1, C.skin);
    R(g, 10, 5, 1, 5, C.skinSh);
    var st = ch.style;
    if (up) {
      // tampak belakang
      if (st === 'hijab') {
        R(g, 4, 2, 8, 10, C.hijab); R(g, 3, 11, 10, 3, C.hijab); R(g, 10, 3, 2, 9, C.hijabSh);
      } else if (st === 'bald') {
        R(g, 5, 3, 6, 7, C.skin); R(g, 4, 6, 8, 3, C.hair); R(g, 6, 4, 3, 1, shade(ch.skin, 1.1));
      } else {
        R(g, 4, 2, 8, 8, C.hair); R(g, 5, 1, 6, 1, C.hair);
        if (st === 'long') R(g, 4, 9, 8, 4, C.hair);
        if (st === 'bun') R(g, 6, 0, 4, 2, C.hair);
        if (st === 'spiky') { R(g, 5, 0, 1, 1, C.hair); R(g, 8, 0, 1, 1, C.hair); R(g, 10, 1, 1, 1, C.hair); }
        R(g, 5, 2, 3, 1, C.hairHi);
      }
      if (st === 'fedora') { R(g, 4, 1, 8, 3, C.hat); R(g, 4, 3, 8, 1, C.hatBand); R(g, 2, 4, 12, 1, C.hat); }
      if (st === 'cap') { R(g, 4, 1, 8, 3, C.hat); R(g, 4, 4, 8, 1, C.hatBand); }
      return;
    }
    // wajah depan
    R(g, 6, 7, 1, 1, C.eye); R(g, 9, 7, 1, 1, C.eye);
    if (has(ch, 'glasses')) { R(g, 5, 7, 6, 1, '#1a1d24'); R(g, 6, 7, 1, 1, '#9cc2e0'); R(g, 9, 7, 1, 1, '#9cc2e0'); }
    if (has(ch, 'mustache')) R(g, 6, 9, 4, 1, C.hair);
    if (has(ch, 'beard')) { R(g, 5, 9, 6, 1, C.hair); R(g, 6, 10, 4, 1, C.hair); }
    if (st === 'hijab') {
      R(g, 4, 2, 8, 3, C.hijab); R(g, 4, 5, 2, 7, C.hijab); R(g, 10, 5, 2, 7, C.hijab);
      R(g, 5, 10, 1, 2, C.hijab); R(g, 10, 10, 1, 2, C.hijab);
      R(g, 3, 11, 10, 3, C.hijab); R(g, 3, 13, 10, 1, C.hijabSh); R(g, 6, 4, 4, 1, C.hijabSh);
    } else if (st === 'bald') {
      R(g, 5, 3, 6, 2, C.skin); R(g, 4, 5, 1, 3, C.hair); R(g, 11, 5, 1, 3, C.hair); R(g, 6, 3, 3, 1, shade(ch.skin, 1.12));
    } else if (st === 'fedora') {
      R(g, 4, 5, 1, 2, '#2a1c12'); R(g, 11, 5, 1, 2, '#2a1c12');
      R(g, 4, 0, 8, 3, C.hat); R(g, 4, 2, 8, 1, C.hatBand); R(g, 2, 3, 12, 1, C.hat);
      R(g, 3, 4, 10, 1, shade(ch.hat || '#3a2a18', 0.75)); R(g, 5, 5, 6, 1, C.skinSh);
    } else if (st === 'cap') {
      R(g, 4, 5, 1, 2, C.hair); R(g, 11, 5, 1, 2, C.hair);
      R(g, 4, 1, 8, 3, C.hat); R(g, 4, 4, 8, 1, C.hatBand); R(g, 7, 2, 2, 1, '#e0b84a');
    } else {
      R(g, 5, 2, 6, 1, C.hair); R(g, 4, 3, 8, 2, C.hair);
      R(g, 4, 5, 1, 3, C.hair); R(g, 11, 5, 1, 3, C.hair);
      if (st === 'slick') { R(g, 5, 5, 3, 1, C.hair); R(g, 6, 3, 3, 1, C.hairHi); }
      else R(g, 5, 5, 2, 1, C.hair);
      if (st === 'long') { R(g, 4, 8, 1, 6, C.hair); R(g, 11, 8, 1, 6, C.hair); }
      if (st === 'bun') R(g, 6, 0, 4, 2, C.hair);
      if (st === 'spiky') { R(g, 5, 1, 1, 1, C.hair); R(g, 7, 1, 1, 1, C.hair); R(g, 9, 1, 1, 1, C.hair); R(g, 10, 2, 1, 1, C.hair); }
      R(g, 6, 3, 2, 1, C.hairHi);
    }
  }

  function drawSpriteSide(g, ch, C, frame) {
    // menghadap kanan; kiri = dicerminkan
    if (frame === 1 || frame === 3) {
      var a = frame === 1;
      R(g, 5, 19, 3, 3, C.pants); R(g, a ? 3 : 4, 22, 4, 2, C.shoes);
      R(g, 8, 19, 3, 3, shade(ch.pants || '#2a2d38', 0.8)); R(g, a ? 9 : 8, 22, 4, 2, C.shoes);
    } else {
      R(g, 6, 19, 4, 3, C.pants); R(g, 6, 22, 5, 2, C.shoes);
    }
    R(g, 5, 12, 6, 7, C.top); R(g, 5, 12, 1, 7, C.topSh); R(g, 5, 12, 6, 1, C.topHi);
    if (ch.coat) { R(g, 5, 19, 6, 2, C.top); R(g, 5, 16, 6, 1, C.topSh); }
    var sw = frame === 1 ? 1 : (frame === 3 ? -1 : 0);
    R(g, 7 + sw, 13, 2, 5, C.topSh); R(g, 7 + sw, 18, 2, 1, C.skin);
    R(g, 7, 11, 2, 1, C.skinSh);
    R(g, 6, 4, 6, 6, C.skin); R(g, 7, 10, 4, 1, C.skin); R(g, 12, 7, 1, 1, C.skin);
    R(g, 10, 7, 1, 1, C.eye);
    if (has(ch, 'glasses')) { R(g, 9, 7, 3, 1, '#1a1d24'); R(g, 10, 7, 1, 1, '#9cc2e0'); R(g, 7, 7, 2, 1, '#1a1d24'); }
    if (has(ch, 'mustache')) R(g, 10, 9, 2, 1, C.hair);
    if (has(ch, 'beard')) { R(g, 8, 9, 4, 2, C.hair); }
    var st = ch.style;
    if (st === 'hijab') {
      R(g, 5, 2, 7, 3, C.hijab); R(g, 5, 5, 4, 7, C.hijab); R(g, 4, 11, 8, 3, C.hijab); R(g, 4, 13, 8, 1, C.hijabSh);
      R(g, 5, 5, 1, 6, C.hijabSh);
    } else if (st === 'bald') {
      R(g, 6, 3, 5, 2, C.skin); R(g, 6, 5, 2, 3, C.hair);
    } else if (st === 'fedora') {
      R(g, 6, 5, 2, 3, '#2a1c12');
      R(g, 6, 0, 6, 3, C.hat); R(g, 6, 2, 6, 1, C.hatBand); R(g, 3, 3, 11, 1, C.hat); R(g, 9, 4, 3, 1, C.skinSh);
    } else if (st === 'cap') {
      R(g, 6, 5, 2, 3, C.hair);
      R(g, 6, 1, 6, 3, C.hat); R(g, 11, 4, 3, 1, C.hatBand); R(g, 6, 4, 5, 1, C.hatBand);
    } else {
      R(g, 6, 2, 6, 3, C.hair); R(g, 5, 3, 1, 5, C.hair); R(g, 6, 5, 2, 3, C.hair); R(g, 11, 4, 1, 1, C.hair);
      if (st === 'long') R(g, 5, 8, 3, 6, C.hair);
      if (st === 'bun') R(g, 4, 2, 2, 3, C.hair);
      if (st === 'spiky') { R(g, 6, 1, 1, 1, C.hair); R(g, 8, 1, 1, 1, C.hair); R(g, 10, 1, 1, 1, C.hair); }
      R(g, 7, 2, 3, 1, C.hairHi);
    }
  }

  function sprite(ch, dir, frame) {
    var key = ch.id + '|' + dir + '|' + frame;
    if (spriteCache[key]) return spriteCache[key];
    var k = makeCanvas(16, 24), g = k.g, C = charCols(ch);
    if (dir === 'left' || dir === 'right') {
      if (dir === 'left') { g.translate(16, 0); g.scale(-1, 1); }
      drawSpriteSide(g, ch, C, frame);
    } else {
      drawSpriteDown(g, ch, C, frame, dir === 'up');
    }
    spriteCache[key] = k.cv;
    return k.cv;
  }

  // x, y = titik kaki
  function drawChar(g, ch, x, y, dir, frame, scale) {
    scale = scale || 1;
    var s = sprite(ch, dir || 'down', frame || 0);
    g.save();
    g.globalAlpha = 0.38 * (g.globalAlpha || 1);
    g.fillStyle = '#000';
    g.beginPath();
    g.ellipse(Math.round(x), Math.round(y), 6 * scale, 2 * scale, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
    g.drawImage(s, Math.round(x - 8 * scale), Math.round(y - 23 * scale), 16 * scale, 24 * scale);
  }

  /* ---------------------------------------------------------
     POTRET 40x40 untuk dialog, cutscene, interogasi
     mood: neutral | worried | angry | smirk | happy
     --------------------------------------------------------- */
  var portraitCache = {};
  function portrait(ch, mood) {
    mood = mood || 'neutral';
    var key = ch.id + '|' + mood;
    if (portraitCache[key]) return portraitCache[key];
    var k = makeCanvas(40, 40), g = k.g, C = charCols(ch);
    var st = ch.style;
    var hijab = st === 'hijab';

    // pundak & baju
    if (hijab) {
      R(g, 3, 31, 34, 9, C.top);
      R(g, 5, 27, 30, 13, C.hijab); R(g, 3, 30, 34, 6, C.hijab); R(g, 28, 28, 7, 10, C.hijabSh);
      R(g, 3, 36, 34, 4, C.top);
    } else {
      R(g, 4, 31, 32, 9, C.top); R(g, 7, 29, 26, 3, C.top);
      R(g, 28, 30, 8, 10, C.topSh); R(g, 4, 31, 3, 9, C.topSh);
      R(g, 7, 29, 26, 1, C.topHi);
      R(g, 16, 24, 8, 7, C.skinSh);
      if (ch.collar) { R(g, 13, 29, 5, 4, ch.collar); R(g, 22, 29, 5, 4, ch.collar); }
      if (ch.coat) {
        R(g, 11, 29, 7, 11, C.topSh); R(g, 22, 29, 7, 11, C.topSh);
        R(g, 17, 29, 6, 11, '#d9d4c6'); R(g, 19, 30, 2, 10, '#3a2420');
      }
      if (has(ch, 'tie')) { R(g, 18, 29, 4, 2, ch.tie || '#7a1f24'); R(g, 19, 31, 2, 9, ch.tie || '#7a1f24'); }
      if (has(ch, 'lanyard')) { R(g, 14, 30, 1, 7, '#c0392b'); R(g, 25, 30, 1, 7, '#c0392b'); R(g, 22, 35, 6, 5, '#eeeeee'); R(g, 23, 36, 4, 1, '#5a93d6'); }
      if (has(ch, 'badge')) { R(g, 27, 33, 4, 3, '#e0b84a'); R(g, 28, 34, 2, 1, '#8a6620'); }
      if (has(ch, 'apron')) { R(g, 12, 33, 16, 7, '#3f6b4f'); R(g, 12, 33, 16, 1, '#4f8462'); }
      if (has(ch, 'batik')) {
        for (var bi = 0; bi < 6; bi++) { R(g, 6 + bi * 5, 34 + (bi % 2) * 2, 2, 2, shade(ch.top, 1.45)); }
      }
      if (has(ch, 'headset')) { R(g, 6, 30, 3, 6, '#1b1d22'); }
    }

    // wajah (oval)
    // gambar hijab dulu (di belakang wajah)
    if (hijab) {
      R(g, 9, 4, 22, 26, C.hijab); R(g, 7, 8, 26, 22, C.hijab); R(g, 11, 2, 18, 4, C.hijab);
      R(g, 27, 8, 6, 22, C.hijabSh); R(g, 11, 9, 18, 1, C.hijabSh);
    }
    if (!hijab) {
      R(g, 13, 8, 14, 1, C.skin); R(g, 12, 9, 16, 1, C.skin); R(g, 11, 10, 18, 13, C.skin);
      R(g, 12, 23, 16, 1, C.skin); R(g, 13, 24, 14, 1, C.skin); R(g, 15, 25, 10, 1, C.skin);
    } else {
      R(g, 14, 10, 12, 1, C.skin); R(g, 13, 11, 14, 1, C.skin); R(g, 12, 12, 16, 11, C.skin);
      R(g, 13, 23, 14, 1, C.skin); R(g, 14, 24, 12, 1, C.skin); R(g, 16, 25, 8, 1, C.skin);
    }
    R(g, hijab ? 25 : 26, 11, 2, 12, C.skinSh);
    R(g, 14, 25, 12, 1, C.skinSh);
    if (!hijab) {
      R(g, 9, 15, 2, 6, C.skin); R(g, 29, 15, 2, 6, C.skinSh); R(g, 9, 16, 1, 3, C.skinSh);
    }

    // alis
    var by = 13;
    var bl = [14, 18], br = [21, 25];
    if (mood === 'worried') {
      R(g, 14, by + 1, 2, 1, C.hair); R(g, 16, by, 3, 1, C.hair);
      R(g, 21, by, 3, 1, C.hair); R(g, 24, by + 1, 2, 1, C.hair);
    } else if (mood === 'angry') {
      R(g, 14, by, 2, 1, C.hair); R(g, 16, by + 1, 3, 1, C.hair);
      R(g, 21, by + 1, 3, 1, C.hair); R(g, 24, by, 2, 1, C.hair);
    } else if (mood === 'smirk') {
      R(g, 14, by + 1, 5, 1, C.hair); R(g, 21, by - 1, 5, 1, C.hair);
    } else {
      R(g, bl[0], by, bl[1] - bl[0] + 1, 1, C.hair); R(g, br[0], by, br[1] - br[0] + 1, 1, C.hair);
    }
    if (st === 'bald') { R(g, 14, by, 5, 1, '#8a8a8a'); R(g, 21, by, 5, 1, '#8a8a8a'); }

    // mata
    var ey = 16;
    R(g, 15, ey, 3, 2, '#f2efe9'); R(g, 22, ey, 3, 2, '#f2efe9');
    var py = mood === 'worried' ? 0 : 0;
    var px = mood === 'smirk' ? 1 : 0;
    R(g, 16 + px, ey + py, 2, 2, C.eye); R(g, 23 + px, ey + py, 2, 2, C.eye);
    R(g, 16 + px, ey, 1, 1, '#ffffff'); R(g, 23 + px, ey, 1, 1, '#ffffff');
    if (mood === 'angry') { R(g, 15, ey, 3, 1, C.skinSh); R(g, 22, ey, 3, 1, C.skinSh); }
    if (has(ch, 'glasses')) {
      var fc = '#1d2027';
      R(g, 13, 15, 7, 1, fc); R(g, 13, 19, 7, 1, fc); R(g, 13, 15, 1, 5, fc); R(g, 19, 15, 1, 5, fc);
      R(g, 20, 15, 7, 1, fc); R(g, 20, 19, 7, 1, fc); R(g, 20, 15, 1, 5, fc); R(g, 26, 15, 1, 5, fc);
      R(g, 19, 16, 1, 1, fc); R(g, 11, 16, 2, 1, fc); R(g, 27, 16, 2, 1, fc);
      g.globalAlpha = 0.18; R(g, 14, 16, 5, 3, '#bfe3ff'); R(g, 21, 16, 5, 3, '#bfe3ff'); g.globalAlpha = 1;
    }

    // hidung
    R(g, 19, 18, 2, 3, C.skinSh); R(g, 19, 18, 1, 2, shade(ch.skin, 1.08));

    // mulut
    var mc = '#8e4a3e';
    if (mood === 'happy') { R(g, 16, 21, 1, 1, mc); R(g, 17, 22, 6, 1, mc); R(g, 23, 21, 1, 1, mc); R(g, 18, 23, 4, 1, '#b8695a'); }
    else if (mood === 'worried') { R(g, 17, 22, 6, 1, mc); R(g, 16, 23, 1, 1, mc); R(g, 23, 23, 1, 1, mc); }
    else if (mood === 'angry') { R(g, 17, 22, 6, 2, '#5a2a24'); R(g, 18, 22, 4, 1, '#e8e2d8'); }
    else if (mood === 'smirk') { R(g, 18, 22, 5, 1, mc); R(g, 23, 21, 1, 1, mc); }
    else { R(g, 17, 22, 6, 1, mc); }

    if (has(ch, 'mustache')) { R(g, 15, 20, 10, 2, C.hair); R(g, 15, 21, 1, 1, C.skin); R(g, 24, 21, 1, 1, C.skin); }
    if (has(ch, 'beard')) { R(g, 12, 22, 3, 3, C.hair); R(g, 25, 22, 3, 3, C.hair); R(g, 14, 24, 12, 2, C.hair); R(g, 16, 23, 2, 1, C.hair); R(g, 22, 23, 2, 1, C.hair); }

    // rambut / penutup kepala
    if (hijab) {
      R(g, 12, 9, 16, 2, C.hijab); R(g, 11, 10, 2, 14, C.hijab); R(g, 27, 10, 2, 14, C.hijab);
      R(g, 12, 24, 2, 3, C.hijab); R(g, 26, 24, 2, 3, C.hijab);
      R(g, 13, 11, 14, 1, C.hijabSh);
      R(g, 25, 27, 2, 2, '#e0c060');
    } else if (st === 'bald') {
      R(g, 9, 12, 3, 6, C.hair); R(g, 28, 12, 3, 6, C.hair);
      R(g, 12, 8, 16, 3, C.skin); R(g, 14, 7, 12, 1, C.skin); R(g, 15, 9, 6, 1, shade(ch.skin, 1.15));
    } else if (st === 'fedora') {
      R(g, 9, 11, 3, 7, '#2a1c12'); R(g, 28, 11, 3, 7, '#2a1c12');
      R(g, 11, 0, 18, 8, C.hat); R(g, 13, 0, 14, 1, shade(ch.hat, 1.3));
      R(g, 11, 6, 18, 2, C.hatBand);
      R(g, 4, 8, 32, 3, C.hat); R(g, 4, 10, 32, 1, shade(ch.hat, 0.7));
      R(g, 11, 11, 18, 2, C.skinSh);
    } else if (st === 'cap') {
      R(g, 9, 11, 3, 6, C.hair); R(g, 28, 11, 3, 6, C.hair);
      R(g, 11, 3, 18, 7, C.hat); R(g, 13, 3, 14, 1, shade(ch.hat, 1.3));
      R(g, 9, 9, 22, 3, C.hatBand); R(g, 18, 5, 4, 3, '#e0b84a'); R(g, 19, 6, 2, 1, '#8a6620');
    } else {
      R(g, 11, 5, 18, 5, C.hair); R(g, 13, 4, 14, 1, C.hair);
      R(g, 9, 8, 3, 9, C.hair); R(g, 28, 8, 3, 9, C.hair);
      if (st === 'slick') {
        R(g, 11, 9, 9, 2, C.hair); R(g, 20, 9, 1, 1, C.hair); R(g, 13, 5, 10, 1, C.hairHi); R(g, 20, 6, 1, 3, shade(ch.hair, 0.6));
      } else if (st === 'spiky') {
        R(g, 11, 9, 16, 2, C.hair); R(g, 12, 11, 2, 1, C.hair); R(g, 17, 11, 2, 1, C.hair); R(g, 23, 11, 2, 1, C.hair);
        R(g, 11, 1, 3, 4, C.hair); R(g, 16, 0, 3, 5, C.hair); R(g, 21, 1, 3, 4, C.hair); R(g, 26, 2, 3, 4, C.hair);
        R(g, 14, 5, 6, 1, C.hairHi);
      } else {
        R(g, 11, 9, 18, 2, C.hair); R(g, 12, 11, 4, 1, C.hair); R(g, 24, 11, 4, 1, C.hair);
        R(g, 14, 5, 7, 1, C.hairHi);
      }
      if (st === 'long') { R(g, 8, 10, 4, 22, C.hair); R(g, 28, 10, 4, 22, C.hair); R(g, 9, 30, 4, 4, C.hair); R(g, 27, 30, 4, 4, C.hair); }
      if (st === 'bun') { R(g, 15, 0, 10, 5, C.hair); R(g, 17, 0, 4, 1, C.hairHi); }
      if (has(ch, 'grey')) { R(g, 9, 9, 2, 6, '#9a9a9a'); R(g, 29, 9, 2, 6, '#9a9a9a'); }
    }
    if (has(ch, 'headset')) { R(g, 8, 13, 3, 7, '#1b1d22'); R(g, 29, 13, 3, 7, '#1b1d22'); R(g, 10, 3, 20, 2, '#1b1d22'); }

    portraitCache[key] = k.cv;
    return k.cv;
  }
  function drawPortrait(g, ch, mood, x, y, scale) {
    var p = portrait(ch, mood);
    g.drawImage(p, Math.round(x), Math.round(y), 40 * scale, 40 * scale);
  }

  /* ---------------------------------------------------------
     LANTAI & DINDING
     --------------------------------------------------------- */
  function hash(c, r) { var h = (c * 374761393 + r * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) % 1000; }

  var FLOORS = {
    lab: function (g, c, r, x, y) {
      R(g, x, y, 16, 16, ((c + r) & 1) ? '#4b5768' : '#475264');
      R(g, x, y, 16, 1, '#56637a'); R(g, x, y, 1, 16, '#3c4656');
      if (hash(c, r) < 90) R(g, x + 5, y + 9, 3, 1, '#535f74');
    },
    corr: function (g, c, r, x, y) {
      R(g, x, y, 16, 16, '#5e5c57');
      var h = hash(c, r);
      R(g, x + (h % 13), y + ((h >> 3) % 13), 1, 1, '#76736c');
      R(g, x + ((h >> 2) % 14), y + ((h >> 5) % 14), 1, 1, '#4c4a46');
      R(g, x + ((h >> 4) % 12) + 2, y + ((h >> 1) % 12) + 2, 1, 1, '#6c6963');
      if (r % 2 === 0) R(g, x, y, 16, 1, '#55534e');
      if (c % 4 === 0) R(g, x, y, 1, 16, '#55534e');
    },
    store: function (g, c, r, x, y) {
      R(g, x, y, 16, 16, '#45433f');
      var h = hash(c, r);
      if (h < 120) { R(g, x + 3, y + 6, 5, 1, '#383633'); R(g, x + 8, y + 7, 3, 1, '#383633'); }
      R(g, x + (h % 14), y + ((h >> 4) % 14), 2, 1, '#4f4d48');
    },
    tech: function (g, c, r, x, y) {
      R(g, x, y, 16, 16, ((c + r) & 1) ? '#3f434d' : '#3b3f48');
      R(g, x, y, 16, 1, '#474c57'); R(g, x, y, 1, 16, '#33363e');
    },
    wood: function (g, c, r, x, y) {
      var off = (r % 2) * 8;
      R(g, x, y, 16, 16, '#7a5a3a');
      R(g, x, y + 7, 16, 1, '#5e4329'); R(g, x, y + 15, 16, 1, '#5e4329');
      R(g, x + ((off + 4) % 16), y, 1, 7, '#5e4329'); R(g, x + ((off + 12) % 16), y + 8, 1, 7, '#5e4329');
      var h = hash(c, r);
      R(g, x + 2, y + 2, 5, 1, h < 500 ? '#86653f' : '#715234');
      R(g, x + 9, y + 10, 4, 1, h < 300 ? '#86653f' : '#715234');
    },
    pantry: function (g, c, r, x, y) {
      R(g, x, y, 8, 8, '#8d9299'); R(g, x + 8, y + 8, 8, 8, '#8d9299');
      R(g, x + 8, y, 8, 8, '#5b6169'); R(g, x, y + 8, 8, 8, '#5b6169');
    },
    carpet: function (g, c, r, x, y) {
      R(g, x, y, 16, 16, '#5b2f36');
      if ((c + r) % 2 === 0) { R(g, x + 7, y + 7, 2, 2, '#6e3a42'); }
      R(g, x, y, 16, 1, '#55292f');
    },
    srv: function (g, c, r, x, y) {
      R(g, x, y, 16, 16, '#3a424e');
      R(g, x, y, 16, 1, '#4a5463'); R(g, x, y, 1, 16, '#4a5463');
      R(g, x + 15, y, 1, 16, '#2a3038'); R(g, x, y + 15, 16, 1, '#2a3038');
      for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) R(g, x + 4 + i * 4, y + 4 + j * 4, 1, 1, '#2c333d');
    },
    ctrl: function (g, c, r, x, y) {
      R(g, x, y, 16, 16, ((c + r) & 1) ? '#353a43' : '#31363e');
      R(g, x, y, 16, 1, '#3d434d');
    },
    panel: function (g, c, r, x, y) {
      R(g, x, y, 16, 16, '#44454a');
      var h = hash(c, r);
      if (h < 150) R(g, x + 4, y + 5, 6, 1, '#3a3b3f');
      R(g, x, y, 1, 16, '#3c3d41');
    }
  };

  var WALLS = {
    lab:   { top: '#151a22', face: '#4a596e', hi: '#5c6d85', lo: '#3a4659', base: '#222a35', ceil: '#2a3342' },
    cream: { top: '#1c1915', face: '#a38c68', hi: '#b6a07a', lo: '#87724f', base: '#4a3a28', ceil: '#5a4a36' },
    srv:   { top: '#101317', face: '#313a46', hi: '#3c4655', lo: '#262d37', base: '#171b21', ceil: '#1d232b' }
  };

  function wallTop(g, th, x, y, e) {
    var W = WALLS[th] || WALLS.lab;
    R(g, x, y, 16, 16, W.top);
    if (e.l) R(g, x, y, 2, 16, W.lo);
    if (e.r) R(g, x + 14, y, 2, 16, W.lo);
    if (e.u) R(g, x, y, 16, 2, W.lo);
  }
  // upper = baris atas dinding batas (tinggi 2 tile)
  function wallFace(g, th, c, x, y, upper) {
    var W = WALLS[th] || WALLS.lab;
    if (upper) {
      R(g, x, y, 16, 16, W.face);
      R(g, x, y, 16, 5, W.ceil);
      R(g, x, y + 5, 16, 1, W.lo);
      R(g, x, y + 6, 16, 1, W.hi);
      if (c % 2 === 0) R(g, x, y + 7, 1, 9, W.lo);
      return;
    }
    R(g, x, y, 16, 16, W.face);
    R(g, x, y, 16, 3, W.top);
    R(g, x, y + 3, 16, 1, W.hi);
    if (c % 2 === 0) R(g, x, y + 4, 1, 8, W.lo);
    R(g, x, y + 10, 16, 1, W.lo);
    R(g, x, y + 12, 16, 4, W.base);
    R(g, x, y + 12, 16, 1, shade(W.base, 1.5));
  }

  // pintu. orient 'h' = di dinding horizontal, 'v' = di dinding vertikal
  function door(g, x, y, orient, open, col, floorFn, c, r) {
    col = col || '#6b4a2e';
    if (orient === 'v') {
      if (floorFn) floorFn(g, c, r, x, y);
      R(g, x, y, 16, 2, '#2a221a'); R(g, x, y + 14, 16, 2, '#2a221a');
      if (open) {
        R(g, x + 1, y + 2, 2, 12, shade(col, 0.7));
        R(g, x + 1, y + 2, 12, 2, col);
      } else {
        R(g, x + 6, y + 1, 4, 14, col); R(g, x + 6, y + 1, 1, 14, shade(col, 1.25)); R(g, x + 9, y + 1, 1, 14, shade(col, 0.7));
        R(g, x + 7, y + 7, 2, 2, '#d8c27a');
      }
      return;
    }
    if (open) {
      if (floorFn) floorFn(g, c, r, x, y);
      R(g, x, y, 16, 3, 'rgba(0,0,0,.45)');
      R(g, x, y + 13, 16, 3, 'rgba(0,0,0,.15)');
      R(g, x, y, 2, 16, '#3a2c20'); R(g, x + 14, y, 2, 16, '#3a2c20');
      return;
    }
    R(g, x, y, 16, 16, '#3a2c20');
    R(g, x + 1, y + 1, 14, 15, col);
    R(g, x + 1, y + 1, 14, 1, shade(col, 1.3));
    R(g, x + 3, y + 3, 10, 5, shade(col, 0.82)); R(g, x + 3, y + 9, 10, 5, shade(col, 0.82));
    R(g, x + 11, y + 8, 2, 2, '#d8c27a');
    R(g, x + 1, y + 15, 14, 1, '#1a130d');
  }

  /* ---------------------------------------------------------
     API
     --------------------------------------------------------- */
  function flames(g, x, y, w, h, t, k) {
    k = k == null ? 1 : k;
    if (k <= 0) return;
    var n = Math.max(2, Math.round(w / 5));
    for (var i = 0; i < n; i++) {
      var fx = x + (i + 0.5) * w / n;
      var ph = 0.5 + 0.5 * Math.sin(t * 9 + i * 1.9);
      var fh = h * (0.55 + 0.45 * ph) * k;
      var by = y + h;
      var layers = [['#a3301a', 6, 1], ['#e2561c', 5, 0.86], ['#f59a2a', 3, 0.62], ['#ffe08a', 2, 0.34]];
      for (var L = 0; L < layers.length; L++) {
        var lw = layers[L][1] * k, lh = fh * layers[L][2];
        var steps = 4;
        for (var s = 0; s < steps; s++) {
          var sw = lw * (1 - s / steps * 0.75);
          var sx = fx - sw / 2 + Math.sin(t * 7 + i + s) * 0.8;
          R(g, sx, by - lh * (s + 1) / steps, sw, lh / steps + 1, layers[L][0]);
        }
      }
    }
    for (var e = 0; e < 4; e++) {
      var ep = (t * 0.9 + e * 0.27) % 1;
      R(g, x + ((e * 37 + (t * 13 | 0)) % Math.max(1, w)), y + h - ep * h * 1.8, 1, 1, ep < 0.5 ? '#ffd25a' : '#e2561c');
    }
  }
  function smoke(g, x, y, w, t, k) {
    for (var i = 0; i < 6; i++) {
      var p = (t * 0.25 + i / 6) % 1;
      g.globalAlpha = (1 - p) * 0.22 * (k == null ? 1 : k);
      var sz = 4 + p * 10;
      R(g, x + w / 2 + Math.sin(i * 2.3 + t) * w * 0.4 - sz / 2, y - p * 30 - sz / 2, sz, sz, '#3c3c40');
    }
    g.globalAlpha = 1;
  }

  /* ---------------------------------------------------------
     PERABOT — semua menerima kotak visual (x, y, w, h).
     P = objek prop (P.st untuk status), S = state game, t = waktu.
     --------------------------------------------------------- */
  function deskBase(g, x, y, w, h, top, front) {
    top = top || '#7a5636'; front = front || '#5a3e26';
    var th = Math.round(h * 0.6);
    R(g, x, y, w, th, top);
    R(g, x, y, w, 1, shade(top, 1.25));
    R(g, x, y + th, w, h - th, front);
    R(g, x, y + th, w, 1, shade(front, 0.7));
    R(g, x + 1, y + h - 1, w - 2, 1, 'rgba(0,0,0,.4)');
  }
  function monitor(g, x, y, w, h, on, t, col) {
    R(g, x, y, w, h, '#14171d');
    R(g, x + 1, y + 1, w - 2, h - 2, on ? (col || '#1f4a72') : '#0c0f14');
    if (on) {
      g.globalAlpha = 0.6 + 0.2 * Math.sin(t * 2.3 + x);
      R(g, x + 2, y + 2, Math.max(1, (w - 4) * 0.6), 1, '#8fc6f2');
      R(g, x + 2, y + 4, Math.max(1, (w - 4) * 0.8), 1, '#5b8fc0');
      g.globalAlpha = 1;
    }
    R(g, x + (w >> 1) - 1, y + h, 2, 2, '#22262e');
  }
  function chairBack(g, x, y, col) {
    col = col || '#2d3b4f';
    R(g, x, y, 10, 3, col); R(g, x, y, 10, 1, shade(col, 1.35));
    R(g, x + 1, y + 3, 8, 5, shade(col, 0.85));
    R(g, x + 4, y + 8, 2, 2, '#1b1f26');
    R(g, x + 1, y + 10, 8, 1, 'rgba(0,0,0,.35)');
  }

  var PROPS = {
    desk_pc: function (g, x, y, w, h, P, S, t) {
      var on = P.st.on !== false;
      deskBase(g, x, y + 6, w, 14, '#6d5034', '#4e3824');
      monitor(g, x + (w >> 1) - 9, y - 2, 18, 11, on, t, P.screen);
      R(g, x + (w >> 1) - 7, y + 12, 14, 3, '#2a2e36'); R(g, x + (w >> 1) - 7, y + 12, 14, 1, '#3c414b');
      R(g, x + 4, y + 9, 5, 4, '#e8e2d0');
      if (P.var === 'nayla') {
        R(g, x + w - 10, y + 8, 6, 4, '#ffd479'); R(g, x + w - 10, y + 8, 6, 1, '#ffe7a8');
      }
      chairBack(g, x + (w >> 1) - 5, y + h - 11, P.var === 'nayla' ? '#5a2f3a' : '#2d3b4f');
      if (P.var === 'nayla') { R(g, x + w - 7, y + h - 13, 6, 8, '#7a3b4a'); R(g, x + w - 7, y + h - 13, 6, 1, '#9a4b5d'); R(g, x + w - 5, y + h - 15, 2, 2, '#7a3b4a'); }
    },
    desk: function (g, x, y, w, h, P, S, t) {
      deskBase(g, x, y + 4, w, 16, P.top || '#7a5636', P.front || '#5a3e26');
      // barang di meja
      R(g, x + 4, y + 6, 8, 6, '#ece6d4'); R(g, x + 5, y + 7, 6, 1, '#b9b2a0'); R(g, x + 5, y + 9, 5, 1, '#b9b2a0');
      if (P.var !== 'tidy') { R(g, x + 14, y + 5, 7, 5, '#e4ddc9'); R(g, x + 15, y + 6, 5, 1, '#c9a24a'); }
      R(g, x + w - 8, y + 6, 4, 5, P.mug || '#b8463a'); R(g, x + w - 4, y + 7, 1, 2, P.mug || '#b8463a');
      if (P.var === 'laptop') {
        R(g, x + (w >> 1) - 8, y - 1, 16, 9, '#1b1f27');
        R(g, x + (w >> 1) - 7, y, 14, 7, P.st.on === false ? '#0c0f14' : '#2a5a86');
        g.globalAlpha = 0.5 + 0.2 * Math.sin(t * 2); R(g, x + (w >> 1) - 5, y + 2, 9, 1, '#a9d4f5'); g.globalAlpha = 1;
        R(g, x + (w >> 1) - 9, y + 8, 18, 3, '#2c313b');
      }
      if (P.var === 'frame') { R(g, x + (w >> 1) - 3, y - 2, 7, 9, '#2c2218'); R(g, x + (w >> 1) - 2, y - 1, 5, 6, '#7f9bb5'); }
      chairBack(g, x + (w >> 1) - 5, y + h - 11, P.chair || '#3a2e24');
    },
    exec_desk: function (g, x, y, w, h, P, S, t) {
      deskBase(g, x, y + 4, w, 18, '#4a2f22', '#33201a');
      monitor(g, x + 6, y - 4, 20, 12, true, t, '#2a3f5f');
      R(g, x + w - 18, y + 8, 12, 3, '#d8c27a'); R(g, x + w - 17, y + 9, 10, 1, '#5a4a20');
      R(g, x + 30, y + 8, 10, 6, '#e8e2d0');
      chairBack(g, x + (w >> 1) - 5, y + h - 10, '#1e1e24');
    },
    whiteboard: function (g, x, y, w, h, P) {
      var by = y + 6, bh = h - 10;
      R(g, x, by, w, bh, '#7c8796'); R(g, x + 2, by + 2, w - 4, bh - 5, '#e1e7ee');
      R(g, x + 2, by + 2, w - 4, 1, '#f3f6f9');
      var lines = P.lines || ['F(G(X))', 'Y = 3X+7'];
      for (var i = 0; i < lines.length; i++) text(g, lines[i], x + 5, by + 5 + i * 7, 1, i === 0 ? '#2b5fa5' : '#4a5566');
      R(g, x + 3, by + bh - 3, w - 6, 2, '#a7b2c0');
      R(g, x + 8, by + bh - 4, 5, 1, '#c0392b'); R(g, x + 15, by + bh - 4, 5, 1, '#2b5fa5');
    },
    window: function (g, x, y, w, h, P, S, t) {
      var wy = y + 6, wh = h - 12;
      R(g, x, wy, w, wh, '#2a2219');
      var sky = (S && S.sky) || 'night';
      var top = sky === 'dusk' ? '#c9774a' : (sky === 'dawn' ? '#9fb7d4' : '#0f1a2c');
      var bot = sky === 'dusk' ? '#6b3b3a' : (sky === 'dawn' ? '#e8c9a0' : '#1a2840');
      R(g, x + 2, wy + 2, w - 4, (wh - 4) >> 1, top);
      R(g, x + 2, wy + 2 + ((wh - 4) >> 1), w - 4, (wh - 4) - ((wh - 4) >> 1), bot);
      if (sky === 'night') {
        for (var i = 0; i < 6; i++) {
          var rx = x + 3 + ((i * 7 + (t * 40 | 0)) % (w - 6));
          var ry = wy + 3 + ((i * 11 + (t * 90 | 0)) % (wh - 7));
          R(g, rx, ry, 1, 3, 'rgba(160,190,230,.45)');
        }
      }
      R(g, x + (w >> 1) - 1, wy, 2, wh, '#2a2219'); R(g, x, wy + (wh >> 1), w, 1, '#2a2219');
      R(g, x - 1, wy + wh, w + 2, 2, '#4a3a2a');
    },
    poster: function (g, x, y, w, h, P) {
      var px = x + 3, py = y + 4, pw = w - 6, ph = h - 10;
      R(g, px, py, pw, ph, P.col || '#23436b'); R(g, px + 2, py + 2, pw - 4, 6, '#f2b544');
      R(g, px + 2, py + 10, pw - 4, 1, '#d8dde4'); R(g, px + 2, py + 13, pw - 7, 1, '#d8dde4');
      R(g, px + (pw >> 1) - 3, py + ph - 9, 6, 6, '#5a93d6');
      R(g, px, py, pw, 1, 'rgba(255,255,255,.25)');
    },
    calendar: function (g, x, y, w, h) {
      var px = x + 5, py = y + 5;
      R(g, px, py, w - 10, h - 11, '#ece6d6'); R(g, px, py, w - 10, 4, '#b8352a');
      for (var i = 0; i < 4; i++) for (var j = 0; j < 3; j++) R(g, px + 2 + i * 5, py + 6 + j * 4, 3, 2, '#9a958a');
      R(g, px + 11, py + 9, 5, 4, 'rgba(184,53,42,.0)');
      R(g, px + 11, py + 9, 5, 1, '#d8352a'); R(g, px + 11, py + 12, 5, 1, '#d8352a'); R(g, px + 11, py + 9, 1, 4, '#d8352a'); R(g, px + 15, py + 9, 1, 4, '#d8352a');
    },
    corkboard: function (g, x, y, w, h) {
      var py = y + 5, ph = h - 10;
      R(g, x + 1, py, w - 2, ph, '#4a3420'); R(g, x + 3, py + 2, w - 6, ph - 4, '#9a744a');
      var notes = [[5, 4, 8, 8, '#efe9d8'], [15, 3, 9, 7, '#f2e48a'], [6, 14, 9, 6, '#d6e6f2'], [18, 12, 8, 8, '#f2d0c8']];
      for (var i = 0; i < notes.length; i++) {
        var n = notes[i]; if (n[0] + n[2] > w - 3) continue;
        R(g, x + n[0], py + n[1], n[2], n[3], n[4]); R(g, x + n[0] + n[2] / 2 - 1, py + n[1], 2, 1, '#c0392b');
      }
    },
    noticeboard: function (g, x, y, w, h) {
      R(g, x + 2, y + 4, w - 4, h - 7, '#2f4f3f'); R(g, x + 3, y + 5, w - 6, h - 9, '#3f6b55');
      R(g, x + 5, y + 6, 8, 5, '#efe9d8'); R(g, x + 15, y + 6, 9, 4, '#f2e48a');
    },
    clock_wall: function (g, x, y, w, h, P) {
      var cx = x + (w >> 1), cy = y + (h >> 1);
      R(g, cx - 6, cy - 6, 12, 12, '#1c2531'); R(g, cx - 5, cy - 5, 10, 10, '#e8e0d0');
      R(g, cx, cy - 4, 1, 4, '#1a1410'); R(g, cx, cy, 3, 1, '#1a1410');
    },
    bookshelf: function (g, x, y, w, h, P) {
      R(g, x, y, w, h, '#3a2618'); R(g, x, y, w, 2, '#5a3d27'); R(g, x + w - 2, y, 2, h, '#2a1b11');
      var rows = Math.max(2, Math.floor((h - 4) / 9));
      var rh = (h - 4) / rows;
      var pal = ['#8a3b3b', '#3b5a8a', '#4a7a4a', '#8a7a3b', '#5a3b7a', '#3b7a7a', '#7a4a2a'];
      for (var s = 0; s < rows; s++) {
        var sy = y + 2 + s * rh;
        R(g, x + 2, sy, w - 4, rh - 2, '#21160e');
        var bx = x + 3, bi = s * 3;
        while (bx < x + w - 5) {
          var bw = 2 + (hash(bi, s) % 2);
          var bh = rh - 3 - (hash(s, bi) % 3);
          if (P.gap === s && bi === s * 3 + 2) { bx += bw + 1; bi++; continue; }
          R(g, bx, sy + rh - 2 - bh, bw, bh, pal[(bi + s) % pal.length]);
          R(g, bx, sy + rh - 2 - bh, bw, 1, 'rgba(255,255,255,.18)');
          bx += bw + 1; bi++;
        }
        R(g, x + 1, sy + rh - 2, w - 2, 2, '#4a3220');
      }
    },
    printer: function (g, x, y, w, h) {
      deskBase(g, x, y + 10, w, h - 10, '#6d5034', '#4e3824');
      R(g, x + 4, y + 2, w - 8, 11, '#c9ced6'); R(g, x + 4, y + 2, w - 8, 2, '#e4e8ee');
      R(g, x + 6, y + 6, w - 12, 2, '#2a2e36'); R(g, x + 7, y, w - 14, 3, '#f2f2f0');
      R(g, x + w - 9, y + 4, 2, 1, '#46c98b');
    },
    plant: function (g, x, y, w, h, P) {
      var sx = (P.st.shift || 0);
      var pw = 12, ph = 9;
      var px = x + ((w - pw) >> 1), py = y + h - ph;
      if (sx > 4) {
        R(g, px, py + ph - 4, pw, 4, 'rgba(60,40,24,.6)');
        if (!P.st.keyTaken) { R(g, px + 3, py + ph - 5, 5, 2, '#d8ac33'); R(g, px + 7, py + ph - 7, 3, 4, '#d8ac33'); R(g, px + 8, py + ph - 6, 1, 2, '#3a2a10'); R(g, px + 1, py + ph - 3, 4, 2, '#efe9d8'); }
      }
      px += sx;
      R(g, px - 1, y + h - 2, pw + 2, 2, 'rgba(0,0,0,.35)');
      R(g, px, py, pw, 2, '#8d6446'); R(g, px + 1, py + 2, pw - 2, ph - 3, '#71492f'); R(g, px + pw - 3, py + 2, 2, ph - 3, '#573722');
      R(g, px + 1, py, pw - 2, 1, '#3a2716');
      var ly = y, lh = py - y;
      R(g, px - 1, ly + 4, pw + 2, lh - 3, '#21502f'); R(g, px, ly + 1, pw, lh - 4, '#2f6b3f');
      R(g, px + 2, ly, 5, lh - 6, '#3d8450'); R(g, px + 7, ly + 3, 4, lh - 7, '#4a955b');
      R(g, px + 4, ly - 2, 2, 3, '#5aa066'); R(g, px + 1, ly + 7, 2, 2, '#4a955b'); R(g, px + 9, ly + 9, 2, 2, '#3d8450');
    },
    dispenser: function (g, x, y, w, h) {
      var bx = x + 2, bw = w - 4;
      R(g, bx + 1, y, bw - 2, 11, '#5a93d6'); R(g, bx + 2, y + 1, 2, 9, '#9cc6f2'); R(g, bx + 3, y - 2, bw - 6, 2, '#3f6fa8');
      R(g, bx, y + 11, bw, h - 12, '#cdd5df'); R(g, bx, y + 11, bw, 1, '#eef2f7'); R(g, bx + bw - 2, y + 12, 2, h - 14, '#9aa6b4');
      R(g, bx + 2, y + 15, bw - 5, 5, '#3a4756'); R(g, bx + 3, y + 21, 2, 2, '#c0392b'); R(g, bx + 7, y + 21, 2, 2, '#5a93d6');
      R(g, bx, y + h - 2, bw, 2, 'rgba(0,0,0,.35)');
    },
    bin: function (g, x, y, w, h, P) {
      var bw = 10, bx = x + ((w - bw) >> 1), by = y + h - 12;
      R(g, bx, by + 2, bw, 10, P.col || '#2e5a44'); R(g, bx + 1, by + 2, 2, 9, shade(P.col || '#2e5a44', 1.3)); R(g, bx + bw - 2, by + 2, 2, 10, shade(P.col || '#2e5a44', 0.7));
      R(g, bx - 1, by, bw + 2, 3, shade(P.col || '#2e5a44', 1.2)); R(g, bx + 6, by - 2, 3, 3, '#e8e2d0');
      R(g, bx - 1, y + h - 1, bw + 2, 1, 'rgba(0,0,0,.35)');
    },
    lockers: function (g, x, y, w, h, P) {
      var n = Math.max(1, Math.round(w / 8));
      var lw = w / n;
      for (var i = 0; i < n; i++) {
        var lx = x + i * lw;
        R(g, lx, y, lw - 1, h, P.col || '#3d5a7a'); R(g, lx, y, lw - 1, 1, shade(P.col || '#3d5a7a', 1.35));
        R(g, lx + 1, y + 3, lw - 3, 1, shade(P.col || '#3d5a7a', 0.7)); R(g, lx + 1, y + 5, lw - 3, 1, shade(P.col || '#3d5a7a', 0.7));
        R(g, lx + lw - 3, y + (h >> 1), 1, 3, '#c9ced6');
        R(g, lx + 1, y + h - 5, lw - 3, 2, '#e8e2d0');
      }
      R(g, x, y + h - 1, w, 1, 'rgba(0,0,0,.4)');
    },
    cabinet: function (g, x, y, w, h, P) {
      var col = P.col || '#4a5a6e';
      R(g, x, y, w, h, col); R(g, x, y, w, 2, shade(col, 1.3)); R(g, x + w - 2, y, 2, h, shade(col, 0.7));
      var n = Math.max(2, Math.floor((h - 4) / 8));
      var dh = (h - 4) / n;
      for (var i = 0; i < n; i++) {
        var sy = y + 3 + i * dh;
        R(g, x + 2, sy, w - 5, dh - 2, shade(col, 0.88)); R(g, x + 2, sy, w - 5, 1, shade(col, 1.15));
        R(g, x + (w >> 1) - 3, sy + (dh >> 1) - 1, 6, 2, '#c9ced6');
      }
      if (P.st.open) { R(g, x + 2, y + 3, w - 5, dh - 2, '#1a1e24'); R(g, x + 4, y + 4, w - 9, 3, P.inside || '#3f6fa8'); }
      R(g, x, y + h - 1, w, 1, 'rgba(0,0,0,.4)');
    },
    safe: function (g, x, y, w, h, P) {
      R(g, x, y, w, h, '#22282f'); R(g, x + 1, y + 1, w - 2, h - 3, '#38414c'); R(g, x + 1, y + 1, w - 2, 1, '#55606e');
      if (P.st.open) {
        R(g, x + 3, y + 3, w - 6, h - 7, '#0e1115'); R(g, x + 5, y + h - 9, 10, 4, '#3f6fa8'); R(g, x + w - 5, y + 3, 3, h - 7, '#55606e');
      } else {
        var cx = x + (w >> 1) - 1, cy = y + (h >> 1) - 1;
        R(g, cx - 5, cy - 5, 10, 10, '#8f9aa6'); R(g, cx - 4, cy - 4, 8, 8, '#c9d3de'); R(g, cx - 1, cy - 4, 2, 3, '#22282f');
        R(g, x + w - 6, cy - 4, 2, 9, '#c9d3de');
        R(g, x + 4, y + 4, 8, 3, '#1b5e3a'); text(g, '----', x + 4, y + 4, 1, '#46c98b');
      }
      R(g, x, y + h - 1, w, 1, 'rgba(0,0,0,.45)');
    },
    toolshelf: function (g, x, y, w, h) {
      R(g, x, y, w, h, '#4a4f57'); R(g, x + 1, y + 1, w - 2, h - 2, '#2a2e35');
      for (var s = 0; s < 3; s++) {
        var sy = y + 2 + s * ((h - 4) / 3);
        R(g, x + 1, sy + ((h - 4) / 3) - 2, w - 2, 2, '#6a707a');
        R(g, x + 3, sy + 2, 6, 5, s === 0 ? '#c0392b' : '#d8ac33'); R(g, x + 11, sy + 3, 8, 4, '#5a93d6'); R(g, x + w - 8, sy + 1, 4, 6, '#8a8f99');
      }
    },
    box: function (g, x, y, w, h, P) {
      var n = P.stack || 1;
      for (var i = 0; i < n; i++) {
        var by = y + h - 11 - i * 8, bx = x + 1 + (i % 2) * 2, bw = w - 4;
        R(g, bx, by + 4, bw, 7, '#8a6a45'); R(g, bx, by, bw, 5, '#a8875c'); R(g, bx, by, bw, 1, '#c0a074');
        R(g, bx + (bw >> 1) - 2, by, 4, 5, '#c9b48a'); R(g, bx + 2, by + 6, 5, 2, '#5b4630');
      }
      R(g, x + 1, y + h - 1, w - 2, 1, 'rgba(0,0,0,.35)');
    },
    shelf_store: function (g, x, y, w, h) {
      R(g, x, y, w, h, '#5a5f66'); R(g, x + 1, y + 1, w - 2, h - 2, '#33373d');
      var cols = ['#3f6fa8', '#c0392b', '#46a06b', '#d8ac33', '#e8e2d0'];
      for (var s = 0; s < 3; s++) {
        var sy = y + 2 + s * ((h - 4) / 3), sh = (h - 4) / 3;
        R(g, x + 1, sy + sh - 2, w - 2, 2, '#7a8089');
        for (var i = 0; i < 4; i++) R(g, x + 3 + i * ((w - 6) / 4), sy + sh - 8, 4, 6, cols[(s + i) % cols.length]);
      }
    },
    mop: function (g, x, y, w, h) {
      R(g, x + 3, y + h - 8, 10, 7, '#3f6fa8'); R(g, x + 3, y + h - 8, 10, 1, '#5a93d6'); R(g, x + 4, y + h - 7, 8, 2, '#1e3550');
      R(g, x + 9, y, 1, h - 6, '#c9a26a'); R(g, x + 6, y + h - 10, 7, 3, '#d8d0c0');
    },
    bench: function (g, x, y, w, h, P) {
      R(g, x, y + 4, w, 5, '#7a5636'); R(g, x, y + 4, w, 1, '#9a7048'); R(g, x, y + 9, w, 2, '#4e3824');
      R(g, x + 2, y + 11, 2, 4, '#2a2e36'); R(g, x + w - 4, y + 11, 2, 4, '#2a2e36');
      if (P.var === 'umbrella') { R(g, x + w - 6, y - 6, 2, 14, '#1d2a44'); R(g, x + w - 8, y - 8, 6, 3, '#1d2a44'); R(g, x + w - 7, y + 8, 4, 1, 'rgba(120,170,220,.5)'); }
    },
    cctv: function (g, x, y, w, h, P, S, t) {
      R(g, x + 6, y + 2, 2, 4, '#2a2e36'); R(g, x + 3, y + 5, 10, 5, '#c9ced6'); R(g, x + 3, y + 5, 10, 1, '#e8ecf2');
      R(g, x + 11, y + 6, 3, 3, '#1b1f26'); if ((t * 2 | 0) % 2) R(g, x + 4, y + 6, 1, 1, '#e8564a');
    },
    ext_wall: function (g, x, y, w, h, P) {
      if (P.st.taken) { R(g, x + 5, y + 4, 6, 1, '#55606e'); R(g, x + 5, y + 12, 6, 1, '#55606e'); return; }
      R(g, x + 5, y + 3, 6, 11, '#b8352a'); R(g, x + 6, y + 3, 2, 10, '#d8574a'); R(g, x + 5, y + 1, 4, 2, '#1b1f26');
      R(g, x + 10, y + 2, 3, 2, '#1b1f26'); R(g, x + 6, y + 7, 4, 3, '#e8e2d0');
    },
    counter: function (g, x, y, w, h, P) {
      R(g, x, y, w, 7, '#c9ced6'); R(g, x, y, w, 1, '#eef2f7');
      R(g, x, y + 7, w, h - 7, '#6d5034'); R(g, x, y + 7, w, 1, '#4e3824');
      for (var i = 1; i < 4; i++) R(g, x + i * (w / 4), y + 8, 1, h - 9, '#4e3824');
      R(g, x + 6, y + 1, 14, 5, '#8f9aa6'); R(g, x + 7, y + 2, 12, 3, '#5a6676'); R(g, x + 12, y - 3, 2, 4, '#c9ced6');
      R(g, x + w - 16, y - 4, 8, 5, '#2a2e36'); R(g, x + w - 15, y - 3, 6, 2, '#46c98b');
    },
    fridge: function (g, x, y, w, h) {
      R(g, x + 1, y, w - 2, h, '#dfe5ec'); R(g, x + 1, y, w - 2, 1, '#f5f8fb'); R(g, x + w - 3, y, 2, h, '#aeb8c4');
      R(g, x + 1, y + 10, w - 2, 1, '#8f9aa6'); R(g, x + 3, y + 4, 1, 4, '#8f9aa6'); R(g, x + 3, y + 13, 1, 6, '#8f9aa6');
      R(g, x + 6, y + 3, 4, 3, '#f2b544');
    },
    dishrack: function (g, x, y, w, h) {
      R(g, x + 1, y + 4, w - 2, h - 5, '#8f9aa6');
      for (var i = 0; i < 5; i++) R(g, x + 3 + i * 5, y, 3, 7, i % 2 ? '#e8e2d0' : '#c9d6e2');
    },
    coffee_table: function (g, x, y, w, h, P) {
      deskBase(g, x, y + 2, w, h - 2, '#8a6a45', '#5e4730');
      R(g, x + 4, y + 4, 14, 6, '#c9ced6'); R(g, x + 4, y + 4, 14, 1, '#e8ecf2');
      R(g, x + 6, y + 3, 4, 4, '#f2efe9'); R(g, x + 7, y + 3, 2, 1, '#4a2a18');
      R(g, x + 12, y + 3, 4, 4, '#f2efe9'); R(g, x + 13, y + 3, 2, 1, '#4a2a18');
      R(g, x + w - 8, y + 2, 5, 7, '#3a2a1c'); R(g, x + w - 7, y + 1, 3, 1, '#2a1c12');
    },
    sofa: function (g, x, y, w, h, P) {
      var col = P.col || '#5a3b4a';
      R(g, x, y, w, 6, shade(col, 0.85)); R(g, x, y, w, 1, shade(col, 1.2));
      R(g, x, y + 6, w, h - 8, col); R(g, x + 1, y + 6, w - 2, 1, shade(col, 1.25));
      R(g, x, y + 2, 3, h - 4, shade(col, 0.7)); R(g, x + w - 3, y + 2, 3, h - 4, shade(col, 0.7));
      for (var i = 1; i < Math.round(w / 14); i++) R(g, x + i * (w / Math.round(w / 14)), y + 7, 1, h - 10, shade(col, 0.75));
      R(g, x, y + h - 2, w, 2, 'rgba(0,0,0,.35)');
    },
    meeting_table: function (g, x, y, w, h, P) {
      // kursi di atas & bawah
      for (var i = 0; i < Math.floor(w / 16); i++) {
        R(g, x + 4 + i * 16, y, 9, 4, '#2d3b4f'); R(g, x + 4 + i * 16, y, 9, 1, '#3d5169');
        R(g, x + 4 + i * 16, y + h - 4, 9, 4, '#2d3b4f');
      }
      R(g, x + 1, y + 4, w - 2, h - 10, '#6d4a2e'); R(g, x + 1, y + 4, w - 2, 1, '#8a6240');
      R(g, x + 1, y + h - 6, w - 2, 2, '#4e3420');
      R(g, x + 10, y + 7, 9, 7, '#efe9d8'); R(g, x + 11, y + 8, 7, 1, '#6b7280'); R(g, x + 11, y + 10, 6, 1, '#6b7280'); R(g, x + 11, y + 12, 5, 1, '#2b5fa5');
      R(g, x + 30, y + 8, 6, 4, '#efe9d8'); R(g, x + 48, y + 9, 4, 4, '#f2efe9');
    },
    trophy: function (g, x, y, w, h) {
      R(g, x, y, w, h, '#3a2618'); R(g, x + 2, y + 2, w - 4, h - 4, '#1e2a36');
      g.globalAlpha = 0.25; R(g, x + 3, y + 3, 3, h - 6, '#cfe6ff'); g.globalAlpha = 1;
      for (var s = 0; s < 2; s++) {
        var sy = y + 4 + s * ((h - 6) / 2);
        R(g, x + 2, sy + (h - 6) / 2 - 2, w - 4, 1, '#5a4a36');
        R(g, x + 6, sy + 2, 4, 5, '#e0b84a'); R(g, x + 7, sy + 7, 2, 2, '#8a6620');
        R(g, x + 16, sy + 3, 4, 4, '#c9ced6'); R(g, x + 17, sy + 7, 2, 2, '#6a707a');
      }
    },
    coatrack: function (g, x, y, w, h, P) {
      R(g, x + 7, y + 2, 2, h - 4, '#4a3220'); R(g, x + 4, y + h - 3, 8, 2, '#4a3220'); R(g, x + 5, y + 1, 6, 2, '#4a3220');
      R(g, x + 3, y + 4, 10, 12, P.col || '#5a5f6a'); R(g, x + 3, y + 4, 10, 1, shade(P.col || '#5a5f6a', 1.3)); R(g, x + 7, y + 4, 2, 10, shade(P.col || '#5a5f6a', 0.7));
    },
    desk_clock: function (g, x, y, w, h, P, S, t) {
      // jam meja digital kecil yang jatuh miring di lantai
      R(g, x + 4, y + 9, 9, 5, '#1d2027'); R(g, x + 5, y + 10, 7, 3, '#2a0d0d');
      var on = (t * 1.5 | 0) % 2;
      R(g, x + 6, y + 11, 1, 1, '#ff5a4a'); R(g, x + 7, y + 11, 1, 1, '#ff5a4a'); R(g, x + 9, y + 11, 1, 1, '#ff5a4a'); R(g, x + 10, y + 11, 1, 1, '#ff5a4a');
      if (on) R(g, x + 8, y + 11, 1, 1, '#ff5a4a');
      R(g, x + 3, y + 14, 11, 1, 'rgba(0,0,0,.45)'); R(g, x + 12, y + 13, 2, 1, '#3a3d44');
    },
    rack: function (g, x, y, w, h, P, S, t) {
      var burnt = P.var === 'burnt' || (P.st && P.st.burnt);
      R(g, x, y, w, h, '#16191e'); R(g, x + 1, y + 1, w - 2, h - 2, burnt ? '#1e1b19' : '#23272e');
      R(g, x, y, w, 1, '#3a404a');
      var units = Math.floor((h - 4) / 4);
      var powered = !S || S.power !== false;
      for (var i = 0; i < units; i++) {
        var uy = y + 2 + i * 4;
        R(g, x + 2, uy, w - 4, 3, burnt ? '#2a2420' : '#30353e'); R(g, x + 2, uy, w - 4, 1, burnt ? '#332a24' : '#3a404a');
        if (powered && !burnt) {
          var on = ((t * 3 + i * 1.7 + x) | 0) % 3;
          R(g, x + 4, uy + 1, 1, 1, on ? '#46c98b' : '#1d4a32');
          R(g, x + 6, uy + 1, 1, 1, on === 2 ? '#f2b544' : '#4a3a14');
        }
      }
      if (burnt) { g.globalAlpha = 0.55; R(g, x + 2, y + 2, w - 4, h >> 1, '#0a0908'); g.globalAlpha = 1; }
      if (P.tag) text(g, P.tag, x + (w >> 1) - 1, y + h - 6, 1, '#8a99ad');
      if (P.reader) {
        var ok = P.st.open;
        R(g, x + w - 6, y + (h >> 1) - 2, 4, 6, '#0e1115');
        R(g, x + w - 5, y + (h >> 1) - 1, 2, 1, powered ? (ok ? '#46c98b' : ((t * 2 | 0) % 2 ? '#e8564a' : '#5a1f1a')) : '#222');
      }
    },
    terminal: function (g, x, y, w, h, P, S, t) {
      var on = P.needPower ? (S && S.power) : true;
      deskBase(g, x, y + 8, w, h - 8, '#3a3f48', '#262a31');
      var n = Math.max(1, Math.floor(w / 16));
      for (var i = 0; i < n; i++) monitor(g, x + 3 + i * ((w - 6) / n), y - 2, (w - 6) / n - 2, 10, on, t + i, P.screen || '#1f4a3a');
      R(g, x + 6, y + 10, w - 12, 3, '#14171d');
      if (P.slot) { R(g, x + w - 10, y + 12, 7, 3, '#0e1115'); R(g, x + w - 9, y + 13, 5, 1, P.st.loaded ? '#46c98b' : '#55606e'); }
    },
    cooling: function (g, x, y, w, h, P, S, t) {
      R(g, x, y, w, h, '#c3ccd6'); R(g, x, y, w, 2, '#e4e9ef'); R(g, x + w - 3, y, 3, h, '#8f9aa6');
      for (var i = 0; i < 2; i++) {
        var fy = y + 4 + i * ((h - 8) / 2);
        R(g, x + 4, fy, w - 10, (h - 12) / 2, '#2a2f37');
        var a = (S && S.power) ? t * 8 : 0;
        R(g, x + 4 + (w - 10) / 2 - 1, fy + 1 + Math.abs(Math.sin(a)) * 2, 2, (h - 12) / 2 - 3, '#4a515c');
      }
      R(g, x + 3, y + h - 4, w - 6, 2, '#1a1e24');
    },
    panel_elec: function (g, x, y, w, h, P, S) {
      R(g, x, y, w, h, '#8a8f78'); R(g, x, y, w, 2, '#a6ab92'); R(g, x + w - 2, y, 2, h, '#6a6f5a');
      R(g, x + 3, y + 4, w - 7, h - 8, '#2a2d26');
      var lit = S && S.power;
      for (var i = 0; i < 5; i++) {
        var on = P.st.sw ? P.st.sw[i] : lit;
        R(g, x + 5 + i * 5, y + 7, 3, 7, '#14160f'); R(g, x + 5 + i * 5, on ? y + 7 : y + 11, 3, 3, on ? '#46c98b' : '#e8564a');
      }
      R(g, x + 4, y + h - 7, w - 9, 2, '#d8ac33'); R(g, x + 4, y + h - 7, 3, 2, '#1a1a1a'); R(g, x + 10, y + h - 7, 3, 2, '#1a1a1a');
      R(g, x + w - 8, y - 3, 5, 3, lit ? '#46c98b' : '#5a1f1a');
    },
    panel_alarm: function (g, x, y, w, h, P) {
      R(g, x + 2, y + 2, w - 4, h - 5, '#9a2a22'); R(g, x + 3, y + 3, w - 6, h - 7, '#c0392b');
      R(g, x + 4, y + 4, w - 8, 4, '#2a0d0d');
      R(g, x + 5, y + 9, 2, 3, '#f2b544'); R(g, x + 9, y + 9, 2, 3, '#5a93d6'); R(g, x + 13, y + 9, 2, 3, '#46c98b');
      if (P.st.open) { R(g, x + 17, y + 9, 4, 1, '#f2b544'); R(g, x + 22, y + 10, 3, 1, '#f2b544'); }
    },
    ups: function (g, x, y, w, h, P, S) {
      R(g, x, y, w, h, '#2b3038'); R(g, x, y, w, 2, '#3e4550');
      for (var i = 0; i < 3; i++) { R(g, x + 3 + i * ((w - 6) / 3), y + 4, (w - 6) / 3 - 2, h - 8, '#1d2128'); R(g, x + 5 + i * ((w - 6) / 3), y + 6, 4, 2, (S && S.power) ? '#46c98b' : '#f2b544'); }
    },
    jerrycan: function (g, x, y, w, h) {
      R(g, x + 3, y + 4, 10, 11, '#b8352a'); R(g, x + 4, y + 4, 2, 10, '#d8574a'); R(g, x + 3, y + 2, 4, 2, '#1b1f26');
      R(g, x + 8, y + 2, 4, 3, '#8a2a20'); R(g, x + 5, y + 8, 6, 3, '#e8e2d0');
      R(g, x + 2, y + 15, 12, 1, 'rgba(0,0,0,.4)');
    },
    chair_jacket: function (g, x, y, w, h, P) {
      chairBack(g, x + 3, y + 3, '#2d3b4f');
      R(g, x + 2, y + 1, 12, 8, '#6b3fa0'); R(g, x + 2, y + 1, 12, 1, '#8a5cc0'); R(g, x + 7, y + 1, 2, 8, '#4a2a72');
      R(g, x + 3, y + 9, 3, 4, '#6b3fa0'); R(g, x + 10, y + 9, 3, 4, '#6b3fa0');
    },
    monitor_wall: function (g, x, y, w, h, P, S, t) {
      var n = Math.floor(w / 12);
      for (var i = 0; i < n; i++) monitor(g, x + 2 + i * 12, y + 3, 10, 8, S && S.power, t + i * 0.7, '#20303f');
    },
    stairs_door: function (g, x, y, w, h) {
      R(g, x + 4, y + 6, w - 8, h - 6, '#2a2e36'); R(g, x + 5, y + 7, w - 10, h - 7, '#4a5a6e');
      R(g, x + 6, y + 2, w - 12, 4, '#1b5e3a'); text(g, 'EXIT', x + (w >> 1) - 7, y + 2, 1, '#9ff0c0');
      R(g, x + w - 9, y + 18, 2, 3, '#c9ced6');
    },
    fire_floor: function (g, x, y, w, h, P, S, t) {
      var k = P.st.fire == null ? 1 : P.st.fire;
      // bekas lingkaran bahan bakar
      R(g, x + 1, y + 3, w - 2, h - 5, 'rgba(10,8,6,.7)');
      R(g, x + 3, y + 2, w - 6, h - 3, 'rgba(20,14,10,.55)');
      if (k < 1) {
        g.globalAlpha = 0.5 * (1 - k);
        R(g, x + 4, y + 5, w - 8, 1, '#6b5a3a'); R(g, x + 4, y + h - 5, w - 8, 1, '#6b5a3a');
        R(g, x + 3, y + 6, 1, h - 11, '#6b5a3a'); R(g, x + w - 4, y + 6, 1, h - 11, '#6b5a3a');
        g.globalAlpha = 1;
      }
      if (k > 0) { flames(g, x, y - 10, w, h + 8, t, k); smoke(g, x, y - 10, w, t, k); }
    },
    fire_wall: function (g, x, y, w, h, P, S, t) {
      var k = P.st.fire == null ? 1 : P.st.fire;
      g.globalAlpha = 0.7; R(g, x, y + 4, w, h - 4, '#120d0a'); g.globalAlpha = 1;
      if (k > 0) { flames(g, x + 2, y, w - 4, h - 2, t * 1.1, k); smoke(g, x, y, w, t, k); }
    },
    fire_over: function (g, x, y, w, h, P, S, t) {
      var k = P.st.fire == null ? 1 : P.st.fire;
      if (k > 0) { flames(g, x, y - 4, w, h, t * 0.95, k * 0.9); smoke(g, x, y - 4, w, t, k); }
    },
    cable: function (g, x, y, w, h) {
      R(g, x, y + (h >> 1), w, 2, '#15191f'); R(g, x, y + (h >> 1), w, 1, '#2a313b');
      R(g, x + 4, y + 3, 2, (h >> 1) - 2, '#15191f'); R(g, x + w - 6, y + (h >> 1) + 1, 3, 2, '#2a5fa5');
    },
    rug: function (g, x, y, w, h, P) {
      var col = P.col || '#3a4a6a';
      R(g, x, y, w, h, col); R(g, x + 2, y + 2, w - 4, h - 4, shade(col, 1.18)); R(g, x + 4, y + 4, w - 8, h - 8, col);
    },
    ac_wall: function (g, x, y, w, h, P, S, t) {
      R(g, x + 1, y + 5, w - 2, 9, '#dfe5ec'); R(g, x + 1, y + 5, w - 2, 1, '#f5f8fb'); R(g, x + 3, y + 11, w - 6, 2, '#8f9aa6');
      R(g, x + w - 6, y + 7, 2, 1, '#46c98b');
    },
    sign: function (g, x, y, w, h, P) {
      R(g, x + 2, y + 4, w - 4, 8, '#1b2a3a'); R(g, x + 3, y + 5, w - 6, 6, '#24394f');
      text(g, P.text || 'LAB 2', x + (w >> 1) - (textW(P.text || 'LAB 2') >> 1), y + 6, 1, '#cfe6ff');
    },
    sink_mirror: function (g, x, y, w, h) {
      R(g, x + 3, y + 3, w - 6, 9, '#9fb3c6'); R(g, x + 4, y + 4, 3, 7, '#d6e6f2');
    },
    hidden: function () {}
  };

  DS.Art = {
    R: R, shade: shade, makeCanvas: makeCanvas, text: text, textW: textW, FONT: FONT,
    sprite: sprite, drawChar: drawChar, portrait: portrait, drawPortrait: drawPortrait,
    FLOORS: FLOORS, WALLS: WALLS, wallTop: wallTop, wallFace: wallFace, door: door,
    PROPS: PROPS, flames: flames, smoke: smoke, monitor: monitor, chairBack: chairBack, hash: hash
  };
})();
