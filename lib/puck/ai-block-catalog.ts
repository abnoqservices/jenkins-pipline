/**
 * AI block catalog — server-friendly source of truth for the /api/puck-ai
 * route. Mirrors the actual block configs (engage-puck-config, saas-landing-blocks,
 * product-detail-blocks, cms-blocks, embed-blocks) but as plain data that
 * doesn't pull React or "use client" code into the Node runtime.
 *
 * Two purposes:
 *   1. `AI_BLOCK_REGISTRY` — defaults used by the sanitizer to normalize
 *      anything the model emits.
 *   2. `buildBlockCatalogPrompt()` — compact reference inserted into the
 *      system prompt so the model knows every block, every variant, every
 *      content field.
 *
 * Keep this in sync with the block configs. The sanitizer merges AI props
 * over `defaultProps` here, so missing fields gracefully fall back.
 */

import { DEFAULT_LAYOUT_PROPS } from "@/lib/puck/layout-fields";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export type AiBlockArrayItem = Record<string, string | number | boolean | unknown>;

export type AiBlockDefaults = {
  /** Default content props (object). */
  content: Record<string, unknown>;
  /** Default style props (object). */
  style: Record<string, unknown>;
  /** Default layout props. */
  layout: Record<string, string>;
};

export type AiBlockSpec = {
  type: string;
  label: string;
  /** One-line summary of when this block is appropriate. */
  description: string;
  /** Variant ids the AI can choose between (if any). */
  variants?: Array<{ id: string; description: string }>;
  /** Content field reference for the prompt. */
  contentSchema: string;
  /** Style field reference (color, tone, decoration etc.) for the prompt. */
  styleSchema?: string;
  /** Allow unbounded array sizes? Otherwise we cap at 12 to keep pages sane. */
  arrayCap?: number;
  defaults: AiBlockDefaults;
  /**
   * Names of array fields under content. Sanitizer iterates them and
   * uses `arrayItemDefaults` to fill missing slots inside each item.
   */
  arrayFields?: Array<{
    name: string;
    itemDefaults: Record<string, unknown>;
    /** Optional max items per page (defaults to 12). */
    maxItems?: number;
    /** Nested array fields, e.g. PricingPlansBlock plans[].features[]. */
    nestedArrayFields?: Array<{
      name: string;
      itemDefaults: Record<string, unknown>;
      maxItems?: number;
    }>;
  }>;
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const L = { ...DEFAULT_LAYOUT_PROPS } as Record<string, string>;
const Lp = (paddingTop = "64px", paddingBottom = "64px"): Record<string, string> => ({
  ...L,
  paddingTop,
  paddingBottom,
});

/* -------------------------------------------------------------------------- */
/*  Block specs                                                                */
/* -------------------------------------------------------------------------- */

const heroBasicSpec: AiBlockSpec = {
  type: "HeroBlock",
  label: "Hero (simple)",
  description:
    "Lightweight hero with eyebrow + title + subtitle. Use only when a full-bleed marketing hero is overkill. Prefer HeroSplitBlock for landing pages.",
  contentSchema: `{ "eyebrow": string, "title": string, "subtitle": string }`,
  styleSchema: `{ "sectionBackgroundColor": "#hex", "decoration": "none"|"gradient"|"noise", "headingColor": "#hex", "subtitleColor": "#hex", "align": "left"|"center"|"right", "borderColor": "#hex", "containerWidth": "narrow"|"normal"|"wide"|"full" }`,
  defaults: {
    content: { eyebrow: "", title: "Title", subtitle: "" },
    style: {
      sectionBackgroundColor: "",
      decoration: "none",
      headingColor: "",
      subtitleColor: "",
      align: "center",
      borderColor: "",
      containerWidth: "normal",
    },
    layout: Lp("32px", "32px"),
  },
};

const textBlockSpec: AiBlockSpec = {
  type: "TextBlock",
  label: "Rich text",
  description: "Free-form paragraph. Multi-line text is fine — line breaks render.",
  contentSchema: `{ "text": string }`,
  styleSchema: `{ "textColor": "#hex", "backgroundColor": "#hex", "align": "left"|"center"|"right", "sizing": "sm"|"base"|"lg"|"xl", "containerWidth": "narrow"|"normal"|"wide"|"full" }`,
  defaults: {
    content: { text: "" },
    style: { textColor: "", backgroundColor: "", align: "left", sizing: "base", containerWidth: "normal" },
    layout: { ...L },
  },
};

const ctaBlockSpec: AiBlockSpec = {
  type: "CtaBlock",
  label: "Standalone button",
  description:
    "Single CTA row with optional secondary button. For long-form pages, prefer CtaBannerBlock or rely on CTAs inside HeroSplitBlock.",
  contentSchema: `{ "label": string, "href": string, "secondaryLabel": string, "secondaryHref": string }`,
  styleSchema: `{ "alignment": "left"|"center"|"right", "variant": "solid"|"ghost"|"gradient", "size": "sm"|"md"|"lg", "buttonBackgroundColor": "#hex", "buttonTextColor": "#hex", "buttonRadius": "sharp"|"soft"|"round"|"pill", "buttonShadow": "none"|"soft"|"medium"|"elevated"|"glow" }`,
  defaults: {
    content: { label: "Get started", href: "#", secondaryLabel: "", secondaryHref: "#" },
    style: {
      alignment: "center",
      variant: "solid",
      size: "md",
      buttonBackgroundColor: "",
      buttonTextColor: "",
      buttonBorderColor: "",
      buttonRadius: "soft",
      buttonShadow: "soft",
      buttonRadiusPx: "",
      buttonFontWeight: "600",
    },
    layout: Lp("16px", "16px"),
  },
};

const imageBlockSpec: AiBlockSpec = {
  type: "ImageBlock",
  label: "Image",
  description: "Standalone image with optional caption. Use Unsplash or picsum URLs as placeholders.",
  contentSchema: `{ "src": "https://...", "alt": string, "caption": string }`,
  styleSchema: `{ "radius": "sharp"|"soft"|"round"|"pill", "shadow": "none"|"soft"|"medium"|"elevated"|"glow", "ratio": "auto"|"16/9"|"4/3"|"1/1"|"3/4", "fit": "cover"|"contain", "containerWidth": "narrow"|"normal"|"wide"|"full" }`,
  defaults: {
    content: { src: "", alt: "", caption: "" },
    style: { radius: "round", shadow: "soft", ratio: "auto", fit: "cover", containerWidth: "wide" },
    layout: Lp("16px", "16px"),
  },
};

const navBarSpec: AiBlockSpec = {
  type: "NavBarBlock",
  label: "Site nav",
  description: "Top of every landing page. Includes optional announcement bar, center links, login + sign-up CTAs.",
  variants: [
    { id: "marketing-full", description: "Centered link rail — classic SaaS nav" },
    { id: "centered-pill", description: "Floating glass pill nav — Linear / Vercel feel" },
    { id: "compact", description: "Tight horizontal bar for app dashboards" },
    { id: "docs-style", description: "Dark glass nav for developer / docs sites" },
  ],
  contentSchema: `{ "designVariant": variant id, "logoMode": "text"|"image", "logoText": string, "logoImageSrc": "https://..."|"", "announcement": string|"", "announcementHref": string, "links": [{ "label": string, "href": string }] (3-6), "loginLabel": string, "loginHref": string, "signUpLabel": string, "signUpHref": string }`,
  styleSchema: `{ "tone": "light"|"muted"|"dark", "customBg": "#hex"|"rgba(...)"|"", "logoColor": "#hex", "linkColor": "#hex", "ctaBg": "#hex", "ctaTextColor": "#hex", "sticky": "yes"|"no", "blur": "yes"|"no" }`,
  arrayFields: [{ name: "links", itemDefaults: { label: "Link", href: "#" }, maxItems: 7 }],
  defaults: {
    content: {
      designVariant: "marketing-full",
      logoMode: "text",
      logoText: "Brand",
      logoImageSrc: "",
      announcement: "",
      announcementHref: "#",
      links: [],
      loginLabel: "Sign in",
      loginHref: "#",
      signUpLabel: "Start free",
      signUpHref: "#",
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
    layout: { ...L, paddingTop: "0px", paddingBottom: "0px" },
  },
};

const heroSplitSpec: AiBlockSpec = {
  type: "HeroSplitBlock",
  label: "Marketing hero",
  description:
    "The big hero at the top of the page. Use this for almost every landing page. Pick a variant based on aesthetic.",
  variants: [
    { id: "split-asymmetric", description: "Copy left, hero media right with floating activity card" },
    { id: "stacked-center", description: "Centered headline + buttons, optional media below" },
    { id: "media-first", description: "Image leads on desktop, copy on the right" },
    { id: "spotlight", description: "Centered hero on dark background with spotlight glow — copy-only / dramatic" },
  ],
  contentSchema: `{ "designVariant": variant id, "eyebrow": string|"", "title": string (8-12 words, punchy), "titleAccent": string|"" (one word from title to gradient-highlight), "subtitle": string (1-2 sentences), "primaryLabel": string, "primaryHref": "#", "secondaryLabel": string|"", "secondaryHref": "#", "trustLine": string|"" (e.g. "★★★★★ 4.9/5 from 12,000+ teams"), "avatars": [{ "src": "https://i.pravatar.cc/64?img=N" }] (4 items), "imageSrc": "https://..."|"", "imageAlt": string, "floatCardTitle": string|"", "floatCardSubtitle": string|"" }`,
  styleSchema: `{ "tone": "light"|"muted"|"dark"|"gradient", "decoration": "mesh"|"grid"|"dots"|"spotlight"|"lines"|"none", "meshFrom": "#hex", "meshVia": "#hex", "meshTo": "#hex", "titleColor": "#hex"|"", "titleAccentColor": "#hex"|"", "subtitleColor": "#hex"|"", "buttonShadow": "soft"|"glow"|..., "buttonRadius": "soft"|"pill"|..., "containerWidth": "wide" }`,
  arrayFields: [{ name: "avatars", itemDefaults: { src: "" }, maxItems: 6 }],
  defaults: {
    content: {
      designVariant: "split-asymmetric",
      eyebrow: "",
      title: "",
      titleAccent: "",
      subtitle: "",
      primaryLabel: "Get started",
      primaryHref: "#",
      secondaryLabel: "",
      secondaryHref: "#",
      trustLine: "",
      avatars: [],
      imageSrc: "",
      imageAlt: "",
      floatCardTitle: "",
      floatCardSubtitle: "",
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
    layout: Lp("96px", "96px"),
  },
};

const logoCloudSpec: AiBlockSpec = {
  type: "LogoCloudBlock",
  label: "Social proof / logo cloud",
  description: "Customer / partner logos. Place right after the hero to anchor credibility.",
  variants: [
    { id: "marquee", description: "Animated horizontal scroll — Framer-style" },
    { id: "enterprise", description: "Boxed logo cells — enterprise trust wall" },
    { id: "pill", description: "Logos inside a single rounded pill" },
    { id: "social-proof", description: "Static row of grayscale logos" },
  ],
  contentSchema: `{ "designVariant": variant id, "eyebrow": string, "heading": string, "logos": [{ "name": string, "imageSrc": ""|"https://...", "href": "" }] (5-8) }`,
  styleSchema: `{ "tone": "light"|"muted"|"dark", "bg": "#hex"|"", "headingColor": "#hex", "containerWidth": "wide", "marqueeSpeed": "40" }`,
  arrayFields: [{ name: "logos", itemDefaults: { name: "Partner", imageSrc: "", href: "" }, maxItems: 12 }],
  defaults: {
    content: { designVariant: "marquee", eyebrow: "Trusted by", heading: "", logos: [] },
    style: { tone: "muted", bg: "", headingColor: "", containerWidth: "wide", marqueeSpeed: "40" },
    layout: Lp("48px", "48px"),
  },
};

const supportFeaturesSpec: AiBlockSpec = {
  type: "SupportFeaturesBlock",
  label: "Value + feature list",
  description: "Side-by-side narrative + feature list. Great for explaining the why before the what.",
  variants: [
    { id: "three-pillars", description: "Copy + ratings left, feature list right" },
    { id: "two-features", description: "Header copy + two large feature cards (gradient border)" },
    { id: "support-heavy", description: "Feature list first, narrative second" },
  ],
  contentSchema: `{ "designVariant": variant id, "eyebrow": string, "title": string, "body": string, "rating1Score": 5, "rating1Label": "4.9 / 5 · G2", "rating2Score": 5, "rating2Label": "4.8 / 5 · Capterra", "features": [{ "title": string, "body": string, "icon": emoji, "accent": "#hex"|"" }] (2-4) }`,
  styleSchema: `{ "tone": "light"|"muted"|"dark", "bg": "#hex", "decoration": "none"|"dots"|"grid"|"spotlight", "containerWidth": "wide", "cardShadow": "soft"|... }`,
  arrayFields: [{ name: "features", itemDefaults: { title: "Feature", body: "", icon: "✦", accent: "" }, maxItems: 6 }],
  defaults: {
    content: {
      designVariant: "three-pillars",
      eyebrow: "",
      title: "",
      body: "",
      rating1Score: 5,
      rating1Label: "",
      rating2Score: 5,
      rating2Label: "",
      features: [],
    },
    style: { tone: "light", bg: "", decoration: "none", containerWidth: "wide", cardShadow: "soft" },
    layout: Lp("96px", "96px"),
  },
};

const featureGridSpec: AiBlockSpec = {
  type: "FeatureGridBlock",
  label: "Feature grid (bento / cards)",
  description: "The 'what's inside' grid. Bento variant lets one card span 2x.",
  variants: [
    { id: "bento", description: "Mixed-size bento grid with one featured cell" },
    { id: "three-cards", description: "Equal three-column card grid" },
    { id: "scroll-rail", description: "Snap-scroll horizontal cards" },
  ],
  contentSchema: `{ "designVariant": variant id, "eyebrow": string, "heading": string, "description": string, "ctaLabel": string|"", "ctaHref": "#", "cards": [{ "title": string, "body": string, "icon": emoji, "tag": string|"", "imageSrc": ""|"https://...", "accentColor": "#hex"|"", "featured": "yes"|"no" }] (3-6, exactly 1 featured if bento) }`,
  styleSchema: `{ "tone": "light"|"muted"|"dark", "bg": "#hex", "decoration": "dots"|"grid"|"spotlight"|"mesh"|"none", "cardBg": "#hex", "cardShadow": "soft"|..., "cardRadius": "soft"|"round", "containerWidth": "wide" }`,
  arrayFields: [
    {
      name: "cards",
      itemDefaults: {
        title: "Feature",
        body: "",
        icon: "✦",
        tag: "",
        imageSrc: "",
        accentColor: "",
        featured: "no",
      },
      maxItems: 8,
    },
  ],
  defaults: {
    content: {
      designVariant: "bento",
      eyebrow: "",
      heading: "",
      description: "",
      ctaLabel: "",
      ctaHref: "#",
      cards: [],
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
    layout: Lp("96px", "96px"),
  },
};

const benefitsShowcaseSpec: AiBlockSpec = {
  type: "BenefitsShowcaseBlock",
  label: "Benefits + photo / dark bento",
  description: "Checklist of benefits paired with an image, or a dark full-bleed list.",
  variants: [
    { id: "checklist-photo", description: "Benefits left, photo right with stat overlay" },
    { id: "photo-first", description: "Image leads, checklist on the right" },
    { id: "dark-focus", description: "Full-bleed dark section with centered checklist" },
  ],
  contentSchema: `{ "designVariant": variant id, "eyebrow": string, "title": string, "description": string, "items": [{ "text": string, "body": string|"" }] (3-5), "imageSrc": ""|"https://...", "imageAlt": string, "overlayTitle": string|"", "overlayMetric": string|"", "ctaLabel": string|"", "ctaHref": "#" }`,
  styleSchema: `{ "tone": "light"|"muted"|"dark", "bg": "#hex", "decoration": "dots"|"spotlight"|"mesh"|"none", "containerWidth": "wide", "imageRadiusPx": "20" }`,
  arrayFields: [{ name: "items", itemDefaults: { text: "Benefit", body: "" }, maxItems: 8 }],
  defaults: {
    content: {
      designVariant: "checklist-photo",
      eyebrow: "",
      title: "",
      description: "",
      items: [],
      imageSrc: "",
      imageAlt: "",
      overlayTitle: "",
      overlayMetric: "",
      ctaLabel: "",
      ctaHref: "#",
    },
    style: { tone: "light", bg: "", decoration: "none", containerWidth: "wide", imageRadiusPx: "20" },
    layout: Lp("96px", "96px"),
  },
};

const statsSpec: AiBlockSpec = {
  type: "StatsBlock",
  label: "Stats / metrics row",
  description: "Four-up stat grid with gradient numbers.",
  variants: [{ id: "row", description: "Four-up metrics row with dividers" }],
  contentSchema: `{ "designVariant": "row", "eyebrow": string, "heading": string, "body": string, "stats": [{ "value": "12k+"|"+38%"|..., "label": string, "hint": string|"" }] (3-4) }`,
  styleSchema: `{ "tone": "light"|"muted"|"dark", "bg": "#hex", "decoration": "none"|"dots"|"grid"|"spotlight", "containerWidth": "wide" }`,
  arrayFields: [{ name: "stats", itemDefaults: { value: "100", label: "Metric", hint: "" }, maxItems: 4 }],
  defaults: {
    content: { designVariant: "row", eyebrow: "", heading: "", body: "", stats: [] },
    style: { tone: "muted", bg: "", decoration: "none", containerWidth: "wide" },
    layout: Lp("80px", "80px"),
  },
};

const pricingPlansSpec: AiBlockSpec = {
  type: "PricingPlansBlock",
  label: "Pricing plans",
  description: "Plan comparison cards. Include 2-3 plans, mark one as highlighted.",
  variants: [
    { id: "three-tier", description: "Three columns with highlighted middle tier (gradient border)" },
    { id: "yearly-default", description: "Stacked rows — full-width plan rows" },
    { id: "solo-pro", description: "Two-up spotlight (e.g. solo vs team)" },
  ],
  contentSchema: `{ "designVariant": variant id, "eyebrow": string, "title": string, "subtitle": string, "billingMode": "monthly"|"yearly", "plans": [{ "name": string, "tagline": string, "priceMonthly": "$0"|"$19"|"Custom", "priceYearly": ..., "priceNote": "/mo"|"/user · /mo"|..., "highlighted": "yes"|"no", "badge": string|"", "features": [{ "line": string, "muted": "no"|"yes" }], "ctaLabel": string, "ctaHref": "#" }] (2-3) }`,
  styleSchema: `{ "tone": "light"|"muted"|"dark", "bg": "#hex", "decoration": "dots"|"grid"|"spotlight"|"none", "highlightAccent": "#hex", "highlightAccent2": "#hex", "containerWidth": "wide" }`,
  arrayFields: [
    {
      name: "plans",
      itemDefaults: {
        name: "Plan",
        tagline: "",
        priceMonthly: "$0",
        priceYearly: "$0",
        priceNote: "/mo",
        highlighted: "no",
        badge: "",
        features: [],
        ctaLabel: "Get started",
        ctaHref: "#",
      },
      maxItems: 4,
      nestedArrayFields: [{ name: "features", itemDefaults: { line: "Feature", muted: "no" }, maxItems: 12 }],
    },
  ],
  defaults: {
    content: {
      designVariant: "three-tier",
      eyebrow: "",
      title: "",
      subtitle: "",
      billingMode: "monthly",
      plans: [],
    },
    style: { tone: "muted", bg: "", decoration: "dots", highlightAccent: "", highlightAccent2: "", containerWidth: "wide" },
    layout: Lp("96px", "96px"),
  },
};

const testimonialLeadSpec: AiBlockSpec = {
  type: "TestimonialLeadBlock",
  label: "Testimonial + lead form",
  description: "Big testimonial paired with a contact / demo form. Conversion magnet.",
  variants: [
    { id: "split-glass", description: "Quote in glass card on the left, lead form right" },
    { id: "stacked-cta", description: "Centered testimonial with form card below" },
    { id: "form-first", description: "Form on the left, story on the right" },
  ],
  contentSchema: `{ "designVariant": variant id, "eyebrow": string, "title": string, "quote": string, "author": string, "authorRole": string, "authorAvatarSrc": ""|"https://...", "avatars": [{"src": "https://i.pravatar.cc/64?img=N"}] (3-4), "formTitle": string, "formSubtitle": string, "nameLabel": string, "emailPlaceholder": string, "messagePlaceholder": string, "buttonLabel": string, "formAction": "#" }`,
  styleSchema: `{ "tone": "light"|"muted"|"dark", "bg": "#hex", "accentA": "#hex", "accentB": "#hex", "containerWidth": "wide" }`,
  arrayFields: [{ name: "avatars", itemDefaults: { src: "" }, maxItems: 6 }],
  defaults: {
    content: {
      designVariant: "split-glass",
      eyebrow: "",
      title: "",
      quote: "",
      author: "",
      authorRole: "",
      authorAvatarSrc: "",
      avatars: [],
      formTitle: "Get in touch",
      formSubtitle: "We reply within one business day.",
      nameLabel: "Full name",
      emailPlaceholder: "Work email",
      messagePlaceholder: "Tell us what you're trying to ship...",
      buttonLabel: "Request a demo",
      formAction: "#",
    },
    style: { tone: "dark", bg: "", accentA: "", accentB: "", containerWidth: "wide" },
    layout: Lp("96px", "96px"),
  },
};

const faqSpec: AiBlockSpec = {
  type: "FaqBlock",
  label: "FAQ accordion",
  description: "Common questions before the closing CTA.",
  variants: [
    { id: "two-column", description: "Side-by-side intro + accordion" },
    { id: "stacked", description: "Centered intro above the accordion" },
  ],
  contentSchema: `{ "designVariant": variant id, "eyebrow": string, "heading": string, "body": string, "items": [{ "question": string, "answer": string }] (4-6), "ctaLabel": string|"", "ctaHref": "#", "ctaSubtext": string|"" }`,
  styleSchema: `{ "tone": "light"|"muted"|"dark", "bg": "#hex", "decoration": "none"|"dots"|"grid"|"spotlight", "containerWidth": "wide" }`,
  arrayFields: [{ name: "items", itemDefaults: { question: "Question", answer: "" }, maxItems: 12 }],
  defaults: {
    content: { designVariant: "two-column", eyebrow: "FAQ", heading: "", body: "", items: [], ctaLabel: "", ctaHref: "#", ctaSubtext: "" },
    style: { tone: "light", bg: "", decoration: "none", containerWidth: "wide" },
    layout: Lp("96px", "96px"),
  },
};

const ctaBannerSpec: AiBlockSpec = {
  type: "CtaBannerBlock",
  label: "Closing CTA banner",
  description: "Show-stopping closer right before the footer. Always include this on long landing pages.",
  variants: [
    { id: "gradient-card", description: "Centered CTA inside a multi-stop gradient panel" },
    { id: "ribbon", description: "Slim horizontal banner — copy left, single button right" },
  ],
  contentSchema: `{ "designVariant": variant id, "eyebrow": string, "title": string, "body": string, "primaryLabel": string, "primaryHref": "#", "secondaryLabel": string|"", "secondaryHref": "#", "microcopy": string|"" }`,
  styleSchema: `{ "accentA": "#hex", "accentB": "#hex", "accentC": "#hex", "containerWidth": "wide" }`,
  defaults: {
    content: {
      designVariant: "gradient-card",
      eyebrow: "",
      title: "",
      body: "",
      primaryLabel: "Get started",
      primaryHref: "#",
      secondaryLabel: "",
      secondaryHref: "#",
      microcopy: "",
    },
    style: { accentA: "", accentB: "", accentC: "", containerWidth: "wide" },
    layout: Lp("32px", "32px"),
  },
};

const footerMegaSpec: AiBlockSpec = {
  type: "FooterMegaBlock",
  label: "Footer (mega)",
  description: "Always include at the bottom of the page.",
  variants: [
    { id: "mega-cta", description: "Mega gradient CTA + newsletter + 3 link columns" },
    { id: "product-focused", description: "Centered brand + columns below" },
    { id: "minimal-legal", description: "Slim single-strip footer — minimal chrome" },
  ],
  contentSchema: `{ "designVariant": variant id, "logoMode": "text"|"image", "logoText": string, "logoImageSrc": "", "tagline": string, "ctaTitle": string|"", "ctaSubtitle": string|"", "ctaLabel": string|"", "ctaHref": "#", "newsletterPlaceholder": string, "newsletterAction": "#", "socials": [{"label": "X", "href": "#", "icon": "𝕏"}], "columns": [{"heading": string, "links": [{"label": string, "href": "#"}] (3-5) }] (2-3), "copyright": string, "legalLink1Label": "Terms", "legalLink1Href": "#", "legalLink2Label": "Privacy", "legalLink2Href": "#" }`,
  styleSchema: `{ "tone": "light"|"dark", "bg": "#hex", "accentA": "#hex", "accentB": "#hex" }`,
  arrayFields: [
    { name: "socials", itemDefaults: { label: "Social", href: "#", icon: "·" }, maxItems: 8 },
    {
      name: "columns",
      itemDefaults: { heading: "Section", links: [] },
      maxItems: 4,
      nestedArrayFields: [{ name: "links", itemDefaults: { label: "Link", href: "#" }, maxItems: 8 }],
    },
  ],
  defaults: {
    content: {
      designVariant: "mega-cta",
      logoMode: "text",
      logoText: "Brand",
      logoImageSrc: "",
      tagline: "",
      ctaTitle: "",
      ctaSubtitle: "",
      ctaLabel: "",
      ctaHref: "#",
      newsletterPlaceholder: "you@work.com",
      newsletterAction: "#",
      socials: [],
      columns: [],
      copyright: "© 2026",
      legalLink1Label: "Terms",
      legalLink1Href: "#",
      legalLink2Label: "Privacy",
      legalLink2Href: "#",
    },
    style: { tone: "dark", bg: "", accentA: "", accentB: "" },
    layout: Lp("80px", "32px"),
  },
};

/* -------------------------------------------------------------------------- */
/*  Product detail blocks                                                      */
/* -------------------------------------------------------------------------- */

const productHeaderSpec: AiBlockSpec = {
  type: "ProductHeaderBlock",
  label: "Product header (PDP hero)",
  description: "Title, price, badge, rating, primary CTA. The buy box for product detail pages.",
  variants: [
    { id: "hero", description: "Large hero with full price block + trust badges" },
    { id: "compact-bar", description: "Single-row title + price + CTA" },
    { id: "card", description: "Bordered summary card with gradient border" },
  ],
  contentSchema: `{ "designVariant": variant id, "eyebrow": string, "title": string, "subtitle": string, "sku": string, "rating": "4.9 · 1,247 reviews", "ratingValue": 5, "price": "$129"|"{{product.price}}", "compareAtPrice": "$159"|"", "discountLabel": "−25%"|"", "badge": "Best seller"|"", "stockHint": string, "trustItems": [{"icon": emoji, "text": string}] (2-4), "ctaLabel": "Add to cart", "ctaHref": "#", "secondaryCtaLabel": "Save"|"", "secondaryCtaHref": "#" }`,
  styleSchema: `{ "tone": "light"|"muted"|"dark", "sectionBg": "#hex", "accentA": "#hex", "accentB": "#hex", "containerWidth": "wide" }`,
  arrayFields: [{ name: "trustItems", itemDefaults: { icon: "✓", text: "Trust" }, maxItems: 6 }],
  defaults: {
    content: {
      designVariant: "hero",
      eyebrow: "",
      title: "{{product.name}}",
      subtitle: "{{product.description}}",
      sku: "",
      rating: "",
      ratingValue: 5,
      price: "{{product.price}}",
      compareAtPrice: "",
      discountLabel: "",
      badge: "",
      stockHint: "",
      trustItems: [],
      ctaLabel: "Add to cart",
      ctaHref: "#",
      secondaryCtaLabel: "",
      secondaryCtaHref: "#",
    },
    style: { tone: "light", sectionBg: "", accentA: "", accentB: "", containerWidth: "wide" },
    layout: Lp("32px", "32px"),
  },
};

const productGallerySpec: AiBlockSpec = {
  type: "ProductGalleryBlock",
  label: "Product gallery",
  description: "Image gallery for PDP. Use {{product.image_url}} / {{product.image_1}} placeholders when product context is provided.",
  variants: [
    { id: "sidebar-thumbs", description: "Main image with vertical thumbnails" },
    { id: "stacked", description: "Main image with horizontal thumbnail strip" },
    { id: "carousel", description: "Single stage with arrows + dots" },
  ],
  contentSchema: `{ "designVariant": variant id, "badge": string|"", "mainSrc": "{{product.image_url}}"|"https://...", "mainAlt": string, "thumbs": [{"src": "{{product.image_1}}"|...}] (3-5) }`,
  styleSchema: `{ "sectionBg": "#hex", "mainMaxHeightPx": "640", "mainMaxWidthPx": "960", "thumbSizePx": "72", "cardRadiusPx": "24" }`,
  arrayFields: [{ name: "thumbs", itemDefaults: { src: "" }, maxItems: 8 }],
  defaults: {
    content: {
      designVariant: "sidebar-thumbs",
      badge: "",
      mainSrc: "{{product.image_url}}",
      mainAlt: "{{product.name}}",
      thumbs: [],
    },
    style: { sectionBg: "#fafafa", mainMaxHeightPx: "640", mainMaxWidthPx: "960", thumbSizePx: "72", cardRadiusPx: "24" },
    layout: Lp("16px", "24px"),
  },
};

const productSpecsSpec: AiBlockSpec = {
  type: "ProductSpecsBlock",
  label: "Product specifications",
  description: "Spec table / grid for PDP.",
  variants: [
    { id: "grid", description: "Each spec in its own card with icon" },
    { id: "table", description: "Striped two-column table" },
    { id: "inline", description: "Compact label / value pairs" },
  ],
  contentSchema: `{ "designVariant": variant id, "eyebrow": string, "title": string, "body": string, "specs": [{"icon": emoji, "label": string, "value": string}] (4-8) }`,
  styleSchema: `{ "tone": "light"|"muted"|"dark", "sectionBg": "#hex", "containerWidth": "wide" }`,
  arrayFields: [{ name: "specs", itemDefaults: { icon: "·", label: "Spec", value: "—" }, maxItems: 12 }],
  defaults: {
    content: { designVariant: "grid", eyebrow: "", title: "", body: "", specs: [] },
    style: { tone: "muted", sectionBg: "", containerWidth: "wide" },
    layout: Lp("64px", "64px"),
  },
};

const productHighlightsSpec: AiBlockSpec = {
  type: "ProductHighlightsBlock",
  label: "Product highlights",
  description: "Why-buy list with icons. Different from features — these are PDP-style benefits.",
  variants: [
    { id: "icon-row", description: "Centered three-up icon row" },
    { id: "stacked-cards", description: "Vertical cards with icon + narrative" },
    { id: "bullets", description: "Compact checklist" },
  ],
  contentSchema: `{ "designVariant": variant id, "eyebrow": string, "title": string, "body": string, "items": [{"icon": emoji, "title": string, "body": string}] (3-5) }`,
  styleSchema: `{ "tone": "light"|"muted"|"dark", "sectionBg": "#hex", "containerWidth": "wide" }`,
  arrayFields: [{ name: "items", itemDefaults: { icon: "✓", title: "Highlight", body: "" }, maxItems: 6 }],
  defaults: {
    content: { designVariant: "icon-row", eyebrow: "", title: "", body: "", items: [] },
    style: { tone: "light", sectionBg: "", containerWidth: "wide" },
    layout: Lp("80px", "80px"),
  },
};

const productTabsSpec: AiBlockSpec = {
  type: "ProductTabsContentBlock",
  label: "Product tabs (description / shipping / etc.)",
  description: "Long-form panels — description, specs prose, shipping policy.",
  variants: [
    { id: "underline", description: "Horizontal tabs with underline" },
    { id: "accordion", description: "Expand/collapse panels" },
    { id: "pills", description: "Pill buttons + single content panel" },
  ],
  contentSchema: `{ "designVariant": variant id, "eyebrow": string, "tabs": [{"tabLabel": string, "body": string}] (2-4) }`,
  styleSchema: `{ "tone": "light"|"muted"|"dark", "sectionBg": "#hex", "containerWidth": "normal" }`,
  arrayFields: [{ name: "tabs", itemDefaults: { tabLabel: "Tab", body: "" }, maxItems: 6 }],
  defaults: {
    content: { designVariant: "underline", eyebrow: "", tabs: [] },
    style: { tone: "light", sectionBg: "", containerWidth: "normal" },
    layout: Lp("56px", "64px"),
  },
};

/* -------------------------------------------------------------------------- */
/*  Form embed block — preferred way to render a real lead-capture form        */
/* -------------------------------------------------------------------------- */

const formEmbedSpec: AiBlockSpec = {
  type: "FormEmbedBlock",
  label: "Form (admin-built)",
  description:
    "Use when the user wants a contact form, lead form, demo request, or signup that should record submissions. Renders one of the user's admin-created forms by id/slug. Leave formIdentifier empty — the user will pick a real form afterward in the sidebar.",
  variants: [
    { id: "card", description: "Centered glass card containing the form" },
    { id: "split", description: "Two-column layout: copy on the left, form on the right" },
    { id: "minimal", description: "Plain inline form, no surrounding chrome" },
  ],
  contentSchema: `{ "designVariant": variant id, "eyebrow": string, "heading": string, "body": string, "formIdentifier": "" (always empty — user picks afterward), "formTitle": string|"" }`,
  styleSchema: `{ "tone": "light"|"muted"|"dark" }`,
  defaults: {
    content: {
      designVariant: "card",
      eyebrow: "Get in touch",
      heading: "Talk to our team",
      body: "Tell us a little about what you're building — we'll send relevant resources within a day.",
      formIdentifier: "",
      formTitle: "",
    },
    style: { tone: "muted" },
    layout: Lp("64px", "64px"),
  },
};

/* -------------------------------------------------------------------------- */
/*  Custom code block — AI fallback for sections we don't have a block for     */
/* -------------------------------------------------------------------------- */

const customCodeSpec: AiBlockSpec = {
  type: "CustomCodeBlock",
  label: "Custom code (HTML / CSS / JS)",
  description:
    "Use ONLY when no other block in this catalog is a good fit (e.g. a custom UI in the user's screenshot that doesn't match any existing section). The block injects raw HTML, CSS, and JS into the page. Prefer the rich landing/product blocks above whenever they can be styled to match.",
  contentSchema: `{ "html": string (semantic markup, root element MUST have class equal to scopeClass), "css": string (every selector MUST be prefixed with .scopeClass), "javascript": string (vanilla JS in an IIFE; queries scoped via document.querySelector(".scopeClass ...")), "scopeClass": "lp-cc-XXXXXXXX" (unique 8-12 char alphanumeric class — invent one per block, never reuse), "isolation": "inherit"|"isolated" }`,
  styleSchema: undefined,
  defaults: {
    content: { html: "", css: "", javascript: "", scopeClass: "", isolation: "inherit" },
    style: {},
    layout: Lp("32px", "32px"),
  },
};

const productRelatedSpec: AiBlockSpec = {
  type: "ProductRelatedBlock",
  label: "Related products",
  description: "Cross-sell on the PDP.",
  variants: [
    { id: "grid", description: "Four-up image cards" },
    { id: "list", description: "Vertical list — image left, info right" },
    { id: "rail", description: "Horizontal scroll rail" },
  ],
  contentSchema: `{ "designVariant": variant id, "eyebrow": string, "title": string, "body": string, "ctaLabel": string|"", "ctaHref": "#", "products": [{"name": string, "price": string, "compareAtPrice": string|"", "tag": string|"", "href": "#", "imageSrc": "{{product.image_1}}"|""}] (3-6) }`,
  styleSchema: `{ "tone": "light"|"muted"|"dark", "sectionBg": "#hex", "containerWidth": "wide" }`,
  arrayFields: [
    {
      name: "products",
      itemDefaults: { name: "Product", price: "$0", compareAtPrice: "", tag: "", href: "#", imageSrc: "" },
      maxItems: 8,
    },
  ],
  defaults: {
    content: { designVariant: "grid", eyebrow: "", title: "", body: "", ctaLabel: "", ctaHref: "#", products: [] },
    style: { tone: "muted", sectionBg: "", containerWidth: "wide" },
    layout: Lp("80px", "80px"),
  },
};

/* -------------------------------------------------------------------------- */
/*  Registry                                                                   */
/* -------------------------------------------------------------------------- */

export const AI_BLOCK_REGISTRY: Record<string, AiBlockSpec> = {
  HeroBlock: heroBasicSpec,
  TextBlock: textBlockSpec,
  CtaBlock: ctaBlockSpec,
  ImageBlock: imageBlockSpec,
  NavBarBlock: navBarSpec,
  HeroSplitBlock: heroSplitSpec,
  LogoCloudBlock: logoCloudSpec,
  SupportFeaturesBlock: supportFeaturesSpec,
  FeatureGridBlock: featureGridSpec,
  BenefitsShowcaseBlock: benefitsShowcaseSpec,
  StatsBlock: statsSpec,
  PricingPlansBlock: pricingPlansSpec,
  TestimonialLeadBlock: testimonialLeadSpec,
  FaqBlock: faqSpec,
  CtaBannerBlock: ctaBannerSpec,
  FooterMegaBlock: footerMegaSpec,
  ProductHeaderBlock: productHeaderSpec,
  ProductGalleryBlock: productGallerySpec,
  ProductSpecsBlock: productSpecsSpec,
  ProductHighlightsBlock: productHighlightsSpec,
  ProductTabsContentBlock: productTabsSpec,
  ProductRelatedBlock: productRelatedSpec,
  FormEmbedBlock: formEmbedSpec,
  CustomCodeBlock: customCodeSpec,
};

export const AI_ALLOWED_BLOCK_TYPES = Object.keys(AI_BLOCK_REGISTRY) as Array<
  keyof typeof AI_BLOCK_REGISTRY
>;

export type AiAllowedBlockType = (typeof AI_ALLOWED_BLOCK_TYPES)[number];

/* -------------------------------------------------------------------------- */
/*  Prompt builder — compact reference inserted into the system prompt         */
/* -------------------------------------------------------------------------- */

function blockReference(spec: AiBlockSpec): string {
  const variants = spec.variants
    ? `\n  variants: ${spec.variants.map((v) => `"${v.id}" — ${v.description}`).join(" | ")}`
    : "";
  const styleLine = spec.styleSchema ? `\n  style props: ${spec.styleSchema}` : "";
  return `• ${spec.type} — ${spec.description}${variants}\n  content props: ${spec.contentSchema}${styleLine}`;
}

export function buildBlockCatalogPrompt(opts?: { includeProduct?: boolean }): string {
  const includeProduct = opts?.includeProduct !== false;
  const groups: Array<{ title: string; types: AiAllowedBlockType[] }> = [
    {
      title: "LANDING SECTIONS (compose pages from these)",
      types: [
        "NavBarBlock",
        "HeroSplitBlock",
        "LogoCloudBlock",
        "StatsBlock",
        "SupportFeaturesBlock",
        "FeatureGridBlock",
        "BenefitsShowcaseBlock",
        "PricingPlansBlock",
        "TestimonialLeadBlock",
        "FaqBlock",
        "CtaBannerBlock",
        "FooterMegaBlock",
      ],
    },
    {
      title: "BASIC BLOCKS (use sparingly, prefer the rich landing sections above)",
      types: ["HeroBlock", "TextBlock", "CtaBlock", "ImageBlock"],
    },
  ];
  if (includeProduct) {
    groups.push({
      title: "PRODUCT DETAIL SECTIONS (for PDPs / product landing pages)",
      types: [
        "ProductHeaderBlock",
        "ProductGalleryBlock",
        "ProductHighlightsBlock",
        "ProductSpecsBlock",
        "ProductTabsContentBlock",
        "ProductRelatedBlock",
      ],
    });
  }
  groups.push({
    title: "FORMS & FALLBACK",
    types: ["FormEmbedBlock", "CustomCodeBlock"],
  });

  return groups
    .map(
      (g) =>
        `### ${g.title}\n${g.types
          .map((t) => blockReference(AI_BLOCK_REGISTRY[t]))
          .join("\n\n")}`
    )
    .join("\n\n");
}

/* -------------------------------------------------------------------------- */
/*  Composition playbook + design rules                                        */
/* -------------------------------------------------------------------------- */

export const COMPOSITION_PLAYBOOK = `## COMPOSITION PLAYBOOK

A great SaaS landing page (in order):
  NavBarBlock → HeroSplitBlock → LogoCloudBlock → StatsBlock → FeatureGridBlock (bento) → SupportFeaturesBlock → BenefitsShowcaseBlock → PricingPlansBlock → TestimonialLeadBlock → FaqBlock → CtaBannerBlock → FooterMegaBlock

A great agency / portfolio landing page:
  NavBarBlock (compact) → HeroSplitBlock (stacked-center, no media) → FeatureGridBlock (three-cards) → BenefitsShowcaseBlock (photo-first) → TestimonialLeadBlock (form-first) → FooterMegaBlock (minimal-legal)

A great dev tool / docs-style landing page:
  NavBarBlock (docs-style) → HeroSplitBlock (spotlight, dark) → LogoCloudBlock (pill) → SupportFeaturesBlock (two-features) → StatsBlock → CtaBannerBlock → FooterMegaBlock (minimal-legal)

A great product detail page (PDP):
  NavBarBlock (compact) → ProductGalleryBlock → ProductHeaderBlock (hero) → ProductHighlightsBlock → ProductSpecsBlock → ProductTabsContentBlock → ProductRelatedBlock → CtaBannerBlock (ribbon) → FooterMegaBlock (product-focused)

Rules:
- Always start with NavBarBlock and end with FooterMegaBlock unless explicitly told otherwise.
- Prefer one big closing CTA (CtaBannerBlock) before the footer for SaaS landing pages.
- Don't repeat the same variant twice unless it serves a purpose (e.g. multiple FeatureGridBlocks with different bodies is OK).
- 8-12 blocks is ideal for a full landing page. 4-6 for a "section" or product page.`;

export const DESIGN_RULES = `## DESIGN & COPY RULES

Color palette (pick one cohesive triad and reuse across blocks):
  - Modern indigo (default): accent #6366f1, secondary #8b5cf6, tertiary #ec4899
  - Mint developer: accent #22d3ee, secondary #6366f1, tertiary #ec4899
  - Premium green: accent #1A3C34, secondary #52796F, tertiary #84a98c
  - Warm orange: accent #ea580c, secondary #f59e0b, tertiary #fbbf24
  - Royal blue: accent #2563eb, secondary #4f46e5, tertiary #7c3aed
  - Pink playful: accent #ec4899, secondary #f472b6, tertiary #fb923c

Tone selection per section:
  - Hero, Pricing, Features → "gradient" or "light" tone, with mesh / dots / spotlight decoration.
  - Testimonials, Footer, CTA banner → "dark" tone (creates rhythm against light sections).
  - Stats, Logos, Social proof → "muted" tone.

Image strategy:
  - Use https://images.unsplash.com/... for photos (search-by-keyword URLs).
  - Use https://i.pravatar.cc/64?img=N (N = 1..70) for avatar stacks.
  - Leave imageSrc as "" if no real image fits — the block renders a stylish placeholder.

Copy rules:
  - Headlines are 6-12 words, action-oriented, never starting with "Welcome to" or "Introducing".
  - Pick ONE word in the headline as titleAccent (gradient-highlighted) when using HeroSplitBlock.
  - Subtitles: one or two sentences, plain language, real specifics.
  - CTAs: imperative + 1-3 words ("Start free", "Book a demo", "See live", "Get the kit").
  - Eyebrows: 2-4 words, all caps tracking — categorize the section ("Why teams stay", "By the numbers", "Pricing", "Customer story").
  - Avoid lorem ipsum, em-dashes between every clause, and corporate filler ("synergize", "leverage", "unlock value").
  - Quotes must include a believable specific outcome (e.g. "We cut review cycles by 40%").

Forms:
  - Whenever the screenshot or prompt asks for a contact form, lead form, demo request, signup, waitlist, or newsletter signup, emit FormEmbedBlock and leave its formIdentifier as "" — the user picks a real admin-built form afterward.
  - For TestimonialLeadBlock and FooterMegaBlock, prefer their built-in form (set formMode="default" / newsletterMode="default"). Only set formMode="custom" if the user explicitly asks to use one of their existing admin forms — and again leave the *FormId fields empty (the user picks).
  - DO NOT generate raw <form>/<input> markup inside CustomCodeBlock for form purposes — submissions need to be captured.

Variant strategy:
  - HeroSplitBlock → split-asymmetric for SaaS, stacked-center for agencies/products, spotlight for dark/dramatic, media-first when the product is visual.
  - FeatureGridBlock → bento for hero feature pages, three-cards for capability lists, scroll-rail for editorial.
  - PricingPlansBlock → three-tier for SaaS, solo-pro for tools with 2 audiences, yearly-default for enterprise.
  - FooterMegaBlock → mega-cta unless minimalism is requested (then minimal-legal).

Structure:
  - 8-12 blocks for a full landing page is the sweet spot.
  - Always wire links/CTAs to "#" so the page is a self-contained preview.`;

/* -------------------------------------------------------------------------- */
/*  Few-shot example outputs (compact, valid JSON)                             */
/* -------------------------------------------------------------------------- */

export const SCREENSHOT_MODE_PROMPT = `## SCREENSHOT MODE

A reference screenshot has been attached. Reproduce it as faithfully as you can.

Section-mapping rules (follow strictly):
1. Walk the screenshot top to bottom, identifying each visual section.
2. For EACH section, look at the BLOCK CATALOG above and pick the FIRST block whose layout matches. Match the closest variant id (e.g. a centered headline + button + image = HeroSplitBlock with "split-asymmetric" or "stacked-center"). Do not invent variants.
3. Configure that block's content / style / layout to mirror the screenshot:
   - Copy the headline and subhead text verbatim if legible.
   - Match the color palette by sampling visible hex colors. Pick \`tone\`, \`decoration\`, and accent colors that visually approximate the section.
   - Match alignment, image placement (left/right/center), and number of items in lists / cards.
4. Use \`CustomCodeBlock\` ONLY when the section is genuinely unique (animated counter, iframe-style component, dashboard mockup, complex SVG illustration, custom chart, etc.) — and write the HTML / CSS / JS to look like the screenshot:
   - The block's content MUST include a unique 8-12 char "scopeClass" like "lp-cc-a3f2c8d1" — invent one per CustomCodeBlock, never reuse.
   - The HTML root element MUST have class equal to that scopeClass.
   - EVERY CSS selector MUST start with .scopeClass (no global rules, no html/body/* selectors).
   - JS goes inside an IIFE, queries scoped via \`document.querySelector(".\${scopeClass} ...")\`.
   - Aim for production-quality CSS: gradients, soft shadows, hover transitions, mobile media queries.
5. Image hints from the screenshot: emit photo-like placeholders as https://images.unsplash.com/... URLs (use neutral search terms when in doubt). Use https://i.pravatar.cc/64?img=N (1..70) for avatar stacks. If the screenshot shows a brand logo, treat it as a text logo with the visible brand name.
6. The generated page must START with NavBarBlock and END with FooterMegaBlock unless the screenshot is clearly a single component (e.g. a hero only).
7. Do not output explanatory text. JSON only.`;

export const FEW_SHOT_OUTLINE_EXAMPLES = `## FEW-SHOT — VALID OUTPUT SHAPES

For a request like "modern SaaS for design teams", a great minimal output looks like:

{
  "root": {
    "props": {
      "content": { "title": "Pixel — design ops, simplified" },
      "style": {
        "pageBackground": "#ffffff",
        "pageText": "#1f2937",
        "headingColor": "#0b1220",
        "mutedText": "#475569",
        "accentColor": "#6366f1",
        "buttonTextColor": "#ffffff"
      },
      "layout": { "marginTop": "0px", "marginBottom": "0px", "marginLeft": "0px", "marginRight": "0px", "paddingTop": "0px", "paddingBottom": "0px", "paddingLeft": "0px", "paddingRight": "0px", "maxWidth": "100%" }
    }
  },
  "content": [
    {
      "type": "NavBarBlock",
      "id": "nb1",
      "props": {
        "content": { "designVariant": "centered-pill", "logoText": "Pixel", "links": [{ "label": "Product", "href": "#" }, { "label": "Customers", "href": "#" }, { "label": "Pricing", "href": "#" }, { "label": "Docs", "href": "#" }], "loginLabel": "Sign in", "loginHref": "#", "signUpLabel": "Start free", "signUpHref": "#" },
        "style": { "tone": "light", "sticky": "yes", "blur": "yes" }
      }
    },
    {
      "type": "HeroSplitBlock",
      "id": "h1",
      "props": {
        "content": { "designVariant": "split-asymmetric", "eyebrow": "Design Ops · 2.0", "title": "Where every design decision actually lands.", "titleAccent": "lands", "subtitle": "Pixel is the workspace for designers who ship — keep specs, reviews, and decisions in one place.", "primaryLabel": "Start free", "primaryHref": "#", "secondaryLabel": "Watch the demo", "secondaryHref": "#", "trustLine": "★★★★★ 4.9 · 12,000+ designers", "avatars": [{ "src": "https://i.pravatar.cc/64?img=11" }, { "src": "https://i.pravatar.cc/64?img=12" }, { "src": "https://i.pravatar.cc/64?img=13" }, { "src": "https://i.pravatar.cc/64?img=14" }] },
        "style": { "tone": "gradient", "decoration": "mesh", "buttonShadow": "glow", "buttonRadius": "pill" }
      }
    }
  ]
}

(In a full response, content[] would have 10-12 blocks.)`;
