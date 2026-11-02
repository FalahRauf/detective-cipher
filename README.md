# Detective Cipher — 3 Kasus

Game detektif pixel-art untuk tugas **Matematika: Fungsi Komposisi & Fungsi Invers**.
Temukan pesan terenkripsi, buka dengan alat dekripsi, ikuti rantai kunci, lalu tuduh pelakunya.

**Kelas XI PPLG 4 — SMK Telkom Purwokerto**

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

## Tiga Kasus

| # | Kasus | Lokasi | Peta | Barang | Kunci berurutan |
|---|---|---|---|---|---|
| 01 | **Rekaman 23.47** | Lab Komputer 2 | 28 × 18 | 17 | 2 |
| 02 | **Buku Besar Perpustakaan** | Perpustakaan | 34 × 22 | 26 | 3 |
| 03 | **Server Terkunci** | Ruang Server Lt. 3 | 40 × 26 | 30 | 4 |

Tiap kasus punya **EASY / NORMAL / HARD**, jadi total **9 mode**.

| Mode | Lapis fungsi | Sobekan kunci |
|---|---|---|
| EASY | 2 | 1 |
| NORMAL | 3 | 1 |
| HARD | 3 | 2–3 (tergantung kasus) |

Jumlah petunjuk naik mengikuti kasus: kasus 1 = 2–3 petunjuk, kasus 2 = 3–4, kasus 3 = 3–4.

## Alur Permainan

1. **Pilih kasus di jalanan** — senter mengikuti kursor. Tiga sosok hitam = tiga kasus.
2. **Popup kasus & tingkat** — pilih EASY / NORMAL / HARD.
3. **Cutscene CCTV** — kamera malam itu, caption mengetik sendiri.
4. **Papan kasus** — foto terpin, tali merah, deduksi.
5. **Investigasi TKP** — **semua barang** bisa diperiksa. Beberapa menyimpan **pesan terenkripsi**
   dan **sobekan kunci**; sisanya memberi alasan kenapa kosong.
6. **Alat dekripsi** — buka di komputer/terminal, tempel sandi + kunci, jalankan.
   Hasilnya kalimat yang menunjuk lokasi kunci pertama.
7. **Rantai kunci** — buka kunci 1 → dapat kunci 2 → buka kunci 2 → … sampai bukti.
   Kasus 1 dua langkah, kasus 2 tiga langkah, kasus 3 empat langkah.
8. **Ruang interogasi** — tiga tersangka duduk diborgol. Sorot dengan lampu, klik untuk memilih.
   Pelaku benar dan salah punya cutscene vonis berbeda.

## Matematika di Baliknya

Pesan dienkripsi berlapis (komposisi fungsi) — yang kamu temukan di TKP sudah berupa sandi:

$$c = f(g(x))$$

Alat dekripsi membuka lapis dari **baris pertama ke baris terakhir** — lapis terluar dulu.
Kunci yang ditempel berbentuk:

```
c = f(g(x))
f(x) = 3x + 7
g(x) = x + 5
```

Contoh: sandi `C` (3) → `f⁻¹(3) = 9(3 − 7) = −36 ≡ 16` → `g⁻¹(16) = 16 − 5 = 11` → `K`.

Aturan yang selalu berlaku: huruf dipetakan `A=1 … Z=26`, hasil dikembalikan ke 1–26
(`0` ditulis 26), dan koefisien `a` wajib **koprima dengan 26** supaya fungsinya punya invers.

**Yang jadi inti pembelajaran:** urutan lapis. Kalau siswa menempelkan kunci dengan urutan
terbalik, alat menolak dengan pesan *"Hasilnya belum jadi kalimat"* — jadi `f(g(x))` vs `g(f(x))`
terlihat akibatnya langsung, bukan cuma dihafal.

## Pesan & Kunci Diacak

Pesan asli, fungsi, dan **lokasi petunjuk** diacak setiap kali kasus dimulai. Jadi tidak ada satu
jawaban tetap yang bisa dihafal. Untuk mencetak jawaban dari sesi berjalan:

```bash
node _genkunci.js
```

Penjelasan lengkap untuk guru ada di [`KUNCI-JAWABAN.md`](KUNCI-JAWABAN.md).

## Struktur Berkas

```
index.html       — layar & markup (pilih kasus, cutscene, papan, main, alat dekripsi, interogasi, vonis)
style.css        — tema noir, layout 1280×720
game.js          — mesin game, 3 peta, puzzle, render pixel-art (data kasus di blok CASES)
KUNCI-JAWABAN.md — panduan penilaian untuk guru
_selftest.js     — uji otomatis (node _selftest.js): 9 mode, alur penuh, alat, interogasi
_genkunci.js     — pencetak tabel kunci jawaban (node _genkunci.js)
```

Semua grafis digambar lewat `<canvas>` — **tanpa aset eksternal**, jadi aman dipresentasikan offline.

## Catatan Teknis

- Stage dikunci 1280×720 lalu di-scale ke viewport, jadi aman untuk proyektor.
- Menu, pilih kasus, cutscene, papan kasus, ruang interogasi, dan cutscene vonis memakai canvas
  640×360 yang di-stretch dengan `image-rendering: pixelated` supaya tetap tajam.
- Peta dibuat dari daftar furniture `{c, r, w, h, draw}` — collision grid dan gambarnya dihasilkan
  dari sumber yang sama, jadi tidak mungkin meleset.
- `_selftest.js` menjalankan **9 mode penuh** (3 kasus × 3 tingkat): 168 assertion — sandi,
  dekripsi, rantai kunci, bukti, interogasi, sampai layar akhir.
