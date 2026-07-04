"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { ChevronDown, Download, Loader2, Upload } from "lucide-react";
import { apiFetch } from "@/lib/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ImportResult = {
  inserted: number;
  skipped: number;
  errors: { row: number; message: string }[];
};

/** Reusable CSV import panel for simple resources (teachers, subjects). */
export function CsvImport({
  endpoint,
  title,
  columnsHint,
  template,
  templateName,
}: {
  endpoint: string;
  title: string;
  columnsHint: string;
  template: string;
  templateName: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function parse(text: string) {
    setError(null);
    setResult(null);
    const out = Papa.parse<Record<string, string>>(text.trim(), {
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
    if (!csvText.trim()) return setError("Belum ada data CSV.");
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch<ImportResult>(endpoint, {
        method: "POST",
        body: JSON.stringify({ csv: csvText }),
      });
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
    "data:text/csv;charset=utf-8," + encodeURIComponent(template);

  return (
    <Card className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-3 text-left"
      >
        <span className="text-sm font-semibold">{title}</span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <CardContent className="space-y-3 border-t border-border pt-4">
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              className="block w-full text-sm file:mr-3 file:h-11 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:text-sm file:font-medium"
            />
          </div>
          <a
            href={templateHref}
            download={templateName}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Download className="h-4 w-4" />
            Unduh template CSV (kolom: {columnsHint})
          </a>

          {rows.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {rows.length} baris siap diimpor.
              </p>
              <Button onClick={commit} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Impor {rows.length} baris
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
              Berhasil impor {result.inserted}
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
      )}
    </Card>
  );
}
