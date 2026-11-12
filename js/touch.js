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

    /* --- HUD atas jadi tombol utama catatan/alat/HT: diperbesar biar gampang ditap --- */
    'body.pad-on .hbtn{padding:15px 18px;font-size:15px}',
    'body.pad-on .hbtn.icon{width:52px;padding:15px 0}',
    'body.pad-on .hbtn kbd{display:none}',
    'body.pad-on .hud-btns{gap:10px}',
    'body.pad-on .prompt kbd{display:none}',

    /* --- kontroler --- */
    '#pad{position:fixed;inset:0;z-index:60;pointer-events:none;display:none;--pb:52px;--js:132px;' +
      'font-family:"Segoe UI",system-ui,-apple-system,sans-serif}',
    '@media (max-height:430px){#pad{--pb:46px;--js:112px}}',
    '#pad *{box-sizing:border-box;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}',
    /* zona joystick: separuh kiri layar, di bawah panel tugas */
    '#pad-zone{position:absolute;left:0;top:34%;bottom:0;width:46%;pointer-events:auto;touch-action:none}',
    '#pad-base{position:absolute;width:var(--js);height:var(--js);margin:calc(var(--js)*-.5) 0 0 calc(var(--js)*-.5);border-radius:50%;' +
      'background:radial-gradient(circle,rgba(22,28,39,.35),rgba(8,10,15,.6));border:2px solid rgba(242,181,68,.35);' +
      'box-shadow:inset 0 0 22px rgba(0,0,0,.6);opacity:.5;transition:opacity .2s;pointer-events:none}',
    '#pad-base.on{opacity:1;border-color:rgba(242,181,68,.85);transition:none}',
    '#pad-base i{position:absolute;color:rgba(255,255,255,.3);font:700 11px/1 sans-serif;font-style:normal}',
    '#pad-knob{position:absolute;left:50%;top:50%;width:calc(var(--js)*.44);height:calc(var(--js)*.44);' +
      'margin:calc(var(--js)*-.22) 0 0 calc(var(--js)*-.22);border-radius:50%;' +
      'background:radial-gradient(circle at 38% 32%,rgba(255,219,150,.95),rgba(242,181,68,.88));' +
      'border:2px solid #f2b544;box-shadow:0 4px 14px rgba(0,0,0,.55)}',
    '#pad-hint{position:absolute;left:50%;bottom:calc(100% + 6px);transform:translateX(-50%);white-space:nowrap;' +
      'font:700 9px/1 sans-serif;letter-spacing:.14em;color:rgba(255,255,255,.5)}',
    '#pad-base.on #pad-hint{display:none}',

    '.pbtn{pointer-events:auto;touch-action:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;' +
      'background:rgba(10,13,19,.72);border:2px solid rgba(242,181,68,.5);border-radius:50%;color:#e9edf3;' +
      'font:800 15px/1 "Segoe UI",system-ui,sans-serif;letter-spacing:.06em;padding:0;cursor:pointer;' +
      'box-shadow:0 2px 12px rgba(0,0,0,.55);transition:transform .08s,opacity .2s}',
    '.pbtn.on{background:rgba(242,181,68,.92);color:#1a1206;border-color:#f2b544;transform:scale(.94)}',
    '#pad-acts{position:absolute;right:calc(18px + env(safe-area-inset-right));bottom:calc(18px + env(safe-area-inset-bottom));' +
      'width:calc(var(--pb)*2.9);height:calc(var(--pb)*2.9)}',
    '#pad-e{position:absolute;right:0;bottom:0;width:calc(var(--pb)*1.8);height:calc(var(--pb)*1.8);opacity:.55}',
    '#pad-e b{font-size:26px}',
    '#pad-e span{font-size:9px;letter-spacing:.12em;max-width:86%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#pad-e.ready{opacity:1;border-color:#f2b544;animation:padPulse 1.5s infinite}',
    '#pad-run{position:absolute;left:0;bottom:calc(var(--pb)*.2);width:var(--pb);height:var(--pb);font-size:9px;letter-spacing:.12em;' +
      'border-color:rgba(255,255,255,.22)}',
    '#pad-deduce{display:none;position:absolute;right:0;bottom:calc(var(--pb)*2.05);height:calc(var(--pb)*.8);padding:0 18px;border-radius:999px;' +
      'background:#f2b544;border-color:#f2b544;color:#1a1206;font-size:12px;letter-spacing:.14em;white-space:nowrap;animation:padPulse 1.5s infinite}',
    '#pad-deduce.show{display:flex}',
    '@keyframes padPulse{0%,100%{box-shadow:0 0 0 2px rgba(242,181,68,.25),0 2px 12px rgba(0,0,0,.55)}' +
      '50%{box-shadow:0 0 0 10px rgba(242,181,68,0),0 2px 12px rgba(0,0,0,.55)}}',
    /* dialog/modal terbuka: kontroler disembunyikan, ketuk kotak dialog untuk lanjut */
    '#pad.hidden{display:none!important}',
    'body.pad-on .dlg::after{content:"ketuk untuk lanjut \\25B8";position:absolute;right:16px;bottom:8px;font-size:11px;letter-spacing:.12em;color:#8a96a8}',
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


  /* ---------- joystick mengambang: muncul di titik sentuh mana pun di sisi kiri ---------- */
  var pad = mk('div'); pad.id = 'pad';
  var zone = mk('div'); zone.id = 'pad-zone';
  var base = mk('div', null,
    '<i style="left:50%;top:6px;margin-left:-4px">&#9650;</i><i style="left:50%;bottom:6px;margin-left:-4px">&#9660;</i>' +
    '<i style="left:7px;top:50%;margin-top:-6px">&#9664;</i><i style="right:7px;top:50%;margin-top:-6px">&#9654;</i>' +
    '<div id="pad-knob"></div><div id="pad-hint">GESER UNTUK JALAN</div>');
  base.id = 'pad-base';
  zone.appendChild(base);
  var knob = base.querySelector('#pad-knob');
  function homeBase() {
    var h = zone.clientHeight, js = base.offsetWidth || 120;
    base.style.left = (26 + js / 2) + 'px';
    base.style.top = (h - 22 - js / 2) + 'px';
  }

  var move = { w: false, a: false, s: false, d: false };
  function setMove(nx, ny) {
    var ax = Math.abs(nx), ay = Math.abs(ny), m = Math.max(ax, ay);
    var want = { w: false, s: false, a: false, d: false };
    if (m > 0.28) {
      // ikuti arah dominan; diagonal hanya kalau jempol benar-benar miring ~45°
      var diag = Math.min(ax, ay) > m * 0.72;
      if (ax >= ay || diag) { want.a = nx < 0; want.d = nx > 0; }
      if (ay > ax || diag) { want.w = ny < 0; want.s = ny > 0; }
    }
    for (var k in want) {
      if (want[k] !== move[k]) { move[k] = want[k]; kb(want[k] ? 'keydown' : 'keyup', k); }
    }
  }
  var stickId = null, cx = 0, cy = 0, rad = 1;
  function stickAt(e) {
    var dx = e.clientX - cx, dy = e.clientY - cy;
    var d = Math.sqrt(dx * dx + dy * dy) || 1, cl = Math.min(1, d / rad);
    var nx = dx / d * cl, ny = dy / d * cl;
    knob.style.transform = 'translate(' + (nx * rad * 0.6).toFixed(1) + 'px,' + (ny * rad * 0.6).toFixed(1) + 'px)';
    setMove(nx, ny);
  }
  zone.addEventListener('pointerdown', function (e) {
    e.preventDefault(); e.stopPropagation();
    if (stickId !== null) return;
    stickId = e.pointerId;
    var r = zone.getBoundingClientRect();
    base.style.left = (e.clientX - r.left) + 'px';
    base.style.top = (e.clientY - r.top) + 'px';
    cx = e.clientX; cy = e.clientY; rad = (base.offsetWidth || 120) / 2;
    base.classList.add('on');
    try { zone.setPointerCapture(e.pointerId); } catch (err) { /* abaikan */ }
    buzz(); stickAt(e);
  });
  zone.addEventListener('pointermove', function (e) { if (e.pointerId === stickId) stickAt(e); });
  function stickEnd(e) {
    if (stickId === null || (e && e.pointerId !== stickId)) return;
    stickId = null;
    base.classList.remove('on');
    knob.style.transform = 'translate(0,0)';
    setMove(0, 0); homeBase();
  }
  zone.addEventListener('pointerup', stickEnd);
  zone.addEventListener('pointercancel', stickEnd);
  zone.addEventListener('lostpointercapture', stickEnd);
  zone.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  window.addEventListener('resize', function () { setTimeout(homeBase, 50); });

  /* ---------- tombol kanan: E (labelnya ikut aksi), LARI, DEDUKSI ---------- */
  var acts = mk('div'); acts.id = 'pad-acts';
  var eBtn = mk('button', 'pbtn', '<b>E</b><span>PERIKSA</span>');
  eBtn.type = 'button'; eBtn.id = 'pad-e'; eBtn.setAttribute('aria-label', 'Periksa / bicara');
  tap(eBtn, function () { tapKey('e'); });
  var eLbl = eBtn.querySelector('span');

  var runB = mk('button', 'pbtn', 'LARI');
  runB.type = 'button'; runB.id = 'pad-run'; runB.setAttribute('aria-label', 'Nyalakan / matikan lari');
  var runOn = false;
  runB.addEventListener('pointerdown', function (e) {
    e.preventDefault(); e.stopPropagation();
    runOn = !runOn;
    runB.classList.toggle('on', runOn);
    kb(runOn ? 'keydown' : 'keyup', 'Shift', runOn);
    buzz();
  });
  runB.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  var ddBtn = mk('button', 'pbtn', 'DEDUKSI &#9656;');
  ddBtn.type = 'button'; ddBtn.id = 'pad-deduce';
  tap(ddBtn, function () { var d = document.getElementById('btn-deduce'); if (d) d.click(); });

  acts.appendChild(runB); acts.appendChild(ddBtn); acts.appendChild(eBtn);
  pad.appendChild(zone); pad.appendChild(acts);
  document.body.appendChild(pad);

  pad.addEventListener('pointerdown', function () { if (!isFull() && !fsBlocked) enterFull(); }, true);

  /* ---------- petunjuk putar HP (hanya saat portrait) ---------- */
  var rot = mk('div', null, '&#8635; PUTAR HP KE SAMPING &mdash; LAYAR LEBIH LUAS');
  rot.id = 'pad-rotate';
  document.body.appendChild(rot);
  setTimeout(function () { rot.classList.add('hide'); }, 9000);

  /* ---------- ikuti keadaan game: layar, dialog/modal, prompt aksi ---------- */
  var prm = document.getElementById('prompt'), pLbl = document.getElementById('prompt-label');
  var lastShow = null, lastBusy = null, lastReady = null, lastTxt = '';
  function syncPad() {
    var a = document.querySelector('.screen.active');
    var show = !!a && a.id === 'scr-play';
    if (show !== lastShow) { lastShow = show; pad.style.display = show ? 'block' : 'none'; if (show) setTimeout(homeBase, 30); }
    var busy = !!document.querySelector('#dlg.show, .modal.show');
    if (busy !== lastBusy) {
      lastBusy = busy; pad.classList.toggle('hidden', busy);
      if (busy && stickId !== null) stickEnd({ pointerId: stickId });
    }
    var ready = !!(prm && prm.classList.contains('show'));
    if (ready !== lastReady) { lastReady = ready; eBtn.classList.toggle('ready', ready); }
    var txt = ready && pLbl ? ((pLbl.textContent || 'Periksa').trim().split(/\s+/)[0]).toUpperCase() : 'PERIKSA';
    if (txt !== lastTxt) { lastTxt = txt; eLbl.textContent = txt; }
  }
  syncPad();
  setInterval(syncPad, 120);

  /* ---------- tombol DEDUKSI muncul saat bukti sudah lengkap ---------- */
  var dd = document.getElementById('btn-deduce');
  function syncDeduce() { ddBtn.classList.toggle('show', !!(dd && dd.classList.contains('show'))); }
  if (dd) {
    if (window.MutationObserver) new MutationObserver(syncDeduce).observe(dd, { attributes: true, attributeFilter: ['class'] });
    syncDeduce();
  }

  /* ---------- tambahan di modal CARA BERMAIN (khusus HP) ---------- */
  var helpCol = document.querySelector('#m-help .help-grid > div');
  if (helpCol) {
    var p = document.createElement('p');
    p.className = 'dim';
    p.innerHTML = '<b>Di HP:</b> sentuh dan geser jempol di <b>mana saja di sisi kiri</b> untuk jalan. ' +
      'Tombol <b>E</b> di kanan bawah menyala saat ada yang bisa diperiksa; <b>LARI</b> cukup sekali tap. ' +
      'Catatan, alat, HT, suara, dan jeda ada di tombol kanan atas. Ketuk kotak dialog untuk lanjut.';
    helpCol.appendChild(p);
  }
})();
