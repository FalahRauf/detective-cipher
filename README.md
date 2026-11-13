# Detektif Sandi — Tiga Kasus, Satu Dalang

Game detektif pixel-art untuk tugas **Matematika: Fungsi Komposisi & Fungsi Invers**.
Setiap pesan penting berupa **deretan angka** yang dibuat dengan fungsi. Pemain harus **menghitung
sendiri** — game hanya memeriksa jawaban. Tiap kasus fokus ke satu materi:

| Kasus | Materi | Yang dihitung pemain |
|---|---|---|
| 01 | **Fungsi komposisi** | gabungkan `(f∘g)(x)`, lalu masukkan tiap angka sandi ke fungsi gabungan itu |
| 02 | **Fungsi invers** | cari `f⁻¹(x) = (x − b) ÷ a`, lalu balik tiap angka sandi |
| 03 | **Komposisi + invers** | gabungkan fungsinya, cari invers fungsi gabungan, lalu balik tiap angka |

**Kelas XI PPLG 4 — SMK Telkom Purwokerto**

---

## Cara Menjalankan

Tidak perlu install apa pun. **Klik dua kali `index.html`** — langsung jalan di browser, offline.

Atau lewat server lokal:

```bash
python -m http.server 8000
```

lalu buka `http://localhost:8000`.

## Kontrol

| Tombol | Fungsi |
|---|---|
| `W A S D` / panah | Jalan (tahan `Shift` untuk lari) |
| `E` / spasi | Periksa barang, bicara, lanjut dialog |
| `N` | Catatan detektif (fakta, sandi & kunci, tersangka) |
| `T` | Alat hitung sandi (memeriksa jawaban, ada petunjuk berbayar poin) |
| `H` | Minta arahan lewat HT (−30 poin) |
| `Esc` | Jeda |
| `M` | Suara on/off |

## Ceritanya

Tiga kasus di **SMK Bina Cipta** (sekolah fiksi) yang saling bersambung. Di balik semuanya ada
satu nama yang terus muncul: **"Pak K"**.

| # | Kasus | Kejahatan | TKP | Yang terjadi |
|---|---|---|---|---|
| 01 | **Rekaman 23.47** | Penyekapan | Lab Komputer 2, Ruang Teknisi, Gudang | Alya hilang. CCTV menangkap sosok keluar membawa tas besar. Benarkah Alya dibawa keluar? |
| 02 | **Kopi Terakhir Bu Dewi** | Percobaan pembunuhan | Ruang Guru, Pantry, Ruang Wakasek | Guru matematika yang membantu Alya diracun obat tidur. Alibi rapat seseorang ternyata palsu. |
| 03 | **Api di Ruang Server** | Pembakaran sengaja | Ruang Server, Ruang Panel, Ruang Kontrol | Server dibakar untuk menghapus jejak. Listrik padam, alarm diputus — dan dalangnya ada di dekatmu. |

Kasus terbuka **berurutan** (kasus 2 setelah kasus 1 selesai, dst.). Untuk demo di depan kelas,
tekan **`Shift + U`** di layar Berkas Kasus untuk membuka semuanya.

## Yang Ada di Tiap Kasus

- **Cutscene** bergaya visual novel: potret karakter, rekaman CCTV beranimasi dengan jam berjalan.
- **Peta beberapa ruangan** dengan pintu terkunci yang harus dibuka berurutan.
- **Saksi (NPC)** yang bisa diajak bicara — keterangan mereka masuk ke catatan.
- **Semua barang bisa diperiksa.** Beberapa menyimpan sobekan kunci (lokasinya **diacak tiap main**),
  sebagian berisi fakta penting, sisanya pengalih perhatian.
- **Puzzle berbeda tiap kasus:**
  - Kasus 1 — gembok 4 angka dari dua petunjuk yang harus digabung.
  - Kasus 2 — kode brankas dari jam yang berhenti, dan **mencari tanda tangan palsu** di daftar hadir.
  - Kasus 3 — padamkan api yang menutup jalan, susun **sakelar listrik yang saling terkait**,
    lalu pakai kartu & hard disk untuk membaca log asli.
- **Papan deduksi** — sebelum menuduh, jawab 5 pertanyaan yang **diambil acak dari bank 12 soal**
  per kasus, jadi tiap main pertanyaannya beda.
- **Tersangka yang memang dicurigai** — tiap tersangka punya motif dan bukti mencurigakan di TKP,
  tapi hanya satu yang alibinya runtuh.
- **Diacak tiap main baru:** fungsi kunci, posisi meja Alya & nomor PC-nya, kode laci (kasus 1),
  jam yang berhenti & kode brankas (kasus 2), lokasi sobekan kunci, dan perangkap.
- **Ruang interogasi** — satu tuduhan saja. Salah tuduh = pelaku lolos.

## Tingkat Kesulitan

| Mode | Fungsi | Sobekan kunci | Perangkap | Kilau penanda |
|---|---|---|---|---|
| EASY | angka kecil (kasus 1 & 3: 2 fungsi) | 1 (utuh) | — | ya |
| NORMAL | angka sedang (kasus 1 & 3: 2 fungsi) | 2 | 2, terlihat | ya |
| HARD | angka besar (kasus 1 & 3: 3 fungsi) | 3 | 4, samar | tidak |

Perangkap dipasang pelaku di lantai (posisi acak): kabel alarm, tali jebakan, papan lepas.
Kena = kehilangan poin, papan lepas memaksa kembali ke titik masuk.

## Matematika di Baliknya

Huruf diubah ke angka `A = 1 … Z = 26`. Fungsi kunci berbentuk `ax + b` dan **diacak tiap main**.

**Kasus 1 — komposisi** (angka sandi `n` dimasukkan maju ke fungsi gabungan, hasil dikembalikan ke 1–26):

```
f(x) = x + 2     g(x) = 5x − 1     (f∘g)(x) = f(g(x)) = (5x − 1) + 2 = 5x + 1
n = 2  →  5·2 + 1 = 11  →  K
```

**Kasus 2 — invers** (sandi = f(huruf), tanpa modulo):

```
f(x) = 7x + 9     f⁻¹(x) = (x − 9) ÷ 7
86  →  (86 − 9) ÷ 7 = 11  →  K
```

**Kasus 3 — gabungan**: gabungkan dulu, lalu balik fungsi gabungannya.

```
f(x) = 3x − 2   g(x) = 3x − 3   h(x) = 3x + 4
(f∘g∘h)(x) = 27x + 25      (f∘g∘h)⁻¹(x) = (x − 25) ÷ 27
```

Alat hitung di game **tidak menghitung**. Pemain mengisi hasil langkah fungsi (dicek, salah −10),
lalu mengisi huruf per huruf (salah −15, huruf yang salah ditandai). Ada tabel huruf dan kertas
coretan. Petunjuk bertahap bisa dibeli: cara kerja (−25), jawaban langkah fungsi (−50),
contoh hitungan dua angka (−75), kata pertama (−100).

## Struktur Berkas

```
index.html        — semua layar & modal
style.css         — tema noir, panggung 1280×720 yang diskalakan
js/art.js         — grafis prosedural: font piksel, sprite, potret, lantai, dinding, perabot
js/data.js        — karakter, tingkat kesulitan, 3 kasus (peta ASCII, barang, dialog, puzzle, cutscene)
js/scenes.js      — layar judul, meja berkas, pemutar cutscene, ruang interogasi
js/main.js        — mesin game: gerak, tabrakan, interaksi, puzzle, alat dekripsi, skor, alur
KUNCI-JAWABAN.md  — panduan guru (jangan dibuka di depan kelas)
_selftest.js      — uji otomatis: node _selftest.js
```

Semua grafis dan efek suara dibuat langsung oleh kode (canvas + WebAudio). Musik latar memakai dua
lagu CC0 dari OpenGameArt (lihat `audio/CREDITS.txt`) — semua berkas ada di repo, jadi tetap jalan offline.

## Uji Otomatis

```bash
node _selftest.js
```

Memainkan 3 kasus × 3 tingkat dari awal sampai vonis tanpa browser: ratusan kunci acak bisa dibalik
dengan benar, jawaban salah ditolak, tata letak peta (perabot tidak menimpa dinding/barang lain), setiap barang
**terjangkau dengan berjalan**, semua langkah tugas selesai, deduksi, interogasi, salah tuduh, dan
waktu habis.
