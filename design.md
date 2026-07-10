# JurnalKu — Design System v2 ("Warm Paper / Crextio Reference")

> Sumber rujukan: screenshot dashboard **Crextio** (HR dashboard — krem hangat,
> aksen kuning butter, pill-shaped, ink charcoal). Dokumen ini adalah acuan
> tunggal untuk semua perubahan UI JurnalKu. Setiap resep di sini memakai
> token & kelas Tailwind v4 yang **langsung bisa ditempel** ke kode.
>
> Menggantikan design.md v1 (tema flat zinc/biru). Aturan lama yang masih
> berlaku ditandai eksplisit; sisanya ikuti dokumen ini.

---

## 0. Prinsip Desain

1. **Warm paper, bukan putih klinis.** Latar halaman krem-abu hangat dengan
   *ambient glow* kuning lembut (gradien halus). Kartu berwarna warm-white
   yang sedikit lebih terang dari latar — pemisahan kartu dari latar dibangun
   lewat **kontras warna permukaan**, bukan border dan bukan shadow tebal.
2. **Dua warna karakter: Ink & Butter.**
   - **Ink** (charcoal `#201F1B`) = warna aksi utama: tombol primer, nav aktif,
     bar chart utama, panel gelap.
   - **Butter** (kuning `#F6D254`) = warna sorotan/emphasis: nilai aktif di
     chart, progress ring, badge "hari ini", checklist selesai, CTA sekunder.
   - Jangan tambah warna brand ketiga. Kebutuhan aksen lain → pakai Ink.
3. **Semua bentuk membulat.** Kartu radius besar (24px), kontrol (tombol,
   input, badge, nav item, segmen progres) berbentuk **pill/stadium**
   (`rounded-full`). Tidak ada sudut tajam di permukaan interaktif.
4. **Warna status tetap semantik** (aturan v1, tidak berubah): hijau=hadir/
   sukses, merah=alpa/hapus/error, amber=peringatan/belum lengkap, biru=info.
   Butter **bukan** warna status — jangan dipakai untuk "warning".
5. **Angka adalah pahlawan.** Statistik ditampilkan besar (display size,
   tracking rapat, `tabular-nums`), label kecil di bawahnya. Ikon kecil,
   angka besar — bukan sebaliknya.
6. **Pemisah bergaya titik/putus.** Antar baris list dan antar seksi dalam
   kartu pakai garis **dotted/dashed** tipis, bukan solid tebal.
7. **Mobile-first untuk halaman peran** (guru/sekretaris/wali kelas),
   **desktop-first untuk admin** (aturan v1, tidak berubah).
8. **Empty state selalu punya pesan + arah tindakan** (aturan v1, tidak
   berubah).

---

## 1. Palet & Design Tokens

### 1.1 Palet inti (dari referensi)

| Nama | Hex | Peran di referensi | Peran di JurnalKu |
|---|---|---|---|
| Canvas | `#F0EEE7` | Latar halaman (dasar gradien) | `--background` |
| Canvas Glow | `#F8F0D4` | Glow kuning di gradien latar | stop gradien ambient |
| Canvas Cool | `#ECECEE` | Sisi abu-dingin gradien | stop gradien ambient |
| Paper | `#FCFBF6` | Permukaan kartu | `--card` |
| Ink | `#201F1B` | Nav aktif, tombol, bar gelap, panel task | `--primary`, `--panel` |
| Butter | `#F6D254` | Pill "Hired", ring timer, bar aktif | `--accent` |
| Butter Deep | `#EEC63B` | Hover/pressed kuning | `--accent-hover` |
| Stone | `#8B8880` | Teks sekunder | `--muted-foreground` |
| Mist | `#EDEAE1` | Latar sekunder/hover, segmen kosong | `--secondary`, `--muted` |
| Line | `#E5E1D6` | Border input, garis dotted | `--border`, `--input` |

### 1.2 Status semantik (disesuaikan agar duduk di latar krem)

| Token | Hex | Pemakaian |
|---|---|---|
| `--success` | `#2F9E44` | Hadir, tersimpan, lengkap |
| `--destructive` | `#E5484D` | Alpa, hapus, error |
| `--warning` | `#E8A33D` | Sakit/izin campuran, belum lengkap |
| `--info` | `#4C7DD0` | Netral-informasi |

Setiap status punya versi *muted* untuk latar badge: campurkan 12–15% warna
di atas Paper (lihat kode di bawah — sudah dihitung sebagai hex).

### 1.3 Drop-in `src/app/globals.css`

Ganti blok `:root` dan tambah token baru di `@theme inline`:

```css
:root {
  --background: #f0eee7;      /* canvas: warm stone */
  --foreground: #201f1b;      /* ink */

  --card: #fcfbf6;            /* paper */
  --card-foreground: #201f1b;

  --popover: #fcfbf6;
  --popover-foreground: #201f1b;

  --primary: #201f1b;         /* ink — tombol/nav aktif */
  --primary-foreground: #fcfbf6;
  --primary-muted: #edeae1;

  --accent: #f6d254;          /* butter */
  --accent-hover: #eec63b;
  --accent-foreground: #201f1b;  /* teks di atas kuning SELALU ink */
  --accent-muted: #faf0c8;       /* latar lembut kuning (badge, highlight) */

  --secondary: #edeae1;       /* mist — hover, segmen kosong */
  --secondary-foreground: #201f1b;

  --muted: #edeae1;
  --muted-foreground: #8b8880; /* stone */

  --panel: #232220;           /* kartu gelap (checklist/daftar tugas) */
  --panel-foreground: #faf9f4;
  --panel-muted: #8d8b84;     /* teks sekunder di panel gelap */

  --destructive: #e5484d;
  --destructive-foreground: #ffffff;
  --destructive-muted: #fbeae9;

  --success: #2f9e44;
  --success-muted: #e7f3e7;
  --warning: #e8a33d;
  --warning-muted: #faf0dd;
  --info: #4c7dd0;
  --info-muted: #e8eef8;

  --border: #e5e1d6;
  --input: #e5e1d6;
  --ring: #201f1b;

  --radius: 1rem;             /* basis 16px, naik dari 10px */
}
```

Tambahan di `@theme inline` (selain mapping yang sudah ada):

```css
  --color-accent-hover: var(--accent-hover);
  --color-accent-muted: var(--accent-muted);
  --color-panel: var(--panel);
  --color-panel-foreground: var(--panel-foreground);
  --color-panel-muted: var(--panel-muted);
  --color-success-muted: var(--success-muted);
  --color-warning-muted: var(--warning-muted);
  --color-info-muted: var(--info-muted);
  --color-destructive-muted: var(--destructive-muted);

  --radius-sm: 0.5rem;    /* 8px  — elemen kecil dalam kartu */
  --radius-md: 0.75rem;   /* 12px — input kecil, chip persegi */
  --radius-lg: 1rem;      /* 16px — input, item list */
  --radius-xl: 1.5rem;    /* 24px — KARTU (standar) */
  --radius-2xl: 2rem;     /* 32px — kartu hero/panel besar */
```

Utility tambahan (taruh setelah `@theme`):

```css
/* Latar ambient: abu dingin kiri-atas → glow butter kanan */
.bg-ambient {
  background:
    radial-gradient(60% 80% at 85% 20%, #f8f0d4 0%, transparent 60%),
    linear-gradient(135deg, #ececee 0%, #f0eee7 50%, #f3edd9 100%);
}

/* Pola garis diagonal (segmen "Project time" di referensi) */
.bg-stripes {
  background-image: repeating-linear-gradient(
    135deg, transparent 0 6px, rgb(32 31 27 / 0.16) 6px 8px);
}

/* Pemisah titik-titik ala referensi */
.divider-dotted { border-bottom: 2px dotted var(--border); }
```

**Perhatian migrasi:** token `--accent` lama bernilai zinc-100 (latar subtle).
Sebelum menempel token baru, audit pemakaian lama:
`grep -rn "bg-accent\|text-accent-foreground" src/` → ganti pemakaian
"latar subtle" ke `bg-secondary`. Setelah itu `accent` resmi berarti kuning.

**Aturan token (tetap dari v1):** jangan hardcode hex di komponen — semua
lewat token. Perubahan tema harus cukup dari `globals.css`.

---

## 2. Tipografi

**Font: Plus Jakarta Sans** (sudah terpasang via `next/font`, var
`--font-jakarta`) — geometrik membulat, karakternya sangat dekat dengan font
referensi. **Tidak perlu ganti font.** Muat weight `400, 500, 600, 700`
(tambahkan `weight` eksplisit di `layout.tsx` bila perlu).

| Level | Kelas Tailwind | Contoh pemakaian |
|---|---|---|
| Display (sapaan) | `text-4xl md:text-5xl font-medium tracking-tight` | "Selamat datang, Bu Rina" |
| Angka statistik besar | `text-4xl md:text-5xl font-medium tracking-tight tabular-nums` | `78`, `6.1 j`, `02:35` |
| Judul kartu | `text-lg font-semibold tracking-tight` | "Jurnal Hari Ini" |
| Judul seksi halaman | `text-sm font-semibold` | "Ringkasan Hari Ini" |
| Body | `text-sm` | isi tabel, form |
| Label/caption | `text-xs text-muted-foreground` | label di bawah angka, meta |
| Label seksi sidebar | `text-xs font-semibold uppercase tracking-wide text-muted-foreground` | "DATA MASTER" |

Aturan:
- Sapaan/heading besar pakai **medium (500)**, bukan bold — referensi terasa
  ringan. Bold (700) hanya untuk angka kecil di dalam badge/emphasis inline.
- Semua angka data pakai `tabular-nums` supaya rata kolom.
- Jangan pakai weight 800 ke atas.
- Ukuran satuan di samping angka besar dipisah jadi label kecil (contoh
  referensi: `6.1 h` besar + "Work Time this week" kecil di sampingnya).

---

## 3. Bentuk, Permukaan & Kedalaman

| Elemen | Resep |
|---|---|
| Kartu standar | `rounded-[1.5rem] bg-card p-5` — **tanpa border, tanpa shadow** |
| Kartu hero / panel gelap | `rounded-[2rem]` |
| Tombol, badge, nav item, segmen progres | `rounded-full` (pill) |
| Input/select/textarea | `rounded-2xl border border-input bg-card` |
| Foto/avatar besar | `rounded-[1.25rem]` (persegi membulat, bukan lingkaran) |
| Avatar kecil (stack) | `rounded-full ring-2 ring-card` |
| Shadow | Tidak dipakai. Pengecualian tunggal: overlay melayang (modal/dropdown) boleh `shadow-[0_16px_40px_rgb(32_31_27/0.10)]` agar terpisah dari halaman |
| Pemisah dalam kartu | `.divider-dotted` atau `border-t border-dashed border-border` |
| Latar halaman shell | `.bg-ambient` di elemen root layout (pengganti `bg-background` polos di halaman dashboard/login) |

Grid & spasi: gap antar kartu `gap-5` (20px) di desktop, `gap-4` mobile.
Padding kartu `p-5`, panel gelap `p-6`. Halaman shell `px-4 md:px-8`,
lebar maks konten `max-w-7xl mx-auto`.

---

## 4. Resep Komponen

Semua resep di bawah = kelas final yang ditempel ke komponen di
`src/components/ui/` atau komponen fitur.

### 4.1 Button (`ui/button.tsx`)

| Varian | Kelas inti |
|---|---|
| `primary` (default) | `rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-5 text-sm font-medium` |
| `accent` (CTA sorotan) | `rounded-full bg-accent text-accent-foreground hover:bg-accent-hover` |
| `outline` | `rounded-full border border-border bg-card hover:bg-secondary` |
| `ghost` | `rounded-full hover:bg-secondary` |
| `destructive` | `rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90` |
| `icon` (bulat) | `size-11 rounded-full` — putih (`bg-card`) di atas ambient, atau `bg-primary text-primary-foreground` untuk aksi utama |

Target sentuh tetap ≥44px (`h-11`). Ikon aksi "buka detail" pakai lucide
`ArrowUpRight` di dalam tombol icon bulat putih — pola tetap referensi untuk
kartu yang bisa diklik lebih lanjut.

### 4.2 Navigasi pill (header peran / topbar)

Pola nav utama referensi: kontainer pill putih, item aktif pill gelap.

```html
<nav class="flex items-center gap-1 rounded-full bg-card p-1.5">
  <a class="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Beranda</a>
  <a class="rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Hari Ini</a>
</nav>
```

- Dipakai untuk: nav 2-item guru/sekretaris (menggantikan rencana "segmented
  tab" v1 — pola ini adalah versi finalnya), nav wali kelas/kepsek.
- **Sidebar admin** memakai pola sama secara vertikal: item aktif
  `rounded-full bg-primary text-primary-foreground`, item lain
  `rounded-full text-muted-foreground hover:bg-secondary`, dikelompokkan
  4–5 seksi berlabel uppercase (struktur seksi ikut v1 §3.2: DASHBOARD /
  DATA MASTER / JADWAL / LAPORAN / SISTEM).

### 4.3 StatCard (angka besar)

Komponen bersama (props: `icon`, `value`, `label`, `href?`, `tone?`):

```html
<div class="rounded-[1.5rem] bg-card p-5">
  <span class="flex size-9 items-center justify-center rounded-full bg-secondary">
    <Users class="size-4" />
  </span>
  <p class="mt-4 text-4xl font-medium tracking-tight tabular-nums">78</p>
  <p class="mt-1 text-xs text-muted-foreground">Guru Aktif</p>
</div>
```

Varian ringkas inline (deret angka di header, seperti `78 Employee ·
56 Hirings · 203 Projects` di referensi): ikon kecil + angka `text-3xl` +
label `text-xs` disusun horizontal `flex items-center gap-2`.

CTA card (mis. "Buka Rekap Bulanan") dibedakan dari stat murni dengan latar
butter muted: `bg-accent-muted` + tombol icon `ArrowUpRight` di pojok.

### 4.4 Meter tersegmen (pill segments)

Pola paling khas referensi (baris Interviews/Hired/Project time/Output).
Di JurnalKu dipakai untuk **komposisi kehadiran** (Hadir/Sakit/Izin/Alpa)
dan **kelengkapan jurnal** — lebar segmen = persentase, tiap segmen pill
dengan label kecil di atasnya:

```html
<div class="flex w-full items-end gap-1.5">
  <!-- ulangi per segmen; style={width: pct+'%'} -->
  <div style="width:72%">
    <p class="mb-1 text-xs text-muted-foreground">Hadir</p>
    <div class="flex h-11 items-center rounded-full bg-success/90 px-4
                text-sm font-medium text-white">72%</div>
  </div>
  <div style="width:13%">
    <div class="h-11 rounded-full bg-stripes border border-border"></div>
  </div>
  <div style="width:15%">
    <div class="flex h-11 items-center justify-center rounded-full
                border border-border text-sm">15%</div>
  </div>
</div>
```

Tekstur segmen (meniru referensi): segmen dominan **solid**, segmen kedua
**bg-stripes**, segmen kecil **outline**. Warna isi tetap semantik
(hadir=success, alpa=destructive, dst.) — bentuk dari referensi, warna dari
aturan status §0.4. Segmen <8% tampil tanpa label angka di dalam (angka
pindah ke label atas).

### 4.5 Bar chart mini (aktivitas mingguan)

Untuk "JP per hari" guru / aktivitas jurnal mingguan:

- Bar: `w-1.5 rounded-full` tinggi proporsional; hari berisi = `bg-primary`,
  sisa target hari itu = `bg-secondary` (bar hantu di belakang), hari ini/
  terpilih = `bg-accent`.
- Nilai bar terpilih ditampilkan sebagai **tag pill butter** di atas bar:
  `rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground`
  (contoh referensi: `5h 23m`).
- Label hari `text-xs text-muted-foreground` di bawah tiap bar.
- Cukup dibangun dengan flexbox — tidak perlu library chart.

### 4.6 Progress ring (donat kelengkapan)

Untuk "% jurnal terisi hari ini" (dashboard admin/kepsek). Tanpa library:

```html
<div class="relative grid size-40 place-items-center rounded-full"
     style="background:
       conic-gradient(var(--color-accent) calc(var(--p)*1%), var(--color-secondary) 0);
       mask: radial-gradient(farthest-side, transparent 62%, #000 63%);">
</div>
<!-- angka di tengah diposisikan absolute di kontainer luar -->
```

- Angka tengah: `text-4xl font-medium tabular-nums` + label kecil di bawah
  ("Terisi").
- Opsional dekorasi tick putus-putus di luar ring:
  `border-2 border-dashed border-border rounded-full` pada lingkaran
  pembungkus berdiameter +12px.

### 4.7 Panel gelap + checklist (kartu "Onboarding Task")

Untuk daftar tindak lanjut: **"Jurnal Belum Diisi (2/8)"** di dashboard
admin/kepsek, atau checklist kelengkapan wali kelas:

```html
<section class="rounded-[2rem] bg-panel p-6 text-panel-foreground">
  <header class="flex items-baseline justify-between">
    <h3 class="text-lg font-semibold">Jurnal Belum Diisi</h3>
    <p class="text-2xl font-medium tabular-nums">2/8</p>
  </header>
  <ul class="mt-4 space-y-1">
    <li class="flex items-center gap-3 py-2.5">
      <span class="grid size-10 place-items-center rounded-full bg-white/10">
        <BookOpen class="size-4" />
      </span>
      <div class="flex-1">
        <p class="text-sm font-medium line-through opacity-50">Matematika — 7A</p>
        <p class="text-xs text-panel-muted">Jam ke-1, 07:00</p>
      </div>
      <span class="grid size-6 place-items-center rounded-full bg-accent">
        <Check class="size-3.5 text-accent-foreground" />
      </span>
    </li>
    <!-- item belum selesai: tanpa line-through, lingkaran kanan bg-white/10 -->
  </ul>
</section>
```

Aturan panel gelap: selesai = teks `line-through opacity-50` + cek butter;
belum = normal + lingkaran kosong. Maksimal **satu panel gelap per layar**
supaya tetap jadi titik fokus.

### 4.8 Papan jadwal (today-board / kalender mingguan)

Meniru strip kalender referensi (September 2024, chip acara):

- Header: judul bulan/hari di tengah `text-lg font-semibold`, navigasi
  periode kiri-kanan sebagai **pill outline** (`rounded-full bg-card px-4
  py-1.5 text-sm`).
- Kolom hari: nama `text-sm text-muted-foreground` + tanggal, kolom "hari
  ini" ditandai teks `font-semibold text-foreground`.
- Garis kolom vertikal `border-l border-dashed border-border`; gutter jam di
  kiri `text-xs text-muted-foreground`.
- **Chip entri jadwal**:
  - Sedang berlangsung → chip gelap: `rounded-2xl bg-panel px-4 py-2.5
    text-panel-foreground` + sub-teks `text-panel-muted`.
  - Akan datang → chip putih: `rounded-2xl bg-card px-4 py-2.5`.
  - Sudah diisi → tambah titik/cek `text-success`; terlewat belum diisi →
    aksen kiri `border-l-4 border-warning` (warna status tetap semantik).
  - Avatar/inisial guru bertumpuk di kanan chip: `flex -space-x-2` dengan
    `ring-2 ring-[warna latar chip]`.

### 4.9 Baris akordeon (list ringkas + chevron)

Pola "Pension contributions / Devices / Compensation Summary" — untuk grup
pengaturan, ringkasan profil guru, atau grup filter rekap:

```html
<button class="flex w-full items-center justify-between py-4 text-left
               divider-dotted last:border-0">
  <span class="text-base font-medium">Perangkat Mengajar</span>
  <ChevronDown class="size-4 text-muted-foreground transition-transform
                      data-[open=true]:rotate-180" />
</button>
```

Isi yang terbuka: baris item dengan thumbnail `rounded-xl` + judul + meta
kecil + menu tiga titik (`ghost icon button`).

### 4.10 Badge & status

`rounded-full px-2.5 py-0.5 text-xs font-semibold` dengan pasangan warna:

| Tone | Kelas | Pemakaian |
|---|---|---|
| success | `bg-success-muted text-success` | Hadir, Terisi, Aktif |
| destructive | `bg-destructive-muted text-destructive` | Alpa, Gagal |
| warning | `bg-warning-muted text-warning` | Sakit/Izin, Belum lengkap |
| info | `bg-info-muted text-info` | Info netral |
| accent | `bg-accent text-accent-foreground` | "Hari ini", sorotan non-status |
| neutral | `bg-secondary text-secondary-foreground` | Default/meta |

### 4.11 Form (input/select/textarea)

- `rounded-2xl border border-input bg-card px-4 h-11 text-sm
  placeholder:text-muted-foreground focus-visible:outline-none
  focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
  focus-visible:ring-offset-background`
- Label `text-xs font-medium text-muted-foreground mb-1.5`.
- Kelompok field dalam modal dipisah `border-t border-dashed border-border
  pt-4` (aturan v1 §3.6 tetap, ganti solid → dashed).

### 4.12 Tabel (CrudManager)

- Bungkus tabel dalam kartu `rounded-[1.5rem] bg-card` — tabel tidak lagi
  menempel latar halaman.
- Header kolom: `text-xs font-semibold uppercase tracking-wide
  text-muted-foreground`, sticky (`sticky top-0 bg-card`).
- Baris: pemisah `border-b border-dashed border-border`, hover
  `hover:bg-secondary/40`. Tanpa zebra.
- Pagination/aksi bawah: tombol pill outline.

---

## 5. Pemetaan ke Halaman JurnalKu

| Halaman | Terapkan |
|---|---|
| **Login** | Latar `.bg-ambient` penuh; kartu form `rounded-[2rem] bg-card` di tengah; nama sekolah di bawah logo; tombol masuk `primary` pill penuh-lebar; split-panel desktop opsional dengan panel kiri `bg-panel` |
| **Shell admin** | Latar `.bg-ambient`; sidebar seksi berlabel + item pill (aktif = pill ink) §4.2; konten kartu-kartu §3 |
| **Dashboard admin** | Baris sapaan display + deret stat inline (§4.3 varian ringkas); meter tersegmen kelengkapan jurnal (§4.4); ring % terisi (§4.6); panel gelap "Jurnal Belum Diisi" (§4.7); tabel JP dalam kartu (§4.12). Judul seksi: "Ringkasan Hari Ini", "Kinerja Bulan Ini", "Data Master" |
| **Dashboard guru/sekretaris** | Nav pill 2-item (§4.2); papan jadwal chip gelap/putih (§4.8); bar chart mingguan JP (§4.5) |
| **Dashboard wali kelas/kepsek** | StatCard (§4.3) + meter kehadiran tersegmen (§4.4) + panel gelap tindak lanjut (§4.7) |
| **CrudManager** | §4.12 + toolbar: search input pill, tombol "Tambah" varian `primary`, filter chip pill outline |
| **Modal** | Radius `rounded-t-[2rem]` (bottom-sheet mobile) / `rounded-[2rem]` (desktop), boleh shadow overlay (§3); footer tombol pill |
| **Cetak PDF / Excel** | **Tidak ikut tema ini.** Cetak tetap tinta gelap di putih (kuning buruk saat dicetak); cukup samakan ke Ink `#201F1B` bila sebelumnya biru |

---

## 6. Aksesibilitas & Aturan Pemakaian Warna

1. **Teks di atas Butter selalu Ink** (`text-accent-foreground`). Dilarang
   teks putih di atas kuning (kontras gagal).
2. Butter tidak pernah dipakai sebagai **warna teks** di atas latar terang —
   hanya sebagai permukaan/isi bentuk.
3. Teks sekunder di latar krem pakai `--muted-foreground` (`#8B8880`,
   ≈4.6:1 di atas Paper — lolos AA untuk teks normal). Jangan diturunkan
   lebih muda.
4. Fokus keyboard: semua kontrol `focus-visible:ring-2 ring-ring` (ring ink)
   + `ring-offset-2` — wajib terlihat di atas latar krem maupun panel gelap
   (di panel gelap ganti `ring-panel-foreground`).
5. Status tidak boleh dikomunikasikan lewat warna saja — selalu ada label
   teks/ikon (mis. badge "Alpa", bukan sekadar merah).
6. Target sentuh ≥44px tetap wajib (PRD).

---

## 7. Checklist Migrasi (urut eksekusi)

- [x] **Token**: audit `bg-accent` lama (`grep -rn "bg-accent" src/`), lalu
      tempel token §1.3 ke `globals.css` + tambah utility `.bg-ambient`,
      `.bg-stripes`, `.divider-dotted`.
- [x] **Button**: tambah varian `accent`, ubah semua varian ke `rounded-full`,
      radius ikut §4.1.
- [x] **Card/Modal/Input/Badge**: perbarui radius & permukaan (§3, §4.10–4.12)
      — hapus border kartu, hapus shadow non-overlay.
- [x] **Shell**: `.bg-ambient` di layout admin & halaman peran; sidebar admin
      → seksi berlabel + item pill.
- [x] **Nav pill 2-item** guru/sekretaris (§4.2).
- [x] **StatCard** komponen bersama (§4.3) — sekaligus melunasi duplikasi
      3 dashboard (temuan v1).
- [x] **Meter tersegmen** komposisi kehadiran (§4.4) di dashboard
      admin/wali kelas/kepsek.
- [x] **Panel gelap** "Jurnal Belum Diisi" (§4.7) di dashboard admin.
- [x] **Papan jadwal**: chip gelap/putih + garis dashed (§4.8).
- [x] **Ring kelengkapan** (§4.6) + **bar chart mingguan** (§4.5).
- [x] **Login** ambient + kartu §5.
- [x] **Sapuan akhir**: ganti semua pemisah solid dalam kartu → dotted/dashed;
      cek kontras & fokus ring per §6.

Item v1 yang tetap berlaku dan terlunasi oleh checklist ini: pengelompokan
sidebar, StatCard bersama, judul seksi dashboard, pembeda CTA card, segmented
nav, sticky table header. Item v1 yang masih terbuka: `EmptyState` bersama,
`Skeleton` loading (buat mengikuti permukaan §3: blok `bg-secondary
rounded-2xl animate-pulse`).

---

## 8. Cara Pakai Dokumen Ini

- Sebelum membuat/menyentuh UI, cek §1–4 dulu — jangan buat token, radius,
  atau pola baru bila resep yang ada sudah menutupi kebutuhan.
- Hex di §1 harus selalu sama dengan `src/app/globals.css`; bila beda,
  `globals.css` yang benar — perbarui tabel di sini.
- Setiap audit ulang: perbarui checklist §7 (tandai selesai, tambah temuan),
  dan tambahkan resep baru ke §4 bila ada pola berulang baru.
