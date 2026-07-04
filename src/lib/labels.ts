export const DAY_LABELS: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
};

export const PERIOD_TYPE_LABELS: Record<string, string> = {
  KBM: "KBM",
  ISTIRAHAT: "Istirahat",
  UPACARA: "Upacara",
  IBADAH: "Ibadah",
  EKSKUL: "Ekstrakurikuler",
  LAINNYA: "Lainnya",
};

export function hhmm(time: string | null | undefined): string {
  return time ? time.slice(0, 5) : "—";
}

export const ATTENDANCE_LABELS: Record<string, string> = {
  HADIR: "Hadir",
  TERLAMBAT: "Terlambat",
  TIDAK_HADIR: "Tidak Hadir",
  DIGANTI: "Diganti Guru Lain",
  TUGAS_MANDIRI: "Tugas Mandiri",
};

export const ATTENDANCE_TONE: Record<
  string,
  "success" | "warning" | "danger" | "info" | "neutral"
> = {
  HADIR: "success",
  TERLAMBAT: "warning",
  TIDAK_HADIR: "danger",
  DIGANTI: "info",
  TUGAS_MANDIRI: "info",
};

export const ABSENCE_LABELS: Record<string, string> = {
  S: "Sakit",
  I: "Izin",
  A: "Alpa",
};

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
