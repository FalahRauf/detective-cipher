/* =========================================================
   DETEKTIF SANDI — data.js
   Karakter, tingkat kesulitan, dan tiga kasus yang saling bersambung.
   Peta ditulis sebagai teks ASCII:
     #  dinding        D  pintu terbuka     L  pintu terkunci
     .  ,  :  ;        lantai (tema tiap ruangan, lihat "themes")
   Perabot ditaruh dalam satuan tile: c (kolom), r (baris), w, h.
   ========================================================= */
(function () {
  'use strict';
  var DS = window.DS = window.DS || {};

  /* ---------------------------------------------------------
     KARAKTER
     --------------------------------------------------------- */
  var CHARS = {
    arsa:   { id: 'arsa', name: 'Detektif Bima', role: 'Detektif swasta', skin: '#e0a77c', hair: '#2a1c12',
              style: 'fedora', hat: '#4a3622', top: '#a08560', coat: true, pants: '#2a2d38' },
    hendra: { id: 'hendra', name: 'Pak Surya Kencana', role: 'Guru TKJ', skin: '#d49a6e', hair: '#2a2420',
              style: 'short', top: '#7a4a2a', acc: ['glasses', 'mustache', 'batik', 'grey'], pants: '#2b2b30' },
    nayla:  { id: 'nayla', name: 'Alya Rahma', role: 'Siswi XI PPLG 4', skin: '#e8b88f', style: 'hijab',
              hijab: '#eeeeee', top: '#35507a', pants: '#4a4f5a' },
    dedi:   { id: 'dedi', name: 'Pak Rudi Hartono', role: 'Teknisi Lab', skin: '#c98d62', hair: '#141210',
              style: 'short', top: '#2f3b4a', acc: ['lanyard', 'mustache'], pants: '#22252c' },
    rian:   { id: 'rian', name: 'Fajar Nugraha', role: 'Siswa XI PPLG 4', skin: '#d9a070', hair: '#121012',
              style: 'spiky', top: '#9a2f2f', pants: '#2a2d38' },
    sinta:  { id: 'sinta', name: 'Citra Lestari', role: 'Siswi XI PPLG 4', skin: '#efc29c', hair: '#1a1210',
              style: 'long', top: '#dfe4ea', collar: '#ffffff', pants: '#5a5f6a' },
    joko:   { id: 'joko', name: 'Pak Darto', role: 'Satpam sekolah', skin: '#c08458', hair: '#1a1612',
              style: 'cap', hat: '#1e2c48', top: '#2b3d5e', acc: ['badge', 'mustache'], pants: '#1e2a40' },
    ratna:  { id: 'ratna', name: 'Bu Dewi Anggraini', role: 'Guru Matematika', skin: '#e4b08a', style: 'hijab',
              hijab: '#7a2e3e', top: '#c9b8a0', acc: ['glasses'], pants: '#4a3a3a' },
    bram:   { id: 'bram', name: 'Pak Gunawan Saputro', role: 'Wakasek Kurikulum', skin: '#e2ad84', hair: '#18140f',
              style: 'slick', top: '#4a4f5c', acc: ['tie'], tie: '#7a1f24', pants: '#2e313a' },
    wulan:  { id: 'wulan', name: 'Bu Rina Marlina', role: 'Guru BK', skin: '#dca47a', style: 'hijab',
              hijab: '#4f7a5a', top: '#c7a77e', pants: '#3a3a42' },
    yoga:   { id: 'yoga', name: 'Dimas Arya', role: 'Siswa XII TKJ 1', skin: '#c48a5e', hair: '#16120e',
              style: 'short', top: '#2b6e4a', pants: '#1f2a24' },
    slamet: { id: 'slamet', name: 'Pak Udin', role: 'Petugas kebersihan', skin: '#b97f55', hair: '#b8b8b8',
              style: 'bald', top: '#5a6b7a', acc: ['apron', 'mustache'], pants: '#34383f' },
    bagas:  { id: 'bagas', name: 'Mas Reza Firmansyah', role: 'Admin Jaringan', skin: '#d8a274', hair: '#1e1813',
              style: 'bun', top: '#1f2228', acc: ['headset'], pants: '#2a2d38' },
    dinda:  { id: 'dinda', name: 'Salsa Amelia', role: 'Siswi XII TKJ 2', skin: '#ecbf98', hair: '#4a2c1a',
              style: 'long', top: '#6b3fa0', pants: '#3a3a48' }
  };

  /* ---------------------------------------------------------
     TINGKAT KESULITAN
     frags  = jumlah sobekan kunci yang harus dicari
     traps  = perangkap di lantai
     glint  = kilau penanda barang berisi petunjuk
     --------------------------------------------------------- */
  var DIFFS = {
    easy:   { id: 'easy', label: 'EASY', frags: 1, traps: 0, glint: true, guide: 'path', mult: 1,
              desc: 'angka kecil · kunci utuh · tanpa perangkap · jejak penunjuk jalan ke tujuan' },
    normal: { id: 'normal', label: 'NORMAL', frags: 2, traps: 2, glint: true, guide: 'mark', mult: 1.25,
              desc: 'angka sedang · kunci sobek 2 bagian · 2 perangkap terlihat · panah penunjuk tujuan' },
    hard:   { id: 'hard', label: 'HARD', frags: 3, traps: 4, glint: false, mult: 1.5,
              desc: 'angka besar, 3 fungsi · kunci sobek 3 bagian · 4 perangkap samar · tanpa kilau' }
  };

  /* ---------------------------------------------------------
     helper kecil untuk isi dialog
     --------------------------------------------------------- */
  function note(s) { return '<div class="note">' + s + '</div>'; }

  /* =========================================================
     KASUS 01 — REKAMAN 23.47
     ========================================================= */
  var C1 = {
    id: 'c1', no: 'KASUS 01', title: 'Rekaman 23.47', crime: 'Penyekapan',
    place: 'Lab Komputer 2', when: 'Kamis, 23.58',
    blurb: 'Alya, siswi XI PPLG 4, hilang dari Lab Komputer 2 saat hujan deras. ' +
           'Kamera menangkap sosok gelap keluar membawa tas besar. Alya sempat meninggalkan satu pesan — terenkripsi.',
    radio: 'hendra',
    plain: 'KUNCI DI BAWAH POT',
    mode: 'komposisi',
    /* Tiap main baru: posisi meja Alya, nomor PC, dan kode laci diacak. */
    deskIds: ['meja1', 'meja2', 'meja3', 'meja4', 'meja5', 'mejaNayla'],
    vars: function (R, C) {
      var V = {}, ids = C.deskIds;
      var pos = ids.map(function (id) { var P = C.props.filter(function (p) { return p.id === id; })[0]; return { c: P.c, r: P.r }; });
      // meja Alya pindah ke salah satu slot meja (selain meja Citra)
      var slots = [0, 1, 2, 3, 5], slot = slots[R.int(0, slots.length - 1)];
      V._swap = slot;
      // nomor PC naik urut posisi (baris lalu kolom), diambil acak dari 01–30
      var nums = R.pickN(30, 6).sort(function (a, b) { return a - b; });
      var order = pos.map(function (p, i) { return i; }).sort(function (a, b) { return (pos[a].r - pos[b].r) || (pos[a].c - pos[b].c); });
      var numAt = {};                       // index slot posisi -> nomor
      order.forEach(function (slotIdx, k) { numAt[slotIdx] = nums[k]; });
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      ids.forEach(function (id, i) {
        var where = id === 'mejaNayla' ? slot : (i === slot ? 5 : i);   // tukar posisi dengan meja Alya
        V['pc_' + id] = pad(numAt[where]);
      });
      V.pc = V.pc_mejaNayla;
      var pre = R.int(10, 98);
      V.pre = String(pre); V.pre1 = V.pre.charAt(0); V.pre2 = V.pre.charAt(1);
      V.kode = V.pre + V.pc;
      var others = ids.filter(function (id) { return id !== 'mejaNayla'; }).map(function (id) { return V['pc_' + id]; });
      V.pcX = others[0]; V.pcY = others[3];
      V.kodeX = V.pre + V.pcX; V.kodeY = V.pc + V.pre;
      if (V.kodeY === V.kode) V.kodeY = V.pre + V.pcY;
      return V;
    },
    setup: function (C, V) {
      if (V._swap === 5) return;
      var get = function (id) { return C.props.filter(function (p) { return p.id === id; })[0]; };
      var A = get('mejaNayla'), B = get(C.deskIds[V._swap]);
      var t = { c: A.c, r: A.r }; A.c = B.c; A.r = B.r; B.c = t.c; B.r = t.r;
    },
    time: { easy: 660, normal: 540, hard: 420 },
    sky: 'night', dark: 0.5, wall: 'lab',
    themes: { '.': 'lab', ';': 'tech', ':': 'store', ',': 'corr' },
    map: [
      '################################',
      '################################',
      '#...................#;;;;;;;;;;#',
      '#...................#;;;;;;;;;;#',
      '#...................L;;;;;;;;;;#',
      '#...................#;;;;;;;;;;#',
      '#...................#;;;;;;;;;;#',
      '#...................############',
      '#...................#::::::::::#',
      '#...................#::::::::::#',
      '#...................#::::::::::#',
      '#...................#::::::::::#',
      '#########DD##############L######',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '#,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,#',
      '################################',
      '################################'
    ],
    spawn: { c: 2, r: 14, dir: 'right' },
    rooms: [
      { name: 'LAB KOMPUTER 2', c0: 1, r0: 2, c1: 19, r1: 11 },
      { name: 'RUANG TEKNISI', c0: 21, r0: 2, c1: 30, r1: 6 },
      { name: 'GUDANG', c0: 21, r0: 8, c1: 30, r1: 11 },
      { name: 'KORIDOR LANTAI 2', c0: 1, r0: 12, c1: 30, r1: 15 }
    ],
    lights: [
      { c: 5, r: 5, rad: 70 }, { c: 13, r: 5, rad: 70 }, { c: 9, r: 10, rad: 60 },
      { c: 25, r: 4, rad: 55 }, { c: 6, r: 14, rad: 60 }, { c: 18, r: 14, rad: 60 }, { c: 28, r: 14, rad: 50 }
    ],
    doors: [
      { id: 'dTeknisi', c: 20, r: 4, item: 'kunciTeknisi', name: 'PINTU RUANG TEKNISI',
        locked: 'Pintu besi ruang teknisi. Terkunci. Stiker di daunnya: <i>"Selain teknisi dilarang masuk."</i>',
        opened: 'Kunci berlabel <b>R. TEKNISI</b> masuk dengan pas. <i>Klik.</i> Pintunya terbuka.' },
      { id: 'dGudang', c: 25, r: 12, item: 'kunciGudang', name: 'PINTU GUDANG',
        locked: 'Pintu gudang alat kebersihan. Digembok dari luar — gemboknya masih baru, mengkilap.<br>Dari dalam... samar-samar terdengar ketukan?',
        opened: 'Kunci <b>GUDANG</b> dari laci Pak Rudi pas di gembok itu.' }
    ],
    items: {
      kunciTeknisi: 'Kunci R. Teknisi',
      kunciGudang: 'Kunci Gudang'
    },
    props: [
      /* ---- lab: dinding atas ---- */
      { id: 'papan', type: 'whiteboard', c: 3, r: 0, w: 4, h: 2, wall: true, spot: true, title: 'PAPAN TULIS',
        lines: ['F(G(X))', '(FoG)(X)=?'],
        look: 'Sisa materi "Fungsi Komposisi" dari kelas siang: <i>(f∘g)(x) = f(g(x)), kerjakan g dulu, baru f.</i> Di pojok ada tulisan kecil: <i>"Alya — jangan lupa backup!"</i>',
        spotText: 'Di balik penghapus papan terselip sobekan kertas berisi rumus:' },
      { id: 'jendela1', type: 'window', c: 9, r: 0, w: 2, h: 2, wall: true, title: 'JENDELA',
        look: 'Hujan masih deras. Jendela terkunci dari dalam dan teralisnya utuh — tidak ada yang keluar lewat sini.' },
      { id: 'poster', type: 'poster', c: 12, r: 0, w: 1, h: 2, wall: true, title: 'POSTER LOMBA',
        look: 'Poster "Cyber Defense Competition 2026". Di kolom perwakilan sekolah tertulis: <b>Alya Rahma</b>. Nama Fajar dicoret.' },
      { id: 'jendela2', type: 'window', c: 14, r: 0, w: 2, h: 2, wall: true, title: 'JENDELA',
        look: 'Dari sini kelihatan parkiran motor. Kosong, kecuali satu motor bebek dengan jok basah.' },
      { id: 'rak', type: 'bookshelf', c: 17, r: 2, w: 2, h: 1, tall: 16, spot: true, gap: 1, title: 'RAK BUKU',
        look: 'Buku jaringan dan pemrograman. Satu buku "Kriptografi Dasar" tercatat dipinjam atas nama Alya.',
        spotText: 'Di antara buku-buku, ada kertas terlipat yang diselipkan terburu-buru:' },
      /* ---- lab: meja-meja ---- */
      { id: 'meja1', type: 'desk_pc', c: 2, r: 3, w: 3, h: 2, spot: true, title: 'MEJA PC-{{pc_meja1}}',
        look: 'Komputer di halaman login. Ada tulisan tip-ex di meja: "JANGAN DUDUK SINI".',
        spotText: 'Di bawah keyboard, tertempel sobekan kertas:' },
      { id: 'meja2', type: 'desk_pc', c: 7, r: 3, w: 3, h: 2, spot: true, title: 'MEJA PC-{{pc_meja2}}',
        look: 'Serutan pensil dan penghapus karet. Komputernya mati total.',
        spotText: 'Terselip di celah monitor:' },
      { id: 'meja3', type: 'desk_pc', c: 12, r: 3, w: 3, h: 2, spot: true, title: 'MEJA PC-{{pc_meja3}}',
        look: 'Stiker "PPLG JUARA" di CPU. Laci kosong.',
        spotText: 'Di laci meja, di bawah stiker yang belum ditempel:' },
      { id: 'meja4', type: 'desk_pc', c: 2, r: 7, w: 3, h: 2, spot: true, title: 'MEJA PC-{{pc_meja4}}',
        look: 'Kursinya ditarik jauh ke belakang, seperti ditinggal buru-buru. Tapi tidak ada apa-apa.',
        spotText: 'Kertas terlipat di bawah mouse pad:' },
      { id: 'meja5', type: 'desk_pc', c: 7, r: 7, w: 3, h: 2, spot: true, title: 'MEJA PC-{{pc_meja5}} · CITRA',
        look: 'Meja Citra. Ada post-it untuk Alya: <i>"Nay, aku pulang duluan bareng Fajar ya. Hati-hati! — Citra, 21.58"</i>',
        spotText: 'Selain post-it dari Citra, ada sobekan lain di bawahnya:' },
      { id: 'mejaNayla', type: 'desk_pc', var: 'nayla', screen: '#2a5a86', c: 12, r: 7, w: 3, h: 2, title: 'MEJA PC-{{pc}} · ALYA',
        label: 'Periksa meja Alya' },
      { id: 'loker', type: 'lockers', c: 1, r: 5, w: 1, h: 1, tall: 14, spot: true, title: 'LOKER SISWA',
        look: 'Loker Fajar. Isinya piala juara 2 dan foto Alya memegang piala juara 1 — wajahnya dicoret spidol. Kesal, tapi cuma itu.',
        fact: 'rianIri',
        spotText: 'Di rak atas loker, terselip kertas:' },
      { id: 'printer', type: 'printer', c: 18, r: 6, w: 2, h: 1, tall: 10, spot: true, title: 'PRINTER LAB',
        look: 'Baki kertasnya kosong. Log cetak hari ini cuma tugas siswa sore tadi.',
        spotText: 'Di baki keluaran, satu lembar tertinggal:' },
      { id: 'kabel', type: 'cable', c: 15, r: 8, w: 2, h: 1, solid: false, title: 'KABEL LAN',
        look: 'Kabel LAN dari meja PC-{{pc}} (meja Alya) tercabut paksa sampai colokannya patah. Ada yang ingin laptopnya putus dari jaringan.' },
      { id: 'pot', type: 'plant', c: 1, r: 11, w: 1, h: 1, tall: 12, title: 'POT TANAMAN', label: 'Periksa pot' },
      { id: 'dispenser', type: 'dispenser', c: 19, r: 10, w: 1, h: 1, tall: 14, title: 'DISPENSER',
        look: 'Galon hampir habis. Gelas plastik Alya masih di atasnya, setengah penuh.' },
      { id: 'sampah', type: 'bin', c: 17, r: 11, w: 1, h: 1, spot: true, title: 'TEMPAT SAMPAH',
        look: 'Bungkus snack dan gelas plastik. Tidak ada yang berguna.',
        spotText: 'Di antara bungkus snack, ada kertas yang sengaja diremas kecil:' },

      /* ---- ruang teknisi ---- */
      { id: 'kalender', type: 'calendar', c: 22, r: 0, w: 2, h: 2, wall: true, title: 'KALENDER', fact: 'kalender',
        look: 'Kalender dinding teknisi. Tanggal hari ini dilingkari merah tebal, dengan tulisan kecil: <b>"KIRIM — K."</b>' },
      { id: 'mejaDedi', type: 'desk_pc', screen: '#5a2a2a', c: 24, r: 2, w: 3, h: 2, title: 'MEJA PAK RUDI', label: 'Periksa meja Pak Rudi' },
      { id: 'rakAlat', type: 'toolshelf', c: 28, r: 2, w: 2, h: 1, tall: 16, title: 'RAK PERKAKAS',
        look: 'Obeng, tang crimping, gulungan kabel. Satu gembok baru masih di bungkusnya — kembaran gembok di pintu gudang.' },
      { id: 'jaket', type: 'coatrack', c: 30, r: 4, w: 1, h: 1, tall: 10, col: '#262c36', title: 'GANTUNGAN JAKET', fact: 'jaketBasah',
        look: 'Jaket gelap tergantung di sini — <b>masih basah kuyup</b>. Padahal Pak Rudi bilang pulang jam sembilan, sebelum hujan turun.' },
      { id: 'printerT', type: 'printer', c: 24, r: 6, w: 2, h: 1, tall: 10, title: 'PRINTER TEKNISI', fact: 'printer',
        look: 'Printernya masih hangat. Log cetak: <b>240 lembar, 23.20–23.38</b>. Di nampan tertinggal satu halaman bertuliskan "SOAL UAS — RAHASIA".' },
      { id: 'kardusT', type: 'box', stack: 2, c: 21, r: 6, w: 1, h: 1, title: 'KARDUS KERTAS',
        look: 'Kardus kertas HVS. Tiga rim sudah dibuka malam ini.' },

      /* ---- gudang ---- */
      { id: 'rakGudang', type: 'shelf_store', c: 21, r: 8, w: 2, h: 1, tall: 14, title: 'RAK ALAT KEBERSIHAN',
        look: 'Cairan pembersih, sikat, kain lap. Rapi — Pak Udin yang merawatnya.' },
      { id: 'mop', type: 'mop', c: 24, r: 8, w: 1, h: 1, title: 'EMBER & PEL', look: 'Ember dan pel. Kering.' },
      { id: 'kardusG', type: 'box', stack: 2, c: 28, r: 8, w: 2, h: 1, title: 'TUMPUKAN KARDUS',
        look: 'Kardus-kardus bekas. Di lantai dekatnya ada bekas duduk — dan bungkus permen milik Alya.' },

      /* ---- koridor ---- */
      { id: 'papanInfo', type: 'noticeboard', c: 3, r: 12, w: 2, h: 1, wall: true, title: 'PAPAN INFORMASI',
        look: '"Lab ditutup pukul 22.00. Kunci lab, ruang teknisi, dan gudang dipegang teknisi."' },
      { id: 'signLab', type: 'sign', text: 'LAB 2', c: 11, r: 12, w: 2, h: 1, wall: true, decor: true },
      { id: 'cctvCam', type: 'cctv', c: 13, r: 12, w: 1, h: 1, wall: true, title: 'KAMERA CAM 02',
        look: 'Kamera CAM 02. Lensanya mengarah tepat ke pintu lab. Dari sinilah rekaman 23.47 itu berasal.' },
      { id: 'bangku', type: 'bench', var: 'umbrella', c: 15, r: 13, w: 2, h: 1, title: 'BANGKU KORIDOR',
        look: 'Bangku koridor. Ada payung hitam basah tersandar — milik Pak Surya.' },
      { id: 'extC', type: 'ext_wall', c: 20, r: 12, w: 1, h: 1, wall: true, decor: true },
      { id: 'signGudang', type: 'sign', text: 'GUDANG', c: 23, r: 12, w: 2, h: 1, wall: true, decor: true },
      { id: 'potC', type: 'plant', c: 30, r: 13, w: 1, h: 1, tall: 12, title: 'POT KORIDOR',
        look: 'Pot plastik. Tanahnya kering dan keras, tidak pernah digeser.' }
    ],
    npcs: [
      { id: 'joko', ch: 'joko', c: 6, r: 14, dir: 'down' },
      { id: 'naylaNpc', ch: 'nayla', c: 27, r: 10, dir: 'left', when: function (G) { return G.flag('rescued'); } }
    ],
    facts: {
      kartu: 'Kartu akses <b>teknisi</b> (Pak Rudi) tap masuk gedung pukul <b>23.40</b>.',
      pulang21: 'Pak Rudi pamit pulang pukul 21.00, sebelum hujan turun.',
      siswaPulang: 'Fajar dan Citra keluar gerbang bersama pukul 22.00 (Pak Darto).',
      pc17: 'Meja Alya berlabel <b>PC-{{pc}}</b>. Pesannya diketik pukul 23.45.',
      catatanPot: 'Catatan Alya: kode laci Pak Rudi diawali <b>{{pre1}}-{{pre2}}</b>, dua angka akhirnya = nomor PC Alya.',
      folderUAS: 'Komputer Pak Rudi: folder <b>UAS_2026_FINAL</b> disalin pukul 23.18.',
      printer: 'Printer teknisi masih hangat: <b>240 lembar</b> dicetak 23.20–23.38. Ada halaman "SOAL UAS".',
      jaketBasah: 'Jaket Pak Rudi di ruang teknisi masih <b>basah kuyup</b> — dia ada di sini saat hujan.',
      kalender: 'Kalender teknisi: hari ini dilingkari — "KIRIM — K."',
      flashdisk: 'Laci Pak Rudi: flashdisk "UAS" berisi salinan soal ujian satu sekolah.',
      rianIri: 'Fajar iri pada Alya: foto Alya di lokernya dicoret spidol, namanya sendiri dicoret dari poster lomba.',
      citraKembali: 'Citra kembali ke gerbang pukul <b>22.40</b> menanyakan Alya, tapi tidak dibukakan dan kartunya tidak tercatat masuk.',
      nayla: 'Alya: melihat Pak Rudi menyalin soal UAS, lalu dikunci di gudang. Tas besar itu berisi lembar soal. Pelaku menelepon "Pak K".'
    },
    steps: [
      { label: 'Tanyai Pak Darto di koridor', go: 'joko', done: function (G) { return G.knows('kartu'); },
        hint: 'Pak Darto berdiri di koridor, dekat pintu lab. Dekati dan tekan E.' },
      { label: 'Periksa meja Alya', go: 'mejaNayla', done: function (G) { return G.found('msg'); },
        hint: 'Posisi meja Alya berbeda tiap penyelidikan. Cari meja PC dengan kursi merah marun dan tas yang masih tergantung.' },
      { label: 'Kumpulkan kunci sandi', keys: true, done: function (G) { return G.allKeys(); },
        hint: 'Sobekan kunci terselip di barang-barang lab: papan tulis, rak, printer, loker, tempat sampah, atau meja-meja PC. Periksa satu per satu.' },
      { label: 'Buka sandi dengan ALAT (tombol T)', done: function (G) { return G.decrypted(); },
        hint: 'Tekan T. Gabungkan dulu fungsinya jadi satu: (f∘g)(x) = f(g(x)). Lalu masukkan tiap angka sandi ke fungsi itu, ubah hasilnya ke huruf (A=1 … Z=26).' },
      { label: 'Ikuti isi pesan Alya', go: 'pot', done: function (G) { return G.flag('potMoved'); },
        hint: 'Pesannya menyebut pot. Satu-satunya pot di lab ada di pojok kiri bawah.' },
      { label: 'Masuk ke Ruang Teknisi', go: 'dTeknisi', done: function (G) { return G.doorOpen('dTeknisi'); },
        hint: 'Pintu ruang teknisi ada di dinding kanan lab. Kunci dari bawah pot membukanya.' },
      { label: 'Buka laci Pak Rudi', go: 'mejaDedi', done: function (G) { return G.flag('laci'); },
        hint: 'Kodenya empat angka: dua angka dari catatan Alya di bawah pot, lalu nomor PC Alya. Buka CATATAN (N) kalau lupa.' },
      { label: 'Buka gudang di koridor', go: 'dGudang', done: function (G) { return G.flag('rescued'); },
        hint: 'Gudang ada di koridor, di bawah tulisan GUDANG. Pakai kunci dari laci Pak Rudi.' }
    ],
    handlers: {
      joko: function (G) {
        if (!G.knows('kartu')) {
          G.say([
            ['joko', 'Pak Detektif. Saya jaga di sini dari tadi. Tidak ada yang lewat lagi sejak rekaman itu.'],
            ['arsa', 'Pak Darto, siapa yang terakhir masuk gedung malam ini?'],
            ['joko', 'Mesin kartu cuma mencatat satu tap masuk: pukul <b>23.40</b>. Kartu teknisi — kartunya Pak Rudi.'],
            ['joko', 'Padahal Pak Rudi pamit pulang jam sembilan. Saya lihat sendiri motornya keluar. Hujan belum turun waktu itu.', 'worried'],
            ['joko', 'Fajar sama Citra keluar gerbang jam sepuluh, bareng. Saya yang bukakan.'],
            ['joko', 'Eh, tapi jam sebelas kurang dua puluh Citra balik lagi ke gerbang, Pak. Nanya-nanya Alya sudah pulang belum. Gelisah sekali anaknya.', 'worried'],
            ['joko', 'Saya tidak bukakan — sudah lewat jam malam. Dia pulang lagi naik ojek. Kartunya juga tidak tercatat masuk.'],
            ['arsa', 'Kalau Pak Rudi pulang sebelum hujan, apa pun yang basah di ruangannya sekarang... itu baru.']
          ], function () { G.fact('kartu'); G.fact('pulang21'); G.fact('siswaPulang'); G.fact('citraKembali'); });
        } else {
          G.say([['joko', 'Kartu teknisi tap masuk 23.40, Pak. Itu satu-satunya catatan masuk malam ini.']]);
        }
      },
      naylaNpc: function (G) {
        G.say([['nayla', 'Aku baik-baik saja, Detektif. Selesaikan ini — aku tunggu di pos satpam sama Pak Surya.', 'happy']]);
      },
      mejaNayla: function (G, P) {
        if (!G.found('msg')) {
          G.fact('pc17');
          G.reveal('msg', P, 'Laptop Alya masih menyala, kabel LAN-nya tercabut paksa. Tasnya masih tergantung di kursi. ' +
            'Label di meja: <b>PC-{{pc}}</b>. Di layar ada satu file, <b>untuk_yang_menemukan.txt</b>, diketik pukul 23.45:');
        } else {
          G.look(P.title, 'Laptop Alya, meja <b>PC-{{pc}}</b>. Pesannya diketik pukul 23.45 — dua menit sebelum tas besar itu keluar.');
        }
      },
      pot: function (G, P) {
        if (G.flag('potMoved')) { G.look(P.title, 'Pot sudah kamu geser. Bekasnya masih basah.'); return; }
        if (!G.decrypted()) {
          G.look(P.title, 'Pot besar berisi tanah basah. Agak bergeser dari bekas lingkaran di lantai... tapi belum ada alasan untuk membongkarnya.');
          return;
        }
        G.ask(P.title, 'Pesan Alya: <code>' + G.plain() + '</code><br>Pot ini satu-satunya pot di lab, dan posisinya agak miring.', [
          { label: 'Geser pot', primary: true, fn: function () {
            G.sfx('drag');
            G.anim(P, 'shift', 16, 0.8, function () {
              G.set('potMoved');
              P.st.keyTaken = true;
              G.give('kunciTeknisi');
              G.fact('catatanPot');
              G.look('DI BAWAH POT', 'Di bekas pot tersembunyi <b>kunci kecil berlabel "R. TEKNISI"</b> dan secarik kertas tulisan tangan Alya:' +
                note('"Aku lihat Pak Rudi membuka laci mejanya pakai kode 4 angka. Dua angka depannya <b>{{pre1}} {{pre2}}</b>. Dua angka belakangnya sama dengan nomor PC-ku."'));
            });
          } },
          { label: 'Nanti' }
        ]);
      },
      mejaDedi: function (G, P) {
        if (G.flag('laci')) { G.look(P.title, 'Laci sudah terbuka. Flashdisk dan kunci gudang sudah kamu amankan.'); return; }
        G.fact('folderUAS');
        G.ask(P.title, 'Monitor menampilkan folder <b>UAS_2026_FINAL</b> — disalin pukul 23.18. Laci bawahnya digembok kode 4 angka.', [
          { label: 'Coba kode', primary: true, fn: function () {
            G.code({ title: 'GEMBOK LACI', desc: 'Gembok kombinasi 4 angka di laci Pak Rudi.', answer: '{{kode}}',
              onOk: function () {
                G.set('laci'); G.give('kunciGudang'); G.fact('flashdisk');
                G.look('LACI TERBUKA', '<i>Klik.</i> Di dalam laci: <b>flashdisk berlabel "UAS"</b> berisi salinan soal ujian satu sekolah, ' +
                  'dan <b>kunci bergantungan "GUDANG"</b>.<br>Kenapa teknisi lab menyimpan kunci gudang di laci yang digembok?');
              } });
          } },
          { label: 'Tutup' }
        ]);
      }
    },
    onDoor: {
      dGudang: function (G) {
        G.scene('rescue', function () {
          G.set('rescued'); G.fact('nayla');
          G.toast('Alya ditemukan selamat');
        });
      }
    },
    /* Bank 12 pertanyaan — tiap main diambil 5 secara acak. Jawaban benar selalu a[0]. */
    deduce: [
      { q: 'Kartu akses siapa yang tercatat masuk gedung pukul 23.40?',
        a: ['Kartu teknisi milik Pak Rudi', 'Kartu siswa milik Fajar', 'Tidak ada — pintunya dibobol paksa'],
        why: 'Pak Darto: mesin kartu mencatat kartu teknisi tap masuk 23.40.' },
      { q: 'Di mana Alya selama ini?',
        a: ['Dikunci di gudang — tidak pernah keluar gedung', 'Dibawa keluar di dalam tas besar', 'Bersembunyi di rumah Citra'],
        why: 'Alya ditemukan di gudang yang digembok dari luar.' },
      { q: 'Apa isi tas besar yang dibawa keluar pukul 23.47?',
        a: ['240 lembar soal UAS yang baru dicetak', 'Laptop dan ponsel Alya', 'Alat-alat lab yang dicuri'],
        why: 'Printer teknisi mencetak 240 lembar pukul 23.20–23.38, dan Alya melihatnya.' },
      { q: 'Kenapa jaket Pak Rudi yang basah kuyup mencurigakan?',
        a: ['Dia mengaku pulang pukul 21.00, sebelum hujan turun', 'Jaket itu sebenarnya milik Fajar', 'Atap ruang teknisi bocor'],
        why: 'Pak Darto melihat Pak Rudi pulang sebelum hujan. Jaket basah berarti dia kembali saat hujan.' },
      { q: 'Siapa yang memegang kunci lab, ruang teknisi, dan gudang?',
        a: ['Teknisi lab — Pak Rudi', 'Pak Darto, satpam sekolah', 'Pak Surya, guru TKJ'],
        why: 'Papan informasi koridor: semua kunci itu dipegang teknisi.' },
      { q: 'Berapa nomor PC di meja Alya?',
        a: ['PC-{{pc}}', 'PC-{{pcX}}', 'PC-{{pcY}}'],
        why: 'Label di meja Alya: PC-{{pc}}.' },
      { q: 'Berapa kode gembok laci Pak Rudi?',
        a: ['{{kode}}', '{{kodeX}}', '{{kodeY}}'],
        why: 'Dua angka dari catatan Alya ({{pre}}) disambung nomor PC Alya ({{pc}}).' },
      { q: 'Fajar iri pada Alya. Kenapa dia tetap bukan pelakunya?',
        a: ['Ia keluar gerbang pukul 22.00 bersama Citra, dibenarkan Pak Darto', 'Ia memegang kunci gudang', 'Foto Alya di lokernya tidak dicoret'],
        why: 'Motif saja tidak cukup — Fajar sudah di luar gedung sebelum 23.40.' },
      { q: 'Citra kembali ke gerbang pukul 22.40. Kenapa itu tidak membuatnya bersalah?',
        a: ['Gerbang tidak dibukakan dan kartunya tidak tercatat masuk', 'Ia masuk lewat jendela lab', 'Ia memegang kartu teknisi'],
        why: 'Pak Darto tidak membukakan gerbang, dan mesin kartu hanya mencatat kartu teknisi pukul 23.40.' },
      { q: 'Kenapa kabel LAN laptop Alya dicabut paksa?',
        a: ['Supaya rekaman Alya tidak terkirim lewat jaringan', 'Kabelnya digigit tikus', 'Alya sendiri mencabutnya sebelum pulang'],
        why: 'Alya merekam diam-diam pakai laptop. Pelaku memutus jaringannya.' },
      { q: 'Kenapa kunci gudang disimpan di laci yang digembok?',
        a: ['Pak Rudi tidak ingin ada yang membuka gudang tempat Alya dikunci', 'Itu kunci cadangan biasa', 'Gudang menyimpan barang mahal'],
        why: 'Gembok gudang masih baru — kembarannya ada di rak perkakas Pak Rudi.' },
      { q: 'Siapa yang ditelepon pelaku setelah mengunci Alya?',
        a: ['Seseorang yang dipanggil "Pak K"', 'Pak Darto di pos satpam', 'Orang tua Alya'],
        why: 'Alya mendengar: "Beres, Pak K. Anak itu sudah saya urus."' }
    ],
    suspects: [
      { ch: 'dedi', alibi: 'Mengaku pulang pukul 21.00 dan tidak kembali.',
        note: 'Pemegang kunci lab, ruang teknisi, dan gudang. Gembok baru di pintu gudang punya kembaran di rak perkakasnya.' },
      { ch: 'rian', alibi: 'Keluar gerbang pukul 22.00 bersama Citra — dibenarkan Pak Darto.',
        note: 'Kalah dari Alya di seleksi lomba siber. Foto Alya di lokernya dicoret spidol, namanya dicoret dari poster lomba.' },
      { ch: 'sinta', alibi: 'Pulang bersama Fajar pukul 22.00. Kembali ke gerbang 22.40, tapi tidak dibukakan.',
        note: 'Orang terakhir yang mengobrol dengan Alya. Kembali ke sekolah malam-malam dengan gelisah menanyakan Alya.' }
    ],
    culprit: 'dedi',
    ending: {
      win: { title: 'Alya Selamat', text: 'Pak Rudi menyalin dan mencetak soal UAS malam itu, lalu mengunci Alya di gudang setelah ketahuan. Tas besar di rekaman CCTV berisi lembar soal — bukan Alya. Tapi Pak Rudi hanya kurir. Seseorang yang dipanggil "Pak K" masih bersembunyi di sekolah ini.' },
      lose: { title: 'Pelaku Lolos', text: 'Alibi orang yang kamu tuduh berdiri kokoh. Saat pagi tiba, Pak Rudi sudah naik bus pertama ke luar kota — bersama tas berisi soal ujian.' }
    },
    scenes: {
      intro: [
        { card: { kicker: 'KASUS 01', title: 'Rekaman 23.47', sub: 'SMK Bina Cipta · Kamis, 23.58' } },
        { bg: 'gate', actors: [{ ch: 'hendra', x: 400, y: 312, dir: 'left', umbrella: true }, { ch: 'arsa', x: -40, y: 318, to: 300, dur: 2.4, dir: 'right' }],
          lines: [
            [null, 'Hujan belum berhenti sejak magrib. Gerbang SMK Bina Cipta masih terbuka — dan itu sendiri sudah pertanda buruk.'],
            ['hendra', 'Detektif Bima? Terima kasih sudah datang selarut ini. Saya Surya, guru TKJ. Saya yang menelepon.'],
            ['arsa', 'Ceritakan dari awal, Pak.'],
            ['hendra', 'Alya Rahma, kelas XI PPLG 4. Dia izin lembur di Lab Komputer 2 untuk persiapan lomba keamanan siber. Sampai sekarang belum pulang. Ponselnya mati.', 'worried'],
            ['hendra', 'Tasnya masih di lab. Orang tuanya di ruang tunggu. Polisi bilang belum dua puluh empat jam...', 'worried'],
            ['arsa', 'Dua puluh empat jam terlalu lama. Ada rekaman CCTV?']
          ] },
        { bg: 'secroom', actors: [{ ch: 'joko', x: 210, y: 320, dir: 'right' }, { ch: 'arsa', x: 420, y: 322, dir: 'left' }],
          lines: [['joko', 'Ini kamera koridor lantai dua, Pak. Sudah saya putar ulang sepuluh kali.']] },
        { bg: 'cctv', cctv: { cam: 'CAM 02', loc: 'KORIDOR LT.2', door: 'LAB 2',
            script: [{ t: 0, clock: '23:41:02' }, { t: 0.3, fig: 'in' }, { t: 4.2, clock: '23:47:13' }, { t: 4.4, fig: 'out', carry: 'bag' }] },
          lines: [
            [null, '<b>23.41</b> — sosok berjaket gelap masuk Lab Komputer 2. Tangannya kosong.', null, 0],
            [null, '<b>23.47</b> — sosok yang sama keluar memikul tas besar. Berat. Langkahnya terburu-buru.', null, 4.2],
            ['joko', 'Setelah itu tidak ada lagi yang keluar dari lab, Pak. Termasuk Alya.', 'worried']
          ] },
        { bg: 'secroom', actors: [{ ch: 'joko', x: 210, y: 320, dir: 'right' }, { ch: 'hendra', x: 330, y: 322, dir: 'down' }, { ch: 'arsa', x: 450, y: 322, dir: 'left' }],
          lines: [
            ['arsa', 'Siapa saja yang masih di gedung malam ini?'],
            ['joko', 'Menurut buku jaga: Pak Rudi, teknisi lab. Lalu dua murid, Fajar dan Citra. Tapi semuanya sudah pamit pulang.'],
            ['hendra', 'Satu hal lagi, Detektif. Alya itu murid terbaik saya soal kriptografi. Kalau dia sempat meninggalkan pesan...'],
            ['arsa', '...pasti dia enkripsi, supaya hanya orang yang tepat yang bisa membacanya. Baik. Aku yang akan membacanya.'],
            ['hendra', 'Saya pegang HT ini. Kalau buntu, panggil saya — tombol <b>H</b>.']
          ] }
      ],
      rescue: [
        { bg: 'storage', actors: [{ ch: 'nayla', x: 410, y: 318, dir: 'left', sit: true }, { ch: 'arsa', x: 120, y: 322, to: 250, dur: 1.6, dir: 'right' }],
          lines: [
            [null, 'Gembok terlepas. Pintu gudang berderit terbuka, dan senter menyapu rak-rak pel dan ember...'],
            ['nayla', 'Si-siapa itu?! ...Tolong!', 'worried'],
            ['arsa', 'Tenang. Namaku Bima, detektif. Pak Surya yang memanggilku. Kamu terluka?'],
            ['nayla', 'Nggak... cuma kedinginan. Aku dikunci di sini dari sebelum tengah malam.', 'worried'],
            ['nayla', 'Aku lihat Pak Rudi menyalin soal UAS dari server, lalu mencetaknya. Aku merekam diam-diam pakai laptop... tapi dia sadar.'],
            ['nayla', 'Dia ambil ponselku dan mengunciku di sini. Tas besar yang dia bawa keluar itu isinya lembar soal.'],
            ['arsa', 'Jadi semua orang mengira kamu dibawa keluar dalam tas itu. Padahal kamu tidak pernah meninggalkan gedung.'],
            ['nayla', 'Satu lagi. Waktu menelepon, dia bilang: <i>"Beres, Pak K. Anak itu sudah saya urus."</i>', 'worried'],
            ['arsa', '"Pak K"... Simpan itu baik-baik. Sekarang biar aku yang menyelesaikan sisanya.']
          ] }
      ],
      win: [
        { bg: 'interro', actors: [{ ch: 'dedi', x: 400, y: 300, dir: 'down', sit: true }, { ch: 'arsa', x: 200, y: 322, dir: 'right' }],
          lines: [
            [null, 'Flashdisk berisi soal ujian. Kartu teknisi tap 23.40. Jaket basah. Dan saksi mata yang baru saja diselamatkan.'],
            ['arsa', 'Anda bilang pulang pukul sembilan, Pak Rudi. Tapi jaket Anda basah kuyup, dan Alya melihat wajah Anda.'],
            ['dedi', '...Saya tidak berniat menyakiti anak itu. Saya panik. Saya cuma ingin dia diam sampai pagi.', 'worried'],
            ['dedi', 'Soal-soal itu... saya hanya mengantarkan. Ada yang membayar, ada yang mengatur. Saya cuma kurir.'],
            ['arsa', 'Siapa yang mengatur?'],
            ['dedi', 'Saya tidak pernah lihat wajahnya. Dia selalu menelepon dari nomor yang berbeda. Kami memanggilnya... <b>Pak K</b>.', 'worried']
          ] },
        { bg: 'gate', sky: 'dawn', actors: [{ ch: 'hendra', x: 380, y: 312, dir: 'left' }, { ch: 'arsa', x: 270, y: 318, dir: 'right' }],
          lines: [
            [null, 'Subuh. Hujan akhirnya reda.'],
            ['hendra', 'Alya selamat, Detektif. Saya tidak tahu bagaimana harus berterima kasih.', 'happy'],
            ['arsa', 'Belum selesai, Pak. Rudi hanya kurir. Ada "Pak K" di atasnya — dan dia masih di sekolah ini.'],
            ['hendra', 'Kalau begitu... saya akan bantu sebisa saya.'],
            [null, 'Pak Surya tersenyum. Entah kenapa, senyum itu terasa terlalu tenang.']
          ] },
        { card: { kicker: 'BERSAMBUNG', title: 'Kasus 02 terbuka', sub: 'Kopi Terakhir Bu Dewi' } }
      ],
      lose: [
        { bg: 'interro', actors: [{ ch: 'arsa', x: 200, y: 322, dir: 'right' }],
          lines: [
            [null, 'Alibi orang yang kamu tuduh berdiri kokoh: saksi, jam, dan rekaman gerbang.'],
            [null, 'Sementara itu, di terminal bus, Pak Rudi naik bus pertama ke luar kota — bersama tas berisi soal ujian.'],
            [null, 'Alya selamat. Tapi orang yang menyekapnya lolos.']
          ] }
      ]
    }
  };

  /* =========================================================
     KASUS 02 — KOPI TERAKHIR BU DEWI
     ========================================================= */
  var SIGS = [
    { name: 'Dra. Endang S.', ink: '#1b1b1f', path: 'M6 30 C 20 6, 30 40, 44 18 S 70 26, 84 14 L 96 28' },
    { name: 'Bu Rina M.', ink: '#1b1b1f', path: 'M8 26 Q 22 4, 30 26 T 54 22 Q 68 10, 76 28 L 94 18' },
    { name: 'G. Saputro', ink: '#22389a', path: 'M6 24 C 16 2, 26 36, 40 16 C 50 4, 60 34, 74 18 C 82 10, 90 22, 96 20', forged: true },
    { name: 'Pak Surya K.', ink: '#1b1b1f', path: 'M6 28 L 20 10 L 30 28 C 40 8, 56 30, 66 14 Q 80 4, 94 26' },
    { name: 'Pak Agus T.', ink: '#1b1b1f', path: 'M8 18 Q 18 34, 30 16 Q 42 2, 52 24 L 64 12 C 74 30, 86 6, 96 22' }
  ];
  function sigHtml(s) {
    return '<svg viewBox="0 0 100 40" class="sig"><path d="' + s.path + '" fill="none" stroke="' + s.ink +
      '" stroke-width="2.2" stroke-linecap="round"/></svg><span class="sig-name">' + s.name + '</span>' +
      '<span class="sig-time">' + (s.forged ? 'hadir s/d 17.00' : 'hadir s/d 17.00') + '</span>';
  }

  var C2 = {
    id: 'c2', no: 'KASUS 02', title: 'Kopi Terakhir Bu Dewi', crime: 'Percobaan pembunuhan',
    place: 'Ruang Guru', when: 'Jumat, 17.10',
    blurb: 'Bu Dewi, guru matematika yang membantu Alya, ditemukan tak sadarkan diri di mejanya. ' +
           'Ada zat berbahaya di kopinya — dan sebuah sandi di tangannya.',
    radio: 'hendra',
    plain: 'KODE BRANKAS ADA DI JAM',
    mode: 'invers',
    /* Tiap main baru: menit jam meja yang berhenti (dan kode brankas) diacak. */
    vars: function (R) {
      var m = R.int(39, 46), V = {};
      V.jam = '16:' + m; V.jamT = '16.' + m; V.kodeJam = '16' + m;
      var f = R.int(39, 46); if (f === m) f = m === 46 ? 39 : m + 1;
      V.kodeFake = '16' + f;
      return V;
    },
    time: { easy: 720, normal: 600, hard: 480 },
    sky: 'dusk', dark: 0.3, wall: 'cream',
    themes: { '.': 'wood', ',': 'pantry', ';': 'carpet' },
    map: [
      '################################',
      '################################',
      '#,,,,,,,,,#....................#',
      '#,,,,,,,,,#....................#',
      '#,,,,,,,,,#....................#',
      '#,,,,,,,,,D....................#',
      '#,,,,,,,,,#....................#',
      '###########....................#',
      '#;;;;;;;;;#....................#',
      '#;;;;;;;;;#....................#',
      '#;;;;;;;;;L....................#',
      '#;;;;;;;;;#....................#',
      '#;;;;;;;;;#....................#',
      '#;;;;;;;;;#....................#',
      '####################DD##########',
      '################################'
    ],
    spawn: { c: 20, r: 13, dir: 'up' },
    rooms: [
      { name: 'RUANG GURU', c0: 11, r0: 2, c1: 30, r1: 14 },
      { name: 'PANTRY', c0: 1, r0: 2, c1: 9, r1: 6 },
      { name: 'RUANG WAKASEK', c0: 1, r0: 8, c1: 9, r1: 13 }
    ],
    lights: [
      { c: 14, r: 4, rad: 80 }, { c: 24, r: 5, rad: 85 }, { c: 18, r: 10, rad: 80 }, { c: 27, r: 10, rad: 70 },
      { c: 5, r: 4, rad: 60 }, { c: 5, r: 11, rad: 55 }
    ],
    doors: [
      { id: 'dWakasek', c: 10, r: 10, item: 'kunciWakasek', name: 'PINTU RUANG WAKASEK',
        locked: 'Pintu kayu berpelat "WAKASEK KURIKULUM — GUNAWAN SAPUTRO". Terkunci.',
        opened: 'Kunci dari brankas Bu Dewi pas di lubangnya. Kenapa Bu Dewi punya kunci ruangan ini?' }
    ],
    items: { kunciWakasek: 'Kunci R. Wakasek' },
    props: [
      /* ---- ruang guru: dinding atas ---- */
      { id: 'papanJadwal', type: 'whiteboard', c: 12, r: 0, w: 4, h: 2, wall: true, title: 'PAPAN JADWAL', fact: 'jadwalRapat',
        lines: ['RAPAT KUR.', '15.00-17.00'],
        look: 'Jadwal hari ini: <b>Rapat Kurikulum, 15.00–17.00, dipimpin Pak Gunawan</b>. Di bawahnya: "Bu Dewi — tolong bawa data nilai XII".' },
      { id: 'jendela1', type: 'window', c: 17, r: 0, w: 2, h: 2, wall: true, title: 'JENDELA',
        look: 'Langit sore memerah. Jendela terkunci; kuncinya di dalam.' },
      { id: 'papanPengumuman', type: 'corkboard', c: 20, r: 0, w: 2, h: 2, wall: true, spot: true, title: 'PAPAN PENGUMUMAN',
        look: 'Jadwal piket dan edaran ujian. Satu edaran: "Kunci jawaban UAS hanya dipegang Wakasek Kurikulum".',
        spotText: 'Di balik selebaran ujian, ditusuk paku payung:' },
      { id: 'jendela2', type: 'window', c: 24, r: 0, w: 2, h: 2, wall: true, title: 'JENDELA',
        look: 'Dari sini kelihatan lapangan futsal. Anak-anak masih latihan.' },
      { id: 'jamDinding', type: 'clock_wall', c: 27, r: 0, w: 1, h: 2, wall: true, title: 'JAM DINDING',
        look: 'Jam dinding menunjukkan 17.24 dan berjalan normal. Bukan jam ini yang dicari.' },
      /* ---- meja-meja guru ---- */
      { id: 'mejaRatna', type: 'desk', var: 'laptop', mug: '#7a2e3e', c: 12, r: 3, w: 3, h: 2, title: 'MEJA BU DEWI', label: 'Periksa meja Bu Dewi' },
      { id: 'jamMeja', type: 'desk_clock', c: 15, r: 4, w: 1, h: 1, solid: false, title: 'JAM MEJA', label: 'Periksa jam di lantai' },
      { id: 'mejaWulan', type: 'desk', c: 17, r: 3, w: 3, h: 2, mug: '#3f6fa8', spot: true, title: 'MEJA BU RINA (BK)', fact: 'wulanJadwal', fact2: 'rinaDebat',
        look: 'Map konseling tersusun rapi. Agenda hari ini: <b>"16.00–17.00 — konseling wali murid X-3, ruang BK"</b>.<br>' +
              'Di bawahnya ada <b>draf surat keberatan</b> untuk Bu Dewi, bertanggal hari ini: <i>"...saya tidak terima dipermalukan di depan siswa."</i>',
        spotText: 'Di antara map konseling, terselip satu kertas yang bukan milik Bu Rina:' },
      { id: 'mejaHendra', type: 'desk', var: 'frame', c: 12, r: 7, w: 3, h: 2, mug: '#2a2a2a', spot: true, title: 'MEJA PAK SURYA',
        look: 'Rapi sekali. Terlalu rapi. Hanya ada bingkai foto dan gelas pensil. Kalender mejanya polos tanpa satu coretan pun.',
        spotText: 'Di bawah bingkai foto, entah kenapa, ada sobekan kertas:' },
      { id: 'mejaGuru', type: 'desk', c: 17, r: 7, w: 3, h: 2, spot: true, title: 'MEJA GURU',
        look: 'Meja guru Bahasa Inggris. Tumpukan esai belum dinilai.',
        spotText: 'Di sela tumpukan esai:' },
      { id: 'mejaRapat', type: 'meeting_table', c: 22, r: 5, w: 5, h: 2, title: 'MEJA RAPAT', label: 'Periksa daftar hadir rapat' },
      { id: 'brankas', type: 'safe', c: 29, r: 2, w: 2, h: 1, tall: 12, title: 'BRANKAS BU DEWI', label: 'Buka brankas' },
      { id: 'lemariArsip', type: 'cabinet', c: 29, r: 6, w: 2, h: 1, tall: 12, spot: true, title: 'LEMARI ARSIP',
        look: 'Arsip nilai per angkatan. Map kelas XII-nya hilang — tinggal gantungannya. Di lembar rekap yang tersisa: nilai <b>Dimas Arya</b> naik dari <b>54 ke 88</b> dalam semalam.',
        fact: 'dimasNilai',
        spotText: 'Di laci paling bawah, di balik gantungan map yang kosong:' },
      { id: 'dispenser', type: 'dispenser', c: 30, r: 9, w: 1, h: 1, tall: 14, title: 'DISPENSER',
        look: 'Galon penuh. Bu Dewi tidak pernah minum dari sini — dia selalu bikin kopi sendiri di pantry.' },
      { id: 'printer', type: 'printer', c: 27, r: 11, w: 2, h: 1, tall: 10, spot: true, title: 'PRINTER',
        look: 'Antrean cetak kosong. Hari ini tidak ada yang mencetak nilai.',
        spotText: 'Di baki keluaran, tertindih kertas bekas:' },
      { id: 'sofa', type: 'sofa', col: '#5a3b4a', c: 23, r: 12, w: 3, h: 1, tall: 4, title: 'SOFA TAMU',
        look: 'Sofa tamu. Bantalnya penyok — Pak Udin sempat duduk di sini menunggu ambulans.' },
      { id: 'rakBuku', type: 'bookshelf', c: 12, r: 11, w: 2, h: 1, tall: 14, spot: true, title: 'RAK BUKU',
        look: 'Buku paket matematika. Di punggung salah satunya ada tulisan Bu Dewi: "Invers = membalik langkah. Kurangi dulu, baru bagi."',
        spotText: 'Terselip di antara buku paket:' },
      { id: 'sampahGuru', type: 'bin', c: 16, r: 12, w: 1, h: 1, spot: true, title: 'TEMPAT SAMPAH',
        look: 'Kertas koreksian dan bungkus permen. Tidak ada yang mencurigakan.',
        spotText: 'Di dasar tempat sampah, terlipat rapi:' },
      { id: 'rug', type: 'rug', col: '#3a4a6a', c: 19, r: 9, w: 4, h: 2, solid: false, decor: true, floor: true },
      { id: 'pintuKeluar', type: 'hidden', c: 20, r: 14, w: 2, h: 1, solid: false, title: 'PINTU KELUAR', label: 'Pintu keluar',
        look: 'Belum saatnya pergi. Bu Dewi butuh jawaban.' },

      /* ---- pantry ---- */
      { id: 'konter', type: 'counter', c: 1, r: 2, w: 4, h: 1, tall: 6, title: 'WASTAFEL',
        look: 'Wastafel kering. Tidak ada cangkir yang dicuci sore ini.' },
      { id: 'kulkas', type: 'fridge', c: 6, r: 2, w: 1, h: 1, tall: 14, title: 'KULKAS',
        look: 'Susu kotak, es batu, bekal seseorang. Tidak ada yang aneh.' },
      { id: 'rakPiring', type: 'dishrack', c: 7, r: 2, w: 2, h: 1, title: 'RAK PIRING',
        look: 'Rak piring. Satu slot cangkir kosong — cangkir motif bunga milik Bu Dewi.' },
      { id: 'mejaKopi', type: 'coffee_table', c: 3, r: 5, w: 2, h: 1, tall: 4, title: 'MEJA KOPI', fact: 'duaCangkir',
        look: 'Nampan dengan <b>dua cangkir</b>. Satu kosong. Cangkir motif bunga milik Bu Dewi masih menyisakan <b>endapan putih</b> di dasarnya, berbau pahit — bukan kopi.' },
      { id: 'sampahPantry', type: 'bin', col: '#5a5f6a', c: 8, r: 6, w: 1, h: 1, title: 'SAMPAH PANTRY', fact: 'stripObat',
        look: 'Di bawah tisu bekas: <b>strip obat tidur</b>, empat butir sudah dikeluarkan. Label apotek: pasien <b>G. Saputro</b>.' },

      /* ---- ruang wakasek ---- */
      { id: 'mejaBram', type: 'exec_desk', c: 3, r: 9, w: 4, h: 2, title: 'MEJA PAK GUNAWAN', label: 'Periksa komputer Pak Gunawan' },
      { id: 'lemariBram', type: 'cabinet', col: '#5a4030', inside: '#3f6fa8', c: 1, r: 12, w: 2, h: 1, tall: 12, title: 'LEMARI PAK GUNAWAN', label: 'Geledah lemari' },
      { id: 'piala', type: 'trophy', c: 6, r: 8, w: 2, h: 1, tall: 14, title: 'LEMARI PIALA',
        look: 'Piala "Sekolah Berprestasi" tiga tahun berturut-turut. Nilai ujian sekolah ini naik tajam sejak Pak Gunawan menjabat.' },
      { id: 'gantungan', type: 'coatrack', c: 9, r: 8, w: 1, h: 1, tall: 10, col: '#4a4f5c', title: 'GANTUNGAN JAS', fact: 'masker',
        look: 'Jas abu-abu Pak Gunawan. Di sakunya: <b>masker hitam</b> — sama seperti yang dipakai sosok di CCTV pukul 16.38.' },
      { id: 'sofaW', type: 'sofa', col: '#2e3a4f', c: 6, r: 13, w: 3, h: 1, tall: 4, title: 'SOFA', look: 'Sofa kulit. Dingin.' }
    ],
    npcs: [
      { id: 'slamet', ch: 'slamet', c: 18, r: 12, dir: 'down' },
      { id: 'naylaNpc', ch: 'nayla', c: 26, r: 9, dir: 'left' }
    ],
    facts: {
      slamet: 'Pak Udin menemukan Bu Dewi pukul <b>16.50</b>. Di pantry ada dua cangkir.',
      bramKeluar: 'Pak Udin melihat Pak Gunawan keluar dari ruangannya sendiri sekitar 16.15 — bukan dari ruang rapat.',
      naylaNilai: 'Alya: Bu Dewi menemukan nilai yang berubah sendiri di sistem dan akan melapor hari Senin.',
      jadwalRapat: 'Rapat Kurikulum dijadwalkan 15.00–17.00, dipimpin Pak Gunawan.',
      cangkirHilang: 'Di meja Bu Dewi ada bekas lingkaran cangkir — cangkirnya dibawa pergi.',
      jam1642: 'Jam meja Bu Dewi jatuh ke lantai dan berhenti di <b>{{jam}}</b>.',
      wulanJadwal: 'Agenda Bu Rina: konseling wali murid X-3, 16.00–17.00, di ruang BK.',
      rinaDebat: 'Bu Rina bertengkar dengan Bu Dewi pagi tadi; draf surat keberatannya ada di meja.',
      dimasNilai: 'Nilai matematika <b>Dimas Arya</b> naik dari 54 ke 88 dalam semalam.',
      dimasLewat: 'Pak Udin melihat Dimas mondar-mandir di depan ruang guru sekitar 16.30.',
      catatanRatna: 'Catatan Bu Dewi: 12 nilai kelas XII diubah lewat akun <b>gunawan.s</b>. Berkas asli ada di map biru.',
      ttdPalsu: 'Tanda tangan "G. Saputro" memakai <b>tinta biru</b>, lainnya hitam. Notulen: Pak Gunawan izin keluar rapat pukul 16.10.',
      duaCangkir: 'Pantry: dua cangkir. Cangkir Bu Dewi menyisakan endapan putih berbau pahit.',
      stripObat: 'Sampah pantry: strip obat tidur atas nama pasien <b>G. Saputro</b>.',
      logNilai: 'Komputer Pak Gunawan: 16.20 — 12 nilai kelas XII diubah lewat akun gunawan.s.',
      pesanK: 'Pesan masuk di komputer Pak Gunawan dari kontak "K": "Sudah beres?"',
      masker: 'Saku jas Pak Gunawan: masker hitam seperti sosok CCTV pukul 16.38.',
      mapBiru: 'Lemari Pak Gunawan: map biru berisi berkas nilai asli + botol kecil tanpa label.'
    },
    steps: [
      { label: 'Tanyai Pak Udin', go: 'slamet', done: function (G) { return G.knows('slamet'); },
        hint: 'Pak Udin berdiri di dekat pintu masuk ruang guru. Dia yang pertama menemukan Bu Dewi.' },
      { label: 'Periksa meja Bu Dewi', go: 'mejaRatna', done: function (G) { return G.found('msg'); },
        hint: 'Meja Bu Dewi di baris depan, ada laptop dan cangkir merah marun.' },
      { label: 'Kumpulkan kunci sandi', keys: true, done: function (G) { return G.allKeys(); },
        hint: 'Sobekan kunci tersebar di meja-meja guru, rak buku, printer, lemari arsip, papan pengumuman, atau tempat sampah.' },
      { label: 'Buka sandi dengan ALAT (tombol T)', done: function (G) { return G.decrypted(); },
        hint: 'Tekan T. Angka sandi = f(huruf). Cari inversnya: f⁻¹(x) = (x − b) ÷ a, lalu hitung tiap angka jadi huruf (A=1 … Z=26).' },
      { label: 'Temukan angka "jam" yang dimaksud', go: 'jamMeja', done: function (G) { return G.knows('jam1642'); },
        hint: 'Bukan jam dinding yang masih berjalan. Cari jam yang berhenti — lihat lantai di sebelah meja Bu Dewi.' },
      { label: 'Buka brankas Bu Dewi', go: 'brankas', done: function (G) { return G.flag('brankas'); },
        hint: 'Brankas di pojok kanan atas. Kodenya angka di jam yang berhenti, tanpa titik dua.' },
      { label: 'Periksa meja kopi di pantry', go: 'mejaKopi', done: function (G) { return G.knows('duaCangkir'); },
        hint: 'Pantry ada di kiri atas, lewat pintu di dinding kiri ruang guru.' },
      { label: 'Periksa daftar hadir rapat', go: 'mejaRapat', done: function (G) { return G.knows('ttdPalsu'); },
        hint: 'Daftar hadir ada di meja rapat. Perhatikan warna tinta tiap tanda tangan.' },
      { label: 'Masuk ke Ruang Wakasek', go: 'dWakasek', done: function (G) { return G.doorOpen('dWakasek'); },
        hint: 'Pintu Ruang Wakasek di dinding kiri, bawah pantry. Kuncinya ada di brankas Bu Dewi.' },
      { label: 'Geledah lemari Pak Gunawan', go: 'lemariBram', done: function (G) { return G.flag('mapBiru'); },
        hint: 'Lemari di pojok kiri bawah Ruang Wakasek.' }
    ],
    handlers: {
      slamet: function (G) {
        if (!G.knows('slamet')) {
          G.say([
            ['slamet', 'Saya yang menemukan Bu Dewi, Pak. Jam lima kurang sepuluh. Beliau terkulai di meja, laptopnya masih menyala.', 'worried'],
            ['slamet', 'Saya lari panggil satpam. Waktu lewat pantry, saya lihat ada <b>dua cangkir</b> di nampan. Padahal Bu Dewi biasanya ngopi sendirian.'],
            ['arsa', 'Siapa lagi yang ada di ruang guru sore ini?'],
            ['slamet', 'Rapat kurikulum di ruang rapat sebelah, Pak. Pak Gunawan yang mimpin — katanya sampai jam lima.'],
            ['slamet', 'Tapi... waktu saya menyapu sekitar jam empat lewat, saya lihat Pak Gunawan keluar dari <b>ruangannya sendiri</b>. Bukan dari ruang rapat.', 'worried'],
            ['slamet', 'Oh, satu lagi. Jam setengah lima Dimas, anak futsal itu, mondar-mandir di depan ruang guru. Masih pakai baju bola. Pagi tadi juga Bu Rina sama Bu Dewi ribut besar di sini.']
          ], function () { G.fact('slamet'); G.fact('bramKeluar'); G.fact('dimasLewat'); G.fact('rinaDebat'); });
        } else {
          G.say([['slamet', 'Semoga Bu Dewi cepat sadar, Pak. Beliau orang baik.', 'worried']]);
        }
      },
      naylaNpc: function (G) {
        if (!G.knows('naylaNilai')) {
          G.say([
            ['nayla', 'Detektif! Bu Dewi yang mengajari aku fungsi invers. Beliau selalu bilang: "sandi yang baik itu bisa dibalik — kalau tahu fungsinya."', 'worried'],
            ['nayla', 'Kalau Bu Dewi sempat menulis sesuatu, pasti angkanya hasil sebuah fungsi. Cari fungsinya, lalu balik.'],
            ['nayla', 'Oh iya — minggu lalu beliau cerita ada <b>nilai yang berubah sendiri</b> di sistem. Beliau mau lapor ke kepala sekolah hari Senin.']
          ], function () { G.fact('naylaNilai'); });
        } else {
          G.say([['nayla', 'Aku percaya sama Detektif. Temukan orangnya.', 'worried']]);
        }
      },
      mejaRatna: function (G, P) {
        if (!G.found('msg')) {
          G.fact('cangkirHilang');
          G.reveal('msg', P, 'Laptop Bu Dewi masih menyala. Di sebelahnya ada lingkaran bekas cangkir — cangkirnya sendiri sudah tidak ada. ' +
            'Di sticky note kuning, tulisan tangannya yang gemetar:');
        } else {
          G.look(P.title, 'Laptop Bu Dewi dan bekas lingkaran cangkir. Seseorang membawa cangkirnya pergi setelah beliau pingsan.');
        }
      },
      jamMeja: function (G, P) {
        G.fact('jam1642');
        G.look(P.title, 'Jam meja digital tergeletak di lantai, baterainya terlepas setengah. Angkanya membeku: <b>{{jam}}</b>. ' +
          'Jatuh tersenggol ketika Bu Dewi kehilangan kesadaran.' +
          (G.decrypted() ? '<br><br>"Kode brankas ada di jam." Ini dia.' : ''));
      },
      brankas: function (G, P) {
        if (G.flag('brankas')) { G.look(P.title, 'Brankas sudah terbuka dan kosong.'); return; }
        var t = G.decrypted()
          ? 'Brankas kecil berkunci kombinasi 4 angka. Pesan Bu Dewi: kodenya ada di jam.'
          : 'Brankas kecil berkunci kombinasi 4 angka. Tanpa petunjuk, menebak cuma buang waktu.';
        G.ask(P.title, t, [
          { label: 'Masukkan kode', primary: true, fn: function () {
            G.code({ title: 'BRANKAS', desc: 'Kombinasi 4 angka.', answer: '{{kodeJam}}',
              onOk: function () {
                G.set('brankas'); P.st.open = true; G.give('kunciWakasek'); G.fact('catatanRatna');
                G.look('BRANKAS TERBUKA', 'Di dalam brankas: <b>kunci berlabel "R. WAKASEK"</b> dan catatan Bu Dewi:' +
                  note('"12 nilai kelas XII diubah lewat akun <b>gunawan.s</b>. Berkas nilai asli kusimpan di <b>map biru</b> — harus kubawa ke kepala sekolah Senin. Kunci cadangan ruangannya kuminta dari TU."'));
              } });
          } },
          { label: 'Tutup' }
        ]);
      },
      mejaRapat: function (G, P) {
        if (G.knows('ttdPalsu')) { G.look(P.title, 'Daftar hadir rapat. Tanda tangan "G. Saputro" bertinta biru — ditambahkan belakangan.'); return; }
        var opts = [];
        for (var i = 0; i < SIGS.length; i++) opts.push({ html: sigHtml(SIGS[i]), ok: !!SIGS[i].forged });
        G.ask(P.title, 'Daftar hadir <b>Rapat Kurikulum 15.00–17.00</b> masih tergeletak di meja. Ada lima tanda tangan, semuanya menulis "hadir s/d 17.00".', [
          { label: 'Periksa tanda tangan', primary: true, fn: function () {
            G.pick({ title: 'DAFTAR HADIR RAPAT', desc: 'Satu tanda tangan ditambahkan belakangan oleh orang yang tidak benar-benar hadir sampai akhir. Yang mana?',
              options: opts, cls: 'sigs',
              wrong: 'Tinta, tekanan pena, dan kemiringannya sama dengan yang lain. Bukan yang ini.',
              onOk: function () {
                G.fact('ttdPalsu');
                G.look(P.title, 'Tanda tangan <b>G. Saputro</b> ditulis dengan <b>tinta biru</b> — semua yang lain hitam, satu pena yang sama yang diedarkan saat rapat. ' +
                  'Dan di notulen tertulis jelas: <i>"16.10 — Pak Gunawan izin keluar rapat."</i><br>Alibinya palsu.');
              } });
          } },
          { label: 'Tutup' }
        ]);
      },
      mejaBram: function (G, P) {
        G.fact('logNilai'); G.fact('pesanK');
        G.look(P.title, 'Komputer Pak Gunawan masih login. Riwayat sistem nilai: <b>16.20 — 12 nilai kelas XII diubah (akun gunawan.s)</b>.<br>' +
          'Di pojok layar ada notifikasi dari kontak bernama satu huruf, <b>"K"</b>: <i>"Sudah beres?"</i>');
      },
      lemariBram: function (G, P) {
        if (G.flag('mapBiru')) { G.look(P.title, 'Map biru dan botol kecil sudah kamu amankan sebagai barang bukti.'); return; }
        G.sfx('door');
        P.st.open = true;
        G.set('mapBiru'); G.fact('mapBiru');
        G.look(P.title, 'Di laci paling bawah, di bawah tumpukan sertifikat: <b>map biru</b> — berkas nilai asli kelas XII yang hilang dari ruang guru. ' +
          'Terselip di dalamnya, <b>botol kecil tanpa label</b>, setengah kosong.<br>Inilah yang dibawa sosok bermasker itu pukul 16.47.');
      }
    },
    /* Bank 12 pertanyaan — tiap main diambil 5 secara acak. Jawaban benar selalu a[0]. */
    deduce: [
      { q: 'Pukul berapa Bu Dewi kehilangan kesadaran?',
        a: ['{{jamT}} — jam mejanya jatuh dan berhenti', '16.12 — saat masuk ruang guru', '16.50 — saat ditemukan Pak Udin'],
        why: 'Jam meja jatuh tersenggol dan membeku di {{jam}}.' },
      { q: 'Bagaimana zat itu masuk ke tubuh Bu Dewi?',
        a: ['Lewat cangkir kopi yang disiapkan orang lain di pantry', 'Lewat makanan dari kantin', 'Lewat air dispenser ruang guru'],
        why: 'Dua cangkir di pantry; cangkir Bu Dewi menyisakan endapan obat tidur.' },
      { q: 'Alibi siapa yang terbukti dipalsukan?',
        a: ['Pak Gunawan — tanda tangan rapatnya ditambah belakangan', 'Bu Rina — konselingnya fiktif', 'Dimas — dia tidak ikut latihan futsal'],
        why: 'Tinta biru di daftar hadir, dan notulen mencatat Pak Gunawan keluar 16.10.' },
      { q: 'Apa yang janggal dari tanda tangan "G. Saputro" di daftar hadir?',
        a: ['Tintanya biru, padahal yang lain hitam dari pena yang sama', 'Tidak ada namanya', 'Ditulis paling atas'],
        why: 'Semua peserta memakai satu pena hitam yang diedarkan. Tanda tangan biru ditambahkan belakangan.' },
      { q: 'Berapa kode brankas Bu Dewi?',
        a: ['{{kodeJam}}', '1724', '{{kodeFake}}'],
        why: 'Pesan Bu Dewi: kodenya ada di jam — jam meja yang berhenti di {{jam}}, bukan jam dinding (17.24) yang masih berjalan.' },
      { q: 'Strip obat tidur di sampah pantry tercatat atas nama siapa?',
        a: ['Pasien G. Saputro', 'Pasien Dewi Anggraini', 'Pasien Rina Marlina'],
        why: 'Label apotek di strip obat: pasien G. Saputro.' },
      { q: 'Kenapa Bu Dewi menjadi sasaran?',
        a: ['Ia menemukan 12 nilai kelas XII diubah dan akan melapor hari Senin', 'Ia menolak memimpin rapat', 'Ia berutang pada seseorang'],
        why: 'Catatan di brankas dan cerita Alya: Bu Dewi akan melapor perubahan nilai.' },
      { q: 'Akun apa yang dipakai mengubah nilai pukul 16.20?',
        a: ['gunawan.s', 'dimas.a', 'admin.tu'],
        why: 'Riwayat sistem di komputer Wakasek: 12 nilai diubah lewat akun gunawan.s.' },
      { q: 'Apa yang dibawa sosok bermasker keluar pukul 16.47?',
        a: ['Map biru berisi berkas nilai asli', 'Cangkir motif bunga Bu Dewi', 'Laptop Bu Dewi'],
        why: 'Map biru itu ditemukan di lemari Pak Gunawan.' },
      { q: 'Bu Rina bertengkar dengan Bu Dewi pagi tadi. Kenapa dia bukan pelakunya?',
        a: ['Ia konseling wali murid 16.00–17.00 di ruang BK, dibenarkan wali murid', 'Ia memegang kunci brankas', 'Ia ada di pantry pukul 16.38'],
        why: 'Pertengkaran itu motif, tapi Bu Rina punya saksi selama jam kejadian.' },
      { q: 'Nilai Dimas naik dari 54 ke 88. Apa artinya?',
        a: ['Nilainya ikut diubah lewat akun gunawan.s — Dimas sendiri sedang latihan futsal', 'Dimas meretas sistem nilai', 'Itu hanya salah ketik'],
        why: 'Perubahan nilai tercatat dari akun Wakasek, dan pelatih membenarkan Dimas di lapangan.' },
      { q: 'Siapa pengirim pesan "Sudah beres?" ke komputer Pak Gunawan?',
        a: ['Kontak bernama satu huruf, "K"', 'Bu Rina', 'Pak Udin'],
        why: 'Notifikasi di komputer Pak Gunawan berasal dari kontak "K".' }
    ],
    suspects: [
      { ch: 'bram', alibi: 'Memimpin rapat kurikulum 15.00–17.00 — namanya ada di daftar hadir.',
        note: 'Bu Dewi mengeluhkan perubahan nilai kepadanya minggu lalu. Pak Udin melihatnya keluar dari ruangannya sendiri, bukan dari ruang rapat.' },
      { ch: 'wulan', alibi: 'Konseling wali murid X-3 pukul 16.00–17.00 di ruang BK. Wali murid membenarkan.',
        note: 'Bertengkar hebat dengan Bu Dewi pagi tadi. Draf surat keberatan untuk Bu Dewi ada di mejanya.' },
      { ch: 'yoga', alibi: 'Latihan futsal 15.30–17.30. Hanya keluar lima menit ambil minum — pelatih membenarkan.',
        note: 'Nilai matematikanya naik dari 54 ke 88 dalam semalam. Terlihat mondar-mandir di depan ruang guru 16.30.' }
    ],
    culprit: 'bram',
    ending: {
      win: { title: 'Racun di Cangkir Bunga', text: 'Pak Gunawan mengubah dua belas nilai demi bayaran, lalu meracuni kopi Bu Dewi agar bisa mengambil berkas nilai asli. Bu Dewi selamat dan sudah sadar. Tapi sebelum ditahan, Pak Gunawan menyebut satu hal: "K" akan menghapus semua jejak dari server malam ini.' },
      lose: { title: 'Pelaku Lolos', text: 'Alibi orang yang kamu tuduh dibenarkan banyak saksi. Malam itu juga, map biru berisi berkas nilai asli lenyap dari lemari — bersama botol kecil itu.' }
    },
    scenes: {
      intro: [
        { card: { kicker: 'KASUS 02', title: 'Kopi Terakhir Bu Dewi', sub: 'Ruang Guru · Jumat, 17.10' } },
        { bg: 'hospital', actors: [{ ch: 'hendra', x: 380, y: 318, dir: 'left' }, { ch: 'arsa', x: 260, y: 320, dir: 'right' }],
          lines: [
            [null, 'Sehari setelah Alya ditemukan. Telepon itu datang ketika matahari mulai tenggelam.'],
            ['hendra', 'Bu Dewi, guru matematika... ditemukan tak sadarkan diri di mejanya. Dokter bilang ada obat tidur dosis tinggi di tubuhnya.', 'worried'],
            ['arsa', 'Keadaannya?'],
            ['hendra', 'Kritis, tapi masih bernapas. Bu Dewi yang kemarin membantu Alya menyusun laporan soal bocoran itu.', 'worried'],
            ['hendra', 'Sore itu yang masih di sayap guru cuma tiga orang: Pak Gunawan yang memimpin rapat, Bu Rina di ruang BK, dan Dimas — murid yang nilainya mendadak melonjak.', 'worried'],
            ['arsa', 'Jadi seseorang ingin dia diam. Sama seperti Alya.']
          ] },
        { bg: 'cctv', cctv: { cam: 'CAM 05', loc: 'SAYAP GURU LT.1', door: 'R.GURU',
            script: [{ t: 0, clock: '16:12:04' }, { t: 0.3, fig: 'in', who: 'ratna' }, { t: 4, clock: '16:38:51' }, { t: 4.2, fig: 'in', who: 'mask' },
                     { t: 8, clock: '16:47:30' }, { t: 8.2, fig: 'out', who: 'mask', carry: 'folder' }] },
          lines: [
            [null, '<b>16.12</b> — Bu Dewi masuk ruang guru. Sendirian.', null, 0],
            [null, '<b>16.38</b> — seseorang menyusul. Wajahnya tertutup masker, langkahnya tenang. Dia tahu jalan.', null, 4],
            [null, '<b>16.47</b> — orang yang sama keluar, membawa map biru. Tiga menit kemudian, Pak Udin menemukan Bu Dewi.', null, 8]
          ] },
        { bg: 'teacher', actors: [{ ch: 'nayla', x: 400, y: 318, dir: 'left' }, { ch: 'arsa', x: 260, y: 320, dir: 'right' }],
          lines: [
            ['nayla', 'Detektif... ini semua gara-gara aku, ya? Bu Dewi membantuku melapor, terus sekarang...', 'worried'],
            ['arsa', 'Bukan salahmu. Yang salah adalah orang yang menuangkan sesuatu ke cangkirnya. Dan orang itu meninggalkan jejak.'],
            ['arsa', 'Sandi Bu Dewi, cangkir kopinya, dan siapa pun yang berbohong soal di mana dia berada pukul 16.38.']
          ] }
      ],
      win: [
        { bg: 'interro', actors: [{ ch: 'bram', x: 400, y: 300, dir: 'down', sit: true }, { ch: 'arsa', x: 200, y: 322, dir: 'right' }],
          lines: [
            ['arsa', 'Anda keluar rapat pukul 16.10, Pak Gunawan, bukan 17.00. Tanda tangan itu ditambahkan belakangan dengan tinta biru.'],
            ['arsa', 'Pukul 16.20 akun Anda mengubah dua belas nilai. Obat tidur atas nama Anda. Masker di jas Anda. Dan map biru di lemari Anda sendiri.'],
            ['bram', 'Bu Dewi... dia tidak mau berhenti bertanya. Saya cuma ingin dia tidur sebentar, cukup lama untuk mengambil berkas itu.', 'worried'],
            ['bram', 'Saya tidak tahu dosisnya sebanyak itu! K yang memberikan obatnya. K bilang aman!', 'angry'],
            ['arsa', 'K lagi. Siapa dia?'],
            ['bram', 'Saya tidak tahu! Tapi tadi sore dia mengirim pesan: <i>"Malam ini semua data di server hilang. Tidak ada jejak."</i>', 'worried']
          ] },
        { bg: 'hospital', actors: [{ ch: 'nayla', x: 380, y: 318, dir: 'left' }, { ch: 'arsa', x: 260, y: 320, dir: 'right' }],
          lines: [
            [null, 'Pukul 21.30. Rumah sakit.'],
            ['nayla', 'Dokter bilang Bu Dewi sudah melewati masa kritis! Beliau sempat membuka mata.', 'happy'],
            ['arsa', 'Syukurlah. ...Alya, server sekolah itu ada di mana?'],
            ['nayla', 'Lantai tiga, di atas lab. Kenapa, Detektif?'],
            [null, 'Ponsel Bima bergetar. Pesan dari Pak Darto: <b>"PAK, ADA ASAP DI LANTAI TIGA."</b>']
          ] },
        { card: { kicker: 'BERSAMBUNG', title: 'Kasus 03 terbuka', sub: 'Api di Ruang Server' } }
      ],
      lose: [
        { bg: 'interro', actors: [{ ch: 'arsa', x: 200, y: 322, dir: 'right' }],
          lines: [
            [null, 'Alibi orang yang kamu tuduh dibenarkan banyak saksi.'],
            [null, 'Malam itu juga, map biru berisi berkas nilai asli lenyap dari lemari.'],
            [null, 'Bu Dewi selamat. Tapi orang yang meracuninya masih berjalan bebas di koridor sekolah.']
          ] }
      ]
    }
  };

  /* =========================================================
     KASUS 03 — API DI RUANG SERVER
     ========================================================= */
  var C3 = {
    id: 'c3', no: 'KASUS 03', title: 'Api di Ruang Server', crime: 'Pembakaran sengaja',
    place: 'Ruang Server Lt. 3', when: 'Jumat, 23.31',
    blurb: 'Ruang server terbakar tengah malam. Alarm diam, kamera mati, listrik padam. ' +
           'Seseorang ingin semua jejak "Pak K" lenyap — dan dia mungkin masih di gedung.',
    radio: 'nayla',
    plain: 'HARDISK ASLI DI RAK B',
    mode: 'gabungan',
    time: { easy: 840, normal: 690, hard: 540 },
    sky: 'night', dark: 0.86, darkLit: 0.42, wall: 'srv', power: false,
    themes: { '.': 'srv', ':': 'panel', ',': 'ctrl' },
    map: [
      '################################',
      '################################',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '#..............................#',
      '################DD##############',
      '#:::::::::::::#,,,,,,,,,,,,,,,,#',
      '#:::::::::::::#,,,,,,,,,,,,,,,,#',
      '#:::::::::::::D,,,,,,,,,,,,,,,,#',
      '#:::::::::::::#,,,,,,,,,,,,,,,,#',
      '#:::::::::::::#,,,,,,,,,,,,,,,,#',
      '################################',
      '################################'
    ],
    spawn: { c: 28, r: 3, dir: 'down' },
    rooms: [
      { name: 'RUANG SERVER', c0: 1, r0: 2, c1: 30, r1: 8 },
      { name: 'RUANG PANEL', c0: 1, r0: 10, c1: 13, r1: 14 },
      { name: 'RUANG KONTROL', c0: 15, r0: 10, c1: 30, r1: 14 }
    ],
    lights: [
      { c: 6, r: 4, rad: 70, power: true }, { c: 16, r: 5, rad: 70, power: true }, { c: 26, r: 4, rad: 70, power: true },
      { c: 7, r: 12, rad: 70, power: true }, { c: 22, r: 12, rad: 75, power: true },
      { c: 29, r: 2, rad: 40 }
    ],
    doors: [],
    items: { pemadam: 'Tabung pemadam', kartuMaster: 'Kartu master #07', harddisk: 'Hard disk cadangan' },
    props: [
      /* ---- ruang server ---- */
      { id: 'rakA', type: 'rack', tag: 'A', c: 3, r: 2, w: 2, h: 1, tall: 18, spot: true, title: 'RAK SERVER A',
        look: 'Server web sekolah. Masih utuh, kipasnya berhenti karena listrik padam.',
        spotText: 'Di sisi rak, tertempel kertas tempel kuning tulisan Mas Reza:' },
      { id: 'rakB', type: 'rack', tag: 'B', reader: true, c: 6, r: 2, w: 2, h: 1, tall: 18, title: 'RAK SERVER B', label: 'Periksa rak B' },
      { id: 'rakC', type: 'rack', var: 'burnt', tag: 'C', c: 9, r: 2, w: 2, h: 1, tall: 18, spot: true, blockedBy: 'apiRak', title: 'RAK SERVER C',
        look: 'Rak C hangus di bagian depan. Server utama data siswa — sasaran yang jelas.',
        spotText: 'Di pintu rak yang menghitam, kertas tempel yang sudut-sudutnya terbakar masih terbaca:' },
      { id: 'apiRak', type: 'fire_over', fire: true, c: 9, r: 2, w: 2, h: 1, tall: 18, solid: false, title: 'API DI RAK C', label: 'Padamkan api' },
      { id: 'rakD', type: 'rack', tag: 'D', c: 12, r: 2, w: 2, h: 1, tall: 18, spot: true, title: 'RAK SERVER D',
        look: 'Rak jaringan. Kabel-kabelnya rapi — tidak ada yang dicabut.',
        spotText: 'Di bawah label rak, tertempel:' },
      { id: 'apiDinding', type: 'fire_wall', fire: true, c: 15, r: 0, w: 2, h: 2, wall: true, title: 'API DI DINDING', label: 'Padamkan api' },
      { id: 'terminalCad', type: 'terminal', needPower: true, screen: '#3a2a12', c: 19, r: 2, w: 3, h: 1, tall: 8, title: 'TERMINAL CADANGAN', label: 'Periksa terminal cadangan' },
      { id: 'cooling', type: 'cooling', c: 24, r: 2, w: 2, h: 1, tall: 18, title: 'UNIT PENDINGIN',
        look: 'Unit pendingin presisi. Filternya hitam pekat oleh jelaga. Kipasnya diam — listrik padam.' },
      { id: 'ext', type: 'ext_wall', c: 27, r: 1, w: 1, h: 1, wall: true, title: 'TABUNG PEMADAM', label: 'Ambil tabung pemadam' },
      { id: 'pintuDarurat', type: 'stairs_door', c: 29, r: 0, w: 2, h: 2, wall: true, title: 'PINTU TANGGA DARURAT',
        look: 'Pintu tangga darurat. Pemadam kebakaran masih dalam perjalanan — jalan depan sekolah banjir.' },
      { id: 'rakLama', type: 'rack', tag: 'X', c: 1, r: 6, w: 1, h: 1, tall: 18, spot: true, title: 'RAK LAMA',
        look: 'Rak lama yang sudah tidak dipakai. Debunya tebal dan tidak tersentuh.',
        spotText: 'Di balik debu, ada kertas tempel yang masih baru:' },
      { id: 'mejaAdmin', type: 'desk', c: 20, r: 6, w: 3, h: 2, mug: '#1f2228', spot: true, title: 'MEJA MAS REZA', fact: 'kartuHilang',
        look: 'Meja admin jaringan. Laci kartu master terbuka — kosong. Label: "KARTU MASTER #07". ' +
              'Post-it: <i>"Kartu hilang sejak Senin. Sudah lapor ke Pak Surya. — Reza"</i>',
        spotText: 'Selain post-it soal kartu hilang, ada satu kertas tempel lagi:' },
      { id: 'mejaKerja', type: 'desk', c: 26, r: 6, w: 3, h: 2, spot: true, title: 'MEJA TEKNISI JARINGAN',
        look: 'Obeng, crimping tool, kabel UTP. Tidak ada yang hilang.',
        spotText: 'Tertindih gulungan kabel:' },
      { id: 'kabelS', type: 'cable', c: 4, r: 5, w: 2, h: 1, solid: false, title: 'KABEL LANTAI',
        look: 'Kabel daya di bawah lantai panggung. Semuanya terpasang. Api tidak berasal dari sini.' },
      { id: 'jerigen', type: 'jerrycan', c: 14, r: 7, w: 1, h: 1, blockedBy: 'apiLantai', title: 'JERIGEN', fact: 'jerigen',
        look: 'Jerigen plastik kosong, baunya menyengat bensin. Stiker inventaris: <b>"LAB TKJ — PJ: S. KENCANA"</b>.' },
      { id: 'apiLantai', type: 'fire_floor', fire: true, block: true, c: 16, r: 8, w: 2, h: 1, title: 'API DI LANTAI', label: 'Padamkan api' },

      /* ---- ruang panel ---- */
      { id: 'panelListrik', type: 'panel_elec', c: 2, r: 10, w: 2, h: 1, tall: 16, title: 'PANEL LISTRIK', label: 'Periksa panel listrik' },
      { id: 'panelAlarm', type: 'panel_alarm', c: 6, r: 9, w: 2, h: 1, wall: true, title: 'PANEL ALARM', label: 'Periksa panel alarm' },
      { id: 'ups', type: 'ups', c: 9, r: 10, w: 3, h: 1, tall: 10, title: 'UPS CADANGAN',
        look: 'UPS cadangan, baterai 64%. Cukup untuk sistem darurat — kalau sakelar di panel listrik disusun benar.' },
      { id: 'kardusP', type: 'box', stack: 2, c: 1, r: 13, w: 2, h: 1, spot: true, title: 'KARDUS',
        look: 'Kardus bekas perangkat jaringan. Kosong.',
        spotText: 'Di tutup kardus, ditempel selotip:' },
      { id: 'lemariKabel', type: 'cabinet', c: 11, r: 13, w: 2, h: 1, tall: 10, spot: true, title: 'LEMARI KABEL',
        look: 'Gulungan kabel dan konektor. Rapi.',
        spotText: 'Di dalam pintu lemari:' },

      /* ---- ruang kontrol ---- */
      { id: 'monitorDinding', type: 'monitor_wall', c: 26, r: 9, w: 3, h: 1, wall: true, title: 'MONITOR CCTV',
        look: 'Dinding monitor CCTV. Semua kamera lantai tiga putus pukul 23.13 — tersambung ke panel alarm yang sama.' },
      { id: 'terminalKontrol', type: 'terminal', needPower: true, slot: true, c: 21, r: 10, w: 4, h: 1, tall: 8, title: 'TERMINAL KONTROL', label: 'Periksa terminal kontrol' },
      { id: 'kursiJaket', type: 'chair_jacket', c: 22, r: 12, w: 1, h: 1, title: 'KURSI KONTROL', fact: 'jaketBersih', label: 'Periksa kursi',
        look: 'Jaket ungu bertuliskan <b>"SALSA — XII TKJ 2"</b> tersampir di kursi. Anehnya, jaket ini <b>bersih sama sekali</b> — ' +
              'padahal semua benda di ruangan ini tertutup jelaga.<br>Jaket ini ditaruh <b>setelah</b> api menyala.' },
      { id: 'rakDok', type: 'bookshelf', c: 29, r: 10, w: 2, h: 1, tall: 14, spot: true, title: 'RAK DOKUMEN',
        look: 'Manual perangkat dan SOP darurat. Halaman "prosedur kebakaran" terlipat.',
        spotText: 'Terselip di buku manual:' },
      { id: 'lokerK', type: 'lockers', c: 15, r: 13, w: 2, h: 1, tall: 12, spot: true, title: 'LOKER PETUGAS',
        look: 'Loker petugas jaringan. Isinya jaket hujan dan sepatu cadangan.',
        spotText: 'Di pintu loker bagian dalam:' },
      { id: 'mejaK', type: 'desk', c: 26, r: 12, w: 3, h: 2, spot: true, title: 'MEJA OPERATOR',
        look: 'Meja operator. Buku log jaga terakhir diisi pukul 17.00 oleh Mas Reza.',
        spotText: 'Diselipkan di buku log jaga:' }
    ],
    npcs: [
      { id: 'joko', ch: 'joko', c: 29, r: 6, dir: 'left' },
      { id: 'hendraNpc', ch: 'hendra', c: 17, r: 5, dir: 'down' }
    ],
    facts: {
      mobilDingin: 'Pak Darto: mobil Pak Surya sudah di parkiran sejak <b>22.30</b>, kapnya dingin.',
      hendraKlaim: 'Pak Surya mengaku <b>baru datang dari rumah</b> setelah ditelepon (±23.25).',
      lingkaranBBM: 'Api di lantai berasal dari <b>bahan bakar yang dituang</b> — ada bekas lingkaran cairan.',
      jerigen: 'Jerigen bensin kosong, stiker "LAB TKJ — PJ: S. KENCANA".',
      kabelPutus: 'Kabel sensor alarm dipotong rapi dengan tang, bukan meleleh.',
      kartuDitemukan: 'Kartu master #07 tergeletak di bawah panel alarm.',
      kartuHilang: 'Kartu master #07 hilang dari laci Mas Reza sejak Senin; ia sudah melapor ke Pak Surya.',
      jaketBersih: 'Jaket ungu Salsa di ruang kontrol <b>bersih tanpa jelaga</b> — ditaruh setelah kebakaran.',
      logAkses: 'Log asli: <b>23.12</b> panel alarm dibuka dengan kartu master #07 — didaftarkan ulang atas nama <b>S. KENCANA</b> hari Senin.'
    },
    steps: [
      { label: 'Tanyai Pak Darto', go: 'joko', done: function (G) { return G.knows('mobilDingin'); },
        hint: 'Pak Darto berdiri di dekat pintu tangga darurat, sisi kanan ruangan.' },
      { label: 'Tanyai Pak Surya', go: 'hendraNpc', done: function (G) { return G.knows('hendraKlaim'); },
        hint: 'Pak Surya berdiri di tengah ruang server.' },
      { label: 'Ambil tabung pemadam', go: 'ext', done: function (G) { return G.has('pemadam'); },
        hint: 'Tabung pemadam merah tergantung di dinding atas, dekat pintu tangga darurat.' },
      { label: 'Padamkan api di depan pintu belakang', go: 'apiLantai', done: function (G) { return G.flag('out_apiLantai'); },
        hint: 'Api besar di lantai menutup satu-satunya jalan ke ruang belakang. Dekati dan tekan E.' },
      { label: 'Nyalakan listrik cadangan', go: 'panelListrik', done: function (G) { return G.flag('power'); },
        hint: 'Panel listrik ada di Ruang Panel (kiri bawah). Setiap sakelar ikut membalik sakelar di sebelahnya.' },
      { label: 'Periksa panel alarm', go: 'panelAlarm', done: function (G) { return G.flag('alarm'); },
        hint: 'Panel alarm merah menempel di dinding atas Ruang Panel.' },
      { label: 'Baca log di terminal cadangan', go: 'terminalCad', done: function (G) { return G.found('msg'); },
        hint: 'Terminal cadangan ada di ruang server, sebelah kanan rak-rak. Perlu listrik.' },
      { label: 'Kumpulkan kunci sandi', keys: true, done: function (G) { return G.allKeys(); },
        hint: 'Mas Reza menempel kertas kunci di rak, meja, loker, kardus, atau lemari. Rak C masih terbakar — padamkan juga.' },
      { label: 'Buka sandi dengan ALAT (tombol T)', done: function (G) { return G.decrypted(); },
        hint: 'Tekan T. Gabungkan fungsinya jadi satu (komposisi), lalu cari invers fungsi gabungan itu. Hitung tiap angka sandi jadi huruf.' },
      { label: 'Ambil isi rak server B', go: 'rakB', done: function (G) { return G.flag('rakB'); },
        hint: 'Rak B di deretan atas ruang server. Pembaca kartunya butuh kartu master #07.' },
      { label: 'Baca hard disk di terminal kontrol', go: 'terminalKontrol', done: function (G) { return G.flag('logAkses'); },
        hint: 'Terminal kontrol ada di Ruang Kontrol, kanan bawah. Pasang hard disk-nya di sana.' },
      { label: 'Periksa kursi di ruang kontrol', go: 'kursiJaket', done: function (G) { return G.knows('jaketBersih'); },
        hint: 'Ada jaket ungu di kursi ruang kontrol. Perhatikan keadaannya.' }
    ],
    handlers: {
      joko: function (G) {
        if (!G.knows('mobilDingin')) {
          G.say([
            ['joko', 'Pemadam masih di jalan, Pak. Jalan depan banjir sepinggang.', 'worried'],
            ['arsa', 'Pak Darto, siapa saja yang datang ke sekolah malam ini?'],
            ['joko', 'Cuma Pak Surya. Katanya dari rumah, datang setengah dua belas setelah saya telepon.'],
            ['joko', 'Yang punya akses ruang ini cuma Mas Reza, admin jaringan — tapi dia pulang sore. Oh, dan Salsa anak XII TKJ 2 sering nongkrong di ruang kontrol.'],
            ['joko', 'Tapi aneh, Pak... mobil beliau sudah di parkiran sejak <b>jam setengah sebelas</b>. Saya lewat tadi — kapnya dingin. Mesinnya sudah lama mati.', 'worried']
          ], function () { G.fact('mobilDingin'); });
        } else {
          G.say([['joko', 'Saya jaga pintu tangga, Pak. Tidak ada yang boleh keluar-masuk.']]);
        }
      },
      hendraNpc: function (G) {
        if (!G.knows('hendraKlaim')) {
          G.say([
            ['hendra', 'Detektif, syukurlah. Saya baru sampai — langsung dari rumah begitu Pak Darto menelepon.'],
            ['hendra', 'Siapa yang tega membakar ruang server... Mungkin murid iseng? Tadi saya lihat jaket ungu di ruang kontrol. Seperti punya Salsa.', 'worried'],
            ['arsa', 'Kita lihat nanti, Pak. Untuk sekarang, jangan sentuh apa pun.']
          ], function () { G.fact('hendraKlaim'); });
        } else {
          G.say([['hendra', 'Saya di sini saja, Detektif. Kalau butuh bantuan, panggil saya.', 'smirk']]);
        }
      },
      ext: function (G, P) {
        if (P.st.taken) { G.look(P.title, 'Dudukannya sudah kosong. Tabungnya kamu bawa.'); return; }
        G.ask(P.title, 'Tabung pemadam APAR. Segelnya masih utuh — tidak ada yang memakainya malam ini, padahal api sudah menyala lebih dari sepuluh menit.', [
          { label: 'Ambil tabung', primary: true, fn: function () {
            P.st.taken = true; G.give('pemadam'); G.sfx('pick');
            G.toast('Tabung pemadam dibawa · dekati api lalu tekan E');
          } },
          { label: 'Nanti' }
        ]);
      },
      apiLantai: function (G, P) {
        G.extinguish(P, function () {
          G.fact('lingkaranBBM');
          G.look('API PADAM', 'Api di lantai padam. Di bawah jelaga ada <b>lingkaran bekas cairan</b> yang rapi — bahan bakar yang sengaja dituang. Bukan korsleting.<br>Jalan ke ruang belakang terbuka.');
        });
      },
      apiRak: function (G, P) {
        G.extinguish(P, function () { G.toast('Api di rak C padam'); });
      },
      apiDinding: function (G, P) {
        G.extinguish(P, function () { G.toast('Api di dinding padam · +20'); G.score(20); });
      },
      panelListrik: function (G, P) {
        if (G.flag('power')) { G.look(P.title, 'Semua sakelar hijau. Listrik cadangan menyala.'); return; }
        G.ask(P.title, 'Panel listrik darurat. Lima sakelar berderet, sebagian merah. Stiker peringatan: <i>"Sakelar saling terkait — tiap tuas membalik tuas di sebelahnya."</i>', [
          { label: 'Atur sakelar', primary: true, fn: function () {
            G.switches({ title: 'PANEL LISTRIK DARURAT', onOk: function () {
              G.set('power'); G.power(true);
              G.look(P.title, '<i>Klik-klik-klik.</i> UPS berdengung. Lampu darurat menyala satu per satu, dan terminal-terminal di lantai tiga hidup kembali.');
            } });
          } },
          { label: 'Tutup' }
        ]);
      },
      panelAlarm: function (G, P) {
        if (G.flag('alarm')) { G.look(P.title, 'Kabel sensor alarm putus, dipotong rapi. Kartu master sudah kamu ambil.'); return; }
        G.set('alarm'); P.st.open = true; G.give('kartuMaster'); G.fact('kabelPutus'); G.fact('kartuDitemukan');
        G.look(P.title, 'Tutup panel tidak terkunci. Kabel sensor di dalamnya <b>dipotong rapi dengan tang</b> — bukan meleleh. ' +
          'Di lantai bawah panel tergeletak sebuah kartu: <b>KARTU MASTER #07</b>.<br>Kartu yang dilaporkan hilang dari laci Mas Reza.');
      },
      terminalCad: function (G, P) {
        if (!G.flag('power')) { G.look(P.title, 'Layarnya gelap. Tidak ada listrik.'); return; }
        if (!G.found('msg')) {
          G.reveal('msg', P, 'Terminal cadangan menyala. Sistem pencatat menampilkan satu baris log yang <b>dienkripsi otomatis</b> — Mas Reza yang menyetelnya begitu, supaya tidak bisa dihapus tanpa ketahuan:');
        } else {
          G.look(P.title, 'Log terenkripsi sudah kamu salin. Kuncinya tersebar di kertas-kertas tempel milik Mas Reza.');
        }
      },
      rakB: function (G, P) {
        if (G.flag('rakB')) { G.look(P.title, 'Rak B terbuka. Slot hard disk cadangannya sudah kosong.'); return; }
        if (!G.flag('power')) { G.look(P.title, 'Rak B. Pembaca kartunya mati — tidak ada listrik.'); return; }
        if (!G.decrypted()) { G.look(P.title, 'Rak B. Pembaca kartu berkedip merah. Ada enam rak dan puluhan unit di sini — tanpa petunjuk, kamu tidak tahu mana yang penting.'); return; }
        if (!G.has('kartuMaster')) { G.look(P.title, '"' + G.plain() + '." Ini raknya. Tapi pembaca kartunya menolak — butuh <b>kartu master</b>.'); return; }
        G.ask(P.title, 'Pesan log: <code>' + G.plain() + '</code>. Pembaca kartu menunggu.', [
          { label: 'Tempel kartu master', primary: true, fn: function () {
            G.sfx('ok'); P.st.open = true; G.set('rakB'); G.give('harddisk');
            G.look(P.title, 'Lampu pembaca berubah hijau. Di slot paling bawah: <b>hard disk cadangan</b> yang mencatat log asli — tersembunyi di rak yang tidak dibakar.');
          } },
          { label: 'Nanti' }
        ]);
      },
      terminalKontrol: function (G, P) {
        if (G.flag('logAkses')) { G.look(P.title, 'Log asli masih di layar: 23.12, kartu master #07, S. KENCANA.'); return; }
        if (!G.flag('power')) { G.look(P.title, 'Terminal kontrol mati. Tidak ada listrik.'); return; }
        if (!G.has('harddisk')) { G.look(P.title, 'Terminal kontrol menyala. Ada slot hard disk eksternal — kosong.'); return; }
        G.ask(P.title, 'Terminal kontrol menyala. Slot hard disk-nya kosong.', [
          { label: 'Pasang hard disk', primary: true, fn: function () {
            P.st.loaded = true; G.sfx('ok'); G.set('logAkses'); G.fact('logAkses');
            G.look('LOG AKSES ASLI', 'Layar menampilkan log yang tidak sempat dihapus:' +
              note('<b>23.12:04</b> PANEL ALARM DIBUKA — KARTU MASTER #07<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(didaftarkan ulang Senin, a.n. <b>S. KENCANA</b>)<br><b>23.13:10</b> SENSOR ALARM TERPUTUS<br><b>23.13:11</b> CCTV LT.3 OFFLINE') +
              'Kartu yang "hilang" itu didaftarkan ulang atas nama satu orang.');
          } },
          { label: 'Nanti' }
        ]);
      }
    },
    /* Bank 12 pertanyaan — tiap main diambil 5 secara acak. Jawaban benar selalu a[0]. */
    deduce: [
      { q: 'Dari mana api itu berasal?',
        a: ['Bahan bakar yang sengaja dituang di lantai', 'Korsleting kabel di rak server', 'Unit pendingin yang kepanasan'],
        why: 'Ada lingkaran bekas cairan di bawah api, dan jerigen bensin kosong.' },
      { q: 'Apa arti jaket Salsa yang bersih tanpa jelaga?',
        a: ['Jaket itu ditaruh setelah api menyala, untuk menjebak Salsa', 'Salsa ada di ruangan saat kebakaran', 'Jaket itu tidak berarti apa-apa'],
        why: 'Semua benda lain tertutup jelaga. Jaket itu datang belakangan.' },
      { q: 'Siapa yang berbohong soal "baru datang dari rumah"?',
        a: ['Pak Surya — mobilnya sudah dingin sejak 22.30', 'Mas Reza — dia tidak pernah keluar gerbang', 'Pak Darto — dia tidak ada di pos'],
        why: 'Mesin mobil Pak Surya sudah lama mati; dia tidak pernah pulang.' },
      { q: 'Pukul berapa panel alarm dibuka, dan dengan apa?',
        a: ['23.12, dengan kartu master #07', '23.31, dengan dicongkel', '17.04, dengan kunci Mas Reza'],
        why: 'Log asli di hard disk cadangan: 23.12:04 panel alarm dibuka — kartu master #07.' },
      { q: 'Kartu master #07 didaftarkan ulang atas nama siapa?',
        a: ['S. KENCANA', 'R. FIRMANSYAH', 'S. AMELIA'],
        why: 'Log akses: kartu didaftarkan ulang hari Senin a.n. S. KENCANA.' },
      { q: 'Bagaimana kabel sensor alarm bisa putus?',
        a: ['Dipotong rapi dengan tang', 'Meleleh terkena api', 'Digigit tikus'],
        why: 'Potongannya rapi — bukan bekas meleleh.' },
      { q: 'Di mana log asli yang tidak sempat dihapus disimpan?',
        a: ['Hard disk cadangan di rak server B', 'Server utama di rak C', 'Laci meja operator'],
        why: 'Pesan terenkripsi: hard disk asli ada di rak B — rak yang tidak dibakar.' },
      { q: 'Jerigen bensin kosong itu inventaris siapa?',
        a: ['Lab TKJ — penanggung jawab S. Kencana', 'Pantry ruang guru', 'Gudang alat kebersihan'],
        why: 'Stiker inventaris di jerigen: "LAB TKJ — PJ: S. KENCANA".' },
      { q: 'Kartu master hilang dari laci Mas Reza. Kenapa dia bukan pelakunya?',
        a: ['Ia keluar gerbang 17.04 dan tidak kembali; kartunya didaftarkan atas nama orang lain', 'Ia ada di ruang kontrol pukul 23.12', 'Jerigen itu miliknya'],
        why: 'Gerbang mencatat Mas Reza pulang sore, dan kartunya sudah bukan atas namanya.' },
      { q: 'Kenapa Salsa bukan pelakunya meski jaketnya ada di TKP?',
        a: ['Ia pulang 16.20 bersama dua teman — terekam kamera gerbang', 'Ia memegang kartu master', 'Ia yang menelepon pemadam'],
        why: 'Kamera gerbang merekam Salsa pulang jauh sebelum api menyala.' },
      { q: 'Kenapa CCTV lantai tiga mati pukul 23.13?',
        a: ['Kamera tersambung ke panel alarm yang sensornya dipotong', 'Listrik padam karena api', 'Kamera rusak sejak Senin'],
        why: 'Monitor CCTV: semua kamera lantai tiga tersambung ke panel alarm yang sama.' },
      { q: 'Siapa sebenarnya "Pak K"?',
        a: ['Pak Surya Kencana — guru yang memanggil detektif', 'Pak Gunawan, Wakasek Kurikulum', 'Pak Rudi, teknisi lab'],
        why: 'Kartu master atas nama S. Kencana, jerigen Lab TKJ, dan alibi mobil yang dingin.' }
    ],
    suspects: [
      { ch: 'bagas', alibi: 'Shift berakhir 17.00. Gerbang mencatat dia keluar 17.04 dan tidak kembali.',
        note: 'Kartu master #07 yang dipakai membuka panel alarm berasal dari lacinya. Paling paham sistem server.' },
      { ch: 'hendra', alibi: 'Mengaku di rumah sejak 21.00, datang 23.25 setelah ditelepon Pak Darto.',
        note: 'Penanggung jawab Lab TKJ dan kunci panel alarm. Pertama kali menunjuk jaket Salsa.' },
      { ch: 'dinda', alibi: 'Pulang 16.20 bersama dua teman — terekam kamera gerbang.',
        note: 'Jaket ungunya ditemukan di kursi ruang kontrol. Sering nongkrong di ruang kontrol.' }
    ],
    culprit: 'hendra',
    ending: {
      win: { title: 'Pak K Tertangkap', text: 'Pak Surya Kencana — guru yang memanggilmu di malam pertama — adalah "Pak K". Dialah yang mengatur bocoran soal, menyuruh Pak Gunawan mengubah nilai, dan membakar ruang server untuk menghapus jejak. Kartu master yang "hilang" justru dia daftarkan atas namanya sendiri. Satu kesalahan urutan, dan seluruh kebohongannya terbalik.' },
      lose: { title: 'Pak K Lolos', text: 'Alibi orang yang kamu tuduh tidak tergoyahkan. Saat pemadam kebakaran tiba, hard disk cadangan itu sudah tidak ada di tempatnya — dan "Pak K" kembali menjadi bayangan.' }
    },
    scenes: {
      intro: [
        { card: { kicker: 'KASUS 03', title: 'Api di Ruang Server', sub: 'Ruang Server Lt. 3 · Jumat, 23.31' } },
        { bg: 'server', actors: [{ ch: 'joko', x: 420, y: 318, dir: 'left' }, { ch: 'arsa', x: -40, y: 320, to: 270, dur: 1.8, dir: 'right' }],
          lines: [
            [null, 'Asap memenuhi tangga lantai tiga. Alarm kebakaran — anehnya — diam saja.'],
            ['joko', 'Pak! Alarmnya mati, sprinklernya juga! Saya sudah telepon pemadam, tapi mereka masih dua puluh menit lagi.', 'worried'],
            ['arsa', 'Listrik?'],
            ['joko', 'Padam total di lantai ini. Cuma sisa api yang menerangi.', 'worried']
          ] },
        { bg: 'cctv', cctv: { cam: 'CAM 09', loc: 'RUANG SERVER LT.3', door: 'PANEL', panel: true,
            script: [{ t: 0, clock: '23:12:01' }, { t: 0.3, fig: 'panel' }, { t: 4.5, clock: '23:13:10' }, { t: 4.8, cut: true }] },
          lines: [
            [null, '<b>23.12</b> — satu sosok membuka panel alarm. Tidak dicongkel. Dibuka.', null, 0],
            [null, '<b>23.13</b> — rekaman terputus. Kamera ini tersambung ke panel yang sama.', null, 4.5]
          ] },
        { bg: 'server', actors: [{ ch: 'arsa', x: 300, y: 320, dir: 'down' }],
          lines: [
            ['nayla', '<i>(lewat HT)</i> Detektif, ini Alya. Aku di pos satpam. Sistem cadangan server mencatat log akses dalam bentuk <b>terenkripsi</b> — Mas Reza pernah cerita.'],
            ['nayla', 'Kuncinya dia tulis di kertas tempel dan disebar di ruangan. Katanya biar "aman". Ugh.'],
            ['arsa', 'Kalau begitu urutannya jelas: padamkan apinya, nyalakan listrik cadangan, lalu baca log itu.'],
            ['nayla', 'Hati-hati. Kalau ada yang membakar server untuk menghapus jejak... dia mungkin masih di sana. Tekan <b>H</b> kalau butuh aku.', 'worried']
          ] }
      ],
      win: [
        { bg: 'interro', actors: [{ ch: 'hendra', x: 400, y: 300, dir: 'down', sit: true }, { ch: 'arsa', x: 200, y: 322, dir: 'right' }],
          lines: [
            ['arsa', 'Kartu master #07 tidak hilang, Pak Surya. Anda mendaftarkannya ulang atas nama Anda sendiri, lalu memakainya membuka panel alarm pukul 23.12.'],
            ['arsa', 'Mobil Anda sudah dingin sejak 22.30. Anda tidak datang dari rumah. Anda tidak pernah pulang.'],
            ['arsa', 'Dan jaket Salsa — bersih di ruangan penuh jelaga. Ditaruh setelah api menyala, supaya kami menuduh murid Anda sendiri.'],
            ['hendra', '...Hebat. Benar-benar hebat. Kau tahu kenapa aku memanggilmu waktu Alya hilang, Detektif?', 'smirk'],
            ['hendra', 'Karena detektif yang sibuk membaca sandi tidak akan sempat melihat siapa yang menyodorkan sandinya.', 'smirk'],
            ['hendra', 'Rudi, Gunawan, soal-soal, nilai-nilai... semuanya berjalan rapi selama tiga tahun. Sampai ada murid yang belajar terlalu baik.', 'angry'],
            ['arsa', 'Anda sendiri yang mengajari mereka: setiap fungsi yang punya invers bisa dibalik. Kebohongan Anda juga punya invers, <b>Pak K</b>.']
          ] },
        { bg: 'gate', sky: 'dawn', actors: [{ ch: 'ratna', x: 420, y: 316, dir: 'left' }, { ch: 'nayla', x: 340, y: 318, dir: 'right' }, { ch: 'arsa', x: 220, y: 320, dir: 'right' }],
          lines: [
            [null, 'Tiga hari kemudian. Matahari pagi menyinari gerbang SMK Bina Cipta.'],
            ['nayla', 'Bu Dewi! Ibu sudah boleh ke sekolah?', 'happy'],
            ['ratna', 'Cuma mampir. Ibu ingin lihat detektif yang membuka sandi gurunya sendiri.', 'happy'],
            ['arsa', 'Sandi yang bagus, Bu. Berlapis. Salah urutan sedikit saja, hasilnya jadi omong kosong.'],
            ['ratna', 'Seperti hidup, Detektif. Urutan itu penting. <b>f(g(x))</b> tidak sama dengan <b>g(f(x))</b>.', 'smirk']
          ] },
        { card: { kicker: 'TAMAT', title: 'Terima kasih sudah bermain', sub: 'Detektif Sandi · XI PPLG 4' } }
      ],
      lose: [
        { bg: 'interro', actors: [{ ch: 'arsa', x: 200, y: 322, dir: 'right' }],
          lines: [
            [null, 'Alibi orang yang kamu tuduh tidak tergoyahkan.'],
            [null, 'Saat pemadam kebakaran tiba, hard disk cadangan itu sudah tidak ada di tempatnya.'],
            [null, 'Di koridor yang gelap, seseorang tersenyum. "Pak K" akan menunggu kesempatan berikutnya.']
          ] }
      ]
    }
  };

  DS.CHARS = CHARS;
  DS.DIFFS = DIFFS;
  DS.CASES = [C1, C2, C3];
})();
