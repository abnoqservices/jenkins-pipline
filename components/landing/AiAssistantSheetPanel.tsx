"use client";

import * as React from "react";
import {
  ImageIcon,
  Layers,
  Loader2,
  Plus,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ScreenshotUploader,
  type Screenshot,
} from "@/components/landing/ScreenshotUploader";
import { cn } from "@/lib/utils";

const LIBRARY_SUGGESTIONS = [
  "Modern SaaS landing for design teams with bento features",
  "Dark dev-tool launch — hero, stats, two-up pricing",
  "Warm agency portfolio with case studies and contact form",
  "AI startup with mesh hero, marquee logos, and FAQ",
  "Newsletter / creator landing with subscribe CTA",
  "Bootcamp page with curriculum and testimonials",
];

const PRODUCT_SUGGESTIONS = [
  "Premium product page with gallery, highlights, and reviews",
  "Bold sale PDP with discount badge and bundle offer",
  "Minimal Apple-style PDP with hero gallery and specs",
  "Sustainable goods PDP with story and ingredients",
  "Luxury fashion PDP with editorial layout",
];

export type AiAssistantScope = "library" | "product";

export type AiAssistantSheetPanelProps = {
  scope: AiAssistantScope;
  prompt: string;
  setPrompt: (next: string) => void;
  mode: "replace" | "append";
  setMode: (next: "replace" | "append") => void;
  screenshot: Screenshot | null;
  setScreenshot: (next: Screenshot | null) => void;
  loading: boolean;
  onGenerate: () => void;
  /** Optional model name shown after a successful run, e.g. "gemini-2.5-pro". */
  lastModel?: string | null;
};

export function AiAssistantSheetPanel({
  scope,
  prompt,
  setPrompt,
  mode,
  setMode,
  screenshot,
  setScreenshot,
  loading,
  onGenerate,
  lastModel,
}: AiAssistantSheetPanelProps) {
  const suggestions = scope === "product" ? PRODUCT_SUGGESTIONS : LIBRARY_SUGGESTIONS;
  const canGenerate = !loading && (Boolean(screenshot) || prompt.trim().length > 0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Premium gradient header */}
      <div className="relative isolate overflow-hidden border-b border-indigo-100 bg-gradient-to-br from-indigo-50 via-violet-50 to-pink-50 px-6 py-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-pink-300/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-indigo-300/40 blur-3xl"
        />
        <div className="relative flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 text-white shadow-lg ring-1 ring-white/40">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div className="space-y-1">
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              AI assistant
            </h2>
            <p className="text-[12px] leading-relaxed text-slate-600">
              Describe what you want, paste a screenshot, or both. We map each section to your block library — anything novel drops into a Custom code block.
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
        {/* Reference screenshot */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <ImageIcon className="h-3 w-3" aria-hidden />
              Reference screenshot
            </Label>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
              Optional
            </span>
          </div>
          <ScreenshotUploader value={screenshot} onChange={setScreenshot} disabled={loading} />
        </section>

        {/* Prompt */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="ai-assistant-prompt"
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500"
            >
              <Wand2 className="h-3 w-3" aria-hidden />
              Prompt
            </Label>
            {screenshot ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                Optional with screenshot
              </span>
            ) : null}
          </div>
          <Textarea
            id="ai-assistant-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            disabled={loading}
            placeholder={
              screenshot
                ? "Optional — refine the screenshot. e.g. Use teal accent #14b8a6, replace copy for a fintech audience"
                : scope === "product"
                  ? "e.g. Premium product page with hero gallery, three highlights, and a sticky buy bar"
                  : "e.g. Modern SaaS landing for design teams with bento features"
            }
            className="min-h-[100px] resize-y border-slate-200 bg-white text-sm transition focus-visible:border-indigo-300 focus-visible:ring-2 focus-visible:ring-indigo-200/60"
          />
          {!screenshot ? (
            <div className="space-y-1.5 pt-1">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Try one of these
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={loading}
                    onClick={() => setPrompt(s)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
                  >
                    {s.length > 56 ? `${s.slice(0, 54)}…` : s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {/* Mode selector */}
        <section className="space-y-2">
          <Label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <Layers className="h-3 w-3" aria-hidden />
            Output mode
          </Label>
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <ModeButton
              active={mode === "replace"}
              disabled={loading}
              onClick={() => setMode("replace")}
              label="Replace page"
              hint="Build fresh"
              icon={<Layers className="h-3.5 w-3.5" aria-hidden />}
            />
            <ModeButton
              active={mode === "append"}
              disabled={loading}
              onClick={() => setMode("append")}
              label="Append blocks"
              hint="Extend current"
              icon={<Plus className="h-3.5 w-3.5" aria-hidden />}
            />
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            {mode === "replace"
              ? "Builds a fresh page from scratch — overwrites everything currently on the canvas."
              : "Adds new sections to the existing page; nothing is removed."}
          </p>
        </section>
      </div>

      {/* Footer with action */}
      <div className="border-t border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 py-4">
        <Button
          type="button"
          disabled={!canGenerate}
          onClick={() => onGenerate()}
          className={cn(
            "h-11 w-full gap-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60",
            loading && "opacity-90"
          )}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              <span>{screenshot ? "Reading screenshot…" : "Generating page…"}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden />
              <span>{screenshot ? "Recreate from screenshot" : "Generate page"}</span>
            </>
          )}
        </Button>
        <p className="mt-2 text-center text-[10px] text-slate-400">
          {lastModel ? (
            <>Powered by Gemini · last run on <span className="font-medium text-slate-500">{lastModel}</span> · review before saving</>
          ) : (
            <>Powered by Gemini · 5-20 seconds · review before saving</>
          )}
        </p>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  disabled,
  onClick,
  label,
  hint,
  icon,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 rounded-xl px-3 py-2 text-center transition disabled:opacity-50",
        active
          ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
          : "text-slate-500 hover:text-slate-800"
      )}
    >
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold">
        {icon}
        {label}
      </span>
      <span className={cn("text-[10px]", active ? "text-slate-500" : "text-slate-400")}>
        {hint}
      </span>
    </button>
  );
}
