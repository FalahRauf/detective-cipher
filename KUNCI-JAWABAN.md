# Kunci & Panduan Penilaian — Kasus #01 "Rekaman 23.47"

Bahan buat presentasi. Jangan dibuka di depan kelas sebelum kelompok lain sempat mencoba.

**Kontrol:** WASD atau panah untuk jalan, **E** untuk memeriksa objek.

---

## Penting: pesan & kunci diacak tiap permainan

**Pesan asli, fungsi, dan lokasi petunjuk diacak setiap kali kasus dimulai.** Tidak ada satu
jawaban tetap yang bisa dihafal — ini disengaja supaya siswa benar-benar membaca petunjuk di
layar, bukan mengingat urutan klik.

Untuk melihat jawaban dari sesi yang sedang berjalan (atau mencetak contoh untuk guru):

```bash
node _genkunci.js
```

Perintah itu mencetak, untuk ketiga mode: daftar fungsi per lapis, baris komposisi, pesan asli,
sandi hasilnya, dan tabel rantai enkripsi huruf per huruf.

---

## Aturan matematika yang selalu berlaku

| Aturan | Keterangan |
|---|---|
| Pemetaan huruf | `A = 1 … Z = 26`, spasi tidak dienkripsi |
| Modulo | hasil selalu dikembalikan ke 1–26 (`0` ditulis `26`) |
| Koefisien `a` | wajib **koprima dengan 26** (bukan kelipatan 2 atau 13) supaya punya invers |
| Urutan lapis | baris pertama kunci = **lapis terluar**; alat menerapkan dari baris terakhir |

Contoh rantai satu huruf (mode EASY, `f(x) = 3x + 7`, `g(x) = x + 5`, `c = f(g(x))`):

```
K (11)  →  g: 11 + 5 = 16  →  f: 3·16 + 7 = 55 ≡ 3  →  C
```

---

## Tingkat kesulitan

| Mode | Lapis | Petunjuk yang harus dicari |
|---|---|---|
| EASY | 2 | pesan + 1 kunci |
| NORMAL | 3 | pesan + 1 kunci (tiga fungsi sekaligus) |
| HARD | 3 | pesan + **2 sobekan kunci** (kunci dipecah, disimpan terpisah) |

Pada HARD, siswa harus menemukan **tiga** barang sebelum alat bisa dijalankan — sobekan A berisi
baris komposisi + fungsi pertama, sobekan B berisi fungsi terakhir.

---

## Yang dinilai

Karena perhitungan per huruf sudah dipegang alat, penilaian bergeser ke **pemahaman urutan lapis**:

1. **Apakah siswa menemukan pesan dan kunci yang benar** — bukan menebak barang secara acak.
   Semua barang bisa diperiksa; yang tidak menyimpan petunjuk memberi alasan kenapa kosong.
2. **Apakah siswa menempelkan kunci pada urutan yang benar.** Alat menolak dengan pesan
   *"Hasilnya belum jadi kalimat — cek urutan lapisnya"* kalau urutannya terbalik.
   Ini justru inti materinya: `c = f(g(x))` tidak sama dengan `c = g(f(x))`.
3. **Apakah siswa bisa menjelaskan kenapa urutan itu penting** — tanyakan langsung saat presentasi.

Alat juga menolak kunci yang tidak valid (`a` tidak koprima dengan 26) dan jumlah fungsi yang
tidak sesuai jumlah lapis mode.

---

## Alur lengkap (untuk demo)

1. Menu → pilih kasus di jalanan (senter mengikuti kursor) → pilih tingkat.
2. Cutscene CCTV → papan kasus → turun ke TKP.
3. Periksa barang-barang di lab. Dua (atau tiga) di antaranya menyimpan **pesan** dan **kunci**.
4. Buka **alat dekripsi** di komputer guru, tempel sandi + kunci, jalankan.
   Hasilnya harus cocok dengan catatan sistem.
5. Hasilnya berbunyi *"KUNCI … DI POT"* → menunjuk **pot** di sudut ruangan → geser pot → ambil kunci.
6. Buka **lemari arsip** → flashdisk bukti.
7. **Ruang interogasi** — tiga tersangka duduk diborgol. Sorot dengan lampu, klik untuk memilih.
   - Pelaku benar → cutscene pengakuan → ending **TERBUKTI**.
   - Salah → cutscene pintu di ujung koridor → ending **SALAH TUDUH** (−250 poin).

---

## Kalau ada yang macet

- **Alat bilang "jumlah fungsi belum pas"** → sobekan kunci belum lengkap, atau ada baris lain
  yang ikut tertempel. Cukup tempel ulang bagian `f(x) = …` saja.
- **Alat bilang "belum jadi kalimat"** → urutan baris terbalik. Coba tukar.
- **Pot tidak bisa digeser** → sandi belum berhasil dibuka.
- **Lemari tidak bisa dibuka** → kunci belum diambil dari bawah pot.

---

## Poin yang bisa dijelaskan waktu presentasi

- **Kenapa berlapis?** Hasil `g` dienkripsi lagi oleh `f` — itulah komposisi `(f ∘ g)(x)`.
- **Kenapa urutan penting?** `f(g(x))` dan `g(f(x))` memberi hasil berbeda. Alat menolak kalau
  urutannya salah, jadi siswa melihat langsung akibatnya, bukan cuma menghafal rumus.
- **Kenapa ada `mod 26`?** Huruf cuma 26. Hasil 45 dibungkus lagi ke 1–26 → 19. Hasil 0 ditulis 26.
- **Kenapa koefisien harus koprima dengan 26?** Agar fungsinya punya invers. Karena itu dipakai
  3, 5, 7 — bukan 2 atau 13.
- **Kenapa sandi menunjuk pot, bukan langsung lemari?** Supaya matematikanya jadi gerbang wajib,
  bukan opsional. Tanpa sandi berhasil dibuka, pot tidak bisa digeser.

---

## Catatan teknis

Huruf diubah ke angka dengan A=1, B=2, … Z=26. Sandi dihitung otomatis dari pesan lewat
fungsi-fungsi di blok `DIFFS` (`game.js`), dan `node _selftest.js` memverifikasi bahwa hasil
alat selalu cocok dengan sandi kasus, urutan terbalik selalu ditolak, dan koefisien selalu
koprima dengan 26.

---

## Kredit

Tugas Matematika — Fungsi Komposisi & Fungsi Invers
**XI PPLG 4 · SMK Telkom Purwokerto**
