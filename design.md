# JurnalKu — Design Reference

> Dokumen rujukan desain untuk pengembangan UI JurnalKu. Berisi prinsip, token,
> pola komponen/halaman yang **sudah ada**, dan audit + rencana peningkatan
> yang **belum** dikerjakan. Gunakan file ini sebagai acuan setiap kali
> mengubah tampilan — baik oleh developer maupun AI agent.

---

## 0. Prinsip Desain

1. **Flat, bukan datar-membosankan.** Tanpa `shadow`, tanpa gradien, tanpa
   skeuomorphism. Hierarki dibangun lewat **warna, border, dan spasi** — bukan
   bayangan. Batas antar elemen (modal, drawer, dropdown) memakai `border`,
   bukan `shadow-lg`.
2. **Satu warna aksen, dipakai konsisten.** Primary biru (`#2563EB`) hanya
   untuk elemen interaktif/penting: tombol utama, link, item nav aktif, fokus
   ring. Jangan dipakai untuk dekorasi.
3. **Warna status tetap semantik**, terlepas dari warna brand: hijau=hadir/
   sukses, merah=tidak hadir/hapus/error, amber=peringatan/belum lengkap,
   biru info=netral-informasi. Jangan diganti ikut brand.
4. **Mobile-first untuk halaman peran** (sekretaris/guru/wali kelas), **desktop-
   first untuk admin** (tabel & data lebih penting daripada di HP).
5. **Kepadatan informasi proporsional dengan peran.** Sekretaris & guru:
   ringkas, 1 aksi jelas per kartu. Admin/Kepsek: boleh padat (tabel, angka),
   tapi tetap dikelompokkan dengan judul seksi.
6. **Setiap halaman kosong (empty state) punya pesan + arah tindakan**, bukan
   sekadar "tidak ada data".

---

## 1. Design Tokens (sumber: `src/app/globals.css`)

Token bergaya shadcn (`@theme inline`), semua warna lewat CSS var agar tema
bisa diganti dari satu tempat.

| Token | Nilai | Pemakaian |
|---|---|---|
| `--background` | `#f8fafc` (slate-50) | Latar halaman |
| `--foreground` | `#0f172a` (slate-900) | Teks utama |
| `--card` | `#ffffff` | Latar kartu/modal |
| `--primary` | `#2563eb` (blue-600) | Tombol utama, link, nav aktif, ring fokus |
| `--primary-foreground` | `#ffffff` | Teks di atas primary |
| `--primary-muted` | `#eff6ff` (blue-50) | Latar lembut (badge primer, kartu terpilih) |
| `--accent-foreground` | `#1e40af` (blue-800) | Teks di atas primary-muted |
| `--secondary` | `#f1f5f9` (slate-100) | Latar sekunder (hover, badge netral) |
| `--muted-foreground` | `#64748b` (slate-500) | Teks sekunder/caption |
| `--destructive` | `#dc2626` (red-600) | Aksi hapus, error |
| `--success` | `#16a34a` (green-600) | Status hadir/sukses |
| `--warning` | `#d97706` (amber-600) | Status peringatan |
| `--info` | `#0284c7` (sky-600) | Status netral-info |
| `--border` / `--input` | `#e2e8f0` (slate-200) | Semua garis pembatas |
| `--ring` | `= primary` | Outline fokus (aksesibilitas) |
| `--radius` | `0.625rem` (10px) | Basis skala radius (`sm/md/lg/xl`) |

**Font:** Plus Jakarta Sans (`next/font/google`, var `--font-jakarta`).

**Aturan token:**
- Jangan hardcode hex di komponen (`bg-[#2563eb]`) — selalu lewat token
  (`bg-primary`). Perubahan tema harus cukup dari `globals.css`.
- Jangan tambah warna brand kedua. Kalau butuh aksen kedua, pakai `--info`.

---

## 2. Komponen Dasar (sudah ada, di `src/components/ui/`)

| Komponen | Status | Catatan desain |
|---|---|---|
| `Button` | ✅ Flat | 3 ukuran (`sm/md/icon`), 5 varian. Target sentuh ≥44px (`md`). |
| `Input` / `Select` / `Textarea` | ✅ Flat | Border + ring fokus, tanpa shadow. |
| `Card` | ✅ Flat | Border-only, tanpa shadow. |
| `Modal` | ✅ Flat | Border-only, bottom-sheet di mobile, dialog di desktop. |
| `Badge` | ✅ | Tone semantik (lihat §0.3). |
| `Label` | ✅ | — |

**Belum ada / perlu ditambah** (lihat §5):
- `Skeleton` (loading state konsisten, bukan spinner polos di semua tempat)
- `EmptyState` (komponen bersama, sekarang tiap halaman menulis markup sendiri)
- `StatCard` (kartu statistik dashboard di-duplikasi manual di setiap dashboard)
- `Tabs` (untuk konsolidasi halaman guru/sekretaris yang punya 2 nav item)

---

## 3. Pola Halaman

### 3.1 Autentikasi (`/login`)
**Kondisi sekarang:** kartu tunggal center-align, logo+judul di atas, tanpa
elemen visual lain. Fungsional, sudah flat, tapi terasa **kosong/generik** —
tidak ada identitas sekolah, tidak ada konteks visual bahwa ini aplikasi
sekolah.

**Rujukan peningkatan:**
- Split-panel di desktop (≥`lg`): kiri panel warna primary berisi identitas
  produk/ilustrasi sederhana (garis/bentuk flat, bukan foto), kanan form.
  Di mobile tetap 1 kolom seperti sekarang.
- Tampilkan nama sekolah (dari `schools.name`) di bawah logo, bukan cuma nama
  produk — memperkuat rasa "ini portal sekolah saya".
- State error sudah ada (`res.error`), pastikan juga ada **loading skeleton**
  singkat sebelum form interaktif (hindari flash of unstyled saat SSR→CSR).

### 3.2 Admin Shell (`admin-shell.tsx`)
**Kondisi sekarang:** sidebar 13 item **flat, tidak dikelompokkan** — Tahun
Ajaran, Kelas, Mapel, Guru, Siswa, Penugasan, Jam Pelajaran, Jadwal, Hari
Libur, Rekap, Pengguna, Pengaturan semua sejajar tanpa hierarki visual.

**Masalah konkret:** 13 item flat sulit dipindai cepat; item terkait (mis.
Jam Pelajaran + Jadwal, atau semua "Master Data") tidak terlihat sebagai
kelompok.

**Rujukan peningkatan — kelompokkan sidebar jadi 4 seksi dengan label kecil:**
```
DASHBOARD
  Dashboard

DATA MASTER
  Tahun Ajaran · Kelas · Mata Pelajaran · Guru · Siswa · Penugasan

JADWAL
  Jam Pelajaran · Jadwal · Hari Libur

LAPORAN
  Rekap Bulanan

SISTEM
  Pengguna · Pengaturan
```
Label seksi: `text-xs font-semibold text-muted-foreground uppercase
tracking-wide px-3 pt-4 pb-1` (pola umum shadcn sidebar).

### 3.3 Dashboard Admin (`admin/page.tsx`)
**Kondisi sekarang:** 3 blok berturutan — (1) 4 kartu monitoring jurnal hari
ini, (2) 1 tabel JP per guru, (3) 6 kartu hitung data master. Semua kartu
punya struktur sama (ikon di atas, angka besar, label kecil) tapi kode
di-duplikasi manual per kartu — **bukan komponen bersama**.

**Masalah konkret:**
- Tidak ada pemisah visual antar-3 blok selain `<h2>` kecil untuk blok
  terakhir; blok (1) dan (2) tidak punya judul seksi sama sekali.
- Kartu "Buka Rekap Bulanan" (CTA) memakai struktur visual identik dengan
  kartu statistik murni — secara semantik beda (satu actionable, lima
  lainnya read-only) tapi terlihat sama.
- 6 kartu "Data Master" di scroll paling bawah padahal ini **paling jarang
  dilihat admin sehari-hari** (dibanding kelengkapan jurnal hari ini).

**Rujukan peningkatan:**
1. Beri judul seksi di ketiga blok: "Ringkasan Hari Ini", "Kinerja Mengajar
   Bulan Ini", "Data Master" — pola sama seperti section title yang sudah
   dipakai di tabel JP.
2. Ekstrak `StatCard` jadi komponen (`icon`, `value`, `label`, `href?`,
   `tone?`) — dipakai ulang di admin, kepsek, wali-kelas. Saat ini logika
   kartu ditulis 3× berbeda di 3 file dashboard.
3. Beda-kan visual CTA vs statistik: CTA "Buka Rekap" pakai `border-primary
   bg-primary-muted` supaya terlihat actionable, bukan sekadar angka.
4. Pertimbangkan pindahkan blok "Data Master" ke bawah **atau** ke halaman
   terpisah ringkas — dashboard sebaiknya didominasi hal yang berubah
   harian (kelengkapan, anomali), bukan hitungan statis.

### 3.4 Dashboard Peran (Guru / Sekretaris / Wali Kelas / Kepsek)
**Kondisi sekarang:** `RoleHeader` konsisten (logo+judul+signout+nav), lalu
konten spesifik per peran (kartu stat 2–3 kolom + papan jadwal / daftar
jurnal). Sudah cukup baik & mobile-first.

**Rujukan peningkatan:**
- Guru & Sekretaris masing-masing punya 2 nav item (`Beranda`/`Hari Ini` +
  1 lagi) yang dirender sebagai link biasa di bawah header. Karena hanya 2
  destinasi, ini kandidat kuat pakai pola **segmented tab** (radius penuh,
  latar `secondary`, item aktif `bg-card`) — lebih jelas sebagai navigasi
  utama dibanding sekadar 2 link sejajar.
- Kartu status di papan jadwal (`today-board.tsx`) sudah bagus (badge warna
  status + kehadiran), pertahankan pola ini sebagai standar "kartu entri".

### 3.5 Tabel Data Master (`CrudManager`)
**Kondisi sekarang:** tabel standar dengan search/filter/sort/gating — sudah
solid secara fungsi (lihat riwayat perubahan sebelumnya). Baris zebra tidak
dipakai (hover-only `hover:bg-secondary/30`).

**Rujukan peningkatan:**
- Sticky header saat scroll tabel panjang (`thead` sticky, `top-0 bg-card`).
- State loading saat fetch (`refresh()`, server search) sekarang tidak
  menampilkan indikator apa pun di tabel — tambahkan overlay/opacity+spinner
  tipis di atas tabel saat `submitting`/pencarian berjalan.

### 3.6 Form & Modal
**Kondisi sekarang:** `Modal` generik dipakai untuk create/edit CRUD, isi
jurnal, salin hari, generate slot, bulk-assign — konsisten satu pola
(judul+body+footer, bottom-sheet mobile). Ini **sudah baik**, pertahankan.

**Rujukan peningkatan:**
- Modal dengan banyak field (mis. `FillModal`, `EntryModal`) tidak punya
  pemisah visual antar-kelompok field (kehadiran vs materi vs catatan) —
  tambahkan `<div className="border-t border-border pt-3">` antar kelompok
  logis, meniru pola yang sudah dipakai untuk bagian "riwayat" di
  `entry-modal.tsx`.

### 3.7 Cetak (PDF) & Ekspor (Excel)
**Kondisi sekarang:** sudah didesain khusus (kop sekolah, aksen biru, zebra,
badge status, blok tanda tangan). Ini **referensi kualitas** untuk halaman
lain — konsisten, informatif, rapi dicetak.

**Tidak perlu diubah**, kecuali warna brand berubah lagi di masa depan.

---

## 4. Prioritas Peningkatan (checklist eksekusi)

Urutan berdasarkan rasio dampak/effort, untuk sesi berikutnya:

- [ ] **Kelompokkan sidebar admin** jadi 5 seksi berlabel (§3.2) — effort kecil,
      dampak tinggi untuk navigasi.
- [ ] **Ekstrak `StatCard`** komponen bersama, pakai ulang di 3 dashboard
      (§3.3, §3.4) — effort kecil, menghapus duplikasi + memudahkan konsistensi.
- [ ] **Judul seksi di dashboard admin** (§3.3.1) — effort sangat kecil.
- [ ] **Beda-kan visual CTA card** dari stat card (§3.3.3) — effort kecil.
- [ ] **Segmented tab untuk nav 2-item** di guru/sekretaris (§3.4) — effort kecil.
- [ ] **`EmptyState` komponen bersama** — effort kecil, konsistensi pesan
      kosong di semua tabel/list.
- [ ] **Split-panel login di desktop** (§3.1) — effort sedang, nilai kesan
      profesional tinggi untuk first impression.
- [ ] **Sticky table header** (§3.5) — effort kecil.
- [ ] **Skeleton loading state** dasar — effort sedang, dipakai di
      CrudManager + dashboard saat data belum termuat (saat ini semua
      server component sehingga jarang terlihat, tapi relevan untuk bagian
      client-side seperti server-search siswa).

---

## 5. Cara Pakai Dokumen Ini

- Sebelum menambah halaman/komponen baru, cek §1–2 dulu — jangan buat token
  atau primitive baru kalau yang ada sudah cukup.
- Setiap kali audit ulang, perbarui §3 dan §4 (pindahkan item selesai dari
  checklist, tambahkan temuan baru) — dokumen ini **hidup**, bukan snapshot
  statis.
- Referensi warna hex di §1 harus selalu match `src/app/globals.css` — kalau
  beda, `globals.css` yang benar, perbarui tabel ini.
