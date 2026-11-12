/* =========================================================
   DETEKTIF SANDI — scenes.js
   Layar judul, meja pemilihan kasus, pemutar cutscene
   (latar animasi + aktor + dialog bergaya visual novel),
   dan ruang interogasi.
   Semua kanvas berukuran 640x360 (diperbesar 2x ke 1280x720).
   ========================================================= */
(function () {
  'use strict';
  var DS = window.DS = window.DS || {};
  var A = DS.Art, R = A.R, shade = A.shade;
  var W = 640, H = 360;

  function $(id) { return document.getElementById(id); }

  /* ---------------------------------------------------------
     hujan & partikel
     --------------------------------------------------------- */
  var rain = [];
  for (var i = 0; i < 160; i++) rain.push({ x: Math.random() * W, y: Math.random() * H, s: 4 + Math.random() * 4, l: 6 + Math.random() * 8 });
  function drawRain(g, t, alpha) {
    g.globalAlpha = alpha == null ? 0.35 : alpha;
    for (var i = 0; i < rain.length; i++) {
      var d = rain[i];
      var y = (d.y + t * d.s * 60) % (H + 20) - 20;
      var x = (d.x - t * 30 + W * 4) % W;
      R(g, x, y, 1, d.l, '#9fb8d8');
    }
    g.globalAlpha = 1;
  }
  function grad(g, y0, y1, c0, c1) {
    var gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, c0); gr.addColorStop(1, c1);
    g.fillStyle = gr; g.fillRect(0, y0, W, y1 - y0);
  }
  function glow(g, x, y, r, col, a) {
    var gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = a == null ? 1 : a;
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    g.globalAlpha = 1;
  }
  function vignette(g, a) {
    var gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,' + (a == null ? 0.7 : a) + ')');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  function skyline(g, base, col, seed, winCol, t) {
    var x = 0, k = seed;
    while (x < W) {
      k = (k * 9301 + 49297) % 233280;
      var bw = 34 + (k % 50), bh = 60 + (k % 110);
      R(g, x, base - bh, bw, bh, col);
      if (winCol) {
        for (var wy = base - bh + 8; wy < base - 8; wy += 9) {
          for (var wx = x + 5; wx < x + bw - 6; wx += 8) {
            var on = ((wx * 7 + wy * 13 + seed) % 11) < 3;
            if (on) R(g, wx, wy, 3, 4, winCol);
          }
        }
      }
      x += bw + 2;
    }
  }

  /* ---------------------------------------------------------
     LATAR CUTSCENE
     --------------------------------------------------------- */
  var BG = {};

  BG.black = function (g) { R(g, 0, 0, W, H, '#05070b'); };

  BG.gate = function (g, t, shot) {
    var dawn = shot && shot.sky === 'dawn';
    if (dawn) { grad(g, 0, 230, '#3a4a78', '#e8a87a'); }
    else { grad(g, 0, 230, '#05070e', '#16203a'); }
    skyline(g, 230, dawn ? '#3a3550' : '#0b0f1a', 7, dawn ? null : '#e8c66a', t);
    // gedung sekolah
    R(g, 120, 110, 400, 130, dawn ? '#8a7a72' : '#1c2230');
    R(g, 120, 110, 400, 6, dawn ? '#a8968a' : '#2a3242');
    for (var r = 0; r < 3; r++) for (var c = 0; c < 10; c++) {
      var lit = !dawn && ((c * 3 + r * 5) % 7 === 0);
      R(g, 136 + c * 38, 128 + r * 34, 22, 18, lit ? '#e8c66a' : (dawn ? '#5a6a82' : '#101522'));
    }
    R(g, 250, 92, 140, 22, dawn ? '#2a4a3a' : '#132a20');
    A.text(g, 'SMK BINA CIPTA', 262, 98, 2, dawn ? '#e8f0e0' : '#9ad8b0');
    // pagar & gerbang
    R(g, 0, 236, W, 4, '#20242c');
    for (var x = 0; x < W; x += 12) R(g, x, 214, 3, 26, '#272c36');
    R(g, 0, 214, W, 3, '#2c323c');
    R(g, 196, 180, 28, 70, '#3a3f4a'); R(g, 416, 180, 28, 70, '#3a3f4a');
    R(g, 190, 174, 40, 8, '#4a505c'); R(g, 410, 174, 40, 8, '#4a505c');
    // jalan
    R(g, 0, 250, W, 110, dawn ? '#4a4a52' : '#14161c');
    R(g, 0, 250, W, 3, dawn ? '#6a6a72' : '#22252d');
    for (var s = 0; s < 8; s++) R(g, s * 90 + 20, 330, 50, 3, dawn ? '#c9c0a0' : '#3a3a30');
    // lampu jalan
    R(g, 80, 120, 4, 132, '#22262e'); R(g, 80, 118, 30, 4, '#22262e'); R(g, 104, 120, 10, 5, '#d8c890');
    if (!dawn) {
      g.globalAlpha = 0.16; g.fillStyle = '#ffe2a0';
      g.beginPath(); g.moveTo(102, 124); g.lineTo(116, 124); g.lineTo(190, 330); g.lineTo(20, 330); g.closePath(); g.fill();
      g.globalAlpha = 1;
      glow(g, 109, 124, 40, 'rgba(255,226,160,.7)', 0.8);
      // genangan
      g.globalAlpha = 0.22; R(g, 60, 300, 120, 6, '#ffe2a0'); R(g, 360, 320, 160, 5, '#5a7aaa'); g.globalAlpha = 1;
      drawRain(g, t, 0.38);
    } else {
      glow(g, 520, 200, 160, 'rgba(255,210,150,.5)', 0.6);
    }
  };

  BG.secroom = function (g, t) {
    R(g, 0, 0, W, H, '#151a22');
    R(g, 0, 0, W, 250, '#222a36');
    R(g, 0, 246, W, 4, '#2e3746');
    R(g, 0, 250, W, 110, '#1a1e26');
    // bank monitor
    for (var r = 0; r < 2; r++) for (var c = 0; c < 4; c++) {
      var mx = 150 + c * 90, my = 50 + r * 64;
      R(g, mx, my, 80, 54, '#0c0f14');
      R(g, mx + 3, my + 3, 74, 48, '#1a2a2a');
      g.globalAlpha = 0.35 + 0.1 * Math.sin(t * 3 + c + r);
      R(g, mx + 3, my + 3, 74, 48, '#4a7a6a');
      g.globalAlpha = 1;
      R(g, mx + 8, my + 30, 20, 16, '#2a3a3a'); R(g, mx + 40, my + 14, 30, 4, '#3a4a4a');
      A.text(g, 'CAM 0' + (r * 4 + c + 1), mx + 5, my + 5, 1, '#bfe8d0');
    }
    glow(g, 320, 110, 220, 'rgba(120,200,170,.25)', 1);
    // meja
    R(g, 100, 220, 440, 24, '#3a2e24'); R(g, 100, 220, 440, 3, '#5a4632'); R(g, 100, 244, 440, 6, '#241c16');
    R(g, 260, 210, 70, 10, '#22262e'); R(g, 350, 206, 14, 14, '#c0392b');
    // jendela hujan
    R(g, 30, 50, 90, 110, '#0b1220'); R(g, 34, 54, 82, 102, '#101a2e');
    g.save(); g.beginPath(); g.rect(34, 54, 82, 102); g.clip(); drawRain(g, t, 0.5); g.restore();
    R(g, 74, 50, 3, 110, '#222a36');
    vignette(g, 0.6);
  };

  var FIGS = {
    dark: { id: 'figDark', skin: '#7a6658', hair: '#0e0e10', style: 'cap', hat: '#121316', top: '#16181d', pants: '#101216', shoes: '#08080a' },
    mask: { id: 'figMask', skin: '#8a7464', hair: '#141210', style: 'slick', top: '#2a2d35', pants: '#1a1c22', shoes: '#0a0a0c' },
    ratna: null
  };
  BG.cctv = function (g, t, shot, st) {
    var cc = shot.cctv || {};
    R(g, 0, 0, W, H, '#1d241f');
    // koridor perspektif
    g.fillStyle = '#2a332c'; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(470, 120); g.lineTo(170, 120); g.closePath(); g.fill();
    g.fillStyle = '#323d34'; g.beginPath(); g.moveTo(0, 0); g.lineTo(170, 120); g.lineTo(170, 270); g.lineTo(0, H); g.closePath(); g.fill();
    g.fillStyle = '#2c362e'; g.beginPath(); g.moveTo(W, 0); g.lineTo(470, 120); g.lineTo(470, 270); g.lineTo(W, H); g.closePath(); g.fill();
    g.fillStyle = '#3a463c'; g.beginPath(); g.moveTo(0, H); g.lineTo(170, 270); g.lineTo(470, 270); g.lineTo(W, H); g.closePath(); g.fill();
    R(g, 170, 120, 300, 150, '#26302a');
    for (var k = 0; k < 4; k++) { R(g, 190 + k * 70, 126, 40, 3, '#5a6a5c'); }
    // pintu / panel
    if (cc.panel) {
      R(g, 280, 160, 70, 60, '#4a2a26'); R(g, 284, 164, 62, 52, '#6a3a32'); A.text(g, 'ALARM', 296, 170, 1, '#e8d0c0');
      var fs = st.figs || [];
      var open = false; for (var q = 0; q < fs.length; q++) if (fs[q].type === 'panel' && st.time - fs[q].t > 2.2) open = true;
      if (open) R(g, 346, 164, 18, 52, '#3a2420');
    } else {
      R(g, 280, 150, 80, 120, '#1a201b'); R(g, 284, 154, 72, 116, '#3a463c');
      R(g, 344, 210, 6, 6, '#8a9a8a');
      R(g, 290, 132, 60, 14, '#1a201b'); A.text(g, cc.door || 'LAB', 296, 136, 1, '#c8d8c8');
    }
    // figur
    var figs = st.figs || [];
    for (var i = 0; i < figs.length; i++) {
      var f = figs[i], lt = st.time - f.t;
      if (lt < 0) continue;
      var ch = f.who === 'ratna' ? DS.CHARS.ratna : (f.who === 'mask' ? FIGS.mask : FIGS.dark);
      var x, y = 300, sc = 3, a = 1, dir = 'right', fr = ((lt * 6) | 0) % 4;
      if (f.type === 'in') {
        if (lt > 3) continue;
        x = 60 + Math.min(1, lt / 2.4) * 260; y = 300 - Math.min(1, lt / 2.4) * 30; sc = 3 - Math.min(1, lt / 2.4) * 0.6;
        if (lt > 2.4) { a = 1 - (lt - 2.4) / 0.6; dir = 'up'; fr = 0; }
      } else if (f.type === 'out') {
        if (lt > 3.2) continue;
        var p = Math.min(1, lt / 2.6);
        x = 320 + p * 280; y = 270 + p * 34; sc = 2.4 + p * 0.7;
        if (lt < 0.3) a = lt / 0.3;
      } else if (f.type === 'panel') {
        var pp = Math.min(1, lt / 2);
        x = 60 + pp * 254; y = 300 - pp * 50; sc = 3 - pp * 0.6;
        if (pp >= 1) { dir = 'up'; fr = 0; }
      } else continue;
      g.globalAlpha = Math.max(0, a);
      A.drawChar(g, ch, x, y, dir, fr, sc);
      if (f.who === 'mask') { R(g, x - 3 * sc, y - 17 * sc, 7 * sc, 3 * sc, '#0a0a0c'); }
      if (f.carry === 'bag') { R(g, x - 9 * sc, y - 16 * sc, 9 * sc, 9 * sc, '#0e1012'); R(g, x - 9 * sc, y - 16 * sc, 9 * sc, 1 * sc, '#2a2e32'); }
      if (f.carry === 'folder') { R(g, x + 3 * sc, y - 12 * sc, 5 * sc, 6 * sc, '#2a4a8a'); }
      g.globalAlpha = 1;
    }
    // efek kamera
    g.globalAlpha = 0.16; g.fillStyle = '#7fbf9a'; g.fillRect(0, 0, W, H); g.globalAlpha = 1;
    for (var sl = 0; sl < H; sl += 3) { g.globalAlpha = 0.12; R(g, 0, sl, W, 1, '#000'); }
    g.globalAlpha = 1;
    for (var n = 0; n < 60; n++) {
      g.globalAlpha = 0.25;
      R(g, Math.random() * W, Math.random() * H, 2, 1, Math.random() < 0.5 ? '#000' : '#cfe');
    }
    g.globalAlpha = 1;
    if (st.cut) {
      for (var z = 0; z < 2000; z++) { var v = (Math.random() * 255) | 0; R(g, Math.random() * W, Math.random() * H, 3, 2, 'rgb(' + v + ',' + v + ',' + v + ')'); }
      R(g, 220, 160, 200, 40, '#000'); A.text(g, 'NO SIGNAL', 248, 172, 3, '#e8564a');
    }
    vignette(g, 0.75);
    A.text(g, (cc.cam || 'CAM') + ' . ' + (cc.loc || ''), 16, 14, 2, '#e8f0e8');
    A.text(g, st.clock || '--:--:--', W - 16 - A.textW(st.clock || '--:--:--', 2), 14, 2, '#e8f0e8');
    if ((t * 2 | 0) % 2 === 0) { R(g, 16, 34, 8, 8, '#e8564a'); A.text(g, 'REC', 28, 35, 1, '#e8564a'); }
  };

  BG.storage = function (g, t) {
    R(g, 0, 0, W, H, '#0b0d10');
    R(g, 0, 250, W, 110, '#121417');
    for (var s = 0; s < 3; s++) {
      var sx = 330 + s * 100;
      R(g, sx, 80, 80, 170, '#16191d');
      for (var k = 0; k < 4; k++) { R(g, sx, 100 + k * 40, 80, 4, '#22262c'); R(g, sx + 8, 80 + k * 40, 14, 18, '#1c2a3a'); R(g, sx + 40, 84 + k * 40, 20, 14, '#2a1e1a'); }
    }
    // berkas cahaya dari pintu
    R(g, 20, 60, 70, 200, '#3a3f48');
    g.globalAlpha = 0.2; g.fillStyle = '#e8d8a8';
    g.beginPath(); g.moveTo(90, 60); g.lineTo(90, 260); g.lineTo(560, 340); g.lineTo(380, 150); g.closePath(); g.fill();
    g.globalAlpha = 1;
    for (var d = 0; d < 30; d++) {
      var px = 140 + ((d * 53 + t * 8) % 340), py = 120 + ((d * 37 + t * 5) % 160);
      g.globalAlpha = 0.3; R(g, px, py, 1, 1, '#f0e0b0');
    }
    g.globalAlpha = 1;
    R(g, 420, 270, 120, 50, '#3a2e22'); R(g, 420, 270, 120, 4, '#5a4632');
    vignette(g, 0.8);
  };

  // tumpukan kardus di depan Nayla yang duduk (agar badannya tidak terpotong melayang)
  BG.storageFg = function (g) {
    R(g, 352, 252, 62, 56, '#4a3a28'); R(g, 352, 252, 62, 4, '#6a5438'); R(g, 380, 252, 6, 56, '#3a2c1e');
    R(g, 408, 258, 74, 50, '#55422c'); R(g, 408, 258, 74, 4, '#74593a'); R(g, 440, 258, 8, 50, '#3e2f20');
    R(g, 340, 300, 160, 10, 'rgba(0,0,0,.35)');
  };

  BG.hospital = function (g, t) {
    grad(g, 0, 250, '#c8d4de', '#a8b8c8');
    R(g, 0, 240, W, 10, '#8a9aac');
    for (var i = 0; i < 4; i++) { R(g, 40 + i * 160, 100, 70, 140, '#7a92aa'); R(g, 44 + i * 160, 104, 62, 136, '#94aac0'); R(g, 94 + i * 160, 170, 6, 6, '#e0e6ec'); R(g, 52 + i * 160, 116, 46, 26, '#c8e0f0'); }
    for (var j = 0; j < 5; j++) { R(g, 60 + j * 130, 20, 60, 6, '#f8fbff'); glow(g, 90 + j * 130, 26, 60, 'rgba(255,255,255,.5)', 0.5); }
    R(g, 0, 250, W, 110, '#d8dee4');
    g.globalAlpha = 0.25; for (var k = 0; k < 5; k++) R(g, 70 + k * 130, 260, 40, 80, '#ffffff'); g.globalAlpha = 1;
    R(g, 470, 236, 120, 12, '#5a7aa0'); R(g, 476, 248, 6, 20, '#3a4a60'); R(g, 578, 248, 6, 20, '#3a4a60');
    R(g, 540, 70, 70, 20, '#2a8a5a'); A.text(g, 'ICU', 562, 76, 2, '#ffffff');
    vignette(g, 0.35);
  };

  BG.teacher = function (g, t) {
    grad(g, 0, 250, '#5a3a2a', '#7a4a32');
    for (var i = 0; i < 3; i++) {
      R(g, 60 + i * 200, 50, 120, 120, '#2a1a12'); grad2(g, 64 + i * 200, 54, 112, 112, '#f0a060', '#a04a3a');
      R(g, 118 + i * 200, 50, 4, 120, '#2a1a12'); R(g, 60 + i * 200, 108, 120, 4, '#2a1a12');
    }
    g.globalAlpha = 0.18; g.fillStyle = '#ffb070';
    for (var b = 0; b < 3; b++) { g.beginPath(); g.moveTo(64 + b * 200, 166); g.lineTo(176 + b * 200, 166); g.lineTo(240 + b * 200, 300); g.lineTo(100 + b * 200, 300); g.closePath(); g.fill(); }
    g.globalAlpha = 1;
    R(g, 0, 250, W, 110, '#4a3020');
    for (var d = 0; d < 4; d++) { R(g, 30 + d * 160, 240, 120, 18, '#3a2416'); R(g, 30 + d * 160, 240, 120, 3, '#5a3a24'); R(g, 70 + d * 160, 222, 30, 18, '#14171d'); }
    vignette(g, 0.55);
  };
  function grad2(g, x, y, w, h, c0, c1) {
    var gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, c0); gr.addColorStop(1, c1);
    g.fillStyle = gr; g.fillRect(x, y, w, h);
  }

  BG.server = function (g, t) {
    R(g, 0, 0, W, H, '#0a0b0e');
    for (var i = 0; i < 7; i++) {
      var rx = 20 + i * 90;
      R(g, rx, 60, 60, 190, '#131519'); R(g, rx, 60, 60, 4, '#1f2228');
      for (var u = 0; u < 12; u++) { R(g, rx + 6, 70 + u * 14, 48, 9, '#1a1d22'); if ((u + i) % 3 === 0) R(g, rx + 10, 73 + u * 14, 2, 2, '#5a1a1a'); }
    }
    R(g, 0, 250, W, 110, '#101216');
    var f = 0.75 + 0.25 * Math.sin(t * 11) * Math.sin(t * 7.3);
    glow(g, 520, 300, 220 * f, 'rgba(255,110,40,.55)', 1);
    A.flames(g, 450, 250, 150, 70, t, 1.6);
    for (var s = 0; s < 4; s++) { g.globalAlpha = 0.18; R(g, 0, 20 + s * 26 + Math.sin(t + s) * 6, W, 18, '#2a2a30'); }
    g.globalAlpha = 1;
    g.globalAlpha = 0.25 + 0.15 * Math.sin(t * 4); R(g, 0, 0, W, H, '#3a0a08'); g.globalAlpha = 1;
    vignette(g, 0.7);
  };

  BG.interro = function (g, t) {
    R(g, 0, 0, W, H, '#0c0e12');
    R(g, 0, 0, W, 240, '#1a1d24');
    R(g, 160, 50, 320, 120, '#0e1116'); R(g, 166, 56, 308, 108, '#151b24');
    g.globalAlpha = 0.08; R(g, 180, 60, 60, 100, '#cfe6ff'); g.globalAlpha = 1;
    R(g, 0, 240, W, 120, '#14161a');
    var sw = Math.sin(t * 0.8) * 6;
    R(g, 319 + sw * 0.2, 0, 2, 40, '#2a2d34');
    g.globalAlpha = 0.14; g.fillStyle = '#ffe9b0';
    g.beginPath(); g.moveTo(300 + sw, 48); g.lineTo(340 + sw, 48); g.lineTo(520, 360); g.lineTo(120, 360); g.closePath(); g.fill();
    g.globalAlpha = 1;
    R(g, 298 + sw, 38, 44, 12, '#3a3d44'); glow(g, 320 + sw, 52, 80, 'rgba(255,233,176,.6)', 0.7);
  };
  BG.interroFg = function (g) {
    R(g, 250, 226, 300, 20, '#3a2e24'); R(g, 250, 226, 300, 3, '#5a4632'); R(g, 270, 246, 10, 60, '#241c16'); R(g, 520, 246, 10, 60, '#241c16');
    vignette(g, 0.65);
  };

  /* ---------------------------------------------------------
     PEMUTAR CUTSCENE
     --------------------------------------------------------- */
  var cut = { shots: null, i: 0, line: -1, time: 0, typing: 0, done: null, figs: [], clock: '', cutSig: false, cardT: 0, active: false };
  var ccv, cg, elCard, elDlg, elName, elRole, elText, elPort, pg, elNext;

  function initCut() {
    ccv = $('ccv'); cg = ccv.getContext('2d'); cg.imageSmoothingEnabled = false;
    elCard = $('cut-card'); elDlg = $('cut-dlg'); elName = $('cd-name'); elRole = $('cd-role'); elText = $('cd-text');
    elPort = $('cd-portrait'); pg = elPort.getContext('2d'); pg.imageSmoothingEnabled = false; elNext = $('cd-next');
  }

  function typedHtml(html, n) {
    var out = '', count = 0, i = 0;
    while (i < html.length && count < n) {
      var ch = html.charAt(i);
      if (ch === '<') { var j = html.indexOf('>', i); if (j < 0) j = html.length - 1; out += html.slice(i, j + 1); i = j + 1; continue; }
      if (ch === '&') { var e = html.indexOf(';', i); if (e < 0 || e - i > 8) e = i; out += html.slice(i, e + 1); i = e + 1; count++; continue; }
      out += ch; i++; count++;
    }
    return out;
  }
  function visibleLen(html) { return html.replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, 'x').length; }

  function playCut(shots, onDone) {
    cut.shots = shots; cut.i = 0; cut.done = onDone; cut.active = true;
    startShot();
  }
  function curShot() { return cut.shots && cut.shots[cut.i]; }
  function startShot() {
    var s = curShot();
    if (!s) { endCut(); return; }
    cut.time = 0; cut.line = -1; cut.figs = []; cut.clock = ''; cut.cutSig = false; cut.cardT = 0; cut.fired = {};
    elDlg.classList.remove('show');
    if (s.card) {
      elCard.innerHTML = '<div class="cc-k">' + s.card.kicker + '</div><h2>' + s.card.title + '</h2><p>' + (s.card.sub || '') + '</p>';
      elCard.classList.add('show');
      if (DS.sfx) DS.sfx('card');
    } else {
      elCard.classList.remove('show');
      nextLine();
    }
  }
  function nextLine() {
    var s = curShot();
    if (!s) return;
    if (s.card) { cut.i++; startShot(); return; }
    var lines = s.lines || [];
    cut.line++;
    if (cut.line >= lines.length) { cut.i++; startShot(); return; }
    var L = lines[cut.line];
    if (L[3] != null) seekTo(L[3]);
    showLine(L);
  }
  function seekTo(t) {
    cut.time = t;
    // putar ulang event skrip sampai titik ini
    var s = curShot(); var sc = (s.cctv && s.cctv.script) || [];
    cut.figs = []; cut.cutSig = false; cut.fired = {};
    for (var i = 0; i < sc.length; i++) {
      if (sc[i].t <= t + 0.001) fireEvent(sc[i], i);
    }
  }
  function fireEvent(ev, i) {
    cut.fired[i] = true;
    if (ev.clock) { cut.clock = ev.clock; cut.clockBase = clockSec(ev.clock); cut.clockAt = ev.t; }
    if (ev.fig) cut.figs.push({ type: ev.fig, t: ev.t, who: ev.who, carry: ev.carry });
    if (ev.cut) { cut.cutSig = true; if (DS.sfx) DS.sfx('static'); }
  }
  function clockSec(s) { var p = s.split(':'); return (+p[0]) * 3600 + (+p[1]) * 60 + (+p[2] || 0); }
  function fmtClock(sec) {
    sec = Math.floor(sec); var h = Math.floor(sec / 3600) % 24, m = Math.floor(sec / 60) % 60, s = sec % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function showLine(L) {
    var who = L[0], ch = who ? DS.CHARS[who] : null;
    elDlg.classList.add('show');
    elDlg.classList.toggle('narr', !ch);
    if (ch) {
      elName.textContent = ch.name; elRole.textContent = ch.role;
      pg.clearRect(0, 0, 40, 40); pg.drawImage(A.portrait(ch, L[2] || 'neutral'), 0, 0);
    } else { elName.textContent = ''; elRole.textContent = ''; }
    cut.text = L[1]; cut.typing = 0; cut.tlen = visibleLen(L[1]); cut.speaker = who;
    elText.innerHTML = ''; elNext.style.opacity = 0;
  }
  function advanceCut() {
    if (!cut.active) return;
    var s = curShot();
    if (s && s.card) { cut.i++; startShot(); return; }
    if (cut.typing < cut.tlen) { cut.typing = cut.tlen; elText.innerHTML = cut.text; elNext.style.opacity = 1; return; }
    if (DS.sfx) DS.sfx('blip');
    nextLine();
  }
  function skipCut() { if (cut.active) endCut(); }
  function endCut() {
    cut.active = false;
    elDlg.classList.remove('show'); elCard.classList.remove('show');
    var d = cut.done; cut.done = null; cut.shots = null;
    if (d) d();
  }
  function updateCut(dt) {
    if (!cut.active) return;
    var s = curShot(); if (!s) return;
    cut.time += dt;
    if (s.card) {
      cut.cardT += dt;
      if (cut.cardT > 3.4) { cut.i++; startShot(); return; }
    }
    if (s.cctv && s.cctv.script) {
      var sc = s.cctv.script;
      for (var i = 0; i < sc.length; i++) if (!cut.fired[i] && sc[i].t <= cut.time) fireEvent(sc[i], i);
      if (cut.clockBase != null) cut.clock = fmtClock(cut.clockBase + (cut.time - cut.clockAt));
    }
    if (cut.text != null && cut.typing < cut.tlen) {
      var before = Math.floor(cut.typing);
      cut.typing = Math.min(cut.tlen, cut.typing + dt * 52);
      var now = Math.floor(cut.typing);
      if (now !== before) {
        elText.innerHTML = typedHtml(cut.text, now);
        if (DS.sfx && now % 3 === 0) DS.sfx('type');
      }
      if (cut.typing >= cut.tlen) elNext.style.opacity = 1;
    }
    drawCut();
  }
  function drawCut() {
    var s = curShot(); if (!s) return;
    var g = cg, t = cut.time;
    if (s.card) {
      R(g, 0, 0, W, H, '#05070b');
      for (var n = 0; n < 80; n++) { g.globalAlpha = 0.05; R(g, Math.random() * W, Math.random() * H, 2, 2, '#fff'); }
      g.globalAlpha = 1;
      return;
    }
    var bg = BG[s.bg] || BG.black;
    bg(g, performance.now() / 1000, s, { time: t, figs: cut.figs, clock: cut.clock, cut: cut.cutSig });
    drawActors(g, s, t);
    if (BG[s.bg + 'Fg']) BG[s.bg + 'Fg'](g);
  }
  function drawActors(g, s, t) {
    var acts = s.actors || [];
    var order = acts.slice().sort(function (a, b) { return a.y - b.y; });
    for (var i = 0; i < order.length; i++) {
      var a = order[i], ch = DS.CHARS[a.ch];
      if (!ch) continue;
      var x = a.x, walking = false;
      if (a.to != null) {
        var p = Math.min(1, t / (a.dur || 2));
        x = a.x + (a.to - a.x) * (1 - Math.pow(1 - p, 2));
        walking = p < 1;
      }
      var sc = a.s || 4;
      var ay = a.y - 62;              // garis tanah di atas kotak dialog
      var talk = cut.speaker === a.ch && cut.typing < cut.tlen;
      var bob = talk ? Math.round(Math.abs(Math.sin(t * 12)) * 2) : 0;
      var fr = walking ? (((t * 7) | 0) % 4) : 0;
      var dir = walking ? (a.dir || 'right') : (a.face || a.dir || 'down');
      if (a.sit) {
        // di ruang interogasi meja menutupi kaki; di tempat lain (gudang) kardus foreground yang menutupi
        var clipY = s.bg === 'interro' ? ay - 4 * sc : ay + 20 * sc;
        g.save(); g.beginPath(); g.rect(x - 40, 0, 80, clipY); g.clip();
        A.drawChar(g, ch, x, ay + 3 * sc - bob, dir, 0, sc);
        g.restore();
      } else {
        A.drawChar(g, ch, x, ay - bob, dir, fr, sc);
      }
      if (a.umbrella) {
        var ux = x - 2 * sc;
        R(g, ux, ay - 27 * sc, 2, 16 * sc, '#1a1a1e');
        g.fillStyle = '#1d2a44'; g.beginPath();
        g.moveTo(ux - 10 * sc, ay - 25 * sc); g.quadraticCurveTo(ux, ay - 36 * sc, ux + 10 * sc, ay - 25 * sc); g.closePath(); g.fill();
        R(g, ux - 10 * sc, ay - 26 * sc, 20 * sc, 2, '#2a3a5a');
      }
    }
  }

  /* ---------------------------------------------------------
     LAYAR JUDUL
     --------------------------------------------------------- */
  var tcv, tg, flash = 0, flashT = 4;
  function initTitle() { tcv = $('tcv'); tg = tcv.getContext('2d'); tg.imageSmoothingEnabled = false; }
  function drawTitle(dt, t) {
    var g = tg;
    flashT -= dt;
    if (flashT <= 0) { flash = 1; flashT = 6 + Math.random() * 6; if (DS.sfx) DS.sfx('thunder'); }
    flash = Math.max(0, flash - dt * 2.4);
    grad(g, 0, 250, '#04060c', '#121a2e');
    skyline(g, 250, '#0a0e18', 3, '#d8b860', t);
    skyline(g, 262, '#070a12', 11, '#7a90c0', t);
    // gedung sekolah samar di kanan
    R(g, 380, 150, 240, 112, '#0e131e');
    for (var r = 0; r < 3; r++) for (var c = 0; c < 6; c++) R(g, 394 + c * 38, 164 + r * 30, 20, 16, (c === 2 && r === 1) ? '#e8c66a' : '#0a0e16');
    // jalan
    R(g, 0, 262, W, 98, '#0c0e13'); R(g, 0, 262, W, 2, '#1a1e26');
    // lampu jalan
    var LX = 130;
    R(g, 236 + LX, 120, 4, 144, '#1d2028'); R(g, 236 + LX, 118, 34, 4, '#1d2028'); R(g, 262 + LX, 121, 12, 5, '#f0dca0');
    g.globalAlpha = 0.17; g.fillStyle = '#ffe2a0';
    g.beginPath(); g.moveTo(260 + LX, 126); g.lineTo(276 + LX, 126); g.lineTo(360 + LX, 330); g.lineTo(180 + LX, 330); g.closePath(); g.fill();
    g.globalAlpha = 1;
    glow(g, 268 + LX, 126, 46, 'rgba(255,226,160,.75)', 0.85);
    // detektif
    A.drawChar(g, DS.CHARS.arsa, 280 + LX, 322, 'down', 0, 4);
    g.globalAlpha = 0.14; g.save(); g.beginPath(); g.rect(0, 324, W, 40); g.clip(); g.translate(0, 648); g.scale(1, -1); A.drawChar(g, DS.CHARS.arsa, 280 + LX, 322, 'down', 0, 4); g.restore(); g.globalAlpha = 1;
    g.globalAlpha = 0.2; R(g, 200 + LX, 326, 170, 5, '#ffe2a0'); g.globalAlpha = 1;
    drawRain(g, t, 0.42);
    if (flash > 0) { g.globalAlpha = flash * 0.5; R(g, 0, 0, W, H, '#cfe0ff'); g.globalAlpha = 1; }
    vignette(g, 0.6);
  }

  /* ---------------------------------------------------------
     MEJA PEMILIHAN KASUS
     --------------------------------------------------------- */
  var scv, sg;
  function initSelect() { scv = $('scv'); sg = scv.getContext('2d'); sg.imageSmoothingEnabled = false; }
  function drawSelect(dt, t) {
    var g = sg;
    R(g, 0, 0, W, H, '#2a1a10');
    for (var y = 0; y < H; y += 12) {
      R(g, 0, y, W, 12, (y / 12) % 2 ? '#3a2616' : '#36230f');
      R(g, 0, y + 11, W, 1, '#24160c');
      for (var k = 0; k < 6; k++) R(g, ((y * 13 + k * 97) % W), y + 4, 30, 1, '#432c1a');
    }
    // barang di meja
    R(g, 40, 260, 60, 60, '#1a1410'); R(g, 44, 264, 52, 52, '#2a2018'); R(g, 54, 272, 32, 32, '#140c08');
    g.globalAlpha = 0.5; R(g, 60, 278, 20, 6, '#6a4a30'); g.globalAlpha = 1;
    R(g, 560, 40, 50, 70, '#e8e2d0'); R(g, 566, 50, 38, 2, '#9a958a'); R(g, 566, 58, 30, 2, '#9a958a'); R(g, 566, 66, 34, 2, '#9a958a');
    R(g, 520, 290, 90, 8, '#1a1a20'); R(g, 590, 292, 18, 4, '#c0a060');
    // lampu meja
    glow(g, 600, 10, 380, 'rgba(255,200,120,.45)', 1);
    vignette(g, 0.75);
  }

  /* ---------------------------------------------------------
     RUANG INTEROGASI (memilih tersangka)
     --------------------------------------------------------- */
  var icv, ig;
  var SEAT_X = [160, 320, 480];
  function initInterro() { icv = $('icv'); ig = icv.getContext('2d'); ig.imageSmoothingEnabled = false; }
  function drawInterro(t, suspects, hover, mouse, accused) {
    var g = ig;
    R(g, 0, 0, W, H, '#0b0d11');
    R(g, 0, 0, W, 230, '#161920');
    R(g, 0, 226, W, 4, '#20242c');
    R(g, 0, 230, W, 130, '#101216');
    R(g, 120, 40, 400, 100, '#0d1015'); R(g, 126, 46, 388, 88, '#141a23');
    g.globalAlpha = 0.07; R(g, 140, 50, 70, 80, '#cfe6ff'); g.globalAlpha = 1;
    for (var i = 0; i < suspects.length; i++) {
      var s = suspects[i], ch = DS.CHARS[s.ch], x = SEAT_X[i];
      var on = hover === i, gone = accused && accused[s.ch];
      // sandaran kursi + potret besar tersangka
      R(g, x - 52, 120, 104, 150, '#1c1f26'); R(g, x - 52, 120, 104, 4, '#2a2e38');
      g.globalAlpha = gone ? 0.3 : 1;
      var bob = on ? -3 : Math.round(Math.sin(t * 1.3 + i) * 1);
      A.drawPortrait(g, ch, on ? 'worried' : 'neutral', x - 60, 146 + bob, 3);
      g.globalAlpha = 1;
      // borgol
      R(g, x - 14, 258, 28, 6, '#9aa6b4'); R(g, x - 4, 259, 8, 4, '#5a6676');
    }
    // meja panjang
    R(g, 60, 266, 520, 22, '#3a2e24'); R(g, 60, 266, 520, 3, '#5a4632'); R(g, 60, 288, 520, 6, '#241c16');
    // sorot lampu mengikuti mouse
    var mx = mouse.x, my = mouse.y;
    var dark = g.createRadialGradient(mx, my, 30, mx, my, 220);
    dark.addColorStop(0, 'rgba(0,0,0,0)'); dark.addColorStop(1, 'rgba(0,0,0,.72)');
    g.fillStyle = dark; g.fillRect(0, 0, W, H);
    glow(g, mx, my, 70, 'rgba(255,236,190,.22)', 1);
    vignette(g, 0.5);
    // papan nama — digambar setelah sorot & vignette, huruf skala 2 agar tajam
    for (var j = 0; j < suspects.length; j++) {
      var c2 = DS.CHARS[suspects[j].ch], xx = SEAT_X[j];
      var nm = c2.name.toUpperCase();
      var sz = A.textW(nm, 2) + 16 > 152 ? 1 : 2;
      var w2 = A.textW(nm, sz) + 16, h2 = sz * 7 + 10;
      R(g, xx - w2 / 2 - 1, 299, w2 + 2, h2 + 2, '#000000');
      R(g, xx - w2 / 2, 300, w2, h2, hover === j ? '#f2b544' : '#232833');
      A.text(g, nm, Math.round(xx - A.textW(nm, sz) / 2), 305, sz, hover === j ? '#1a1206' : '#eef3f8');
      if (accused && accused[suspects[j].ch]) A.text(g, 'SALAH', Math.round(xx - A.textW('SALAH', 2) / 2), 330, 2, '#ff6a5a');
    }
  }
  function hitSeat(x, y) {
    if (y < 120 || y > 320) return -1;
    for (var i = 0; i < SEAT_X.length; i++) if (Math.abs(x - SEAT_X[i]) < 56) return i;
    return -1;
  }

  DS.Scenes = {
    initCut: initCut, playCut: playCut, updateCut: updateCut, advanceCut: advanceCut, skipCut: skipCut,
    get cutActive() { return cut.active; },
    initTitle: initTitle, drawTitle: drawTitle,
    initSelect: initSelect, drawSelect: drawSelect,
    initInterro: initInterro, drawInterro: drawInterro, hitSeat: hitSeat,
    BG: BG, typedHtml: typedHtml
  };
})();
