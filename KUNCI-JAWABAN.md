# KUNCI JAWABAN — Kasus #01 "Pesan Terakhir di Lab"

Bahan buat presentasi. Jangan dibuka di depan kelas sebelum kelompok lain sempat mencoba.

**Kontrol:** WASD atau tombol panah untuk jalan, **E** untuk memeriksa objek yang ditandai.

## Kunci yang dipakai

| | Fungsi | Invers |
|---|---|---|
| Lapis luar | `f(x) = 3x + 7` | `f⁻¹(y) = 9(y − 7) mod 26` |
| Lapis dalam | `g(x) = x + 5` | `g⁻¹(y) = y − 5 mod 26` |

Enkripsi: `c = f(g(x))` — jadi dekripsi harus dibalik: **`x = g⁻¹(f⁻¹(c))`**

Kenapa `9`? Karena `3 · 9 = 27 ≡ 1 (mod 26)`. Membagi dengan 3 sama saja dengan mengalikan 9 dalam modulo 26. Ini yang bikin `f` bisa dibalik.

## Cipherteks

```
C G L E W   H W   R O D
```

## Tabel pengerjaan

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

**Hasil: `KUNCI DI POT`**

## Alur kasus

1. **Monitor meja guru** → cipherteks `CGLEW HW ROD`
2. **Papan tulis** → `f(x) = 3x + 7`
3. **Tempat sampah** → `g(x) = x + 5`
4. **Meja dekripsi** → hasil `KUNCI DI POT`
5. **Pot tanaman** (dekat dispenser, sudut kanan bawah) → pot digeser → **kunci lemari** di bawahnya
6. **Lemari arsip** → dibuka pakai kunci → log akses: `16.40 — KARTU TEKNISI — PAK DEDI`
7. **Tuduh** → Pak Dedi

Alasannya: Pak Dedi mengaku pulang jam 16.00, tapi kartu aksesnya sendiri tercatat tap masuk pukul 16.40. Rian ada di kantin dengan dua saksi, Sinta terekam CCTV di perpustakaan.

Catatan: pot **tidak bisa diperiksa sama sekali** sebelum sandi dipecahkan — tanda interaksinya baru muncul setelah pesan terbaca. Jadi matematikanya wajib dikerjakan dulu.

## Poin yang bisa dijelaskan waktu presentasi

- **Kenapa dua lapis?** Karena satu fungsi saja tidak cukup — pesannya harus dienkripsi `g` dulu, baru hasilnya dienkripsi `f`. Ini yang namanya **komposisi fungsi** `(f ∘ g)(x)`.
- **Kenapa urutan invers dibalik?** Karena yang dipasang terakhir harus dibuka duluan. Kalau `g` dipasang dulu lalu `f`, maka `f⁻¹` harus dibuka dulu, baru `g⁻¹`. Sama seperti pakai kaos dalam lalu kemeja — dibukanya kemeja dulu.
- **Kenapa ada `mod 26`?** Huruf cuma 26. Kalau hasil fungsinya 45, kita bungkus lagi ke rentang 1–26. 45 − 26 = 19.
- **Kenapa hasil 0 ditulis 26?** Karena tidak ada huruf ke-0. 0 dan 26 adalah posisi yang sama dalam modulo 26.
- **Kenapa sandinya menunjuk ke pot, bukan langsung ke lemari?** Karena kalau sandinya "lemari biru", pemain bisa langsung buka lemari tanpa menyelesaikan apa pun. Dua langkah (pot → kunci → lemari) memaksa pemain menyelesaikan dekripsi dulu, baru dapat kunci fisiknya.

## Catatan teknis (kalau ditanya)

Huruf diubah ke angka dengan A=1, B=2, … Z=26. Koefisien `f` harus **koprima dengan 26** supaya inversnya ada — karena itu dipakai 3, bukan 2 atau 13. Kalau koefisiennya 2, dua huruf berbeda bisa menghasilkan cipher yang sama dan pesannya tidak bisa dibalik.
