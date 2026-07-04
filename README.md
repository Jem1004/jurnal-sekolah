# JurnalKu — Aplikasi Jurnal Mengajar

Digitalisasi jurnal mengajar guru untuk SMP/SMA/SMK. PWA mobile-first,
prinsip **"catat, bukan validasi"** (lihat `PRD_Jurnal_Mengajar.md` §0).

> **Status:** MVP lengkap (Fase 0–4) — fondasi, master data, jurnal inti,
> rekap Excel/PDF + kunci bulan, dashboard 5 peran, dan PWA installable.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Drizzle ORM** + PostgreSQL (Neon untuk dev)
- **Auth.js v5** (Credentials, sesi JWT) — login username + password
- **Tailwind CSS v4** — flat design, token semantik gaya shadcn, tema biru
  `#2563EB` + putih, Plus Jakarta Sans
- Zod (validasi), papaparse (impor CSV)

## Yang sudah ada (Fase 0–1)

- Skema database lengkap sesuai PRD §6 (15 tabel) + migrasi.
- Autentikasi 5 peran (ADMIN, GURU, WALI_KELAS, SEKRETARIS, KEPSEK) dengan
  redirect sesuai peran; area admin terproteksi.
- Seed data demo (1 sekolah, 3 kelas, 5 guru, jadwal 1 minggu, siswa+sekretaris).
- **Master data (Admin):** CRUD Tahun Ajaran, Kelas, Mata Pelajaran, Guru,
  Siswa (+ impor CSV), Penugasan, Jam Pelajaran (template per hari), Hari Libur,
  Pengguna, plus **editor jadwal mingguan** (grid, dengan penolakan bentrok) dan
  **Pengaturan** sekolah (mode A/B/AB, auto-lock, zona waktu).
- REST API `/api/v1/admin/*` dengan otorisasi peran + audit log setiap perubahan.

## Yang sudah ada (Fase 2 — Jurnal Inti)

- **Sekretaris** (`/sekretaris`): papan jadwal hari ini (navigasi tanggal),
  badge status per slot, banner hari libur, form pengisian 1 layar (kehadiran
  guru, pokok bahasan + autocomplete, capaian opsional, catatan). Halaman
  Riwayat jurnal kelas.
- **Absensi siswa sengaja TIDAK dicatat di sini** — ditangani oleh aplikasi
  terpisah (Astro Absensi) sebagai satu-satunya sumber kebenaran. Kolom "siswa
  absen" pada rekap jurnal fisik akan ditarik dari sana bila diintegrasikan
  nanti. (Tabel `journal_entry_absences` dibiarkan kosong untuk kemudahan
  integrasi di masa depan.)
- **Guru** (`/guru`): ringkasan JP & pertemuan bulan ini, papan jadwal untuk
  mengisi mandiri (Mode B/AB), dan **Jurnal Saya** untuk *melengkapi* capaian
  atau *mengoreksi* data (badge "dikoreksi guru" + riwayat perubahan).
- Entri langsung `TERCATAT` (prinsip "catat, bukan validasi"), cegah duplikasi
  per slot, hormati mode A/B/AB, hitung JP otomatis (0 bila guru tidak hadir),
  dan otorisasi ketat (sekretaris hanya kelasnya, guru hanya penugasannya).
- API `/api/v1`: `me/today`, `journal-entries` (+`/:id`, `/:id/history`),
  `autocomplete`.

## Yang sudah ada (Fase 3 — Rekap & Dashboard)

- **Rekap bulanan** (`/admin/rekap`): 3 jenis — per guru (pertemuan, JP
  terlaksana vs seharusnya, selisih, %kehadiran + rincian harian), per kelas
  (format jurnal fisik), dan ketidakhadiran (slot kosong / guru tidak hadir).
  Preview di layar, **Unduh Excel** (exceljs, multi-sheet), **Cetak/Simpan PDF**
  (halaman cetak `/rekap/cetak` → print browser), dan **Kunci Bulan**.
- **Rekap per kelas = replika buku jurnal fisik** (referensi: bundel "Jurnal
  Maret"): kolom No (jam ke-), Tanggal (sekali per hari), Bidang Studi, Jam Ke-
  (rentang waktu dari template slot, mis. 07.30 - 08.10), Pokok Bahasan,
  Capaian, Jmlh Jam, Nama Guru + pencatat, dan **Siswa Absen (jumlah)**.
  Periode **mingguan** (Senin–Sabtu, pilih tanggal) atau **bulanan** — siap
  diprint dan dibundel sebagai catatan sekolah per semester.
- **Jumlah siswa absen** diinput manual (angka) oleh sekretaris/guru di form
  jurnal — bukan rincian nama (rincian tetap milik Astro Absensi). Kolom
  `journal_entries.absent_count`.
- **Ekspor modern**: Excel (exceljs) berbranding — kop sekolah, garis aksen
  biru, header beku (freeze), baris zebra, baris total, orientasi landscape
  fit-to-width; PDF (halaman cetak) A4 landscape dengan kop + logo, tabel rapi
  zebra, badge status berwarna, dan **blok tanda tangan** (Kepala Sekolah &
  Wali Kelas) pada rekap kelas untuk arsip resmi.
- **Kunci/buka kunci**: `POST /reports/monthly/lock` mengunci semua entri bulan
  (`TERKUNCI`, tolak edit); `POST /journal-entries/:id/unlock` (admin).
- **Dashboard**: Admin & Kepsek (kelengkapan hari ini, JP per guru, tidak hadir,
  terkoreksi), Wali Kelas (kelengkapan + anomali kelasnya + jurnal kelas).

## Yang sudah ada (Fase 4 — PWA)

- Installable: `manifest.webmanifest`, ikon, service worker (`/sw.js`,
  network-first, lewati `/api`), theme oranye. Mobile-first di semua peran.

> **PDF:** memakai halaman cetak browser (print-to-PDF) — andal & mirip jurnal
> fisik. Untuk unduh PDF satu-klik dari server di VPS Linux, Playwright +
> `@sparticuz/chromium` bisa ditambahkan sebagai peningkatan.

## Menjalankan

Prasyarat: Node 20+, pnpm.

```bash
pnpm install
cp .env.example .env.local     # lalu isi DATABASE_URL & AUTH_SECRET
pnpm db:migrate                # buat tabel di database
pnpm db:seed                   # isi data demo
pnpm dev                       # http://localhost:3000
```

> Jaringan flaky ke Neon? Skrip seed sudah punya retry otomatis. Bila migrasi
> gagal karena timeout, jalankan ulang — atau prefix dengan
> `NODE_OPTIONS='--dns-result-order=ipv4first'`.

## Akun demo (setelah `pnpm db:seed`)

| Username | Password | Peran |
|----------|----------|-------|
| `admin` | `admin123` | Admin Sekolah |
| `kepsek` | `kepsek123` | Kepala Sekolah |
| `wali1` | `wali123` | Wali Kelas (VII-A) |
| `guru1`–`guru5` | `guru123` | Guru |
| `sekre1`–`sekre3` | `sekre123` | Sekretaris (VII-A, VIII-A, IX-A) |

## Skrip

| Perintah | Fungsi |
|----------|--------|
| `pnpm dev` / `pnpm build` | Jalankan / build aplikasi |
| `pnpm db:generate` | Buat file migrasi dari skema |
| `pnpm db:migrate` | Terapkan migrasi ke database |
| `pnpm db:seed` | Isi data demo (menghapus data lama) |
| `pnpm db:studio` | Drizzle Studio (inspeksi DB) |

## Struktur

```
src/
  auth.ts, auth.config.ts       # Auth.js v5 (split edge-safe config)
  db/schema.ts, seed.ts         # skema Drizzle + seed
  lib/                          # api-auth, audit, validation, resources (registry CRUD)
  app/api/v1/admin/             # REST master data (+ students/import, settings)
  app/admin/                    # UI admin (master/*, jadwal, pengaturan)
  components/ui, components/admin
```

## Catatan

- **Keamanan:** `DATABASE_URL` di `.env.local` di-gitignore. Rotasi password
  Neon sebelum produksi.
- **PDF (fase rekap):** direncanakan pakai Playwright + `@sparticuz/chromium`.
- 1 instalasi = 1 sekolah, namun skema sudah menyertakan `school_id` untuk
  migrasi multi-tenant di masa depan.
