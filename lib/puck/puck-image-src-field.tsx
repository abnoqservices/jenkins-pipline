"use client";

import * as React from "react";
import type { CustomField } from "@measured/puck";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PRODUCT_PLACEHOLDER_KEYS } from "@/lib/puck/puck-placeholders";
import { usePuckBindingOptions } from "@/lib/puck/puck-binding-context";
import { usePuckWebsiteMedia } from "@/lib/puck/puck-website-media-context";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import { ImageIcon, Loader2, Upload } from "lucide-react";

const PRODUCT_OPTIONS = PRODUCT_PLACEHOLDER_KEYS.map((k) => ({
  label: k.replace(/^product\./, "Product · "),
  token: `{{${k}}}`,
}));

function isSingleToken(value: string) {
  const t = value?.trim() ?? "";
  return /^\{\{[\w.]+\}\}$/.test(t);
}

type Mode = "static" | "dynamic";

type MediaItem = { key: string; url: string; name: string; preview_url?: string };

function LibraryImageThumb({ item }: { item: MediaItem }) {
  const [broken, setBroken] = React.useState(false);
  const src = (item.preview_url || item.url || "").trim();

  React.useEffect(() => {
    setBroken(false);
  }, [src]);

  if (!src || broken) {
    return (
      <div className="flex h-24 w-full items-center justify-center rounded-sm bg-muted/70 text-muted-foreground">
        <ImageIcon className="h-8 w-8 opacity-40" aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-sm bg-muted/70">
      {/* preview_url is a time-limited signed URL from the API for private S3 objects */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="max-h-full max-w-full object-contain"
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
      />
    </div>
  );
}

function ImageSrcFieldRender({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const { sectionFields } = usePuckBindingOptions();
  const media = usePuckWebsiteMedia();
  const [mode, setMode] = React.useState<Mode>(() => (isSingleToken(value || "") ? "dynamic" : "static"));
  const [libraryOpen, setLibraryOpen] = React.useState(false);
  const [libraryLoading, setLibraryLoading] = React.useState(false);
  const [libraryItems, setLibraryItems] = React.useState<MediaItem[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setMode(isSingleToken(value || "") ? "dynamic" : "static");
  }, [value]);

  const dynamicOptions = React.useMemo(
    () => [...PRODUCT_OPTIONS, ...sectionFields],
    [sectionFields]
  );

  const selectedToken = mode === "dynamic" && isSingleToken(value || "") ? value.trim() : "";

  const loadLibrary = React.useCallback(async () => {
    if (!media?.listUrl) return;
    setLibraryLoading(true);
    try {
      const res = await axiosClient.get(media.listUrl);
      const raw = res.data?.data?.items;
      const items = Array.isArray(raw)
        ? raw.map((row: Record<string, unknown>) => ({
            key: String(row.key ?? ""),
            url: String(row.url ?? ""),
            name: String(row.name ?? ""),
            preview_url: typeof row.preview_url === "string" ? row.preview_url : undefined,
          }))
        : [];
      setLibraryItems(items);
    } catch {
      showToast("Could not load image library", "error");
      setLibraryItems([]);
    } finally {
      setLibraryLoading(false);
    }
  }, [media?.listUrl]);

  React.useEffect(() => {
    if (libraryOpen) void loadLibrary();
  }, [libraryOpen, loadLibrary]);

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !media?.uploadUrl) return;
    if (!file.type.startsWith("image/")) {
      showToast("Choose an image file", "error");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axiosClient.post(media.uploadUrl, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.data?.url;
      if (res.data?.success && typeof url === "string" && url) {
        onChange(url);
        showToast("Image uploaded", "success");
      } else {
        showToast(res.data?.message || "Upload failed", "error");
      }
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(msg || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium">{label}</Label>
      <RadioGroup
        value={mode}
        onValueChange={(v) => {
          const next = v as Mode;
          setMode(next);
          if (next === "dynamic" && dynamicOptions[0]) {
            onChange(dynamicOptions[0].token);
          }
          if (next === "static") {
            onChange("");
          }
        }}
        className="grid gap-2"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="static" id={`${label}-img-static`} />
          <Label htmlFor={`${label}-img-static`} className="cursor-pointer font-normal">
            URL or upload
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="dynamic" id={`${label}-img-dyn`} />
          <Label htmlFor={`${label}-img-dyn`} className="cursor-pointer font-normal">
            Dynamic — product or section field
          </Label>
        </div>
      </RadioGroup>

      {mode === "static" ? (
        <div className="space-y-2">
          <Input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="text-sm"
            placeholder="https://…"
          />
          {media ? (
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                className="hidden"
                onChange={(ev) => void onPickFile(ev)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                )}
                Upload
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setLibraryOpen(true)}
              >
                <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
                Library
              </Button>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Open the product or department site editor to upload images to your org folder on S3.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <Select
            value={selectedToken || dynamicOptions[0]?.token}
            onValueChange={(token) => onChange(token)}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Choose data field" />
            </SelectTrigger>
            <SelectContent className="max-h-[280px]">
              <div className="px-2 py-1.5 text-[11px] font-semibold uppercase text-muted-foreground">Product</div>
              {PRODUCT_OPTIONS.map((o) => (
                <SelectItem key={o.token} value={o.token}>
                  {o.label}
                </SelectItem>
              ))}
              {sectionFields.length > 0 ? (
                <>
                  <div className="px-2 py-1.5 text-[11px] font-semibold uppercase text-muted-foreground">
                    Section fields
                  </div>
                  {sectionFields.map((o) => (
                    <SelectItem key={o.token} value={o.token}>
                      {o.label}
                    </SelectItem>
                  ))}
                </>
              ) : null}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Use for values that resolve to an image URL on the live page.
          </p>
        </div>
      )}

      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="max-w-lg overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Uploaded images</DialogTitle>
            <DialogDescription>
              Images stored for this site or product. Click one to use its URL.
            </DialogDescription>
          </DialogHeader>
          {libraryLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : libraryItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No images yet. Upload one first.</p>
          ) : (
            <ScrollArea className="h-[min(360px,55vh)] pr-3">
              <div className="grid grid-cols-3 gap-2 pb-1">
                {libraryItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className="group flex min-w-0 flex-col overflow-hidden rounded-md border bg-muted/30 p-1.5 text-left transition hover:border-primary"
                    onClick={() => {
                      onChange(item.url);
                      setLibraryOpen(false);
                      showToast("Image selected", "success");
                    }}
                  >
                    <LibraryImageThumb item={item} />
                    <span className="mt-1 line-clamp-2 text-[10px] text-muted-foreground group-hover:text-foreground">
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Image URL with optional S3 upload + library when `PuckWebsiteMediaProvider` is mounted. */
export function puckImageSrcField(label: string): CustomField<string> {
  return {
    type: "custom",
    label,
    render: ({ value, onChange }) => (
      <ImageSrcFieldRender
        label={label}
        value={typeof value === "string" ? value : ""}
        onChange={onChange}
      />
    ),
  };
}
