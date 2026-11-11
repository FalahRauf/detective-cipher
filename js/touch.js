/* =========================================================
   DETEKTIF SANDI — touch.js
   Kontroler layar sentuh untuk HP / tablet:
   joystick gerak (kiri) + tombol aksi bulat (kanan).

   Mesin game tidak diubah sama sekali: setiap tombol di sini
   hanya mengirim event keyboard yang sama seperti tombol
   fisik (WASD, Shift, E, N, T, H, M, Esc). Jadi main.js
   cukup mendengarkan keydown/keyup seperti biasa.

   Aktif otomatis di perangkat sentuh.
   Paksa tampil: ?pad=1   ·   Paksa mati: ?pad=0
   ========================================================= */
(function () {
  'use strict';

  var q = (location.search.match(/[?&]pad=([01])/) || [])[1];
  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0 ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  if (q === '0' || (!isTouch && q !== '1')) return;
  if (!document.getElementById('stage')) return;

  document.body.classList.add('pad-on');

  /* ---------- gaya (disuntik dari sini, style.css tidak diubah) ----------
     --padc = bagian panggung yang terpotong di atas & bawah (px panggung).
     Dipakai untuk menggeser HUD/dialog ke dalam area yang kelihatan.      */
  var CSS = [
    'body.pad-on{touch-action:manipulation;overscroll-behavior:none;background:#06080c}',
    'body.pad-on #p-keys{display:none!important}',
    /* panggung 1280px tidak boleh dihitung sebagai lebar halaman:
       di HP itu memicu zoom-out Chrome (innerWidth membesar, layar terpotong). */
    'body.pad-on #stage{position:fixed}',

    /* --- safe area: layar lebih lebar dari 16:9 -> panggung di-cover,
           elemen penting digeser masuk sebesar bagian yang terpotong --- */
    'body.pad-on .hud{top:var(--padc,0px)}',
    'body.pad-on .hud-items{top:calc(62px + var(--padc,0px))}',
    'body.pad-on .hud-btns{top:calc(64px + var(--padc,0px))}',
    'body.pad-on .quest{top:calc(104px + var(--padc,0px))}',
    'body.pad-on .banner{top:calc(160px + var(--padc,0px))}',
    'body.pad-on #toast{top:calc(112px + var(--padc,0px))}',
    'body.pad-on .dlg{bottom:calc(26px + var(--padc,0px))}',
    'body.pad-on .prompt{bottom:calc(74px + var(--padc,0px))}',
    'body.pad-on .cut-dlg{bottom:calc(34px + var(--padc,0px))}',
    'body.pad-on .cut-skip{top:calc(22px + var(--padc,0px))}',
    'body.pad-on .title-top{top:calc(64px + var(--padc,0px))}',
    'body.pad-on .title-actions{bottom:calc(90px + var(--padc,0px))}',
    'body.pad-on .title-foot{bottom:calc(20px + var(--padc,0px))}',
    'body.pad-on .select-head{top:calc(38px + var(--padc,0px))}',
    'body.pad-on .case-cards{top:calc(120px + var(--padc,0px));bottom:calc(60px + var(--padc,0px))}',
    'body.pad-on .interro-head{top:calc(26px + var(--padc,0px))}',
    'body.pad-on .interro-back{top:calc(24px + var(--padc,0px))}',
    'body.pad-on .ic-card{bottom:calc(30px + var(--padc,0px))}',
    'body.pad-on .modal-card{max-height:calc(660px - var(--padc,0px)*2)}',
    'body.pad-on .modal-card.notes{height:calc(600px - var(--padc,0px)*2)}',
    'body.pad-on #scr-tool.active{display:flex;flex-direction:column;' +
      'padding-top:calc(26px + var(--padc,0px));padding-bottom:calc(26px + var(--padc,0px))}',
    'body.pad-on .tool-wrap{height:auto;flex:1;min-height:0}',
    'body.pad-on .tool-main{min-height:0}',
    'body.pad-on .tool-side{min-height:0}',

    /* --- kontroler --- */
    '#pad{position:fixed;inset:0;z-index:60;pointer-events:none;display:none;--pb:56px;--js:150px;' +
      'font-family:"Segoe UI",system-ui,-apple-system,sans-serif}',
    '@media (max-height:430px){#pad{--pb:48px;--js:118px}}',
    '@media (max-width:560px){#pad{--pb:50px;--js:136px}#pad-acts .pad-row:first-child{display:grid;grid-template-columns:repeat(3,var(--pb));gap:6px}}',
    '@media (max-width:340px){#pad{--pb:44px;--js:120px}}',
    '#pad *{box-sizing:border-box;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}',
    '.pbtn{pointer-events:auto;touch-action:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;' +
      'background:rgba(10,13,19,.72);border:1px solid rgba(242,181,68,.5);border-radius:50%;color:#e9edf3;' +
      'font:700 16px/1 "Segoe UI",system-ui,sans-serif;letter-spacing:.04em;cursor:pointer;padding:0;' +
      'box-shadow:0 2px 12px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06);' +
      '-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}',
    '.pbtn small{font-size:8px;letter-spacing:.12em;color:#9aa6b8;font-weight:700}',
    '.pbtn.on{background:rgba(242,181,68,.9);color:#1a1206;border-color:#f2b544}',
    '.pbtn.on small{color:#4a3410}',
    '.pbtn.off{opacity:.4}',

    /* joystick */
    '#pad-stick{position:absolute;left:calc(14px + env(safe-area-inset-left));bottom:calc(14px + env(safe-area-inset-bottom));' +
      'width:var(--js);height:var(--js);border-radius:50%;pointer-events:auto;touch-action:none;' +
      'background:radial-gradient(circle at 50% 42%,rgba(22,28,39,.5),rgba(8,10,15,.72));' +
      'border:1px solid rgba(242,181,68,.32);box-shadow:inset 0 0 26px rgba(0,0,0,.65);transition:opacity .25s,border-color .15s}',
    '#pad-stick.on{border-color:rgba(242,181,68,.8)}',
    '#pad-stick::before{content:"";position:absolute;left:50%;top:50%;width:calc(var(--js)*.64);height:calc(var(--js)*.64);' +
      'margin:calc(var(--js)*-.32) 0 0 calc(var(--js)*-.32);border-radius:50%;border:1px dashed rgba(255,255,255,.12)}',
    '#pad-knob{position:absolute;left:50%;top:50%;width:calc(var(--js)*.46);height:calc(var(--js)*.46);' +
      'margin:calc(var(--js)*-.23) 0 0 calc(var(--js)*-.23);border-radius:50%;' +
      'background:radial-gradient(circle at 38% 32%,rgba(255,219,150,.95),rgba(242,181,68,.88));' +
      'border:2px solid #f2b544;box-shadow:0 4px 16px rgba(0,0,0,.55);pointer-events:none}',

    '#pad-run{position:absolute;left:calc(14px + env(safe-area-inset-left));' +
      'bottom:calc(24px + env(safe-area-inset-bottom) + var(--js));width:var(--pb);height:var(--pb);' +
      'font-size:10px;letter-spacing:.1em;border-color:rgba(255,255,255,.16);background:rgba(10,13,19,.55)}',
    '#pad-acts{position:absolute;right:calc(12px + env(safe-area-inset-right));bottom:calc(12px + env(safe-area-inset-bottom));' +
      'display:flex;flex-direction:column;align-items:flex-end;gap:10px}',
    '.pad-row{display:flex;gap:8px;align-items:flex-end}',
    '#pad-acts .sm{width:var(--pb);height:var(--pb)}',
    '#pad-e{width:calc(var(--pb)*1.55);height:calc(var(--pb)*1.55);border-radius:50%;border-width:2px;font-size:24px}',
    '#pad-e small{font-size:8px}',
    '#pad-deduce{display:none;height:calc(var(--pb)*.9);padding:0 20px;border-radius:999px;flex-direction:row;gap:8px;' +
      'background:#f2b544;border-color:#f2b544;color:#1a1206;font-size:13px;letter-spacing:.14em}',
    '#pad-deduce.show{display:flex}',
    /* dialog terbuka: joystick meredup (gerak memang dikunci), tombol E dipulse */
    '#pad.in-dlg #pad-stick{opacity:.15;pointer-events:none}',
    '#pad.in-dlg #pad-e{border-color:#f2b544;animation:padPulse 1.5s infinite}',
    '@keyframes padPulse{0%,100%{box-shadow:0 0 0 2px rgba(242,181,68,.18),0 2px 12px rgba(0,0,0,.55)}' +
      '50%{box-shadow:0 0 0 8px rgba(242,181,68,0),0 2px 12px rgba(0,0,0,.55)}}',
    '#pad-rotate{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top));transform:translateX(-50%);z-index:61;display:none;' +
      'padding:8px 16px;border-radius:999px;background:rgba(10,13,19,.85);border:1px solid rgba(242,181,68,.5);color:#ffd98a;' +
      'font:700 11px/1 "Segoe UI",system-ui,sans-serif;letter-spacing:.14em;white-space:nowrap;pointer-events:none;transition:opacity .8s}',
    '@media (orientation:portrait){body.pad-on #pad-rotate{display:block}}',
    '#pad-rotate.hide{opacity:0}'
  ].join('\n');
  var st = document.createElement('style');
  st.id = 'pad-css';
  st.textContent = CSS;
  document.head.appendChild(st);

  /* ---------- skala panggung: penuhi layar (cover) kalau layar > 16:9 ---------- */
  var stageEl = document.getElementById('stage');
  function fitCover() {
    var vw = window.innerWidth, vh = window.innerHeight;
    if (!vw || !vh) return;
    var s = Math.min(vw / 1280, vh / 720), crop = 0;
    if (vw / vh > 1280 / 720) {
      s = vw / 1280;                                // penuhi lebar layar
      crop = Math.max(0, (720 * s - vh) / 2 / s);   // sisa terpotong atas/bawah (px panggung)
    }
    stageEl.style.transform = 'scale(' + s + ')';
    document.documentElement.style.setProperty('--padc', crop.toFixed(2) + 'px');
  }
  window.addEventListener('resize', function () { setTimeout(fitCover, 0); });
  document.addEventListener('fullscreenchange', function () { setTimeout(fitCover, 80); });
  document.addEventListener('webkitfullscreenchange', function () { setTimeout(fitCover, 80); });

  /* setelah #stage jadi fixed, lebar viewport bisa berubah —
     minta game menghitung ulang skalanya (fit() mendengar event 'resize') */
  function refit() {
    try { window.dispatchEvent(new Event('resize')); } catch (e) { /* abaikan */ }
    setTimeout(fitCover, 0);
  }
  refit();
  setTimeout(refit, 80);
  setTimeout(refit, 350);
  window.addEventListener('orientationchange', function () { setTimeout(refit, 150); });
  /* jaga-jaga kalau ada browser yang tidak mengirim event resize saat rotasi */
  var lastW = window.innerWidth, lastH = window.innerHeight;
  setInterval(function () {
    if (window.innerWidth !== lastW || window.innerHeight !== lastH) {
      lastW = window.innerWidth; lastH = window.innerHeight;
      refit();
    }
  }, 500);

  /* ---------- fullscreen saat mulai main ---------- */
  var fsBlocked = false;
  function isFull() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
  }
  function lockLand() {
    if (!isTouch) return;
    try {
      var so = screen.orientation || screen.webkitOrientation;
      if (so && so.lock) { var p = so.lock('landscape'); if (p && p.catch) p.catch(function () {}); }
    } catch (e) { /* abaikan */ }
  }
  function enterFull() {
    if (isFull()) { lockLand(); return; }
    var el = document.documentElement;
    var fn = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
    if (!fn) return;
    try {
      var p = fn.call(el, { navigationUI: 'hide' });
      if (p && p.then) p.then(lockLand, function () {});
      else setTimeout(lockLand, 250);
    } catch (e) { /* abaikan */ }
  }
  document.addEventListener('fullscreenchange', function () { if (!isFull()) fsBlocked = true; });
  document.addEventListener('webkitfullscreenchange', function () { if (!isFull()) fsBlocked = true; });
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('#btn-start') || t.closest('.diff-btn')) { fsBlocked = false; enterFull(); }
  }, true);

  /* ---------- util ---------- */
  function mk(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function kb(type, key, shift) {
    var ev;
    try {
      ev = new KeyboardEvent(type, { key: key, bubbles: true, cancelable: true, shiftKey: !!shift });
    } catch (err) {
      ev = document.createEvent('Event');
      ev.initEvent(type, true, true);
      try { Object.defineProperty(ev, 'key', { get: function () { return key; } }); } catch (e2) { /* abaikan */ }
    }
    window.dispatchEvent(ev);
  }
  function buzz() { try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) { /* abaikan */ } }
  function tapKey(key, shift) {
    kb('keydown', key, shift);
    setTimeout(function () { kb('keyup', key); }, 70);
  }

  /* tombol sekali tekan */
  function tap(btn, fn) {
    btn.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add('on');
      buzz();
      fn();
    });
    function off() { btn.classList.remove('on'); }
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointercancel', off);
    btn.addEventListener('lostpointercapture', off);
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  /* ---------- joystick (kiri bawah) ---------- */
  var pad = mk('div'); pad.id = 'pad';
  var stick = mk('div'); stick.id = 'pad-stick';
  var knob = mk('div'); knob.id = 'pad-knob';
  stick.appendChild(knob);

  var move = { w: false, a: false, s: false, d: false };
  function setMove(nx, ny) {
    var want = { w: ny < -0.4, s: ny > 0.4, a: nx < -0.4, d: nx > 0.4 };
    for (var k in want) {
      if (want[k] !== move[k]) {
        move[k] = want[k];
        kb(want[k] ? 'keydown' : 'keyup', k);
      }
    }
  }
  var stickId = null, stickCx = 0, stickCy = 0, stickR = 1;
  function stickAt(e) {
    var dx = e.clientX - stickCx, dy = e.clientY - stickCy;
    var d = Math.sqrt(dx * dx + dy * dy) || 1;
    var cl = Math.min(1, d / stickR);
    var nx = (dx / d) * cl, ny = (dy / d) * cl;
    knob.style.transform = 'translate(' + (nx * stickR * 0.62).toFixed(1) + 'px,' + (ny * stickR * 0.62).toFixed(1) + 'px)';
    setMove(nx, ny);
  }
  function stickStart(e) {
    e.preventDefault();
    e.stopPropagation();
    if (stickId !== null) return;
    stickId = e.pointerId;
    var r = stick.getBoundingClientRect();
    stickCx = r.left + r.width / 2;
    stickCy = r.top + r.height / 2;
    stickR = r.width / 2;
    stick.classList.add('on');
    if (stick.setPointerCapture) { try { stick.setPointerCapture(e.pointerId); } catch (err) { /* abaikan */ } }
    buzz();
    stickAt(e);
  }
  function stickEnd(e) {
    if (e) e.preventDefault();
    if (stickId === null) return;
    stickId = null;
    stick.classList.remove('on');
    knob.style.transform = 'translate(0,0)';
    setMove(0, 0);
  }
  stick.addEventListener('pointerdown', stickStart);
  stick.addEventListener('pointermove', function (e) { if (e.pointerId === stickId) stickAt(e); });
  stick.addEventListener('pointerup', stickEnd);
  stick.addEventListener('pointercancel', stickEnd);
  stick.addEventListener('lostpointercapture', stickEnd);
  stick.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  /* tombol LARI: sekali tap untuk menyalakan (biar bisa satu jempol) */
  var runB = mk('button', 'pbtn', 'LARI');
  runB.type = 'button'; runB.id = 'pad-run'; runB.setAttribute('aria-label', 'Nyalakan / matikan lari');
  var runOn = false;
  runB.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    e.stopPropagation();
    runOn = !runOn;
    runB.classList.toggle('on', runOn);
    kb(runOn ? 'keydown' : 'keyup', 'Shift', runOn);
    buzz();
  });
  runB.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  /* ---------- tombol aksi (kanan bawah) ---------- */
  var acts = mk('div'); acts.id = 'pad-acts';
  var row1 = mk('div', 'pad-row');
  var smalls = [
    ['n', 'N', 'CATATAN'],
    ['t', 'T', 'ALAT'],
    ['h', 'H', 'HT'],
    ['m', '♪', 'SUARA'],
    ['escape', 'II', 'JEDA']
  ];
  var muteBtn = null;
  for (var i = 0; i < smalls.length; i++) {
    (function (def) {
      var b = mk('button', 'pbtn sm', def[1] + '<small>' + def[2] + '</small>');
      b.type = 'button';
      b.setAttribute('aria-label', def[2]);
      tap(b, function () {
        tapKey(def[0]);
        if (def[0] === 'm') { muteBtn = b; setTimeout(syncMute, 40); }
      });
      row1.appendChild(b);
    })(smalls[i]);
  }
  function syncMute() {
    var real = document.getElementById('btn-mute');
    if (muteBtn && real) muteBtn.classList.toggle('off', real.classList.contains('off'));
  }

  var row2 = mk('div', 'pad-row');
  var ddBtn = mk('button', 'pbtn', 'DEDUKSI');
  ddBtn.type = 'button'; ddBtn.id = 'pad-deduce'; ddBtn.setAttribute('aria-label', 'Susun deduksi');
  tap(ddBtn, function () {
    var d = document.getElementById('btn-deduce');
    if (d) d.click();
  });

  var eBtn = mk('button', 'pbtn', 'E<small>PERIKSA</small>');
  eBtn.type = 'button'; eBtn.id = 'pad-e'; eBtn.setAttribute('aria-label', 'Periksa / bicara / lanjut');
  tap(eBtn, function () { tapKey('e'); });

  row2.appendChild(ddBtn);
  row2.appendChild(eBtn);
  acts.appendChild(row1);
  acts.appendChild(row2);

  pad.appendChild(stick);
  pad.appendChild(runB);
  pad.appendChild(acts);
  document.body.appendChild(pad);

  /* sentuhan pertama di kontroler: pastikan fullscreen (kalau belum) */
  pad.addEventListener('pointerdown', function () { if (!isFull() && !fsBlocked) enterFull(); }, true);

  /* ---------- petunjuk putar HP (hanya saat portrait) ---------- */
  var rot = mk('div', null, '&#8635; PUTAR HP KE SAMPING &mdash; LAYAR LEBIH LUAS');
  rot.id = 'pad-rotate';
  document.body.appendChild(rot);
  setTimeout(function () { rot.classList.add('hide'); }, 9000);

  /* ---------- tampilkan kontroler hanya saat di TKP / cutscene ---------- */
  var last = null, lastDlg = null;
  function syncPad() {
    var a = document.querySelector('.screen.active');
    var id = a ? a.id : '';
    var on = id === 'scr-play' || id === 'scr-cut';
    if (on !== last) { last = on; pad.style.display = on ? 'block' : 'none'; }
    var dlg = !!document.querySelector('#dlg.show');
    if (dlg !== lastDlg) { lastDlg = dlg; pad.classList.toggle('in-dlg', dlg); }
  }
  syncPad();
  setInterval(syncPad, 200);

  /* ---------- tombol DEDUKSI muncul saat bukti sudah lengkap ---------- */
  var dd = document.getElementById('btn-deduce');
  function syncDeduce() { ddBtn.classList.toggle('show', !!(dd && dd.classList.contains('show'))); }
  if (dd) {
    if (window.MutationObserver) new MutationObserver(syncDeduce).observe(dd, { attributes: true, attributeFilter: ['class'] });
    syncDeduce();
  }

  /* ---------- tambahan kecil di modal CARA BERMAIN (khusus HP) ---------- */
  var helpCol = document.querySelector('#m-help .help-grid > div');
  if (helpCol) {
    var p = document.createElement('p');
    p.className = 'dim';
    p.innerHTML = '<b>Di HP:</b> geser <b>joystick</b> di kiri bawah untuk jalan, tombol <b>LARI</b> di atasnya ' +
      'sekali tap untuk lari. Tombol <b>E</b> bulat di kanan bawah untuk periksa / lanjut, ' +
      'N, T, H, suara, dan jeda ada di baris atasnya. Game otomatis fullscreen saat mulai main.';
    helpCol.appendChild(p);
  }
})();
