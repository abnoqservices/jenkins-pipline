import { DEFAULT_LAYOUT_PROPS } from "@/lib/puck/layout-fields";

/**
 * Five prebuilt "Templates for Products" — surfaced under the Products tab in
 * the template library picker. Each one stitches together NavBar +
 * ProductHeader + ProductGallery (carousel w/ autoplay + bubble dots) +
 * highlights/about + RelatedModelsBlock + ProductRelatedBlock + VideoBlock +
 * SocialIconsBlock + FormEmbedBlock + FooterMegaBlock — every section the
 * user listed, mobile-responsive throughout.
 *
 * Template #1 ("Aurora") doubles as the new default-on-signup seed
 * (`AuthController::defaultProductPuckDocument`).
 */

const layout = (paddingTop: string, paddingBottom: string) => ({
  ...DEFAULT_LAYOUT_PROPS,
  paddingTop,
  paddingBottom,
  paddingLeft: "0px",
  paddingRight: "0px",
});

/* -------------------------------------------------------------------------- */
/*  Theme presets                                                             */
/* -------------------------------------------------------------------------- */

const AURORA_ROOT: Record<string, unknown> = {
  props: {
    content: { title: "{{product.name}}" },
    style: {
      pageBackground: "#ffffff",
      pageText: "#1f2937",
      headingColor: "#0b1220",
      mutedText: "#475569",
      accentColor: "#0f766e",
      buttonTextColor: "#ffffff",
    },
    layout: layout("0px", "0px"),
  },
};

const ONYX_ROOT: Record<string, unknown> = {
  props: {
    content: { title: "{{product.name}}" },
    style: {
      pageBackground: "#0b0f1a",
      pageText: "#cbd5e1",
      headingColor: "#ffffff",
      mutedText: "#94a3b8",
      accentColor: "#f59e0b",
      buttonTextColor: "#0b0f1a",
    },
    layout: layout("0px", "0px"),
  },
};

const BAZAAR_ROOT: Record<string, unknown> = {
  props: {
    content: { title: "{{product.name}}" },
    style: {
      pageBackground: "#fff7ed",
      pageText: "#3a2a1f",
      headingColor: "#1f1305",
      mutedText: "#7a6a5d",
      accentColor: "#dc2626",
      buttonTextColor: "#ffffff",
    },
    layout: layout("0px", "0px"),
  },
};

const FORGE_ROOT: Record<string, unknown> = {
  props: {
    content: { title: "{{product.name}}" },
    style: {
      pageBackground: "#f8fafc",
      pageText: "#1e293b",
      headingColor: "#020617",
      mutedText: "#64748b",
      accentColor: "#6366f1",
      buttonTextColor: "#ffffff",
    },
    layout: layout("0px", "0px"),
  },
};

const RIVET_ROOT: Record<string, unknown> = {
  props: {
    content: { title: "{{product.name}}" },
    style: {
      pageBackground: "#faf6f1",
      pageText: "#3d2f24",
      headingColor: "#1c140d",
      mutedText: "#8a7560",
      accentColor: "#a16207",
      buttonTextColor: "#ffffff",
    },
    layout: layout("0px", "0px"),
  },
};

/* -------------------------------------------------------------------------- */
/*  Section helpers — the same ten sections, themed differently per template.  */
/*  Keeping these as pure functions makes each template definition readable.   */
/* -------------------------------------------------------------------------- */

type NavOpts = {
  brand: string;
  bg: string;
  textColor: string;
  ctaBg: string;
  ctaTextColor: string;
  tone?: "light" | "dark";
};

function navBar(opts: NavOpts) {
  return {
    type: "NavBarBlock",
    props: {
      content: {
        designVariant: "compact",
        logoMode: "text",
        logoText: opts.brand,
        announcement: "",
        announcementHref: "#",
        links: [
          { label: "Shop", href: "#" },
          { label: "Models", href: "#" },
          { label: "Stories", href: "#" },
          { label: "Support", href: "#" },
        ],
        loginLabel: "Sign in",
        loginHref: "#",
        signUpLabel: "Buy now",
        signUpHref: "#",
      },
      style: {
        tone: opts.tone || "light",
        customBg: opts.bg,
        sticky: "yes",
        blur: "yes",
        logoColor: opts.textColor,
        linkColor: opts.textColor,
        ctaBg: opts.ctaBg,
        ctaTextColor: opts.ctaTextColor,
      },
      layout: layout("0px", "0px"),
    },
  };
}

type HeaderOpts = {
  variant: "hero" | "card" | "compact-bar";
  badge?: string;
  bg: string;
  tone: "light" | "muted" | "dark";
  accentA?: string;
  accentB?: string;
  cta: string;
};

function productHeader(opts: HeaderOpts) {
  return {
    type: "ProductHeaderBlock",
    props: {
      content: {
        designVariant: opts.variant,
        eyebrow: "{{product.category}}",
        title: "{{product.name}}",
        subtitle: "{{product.description}}",
        sku: "SKU · {{product.sku}}",
        rating: "4.9 · 1,200+ reviews",
        ratingValue: 5,
        price: "{{product.price}}",
        compareAtPrice: "",
        discountLabel: "",
        badge: opts.badge || "",
        stockHint: "In stock · Ships in 1-2 business days",
        trustItems: [
          { icon: "🚚", text: "Free shipping" },
          { icon: "↩️", text: "30-day returns" },
          { icon: "🛡️", text: "2-year warranty" },
        ],
        ctaLabel: opts.cta,
        ctaHref: "#",
        secondaryCtaLabel: "Save",
        secondaryCtaHref: "#",
      },
      style: {
        tone: opts.tone,
        sectionBg: opts.bg,
        accentA: opts.accentA || "",
        accentB: opts.accentB || "",
        containerWidth: "wide",
      },
      layout: layout("32px", "32px"),
    },
  };
}

type GalleryOpts = {
  bg: string;
  variant: "carousel" | "stacked" | "sidebar-thumbs";
  autoplay?: boolean;
};

function productGallery(opts: GalleryOpts) {
  return {
    type: "ProductGalleryBlock",
    props: {
      content: {
        designVariant: opts.variant,
        badge: "",
        mainSrc: "{{product.image_url}}",
        mainAlt: "{{product.name}}",
        thumbs: [
          { src: "{{product.image_1}}" },
          { src: "{{product.image_2}}" },
          { src: "{{product.image_3}}" },
          { src: "{{product.image_4}}" },
        ],
        autoplay: opts.autoplay ? "yes" : "no",
        autoplayMs: "4000",
        pauseOnHover: "yes",
      },
      style: {
        sectionBg: opts.bg,
        mainMaxHeightPx: "640",
        mainMaxWidthPx: "1100",
        thumbSizePx: "72",
        cardRadiusPx: "24",
      },
      layout: layout("16px", "32px"),
    },
  };
}

type AboutOpts = {
  bg: string;
  tone: "light" | "muted" | "dark";
  brand: string;
};

function aboutUs(opts: AboutOpts) {
  return {
    type: "ProductHighlightsBlock",
    props: {
      content: {
        designVariant: "stacked-cards",
        eyebrow: "About " + opts.brand,
        title: "Built with intention. Made to last.",
        body: "We design products that earn their place in your daily life — engineered for years of use, not seasons.",
        items: [
          {
            icon: "🛠️",
            title: "Crafted in-house",
            body: "Every detail prototyped, tested, and refined by the same team that ships it.",
          },
          {
            icon: "🌱",
            title: "Responsibly sourced",
            body: "Materials chosen for their longevity and the people who make them.",
          },
          {
            icon: "💬",
            title: "Real human support",
            body: "Talk to the people who built it. Mon-Fri, every reply within 24 hours.",
          },
        ],
      },
      style: {
        tone: opts.tone,
        sectionBg: opts.bg,
        containerWidth: "wide",
      },
      layout: layout("64px", "64px"),
    },
  };
}

type ModelsOpts = {
  bg: string;
  tone: "light" | "muted" | "dark";
  variant: "grid" | "rail" | "list";
};

function relatedModels(opts: ModelsOpts) {
  return {
    type: "RelatedModelsBlock",
    props: {
      content: {
        designVariant: opts.variant,
        eyebrow: "Compare the lineup",
        title: "Other models in this family",
        body: "Find the right fit for your space, style, or budget.",
        ctaLabel: "View all models",
        ctaHref: "#",
        count: "6",
        models: [
          {
            name: "{{product.models.0.name}}",
            description: "{{product.models.0.description}}",
            tag: "",
            href: "#",
            imageSrc: "{{product.models.0.image_url}}",
          },
          {
            name: "{{product.models.1.name}}",
            description: "{{product.models.1.description}}",
            tag: "",
            href: "#",
            imageSrc: "{{product.models.1.image_url}}",
          },
          {
            name: "{{product.models.2.name}}",
            description: "{{product.models.2.description}}",
            tag: "",
            href: "#",
            imageSrc: "{{product.models.2.image_url}}",
          },
        ],
      },
      style: {
        tone: opts.tone,
        sectionBg: opts.bg,
        containerWidth: "wide",
      },
      layout: layout("64px", "64px"),
    },
  };
}

type RelatedOpts = {
  bg: string;
  tone: "light" | "muted" | "dark";
  variant: "grid" | "rail" | "list";
};

function relatedProducts(opts: RelatedOpts) {
  return {
    type: "ProductRelatedBlock",
    props: {
      content: {
        designVariant: opts.variant,
        eyebrow: "Customers also bought",
        title: "Pairs well with",
        body: "Hand-picked add-ons from the same category.",
        ctaLabel: "Shop the category",
        ctaHref: "#",
        products: [
          {
            name: "Companion accessory",
            price: "$29",
            compareAtPrice: "",
            tag: "",
            href: "#",
            imageSrc: "{{product.image_1}}",
          },
          {
            name: "Care kit",
            price: "$19",
            compareAtPrice: "",
            tag: "",
            href: "#",
            imageSrc: "{{product.image_2}}",
          },
          {
            name: "Premium upgrade",
            price: "$59",
            compareAtPrice: "$72",
            tag: "Save $13",
            href: "#",
            imageSrc: "{{product.image_3}}",
          },
          {
            name: "Bundle pack",
            price: "$99",
            compareAtPrice: "",
            tag: "Bundle",
            href: "#",
            imageSrc: "{{product.image_4}}",
          },
        ],
      },
      style: {
        tone: opts.tone,
        sectionBg: opts.bg,
        containerWidth: "wide",
      },
      layout: layout("64px", "64px"),
    },
  };
}

type VideoOpts = {
  variant: "cinematic" | "split" | "framed";
  tone: "light" | "muted" | "dark";
  bg: string;
  heading: string;
  body: string;
  ctaLabel?: string;
};

function videoSection(opts: VideoOpts) {
  return {
    type: "VideoBlock",
    props: {
      content: {
        designVariant: opts.variant,
        eyebrow: "See it in action",
        heading: opts.heading,
        body: opts.body,
        source: "youtube",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        posterSrc: "{{product.image_url}}",
        autoplay: "no",
        muted: "yes",
        loop: "no",
        controls: "yes",
        ctaLabel: opts.ctaLabel || "",
        ctaHref: "#",
      },
      style: {
        tone: opts.tone,
        sectionBg: opts.bg,
        containerWidth: "wide",
      },
      layout: layout("64px", "64px"),
    },
  };
}

type SocialOpts = {
  variant: "icon-row" | "pills" | "mono";
  tone: "light" | "muted" | "dark";
  bg: string;
  accentA?: string;
  accentB?: string;
};

function socialIcons(opts: SocialOpts) {
  return {
    type: "SocialIconsBlock",
    props: {
      content: {
        designVariant: opts.variant,
        eyebrow: "Stay connected",
        heading: "Follow along",
        body: "Behind the scenes, drops, and customer stories.",
        socials: [
          { label: "Instagram", href: "#", icon: "📷" },
          { label: "TikTok", href: "#", icon: "🎵" },
          { label: "YouTube", href: "#", icon: "▶" },
          { label: "X", href: "#", icon: "𝕏" },
          { label: "LinkedIn", href: "#", icon: "in" },
        ],
      },
      style: {
        tone: opts.tone,
        sectionBg: opts.bg,
        accentA: opts.accentA || "",
        accentB: opts.accentB || "",
        containerWidth: "normal",
      },
      layout: layout("48px", "48px"),
    },
  };
}

type FormOpts = {
  variant: "card" | "split" | "minimal";
  tone: "light" | "muted" | "dark";
  bg: string;
  heading: string;
  body: string;
};

function formSection(opts: FormOpts) {
  return {
    type: "FormEmbedBlock",
    props: {
      content: {
        designVariant: opts.variant,
        eyebrow: "Get in touch",
        heading: opts.heading,
        body: opts.body,
        formIdentifier: "",
        formTitle: "",
      },
      style: { tone: opts.tone, sectionBg: opts.bg },
      layout: layout("64px", "64px"),
    },
  };
}

type FooterOpts = {
  brand: string;
  tagline: string;
  bg: string;
  accentA: string;
  accentB: string;
  copyright: string;
  tone?: "light" | "dark";
};

function footer(opts: FooterOpts) {
  return {
    type: "FooterMegaBlock",
    props: {
      content: {
        designVariant: "product-focused",
        logoMode: "text",
        logoText: opts.brand,
        logoImageSrc: "",
        tagline: opts.tagline,
        columns: [
          {
            heading: "Shop",
            links: [
              { label: "All products", href: "#" },
              { label: "Models", href: "#" },
              { label: "Bundles", href: "#" },
            ],
          },
          {
            heading: "Company",
            links: [
              { label: "About", href: "#" },
              { label: "Stories", href: "#" },
              { label: "Sustainability", href: "#" },
            ],
          },
          {
            heading: "Help",
            links: [
              { label: "Shipping", href: "#" },
              { label: "Returns", href: "#" },
              { label: "Contact", href: "#" },
            ],
          },
        ],
        socials: [
          { label: "Instagram", href: "#", icon: "📷" },
          { label: "TikTok", href: "#", icon: "🎵" },
          { label: "YouTube", href: "#", icon: "▶" },
        ],
        ctaTitle: "",
        ctaSubtitle: "",
        ctaLabel: "",
        ctaHref: "#",
        newsletterMode: "default",
        newsletterFormId: "",
        newsletterPlaceholder: "you@email.com — get 10% off",
        newsletterAction: "#",
        copyright: opts.copyright,
        legalLink1Label: "Terms",
        legalLink1Href: "#",
        legalLink2Label: "Privacy",
        legalLink2Href: "#",
      },
      style: {
        tone: opts.tone || "dark",
        bg: opts.bg,
        accentA: opts.accentA,
        accentB: opts.accentB,
      },
      layout: layout("64px", "32px"),
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Template builders                                                          */
/* -------------------------------------------------------------------------- */

/** Template 1 — Aurora (modern minimal, doubles as default-on-signup seed). */
export function buildAuroraProductDocument(): Record<string, unknown> {
  return {
    root: AURORA_ROOT,
    content: [
      navBar({
        brand: "Aurora",
        bg: "rgba(255,255,255,0.94)",
        textColor: "#0b1220",
        ctaBg: "#0f766e",
        ctaTextColor: "#ffffff",
        tone: "light",
      }),
      productGallery({ bg: "#ffffff", variant: "carousel", autoplay: true }),
      productHeader({ variant: "card", bg: "#ffffff", tone: "light", cta: "Add to cart" }),
      aboutUs({ bg: "#f8fafc", tone: "muted", brand: "Aurora" }),
      relatedModels({ bg: "#ffffff", tone: "light", variant: "grid" }),
      relatedProducts({ bg: "#f8fafc", tone: "muted", variant: "grid" }),
      videoSection({
        variant: "framed",
        tone: "light",
        bg: "#ffffff",
        heading: "Watch how {{product.name}} works",
        body: "A short walkthrough of every detail that makes it ours.",
      }),
      socialIcons({ variant: "icon-row", tone: "light", bg: "#ffffff", accentA: "#0f766e", accentB: "#14b8a6" }),
      formSection({
        variant: "split",
        tone: "muted",
        bg: "#f8fafc",
        heading: "Questions? Talk to a real human.",
        body: "Tell us a bit about what you're after — we'll reply within a day.",
      }),
      footer({
        brand: "Aurora",
        tagline: "Quietly excellent products, made for the long run.",
        bg: "#0b1220",
        accentA: "#0f766e",
        accentB: "#14b8a6",
        copyright: "© 2026 Aurora.",
      }),
    ],
  };
}

/** Template 2 — Onyx (bold editorial, dark, large typography). */
export function buildOnyxProductDocument(): Record<string, unknown> {
  return {
    root: ONYX_ROOT,
    content: [
      navBar({
        brand: "ONYX",
        bg: "rgba(11,15,26,0.85)",
        textColor: "#ffffff",
        ctaBg: "#f59e0b",
        ctaTextColor: "#0b0f1a",
        tone: "dark",
      }),
      productHeader({
        variant: "hero",
        bg: "#0b0f1a",
        tone: "dark",
        accentA: "#f59e0b",
        accentB: "#fbbf24",
        cta: "Order now",
      }),
      productGallery({ bg: "#0b0f1a", variant: "carousel", autoplay: true }),
      aboutUs({ bg: "#111827", tone: "dark", brand: "Onyx" }),
      videoSection({
        variant: "cinematic",
        tone: "dark",
        bg: "#0b0f1a",
        heading: "Crafted to be worth watching",
        body: "60 seconds of every detail, in motion.",
      }),
      relatedModels({ bg: "#0b0f1a", tone: "dark", variant: "rail" }),
      relatedProducts({ bg: "#111827", tone: "dark", variant: "grid" }),
      socialIcons({ variant: "mono", tone: "dark", bg: "#0b0f1a" }),
      formSection({
        variant: "card",
        tone: "dark",
        bg: "#111827",
        heading: "Join the list",
        body: "Drops, restocks, and behind-the-scenes — once a week, never more.",
      }),
      footer({
        brand: "ONYX",
        tagline: "Made loud. Built to last.",
        bg: "#000000",
        accentA: "#f59e0b",
        accentB: "#fbbf24",
        copyright: "© 2026 Onyx.",
        tone: "dark",
      }),
    ],
  };
}

/** Template 3 — Bazaar (e-commerce classic, warm, conversion-led). */
export function buildBazaarProductDocument(): Record<string, unknown> {
  return {
    root: BAZAAR_ROOT,
    content: [
      navBar({
        brand: "Bazaar",
        bg: "rgba(255,247,237,0.94)",
        textColor: "#1f1305",
        ctaBg: "#dc2626",
        ctaTextColor: "#ffffff",
        tone: "light",
      }),
      productGallery({ bg: "#fff7ed", variant: "carousel", autoplay: true }),
      productHeader({
        variant: "hero",
        bg: "#fff7ed",
        tone: "light",
        badge: "Bestseller",
        accentA: "#dc2626",
        accentB: "#f97316",
        cta: "Add to cart",
      }),
      aboutUs({ bg: "#fef3c7", tone: "muted", brand: "Bazaar" }),
      relatedProducts({ bg: "#fff7ed", tone: "light", variant: "grid" }),
      relatedModels({ bg: "#fef3c7", tone: "muted", variant: "list" }),
      videoSection({
        variant: "split",
        tone: "light",
        bg: "#fff7ed",
        heading: "Why customers keep coming back",
        body: "A two-minute look at the things that don't fit on a spec sheet.",
        ctaLabel: "Shop the collection",
      }),
      socialIcons({ variant: "pills", tone: "light", bg: "#fff7ed" }),
      formSection({
        variant: "minimal",
        tone: "muted",
        bg: "#fef3c7",
        heading: "Get $10 off your first order",
        body: "Drop your email — your code lands instantly.",
      }),
      footer({
        brand: "Bazaar",
        tagline: "Hand-picked goods, fairly priced, lovingly packed.",
        bg: "#7c2d12",
        accentA: "#dc2626",
        accentB: "#f97316",
        copyright: "© 2026 Bazaar Co.",
      }),
    ],
  };
}

/** Template 4 — Forge (software/SaaS product, indigo accents, demo-led). */
export function buildForgeProductDocument(): Record<string, unknown> {
  return {
    root: FORGE_ROOT,
    content: [
      navBar({
        brand: "Forge",
        bg: "rgba(248,250,252,0.94)",
        textColor: "#020617",
        ctaBg: "#6366f1",
        ctaTextColor: "#ffffff",
        tone: "light",
      }),
      productHeader({
        variant: "hero",
        bg: "#f8fafc",
        tone: "light",
        accentA: "#6366f1",
        accentB: "#8b5cf6",
        cta: "Start free trial",
      }),
      videoSection({
        variant: "framed",
        tone: "light",
        bg: "#ffffff",
        heading: "{{product.name}} in 90 seconds",
        body: "Watch the product walkthrough — see exactly how it fits into your workflow.",
      }),
      productGallery({ bg: "#f8fafc", variant: "carousel", autoplay: true }),
      aboutUs({ bg: "#ffffff", tone: "light", brand: "Forge" }),
      relatedModels({ bg: "#f8fafc", tone: "muted", variant: "grid" }),
      relatedProducts({ bg: "#ffffff", tone: "light", variant: "rail" }),
      formSection({
        variant: "split",
        tone: "muted",
        bg: "#f8fafc",
        heading: "Book a demo",
        body: "Tell us a little about your team — we'll set up a 20-minute walkthrough.",
      }),
      socialIcons({ variant: "icon-row", tone: "light", bg: "#ffffff", accentA: "#6366f1", accentB: "#8b5cf6" }),
      footer({
        brand: "Forge",
        tagline: "The fastest way to build, ship, and measure product launches.",
        bg: "#020617",
        accentA: "#6366f1",
        accentB: "#8b5cf6",
        copyright: "© 2026 Forge Labs.",
      }),
    ],
  };
}

/** Template 5 — Rivet (premium / luxury, refined typography, gold accents). */
export function buildRivetProductDocument(): Record<string, unknown> {
  return {
    root: RIVET_ROOT,
    content: [
      navBar({
        brand: "RIVET",
        bg: "rgba(250,246,241,0.95)",
        textColor: "#1c140d",
        ctaBg: "#a16207",
        ctaTextColor: "#ffffff",
        tone: "light",
      }),
      productGallery({ bg: "#faf6f1", variant: "carousel", autoplay: true }),
      productHeader({
        variant: "card",
        bg: "#faf6f1",
        tone: "light",
        badge: "Limited release",
        accentA: "#a16207",
        accentB: "#ca8a04",
        cta: "Reserve yours",
      }),
      aboutUs({ bg: "#f5ede1", tone: "muted", brand: "Rivet" }),
      videoSection({
        variant: "cinematic",
        tone: "dark",
        bg: "#1c140d",
        heading: "An object, in detail",
        body: "Filmed slowly so you can see what we sweat over.",
      }),
      relatedModels({ bg: "#faf6f1", tone: "light", variant: "grid" }),
      relatedProducts({ bg: "#f5ede1", tone: "muted", variant: "list" }),
      socialIcons({ variant: "mono", tone: "light", bg: "#faf6f1" }),
      formSection({
        variant: "card",
        tone: "muted",
        bg: "#f5ede1",
        heading: "Join the waiting list",
        body: "Limited drops, by invitation. Add your email to be considered.",
      }),
      footer({
        brand: "RIVET",
        tagline: "Considered objects for a slower life.",
        bg: "#1c140d",
        accentA: "#a16207",
        accentB: "#ca8a04",
        copyright: "© 2026 Rivet & Co.",
        tone: "dark",
      }),
    ],
  };
}
