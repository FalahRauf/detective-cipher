# Kunci & Panduan Penilaian — Detective Cipher

Bahan buat presentasi. Jangan dibuka di depan kelas sebelum kelompok lain sempat mencoba.

**Kontrol:** WASD atau panah untuk jalan, **E** untuk memeriksa objek.

---

## Penting: pesan & kunci diacak tiap permainan

**Pesan asli, fungsi, dan lokasi petunjuk diacak setiap kali kasus dimulai.** Tidak ada satu
jawaban tetap yang bisa dihafal — ini disengaja supaya siswa benar-benar membaca petunjuk di
layar, bukan mengingat urutan klik.

Untuk melihat jawaban dari sesi yang sedang berjalan:

```bash
node _genkunci.js
```

Perintah itu mencetak, untuk ketiga kasus × ketiga mode: daftar fungsi per lapis, baris komposisi,
pesan asli, sandi hasilnya, dan tabel rantai enkripsi huruf per huruf.

---

## Aturan matematika yang selalu berlaku

| Aturan | Keterangan |
|---|---|
| Pemetaan huruf | `A = 1 … Z = 26`, spasi tidak dienkripsi |
| Modulo | hasil selalu dikembalikan ke 1–26 (`0` ditulis `26`) |
| Koefisien `a` | wajib **koprima dengan 26** (bukan kelipatan 2 atau 13) supaya punya invers |
| Urutan lapis | baris pertama kunci = **lapis terluar**; alat membuka dari baris pertama |

Contoh rantai satu huruf (mode EASY, `f(x) = 3x + 7`, `g(x) = x + 5`, `c = f(g(x))`):

```
K (11)  ←  g⁻¹(16) = 16 − 5 = 11  ←  f⁻¹(3) = 9(3 − 7) = −36 ≡ 16  ←  C (3)
```

---

## Tiga kasus

| # | Kasus | Lokasi | Rantai kunci | Petunjuk (E/N/H) |
|---|---|---|---|---|
| 01 | Rekaman 23.47 | Lab Komputer 2 | pot → lemari | 2 / 2 / 3 |
| 02 | Buku Besar Perpustakaan | Perpustakaan | keranjang → loker → brankas | 3 / 3 / 4 |
| 03 | Server Terkunci | Ruang Server | panel → rak B → cooling → vault | 3 / 4 / 4 |

Setiap kasus punya EASY (2 lapis), NORMAL (3 lapis), HARD (3 lapis + kunci disobek jadi 2–3 bagian).

---

## Yang dinilai

Karena perhitungan per huruf sudah dipegang alat, penilaian bergeser ke **pemahaman urutan lapis**:

1. **Apakah siswa menemukan pesan dan kunci yang benar** — bukan menebak barang secara acak.
   Semua barang bisa diperiksa; yang tidak menyimpan petunjuk memberi alasan kenapa kosong.
2. **Apakah siswa menempelkan kunci pada urutan yang benar.** Alat menolak dengan pesan
   *"Hasilnya belum jadi kalimat — cek urutan lapisnya"* kalau urutannya terbalik.
   Ini justru inti materinya: `f(g(x))` tidak sama dengan `g(f(x))`.
3. **Apakah siswa bisa menjelaskan kenapa urutan itu penting** — tanyakan langsung saat presentasi.

Alat juga menolak kunci yang tidak valid (`a` tidak koprima dengan 26) dan jumlah fungsi yang
tidak sesuai jumlah lapis mode.

---

## Alur lengkap (untuk demo)

1. Menu → pilih kasus di jalanan (senter mengikuti kursor) → pilih tingkat.
2. Cutscene CCTV → papan kasus → turun ke TKP.
3. Periksa barang-barang. Beberapa menyimpan **pesan terenkripsi** dan **sobekan kunci**.
4. Buka **alat dekripsi**, tempel sandi + kunci, jalankan.
5. Hasilnya menunjuk lokasi kunci pertama → buka → dapat kunci berikutnya → ulangi sampai bukti.
6. **Ruang interogasi** — tiga tersangka duduk diborgol. Sorot dengan lampu, klik untuk memilih.
   - Pelaku benar → cutscene pengakuan → ending **TERBUKTI**.
   - Salah → cutscene pintu di ujung koridor → ending **SALAH TUDUH** (−250 poin).

### Siapa pelakunya

| Kasus | Pelaku | Tersangka lain |
|---|---|---|
| 01 | **Pak Dedi** (Teknisi Lab) | Rian Pratama, Sinta Maharani |
| 02 | **Bu Ratna** (Pustakawan) | Yoga Saputra, Pak Slamet |
| 03 | **Pak Hendra** (Guru TKJ) | Mas Bagas, Dinda Ayu |

---

## Kalau ada yang macet

- **Alat bilang "jumlah fungsi belum pas"** → sobekan kunci belum lengkap, atau ada baris lain
  yang ikut tertempel. Cukup tempel ulang bagian `f(x) = …` saja.
- **Alat bilang "belum jadi kalimat"** → urutan baris terbalik. Coba tukar.
- **Kunci pertama tidak bisa dibuka** → dekripsi belum berhasil dijalankan.
- **Kunci berikutnya tidak bisa dibuka** → kunci sebelumnya belum diambil.
- **Tidak bisa masuk interogasi** → bukti terakhir belum diambil.

---

## Poin yang bisa dijelaskan waktu presentasi

- **Kenapa berlapis?** Hasil `g` dienkripsi lagi oleh `f` — itulah komposisi `(f ∘ g)(x)`.
- **Kenapa urutan penting?** `f(g(x))` dan `g(f(x))` memberi hasil berbeda. Alat menolak kalau
  urutannya salah, jadi siswa melihat langsung akibatnya, bukan cuma menghafal rumus.
- **Kenapa ada `mod 26`?** Huruf cuma 26. Hasil 45 dibungkus lagi ke 1–26 → 19. Hasil 0 ditulis 26.
- **Kenapa koefisien harus koprima dengan 26?** Agar fungsinya punya invers. Karena itu dipakai
  3, 5, 7 — bukan 2 atau 13.
- **Kenapa sandi menunjuk lokasi kunci, bukan langsung bukti?** Supaya matematikanya jadi gerbang
  wajib, bukan opsional. Tanpa sandi berhasil dibuka, kunci pertama tidak bisa diambil.
- **Kenapa kasus 3 lebih panjang?** Empat kunci berurutan, dan vault-nya menyimpan dua hard disk —
  supaya siswa merasakan bahwa satu kesalahan urutan menahan seluruh rantai.

---

## Catatan teknis

Huruf diubah ke angka dengan A=1, B=2, … Z=26. Sandi dihitung otomatis dari pesan lewat
fungsi-fungsi di blok `DIFFS` (`game.js`), dan `node _selftest.js` menjalankan **9 mode penuh**
(3 kasus × 3 tingkat, 168 assertion): sandi = enkripsi(pesan), semua koefisien koprima 26,
rantai kunci terbuka berurutan, bukti didapat, interogasi, dan layar akhir.

---

## Kredit

Tugas Matematika — Fungsi Komposisi & Fungsi Invers
**XI PPLG 4 · SMK Telkom Purwokerto**
