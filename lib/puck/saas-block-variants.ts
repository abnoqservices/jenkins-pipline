import { deepMergePlain } from "@/lib/puck/deep-merge-plain";
import {
  getSaasLandingDefaultProps,
  type SaasLandingPickableType,
} from "@/lib/puck/saas-landing-blocks";
import { saasVariantThumbnail } from "@/lib/puck/saas-variant-thumbnails";

export type SaasVariantEntry = {
  id: string;
  title: string;
  description: string;
  /** Preview image for the picker card (SVG data URL). */
  imageSrc: string;
  /** Full block props (content / style / layout) — resolved when the user picks this variant. */
  resolveProps: () => Record<string, unknown>;
};

function patch(type: SaasLandingPickableType, partial: Record<string, unknown>): Record<string, unknown> {
  const base = getSaasLandingDefaultProps(type);
  if (!base) throw new Error(`Missing defaults for ${type}`);
  return deepMergePlain(base, partial) as Record<string, unknown>;
}

function entry(
  block: SaasLandingPickableType,
  id: string,
  title: string,
  description: string,
  resolveProps: () => Record<string, unknown>
): SaasVariantEntry {
  return {
    id,
    title,
    description,
    imageSrc: saasVariantThumbnail(block, id),
    resolveProps,
  };
}

/**
 * Preset layouts for SaaS landing blocks. Each option sets `content.designVariant` and uses a distinct on-page layout.
 */
export const saasLandingBlockVariants: Record<SaasLandingPickableType, SaasVariantEntry[]> = {
  NavBarBlock: [
    entry("NavBarBlock", "marketing-full", "Centered rail", "Logo left, links centered, CTA right — classic marketing header.", () =>
      getSaasLandingDefaultProps("NavBarBlock")!
    ),
    entry("NavBarBlock", "centered-pill", "Floating pill", "Glass pill nav floating over the hero — Linear / Vercel feel.", () =>
      patch("NavBarBlock", {
        content: {
          designVariant: "centered-pill",
          announcement: "✨ New · Lumen 2.0 is here",
        },
      })
    ),
    entry("NavBarBlock", "compact", "Compact bar", "Tight horizontal bar — great for app dashboards.", () =>
      patch("NavBarBlock", {
        content: {
          designVariant: "compact",
          links: [
            { label: "Product", href: "#" },
            { label: "Pricing", href: "#" },
            { label: "Docs", href: "#" },
            { label: "Contact", href: "#" },
          ],
        },
      })
    ),
    entry("NavBarBlock", "docs-style", "Dark developer", "Dark glass header with outline CTA — docs / API product feel.", () =>
      patch("NavBarBlock", {
        content: {
          designVariant: "docs-style",
          links: [
            { label: "Docs", href: "#" },
            { label: "API", href: "#" },
            { label: "Changelog", href: "#" },
            { label: "Pricing", href: "#" },
          ],
          loginLabel: "Sign in",
          signUpLabel: "Dashboard",
        },
        style: { tone: "dark", sticky: "yes" },
      })
    ),
  ],

  HeroSplitBlock: [
    entry("HeroSplitBlock", "split-asymmetric", "Split asymmetric", "Copy left, media right with floating activity card — modern SaaS hero.", () =>
      getSaasLandingDefaultProps("HeroSplitBlock")!
    ),
    entry("HeroSplitBlock", "stacked-center", "Stacked center", "Centered headline with hero media below — calm storytelling.", () =>
      patch("HeroSplitBlock", {
        content: {
          designVariant: "stacked-center",
          title: "Beautifully simple software for ambitious teams.",
          subtitle: "From the first idea to the last review — one workspace, no context switching.",
        },
        style: { tone: "light", decoration: "spotlight" },
      })
    ),
    entry("HeroSplitBlock", "media-first", "Media-first", "Image leads on desktop, copy lives on the right — bold product storytelling.", () =>
      patch("HeroSplitBlock", {
        content: {
          designVariant: "media-first",
          title: "Replace status meetings with one source of truth.",
          subtitle: "Live updates, decisions, and approvals — together in one place.",
        },
        style: { tone: "muted", decoration: "dots" },
      })
    ),
    entry("HeroSplitBlock", "spotlight", "Spotlight (no media)", "Centered hero with spotlight glow — copy-only landing pages.", () =>
      patch("HeroSplitBlock", {
        content: {
          designVariant: "spotlight",
          title: "The fastest way to ship beautiful work.",
          titleAccent: "ship",
          subtitle: "Lumen turns scattered docs and Slack threads into momentum.",
          imageSrc: "",
        },
        style: { tone: "dark", decoration: "spotlight", buttonShadow: "glow" },
      })
    ),
  ],

  LogoCloudBlock: [
    entry("LogoCloudBlock", "marquee", "Animated marquee", "Logos scroll horizontally on a soft track — Framer-style social proof.", () =>
      getSaasLandingDefaultProps("LogoCloudBlock")!
    ),
    entry("LogoCloudBlock", "enterprise", "Logo grid", "Boxed logo cells — enterprise trust wall.", () =>
      patch("LogoCloudBlock", {
        content: {
          designVariant: "enterprise",
          eyebrow: "Trusted globally",
          heading: "Powering teams at the world's most ambitious companies.",
        },
      })
    ),
    entry("LogoCloudBlock", "pill", "Pill strip", "Logos inside a single rounded pill with dividers — compact endorsement.", () =>
      patch("LogoCloudBlock", {
        content: {
          designVariant: "pill",
          heading: "Loved by fast-moving teams.",
        },
      })
    ),
    entry("LogoCloudBlock", "social-proof", "Static row", "Single row of grayscale logos — minimal social proof.", () =>
      patch("LogoCloudBlock", {
        content: { designVariant: "social-proof" },
      })
    ),
  ],

  SupportFeaturesBlock: [
    entry("SupportFeaturesBlock", "three-pillars", "Two-column story", "Copy + ratings on the left, vertical feature list on the right.", () =>
      getSaasLandingDefaultProps("SupportFeaturesBlock")!
    ),
    entry("SupportFeaturesBlock", "two-features", "Feature spotlight", "Header copy, then a two-up gradient-bordered card spotlight.", () =>
      patch("SupportFeaturesBlock", {
        content: {
          designVariant: "two-features",
          title: "Built for operators, not slide decks.",
          body: "Publish once, measure everything, respond while context is fresh.",
        },
      })
    ),
    entry("SupportFeaturesBlock", "support-heavy", "List leads", "Feature list first, narrative second — support-led layout.", () =>
      patch("SupportFeaturesBlock", {
        content: {
          designVariant: "support-heavy",
          title: "We support partners in every time zone.",
          body: "Regional success managers, localized docs, and 24/7 escalation when it matters.",
        },
      })
    ),
  ],

  FeatureGridBlock: [
    entry("FeatureGridBlock", "bento", "Bento grid", "Mixed-size cards with one featured cell — the new standard.", () =>
      getSaasLandingDefaultProps("FeatureGridBlock")!
    ),
    entry("FeatureGridBlock", "three-cards", "Three-up grid", "Equal cards in a clean three-column grid.", () =>
      patch("FeatureGridBlock", {
        content: {
          designVariant: "three-cards",
          heading: "Everything you need, nothing you don't.",
        },
      })
    ),
    entry("FeatureGridBlock", "scroll-rail", "Scroll rail", "Snap-scroll horizontal cards — magazine / editorial feel.", () =>
      patch("FeatureGridBlock", {
        content: {
          designVariant: "scroll-rail",
          heading: "Why teams switch to Lumen",
        },
        style: { decoration: "grid" },
      })
    ),
  ],

  BenefitsShowcaseBlock: [
    entry("BenefitsShowcaseBlock", "checklist-photo", "Checklist + photo", "Benefits left, lifestyle photo right with stat overlay.", () =>
      getSaasLandingDefaultProps("BenefitsShowcaseBlock")!
    ),
    entry("BenefitsShowcaseBlock", "photo-first", "Photo first", "Image column leads, checklist on the right — magazine layout.", () =>
      patch("BenefitsShowcaseBlock", {
        content: {
          designVariant: "photo-first",
          title: "Perks your team will actually use",
          items: [
            { text: "Migration concierge", body: "We move your data in your first 14 days." },
            { text: "Always-on humans", body: "Real engineers on call, not chatbots." },
            { text: "Quarterly roadmap reviews", body: "Shape what we build next." },
            { text: "Volume discounts", body: "Save more as your team grows." },
          ],
        },
      })
    ),
    entry("BenefitsShowcaseBlock", "dark-focus", "Dark focus", "Full-bleed dark section with a centered checklist — bold pause.", () =>
      patch("BenefitsShowcaseBlock", {
        content: {
          designVariant: "dark-focus",
          title: "Why teams stay",
          items: [
            { text: "SOC 2 Type II + GDPR ready", body: "" },
            { text: "EU residency on request", body: "" },
            { text: "No lock-in. Cancel any time.", body: "" },
          ],
        },
      })
    ),
  ],

  PricingPlansBlock: [
    entry("PricingPlansBlock", "three-tier", "Three columns", "Three pricing cards with a highlighted middle tier and gradient border.", () =>
      getSaasLandingDefaultProps("PricingPlansBlock")!
    ),
    entry("PricingPlansBlock", "yearly-default", "Stacked rows", "Full-width plan rows — price, features, and CTA in one band.", () =>
      patch("PricingPlansBlock", {
        content: {
          designVariant: "yearly-default",
          billingMode: "yearly",
          subtitle: "Save with annual billing — switch any time.",
        },
      })
    ),
    entry("PricingPlansBlock", "solo-pro", "Two-up spotlight", "Two larger plans side by side — solo vs team story.", () =>
      patch("PricingPlansBlock", {
        content: {
          designVariant: "solo-pro",
          plans: [
            {
              name: "Starter",
              tagline: "For solo builders",
              priceMonthly: "$0",
              priceYearly: "$0",
              priceNote: "/mo",
              highlighted: "no",
              badge: "",
              features: [
                { line: "1 seat", muted: "no" },
                { line: "Core features", muted: "no" },
                { line: "Community support", muted: "no" },
              ],
              ctaLabel: "Start free",
              ctaHref: "#",
            },
            {
              name: "Pro",
              tagline: "For growing teams",
              priceMonthly: "$29",
              priceYearly: "$290",
              priceNote: "/mo",
              highlighted: "yes",
              badge: "Most popular",
              features: [
                { line: "Unlimited seats", muted: "no" },
                { line: "Priority support", muted: "no" },
                { line: "SSO + audit log", muted: "no" },
                { line: "API + webhooks", muted: "no" },
              ],
              ctaLabel: "Start trial",
              ctaHref: "#",
            },
          ],
        },
      })
    ),
  ],

  TestimonialLeadBlock: [
    entry("TestimonialLeadBlock", "split-glass", "Glass split", "Quote with glass card on the left, lead form on the right — premium.", () =>
      getSaasLandingDefaultProps("TestimonialLeadBlock")!
    ),
    entry("TestimonialLeadBlock", "stacked-cta", "Stacked CTA", "Centered testimonial with form card below — funnel landing page.", () =>
      patch("TestimonialLeadBlock", {
        content: {
          designVariant: "stacked-cta",
          quote: "We cut launch review time by 40% in our first month with Lumen.",
          author: "Jamie Chen",
          authorRole: "Head of Product · Northwind",
          formTitle: "Book a walkthrough",
          buttonLabel: "Talk to a human",
        },
      })
    ),
    entry("TestimonialLeadBlock", "form-first", "Form first", "Form on the left, story on the right — for sales-led pages.", () =>
      patch("TestimonialLeadBlock", {
        content: {
          designVariant: "form-first",
          title: "Teams move faster with Lumen.",
          formTitle: "Tell us what you're building",
          emailPlaceholder: "Work email",
          messagePlaceholder: "What problem are you solving?",
          buttonLabel: "Get in touch",
        },
      })
    ),
  ],

  FooterMegaBlock: [
    entry("FooterMegaBlock", "mega-cta", "Mega CTA + columns", "Big gradient CTA panel above newsletter and three link columns.", () =>
      getSaasLandingDefaultProps("FooterMegaBlock")!
    ),
    entry("FooterMegaBlock", "product-focused", "Centered hub", "Centered brand block, columns below — product marketing sites.", () =>
      patch("FooterMegaBlock", {
        content: { designVariant: "product-focused" },
      })
    ),
    entry("FooterMegaBlock", "minimal-legal", "Slim bar", "Single strip footer — minimal chrome.", () =>
      patch("FooterMegaBlock", {
        content: { designVariant: "minimal-legal" },
      })
    ),
  ],

  StatsBlock: [
    entry("StatsBlock", "row", "Stats row", "Four-up metrics row with gradient numbers and clean dividers.", () =>
      getSaasLandingDefaultProps("StatsBlock")!
    ),
  ],

  FaqBlock: [
    entry("FaqBlock", "two-column", "Two-column", "Side-by-side intro + accordion. Best for long pages with a sales CTA.", () =>
      getSaasLandingDefaultProps("FaqBlock")!
    ),
    entry("FaqBlock", "stacked", "Stacked", "Centered intro above the accordion — focus mode.", () =>
      patch("FaqBlock", { content: { designVariant: "stacked" } })
    ),
  ],

  CtaBannerBlock: [
    entry("CtaBannerBlock", "gradient-card", "Gradient card", "Centered CTA inside a multi-stop gradient panel — show-stopping closer.", () =>
      getSaasLandingDefaultProps("CtaBannerBlock")!
    ),
    entry("CtaBannerBlock", "ribbon", "Slim ribbon", "Horizontal banner with copy left, single button right — for the bottom of the page.", () =>
      patch("CtaBannerBlock", { content: { designVariant: "ribbon" } })
    ),
  ],
};

export function getVariantsForBlock(type: string): SaasVariantEntry[] {
  if (type in saasLandingBlockVariants) {
    return saasLandingBlockVariants[type as SaasLandingPickableType];
  }
  return [];
}
