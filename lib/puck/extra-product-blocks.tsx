"use client";

import * as React from "react";
import type { Config } from "@measured/puck";
import { ChevronRight, Play } from "lucide-react";
import {
  DEFAULT_LAYOUT_PROPS,
  layoutObjectFields,
  layoutToStyle,
} from "@/lib/puck/layout-fields";
import {
  puckBindingTextField,
  puckBindingTextareaField,
  puckColorPickerField,
  puckRangeSliderField,
  puckStyleHeadingField,
} from "@/lib/puck/puck-binding-custom-fields";
import { puckImageSrcField } from "@/lib/puck/puck-image-src-field";
import {
  ACCENT_FALLBACK,
  ACCENT_FALLBACK_2,
  EyebrowChip,
  SafeImage,
  containerMaxWidthPx,
  dv,
  highlightDynamicTags,
  puckPresetField,
} from "@/lib/puck/puck-design-system";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Shared shell                                                               */
/* -------------------------------------------------------------------------- */

type SectionTone = "light" | "muted" | "dark";

function tonePalette(tone: SectionTone, customBg?: string) {
  if (tone === "dark") {
    return {
      bg: customBg || "#0b1220",
      heading: "#ffffff",
      muted: "#94a3b8",
      cardBg: "rgba(255,255,255,0.04)",
      cardBorder: "rgba(255,255,255,0.08)",
      isDark: true,
    };
  }
  if (tone === "muted") {
    return {
      bg: customBg || "#f6f7fb",
      heading: "var(--lp-heading, #0b1220)",
      muted: "var(--lp-muted, #475569)",
      cardBg: "#ffffff",
      cardBorder: "rgba(15,23,42,0.06)",
      isDark: false,
    };
  }
  return {
    bg: customBg || "#ffffff",
    heading: "var(--lp-heading, #0b1220)",
    muted: "var(--lp-muted, #475569)",
    cardBg: "#ffffff",
    cardBorder: "rgba(15,23,42,0.06)",
    isDark: false,
  };
}

function Section({
  tone = "light",
  bg,
  layout,
  children,
  containerWidth = "wide",
}: {
  tone?: SectionTone;
  bg?: string;
  layout?: Record<string, string>;
  children: React.ReactNode;
  containerWidth?: string;
}) {
  const palette = tonePalette(tone, bg);
  return (
    <section
      className="relative overflow-hidden isolate"
      style={{ ...layoutToStyle(layout), background: palette.bg, color: palette.isDark ? "#cbd5e1" : undefined }}
    >
      <div
        className="relative mx-auto w-full px-4 sm:px-6 md:px-8"
        style={{ maxWidth: containerMaxWidthPx(containerWidth) }}
      >
        {children}
      </div>
    </section>
  );
}

const sharedLayoutField = {
  layout: {
    type: "object" as const,
    label: "Advanced",
    objectFields: layoutObjectFields,
  },
};

const containerPresetField = puckPresetField(
  "Container width",
  [
    { value: "narrow", label: "Narrow", hint: "768px" },
    { value: "normal", label: "Normal", hint: "1100px" },
    { value: "wide", label: "Wide", hint: "1280px" },
    { value: "full", label: "Full", hint: "1536px" },
  ]
);

const toneField = puckPresetField("Section theme", [
  { value: "light", label: "Light" },
  { value: "muted", label: "Muted" },
  { value: "dark", label: "Dark" },
]);

/* -------------------------------------------------------------------------- */
/*  VideoBlock                                                                 */
/*  Variants:                                                                  */
/*   - cinematic  (full-bleed 16:9 with overlay heading + subtitle)             */
/*   - split      (copy left, video right)                                      */
/*   - framed     (centered card, square or 16:9, heading above)                */
/* -------------------------------------------------------------------------- */

type VideoSource = "youtube" | "vimeo" | "mp4" | "embed";

function parseYouTubeId(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/
  );
  return m ? m[1] : null;
}

function parseVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d{4,})/);
  return m ? m[1] : null;
}

function buildVideoEmbedUrl(
  source: VideoSource,
  url: string,
  autoplay: boolean,
  muted: boolean,
  loop: boolean
): string | null {
  const u = (url || "").trim();
  if (!u) return null;
  if (source === "embed") return u;
  if (source === "youtube") {
    const id = parseYouTubeId(u);
    if (!id) return null;
    const params = new URLSearchParams({
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
    });
    if (autoplay) {
      params.set("autoplay", "1");
      params.set("mute", "1"); // browsers require mute for autoplay
    }
    if (muted) params.set("mute", "1");
    if (loop) {
      params.set("loop", "1");
      params.set("playlist", id);
    }
    return `https://www.youtube.com/embed/${id}?${params.toString()}`;
  }
  if (source === "vimeo") {
    const id = parseVimeoId(u);
    if (!id) return null;
    const params = new URLSearchParams({});
    if (autoplay) params.set("autoplay", "1");
    if (muted || autoplay) params.set("muted", "1");
    if (loop) params.set("loop", "1");
    return `https://player.vimeo.com/video/${id}?${params.toString()}`;
  }
  return null;
}

type VideoContent = {
  designVariant?: string;
  eyebrow?: string;
  heading?: string;
  body?: string;
  source?: VideoSource;
  url?: string;
  posterSrc?: string;
  autoplay?: string;
  muted?: string;
  loop?: string;
  controls?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

function VideoFrame({
  content,
  aspectClass,
  rounded = "rounded-2xl",
  className,
}: {
  content: VideoContent;
  aspectClass: string;
  rounded?: string;
  className?: string;
}) {
  const source: VideoSource = (content.source as VideoSource) || "youtube";
  const autoplay = content.autoplay === "yes";
  const muted = content.muted !== "no";
  const loop = content.loop === "yes";
  const controls = content.controls !== "no";

  const embedUrl = buildVideoEmbedUrl(source, content.url || "", autoplay, muted, loop);

  if (source === "mp4") {
    const src = (content.url || "").trim();
    if (!src) return <VideoPlaceholder aspectClass={aspectClass} rounded={rounded} className={className} posterSrc={content.posterSrc} />;
    return (
      <div className={cn("relative w-full overflow-hidden bg-black", aspectClass, rounded, className)}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          src={src}
          poster={content.posterSrc?.trim() || undefined}
          autoPlay={autoplay}
          muted={muted || autoplay}
          loop={loop}
          controls={controls}
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }

  if (!embedUrl) {
    return <VideoPlaceholder aspectClass={aspectClass} rounded={rounded} className={className} posterSrc={content.posterSrc} />;
  }

  return (
    <div className={cn("relative w-full overflow-hidden bg-black", aspectClass, rounded, className)}>
      <iframe
        src={embedUrl}
        title={content.heading || "Video"}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
      />
    </div>
  );
}

function VideoPlaceholder({
  aspectClass,
  rounded,
  className,
  posterSrc,
}: {
  aspectClass: string;
  rounded: string;
  className?: string;
  posterSrc?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-black",
        aspectClass,
        rounded,
        className
      )}
    >
      {posterSrc?.trim() ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={posterSrc.trim()} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      ) : null}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-slate-900 shadow-2xl ring-4 ring-white/20 transition group-hover:scale-105"
          aria-hidden
        >
          <Play className="h-6 w-6 fill-current" />
        </span>
      </div>
      <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
        Video preview
      </span>
    </div>
  );
}

function VideoBlockView({
  content,
  style,
  layout,
}: {
  content: VideoContent;
  style: Record<string, string> | undefined;
  layout: Record<string, string> | undefined;
}) {
  const c = content || {};
  const st = (style || {}) as Record<string, string>;
  const l = (layout || {}) as Record<string, string>;
  const variant = dv(c, "cinematic");
  const tone = (st.tone || "light") as SectionTone;
  const palette = tonePalette(tone, st.sectionBg);

  if (variant === "split") {
    return (
      <Section tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "wide"}>
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
          <div className="space-y-4">
            {c.eyebrow ? (
              <EyebrowChip tone={palette.isDark ? "dark" : "light"}>{highlightDynamicTags(String(c.eyebrow))}</EyebrowChip>
            ) : null}
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl" style={{ color: palette.heading }}>
              {highlightDynamicTags(String(c.heading ?? ""))}
            </h2>
            {c.body ? (
              <p className="whitespace-pre-wrap text-base leading-relaxed md:text-lg" style={{ color: palette.muted }}>
                {highlightDynamicTags(String(c.body))}
              </p>
            ) : null}
            {c.ctaLabel?.trim() ? (
              <a
                href={c.ctaHref || "#"}
                className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02]"
                style={{ background: `linear-gradient(135deg, ${ACCENT_FALLBACK}, ${ACCENT_FALLBACK_2})` }}
              >
                {highlightDynamicTags(c.ctaLabel)}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </a>
            ) : null}
          </div>
          <div className="group relative">
            <VideoFrame content={c} aspectClass="aspect-video" rounded="rounded-3xl" className="shadow-[0_30px_80px_-32px_rgba(15,23,42,0.45)]" />
          </div>
        </div>
      </Section>
    );
  }

  if (variant === "framed") {
    return (
      <Section tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "normal"}>
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          {c.eyebrow ? (
            <div className="flex justify-center">
              <EyebrowChip tone={palette.isDark ? "dark" : "light"}>{highlightDynamicTags(String(c.eyebrow))}</EyebrowChip>
            </div>
          ) : null}
          {c.heading ? (
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl" style={{ color: palette.heading }}>
              {highlightDynamicTags(String(c.heading))}
            </h2>
          ) : null}
          {c.body ? (
            <p className="mx-auto max-w-2xl whitespace-pre-wrap text-base leading-relaxed md:text-lg" style={{ color: palette.muted }}>
              {highlightDynamicTags(String(c.body))}
            </p>
          ) : null}
          <div className="group relative mx-auto rounded-3xl bg-white p-2 shadow-[0_30px_80px_-32px_rgba(15,23,42,0.4)] ring-1 ring-black/[0.06]">
            <VideoFrame content={c} aspectClass="aspect-video" rounded="rounded-2xl" />
          </div>
        </div>
      </Section>
    );
  }

  /* cinematic (default) */
  return (
    <Section tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "wide"}>
      <div className="group relative overflow-hidden rounded-3xl">
        <VideoFrame content={c} aspectClass="aspect-video md:aspect-[21/9]" rounded="rounded-3xl" />
        {(c.eyebrow || c.heading || c.body) ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-end gap-3 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 md:p-10">
            {c.eyebrow ? (
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-900">
                {highlightDynamicTags(String(c.eyebrow))}
              </span>
            ) : null}
            {c.heading ? (
              <h2 className="text-balance text-2xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl">
                {highlightDynamicTags(String(c.heading))}
              </h2>
            ) : null}
            {c.body ? (
              <p className="max-w-2xl text-sm text-white/85 md:text-base">
                {highlightDynamicTags(String(c.body))}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Section>
  );
}

const videoBlockConfig: Config["components"][string] = {
  label: "Video",
  fields: {
    content: {
      type: "object",
      label: "Content",
      objectFields: {
        designVariant: puckPresetField("Layout", [
          { value: "cinematic", label: "Cinematic", hint: "Full-bleed with overlay copy" },
          { value: "split", label: "Split", hint: "Copy left, video right" },
          { value: "framed", label: "Framed", hint: "Centered card with copy above" },
        ]),
        eyebrow: puckBindingTextField("Eyebrow"),
        heading: puckBindingTextField("Heading"),
        body: puckBindingTextareaField("Subtitle / body"),
        source: puckPresetField("Video source", [
          { value: "youtube", label: "YouTube" },
          { value: "vimeo", label: "Vimeo" },
          { value: "mp4", label: "MP4 / direct URL" },
          { value: "embed", label: "Custom embed URL" },
        ]),
        url: puckBindingTextField("Video URL"),
        posterSrc: puckImageSrcField("Poster image (MP4)"),
        autoplay: puckPresetField("Autoplay", [
          { value: "no", label: "Off" },
          { value: "yes", label: "On (muted)" },
        ]),
        muted: puckPresetField("Muted", [
          { value: "yes", label: "Muted" },
          { value: "no", label: "Sound on" },
        ]),
        loop: puckPresetField("Loop", [
          { value: "no", label: "Off" },
          { value: "yes", label: "On" },
        ]),
        controls: puckPresetField("Player controls", [
          { value: "yes", label: "Show" },
          { value: "no", label: "Hide" },
        ]),
        ctaLabel: puckBindingTextField("CTA label (split layout)"),
        ctaHref: puckBindingTextField("CTA URL"),
      },
    },
    style: {
      type: "object",
      label: "Style",
      objectFields: {
        sectionHeader: puckStyleHeadingField("Section background"),
        tone: toneField,
        sectionBg: { type: "text", label: "Custom background" },
        containerWidth: containerPresetField,
      },
    },
    ...sharedLayoutField,
  },
  defaultProps: {
    content: {
      designVariant: "cinematic",
      eyebrow: "See it in action",
      heading: "Watch how {{product.name}} works",
      body: "A 60-second walkthrough of the experience — from unboxing to setup.",
      source: "youtube",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      posterSrc: "{{product.image_url}}",
      autoplay: "no",
      muted: "yes",
      loop: "no",
      controls: "yes",
      ctaLabel: "",
      ctaHref: "#",
    },
    style: { tone: "dark", sectionBg: "", containerWidth: "wide" },
    layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "64px", paddingBottom: "64px" },
  },
  render: ({ content, style, layout }) => (
    <VideoBlockView content={(content || {}) as VideoContent} style={style as Record<string, string>} layout={layout as Record<string, string>} />
  ),
};

/* -------------------------------------------------------------------------- */
/*  SocialIconsBlock                                                           */
/*  Variants:                                                                  */
/*   - icon-row     (round filled icons, centered)                              */
/*   - pills        (label + icon pill buttons)                                 */
/*   - mono         (minimal mono icons in a thin ribbon)                       */
/* -------------------------------------------------------------------------- */

type SocialItem = { label?: string; href?: string; icon?: string };
type SocialContent = {
  designVariant?: string;
  eyebrow?: string;
  heading?: string;
  body?: string;
  socials?: SocialItem[];
};

function SocialIconsBlockView({
  content,
  style,
  layout,
}: {
  content: SocialContent;
  style: Record<string, string> | undefined;
  layout: Record<string, string> | undefined;
}) {
  const c = content || {};
  const st = (style || {}) as Record<string, string>;
  const l = (layout || {}) as Record<string, string>;
  const variant = dv(c, "icon-row");
  const tone = (st.tone || "light") as SectionTone;
  const palette = tonePalette(tone, st.sectionBg);
  const accentA = st.accentA?.trim() || ACCENT_FALLBACK;
  const accentB = st.accentB?.trim() || ACCENT_FALLBACK_2;
  const items = (Array.isArray(c.socials) ? c.socials : []).filter((s) => s && (s.label || s.icon));

  const headEl = (c.eyebrow || c.heading || c.body) ? (
    <div className="mb-6 flex flex-col items-center gap-2 text-center">
      {c.eyebrow ? <EyebrowChip tone={palette.isDark ? "dark" : "light"}>{highlightDynamicTags(String(c.eyebrow))}</EyebrowChip> : null}
      {c.heading ? (
        <h2 className="text-balance text-2xl font-bold tracking-tight md:text-3xl" style={{ color: palette.heading }}>
          {highlightDynamicTags(String(c.heading))}
        </h2>
      ) : null}
      {c.body ? (
        <p className="max-w-xl text-sm md:text-base" style={{ color: palette.muted }}>
          {highlightDynamicTags(String(c.body))}
        </p>
      ) : null}
    </div>
  ) : null;

  if (variant === "pills") {
    return (
      <Section tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "normal"}>
        {headEl}
        <div className="flex flex-wrap items-center justify-center gap-2.5 md:gap-3">
          {items.map((s, i) => (
            <a
              key={i}
              href={s.href || "#"}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 hover:shadow-md",
                palette.isDark ? "border-white/15 bg-white/5 text-white" : "border-black/10 bg-white text-slate-900"
              )}
            >
              <span className="text-base leading-none" aria-hidden>{s.icon || "•"}</span>
              <span>{s.label || ""}</span>
            </a>
          ))}
        </div>
      </Section>
    );
  }

  if (variant === "mono") {
    return (
      <Section tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "wide"}>
        {headEl}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
          {items.map((s, i) => (
            <a
              key={i}
              href={s.href || "#"}
              aria-label={s.label || "Social link"}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-md text-lg transition hover:-translate-y-0.5",
                palette.isDark ? "text-white/80 hover:text-white" : "text-slate-700 hover:text-slate-900"
              )}
            >
              <span aria-hidden>{s.icon || "•"}</span>
            </a>
          ))}
        </div>
      </Section>
    );
  }

  /* icon-row (default) */
  return (
    <Section tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "normal"}>
      {headEl}
      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
        {items.map((s, i) => (
          <a
            key={i}
            href={s.href || "#"}
            aria-label={s.label || "Social link"}
            className="group inline-flex h-12 w-12 items-center justify-center rounded-full text-xl text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl md:h-14 md:w-14"
            style={{ background: `linear-gradient(135deg, ${accentA}, ${accentB})` }}
          >
            <span aria-hidden>{s.icon || "•"}</span>
          </a>
        ))}
      </div>
    </Section>
  );
}

const socialIconsBlockConfig: Config["components"][string] = {
  label: "Social icons",
  fields: {
    content: {
      type: "object",
      label: "Content",
      objectFields: {
        designVariant: puckPresetField("Layout", [
          { value: "icon-row", label: "Icon row", hint: "Round gradient icons" },
          { value: "pills", label: "Pills", hint: "Icon + label pill buttons" },
          { value: "mono", label: "Mono", hint: "Minimal mono icons" },
        ]),
        eyebrow: puckBindingTextField("Eyebrow"),
        heading: puckBindingTextField("Heading"),
        body: puckBindingTextareaField("Subtitle / body"),
        socials: {
          type: "array",
          label: "Social links",
          arrayFields: {
            label: { type: "text", label: "Label" },
            href: { type: "text", label: "URL" },
            icon: { type: "text", label: "Icon (emoji or letter)" },
          },
          defaultItemProps: { label: "Instagram", href: "#", icon: "📷" },
          getItemSummary: (item) => item.label || "Social",
        },
      },
    },
    style: {
      type: "object",
      label: "Style",
      objectFields: {
        sectionHeader: puckStyleHeadingField("Section background"),
        tone: toneField,
        sectionBg: { type: "text", label: "Custom background" },
        accentA: puckColorPickerField("Accent gradient A"),
        accentB: puckColorPickerField("Accent gradient B"),
        containerWidth: containerPresetField,
      },
    },
    ...sharedLayoutField,
  },
  defaultProps: {
    content: {
      designVariant: "icon-row",
      eyebrow: "Stay connected",
      heading: "Follow us",
      body: "Behind the scenes, drops, and customer stories.",
      socials: [
        { label: "Instagram", href: "#", icon: "📷" },
        { label: "TikTok", href: "#", icon: "🎵" },
        { label: "YouTube", href: "#", icon: "▶" },
        { label: "X", href: "#", icon: "𝕏" },
        { label: "LinkedIn", href: "#", icon: "in" },
      ],
    },
    style: { tone: "light", sectionBg: "", accentA: "", accentB: "", containerWidth: "normal" },
    layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "48px", paddingBottom: "48px" },
  },
  render: ({ content, style, layout }) => (
    <SocialIconsBlockView content={(content || {}) as SocialContent} style={style as Record<string, string>} layout={layout as Record<string, string>} />
  ),
};

/* -------------------------------------------------------------------------- */
/*  RelatedModelsBlock                                                         */
/*  Reads {{product.models}} placeholders. Variants:                            */
/*   - grid  (responsive cards grid)                                            */
/*   - rail  (horizontal scroll snap)                                           */
/*   - list  (vertical list rows)                                               */
/* -------------------------------------------------------------------------- */

type ModelItem = { name?: string; description?: string; href?: string; imageSrc?: string; tag?: string };
type ModelsContent = {
  designVariant?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  /** Hard cap rendered. Falls back to all items. */
  count?: string | number;
  models?: ModelItem[];
};

function ModelCard({
  m,
  isDark,
  narrow,
}: {
  m: ModelItem;
  isDark: boolean;
  narrow?: boolean;
}) {
  return (
    <a
      href={m.href || "#"}
      className={cn(
        "group flex flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl",
        narrow ? "min-w-[240px] max-w-[260px] shrink-0 snap-start" : "",
        isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-black/[0.06]"
      )}
    >
      <div
        className="relative aspect-[4/3] overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${ACCENT_FALLBACK}1f, ${ACCENT_FALLBACK_2}1f)` }}
      >
        {m.tag?.trim() ? (
          <span
            className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow"
            style={{ background: `linear-gradient(135deg, ${ACCENT_FALLBACK}, ${ACCENT_FALLBACK_2})` }}
          >
            {m.tag}
          </span>
        ) : null}
        <SafeImage
          src={m.imageSrc}
          alt={m.name || "Model"}
          role="product"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          fallbackClassName="h-full w-full"
          showCaption={false}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-5">
        <div className="font-semibold" style={{ color: isDark ? "#fff" : "var(--lp-heading, #0b1220)" }}>
          {m.name}
        </div>
        {m.description?.trim() ? (
          <p className="line-clamp-3 text-sm" style={{ color: isDark ? "#94a3b8" : "var(--lp-muted, #475569)" }}>
            {m.description}
          </p>
        ) : null}
      </div>
    </a>
  );
}

function RelatedModelsBlockView({
  content,
  style,
  layout,
}: {
  content: ModelsContent;
  style: Record<string, string> | undefined;
  layout: Record<string, string> | undefined;
}) {
  const c = content || {};
  const st = (style || {}) as Record<string, string>;
  const l = (layout || {}) as Record<string, string>;
  const variant = dv(c, "grid");
  const tone = (st.tone || "muted") as SectionTone;
  const palette = tonePalette(tone, st.sectionBg);
  const isDark = palette.isDark;
  const all = (Array.isArray(c.models) ? c.models : []) as ModelItem[];
  const cap = (() => {
    const raw = c.count;
    const n = typeof raw === "number" ? raw : parseInt(String(raw ?? "").trim(), 10);
    if (!Number.isFinite(n) || n <= 0) return all.length;
    return Math.max(1, Math.min(24, n));
  })();
  const models = all.slice(0, cap);

  const headEl = (
    <div className="mb-8 flex flex-col items-start justify-between gap-4 md:mb-10 md:flex-row md:items-end">
      <div className="space-y-3">
        {c.eyebrow ? (
          <EyebrowChip tone={isDark ? "dark" : "light"}>{highlightDynamicTags(String(c.eyebrow))}</EyebrowChip>
        ) : null}
        <h2 className="text-balance text-2xl font-bold tracking-tight md:text-4xl" style={{ color: palette.heading }}>
          {highlightDynamicTags(String(c.title ?? ""))}
        </h2>
        {c.body ? (
          <p className="max-w-xl text-sm md:text-base" style={{ color: palette.muted }}>
            {highlightDynamicTags(String(c.body))}
          </p>
        ) : null}
      </div>
      {c.ctaLabel?.trim() ? (
        <a
          href={c.ctaHref || "#"}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-black/[0.04]",
            isDark ? "border-white/20 text-white hover:bg-white/[0.06]" : "border-black/15 text-slate-900"
          )}
        >
          {highlightDynamicTags(c.ctaLabel)}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </a>
      ) : null}
    </div>
  );

  if (variant === "list") {
    return (
      <Section tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "normal"}>
        {headEl}
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {models.map((m, i) => (
            <a
              key={i}
              href={m.href || "#"}
              className={cn(
                "group flex overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl",
                isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-black/[0.06]"
              )}
            >
              <div
                className="relative w-32 shrink-0 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${ACCENT_FALLBACK}1f, ${ACCENT_FALLBACK_2}1f)` }}
              >
                <SafeImage
                  src={m.imageSrc}
                  alt={m.name || "Model"}
                  role="product"
                  className="h-full min-h-[120px] w-full object-cover transition duration-500 group-hover:scale-105"
                  fallbackClassName="h-full min-h-[120px] w-full"
                  showCaption={false}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-5">
                {m.tag?.trim() ? (
                  <span className="inline-flex w-fit rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-700">
                    {m.tag}
                  </span>
                ) : null}
                <div className="truncate font-semibold" style={{ color: isDark ? "#fff" : palette.heading }}>{m.name}</div>
                {m.description?.trim() ? (
                  <p className="line-clamp-2 text-sm" style={{ color: palette.muted }}>{m.description}</p>
                ) : null}
              </div>
            </a>
          ))}
        </div>
      </Section>
    );
  }

  if (variant === "rail") {
    return (
      <Section tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "wide"}>
        {headEl}
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin]">
          {models.map((m, i) => (
            <ModelCard key={i} m={m} isDark={isDark} narrow />
          ))}
        </div>
      </Section>
    );
  }

  /* grid (default) */
  return (
    <Section tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "wide"}>
      {headEl}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
        {models.map((m, i) => (
          <ModelCard key={i} m={m} isDark={isDark} />
        ))}
      </div>
    </Section>
  );
}

const relatedModelsBlockConfig: Config["components"][string] = {
  label: "Related models",
  fields: {
    content: {
      type: "object",
      label: "Content",
      objectFields: {
        designVariant: puckPresetField("Layout", [
          { value: "grid", label: "Grid" },
          { value: "rail", label: "Rail (horizontal scroll)" },
          { value: "list", label: "List" },
        ]),
        eyebrow: puckBindingTextField("Eyebrow"),
        title: puckBindingTextField("Section title"),
        body: puckBindingTextareaField("Subtitle / body"),
        ctaLabel: puckBindingTextField("CTA label (optional)"),
        ctaHref: puckBindingTextField("CTA URL"),
        count: puckRangeSliderField("Max models shown", { min: 1, max: 24, step: 1 }),
        models: {
          type: "array",
          label: "Models",
          arrayFields: {
            name: puckBindingTextField("Name"),
            description: puckBindingTextareaField("Description"),
            tag: { type: "text", label: "Badge (optional)" },
            href: { type: "text", label: "Link URL" },
            imageSrc: puckImageSrcField("Image URL"),
          },
          defaultItemProps: { name: "Model name", description: "", tag: "", href: "#", imageSrc: "" },
          getItemSummary: (item) => item.name || "Model",
        },
      },
    },
    style: {
      type: "object",
      label: "Style",
      objectFields: {
        sectionHeader: puckStyleHeadingField("Section background"),
        tone: toneField,
        sectionBg: { type: "text", label: "Custom background" },
        containerWidth: containerPresetField,
      },
    },
    ...sharedLayoutField,
  },
  defaultProps: {
    content: {
      designVariant: "grid",
      eyebrow: "Compare the lineup",
      title: "Other models in this family",
      body: "Find the right fit for your space, style, or budget.",
      ctaLabel: "View all models",
      ctaHref: "#",
      count: "6",
      models: [
        { name: "{{product.models.0.name}}", description: "{{product.models.0.description}}", tag: "", href: "#", imageSrc: "{{product.models.0.image_url}}" },
        { name: "{{product.models.1.name}}", description: "{{product.models.1.description}}", tag: "", href: "#", imageSrc: "{{product.models.1.image_url}}" },
        { name: "{{product.models.2.name}}", description: "{{product.models.2.description}}", tag: "", href: "#", imageSrc: "{{product.models.2.image_url}}" },
      ],
    },
    style: { tone: "muted", sectionBg: "", containerWidth: "wide" },
    layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "64px", paddingBottom: "64px" },
  },
  render: ({ content, style, layout }) => (
    <RelatedModelsBlockView content={(content || {}) as ModelsContent} style={style as Record<string, string>} layout={layout as Record<string, string>} />
  ),
};

/* -------------------------------------------------------------------------- */
/*  Exports                                                                    */
/* -------------------------------------------------------------------------- */

export const extraProductBlockConfigs: Config["components"] = {
  VideoBlock: videoBlockConfig,
  SocialIconsBlock: socialIconsBlockConfig,
  RelatedModelsBlock: relatedModelsBlockConfig,
};

export const EXTRA_PRODUCT_BLOCK_TYPES = [
  "VideoBlock",
  "SocialIconsBlock",
  "RelatedModelsBlock",
] as const;
