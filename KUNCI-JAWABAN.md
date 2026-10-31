# KUNCI JAWABAN — Kasus #01 "Rekaman 23.47"

Bahan buat presentasi. Jangan dibuka di depan kelas sebelum kelompok lain sempat mencoba.

**Kontrol:** WASD atau tombol panah untuk jalan, **E** untuk memeriksa objek yang ditandai.

Satu kasus, tiga tingkat kesulitan. Ceritanya sama, yang berbeda adalah matematikanya:

| Mode | Lapis | Fokus materi | Cipherteks → plainteks |
|---|---|---|---|
| EASY | 2 fungsi | Komposisi dua fungsi + invers | `KUNCI DI POT` |
| NORMAL | 3 fungsi | Komposisi tiga fungsi, invers diturunkan sendiri | `CEK POT BUNGA` |
| HARD | 2 fungsi | Menentukan fungsi yang hilang dari hasil komposisi | `DI BAWAH POT` |

Catatan tampilan: pada mode NORMAL dan HARD, cipherteks di layar sengaja ditampilkan dengan
**huruf besar-kecil campur** (seperti teks acak sungguhan — sesuai penjelasan guru). Itu hanya
tampilan; nilai hurufnya sama, jadi tabel di bawah ditulis huruf besar semua.

Cipherteks dihasilkan otomatis dari plainteks lewat fungsi-fungsinya, jadi tidak mungkin salah ketik.

---

## Mode EASY — 2 lapis, invers sudah ditampilkan

| | Fungsi | Invers |
|---|---|---|
| Lapis luar | `f(x) = 3x + 7` | `f⁻¹(y) = 9(y − 7) mod 26` |
| Lapis dalam | `g(x) = x + 5` | `g⁻¹(y) = y − 5 mod 26` |

Enkripsi: `c = f(g(x))` — jadi dekripsi harus dibalik: **`x = g⁻¹(f⁻¹(c))`**

Kenapa `9`? Karena `3 · 9 = 27 ≡ 1 (mod 26)`. Membagi dengan 3 sama saja dengan mengalikan 9 dalam modulo 26. Ini yang bikin `f` bisa dibalik.

| Cipher | c | Langkah 1: f⁻¹(c) = 9(c − 7) | Langkah 2: g⁻¹ = hasil − 5 | Plainteks |
|---|---|---|---|---|
| C | 3  | 9(−4) = −36 ≡ **16** | 16 − 5 = 11 | **K** |
| G | 7  | 9(0) = 0 ≡ **26** | 26 − 5 = 21 | **U** |
| L | 12 | 9(5) = **45 ≡ 19** | 19 − 5 = 14 | **N** |
| E | 5  | 9(−2) = −18 ≡ **8** | 8 − 5 = 3 | **C** |
| W | 23 | 9(16) = **144 ≡ 14** | 14 − 5 = 9 | **I** |
| ␣ | —  | spasi tidak dienkripsi | — | — |
| H | 8  | 9(1) = **9** | 9 − 5 = 4 | **D** |
| W | 23 | 9(16) = **144 ≡ 14** | 14 − 5 = 9 | **I** |
| ␣ | —  | spasi tidak dienkripsi | — | — |
| R | 18 | 9(11) = **99 ≡ 21** | 21 − 5 = 16 | **P** |
| O | 15 | 9(8) = **72 ≡ 20** | 20 − 5 = 15 | **O** |
| D | 4  | 9(−3) = −27 ≡ **25** | 25 − 5 = 20 | **T** |

**Hasil: `KUNCI DI POT`** — cipherteksnya `C G L E W   H W   R O D`.

---

## Mode NORMAL — 3 lapis (komposisi tiga fungsi)

Meja dekripsi hanya menampilkan fungsi aslinya — **inversnya harus diturunkan sendiri**.

| Fungsi | Rumus | Invers (turunan siswa) |
|---|---|---|
| `f(x)` | `7x + 3` | `f⁻¹(y) = 15(y − 3) mod 26` — karena `7 · 15 = 105 ≡ 1` |
| `g(x)` | `x + 11` | `g⁻¹(y) = y − 11 mod 26` |
| `h(x)` | `x − 6`  | `h⁻¹(y) = y + 6 mod 26` |

Urutan enkripsi: `c = f(g(h(x)))` — jadi dekripsi: **`x = h⁻¹(g⁻¹(f⁻¹(c)))`**, buka dari lapis terluar.

| Cipher | Langkah f⁻¹ | Langkah g⁻¹ | Langkah h⁻¹ | Plainteks |
|---|---|---|---|---|
| **G** (7) | 15(7 − 3) = 60 ≡ **8** | 8 − 11 = −3 ≡ **23** | 23 + 6 = 29 ≡ **3** | **C** |
| **U** (21) | 15(21 − 3) = 270 ≡ **10** | 10 − 11 = −1 ≡ **25** | 25 + 6 = 31 ≡ **5** | **E** |
| **K** (11) | 15(11 − 3) = 120 ≡ **16** | 16 − 11 = **5** | 5 + 6 = 11 | **K** |
| ␣ | spasi tidak dienkripsi | — | — | — |
| **T** (20) | 15(20 − 3) = 255 ≡ **21** | 21 − 11 = **10** | 10 + 6 = 16 | **P** |
| **M** (13) | 15(13 − 3) = 150 ≡ **20** | 20 − 11 = **9** | 9 + 6 = 15 | **O** |
| **V** (22) | 15(22 − 3) = 285 ≡ **25** | 25 − 11 = **14** | 14 + 6 = 20 | **T** |
| ␣ | spasi tidak dienkripsi | — | — | — |
| **Z** (26) | 15(26 − 3) = 345 ≡ **7** | 7 − 11 = −4 ≡ **22** | 22 + 6 = 28 ≡ **2** | **B** |
| **C** (3) | 15(3 − 3) = 0 ≡ **26** | 26 − 11 = **15** | 15 + 6 = 21 | **U** |
| **F** (6) | 15(6 − 3) = 45 ≡ **19** | 19 − 11 = **8** | 8 + 6 = 14 | **N** |
| **I** (9) | 15(9 − 3) = 90 ≡ **12** | 12 − 11 = **1** | 1 + 6 = 7 | **G** |
| **S** (19) | 15(19 − 3) = 240 ≡ **6** | 6 − 11 = −5 ≡ **21** | 21 + 6 = 27 ≡ **1** | **A** |

**Hasil: `CEK POT BUNGA`** — cipherteksnya `G U K   T M V   Z C F I S`.

Sumber kunci: papan tulis memuat **f(x)** dan **h(x)**; sticky note di tempat sampah memuat **g(x)**.

---

## Mode HARD — kunci g(x) hilang, harus diturunkan dari komposisi

| | Fungsi | Invers |
|---|---|---|
| Lapis luar | `f(x) = 5x + 2` | `f⁻¹(y) = 21(y − 2) mod 26` — karena `5 · 21 = 105 ≡ 1` |
| Lapis dalam | `g(x) = 3x + 3` *(rahasia)* | `g⁻¹(y) = 9(y − 3) mod 26` — karena `3 · 9 = 27 ≡ 1` |

Petunjuk yang ada: papan tulis memuat `f(x) = 5x + 2`, dan kertas di tempat sampah sobek — yang tertulis hanya:

```
(f ∘ g)(x) = 15x + 17
```

**Menurunkan g(x)** (materi: menentukan fungsi kanan):

```
(f ∘ g)(x) = f(g(x)) = 5·g(x) + 2 = 15x + 17
5·g(x) = 15x + 15
g(x) = (15x + 15) / 5 = 3x + 3
```

Input `a = 3`, `b = 3` di meja dekripsi akan membuka kolom dekripsi. Salah isian ditandai merah, tanpa penalti.

| Cipher | Langkah f⁻¹ | Langkah g⁻¹ | Plainteks |
|---|---|---|---|
| **Y** (25) | 21(25 − 2) = 483 ≡ **15** | 9(15 − 3) = 108 ≡ **4** | **D** |
| **V** (22) | 21(22 − 2) = 420 ≡ **4** | 9(4 − 3) = 9 ≡ **9** | **I** |
| ␣ | spasi tidak dienkripsi | — | — |
| **U** (21) | 21(21 − 2) = 399 ≡ **9** | 9(9 − 3) = 54 ≡ **2** | **B** |
| **F** (6) | 21(6 − 2) = 84 ≡ **6** | 9(6 − 3) = 27 ≡ **1** | **A** |
| **X** (24) | 21(24 − 2) = 462 ≡ **20** | 9(20 − 3) = 153 ≡ **23** | **W** |
| **F** (6) | 21(6 − 2) = 84 ≡ **6** | 9(6 − 3) = 27 ≡ **1** | **A** |
| **G** (7) | 21(7 − 2) = 105 ≡ **1** | 9(1 − 3) = −18 ≡ **8** | **H** |
| ␣ | spasi tidak dienkripsi | — | — |
| **W** (23) | 21(23 − 2) = 441 ≡ **25** | 9(25 − 3) = 198 ≡ **16** | **P** |
| **H** (8) | 21(8 − 2) = 126 ≡ **22** | 9(22 − 3) = 171 ≡ **15** | **O** |
| **E** (5) | 21(5 − 2) = 63 ≡ **11** | 9(11 − 3) = 72 ≡ **20** | **T** |

**Hasil: `DI BAWAH POT`** — cipherteksnya `Y V   U F X F G   W H E`.

---

## Alur kasus (sama untuk semua mode)

1. **Pilih kasus di jalanan** — senter detektif mengikuti kursor; klik sosok hitam CASE 01
2. **Cutscene CCTV** → sosok hitam keluar lab pukul 23.47 memikul tas besar
3. **Papan kasus detektif** → deduksi: kartu akses 23.40, tas besar, Nayla
4. **Laptop meja guru** → `pesan.txt` terakhir Nayla (23.45) → cipherteks + buka meja dekripsi
5. **Papan tulis** → fungsi yang Nayla tulis (NORMAL: sekaligus lapis paling dalam)
6. **Tempat sampah** → kunci yang Nayla remas dan buang (HARD: hanya sisa komposisinya)
7. **Meja dekripsi** → pesan terakhir Nayla terbaca
8. **Pot tanaman** (dekat dispenser, sudut kanan bawah) → pot digeser → **kunci lemari** label "ARSIP"
9. **Lemari arsip** → dibuka pakai kunci → **flashdisk "JANGAN FORMAT — BUKTI"**: salinan CCTV + catatan penguntit
10. **Tuduh** → Pak Dedi

Alasannya: Pak Dedi mengaku pulang pukul 21.00, tapi kartu akses teknisinya sendiri tercatat tap masuk
pukul 23.40 — tujuh menit sebelum sosok hitam itu membawa tas besar keluar lewat kamera. Nayla sendiri
yang mengenkripsi pesannya, supaya penguntitnya tidak bisa membaca. Rian sudah di kos dengan dua saksi
sekos, Sinta terekam CCTV perpustakaan lalu keluar gerbang.

Catatan: pot **tidak bisa diperiksa sama sekali** sebelum sandi dipecahkan — tanda interaksinya baru muncul setelah pesan terbaca. Jadi matematikanya wajib dikerjakan dulu.

## Poin yang bisa dijelaskan waktu presentasi

- **Kenapa dua lapis (atau tiga)?** Satu fungsi saja tidak cukup — pesan dienkripsi berlapis: hasil `g` dienkripsi lagi oleh `f`. Itulah **komposisi fungsi** `(f ∘ g)(x)`.
- **Kenapa urutan invers dibalik?** Yang dipasang terakhir harus dibuka duluan. `c = f(g(x))` dibuka dengan `f⁻¹` dulu, baru `g⁻¹`. Sama seperti kaos dalam lalu kemeja — dibukanya kemeja dulu. Untuk tiga lapis: `f⁻¹ → g⁻¹ → h⁻¹`.
- **Kenapa ada `mod 26`?** Huruf cuma 26. Kalau hasil fungsinya 45, kita bungkus lagi ke rentang 1–26: 45 − 26 = 19. Hasil 0 ditulis 26 karena tidak ada huruf ke-0.
- **Kenapa koefisien harus koprima dengan 26?** Agar fungsi punya invers. Karena itu dipakai 3, 5, 7 — bukan 2 atau 13. Kalau koefisiennya 2, dua huruf berbeda bisa menghasilkan cipher yang sama dan pesan tidak bisa dibalik.
- **HARD: bagaimana menemukan fungsi yang hilang?** Dari sifat komposisi: `(f ∘ g)(x) = f(g(x))`. Kalau `f` diketahui, `g` bisa "diekstrak" dengan membalik `f` — persis materi menentukan fungsi kanan/kiri.
- **Kenapa sandinya menunjuk ke pot, bukan langsung ke lemari?** Kalau sandinya "lemari biru", pemain bisa langsung buka lemari tanpa menyelesaikan apa pun. Dua langkah (pot → kunci → lemari) memaksa pemain menyelesaikan dekripsi dulu.

## Catatan teknis (kalau ditanya)

Huruf diubah ke angka dengan A=1, B=2, … Z=26. Cipherteks dihitung otomatis dari plainteks lewat fungsi-fungsinya (lihat `DIFFS` di `game.js`), dan diverifikasi dua arah oleh `node _selftest.js` — enkripsi dan rantai dekripsi dijamin saling mengembalikan.
