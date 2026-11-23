# Panduan Pemasangan Website Yayasan NUR INSAN WACHID

Website ini **berjalan sendiri di GitHub Pages**. Data tersimpan di **Google Sheet**, file (scan surat, bukti nota, foto) masuk ke **folder Google Drive** Anda, dan surat dikirim lewat **Gmail** Anda. Biaya: gratis.

## Isi paket
- `index.html`, `style.css`, `app.js`, `config.js` → diunggah ke GitHub
- `apps-script/Code.gs` → ditempel di Google Apps Script (JANGAN diunggah ke GitHub)

## Langkah 1 — Pasang backend (Google Apps Script)
1. Buka https://script.google.com → **Proyek baru**. Beri nama "Backend Yayasan NIW".
2. Hapus isi `Code.gs` bawaan, lalu tempel seluruh isi file `apps-script/Code.gs`.
3. Di baris paling atas, isi `ADMIN_PASSWORD` dengan password admin Anda. Username sudah diisi email Anda.
4. Klik **Simpan**, pilih fungsi `setup` di toolbar, lalu klik **Jalankan**.
5. Izinkan akses (Google Drive, Sheet, Gmail). Jika muncul "Google hasn't verified this app", klik **Advanced → Go to … (unsafe)**. Ini aman karena skrip milik Anda sendiri.
6. Setelah selesai, di folder Drive Anda akan muncul **"Database Yayasan NUR INSAN WACHID"** (Google Sheet) beserta folder *Surat Masuk, Surat Keluar, Bukti Keuangan, Foto Pengurus*.
7. Untuk keamanan, setelah `setup` berhasil Anda boleh mengganti `ADMIN_PASSWORD` kembali menjadi teks lain. Password sudah tersimpan dalam bentuk terenkripsi (hash).

## Langkah 2 — Deploy sebagai Web App
1. Klik **Terapkan (Deploy) → Deployment baru → Jenis: Aplikasi web**.
2. *Jalankan sebagai*: **Saya**. *Yang memiliki akses*: **Siapa saja (Anyone)**.
3. Klik **Terapkan**, lalu salin **URL aplikasi web** (berakhiran `/exec`).

> Jika nanti Code.gs diubah: **Terapkan → Kelola deployment → ✏️ → Versi: Baru → Terapkan** (URL tetap sama).

## Langkah 3 — Hubungkan website
Buka `config.js`, lalu ganti `TEMPEL_URL_WEB_APP_DI_SINI` dengan URL dari Langkah 2.

## Langkah 4 — Unggah ke GitHub Pages
1. Di GitHub buat repository baru, misalnya `yayasan-niw` (Public).
2. **Add file → Upload files**, lalu unggah `index.html`, `style.css`, `app.js`, `config.js`.
3. Buka **Settings → Pages → Branch: main / (root) → Save**.
4. Tunggu 1–2 menit. Website akan aktif di `https://USERNAME.github.io/yayasan-niw/`.

## Cara pakai
- **Publik (siapa saja)**: Beranda, Struktur Organisasi, Agenda bulanan, Transparansi Keuangan (rekap Bulanan / Triwulan / Tahunan, rincian transaksi dan bukti), serta RAB. Semua halaman bisa dicetak atau disimpan sebagai PDF.
- **Admin** (menu *Admin* → login):
  - *Pengurus*: tambah atau ubah nama, jabatan, dan foto (urutan 1 tampil paling atas).
  - *Agenda*: rencana kegiatan per bulan beserta statusnya.
  - *Kas Masuk & Keluar*: catat pemasukan/pengeluaran dan unggah bukti nota.
  - *RAB*: rencana anggaran per bulan. Rekap triwulan dan tahunan dihitung otomatis.
  - *Surat Masuk*: isi form, lalu unggah scan PDF/JPG. Data tercatat di Sheet dan file masuk ke Drive.
  - *Surat Keluar*: isi form, lalu sistem membuat **nomor otomatis** (mis. `001/UND/YNIW/XI/2026`) dan **PDF berkop yayasan**. Surat disimpan ke Drive, dicatat di Sheet, dan **dikirim via email**.
  - *Profil Yayasan*: nama, alamat, visi-misi, serta nama ketua/sekretaris untuk tanda tangan surat.
  - *Ganti Password*.
- Semua perubahan tercatat di sheet **Log**.

## Batasan yang perlu diketahui
- **Ukuran file per unggahan maksimal sekitar 30 MB** (batas Google Apps Script). Untuk file yang lebih besar, unggah langsung ke folder Drive, lalu tempel tautannya di kolom `file` pada Sheet.
- Gmail gratis bisa mengirim sekitar **100 email/hari** dari skrip.
- Data keuangan, agenda, RAB, dan pengurus bersifat publik. Surat masuk/keluar **hanya bisa dilihat admin**. File yang diunggah dibagikan dengan akses "siapa saja yang memiliki link" agar bukti transparansi bisa dibuka publik.
- Sesi login berlaku 6 jam.
