"use client";

import * as React from "react";
import type { Config } from "@measured/puck";
import { ArrowRight, ArrowUpRight, Check, Menu, Play, Sparkles, Star, X, Zap } from "lucide-react";
import {
  DEFAULT_LAYOUT_PROPS,
  layoutObjectFields,
  layoutToStyle,
} from "@/lib/puck/layout-fields";
import {
  puckColorPickerField,
  puckBindingTextField,
  puckRangeSliderField,
  puckStyleHeadingField,
  puckBindingTextareaField,
} from "@/lib/puck/puck-binding-custom-fields";
import { puckImageSrcField } from "@/lib/puck/puck-image-src-field";
import { puckFormPickerField } from "@/lib/puck/puck-form-picker-field";
import EmbedForm from "@/components/tempcomponent/form";
import {
  ACCENT_FALLBACK,
  ACCENT_FALLBACK_2,
  ACCENT_FALLBACK_3,
  AvatarStack,
  DotGrid,
  EyebrowChip,
  GradientBorderCard,
  GradientMesh,
  GridLines,
  Marquee,
  NoiseOverlay,
  PlaceholderImage,
  SafeImage,
  StarRating,
  accentVar,
  containerMaxWidthPx,
  dv,
  ghostButtonStyle,
  headingVar,
  highlightDynamicTags,
  mutedVar,
  premiumButtonStyle,
  puckPresetField,
  radiusPresetToPx,
  shadowPresetToCss,
  toPx,
} from "@/lib/puck/puck-design-system";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function BrandLogoTextOrImage(props: {
  logoMode?: string;
  logoText?: string;
  logoImageSrc?: string;
  textClassName?: string;
  textStyle?: React.CSSProperties;
  imageClassName?: string;
}) {
  const [imgErrored, setImgErrored] = React.useState(false);
  React.useEffect(() => {
    setImgErrored(false);
  }, [props.logoImageSrc]);

  const img = props.logoImageSrc?.trim();
  const isResolvable = img && !/\{\{/.test(img);
  if (props.logoMode === "image" && isResolvable && !imgErrored) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={img}
        alt={props.logoText?.trim() || "Logo"}
        className={
          props.imageClassName ?? "h-8 w-auto max-w-[200px] object-contain object-left md:h-9"
        }
        onError={() => setImgErrored(true)}
      />
    );
  }
  return (
    <span className={props.textClassName} style={props.textStyle}>
      {props.logoText || "Brand"}
    </span>
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
  ],
  "Constrains how wide the inner content can grow."
);

const radiusPresetField = puckPresetField(
  "Corner style",
  [
    { value: "sharp", label: "Sharp", hint: "4px" },
    { value: "soft", label: "Soft", hint: "12px" },
    { value: "round", label: "Round", hint: "24px" },
    { value: "pill", label: "Pill", hint: "Full" },
  ]
);

const shadowPresetField = puckPresetField(
  "Card shadow",
  [
    { value: "none", label: "None" },
    { value: "soft", label: "Soft" },
    { value: "medium", label: "Medium" },
    { value: "elevated", label: "Elevated" },
    { value: "glow", label: "Glow" },
  ]
);

const toneField = puckPresetField(
  "Section theme",
  [
    { value: "light", label: "Light" },
    { value: "muted", label: "Muted" },
    { value: "dark", label: "Dark" },
    { value: "gradient", label: "Gradient" },
  ],
  "Drives background, text, and decorative overlay choices."
);

/* -------------------------------------------------------------------------- */
/*  Section shell — provides background, decorations, and tone awareness       */
/* -------------------------------------------------------------------------- */

type SectionTone = "light" | "muted" | "dark" | "gradient" | string;

function tonePalette(tone: SectionTone, custom?: Record<string, string | undefined>) {
  const t = (tone || "light").toString();
  if (t === "dark") {
    return {
      bg: custom?.bg || "#0b1220",
      text: "#e2e8f0",
      muted: "#94a3b8",
      heading: "#ffffff",
      cardBg: custom?.cardBg || "#111a2e",
      cardBorder: "rgba(255,255,255,0.08)",
      isDark: true,
    };
  }
  if (t === "muted") {
    return {
      bg: custom?.bg || "#f6f7fb",
      text: "var(--lp-pageText, #1f2937)",
      muted: "var(--lp-muted, #475569)",
      heading: "var(--lp-heading, #0b1220)",
      cardBg: custom?.cardBg || "#ffffff",
      cardBorder: "rgba(15,23,42,0.06)",
      isDark: false,
    };
  }
  if (t === "gradient") {
    return {
      bg: custom?.bg || "transparent",
      text: "var(--lp-pageText, #1f2937)",
      muted: "var(--lp-muted, #475569)",
      heading: "var(--lp-heading, #0b1220)",
      cardBg: custom?.cardBg || "rgba(255,255,255,0.7)",
      cardBorder: "rgba(255,255,255,0.4)",
      isDark: false,
    };
  }
  return {
    bg: custom?.bg || "#ffffff",
    text: "var(--lp-pageText, #1f2937)",
    muted: "var(--lp-muted, #475569)",
    heading: "var(--lp-heading, #0b1220)",
    cardBg: custom?.cardBg || "#ffffff",
    cardBorder: "rgba(15,23,42,0.06)",
    isDark: false,
  };
}

function PremiumSection({
  tone = "light",
  bg,
  decoration = "none",
  layout,
  className,
  children,
  innerClassName,
  containerWidth = "normal",
}: {
  tone?: SectionTone;
  bg?: string;
  decoration?: "none" | "mesh" | "grid" | "dots" | "noise" | "lines" | "spotlight";
  layout?: Record<string, string>;
  className?: string;
  children: React.ReactNode;
  innerClassName?: string;
  containerWidth?: string;
}) {
  const palette = tonePalette(tone, { bg });
  const maxWidth = containerMaxWidthPx(containerWidth);
  let bgStyle: React.CSSProperties = { backgroundColor: palette.bg };
  if (tone === "gradient") {
    bgStyle = {
      background: `linear-gradient(135deg, #eef2ff 0%, #faf5ff 50%, #fef3f2 100%)`,
    };
  }
  return (
    <section
      className={cn("relative overflow-hidden isolate", className)}
      style={{
        ...layoutToStyle(layout),
        ...bgStyle,
        color: palette.text,
      }}
    >
      {decoration === "mesh" ? <GradientMesh /> : null}
      {decoration === "grid" ? <GridLines color={palette.isDark ? "rgba(148,163,184,0.07)" : "rgba(15,23,42,0.07)"} /> : null}
      {decoration === "dots" ? <DotGrid color={palette.isDark ? "rgba(148,163,184,0.18)" : "rgba(15,23,42,0.08)"} /> : null}
      {decoration === "noise" ? <NoiseOverlay /> : null}
      {decoration === "lines" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(135deg, ${palette.isDark ? "rgba(148,163,184,0.07)" : "rgba(15,23,42,0.04)"} 0 2px, transparent 2px 24px)`,
          }}
        />
      ) : null}
      {decoration === "spotlight" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full blur-[140px]"
          style={{
            background: `radial-gradient(circle, ${ACCENT_FALLBACK}33 0%, transparent 60%)`,
          }}
        />
      ) : null}
      <div className={cn("relative mx-auto px-4 md:px-8", innerClassName)} style={{ maxWidth }}>
        {children}
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Block 1: NavBar                                                            */
/* -------------------------------------------------------------------------- */

const navBarBlock: Config["components"][string] = {
  label: "Nav bar",
  fields: {
    content: {
      type: "object",
      label: "Content",
      objectFields: {
        designVariant: { type: "text", label: "Layout preset", visible: false },
        logoMode: {
          type: "radio",
          label: "Logo type",
          options: [
            { label: "Text", value: "text" },
            { label: "Image", value: "image" },
          ],
        },
        logoText: puckBindingTextField("Logo text"),
        logoImageSrc: puckImageSrcField("Logo image URL"),
        announcement: puckBindingTextField("Announcement bar (optional)"),
        announcementHref: puckBindingTextField("Announcement link"),
        links: {
          type: "array",
          label: "Center links",
          arrayFields: {
            label: { type: "text", label: "Label" },
            href: { type: "text", label: "URL" },
          },
          defaultItemProps: { label: "Home", href: "#" },
          getItemSummary: (item) => item.label || "Link",
        },
        loginLabel: puckBindingTextField("Login label"),
        loginHref: puckBindingTextField("Login URL"),
        signUpLabel: puckBindingTextField("Sign up label"),
        signUpHref: puckBindingTextField("Sign up URL"),
      },
    },
    style: {
      type: "object",
      label: "Style",
      objectFields: {
        sectionHeader: puckStyleHeadingField("Theme"),
        tone: toneField,
        customBg: { type: "text", label: "Custom background (overrides theme)" },
        brandingHeader: puckStyleHeadingField("Brand and links"),
        logoColor: puckColorPickerField("Logo color"),
        linkColor: puckColorPickerField("Link color"),
        ctaBg: puckColorPickerField("CTA background"),
        ctaTextColor: puckColorPickerField("CTA text"),
        behaviorHeader: puckStyleHeadingField("Behavior"),
        sticky: {
          type: "radio",
          label: "Sticky header",
          options: [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ],
        },
        blur: {
          type: "radio",
          label: "Glass blur",
          options: [
            { label: "On", value: "yes" },
            { label: "Off", value: "no" },
          ],
        },
      },
    },
    ...sharedLayoutField,
  },
  defaultProps: {
    content: {
      logoMode: "text",
      logoText: "Lumen",
      logoImageSrc: "",
      announcement: "",
      announcementHref: "#",
      links: [
        { label: "Product", href: "#" },
        { label: "Solutions", href: "#" },
        { label: "Pricing", href: "#" },
        { label: "Customers", href: "#" },
        { label: "Docs", href: "#" },
      ],
      loginLabel: "Sign in",
      loginHref: "#",
      signUpLabel: "Start free",
      signUpHref: "#",
      designVariant: "marketing-full",
    },
    style: {
      tone: "light",
      customBg: "",
      logoColor: "",
      linkColor: "",
      ctaBg: "",
      ctaTextColor: "",
      sticky: "yes",
      blur: "yes",
    },
    layout: { ...DEFAULT_LAYOUT_PROPS },
  },
  render: (props) => <NavBarRenderer {...(props as NavBarRendererProps)} />,
};

type NavBarContent = {
  designVariant?: string;
  logoMode?: string;
  logoText?: string;
  logoImageSrc?: string;
  announcement?: string;
  announcementHref?: string;
  links?: Array<{ label?: string; href?: string }>;
  loginLabel?: string;
  loginHref?: string;
  signUpLabel?: string;
  signUpHref?: string;
};

type NavBarRendererProps = {
  content?: NavBarContent;
  style?: Record<string, string>;
  layout?: Record<string, string>;
};

function NavBarRenderer({ content, style, layout }: NavBarRendererProps) {
  const c = (content || {}) as NavBarContent;
  const st = (style || {}) as Record<string, string>;
  const l = (layout || {}) as Record<string, string>;
  const links = Array.isArray(c.links) ? c.links : [];
  const sticky = st.sticky !== "no";
  const blur = st.blur !== "no";
  const variant = dv(c, "marketing-full");
  const isDark = (st.tone || "light") === "dark" || variant === "docs-style";
  const announcement = c.announcement?.trim();

  const [menuOpen, setMenuOpen] = React.useState(false);
  const closeMenu = React.useCallback(() => setMenuOpen(false), []);

  // Lock body scroll while the mobile drawer is open
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    if (menuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [menuOpen]);

  const bgFromTone =
    st.customBg?.trim() ||
    (isDark
      ? "rgba(11,18,32,0.72)"
      : (st.tone || "light") === "muted"
        ? "rgba(246,247,251,0.85)"
        : "rgba(255,255,255,0.78)");

  const linkClr = st.linkColor?.trim() || (isDark ? "#cbd5e1" : "#334155");
  const logoClr = st.logoColor?.trim() || (isDark ? "#ffffff" : `var(--lp-accent, ${ACCENT_FALLBACK})`);
  const ctaBg = st.ctaBg?.trim() || `var(--lp-accent, ${ACCENT_FALLBACK})`;
  const ctaText = st.ctaTextColor?.trim() || "#ffffff";

  const announcementBar = announcement ? (
    <div
      className="text-center text-[11px] sm:text-xs"
      style={{
        background: isDark
          ? "linear-gradient(90deg, #6366f1, #ec4899)"
          : "linear-gradient(90deg, #eef2ff, #fdf4ff, #fff1f2)",
        color: isDark ? "#ffffff" : "#312e81",
      }}
    >
      <a
        href={c.announcementHref || "#"}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 font-medium hover:opacity-90 sm:gap-2 sm:px-4 sm:py-2"
      >
        <Sparkles className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" aria-hidden />
        <span className="line-clamp-1">{highlightDynamicTags(announcement)}</span>
        <ArrowRight className="h-3 w-3 shrink-0" aria-hidden />
      </a>
    </div>
  ) : null;

  const loginLink = c.loginLabel?.trim() ? (
    <a
      href={c.loginHref || "#"}
      className="text-sm font-medium transition hover:opacity-80"
      style={{ color: linkClr }}
    >
      {c.loginLabel}
    </a>
  ) : null;

  const ctaLink = c.signUpLabel?.trim() ? (
    <a
      href={c.signUpHref || "#"}
      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition hover:scale-[1.02]"
      style={{ background: ctaBg, color: ctaText }}
    >
      <span className="whitespace-nowrap">{c.signUpLabel}</span>
      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
    </a>
  ) : null;

  const linksList = (className?: string) => (
    <nav className={cn("flex items-center gap-x-7 gap-y-2 text-sm font-medium", className)} style={{ color: linkClr }}>
      {links.map((link, i) => (
        <a
          key={i}
          href={link.href || "#"}
          className="whitespace-nowrap opacity-80 transition hover:opacity-100"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );

  const logoNode = (
    <div className="shrink-0">
      <BrandLogoTextOrImage
        logoMode={c.logoMode}
        logoText={c.logoText}
        logoImageSrc={c.logoImageSrc}
        textClassName="text-lg font-bold tracking-tight md:text-xl"
        textStyle={{ color: logoClr }}
        imageClassName={cn(
          "h-8 w-auto max-w-[160px] object-contain object-left md:h-9 md:max-w-[200px]",
          isDark && "brightness-0 invert"
        )}
      />
    </div>
  );

  // Mobile menu toggle — visible only on mobile, hidden on desktop
  const hamburger = (links.length > 0 || c.loginLabel?.trim() || c.signUpLabel?.trim()) ? (
    <button
      type="button"
      aria-label={menuOpen ? "Close menu" : "Open menu"}
      aria-expanded={menuOpen}
      onClick={() => setMenuOpen((v) => !v)}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition md:hidden",
        isDark
          ? "border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]"
          : "border-black/[0.08] bg-white/70 text-slate-700 hover:bg-white"
      )}
    >
      {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
    </button>
  ) : null;

  // Mobile drawer panel (rendered once, conditionally visible)
  const mobileDrawer = (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 top-0 z-[60] flex flex-col md:hidden",
        menuOpen ? "" : "pointer-events-none"
      )}
      aria-hidden={!menuOpen}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200",
          menuOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={closeMenu}
      />
      <div
        className={cn(
          "relative ml-auto flex h-full w-[min(92vw,360px)] flex-col overflow-y-auto shadow-2xl transition-transform duration-300 ease-out",
          menuOpen ? "translate-x-0" : "translate-x-full",
          isDark ? "bg-[#0b1220] text-slate-200" : "bg-white text-slate-800"
        )}
      >
        <div className={cn("flex items-center justify-between border-b px-5 py-4", isDark ? "border-white/[0.08]" : "border-black/[0.06]")}>
          <BrandLogoTextOrImage
            logoMode={c.logoMode}
            logoText={c.logoText}
            logoImageSrc={c.logoImageSrc}
            textClassName="text-lg font-bold tracking-tight"
            textStyle={{ color: logoClr }}
            imageClassName={cn("h-8 w-auto max-w-[160px] object-contain object-left", isDark && "brightness-0 invert")}
          />
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMenu}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-xl border transition",
              isDark ? "border-white/15 hover:bg-white/[0.08]" : "border-black/[0.08] hover:bg-slate-50"
            )}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {links.map((link, i) => (
            <a
              key={i}
              href={link.href || "#"}
              onClick={closeMenu}
              className={cn(
                "rounded-xl px-3 py-3 text-base font-semibold transition",
                isDark ? "text-white hover:bg-white/[0.06]" : "text-slate-900 hover:bg-slate-50"
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className={cn("border-t p-4 space-y-3", isDark ? "border-white/[0.08]" : "border-black/[0.06]")}>
          {c.loginLabel?.trim() ? (
            <a
              href={c.loginHref || "#"}
              onClick={closeMenu}
              className={cn(
                "block w-full rounded-xl border px-4 py-3 text-center text-sm font-semibold transition",
                isDark ? "border-white/15 text-white hover:bg-white/[0.06]" : "border-black/[0.08] text-slate-800 hover:bg-slate-50"
              )}
            >
              {c.loginLabel}
            </a>
          ) : null}
          {c.signUpLabel?.trim() ? (
            <a
              href={c.signUpHref || "#"}
              onClick={closeMenu}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-md transition hover:scale-[1.01]"
              style={{ background: ctaBg, color: ctaText }}
            >
              {c.signUpLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (variant === "centered-pill") {
    return (
      <>
        <header
          className={cn("z-40", sticky && "sticky top-0")}
          style={{ ...layoutToStyle(l) }}
        >
          {announcementBar}
          <div className="flex w-full justify-center px-3 py-3 sm:px-4">
            <div
              className={cn(
                "flex w-full max-w-5xl items-center justify-between gap-3 rounded-full border px-3 py-2 shadow-lg sm:gap-6 sm:px-4",
                blur && "backdrop-blur-xl",
                isDark ? "border-white/10" : "border-black/[0.06]"
              )}
              style={{ background: bgFromTone }}
            >
              {logoNode}
              {linksList("hidden md:flex md:flex-1 md:justify-center")}
              <div className="hidden items-center gap-2 md:flex">
                {loginLink}
                {ctaLink}
              </div>
              {hamburger}
            </div>
          </div>
        </header>
        {mobileDrawer}
      </>
    );
  }

  if (variant === "compact") {
    return (
      <>
        <header
          className={cn("z-40 border-b", sticky && "sticky top-0", blur && "backdrop-blur-xl", isDark ? "border-white/[0.08]" : "border-black/[0.06]")}
          style={{ ...layoutToStyle(l), background: bgFromTone }}
        >
          {announcementBar}
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-6">
            {logoNode}
            {linksList("hidden md:flex")}
            <div className="hidden items-center gap-3 md:flex">
              {loginLink}
              {ctaLink}
            </div>
            {hamburger}
          </div>
        </header>
        {mobileDrawer}
      </>
    );
  }

  if (variant === "docs-style") {
    return (
      <>
        <header
          className={cn("z-40 border-b border-white/[0.08]", sticky && "sticky top-0", blur && "backdrop-blur-xl")}
          style={{
            ...layoutToStyle(l),
            background: st.customBg?.trim() || "rgba(11,18,32,0.78)",
          }}
        >
          {announcementBar}
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 md:py-4">
            <div className="flex min-w-0 items-center gap-6">
              <BrandLogoTextOrImage
                logoMode={c.logoMode}
                logoText={c.logoText}
                logoImageSrc={c.logoImageSrc}
                textClassName="text-lg font-bold tracking-tight text-white md:text-xl"
                imageClassName="h-8 w-auto max-w-[160px] object-contain object-left brightness-0 invert md:h-9 md:max-w-[200px]"
              />
              {linksList("hidden md:flex text-slate-300")}
            </div>
            <div className="hidden items-center gap-4 md:flex">
              <a href={c.loginHref || "#"} className="text-sm font-medium text-slate-300 hover:text-white">
                {c.loginLabel}
              </a>
              <a
                href={c.signUpHref || "#"}
                className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white hover:bg-white/[0.08]"
              >
                {c.signUpLabel}
                <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
              </a>
            </div>
            {hamburger}
          </div>
        </header>
        {mobileDrawer}
      </>
    );
  }

  /* marketing-full (default) — three-column rail */
  return (
    <>
      <header
        className={cn("z-40 border-b", sticky && "sticky top-0", blur && "backdrop-blur-xl", isDark ? "border-white/[0.08]" : "border-black/[0.06]")}
        style={{ ...layoutToStyle(l), background: bgFromTone }}
      >
        {announcementBar}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:gap-4 md:py-4">
          {logoNode}
          {linksList("hidden md:flex md:flex-1 md:justify-center")}
          <div className="hidden items-center gap-3 md:flex">
            {loginLink}
            {ctaLink}
          </div>
          {hamburger}
        </div>
      </header>
      {mobileDrawer}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Block 2: Hero (Split / Stacked / Bold-CTA / Spotlight)                     */
/* -------------------------------------------------------------------------- */

const heroSplitBlock: Config["components"][string] = {
  label: "Hero",
  fields: {
    content: {
      type: "object",
      label: "Content",
      objectFields: {
        designVariant: { type: "text", label: "Layout preset", visible: false },
        eyebrow: puckBindingTextField("Eyebrow chip (optional)"),
        title: puckBindingTextField("Headline"),
        titleAccent: puckBindingTextField("Accent word (highlighted in headline)"),
        subtitle: puckBindingTextareaField("Subtext"),
        primaryLabel: puckBindingTextField("Primary button"),
        primaryHref: puckBindingTextField("Primary URL"),
        secondaryLabel: puckBindingTextField("Secondary label"),
        secondaryHref: puckBindingTextField("Secondary URL"),
        trustLine: puckBindingTextField("Trust line (e.g. ★★★★★ 1,200+ teams)"),
        avatars: {
          type: "array",
          label: "Trust avatars (optional)",
          arrayFields: { src: puckImageSrcField("Image URL") },
          defaultItemProps: { src: "" },
          getItemSummary: (_i, idx) => `Avatar ${(idx ?? 0) + 1}`,
        },
        imageSrc: puckImageSrcField("Hero image URL"),
        imageAlt: puckBindingTextField("Image alt"),
        floatCardTitle: puckBindingTextField("Floating card — title"),
        floatCardSubtitle: puckBindingTextField("Floating card — subtitle"),
      },
    },
    style: {
      type: "object",
      label: "Style",
      objectFields: {
        sectionHeader: puckStyleHeadingField("Section background"),
        tone: toneField,
        decoration: puckPresetField("Decoration", [
          { value: "mesh", label: "Mesh blur" },
          { value: "grid", label: "Grid lines" },
          { value: "dots", label: "Dot grid" },
          { value: "spotlight", label: "Spotlight" },
          { value: "lines", label: "Diagonal" },
          { value: "none", label: "None" },
        ]),
        meshFrom: puckColorPickerField("Mesh tint A"),
        meshVia: puckColorPickerField("Mesh tint B"),
        meshTo: puckColorPickerField("Mesh tint C"),
        textHeader: puckStyleHeadingField("Text"),
        titleColor: puckColorPickerField("Title color"),
        titleAccentColor: puckColorPickerField("Accent word color"),
        subtitleColor: puckColorPickerField("Subtitle color"),
        primaryCtaHeader: puckStyleHeadingField("Primary CTA"),
        buttonBg: puckColorPickerField("Background"),
        buttonTextColor: puckColorPickerField("Text color"),
        buttonShadow: shadowPresetField,
        buttonRadius: radiusPresetField,
        secondaryCtaHeader: puckStyleHeadingField("Secondary CTA"),
        secondaryButtonBg: puckColorPickerField("Background"),
        secondaryButtonTextColor: puckColorPickerField("Text color"),
        secondaryButtonBorderColor: puckColorPickerField("Border color"),
        mediaHeader: puckStyleHeadingField("Media"),
        imageRadiusPx: puckRangeSliderField("Image corner radius", { min: 0, max: 48, step: 1, suffix: " px" }),
        imageWidthPx: puckRangeSliderField("Image max width", { min: 220, max: 900, step: 10, suffix: " px" }),
        imageHeightPx: puckRangeSliderField("Image height", { min: 220, max: 900, step: 10, suffix: " px" }),
        layoutHeader: puckStyleHeadingField("Layout"),
        containerWidth: containerPresetField,
      },
    },
    ...sharedLayoutField,
  },
  defaultProps: {
    content: {
      eyebrow: "New · Lumen 2.0",
      title: "Ship work your team actually loves.",
      titleAccent: "loves",
      subtitle:
        "One workspace for briefs, reviews, and launches — built for marketing teams that want clarity without the bloat.",
      primaryLabel: "Start free",
      primaryHref: "#",
      secondaryLabel: "Watch demo",
      secondaryHref: "#",
      trustLine: "Loved by 12,000+ teams · 4.9/5 average rating",
      avatars: [{ src: "" }, { src: "" }, { src: "" }, { src: "" }],
      imageSrc: "",
      imageAlt: "Product screenshot",
      floatCardTitle: "+248 signups today",
      floatCardSubtitle: "Live workspace activity",
      designVariant: "split-asymmetric",
    },
    style: {
      tone: "gradient",
      decoration: "mesh",
      meshFrom: "#a5b4fc",
      meshVia: "#f0abfc",
      meshTo: "#fda4af",
      titleColor: "",
      titleAccentColor: "",
      subtitleColor: "",
      buttonBg: "",
      buttonTextColor: "",
      buttonShadow: "glow",
      buttonRadius: "pill",
      secondaryButtonBg: "",
      secondaryButtonTextColor: "",
      secondaryButtonBorderColor: "",
      imageRadiusPx: "20",
      imageWidthPx: "560",
      imageHeightPx: "640",
      containerWidth: "wide",
    },
    layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "96px", paddingBottom: "96px" },
  },
  render: ({ content, style, layout }) => {
    const c = (content || {}) as Record<string, string | undefined> & {
      avatars?: Array<{ src?: string }>;
    };
    const st = (style || {}) as Record<string, string>;
    const l = (layout || {}) as Record<string, string>;
    const variant = dv(c as { designVariant?: string }, "split-asymmetric");
    const tone = (st.tone || "gradient") as SectionTone;
    const decoration = (st.decoration || "mesh") as
      | "none"
      | "mesh"
      | "grid"
      | "dots"
      | "noise"
      | "lines"
      | "spotlight";
    const isDark = tone === "dark";

    const radius = radiusPresetToPx(st.buttonRadius, 12);
    const imageRadius = toPx(st.imageRadiusPx, 20);
    const imageWidth = toPx(st.imageWidthPx, 560);
    const imageHeight = toPx(st.imageHeightPx, 640);

    const titleAccent = (c.titleAccent || "").trim();
    const titleAccentColor =
      st.titleAccentColor?.trim() ||
      `linear-gradient(135deg, var(--lp-accent, ${ACCENT_FALLBACK}), ${ACCENT_FALLBACK_2}, ${ACCENT_FALLBACK_3})`;

    const renderTitle = (raw: string | undefined): React.ReactNode => {
      const text = raw ?? "";
      if (!titleAccent || !text.toLowerCase().includes(titleAccent.toLowerCase())) {
        return highlightDynamicTags(text);
      }
      const idx = text.toLowerCase().indexOf(titleAccent.toLowerCase());
      const before = text.slice(0, idx);
      const match = text.slice(idx, idx + titleAccent.length);
      const after = text.slice(idx + titleAccent.length);
      const accentEl = st.titleAccentColor?.trim() ? (
        <span style={{ color: st.titleAccentColor }}>{match}</span>
      ) : (
        <span
          className="bg-clip-text text-transparent"
          style={{ backgroundImage: titleAccentColor as string }}
        >
          {match}
        </span>
      );
      return (
        <>
          {highlightDynamicTags(before)}
          {accentEl}
          {highlightDynamicTags(after)}
        </>
      );
    };

    const primaryStyle = premiumButtonStyle({
      bg: st.buttonBg,
      fg: st.buttonTextColor,
      shadow: st.buttonShadow || "glow",
      radiusPx: radius,
    });

    const secondaryStyle: React.CSSProperties = {
      ...ghostButtonStyle({
        borderColor: st.secondaryButtonBorderColor || (isDark ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.16)"),
        color: st.secondaryButtonTextColor || (isDark ? "#ffffff" : undefined),
        radiusPx: radius,
      }),
      background: st.secondaryButtonBg?.trim() || "transparent",
    };

    const trustRow = (c.trustLine?.trim() || (c.avatars && c.avatars.some((a) => a?.src?.trim()))) ? (
      <div className="mt-8 flex flex-wrap items-center gap-4">
        {c.avatars && c.avatars.length ? (
          <AvatarStack
            sources={c.avatars.map((a) => a?.src)}
            size={36}
            borderColor={isDark ? "#0b1220" : "#ffffff"}
          />
        ) : null}
        {c.trustLine?.trim() ? (
          <p
            className="text-sm font-medium"
            style={{ color: isDark ? "#cbd5e1" : "var(--lp-muted, #475569)" }}
          >
            {highlightDynamicTags(c.trustLine)}
          </p>
        ) : null}
      </div>
    ) : null;

    const ctaRow = (c.primaryLabel?.trim() || c.secondaryLabel?.trim()) ? (
      <div className="mt-8 flex flex-wrap items-center gap-3">
        {c.primaryLabel?.trim() ? (
          <a
            href={c.primaryHref || "#"}
            className="group inline-flex items-center justify-center px-6 py-3 text-sm font-semibold transition hover:scale-[1.02]"
            style={primaryStyle}
          >
            {highlightDynamicTags(c.primaryLabel)}
            <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
          </a>
        ) : null}
        {c.secondaryLabel?.trim() ? (
          <a
            href={c.secondaryHref || "#"}
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold transition hover:bg-black/[0.04]"
            style={secondaryStyle}
          >
            <Play className="mr-2 h-3.5 w-3.5 fill-current" aria-hidden />
            {highlightDynamicTags(c.secondaryLabel)}
          </a>
        ) : null}
      </div>
    ) : null;

    const eyebrow = c.eyebrow?.trim() ? (
      <EyebrowChip tone={isDark ? "dark" : "light"}>{highlightDynamicTags(c.eyebrow)}</EyebrowChip>
    ) : null;

    const headline = (
      <h1
        className="text-balance text-4xl font-bold leading-[1.04] tracking-tight md:text-5xl lg:text-[3.5rem] lg:leading-[1.02]"
        style={{ color: st.titleColor?.trim() || (isDark ? "#ffffff" : headingVar()) }}
      >
        {renderTitle(c.title)}
      </h1>
    );

    const subtitle = c.subtitle?.trim() ? (
      <p
        className="mt-5 max-w-xl text-base leading-relaxed md:text-lg"
        style={{ color: st.subtitleColor?.trim() || (isDark ? "#cbd5e1" : mutedVar()) }}
      >
        {highlightDynamicTags(c.subtitle)}
      </p>
    ) : null;

    const mediaBlock = (showFloat: boolean) => (
      <div className="relative mx-auto w-full" style={{ maxWidth: imageWidth }}>
        <div
          className="relative overflow-hidden rounded-[inherit] shadow-2xl ring-1 ring-black/5"
          style={{ borderRadius: imageRadius, height: imageHeight, background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)" }}
        >
          <SafeImage
            src={c.imageSrc}
            alt={c.imageAlt || "Product hero"}
            role="photo"
            className="h-full w-full object-cover"
            fallbackClassName="h-full w-full"
            style={{ borderRadius: imageRadius }}
            loading="eager"
          />
        </div>
        {showFloat && (c.floatCardTitle?.trim() || c.floatCardSubtitle?.trim()) ? (
          <div
            className="absolute -left-5 bottom-12 z-[2] flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-2xl"
            style={{ color: "var(--lp-muted, #475569)" }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: `linear-gradient(135deg, ${ACCENT_FALLBACK}, ${ACCENT_FALLBACK_2})` }}
            >
              <Zap className="h-4 w-4 text-white" aria-hidden />
            </div>
            <div className="text-xs">
              <div className="font-bold" style={{ color: headingVar() }}>{highlightDynamicTags(c.floatCardTitle)}</div>
              <div>{highlightDynamicTags(c.floatCardSubtitle)}</div>
            </div>
          </div>
        ) : null}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-6 z-[1] h-24 w-24 rounded-full blur-2xl"
          style={{ background: `radial-gradient(circle, ${ACCENT_FALLBACK_2}66, transparent 70%)` }}
        />
      </div>
    );

    const innerContent =
      variant === "stacked-center" ? (
        <div className="text-center">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5">
            {eyebrow}
            {headline}
            {subtitle ? <div className="mx-auto">{subtitle}</div> : null}
            <div className="mt-2 flex justify-center">{ctaRow}</div>
            {trustRow}
          </div>
          {c.imageSrc?.trim() ? (
            <div className="mx-auto mt-16 max-w-4xl">
              {mediaBlock(false)}
            </div>
          ) : null}
        </div>
      ) : variant === "spotlight" ? (
        <div className="text-center">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5">
            {eyebrow}
            {headline}
            {subtitle ? <div className="mx-auto">{subtitle}</div> : null}
            <div className="mt-2 flex justify-center">{ctaRow}</div>
            {trustRow}
          </div>
        </div>
      ) : variant === "media-first" ? (
        <div className={cn("grid items-center gap-12 lg:gap-16", c.imageSrc?.trim() ? "md:grid-cols-2" : "")}>
          {c.imageSrc?.trim() ? <div className="md:order-1">{mediaBlock(true)}</div> : null}
          <div className="md:order-2">
            {eyebrow}
            <div className="mt-5">{headline}</div>
            {subtitle}
            {ctaRow}
            {trustRow}
          </div>
        </div>
      ) : (
        /* split-asymmetric (default) */
        <div className={cn("grid items-center gap-12 lg:gap-16", c.imageSrc?.trim() ? "md:grid-cols-[1.05fr_0.95fr]" : "")}>
          <div>
            {eyebrow}
            <div className="mt-5">{headline}</div>
            {subtitle}
            {ctaRow}
            {trustRow}
          </div>
          {c.imageSrc?.trim() ? mediaBlock(true) : null}
        </div>
      );

    const customMeshBg =
      decoration === "mesh"
        ? (
          <GradientMesh
            from={st.meshFrom?.trim()}
            via={st.meshVia?.trim()}
            to={st.meshTo?.trim()}
            intensity={tone === "dark" ? "soft" : "medium"}
          />
        )
        : null;

    return (
      <section
        className="relative isolate overflow-hidden"
        style={{
          ...layoutToStyle(l),
          background:
            tone === "dark"
              ? "#070a16"
              : tone === "muted"
                ? "#f6f7fb"
                : tone === "light"
                  ? "#ffffff"
                  : "linear-gradient(160deg, #eef2ff 0%, #faf5ff 50%, #fff1f2 100%)",
          color: isDark ? "#e2e8f0" : undefined,
        }}
      >
        {customMeshBg}
        {decoration === "grid" ? <GridLines color={isDark ? "rgba(148,163,184,0.07)" : "rgba(15,23,42,0.06)"} /> : null}
        {decoration === "dots" ? <DotGrid color={isDark ? "rgba(148,163,184,0.18)" : "rgba(15,23,42,0.08)"} /> : null}
        {decoration === "noise" ? <NoiseOverlay /> : null}
        {decoration === "spotlight" ? (
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 left-1/2 h-[44rem] w-[44rem] -translate-x-1/2 rounded-full blur-[140px]"
            style={{ background: `radial-gradient(circle, ${ACCENT_FALLBACK}3a 0%, transparent 65%)` }}
          />
        ) : null}
        {decoration === "lines" ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(135deg, ${isDark ? "rgba(148,163,184,0.07)" : "rgba(15,23,42,0.04)"} 0 2px, transparent 2px 24px)`,
            }}
          />
        ) : null}

        <div
          className="relative mx-auto px-4 md:px-8"
          style={{ maxWidth: containerMaxWidthPx(st.containerWidth) }}
        >
          {innerContent}
        </div>
      </section>
    );
  },
};

/* -------------------------------------------------------------------------- */
/*  Block 3: Logo cloud (marquee / grid / pill)                                */
/* -------------------------------------------------------------------------- */

const logoCloudBlock: Config["components"][string] = {
  label: "Logo cloud",
  fields: {
    content: {
      type: "object",
      label: "Content",
      objectFields: {
        designVariant: { type: "text", label: "Layout preset", visible: false },
        eyebrow: puckBindingTextField("Eyebrow chip (optional)"),
        heading: puckBindingTextField("Heading"),
        logos: {
          type: "array",
          label: "Logos",
          arrayFields: {
            name: { type: "text", label: "Company / label" },
            imageSrc: puckImageSrcField("Logo image URL (optional)"),
            href: { type: "text", label: "Link (optional)" },
          },
          defaultItemProps: { name: "Partner", imageSrc: "", href: "" },
          getItemSummary: (item) => item.name || "Logo",
        },
      },
    },
    style: {
      type: "object",
      label: "Style",
      objectFields: {
        sectionHeader: puckStyleHeadingField("Section background"),
        tone: toneField,
        bg: { type: "text", label: "Custom background" },
        textHeader: puckStyleHeadingField("Heading"),
        headingColor: puckColorPickerField("Heading color"),
        layoutHeader: puckStyleHeadingField("Layout"),
        containerWidth: containerPresetField,
        marqueeSpeed: puckRangeSliderField("Marquee speed (sec/loop)", { min: 12, max: 80, step: 2, suffix: "s" }),
      },
    },
    ...sharedLayoutField,
  },
  defaultProps: {
    content: {
      eyebrow: "Trusted by",
      heading: "More than 25,000 teams ship faster with Lumen.",
      logos: [
        { name: "Stripe", imageSrc: "", href: "" },
        { name: "Linear", imageSrc: "", href: "" },
        { name: "Notion", imageSrc: "", href: "" },
        { name: "Vercel", imageSrc: "", href: "" },
        { name: "Figma", imageSrc: "", href: "" },
        { name: "HubSpot", imageSrc: "", href: "" },
        { name: "Ramp", imageSrc: "", href: "" },
      ],
      designVariant: "marquee",
    },
    style: {
      tone: "muted",
      bg: "",
      headingColor: "",
      containerWidth: "wide",
      marqueeSpeed: "40",
    },
    layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "56px", paddingBottom: "56px" },
  },
  render: ({ content, style, layout }) => {
    const c = (content || {}) as {
      designVariant?: string;
      eyebrow?: string;
      heading?: string;
      logos?: Array<{ name?: string; imageSrc?: string; href?: string }>;
    };
    const st = (style || {}) as Record<string, string>;
    const l = (layout || {}) as Record<string, string>;
    const logos = Array.isArray(c.logos) ? c.logos : [];
    const variant = dv(c, "marquee");
    const tone = (st.tone || "muted") as SectionTone;
    const isDark = tone === "dark";
    const speed = toPx(st.marqueeSpeed, 40);

    const LogoLabel = ({ logo, large }: { logo: { name?: string; imageSrc?: string }; large?: boolean }) => {
      const [imgFailed, setImgFailed] = React.useState(false);
      React.useEffect(() => {
        setImgFailed(false);
      }, [logo.imageSrc]);

      const trimmed = logo.imageSrc?.trim() ?? "";
      const isUsable = trimmed && !/\{\{/.test(trimmed);
      if (isUsable && !imgFailed) {
        return (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={trimmed}
            alt={logo.name || "Partner logo"}
            className={cn(
              "object-contain transition",
              large ? "h-9 max-w-[150px] md:h-10" : "h-8 max-w-[130px] md:h-9",
              isDark ? "brightness-0 invert opacity-80 hover:opacity-100" : "opacity-70 grayscale hover:grayscale-0 hover:opacity-100"
            )}
            onError={() => setImgFailed(true)}
          />
        );
      }
      return (
        <span
          className={cn(
            "whitespace-nowrap text-base font-semibold tracking-tight transition",
            large ? "text-lg md:text-xl" : "text-base md:text-lg",
            isDark ? "text-white/65 hover:text-white" : "text-slate-500/80 hover:text-slate-900"
          )}
        >
          {logo.name?.trim() || "Sample"}
        </span>
      );
    };
    const logoLabel = (logo: { name?: string; imageSrc?: string }, large?: boolean) => (
      <LogoLabel logo={logo} large={large} />
    );

    const eyebrowText = c.eyebrow?.trim();
    const headingText = c.heading?.trim();

    const head = headingText || eyebrowText ? (
      <div className={cn("mb-10 flex flex-col items-center gap-3 text-center", variant === "enterprise" && "items-start text-left")}>
        {eyebrowText ? <EyebrowChip tone={isDark ? "dark" : "light"}>{highlightDynamicTags(eyebrowText)}</EyebrowChip> : null}
        {headingText ? (
          <h2
            className={cn(
              "max-w-3xl text-balance text-xl font-semibold tracking-tight md:text-2xl",
              variant === "enterprise" && "text-2xl md:text-3xl"
            )}
            style={{ color: st.headingColor?.trim() || (isDark ? "#f8fafc" : headingVar()) }}
          >
            {highlightDynamicTags(headingText)}
          </h2>
        ) : null}
      </div>
    ) : null;

    const sectionWrapper = (children: React.ReactNode) => (
      <PremiumSection
        tone={tone}
        bg={st.bg}
        decoration="none"
        layout={l}
        containerWidth={st.containerWidth || "wide"}
      >
        {children}
      </PremiumSection>
    );

    if (variant === "marquee") {
      return sectionWrapper(
        <>
          {head}
          <Marquee speed={speed}>
            {logos.map((logo, i) => (
              <div key={i} className="flex h-10 shrink-0 items-center justify-center px-2">
                {logo.href?.trim() ? (
                  <a href={logo.href} className="block">{logoLabel(logo, true)}</a>
                ) : (
                  logoLabel(logo, true)
                )}
              </div>
            ))}
          </Marquee>
        </>
      );
    }

    if (variant === "enterprise") {
      return sectionWrapper(
        <>
          {head}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {logos.map((logo, i) => (
              <a
                key={i}
                href={logo.href || "#"}
                className={cn(
                  "group flex min-h-[88px] items-center justify-center rounded-2xl border px-4 py-6 transition hover:scale-[1.02]",
                  isDark ? "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]" : "border-black/[0.06] bg-white shadow-sm hover:shadow-md"
                )}
              >
                {logoLabel(logo, false)}
              </a>
            ))}
          </div>
        </>
      );
    }

    if (variant === "pill") {
      return sectionWrapper(
        <>
          {head}
          <div className={cn("mx-auto flex max-w-3xl flex-wrap items-center justify-center divide-x rounded-full border px-2 py-2 shadow-md", isDark ? "divide-white/10 border-white/10 bg-white/[0.04]" : "divide-black/[0.06] border-black/[0.06] bg-white")}>
            {logos.map((logo, i) => (
              <div key={i} className="flex items-center justify-center px-5 py-1">
                {logo.href?.trim() ? <a href={logo.href}>{logoLabel(logo, false)}</a> : logoLabel(logo, false)}
              </div>
            ))}
          </div>
        </>
      );
    }

    /* social-proof (legacy fallback) */
    return sectionWrapper(
      <>
        {head}
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {logos.map((logo, i) => (
            <div key={i}>
              {logo.href?.trim() ? <a href={logo.href}>{logoLabel(logo, false)}</a> : logoLabel(logo, false)}
            </div>
          ))}
        </div>
      </>
    );
  },
};

/* -------------------------------------------------------------------------- */
/*  Block 4: Support / value features                                          */
/* -------------------------------------------------------------------------- */

const supportFeaturesBlock: Config["components"][string] = {
  label: "Value + feature list",
  fields: {
    content: {
      type: "object",
      label: "Content",
      objectFields: {
        designVariant: { type: "text", label: "Layout preset", visible: false },
        eyebrow: puckBindingTextField("Eyebrow"),
        title: puckBindingTextField("Title"),
        body: puckBindingTextareaField("Body"),
        rating1Score: { type: "number", label: "Rating 1 (0–5)" },
        rating1Label: puckBindingTextField("Rating 1 label"),
        rating2Score: { type: "number", label: "Rating 2 (0–5)" },
        rating2Label: puckBindingTextField("Rating 2 label"),
        features: {
          type: "array",
          label: "Features",
          arrayFields: {
            title: { type: "text", label: "Title" },
            body: { type: "textarea", label: "Description" },
            icon: { type: "text", label: "Icon (emoji or letter)" },
            accent: puckColorPickerField("Icon tint"),
          },
          defaultItemProps: { title: "Publishing", body: "Ship updates everywhere.", icon: "📣", accent: "" },
          getItemSummary: (item) => item.title || "Feature",
        },
      },
    },
    style: {
      type: "object",
      label: "Style",
      objectFields: {
        sectionHeader: puckStyleHeadingField("Section background"),
        tone: toneField,
        bg: { type: "text", label: "Custom background" },
        decoration: puckPresetField("Decoration", [
          { value: "none", label: "None" },
          { value: "dots", label: "Dot grid" },
          { value: "grid", label: "Grid lines" },
          { value: "spotlight", label: "Spotlight" },
        ]),
        layoutHeader: puckStyleHeadingField("Layout"),
        containerWidth: containerPresetField,
        cardShadow: shadowPresetField,
      },
    },
    ...sharedLayoutField,
  },
  defaultProps: {
    content: {
      eyebrow: "Built for clarity",
      title: "Replace scattered docs with one source of truth.",
      body:
        "From kickoff briefs to launch retros — Lumen keeps every team aligned without endless meetings or messy spreadsheets.",
      rating1Score: 5,
      rating1Label: "4.9 / 5 · G2",
      rating2Score: 5,
      rating2Label: "4.8 / 5 · Capterra",
      features: [
        { title: "Live planning", body: "Drag-and-drop roadmaps that stay in sync with your product backlog.", icon: "🗺️", accent: "" },
        { title: "Smart automations", body: "Trigger updates across Slack, Linear, and HubSpot automatically.", icon: "⚡", accent: "" },
        { title: "Outcome dashboards", body: "Track what shipped and what moved revenue — in one view.", icon: "📊", accent: "" },
      ],
      designVariant: "three-pillars",
    },
    style: {
      tone: "light",
      bg: "",
      decoration: "none",
      containerWidth: "wide",
      cardShadow: "soft",
    },
    layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "96px", paddingBottom: "96px" },
  },
  render: ({ content, style, layout }) => {
    const c = (content || {}) as Record<string, unknown>;
    const st = (style || {}) as Record<string, string>;
    const l = (layout || {}) as Record<string, string>;
    const features = (Array.isArray(c.features) ? c.features : []) as Array<{
      title?: string;
      body?: string;
      icon?: string;
      accent?: string;
    }>;
    const r1 = Number(c.rating1Score) || 0;
    const r2 = Number(c.rating2Score) || 0;
    const variant = dv(c as { designVariant?: string }, "three-pillars");
    const tone = (st.tone || "light") as SectionTone;
    const isDark = tone === "dark";
    const decoration = (st.decoration || "none") as
      | "none"
      | "mesh"
      | "grid"
      | "dots"
      | "noise"
      | "lines"
      | "spotlight";

    const ratings = (
      <div className="flex flex-wrap gap-6">
        {(c.rating1Label || r1) ? (
          <div>
            <StarRating value={r1} />
            <p className="mt-1 text-sm font-semibold" style={{ color: isDark ? "#f8fafc" : headingVar() }}>
              {highlightDynamicTags(String(c.rating1Label ?? ""))}
            </p>
          </div>
        ) : null}
        {(c.rating2Label || r2) ? (
          <div>
            <StarRating value={r2} />
            <p className="mt-1 text-sm font-semibold" style={{ color: isDark ? "#f8fafc" : headingVar() }}>
              {highlightDynamicTags(String(c.rating2Label ?? ""))}
            </p>
          </div>
        ) : null}
      </div>
    );

    const eyebrow = c.eyebrow ? (
      <EyebrowChip tone={isDark ? "dark" : "light"}>{highlightDynamicTags(String(c.eyebrow))}</EyebrowChip>
    ) : null;

    const titleEl = (
      <h2
        className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.5rem] lg:leading-[1.05]"
        style={{ color: isDark ? "#ffffff" : headingVar() }}
      >
        {highlightDynamicTags(String(c.title ?? ""))}
      </h2>
    );

    const bodyEl = (
      <p className="max-w-xl text-base leading-relaxed md:text-lg" style={{ color: isDark ? "#cbd5e1" : mutedVar() }}>
        {highlightDynamicTags(String(c.body ?? ""))}
      </p>
    );

    const copyCol = (
      <div className="space-y-6">
        {eyebrow}
        {titleEl}
        {bodyEl}
        {ratings}
      </div>
    );

    const listCol = (
      <ul className="space-y-7">
        {features.map((f, i) => (
          <li key={i} className="flex gap-5">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl shadow-sm ring-1 ring-black/5"
              style={{
                background: f.accent?.trim() || `linear-gradient(135deg, ${ACCENT_FALLBACK}1f, ${ACCENT_FALLBACK_2}1f)`,
                color: isDark ? "#fff" : "#312e81",
              }}
            >
              {f.icon || "•"}
            </span>
            <div>
              <h3 className="font-semibold" style={{ color: isDark ? "#fff" : headingVar() }}>
                {f.title}
              </h3>
              <p className="mt-1 text-sm leading-relaxed" style={{ color: isDark ? "#94a3b8" : mutedVar() }}>
                {f.body}
              </p>
            </div>
          </li>
        ))}
      </ul>
    );

    if (variant === "two-features") {
      return (
        <PremiumSection tone={tone} bg={st.bg} decoration={decoration} layout={l} containerWidth={st.containerWidth || "wide"}>
          <div className="space-y-12">
            <div className="space-y-6">{copyCol}</div>
            <div className="grid gap-6 md:grid-cols-2">
              {features.map((f, i) => (
                <GradientBorderCard key={i} radius={20}>
                  <div className="p-7">
                    <span
                      className="inline-flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                      style={{
                        background: f.accent?.trim() || `linear-gradient(135deg, ${ACCENT_FALLBACK}1f, ${ACCENT_FALLBACK_2}1f)`,
                      }}
                    >
                      {f.icon || "✦"}
                    </span>
                    <h3 className="mt-5 text-lg font-semibold" style={{ color: headingVar() }}>
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: mutedVar() }}>
                      {f.body}
                    </p>
                  </div>
                </GradientBorderCard>
              ))}
            </div>
          </div>
        </PremiumSection>
      );
    }

    if (variant === "support-heavy") {
      return (
        <PremiumSection tone={tone} bg={st.bg} decoration={decoration} layout={l} containerWidth={st.containerWidth || "wide"}>
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <div className="md:order-1">{listCol}</div>
            <div className="md:order-2">{copyCol}</div>
          </div>
        </PremiumSection>
      );
    }

    /* three-pillars (default) */
    return (
      <PremiumSection tone={tone} bg={st.bg} decoration={decoration} layout={l} containerWidth={st.containerWidth || "wide"}>
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          {copyCol}
          {listCol}
        </div>
      </PremiumSection>
    );
  },
};

/* -------------------------------------------------------------------------- */
/*  Block 5: Feature grid (cards / bento / scroll rail)                        */
/* -------------------------------------------------------------------------- */

const featureGridBlock: Config["components"][string] = {
  label: "Feature grid",
  fields: {
    content: {
      type: "object",
      label: "Content",
      objectFields: {
        designVariant: { type: "text", label: "Layout preset", visible: false },
        eyebrow: puckBindingTextField("Eyebrow"),
        heading: puckBindingTextField("Heading"),
        description: puckBindingTextareaField("Description"),
        ctaLabel: puckBindingTextField("CTA label"),
        ctaHref: puckBindingTextField("CTA URL"),
        cards: {
          type: "array",
          label: "Cards",
          arrayFields: {
            title: { type: "text", label: "Title" },
            body: { type: "textarea", label: "Description" },
            icon: { type: "text", label: "Icon (emoji)" },
            tag: { type: "text", label: "Tag (optional)" },
            imageSrc: puckImageSrcField("Illustration URL (optional)"),
            accentColor: puckColorPickerField("Accent tint"),
            featured: {
              type: "radio",
              label: "Featured (large bento cell)",
              options: [
                { label: "No", value: "no" },
                { label: "Yes", value: "yes" },
              ],
            },
          },
          defaultItemProps: { title: "Collaboration", body: "Work together in real time.", icon: "🧩", tag: "", imageSrc: "", accentColor: "", featured: "no" },
          getItemSummary: (item) => item.title || "Card",
        },
      },
    },
    style: {
      type: "object",
      label: "Style",
      objectFields: {
        sectionHeader: puckStyleHeadingField("Section background"),
        tone: toneField,
        bg: { type: "text", label: "Custom background" },
        decoration: puckPresetField("Decoration", [
          { value: "none", label: "None" },
          { value: "dots", label: "Dot grid" },
          { value: "grid", label: "Grid lines" },
          { value: "spotlight", label: "Spotlight" },
          { value: "mesh", label: "Mesh" },
        ]),
        cardsHeader: puckStyleHeadingField("Cards"),
        cardBg: puckColorPickerField("Card background"),
        cardShadow: shadowPresetField,
        cardRadius: radiusPresetField,
        layoutHeader: puckStyleHeadingField("Layout"),
        containerWidth: containerPresetField,
      },
    },
    ...sharedLayoutField,
  },
  defaultProps: {
    content: {
      eyebrow: "What's inside",
      heading: "Everything you need to ship work that moves.",
      description: "Plan, collaborate, launch — without leaving your workspace.",
      ctaLabel: "Explore features",
      ctaHref: "#",
      cards: [
        { title: "Real-time collaboration", body: "Edit together with multi-cursor, threaded comments, and version history.", icon: "🤝", tag: "Live", imageSrc: "", accentColor: "", featured: "yes" },
        { title: "Intelligent automations", body: "Connect any tool with no-code workflows.", icon: "⚡", tag: "", imageSrc: "", accentColor: "", featured: "no" },
        { title: "Outcome analytics", body: "Track what's working in one dashboard.", icon: "📈", tag: "", imageSrc: "", accentColor: "", featured: "no" },
        { title: "Privacy first", body: "SOC2 + EU residency by default.", icon: "🔐", tag: "", imageSrc: "", accentColor: "", featured: "no" },
      ],
      designVariant: "bento",
    },
    style: {
      tone: "light",
      bg: "",
      decoration: "dots",
      cardBg: "",
      cardShadow: "soft",
      cardRadius: "round",
      containerWidth: "wide",
    },
    layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "96px", paddingBottom: "96px" },
  },
  render: ({ content, style, layout }) => {
    const c = (content || {}) as Record<string, unknown>;
    const st = (style || {}) as Record<string, string>;
    const l = (layout || {}) as Record<string, string>;
    const cards = (Array.isArray(c.cards) ? c.cards : []) as Array<{
      title?: string;
      body?: string;
      icon?: string;
      tag?: string;
      imageSrc?: string;
      accentColor?: string;
      featured?: string;
    }>;
    const variant = dv(c as { designVariant?: string }, "bento");
    const tone = (st.tone || "light") as SectionTone;
    const isDark = tone === "dark";
    const radius = radiusPresetToPx(st.cardRadius, 20);
    const decoration = (st.decoration || "none") as
      | "none"
      | "mesh"
      | "grid"
      | "dots"
      | "noise"
      | "lines"
      | "spotlight";

    const cardBg = st.cardBg?.trim() || (isDark ? "#111a2e" : "#ffffff");
    const cardShadowCss = shadowPresetToCss(st.cardShadow || "soft");

    const headerRow = (
      <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl space-y-4">
          {c.eyebrow ? <EyebrowChip tone={isDark ? "dark" : "light"}>{highlightDynamicTags(String(c.eyebrow))}</EyebrowChip> : null}
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.5rem]" style={{ color: isDark ? "#ffffff" : headingVar() }}>
            {highlightDynamicTags(String(c.heading ?? ""))}
          </h2>
          <p className="text-base leading-relaxed md:text-lg" style={{ color: isDark ? "#cbd5e1" : mutedVar() }}>
            {highlightDynamicTags(String(c.description ?? ""))}
          </p>
        </div>
        {String(c.ctaLabel ?? "").trim() ? (
          <a
            href={String(c.ctaHref ?? "#")}
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition hover:scale-[1.02]"
            style={premiumButtonStyle({ shadow: "soft", radiusPx: 9999 })}
          >
            {highlightDynamicTags(String(c.ctaLabel))}
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
          </a>
        ) : null}
      </div>
    );

    const cardInner = (card: typeof cards[number], featured: boolean) => {
      const trimmed = card.imageSrc?.trim() ?? "";
      const usable = trimmed && !/\{\{/.test(trimmed);
      return (
        <>
          {usable ? (
            <SafeImage
              src={trimmed}
              alt={card.title || "Feature illustration"}
              role="photo"
              className={cn("w-full object-cover", featured ? "h-64" : "h-44")}
              fallbackClassName={cn("w-full", featured ? "h-64" : "h-44")}
              showCaption={false}
            />
          ) : (
            <div
              className={cn("relative flex w-full items-center justify-center", featured ? "h-64" : "h-44")}
              style={{
                background:
                  card.accentColor?.trim() ||
                  `linear-gradient(135deg, ${ACCENT_FALLBACK}26 0%, ${ACCENT_FALLBACK_2}26 50%, ${ACCENT_FALLBACK_3}26 100%)`,
              }}
            >
              <span className={cn("text-5xl", featured && "text-7xl")}>{card.icon || "✦"}</span>
              <DotGrid color={isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)"} />
            </div>
          )}
        <div className={cn("flex flex-1 flex-col gap-2 p-6", featured && "p-8")}>
          {card.tag?.trim() ? (
            <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]", isDark ? "border-white/15 bg-white/[0.05] text-white" : "border-black/[0.06] bg-slate-50 text-slate-700")}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: accentVar() }} />
              {card.tag}
            </span>
          ) : null}
          <h3 className={cn("font-semibold", featured ? "text-2xl" : "text-lg")} style={{ color: isDark ? "#ffffff" : headingVar() }}>
            {card.title}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: isDark ? "#94a3b8" : mutedVar() }}>
            {card.body}
          </p>
        </div>
        </>
      );
    };

    if (variant === "scroll-rail") {
      return (
        <PremiumSection tone={tone} bg={st.bg} decoration={decoration} layout={l} containerWidth={st.containerWidth || "wide"}>
          {headerRow}
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 [scrollbar-width:thin]">
            {cards.map((card, i) => (
              <article
                key={i}
                className="flex min-w-[78%] shrink-0 snap-start flex-col overflow-hidden rounded-[var(--lp-radius)] border sm:min-w-[60%] md:min-w-[40%] lg:min-w-[30%]"
                style={{
                  ["--lp-radius" as string]: `${radius}px`,
                  background: cardBg,
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)",
                  boxShadow: cardShadowCss,
                }}
              >
                {cardInner(card, false)}
              </article>
            ))}
          </div>
        </PremiumSection>
      );
    }

    if (variant === "three-cards") {
      return (
        <PremiumSection tone={tone} bg={st.bg} decoration={decoration} layout={l} containerWidth={st.containerWidth || "wide"}>
          {headerRow}
          <div className="grid gap-6 md:grid-cols-3">
            {cards.map((card, i) => (
              <article
                key={i}
                className="flex flex-col overflow-hidden border transition hover:-translate-y-1"
                style={{
                  borderRadius: radius,
                  background: cardBg,
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)",
                  boxShadow: cardShadowCss,
                }}
              >
                {cardInner(card, false)}
              </article>
            ))}
          </div>
        </PremiumSection>
      );
    }

    /* bento (default) */
    return (
      <PremiumSection tone={tone} bg={st.bg} decoration={decoration} layout={l} containerWidth={st.containerWidth || "wide"}>
        {headerRow}
        <div className="grid auto-rows-[18rem] grid-cols-1 gap-6 md:grid-cols-3">
          {cards.map((card, i) => {
            const featured = card.featured === "yes";
            return (
              <article
                key={i}
                className={cn(
                  "flex flex-col overflow-hidden border transition hover:-translate-y-1",
                  featured && "md:col-span-2 md:row-span-2"
                )}
                style={{
                  borderRadius: radius,
                  background: cardBg,
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)",
                  boxShadow: cardShadowCss,
                }}
              >
                {cardInner(card, featured)}
              </article>
            );
          })}
        </div>
      </PremiumSection>
    );
  },
};

/* -------------------------------------------------------------------------- */
/*  Block 6: Benefits showcase                                                 */
/* -------------------------------------------------------------------------- */

const benefitsShowcaseBlock: Config["components"][string] = {
  label: "Benefits + image",
  fields: {
    content: {
      type: "object",
      label: "Content",
      objectFields: {
        designVariant: { type: "text", label: "Layout preset", visible: false },
        eyebrow: puckBindingTextField("Eyebrow"),
        title: puckBindingTextField("Title"),
        description: puckBindingTextareaField("Description"),
        items: {
          type: "array",
          label: "Benefits",
          arrayFields: {
            text: { type: "text", label: "Benefit headline" },
            body: { type: "text", label: "One-line description (optional)" },
          },
          defaultItemProps: { text: "Free white-glove onboarding", body: "" },
          getItemSummary: (item) => item.text || "Item",
        },
        imageSrc: puckImageSrcField("Image URL"),
        imageAlt: puckBindingTextField("Image alt"),
        overlayTitle: puckBindingTextField("Overlay — title"),
        overlayMetric: puckBindingTextField("Overlay — metric"),
        ctaLabel: puckBindingTextField("CTA label"),
        ctaHref: puckBindingTextField("CTA URL"),
      },
    },
    style: {
      type: "object",
      label: "Style",
      objectFields: {
        sectionHeader: puckStyleHeadingField("Section background"),
        tone: toneField,
        bg: { type: "text", label: "Custom background" },
        decoration: puckPresetField("Decoration", [
          { value: "none", label: "None" },
          { value: "dots", label: "Dot grid" },
          { value: "spotlight", label: "Spotlight" },
          { value: "mesh", label: "Mesh" },
        ]),
        layoutHeader: puckStyleHeadingField("Layout"),
        containerWidth: containerPresetField,
        imageRadiusPx: puckRangeSliderField("Image corner radius", { min: 0, max: 48, step: 1, suffix: " px" }),
      },
    },
    ...sharedLayoutField,
  },
  defaultProps: {
    content: {
      eyebrow: "Why teams stay",
      title: "The benefits add up — fast.",
      description: "We obsess over the small details that compound into great quarters.",
      items: [
        { text: "Onboarding concierge", body: "Migration help in your first 14 days." },
        { text: "24/7 humans on support", body: "No bots. No queues longer than 4 minutes." },
        { text: "Volume discounts", body: "Save more as your team scales." },
        { text: "Cancel any time", body: "Month-to-month. No lock-in." },
      ],
      imageSrc: "",
      imageAlt: "Workspace photo",
      overlayTitle: "MRR growth",
      overlayMetric: "+38% YoY",
      ctaLabel: "Talk to a human",
      ctaHref: "#",
      designVariant: "checklist-photo",
    },
    style: {
      tone: "light",
      bg: "",
      decoration: "none",
      containerWidth: "wide",
      imageRadiusPx: "20",
    },
    layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "96px", paddingBottom: "96px" },
  },
  render: ({ content, style, layout }) => {
    const c = (content || {}) as Record<string, unknown>;
    const st = (style || {}) as Record<string, string>;
    const l = (layout || {}) as Record<string, string>;
    const items = (Array.isArray(c.items) ? c.items : []) as Array<{ text?: string; body?: string }>;
    const variant = dv(c as { designVariant?: string }, "checklist-photo");
    const tone = (st.tone || "light") as SectionTone;
    const isDark = tone === "dark" || variant === "dark-focus";
    const decoration = (st.decoration || "none") as
      | "none"
      | "mesh"
      | "grid"
      | "dots"
      | "noise"
      | "lines"
      | "spotlight";
    const imageRadius = toPx(st.imageRadiusPx, 20);

    const checklist = (
      <ul className="space-y-5">
        {items.map((row, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-2 ring-white/10"
              style={{ background: `linear-gradient(135deg, ${ACCENT_FALLBACK}, ${ACCENT_FALLBACK_2})` }}
            >
              <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} aria-hidden />
            </span>
            <div>
              <span className="text-base font-semibold" style={{ color: isDark ? "#fff" : headingVar() }}>
                {highlightDynamicTags(row.text)}
              </span>
              {row.body?.trim() ? (
                <p className="text-sm" style={{ color: isDark ? "#94a3b8" : mutedVar() }}>
                  {highlightDynamicTags(row.body)}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    );

    const headerEl = (
      <div className="space-y-5">
        {c.eyebrow ? <EyebrowChip tone={isDark ? "dark" : "light"}>{highlightDynamicTags(String(c.eyebrow))}</EyebrowChip> : null}
        <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.5rem]" style={{ color: isDark ? "#fff" : headingVar() }}>
          {highlightDynamicTags(String(c.title ?? ""))}
        </h2>
        {c.description ? (
          <p className="text-base leading-relaxed md:text-lg" style={{ color: isDark ? "#cbd5e1" : mutedVar() }}>
            {highlightDynamicTags(String(c.description))}
          </p>
        ) : null}
      </div>
    );

    const ctaEl = String(c.ctaLabel ?? "").trim() ? (
      <a
        href={String(c.ctaHref ?? "#")}
        className="group mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-md transition hover:scale-[1.02]"
        style={premiumButtonStyle({ shadow: "glow", radiusPx: 9999 })}
      >
        {highlightDynamicTags(String(c.ctaLabel))}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
      </a>
    ) : null;

    const imageCol = (
      <div className="relative mx-auto w-full max-w-xl">
        <div
          className="overflow-hidden ring-1 ring-black/5"
          style={{ borderRadius: imageRadius, aspectRatio: "4 / 5" }}
        >
          <SafeImage
            src={String(c.imageSrc ?? "")}
            alt={String(c.imageAlt ?? "Sample image")}
            role="photo"
            className="h-full w-full object-cover shadow-2xl"
            fallbackClassName="h-full w-full"
          />
        </div>
        {(String(c.overlayTitle ?? "").trim() || String(c.overlayMetric ?? "").trim()) ? (
          <div className="absolute -bottom-6 left-4 flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-2xl">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: `linear-gradient(135deg, ${ACCENT_FALLBACK}, ${ACCENT_FALLBACK_2})` }}
            >
              <Star className="h-4 w-4 text-white" strokeWidth={2.4} aria-hidden />
            </div>
            <div>
              <div className="text-xs font-bold tracking-tight" style={{ color: headingVar() }}>
                {highlightDynamicTags(String(c.overlayTitle ?? ""))}
              </div>
              <div className="text-[11px]" style={{ color: mutedVar() }}>
                {highlightDynamicTags(String(c.overlayMetric ?? ""))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );

    if (variant === "dark-focus") {
      return (
        <PremiumSection tone="dark" decoration="spotlight" layout={l} containerWidth={st.containerWidth || "normal"}>
          <div className="mx-auto max-w-2xl text-center">
            {headerEl}
            <div className="mx-auto mt-10 max-w-md text-left">{checklist}</div>
            {ctaEl ? <div className="mt-8 flex justify-center">{ctaEl}</div> : null}
          </div>
        </PremiumSection>
      );
    }

    if (variant === "photo-first") {
      return (
        <PremiumSection tone={tone} bg={st.bg} decoration={decoration} layout={l} containerWidth={st.containerWidth || "wide"}>
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
            <div className="md:order-1">{imageCol}</div>
            <div className="md:order-2">
              {headerEl}
              <div className="mt-8">{checklist}</div>
              {ctaEl}
            </div>
          </div>
        </PremiumSection>
      );
    }

    /* checklist-photo (default) */
    return (
      <PremiumSection tone={tone} bg={st.bg} decoration={decoration} layout={l} containerWidth={st.containerWidth || "wide"}>
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <div>
            {headerEl}
            <div className="mt-8">{checklist}</div>
            {ctaEl}
          </div>
          {imageCol}
        </div>
      </PremiumSection>
    );
  },
};

/* -------------------------------------------------------------------------- */
/*  Block 7: Pricing                                                           */
/* -------------------------------------------------------------------------- */

const pricingPlansBlock: Config["components"][string] = {
  label: "Pricing",
  fields: {
    content: {
      type: "object",
      label: "Content",
      objectFields: {
        designVariant: { type: "text", label: "Layout preset", visible: false },
        eyebrow: puckBindingTextField("Eyebrow"),
        title: puckBindingTextField("Title"),
        subtitle: puckBindingTextareaField("Subtitle"),
        billingMode: {
          type: "radio",
          label: "Show prices for",
          options: [
            { label: "Monthly", value: "monthly" },
            { label: "Yearly", value: "yearly" },
          ],
        },
        plans: {
          type: "array",
          label: "Plans",
          arrayFields: {
            name: { type: "text", label: "Plan name" },
            tagline: { type: "text", label: "Tagline" },
            priceMonthly: { type: "text", label: "Price (monthly)" },
            priceYearly: { type: "text", label: "Price (yearly)" },
            priceNote: { type: "text", label: "Suffix (e.g. /user · billed yearly)" },
            highlighted: {
              type: "radio",
              label: "Highlight card",
              options: [
                { label: "No", value: "no" },
                { label: "Yes", value: "yes" },
              ],
            },
            badge: { type: "text", label: "Highlight badge label" },
            features: {
              type: "array",
              label: "Features",
              arrayFields: {
                line: { type: "text", label: "Line" },
                muted: {
                  type: "radio",
                  label: "Muted",
                  options: [
                    { label: "No", value: "no" },
                    { label: "Yes", value: "yes" },
                  ],
                },
              },
              defaultItemProps: { line: "Feature", muted: "no" },
              getItemSummary: (item) => item.line || "Feature",
            },
            ctaLabel: { type: "text", label: "Button label" },
            ctaHref: { type: "text", label: "Button URL" },
          },
          defaultItemProps: {
            name: "Pro",
            tagline: "For growing teams",
            priceMonthly: "$19",
            priceYearly: "$190",
            priceNote: "/mo",
            highlighted: "no",
            badge: "Most popular",
            features: [{ line: "Unlimited projects", muted: "no" }, { line: "Analytics", muted: "no" }],
            ctaLabel: "Get started",
            ctaHref: "#",
          },
          getItemSummary: (item) => item.name || "Plan",
        },
      },
    },
    style: {
      type: "object",
      label: "Style",
      objectFields: {
        sectionHeader: puckStyleHeadingField("Section background"),
        tone: toneField,
        bg: { type: "text", label: "Custom background" },
        decoration: puckPresetField("Decoration", [
          { value: "none", label: "None" },
          { value: "dots", label: "Dot grid" },
          { value: "grid", label: "Grid lines" },
          { value: "spotlight", label: "Spotlight" },
        ]),
        highlightHeader: puckStyleHeadingField("Highlighted plan"),
        highlightAccent: puckColorPickerField("Accent color"),
        highlightAccent2: puckColorPickerField("Accent gradient end"),
        layoutHeader: puckStyleHeadingField("Layout"),
        containerWidth: containerPresetField,
      },
    },
    ...sharedLayoutField,
  },
  defaultProps: {
    content: {
      eyebrow: "Pricing",
      title: "Pricing that scales with your team",
      subtitle: "Start free. Upgrade when your team needs more horsepower.",
      billingMode: "monthly",
      plans: [
        {
          name: "Free",
          tagline: "For builders",
          priceMonthly: "$0",
          priceYearly: "$0",
          priceNote: "/mo",
          highlighted: "no",
          badge: "",
          features: [
            { line: "Up to 3 projects", muted: "no" },
            { line: "Community support", muted: "no" },
            { line: "Basic analytics", muted: "no" },
          ],
          ctaLabel: "Start free",
          ctaHref: "#",
        },
        {
          name: "Pro",
          tagline: "For growing teams",
          priceMonthly: "$19",
          priceYearly: "$190",
          priceNote: "/mo",
          highlighted: "yes",
          badge: "Most popular",
          features: [
            { line: "Unlimited projects", muted: "no" },
            { line: "Priority support", muted: "no" },
            { line: "Advanced analytics", muted: "no" },
            { line: "Audit log", muted: "no" },
            { line: "API access", muted: "no" },
          ],
          ctaLabel: "Start trial",
          ctaHref: "#",
        },
        {
          name: "Business",
          tagline: "For scale",
          priceMonthly: "$49",
          priceYearly: "$490",
          priceNote: "/user · /mo",
          highlighted: "no",
          badge: "",
          features: [
            { line: "Everything in Pro", muted: "no" },
            { line: "SSO & SCIM", muted: "no" },
            { line: "Dedicated CSM", muted: "no" },
            { line: "99.99% SLA", muted: "no" },
          ],
          ctaLabel: "Contact sales",
          ctaHref: "#",
        },
      ],
      designVariant: "three-tier",
    },
    style: {
      tone: "muted",
      bg: "",
      decoration: "dots",
      highlightAccent: "",
      highlightAccent2: "",
      containerWidth: "wide",
    },
    layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "96px", paddingBottom: "96px" },
  },
  render: ({ content, style, layout }) => {
    const c = (content || {}) as Record<string, unknown>;
    const st = (style || {}) as Record<string, string>;
    const l = (layout || {}) as Record<string, string>;
    const plans = (Array.isArray(c.plans) ? c.plans : []) as Array<Plan>;
    const yearly = c.billingMode === "yearly";
    const variant = dv(c as { designVariant?: string }, "three-tier");
    const tone = (st.tone || "muted") as SectionTone;
    const isDark = tone === "dark";
    const decoration = (st.decoration || "none") as
      | "none"
      | "mesh"
      | "grid"
      | "dots"
      | "noise"
      | "lines"
      | "spotlight";

    type Plan = {
      name?: string;
      tagline?: string;
      priceMonthly?: string;
      priceYearly?: string;
      priceNote?: string;
      highlighted?: string;
      badge?: string;
      features?: Array<{ line?: string; muted?: string }>;
      ctaLabel?: string;
      ctaHref?: string;
    };

    const accent = st.highlightAccent?.trim() || `var(--lp-accent, ${ACCENT_FALLBACK})`;
    const accent2 = st.highlightAccent2?.trim() || ACCENT_FALLBACK_2;

    const planCard = (p: Plan, i: number) => {
      const hi = p.highlighted === "yes";
      const price = yearly ? p.priceYearly : p.priceMonthly;
      const feats = Array.isArray(p.features) ? p.features : [];
      return (
        <div
          key={i}
          className={cn(
            "relative flex flex-col overflow-hidden rounded-3xl p-px transition",
            hi && "lg:-translate-y-2"
          )}
          style={
            hi
              ? { background: `linear-gradient(160deg, ${accent}, ${accent2})`, boxShadow: shadowPresetToCss("glow") }
              : undefined
          }
        >
          {hi && p.badge?.trim() ? (
            <div className="absolute right-6 top-6 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-700 shadow">
              <Sparkles className="h-3 w-3" aria-hidden />
              {p.badge}
            </div>
          ) : null}
          <div
            className={cn(
              "flex h-full flex-col rounded-[calc(theme(borderRadius.3xl)-1px)] border p-8",
              hi ? "border-transparent" : isDark ? "border-white/10 bg-white/[0.04]" : "border-black/[0.06] bg-white shadow-sm"
            )}
            style={
              hi
                ? {
                    background: isDark
                      ? "rgba(11,18,32,0.92)"
                      : "rgba(255,255,255,0.96)",
                  }
                : undefined
            }
          >
            <div>
              <h3 className="text-base font-bold" style={{ color: isDark ? "#fff" : headingVar() }}>
                {p.name}
              </h3>
              {p.tagline ? (
                <p className="mt-1 text-sm" style={{ color: isDark ? "#94a3b8" : mutedVar() }}>
                  {p.tagline}
                </p>
              ) : null}
            </div>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-5xl font-bold tracking-tight" style={{ color: isDark ? "#fff" : headingVar() }}>
                {price}
              </span>
              {p.priceNote ? (
                <span className="text-sm font-medium" style={{ color: isDark ? "#94a3b8" : mutedVar() }}>
                  {p.priceNote}
                </span>
              ) : null}
            </div>
            <ul className="mt-6 flex-1 space-y-3 text-sm">
              {feats.map((f, j) => (
                <li
                  key={j}
                  className={cn("flex gap-2.5", f.muted === "yes" && "opacity-50")}
                  style={{ color: isDark ? "#cbd5e1" : "#334155" }}
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: hi ? accent : `var(--lp-accent, ${ACCENT_FALLBACK})` }}
                    aria-hidden
                  />
                  <span>{f.line}</span>
                </li>
              ))}
            </ul>
            <a
              href={p.ctaHref || "#"}
              className={cn(
                "group mt-8 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl py-3 text-sm font-semibold transition hover:scale-[1.02]",
              )}
              style={
                hi
                  ? premiumButtonStyle({ bg: accent, shadow: "glow", radiusPx: 16 })
                  : ghostButtonStyle({
                      borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(15,23,42,0.16)",
                      color: isDark ? "#fff" : undefined,
                      radiusPx: 16,
                    })
              }
            >
              {p.ctaLabel}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
            </a>
          </div>
        </div>
      );
    };

    const header = (
      <div className="mx-auto mb-14 flex max-w-2xl flex-col items-center gap-4 text-center">
        {c.eyebrow ? <EyebrowChip tone={isDark ? "dark" : "light"}>{highlightDynamicTags(String(c.eyebrow))}</EyebrowChip> : null}
        <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.75rem]" style={{ color: isDark ? "#fff" : headingVar() }}>
          {highlightDynamicTags(String(c.title ?? ""))}
        </h2>
        <p className="max-w-xl text-base leading-relaxed md:text-lg" style={{ color: isDark ? "#94a3b8" : mutedVar() }}>
          {highlightDynamicTags(String(c.subtitle ?? ""))}
        </p>
        <div
          className={cn(
            "mt-2 inline-flex items-center gap-1 rounded-full border p-1 text-xs font-semibold shadow-sm",
            isDark ? "border-white/10 bg-white/[0.04]" : "border-black/[0.06] bg-white"
          )}
        >
          <span
            className={cn(
              "rounded-full px-3 py-1 transition",
              !yearly ? "text-white" : isDark ? "text-slate-400" : "text-slate-500"
            )}
            style={!yearly ? { background: `linear-gradient(135deg, ${accent}, ${accent2})` } : undefined}
          >
            Monthly
          </span>
          <span
            className={cn(
              "rounded-full px-3 py-1 transition",
              yearly ? "text-white" : isDark ? "text-slate-400" : "text-slate-500"
            )}
            style={yearly ? { background: `linear-gradient(135deg, ${accent}, ${accent2})` } : undefined}
          >
            Yearly
            <span className="ml-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">−20%</span>
          </span>
        </div>
        <p className="mt-1 text-[11px]" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>
          Toggle &quot;Show prices for&quot; in the sidebar to switch billing display.
        </p>
      </div>
    );

    if (variant === "yearly-default") {
      return (
        <PremiumSection tone={tone} bg={st.bg} decoration={decoration} layout={l} containerWidth={st.containerWidth || "normal"}>
          {header}
          <div className="mx-auto max-w-3xl space-y-4">
            {plans.map((p, i) => {
              const hi = p.highlighted === "yes";
              const price = yearly ? p.priceYearly : p.priceMonthly;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-2xl border p-px",
                    hi && "p-px"
                  )}
                  style={
                    hi
                      ? { background: `linear-gradient(160deg, ${accent}, ${accent2})` }
                      : undefined
                  }
                >
                  <div
                    className={cn(
                      "flex h-full flex-col items-start gap-6 rounded-2xl p-6 md:flex-row md:items-center md:justify-between",
                      hi ? "border-transparent" : isDark ? "border-white/10 bg-white/[0.04]" : "border-black/[0.06] bg-white"
                    )}
                    style={
                      hi
                        ? { background: isDark ? "rgba(11,18,32,0.92)" : "rgba(255,255,255,0.96)" }
                        : undefined
                    }
                  >
                    <div className="min-w-[160px]">
                      <h3 className="text-base font-bold" style={{ color: isDark ? "#fff" : headingVar() }}>{p.name}</h3>
                      {p.tagline ? <p className="text-xs" style={{ color: mutedVar() }}>{p.tagline}</p> : null}
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-3xl font-bold" style={{ color: isDark ? "#fff" : headingVar() }}>{price}</span>
                        {p.priceNote ? <span className="text-sm" style={{ color: mutedVar() }}>{p.priceNote}</span> : null}
                      </div>
                    </div>
                    <ul className="flex flex-1 flex-wrap gap-x-6 gap-y-2 text-sm" style={{ color: isDark ? "#cbd5e1" : "#334155" }}>
                      {(p.features || []).map((f, j) => (
                        <li key={j} className="inline-flex items-center gap-2">
                          <Check className="h-4 w-4" style={{ color: accent }} aria-hidden />
                          {f.line}
                        </li>
                      ))}
                    </ul>
                    <a
                      href={p.ctaHref || "#"}
                      className="inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold shadow-md md:shrink-0"
                      style={hi ? premiumButtonStyle({ bg: accent, shadow: "glow", radiusPx: 16 }) : ghostButtonStyle({ radiusPx: 16 })}
                    >
                      {p.ctaLabel}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </PremiumSection>
      );
    }

    if (variant === "solo-pro") {
      return (
        <PremiumSection tone={tone} bg={st.bg} decoration={decoration} layout={l} containerWidth={st.containerWidth || "normal"}>
          {header}
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            {plans.map((p, i) => planCard(p, i))}
          </div>
        </PremiumSection>
      );
    }

    /* three-tier (default) */
    return (
      <PremiumSection tone={tone} bg={st.bg} decoration={decoration} layout={l} containerWidth={st.containerWidth || "wide"}>
        {header}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((p, i) => planCard(p, i))}
        </div>
      </PremiumSection>
    );
  },
};

/* -------------------------------------------------------------------------- */
/*  Block 8: Testimonials + lead form                                          */
/* -------------------------------------------------------------------------- */

const testimonialLeadBlock: Config["components"][string] = {
  label: "Testimonial + lead form",
  fields: {
    content: {
      type: "object",
      label: "Content",
      objectFields: {
        designVariant: { type: "text", label: "Layout preset", visible: false },
        eyebrow: puckBindingTextField("Eyebrow"),
        title: puckBindingTextField("Section heading"),
        quote: puckBindingTextareaField("Quote"),
        author: puckBindingTextField("Author name"),
        authorRole: puckBindingTextField("Author role"),
        authorAvatarSrc: puckImageSrcField("Author avatar URL"),
        avatars: {
          type: "array",
          label: "Trust avatars",
          arrayFields: { src: puckImageSrcField("Image URL") },
          defaultItemProps: { src: "" },
          getItemSummary: (_item, idx) => `Avatar ${(idx ?? 0) + 1}`,
        },
        formMode: {
          type: "radio",
          label: "Form source",
          options: [
            { label: "Built-in (email + message)", value: "default" },
            { label: "Pick one of your admin forms", value: "custom" },
          ],
        },
        customFormId: puckFormPickerField(
          "Admin form to embed",
          "Renders one of your admin-created forms here. Submissions land in /forms responses."
        ),
        formTitle: puckBindingTextField("Form card title"),
        formSubtitle: puckBindingTextField("Form card subtitle"),
        nameLabel: puckBindingTextField("Name field label (built-in only)"),
        emailPlaceholder: puckBindingTextField("Email placeholder (built-in only)"),
        messagePlaceholder: puckBindingTextField("Message placeholder (built-in only)"),
        buttonLabel: puckBindingTextField("Submit button label (built-in only)"),
        formAction: puckBindingTextField("Form action URL (built-in only)"),
      },
    },
    style: {
      type: "object",
      label: "Style",
      objectFields: {
        sectionHeader: puckStyleHeadingField("Section background"),
        tone: toneField,
        bg: { type: "text", label: "Custom background" },
        accentA: puckColorPickerField("Accent gradient A"),
        accentB: puckColorPickerField("Accent gradient B"),
        layoutHeader: puckStyleHeadingField("Layout"),
        containerWidth: containerPresetField,
      },
    },
    ...sharedLayoutField,
  },
  defaultProps: {
    content: {
      eyebrow: "Customer story",
      title: "Teams move 2× faster with Lumen.",
      quote:
        "We replaced three tools and our weekly status review with Lumen. The team finally has one place to align — and our launches actually ship on time.",
      author: "Alex Morgan",
      authorRole: "VP Marketing · Northwind",
      authorAvatarSrc: "",
      avatars: [{ src: "" }, { src: "" }, { src: "" }, { src: "" }],
      formMode: "default",
      customFormId: "",
      formTitle: "Talk to product",
      formSubtitle: "We reply within one business day.",
      nameLabel: "Full name",
      emailPlaceholder: "Work email",
      messagePlaceholder: "Tell us what you're trying to ship...",
      buttonLabel: "Request a demo",
      formAction: "#",
      designVariant: "split-glass",
    },
    style: {
      tone: "dark",
      bg: "",
      accentA: "",
      accentB: "",
      containerWidth: "wide",
    },
    layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "96px", paddingBottom: "96px" },
  },
  render: ({ content, style, layout }) => {
    const c = (content || {}) as Record<string, unknown> & { avatars?: Array<{ src?: string }> };
    const st = (style || {}) as Record<string, string>;
    const l = (layout || {}) as Record<string, string>;
    const variant = dv(c as { designVariant?: string }, "split-glass");
    const tone = (st.tone || "dark") as SectionTone;
    const isDark = tone === "dark";

    const accentA = st.accentA?.trim() || ACCENT_FALLBACK;
    const accentB = st.accentB?.trim() || ACCENT_FALLBACK_2;

    const quoteSide = (
      <div className="space-y-6">
        {c.eyebrow ? <EyebrowChip tone={isDark ? "dark" : "light"}>{highlightDynamicTags(String(c.eyebrow))}</EyebrowChip> : null}
        <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.5rem] lg:leading-[1.05]" style={{ color: isDark ? "#fff" : headingVar() }}>
          {highlightDynamicTags(String(c.title ?? ""))}
        </h2>
        <div
          className="relative rounded-3xl border p-8 backdrop-blur-md"
          style={{
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.7)",
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)",
          }}
        >
          <div
            className="absolute -left-3 -top-3 flex h-10 w-10 items-center justify-center rounded-2xl text-xl font-serif text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${accentA}, ${accentB})` }}
          >
            &ldquo;
          </div>
          <StarRating value={5} size={18} />
          <blockquote
            className="mt-4 text-lg leading-relaxed md:text-xl"
            style={{ color: isDark ? "#e2e8f0" : "#1e293b" }}
          >
            {highlightDynamicTags(String(c.quote ?? ""))}
          </blockquote>
          <div className="mt-6 flex items-center gap-3">
            <span className="block h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/10">
              <SafeImage
                src={String(c.authorAvatarSrc ?? "")}
                alt={String(c.author ?? "Author")}
                role="avatar"
                className="h-full w-full object-cover"
                fallbackClassName="h-full w-full"
                showCaption={false}
              />
            </span>
            <div className="text-sm">
              <div className="font-semibold" style={{ color: isDark ? "#fff" : headingVar() }}>
                {highlightDynamicTags(String(c.author ?? ""))}
              </div>
              <div style={{ color: isDark ? "#94a3b8" : mutedVar() }}>
                {highlightDynamicTags(String(c.authorRole ?? ""))}
              </div>
            </div>
          </div>
        </div>
        {c.avatars && c.avatars.length ? (
          <div className="flex items-center gap-3">
            <AvatarStack
              sources={c.avatars.map((a) => a?.src)}
              size={36}
              borderColor={isDark ? "#0b1220" : "#ffffff"}
            />
            <span className="text-sm" style={{ color: isDark ? "#cbd5e1" : mutedVar() }}>
              Join 12,000+ teams
            </span>
          </div>
        ) : null}
      </div>
    );

    const formCard = (
      <div
        className="relative overflow-hidden rounded-3xl border p-8 shadow-2xl backdrop-blur-md md:p-10"
        style={{
          background: isDark ? "rgba(17,26,46,0.65)" : "rgba(255,255,255,0.85)",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${accentA}55, transparent 60%)` }}
        />
        <div className="mb-6 flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${accentA}, ${accentB})` }}
          >
            ✉
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: isDark ? "#fff" : headingVar() }}>
              {highlightDynamicTags(String(c.formTitle ?? ""))}
            </h3>
            <p className="text-sm" style={{ color: isDark ? "#94a3b8" : mutedVar() }}>
              {highlightDynamicTags(String(c.formSubtitle ?? ""))}
            </p>
          </div>
        </div>
        {String(c.formMode ?? "default") === "custom" ? (
          String(c.customFormId ?? "").trim() ? (
            <div className={cn("rounded-2xl", isDark && "[&_*]:!text-slate-100")}>
              <EmbedForm
                form_id={String(c.customFormId).trim()}
                form_title={String(c.formTitle ?? "") || undefined}
              />
            </div>
          ) : (
            <div className={cn("rounded-xl border border-dashed p-4 text-xs", isDark ? "border-white/15 text-slate-300" : "border-slate-300 text-slate-600")}>
              Select an admin form in the sidebar (Form source → Pick one of your admin forms).
            </div>
          )
        ) : (
          <form action={String(c.formAction ?? "#")} method="post" className="space-y-4">
            <div>
              <label className="text-xs font-semibold" style={{ color: isDark ? "#cbd5e1" : "#334155" }}>
                {highlightDynamicTags(String(c.nameLabel ?? "Full name"))}
              </label>
              <input
                type="text"
                name="name"
                className={cn(
                  "mt-1.5 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2",
                  isDark
                    ? "border-white/10 bg-white/[0.03] text-white placeholder:text-slate-500 focus:border-white/30 focus:ring-white/10"
                    : "border-black/[0.08] bg-white text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-indigo-200/40"
                )}
              />
            </div>
            <div>
              <label className="text-xs font-semibold" style={{ color: isDark ? "#cbd5e1" : "#334155" }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder={String(c.emailPlaceholder ?? "")}
                className={cn(
                  "mt-1.5 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2",
                  isDark
                    ? "border-white/10 bg-white/[0.03] text-white placeholder:text-slate-500 focus:border-white/30 focus:ring-white/10"
                    : "border-black/[0.08] bg-white text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-indigo-200/40"
                )}
              />
            </div>
            <div>
              <label className="text-xs font-semibold" style={{ color: isDark ? "#cbd5e1" : "#334155" }}>
                Message
              </label>
              <textarea
                name="message"
                rows={4}
                placeholder={String(c.messagePlaceholder ?? "")}
                className={cn(
                  "mt-1.5 w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2",
                  isDark
                    ? "border-white/10 bg-white/[0.03] text-white placeholder:text-slate-500 focus:border-white/30 focus:ring-white/10"
                    : "border-black/[0.08] bg-white text-slate-800 placeholder:text-slate-400 focus:border-indigo-300 focus:ring-indigo-200/40"
                )}
              />
            </div>
            <button
              type="submit"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold shadow-lg transition hover:scale-[1.01]"
              style={{
                background: `linear-gradient(135deg, ${accentA}, ${accentB})`,
                color: "#ffffff",
                boxShadow: shadowPresetToCss("glow"),
              }}
            >
              {highlightDynamicTags(String(c.buttonLabel ?? "Submit"))}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
            </button>
            <p className="text-center text-[11px]" style={{ color: isDark ? "#64748b" : "#94a3b8" }}>
              We&apos;ll never share your email. Unsubscribe in one click.
            </p>
          </form>
        )}
      </div>
    );

    if (variant === "stacked-cta") {
      return (
        <PremiumSection tone={tone} bg={st.bg} decoration="spotlight" layout={l} containerWidth={st.containerWidth || "normal"}>
          <div className="mx-auto max-w-3xl text-center">{quoteSide}</div>
          <div className="mx-auto mt-12 max-w-lg">{formCard}</div>
        </PremiumSection>
      );
    }

    if (variant === "form-first") {
      return (
        <PremiumSection tone={tone} bg={st.bg} decoration="mesh" layout={l} containerWidth={st.containerWidth || "wide"}>
          <div className="grid items-start gap-12 md:grid-cols-2 md:gap-16">
            <div className="md:order-1">{formCard}</div>
            <div className="md:order-2">{quoteSide}</div>
          </div>
        </PremiumSection>
      );
    }

    /* split-glass (default) */
    return (
      <PremiumSection tone={tone} bg={st.bg} decoration="mesh" layout={l} containerWidth={st.containerWidth || "wide"}>
        <div className="grid items-start gap-12 md:grid-cols-2 md:gap-16">
          <div>{quoteSide}</div>
          <div>{formCard}</div>
        </div>
      </PremiumSection>
    );
  },
};

/* -------------------------------------------------------------------------- */
/*  Block 9: Footer (mega columns)                                             */
/* -------------------------------------------------------------------------- */

const footerMegaBlock: Config["components"][string] = {
  label: "Footer",
  fields: {
    content: {
      type: "object",
      label: "Content",
      objectFields: {
        designVariant: { type: "text", label: "Layout preset", visible: false },
        logoMode: {
          type: "radio",
          label: "Logo type",
          options: [
            { label: "Text", value: "text" },
            { label: "Image", value: "image" },
          ],
        },
        logoText: puckBindingTextField("Logo text"),
        logoImageSrc: puckImageSrcField("Logo image URL"),
        tagline: puckBindingTextareaField("Tagline"),
        ctaTitle: puckBindingTextField("CTA — title (optional)"),
        ctaSubtitle: puckBindingTextField("CTA — subtitle"),
        ctaLabel: puckBindingTextField("CTA — button label"),
        ctaHref: puckBindingTextField("CTA — button URL"),
        newsletterMode: {
          type: "radio",
          label: "Newsletter form",
          options: [
            { label: "Built-in (single email field)", value: "default" },
            { label: "Pick one of your admin forms", value: "custom" },
            { label: "Hide newsletter", value: "hidden" },
          ],
        },
        newsletterFormId: puckFormPickerField(
          "Admin form to embed",
          "Renders the chosen form in place of the email field. Submissions land in /forms responses."
        ),
        newsletterPlaceholder: puckBindingTextField("Newsletter placeholder (built-in only)"),
        newsletterAction: puckBindingTextField("Newsletter form action (built-in only)"),
        socials: {
          type: "array",
          label: "Social links",
          arrayFields: {
            label: { type: "text", label: "Label" },
            href: { type: "text", label: "URL" },
            icon: { type: "text", label: "Icon (emoji or letter)" },
          },
          defaultItemProps: { label: "Twitter", href: "#", icon: "𝕏" },
          getItemSummary: (item) => item.label || "Social",
        },
        columns: {
          type: "array",
          label: "Link columns",
          arrayFields: {
            heading: { type: "text", label: "Column heading" },
            links: {
              type: "array",
              label: "Links",
              arrayFields: {
                label: { type: "text", label: "Label" },
                href: { type: "text", label: "URL" },
              },
              defaultItemProps: { label: "Link", href: "#" },
              getItemSummary: (item) => item.label || "Link",
            },
          },
          defaultItemProps: {
            heading: "Product",
            links: [
              { label: "Features", href: "#" },
              { label: "Pricing", href: "#" },
            ],
          },
          getItemSummary: (item) => item.heading || "Column",
        },
        copyright: puckBindingTextField("Copyright line"),
        legalLink1Label: puckBindingTextField("Legal link 1 label"),
        legalLink1Href: puckBindingTextField("Legal link 1 URL"),
        legalLink2Label: puckBindingTextField("Legal link 2 label"),
        legalLink2Href: puckBindingTextField("Legal link 2 URL"),
      },
    },
    style: {
      type: "object",
      label: "Style",
      objectFields: {
        sectionHeader: puckStyleHeadingField("Section background"),
        tone: toneField,
        bg: { type: "text", label: "Custom background" },
        accentA: puckColorPickerField("Accent gradient A"),
        accentB: puckColorPickerField("Accent gradient B"),
      },
    },
    ...sharedLayoutField,
  },
  defaultProps: {
    content: {
      logoMode: "text",
      logoText: "Lumen",
      logoImageSrc: "",
      tagline: "Quiet software for loud teams. Plan, ship, and measure — without context-switching.",
      ctaTitle: "Ready when you are",
      ctaSubtitle: "Start your 14-day free trial — no credit card required.",
      ctaLabel: "Get started free",
      ctaHref: "#",
      newsletterMode: "default",
      newsletterFormId: "",
      newsletterPlaceholder: "you@work.com",
      newsletterAction: "#",
      socials: [
        { label: "X", href: "#", icon: "𝕏" },
        { label: "GitHub", href: "#", icon: "G" },
        { label: "LinkedIn", href: "#", icon: "in" },
        { label: "Discord", href: "#", icon: "✦" },
      ],
      columns: [
        {
          heading: "Product",
          links: [
            { label: "Features", href: "#" },
            { label: "Pricing", href: "#" },
            { label: "Integrations", href: "#" },
            { label: "Changelog", href: "#" },
          ],
        },
        {
          heading: "Resources",
          links: [
            { label: "Documentation", href: "#" },
            { label: "Blog", href: "#" },
            { label: "Customer stories", href: "#" },
            { label: "Status", href: "#" },
          ],
        },
        {
          heading: "Company",
          links: [
            { label: "About", href: "#" },
            { label: "Careers", href: "#" },
            { label: "Press", href: "#" },
            { label: "Contact", href: "#" },
          ],
        },
      ],
      copyright: "© 2026 Lumen Labs, Inc.",
      legalLink1Label: "Terms",
      legalLink1Href: "#",
      legalLink2Label: "Privacy",
      legalLink2Href: "#",
      designVariant: "mega-cta",
    },
    style: {
      tone: "dark",
      bg: "",
      accentA: "",
      accentB: "",
    },
    layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "80px", paddingBottom: "32px" },
  },
  render: ({ content, style, layout }) => {
    const c = (content || {}) as Record<string, unknown>;
    const st = (style || {}) as Record<string, string>;
    const l = (layout || {}) as Record<string, string>;
    const variant = dv(c as { designVariant?: string }, "mega-cta");
    const tone = (st.tone || "dark") as SectionTone;
    const isDark = tone === "dark";
    const columns = (Array.isArray(c.columns) ? c.columns : []) as Array<{
      heading?: string;
      links?: Array<{ label?: string; href?: string }>;
    }>;
    const socials = (Array.isArray(c.socials) ? c.socials : []) as Array<{
      label?: string;
      href?: string;
      icon?: string;
    }>;

    const accentA = st.accentA?.trim() || ACCENT_FALLBACK;
    const accentB = st.accentB?.trim() || ACCENT_FALLBACK_2;

    const muted = isDark ? "#94a3b8" : "#64748b";
    const heading = isDark ? "#ffffff" : "#0b1220";

    const brandNode = (
      <div className="space-y-4">
        <div className={cn("text-xl font-bold", isDark && "text-white")} style={!isDark ? { color: heading } : undefined}>
          <BrandLogoTextOrImage
            logoMode={String((c as { logoMode?: string }).logoMode ?? "text")}
            logoText={String(c.logoText ?? "")}
            logoImageSrc={String((c as { logoImageSrc?: string }).logoImageSrc ?? "")}
            textClassName="text-xl font-bold"
            textStyle={{ color: heading }}
            imageClassName={cn("h-9 w-auto max-w-[220px] object-contain", isDark && "brightness-0 invert")}
          />
        </div>
        <p className="max-w-sm text-sm leading-relaxed" style={{ color: muted }}>
          {highlightDynamicTags(String(c.tagline ?? ""))}
        </p>
        {socials.length ? (
          <div className="flex items-center gap-2">
            {socials.map((s, i) => (
              <a
                key={i}
                href={s.href || "#"}
                aria-label={s.label}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-semibold transition hover:scale-105",
                  isDark
                    ? "border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                    : "border-black/[0.08] bg-white text-slate-700 hover:border-black/[0.12]"
                )}
              >
                {s.icon || s.label?.[0] || "·"}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    );

    const linkColumns = (
      <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
        {columns.map((col, i) => (
          <div key={i}>
            <h4
              className="mb-4 text-[11px] font-bold uppercase tracking-[0.16em]"
              style={{ color: isDark ? "#cbd5e1" : "#475569" }}
            >
              {col.heading}
            </h4>
            <ul className="space-y-3 text-sm" style={{ color: muted }}>
              {(col.links || []).map((link, j) => (
                <li key={j}>
                  <a href={link.href || "#"} className="transition hover:text-current" style={{ color: muted }}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );

    const newsletterMode = String(c.newsletterMode ?? "default");
    const newsletterFormId = String(c.newsletterFormId ?? "").trim();

    const customNewsletterEl =
      newsletterMode === "custom" ? (
        newsletterFormId ? (
          <div className={cn("max-w-md rounded-xl border p-4", isDark ? "border-white/10 bg-white/[0.03]" : "border-black/[0.06] bg-white shadow-sm")}>
            <EmbedForm form_id={newsletterFormId} />
          </div>
        ) : (
          <div className={cn("max-w-md rounded-xl border border-dashed p-3 text-xs", isDark ? "border-white/15 text-slate-300" : "border-slate-300 text-slate-600")}>
            Pick a form in the sidebar (Newsletter form → admin form).
          </div>
        )
      ) : null;

    const builtInNewsletterEl = (
      <form
        action={String(c.newsletterAction ?? "#")}
        className={cn("flex max-w-md gap-2", isDark ? "" : "")}
      >
        <input
          type="email"
          name="email"
          placeholder={String(c.newsletterPlaceholder ?? "")}
          className={cn(
            "min-w-0 flex-1 rounded-2xl border px-4 py-2.5 text-sm outline-none focus:ring-2",
            isDark
              ? "border-white/10 bg-white/[0.04] text-white placeholder:text-slate-500 focus:ring-white/10"
              : "border-black/[0.08] bg-white text-slate-800 placeholder:text-slate-400 focus:ring-indigo-200/40"
          )}
        />
        <button
          type="submit"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02]"
          style={{ background: `linear-gradient(135deg, ${accentA}, ${accentB})` }}
        >
          Subscribe
        </button>
      </form>
    );

    const newsletterEl =
      newsletterMode === "hidden"
        ? null
        : newsletterMode === "custom"
          ? customNewsletterEl
          : builtInNewsletterEl;

    const ctaPanel = (
      <div
        className="relative overflow-hidden rounded-3xl border p-10 md:p-14"
        style={{
          background: isDark
            ? `linear-gradient(135deg, ${accentA}40, ${accentB}40), radial-gradient(circle at top right, ${accentA}55, transparent 60%)`
            : `linear-gradient(135deg, ${accentA}, ${accentB})`,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "transparent",
        }}
      >
        <NoiseOverlay opacity={0.06} />
        <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
          <div className="space-y-3 text-white">
            <h3 className="text-balance text-2xl font-bold tracking-tight md:text-3xl lg:text-[2.25rem]">
              {highlightDynamicTags(String(c.ctaTitle ?? ""))}
            </h3>
            <p className="max-w-xl text-base leading-relaxed text-white/80 md:text-lg">
              {highlightDynamicTags(String(c.ctaSubtitle ?? ""))}
            </p>
          </div>
          {String(c.ctaLabel ?? "").trim() ? (
            <div className="flex md:justify-end">
              <a
                href={String(c.ctaHref ?? "#")}
                className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:scale-[1.02]"
              >
                {highlightDynamicTags(String(c.ctaLabel))}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </a>
            </div>
          ) : null}
        </div>
      </div>
    );

    const legalRow = (
      <div
        className="mt-12 flex flex-col gap-3 border-t pt-8 text-xs md:flex-row md:items-center md:justify-between"
        style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)", color: muted }}
      >
        <span>{highlightDynamicTags(String(c.copyright ?? ""))}</span>
        <div className="flex flex-wrap gap-4">
          {String(c.legalLink1Label ?? "").trim() ? (
            <a href={String(c.legalLink1Href ?? "#")} className="transition hover:text-current">
              {highlightDynamicTags(String(c.legalLink1Label ?? ""))}
            </a>
          ) : null}
          {String(c.legalLink2Label ?? "").trim() ? (
            <a href={String(c.legalLink2Href ?? "#")} className="transition hover:text-current">
              {highlightDynamicTags(String(c.legalLink2Label ?? ""))}
            </a>
          ) : null}
        </div>
      </div>
    );

    const wrapperBg = st.bg?.trim() || (isDark ? "#06090f" : "#f6f7fb");

    if (variant === "minimal-legal") {
      return (
        <footer
          className="relative overflow-hidden"
          style={{ ...layoutToStyle(l), background: wrapperBg, color: isDark ? "#cbd5e1" : "#475569" }}
        >
          <div className="mx-auto max-w-6xl px-4 py-8">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <BrandLogoTextOrImage
                  logoMode={String((c as { logoMode?: string }).logoMode ?? "text")}
                  logoText={String(c.logoText ?? "")}
                  logoImageSrc={String((c as { logoImageSrc?: string }).logoImageSrc ?? "")}
                  textClassName="text-lg font-bold"
                  textStyle={{ color: heading }}
                  imageClassName={cn("h-7 w-auto max-w-[180px] object-contain", isDark && "brightness-0 invert")}
                />
                <span className="hidden text-sm md:inline" style={{ color: muted }}>
                  {highlightDynamicTags(String(c.tagline ?? ""))}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm" style={{ color: muted }}>
                {columns.flatMap((col, ci) =>
                  (col.links || []).map((link, li) => (
                    <a key={`${ci}-${li}`} href={link.href || "#"} className="transition hover:text-current">
                      {link.label}
                    </a>
                  ))
                )}
              </div>
            </div>
            {legalRow}
          </div>
        </footer>
      );
    }

    if (variant === "product-focused") {
      return (
        <footer
          className="relative overflow-hidden"
          style={{ ...layoutToStyle(l), background: wrapperBg, color: isDark ? "#cbd5e1" : "#475569" }}
        >
          <DotGrid color={isDark ? "rgba(148,163,184,0.07)" : "rgba(15,23,42,0.06)"} />
          <div className="relative mx-auto max-w-6xl px-4">
            <div className="border-b pb-12 text-center" style={{ borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)" }}>
              <div className="mx-auto max-w-2xl space-y-5">{brandNode}</div>
              <div className="mx-auto mt-8 max-w-md">{newsletterEl}</div>
            </div>
            <div className="pt-12">{linkColumns}</div>
            {legalRow}
          </div>
        </footer>
      );
    }

    /* mega-cta (default) */
    return (
      <footer
        className="relative overflow-hidden"
        style={{ ...layoutToStyle(l), background: wrapperBg, color: isDark ? "#cbd5e1" : "#475569" }}
      >
        {isDark ? <DotGrid color="rgba(148,163,184,0.07)" /> : null}
        <div className="relative mx-auto max-w-6xl px-4">
          {String(c.ctaTitle ?? "").trim() ? <div className="mb-16">{ctaPanel}</div> : null}
          <div className="grid gap-12 md:grid-cols-[1.2fr_2fr]">
            <div>
              {brandNode}
              <div className="mt-6">{newsletterEl}</div>
            </div>
            {linkColumns}
          </div>
          {legalRow}
        </div>
      </footer>
    );
  },
};

/* -------------------------------------------------------------------------- */
/*  Block 10 (NEW): Stats / metrics row                                        */
/* -------------------------------------------------------------------------- */

const statsBlock: Config["components"][string] = {
  label: "Stats / metrics",
  fields: {
    content: {
      type: "object",
      label: "Content",
      objectFields: {
        designVariant: { type: "text", label: "Layout preset", visible: false },
        eyebrow: puckBindingTextField("Eyebrow"),
        heading: puckBindingTextField("Heading"),
        body: puckBindingTextareaField("Body"),
        stats: {
          type: "array",
          label: "Stats",
          arrayFields: {
            value: { type: "text", label: "Value (e.g. 12k+)" },
            label: { type: "text", label: "Label" },
            hint: { type: "text", label: "Hint (optional)" },
          },
          defaultItemProps: { value: "+38%", label: "Faster shipping cycles", hint: "" },
          getItemSummary: (item) => item.label || "Stat",
        },
      },
    },
    style: {
      type: "object",
      label: "Style",
      objectFields: {
        sectionHeader: puckStyleHeadingField("Section background"),
        tone: toneField,
        bg: { type: "text", label: "Custom background" },
        decoration: puckPresetField("Decoration", [
          { value: "none", label: "None" },
          { value: "dots", label: "Dot grid" },
          { value: "grid", label: "Grid lines" },
          { value: "spotlight", label: "Spotlight" },
        ]),
        layoutHeader: puckStyleHeadingField("Layout"),
        containerWidth: containerPresetField,
      },
    },
    ...sharedLayoutField,
  },
  defaultProps: {
    content: {
      eyebrow: "By the numbers",
      heading: "Built for teams that ship.",
      body: "Operators across 60+ countries trust Lumen to keep cross-functional work moving.",
      stats: [
        { value: "12k+", label: "Active teams", hint: "" },
        { value: "98%", label: "Customer retention", hint: "" },
        { value: "+38%", label: "Faster cycles", hint: "Median across 1,200 customers" },
        { value: "60+", label: "Countries", hint: "" },
      ],
      designVariant: "row",
    },
    style: {
      tone: "muted",
      bg: "",
      decoration: "none",
      containerWidth: "wide",
    },
    layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "80px", paddingBottom: "80px" },
  },
  render: ({ content, style, layout }) => {
    const c = (content || {}) as Record<string, unknown>;
    const st = (style || {}) as Record<string, string>;
    const l = (layout || {}) as Record<string, string>;
    const stats = (Array.isArray(c.stats) ? c.stats : []) as Array<{ value?: string; label?: string; hint?: string }>;
    const variant = dv(c as { designVariant?: string }, "row");
    const tone = (st.tone || "muted") as SectionTone;
    const isDark = tone === "dark";

    const head = (
      <div className={cn("flex flex-col gap-3 md:flex-row md:items-end md:justify-between", variant === "row" && "mb-12")}>
        <div className="space-y-3">
          {c.eyebrow ? <EyebrowChip tone={isDark ? "dark" : "light"}>{highlightDynamicTags(String(c.eyebrow))}</EyebrowChip> : null}
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl" style={{ color: isDark ? "#fff" : headingVar() }}>
            {highlightDynamicTags(String(c.heading ?? ""))}
          </h2>
        </div>
        {c.body ? (
          <p className="max-w-md text-base leading-relaxed" style={{ color: isDark ? "#94a3b8" : mutedVar() }}>
            {highlightDynamicTags(String(c.body))}
          </p>
        ) : null}
      </div>
    );

    return (
      <PremiumSection tone={tone} bg={st.bg} decoration={(st.decoration as never) || "none"} layout={l} containerWidth={st.containerWidth || "wide"}>
        {head}
        <div className={cn("grid gap-px overflow-hidden rounded-3xl border", isDark ? "border-white/10 bg-white/10" : "border-black/[0.06] bg-black/[0.06]")}>
          <div className={cn("grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4", isDark ? "bg-white/10" : "bg-black/[0.06]")}>
            {stats.map((s, i) => (
              <div
                key={i}
                className={cn("flex flex-col items-start gap-2 p-8", isDark ? "bg-[#0b1220]" : "bg-white")}
              >
                <span
                  className="bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-5xl"
                  style={{ backgroundImage: `linear-gradient(135deg, ${ACCENT_FALLBACK}, ${ACCENT_FALLBACK_2})` }}
                >
                  {s.value}
                </span>
                <span className="text-sm font-semibold" style={{ color: isDark ? "#fff" : headingVar() }}>
                  {s.label}
                </span>
                {s.hint ? (
                  <span className="text-xs" style={{ color: isDark ? "#64748b" : mutedVar() }}>
                    {s.hint}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </PremiumSection>
    );
  },
};

/* -------------------------------------------------------------------------- */
/*  Block 11 (NEW): FAQ                                                        */
/* -------------------------------------------------------------------------- */

const faqBlock: Config["components"][string] = {
  label: "FAQ",
  fields: {
    content: {
      type: "object",
      label: "Content",
      objectFields: {
        designVariant: { type: "text", label: "Layout preset", visible: false },
        eyebrow: puckBindingTextField("Eyebrow"),
        heading: puckBindingTextField("Heading"),
        body: puckBindingTextareaField("Body"),
        items: {
          type: "array",
          label: "Questions",
          arrayFields: {
            question: { type: "text", label: "Question" },
            answer: { type: "textarea", label: "Answer" },
          },
          defaultItemProps: { question: "How do I get started?", answer: "Sign up, invite your team, and you’re live in minutes." },
          getItemSummary: (item) => item.question || "Question",
        },
        ctaLabel: puckBindingTextField("Side CTA — label"),
        ctaHref: puckBindingTextField("Side CTA — URL"),
        ctaSubtext: puckBindingTextField("Side CTA — helper line"),
      },
    },
    style: {
      type: "object",
      label: "Style",
      objectFields: {
        sectionHeader: puckStyleHeadingField("Section background"),
        tone: toneField,
        bg: { type: "text", label: "Custom background" },
        decoration: puckPresetField("Decoration", [
          { value: "none", label: "None" },
          { value: "dots", label: "Dot grid" },
          { value: "grid", label: "Grid lines" },
          { value: "spotlight", label: "Spotlight" },
        ]),
        layoutHeader: puckStyleHeadingField("Layout"),
        containerWidth: containerPresetField,
      },
    },
    ...sharedLayoutField,
  },
  defaultProps: {
    content: {
      eyebrow: "FAQ",
      heading: "The questions our team gets asked the most.",
      body: "Can't find what you're looking for? Our team replies within one business day.",
      items: [
        { question: "How long is the free trial?", answer: "14 days, no credit card required. We'll remind you before it ends." },
        { question: "Can we self-host Lumen?", answer: "Yes — Business plan and above include single-tenant deployments and BYO-key encryption." },
        { question: "Do you offer non-profit discounts?", answer: "We offer 50% off for verified non-profits and educational institutions." },
        { question: "How do you handle our data?", answer: "We never sell or share your data. EU residency is available out of the box." },
      ],
      ctaLabel: "Talk to sales",
      ctaHref: "#",
      ctaSubtext: "Average reply time: 12 minutes",
      designVariant: "two-column",
    },
    style: {
      tone: "light",
      bg: "",
      decoration: "none",
      containerWidth: "wide",
    },
    layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "96px", paddingBottom: "96px" },
  },
  render: ({ content, style, layout }) => {
    const c = (content || {}) as Record<string, unknown>;
    const st = (style || {}) as Record<string, string>;
    const l = (layout || {}) as Record<string, string>;
    const items = (Array.isArray(c.items) ? c.items : []) as Array<{ question?: string; answer?: string }>;
    const variant = dv(c as { designVariant?: string }, "two-column");
    const tone = (st.tone || "light") as SectionTone;
    const isDark = tone === "dark";
    const [open, setOpen] = React.useState<number | null>(0);

    const headEl = (
      <div className="space-y-4">
        {c.eyebrow ? <EyebrowChip tone={isDark ? "dark" : "light"}>{highlightDynamicTags(String(c.eyebrow))}</EyebrowChip> : null}
        <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.5rem]" style={{ color: isDark ? "#fff" : headingVar() }}>
          {highlightDynamicTags(String(c.heading ?? ""))}
        </h2>
        {c.body ? (
          <p className="max-w-lg text-base leading-relaxed md:text-lg" style={{ color: isDark ? "#94a3b8" : mutedVar() }}>
            {highlightDynamicTags(String(c.body))}
          </p>
        ) : null}
        {String(c.ctaLabel ?? "").trim() ? (
          <div className="pt-2">
            <a
              href={String(c.ctaHref ?? "#")}
              className="group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-md transition hover:scale-[1.02]"
              style={premiumButtonStyle({ shadow: "soft", radiusPx: 9999 })}
            >
              {highlightDynamicTags(String(c.ctaLabel))}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
            </a>
            {c.ctaSubtext ? (
              <p className="mt-2 text-xs" style={{ color: isDark ? "#64748b" : mutedVar() }}>
                {highlightDynamicTags(String(c.ctaSubtext))}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    );

    const accordion = (
      <ul className={cn("divide-y rounded-3xl border", isDark ? "divide-white/[0.08] border-white/10 bg-white/[0.03]" : "divide-black/[0.06] border-black/[0.06] bg-white shadow-sm")}>
        {items.map((row, i) => {
          const isOpen = open === i;
          return (
            <li key={i}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 p-6 text-left"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span className="text-base font-semibold" style={{ color: isDark ? "#fff" : headingVar() }}>
                  {highlightDynamicTags(row.question)}
                </span>
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-base transition",
                    isOpen && "rotate-45",
                    isDark ? "border-white/15 text-white" : "border-black/[0.08] text-slate-700"
                  )}
                >
                  +
                </span>
              </button>
              {isOpen ? (
                <div className="px-6 pb-6">
                  <p className="text-sm leading-relaxed" style={{ color: isDark ? "#94a3b8" : mutedVar() }}>
                    {highlightDynamicTags(row.answer)}
                  </p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    );

    if (variant === "stacked") {
      return (
        <PremiumSection tone={tone} bg={st.bg} decoration={(st.decoration as never) || "none"} layout={l} containerWidth={st.containerWidth || "normal"}>
          <div className="mx-auto max-w-3xl text-center">{headEl}</div>
          <div className="mx-auto mt-12 max-w-3xl">{accordion}</div>
        </PremiumSection>
      );
    }

    /* two-column (default) */
    return (
      <PremiumSection tone={tone} bg={st.bg} decoration={(st.decoration as never) || "none"} layout={l} containerWidth={st.containerWidth || "wide"}>
        <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
          <div>{headEl}</div>
          <div>{accordion}</div>
        </div>
      </PremiumSection>
    );
  },
};

/* -------------------------------------------------------------------------- */
/*  Block 12 (NEW): CTA banner                                                 */
/* -------------------------------------------------------------------------- */

const ctaBannerBlock: Config["components"][string] = {
  label: "CTA banner",
  fields: {
    content: {
      type: "object",
      label: "Content",
      objectFields: {
        designVariant: { type: "text", label: "Layout preset", visible: false },
        eyebrow: puckBindingTextField("Eyebrow"),
        title: puckBindingTextField("Headline"),
        body: puckBindingTextareaField("Body"),
        primaryLabel: puckBindingTextField("Primary CTA label"),
        primaryHref: puckBindingTextField("Primary CTA URL"),
        secondaryLabel: puckBindingTextField("Secondary CTA label"),
        secondaryHref: puckBindingTextField("Secondary CTA URL"),
        microcopy: puckBindingTextField("Microcopy below CTAs"),
      },
    },
    style: {
      type: "object",
      label: "Style",
      objectFields: {
        sectionHeader: puckStyleHeadingField("Banner background"),
        accentA: puckColorPickerField("Gradient A"),
        accentB: puckColorPickerField("Gradient B"),
        accentC: puckColorPickerField("Gradient C"),
        layoutHeader: puckStyleHeadingField("Layout"),
        containerWidth: containerPresetField,
      },
    },
    ...sharedLayoutField,
  },
  defaultProps: {
    content: {
      eyebrow: "Ready to ship?",
      title: "Build a workspace your team will actually love.",
      body: "Free for the first 14 days. Cancel anytime — and bring your data with you.",
      primaryLabel: "Start your free trial",
      primaryHref: "#",
      secondaryLabel: "Talk to sales",
      secondaryHref: "#",
      microcopy: "No credit card required · SOC 2 Type II",
      designVariant: "gradient-card",
    },
    style: {
      accentA: "",
      accentB: "",
      accentC: "",
      containerWidth: "wide",
    },
    layout: { ...DEFAULT_LAYOUT_PROPS, paddingTop: "32px", paddingBottom: "32px" },
  },
  render: ({ content, style, layout }) => {
    const c = (content || {}) as Record<string, string | undefined>;
    const st = (style || {}) as Record<string, string>;
    const l = (layout || {}) as Record<string, string>;
    const variant = dv(c as { designVariant?: string }, "gradient-card");
    const accentA = st.accentA?.trim() || ACCENT_FALLBACK;
    const accentB = st.accentB?.trim() || ACCENT_FALLBACK_2;
    const accentC = st.accentC?.trim() || ACCENT_FALLBACK_3;

    const bannerInner = (
      <div className="relative overflow-hidden rounded-[28px] p-px shadow-2xl">
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${accentA}, ${accentB} 50%, ${accentC})`,
          }}
        />
        <div
          className="relative flex flex-col items-center gap-6 rounded-[27px] px-6 py-12 text-center md:px-12 md:py-16"
          style={{ background: "rgba(11,18,32,0.92)" }}
        >
          <NoiseOverlay opacity={0.06} />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
            style={{ background: `radial-gradient(circle, ${accentA}66, transparent 70%)` }}
          />
          <div className="relative z-10 flex flex-col items-center gap-4">
            {c.eyebrow ? <EyebrowChip tone="dark">{highlightDynamicTags(c.eyebrow)}</EyebrowChip> : null}
            <h2 className="max-w-2xl text-balance text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-[2.5rem]">
              {highlightDynamicTags(c.title)}
            </h2>
            {c.body ? (
              <p className="max-w-xl text-base leading-relaxed text-white/80 md:text-lg">
                {highlightDynamicTags(c.body)}
              </p>
            ) : null}
          </div>
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 pt-2">
            {c.primaryLabel?.trim() ? (
              <a
                href={c.primaryHref || "#"}
                className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition hover:scale-[1.02]"
              >
                {c.primaryLabel}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
              </a>
            ) : null}
            {c.secondaryLabel?.trim() ? (
              <a
                href={c.secondaryHref || "#"}
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.06] px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/[0.1]"
              >
                {c.secondaryLabel}
              </a>
            ) : null}
          </div>
          {c.microcopy?.trim() ? (
            <p className="relative z-10 text-xs text-white/60">
              {highlightDynamicTags(c.microcopy)}
            </p>
          ) : null}
        </div>
      </div>
    );

    const ribbonInner = (
      <div
        className="flex flex-col items-center justify-between gap-6 overflow-hidden rounded-3xl px-8 py-8 md:flex-row md:px-12"
        style={{ background: `linear-gradient(135deg, ${accentA}, ${accentB})` }}
      >
        <div className="text-center md:text-left">
          {c.eyebrow ? (
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
              {c.eyebrow}
            </span>
          ) : null}
          <h2 className="mt-3 text-balance text-2xl font-bold tracking-tight text-white md:text-3xl">
            {highlightDynamicTags(c.title)}
          </h2>
          {c.body ? <p className="mt-2 max-w-md text-sm text-white/80 md:text-base">{highlightDynamicTags(c.body)}</p> : null}
        </div>
        {c.primaryLabel?.trim() ? (
          <a
            href={c.primaryHref || "#"}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:scale-[1.02]"
          >
            {c.primaryLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        ) : null}
      </div>
    );

    return (
      <PremiumSection tone="light" decoration="none" layout={l} containerWidth={st.containerWidth || "wide"}>
        {variant === "ribbon" ? ribbonInner : bannerInner}
      </PremiumSection>
    );
  },
};

/* -------------------------------------------------------------------------- */
/*  Export configs                                                             */
/* -------------------------------------------------------------------------- */

export const saasLandingBlockConfigs: Config["components"] = {
  NavBarBlock: navBarBlock,
  HeroSplitBlock: heroSplitBlock,
  LogoCloudBlock: logoCloudBlock,
  SupportFeaturesBlock: supportFeaturesBlock,
  FeatureGridBlock: featureGridBlock,
  BenefitsShowcaseBlock: benefitsShowcaseBlock,
  PricingPlansBlock: pricingPlansBlock,
  TestimonialLeadBlock: testimonialLeadBlock,
  FooterMegaBlock: footerMegaBlock,
  StatsBlock: statsBlock,
  FaqBlock: faqBlock,
  CtaBannerBlock: ctaBannerBlock,
};

/** Block types that open the “choose a layout” dialog when inserted from the Puck sidebar. */
export const SAAS_LANDING_PICKABLE_TYPES = [
  "NavBarBlock",
  "HeroSplitBlock",
  "LogoCloudBlock",
  "SupportFeaturesBlock",
  "FeatureGridBlock",
  "BenefitsShowcaseBlock",
  "PricingPlansBlock",
  "TestimonialLeadBlock",
  "FooterMegaBlock",
  "StatsBlock",
  "FaqBlock",
  "CtaBannerBlock",
] as const;

export type SaasLandingPickableType = (typeof SAAS_LANDING_PICKABLE_TYPES)[number];

export function isSaasLandingPickableType(t: string): t is SaasLandingPickableType {
  return (SAAS_LANDING_PICKABLE_TYPES as readonly string[]).includes(t);
}

/** Deep clone of a block’s `defaultProps` for variant presets (JSON-safe). */
export function getSaasLandingDefaultProps(type: string): Record<string, unknown> | null {
  if (!isSaasLandingPickableType(type)) return null;
  const cfg = saasLandingBlockConfigs[type];
  const dp = cfg && "defaultProps" in cfg ? cfg.defaultProps : null;
  if (!dp || typeof dp !== "object") return null;
  return JSON.parse(JSON.stringify(dp)) as Record<string, unknown>;
}
