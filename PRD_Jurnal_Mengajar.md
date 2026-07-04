np# PRD — Aplikasi Jurnal Mengajar Guru (JurnalKu)

> **Versi:** 1.1 (MVP) — revisi: menghapus alur validasi guru, capaian pembelajaran jadi teks bebas
> **Tanggal:** 2 Juli 2026
> **Pemilik Produk:** CV. Astro Digital Solution (Astrodigiso)
> **Target Pengguna:** Sekolah jenjang SMP/SMA/SMK di Indonesia
> **Status:** Draft untuk implementasi oleh AI Agent / tim developer

---

## 0. Prinsip Desain (WAJIB dipatuhi implementor)

1. **Catat, bukan validasi.** Jurnal adalah *catatan faktual dari kelas*. Entri yang diisi sekretaris kelas **langsung sah** (`TERCATAT`) tanpa perlu persetujuan guru. Alasannya: (a) jika guru tidak masuk kelas, tidak ada yang bisa memvalidasi — padahal justru ketidakhadiran itulah yang paling penting dicatat; (b) validasi menambah beban administrasi guru.
2. **Nol beban administrasi tambahan bagi guru.** Guru tidak punya kewajiban apa pun di aplikasi ini. Semua fitur guru bersifat *opsional*: melihat jurnalnya, melengkapi capaian, mengoreksi data yang salah, atau mengisi sendiri.
3. **Tidak ada master data yang tidak esensial.** Tidak ada Bank TP / master Tujuan Pembelajaran. Capaian pembelajaran diisi sebagai **teks bebas** (dibantu autocomplete dari riwayat, bukan dari tabel master).
4. **Integritas lewat transparansi, bukan gate.** Semua perubahan tercatat di audit log dan ditampilkan ("diisi oleh X, diubah oleh Y"). Anomali (guru tidak hadir, slot kosong) muncul di dashboard admin/wali kelas untuk ditindaklanjuti manusia — bukan diblokir sistem.

---

## 1. Latar Belakang

Sekolah di Indonesia umumnya masih menggunakan **jurnal kelas fisik** (buku cetak) untuk mencatat proses mengajar guru. Format fisiknya berupa tabel harian per kelas berisi: tanggal, bidang studi, jam ke- (slot waktu), pokok bahasan, jumlah jam, tanda tangan guru, dan siswa yang absen (lihat Lampiran A).

Masalah jurnal fisik:

1. **Sulit direkap** — admin/kepala sekolah harus membuka buku per kelas untuk menghitung jam mengajar guru per bulan.
2. **Tidak real-time** — jurnal bisa diisi rapel di akhir bulan tanpa terdeteksi.
3. **Tidak terlihat capaiannya** — tidak terekam capaian pembelajaran apa yang dicapai dari tujuan pembelajaran hari itu.
4. **Rawan hilang/rusak** dan tidak bisa dianalisis (misal: guru mana yang jam mengajarnya kurang).

## 2. Tujuan Produk

Aplikasi web (PWA, mobile-first) untuk **digitalisasi jurnal mengajar**:

| # | Tujuan | Indikator Keberhasilan |
|---|--------|------------------------|
| 1 | Mengetahui kapan guru masuk kelas dan berapa JP yang diajarkan | Rekap JP per guru per bulan akurat, dapat diunduh admin |
| 2 | Mengetahui pokok bahasan dan capaian pembelajaran tiap pertemuan | Setiap entri memiliki pokok bahasan; capaian terisi bila relevan |
| 3 | Pengisian ringan oleh sekretaris kelas, tanpa membebani guru | Waktu pengisian 1 entri < 60 detik; guru tidak punya tugas wajib |
| 4 | Admin dapat mengunduh rekap bulanan (Excel/PDF) | Fitur ekspor berfungsi, format sesuai kebutuhan pelaporan sekolah |

### Non-Goals (di luar cakupan MVP)

- Bukan aplikasi absensi siswa lengkap (hanya mencatat *nama siswa yang absen* per jam pelajaran).
- Bukan sistem penilaian/rapor, bukan sistem penggajian.
- Tidak ada master Tujuan Pembelajaran / kurikulum — capaian = teks bebas.
- Tidak ada integrasi Dapodik pada MVP.

---

## 3. Pengguna & Persona

| Peran | Deskripsi | Kebutuhan Utama |
|-------|-----------|-----------------|
| **Sekretaris Kelas** (siswa) | Ditunjuk per kelas, mengisi jurnal setiap jam pelajaran | Form super cepat di HP, pilihan otomatis dari jadwal |
| **Guru Mapel** | Mengajar sesuai jadwal | *(Semua opsional)* melihat jurnal mengajarnya, melengkapi capaian, mengoreksi data salah, atau mengisi sendiri |
| **Wali Kelas** | Memantau jurnal kelasnya | Dashboard kelengkapan jurnal kelas, menindaklanjuti anomali |
| **Admin Sekolah** (TU/Kurikulum) | Mengelola master data, mengunduh rekap | CRUD master data, ekspor rekap bulanan Excel/PDF, kunci bulan |
| **Kepala Sekolah** | Memantau kinerja mengajar seluruh guru | Dashboard ringkasan, read-only |

### Mode Pengisian

Diatur per sekolah (setting global):

- **Mode A — Sekretaris Kelas** (default): sekretaris mengisi → entri langsung `TERCATAT`.
- **Mode B — Guru Mengisi Mandiri**: guru mengisi jurnalnya sendiri → `TERCATAT`.
- **Mode AB** (keduanya aktif): siapa pun yang lebih dulu mengisi slot, entri tercatat atas nama pengisinya; sistem mencegah duplikasi per slot. Guru dapat *melengkapi* entri sekretaris (menambah capaian/catatan) tanpa mengubah statusnya.

---

## 4. Alur Utama (User Flows)

### 4.1 Pengisian oleh Sekretaris Kelas

```
Login → Beranda menampilkan jadwal kelas hari ini (default hari ini)
→ Tap slot jam pelajaran (misal: Jam ke-3, Matematika, Pak Budi)
→ Form terisi otomatis: mapel, guru, jam ke-, rentang waktu
→ Sekretaris mengisi:
   - Kehadiran guru: [Hadir / Terlambat / Tidak Hadir / Diganti Guru Lain / Tugas Mandiri]
   - Pokok bahasan (teks bebas; autocomplete dari entri sebelumnya di mapel+kelas tsb)
   - Siswa yang absen (multi-select dari daftar siswa + S/I/A)
→ Simpan → status TERCATAT (langsung sah, tanpa menunggu siapa pun)
```

Kolom **capaian pembelajaran** tidak wajib diisi sekretaris (siswa umumnya tidak tahu TP). Kolom ini tampil sebagai opsional, dan guru dapat melengkapinya kemudian jika berkenan.

### 4.2 Aktivitas Guru (semuanya OPSIONAL)

```
Guru login → "Jurnal Saya": daftar entri mengajar guru (terisi otomatis oleh sekretaris)
→ Opsi per entri:
   [Lengkapi]  → menambah/mengubah capaian pembelajaran & catatan (teks bebas)
   [Koreksi]   → memperbaiki data yang salah (misal tercatat Tidak Hadir padahal hadir)
                 → perubahan langsung tersimpan, tercatat di audit log,
                   dan ditandai "dikoreksi guru" di tampilan admin/wali kelas
→ Mode B/AB: tombol [Isi Jurnal] pada slot jadwalnya yang belum terisi
```

Tidak ada antrean, tidak ada tombol validasi, tidak ada kewajiban. Jika guru tidak pernah membuka aplikasi, jurnal tetap lengkap dari isian sekretaris.

### 4.3 Pemantauan oleh Wali Kelas / Admin

```
Dashboard menandai (bukan memblokir):
- Slot KBM terjadwal yang belum diisi hingga akhir hari
- Entri dengan kehadiran guru = Tidak Hadir
- Entri yang dikoreksi guru (untuk ditinjau bila perlu)
Wali kelas/admin menindaklanjuti secara manusiawi (tanya sekretaris/guru).
Admin dapat mengedit entri kapan pun sebelum terkunci (tercatat di audit log).
```

### 4.4 Rekap Bulanan oleh Admin

```
Admin → Menu Rekap → pilih [Bulan] [Tahun Ajaran] → jenis rekap:
   1. Rekap per GURU  (total JP, jumlah pertemuan, rincian per mapel/kelas)
   2. Rekap per KELAS (jurnal harian lengkap, format menyerupai jurnal fisik)
   3. Rekap KETIDAKHADIRAN GURU (slot tanpa jurnal / status Tidak Hadir)
→ Preview → Unduh [Excel .xlsx] atau [PDF]
→ (Opsional) [Kunci Bulan] → semua entri bulan tsb menjadi TERKUNCI
```

### 4.5 Status Lifecycle Entri (hanya 2 status)

```
TERCATAT ──admin kunci bulan──> TERKUNCI
```

- `TERCATAT`: sah, masuk rekap, masih bisa diedit oleh pengisi/guru terkait/admin (semua edit ter-audit).
- `TERKUNCI`: tidak bisa diubah siapa pun kecuali admin membuka kunci (ter-audit).
- Auto-lock opsional: entri terkunci otomatis setelah tanggal 5 bulan berikutnya (setting sekolah).

---

## 5. Cakupan Fitur MVP

### 5.1 Wajib di MVP (Must Have)

| Modul | Fitur |
|-------|-------|
| **Autentikasi** | Login username + password. Peran: `ADMIN`, `GURU`, `WALI_KELAS`, `SEKRETARIS`, `KEPSEK`. Akun sekretaris dibuat admin (username sederhana, tanpa email wajib). |
| **Master Data** | CRUD Tahun Ajaran & Semester, Kelas, Mata Pelajaran, Guru, Siswa (impor CSV), Penugasan guru-mapel-kelas, Slot waktu/jam pelajaran (template per hari, mendukung Jumat lebih pendek & Upacara Senin), Jadwal pelajaran mingguan, Hari libur. |
| **Jurnal Harian** | Pengisian Mode A/B/AB. 1 entri = 1 slot jadwal (bisa blok multi-JP) pada 1 tanggal. Pencegahan duplikasi per slot. Kegiatan khusus (Upacara, Sholat Jumat, Ekskul) sebagai entri non-KBM. Field capaian pembelajaran = **teks bebas opsional** dengan autocomplete riwayat. |
| **Lengkapi & Koreksi (guru)** | Guru dapat melengkapi capaian/catatan dan mengoreksi entri pada penugasannya. Semua perubahan tercatat di audit log dan ditampilkan sebagai riwayat perubahan pada detail entri. |
| **Rekap & Ekspor** | 3 jenis rekap bulanan (per guru, per kelas, ketidakhadiran) — preview + unduh **Excel (.xlsx)** dan **PDF**. Format rekap per kelas menyerupai jurnal fisik (Lampiran A). Tombol Kunci Bulan. |
| **Dashboard** | - Sekretaris: jadwal kelas hari ini + status tiap slot (belum diisi / tercatat / terkunci).<br>- Guru: jadwal hari ini, jurnal terbaru atas namanya, ringkasan JP bulan berjalan.<br>- Wali kelas: kelengkapan jurnal kelasnya + daftar anomali.<br>- Admin/Kepsek: % kelengkapan jurnal hari ini, JP per guru bulan berjalan, entri Tidak Hadir, entri terkoreksi. |
| **PWA** | Installable, mobile-first. (Offline queue penuh → fase 2; MVP cukup online.) |

### 5.2 Nice to Have

- Notifikasi WhatsApp via Fonnte API (pengingat harian sekretaris jika ada slot belum terisi; ringkasan mingguan ke wali kelas).
- Foto bukti kegiatan (1 foto per entri, kompresi client-side).

### 5.3 Di Luar MVP (Fase 2+)

- Offline-first dengan sync queue.
- Multi-sekolah dalam satu instalasi — MVP: 1 instalasi = 1 sekolah, namun skema DB sudah menyertakan `school_id` agar migrasi multi-tenant mudah.
- Integrasi Dapodik.
- Tanda tangan digital pada PDF rekap.

---

## 6. Rancangan Data (Skema Database)

> Konvensi: PostgreSQL, semua tabel memiliki `id` (uuid, pk), `created_at`, `updated_at`. FK `ON DELETE RESTRICT` kecuali disebut lain.

```
schools
  id, name, npsn, address, logo_url, settings_json
  -- settings_json: { input_mode: "A"|"B"|"AB", auto_lock_day: 5, timezone: "Asia/Makassar" }

academic_years
  id, school_id FK, name ("2026/2027"), semester (1|2),
  start_date, end_date, is_active

users
  id, school_id FK, name, username UNIQUE, email NULLABLE, password_hash,
  role ENUM(ADMIN, GURU, WALI_KELAS, SEKRETARIS, KEPSEK),
  teacher_id FK NULLABLE, student_id FK NULLABLE, is_active

teachers
  id, school_id FK, nip NULLABLE, name, phone NULLABLE

classes
  id, school_id FK, academic_year_id FK, name ("VII-A"),
  grade_level (7..12), homeroom_teacher_id FK NULLABLE

students
  id, school_id FK, nisn NULLABLE, name, gender

class_members
  id, class_id FK, student_id FK, is_secretary BOOL
  UNIQUE(class_id, student_id)

subjects
  id, school_id FK, code, name ("Matematika")

teaching_assignments        -- penugasan guru mengajar mapel di kelas
  id, academic_year_id FK, teacher_id FK, subject_id FK, class_id FK
  UNIQUE(academic_year_id, teacher_id, subject_id, class_id)

period_templates            -- template slot jam per hari
  id, school_id FK, day_of_week (1=Senin..6=Sabtu),
  period_no (0..12), start_time, end_time,
  type ENUM(KBM, ISTIRAHAT, UPACARA, IBADAH, EKSKUL, LAINNYA)
  -- contoh: Senin period 0 = UPACARA 07.00–07.30; Jumat hanya 6 slot KBM

schedules                   -- jadwal pelajaran mingguan
  id, academic_year_id FK, class_id FK, day_of_week,
  period_no_start, period_no_end,      -- mendukung blok 2-3 JP berurutan
  teaching_assignment_id FK
  -- validasi aplikasi: tidak boleh bentrok guru/kelas pada slot sama

holidays
  id, school_id FK, date, description

journal_entries
  id, school_id FK, academic_year_id FK, class_id FK, date,
  schedule_id FK NULLABLE,             -- null untuk kegiatan khusus/insidental
  teaching_assignment_id FK NULLABLE,
  period_no_start, period_no_end, jp_count,
  teacher_attendance ENUM(HADIR, TERLAMBAT, TIDAK_HADIR,
                          DIGANTI, TUGAS_MANDIRI),
  substitute_teacher_id FK NULLABLE,
  topic TEXT,                          -- pokok bahasan (teks bebas)
  achievement TEXT NULLABLE,           -- capaian pembelajaran hari ini (teks bebas, opsional)
  notes TEXT NULLABLE,
  activity_type ENUM(KBM, UPACARA, IBADAH, EKSKUL, LAINNYA) DEFAULT KBM,
  status ENUM(TERCATAT, TERKUNCI) DEFAULT TERCATAT,
  filled_by_user_id FK, filled_at,
  last_edited_by_user_id FK NULLABLE,  -- untuk badge "dikoreksi guru/diedit admin"
  corrected_by_teacher BOOL DEFAULT false
  UNIQUE(class_id, date, period_no_start)   -- cegah duplikasi slot

journal_entry_absences      -- siswa absen pada jam tsb
  id, journal_entry_id FK CASCADE, student_id FK,
  absence_type ENUM(S, I, A)           -- Sakit/Izin/Alpa

audit_logs
  id, user_id FK, action, entity, entity_id, diff_json, created_at
  -- setiap create/update/delete/lock/unlock journal_entries wajib tercatat
```

**Catatan desain:**

1. **Tidak ada tabel Tujuan Pembelajaran.** `achievement` adalah teks bebas. Autocomplete diambil dari `DISTINCT` nilai `topic`/`achievement` pada entri sebelumnya untuk `teaching_assignment` yang sama (query ringan, tanpa master data).
2. `jp_count` disimpan eksplisit karena bisa berbeda dari rentang slot (misal guru hadir hanya 1 JP dari blok 2 JP).
3. `period_templates` per hari karena jadwal Jumat berbeda dan Senin diawali Upacara (sesuai jurnal fisik referensi).
4. Rekap JP guru = SUM(`jp_count`) dari entri berstatus apa pun dengan `teacher_attendance IN (HADIR, TERLAMBAT)`; entri `DIGANTI` menghitung JP untuk guru pengganti. Aturan konfigurabel di settings.

---

## 7. Rancangan API (Ringkas)

> REST JSON, prefix `/api/v1`. Semua endpoint terproteksi session (Auth.js) + middleware role.

| Method | Endpoint | Peran | Deskripsi |
|--------|----------|-------|-----------|
| POST | `/auth/login` | semua | Login |
| GET | `/me/today` | SEKRETARIS, GURU | Jadwal hari ini + status entri per slot |
| POST | `/journal-entries` | SEKRETARIS (kelasnya), GURU (penugasannya) | Buat entri → langsung `TERCATAT` |
| PATCH | `/journal-entries/:id` | pengisi, guru terkait, ADMIN | Edit/lengkapi/koreksi (hanya status `TERCATAT`); server menulis audit log + set `corrected_by_teacher` bila pengedit adalah guru terkait |
| GET | `/journal-entries?class_id&date_from&date_to&teacher_id&attendance` | sesuai role | Daftar & filter |
| GET | `/journal-entries/:id/history` | wali kelas, ADMIN, guru terkait | Riwayat perubahan entri (dari audit log) |
| GET | `/autocomplete?assignment_id&field=topic\|achievement&q=` | SEKRETARIS, GURU | Saran teks dari riwayat |
| GET | `/reports/monthly?type=guru\|kelas\|absen&month&year&format=json\|xlsx\|pdf` | ADMIN, KEPSEK | Rekap bulanan |
| POST | `/reports/monthly/lock` | ADMIN | Kunci semua entri bulan tsb |
| POST | `/journal-entries/:id/unlock` | ADMIN | Buka kunci 1 entri (ter-audit) |
| CRUD | `/admin/{academic-years, classes, subjects, teachers, students, assignments, period-templates, schedules, holidays, users}` | ADMIN | Master data; students mendukung `POST .../import` (CSV) |
| GET | `/dashboard/summary` | ADMIN, KEPSEK, WALI_KELAS | Statistik kelengkapan, JP, anomali |

**Aturan otorisasi kunci:**

- Sekretaris hanya bisa membuat/mengubah entri kelasnya sendiri.
- Guru hanya bisa mengubah entri pada `teaching_assignment` miliknya (atau entri di mana ia guru pengganti).
- Entri `TERKUNCI` menolak semua mutasi kecuali unlock oleh `ADMIN`.

---

## 8. Rancangan Halaman (UI/UX)

> Mobile-first PWA. Desain bersih, dominan **oranye (#F97316) + putih**, font Plus Jakarta Sans, target sentuh ≥44px. Bahasa antarmuka: Indonesia.

### 8.1 Peta Halaman

```
/login
/                          → redirect sesuai role
/sekretaris
  /                        → Jadwal kelas hari ini (kartu per slot + badge status)
  /isi/:slot               → Form pengisian jurnal
  /riwayat                 → Riwayat entri kelas
/guru
  /                        → Dashboard: jadwal hari ini, jurnal terbaru, JP bulan ini
  /jurnal-saya             → Daftar entri atas namanya; aksi [Lengkapi] / [Koreksi];
                             Mode B/AB: [Isi Jurnal] untuk slot kosong
/wali-kelas                → Kelengkapan jurnal kelas + daftar anomali
/admin
  /                        → Dashboard sekolah
  /master/*                → CRUD master data (impor CSV siswa)
  /jadwal                  → Editor jadwal mingguan per kelas (grid hari × jam)
  /rekap                   → Pilih jenis/bulan → preview → unduh xlsx/pdf → [Kunci Bulan]
  /pengaturan              → Mode pengisian (A/B/AB), auto-lock, identitas sekolah, zona waktu
/kepsek                    → Dashboard read-only + akses rekap
```

### 8.2 Komponen Kritis

**Kartu Slot (beranda sekretaris/guru):**

```
┌─────────────────────────────────────────┐
│ Jam ke-3 · 08.50–09.30                  │
│ Matematika — Budi Santoso, S.Pd         │
│ [● Belum diisi]              [Isi >]    │
└─────────────────────────────────────────┘
Badge status: abu = Belum diisi, hijau = Tercatat,
biru = Terkunci, ikon pensil kecil = pernah dikoreksi
```

**Form Pengisian (1 layar, tanpa scroll panjang):**

1. Info slot (read-only, otomatis dari jadwal).
2. Kehadiran guru (segmented control 5 pilihan; jika "Diganti" → dropdown guru pengganti).
3. Pokok bahasan (textarea + autocomplete riwayat).
4. Capaian pembelajaran hari ini (textarea opsional, label: "Boleh dikosongkan — guru dapat melengkapi").
5. Siswa absen (bottom-sheet daftar siswa, tap nama → pilih S/I/A).
6. Tombol Simpan (sticky bottom).

**Halaman "Jurnal Saya" (guru):** daftar kartu entri (tanggal, kelas, jam, topik, badge kehadiran). Tap → detail + tombol [Lengkapi capaian] dan [Koreksi data]. Tanpa antrean, tanpa notifikasi wajib — murni alat bantu jika guru ingin memakai.

**Rekap per Kelas (format ekspor):** meniru tabel jurnal fisik — kolom: No, Tanggal, Bidang Studi, Jam Ke-, Pokok Bahasan, Capaian, Jmlh Jam, Nama Guru (dicetak "Dicatat oleh [nama sekretaris]" / "Diisi oleh guru"), Siswa yg Absen. Catatan kegiatan khusus (Upacara/Sholat Jumat/Ekskul) dicetak sebagai catatan kaki harian.

**Rekap per Guru (format ekspor):** header identitas sekolah + bulan; tabel: Nama Guru, Mapel, Kelas, Jumlah Pertemuan, Total JP Terlaksana, Total JP Seharusnya (dari jadwal), Selisih, % Kehadiran; sheet ke-2: rincian harian per guru.

---

## 9. Tech Stack (Rekomendasi)

| Lapisan | Pilihan | Alasan |
|---------|---------|--------|
| Framework | **Next.js 14 (App Router)** full-stack | Konsisten dengan proyek Astrodigiso lain, 1 codebase FE+BE |
| ORM & DB | **Drizzle ORM + PostgreSQL** (Neon untuk dev, Postgres VPS produksi) | Pola yang sudah dipakai tim |
| Auth | **Auth.js (NextAuth)** — Credentials provider, session JWT | Mendukung akun sekretaris tanpa email |
| UI | Tailwind CSS + shadcn/ui | Cepat, konsisten |
| PWA | next-pwa / serwist | Installable, cache aset |
| Ekspor Excel | **exceljs** (server-side) | Styling header, multi-sheet |
| Ekspor PDF | **Puppeteer/Browsershot** render HTML → PDF | Template HTML mudah meniru format jurnal fisik |
| Notifikasi (nice-to-have) | Fonnte API (WhatsApp) | Sudah dipakai di proyek lain |
| Deploy | VPS Ubuntu + Nginx | Sesuai infrastruktur eksisting |

---

## 10. Aturan Bisnis & Edge Cases

1. **Duplikasi slot:** constraint unik `(class_id, date, period_no_start)`. Slot yang sudah terisi tidak bisa diisi ulang oleh pihak lain — hanya bisa diedit.
2. **Guru tidak hadir:** sekretaris tetap membuat entri dengan `teacher_attendance = TIDAK_HADIR`, pokok bahasan boleh kosong, `jp_count = 0` untuk rekap JP guru; tercatat di rekap ketidakhadiran. *Inilah alasan utama entri tidak memerlukan validasi guru.*
3. **Guru merasa data salah:** guru mengoreksi langsung (misal Tidak Hadir → Hadir). Entri diberi badge "dikoreksi guru" dan muncul di daftar tinjauan wali kelas/admin — transparan, tanpa birokrasi.
4. **Guru pengganti:** JP dihitung untuk guru pengganti; guru asal tetap tercatat.
5. **Blok multi-JP:** 1 entri boleh mencakup beberapa jam berurutan (mis. jam 4–5, `jp_count = 2`) mengikuti `schedules.period_no_start/end`.
6. **Kegiatan khusus (Upacara/Sholat Jumat/Ekskul):** entri `activity_type != KBM`, tidak dihitung JP mapel, muncul di rekap kelas sebagai catatan (meniru catatan kaki jurnal fisik).
7. **Hari libur:** tanggal di tabel `holidays` tidak dihitung "belum diisi" pada dashboard kelengkapan.
8. **Entri terlambat (backdate):** diizinkan hingga bulan tsb dikunci; `filled_at` mencatat waktu input asli untuk audit.
9. **Perubahan jadwal di tengah semester:** entri menyimpan snapshot `period_no` & `teaching_assignment_id` sehingga rekap historis tidak berubah.
10. **Sekretaris pindah/ganti:** flag `is_secretary` di `class_members`; boleh lebih dari 1 sekretaris per kelas.
11. **Zona waktu:** simpan UTC di DB, tampilkan sesuai setting sekolah (default `Asia/Makassar`).

---

## 11. Kriteria Penerimaan (Acceptance Criteria) MVP

**AC-1 Pengisian Sekretaris:** Sekretaris kelas VII-A login hari Senin → tampil semua slot jadwal Senin VII-A termasuk Upacara. Mengisi slot jam ke-3 dan menyimpan → entri langsung `TERCATAT`, badge hijau, dan langsung terhitung di rekap.

**AC-2 Guru Tidak Hadir:** Sekretaris mencatat kehadiran "Tidak Hadir" → entri tersimpan tanpa perlu tindakan siapa pun, `jp_count = 0`, dan entri muncul di dashboard anomali admin/wali kelas serta rekap ketidakhadiran.

**AC-3 Koreksi Guru:** Guru membuka entri atas namanya yang tercatat "Tidak Hadir", mengoreksi menjadi "Hadir, 2 JP" → perubahan tersimpan langsung, riwayat perubahan tampil di detail entri, badge "dikoreksi guru" muncul di tampilan admin.

**AC-4 Lengkapi Capaian:** Guru menambahkan teks capaian pada entri yang diisi sekretaris → tersimpan tanpa mengubah pengisi asli; kolom Capaian muncul di rekap kelas.

**AC-5 Mode AB & Duplikasi:** Guru mengisi slotnya lebih dulu → sekretaris melihat slot berstatus Tercatat dan tidak bisa membuat entri baru pada slot yang sama.

**AC-6 Autocomplete:** Saat mengetik pokok bahasan, muncul saran dari entri-entri sebelumnya pada mapel+kelas yang sama (tanpa master data).

**AC-7 Rekap Guru:** Admin mengunduh rekap guru bulan Juni (xlsx) → total JP per guru hanya menghitung entri berkehadiran HADIR/TERLAMBAT (+ JP guru pengganti), plus sheet rincian harian.

**AC-8 Rekap Kelas:** Admin mengunduh rekap kelas (PDF) → tata letak menyerupai jurnal fisik (kolom sesuai Lampiran A) dengan kolom Capaian dan keterangan pencatat.

**AC-9 Kunci Bulan:** Admin mengunci bulan Juni → semua entri Juni `TERKUNCI`; percobaan edit oleh guru/sekretaris ditolak dengan pesan jelas; admin dapat membuka kunci per entri (ter-audit).

**AC-10 Otorisasi:** Sekretaris VII-A yang mencoba mengisi jurnal VII-B menerima 403; guru yang mencoba mengedit entri di luar penugasannya menerima 403.

---

## 12. Roadmap Implementasi

| Fase | Durasi (estimasi) | Deliverable |
|------|-------------------|-------------|
| **Fase 0 — Setup** | 2–3 hari | Repo, skema Drizzle + migrasi, Auth.js, seeding data demo (1 sekolah, 3 kelas, 5 guru, jadwal 1 minggu) |
| **Fase 1 — Master Data** | 1 minggu | CRUD lengkap + impor CSV siswa + editor jadwal grid + hari libur |
| **Fase 2 — Jurnal Inti** | 1 minggu | Flow sekretaris, halaman Jurnal Saya guru (lengkapi/koreksi), Mode B/AB, audit log, otorisasi |
| **Fase 3 — Rekap & Dashboard** | 1 minggu | 3 rekap bulanan (xlsx + pdf), kunci bulan, dashboard 4 role |
| **Fase 4 — Polish & PWA** | 3–5 hari | PWA installable, responsive audit, empty states, uji AC-1 s.d. AC-10 |
| **Fase 5 (opsional)** | — | Notifikasi WhatsApp Fonnte, foto bukti |

---

## Lampiran A — Referensi Format Jurnal Fisik

Struktur kolom jurnal fisik yang menjadi acuan format ekspor rekap per kelas:

| Kolom | Keterangan |
|-------|-----------|
| No | Nomor jam pelajaran (0 untuk Upacara di hari Senin) |
| Tanggal | Ditulis sekali per hari, format "Senin, 22 Agustus 2022" |
| Bidang Studi | Nama mapel |
| Jam Ke- | Rentang waktu, mis. 07.30 - 08.10 (40 menit/JP) |
| Pokok Bahasan | Materi yang diajarkan |
| Jmlh Jam | Jumlah JP |
| Tanda Tangan Nama | Tanda tangan + nama guru → digantikan keterangan pencatat digital |
| Siswa yg Absen | Nama siswa yang tidak hadir |

Karakteristik jadwal dari sampel fisik yang harus didukung `period_templates`:

- Senin diawali slot **Upacara 07.00–07.30** (period 0).
- Senin–Kamis: hingga 11 slot (07.30–15.50), dengan jeda istirahat (± 09.30–10.00 dan ± 12.00–13.00).
- **Jumat lebih pendek** (6–9 slot), dengan catatan kegiatan: Sholat Jumat & pengajian putri, Ekstrakurikuler.
- Template slot dapat berbeda antar tahun ajaran (sampel 2020 vs 2022 memiliki jam berbeda) → template dapat diubah per tahun ajaran.

---

*Dokumen ini siap diserahkan ke AI agent/developer. Prinsip Desain (Bagian 0) adalah acuan tertinggi; jika ada ambiguitas, Bagian 10 (Aturan Bisnis) menjadi rujukan berikutnya.*
