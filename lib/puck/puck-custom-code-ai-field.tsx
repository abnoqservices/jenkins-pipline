"use client";

import * as React from "react";
import type { ComponentData, CustomField } from "@measured/puck";
import { useGetPuck, usePuck } from "@measured/puck";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Image as ImageIcon, Loader2, Sparkles, Wand2 } from "lucide-react";
import {
  ScreenshotUploader,
  type Screenshot,
} from "@/components/landing/ScreenshotUploader";
import { cn } from "@/lib/utils";

type CustomCodeContent = {
  html?: string;
  css?: string;
  javascript?: string;
  isolation?: string;
  scopeClass?: string;
  /** Last AI prompt — persisted so we can show it back to the user. */
  aiPrompt?: string;
};

const PROMPT_SUGGESTIONS = [
  "Pricing card with three tiers and a highlighted middle plan",
  "Animated counter that ticks up to 10,000 when scrolled into view",
  "Testimonial slider with quote, author, and avatar",
  "Glassmorphism hero card with a CTA button and product mockup",
  "Floating notification toast with an icon and dismiss button",
  "Newsletter signup form with email input and gradient button",
];

function PuckCustomCodeAiFieldRender({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  // Subscribe so the field re-renders when state changes (and selectedItem updates).
  const puck = usePuck();
  // Direct getter so async handlers get the freshest store state.
  const getPuck = useGetPuck();

  const [prompt, setPrompt] = React.useState<string>(typeof value === "string" ? value : "");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lastModel, setLastModel] = React.useState<string | null>(null);
  const [appliedAt, setAppliedAt] = React.useState<number | null>(null);
  const [screenshot, setScreenshot] = React.useState<Screenshot | null>(null);
  const [showUploader, setShowUploader] = React.useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    if (typeof value === "string" && value !== prompt) {
      setPrompt(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  React.useEffect(() => {
    if (!appliedAt) return;
    const t = window.setTimeout(() => setAppliedAt(null), 4000);
    return () => window.clearTimeout(t);
  }, [appliedAt]);

  const selected = puck.selectedItem;
  const currentContent: CustomCodeContent =
    ((selected?.props as Record<string, unknown> | undefined)?.content as
      | CustomCodeContent
      | undefined) ?? {};

  const hasExistingCode = Boolean(
    (currentContent.html?.trim() ?? "") ||
      (currentContent.css?.trim() ?? "") ||
      (currentContent.javascript?.trim() ?? "")
  );

  /**
   * Patch the selected block's `content.{html,css,javascript,scopeClass,aiPrompt}`
   * by dispatching a `replace` action — the same path Puck's own field onChange
   * uses internally. We re-read the store inside the handler so the dispatch
   * targets the latest selection / id / index.
   */
  const patchSelectedContent = (patch: Partial<CustomCodeContent>): { ok: boolean; reason?: string } => {
    const store = getPuck();
    const item = store.selectedItem as ComponentData | null;
    if (!item) return { ok: false, reason: "no-selection" };

    const id = (item.props as { id?: string } | undefined)?.id;
    if (!id) return { ok: false, reason: "no-id" };

    const selector = store.getSelectorForId(id);
    if (!selector) return { ok: false, reason: "no-selector" };

    const itemProps = item.props as Record<string, unknown>;
    const existing = (itemProps.content as Record<string, unknown> | undefined) ?? {};
    const nextContent = { ...existing, ...patch };

    try {
      store.dispatch({
        type: "replace",
        destinationIndex: selector.index,
        destinationZone: selector.zone,
        data: {
          ...item,
          props: {
            ...itemProps,
            content: nextContent,
          },
        } as unknown as ComponentData,
      });
      return { ok: true };
    } catch (e: unknown) {
      return { ok: false, reason: e instanceof Error ? e.message : "dispatch-failed" };
    }
  };

  const runGeneration = async (mode: "generate" | "refine") => {
    const trimmed = prompt.trim();
    if (!trimmed && !screenshot) {
      setError("Describe what you want or attach a screenshot.");
      return;
    }
    if (!getPuck().selectedItem) {
      setError("Select the Custom code block first, then click Generate.");
      return;
    }
    setError(null);
    setLoading(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/custom-code-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: trimmed,
          mode,
          scopeClass: currentContent.scopeClass ?? "",
          currentHtml: currentContent.html ?? "",
          currentCss: currentContent.css ?? "",
          currentJs: currentContent.javascript ?? "",
          screenshot: screenshot
            ? { mimeType: screenshot.mimeType, data: screenshot.data }
            : undefined,
        }),
      });
      const json = (await res.json()) as
        | {
            success: true;
            data: {
              html: string;
              css: string;
              javascript: string;
              scopeClass: string;
              meta?: { model?: string };
            };
          }
        | { success: false; error: string };

      if (!json || !("success" in json) || !json.success) {
        const message = json && "error" in json ? json.error : "AI request failed";
        setError(message);
        return;
      }

      // Atomically patch html / css / javascript / scopeClass / aiPrompt in ONE
      // dispatch. Important: we do NOT call the field's `onChange` separately —
      // its closure was created by the parent ObjectField at the time the
      // sidebar last rendered, and the captured `data` snapshot is stale by the
      // time we get here. Calling `onChange(trimmed)` would dispatch a `replace`
      // that overwrites `content` with `{ aiPrompt: trimmed }` — wiping the
      // html/css/js we just applied. The dispatch below already sets aiPrompt;
      // the field will pick up the new value via state propagation.
      const result = patchSelectedContent({
        html: json.data.html,
        css: json.data.css,
        javascript: json.data.javascript,
        scopeClass: json.data.scopeClass,
        aiPrompt: trimmed,
      });

      if (!result.ok) {
        const detail =
          result.reason === "no-selection"
            ? "The block was deselected before the response came back. Re-select the Custom code block and try again."
            : result.reason === "no-selector"
              ? "Could not locate this block in the page. Try clicking it again, then Generate."
              : result.reason === "no-id"
                ? "The selected block is missing an id."
                : `Could not apply: ${result.reason ?? "unknown"}`;
        setError(detail);
        return;
      }

      setLastModel(json.data.meta?.model ?? null);
      setAppliedAt(Date.now());
      // Clear the screenshot so the next run starts fresh; keep prompt for iteration.
      setScreenshot(null);
      setShowUploader(false);
    } catch (e: unknown) {
      if ((e as DOMException)?.name === "AbortError") return;
      setError(e instanceof Error ? e.message : "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (s: string) => {
    setPrompt(s);
    setError(null);
  };

  const handleReset = () => {
    // Same pattern as runGeneration: dispatch handles aiPrompt; calling onChange
    // separately would race a stale closure and wipe the patch.
    const result = patchSelectedContent({
      html: "",
      css: "",
      javascript: "",
      aiPrompt: "",
    });
    if (!result.ok) {
      setError("Could not clear the block. Re-select it and try again.");
      return;
    }
    setPrompt("");
    setError(null);
    setAppliedAt(null);
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 via-violet-50 to-pink-50 p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 text-white shadow-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          </span>
          <Label className="text-xs font-semibold text-slate-800">AI code studio</Label>
        </div>

        <p className="mb-2 text-[11px] leading-relaxed text-slate-600">
          Describe the component you want and I&apos;ll write the HTML, CSS, and JS into the fields below.
          {hasExistingCode ? " Use Refine to iterate on what's already here." : ""}
        </p>

        <Textarea
          value={prompt}
          onChange={(e) => {
            const next = e.target.value;
            setPrompt(next);
            if (error) setError(null);
          }}
          onBlur={() => {
            // Persist the prompt to Puck's data only on blur — outside the
            // dispatch sequence, so the parent ObjectField has already
            // re-rendered with the latest content. Calling onChange while a
            // generation is in-flight is unsafe and could race the patch.
            if (loading) return;
            if (prompt === value) return;
            onChange(prompt);
          }}
          placeholder={
            screenshot
              ? "Optional — refine the screenshot. e.g. Make the buttons indigo and round"
              : "e.g. " + PROMPT_SUGGESTIONS[0]
          }
          rows={4}
          disabled={loading}
          className="resize-y border-indigo-200/70 bg-white text-sm placeholder:text-slate-400 focus-visible:ring-indigo-300/60"
        />

        {showUploader || screenshot ? (
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <ImageIcon className="h-3 w-3" aria-hidden />
                Reference screenshot
              </Label>
              {!screenshot ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setShowUploader(false)}
                  className="text-[10px] font-medium text-slate-500 hover:text-slate-700 hover:underline disabled:opacity-50"
                >
                  Hide
                </button>
              ) : null}
            </div>
            <ScreenshotUploader
              value={screenshot}
              onChange={setScreenshot}
              disabled={loading}
            />
          </div>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowUploader(true)}
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-indigo-200/80 bg-white/60 px-3 py-2 text-[11px] font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-white hover:text-indigo-800 disabled:opacity-50"
          >
            <ImageIcon className="h-3 w-3" aria-hidden />
            Add a reference screenshot
          </button>
        )}

        <div className="mt-2 flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={loading || (!screenshot && !prompt.trim())}
            onClick={() => runGeneration("generate")}
            className={cn(
              "flex-1 gap-1.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 text-xs font-semibold text-white shadow-md hover:opacity-95",
              loading && "opacity-80"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                {screenshot ? "Reading…" : "Working…"}
              </>
            ) : (
              <>
                <Wand2 className="h-3.5 w-3.5" aria-hidden />
                {screenshot
                  ? hasExistingCode
                    ? "Recreate from image"
                    : "Build from image"
                  : hasExistingCode
                    ? "Replace"
                    : "Generate"}
              </>
            )}
          </Button>
          {hasExistingCode ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={loading || (!screenshot && !prompt.trim())}
              onClick={() => runGeneration("refine")}
              className="flex-1 gap-1.5 border-indigo-200/80 bg-white/80 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Refine
            </Button>
          ) : null}
        </div>

        {hasExistingCode ? (
          <button
            type="button"
            disabled={loading}
            onClick={handleReset}
            className="mt-2 text-[11px] font-medium text-slate-500 underline-offset-2 hover:text-rose-600 hover:underline disabled:opacity-50"
          >
            Clear all generated code
          </button>
        ) : null}

        {error ? (
          <div className="mt-2 flex items-start gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2 py-1.5 text-[11px] text-rose-700">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            <span className="leading-relaxed">{error}</span>
          </div>
        ) : null}

        {appliedAt ? (
          <div className="mt-2 flex items-start gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-[11px] text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            <span className="leading-relaxed">Code applied. Check the canvas and the HTML / CSS / JS fields below.</span>
          </div>
        ) : null}

        {lastModel ? (
          <p className="mt-1.5 text-[10px] text-slate-500">Last run · {lastModel}</p>
        ) : null}

        <div className="mt-3 border-t border-indigo-200/60 pt-2.5">
          <Label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Quick prompts
          </Label>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {PROMPT_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={loading}
                onClick={() => handleSuggestion(s)}
                className="rounded-full border border-indigo-200/70 bg-white/80 px-2.5 py-1 text-[10px] font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-white disabled:opacity-50"
              >
                {s.length > 38 ? `${s.slice(0, 36)}…` : s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Custom Puck field that adds an "AI code studio" panel to the CustomCodeBlock
 * sidebar. The field's stored value is the most recent prompt; on Generate it
 * also patches the block's html / css / javascript fields atomically via
 * Puck's `replace` action — the same dispatch path Puck's own field onChange
 * handlers use internally.
 */
export function puckCustomCodeAiField(): CustomField<string> {
  return {
    type: "custom",
    label: "AI code studio",
    render: ({ value, onChange }) => (
      <PuckCustomCodeAiFieldRender
        value={typeof value === "string" ? value : ""}
        onChange={onChange}
      />
    ),
  };
}
