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

| # | Kasus | Kejahatan | Lokasi | Peta | Langkah |
|---|---|---|---|---|---|
| 01 | **Rekaman 23.47** | Penculikan | Lab Komputer 2 | 28 × 18 | 2 |
| 02 | **Jam Terakhir Bu Ratna** | **Pembunuhan** | Ruang Guru | 30 × 20 | 4 |
| 03 | **Api di Ruang Server** | **Pembakaran sengaja** | Ruang Server Lt. 3 | 32 × 20 | 6 |

Satu TKP besar per kasus: perabot nempel dinding, tengah terbuka untuk menyelidik.
**Alat dekripsi dibawa detektif** — buka lewat tombol **ALAT** di HUD atau tombol **T**.
Tidak ada meja/komputer dekripsi di TKP: alatnya selalu ikut si detektif.

### Rantai penemuan tiap kasus (sengaja dibedakan)

**Kasus 1 — pot → kunci → lemari**
Dekripsi pesan → pot digeser → kunci → lemari arsip → bukti.

**Kasus 2 — korban → loker → jas → brankas** *(rantai terpanjang, ada twist)*
Dekripsi pesan → **laci meja korban** → kunci loker → **loker guru** → kunci brankas + catatan
"jas cadangan di lemari arsip" → **lemari arsip** (temukan jas korban, kunci kedua di sakunya)
→ **brankas** (butuh dua kunci) → bukti.

**Kasus 3 — padamkan api dulu** *(mekanik unik)*
Dekripsi pesan → **ambil tabung pemadam** → **padamkan api di lantai** (api benar-benar menutup
satu-satunya celah di dinding partisi — selama menyala, sayap belakang tidak bisa dicapai;
begitu padam, celahnya langsung bisa dilewati) → panel alarm *(tidak bisa di-interaksi sebelum
api padam dan bekasnya diperiksa — promptnya baru muncul saat giliran langkah itu)*
→ kunci kartu → rak B → kunci tabung → unit pendingin → kunci induk → vault → bukti.

Jadi tiap kasus punya **alur yang berbeda**, bukan sekadar ganti nama objek.

Tiap kasus punya **EASY / NORMAL / HARD**, jadi total **9 mode**. Yang naik bukan cuma enkripsinya —
**perangkap buatan pelaku** tersebar di lantai pada mode yang lebih sulit:

| Mode | Lapis fungsi | Sobekan kunci | Perangkap |
|---|---|---|---|
| EASY | 2 | 1 | — |
| NORMAL | 3 | 1 | 2 perangkap |
| HARD | 3 | 2–3 (tergantung kasus) | 4 perangkap |

### Perangkap

Pelaku memasang perangkap untuk menghalangi penyelidikan. Posisinya **acak tiap main**.
Di **NORMAL** tandanya kelihatan jelas (kabel dengan kilau logam, tali tipis, retakan lantai);
di **HARD** sengaja dibuat **translusen/samar** — harus diperhatikan benar-benar:

| Perangkap | Penalti | Efek |
|---|---|---|
| Kabel alarm | −100 | alarm berbunyi |
| Tali umpan | −60 | tersandung |
| Lantai rapuh | −80 | jatuh, kembali ke titik masuk |

Badge **AWAS PERANGKAP × n** di HUD menunjukkan jumlahnya, dan berubah merah kalau kamu
mengetahui ada yang terpicu.

Jumlah petunjuk naik mengikuti kasus: kasus 1 = 2–3 petunjuk, kasus 2 = 3–4, kasus 3 = 3–4.

## Alur Permainan

1. **Pilih kasus di jalanan** — senter mengikuti kursor. Tiga sosok hitam = tiga kasus.
2. **Popup kasus & tingkat** — pilih EASY / NORMAL / HARD.
3. **Cutscene CCTV** — kamera malam itu, caption mengetik sendiri.
4. **Papan kasus** — foto terpin, tali merah, deduksi.
5. **Investigasi TKP** — **semua barang** bisa diperiksa. Beberapa menyimpan **pesan terenkripsi**
   dan **sobekan kunci**; sisanya memberi alasan kenapa kosong.
6. **Alat dekripsi** — buka dari alat yang dibawa detektif (tombol ALAT / T), tempel sandi + kunci, jalankan.
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

## Pesan & Kunci

Pesan asli dan fungsinya **tetap per kasus + tingkat** (biar jawaban bisa dinilai), tapi
**lokasi petunjuk diacak setiap kali main** — jadi tidak bisa dihafal urutannya.
Untuk mencetak jawaban dari sesi berjalan:

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
_geomtest.js     — uji tata letak (node _geomtest.js): tabrakan = gambar = titik interaksi
_genkunci.js     — pencetak tabel kunci jawaban (node _genkunci.js)
```

Semua grafis digambar lewat `<canvas>` — **tanpa aset eksternal**, jadi aman dipresentasikan offline.

## Catatan Teknis

- Stage dikunci 1280×720 lalu di-scale ke viewport, jadi aman untuk proyektor.
- Menu, pilih kasus, cutscene, papan kasus, ruang interogasi, dan cutscene vonis memakai canvas
  640×360 yang di-stretch dengan `image-rendering: pixelated` supaya tetap tajam.
- Peta dibuat dari daftar perabot `{c, r, w, h, draw}` dalam satuan **tile**. Satu perabot = satu
  kotak: gambar, tabrakan, dan titik interaksi dihitung dari kotak yang sama, jadi perabot tidak
  bisa meleset dari posisinya. Tiap fungsi gambar wajib muat di dalam kotaknya (diuji `_geomtest.js`).
- Titik interaksi tiap perabot adalah tile kosong yang menempel kotaknya sendiri, dan jaraknya
  diukur dari **kotak** perabot (bukan dari satu titik), maksimal 30px. Jadi tidak ada lagi objek
  yang bisa diperiksa dari seberang ruangan, dan objek yang sedang dihadapi selalu menang.
- `_selftest.js` menjalankan **9 mode penuh** (3 kasus × 3 tingkat): 170 assertion — sandi,
  dekripsi, rantai kunci, bukti, interogasi, sampai layar akhir.
