# Changelog

All notable changes to this project will be documented in this file.

---

## [v1.2] - 2025-09-16
### Added
- Fitur login halaman admin
- Style login modern (Material UI, warna kuning, dark mode)
- Validasi login dan notifikasi sukses/gagal
- Responsive layout login

### Changed
- Penambahan jarak antar form dan komponen login
- Border kuning pada TextField saat hover dan focus

---

## [v1.3] - 2025-09-16
### Changed
- Dashboard/root page benar-benar kosong (clean)
- Semua komponen layout, header, sidebar, dan tombol dihapus dari dashboard
- Perbaikan struktur routes dan pemisahan pages/components

---

## [v1.3.2] - 2025-09-16
### Added
  - Logout

---

## [v1.6.5] - 2025-09-18
### Changed
- Fixed layout issues so header and sidebar remain fixed while only main content scrolls.
- Removed unexpected bottom/overflow space in main content and unified responsive padding across pages.
- Made tables responsive and added safe wrappers to avoid horizontal overflow on narrow screens.
- Minor visual polish: consistent card shadows and adjusted header/sidebar styles.
  - Notifikasi
  - Padding kanan pada fitur header

---

## [v1.3.5] - 2025-09-16
### Changed
- Header kini tanpa padding untuk tampilan lebih clean dan minimalis.

---

## [v1.3.8] - 2025-09-16
### Changed
- Modularisasi ThemeSwitcher: animasi, ikon matahari, dan bulan dipisah ke file/komponen terpisah (ThemeSwitchAnim, ThemeSwitchMoon, ThemeSwitchSun)
- Penghapusan seluruh animasi transisi moon-to-sun dan sun-to-moon, sekarang hanya render moon statis di kiri (dark) atau sun statis di kanan (light)
- Perbaikan error import/export, error runtime, dan error boundary

---

## [v1.4] - 2025-09-17
### Changed
- Layout utama: header di paling atas, sidebar di bawah header (bukan fixed/overlay)
- Sidebar dan header kini transparan (tanpa background)
- Sidebar tanpa padding top, tanpa background, tanpa border
- Main content (konten kanan) tanpa background (mengikuti parent)
- Struktur flex row/column diperbaiki agar layout responsif dan konsisten
- Perbaikan duplikasi header di dashboard
- Sidebar menggunakan MUI List, bukan Drawer
- Penyesuaian warna, padding, dan struktur agar lebih clean dan minimalis

---

## [v1.5] - 2025-09-17
### Changed
- Default theme sekarang dark/malam (ThemeSwitcher default gelap)
- Sidebar: font diganti ke modern sans-serif (Poppins, Inter, Arial)
- Sidebar: warna neon lebih soft, tiap menu warna berbeda
- Sidebar: tanpa margin, padding, border, shadow, background
- Sidebar: semua tombol kotak, tanpa rounded, tanpa gradient
- Layout dan UI lebih clean, modern, responsif

---

### Changed
- Main content: maxWidth responsif (clamp), padding kiri-kanan responsif
- Scroll dashboard dan main content diperbaiki (tidak terpotong, selalu muncul jika konten banyak)
- Tinggi main content selalu sama dengan sidebar
- Penambahan card fitur baru di dashboard
- Perbaikan layout dan UI agar lebih proporsional di semua ukuran layar
- Sidebar: warna neon lebih soft, tiap menu warna berbeda

---

## [v1.5.3] - 2025-09-17
### Changed
- Perbaikan scroll vertikal main content/dashboard agar selalu muncul
- Area ungu (overflow) di bawah dashboard dihilangkan (flex dan minHeight diperbaiki)
- Padding kanan dan bawah pada main content diatur agar konten tidak menempel ke tepi/scrollbar
- Card "Fitur Baru" dihapus dari dashboard
- Layout dashboard lebih proporsional dan responsif di semua ukuran layar

---

## [v1.5.5] - 2025-09-17
### Added
- Customers page: full CRUD wiring with API integration (list, detail, create, update, delete)
  - Table with always-visible headers and in-table empty state
  - Lazy-loaded customer details on row expand
  - Add/Edit dialog with validation (nama & no_hp required)
  - MUI confirmation dialog for delete

### Changed
- Polishing and small UX improvements around customers table and dialogs

---

## [v1.6] - 2025-09-17
### Added
- Halaman dan tabel Payments: CRUD dasar, tampilan serupa Customers, validasi input, dan detail lazy-load
- Halaman dan tabel Piutangs: CRUD dasar, penyesuaian ke skema DB (id_piutang, id_customer, jumlah_piutang, tanggal_piutang, status, keterangan), validasi, dan detail lazy-load

### Changed
- Perbaikan dan pembersihan komponen Products dan beberapa perbaikan import/exports
- Build dan validasi produksi dilakukan untuk memastikan tidak ada error sintaks

---

## [v1.6.2] - 2025-09-18
### Added
- Dashboard layout: a1/a2 split (overview + finances on left, activity on right)
- Three compact dashboard charts (Omzet, Orders grouped bars, Payments)

### Changed
- Adjusted main content padding and activity panel sizing

