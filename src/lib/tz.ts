/** Date/day helpers scoped to the school timezone. */

/** Today's date (YYYY-MM-DD) in the given IANA timezone. */
export function todayInTz(timezone: string): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Day of week for a YYYY-MM-DD string: 1=Senin .. 7=Minggu. */
export function dayOfWeekOf(dateStr: string): number {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return ((d.getUTCDay() + 6) % 7) + 1;
}

const DAY_NAMES = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];
const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** "Senin, 22 Agustus 2022" from a YYYY-MM-DD string. */
export function formatLongDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const dow = DAY_NAMES[d.getUTCDay()];
  return `${dow}, ${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Add n days to a YYYY-MM-DD string, returning YYYY-MM-DD. */
export function addDays(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** All dates (YYYY-MM-DD) in a given month. month is 1-12. */
export function datesInMonth(year: number, month: number): string[] {
  const out: string[] = [];
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let d = 1; d <= last; d++) {
    out.push(
      `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    );
  }
  return out;
}

export const MONTH_LABEL = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/** Monday–Saturday (YYYY-MM-DD) of the week containing dateStr. */
export function weekRange(dateStr: string): { start: string; end: string } {
  const dow = dayOfWeekOf(dateStr); // 1=Senin .. 7=Minggu
  const start = addDays(dateStr, 1 - dow);
  const end = addDays(start, 5); // Sabtu
  return { start, end };
}

/** "22–27 Maret 2026" style label for a date range (same month assumed common). */
export function rangeLabel(start: string, end: string): string {
  const s = new Date(`${start}T00:00:00Z`);
  const e = new Date(`${end}T00:00:00Z`);
  const sm = MONTH_LABEL[s.getUTCMonth()];
  const em = MONTH_LABEL[e.getUTCMonth()];
  if (s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear()) {
    return `${s.getUTCDate()}–${e.getUTCDate()} ${em} ${e.getUTCFullYear()}`;
  }
  if (s.getUTCFullYear() === e.getUTCFullYear()) {
    return `${s.getUTCDate()} ${sm} – ${e.getUTCDate()} ${em} ${e.getUTCFullYear()}`;
  }
  return `${s.getUTCDate()} ${sm} ${s.getUTCFullYear()} – ${e.getUTCDate()} ${em} ${e.getUTCFullYear()}`;
}

/** First and last day (YYYY-MM-DD) of the month containing dateStr. */
export function monthRange(dateStr: string): { start: string; end: string } {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
  const end = new Date(Date.UTC(y, m + 1, 0)).toISOString().slice(0, 10);
  return { start, end };
}
