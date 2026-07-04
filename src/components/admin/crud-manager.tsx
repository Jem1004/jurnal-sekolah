"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Copy,
  Inbox,
  ListFilter,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/client";
import { cn } from "@/lib/utils";
import { hhmm } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";

export type Option = { value: string; label: string };

export type Field = {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "boolean" | "date" | "time" | "password";
  required?: boolean;
  placeholder?: string;
  options?: Option[];
  /** Key into `lookups` for select options + table label resolution. */
  lookup?: string;
  /** Hide this field's column in the table. */
  hideInTable?: boolean;
  /** Only show in the create form (e.g. password). */
  createOnly?: boolean;
  help?: string;
};

export type Row = Record<string, unknown> & { id: string };

export type Column = {
  key: string;
  label: string;
  render?: (row: Row) => React.ReactNode;
};

/** A dropdown filter (matches a row field against a chosen value). */
export type FilterDef = {
  key: string;
  label: string;
  /** Options from `lookups[lookup]`, or provide `options` directly. */
  lookup?: string;
  options?: Option[];
};

/** Copy all rows of one "day" to other days (e.g. jam pelajaran). */
export type DayCopyConfig = {
  endpoint: string;
  dayOptions: Option[];
};

export function CrudManager({
  slug,
  singular,
  fields,
  initialRows,
  lookups = {},
  columns,
  rowTitle,
  searchKeys,
  searchPlaceholder = "Cari…",
  filters,
  sortable = true,
  requireFilter = false,
  dayCopy,
  serverSearch = false,
}: {
  slug: string;
  singular: string;
  fields: Field[];
  initialRows: Row[];
  lookups?: Record<string, Option[]>;
  columns?: Column[];
  rowTitle?: (row: Row) => string;
  /** Row fields to search across (enables the search box). */
  searchKeys?: string[];
  searchPlaceholder?: string;
  /** Dropdown filters shown above the table. */
  filters?: FilterDef[];
  /** Click column headers to sort (default true). */
  sortable?: boolean;
  /** Hide all rows until the user picks a filter or types a search. */
  requireFilter?: boolean;
  /** Enables a "Salin Hari" button to duplicate rows between days. */
  dayCopy?: DayCopyConfig;
  /** Route the search box through the server (?q=) instead of filtering locally. */
  serverSearch?: boolean;
}) {
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(
    null,
  );

  const [copyOpen, setCopyOpen] = useState(false);
  const [copyFrom, setCopyFrom] = useState(dayCopy?.dayOptions[0]?.value ?? "");
  const [copyTo, setCopyTo] = useState<string[]>([]);
  const [copyOverwrite, setCopyOverwrite] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  const [copyMsg, setCopyMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  const base = `/api/v1/admin/${slug}`;

  const refresh = useCallback(async () => {
    const data = await apiFetch<Row[]>(base);
    setRows(data);
  }, [base]);

  // Re-sync with server truth when the page re-renders (e.g. router.refresh
  // after a CSV import). Optimistic local edits persist until such a refresh.
  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  // Server-side search mode: debounce the search box into a ?q= fetch.
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!serverSearch) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = search.trim();
    searchTimer.current = setTimeout(async () => {
      if (!q) {
        setRows([]);
        return;
      }
      try {
        const data = await apiFetch<Row[]>(
          `${base}?q=${encodeURIComponent(q)}`,
        );
        setRows(data);
      } catch {
        /* ignore transient search errors */
      }
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search, serverSearch, base]);

  const fieldByName = useMemo(
    () => new Map(fields.map((f) => [f.name, f])),
    [fields],
  );

  const labelFor = useCallback(
    (lookup: string | undefined, value: unknown) => {
      if (!lookup) return value == null ? "" : String(value);
      const opt = lookups[lookup]?.find((o) => o.value === String(value));
      return opt?.label ?? "";
    },
    [lookups],
  );

  /** Plain-text value of a field for a row — used by rendering, search & sort. */
  const cellText = useCallback(
    (row: Row, key: string): string => {
      const f = fieldByName.get(key);
      const v = row[key];
      if (!f) return v == null ? "" : String(v);
      if (f.type === "boolean") return v ? "Ya" : "Tidak";
      if (v == null || v === "") return "";
      if (f.type === "time") return hhmm(String(v));
      if (f.lookup) return labelFor(f.lookup, v);
      if (f.type === "select") {
        const opt = f.options?.find((o) => o.value === String(v));
        return opt?.label ?? String(v);
      }
      return String(v);
    },
    [fieldByName, labelFor],
  );

  const tableColumns: Column[] = useMemo(() => {
    if (columns) return columns;
    return fields
      .filter((f) => !f.hideInTable && !f.createOnly)
      .map((f) => ({
        key: f.name,
        label: f.label,
        render: (row: Row) => cellText(row, f.name) || "—",
      }));
  }, [columns, fields, cellText]);

  const visibleRows = useMemo(() => {
    let out = rows;

    for (const f of filters ?? []) {
      const val = filterValues[f.key];
      if (val) out = out.filter((r) => String(r[f.key] ?? "") === val);
    }

    const q = search.trim().toLowerCase();
    if (!serverSearch && q && searchKeys?.length) {
      out = out.filter((r) =>
        searchKeys.some((k) =>
          String(r[k] ?? "")
            .toLowerCase()
            .includes(q),
        ),
      );
    }

    if (sort) {
      out = [...out].sort((a, b) => {
        const av = cellText(a, sort.key);
        const bv = cellText(b, sort.key);
        const an = Number(av);
        const bn = Number(bv);
        const cmp =
          av !== "" && bv !== "" && !isNaN(an) && !isNaN(bn)
            ? an - bn
            : av.localeCompare(bv, "id");
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
    return out;
  }, [rows, filters, filterValues, search, searchKeys, serverSearch, sort, cellText]);

  const hasControls = Boolean(
    searchKeys?.length || filters?.length || serverSearch,
  );
  const activeFilters =
    Boolean(search) || Object.values(filterValues).some(Boolean);
  // When true, keep the table empty until the user narrows the data.
  const gated = requireFilter && !activeFilters;

  function toggleSort(key: string) {
    if (!sortable) return;
    setSort((s) =>
      s?.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
  }

  function resetFilters() {
    setSearch("");
    setFilterValues({});
  }

  function openCopy() {
    setCopyFrom(dayCopy?.dayOptions[0]?.value ?? "");
    setCopyTo([]);
    setCopyOverwrite(false);
    setCopyMsg(null);
    setCopyOpen(true);
  }

  async function submitCopy() {
    if (!dayCopy) return;
    const targets = copyTo.filter((d) => d !== copyFrom);
    if (targets.length === 0) {
      setCopyMsg({ ok: false, text: "Pilih minimal satu hari tujuan." });
      return;
    }
    setCopyBusy(true);
    setCopyMsg(null);
    try {
      const res = await apiFetch<{ copied: number; skippedDays: number[] }>(
        dayCopy.endpoint,
        {
          method: "POST",
          body: JSON.stringify({
            fromDay: Number(copyFrom),
            toDays: targets.map(Number),
            overwrite: copyOverwrite,
          }),
        },
      );
      await refresh();
      const skipNote =
        res.skippedDays?.length && !copyOverwrite
          ? " (sebagian hari dilewati karena sudah terisi)"
          : "";
      setCopyMsg({
        ok: true,
        text: `${res.copied} jam pelajaran disalin${skipNote}.`,
      });
      setCopyTo([]);
    } catch (err) {
      setCopyMsg({
        ok: false,
        text: err instanceof Error ? err.message : "Gagal menyalin.",
      });
    } finally {
      setCopyBusy(false);
    }
  }

  function openCreate() {
    const initial: Record<string, unknown> = {};
    for (const f of fields) {
      initial[f.name] = f.type === "boolean" ? false : "";
    }
    setForm(initial);
    setEditing(null);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(row: Row) {
    const initial: Record<string, unknown> = {};
    for (const f of fields) {
      let v = row[f.name];
      // <input type="time"> wants HH:MM; Postgres returns HH:MM:SS.
      if (f.type === "time" && typeof v === "string") v = v.slice(0, 5);
      initial[f.name] = f.type === "boolean" ? Boolean(v) : (v ?? "");
    }
    setForm(initial);
    setEditing(row);
    setFormError(null);
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      if (editing && f.createOnly) continue;
      let v = form[f.name];
      if (f.type === "number") v = v === "" ? undefined : Number(v);
      if (
        (f.type === "select" || f.type === "text" || f.type === "date") &&
        v === "" &&
        !f.required
      ) {
        v = null;
      }
      if (f.type === "password" && (v === "" || v == null)) continue;
      payload[f.name] = v;
    }

    try {
      if (editing) {
        // Update locally with the server's canonical row (no full refetch).
        const updated = await apiFetch<Row>(`${base}/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setRows((rs) => rs.map((r) => (r.id === editing.id ? updated : r)));
      } else {
        const created = await apiFetch<Row>(base, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setRows((rs) => [created, ...rs]);
      }
      setOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(row: Row) {
    const name = rowTitle ? rowTitle(row) : (row.name as string) || "data ini";
    if (!confirm(`Hapus ${name}? Tindakan ini tidak bisa dibatalkan.`)) return;
    setBusyId(row.id);
    try {
      await apiFetch(`${base}/${row.id}`, { method: "DELETE" });
      setRows((rs) => rs.filter((r) => r.id !== row.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {gated
            ? serverSearch
              ? "Ketik untuk mencari data"
              : `${rows.length} data — pilih filter untuk menampilkan`
            : activeFilters
              ? `${visibleRows.length} data ditemukan`
              : `${rows.length} data tersimpan`}
        </p>
        <div className="flex gap-2">
          {dayCopy && (
            <Button variant="outline" size="sm" onClick={openCopy}>
              <Copy className="h-4 w-4" />
              Salin Hari
            </Button>
          )}
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Tambah
          </Button>
        </div>
      </div>

      {hasControls && (
        <div className="flex flex-wrap items-center gap-2">
          {searchKeys?.length || serverSearch ? (
            <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          ) : null}
          {filters?.map((f) => {
            const opts = f.lookup ? lookups[f.lookup] : f.options;
            return (
              <Select
                key={f.key}
                value={filterValues[f.key] ?? ""}
                onChange={(e) =>
                  setFilterValues((s) => ({ ...s, [f.key]: e.target.value }))
                }
                className="w-auto min-w-[150px]"
              >
                <option value="">Semua {f.label}</option>
                {opts?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            );
          })}
          {activeFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-secondary/90 backdrop-blur">
            <tr className="border-b border-border text-left">
              {tableColumns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    className="whitespace-nowrap px-4 py-3 font-medium text-muted-foreground"
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={cn(
                          "-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground",
                          active && "text-foreground",
                        )}
                      >
                        {c.label}
                        {active ? (
                          sort!.dir === "asc" ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                        )}
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                );
              })}
              <th className="w-24 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={tableColumns.length + 1} className="p-0">
                  <EmptyState
                    icon={Inbox}
                    title="Belum Ada Data"
                    description="Belum ada data yang tersimpan. Klik tombol “Tambah” di atas untuk membuat data baru."
                  />
                </td>
              </tr>
            )}
            {rows.length > 0 && gated && (
              <tr>
                <td colSpan={tableColumns.length + 1} className="p-0">
                  <EmptyState
                    icon={serverSearch ? Search : ListFilter}
                    title="Pilih Filter atau Cari"
                    description={
                      serverSearch
                        ? "Ketik nama atau NISN di atas untuk mencari siswa."
                        : `Pilih filter${searchKeys?.length ? " atau ketik pencarian" : ""} di atas untuk menampilkan data.`
                    }
                  />
                </td>
              </tr>
            )}
            {rows.length > 0 && !gated && visibleRows.length === 0 && (
              <tr>
                <td colSpan={tableColumns.length + 1} className="p-0">
                  <EmptyState
                    icon={Search}
                    title="Data Tidak Ditemukan"
                    description="Tidak ada data yang cocok dengan pencarian atau filter yang dipilih."
                  />
                </td>
              </tr>
            )}
            {!gated &&
              visibleRows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border last:border-0 hover:bg-secondary/30"
              >
                {tableColumns.map((c) => (
                  <td key={c.key} className="px-4 py-3 align-top">
                    {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => openEdit(row)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                      aria-label="Ubah"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => remove(row)}
                      disabled={busyId === row.id}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-destructive"
                      aria-label="Hapus"
                    >
                      {busyId === row.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`${editing ? "Ubah" : "Tambah"} ${singular}`}
        footer={
          <>
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" form="crud-form" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </>
        }
      >
        <form id="crud-form" onSubmit={submit} className="space-y-3.5">
          {fields.map((f) => {
            if (editing && f.createOnly) return null;
            const opts = f.lookup ? lookups[f.lookup] : f.options;
            const value = form[f.name];
            return (
              <div key={f.name}>
                {f.type === "boolean" ? (
                  <label className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      className="h-5 w-5 rounded border-input accent-[var(--primary)]"
                      checked={Boolean(value)}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, [f.name]: e.target.checked }))
                      }
                    />
                    <span className="text-sm font-medium">{f.label}</span>
                  </label>
                ) : (
                  <>
                    <Label htmlFor={`f-${f.name}`}>
                      {f.label}
                      {f.required && <span className="text-destructive"> *</span>}
                    </Label>
                    {f.type === "select" ? (
                      <Select
                        id={`f-${f.name}`}
                        value={String(value ?? "")}
                        required={f.required}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, [f.name]: e.target.value }))
                        }
                      >
                        <option value="">
                          {f.required ? "— pilih —" : "— (kosong) —"}
                        </option>
                        {opts?.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        id={`f-${f.name}`}
                        type={
                          f.type === "number"
                            ? "number"
                            : f.type === "date"
                              ? "date"
                              : f.type === "time"
                                ? "time"
                                : f.type === "password"
                                  ? "password"
                                  : "text"
                        }
                        placeholder={f.placeholder}
                        required={f.required}
                        value={String(value ?? "")}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, [f.name]: e.target.value }))
                        }
                      />
                    )}
                  </>
                )}
                {f.help && (
                  <p className="mt-1 text-xs text-muted-foreground">{f.help}</p>
                )}
              </div>
            );
          })}

          {formError && (
            <p
              className={cn(
                "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700",
              )}
            >
              {formError}
            </p>
          )}
        </form>
      </Modal>

      {dayCopy && (
        <Modal
          open={copyOpen}
          onClose={() => setCopyOpen(false)}
          title="Salin Jam Pelajaran Antar-Hari"
          footer={
            <>
              <Button
                variant="outline"
                type="button"
                onClick={() => setCopyOpen(false)}
                disabled={copyBusy}
              >
                Tutup
              </Button>
              <Button type="button" onClick={submitCopy} disabled={copyBusy}>
                {copyBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                Salin
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Salin seluruh jam pelajaran dari satu hari ke hari lain, agar tak
              perlu membuat satu per satu.
            </p>

            <div>
              <Label htmlFor="copy-from">Salin dari hari</Label>
              <Select
                id="copy-from"
                value={copyFrom}
                onChange={(e) => setCopyFrom(e.target.value)}
              >
                {dayCopy.dayOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Label>Ke hari</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {dayCopy.dayOptions
                  .filter((o) => o.value !== copyFrom)
                  .map((o) => {
                    const checked = copyTo.includes(o.value);
                    return (
                      <label
                        key={o.value}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                          checked
                            ? "border-primary bg-primary-muted"
                            : "border-border hover:bg-secondary",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[var(--primary)]"
                          checked={checked}
                          onChange={(e) =>
                            setCopyTo((s) =>
                              e.target.checked
                                ? [...s, o.value]
                                : s.filter((v) => v !== o.value),
                            )
                          }
                        />
                        {o.label}
                      </label>
                    );
                  })}
              </div>
            </div>

            <label className="flex items-start gap-2.5">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
                checked={copyOverwrite}
                onChange={(e) => setCopyOverwrite(e.target.checked)}
              />
              <span className="text-sm">
                Timpa jam pelajaran yang sudah ada di hari tujuan
                <span className="block text-xs text-muted-foreground">
                  Jika tidak dicentang, hanya jam yang belum ada yang
                  ditambahkan.
                </span>
              </span>
            </label>

            {copyMsg && (
              <p
                className={
                  copyMsg.ok
                    ? "rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800"
                    : "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                }
              >
                {copyMsg.text}
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
