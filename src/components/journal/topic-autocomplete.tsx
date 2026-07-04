"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/client";
import { cn } from "@/lib/utils";

export function TopicAutocomplete({
  assignmentId,
  field,
  value,
  onChange,
  placeholder,
  id,
}: {
  assignmentId: string | null;
  field: "topic" | "achievement";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function query(q: string) {
    if (!assignmentId) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await apiFetch<string[]>(
          `/api/v1/autocomplete?assignment_id=${assignmentId}&field=${field}&q=${encodeURIComponent(q)}`,
        );
        setSuggestions(res);
        setOpen(res.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 200);
  }

  return (
    <div className="relative" ref={boxRef}>
      <textarea
        id={id}
        value={value}
        placeholder={placeholder}
        rows={2}
        onChange={(e) => {
          onChange(e.target.value);
          query(e.target.value);
        }}
        onFocus={() => value.length >= 0 && query(value)}
        className={cn(
          "flex min-h-[64px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary",
        )}
      />
      {open && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-popover">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
