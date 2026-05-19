"use client";

import * as React from "react";
import type { Config } from "@measured/puck";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Package,
  Plus,
  Sparkles,
} from "lucide-react";
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
import { puckProductGalleryLayoutField } from "@/lib/puck/puck-product-gallery-layout-field";
import {
  ACCENT_FALLBACK,
  ACCENT_FALLBACK_2,
  DotGrid,
  EyebrowChip,
  GradientBorderCard,
  GradientMesh,
  GridLines,
  SafeImage,
  StarRating,
  containerMaxWidthPx,
  dv,
  ghostButtonStyle,
  highlightDynamicTags,
  premiumButtonStyle,
  puckPresetField,
} from "@/lib/puck/puck-design-system";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Shared field presets                                                       */
/* -------------------------------------------------------------------------- */

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

type SectionTone = "light" | "muted" | "dark" | "gradient" | string;

function tonePalette(tone: SectionTone, custom?: { bg?: string }) {
  const t = (tone || "light").toString();
  if (t === "dark") {
    return {
      bg: custom?.bg || "#0b1220",
      heading: "#ffffff",
      muted: "#94a3b8",
      cardBg: "#111a2e",
      cardBorder: "rgba(255,255,255,0.08)",
      isDark: true,
    };
  }
  if (t === "muted") {
    return {
      bg: custom?.bg || "#f6f7fb",
      heading: "var(--lp-heading, #0b1220)",
      muted: "var(--lp-muted, #475569)",
      cardBg: "#ffffff",
      cardBorder: "rgba(15,23,42,0.06)",
      isDark: false,
    };
  }
  return {
    bg: custom?.bg || "#ffffff",
    heading: "var(--lp-heading, #0b1220)",
    muted: "var(--lp-muted, #475569)",
    cardBg: "#ffffff",
    cardBorder: "rgba(15,23,42,0.06)",
    isDark: false,
  };
}

function ProductSection({
  tone = "light",
  bg,
  decoration = "none",
  layout,
  children,
  innerClassName,
  containerWidth = "wide",
}: {
  tone?: SectionTone;
  bg?: string;
  decoration?: "none" | "dots" | "grid" | "spotlight" | "mesh";
  layout?: Record<string, string>;
  children: React.ReactNode;
  innerClassName?: string;
  containerWidth?: string;
}) {
  const palette = tonePalette(tone, { bg });
  return (
    <section
      className="relative overflow-hidden isolate"
      style={{
        ...layoutToStyle(layout),
        background: palette.bg,
        color: palette.isDark ? "#cbd5e1" : undefined,
      }}
    >
      {decoration === "mesh" ? <GradientMesh intensity="soft" /> : null}
      {decoration === "grid" ? <GridLines color={palette.isDark ? "rgba(148,163,184,0.07)" : "rgba(15,23,42,0.06)"} /> : null}
      {decoration === "dots" ? <DotGrid color={palette.isDark ? "rgba(148,163,184,0.18)" : "rgba(15,23,42,0.06)"} /> : null}
      {decoration === "spotlight" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full blur-[140px]"
          style={{ background: `radial-gradient(circle, ${ACCENT_FALLBACK}33 0%, transparent 60%)` }}
        />
      ) : null}
      <div
        className={cn("relative mx-auto px-4 md:px-8", innerClassName)}
        style={{ maxWidth: containerMaxWidthPx(containerWidth) }}
      >
        {children}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Gallery: keep complex view logic, refresh shell                            */
/* -------------------------------------------------------------------------- */

const PRODUCT_GALLERY_DEFAULT_STYLE: Record<string, string> = {
  sectionBg: "#fafafa",
  mainMaxHeightPx: "640",
  mainMaxWidthPx: "960",
  thumbSizePx: "72",
  cardRadiusPx: "24",
};

function galleryReadPx(
  st: Record<string, string | number | undefined>,
  key: string,
  fallback: number,
  min: number,
  max: number
): number {
  const raw = st[key];
  const n = typeof raw === "number" && Number.isFinite(raw) ? raw : parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function isUnresolvedPlaceholderUrl(s: string | undefined): boolean {
  const t = s?.trim() ?? "";
  return t.length > 0 && /\{\{[\s\S]*?\}\}/.test(t);
}

function puckGalleryEditorSampleUrl(role: "main" | "thumb", index: number): string {
  const ids = [883, 655, 429, 225, 180, 64, 318, 496];
  const id = ids[(role === "main" ? 0 : index + 1) % ids.length];
  if (role === "main") {
    return `https://picsum.photos/id/${id}/960/720`;
  }
  return `https://picsum.photos/id/${id}/240/240`;
}

function resolveGalleryDisplaySrc(raw: string, role: "main" | "thumb", index: number): string {
  const t = raw.trim();
  if (!t) return "";
  if (isUnresolvedPlaceholderUrl(t)) return puckGalleryEditorSampleUrl(role, index);
  return t;
}

type CarouselSlideTarget = { target: "main" | number };

function buildProductGalleryCarouselSlides(
  mainSrcRaw: string,
  thumbs: Array<{ src?: string }>,
  showSeparateMainThumb: boolean,
  mainResolved: string
): CarouselSlideTarget[] {
  const thumbMatchesMain = (i: number) => {
    const raw = thumbs[i]?.src?.trim() ?? "";
    if (!mainSrcRaw || !raw || !mainResolved) return false;
    return resolveGalleryDisplaySrc(raw, "thumb", i) === mainResolved;
  };
  const out: CarouselSlideTarget[] = [];
  if (mainSrcRaw) out.push({ target: "main" });
  thumbs.forEach((t, i) => {
    const raw = t.src?.trim() ?? "";
    if (!raw) return;
    if (mainSrcRaw && !showSeparateMainThumb && thumbMatchesMain(i)) return;
    out.push({ target: i });
  });
  return out;
}

type ProductGalleryContent = {
  designVariant?: string;
  badge?: string;
  mainSrc?: string;
  mainAlt?: string;
  thumbs?: Array<{ src?: string }>;
  /** "yes" enables auto-advance for the carousel variant. */
  autoplay?: string;
  /** Interval between slides, in ms (default 4000). */
  autoplayMs?: string | number;
  /** "yes" pauses autoplay on hover (carousel variant). */
  pauseOnHover?: string;
};

function CarouselAutoplayShell({
  autoplay,
  intervalMs,
  slideCount,
  activeIdx,
  onAdvance,
  pauseOnHover,
  children,
}: {
  autoplay: boolean;
  intervalMs: number;
  slideCount: number;
  activeIdx: number;
  onAdvance: () => void;
  pauseOnHover: boolean;
  children: React.ReactNode;
}) {
  const [paused, setPaused] = React.useState(false);
  const advanceRef = React.useRef(onAdvance);
  React.useEffect(() => {
    advanceRef.current = onAdvance;
  }, [onAdvance]);

  React.useEffect(() => {
    if (!autoplay || slideCount < 2 || paused) return;
    const id = window.setInterval(() => advanceRef.current(), intervalMs);
    return () => window.clearInterval(id);
  }, [autoplay, slideCount, paused, intervalMs, activeIdx]);

  if (!autoplay || !pauseOnHover) {
    return <>{children}</>;
  }
  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {children}
    </div>
  );
}

function ProductGalleryBlockView({
  content: c,
  style,
  layout,
}: {
  content: ProductGalleryContent;
  style: Record<string, string | number | undefined> | undefined;
  layout: Record<string, string> | undefined;
}) {
  const stMerged: Record<string, string | number | undefined> = {
    ...PRODUCT_GALLERY_DEFAULT_STYLE,
    ...((style || {}) as Record<string, string | number | undefined>),
  };
  const l = (layout || {}) as Record<string, string>;
  const thumbs = Array.isArray(c.thumbs) ? c.thumbs : [];
  const variant = dv(c, "sidebar-thumbs");

  const mainMaxH = galleryReadPx(stMerged, "mainMaxHeightPx", 640, 200, 1000);
  const mainMaxW = galleryReadPx(stMerged, "mainMaxWidthPx", 960, 280, 1400);
  const thumbPx = galleryReadPx(stMerged, "thumbSizePx", 72, 40, 160);
  const cardRadius = galleryReadPx(stMerged, "cardRadiusPx", 24, 0, 48);
  const sectionBg = String(stMerged.sectionBg ?? PRODUCT_GALLERY_DEFAULT_STYLE.sectionBg ?? "");
  const badge = c.badge?.trim();

  const mainStageFrameStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: mainMaxW,
    height: mainMaxH,
    marginLeft: "auto",
    marginRight: "auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  };

  const mainSrcRaw = c.mainSrc?.trim() ?? "";
  const hasAnyImage = Boolean(mainSrcRaw || thumbs.some((t) => Boolean(t?.src?.trim())));
  if (!hasAnyImage) {
    return null;
  }

  const contentKey = `${mainSrcRaw}|${thumbs.map((t) => String(t.src ?? "").trim()).join("\t")}`;
  const [activeKey, setActiveKey] = React.useState<"main" | number>("main");
  const prevContentKey = React.useRef(contentKey);
  const touchStartXRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (prevContentKey.current !== contentKey) {
      prevContentKey.current = contentKey;
      setActiveKey("main");
    }
  }, [contentKey]);

  React.useEffect(() => {
    if (activeKey === "main") return;
    const raw = thumbs[activeKey]?.src?.trim() ?? "";
    if (!raw || activeKey < 0 || activeKey >= thumbs.length) {
      setActiveKey("main");
    }
  }, [activeKey, contentKey, thumbs]);

  const mainResolved = mainSrcRaw ? resolveGalleryDisplaySrc(mainSrcRaw, "main", 0) : "";
  const mainUsesPlaceholderUrl = isUnresolvedPlaceholderUrl(mainSrcRaw);

  const thumbResolvedEqualsMain = (i: number) => {
    const raw = thumbs[i]?.src?.trim() ?? "";
    if (!mainSrcRaw || !raw || !mainResolved) return false;
    return resolveGalleryDisplaySrc(raw, "thumb", i) === mainResolved;
  };

  const defaultHeroDupThumb =
    mainSrcRaw.trim() === "{{product.image_url}}" &&
    String(thumbs[0]?.src ?? "").trim() === "{{product.image_1}}";

  const showSeparateMainThumb = Boolean(
    mainSrcRaw &&
      !thumbs.some((_, i) => thumbResolvedEqualsMain(i)) &&
      !defaultHeroDupThumb
  );

  React.useEffect(() => {
    if (variant !== "carousel") return;
    const slides = buildProductGalleryCarouselSlides(mainSrcRaw, thumbs, showSeparateMainThumb, mainResolved);
    if (!slides.length) return;
    const ok = slides.some((d) => (d.target === "main" ? activeKey === "main" : activeKey === d.target));
    if (!ok) {
      const t = slides[0].target;
      setActiveKey(t === "main" ? "main" : t);
    }
  }, [variant, contentKey, activeKey, mainSrcRaw, thumbs, showSeparateMainThumb, mainResolved]);

  const mainView = React.useMemo(() => {
    if (activeKey === "main") {
      return {
        src: mainResolved,
        alt: mainUsesPlaceholderUrl ? "Sample preview image" : c.mainAlt || "",
        empty: !mainSrcRaw,
      };
    }
    const tr = thumbs[activeKey]?.src?.trim() ?? "";
    if (!tr) {
      return {
        src: mainResolved,
        alt: mainUsesPlaceholderUrl ? "Sample preview image" : c.mainAlt || "",
        empty: !mainSrcRaw,
      };
    }
    const ph = isUnresolvedPlaceholderUrl(tr);
    return {
      src: resolveGalleryDisplaySrc(tr, "thumb", activeKey),
      alt: ph ? "Sample preview image" : "",
      empty: false,
    };
  }, [activeKey, mainResolved, mainSrcRaw, mainUsesPlaceholderUrl, c.mainAlt, thumbs]);

  const [mainImgErrored, setMainImgErrored] = React.useState(false);
  React.useEffect(() => {
    setMainImgErrored(false);
  }, [mainView.src]);

  const mainImg = mainView.empty ? null : mainImgErrored ? (
    <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 via-violet-50 to-pink-50">
      <span className="flex flex-col items-center gap-2 text-slate-500">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/[0.04]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5 text-indigo-500" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="9" cy="10" r="1.6" fill="currentColor" />
            <path d="M21 17l-5.5-6.5L9 18" />
          </svg>
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">Sample image</span>
      </span>
    </div>
  ) : (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={mainView.src}
      alt={mainView.alt}
      className="rounded-2xl"
      onError={() => setMainImgErrored(true)}
      style={{
        maxWidth: "100%",
        maxHeight: "100%",
        width: "auto",
        height: "auto",
        objectFit: "contain",
        display: "block",
      }}
    />
  );

  const badgeChip = badge ? (
    <div className="absolute left-5 top-5 z-10">
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${ACCENT_FALLBACK}, ${ACCENT_FALLBACK_2})` }}
      >
        <Sparkles className="h-3 w-3" aria-hidden />
        {badge}
      </span>
    </div>
  ) : null;

  const mainStage = (extraShellClass?: string) => (
    <div
      className={cn("relative min-h-0 w-full overflow-hidden", extraShellClass)}
      style={{ ...mainStageFrameStyle, borderRadius: cardRadius, background: "linear-gradient(135deg, #ffffff, #f5f5f4)" }}
    >
      <DotGrid color="rgba(15,23,42,0.04)" />
      {badgeChip}
      <div className="relative">{mainImg}</div>
    </div>
  );

  const thumbSelected = (index: number) =>
    activeKey === index || (activeKey === "main" && thumbResolvedEqualsMain(index));

  const thumbOpacity = (index: number, hasSrc: boolean) => {
    if (!hasSrc) return 1;
    if (activeKey === "main") {
      return thumbResolvedEqualsMain(index) ? 1 : 0.7;
    }
    return thumbSelected(index) ? 1 : 0.6;
  };

  const hasThumbRail = Boolean(
    (mainSrcRaw && showSeparateMainThumb) || thumbs.some((t) => Boolean(t.src?.trim()))
  );

  const thumbButton = (props: {
    selected: boolean;
    onClick: () => void;
    src: string;
    label: string;
    opacity: number;
  }) => (
    <button
      type="button"
      aria-label={props.label}
      aria-pressed={props.selected}
      onClick={props.onClick}
      className={cn(
        "group flex shrink-0 origin-center items-center justify-center overflow-hidden rounded-2xl border bg-white p-0 outline-none transition-[transform,opacity,box-shadow] duration-200 ease-out",
        "hover:z-10 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-indigo-300",
        props.selected ? "border-indigo-400 shadow-[0_4px_18px_-4px_rgba(99,102,241,0.45)]" : "border-black/[0.08]"
      )}
      style={{ width: thumbPx, height: thumbPx, opacity: props.opacity }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={props.src} alt="" className="h-full w-full object-cover" />
    </button>
  );

  const mainThumbControl = mainSrcRaw && showSeparateMainThumb
    ? thumbButton({
        selected: activeKey === "main",
        onClick: () => setActiveKey("main"),
        src: resolveGalleryDisplaySrc(mainSrcRaw, "main", 0),
        label: "Show main image",
        opacity: activeKey === "main" ? 1 : 0.6,
      })
    : null;

  const thumbCells = thumbs.map((t, i) => {
    const raw = t.src?.trim() ?? "";
    if (!raw) return null;
    const displaySrc = resolveGalleryDisplaySrc(raw, "thumb", i);
    return thumbButton({
      selected: thumbSelected(i),
      onClick: () => setActiveKey(i),
      src: displaySrc,
      label: `Show image ${i + 1}`,
      opacity: thumbOpacity(i, true),
    });
  });

  const thumbRow =
    hasThumbRail ? (
      <div className="flex w-full justify-center overflow-x-auto pb-1 [scrollbar-width:thin]">
        <div className="inline-flex max-w-full flex-nowrap items-center justify-center gap-2 px-0.5 pt-0.5">
          {mainThumbControl}
          {thumbCells}
        </div>
      </div>
    ) : null;

  if (variant === "stacked") {
    return (
      <ProductSection bg={sectionBg || "#fafafa"} layout={l} containerWidth="normal">
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-4 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)]">
            {mainStage()}
          </div>
          {thumbRow ? <div className="mt-5">{thumbRow}</div> : null}
        </div>
      </ProductSection>
    );
  }

  if (variant === "carousel") {
    const carouselSlides = buildProductGalleryCarouselSlides(
      mainSrcRaw,
      thumbs,
      showSeparateMainThumb,
      mainResolved
    );

    const carouselActiveIdx = carouselSlides.findIndex((d) =>
      d.target === "main" ? activeKey === "main" : activeKey === d.target
    );
    const safeIdx = carouselActiveIdx >= 0 ? carouselActiveIdx : 0;
    const slideCount = carouselSlides.length;

    const goCarouselDelta = (delta: number) => {
      if (slideCount < 1) return;
      const next = (safeIdx + delta + slideCount) % slideCount;
      const t = carouselSlides[next]?.target;
      if (t === undefined) return;
      setActiveKey(t === "main" ? "main" : t);
    };

    return (
      <CarouselAutoplayShell
        autoplay={c.autoplay === "yes"}
        intervalMs={Math.max(1500, parseInt(String(c.autoplayMs ?? 4000), 10) || 4000)}
        slideCount={slideCount}
        activeIdx={safeIdx}
        onAdvance={() => goCarouselDelta(1)}
        pauseOnHover={c.pauseOnHover !== "no"}
      >
      <ProductSection bg={sectionBg || "#fafafa"} layout={l} containerWidth="normal">
        <div className="mx-auto max-w-3xl text-center">
          <div
            className="relative mx-auto overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_30px_80px_-32px_rgba(15,23,42,0.25)]"
            onTouchStart={(e) => {
              touchStartXRef.current = e.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              const start = touchStartXRef.current;
              touchStartXRef.current = null;
              if (start == null || slideCount < 2) return;
              const end = e.changedTouches[0]?.clientX;
              if (end == null) return;
              const dx = end - start;
              if (dx > 56) goCarouselDelta(-1);
              else if (dx < -56) goCarouselDelta(1);
            }}
          >
            <div className="relative z-0">{mainStage()}</div>
            {slideCount > 1 ? (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={() => goCarouselDelta(-1)}
                  className="pointer-events-auto absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={() => goCarouselDelta(1)}
                  className="pointer-events-auto absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-white/90 text-slate-800 shadow-lg backdrop-blur transition hover:bg-white"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </>
            ) : null}
            {slideCount > 0 ? (
              <div className="pointer-events-auto absolute bottom-5 left-0 right-0 z-20 flex justify-center gap-1.5">
                {carouselSlides.map((d, di) => {
                  const on = di === safeIdx;
                  return (
                    <button
                      key={`${d.target === "main" ? "m" : "t"}-${di}`}
                      type="button"
                      aria-label={d.target === "main" ? "Main image" : `Image ${Number(d.target) + 1}`}
                      aria-pressed={on}
                      onClick={() => setActiveKey(d.target === "main" ? "main" : d.target)}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        on ? "w-8 bg-slate-900" : "w-2 bg-slate-900/30 hover:bg-slate-900/60"
                      )}
                    />
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </ProductSection>
      </CarouselAutoplayShell>
    );
  }

  /* sidebar-thumbs (default) */
  const thumbRailWidth = Math.max(thumbPx + 28, 100);
  return (
    <ProductSection bg={sectionBg || "#fafafa"} layout={l} containerWidth="wide">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-4 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)] md:p-5">
          {mainStage()}
        </div>
        {hasThumbRail ? (
          <div
            className="flex w-full flex-row gap-2 overflow-x-auto pb-1 px-0.5 pt-0.5 [scrollbar-width:thin] md:w-[var(--puck-gallery-thumb-rail)] md:shrink-0 md:flex-col md:overflow-y-auto md:pb-0"
            style={{ ["--puck-gallery-thumb-rail" as string]: `${thumbRailWidth}px` } as React.CSSProperties}
          >
            {mainThumbControl}
            {thumbCells}
          </div>
        ) : null}
      </div>
    </ProductSection>
  );
}

/* -------------------------------------------------------------------------- */
/*  Block configs                                                              */
/* -------------------------------------------------------------------------- */

export const productDetailBlockConfigs: Config["components"] = {
  ProductHeaderBlock: {
    label: "Product header",
    fields: {
      content: {
        type: "object",
        label: "Content",
        objectFields: {
          designVariant: { type: "text", label: "Layout preset", visible: false },
          eyebrow: puckBindingTextField("Category / breadcrumb"),
          title: puckBindingTextField("Product title"),
          subtitle: puckBindingTextareaField("Subtitle / short description"),
          sku: puckBindingTextField("SKU"),
          rating: puckBindingTextField("Rating line (e.g. 4.9 · 1,200 reviews)"),
          ratingValue: { type: "number", label: "Rating value (0–5)" },
          price: puckBindingTextField("Price display"),
          compareAtPrice: puckBindingTextField("Compare-at price (optional)"),
          discountLabel: puckBindingTextField("Discount label (e.g. -25%)"),
          badge: puckBindingTextField("Badge (e.g. Bestseller)"),
          stockHint: puckBindingTextField("Stock / shipping hint"),
          trustItems: {
            type: "array",
            label: "Trust badges",
            arrayFields: {
              icon: { type: "text", label: "Icon (emoji)" },
              text: { type: "text", label: "Text" },
            },
            defaultItemProps: { icon: "🚚", text: "Free shipping over $50" },
            getItemSummary: (item) => item.text || "Trust",
          },
          ctaLabel: puckBindingTextField("Primary button"),
          ctaHref: puckBindingTextField("Primary URL"),
          secondaryCtaLabel: puckBindingTextField("Secondary button"),
          secondaryCtaHref: puckBindingTextField("Secondary URL"),
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
          sectionBg: { type: "text", label: "Custom background" },
          accentA: puckColorPickerField("Accent gradient A"),
          accentB: puckColorPickerField("Accent gradient B"),
          containerHeader: puckStyleHeadingField("Layout"),
          containerWidth: containerPresetField,
        },
      },
      ...sharedLayoutField,
    },
    defaultProps: {
      content: {
        designVariant: "hero",
        eyebrow: "Outdoor · Best seller",
        title: "{{product.name}}",
        subtitle: "{{product.description}}",
        sku: "SKU · {{product.sku}}",
        rating: "4.9 · 1,247 reviews",
        ratingValue: 5,
        price: "{{product.price}}",
        compareAtPrice: "$159",
        discountLabel: "−25%",
        badge: "Best seller",
        stockHint: "Ships in 1-2 business days · 30-day returns",
        trustItems: [
          { icon: "🚚", text: "Free shipping" },
          { icon: "↩️", text: "30-day returns" },
          { icon: "🔒", text: "Secure checkout" },
        ],
        ctaLabel: "Add to cart",
        ctaHref: "#",
        secondaryCtaLabel: "Save",
        secondaryCtaHref: "#",
      },
      style: {
        tone: "light",
        sectionBg: "",
        accentA: "",
        accentB: "",
        containerWidth: "wide",
      },
      layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "32px", paddingBottom: "32px" },
    },
    render: ({ content, style, layout }) => {
      const c = (content || {}) as Record<string, unknown>;
      const st = (style || {}) as Record<string, string>;
      const l = (layout || {}) as Record<string, string>;
      const variant = dv(c as { designVariant?: string }, "hero");
      const tone = (st.tone || "light") as SectionTone;
      const palette = tonePalette(tone, { bg: st.sectionBg });
      const isDark = palette.isDark;
      const accentA = st.accentA?.trim() || ACCENT_FALLBACK;
      const accentB = st.accentB?.trim() || ACCENT_FALLBACK_2;
      const trustItems = (Array.isArray(c.trustItems) ? c.trustItems : []) as Array<{
        icon?: string;
        text?: string;
      }>;
      const ratingValue = Number(c.ratingValue) || 0;

      const priceRow = (
        <div className="flex flex-wrap items-baseline gap-3">
          <span
            className="text-4xl font-bold tracking-tight"
            style={{ color: palette.heading }}
          >
            {highlightDynamicTags(String(c.price ?? ""))}
          </span>
          {String(c.compareAtPrice ?? "").trim() ? (
            <span
              className="text-xl line-through"
              style={{ color: isDark ? "#64748b" : "#94a3b8" }}
            >
              {highlightDynamicTags(String(c.compareAtPrice))}
            </span>
          ) : null}
          {String(c.discountLabel ?? "").trim() ? (
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white"
              style={{ background: `linear-gradient(135deg, ${accentA}, ${accentB})` }}
            >
              {c.discountLabel as string}
            </span>
          ) : null}
        </div>
      );

      const ratingChip = (String(c.rating ?? "").trim() || ratingValue > 0) ? (
        <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/80 px-3 py-1.5 text-xs font-semibold backdrop-blur" style={{ color: palette.heading }}>
          <StarRating value={ratingValue} size={14} />
          <span>{highlightDynamicTags(String(c.rating ?? ""))}</span>
        </div>
      ) : null;

      const badgeChip = String(c.badge ?? "").trim() ? (
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${accentA}, ${accentB})` }}
        >
          <Sparkles className="h-3 w-3" aria-hidden />
          {c.badge as string}
        </span>
      ) : null;

      const trustRow = trustItems.length ? (
        <div className="flex flex-wrap gap-2 pt-2">
          {trustItems.map((t, i) => (
            <span
              key={i}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium",
                isDark ? "border-white/10 bg-white/[0.04] text-slate-200" : "border-black/[0.06] bg-white text-slate-700"
              )}
            >
              <span className="text-base">{t.icon}</span>
              {t.text}
            </span>
          ))}
        </div>
      ) : null;

      const primaryBtn = String(c.ctaLabel ?? "").trim() ? (
        <a
          href={String(c.ctaHref ?? "#")}
          className="group inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-sm font-semibold shadow-md transition hover:scale-[1.02]"
          style={premiumButtonStyle({ shadow: "glow", radiusPx: 16 })}
        >
          {highlightDynamicTags(String(c.ctaLabel))}
          <Plus className="h-4 w-4 transition group-hover:rotate-90" aria-hidden />
        </a>
      ) : null;

      const secondaryBtn = String(c.secondaryCtaLabel ?? "").trim() ? (
        <a
          href={String(c.secondaryCtaHref ?? "#")}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition hover:scale-105"
          style={ghostButtonStyle({
            borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.16)",
            color: isDark ? "#fff" : undefined,
            radiusPx: 16,
          })}
          aria-label={String(c.secondaryCtaLabel)}
        >
          <Heart className="h-5 w-5" aria-hidden />
        </a>
      ) : null;

      if (variant === "compact-bar") {
        return (
          <ProductSection tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "wide"}>
            <div
              className="flex flex-col gap-4 rounded-3xl border bg-white/70 px-6 py-5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between"
              style={{ borderColor: palette.cardBorder, background: isDark ? "rgba(17,26,46,0.6)" : "rgba(255,255,255,0.78)" }}
            >
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight md:text-2xl" style={{ color: palette.heading }}>
                    {highlightDynamicTags(String(c.title ?? ""))}
                  </h1>
                  {badgeChip}
                </div>
                <p className="text-xs" style={{ color: palette.muted }}>{highlightDynamicTags(String(c.sku ?? ""))}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {priceRow}
                {primaryBtn}
              </div>
            </div>
          </ProductSection>
        );
      }

      if (variant === "card") {
        return (
          <ProductSection tone={tone} bg={st.sectionBg} layout={l} containerWidth="normal">
            <GradientBorderCard radius={28} glowColor={accentA}>
              <div className="space-y-6 p-8 md:p-10">
                <div className="flex flex-wrap items-center gap-2">
                  {badgeChip}
                  {ratingChip}
                </div>
                <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl" style={{ color: palette.heading }}>
                  {highlightDynamicTags(String(c.title ?? ""))}
                </h1>
                {String(c.subtitle ?? "").trim() ? (
                  <p className="text-base leading-relaxed md:text-lg" style={{ color: palette.muted }}>
                    {highlightDynamicTags(String(c.subtitle))}
                  </p>
                ) : null}
                <div className="flex flex-wrap items-end gap-4">{priceRow}</div>
                <p className="text-sm" style={{ color: palette.muted }}>{highlightDynamicTags(String(c.stockHint ?? ""))}</p>
                <div className="flex flex-wrap gap-3 pt-2">
                  {primaryBtn}
                  {secondaryBtn}
                </div>
                {trustRow}
              </div>
            </GradientBorderCard>
          </ProductSection>
        );
      }

      /* hero (default) */
      return (
        <ProductSection tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "wide"}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-2">
              {String(c.eyebrow ?? "").trim() ? (
                <EyebrowChip tone={isDark ? "dark" : "light"}>{highlightDynamicTags(String(c.eyebrow))}</EyebrowChip>
              ) : null}
              {badgeChip}
              {ratingChip}
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight md:text-5xl lg:text-[3.25rem] lg:leading-[1.05]" style={{ color: palette.heading }}>
              {highlightDynamicTags(String(c.title ?? ""))}
            </h1>
            {String(c.subtitle ?? "").trim() ? (
              <p className="max-w-2xl text-base leading-relaxed md:text-lg" style={{ color: palette.muted }}>
                {highlightDynamicTags(String(c.subtitle))}
              </p>
            ) : null}
            <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-end sm:gap-8">
              {priceRow}
              <div className="flex flex-wrap gap-3">
                {primaryBtn}
                {secondaryBtn}
              </div>
            </div>
            {String(c.stockHint ?? "").trim() ? (
              <p className="text-sm" style={{ color: palette.muted }}>{highlightDynamicTags(String(c.stockHint))}</p>
            ) : null}
            {trustRow}
          </div>
        </ProductSection>
      );
    },
  },

  ProductGalleryBlock: {
    label: "Product gallery",
    fields: {
      content: {
        type: "object",
        label: "Content",
        objectFields: {
          designVariant: puckProductGalleryLayoutField(),
          badge: puckBindingTextField("Image badge (e.g. New)"),
          mainSrc: puckImageSrcField("Main image URL"),
          mainAlt: puckBindingTextField("Main image alt"),
          thumbs: {
            type: "array",
            label: "Thumbnails",
            arrayFields: { src: puckImageSrcField("Image URL") },
            defaultItemProps: { src: "" },
            getItemSummary: (_item, i) => `Thumb ${(i ?? 0) + 1}`,
          },
          autoplay: puckPresetField("Auto-advance (carousel only)", [
            { value: "no", label: "Off" },
            { value: "yes", label: "On" },
          ]),
          autoplayMs: puckRangeSliderField("Auto-advance interval", {
            min: 1500,
            max: 10000,
            step: 250,
            suffix: " ms",
          }),
          pauseOnHover: puckPresetField("Pause on hover", [
            { value: "yes", label: "Yes" },
            { value: "no", label: "No" },
          ]),
        },
      },
      style: {
        type: "object",
        label: "Style",
        objectFields: {
          sectionHeader: puckStyleHeadingField("Section background"),
          sectionBg: { type: "text", label: "Background" },
          sizingHeader: puckStyleHeadingField("Image sizing"),
          mainMaxHeightPx: puckRangeSliderField("Main image area height", { min: 200, max: 1000, step: 10, suffix: " px" }),
          mainMaxWidthPx: puckRangeSliderField("Main image area max width", { min: 280, max: 1400, step: 10, suffix: " px" }),
          thumbSizePx: puckRangeSliderField("Thumbnail width & height", { min: 40, max: 160, step: 4, suffix: " px" }),
          cardRadiusPx: puckRangeSliderField("Image card radius", { min: 0, max: 48, step: 2, suffix: " px" }),
        },
      },
      ...sharedLayoutField,
    },
    defaultProps: {
      content: {
        designVariant: "sidebar-thumbs",
        badge: "",
        mainSrc: "{{product.image_url}}",
        mainAlt: "{{product.name}}",
        thumbs: [
          { src: "{{product.image_1}}" },
          { src: "{{product.image_2}}" },
          { src: "{{product.image_3}}" },
        ],
        autoplay: "no",
        autoplayMs: "4000",
        pauseOnHover: "yes",
      },
      style: { ...PRODUCT_GALLERY_DEFAULT_STYLE },
      layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "16px", paddingBottom: "24px" },
    },
    render: ({ content, style, layout }) => (
      <ProductGalleryBlockView content={(content || {}) as ProductGalleryContent} style={style} layout={layout} />
    ),
  },

  ProductSpecsBlock: {
    label: "Product specs",
    fields: {
      content: {
        type: "object",
        label: "Content",
        objectFields: {
          designVariant: { type: "text", label: "Layout preset", visible: false },
          eyebrow: puckBindingTextField("Eyebrow"),
          title: puckBindingTextField("Section title"),
          body: puckBindingTextareaField("Body"),
          specs: {
            type: "array",
            label: "Specifications",
            arrayFields: {
              icon: { type: "text", label: "Icon (emoji)" },
              label: { type: "text", label: "Label" },
              value: { type: "textarea", label: "Value" },
            },
            defaultItemProps: { icon: "📐", label: "Dimensions", value: "—" },
            getItemSummary: (item) => item.label || "Spec",
          },
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
          sectionBg: { type: "text", label: "Custom background" },
          containerWidth: containerPresetField,
        },
      },
      ...sharedLayoutField,
    },
    defaultProps: {
      content: {
        designVariant: "grid",
        eyebrow: "Specifications",
        title: "Engineered for the long haul.",
        body: "Materials, dimensions, and the small details we obsess over.",
        specs: [
          { icon: "⚖️", label: "Weight", value: "1.2 kg" },
          { icon: "📐", label: "Dimensions", value: "32 × 18 × 6 cm" },
          { icon: "🪵", label: "Materials", value: "Aluminum, recycled plastic" },
          { icon: "🔋", label: "Battery", value: "Up to 24 hours" },
          { icon: "🌧️", label: "Resistance", value: "IPX5 splash-proof" },
          { icon: "🛡️", label: "Warranty", value: "2 years limited" },
        ],
      },
      style: { tone: "muted", sectionBg: "", containerWidth: "wide" },
      layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "64px", paddingBottom: "64px" },
    },
    render: ({ content, style, layout }) => {
      const c = (content || {}) as Record<string, unknown>;
      const st = (style || {}) as Record<string, string>;
      const l = (layout || {}) as Record<string, string>;
      const specs = (Array.isArray(c.specs) ? c.specs : []) as Array<{ icon?: string; label?: string; value?: string }>;
      const variant = dv(c as { designVariant?: string }, "grid");
      const tone = (st.tone || "muted") as SectionTone;
      const palette = tonePalette(tone, { bg: st.sectionBg });
      const isDark = palette.isDark;

      const headEl = (
        <div className={cn("space-y-3", variant === "inline" ? "" : "max-w-2xl")}>
          {c.eyebrow ? <EyebrowChip tone={isDark ? "dark" : "light"}>{highlightDynamicTags(String(c.eyebrow))}</EyebrowChip> : null}
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl" style={{ color: palette.heading }}>
            {highlightDynamicTags(String(c.title ?? ""))}
          </h2>
          {c.body ? (
            <p className="text-base leading-relaxed" style={{ color: palette.muted }}>
              {highlightDynamicTags(String(c.body))}
            </p>
          ) : null}
        </div>
      );

      if (variant === "inline") {
        return (
          <ProductSection tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "normal"}>
            {headEl}
            <dl className={cn("mt-8 divide-y rounded-3xl border", isDark ? "divide-white/[0.08] border-white/10" : "divide-black/[0.06] border-black/[0.06] bg-white shadow-sm")}>
              {specs.map((row, i) => (
                <div key={i} className="grid gap-2 p-5 sm:grid-cols-[200px_1fr] sm:items-center">
                  <dt className="flex items-center gap-2 text-sm font-semibold" style={{ color: palette.heading }}>
                    {row.icon ? <span className="text-base">{row.icon}</span> : null}
                    {highlightDynamicTags(row.label)}
                  </dt>
                  <dd className="text-sm" style={{ color: palette.muted }}>
                    {highlightDynamicTags(row.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </ProductSection>
        );
      }

      if (variant === "table") {
        return (
          <ProductSection tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "normal"}>
            {headEl}
            <div
              className={cn(
                "mt-8 overflow-hidden rounded-3xl border",
                isDark ? "border-white/10 bg-white/[0.03]" : "border-black/[0.06] bg-white shadow-sm"
              )}
            >
              <table className="w-full text-left text-sm">
                <tbody>
                  {specs.map((row, i) => (
                    <tr
                      key={i}
                      className={cn(
                        "transition",
                        i % 2 === 0 ? (isDark ? "bg-white/[0.02]" : "bg-slate-50/60") : "",
                        isDark ? "hover:bg-white/[0.05]" : "hover:bg-indigo-50/40"
                      )}
                    >
                      <th className="w-1/3 px-6 py-4 font-semibold" style={{ color: palette.heading }}>
                        <span className="inline-flex items-center gap-2">
                          {row.icon ? <span className="text-base">{row.icon}</span> : null}
                          {highlightDynamicTags(row.label)}
                        </span>
                      </th>
                      <td className="px-6 py-4" style={{ color: palette.muted }}>
                        {highlightDynamicTags(row.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ProductSection>
        );
      }

      /* grid (default) */
      return (
        <ProductSection tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "wide"}>
          {headEl}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {specs.map((row, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-4 rounded-2xl border p-5 transition hover:-translate-y-1",
                  isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-black/[0.06] bg-white shadow-sm"
                )}
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${ACCENT_FALLBACK}1f, ${ACCENT_FALLBACK_2}1f)`,
                  }}
                >
                  {row.icon || "·"}
                </span>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: palette.muted }}>
                    {highlightDynamicTags(row.label)}
                  </div>
                  <div className="mt-1 text-sm font-semibold" style={{ color: palette.heading }}>
                    {highlightDynamicTags(row.value)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ProductSection>
      );
    },
  },

  ProductHighlightsBlock: {
    label: "Product highlights",
    fields: {
      content: {
        type: "object",
        label: "Content",
        objectFields: {
          designVariant: { type: "text", label: "Layout preset", visible: false },
          eyebrow: puckBindingTextField("Eyebrow"),
          title: puckBindingTextField("Section title"),
          body: puckBindingTextareaField("Body"),
          items: {
            type: "array",
            label: "Highlights",
            arrayFields: {
              icon: { type: "text", label: "Icon (emoji)" },
              title: { type: "text", label: "Title" },
              body: { type: "textarea", label: "Description" },
            },
            defaultItemProps: { icon: "✓", title: "Quality", body: "Built to last." },
            getItemSummary: (item) => item.title || "Item",
          },
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
          sectionBg: { type: "text", label: "Custom background" },
          containerWidth: containerPresetField,
        },
      },
      ...sharedLayoutField,
    },
    defaultProps: {
      content: {
        designVariant: "icon-row",
        eyebrow: "Why customers love it",
        title: "Designed to make every day a little better.",
        body: "Real benefits, validated by 12,000+ customer reviews.",
        items: [
          { icon: "🛡️", title: "2-year warranty", body: "Hassle-free replacement and repair." },
          { icon: "🌿", title: "Sustainable", body: "Made with 80%+ recycled materials." },
          { icon: "📦", title: "Fast ship", body: "Most orders leave the warehouse within 24h." },
        ],
      },
      style: { tone: "light", sectionBg: "", containerWidth: "wide" },
      layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "80px", paddingBottom: "80px" },
    },
    render: ({ content, style, layout }) => {
      const c = (content || {}) as Record<string, unknown>;
      const st = (style || {}) as Record<string, string>;
      const l = (layout || {}) as Record<string, string>;
      const items = (Array.isArray(c.items) ? c.items : []) as Array<{ icon?: string; title?: string; body?: string }>;
      const variant = dv(c as { designVariant?: string }, "icon-row");
      const tone = (st.tone || "light") as SectionTone;
      const palette = tonePalette(tone, { bg: st.sectionBg });
      const isDark = palette.isDark;

      const headEl = (
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          {c.eyebrow ? <EyebrowChip tone={isDark ? "dark" : "light"}>{highlightDynamicTags(String(c.eyebrow))}</EyebrowChip> : null}
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl" style={{ color: palette.heading }}>
            {highlightDynamicTags(String(c.title ?? ""))}
          </h2>
          {c.body ? (
            <p className="text-base leading-relaxed md:text-lg" style={{ color: palette.muted }}>
              {highlightDynamicTags(String(c.body))}
            </p>
          ) : null}
        </div>
      );

      if (variant === "stacked-cards") {
        return (
          <ProductSection tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "normal"}>
            {headEl}
            <ul className="mx-auto mt-12 max-w-3xl space-y-4">
              {items.map((row, i) => (
                <li
                  key={i}
                  className={cn(
                    "flex items-start gap-5 rounded-3xl border p-6 transition hover:-translate-y-1",
                    isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-black/[0.06] bg-white shadow-sm"
                  )}
                >
                  <span
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                    style={{ background: `linear-gradient(135deg, ${ACCENT_FALLBACK}1f, ${ACCENT_FALLBACK_2}1f)` }}
                  >
                    {row.icon}
                  </span>
                  <div>
                    <h3 className="font-semibold" style={{ color: palette.heading }}>
                      {highlightDynamicTags(row.title)}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: palette.muted }}>
                      {highlightDynamicTags(row.body)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </ProductSection>
        );
      }

      if (variant === "bullets") {
        return (
          <ProductSection tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "narrow"}>
            {headEl}
            <ul className="mx-auto mt-10 max-w-xl space-y-4">
              {items.map((row, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: `linear-gradient(135deg, ${ACCENT_FALLBACK}, ${ACCENT_FALLBACK_2})` }}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  <span>
                    <span className="font-semibold" style={{ color: palette.heading }}>
                      {highlightDynamicTags(row.title)}
                    </span>
                    {row.body ? (
                      <span style={{ color: palette.muted }}> — {highlightDynamicTags(row.body)}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </ProductSection>
        );
      }

      /* icon-row (default) */
      return (
        <ProductSection tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "wide"}>
          {headEl}
          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            {items.map((row, i) => (
              <div key={i} className="text-center">
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl shadow-md ring-1 ring-black/5"
                  style={{ background: `linear-gradient(135deg, ${ACCENT_FALLBACK}1f, ${ACCENT_FALLBACK_2}1f)` }}
                >
                  {row.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold" style={{ color: palette.heading }}>
                  {highlightDynamicTags(row.title)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: palette.muted }}>
                  {highlightDynamicTags(row.body)}
                </p>
              </div>
            ))}
          </div>
        </ProductSection>
      );
    },
  },

  ProductTabsContentBlock: {
    label: "Product tabs / story",
    fields: {
      content: {
        type: "object",
        label: "Content",
        objectFields: {
          designVariant: { type: "text", label: "Layout preset", visible: false },
          eyebrow: puckBindingTextField("Eyebrow"),
          tabs: {
            type: "array",
            label: "Panels",
            arrayFields: {
              tabLabel: { type: "text", label: "Tab title" },
              body: { type: "textarea", label: "Content" },
            },
            defaultItemProps: { tabLabel: "Description", body: "Product story and details." },
            getItemSummary: (item) => item.tabLabel || "Panel",
          },
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
          sectionBg: { type: "text", label: "Custom background" },
          containerWidth: containerPresetField,
        },
      },
      ...sharedLayoutField,
    },
    defaultProps: {
      content: {
        designVariant: "underline",
        eyebrow: "",
        tabs: [
          { tabLabel: "Description", body: "Full product narrative and positioning copy goes here. Make it sing — share the why, not just the what." },
          { tabLabel: "What's in the box", body: "Care instructions, compatibility, and contents." },
          { tabLabel: "Shipping & returns", body: "Regions, carriers, and our 30-day no-questions return policy." },
        ],
      },
      style: { tone: "light", sectionBg: "", containerWidth: "normal" },
      layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "56px", paddingBottom: "64px" },
    },
    render: ({ content, style, layout }) => {
      const c = (content || {}) as Record<string, unknown>;
      const st = (style || {}) as Record<string, string>;
      const l = (layout || {}) as Record<string, string>;
      const tabs = (Array.isArray(c.tabs) ? c.tabs : []) as Array<{ tabLabel?: string; body?: string }>;
      const variant = dv(c as { designVariant?: string }, "underline");
      const tone = (st.tone || "light") as SectionTone;
      const palette = tonePalette(tone, { bg: st.sectionBg });
      const isDark = palette.isDark;
      const [open, setOpen] = React.useState(0);

      const eyebrowEl = c.eyebrow ? (
        <EyebrowChip tone={isDark ? "dark" : "light"}>{highlightDynamicTags(String(c.eyebrow))}</EyebrowChip>
      ) : null;

      if (variant === "accordion") {
        return (
          <ProductSection tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "normal"}>
            {eyebrowEl ? <div className="mb-8 text-center">{eyebrowEl}</div> : null}
            <ul className={cn("mx-auto max-w-3xl divide-y rounded-3xl border", isDark ? "divide-white/[0.08] border-white/10" : "divide-black/[0.06] border-black/[0.06] bg-white shadow-sm")}>
              {tabs.map((row, i) => {
                const isOpen = open === i;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? -1 : i)}
                      className="flex w-full items-center justify-between gap-4 p-6 text-left text-base font-semibold"
                      style={{ color: palette.heading }}
                    >
                      {highlightDynamicTags(row.tabLabel)}
                      <span
                        className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-base transition",
                          isOpen && "rotate-45",
                          isDark ? "border-white/15" : "border-black/[0.08]"
                        )}
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    </button>
                    {isOpen ? (
                      <div className="px-6 pb-6">
                        <p className="text-sm leading-relaxed" style={{ color: palette.muted }}>
                          {highlightDynamicTags(row.body)}
                        </p>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </ProductSection>
        );
      }

      if (variant === "pills") {
        return (
          <ProductSection tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "normal"}>
            <div className="mx-auto max-w-3xl">
              {eyebrowEl ? <div className="mb-6 text-center">{eyebrowEl}</div> : null}
              <div className="flex flex-wrap justify-center gap-2">
                {tabs.map((row, i) => {
                  const active = open === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setOpen(i)}
                      className={cn(
                        "rounded-full px-5 py-2 text-sm font-semibold transition",
                        active ? "text-white shadow-md" : isDark ? "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      )}
                      style={
                        active
                          ? { background: `linear-gradient(135deg, ${ACCENT_FALLBACK}, ${ACCENT_FALLBACK_2})` }
                          : undefined
                      }
                    >
                      {highlightDynamicTags(row.tabLabel)}
                    </button>
                  );
                })}
              </div>
              <div
                className={cn(
                  "mt-8 rounded-3xl border p-8",
                  isDark ? "border-white/10 bg-white/[0.03]" : "border-black/[0.06] bg-white shadow-sm"
                )}
              >
                <p className="text-base leading-relaxed" style={{ color: palette.muted }}>
                  {tabs[open] ? highlightDynamicTags(String(tabs[open].body ?? "")) : null}
                </p>
              </div>
            </div>
          </ProductSection>
        );
      }

      /* underline (default) */
      return (
        <ProductSection tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "normal"}>
          <div className="mx-auto max-w-3xl">
            {eyebrowEl ? <div className="mb-6">{eyebrowEl}</div> : null}
            <div className={cn("relative flex gap-6 border-b", isDark ? "border-white/[0.08]" : "border-black/[0.06]")}>
              {tabs.map((row, i) => {
                const active = open === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setOpen(i)}
                    className={cn(
                      "relative -mb-px pb-3 text-sm font-semibold transition",
                      active ? "" : isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
                    )}
                    style={active ? { color: palette.heading } : undefined}
                  >
                    {highlightDynamicTags(row.tabLabel)}
                    {active ? (
                      <span
                        className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full"
                        style={{ background: `linear-gradient(90deg, ${ACCENT_FALLBACK}, ${ACCENT_FALLBACK_2})` }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div className="pt-8">
              <p className="text-base leading-relaxed" style={{ color: palette.muted }}>
                {tabs[open] ? highlightDynamicTags(String(tabs[open].body ?? "")) : null}
              </p>
            </div>
          </div>
        </ProductSection>
      );
    },
  },

  ProductRelatedBlock: {
    label: "Related products",
    fields: {
      content: {
        type: "object",
        label: "Content",
        objectFields: {
          designVariant: { type: "text", label: "Layout preset", visible: false },
          eyebrow: puckBindingTextField("Eyebrow"),
          title: puckBindingTextField("Heading"),
          body: puckBindingTextareaField("Body"),
          ctaLabel: puckBindingTextField("CTA label"),
          ctaHref: puckBindingTextField("CTA URL"),
          products: {
            type: "array",
            label: "Products",
            arrayFields: {
              name: { type: "text", label: "Name" },
              price: { type: "text", label: "Price" },
              compareAtPrice: { type: "text", label: "Compare-at price (optional)" },
              tag: { type: "text", label: "Tag (e.g. New)" },
              href: { type: "text", label: "URL" },
              imageSrc: puckImageSrcField("Image URL"),
            },
            defaultItemProps: { name: "Accessory", price: "$29", compareAtPrice: "", tag: "", href: "#", imageSrc: "" },
            getItemSummary: (item) => item.name || "Product",
          },
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
          sectionBg: { type: "text", label: "Custom background" },
          containerWidth: containerPresetField,
        },
      },
      ...sharedLayoutField,
    },
    defaultProps: {
      content: {
        designVariant: "grid",
        eyebrow: "Pairs well with",
        title: "Customers also bought",
        body: "Hand-picked add-ons that complete the experience.",
        ctaLabel: "View all",
        ctaHref: "#",
        products: [
          { name: "Carrying case", price: "$24", compareAtPrice: "$32", tag: "Save $8", href: "#", imageSrc: "" },
          { name: "Extended warranty", price: "$39", compareAtPrice: "", tag: "", href: "#", imageSrc: "" },
          { name: "Pro bundle", price: "$199", compareAtPrice: "$229", tag: "Bundle", href: "#", imageSrc: "" },
          { name: "Gift card", price: "$50", compareAtPrice: "", tag: "", href: "#", imageSrc: "" },
        ],
      },
      style: { tone: "muted", sectionBg: "", containerWidth: "wide" },
      layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "80px", paddingBottom: "80px" },
    },
    render: ({ content, style, layout }) => {
      const c = (content || {}) as Record<string, unknown>;
      const st = (style || {}) as Record<string, string>;
      const l = (layout || {}) as Record<string, string>;
      const products = (Array.isArray(c.products) ? c.products : []) as Array<{
        name?: string;
        price?: string;
        compareAtPrice?: string;
        tag?: string;
        href?: string;
        imageSrc?: string;
      }>;
      const variant = dv(c as { designVariant?: string }, "grid");
      const tone = (st.tone || "muted") as SectionTone;
      const palette = tonePalette(tone, { bg: st.sectionBg });
      const isDark = palette.isDark;

      const headEl = (
        <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-3">
            {c.eyebrow ? <EyebrowChip tone={isDark ? "dark" : "light"}>{highlightDynamicTags(String(c.eyebrow))}</EyebrowChip> : null}
            <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl" style={{ color: palette.heading }}>
              {highlightDynamicTags(String(c.title ?? ""))}
            </h2>
            {c.body ? (
              <p className="max-w-xl text-base" style={{ color: palette.muted }}>
                {highlightDynamicTags(String(c.body))}
              </p>
            ) : null}
          </div>
          {String(c.ctaLabel ?? "").trim() ? (
            <a
              href={String(c.ctaHref ?? "#")}
              className="group inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-black/[0.04]"
              style={ghostButtonStyle({
                borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.16)",
                color: isDark ? "#fff" : undefined,
                radiusPx: 9999,
              })}
            >
              {highlightDynamicTags(String(c.ctaLabel))}
              <ChevronRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
            </a>
          ) : null}
        </div>
      );

      const productCard = (
        p: {
          name?: string;
          price?: string;
          compareAtPrice?: string;
          tag?: string;
          href?: string;
          imageSrc?: string;
        },
        i: number,
        narrow?: boolean
      ) => (
        <a
          key={i}
          href={p.href || "#"}
          className={cn(
            "group flex flex-col overflow-hidden rounded-3xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl",
            narrow ? "min-w-[240px] max-w-[260px] shrink-0 snap-start" : "",
            isDark ? "border-white/[0.08] bg-white/[0.03]" : "border-black/[0.06]"
          )}
        >
          <div className="relative aspect-[4/3] overflow-hidden" style={{ background: `linear-gradient(135deg, ${ACCENT_FALLBACK}1f, ${ACCENT_FALLBACK_2}1f)` }}>
            {p.tag?.trim() ? (
              <span
                className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow"
                style={{ background: `linear-gradient(135deg, ${ACCENT_FALLBACK}, ${ACCENT_FALLBACK_2})` }}
              >
                <Sparkles className="h-3 w-3" aria-hidden />
                {p.tag}
              </span>
            ) : null}
            <SafeImage
              src={p.imageSrc}
              alt={p.name || "Product"}
              role="product"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              fallbackClassName="h-full w-full"
              showCaption={false}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5 p-5">
            <div className="font-semibold" style={{ color: isDark ? "#fff" : palette.heading }}>
              {p.name}
            </div>
            <div className="mt-auto flex items-baseline gap-2 pt-2">
              <span className="text-base font-bold" style={{ color: isDark ? "#fff" : palette.heading }}>
                {p.price}
              </span>
              {p.compareAtPrice?.trim() ? (
                <span className="text-sm line-through" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>
                  {p.compareAtPrice}
                </span>
              ) : null}
            </div>
          </div>
        </a>
      );

      if (variant === "list") {
        return (
          <ProductSection tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "normal"}>
            {headEl}
            <div className="mx-auto flex max-w-2xl flex-col gap-4">
              {products.map((p, i) => (
                <a
                  key={i}
                  href={p.href || "#"}
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
                      src={p.imageSrc}
                      alt={p.name || "Product"}
                      role="product"
                      className="h-full min-h-[120px] w-full object-cover transition duration-500 group-hover:scale-105"
                      fallbackClassName="h-full min-h-[120px] w-full"
                      showCaption={false}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-5">
                    {p.tag?.trim() ? (
                      <span className="inline-flex w-fit rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-700">
                        {p.tag}
                      </span>
                    ) : null}
                    <div className="truncate font-semibold" style={{ color: isDark ? "#fff" : palette.heading }}>{p.name}</div>
                    <div className="flex items-baseline gap-2 text-sm">
                      <span className="font-bold" style={{ color: isDark ? "#fff" : palette.heading }}>{p.price}</span>
                      {p.compareAtPrice?.trim() ? (
                        <span className="line-through" style={{ color: palette.muted }}>{p.compareAtPrice}</span>
                      ) : null}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </ProductSection>
        );
      }

      if (variant === "rail") {
        return (
          <ProductSection tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "wide"}>
            {headEl}
            <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin]">
              {products.map((p, i) => productCard(p, i, true))}
            </div>
          </ProductSection>
        );
      }

      /* grid (default) */
      return (
        <ProductSection tone={tone} bg={st.sectionBg} layout={l} containerWidth={st.containerWidth || "wide"}>
          {headEl}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p, i) => productCard(p, i, false))}
          </div>
        </ProductSection>
      );
    },
  },
};

export const PRODUCT_DETAIL_PICKABLE_TYPES = [
  "ProductHeaderBlock",
  "ProductGalleryBlock",
  "ProductSpecsBlock",
  "ProductHighlightsBlock",
  "ProductTabsContentBlock",
  "ProductRelatedBlock",
] as const;

export type ProductDetailPickableType = (typeof PRODUCT_DETAIL_PICKABLE_TYPES)[number];

export function isProductDetailPickableType(t: string): t is ProductDetailPickableType {
  return (PRODUCT_DETAIL_PICKABLE_TYPES as readonly string[]).includes(t);
}

export function getProductDetailDefaultProps(type: string): Record<string, unknown> | null {
  if (!isProductDetailPickableType(type)) return null;
  const cfg = productDetailBlockConfigs[type];
  const dp = cfg && "defaultProps" in cfg ? cfg.defaultProps : null;
  if (!dp || typeof dp !== "object") return null;
  return JSON.parse(JSON.stringify(dp)) as Record<string, unknown>;
}
