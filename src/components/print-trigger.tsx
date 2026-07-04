"use client";

import { useEffect, useState } from "react";

interface PdfDownloaderProps {
  filename: string;
  orientation?: "portrait" | "landscape";
}

export function PdfDownloader({ filename, orientation = "landscape" }: PdfDownloaderProps) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load html2pdf from CDN dynamically
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.async = true;
    script.onload = () => {
      const element = document.getElementById("print-area");
      if (!element) return;

      const opt = {
        margin:       [0.4, 0.4, 0.4, 0.4],
        filename:     filename,
        image:        { type: "jpeg", quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: "in", format: "a4", orientation: orientation }
      };

      // Generate PDF
      (window as any).html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          setLoading(false);
        })
        .catch((err: any) => {
          console.error("PDF generation failed:", err);
          setLoading(false);
        });
    };
    document.body.appendChild(script);

    return () => {
      // Clean up script tag
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [filename, orientation]);

  return (
    <div className="no-print mb-6 flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
      <div className="flex items-center gap-2">
        {loading ? (
          <>
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-600">Menyiapkan unduhan PDF otomatis...</span>
          </>
        ) : (
          <>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold text-zinc-600">PDF berhasil diunduh.</span>
          </>
        )}
      </div>
      <button
        onClick={() => {
          const element = document.getElementById("print-area");
          if (element) {
            const opt = {
              margin:       [0.4, 0.4, 0.4, 0.4],
              filename:     filename,
              image:        { type: "jpeg", quality: 0.98 },
              html2canvas:  { scale: 2, useCORS: true, logging: false },
              jsPDF:        { unit: "in", format: "a4", orientation: orientation }
            };
            (window as any).html2pdf().set(opt).from(element).save();
          }
        }}
        disabled={loading}
        className="rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm disabled:opacity-50 transition-all duration-200 cursor-pointer"
      >
        Unduh Ulang PDF
      </button>
    </div>
  );
}
