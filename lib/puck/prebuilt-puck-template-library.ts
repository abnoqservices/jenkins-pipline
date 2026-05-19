import { DEFAULT_LAYOUT_PROPS } from "@/lib/puck/layout-fields";
import {
  buildAuroraProductDocument,
  buildBazaarProductDocument,
  buildForgeProductDocument,
  buildOnyxProductDocument,
  buildRivetProductDocument,
} from "@/lib/puck/prebuilt-product-templates";

/** Two top-level categories surfaced as tabs in the template picker. */
export type PrebuiltTemplateCategory = "products" | "landing-pages";

/** Static starter layouts shown on the Puck template library page (not stored until the user adds one). */
export type PrebuiltPuckTemplateLibraryItem = {
  /** Stable id for UI keys (not a DB id). */
  id: string;
  /** Which tab the template appears under. */
  category: PrebuiltTemplateCategory;
  /** Card title on the library page. */
  name: string;
  description: string;
  /** Default name for the new row in `landing_page_puck_templates`. */
  suggestedLibraryName: string;
  /** Card/preview image shown in the template picker flow. */
  previewImageUrl: string;
  puck_document: Record<string, unknown>;
};

/** Helper — full-bleed section uses 0 horizontal padding so the block can manage its own gutters. */
const layout = (paddingTop: string, paddingBottom: string) => ({
  ...DEFAULT_LAYOUT_PROPS,
  paddingTop,
  paddingBottom,
  paddingLeft: "0px",
  paddingRight: "0px",
});

/* -------------------------------------------------------------------------- */
/*  Theme presets                                                              */
/* -------------------------------------------------------------------------- */

const LUMEN_ROOT: Record<string, unknown> = {
  props: {
    content: { title: "Lumen — work that flows" },
    style: {
      pageBackground: "#ffffff",
      pageText: "#1f2937",
      headingColor: "#0b1220",
      mutedText: "#475569",
      accentColor: "#6366f1",
      buttonTextColor: "#ffffff",
    },
    layout: layout("0px", "0px"),
  },
};

const ATLAS_ROOT: Record<string, unknown> = {
  props: {
    content: { title: "Atlas AI — build, learn, ship" },
    style: {
      pageBackground: "#070a16",
      pageText: "#cbd5e1",
      headingColor: "#ffffff",
      mutedText: "#94a3b8",
      accentColor: "#22d3ee",
      buttonTextColor: "#020617",
    },
    layout: layout("0px", "0px"),
  },
};

const BRIGHTSIDE_ROOT: Record<string, unknown> = {
  props: {
    content: { title: "Brightside Studio" },
    style: {
      pageBackground: "#fffbf5",
      pageText: "#3a2a1f",
      headingColor: "#1f1305",
      mutedText: "#7a6a5d",
      accentColor: "#ea580c",
      buttonTextColor: "#ffffff",
    },
    layout: layout("0px", "0px"),
  },
};

const OLIVIA_ROOT: Record<string, unknown> = {
  props: {
    content: { title: "{{product.name}}" },
    style: {
      pageBackground: "#F5F5F0",
      pageText: "#2d3436",
      headingColor: "#1A3C34",
      mutedText: "#5c6660",
      accentColor: "#1A3C34",
      buttonTextColor: "#ffffff",
    },
    layout: layout("0px", "0px"),
  },
};

/* -------------------------------------------------------------------------- */
/*  Template 1: Lumen — full SaaS landing page                                 */
/* -------------------------------------------------------------------------- */

function buildLumenSaasDocument(): Record<string, unknown> {
  return {
    root: LUMEN_ROOT,
    content: [
      {
        type: "NavBarBlock",
        props: {
          content: {
            designVariant: "centered-pill",
            logoMode: "text",
            logoText: "Lumen",
            announcement: "Lumen 2.0 is here — see what's new",
            announcementHref: "#",
            links: [
              { label: "Product", href: "#" },
              { label: "Customers", href: "#" },
              { label: "Pricing", href: "#" },
              { label: "Docs", href: "#" },
              { label: "Blog", href: "#" },
            ],
            loginLabel: "Sign in",
            loginHref: "#",
            signUpLabel: "Start free",
            signUpHref: "#",
          },
          style: { tone: "light", sticky: "yes", blur: "yes" },
          layout: layout("0px", "0px"),
        },
      },
      {
        type: "HeroSplitBlock",
        props: {
          content: {
            designVariant: "split-asymmetric",
            eyebrow: "New · Lumen 2.0",
            title: "Ship work your team actually loves.",
            titleAccent: "loves",
            subtitle:
              "One workspace for briefs, reviews, and launches — built for marketing teams that want clarity without the bloat.",
            primaryLabel: "Start free trial",
            primaryHref: "#",
            secondaryLabel: "Watch the 2-min demo",
            secondaryHref: "#",
            trustLine: "Loved by 12,000+ teams · 4.9 / 5 average rating",
            avatars: [{ src: "" }, { src: "" }, { src: "" }, { src: "" }],
            imageSrc: "",
            imageAlt: "Lumen workspace",
            floatCardTitle: "+248 signups today",
            floatCardSubtitle: "Live workspace activity",
          },
          style: {
            tone: "gradient",
            decoration: "mesh",
            meshFrom: "#a5b4fc",
            meshVia: "#f0abfc",
            meshTo: "#fda4af",
            buttonShadow: "glow",
            buttonRadius: "pill",
            imageRadiusPx: "20",
            containerWidth: "wide",
          },
          layout: layout("96px", "96px"),
        },
      },
      {
        type: "LogoCloudBlock",
        props: {
          content: {
            designVariant: "marquee",
            eyebrow: "Trusted by",
            heading: "More than 12,000 teams ship faster with Lumen.",
            logos: [
              { name: "Stripe", imageSrc: "", href: "" },
              { name: "Linear", imageSrc: "", href: "" },
              { name: "Notion", imageSrc: "", href: "" },
              { name: "Vercel", imageSrc: "", href: "" },
              { name: "Figma", imageSrc: "", href: "" },
              { name: "Ramp", imageSrc: "", href: "" },
              { name: "HubSpot", imageSrc: "", href: "" },
            ],
          },
          style: { tone: "muted", marqueeSpeed: "40", containerWidth: "wide" },
          layout: layout("48px", "48px"),
        },
      },
      {
        type: "StatsBlock",
        props: {
          content: {
            designVariant: "row",
            eyebrow: "By the numbers",
            heading: "Built for teams that ship.",
            body: "Operators across 60+ countries trust Lumen to keep cross-functional work moving.",
            stats: [
              { value: "12k+", label: "Active teams", hint: "" },
              { value: "98%", label: "Customer retention", hint: "" },
              { value: "+38%", label: "Faster cycles", hint: "Median across 1,200 customers" },
              { value: "60+", label: "Countries", hint: "" },
            ],
          },
          style: { tone: "light", containerWidth: "wide" },
          layout: layout("80px", "80px"),
        },
      },
      {
        type: "FeatureGridBlock",
        props: {
          content: {
            designVariant: "bento",
            eyebrow: "What's inside",
            heading: "Everything you need to ship work that moves.",
            description: "Plan, collaborate, launch — without leaving your workspace.",
            ctaLabel: "Explore features",
            ctaHref: "#",
            cards: [
              { title: "Real-time collaboration", body: "Edit together with multi-cursor, threaded comments, and version history.", icon: "🤝", tag: "Live", imageSrc: "", accentColor: "", featured: "yes" },
              { title: "Intelligent automations", body: "Connect any tool with no-code workflows.", icon: "⚡", tag: "", imageSrc: "", accentColor: "", featured: "no" },
              { title: "Outcome analytics", body: "Track what's working in one dashboard.", icon: "📈", tag: "", imageSrc: "", accentColor: "", featured: "no" },
              { title: "Privacy first", body: "SOC 2 + EU residency by default.", icon: "🔐", tag: "", imageSrc: "", accentColor: "", featured: "no" },
            ],
          },
          style: { tone: "light", decoration: "dots", cardShadow: "soft", cardRadius: "round", containerWidth: "wide" },
          layout: layout("96px", "96px"),
        },
      },
      {
        type: "BenefitsShowcaseBlock",
        props: {
          content: {
            designVariant: "checklist-photo",
            eyebrow: "Why teams stay",
            title: "The benefits add up — fast.",
            description: "We obsess over the details that compound into great quarters.",
            items: [
              { text: "Onboarding concierge", body: "Migration help in your first 14 days." },
              { text: "24/7 humans on support", body: "Real engineers — no bots, no queues longer than 4 minutes." },
              { text: "Volume discounts", body: "Save more as your team scales." },
              { text: "Cancel any time", body: "Month-to-month. No lock-in. Your data goes with you." },
            ],
            imageSrc: "",
            imageAlt: "Lumen workspace",
            overlayTitle: "MRR growth",
            overlayMetric: "+38% YoY",
            ctaLabel: "Talk to a human",
            ctaHref: "#",
          },
          style: { tone: "muted", containerWidth: "wide", imageRadiusPx: "20" },
          layout: layout("96px", "96px"),
        },
      },
      {
        type: "PricingPlansBlock",
        props: {
          content: {
            designVariant: "three-tier",
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
          },
          style: { tone: "muted", decoration: "dots", containerWidth: "wide" },
          layout: layout("96px", "96px"),
        },
      },
      {
        type: "TestimonialLeadBlock",
        props: {
          content: {
            designVariant: "split-glass",
            eyebrow: "Customer story",
            title: "Teams move 2× faster with Lumen.",
            quote:
              "We replaced three tools and our weekly status review with Lumen. The team finally has one place to align — and our launches actually ship on time.",
            author: "Alex Morgan",
            authorRole: "VP Marketing · Northwind",
            authorAvatarSrc: "",
            avatars: [{ src: "" }, { src: "" }, { src: "" }, { src: "" }],
            formTitle: "Talk to product",
            formSubtitle: "We reply within one business day.",
            nameLabel: "Full name",
            emailPlaceholder: "Work email",
            messagePlaceholder: "Tell us what you're trying to ship...",
            buttonLabel: "Request a demo",
            formAction: "#",
          },
          style: { tone: "dark", containerWidth: "wide" },
          layout: layout("96px", "96px"),
        },
      },
      {
        type: "FaqBlock",
        props: {
          content: {
            designVariant: "two-column",
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
          },
          style: { tone: "light", containerWidth: "wide" },
          layout: layout("96px", "96px"),
        },
      },
      {
        type: "CtaBannerBlock",
        props: {
          content: {
            designVariant: "gradient-card",
            eyebrow: "Ready to ship?",
            title: "Build a workspace your team will actually love.",
            body: "Free for the first 14 days. Cancel anytime — and bring your data with you.",
            primaryLabel: "Start your free trial",
            primaryHref: "#",
            secondaryLabel: "Talk to sales",
            secondaryHref: "#",
            microcopy: "No credit card required · SOC 2 Type II",
          },
          style: { containerWidth: "wide" },
          layout: layout("48px", "48px"),
        },
      },
      {
        type: "FooterMegaBlock",
        props: {
          content: {
            designVariant: "mega-cta",
            logoMode: "text",
            logoText: "Lumen",
            tagline: "Quiet software for loud teams. Plan, ship, and measure — without context-switching.",
            ctaTitle: "",
            ctaSubtitle: "",
            ctaLabel: "",
            ctaHref: "#",
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
          },
          style: { tone: "dark" },
          layout: layout("80px", "32px"),
        },
      },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/*  Template 2: Atlas AI — dark dev tool launch                                */
/* -------------------------------------------------------------------------- */

function buildAtlasAiDocument(): Record<string, unknown> {
  return {
    root: ATLAS_ROOT,
    content: [
      {
        type: "NavBarBlock",
        props: {
          content: {
            designVariant: "docs-style",
            logoMode: "text",
            logoText: "Atlas",
            announcement: "",
            announcementHref: "#",
            links: [
              { label: "Docs", href: "#" },
              { label: "API", href: "#" },
              { label: "Models", href: "#" },
              { label: "Pricing", href: "#" },
              { label: "Changelog", href: "#" },
            ],
            loginLabel: "Sign in",
            loginHref: "#",
            signUpLabel: "Open dashboard",
            signUpHref: "#",
          },
          style: { tone: "dark", sticky: "yes", blur: "yes" },
          layout: layout("0px", "0px"),
        },
      },
      {
        type: "HeroSplitBlock",
        props: {
          content: {
            designVariant: "spotlight",
            eyebrow: "Atlas AI · Now in public beta",
            title: "The AI runtime built for production.",
            titleAccent: "production",
            subtitle:
              "Sub-100ms inference, deterministic outputs, and observability your platform team can actually trust.",
            primaryLabel: "Read the docs",
            primaryHref: "#",
            secondaryLabel: "Watch the keynote",
            secondaryHref: "#",
            trustLine: "Used by 1,200+ teams · 99.99% uptime since launch",
            avatars: [{ src: "" }, { src: "" }, { src: "" }],
            imageSrc: "",
            imageAlt: "",
            floatCardTitle: "",
            floatCardSubtitle: "",
          },
          style: {
            tone: "dark",
            decoration: "spotlight",
            buttonShadow: "glow",
            buttonRadius: "pill",
            containerWidth: "wide",
          },
          layout: layout("120px", "120px"),
        },
      },
      {
        type: "LogoCloudBlock",
        props: {
          content: {
            designVariant: "pill",
            eyebrow: "",
            heading: "Powering inference at",
            logos: [
              { name: "Stripe", imageSrc: "", href: "" },
              { name: "Replit", imageSrc: "", href: "" },
              { name: "Cursor", imageSrc: "", href: "" },
              { name: "Linear", imageSrc: "", href: "" },
              { name: "Vercel", imageSrc: "", href: "" },
            ],
          },
          style: { tone: "dark", containerWidth: "wide" },
          layout: layout("32px", "48px"),
        },
      },
      {
        type: "SupportFeaturesBlock",
        props: {
          content: {
            designVariant: "two-features",
            eyebrow: "What's different",
            title: "Built by infra people, for infra people.",
            body:
              "We obsess over tail latency, reproducibility, and observability — so you can stop fighting your AI stack and start shipping.",
            rating1Score: 5,
            rating1Label: "99.99% · Uptime",
            rating2Score: 5,
            rating2Label: "<100ms · p99 latency",
            features: [
              { title: "Deterministic outputs", body: "Same prompt, same model, same answer. Every time. Locked seeds and version pinning by default.", icon: "🎯", accent: "" },
              { title: "First-class observability", body: "Distributed traces, token-level logs, and one-click replays. Built on OTel from day one.", icon: "🔭", accent: "" },
              { title: "Bring your own keys", body: "Route to OpenAI, Anthropic, or self-hosted models — same SDK, same observability.", icon: "🔑", accent: "" },
              { title: "Cost guardrails", body: "Per-tenant budgets, hard caps, and weekly digests so finance never gets surprised.", icon: "💸", accent: "" },
            ],
          },
          style: { tone: "dark", decoration: "grid", containerWidth: "wide" },
          layout: layout("96px", "96px"),
        },
      },
      {
        type: "StatsBlock",
        props: {
          content: {
            designVariant: "row",
            eyebrow: "At scale",
            heading: "Numbers we're proud of.",
            body: "Real production traffic from teams that demand reliability.",
            stats: [
              { value: "1.2B", label: "Inferences / month", hint: "" },
              { value: "<100ms", label: "p99 latency", hint: "Across 12 regions" },
              { value: "99.99%", label: "Uptime", hint: "Trailing 12 months" },
              { value: "0.8¢", label: "Average cost / call", hint: "Mixed-model routing" },
            ],
          },
          style: { tone: "dark", decoration: "spotlight", containerWidth: "wide" },
          layout: layout("80px", "80px"),
        },
      },
      {
        type: "PricingPlansBlock",
        props: {
          content: {
            designVariant: "solo-pro",
            eyebrow: "Pricing",
            title: "Simple, transparent pricing.",
            subtitle: "Pay only for the calls you make. No platform fees, no minimums.",
            billingMode: "monthly",
            plans: [
              {
                name: "Hobby",
                tagline: "For experiments and side projects",
                priceMonthly: "$0",
                priceYearly: "$0",
                priceNote: "/mo + usage",
                highlighted: "no",
                badge: "",
                features: [
                  { line: "10k inferences / month free", muted: "no" },
                  { line: "Community Discord support", muted: "no" },
                  { line: "Public dashboards", muted: "no" },
                ],
                ctaLabel: "Get an API key",
                ctaHref: "#",
              },
              {
                name: "Team",
                tagline: "For production workloads",
                priceMonthly: "$199",
                priceYearly: "$1,990",
                priceNote: "/mo + usage",
                highlighted: "yes",
                badge: "Most popular",
                features: [
                  { line: "Unlimited inferences", muted: "no" },
                  { line: "Single sign-on (SAML)", muted: "no" },
                  { line: "Audit log + RBAC", muted: "no" },
                  { line: "99.99% SLA", muted: "no" },
                  { line: "Dedicated Slack channel", muted: "no" },
                ],
                ctaLabel: "Start free trial",
                ctaHref: "#",
              },
            ],
          },
          style: { tone: "dark", decoration: "dots", containerWidth: "wide" },
          layout: layout("96px", "96px"),
        },
      },
      {
        type: "CtaBannerBlock",
        props: {
          content: {
            designVariant: "gradient-card",
            eyebrow: "Ship faster",
            title: "Open a console. Make your first call in 30 seconds.",
            body: "No sales calls, no waitlists. Just paste an API key and you're live.",
            primaryLabel: "Get started",
            primaryHref: "#",
            secondaryLabel: "Read the docs",
            secondaryHref: "#",
            microcopy: "Free tier · No credit card required",
          },
          style: { accentA: "#22d3ee", accentB: "#6366f1", accentC: "#ec4899", containerWidth: "wide" },
          layout: layout("48px", "48px"),
        },
      },
      {
        type: "FooterMegaBlock",
        props: {
          content: {
            designVariant: "minimal-legal",
            logoMode: "text",
            logoText: "Atlas",
            tagline: "AI runtime for production teams.",
            columns: [
              {
                heading: "Product",
                links: [
                  { label: "Docs", href: "#" },
                  { label: "API", href: "#" },
                  { label: "Status", href: "#" },
                ],
              },
              {
                heading: "Legal",
                links: [
                  { label: "Privacy", href: "#" },
                  { label: "Security", href: "#" },
                ],
              },
            ],
            socials: [
              { label: "GitHub", href: "#", icon: "G" },
              { label: "X", href: "#", icon: "𝕏" },
            ],
            copyright: "© 2026 Atlas Inference, Inc.",
            legalLink1Label: "Terms",
            legalLink1Href: "#",
            legalLink2Label: "Privacy",
            legalLink2Href: "#",
            ctaTitle: "",
            ctaSubtitle: "",
            ctaLabel: "",
            ctaHref: "#",
            newsletterPlaceholder: "you@work.com",
            newsletterAction: "#",
          },
          style: { tone: "dark" },
          layout: layout("48px", "32px"),
        },
      },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/*  Template 3: Brightside Studio — minimal agency / portfolio                 */
/* -------------------------------------------------------------------------- */

function buildBrightsideStudioDocument(): Record<string, unknown> {
  return {
    root: BRIGHTSIDE_ROOT,
    content: [
      {
        type: "NavBarBlock",
        props: {
          content: {
            designVariant: "compact",
            logoMode: "text",
            logoText: "Brightside",
            announcement: "",
            announcementHref: "#",
            links: [
              { label: "Work", href: "#" },
              { label: "Studio", href: "#" },
              { label: "Journal", href: "#" },
              { label: "Contact", href: "#" },
            ],
            loginLabel: "",
            loginHref: "#",
            signUpLabel: "Start a project",
            signUpHref: "#",
          },
          style: { tone: "light", customBg: "rgba(255,251,245,0.85)", sticky: "yes", blur: "yes" },
          layout: layout("0px", "0px"),
        },
      },
      {
        type: "HeroSplitBlock",
        props: {
          content: {
            designVariant: "stacked-center",
            eyebrow: "Independent design studio · Est. 2018",
            title: "We build brands that move people.",
            titleAccent: "people",
            subtitle:
              "From identity to product — we partner with founders to ship work that customers feel before they think.",
            primaryLabel: "View the work",
            primaryHref: "#",
            secondaryLabel: "Start a project",
            secondaryHref: "#",
            trustLine: "Featured in Awwwards, Brand New, and Communication Arts.",
            avatars: [],
            imageSrc: "",
            imageAlt: "",
            floatCardTitle: "",
            floatCardSubtitle: "",
          },
          style: {
            tone: "light",
            decoration: "spotlight",
            buttonShadow: "soft",
            buttonRadius: "pill",
            containerWidth: "normal",
          },
          layout: layout("96px", "64px"),
        },
      },
      {
        type: "FeatureGridBlock",
        props: {
          content: {
            designVariant: "three-cards",
            eyebrow: "Capabilities",
            heading: "We help founders ship the right thing, well.",
            description: "End-to-end partners — strategy, identity, product, motion.",
            ctaLabel: "",
            ctaHref: "#",
            cards: [
              { title: "Brand identity", body: "Logos, type systems, and design languages that scale across every surface.", icon: "✶", tag: "", imageSrc: "", accentColor: "", featured: "no" },
              { title: "Product design", body: "Interfaces that respect the user's time. Built with engineering from day one.", icon: "◐", tag: "", imageSrc: "", accentColor: "", featured: "no" },
              { title: "Marketing sites", body: "Landing pages, microsites, and launch campaigns that convert.", icon: "◢", tag: "", imageSrc: "", accentColor: "", featured: "no" },
            ],
          },
          style: { tone: "light", decoration: "none", cardShadow: "soft", cardRadius: "round", containerWidth: "wide" },
          layout: layout("80px", "80px"),
        },
      },
      {
        type: "BenefitsShowcaseBlock",
        props: {
          content: {
            designVariant: "photo-first",
            eyebrow: "How we work",
            title: "A small team, a focused process, and obsessive craft.",
            description: "We work in 6-week sprints with weekly check-ins. No hand-offs to junior teams.",
            items: [
              { text: "One senior team for your entire project", body: "" },
              { text: "Strategy + design + build under one roof", body: "" },
              { text: "Weekly Loom updates so you stay in the loop", body: "" },
              { text: "We ship, then we keep iterating", body: "" },
            ],
            imageSrc: "",
            imageAlt: "",
            overlayTitle: "",
            overlayMetric: "",
            ctaLabel: "Read our process",
            ctaHref: "#",
          },
          style: { tone: "muted", containerWidth: "wide", imageRadiusPx: "24" },
          layout: layout("80px", "80px"),
        },
      },
      {
        type: "TestimonialLeadBlock",
        props: {
          content: {
            designVariant: "form-first",
            eyebrow: "Let's talk",
            title: "Tell us what you're building.",
            quote:
              "Brightside translated our messy strategy doc into the clearest brand voice we've ever had. Six weeks. No drama.",
            author: "Sarah Lin",
            authorRole: "CEO · Verdant Health",
            authorAvatarSrc: "",
            avatars: [],
            formTitle: "Start a project",
            formSubtitle: "We respond within 24 hours.",
            nameLabel: "Your name",
            emailPlaceholder: "Email",
            messagePlaceholder: "Tell us about the project — timeline, budget, links, anything.",
            buttonLabel: "Send the brief",
            formAction: "#",
          },
          style: { tone: "light", accentA: "#ea580c", accentB: "#f59e0b", containerWidth: "wide" },
          layout: layout("96px", "96px"),
        },
      },
      {
        type: "FooterMegaBlock",
        props: {
          content: {
            designVariant: "minimal-legal",
            logoMode: "text",
            logoText: "Brightside",
            logoImageSrc: "",
            tagline: "An independent studio building brands that move people.",
            columns: [
              {
                heading: "Studio",
                links: [
                  { label: "Work", href: "#" },
                  { label: "Journal", href: "#" },
                  { label: "Contact", href: "#" },
                ],
              },
            ],
            socials: [
              { label: "Are.na", href: "#", icon: "А" },
              { label: "Instagram", href: "#", icon: "📷" },
            ],
            ctaTitle: "",
            ctaSubtitle: "",
            ctaLabel: "",
            ctaHref: "#",
            newsletterPlaceholder: "",
            newsletterAction: "#",
            copyright: "© 2026 Brightside Studio · Made in California",
            legalLink1Label: "Terms",
            legalLink1Href: "#",
            legalLink2Label: "Privacy",
            legalLink2Href: "#",
          },
          style: { tone: "light", bg: "#fffbf5" },
          layout: layout("32px", "32px"),
        },
      },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/*  Template 4: Olivia commerce — product detail page                          */
/* -------------------------------------------------------------------------- */

function buildOliviaCommerceDocument(): Record<string, unknown> {
  return {
    root: OLIVIA_ROOT,
    content: [
      {
        type: "NavBarBlock",
        props: {
          content: {
            designVariant: "compact",
            logoMode: "text",
            logoText: "OLIVIA",
            announcement: "Free shipping on orders over $50",
            announcementHref: "#",
            links: [
              { label: "Shop", href: "#" },
              { label: "Collections", href: "#" },
              { label: "Recipes", href: "#" },
              { label: "Find a store", href: "#" },
            ],
            loginLabel: "Search",
            loginHref: "#",
            signUpLabel: "Cart (0)",
            signUpHref: "#",
          },
          style: { tone: "light", customBg: "rgba(245,245,240,0.92)", sticky: "yes", blur: "yes", logoColor: "#1A3C34", linkColor: "#1A3C34", ctaBg: "#1A3C34", ctaTextColor: "#ffffff" },
          layout: layout("0px", "0px"),
        },
      },
      {
        type: "ProductGalleryBlock",
        props: {
          content: {
            designVariant: "sidebar-thumbs",
            badge: "Bestseller",
            mainSrc: "{{product.image_url}}",
            mainAlt: "{{product.name}}",
            thumbs: [
              { src: "{{product.image_1}}" },
              { src: "{{product.image_2}}" },
              { src: "{{product.image_3}}" },
            ],
          },
          style: { sectionBg: "#F5F5F0", mainMaxHeightPx: "640", mainMaxWidthPx: "960", thumbSizePx: "72", cardRadiusPx: "24" },
          layout: layout("32px", "16px"),
        },
      },
      {
        type: "ProductHeaderBlock",
        props: {
          content: {
            designVariant: "hero",
            eyebrow: "Single-origin · Cold-pressed",
            title: "{{product.name}}",
            subtitle:
              "Bright, peppery, and balanced — pressed from hand-picked Koroneiki olives within 8 hours of harvest.",
            sku: "SKU · {{product.sku}}",
            rating: "4.9 · 1,247 reviews",
            ratingValue: 5,
            price: "{{product.price}}",
            compareAtPrice: "$24",
            discountLabel: "−20%",
            badge: "Bestseller",
            stockHint: "Ships in 1-2 business days · Free returns within 30 days",
            trustItems: [
              { icon: "🚚", text: "Free shipping over $50" },
              { icon: "🌿", text: "Single-origin" },
              { icon: "↩️", text: "30-day returns" },
            ],
            ctaLabel: "Add to cart",
            ctaHref: "#",
            secondaryCtaLabel: "Save",
            secondaryCtaHref: "#",
          },
          style: { tone: "light", sectionBg: "#F5F5F0", accentA: "#1A3C34", accentB: "#52796F", containerWidth: "wide" },
          layout: layout("0px", "32px"),
        },
      },
      {
        type: "ProductHighlightsBlock",
        props: {
          content: {
            designVariant: "icon-row",
            eyebrow: "Why people love it",
            title: "Designed for the everyday table.",
            body: "Real benefits, validated by 12,000+ kitchens.",
            items: [
              { icon: "🌿", title: "Single-origin", body: "From one estate, one harvest. Full traceability on every label." },
              { icon: "🛡️", title: "Polyphenol-rich", body: "Independently tested — proudly above 350mg/kg." },
              { icon: "📦", title: "Fresh-press promise", body: "Ships within 60 days of harvest. Always." },
            ],
          },
          style: { tone: "muted", sectionBg: "#ebebe4", containerWidth: "wide" },
          layout: layout("64px", "64px"),
        },
      },
      {
        type: "ProductTabsContentBlock",
        props: {
          content: {
            designVariant: "underline",
            eyebrow: "",
            tabs: [
              {
                tabLabel: "Description",
                body: "{{product.description}}\n\nA bright, balanced finishing oil from Crete. Try it on grilled bread, roasted vegetables, or a simple bowl of beans.",
              },
              {
                tabLabel: "Specs",
                body: "500 ml dark-glass bottle · Harvest date on every label · Acidity <0.2% · Polyphenols >350 mg/kg · Best within 18 months of harvest.",
              },
              {
                tabLabel: "Shipping",
                body: "Free shipping on orders over $50 within the US. We ship globally — typical delivery is 5-9 business days.",
              },
            ],
          },
          style: { tone: "light", sectionBg: "#F5F5F0", containerWidth: "normal" },
          layout: layout("32px", "32px"),
        },
      },
      {
        type: "ProductSpecsBlock",
        props: {
          content: {
            designVariant: "grid",
            eyebrow: "Specifications",
            title: "Every detail on the bottle.",
            body: "Independently tested — full lab report available on request.",
            specs: [
              { icon: "📅", label: "Harvest", value: "October 2025" },
              { icon: "🫒", label: "Variety", value: "Koroneiki (100%)" },
              { icon: "💧", label: "Acidity", value: "0.18%" },
              { icon: "🌿", label: "Polyphenols", value: "412 mg/kg" },
              { icon: "📦", label: "Volume", value: "500 ml dark glass" },
              { icon: "🌍", label: "Origin", value: "Crete, Greece" },
            ],
          },
          style: { tone: "muted", sectionBg: "#ebebe4", containerWidth: "wide" },
          layout: layout("64px", "64px"),
        },
      },
      {
        type: "ProductRelatedBlock",
        props: {
          content: {
            designVariant: "grid",
            eyebrow: "Pairs well with",
            title: "Build your kitchen kit",
            body: "Hand-picked add-ons that complete the experience.",
            ctaLabel: "Shop all",
            ctaHref: "#",
            products: [
              { name: "Reserve blend", price: "$28", compareAtPrice: "$32", tag: "Save $4", href: "#", imageSrc: "{{product.image_1}}" },
              { name: "Lemon-infused oil", price: "$19", compareAtPrice: "", tag: "", href: "#", imageSrc: "{{product.image_2}}" },
              { name: "Basil finishing oil", price: "$22", compareAtPrice: "", tag: "New", href: "#", imageSrc: "{{product.image_3}}" },
              { name: "Gift trio set", price: "$56", compareAtPrice: "$72", tag: "Bundle", href: "#", imageSrc: "{{product.image_url}}" },
            ],
          },
          style: { tone: "light", sectionBg: "#F5F5F0", containerWidth: "wide" },
          layout: layout("64px", "64px"),
        },
      },
      {
        type: "CtaBannerBlock",
        props: {
          content: {
            designVariant: "ribbon",
            eyebrow: "Free with every $50 order",
            title: "A bottle for the table. A bottle for the giftee.",
            body: "Add a second bottle and we'll throw in our gift box at no charge.",
            primaryLabel: "Shop the gift set",
            primaryHref: "#",
            secondaryLabel: "",
            secondaryHref: "#",
            microcopy: "",
          },
          style: { accentA: "#1A3C34", accentB: "#52796F", containerWidth: "wide" },
          layout: layout("32px", "32px"),
        },
      },
      {
        type: "FooterMegaBlock",
        props: {
          content: {
            designVariant: "product-focused",
            logoMode: "text",
            logoText: "OLIVIA",
            logoImageSrc: "",
            tagline: "Single-origin Greek olive oil, pressed within 8 hours of harvest.",
            columns: [
              {
                heading: "Shop",
                links: [
                  { label: "All oils", href: "#" },
                  { label: "Gift sets", href: "#" },
                  { label: "Subscriptions", href: "#" },
                ],
              },
              {
                heading: "Story",
                links: [
                  { label: "Our farm", href: "#" },
                  { label: "Sustainability", href: "#" },
                  { label: "Recipes", href: "#" },
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
              { label: "TikTok", href: "#", icon: "𝓣" },
            ],
            ctaTitle: "",
            ctaSubtitle: "",
            ctaLabel: "",
            ctaHref: "#",
            newsletterPlaceholder: "Your email — get 10% off",
            newsletterAction: "#",
            copyright: "© 2026 Olivia. Made in Crete.",
            legalLink1Label: "Terms",
            legalLink1Href: "#",
            legalLink2Label: "Privacy",
            legalLink2Href: "#",
          },
          style: { tone: "dark", bg: "#1A3C34", accentA: "#52796F", accentB: "#84a98c" },
          layout: layout("64px", "32px"),
        },
      },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/*  Library export                                                             */
/* -------------------------------------------------------------------------- */

export const PREBUILT_PUCK_TEMPLATE_LIBRARY: PrebuiltPuckTemplateLibraryItem[] = [
  {
    id: "lumen-saas",
    category: "landing-pages",
    name: "Lumen — SaaS landing",
    description:
      "Full-bleed SaaS landing page: gradient hero, marquee logos, bento features, three-tier pricing, glass testimonial, FAQ, and a stunning gradient CTA.",
    suggestedLibraryName: "Lumen",
    previewImageUrl: "/api/template-previews/lumen-saas",
    puck_document: buildLumenSaasDocument(),
  },
  {
    id: "atlas-ai",
    category: "landing-pages",
    name: "Atlas AI — dev tool",
    description:
      "Dark, technical landing for an AI / developer-tool launch. Spotlight hero, dense stats, two-up pricing, and a gradient CTA closer.",
    suggestedLibraryName: "Atlas AI",
    previewImageUrl: "/api/template-previews/atlas-ai",
    puck_document: buildAtlasAiDocument(),
  },
  {
    id: "brightside-studio",
    category: "landing-pages",
    name: "Brightside — agency",
    description:
      "Warm, editorial agency / portfolio template. Stacked centered hero, three capability cards, photo-first benefits, and a contact form.",
    suggestedLibraryName: "Brightside",
    previewImageUrl: "/api/template-previews/brightside",
    puck_document: buildBrightsideStudioDocument(),
  },
  {
    id: "olivia-commerce",
    category: "products",
    name: "Olivia — product page",
    description:
      "Premium commerce PDP: deep-green olive theme, bestseller badge, gallery, hero buy box, highlights, specs, related products, and a gift CTA ribbon.",
    suggestedLibraryName: "Olivia",
    previewImageUrl: "/api/template-previews/olivia",
    puck_document: buildOliviaCommerceDocument(),
  },
  {
    id: "aurora-product",
    category: "products",
    name: "Aurora — modern minimal",
    description:
      "Clean white product page with full sections: nav, autoplay carousel with bubble dots, name + description, about, related models, related products, video, social, form, and footer. Doubles as the default for new sign-ups.",
    suggestedLibraryName: "Aurora",
    previewImageUrl: "/api/template-previews/aurora-product",
    puck_document: buildAuroraProductDocument(),
  },
  {
    id: "onyx-product",
    category: "products",
    name: "Onyx — bold editorial",
    description:
      "Dark, magazine-style PDP with amber accents, cinematic video, autoplay carousel, mono social row, and a moody footer.",
    suggestedLibraryName: "Onyx",
    previewImageUrl: "/api/template-previews/onyx-product",
    puck_document: buildOnyxProductDocument(),
  },
  {
    id: "bazaar-product",
    category: "products",
    name: "Bazaar — e-commerce classic",
    description:
      "Warm conversion-focused PDP with bestseller badge, autoplay gallery, related products grid, models list, and a discount opt-in form.",
    suggestedLibraryName: "Bazaar",
    previewImageUrl: "/api/template-previews/bazaar-product",
    puck_document: buildBazaarProductDocument(),
  },
  {
    id: "forge-product",
    category: "products",
    name: "Forge — software product",
    description:
      "SaaS/software PDP with indigo accent, hero pitch, framed product walkthrough video, models grid, and a demo-booking form.",
    suggestedLibraryName: "Forge",
    previewImageUrl: "/api/template-previews/forge-product",
    puck_document: buildForgeProductDocument(),
  },
  {
    id: "rivet-product",
    category: "products",
    name: "Rivet — premium / luxury",
    description:
      "Refined luxury PDP with limited-release badge, autoplay carousel, slow cinematic video, and a wait-list form on warm parchment.",
    suggestedLibraryName: "Rivet",
    previewImageUrl: "/api/template-previews/rivet-product",
    puck_document: buildRivetProductDocument(),
  },
];
