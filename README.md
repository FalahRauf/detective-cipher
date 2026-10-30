# Detective Cipher — Kasus #01: Pesan Terakhir di Lab

Game detektif pixel-art untuk tugas **Matematika: Fungsi Komposisi & Fungsi Invers**.
Pemain memecahkan kode sandi dua lapis untuk menemukan barang bukti, lalu menuduh pelaku.

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

## Alur Permainan

1. **Briefing** — kasus dan target penyelidikan.
2. **Investigasi TKP** — cari 3 petunjuk di lab (monitor, papan tulis, tempat sampah).
3. **Meja Dekripsi** — pecahkan sandi dua lapis, huruf per huruf.
4. **Barang bukti** — sandi yang sudah dipecahkan menunjuk ke lokasi kunci.
5. **Tuduh pelaku** — pilih dari daftar tersangka.

## Matematika di Baliknya

Enkripsi dua lapis (komposisi fungsi):

$$c = f(g(x))$$

Dekripsi harus dibalik dari lapis terakhir:

$$x = g^{-1}\left(f^{-1}(c)\right)$$

Pada Kasus #01:

| Fungsi | Rumus | Invers |
|---|---|---|
| $f(x)$ | $3x + 7$ | $f^{-1}(c) = 9(c - 7) \bmod 26$ |
| $g(x)$ | $x + 5$ | $g^{-1}(y) = y - 5 \bmod 26$ |

Huruf dipetakan `A=1 … Z=26`, hasil selalu dikembalikan ke rentang 1–26 dengan `mod 26`
(hasil 0 ditulis 26). Koefisien `a` wajib koprima dengan 26 supaya fungsinya punya invers.

Contoh: `K` (11) → $g(11) = 16$ → $f(16) = 55$ → $55 \bmod 26 = 3$ → `C`.

Kunci jawaban lengkap ada di [`KUNCI-JAWABAN.md`](KUNCI-JAWABAN.md).

## Struktur Berkas

```
index.html   — layar & markup
style.css    — tema noir, layout 1280×720
game.js      — mesin game, peta, puzzle, render pixel-art
KUNCI-JAWABAN.md — kunci jawaban untuk guru
```

Semua grafis digambar lewat `<canvas>` — **tanpa aset eksternal**, jadi aman dipresentasikan offline.

## Catatan Teknis

- Stage dikunci 1280×720 lalu di-scale ke viewport, jadi aman untuk proyektor.
- Menu utama memakai canvas 640×360 yang di-stretch dengan `image-rendering: pixelated`
  supaya tetap tajam dan benar-benar pixel art.
- Validasi di meja dekripsi dilakukan **per sel** (nilai antara + huruf), jadi proses
  pengerjaan siswa kelihatan, bukan cuma jawaban akhir.
