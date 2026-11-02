# Detective Cipher — Kasus #01: Rekaman 23.47

Game detektif pixel-art untuk tugas **Matematika: Fungsi Komposisi & Fungsi Invers**.
Nayla, ketua OSIS, hilang dibawa keluar lab oleh sosok berjubah hitam — terekam CCTV.
Pecahkan pesannya, temukan buktinya, lalu interogasi pelakunya.

**Kelas XI PPLG 4 — SMK Telkom Purwokerto**

---

## Cara Menjalankan

Tidak perlu install apa pun. Cukup **klik dua kali `index.html`** — jalan langsung di browser (offline).

Kalau mau lewat server lokal (disarankan, biar pesan error browser kelihatan):

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

1. **Pilih kasus di jalanan** — senter mengikuti kursor. Tiga sosok hitam = tiga kasus.
2. **Popup kasus & tingkat** — pilih EASY / NORMAL / HARD.
3. **Cutscene CCTV** — rekaman kamera 02, 23.41–23.47.
4. **Papan kasus** — foto terpin, tali merah, deduksi.
5. **Investigasi TKP** — **semua barang** bisa diperiksa. Dua (atau tiga) di antaranya menyimpan
   **pesan asli** dan **kunci fungsinya**; sisanya memberi alasan kenapa kosong.
6. **Alat enkripsi** — buka di komputer guru, tempel pesan + kunci, jalankan. Sandi yang cocok
   dengan catatan sistem menunjuk lokasi kunci.
7. **Pot → kunci → lemari arsip** — geser pot, ambil kunci, buka lemari.
8. **Ruang interogasi** — tiga tersangka duduk diborgol. Sorot dengan lampu, klik untuk memilih.
   Pelaku benar dan salah punya cutscene berbeda.

## Matematika di Baliknya

Pesan dienkripsi berlapis (komposisi fungsi):

$$c = f(g(x))$$

Alat enkripsi di game menerapkan fungsi dari **baris terakhir ke baris pertama** — lapis paling
dalam dulu. Kunci yang ditempel berbentuk:

```
c = f(g(x))
f(x) = 3x + 7
g(x) = x + 5
```

Hasilnya untuk huruf `K` (11): `g(11) = 16` → `f(16) = 55` → `55 mod 26 = 3` → `C`.

Aturan yang selalu berlaku: huruf dipetakan `A=1 … Z=26`, hasil dikembalikan ke 1–26
(`0` ditulis 26), dan koefisien `a` wajib **koprima dengan 26** supaya fungsinya punya invers.

**Yang jadi inti pembelajaran:** urutan lapis. Kalau siswa menempelkan kunci dengan urutan
terbalik, alat menolak dengan pesan *"Hasilnya tidak cocok dengan catatan sistem"* — jadi
`f(g(x))` vs `g(f(x))` terlihat akibatnya langsung, bukan cuma dihafal.

## Pesan & Kunci Diacak

Pesan asli, fungsi, dan **lokasi petunjuk** diacak setiap kali kasus dimulai. Jadi tidak ada satu
jawaban tetap yang bisa dihafal. Untuk mencetak jawaban dari sesi berjalan:

```bash
node _genkunci.js
```

Penjelasan lengkap untuk guru ada di [`KUNCI-JAWABAN.md`](KUNCI-JAWABAN.md).

## Tingkat Kesulitan

| Mode | Lapis | Petunjuk yang harus dicari |
|---|---|---|
| EASY | 2 | pesan + 1 kunci |
| NORMAL | 3 | pesan + 1 kunci (tiga fungsi sekaligus) |
| HARD | 3 | pesan + **2 sobekan kunci** (disimpan terpisah) |

## Struktur Berkas

```
index.html       — layar & markup (pilih kasus, cutscene, papan, main, alat enkripsi, interogasi, vonis)
style.css        — tema noir, layout 1280×720
game.js          — mesin game, peta, puzzle, render pixel-art (data tingkat di blok DIFFS)
KUNCI-JAWABAN.md — panduan penilaian untuk guru
KONSEP-KASUS.md  — rancangan Kasus #02 & #03
_selftest.js     — uji otomatis (node _selftest.js): enkripsi, alat, alur, interogasi
_genkunci.js     — pencetak tabel kunci jawaban dari sesi berjalan (node _genkunci.js)
```

Semua grafis digambar lewat `<canvas>` — **tanpa aset eksternal**, jadi aman dipresentasikan offline.

## Catatan Teknis

- Stage dikunci 1280×720 lalu di-scale ke viewport, jadi aman untuk proyektor.
- Menu, pilih kasus, cutscene, papan kasus, ruang interogasi, dan cutscene vonis memakai canvas
  640×360 yang di-stretch dengan `image-rendering: pixelated` supaya tetap tajam.
- `_selftest.js` memverifikasi: sandi = enkripsi(pesan), semua koefisien koprima 26, penempatan
  petunjuk acak dan tidak menempel di alat/pot/lemari, alat menolak urutan terbalik & kunci tidak
  valid, alur penuh sampai ending, dan cutscene berjalan tanpa error.
- Validasi alat dilakukan di klien (tidak ada server) — cocok untuk demo offline di kelas.
