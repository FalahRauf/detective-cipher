# Detektif Sandi — Tiga Kasus, Satu Dalang

Game detektif pixel-art untuk tugas **Matematika: Fungsi Komposisi & Fungsi Invers**.
Setiap pesan penting dikunci berlapis, `c = f(g(x))`. Untuk membacanya kamu harus membuka lapis
**dari yang terluar** — urutan salah, hasilnya cuma huruf acak.

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
| `T` | Alat dekripsi |
| `H` | Minta arahan lewat HT (−30 poin) |
| `Esc` | Jeda |
| `M` | Suara on/off |

## Ceritanya

Tiga kasus di **SMK Bina Cipta** (sekolah fiksi) yang saling bersambung. Di balik semuanya ada
satu nama yang terus muncul: **"Pak K"**.

| # | Kasus | Kejahatan | TKP | Yang terjadi |
|---|---|---|---|---|
| 01 | **Rekaman 23.47** | Penyekapan | Lab Komputer 2, Ruang Teknisi, Gudang | Nayla hilang. CCTV menangkap sosok keluar membawa tas besar. Benarkah Nayla dibawa keluar? |
| 02 | **Kopi Terakhir Bu Ratna** | Percobaan pembunuhan | Ruang Guru, Pantry, Ruang Wakasek | Guru matematika yang membantu Nayla diracun obat tidur. Alibi rapat seseorang ternyata palsu. |
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
- **Papan deduksi** — sebelum menuduh, jawab tiga pertanyaan (kapan, bagaimana, siapa yang berbohong).
- **Ruang interogasi** — satu tuduhan saja. Salah tuduh = pelaku lolos.

## Tingkat Kesulitan

| Mode | Lapis fungsi | Sobekan kunci | Perangkap | Kilau penanda |
|---|---|---|---|---|
| EASY | 2 | 1 (utuh) | — | ya |
| NORMAL | 3 | 2 | 2, terlihat | ya |
| HARD | 3 | 3 | 4, samar | tidak |

Perangkap dipasang pelaku di lantai (posisi acak): kabel alarm, tali jebakan, papan lepas.
Kena = kehilangan poin, papan lepas memaksa kembali ke titik masuk.

## Matematika di Baliknya

Huruf diubah ke angka `A = 1 … Z = 26`, tiap lapis berbentuk `ax + b`, hasil selalu dikembalikan
ke 1–26 (`mod 26`, angka 0 ditulis 26).

```
c = f(g(x))        f(x) = 3x + 7        g(x) = x + 5
```

Membuka sandi = memakai invers dengan urutan **terbalik**, mulai dari lapis terluar:

```
x = g⁻¹(f⁻¹(c))    f⁻¹(y) = 9(y − 7)    g⁻¹(y) = y − 5
```

Contoh huruf `C` (3): `f⁻¹(3) = 9(3 − 7) = −36 ≡ 16`, lalu `g⁻¹(16) = 11` → **K**.

Alat dekripsi di game menampilkan invers tiap fungsi dan tabel langkah per huruf, dan menolak:

- urutan lapis yang salah → *"Hasilnya belum jadi kalimat"* (inti pelajarannya: `f(g(x)) ≠ g(f(x))`),
- jumlah fungsi yang tidak sesuai jumlah lapis,
- koefisien `a` yang tidak koprima dengan 26 (tidak punya invers).

Di mode NORMAL/HARD, sobekan kunci ditempel **sesuai urutan ditemukan** — siswa harus menyusunnya
sendiri (tombol ▲▼) berdasarkan baris `c = f(g(h(x)))`.

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
_genkunci.js      — cetak semua sandi & kunci: node _genkunci.js
```

Semua grafis dan suara dibuat langsung oleh kode (canvas + WebAudio) — **tanpa aset luar**,
jadi aman dipresentasikan offline.

## Uji Otomatis

```bash
node _selftest.js
```

Memainkan 3 kasus × 3 tingkat dari awal sampai vonis tanpa browser: enkripsi/dekripsi, urutan
lapis terbalik ditolak, tata letak peta (perabot tidak menimpa dinding/barang lain), setiap barang
**terjangkau dengan berjalan**, semua langkah tugas selesai, deduksi, interogasi, salah tuduh, dan
waktu habis.
