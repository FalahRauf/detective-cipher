# SARAN KASUS PEMBUNUHAN — #04 s/d #07

Kasus sekarang (penculikan, buku hilang, hard disk hilang) kurang punya taruhan. Pembunuhan
memperbaiki itu secara struktural: **alibi jadi hidup-mati**. Sistem yang sudah ada — kartu akses,
timestamp CCTV, tiga tersangka, vonis — justru baru terasa "wajar" kalau korbannya meninggal.

Catatan nada: semua kasus ditulis **non-grafis**. Mayat "ditemukan", tidak ada adegan kekerasan,
fokusnya deduksi. Ini standar genre detektif (Conan, Agatha Christie) dan aman untuk presentasi kelas.

---

## #04 — "Jam Terakhir Bu Ratna" ⭐ paling kuat secara cerita

**Lokasi:** Ruang guru, pukul 16.30 (sepulang sekolah)
**Korban:** Bu Ratna — **guru matematika**. Dia yang mengajarkan komposisi fungsi.
**Temuan:** Duduk di mejanya, kopi di tangan. Tidak ada tanda kekerasan. Di tangannya, sobekan
kertas berisi deretan huruf acak — **pesan terakhir yang belum selesai dia tulis.**

**Twist matematika — pesan setengah jadi.**
Bu Ratna sempat mengenkripsi, tapi tidak sempat menyelesaikannya. Cipherteks yang ada hanya
cukup untuk **separuh kalimat**. Siswa mendekripsi apa yang ada, lalu mendapati hasilnya ambigu:

```
DI ... (terputus)
```

Bisa "DI LACI", "DI LAB", "DI LEMARI". Data yang tidak lengkap **tidak bisa** langsung dipakai —
harus dicocokkan dengan bukti fisik lain (laci mana yang baru dibuka, debu yang terganggu).

**Twist detektif.** Pembunuhnya adalah orang yang **menemukan** jasadnya dan menelepon. Dia harus
jadi yang pertama "menemukan" supaya bisa mengarahkan penyelidikan. Alibinya: rapat sampai 16.00 —
tapi daftar hadir rapat menunjukkan tanda tangannya **dipalsukan** (tinta berbeda, dan dia tercatat
di dua tempat sekaligus pada jam yang sama).

**Kenapa bagus:**
- Guru matematika memakai pelajarannya sendiri untuk meninggalkan pesan — penutup presentasi yang sempurna.
- "Data tidak lengkap → butuh korelasi" itu cara berpikir ilmiah, bukan cuma hitung.
- Cipher yang terpotong = alasan alami kenapa pesannya pendek.

**Mekanik baru:** objek punya status "baru dibuka" (debu terganggu). Ringan.

---

## #05 — "Dua Jawaban yang Benar" ⭐⭐ terbaik untuk nilai matematika

**Lokasi:** Lab Kimia
**Korban:** Pak Hasan, laboran
**Temuan:** Pagi hari. Pintu terkunci dari dalam, jendela berteralis. Racun di gelasnya.
Ruang tertutup rapat — tidak ada yang bisa masuk.

**Twist matematika — fungsi kuadrat, dua kemungkinan.**
Pesan terakhir korban memakai fungsi **kuadrat**, bukan linear:

```
f(x) = x²  (mod 26)
```

Kuadrat **tidak punya invers** — banyak nilai x memetakan ke hasil yang sama. Akibatnya dekripsi
menghasilkan **dua jawaban yang sama-sama benar**:

```
DI GUDANG   atau   DI GUDANG LAMA
```

Dua lokasi. Dua-duanya valid secara matematika.

**Twist detektif.** Salah satu lokasi adalah **jebakan**: pembunuh menaruh dompet korban di sana
supaya penyelidikan mengarah ke orang lain. Yang lain adalah tempat bukti sebenarnya.

Cara memilih cabang yang benar: **gudang lama sudah disegel dan tidak dibuka sejak bulan lalu**
(ada segel utuh, gembok berdebu). Berarti tidak ada yang bisa menaruh apa pun di sana semalam.
Maka hanya cabang satunya yang mungkin.

**Ini yang bikin kasus ini luar biasa:** siswa **wajib** sadar bahwa invers fungsi kuadrat butuh
batas domain. Kalau mereka asal ambil satu cabang, mereka bisa menuduh orang yang salah —
dan permainan memberi tahu itu terjadi.

**Kenapa bagus:**
- Satu-satunya kasus yang mengajarkan **syarat fungsi punya invers** secara langsung dan tak terlupakan.
- Ambiguitas sebagai mekanik permainan — bukan sekadar soal hitung.
- Salah pilih cabang = salah tuduh. Konsekuensi nyata.

**Mekanik baru:** alat dekripsi menampilkan **beberapa kandidat huruf per posisi** (karena hasil
kuadrat tidak unik). Pemain memilih kombinasi yang membentuk kata bermakna. Perlu UI tambahan —
effort sedang, tapi ini fitur paling berharga dari semua saran.

---

## #06 — "Kesalahan Si Pembunuh"

**Lokasi:** Ruang OSIS
**Korban:** Ketua OSIS
**Temuan:** Ditemukan malam hari. Pelaku meninggalkan **pesan menantang** — dia pikir dirinya jenius.

**Twist matematika — urutan komposisi tertukar.**
Pesan itu dienkripsi dengan urutan yang **salah**: pelaku memakai `g∘f`, padahal kunci yang
ditemukan di TKP adalah `f∘g`. Jadi pesan itu **tidak bisa dibaca** dengan kunci yang ada.

Siswa harus sadar: **`f∘g ≠ g∘f`**. Tukar urutannya, dan pesannya terbaca.

**Twist detektif.** Kesalahan itu sendiri adalah petunjuk: hanya orang yang **tahu kuncinya tapi
tidak paham urutannya** yang bisa membuat kesalahan itu. Artinya pelaku bukan yang paling ahli —
tapi orang baru yang pernah diberi kunci. Ini mempersempit tersangka dari tiga jadi satu.

**Kenapa bagus:**
- `f∘g ≠ g∘f` biasanya cuma dihafal. Di sini kesalahan pelaku **jadi bukti**.
- Pelaku "pintar tapi salah" jauh lebih menarik daripada pelaku bodoh.

**Mekanik baru:** tombol tukar urutan di alat dekripsi (`f⁻¹∘g⁻¹` ↔ `g⁻¹∘f⁻¹`). Ringan.

---

## #07 — "Kunci Palsu"

**Lokasi:** Ruang Kepala Sekolah
**Korban:** Kepala Sekolah
**Temuan:** Di kursinya. Ada dua set petunjuk — satu mencolok, satu tersembunyi.

**Twist matematika — kunci yang tidak bisa dipakai.**
Petunjuk yang mencolok memberi fungsi dengan koefisien **2** — dan 2 tidak koprima dengan 26.
Fungsi itu **tidak punya invers**. Alat dekripsi akan menolak:

> *"Koefisien 2 tidak punya invers mod 26 — kunci ini tidak valid."*

Itu bukan error. Itu teka-tekinya. Kunci asli disembunyikan, dan harus diturunkan dari hasil
komposisi (pola yang sama dengan kasus 1 HARD).

**Twist detektif — dua kriminal.**
Kunci palsu itu ditanam oleh **Wakil Kepala Sekolah**, yang sedang menutupi penggelapan dana —
bukan oleh pembunuhnya. Jadi ada dua orang bersalah, dan pemain harus menuduh **yang benar**
untuk pembunuhan, bukan yang paling kelihatan bersalah.

**Kenapa bagus:**
- Mengajarkan syarat fungsi invertibel (bijektif) secara langsung.
- Dua lapis misteri — paling menantang, cocok jadi penutup seri.

**Mekanik baru:** pesan penolakan alat yang jelas + petunjuk kedua yang tersembunyi. Effort tinggi.

---

## Ringkasan

| # | Kasus | Twist matematika | Mekanik baru | Effort |
|---|---|---|---|---|
| 04 | Jam Terakhir Bu Ratna | Pesan terpotong → data tak lengkap | status "baru dibuka" | rendah |
| 05 | Dua Jawaban yang Benar | Kuadrat tanpa batas domain → 2 jawaban | kandidat huruf per posisi | sedang |
| 06 | Kesalahan Si Pembunuh | `f∘g ≠ g∘f` | tombol tukar urutan | rendah |
| 07 | Kunci Palsu | Koefisien tak koprima → tak ada invers | pesan tolak + kunci tersembunyi | tinggi |

## Rekomendasi

**Kerjakan #05 duluan.** Itu satu-satunya kasus yang mengajarkan konsep yang belum tersentuh
sama sekali (syarat fungsi punya invers), dan ambiguitas dua jawaban adalah mekanik detektif
paling kuat dari semua saran di atas. Kalau presentasi butuh satu kasus yang bikin guru terkesan,
ini dia.

**#04 nomor dua** kalau yang kamu utamakan cerita — guru matematika meninggalkan pesan terakhir
pakai pelajarannya sendiri adalah penutup yang sulit dikalahkan secara emosional.

**#06 paling murah** kalau mau nambah kasus cepat tanpa kerja UI baru.

**#07 simpan terakhir** — paling berisiko bikin pemain frustrasi.

## Kalau mau lebih gelap lagi

Kasus 2 dan 3 yang sekarang bisa **diganti** jadi #04 dan #06, supaya ketiga kasus seragam
bertema pembunuhan. Cerita lama tetap ada di riwayat git kalau nanti mau dikembalikan.
