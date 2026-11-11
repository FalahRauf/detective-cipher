# Kunci & Panduan Penilaian — Detektif Sandi

Bahan untuk guru / presentasi. **Jangan dibuka di depan kelas** sebelum kelompok lain mencoba.

Cetak tabel sandi lengkap kapan saja dengan:

```bash
node _genkunci.js
```

Pesan dan fungsi **tetap** per kasus + tingkat (jadi jawabannya bisa dinilai). Yang diacak setiap
main hanya **lokasi sobekan kunci** dan posisi perangkap.

Untuk demo: tekan **`Shift + U`** di layar Berkas Kasus untuk membuka ketiga kasus sekaligus.

---

## Aturan matematika

| Aturan | Keterangan |
|---|---|
| Pemetaan huruf | `A = 1 … Z = 26`, spasi tidak dienkripsi |
| Modulo | hasil dikembalikan ke 1–26 (`0` ditulis `26`) |
| Koefisien `a` | wajib koprima dengan 26 supaya punya invers (dipakai 3, 5, 7, 9) |
| Urutan buka | lapis **terluar** dulu: untuk `c = f(g(h(x)))` pakai f⁻¹, lalu g⁻¹, lalu h⁻¹ |

Invers yang muncul: 3⁻¹ = 9, 5⁻¹ = 21, 7⁻¹ = 15, 9⁻¹ = 3 (mod 26).

---

## Kasus 01 — Rekaman 23.47

**Pesan:** `KUNCI DI BAWAH POT` · **Pelaku:** Pak Dedi (teknisi lab)

| Mode | Fungsi | Sandi |
|---|---|---|
| EASY | f = 3x+7, g = x+5 | `CGLEW HW BYMYT ROD` |
| NORMAL | f = 3x+7, g = x+5, h = x−6 | `KOTME PE JGUGB ZWL` |
| HARD | f = 5x+2, g = 3x+3, h = x−4 | `RLKBN QN MXPXY OZW` |

**Alur:** tanya Pak Joko (kartu teknisi tap 23.40) → meja Nayla PC-17 (pesan) → sobekan kunci →
dekripsi → geser pot (kunci R. Teknisi + catatan Nayla) → ruang teknisi → laci Pak Dedi
**kode 2317** (2-3 + nomor PC 17) → kunci gudang → buka gudang → Nayla ditemukan.

**Twist:** tas besar di CCTV berisi 240 lembar soal UAS, bukan Nayla — Nayla tak pernah keluar gedung.
Bukti pendukung: jaket Pak Dedi basah (ia mengaku pulang sebelum hujan), printer teknisi masih hangat.

**Deduksi:** kartu teknisi · Nayla dikunci di gudang · tas berisi soal UAS.

## Kasus 02 — Kopi Terakhir Bu Ratna

**Pesan:** `KODE BRANKAS ADA DI JAM` · **Pelaku:** Pak Bram (Wakasek Kurikulum)

| Mode | Fungsi | Sandi |
|---|---|---|
| EASY | f = 5x+3, g = x+4 | `ZTQV GIBOZBN BQB QP UBJ` |
| NORMAL | f = 5x+3, g = x+4, h = 3x−2 | `VDUJ QWBOVBL BUB UR GBZ` |
| HARD | f = 7x+1, g = 5x+6, h = x−9 | `ISXG FTWJIWC WXW XQ ZWA` |

**Alur:** tanya Pak Slamet & Nayla → meja Bu Ratna (pesan) → sobekan kunci → dekripsi →
jam meja yang jatuh di lantai berhenti di **16:42** → brankas **kode 1642** (kunci R. Wakasek +
catatan Bu Ratna) → meja kopi pantry (dua cangkir) → daftar hadir rapat (**tanda tangan bertinta
biru = palsu**) → Ruang Wakasek → lemari Pak Bram (map biru + botol).

**Jebakan:** jam dinding masih berjalan (17.24) — bukan itu jam yang dimaksud.

**Deduksi:** 16.42 · lewat cangkir kopi dari pantry · alibi Pak Bram dipalsukan.

## Kasus 03 — Api di Ruang Server

**Pesan:** `HARDISK ASLI DI RAK B` · **Pelaku:** Pak Hendra Kusuma (guru TKJ, "Pak K")

| Mode | Fungsi | Sandi |
|---|---|---|
| EASY | f = 7x+2, g = x+8 | `JMBHQIE MILQ HQ BME T` |
| NORMAL | f = 7x+2, g = 3x+5, h = x−3 | `LUNFGIW UIRG FG NUW P` |
| HARD | f = 9x+4, g = 5x−7, h = 3x+10 | `OFMUTRD FRIT UT MFD K` |

**Alur:** tanya Pak Joko (mobil Pak Hendra dingin sejak 22.30) & Pak Hendra (mengaku baru datang
dari rumah) → ambil tabung pemadam → padamkan api yang menutup pintu belakang → panel listrik
(puzzle sakelar: tiap tuas membalik tuas kiri-kanannya) → panel alarm (kabel dipotong + kartu
master #07) → terminal cadangan (pesan) → sobekan kunci → dekripsi → rak B pakai kartu master
(hard disk) → terminal kontrol: log asli **23.12, kartu #07 a.n. H. KUSUMA** → jaket Dinda bersih
tanpa jelaga.

**Twist:** guru yang memanggil detektif di kasus 1 adalah dalangnya. Petunjuk kecil sudah ditanam
sejak awal: payung Pak Hendra di koridor, mejanya yang "terlalu rapi", senyumnya di epilog kasus 1.

**Deduksi:** bahan bakar dituang · jaket ditaruh setelah api menyala · Pak Hendra berbohong.

---

## Yang dinilai

1. **Menemukan pesan dan kunci yang benar** — bukan menebak barang acak.
2. **Menyusun urutan lapis dengan benar.** Di NORMAL/HARD sobekan tertempel sesuai urutan
   ditemukan, jadi siswa harus membaca baris `c = …` dan mengurutkan ulang. Urutan salah ditolak.
3. **Menjelaskan kenapa urutan penting** — tanyakan saat presentasi: kenapa f⁻¹ dulu, bukan g⁻¹?
4. **Menggabungkan petunjuk** — kode laci (kasus 1) dan kode brankas (kasus 2) hanya bisa
   ditemukan dengan menghubungkan dua catatan.

## Poin presentasi

- **Kenapa berlapis?** Hasil `g` dienkripsi lagi oleh `f` — itu komposisi `(f ∘ g)(x)`.
- **Kenapa dibuka terbalik?** `(f ∘ g)⁻¹ = g⁻¹ ∘ f⁻¹`. Yang terakhir dipakai, pertama dilepas —
  seperti memakai kaus kaki lalu sepatu, melepasnya sepatu dulu.
- **Kenapa `a` harus koprima dengan 26?** Supaya ada `a⁻¹` (mod 26). Dengan `a = 2` atau `13`,
  dua huruf berbeda bisa jadi huruf sandi yang sama — tidak bisa dibalik.
- **Kenapa ada mod 26?** Huruf cuma 26. Hasil 45 dibungkus jadi 19; hasil 0 ditulis 26.

## Kalau macet

| Gejala | Penyebab |
|---|---|
| "Jumlah fungsi belum pas" | masih ada sobekan kunci yang belum ditemukan |
| "Hasilnya belum jadi kalimat" | urutan lapis terbalik — pakai ▲▼ |
| Pot belum bisa digeser / rak B diam saja | sandi belum dibuka |
| Rak C / jerigen tidak bisa diperiksa | apinya belum dipadamkan |
| Terminal & rak mati (kasus 3) | listrik cadangan belum dinyalakan |
| Tombol DEDUKSI tidak muncul | masih ada langkah di panel TUGAS yang belum selesai |

Tombol **HT (H)** selalu memberi arahan untuk langkah yang sedang dikerjakan (−30 poin).

## Skor

Mulai 1000. Pengurang: HT −30, kode salah −15, tanda tangan salah −30, deduksi salah −50,
perangkap −50 s/d −80. Bonus sisa waktu (½ poin per detik) kalau menang, lalu dikali
pengali tingkat (EASY ×1, NORMAL ×1,25, HARD ×1,5). Peringkat S / A / B / C.
