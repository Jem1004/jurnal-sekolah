import Papa from "papaparse";
import { ApiError } from "@/lib/api-auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Read CSV rows from a request body: either `rows` (array) or `csv` (text). */
export function readCsvBody(body: any): Record<string, any>[] {
  if (Array.isArray(body?.rows)) return body.rows;
  if (typeof body?.csv === "string") {
    const parsed = Papa.parse(body.csv.trim(), {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });
    return parsed.data as any[];
  }
  throw new ApiError(400, "Kirim 'csv' (teks) atau 'rows' (array).");
}

/** Validate each raw row; return valid data + per-row errors. */
export function validateRows<T>(
  raw: Record<string, any>[],
  parse: (r: any) => { success: true; data: T } | { success: false; error: { issues: { message: string }[] } },
) {
  const valid: T[] = [];
  const errors: { row: number; message: string }[] = [];
  raw.forEach((r, i) => {
    const res = parse(r);
    if (res.success) valid.push(res.data);
    else
      errors.push({
        row: i + 1,
        message: res.error.issues.map((x) => x.message).join("; "),
      });
  });
  return { valid, errors };
}
