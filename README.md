# Detective Cipher — Kasus #01: Rekaman 23.47

Game detektif pixel-art untuk tugas **Matematika: Fungsi Komposisi & Fungsi Invers**.
Nayla, ketua OSIS, hilang dibawa keluar lab oleh sosok berjubah hitam — terekam CCTV.
Pecahkan pesan terakhir yang dia enkripsi sendiri untuk menemukan buktinya, lalu tuduh pelakunya.

**Kelas XI PPLG 4 — SMK Telkom Purwokerto**

---

## Kasus & Tingkat Kesulitan

Saat ini tersedia **Kasus #01** dengan tiga tingkat — ceritanya sama, matematikanya meningkat:

| Mode | Lapis | Apa yang berbeda |
|---|---|---|
| **EASY** | 2 fungsi | Invers kedua fungsi sudah ditampilkan di meja dekripsi |
| **NORMAL** | 3 fungsi | Komposisi tiga fungsi; inversnya harus diturunkan sendiri |
| **HARD** | 2 fungsi | Kunci `g(x)` hilang — hanya ada hasil komposisinya `(f∘g)(x) = 15x + 17`, harus diturunkan dulu di meja dekripsi |

Kasus #02 "Buku Besar Perpustakaan" dan #03 "Server Terkunci" sedang dalam perancangan —
rancangan lengkapnya ada di [`KONSEP-KASUS.md`](KONSEP-KASUS.md).

---

## Cara Menjalankan

Tidak perlu install apa pun. Cukup **klik dua kali `index.html`** — jalan langsung di browser (offline).

Kalau mau lewat server lokal:

```bash
python -m http.server 8000
# buka http://localhost:8000
```

## Kontrol

| Tombol | Fungsi |
|---|---|
| `W A S D` / panah | Jalan |
| `E` | Interaksi dengan objek |
| `Esc` | Tutup dialog |

## Alur Permainan

1. **Pilih kasus & tingkat** — layar CASE FILES.
2. **Briefing** — kasus dan target penyelidikan.
3. **Cutscene CCTV** — rekaman kamera 02 pukul 23.47 (bisa dilewati dengan tombol LEWATI).
4. **Investigasi TKP** — cari 3 petunjuk di lab (monitor, papan tulis, tempat sampah).
5. **Meja Dekripsi** — pecahkan pesan terakhir Nayla, huruf per huruf (HARD: turunkan g(x) dulu).
6. **Barang bukti** — pesan yang sudah dipecahkan menunjuk ke lokasi kunci.
7. **Tuduh pelaku** — pilih dari daftar tersangka.

## Matematika di Baliknya

Enkripsi berlapis (komposisi fungsi) — contoh EASY:

$$c = f(g(x))$$

Dekripsi harus dibalik dari lapis terakhir:

$$x = g^{-1}\left(f^{-1}(c)\right)$$

Pada Kasus #01 mode EASY:

| Fungsi | Rumus | Invers |
|---|---|---|
| $f(x)$ | $3x + 7$ | $f^{-1}(c) = 9(c - 7) \bmod 26$ |
| $g(x)$ | $x + 5$ | $g^{-1}(y) = y - 5 \bmod 26$ |

Huruf dipetakan `A=1 … Z=26`, hasil selalu dikembalikan ke rentang 1–26 dengan `mod 26`
(hasil 0 ditulis 26). Koefisien `a` wajib koprima dengan 26 supaya fungsinya punya invers.

Contoh: `K` (11) → $g(11) = 16$ → $f(16) = 55$ → $55 \bmod 26 = 3$ → `C`.

Kunci jawaban lengkap **ketiga mode** ada di [`KUNCI-JAWABAN.md`](KUNCI-JAWABAN.md).

## Struktur Berkas

```
index.html   — layar & markup (pilih kasus, brief, main, meja dekripsi, tuduh, ending)
style.css    — tema noir, layout 1280×720
game.js      — mesin game, peta, puzzle, render pixel-art (data tingkat di blok DIFFS)
KUNCI-JAWABAN.md — kunci jawaban EASY / NORMAL / HARD untuk guru
KONSEP-KASUS.md  — rancangan Kasus #02 & #03
_selftest.js     — uji otomatis (node _selftest.js): enkripsi-dekripsi dua arah + alur permainan
_genkunci.js     — pencetak tabel kunci jawaban dari data game (node _genkunci.js)
```

Semua grafis digambar lewat `<canvas>` — **tanpa aset eksternal**, jadi aman dipresentasikan offline.

## Catatan Teknis

- Stage dikunci 1280×720 lalu di-scale ke viewport, jadi aman untuk proyektor.
- Menu utama dan cutscene CCTV memakai canvas 640×360 yang di-stretch dengan
  `image-rendering: pixelated` supaya tetap tajam dan benar-benar pixel art.
  Cutscene menggambar koridor, siluet pelaku (hitam total), grain/scanline, timestamp berdetak,
  dan caption yang muncul huruf per huruf — semuanya prosedural, tanpa aset.
- Pada mode NORMAL & HARD, cipherteks tampil **huruf besar-kecil campur** seperti teks acak
  (hanya tampilan — nilainya tetap dibaca tanpa memedulikan besar/kecil).
- Cipherteks **dihitung otomatis** dari plainteks lewat fungsi tiap lapis — mengganti kunci
  di `DIFFS` langsung mengganti sandi tanpa hitung manual.
- Validasi di meja dekripsi dilakukan **per sel** (nilai antara + huruf), jadi proses
  pengerjaan siswa kelihatan, bukan cuma jawaban akhir.
- `node _selftest.js` memverifikasi ketiga mode: cipher = enkripsi(plain), rantai dekripsi
  mengembalikan plain, semua koefisien punya invers mod 26, alur main sampai tuduh lulus,
  dan cutscene berjalan tanpa error.

