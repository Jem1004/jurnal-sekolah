"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Download, Loader2, Upload } from "lucide-react";
import { apiFetch } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Option } from "@/components/admin/crud-manager";

type ParsedRow = { name?: string; nisn?: string; gender?: string };
type ImportResult = {
  inserted: number;
  skipped: number;
  errors: { row: number; message: string }[];
};

const TEMPLATE = "name,nisn,gender\nBudi Santoso,0012345,L\nSiti Aminah,0012346,P\n";

export function StudentImport({ classes }: { classes: Option[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [classId, setClassId] = useState("");
  const [csvText, setCsvText] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function parse(text: string) {
    setError(null);
    setResult(null);
    const out = Papa.parse<ParsedRow>(text.trim(), {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });
    setCsvText(text);
    setRows(out.data.filter((r) => r && Object.keys(r).length > 0));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    parse(await file.text());
  }

  async function commit() {
    if (!classId) return setError("Pilih kelas tujuan terlebih dahulu.");
    if (!csvText.trim()) return setError("Belum ada data CSV.");
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch<ImportResult>(
        "/api/v1/admin/students/import",
        {
          method: "POST",
          body: JSON.stringify({ classId, csv: csvText }),
        },
      );
      setResult(res);
      setRows([]);
      setCsvText("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengimpor.");
    } finally {
      setSubmitting(false);
    }
  }

  const templateHref =
    "data:text/csv;charset=utf-8," + encodeURIComponent(TEMPLATE);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Impor Siswa dari CSV</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="import-class">Kelas Tujuan</Label>
            <Select
              id="import-class"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
            >
              <option value="">— pilih kelas —</option>
              {classes.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="import-file">Berkas CSV</Label>
            <input
              id="import-file"
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              className="block w-full text-sm file:mr-3 file:h-11 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:text-sm file:font-medium"
            />
          </div>
        </div>

        <a
          href={templateHref}
          download="template-siswa.csv"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Download className="h-4 w-4" />
          Unduh template CSV (kolom: name, nisn, gender)
        </a>

        {rows.length > 0 && (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 text-left">
                    <th className="px-3 py-2 font-medium">Nama</th>
                    <th className="px-3 py-2 font-medium">NISN</th>
                    <th className="px-3 py-2 font-medium">L/P</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-1.5">{r.name || "—"}</td>
                      <td className="px-3 py-1.5">{r.nisn || "—"}</td>
                      <td className="px-3 py-1.5">{r.gender || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              Pratinjau {Math.min(rows.length, 50)} dari {rows.length} baris.
            </p>
            <Button onClick={commit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Impor {rows.length} siswa
            </Button>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        {result && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            Berhasil impor {result.inserted} siswa
            {result.skipped > 0 && `, ${result.skipped} baris dilewati`}.
            {result.errors.length > 0 && (
              <ul className="mt-1 list-inside list-disc text-red-700">
                {result.errors.slice(0, 5).map((e) => (
                  <li key={e.row}>
                    Baris {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
