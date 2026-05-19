"use client";

import * as React from "react";
import { ImageIcon, Loader2, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Screenshot payload as accepted by /api/puck-ai. */
export type Screenshot = {
  /** Base64 (no `data:` prefix) of the image bytes. */
  data: string;
  /** Image MIME type — png/jpeg/jpg/webp/gif. */
  mimeType: string;
  /** Pre-built `data:` URL — handy for previewing. */
  previewUrl: string;
  /** Original file name, for the UI badge. */
  fileName: string;
  /** Approx byte count after JPEG/PNG compression. */
  byteLength: number;
};

const MAX_RAW_BYTES = 12 * 1024 * 1024; // 12 MB raw upload cap (we'll compress this down)
const TARGET_MAX_DIMENSION = 1920;
const TARGET_MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_MIME = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];

/** Convert a File / Blob to a base64 string (no data URL prefix). */
function fileToBase64(blob: Blob): Promise<{ base64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("Could not read file"));
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const base64 = dataUrl.includes(",") ? dataUrl.split(",", 2)[1] : dataUrl;
      resolve({ base64, dataUrl });
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Resize + compress to keep payloads small. Returns the original blob if it's
 * already small enough or if canvas isn't available.
 */
async function compressImage(file: File): Promise<{ blob: Blob; mimeType: string }> {
  if (typeof document === "undefined" || !("createElement" in document)) {
    return { blob: file, mimeType: file.type };
  }
  if (file.type === "image/gif") {
    // Don't recompress GIFs — they'd lose animation; we just keep the original.
    return { blob: file, mimeType: file.type };
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return { blob: file, mimeType: file.type };
    const scale = Math.min(1, TARGET_MAX_DIMENSION / Math.max(w, h));
    const targetW = Math.round(w * scale);
    const targetH = Math.round(h * scale);
    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return { blob: file, mimeType: file.type };
    ctx.drawImage(img, 0, 0, targetW, targetH);

    // Try JPEG first at 0.85 quality. Fall back to PNG only if image had alpha and
    // user gave us PNG.
    const targetMime = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, targetMime, targetMime === "image/jpeg" ? 0.85 : undefined)
    );
    if (!blob) return { blob: file, mimeType: file.type };
    if (blob.size > TARGET_MAX_BYTES && targetMime === "image/jpeg") {
      // Try a smaller JPEG.
      const smaller = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.7)
      );
      if (smaller) return { blob: smaller, mimeType: "image/jpeg" };
    }
    return { blob, mimeType: targetMime };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ScreenshotUploader({
  value,
  onChange,
  disabled,
  className,
}: {
  value: Screenshot | null;
  onChange: (next: Screenshot | null) => void;
  disabled?: boolean;
  className?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFile = React.useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      setError(null);
      if (!ACCEPTED_MIME.includes(file.type.toLowerCase())) {
        setError(`Unsupported file type "${file.type}". Use PNG, JPEG, WEBP, or GIF.`);
        return;
      }
      if (file.size > MAX_RAW_BYTES) {
        setError(`File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max raw upload is ${MAX_RAW_BYTES / 1024 / 1024} MB.`);
        return;
      }
      setBusy(true);
      try {
        const compressed = await compressImage(file);
        const { base64, dataUrl } = await fileToBase64(compressed.blob);
        onChange({
          data: base64,
          mimeType: compressed.mimeType,
          previewUrl: dataUrl,
          fileName: file.name,
          byteLength: compressed.blob.size,
        });
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Could not read file");
      } finally {
        setBusy(false);
      }
    },
    [onChange]
  );

  const onPickClick = () => {
    if (disabled || busy) return;
    inputRef.current?.click();
  };

  const onDragOver = (e: React.DragEvent) => {
    if (disabled || busy) return;
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    if (disabled || busy) return;
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    void handleFile(file);
  };

  // Allow pasting an image from the clipboard (Cmd/Ctrl-V) when this region has focus.
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const handler = (e: ClipboardEvent) => {
      if (disabled || busy) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            void handleFile(file);
            return;
          }
        }
      }
    };
    node.addEventListener("paste", handler);
    return () => node.removeEventListener("paste", handler);
  }, [disabled, busy, handleFile]);

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME.join(",")}
        className="sr-only"
        disabled={disabled || busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          void handleFile(file);
          e.target.value = "";
        }}
      />

      {value ? (
        <div className="overflow-hidden rounded-xl border border-indigo-200/70 bg-white shadow-sm">
          <div className="relative bg-slate-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.previewUrl}
              alt={value.fileName}
              className="block max-h-72 w-full object-contain"
            />
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => onChange(null)}
              className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/[0.08] bg-white/90 text-slate-700 shadow-md backdrop-blur transition hover:bg-rose-50 hover:text-rose-700"
              aria-label="Remove screenshot"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-2 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1.5 truncate">
              <ImageIcon className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
              <span className="truncate">{value.fileName}</span>
            </span>
            <span className="shrink-0 tabular-nums">
              {(value.byteLength / 1024).toFixed(0)} KB · {value.mimeType.replace("image/", "")}
            </span>
          </div>
        </div>
      ) : (
        <div
          ref={containerRef}
          tabIndex={0}
          role="button"
          aria-disabled={disabled || busy}
          onClick={onPickClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onPickClick();
            }
          }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-gradient-to-br from-indigo-50 via-violet-50 to-pink-50 px-4 py-6 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/60",
            dragActive ? "border-indigo-400 bg-indigo-50" : "border-indigo-200/70 hover:border-indigo-300",
            (disabled || busy) && "pointer-events-none opacity-60"
          )}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-indigo-600 shadow-sm">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
          </span>
          <p className="mt-2 text-xs font-semibold text-slate-800">
            {busy ? "Reading screenshot…" : "Drop a screenshot, click to browse, or paste"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">PNG, JPG, WEBP, or GIF · up to 12 MB · auto-compressed</p>
        </div>
      )}

      {error ? (
        <p className="text-[11px] font-medium text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}
