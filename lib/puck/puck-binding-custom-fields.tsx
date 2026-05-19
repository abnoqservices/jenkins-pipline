"use client";

import * as React from "react";
import type { CustomField } from "@measured/puck";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ChevronDown, Search } from "lucide-react";
import { PRODUCT_PLACEHOLDER_KEYS } from "@/lib/puck/puck-placeholders";
import { usePuckBindingOptions } from "@/lib/puck/puck-binding-context";

const PRODUCT_OPTIONS = PRODUCT_PLACEHOLDER_KEYS.map((k) => ({
  label: k.replace(/^product\./, "Product · "),
  token: `{{${k}}}`,
}));

function insertAt(text: string, start: number, end: number, token: string): string {
  return `${text.slice(0, start)}${token}${text.slice(end)}`;
}

function clampSliderValue(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) {
    return min;
  }
  return Math.min(max, Math.max(min, n));
}

/**
 * Numeric Puck field with a Radix slider (stores stringified number in block props).
 */
export function puckRangeSliderField(
  label: string,
  opts: { min: number; max: number; step?: number; suffix?: string }
): CustomField<string> {
  const step = opts.step ?? 1;
  return {
    type: "custom",
    label,
    render: ({ value, onChange }) => {
      const raw = parseFloat(String(value ?? ""));
      const n = clampSliderValue(
        Number.isFinite(raw) ? raw : opts.min,
        opts.min,
        opts.max
      );
      return (
        <div className="space-y-2 pt-0.5">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-medium">{label}</Label>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {Math.round(n)}
              {opts.suffix ?? ""}
            </span>
          </div>
          <Slider
            min={opts.min}
            max={opts.max}
            step={step}
            value={[n]}
            onValueChange={(arr) => {
              const next = arr[0] ?? opts.min;
              onChange(String(Math.round(next)));
            }}
          />
        </div>
      );
    },
  };
}

/**
 * Color field with native color picker + editable hex input.
 */
export function puckColorPickerField(label: string): CustomField<string> {
  return {
    type: "custom",
    label,
    render: ({ value, onChange }) => {
      const current = typeof value === "string" ? value.trim() : "";
      const safeColor = /^#([0-9a-fA-F]{6})$/.test(current) ? current : "#000000";
      const pickerId = `puck-color-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

      return (
        <div className="space-y-2">
          <Label className="text-xs font-medium">{label}</Label>
          <div className="flex items-center gap-2">
            <label
              htmlFor={pickerId}
              className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-slate-300 shadow-sm"
              title={label}
            >
              <span
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: safeColor }}
              />
            </label>
            <input
              id={pickerId}
              type="color"
              value={safeColor}
              onChange={(e) => onChange(e.target.value)}
              className="sr-only"
              aria-label={label}
            />
            <Input
              value={current}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className="h-8 text-xs"
            />
          </div>
        </div>
      );
    },
  };
}

/**
 * Read-only heading row for grouping style controls.
 */
export function puckStyleHeadingField(title: string): CustomField<string> {
  return {
    type: "custom",
    label: title,
    render: () => (
      <div className="pt-3">
        <div className="mb-2 border-t border-border/70" />
        <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </Label>
      </div>
    ),
  };
}

function tokenColorClasses(token: string): string {
  const key = token.replace(/[{}\s]/g, "");
  if (key.startsWith("product.")) {
    return "border-violet-200 bg-violet-100 text-violet-700";
  }
  if (key.startsWith("visitor.")) {
    return "border-sky-200 bg-sky-100 text-sky-700";
  }
  if (key.startsWith("campaign.")) {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }
  if (key.startsWith("system.")) {
    return "border-emerald-200 bg-emerald-100 text-emerald-700";
  }
  if (key.includes(".")) {
    return "border-indigo-200 bg-indigo-100 text-indigo-700";
  }
  return "border-slate-200 bg-slate-100 text-slate-700";
}

function renderHighlightedText(text: string): React.ReactNode {
  if (!text.includes("{{")) return text || "\u200b";
  const parts = text.split(/(\{\{\s*[\w.]+\s*\}\})/g);
  return parts.map((part, i) => {
    if (/^\{\{\s*[\w.]+\s*\}\}$/.test(part)) {
      return (
        <span
          key={`${part}-${i}`}
          className={`rounded border px-0.5 py-0.5 font-mono ${tokenColorClasses(part)}`}
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={`${i}-txt`}>{part}</React.Fragment>;
  });
}

function BindingStringFieldRender({
  value,
  onChange,
  label,
  multiline,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  multiline?: boolean;
}) {
  const { sectionFields } = usePuckBindingOptions();
  const [showDynamic, setShowDynamic] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    Product: true,
    "Section fields": true,
  });
  const fieldRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const mirrorRef = React.useRef<HTMLDivElement | null>(null);

  const tokenGroups = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const filter = (token: string, tokenLabel: string) =>
      q === "" || token.toLowerCase().includes(q) || tokenLabel.toLowerCase().includes(q);
    const product = PRODUCT_OPTIONS.filter((o) => filter(o.token, o.label));
    const section = sectionFields
      .map((o) => ({ label: o.label, token: o.token }))
      .filter((o) => filter(o.token, o.label));
    return [
      { title: "Product", items: product },
      { title: "Section fields", items: section },
    ].filter((g) => g.items.length > 0);
  }, [query, sectionFields]);

  const applyToken = (token: string) => {
    const el = fieldRef.current;
    if (!el) {
      onChange(`${value || ""}${token}`);
      return;
    }
    const start = el.selectionStart ?? (value || "").length;
    const end = el.selectionEnd ?? start;
    const next = insertAt(value || "", start, end, token);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + token.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => ({ ...prev, [title]: !(prev[title] ?? true) }));
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium">{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2 text-[11px]"
          onClick={() => setShowDynamic((v) => !v)}
        >
          View dynamic data
          <ChevronDown className={`ml-1 h-3.5 w-3.5 transition-transform ${showDynamic ? "rotate-180" : ""}`} />
        </Button>
      </div>

      {multiline ? (
        <div className="relative">
          <div
            ref={mirrorRef}
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-md border border-input bg-transparent px-3 py-2 text-sm leading-[1.45] whitespace-pre-wrap break-words"
          >
            {value ? (
              renderHighlightedText(value)
            ) : (
              <span className="text-muted-foreground">Type content, then insert dynamic tags where needed</span>
            )}
          </div>
          <Textarea
            ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            onScroll={(e) => {
              if (mirrorRef.current) {
                mirrorRef.current.scrollTop = e.currentTarget.scrollTop;
                mirrorRef.current.scrollLeft = e.currentTarget.scrollLeft;
              }
            }}
            rows={4}
            className="relative bg-transparent text-transparent caret-foreground"
            placeholder=""
          />
        </div>
      ) : (
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-md border border-input bg-transparent px-3 py-2 text-sm leading-none"
          >
            {value ? (
              <span className="whitespace-pre">{renderHighlightedText(value)}</span>
            ) : (
              <span className="text-muted-foreground">Type content, then insert dynamic tags where needed</span>
            )}
          </div>
          <Input
            ref={fieldRef as React.RefObject<HTMLInputElement>}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="relative bg-transparent text-transparent caret-foreground"
            placeholder=""
          />
        </div>
      )}

      {showDynamic ? (
        <div className="space-y-2 rounded-lg border bg-muted/20 p-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tags..."
              className="h-8 pl-7 text-xs"
            />
          </div>

          {tokenGroups.length === 0 ? (
            <p className="text-xs text-muted-foreground">No matching dynamic tags.</p>
          ) : (
            tokenGroups.map((group) => {
              const open = expandedGroups[group.title] ?? true;
              return (
                <div key={group.title} className="space-y-1.5">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-md border bg-background px-2 py-1.5 text-left"
                    onClick={() => toggleGroup(group.title)}
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{open ? "Hide" : "Show"}</span>
                  </button>
                  {open ? (
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <button
                          key={`${group.title}-${item.token}`}
                          type="button"
                          className="flex w-full items-center justify-between rounded-md border bg-background px-2 py-1.5 text-left text-[11px] hover:border-primary/40"
                          onClick={() => applyToken(item.token)}
                        >
                          <code className="font-mono">{item.token}</code>
                          <span className="ml-2 truncate text-muted-foreground">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
          <p className="text-[11px] text-muted-foreground">
            Click any tag to insert it at your cursor in this field.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function puckBindingTextField(label: string): CustomField<string> {
  return {
    type: "custom",
    label,
    render: ({ value, onChange }) => (
      <BindingStringFieldRender
        label={label}
        value={typeof value === "string" ? value : ""}
        onChange={onChange}
      />
    ),
  };
}

export function puckBindingTextareaField(label: string): CustomField<string> {
  return {
    type: "custom",
    label,
    render: ({ value, onChange }) => (
      <BindingStringFieldRender
        label={label}
        value={typeof value === "string" ? value : ""}
        onChange={onChange}
        multiline
      />
    ),
  };
}
