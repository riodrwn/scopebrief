# ScopeBrief — Chrome & Firefox

MVP extension lokal untuk mengumpulkan konteks program bug bounty ke Markdown dan JSON. Tidak memakai API AI, tidak mengirim konten ke server, tidak membaca cookie/token. Permissions: activeTab, scripting, storage.

## Instalasi Chrome

1. Ekstrak scopebrief-chrome.zip ke folder tetap.
2. Buka chrome://extensions dan aktifkan Developer mode.
3. Klik Load unpacked dan pilih folder yang berisi manifest.json.
4. Pin ScopeBrief dari menu Extensions.

## Instalasi Firefox (pengujian lokal)

1. Ekstrak scopebrief-firefox.zip.
2. Buka about:debugging#/runtime/this-firefox.
3. Pilih Load Temporary Add-on dan pilih manifest.json.

Firefox menghapus temporary add-on saat restart. Instalasi permanen membutuhkan paket yang ditandatangani Mozilla; paket ini belum ditandatangani atau dipublikasikan. Minimum Firefox dalam manifest: 140.

## Contoh alur NBA

1. Buka program NBA di HackerOne dan tunggu konten guidelines tampil.
2. Buka extension, pilih Guidelines, klik Ambil halaman aktif.
3. Buka tab Scope program yang sama, tunggu daftar aset tampil.
4. Buka extension, pilih Daftar scope aset, lalu ambil halaman.
5. Review preview dan ekspor Markdown atau JSON.

Untuk mengambil hanya area tertentu, seleksi teks sebelum membuka extension. Seleksi disimpan sebagai teks sumber tanpa menebak kategorinya. Guidelines diklasifikasikan berdasarkan heading yang terbaca.

## Cakupan dan batasan versi 0.1

- Identitas URL tersedia untuk HackerOne, Bugcrowd, YesWeHack dan Intigriti; situs lain memakai identitas URL generik.
- HackerOne memiliki adapter guidelines dan tabel aset berdasarkan struktur halaman NBA yang diperiksa langsung. Tiga platform lain memakai DOM/heading generik dan belum diverifikasi langsung. Login, CAPTCHA, isi iframe, elemen virtual, pagination, tab, dan accordion tidak dioperasikan otomatis.
- Ekspor adalah snapshot konten yang sedang dirender. Gulir, perluas bagian, dan tangkap halaman tambahan bila diperlukan. Rentang pagination dengan format seperti 1-100 of 457 ikut menjadi identitas tangkapan agar halaman berikutnya tidak menimpa halaman sebelumnya. Pagination format lain tanpa perubahan URL perlu diekspor terpisah.
- Kategori kerentanan dipisahkan dari daftar aset. HackerOne menyertakan objek assets dengan nama kolom asli, termasuk Coverage dan Bounty yang terpisah. Tabel juga disimpan sebagai teks. Data ini bukan daftar target yang dijamin valid.
- Link sumber dicatat tetapi halaman tujuan tidak otomatis diambil. Detail tautan tidak selalu dipertahankan pada posisi aslinya; tersedia di source links dan JSON.
- Tidak menyimpulkan scope dari merek/domain, tidak mengubah wildcard, tidak menyamakan kelayakan bounty dengan izin pengujian.
- Completeness selalu unverified. Kategori yang tidak ditemukan ditandai missing, bukan diasumsikan kosong.
- Halaman guidelines dan scope NBA diperiksa langsung untuk struktur DOM. Tiga unit test memeriksa identitas program, klasifikasi, preservasi batas rate dan metadata. Harness browser memverifikasi capture/save/preview menggunakan mock API extension. Paket belum diuji sebagai extension terpasang di Chrome/Firefox; tiga platform lain belum diuji langsung.
- Tidak ada scanning atau eksekusi instruksi halaman. Teks sumber diperlakukan sebagai reference data; export tidak menjamin model AI kebal terhadap prompt injection.
- Hapus lokal menghapus seluruh tangkapan program terpilih. Uninstall menghapus storage extension. File unduhan tidak ikut terhapus.

## Pengembangan

Node.js modern diperlukan, tanpa dependency produksi.

```text
npm test
npm run build
```

Source ada di src/. build.mjs menghasilkan dist/chrome dan dist/firefox. Modifikasi identity/classify di core.js untuk penambahan format URL/kategori. Jangan klaim dukungan platform terverifikasi sebelum memeriksa halaman aktual.

## Rujukan API browser

- https://developer.chrome.com/docs/extensions/develop/concepts/activeTab
- https://developer.chrome.com/docs/extensions/reference/api/scripting
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings
