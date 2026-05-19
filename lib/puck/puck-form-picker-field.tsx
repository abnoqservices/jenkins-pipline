"use client";

import * as React from "react";
import type { CustomField } from "@measured/puck";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, ExternalLink, FileText, Loader2, Search, X } from "lucide-react";
import axiosClient from "@/lib/axiosClient";
import { cn } from "@/lib/utils";

type FormSummary = {
  id: number | string;
  name: string;
  slug?: string;
  description?: string;
  status?: string;
};

/**
 * Module-level cache so multiple field instances on the same page share one
 * list of forms (and therefore one network request). Refresh button can force
 * a re-fetch.
 */
let cachedForms: FormSummary[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

async function fetchForms(force = false): Promise<FormSummary[]> {
  if (!force && cachedForms && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedForms;
  }
  try {
    const response = await axiosClient.get("/forms");
    const list = response?.data?.success ? response.data.data : null;
    const out = Array.isArray(list)
      ? list.map((f: Record<string, unknown>) => ({
          id: (f.id as number | string) ?? "",
          name: typeof f.name === "string" ? f.name : "Untitled form",
          slug: typeof f.slug === "string" ? f.slug : undefined,
          description: typeof f.description === "string" ? f.description : undefined,
          status: typeof f.status === "string" ? f.status : undefined,
        }))
      : [];
    cachedForms = out;
    cachedAt = Date.now();
    return out;
  } catch {
    return [];
  }
}

function FormPickerRender({
  value,
  onChange,
  label,
  helper,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  helper?: string;
}) {
  const [forms, setForms] = React.useState<FormSummary[] | null>(cachedForms);
  const [loading, setLoading] = React.useState(forms === null);
  const [search, setSearch] = React.useState("");
  const [reveal, setReveal] = React.useState(false);

  const refresh = React.useCallback(async (force: boolean) => {
    setLoading(true);
    const out = await fetchForms(force);
    setForms(out);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (forms === null) void refresh(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trimmed = (value ?? "").trim();
  const selected = React.useMemo(() => {
    if (!trimmed || !forms) return null;
    return (
      forms.find(
        (f) =>
          String(f.id) === trimmed ||
          (typeof f.slug === "string" && f.slug === trimmed)
      ) ?? null
    );
  }, [trimmed, forms]);

  const filtered = React.useMemo(() => {
    if (!forms) return [];
    const q = search.trim().toLowerCase();
    if (!q) return forms;
    return forms.filter((f) => {
      const haystack = [f.name, f.slug, String(f.id)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [forms, search]);

  const showList = !selected;

  return (
    <div className="space-y-2 pt-0.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium">{label}</Label>
        <button
          type="button"
          onClick={() => void refresh(true)}
          disabled={loading}
          className="text-[10px] font-medium text-indigo-600 hover:underline disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {helper ? <p className="text-[11px] leading-snug text-muted-foreground">{helper}</p> : null}

      {selected ? (
        <div className="flex items-start justify-between gap-2 rounded-lg border border-indigo-200 bg-indigo-50/40 p-2.5">
          <div className="flex min-w-0 items-start gap-2">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-pink-500 text-white shadow-sm">
              <FileText className="h-3.5 w-3.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-slate-800">{selected.name}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                <code className="rounded bg-white/70 px-1 py-0.5 font-mono">id: {String(selected.id)}</code>
                {selected.slug ? (
                  <code className="rounded bg-white/70 px-1 py-0.5 font-mono">slug: {selected.slug}</code>
                ) : null}
                {selected.status ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 text-emerald-700">
                    <Check className="h-2.5 w-2.5" aria-hidden />
                    {selected.status}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Clear selected form"
            onClick={() => onChange("")}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-white hover:text-rose-600"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ) : null}

      {showList ? (
        <div className="space-y-1.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your forms…"
              className="h-8 pl-7 text-xs"
            />
          </div>
          {loading && !forms ? (
            <div className="flex items-center gap-2 rounded-md border bg-muted/20 p-2 text-[11px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              Loading forms…
            </div>
          ) : forms && forms.length === 0 ? (
            <div className="space-y-1.5 rounded-md border border-dashed bg-muted/20 p-3 text-[11px] text-muted-foreground">
              <p>You haven&apos;t created any forms yet.</p>
              <a
                href="/forms"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
              >
                Create one in /forms
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-md border bg-muted/10 p-2 text-[11px] text-muted-foreground">
              No forms match &quot;{search}&quot;.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto rounded-md border bg-card">
              {filtered.map((f) => (
                <button
                  key={String(f.id)}
                  type="button"
                  onClick={() => onChange(String(f.id))}
                  className="flex w-full items-center justify-between gap-2 border-b px-2.5 py-2 text-left transition last:border-b-0 hover:bg-indigo-50/50"
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium text-foreground">{f.name}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <code>id {String(f.id)}</code>
                      {f.slug ? <code>· {f.slug}</code> : null}
                    </div>
                  </div>
                  <Check className="h-3.5 w-3.5 shrink-0 text-indigo-500 opacity-0 transition group-hover:opacity-100" aria-hidden />
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            {reveal ? "Hide manual ID input" : "Or paste a form ID / slug"}
          </button>
          {reveal ? (
            <Input
              value={trimmed}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Form ID or slug"
              className="h-8 text-xs"
            />
          ) : null}
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onChange("")}
          className="h-7 w-full text-[11px]"
        >
          Pick a different form
        </Button>
      )}
    </div>
  );
}

/**
 * Custom Puck field that lets users pick from their admin-created forms
 * (`GET /forms`) or paste a form ID / slug manually. The stored value is the
 * form's `id` (or slug, if pasted). Embed components consume this string with
 * `<Form form_id={value} />`.
 */
export function puckFormPickerField(
  label: string,
  helper?: string
): CustomField<string> {
  return {
    type: "custom",
    label,
    render: ({ value, onChange }) => (
      <FormPickerRender
        value={typeof value === "string" ? value : ""}
        onChange={onChange}
        label={label}
        helper={helper}
      />
    ),
  };
}
