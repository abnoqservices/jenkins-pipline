"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import type { Config } from "@measured/puck";
import {
  DEFAULT_LAYOUT_PROPS,
  layoutObjectFields,
  layoutToStyle,
} from "@/lib/puck/layout-fields";
import {
  EyebrowChip,
  containerMaxWidthPx,
  dv,
  headingVar,
  mutedVar,
  puckPresetField,
} from "@/lib/puck/puck-design-system";
import {
  puckBindingTextField,
  puckBindingTextareaField,
  puckRangeSliderField,
  puckStyleHeadingField,
} from "@/lib/puck/puck-binding-custom-fields";
import { puckCustomCodeAiField } from "@/lib/puck/puck-custom-code-ai-field";
import { puckFormPickerField } from "@/lib/puck/puck-form-picker-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Form from "@/components/tempcomponent/form";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

const GTM_ID_RE = /^GTM-[A-Z0-9]+$/i;

/** One script injection per container ID per page load (avoids duplicate tags in React Strict Mode). */
const injectedGtmIds = new Set<string>();

function CustomCodeBlockView({
  content,
  layout,
}: {
  content?: { html?: string; css?: string; javascript?: string; isolation?: string };
  layout?: Record<string, string>;
}) {
  const c = content || {};
  const html = (c.html || "").trim();
  const css = (c.css || "").trim();
  const javascript = (c.javascript || "").trim();
  const isolation = (c.isolation || "inherit").trim();
  const hostRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!javascript || typeof document === "undefined") return;
    const host = hostRef.current;
    if (!host) return;
    const script = document.createElement("script");
    script.textContent = javascript;
    host.appendChild(script);
    return () => {
      script.remove();
    };
  }, [javascript]);

  const hasAny = !!(html || css || javascript);
  if (!hasAny) {
    return (
      <div
        style={layoutToStyle(layout)}
        className="mx-auto max-w-2xl rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center text-sm text-slate-500"
      >
        <div className="mb-2 text-2xl">{"</>"}</div>
        <p className="font-semibold text-slate-700">Custom code</p>
        <p className="mt-1">Paste HTML, CSS, or JavaScript in the sidebar to render it here.</p>
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      style={layoutToStyle(layout)}
      className={cn("lp-custom-code-block", isolation === "isolated" && "lp-custom-code-isolated")}
      data-lp-custom-code
    >
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      {html ? (
        <div className="lp-custom-code-html" dangerouslySetInnerHTML={{ __html: html }} />
      ) : null}
    </div>
  );
}

function GtmBlockView({
  content,
  layout,
}: {
  content?: { gtmContainerId?: string };
  layout?: Record<string, string>;
}) {
  const raw = (content?.gtmContainerId || "").trim().toUpperCase();
  const id = GTM_ID_RE.test(raw) ? raw : "";

  React.useEffect(() => {
    if (!id || typeof window === "undefined" || typeof document === "undefined") return;
    if (injectedGtmIds.has(id)) return;
    injectedGtmIds.add(id);
    const w = window as Window & { dataLayer?: Record<string, unknown>[] };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const firstScript = document.getElementsByTagName("script")[0];
    const gtmScript = document.createElement("script");
    gtmScript.async = true;
    gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
    firstScript?.parentNode?.insertBefore(gtmScript, firstScript);
  }, [id]);

  if (!id) {
    return (
      <div
        style={layoutToStyle(layout)}
        className="mx-auto max-w-md rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 px-4 py-3 text-center text-xs font-medium text-amber-700"
      >
        Set a valid Google Tag Manager container ID (e.g. GTM-XXXXXX)
      </div>
    );
  }

  return (
    <div style={layoutToStyle(layout)} className="lp-gtm-block" aria-hidden>
      <noscript>
        <iframe
          title="Google Tag Manager"
          src={`https://www.googletagmanager.com/ns.html?id=${id}`}
          height={0}
          width={0}
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </div>
  );
}

type FormEmbedContent = {
  // Shared
  designVariant?: string;
  eyebrow?: string;
  heading?: string;
  body?: string;
  formIdentifier?: string;
  formId?: string;
  form_id?: string;
  formTitle?: string;
  // Display mode (orthogonal to designVariant)
  displayMode?: string; // "inline" | "floating-button" | "popup"
  // Floating-button mode
  floatingLabel?: string;
  floatingIcon?: string;
  floatingPosition?: string; // "bottom-right" | "bottom-left" | "bottom-center"
  // Popup auto-trigger mode
  popupTrigger?: string; // "time" | "scroll" | "exit-intent"
  popupTriggerSeconds?: string;
  popupTriggerScrollPct?: string;
  popupFrequency?: string; // "always" | "session" | "day" | "forever"
  popupDismissCta?: string; // optional close-button label
};

function MissingFormPlaceholder({ layout }: { layout?: Record<string, string> }) {
  return (
    <div
      style={layoutToStyle(layout)}
      className="mx-auto max-w-2xl rounded-3xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center text-sm text-slate-500"
    >
      <p className="font-semibold text-slate-700">Embedded form</p>
      <p className="mt-1">Set a form ID or slug in the sidebar to render an admin-created form.</p>
    </div>
  );
}

function FormEmbedInlineCard({
  c,
  isDark,
  formNode,
  layout,
}: {
  c: FormEmbedContent;
  isDark: boolean;
  formNode: React.ReactNode;
  layout?: Record<string, string>;
}) {
  const variant = dv(c, "card");

  if (variant === "split") {
    return (
      <section
        style={layoutToStyle(layout)}
        className={cn(
          "px-4 py-12 md:py-16",
          isDark ? "bg-[#0b1220] text-slate-100" : "bg-white"
        )}
      >
        <div className="mx-auto grid max-w-6xl items-start gap-12 md:grid-cols-2 md:gap-16">
          <div className="space-y-4">
            {c.eyebrow ? <EyebrowChip tone={isDark ? "dark" : "light"}>{c.eyebrow}</EyebrowChip> : null}
            {c.heading ? (
              <h2
                className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.5rem]"
                style={{ color: isDark ? "#fff" : headingVar() }}
              >
                {c.heading}
              </h2>
            ) : null}
            {c.body ? (
              <p className="text-base leading-relaxed md:text-lg" style={{ color: isDark ? "#94a3b8" : mutedVar() }}>
                {c.body}
              </p>
            ) : null}
          </div>
          <div className={cn("rounded-3xl border p-8 shadow-xl", isDark ? "border-white/10 bg-white/[0.04]" : "border-black/[0.06] bg-white")}>
            {formNode}
          </div>
        </div>
      </section>
    );
  }

  if (variant === "minimal") {
    return (
      <section style={layoutToStyle(layout)} className="px-4 py-10">
        <div className="mx-auto max-w-2xl">{formNode}</div>
      </section>
    );
  }

  /* card (default) */
  return (
    <section
      style={layoutToStyle(layout)}
      className={cn("relative overflow-hidden px-4 py-12 md:py-16", isDark ? "bg-[#0b1220]" : "bg-slate-50/60")}
    >
      <div
        className="relative mx-auto"
        style={{ maxWidth: containerMaxWidthPx("normal") }}
      >
        {(c.heading || c.eyebrow) ? (
          <div className="mx-auto mb-10 max-w-xl space-y-3 text-center">
            {c.eyebrow ? <EyebrowChip tone={isDark ? "dark" : "light"}>{c.eyebrow}</EyebrowChip> : null}
            {c.heading ? (
              <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl" style={{ color: isDark ? "#fff" : headingVar() }}>
                {c.heading}
              </h2>
            ) : null}
            {c.body ? (
              <p className="text-base leading-relaxed" style={{ color: isDark ? "#94a3b8" : mutedVar() }}>
                {c.body}
              </p>
            ) : null}
          </div>
        ) : null}
        <div
          className={cn(
            "mx-auto max-w-2xl rounded-3xl border p-8 shadow-xl md:p-10",
            isDark ? "border-white/10 bg-white/[0.04]" : "border-black/[0.06] bg-white"
          )}
        >
          {formNode}
        </div>
      </div>
    </section>
  );
}

function FormDialogShell({
  open,
  onOpenChange,
  c,
  formNode,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  c: FormEmbedContent;
  formNode: React.ReactNode;
}) {
  const heading = (c.heading || "").trim();
  const body = (c.body || "").trim();
  const eyebrow = (c.eyebrow || "").trim();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-xl">
        {(heading || body || eyebrow) ? (
          <DialogHeader>
            {eyebrow ? (
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{eyebrow}</p>
            ) : null}
            {heading ? <DialogTitle>{heading}</DialogTitle> : null}
            {body ? <DialogDescription>{body}</DialogDescription> : null}
          </DialogHeader>
        ) : null}
        <div className="mt-2">{formNode}</div>
      </DialogContent>
    </Dialog>
  );
}

function FloatingFormLauncher({ c, formNode }: { c: FormEmbedContent; formNode: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const position = (c.floatingPosition || "bottom-right").trim();
  const label = (c.floatingLabel || "Get in touch").trim();
  const icon = (c.floatingIcon || "").trim();

  const positionCls =
    position === "bottom-left"
      ? "bottom-5 left-5 sm:bottom-6 sm:left-6"
      : position === "bottom-center"
        ? "bottom-5 left-1/2 -translate-x-1/2 sm:bottom-6"
        : "bottom-5 right-5 sm:bottom-6 sm:right-6";

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label}
        className={cn(
          "fixed z-[9998] inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-2xl ring-1 ring-black/10 transition hover:scale-[1.02] hover:bg-slate-800 active:scale-95",
          positionCls
        )}
      >
        {icon ? (
          <span className="text-base leading-none" aria-hidden>{icon}</span>
        ) : (
          <MessageCircle className="h-4 w-4" aria-hidden />
        )}
        <span>{label}</span>
      </button>
      <FormDialogShell open={open} onOpenChange={setOpen} c={c} formNode={formNode} />
    </>,
    document.body
  );
}

const POPUP_STORAGE_PREFIX = "lp-form-popup:";

function popupSeenKey(c: FormEmbedContent): string {
  const id = (c.formIdentifier || c.formId || c.form_id || "form").trim();
  const trigger = (c.popupTrigger || "time").trim();
  return `${POPUP_STORAGE_PREFIX}${id}:${trigger}`;
}

function readPopupSeen(c: FormEmbedContent): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(popupSeenKey(c));
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writePopupSeen(c: FormEmbedContent): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(popupSeenKey(c), String(Date.now()));
  } catch {
    /* storage may be disabled */
  }
}

function isPopupAllowedNow(c: FormEmbedContent): boolean {
  const frequency = (c.popupFrequency || "session").trim();
  if (frequency === "always") return true;
  if (frequency === "session") {
    if (typeof window === "undefined") return false;
    try {
      return !window.sessionStorage.getItem(popupSeenKey(c));
    } catch {
      return true;
    }
  }
  const last = readPopupSeen(c);
  if (last == null) return true;
  if (frequency === "forever") return false;
  if (frequency === "day") return Date.now() - last > 24 * 60 * 60 * 1000;
  return true;
}

function markPopupSeen(c: FormEmbedContent): void {
  const frequency = (c.popupFrequency || "session").trim();
  if (frequency === "session") {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(popupSeenKey(c), String(Date.now()));
    } catch {
      /* ignore */
    }
    return;
  }
  if (frequency === "day" || frequency === "forever") writePopupSeen(c);
}

function PopupFormLauncher({ c, formNode }: { c: FormEmbedContent; formNode: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const firedRef = React.useRef(false);

  const trigger = (c.popupTrigger || "time").trim();
  const seconds = Math.max(0, parseInt(String(c.popupTriggerSeconds ?? 8), 10) || 8);
  const scrollPct = Math.max(1, Math.min(100, parseInt(String(c.popupTriggerScrollPct ?? 50), 10) || 50));

  const fire = React.useCallback(() => {
    if (firedRef.current) return;
    if (!isPopupAllowedNow(c)) return;
    firedRef.current = true;
    setOpen(true);
    markPopupSeen(c);
  }, [c]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isPopupAllowedNow(c)) return;

    if (trigger === "time") {
      const id = window.setTimeout(fire, seconds * 1000);
      return () => window.clearTimeout(id);
    }

    if (trigger === "scroll") {
      const onScroll = () => {
        const doc = document.documentElement;
        const max = (doc.scrollHeight - window.innerHeight) || 1;
        const pct = (window.scrollY / max) * 100;
        if (pct >= scrollPct) fire();
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    }

    if (trigger === "exit-intent") {
      const onLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) fire();
      };
      document.addEventListener("mouseleave", onLeave);
      return () => document.removeEventListener("mouseleave", onLeave);
    }
  }, [c, trigger, seconds, scrollPct, fire]);

  return <FormDialogShell open={open} onOpenChange={setOpen} c={c} formNode={formNode} />;
}

function FormEmbedEditorPlaceholder({
  c,
  isDark,
  formNode,
  layout,
  mode,
}: {
  c: FormEmbedContent;
  isDark: boolean;
  formNode: React.ReactNode;
  layout?: Record<string, string>;
  mode: "floating-button" | "popup";
}) {
  const trigger = (c.popupTrigger || "time").trim();
  const seconds = parseInt(String(c.popupTriggerSeconds ?? 8), 10) || 8;
  const scrollPct = parseInt(String(c.popupTriggerScrollPct ?? 50), 10) || 50;
  const frequency = (c.popupFrequency || "session").trim();

  const summary =
    mode === "floating-button"
      ? `Floating button (${(c.floatingPosition || "bottom-right").replace("-", " ")}) — opens form on click`
      : trigger === "scroll"
        ? `Auto-popup at ${scrollPct}% scroll (${frequency})`
        : trigger === "exit-intent"
          ? `Auto-popup on exit-intent (${frequency})`
          : `Auto-popup after ${seconds}s (${frequency})`;

  return (
    <div style={layoutToStyle(layout)} className="px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-3 rounded-3xl border-2 border-dashed border-amber-300 bg-amber-50/60 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-200/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-900">
            Editor preview
          </span>
          <span className="text-xs font-medium text-amber-900">{summary}</span>
        </div>
        <p className="text-xs leading-relaxed text-amber-900/80">
          On the live page this form is rendered as a {mode === "floating-button" ? "floating action button" : "popup"} — not inline.
          The card below shows the form fields so you can preview them while editing.
        </p>
        <FormEmbedInlineCard c={c} isDark={isDark} formNode={formNode} />
      </div>
    </div>
  );
}

function FormEmbedBlockView({
  content,
  style,
  layout,
  isEditing,
}: {
  content?: FormEmbedContent;
  style?: Record<string, string>;
  layout?: Record<string, string>;
  isEditing?: boolean;
}) {
  const c: FormEmbedContent = content || {};
  const st = style || {};
  const formIdentifier = (c.formIdentifier || c.formId || c.form_id || "").trim();
  const formTitle = (c.formTitle || "").trim();
  const tone = (st.tone || "light").trim();
  const isDark = tone === "dark";
  const displayMode = (c.displayMode || "inline").trim();

  if (!formIdentifier) {
    return <MissingFormPlaceholder layout={layout} />;
  }

  const formNode = <Form form_id={formIdentifier} form_title={formTitle || undefined} />;

  if (displayMode === "floating-button") {
    if (isEditing) {
      return <FormEmbedEditorPlaceholder c={c} isDark={isDark} formNode={formNode} layout={layout} mode="floating-button" />;
    }
    return <FloatingFormLauncher c={c} formNode={formNode} />;
  }

  if (displayMode === "popup") {
    if (isEditing) {
      return <FormEmbedEditorPlaceholder c={c} isDark={isDark} formNode={formNode} layout={layout} mode="popup" />;
    }
    return <PopupFormLauncher c={c} formNode={formNode} />;
  }

  /* inline (default) */
  return <FormEmbedInlineCard c={c} isDark={isDark} formNode={formNode} layout={layout} />;
}

export const embedBlockConfigs: Config["components"] = {
  CustomCodeBlock: {
    label: "Custom code (HTML / CSS / JS)",
    fields: {
      content: {
        type: "object",
        label: "Content",
        objectFields: {
          aiPrompt: puckCustomCodeAiField(),
          html: { type: "textarea", label: "HTML (injected into the page)" },
          css: { type: "textarea", label: "CSS (injected as a style block)" },
          javascript: { type: "textarea", label: "JavaScript (runs on load after this block mounts)" },
          isolation: puckPresetField("Isolation", [
            { value: "inherit", label: "Inherit", hint: "Site theme applies" },
            { value: "isolated", label: "Isolated", hint: "No site styles" },
          ]),
          scopeClass: { type: "text", label: "Auto-scope class", visible: false },
        },
      },
      layout: {
        type: "object",
        label: "Advanced",
        objectFields: layoutObjectFields,
      },
    },
    defaultProps: {
      content: { aiPrompt: "", html: "", css: "", javascript: "", isolation: "inherit", scopeClass: "" },
      layout: { ...DEFAULT_LAYOUT_PROPS },
    },
    render: ({ content, layout }) => (
      <CustomCodeBlockView content={content} layout={layout} />
    ),
  },
  GtmBlock: {
    label: "Google Tag Manager",
    fields: {
      content: {
        type: "object",
        label: "Content",
        objectFields: {
          gtmContainerId: { type: "text", label: "Container ID (e.g. GTM-XXXXXX)" },
        },
      },
      layout: {
        type: "object",
        label: "Advanced",
        objectFields: layoutObjectFields,
      },
    },
    defaultProps: {
      content: { gtmContainerId: "" },
      layout: { ...DEFAULT_LAYOUT_PROPS },
    },
    render: ({ content, layout }) => <GtmBlockView content={content} layout={layout} />,
  },
  FormEmbedBlock: {
    label: "Form",
    fields: {
      content: {
        type: "object",
        label: "Content",
        objectFields: {
          formIdentifier: puckFormPickerField(
            "Admin form to embed",
            "Pick one of your admin-created forms. Submissions land in /forms responses."
          ),
          displayMode: puckPresetField("Display mode", [
            { value: "inline", label: "Inline", hint: "Embedded in the page" },
            { value: "floating-button", label: "Floating button", hint: "Opens on click" },
            { value: "popup", label: "Auto popup", hint: "Time / scroll trigger" },
          ]),
          designVariant: puckPresetField("Inline layout", [
            { value: "card", label: "Centered card", hint: "Spotlight" },
            { value: "split", label: "Split", hint: "Copy + form" },
            { value: "minimal", label: "Minimal", hint: "Plain" },
          ]),
          eyebrow: puckBindingTextField("Eyebrow"),
          heading: puckBindingTextField("Section / popup heading"),
          body: puckBindingTextareaField("Subtitle / body"),
          formTitle: { type: "text", label: "Title override (optional)" },

          /* Floating-button mode */
          floatingHeader: puckStyleHeadingField("Floating button"),
          floatingLabel: puckBindingTextField("Button label"),
          floatingIcon: { type: "text", label: "Button icon (emoji, optional)" },
          floatingPosition: puckPresetField("Button position", [
            { value: "bottom-right", label: "Bottom right" },
            { value: "bottom-left", label: "Bottom left" },
            { value: "bottom-center", label: "Bottom center" },
          ]),

          /* Auto-popup mode */
          popupHeader: puckStyleHeadingField("Auto popup"),
          popupTrigger: puckPresetField("Trigger", [
            { value: "time", label: "Time on page" },
            { value: "scroll", label: "Scroll percent" },
            { value: "exit-intent", label: "Exit intent (desktop)" },
          ]),
          popupTriggerSeconds: puckRangeSliderField("Time delay (when trigger = Time)", {
            min: 1,
            max: 60,
            step: 1,
            suffix: " s",
          }),
          popupTriggerScrollPct: puckRangeSliderField("Scroll % (when trigger = Scroll)", {
            min: 5,
            max: 100,
            step: 5,
            suffix: " %",
          }),
          popupFrequency: puckPresetField("Show frequency", [
            { value: "session", label: "Once per session", hint: "Recommended" },
            { value: "day", label: "Once per day" },
            { value: "forever", label: "Once ever" },
            { value: "always", label: "Every page load" },
          ]),
        },
      },
      style: {
        type: "object",
        label: "Style",
        objectFields: {
          sectionHeader: puckStyleHeadingField("Section background"),
          tone: puckPresetField("Section theme", [
            { value: "light", label: "Light" },
            { value: "muted", label: "Muted" },
            { value: "dark", label: "Dark" },
          ]),
        },
      },
      layout: {
        type: "object",
        label: "Advanced",
        objectFields: layoutObjectFields,
      },
    },
    defaultProps: {
      content: {
        displayMode: "inline",
        designVariant: "card",
        eyebrow: "Get in touch",
        heading: "Talk to our team",
        body: "Tell us a little about what you're building — we'll send relevant resources within a day.",
        formIdentifier: "",
        formTitle: "",
        floatingLabel: "Get in touch",
        floatingIcon: "",
        floatingPosition: "bottom-right",
        popupTrigger: "time",
        popupTriggerSeconds: "8",
        popupTriggerScrollPct: "50",
        popupFrequency: "session",
      },
      style: { tone: "muted" },
      layout: { ...DEFAULT_LAYOUT_PROPS },
    },
    render: ({ content, style, layout, puck }) => (
      <FormEmbedBlockView
        content={content}
        style={style as Record<string, string>}
        layout={layout}
        isEditing={Boolean((puck as { isEditing?: boolean } | undefined)?.isEditing)}
      />
    ),
  },
};
