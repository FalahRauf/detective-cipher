/* =========================================================
   DETEKTIF SANDI — touch.js
   Kontroler layar sentuh untuk HP / tablet.

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

  /* ---------- gaya (disuntik dari sini, style.css tidak diubah) ---------- */
  var CSS = [
    'body.pad-on{touch-action:manipulation;overscroll-behavior:none}',
    'body.pad-on #p-keys{display:none!important}',
    /* panggung 1280px tidak boleh dihitung sebagai lebar halaman:
       di HP itu memicu zoom-out Chrome (innerWidth membesar, layar terpotong).
       position:fixed membuatnya tidak ikut menggeser viewport. */
    'body.pad-on #stage{position:fixed}',
    '#pad{position:fixed;inset:0;z-index:60;pointer-events:none;display:none;--pb:56px;--pg:6px;' +
      'font-family:"Segoe UI",system-ui,-apple-system,sans-serif}',
    '@media (max-height:430px){#pad{--pb:48px}}',
    /* layar sempit (HP portrait): tombol kecil jadi grid 3 kolom biar tidak menimpa D-pad */
    '@media (max-width:560px){#pad{--pb:50px}#pad-acts .pad-row:first-child{display:grid;grid-template-columns:repeat(3,var(--pb));gap:6px}}',
    '@media (max-width:340px){#pad{--pb:44px}}',
    '#pad *{box-sizing:border-box;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;-webkit-touch-callout:none}',
    '.pbtn{pointer-events:auto;touch-action:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;' +
      'background:rgba(10,13,19,.72);border:1px solid rgba(242,181,68,.5);border-radius:12px;color:#e9edf3;' +
      'font:700 16px/1 "Segoe UI",system-ui,sans-serif;letter-spacing:.04em;cursor:pointer;padding:0;' +
      'box-shadow:0 2px 12px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.06);' +
      '-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}',
    '.pbtn small{font-size:8px;letter-spacing:.12em;color:#9aa6b8;font-weight:700}',
    '.pbtn.on{background:rgba(242,181,68,.9);color:#1a1206;border-color:#f2b544}',
    '.pbtn.on small{color:#4a3410}',
    '.pbtn.off{opacity:.4}',
    '#pad-dpad{position:absolute;left:calc(12px + env(safe-area-inset-left));bottom:calc(12px + env(safe-area-inset-bottom));' +
      'display:grid;grid-template-columns:repeat(3,var(--pb));grid-template-rows:repeat(3,var(--pb));gap:var(--pg)}',
    '#pad-up{grid-area:1/2}#pad-left{grid-area:2/1}#pad-run{grid-area:2/2}#pad-right{grid-area:2/3}#pad-down{grid-area:3/2}',
    '#pad-run{font-size:10px;letter-spacing:.1em;border-color:rgba(255,255,255,.16);background:rgba(10,13,19,.55)}',
    '#pad-acts{position:absolute;right:calc(12px + env(safe-area-inset-right));bottom:calc(12px + env(safe-area-inset-bottom));' +
      'display:flex;flex-direction:column;align-items:flex-end;gap:10px}',
    '.pad-row{display:flex;gap:8px;align-items:flex-end}',
    '#pad-acts .sm{width:var(--pb);height:var(--pb)}',
    '#pad-e{width:calc(var(--pb)*1.55);height:calc(var(--pb)*1.55);border-radius:50%;border-width:2px;font-size:24px}',
    '#pad-e small{font-size:8px}',
    '#pad-deduce{display:none;height:calc(var(--pb)*.9);padding:0 20px;border-radius:999px;flex-direction:row;gap:8px;' +
      'background:#f2b544;border-color:#f2b544;color:#1a1206;font-size:13px;letter-spacing:.14em}',
    '#pad-deduce.show{display:flex}',
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

  /* setelah #stage jadi fixed, lebar viewport bisa berubah —
     minta game menghitung ulang skalanya (fit() mendengar event 'resize') */
  function refit() {
    try { window.dispatchEvent(new Event('resize')); } catch (e) { /* abaikan */ }
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

  /* tombol tahan (gerak / lari): keydown saat ditekan, keyup saat dilepas */
  function hold(btn, key, shift) {
    var downed = false;
    function down(e) {
      e.preventDefault();
      e.stopPropagation();
      if (downed) return;
      downed = true;
      if (btn.setPointerCapture && e.pointerId != null) { try { btn.setPointerCapture(e.pointerId); } catch (err) { /* abaikan */ } }
      btn.classList.add('on');
      kb('keydown', key, shift);
      buzz();
    }
    function up(e) {
      if (e) e.preventDefault();
      if (!downed) return;
      downed = false;
      btn.classList.remove('on');
      kb('keyup', key);
    }
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('lostpointercapture', up);
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
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

  /* ---------- D-pad (kiri bawah) ---------- */
  var pad = mk('div'); pad.id = 'pad';
  var dpad = mk('div'); dpad.id = 'pad-dpad';

  function dir(id, label, aria, key) {
    var b = mk('button', 'pbtn', label);
    b.type = 'button'; b.id = id; b.setAttribute('aria-label', aria);
    hold(b, key);
    dpad.appendChild(b);
  }
  dir('pad-up', '▲', 'Jalan ke atas', 'w');
  dir('pad-left', '◀', 'Jalan ke kiri', 'a');
  dir('pad-right', '▶', 'Jalan ke kanan', 'd');
  dir('pad-down', '▼', 'Jalan ke bawah', 's');

  var runB = mk('button', 'pbtn', 'LARI');
  runB.type = 'button'; runB.id = 'pad-run'; runB.setAttribute('aria-label', 'Tahan sambil menekan arah untuk lari');
  hold(runB, 'Shift', true);
  dpad.appendChild(runB);

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

  pad.appendChild(dpad);
  pad.appendChild(acts);
  document.body.appendChild(pad);

  /* ---------- petunjuk putar HP (hanya saat portrait) ---------- */
  var rot = mk('div', null, '&#8635; PUTAR HP KE SAMPING &mdash; LAYAR LEBIH LUAS');
  rot.id = 'pad-rotate';
  document.body.appendChild(rot);
  setTimeout(function () { rot.classList.add('hide'); }, 9000);

  /* ---------- tampilkan kontroler hanya saat di TKP / cutscene ---------- */
  var last = null;
  function syncPad() {
    var a = document.querySelector('.screen.active');
    var id = a ? a.id : '';
    var on = id === 'scr-play' || id === 'scr-cut';
    if (on !== last) { last = on; pad.style.display = on ? 'block' : 'none'; }
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
    p.innerHTML = '<b>Di HP:</b> tombol arah di kiri bawah, <b>E</b> di kanan bawah (periksa / lanjut). ' +
      'N, T, H, suara, dan jeda ada di baris atasnya. Tahan <b>LARI</b> sambil menekan arah.';
    helpCol.appendChild(p);
  }
})();
