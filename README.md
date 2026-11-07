# Hadiah Ulang Tahun untuk Ibu

Project website ucapan ulang tahun untuk ibu. Sudah dipisahkan menjadi HTML, CSS, dan JavaScript agar mudah diedit di Visual Studio Code.

## Isi folder

```text
hadiah-ibu-vscode/
├── index.html
├── style.css
├── script.js
├── README.md
├── musik/
│   └── monokrom-tulus.mp3
└── foto/
    └── BACA-SAYA.txt
```

## Menjalankan di VS Code

1. Ekstrak file ZIP.
2. Buka folder `hadiah-ibu-vscode` di Visual Studio Code.
3. Buka `index.html`.
4. Jalankan dengan ekstensi **Live Server** (klik kanan `index.html` → **Open with Live Server**), atau buka `index.html` langsung di browser.
5. Pastikan folder `musik` tetap berada di samping `index.html` agar lagu dapat ditemukan.

## Lagu

File `musik/monokrom-tulus.mp3` adalah file Monokrom – Tulus yang disertakan pengguna. Lagu langsung diputar begitu amplop dibuka (naik halus dalam sekitar 1,5 detik). Lagu sudah dimuat sejak halaman dibuka supaya tidak ada jeda. Jika browser memblokir pemutaran, ketuk di mana saja sekali lagi, atau tekan tombol musik di navigasi.

## Menambahkan foto keluarga

Salin foto ke folder `foto` dan beri nama berurutan:
- `foto1.jpg`
- `foto2.jpg`
- `foto3.jpg`

Format JPG, JPEG, PNG, dan WEBP didukung. Foto akan dicari otomatis ketika website dibuka. Jika menambah foto setelah website terbuka, muat ulang halaman.

## Mengubah pengaturan

Buka `script.js`, cari bagian `PENGATURAN` di dekat bagian awal file. Di sana kamu bisa mengubah:
- `namaIbu`
- `namaPengirim`
- `musik`
- `caption`
- isi `surat`

Warna utama dapat diubah di bagian `:root` pada `style.css`.

## Catatan

- Website tidak memerlukan database atau backend.
- Lagu dan foto dibaca dari folder project.
- Untuk membuka website di perangkat lain, jalankan melalui server lokal atau hosting statis dan sertakan folder `musik` serta `foto`.
- Seluruh section dan fitur dari project awal dipertahankan.
- Kue ulang tahun: kue tiga tingkat (krim merah muda dan putih yang meleleh, mutiara emas, bunga, lima lilin) digambar sebagai SVG oleh fungsi `buildCake()` di `script.js`. Animasi mengikuti video referensi dan baru mulai setelah tombol **Buat Kue** ditekan. Setelah lilin menyala, tekan **Tiup Lilin** (atau ketuk kuenya).
- Warna kue bisa diubah di `buildCake()` (array `T` dan bagian `defs`), waktu animasi di `style.css` bagian KUE ULANG TAHUN.
