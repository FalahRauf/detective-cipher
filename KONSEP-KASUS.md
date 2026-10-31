# KONSEP KASUS BERIKUTNYA — Detective Cipher

Roadmap lengkap: **3 kasus × 3 tingkat (EASY / NORMAL / HARD)**. Setiap kasus mengangkat satu sub-materi
berbeda dari bab Komposisi & Invers Fungsi, jadi kalau tiga-tiganya selesai, seluruh materi bab tercakup:

| Kasus | Judul | Sub-materi utama | Status |
|---|---|---|---|
| #01 | Rekaman 23.47 (kasus penculikan) | Komposisi dua & tiga fungsi, invers tiap lapis, menentukan fungsi dari komposisi | ✅ selesai (3 mode) |
| #02 | Buku Besar Perpustakaan | Invers dari komposisi fungsi: `(f∘g)⁻¹ = g⁻¹∘f⁻¹` + urutan lapis | 🔒 konsep |
| #03 | Server Terkunci | Menentukan fungsi kanan/kiri dari hasil komposisi | 🔒 konsep |

Mesinnya sudah data-driven (blok `DIFFS` di `game.js`), jadi kasus baru = data baru
(fungsi, plainteks, dialog, petunjuk) + peta baru — tidak perlu menyentuh logika dekripsi lagi.

---

## Kasus #02 — "Buku Besar Perpustakaan"

**Latar:** Perpustakaan SMK, sore hari. Koleksi buku praktikum kelas XI hilang dari rak cadangan.
Komputer sirkulasi meninggalkan satu file `retur.txt` berisi deretan huruf acak. Petugas curiga
karena log sistem mencatat dua transaksi aneh berurutan.

**Lokasi petunjuk (peta perpustakaan):** rak D (fungsi lapis luar), kartu pinjam sobek di meja
sirkulasi (fungsi lapis dalam), komputer sirkulasi (cipherteks + meja dekripsi), dan satu objek
penjebak seperti "pot" di kasus #01 (misal buku berlubang yang digunakan menyimpan kunci gudang).

### Matematika per tingkat

| Mode | Lapis | Kunci (draft) | Plainteks (draft) | Twist |
|---|---|---|---|---|
| EASY | 2 | `f(x) = 5x + 9`, `g(x) = x + 8` | `CEK RAK DUA` | Persis pola kasus #01 — invers ditampilkan |
| NORMAL | 3 | `f(x) = 5x + 9`, `g(x) = x + 8`, `h(x) = x − 9` | `LACI BAWAH B` | Invers diturunkan sendiri (pola #01 NORMAL) |
| HARD | 2 | `f(x) = 5x + 9`, `g(x) = x + 8` | `GUDANG BAWAH` | **Urutan lapis tertukar: `c = g(f(x))`, bukan `f(g(x))`** |

**Twist HARD — jantung kasus ini:** petunjuk menampilkan kedua fungsi tanpa menyebut mana yang
dipakai lebih dulu. Petunjuk tersirat ada di log sistem ("fungsi baru dicatat *setelah* pemadaman")
yang berarti `f` dipakai duluan → enkripsinya `c = g(f(x))` → dekripsi `x = f⁻¹(g⁻¹(c))`.
Siswa yang asal memakai `g⁻¹∘f⁻¹` akan menghasilkan huruf sampah — dan meja dekripsi **mendeteksi**
hasil yang bukan kata bermakna lalu memberi feedback: *"Hasilnya tidak bermakna. Cek urutan lapismu."*
Ini melatih sifat **`(f∘g)⁻¹ = g⁻¹∘f⁻¹`** secara kontekstual: urutan itu penting.

**Mekanik tambahan yang layak dibuat:** toggle urutan di meja dekripsi (dua tombol `g⁻¹∘f⁻¹` /
`f⁻¹∘g⁻¹`), skor berkurang tiap kali "PERIKSA" gagal karena urutan salah.

**Ending:** tersangka 3 orang (petugas piket, kapten kelas, siswa pengurus perpustakaan);
pelaku ditentukan oleh stempel pengembalian palsu.

---

## Kasus #03 — "Server Terkunci"

**Latar:** Lab server sekolah, malam sebelum ujian. File soal dienkripsi orang dalam dan folder
ujian terkunci. Pesan penyerang tertinggal di monitor. Kasus penutup — paling menegangkan.

**Lokasi petunjuk (peta ruang server):** panel jaringan (fungsi diketahui), printout log
(hasil komposisi), monitor (cipherteks + meja dekripsi), lemari server (kunci fisik, pola pot/lemari #01).

### Matematika per tingkat

| Mode | Lapis | Yang diketahui | Yang harus diturunkan | Plainteks (draft) |
|---|---|---|---|---|
| EASY | 2 | `f(x) = 5x + 4` dan `(f∘g)(x) = 15x + 19` | `g(x) = 3x + 3` (fungsi kanan) | `BUKA PINTU` |
| NORMAL | 2 | `g(x) = x + 6` dan `(f∘g)(x) = 5x + 23` | `f(x) = 5x − 7` (fungsi kiri, substitusi `t = x + 6`) | `FILE DI SERVER` |
| HARD | 3 | `h(x) = x + 4`, `(g∘h)(x) = 3x + 15`, `(f∘g∘h)(x) = 21x + 62` | `g(x)` lalu `f(x)`, berantai | `JANGAN FORMAT` |

**Cek konsistensi draft EASY:** `5·g(x) + 4 = 15x + 19 → g(x) = (15x + 15)/5 = 3x + 3` ✓ (semua koefisien koprima dengan 26).
**Cek draft NORMAL:** `f(x+6) = 5x + 23; misal t = x + 6 → f(t) = 5(t − 6) + 23 = 5t − 7` ✓.
Draft HARD sengaja belum dikunci angkanya — dicek ulang saat implementasi (koefisien wajib koprima 26,
hasil substitusi harus bulat).

**Twist HARD — berantai:** menurunkan `g` dari `(g∘h)` lebih dulu, baru memakai `g` untuk menurunkan
`f` dari `(f∘g∘h)`. Meja dekripsi memakai dua panel turunan bertingkat (pola derive dari #01 HARD,
diperluas jadi dua tahap). Persis materi "komposisi tiga fungsi + menentukan fungsi".

**Ending:** kombinasi dekripsi + log akses server menunjuk pelaku; layar penutup menampilkan
ringkasan 3 kasus + bagan sifat `(f∘g)⁻¹ = g⁻¹∘f⁻¹` — cocok jadi penutup presentasi.

---

## Rencana implementasi (urutan kerja)

1. **Bangun kerangka multi-kasus** — ubah `DIFFS` menjadi `CASES[id].diffs` (struktur sudah mendukung:
   `buildCase`, `buildCells`, `buildFormulaBar` semuanya membaca `CASE.layers`).
2. **Kasus #02 EASY + NORMAL dulu** (pola sudah ada di #01, kerja paling sedikit: peta + dialog + data fungsi).
3. **Kasus #02 HARD** — tambah toggle urutan + deteksi "hasil tidak bermakna".
4. **Kasus #03** — tambah panel derive bertingkat untuk HARD; EASY/NORMAL tinggal data.
5. Tiap selesai satu mode, jalankan `node _selftest.js` (diperluas per kasus) supaya enkripsi-dekripsi
   selalu diverifikasi dua arah, dan `node _genkunci.js` untuk mencetak tabel kunci jawaban.

Aturan matematika yang tetap berlaku untuk semua kasus: koefisien `a` wajib **koprima dengan 26**
(bukan kelipatan 2 atau 13), plainteks tanpa angka/tanda baca, spasi tidak dienkripsi,
dan hasil `mod 26` bernilai 1–26 (0 ditulis 26).
