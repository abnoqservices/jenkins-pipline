"use client";

import * as React from "react";
import type { CustomField } from "@measured/puck";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Shared brand tokens                                                        */
/* -------------------------------------------------------------------------- */

export const ACCENT_FALLBACK = "#6366f1";
export const ACCENT_FALLBACK_2 = "#8b5cf6";
export const ACCENT_FALLBACK_3 = "#ec4899";

export function accentVar(override?: string, fallback = ACCENT_FALLBACK): string {
  return override?.trim() || `var(--lp-accent, ${fallback})`;
}

export function headingVar(override?: string): string {
  return override?.trim() || "var(--lp-heading, #0b1220)";
}

export function mutedVar(override?: string): string {
  return override?.trim() || "var(--lp-muted, #4b5563)";
}

export function btnTextVar(override?: string): string {
  return override?.trim() || "var(--lp-btn-text, #ffffff)";
}

/* -------------------------------------------------------------------------- */
/*  Token highlighter — keeps {{product.x}} pills consistent across blocks     */
/* -------------------------------------------------------------------------- */

function tokenColorClasses(token: string): string {
  const key = token.replace(/[{}\s]/g, "");
  if (key.startsWith("product.")) return "border-violet-200 bg-violet-100 text-violet-700";
  if (key.startsWith("visitor.")) return "border-sky-200 bg-sky-100 text-sky-700";
  if (key.startsWith("campaign.")) return "border-amber-200 bg-amber-100 text-amber-700";
  if (key.startsWith("system.")) return "border-emerald-200 bg-emerald-100 text-emerald-700";
  if (key.includes(".")) return "border-indigo-200 bg-indigo-100 text-indigo-700";
  return "border-slate-200 bg-slate-100 text-slate-700";
}

export function highlightDynamicTags(text: string | undefined): React.ReactNode {
  const raw = text ?? "";
  if (!raw.includes("{{")) return raw;
  const parts = raw.split(/(\{\{\s*[\w.]+\s*\}\})/g);
  return parts.map((part, i) => {
    if (/^\{\{\s*[\w.]+\s*\}\}$/.test(part)) {
      return (
        <span
          key={`${part}-${i}`}
          className={`rounded border px-1 py-0.5 font-mono text-[0.92em] ${tokenColorClasses(part)}`}
        >
          {part}
        </span>
      );
    }
    return <React.Fragment key={`${i}-text`}>{part}</React.Fragment>;
  });
}

/* -------------------------------------------------------------------------- */
/*  Pixel parsing helper                                                       */
/* -------------------------------------------------------------------------- */

export function toPx(v: string | number | undefined, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = parseInt(String(v ?? "").trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

/* -------------------------------------------------------------------------- */
/*  dv() — read variant id from props with a default fallback                  */
/* -------------------------------------------------------------------------- */

export function dv(content: { designVariant?: string } | undefined, fallback: string): string {
  const v = content?.designVariant?.trim();
  return v || fallback;
}

/* -------------------------------------------------------------------------- */
/*  Decorative backgrounds                                                     */
/* -------------------------------------------------------------------------- */

export function GradientMesh({
  from,
  via,
  to,
  intensity = "medium",
  className,
}: {
  from?: string;
  via?: string;
  to?: string;
  intensity?: "soft" | "medium" | "strong";
  className?: string;
}) {
  const opacityA = intensity === "strong" ? 0.95 : intensity === "soft" ? 0.45 : 0.7;
  const opacityB = intensity === "strong" ? 0.85 : intensity === "soft" ? 0.35 : 0.55;
  const a = from || "#a5b4fc";
  const b = via || "#f0abfc";
  const c = to || "#fda4af";
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div
        className="absolute -left-24 -top-32 h-[28rem] w-[28rem] rounded-full blur-[120px]"
        style={{ background: a, opacity: opacityA }}
      />
      <div
        className="absolute -right-32 top-12 h-[24rem] w-[24rem] rounded-full blur-[120px]"
        style={{ background: b, opacity: opacityB }}
      />
      <div
        className="absolute -bottom-24 left-1/3 h-[22rem] w-[22rem] rounded-full blur-[120px]"
        style={{ background: c, opacity: opacityB }}
      />
    </div>
  );
}

export function DotGrid({
  color = "rgba(15,23,42,0.07)",
  size = 22,
  className,
}: {
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage: `radial-gradient(${color} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
        maskImage:
          "radial-gradient(ellipse at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
        WebkitMaskImage:
          "radial-gradient(ellipse at center, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)",
      }}
    />
  );
}

export function GridLines({
  color = "rgba(15,23,42,0.07)",
  size = 56,
  className,
}: {
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
        maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)",
      }}
    />
  );
}

export function NoiseOverlay({ opacity = 0.05, className }: { opacity?: number; className?: string }) {
  // Inline SVG noise — no extra request, monochrome film grain.
  const svg = encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.7 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`
  );
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 mix-blend-overlay", className)}
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,${svg}")`,
        backgroundSize: "160px 160px",
        opacity,
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Eyebrow chip — small pill rendered above section titles                    */
/* -------------------------------------------------------------------------- */

export function EyebrowChip({
  children,
  tone = "light",
  className,
}: {
  children: React.ReactNode;
  tone?: "light" | "dark" | "accent";
  className?: string;
}) {
  if (!children) return null;
  const cls =
    tone === "dark"
      ? "border-white/15 bg-white/[0.06] text-white/80"
      : tone === "accent"
        ? "border-transparent text-white"
        : "border-black/[0.08] bg-white/70 text-slate-700 backdrop-blur";
  const style: React.CSSProperties =
    tone === "accent"
      ? { background: `linear-gradient(135deg, ${ACCENT_FALLBACK}, ${ACCENT_FALLBACK_2})` }
      : {};
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-sm",
        cls,
        className
      )}
      style={style}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: tone === "accent" ? "rgba(255,255,255,0.85)" : `var(--lp-accent, ${ACCENT_FALLBACK})` }}
      />
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Marquee — horizontally scrolling row, pure CSS                             */
/* -------------------------------------------------------------------------- */

export function Marquee({
  children,
  speed = 40,
  pauseOnHover = true,
  className,
}: {
  children: React.ReactNode;
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
}) {
  const dur = `${Math.max(8, speed)}s`;
  return (
    <div className={cn("relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]", className)}>
      <style>{`@keyframes lp-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      <div
        className={cn("flex w-max items-center gap-12 will-change-transform", pauseOnHover && "hover:[animation-play-state:paused]")}
        style={{ animation: `lp-marquee ${dur} linear infinite` }}
      >
        {children}
        <div aria-hidden className="contents">
          {children}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  GradientBorderCard — animated rotating-conic-gradient border on hover      */
/* -------------------------------------------------------------------------- */

export function GradientBorderCard({
  children,
  className,
  innerClassName,
  glowColor,
  radius = 20,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  glowColor?: string;
  radius?: number;
}) {
  const tint = glowColor || `var(--lp-accent, ${ACCENT_FALLBACK})`;
  return (
    <div
      className={cn("group relative isolate p-px transition", className)}
      style={{ borderRadius: radius }}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-70"
        style={{
          background: `conic-gradient(from 220deg at 50% 50%, ${tint}, transparent 30%, transparent 70%, ${tint})`,
          borderRadius: radius,
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 rounded-[inherit] opacity-60"
        style={{
          background: `linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.04))`,
          borderRadius: radius,
        }}
      />
      <div
        className={cn("relative h-full rounded-[inherit] border border-black/[0.06] bg-white shadow-sm transition group-hover:shadow-xl", innerClassName)}
        style={{ borderRadius: radius }}
      >
        {children}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  StarRating — used by reviews / testimonials                                */
/* -------------------------------------------------------------------------- */

export function StarRating({ value, size = 16 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400" aria-label={`${v} of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          fill={i < v ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={1.4}
          aria-hidden
        >
          <path d="M10 1.6l2.7 5.5 6 .9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6L1.3 8l6.1-.9z" />
        </svg>
      ))}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Premium custom Puck fields                                                 */
/* -------------------------------------------------------------------------- */

const HEADING = (title: string): CustomField<string> => ({
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
});

export const dsHeading = HEADING;

/** Visual chip-style preset picker. Renders 2-6 named options as a button row. */
export function puckPresetField(
  label: string,
  options: ReadonlyArray<{ value: string; label: string; hint?: string }>,
  helper?: string
): CustomField<string> {
  return {
    type: "custom",
    label,
    render: ({ value, onChange }) => {
      const current = typeof value === "string" && value.trim() ? value.trim() : options[0]?.value ?? "";
      return (
        <div className="space-y-2 pt-0.5">
          <Label className="text-xs font-medium">{label}</Label>
          {helper ? <p className="text-[11px] leading-snug text-muted-foreground">{helper}</p> : null}
          <div className="grid grid-cols-2 gap-1.5">
            {options.map((o) => {
              const selected = current === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => onChange(o.value)}
                  className={cn(
                    "flex flex-col items-start rounded-md border px-2.5 py-1.5 text-left text-[11px] transition",
                    selected
                      ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/30"
                      : "border-border bg-card text-foreground/80 hover:border-primary/40 hover:bg-muted/40"
                  )}
                >
                  <span className="font-semibold leading-tight">{o.label}</span>
                  {o.hint ? <span className="mt-0.5 text-[10px] text-muted-foreground">{o.hint}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
      );
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Theme tokens shared across blocks                                          */
/* -------------------------------------------------------------------------- */

/** Shadow-preset → CSS box-shadow */
export function shadowPresetToCss(preset: string | undefined): string | undefined {
  switch ((preset || "").trim()) {
    case "none":
      return "none";
    case "soft":
      return "0 1px 2px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.06)";
    case "medium":
      return "0 4px 12px rgba(15,23,42,0.08), 0 18px 40px -12px rgba(15,23,42,0.18)";
    case "elevated":
      return "0 10px 24px -10px rgba(15,23,42,0.18), 0 30px 60px -20px rgba(15,23,42,0.24)";
    case "glow":
      return "0 0 0 1px rgba(99,102,241,0.18), 0 12px 28px -8px rgba(99,102,241,0.35), 0 28px 60px -18px rgba(139,92,246,0.32)";
    default:
      return undefined;
  }
}

export function radiusPresetToPx(preset: string | undefined, fallback = 16): number {
  switch ((preset || "").trim()) {
    case "sharp":
      return 4;
    case "soft":
      return 12;
    case "round":
      return 24;
    case "pill":
      return 9999;
    default:
      return fallback;
  }
}

/** Container widths that match Framer/Webflow conventions. */
export function containerMaxWidthPx(preset: string | undefined): number {
  switch ((preset || "").trim()) {
    case "narrow":
      return 768;
    case "wide":
      return 1280;
    case "full":
      return 1536;
    case "normal":
    default:
      return 1100;
  }
}

/** Common section-padding presets. */
export function sectionPaddingY(preset: string | undefined): { top: string; bottom: string } {
  switch ((preset || "").trim()) {
    case "tight":
      return { top: "32px", bottom: "32px" };
    case "spacious":
      return { top: "96px", bottom: "96px" };
    case "hero":
      return { top: "120px", bottom: "120px" };
    case "comfortable":
    default:
      return { top: "64px", bottom: "64px" };
  }
}

/* -------------------------------------------------------------------------- */
/*  Premium primary button — used everywhere                                   */
/* -------------------------------------------------------------------------- */

export function premiumButtonStyle({
  bg,
  fg,
  shadow = "soft",
  radiusPx = 12,
}: {
  bg?: string;
  fg?: string;
  shadow?: string;
  radiusPx?: number;
} = {}): React.CSSProperties {
  return {
    background: bg?.trim() || `var(--lp-accent, ${ACCENT_FALLBACK})`,
    color: fg?.trim() || `var(--lp-btn-text, #ffffff)`,
    borderRadius: `${radiusPx}px`,
    boxShadow: shadowPresetToCss(shadow),
  };
}

export function ghostButtonStyle({
  borderColor,
  color,
  radiusPx = 12,
}: {
  borderColor?: string;
  color?: string;
  radiusPx?: number;
} = {}): React.CSSProperties {
  return {
    background: "transparent",
    borderColor: borderColor?.trim() || "rgba(15,23,42,0.16)",
    color: color?.trim() || `var(--lp-heading, #0b1220)`,
    borderRadius: `${radiusPx}px`,
    borderStyle: "solid",
    borderWidth: "1.5px",
  };
}

/* -------------------------------------------------------------------------- */
/*  Image safety — placeholders for missing / unresolved / broken sources      */
/* -------------------------------------------------------------------------- */

/** Detects placeholder tokens like `{{product.image_url}}` that browsers can't load. */
export function isUnresolvedTokenSrc(src: string | undefined): boolean {
  return Boolean(src && /\{\{[\s\S]*?\}\}/.test(src));
}

export type PlaceholderRole = "photo" | "avatar" | "logo" | "product";

/**
 * Stylish "Sample image" placeholder — used in place of broken `<img>` tags.
 * Looks intentional: gradient + subtle dot grid + image icon + caption.
 */
export function PlaceholderImage({
  alt,
  role = "photo",
  className,
  showCaption = true,
}: {
  alt?: string;
  role?: PlaceholderRole;
  className?: string;
  showCaption?: boolean;
}) {
  if (role === "avatar") {
    const initial = (alt || "").trim().replace(/[^A-Za-z0-9]/g, "")[0]?.toUpperCase() || "·";
    return (
      <span
        className={cn(
          "inline-flex select-none items-center justify-center rounded-full bg-gradient-to-br from-indigo-300 via-violet-300 to-pink-300 text-white",
          className
        )}
        role="img"
        aria-label={alt || "Sample avatar"}
      >
        <span className="text-sm font-semibold drop-shadow-sm">{initial}</span>
      </span>
    );
  }
  if (role === "logo") {
    const text = (alt || "Sample").slice(0, 12);
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-md bg-slate-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500",
          className
        )}
        role="img"
        aria-label={alt || "Sample logo"}
      >
        {text}
      </span>
    );
  }
  return (
    <div
      className={cn(
        "relative isolate flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-violet-50 to-pink-50 text-slate-500",
        className
      )}
      role="img"
      aria-label={alt || "Sample image"}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: "radial-gradient(rgba(99,102,241,0.18) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />
      <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-sm ring-1 ring-black/[0.04]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-5 w-5 text-indigo-500" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="9" cy="10" r="1.6" fill="currentColor" />
          <path d="M21 17l-5.5-6.5L9 18" />
        </svg>
      </span>
      {showCaption ? (
        <span className="relative mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
          Sample image
        </span>
      ) : null}
    </div>
  );
}

/**
 * Drop-in replacement for `<img>` that gracefully falls back to a styled
 * placeholder when:
 *  - src is empty,
 *  - src is an unresolved Puck/product placeholder token (`{{product.image_url}}`),
 *  - or the image fails to load at runtime.
 *
 * Use it everywhere we render user-supplied imagery so a missing asset never
 * paints a broken-image icon.
 */
export function SafeImage({
  src,
  alt,
  className,
  role = "photo",
  loading = "lazy",
  fallbackClassName,
  showCaption = true,
  style,
}: {
  src: string | undefined;
  alt?: string;
  className?: string;
  role?: PlaceholderRole;
  loading?: "lazy" | "eager";
  /** Override class for the placeholder (defaults to `className`). */
  fallbackClassName?: string;
  /** Hide the "Sample image" caption — useful for tiny thumbnails. */
  showCaption?: boolean;
  style?: React.CSSProperties;
}) {
  const trimmed = src?.trim() ?? "";
  const isMissing = !trimmed || isUnresolvedTokenSrc(trimmed);
  const [errored, setErrored] = React.useState(false);

  // Reset the error flag whenever the src actually changes.
  React.useEffect(() => {
    setErrored(false);
  }, [trimmed]);

  if (isMissing || errored) {
    return (
      <PlaceholderImage
        alt={alt}
        role={role}
        className={fallbackClassName ?? className}
        showCaption={showCaption}
      />
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={trimmed}
      alt={alt || ""}
      className={className}
      style={style}
      loading={loading}
      onError={() => setErrored(true)}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  AvatarStack — overlapping avatars with optional rating chip                */
/* -------------------------------------------------------------------------- */

export function AvatarStack({
  sources,
  size = 36,
  borderColor = "#ffffff",
  className,
}: {
  sources: Array<string | undefined>;
  size?: number;
  borderColor?: string;
  className?: string;
}) {
  // Always render the configured count of slots. Empty / unresolved sources
  // fall back to a small gradient placeholder via SafeImage role="avatar".
  const list = sources.length ? sources : Array.from({ length: 4 }).map(() => "");
  const ringStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderColor,
    borderWidth: 2,
    borderStyle: "solid",
  };
  return (
    <div className={cn("flex -space-x-2", className)}>
      {list.map((src, i) => (
        <span
          key={i}
          className="overflow-hidden rounded-full"
          style={ringStyle}
        >
          <SafeImage
            src={src}
            alt={`Avatar ${i + 1}`}
            role="avatar"
            className="h-full w-full object-cover"
            fallbackClassName="h-full w-full"
            showCaption={false}
          />
        </span>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Reusable section header (eyebrow + title + body)                           */
/* -------------------------------------------------------------------------- */

export function SectionHeader({
  eyebrow,
  title,
  body,
  align = "center",
  tone = "light",
  className,
}: {
  eyebrow?: string;
  title?: React.ReactNode;
  body?: React.ReactNode;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
}) {
  const alignCls = align === "left" ? "text-left items-start" : "text-center items-center mx-auto";
  return (
    <div className={cn("flex flex-col gap-4", alignCls, align === "center" && "max-w-2xl", className)}>
      {eyebrow ? <EyebrowChip tone={tone === "dark" ? "dark" : "light"}>{eyebrow}</EyebrowChip> : null}
      {title ? (
        <h2
          className={cn(
            "text-3xl font-bold leading-[1.05] tracking-tight md:text-4xl lg:text-[2.75rem]",
            tone === "dark" ? "text-white" : null
          )}
          style={tone === "dark" ? undefined : { color: headingVar() }}
        >
          {title}
        </h2>
      ) : null}
      {body ? (
        <p
          className={cn("max-w-xl text-base leading-relaxed md:text-lg", tone === "dark" ? "text-white/70" : null)}
          style={tone === "dark" ? undefined : { color: mutedVar() }}
        >
          {body}
        </p>
      ) : null}
    </div>
  );
}
