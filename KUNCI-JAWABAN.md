# Kunci & Panduan Penilaian — Detektif Cipher

Bahan untuk guru / presentasi. **Jangan dibuka di depan kelas** sebelum kelompok lain mencoba.

**Fungsi kunci, angka sandi, dan beberapa kode diacak setiap main baru**, jadi tidak ada tabel
sandi tetap. Yang tetap per kasus adalah **isi pesan**, **pelaku**, dan alur ceritanya. Cara
menghitungnya ada di bawah, dan semua angka yang dibutuhkan selalu ada di dalam game.

Untuk demo: tekan **`Shift + U`** di layar Berkas Kasus untuk membuka ketiga kasus sekaligus.

---

## Aturan matematika

| Kasus | Materi | Bentuk sandi | Cara membuka |
|---|---|---|---|
| 01 | Komposisi | `huruf = (f∘g)(n)` mod 26 | gabungkan `f(g(x)) = Ax + B`, masukkan tiap angka `n`, kurangi 26 sampai 1–26 |
| 02 | Invers | `sandi = f(huruf) = ax + b` | `f⁻¹(x) = (x − b) ÷ a` |
| 03 | Komposisi + invers | `sandi = (f∘g)(huruf)` (HARD: `f∘g∘h`) | gabungkan jadi `Ax + B`, lalu `(x − B) ÷ A` |

Huruf `A = 1 … Z = 26`. Kasus 2 dan 3 tidak memakai modulo, jadi hasil invers selalu bilangan bulat 1–26.

Contoh kasus 1: `f(x) = x + 2`, `g(x) = 5x − 1` → `(f∘g)(x) = 5x + 1`. Angka `2` → `11` → **K**.
Contoh kasus 2: `f(x) = 7x + 9` → `f⁻¹(x) = (x − 9) ÷ 7`. Angka `86` → `11` → **K**.

Alat hitung di game hanya memeriksa: langkah fungsi (salah −10) lalu huruf per huruf (salah −15).

**Urutan kata pesan juga diacak tiap main** (mis. `HARDISK B RAK DI ASLI`). Setelah semua huruf benar,
pemain menyusun kata-katanya jadi kalimat yang benar (salah −15). Tombol *urutkan otomatis* tersedia (−50).

---

## Kasus 01 — Rekaman 23.47

**Pesan:** `KUNCI DI BAWAH POT` · **Pelaku:** Pak Rudi (teknisi lab)

**Diacak tiap main:** posisi meja Alya (tukar dengan salah satu meja PC lain), nomor semua PC,
dua angka depan kode laci.

**Alur:** tanya Pak Darto (kartu teknisi tap 23.40; Citra sempat kembali ke gerbang 22.40) →
meja Alya (kursi merah marun, pesan) → sobekan kunci → hitung sandi → geser pot (kunci R. Teknisi +
catatan Alya berisi dua angka depan kode) → ruang teknisi → laci Pak Rudi:
**kode = dua angka dari catatan + nomor PC Alya** → kunci gudang → buka gudang → Alya ditemukan.

**Twist:** tas besar di CCTV berisi 240 lembar soal UAS, bukan Alya — Alya tak pernah keluar gedung.

**Tersangka:** Pak Rudi (pelaku) · Fajar (iri pada Alya, tapi keluar gerbang 22.00) ·
Citra (kembali ke gerbang 22.40, tapi tidak dibukakan dan kartunya tidak tercatat).

## Kasus 02 — Kopi Terakhir Bu Dewi

**Pesan:** `KODE BRANKAS ADA DI JAM` · **Pelaku:** Pak Gunawan (Wakasek Kurikulum)

**Diacak tiap main:** menit jam meja yang berhenti (16:39–16:46), jadi kode brankas juga berubah.

**Alur:** tanya Pak Udin & Alya → meja Bu Dewi (pesan) → sobekan kunci → hitung sandi →
jam meja yang jatuh di lantai → brankas **kode = angka jam itu tanpa titik dua** → meja kopi pantry
(dua cangkir) → daftar hadir rapat (**tanda tangan bertinta biru = palsu**) → Ruang Wakasek →
lemari Pak Gunawan (map biru + botol).

**Jebakan:** jam dinding masih berjalan (17.24) — bukan itu jam yang dimaksud.

**Tersangka:** Pak Gunawan (pelaku) · Bu Rina (bertengkar dengan Bu Dewi, tapi konseling 16.00–17.00) ·
Dimas (nilainya naik 54 → 88, tapi latihan futsal dan nilainya diubah lewat akun Wakasek).

## Kasus 03 — Api di Ruang Server

**Pesan:** `HARDISK ASLI DI RAK B` · **Pelaku:** Pak Surya Kencana (guru TKJ, "Pak K")

**Alur:** tanya Pak Darto (mobil Pak Surya dingin sejak 22.30) & Pak Surya (mengaku baru datang
dari rumah) → tabung pemadam → padamkan api di depan pintu belakang → panel listrik (sakelar
saling terkait) → panel alarm (kabel dipotong + kartu master #07) → terminal cadangan (pesan) →
sobekan kunci → hitung sandi → rak B pakai kartu master (hard disk) → terminal kontrol: log asli
**23.12, kartu #07 a.n. S. KENCANA** → jaket Salsa bersih tanpa jelaga.

**Tersangka:** Pak Surya (pelaku) · Mas Reza (kartu master dari lacinya, tapi pulang 17.04) ·
Salsa (jaketnya di TKP, tapi pulang 16.20 terekam kamera gerbang).

---

## Deduksi

Tiap kasus punya **bank 12 pertanyaan** di `js/data.js` (`deduce`). Setiap main diambil **5 secara
acak**, urutan pilihan jawaban juga diacak. Jawaban benar adalah opsi pertama di data. Salah −50.

## Yang dinilai

1. **Menghitung komposisi dengan benar** — `f(g(x))` dikerjakan dari dalam ke luar.
2. **Mencari invers** — kurangi dulu, baru bagi.
3. **Menggabungkan keduanya** (kasus 3) — `(f∘g)⁻¹` adalah invers dari fungsi gabungan.
4. **Menggabungkan petunjuk** — kode laci dan kode brankas hanya bisa ditemukan dengan
   menghubungkan dua catatan.

## Poin presentasi

- **Kenapa urutan komposisi penting?** `f(g(x))` umumnya ≠ `g(f(x))`. Coba hitung keduanya.
- **Kenapa invers kurangi dulu baru bagi?** Fungsi `ax + b` mengali dulu lalu menambah;
  membaliknya harus dari langkah terakhir: kurangi `b`, lalu bagi `a`.
- **Invers komposisi:** `(f∘g)⁻¹ = g⁻¹∘f⁻¹` — seperti melepas sepatu dulu baru kaus kaki.

## Kalau macet

| Gejala | Penyebab |
|---|---|
| Langkah huruf masih terkunci | langkah fungsi (komposisi / invers) belum benar |
| Alat bilang "kumpulkan pesan dan semua sobekan" | masih ada sobekan kunci yang belum ditemukan |
| Pot belum bisa digeser / rak B diam saja | sandi belum dibuka |
| Rak C / jerigen tidak bisa diperiksa | apinya belum dipadamkan |
| Terminal & rak mati (kasus 3) | listrik cadangan belum dinyalakan |
| Tombol DEDUKSI tidak muncul | masih ada langkah di panel TUGAS yang belum selesai |

Tombol **HT (H)** memberi arahan langkah yang sedang dikerjakan (−30 poin). Di alat hitung ada
petunjuk bertahap: −25, −50, −75, −100.

## Skor

Mulai 1000. Pengurang: HT −30, petunjuk alat −25 s/d −100, langkah fungsi salah −10, huruf salah −15,
kode salah −15, tanda tangan salah −30, deduksi salah −50, perangkap −50 s/d −80. Bonus sisa waktu
(½ poin per detik) kalau menang, lalu dikali pengali tingkat (EASY ×1, NORMAL ×1,25, HARD ×1,5).
Peringkat S / A / B / C.
