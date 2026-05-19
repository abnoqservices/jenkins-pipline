/** Mini wireframe previews for the SaaS block variant picker (SVG data URLs, 320×200). */

function svgUrl(inner: string, bg = "#fafafd"): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><rect width="320" height="200" fill="${bg}" rx="10"/><g opacity="0.96">${inner}</g></svg>`
  )}`;
}

const accent = "#6366f1";
const accent2 = "#8b5cf6";
const accent3 = "#ec4899";
const ink = "#0b1220";
const line = "#e5e7eb";
const muted = "#94a3b8";

const THUMBS: Record<string, string> = {
  /* ─── NavBar ───────────────────────────────────────────────────────── */
  "NavBarBlock:marketing-full": svgUrl(
    `<rect x="12" y="18" width="56" height="14" rx="3" fill="${accent}"/><rect x="100" y="20" width="28" height="8" rx="2" fill="${muted}"/><rect x="138" y="20" width="32" height="8" rx="2" fill="${muted}"/><rect x="178" y="20" width="24" height="8" rx="2" fill="${muted}"/><rect x="210" y="20" width="36" height="8" rx="2" fill="${muted}"/><rect x="254" y="20" width="28" height="8" rx="2" fill="${muted}"/><rect x="248" y="42" width="60" height="20" rx="10" fill="${accent}"/>`
  ),
  "NavBarBlock:centered-pill": svgUrl(
    `<rect x="0" y="0" width="320" height="22" fill="url(#g1)"/><defs><linearGradient id="g1" x1="0" x2="1"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="${accent3}"/></linearGradient></defs><text x="160" y="15" font-size="9" fill="white" text-anchor="middle" font-family="sans-serif">✦ New · Lumen 2.0</text><rect x="32" y="38" width="256" height="44" rx="22" fill="white" stroke="${line}" stroke-width="1.5"/><rect x="46" y="50" width="48" height="14" rx="3" fill="${accent}"/><rect x="118" y="55" width="20" height="6" rx="2" fill="${muted}"/><rect x="146" y="55" width="20" height="6" rx="2" fill="${muted}"/><rect x="174" y="55" width="22" height="6" rx="2" fill="${muted}"/><rect x="226" y="48" width="50" height="22" rx="11" fill="${accent}"/>`
  ),
  "NavBarBlock:compact": svgUrl(
    `<rect x="12" y="22" width="48" height="14" rx="3" fill="${accent}"/><rect x="72" y="26" width="22" height="7" rx="2" fill="#64748b"/><rect x="100" y="26" width="26" height="7" rx="2" fill="#64748b"/><rect x="132" y="26" width="20" height="7" rx="2" fill="#64748b"/><rect x="158" y="26" width="24" height="7" rx="2" fill="#64748b"/><rect x="250" y="20" width="58" height="22" rx="11" fill="${accent}"/>`
  ),
  "NavBarBlock:docs-style": svgUrl(
    `<rect width="320" height="200" fill="#0b1220" rx="10"/><rect x="12" y="22" width="52" height="14" rx="3" fill="${accent}"/><rect x="80" y="26" width="24" height="7" rx="2" fill="${muted}"/><rect x="110" y="26" width="28" height="7" rx="2" fill="${muted}"/><rect x="144" y="26" width="22" height="7" rx="2" fill="${muted}"/><rect x="246" y="18" width="62" height="22" rx="6" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/><rect x="0" y="54" width="320" height="2" fill="${accent}" opacity="0.5"/>`,
    "#0b1220"
  ),

  /* ─── Hero ─────────────────────────────────────────────────────────── */
  "HeroSplitBlock:split-asymmetric": svgUrl(
    `<defs><radialGradient id="hsg1" cx="0.2" cy="0.1"><stop offset="0" stop-color="${accent}" stop-opacity="0.35"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient><radialGradient id="hsg2" cx="0.85" cy="0.5"><stop offset="0" stop-color="${accent3}" stop-opacity="0.3"/><stop offset="1" stop-color="${accent3}" stop-opacity="0"/></radialGradient></defs><rect width="320" height="200" fill="url(#hsg1)"/><rect width="320" height="200" fill="url(#hsg2)"/><rect x="14" y="22" width="60" height="14" rx="7" fill="white" stroke="${line}"/><rect x="14" y="46" width="156" height="14" rx="3" fill="${ink}"/><rect x="14" y="68" width="120" height="14" rx="3" fill="${ink}"/><rect x="14" y="98" width="120" height="8" rx="2" fill="${muted}"/><rect x="14" y="116" width="100" height="8" rx="2" fill="${muted}"/><rect x="14" y="142" width="68" height="22" rx="11" fill="${accent}"/><rect x="92" y="142" width="60" height="22" rx="11" fill="white" stroke="${line}"/><rect x="180" y="22" width="124" height="156" rx="14" fill="white" stroke="${line}"/><rect x="158" y="120" width="44" height="36" rx="7" fill="white" stroke="${line}"/>`
  ),
  "HeroSplitBlock:stacked-center": svgUrl(
    `<defs><radialGradient id="cs1" cx="0.5" cy="0.15"><stop offset="0" stop-color="${accent}" stop-opacity="0.35"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs><rect width="320" height="200" fill="url(#cs1)"/><rect x="120" y="20" width="80" height="14" rx="7" fill="white" stroke="${line}"/><rect x="60" y="44" width="200" height="16" rx="3" fill="${ink}"/><rect x="80" y="68" width="160" height="8" rx="2" fill="${muted}"/><rect x="90" y="84" width="140" height="8" rx="2" fill="${muted}"/><rect x="108" y="106" width="50" height="22" rx="11" fill="${accent}"/><rect x="168" y="106" width="50" height="22" rx="11" fill="white" stroke="${line}"/><rect x="48" y="138" width="224" height="46" rx="10" fill="white" stroke="${line}"/>`
  ),
  "HeroSplitBlock:media-first": svgUrl(
    `<defs><linearGradient id="mfg" x1="0" x2="1"><stop offset="0" stop-color="${accent}" stop-opacity="0.2"/><stop offset="1" stop-color="${accent3}" stop-opacity="0.2"/></linearGradient></defs><rect width="320" height="200" fill="url(#mfg)"/><rect x="170" y="22" width="60" height="14" rx="7" fill="white" stroke="${line}"/><rect x="170" y="44" width="130" height="14" rx="3" fill="${ink}"/><rect x="170" y="64" width="110" height="8" rx="2" fill="${muted}"/><rect x="170" y="86" width="70" height="22" rx="11" fill="${accent}"/><rect x="14" y="22" width="140" height="156" rx="14" fill="white" stroke="${line}"/>`
  ),
  "HeroSplitBlock:spotlight": svgUrl(
    `<rect width="320" height="200" fill="#0b1220" rx="10"/><defs><radialGradient id="sp1" cx="0.5" cy="0.5"><stop offset="0" stop-color="${accent}" stop-opacity="0.5"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs><rect width="320" height="200" fill="url(#sp1)"/><rect x="124" y="36" width="72" height="14" rx="7" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)"/><rect x="48" y="62" width="224" height="18" rx="4" fill="white"/><rect x="68" y="92" width="184" height="10" rx="2" fill="${muted}"/><rect x="88" y="110" width="144" height="10" rx="2" fill="${muted}"/><rect x="116" y="138" width="88" height="26" rx="13" fill="${accent}"/>`,
    "#0b1220"
  ),

  /* ─── Logo cloud ──────────────────────────────────────────────────── */
  "LogoCloudBlock:marquee": svgUrl(
    `<rect x="60" y="22" width="200" height="10" rx="2" fill="${muted}"/><g opacity="0.6">${[40, 100, 160, 220, 280].map(
      (x) => `<rect x="${x - 28}" y="80" width="56" height="20" rx="3" fill="${line}"/>`
    ).join("")}</g><g opacity="0.4">${[20, 80, 140, 200, 260, 320].map(
      (x) => `<rect x="${x - 24}" y="118" width="48" height="18" rx="3" fill="${line}"/>`
    ).join("")}</g>`
  ),
  "LogoCloudBlock:enterprise": svgUrl(
    `<rect x="16" y="20" width="180" height="10" rx="2" fill="#64748b"/><rect x="16" y="44" width="56" height="44" rx="10" fill="white" stroke="${line}"/><rect x="80" y="44" width="56" height="44" rx="10" fill="white" stroke="${line}"/><rect x="144" y="44" width="56" height="44" rx="10" fill="white" stroke="${line}"/><rect x="208" y="44" width="56" height="44" rx="10" fill="white" stroke="${line}"/><rect x="48" y="100" width="56" height="44" rx="10" fill="white" stroke="${line}"/><rect x="112" y="100" width="56" height="44" rx="10" fill="white" stroke="${line}"/><rect x="176" y="100" width="56" height="44" rx="10" fill="white" stroke="${line}"/>`
  ),
  "LogoCloudBlock:pill": svgUrl(
    `<rect x="72" y="28" width="176" height="9" rx="2" fill="${muted}"/><rect x="40" y="74" width="240" height="44" rx="22" fill="white" stroke="${line}" stroke-width="2"/><rect x="56" y="88" width="48" height="14" rx="2" fill="${line}"/><line x1="116" y1="80" x2="116" y2="112" stroke="${line}"/><rect x="128" y="88" width="44" height="14" rx="2" fill="${line}"/><line x1="188" y1="80" x2="188" y2="112" stroke="${line}"/><rect x="200" y="88" width="40" height="14" rx="2" fill="${line}"/>`
  ),
  "LogoCloudBlock:social-proof": svgUrl(
    `<rect x="48" y="24" width="224" height="10" rx="2" fill="${muted}"/><rect x="24" y="80" width="48" height="18" rx="3" fill="${line}"/><rect x="84" y="80" width="48" height="18" rx="3" fill="${line}"/><rect x="144" y="80" width="48" height="18" rx="3" fill="${line}"/><rect x="204" y="80" width="48" height="18" rx="3" fill="${line}"/><rect x="264" y="80" width="40" height="18" rx="3" fill="${line}"/>`
  ),

  /* ─── Support / value ─────────────────────────────────────────────── */
  "SupportFeaturesBlock:three-pillars": svgUrl(
    `<rect x="16" y="28" width="60" height="14" rx="7" fill="white" stroke="${line}"/><rect x="16" y="50" width="120" height="14" rx="3" fill="${ink}"/><rect x="16" y="70" width="100" height="8" rx="2" fill="${muted}"/><circle cx="32" cy="118" r="6" fill="#fbbf24"/><rect x="44" y="114" width="60" height="8" rx="2" fill="${ink}"/><rect x="160" y="32" width="48" height="44" rx="10" fill="${accent}" opacity="0.16"/><rect x="160" y="84" width="140" height="8" rx="2" fill="${ink}"/><rect x="160" y="98" width="120" height="8" rx="2" fill="${muted}"/><rect x="160" y="124" width="48" height="44" rx="10" fill="${accent2}" opacity="0.16"/><rect x="216" y="124" width="100" height="8" rx="2" fill="${ink}"/><rect x="216" y="138" width="84" height="8" rx="2" fill="${muted}"/>`
  ),
  "SupportFeaturesBlock:two-features": svgUrl(
    `<rect x="16" y="20" width="60" height="14" rx="7" fill="white" stroke="${line}"/><rect x="16" y="40" width="180" height="14" rx="3" fill="${ink}"/><rect x="16" y="64" width="220" height="8" rx="2" fill="${muted}"/><rect x="16" y="92" width="138" height="92" rx="14" fill="white" stroke="${line}"/><rect x="28" y="104" width="36" height="36" rx="10" fill="${accent}" opacity="0.18"/><rect x="166" y="92" width="138" height="92" rx="14" fill="white" stroke="${line}"/><rect x="178" y="104" width="36" height="36" rx="10" fill="${accent2}" opacity="0.18"/>`
  ),
  "SupportFeaturesBlock:support-heavy": svgUrl(
    `<rect x="16" y="32" width="130" height="100" rx="10" fill="white" stroke="${line}"/><rect x="32" y="48" width="24" height="24" rx="6" fill="${accent}" opacity="0.18"/><rect x="160" y="32" width="60" height="14" rx="7" fill="white" stroke="${line}"/><rect x="160" y="54" width="144" height="14" rx="3" fill="${ink}"/><rect x="160" y="80" width="120" height="8" rx="2" fill="${muted}"/>`
  ),

  /* ─── Feature grid ────────────────────────────────────────────────── */
  "FeatureGridBlock:bento": svgUrl(
    `<rect x="16" y="20" width="60" height="14" rx="7" fill="white" stroke="${line}"/><rect x="16" y="40" width="160" height="14" rx="3" fill="${ink}"/><rect x="248" y="38" width="56" height="20" rx="10" fill="${accent}"/><rect x="16" y="68" width="184" height="116" rx="14" fill="${accent}" opacity="0.12"/><rect x="116" y="100" width="60" height="60" rx="12" fill="${accent}"/><rect x="208" y="68" width="96" height="56" rx="14" fill="white" stroke="${line}"/><rect x="208" y="128" width="96" height="56" rx="14" fill="white" stroke="${line}"/>`
  ),
  "FeatureGridBlock:three-cards": svgUrl(
    `<rect x="16" y="20" width="120" height="12" rx="2" fill="${ink}"/><rect x="248" y="18" width="56" height="20" rx="10" fill="${accent}"/><rect x="16" y="52" width="92" height="132" rx="14" fill="white" stroke="${line}"/><rect x="116" y="52" width="92" height="132" rx="14" fill="white" stroke="${line}"/><rect x="216" y="52" width="92" height="132" rx="14" fill="white" stroke="${line}"/>`
  ),
  "FeatureGridBlock:scroll-rail": svgUrl(
    `<rect x="16" y="20" width="120" height="12" rx="2" fill="${ink}"/><rect x="16" y="48" width="116" height="136" rx="14" fill="white" stroke="${line}"/><rect x="140" y="48" width="116" height="136" rx="14" fill="white" stroke="${line}"/><rect x="264" y="48" width="56" height="136" rx="14" fill="white" stroke="${line}"/><path d="M310 116 L320 116 L315 110 M315 122 L320 116" stroke="${accent}" stroke-width="2" fill="none"/>`
  ),

  /* ─── Benefits ────────────────────────────────────────────────────── */
  "BenefitsShowcaseBlock:checklist-photo": svgUrl(
    `<rect x="16" y="32" width="60" height="14" rx="7" fill="white" stroke="${line}"/><rect x="16" y="54" width="120" height="14" rx="3" fill="${ink}"/><circle cx="28" cy="92" r="7" fill="${accent}"/><rect x="40" y="88" width="98" height="8" rx="2" fill="${ink}"/><circle cx="28" cy="116" r="7" fill="${accent}"/><rect x="40" y="112" width="86" height="8" rx="2" fill="${ink}"/><circle cx="28" cy="140" r="7" fill="${accent}"/><rect x="40" y="136" width="100" height="8" rx="2" fill="${ink}"/><rect x="166" y="22" width="138" height="160" rx="14" fill="${accent}" opacity="0.16"/><rect x="178" y="148" width="78" height="36" rx="8" fill="white"/>`
  ),
  "BenefitsShowcaseBlock:photo-first": svgUrl(
    `<rect x="166" y="32" width="60" height="14" rx="7" fill="white" stroke="${line}"/><rect x="166" y="54" width="120" height="14" rx="3" fill="${ink}"/><circle cx="178" cy="92" r="7" fill="${accent}"/><rect x="190" y="88" width="98" height="8" rx="2" fill="${ink}"/><rect x="16" y="22" width="138" height="160" rx="14" fill="${accent2}" opacity="0.16"/><rect x="28" y="148" width="78" height="36" rx="8" fill="white"/>`
  ),
  "BenefitsShowcaseBlock:dark-focus": svgUrl(
    `<rect width="320" height="200" fill="#0b1220" rx="10"/><defs><radialGradient id="df1" cx="0.5" cy="0.5"><stop offset="0" stop-color="${accent}" stop-opacity="0.4"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs><rect width="320" height="200" fill="url(#df1)"/><rect x="72" y="44" width="176" height="14" rx="3" fill="white"/><circle cx="56" cy="86" r="7" fill="${accent}"/><rect x="72" y="82" width="120" height="8" rx="2" fill="${muted}"/><circle cx="56" cy="112" r="7" fill="${accent}"/><rect x="72" y="108" width="100" height="8" rx="2" fill="${muted}"/><circle cx="56" cy="138" r="7" fill="${accent}"/><rect x="72" y="134" width="130" height="8" rx="2" fill="${muted}"/>`,
    "#0b1220"
  ),

  /* ─── Pricing ─────────────────────────────────────────────────────── */
  "PricingPlansBlock:three-tier": svgUrl(
    `<rect x="100" y="18" width="120" height="12" rx="2" fill="${ink}"/><rect x="92" y="38" width="136" height="20" rx="10" fill="white" stroke="${line}"/><rect x="16" y="68" width="92" height="120" rx="14" fill="white" stroke="${line}"/><rect x="116" y="60" width="92" height="132" rx="14" fill="url(#pg)" stroke="${accent}" stroke-width="1.5"/><defs><linearGradient id="pg" x1="0" x2="1"><stop offset="0" stop-color="${accent}" stop-opacity="0.16"/><stop offset="1" stop-color="${accent2}" stop-opacity="0.16"/></linearGradient></defs><rect x="216" y="68" width="92" height="120" rx="14" fill="white" stroke="${line}"/><rect x="138" y="78" width="48" height="22" rx="11" fill="${accent}"/>`
  ),
  "PricingPlansBlock:yearly-default": svgUrl(
    `<rect x="80" y="18" width="160" height="12" rx="2" fill="${ink}"/><rect x="16" y="44" width="288" height="44" rx="14" fill="white" stroke="${line}"/><rect x="16" y="96" width="288" height="44" rx="14" fill="url(#pg2)" stroke="${accent}" stroke-width="1.5"/><defs><linearGradient id="pg2" x1="0" x2="1"><stop offset="0" stop-color="${accent}" stop-opacity="0.18"/><stop offset="1" stop-color="${accent2}" stop-opacity="0.18"/></linearGradient></defs><rect x="16" y="148" width="288" height="44" rx="14" fill="white" stroke="${line}"/><rect x="240" y="58" width="52" height="20" rx="10" fill="${accent}"/>`
  ),
  "PricingPlansBlock:solo-pro": svgUrl(
    `<rect x="70" y="20" width="180" height="12" rx="2" fill="${ink}"/><rect x="32" y="48" width="124" height="136" rx="14" fill="white" stroke="${line}"/><rect x="164" y="40" width="124" height="152" rx="14" fill="url(#pg3)" stroke="${accent}" stroke-width="2"/><defs><linearGradient id="pg3" x1="0" x2="1"><stop offset="0" stop-color="${accent}" stop-opacity="0.18"/><stop offset="1" stop-color="${accent3}" stop-opacity="0.18"/></linearGradient></defs><rect x="194" y="56" width="64" height="22" rx="11" fill="${accent}"/>`
  ),

  /* ─── Testimonial / lead ─────────────────────────────────────────── */
  "TestimonialLeadBlock:split-glass": svgUrl(
    `<rect width="320" height="200" fill="#0b1220" rx="10"/><defs><radialGradient id="tg1" cx="0.2" cy="0.2"><stop offset="0" stop-color="${accent}" stop-opacity="0.4"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs><rect width="320" height="200" fill="url(#tg1)"/><rect x="16" y="32" width="130" height="100" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)"/><rect x="24" y="48" width="100" height="8" rx="2" fill="rgba(255,255,255,0.5)"/><rect x="24" y="64" width="110" height="6" rx="2" fill="rgba(255,255,255,0.3)"/><rect x="158" y="28" width="146" height="148" rx="14" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)"/><rect x="172" y="120" width="118" height="40" rx="12" fill="${accent}"/>`,
    "#0b1220"
  ),
  "TestimonialLeadBlock:stacked-cta": svgUrl(
    `<rect width="320" height="200" fill="#0b1220" rx="10"/><rect x="40" y="20" width="240" height="10" rx="2" fill="${muted}"/><rect x="48" y="40" width="224" height="36" rx="6" fill="rgba(255,255,255,0.05)"/><rect x="56" y="84" width="208" height="98" rx="14" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)"/><rect x="72" y="148" width="176" height="22" rx="11" fill="${accent}"/>`,
    "#0b1220"
  ),
  "TestimonialLeadBlock:form-first": svgUrl(
    `<rect width="320" height="200" fill="#0b1220" rx="10"/><rect x="16" y="22" width="130" height="156" rx="14" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)"/><rect x="32" y="124" width="98" height="40" rx="12" fill="${accent}"/><rect x="158" y="36" width="146" height="80" rx="10" fill="rgba(255,255,255,0.04)"/><rect x="170" y="52" width="120" height="6" rx="2" fill="${muted}"/>`,
    "#0b1220"
  ),

  /* ─── Footer ──────────────────────────────────────────────────────── */
  "FooterMegaBlock:mega-cta": svgUrl(
    `<rect width="320" height="200" fill="#0b1220" rx="10"/><rect x="16" y="20" width="288" height="64" rx="14" fill="url(#fg1)"/><defs><linearGradient id="fg1" x1="0" x2="1"><stop offset="0" stop-color="${accent}"/><stop offset="0.5" stop-color="${accent2}"/><stop offset="1" stop-color="${accent3}"/></linearGradient></defs><rect x="32" y="34" width="120" height="10" rx="2" fill="white" opacity="0.95"/><rect x="32" y="50" width="160" height="6" rx="2" fill="white" opacity="0.7"/><rect x="232" y="42" width="58" height="20" rx="10" fill="white"/><rect x="16" y="100" width="64" height="14" rx="3" fill="${accent}"/><rect x="100" y="100" width="48" height="6" rx="2" fill="${muted}"/><rect x="158" y="100" width="48" height="6" rx="2" fill="${muted}"/><rect x="216" y="100" width="48" height="6" rx="2" fill="${muted}"/><rect x="16" y="172" width="180" height="6" rx="2" fill="${muted}"/>`,
    "#0b1220"
  ),
  "FooterMegaBlock:product-focused": svgUrl(
    `<rect width="320" height="200" fill="#0b1220" rx="10"/><rect x="120" y="24" width="80" height="14" rx="3" fill="${accent}"/><rect x="96" y="46" width="128" height="8" rx="2" fill="${muted}"/><rect x="100" y="64" width="120" height="22" rx="11" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)"/><rect x="16" y="100" width="92" height="80" rx="6" fill="rgba(255,255,255,0.04)"/><rect x="116" y="100" width="92" height="80" rx="6" fill="rgba(255,255,255,0.04)"/><rect x="216" y="100" width="92" height="80" rx="6" fill="rgba(255,255,255,0.04)"/>`,
    "#0b1220"
  ),
  "FooterMegaBlock:minimal-legal": svgUrl(
    `<rect width="320" height="200" fill="#0b1220" rx="10"/><rect x="24" y="86" width="48" height="14" rx="3" fill="${accent}"/><rect x="80" y="90" width="140" height="8" rx="2" fill="${muted}"/><rect x="24" y="118" width="272" height="1" fill="rgba(148,163,184,0.2)"/><rect x="24" y="132" width="180" height="6" rx="2" fill="${muted}"/><rect x="220" y="132" width="36" height="6" rx="2" fill="${muted}"/><rect x="264" y="132" width="32" height="6" rx="2" fill="${muted}"/>`,
    "#0b1220"
  ),

  /* ─── Stats ───────────────────────────────────────────────────────── */
  "StatsBlock:row": svgUrl(
    `<rect x="16" y="20" width="60" height="14" rx="7" fill="white" stroke="${line}"/><rect x="16" y="40" width="160" height="14" rx="3" fill="${ink}"/><rect x="16" y="76" width="288" height="108" rx="14" fill="white" stroke="${line}"/><line x1="88" y1="76" x2="88" y2="184" stroke="${line}"/><line x1="160" y1="76" x2="160" y2="184" stroke="${line}"/><line x1="232" y1="76" x2="232" y2="184" stroke="${line}"/><text x="52" y="124" font-size="20" fill="${accent}" text-anchor="middle" font-family="sans-serif" font-weight="700">12k</text><text x="124" y="124" font-size="20" fill="${accent2}" text-anchor="middle" font-family="sans-serif" font-weight="700">98%</text><text x="196" y="124" font-size="20" fill="${accent3}" text-anchor="middle" font-family="sans-serif" font-weight="700">+38%</text><text x="268" y="124" font-size="20" fill="${accent}" text-anchor="middle" font-family="sans-serif" font-weight="700">60+</text><rect x="32" y="140" width="40" height="6" rx="2" fill="${muted}"/><rect x="104" y="140" width="40" height="6" rx="2" fill="${muted}"/><rect x="176" y="140" width="40" height="6" rx="2" fill="${muted}"/><rect x="248" y="140" width="40" height="6" rx="2" fill="${muted}"/>`
  ),

  /* ─── FAQ ─────────────────────────────────────────────────────────── */
  "FaqBlock:two-column": svgUrl(
    `<rect x="16" y="32" width="60" height="14" rx="7" fill="white" stroke="${line}"/><rect x="16" y="54" width="120" height="14" rx="3" fill="${ink}"/><rect x="16" y="78" width="100" height="8" rx="2" fill="${muted}"/><rect x="16" y="100" width="58" height="22" rx="11" fill="${accent}"/><rect x="160" y="32" width="144" height="148" rx="14" fill="white" stroke="${line}"/><line x1="172" y1="64" x2="292" y2="64" stroke="${line}"/><line x1="172" y1="100" x2="292" y2="100" stroke="${line}"/><line x1="172" y1="136" x2="292" y2="136" stroke="${line}"/><circle cx="282" cy="48" r="7" fill="${accent}"/>`
  ),
  "FaqBlock:stacked": svgUrl(
    `<rect x="120" y="20" width="80" height="14" rx="7" fill="white" stroke="${line}"/><rect x="60" y="42" width="200" height="14" rx="3" fill="${ink}"/><rect x="80" y="64" width="160" height="8" rx="2" fill="${muted}"/><rect x="40" y="92" width="240" height="92" rx="14" fill="white" stroke="${line}"/><line x1="56" y1="118" x2="264" y2="118" stroke="${line}"/><line x1="56" y1="148" x2="264" y2="148" stroke="${line}"/>`
  ),

  /* ─── CTA banner ──────────────────────────────────────────────────── */
  "CtaBannerBlock:gradient-card": svgUrl(
    `<rect width="320" height="200" fill="#fafafd" rx="10"/><rect x="14" y="14" width="292" height="172" rx="20" fill="url(#cb1)"/><defs><linearGradient id="cb1" x1="0" x2="1"><stop offset="0" stop-color="${accent}"/><stop offset="0.5" stop-color="${accent2}"/><stop offset="1" stop-color="${accent3}"/></linearGradient></defs><rect x="20" y="20" width="280" height="160" rx="18" fill="rgba(11,18,32,0.85)"/><rect x="100" y="48" width="120" height="14" rx="7" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)"/><rect x="60" y="76" width="200" height="14" rx="3" fill="white"/><rect x="80" y="100" width="160" height="8" rx="2" fill="${muted}"/><rect x="100" y="130" width="120" height="26" rx="13" fill="white"/>`
  ),
  "CtaBannerBlock:ribbon": svgUrl(
    `<rect width="320" height="200" fill="#fafafd" rx="10"/><rect x="16" y="68" width="288" height="64" rx="20" fill="url(#cb2)"/><defs><linearGradient id="cb2" x1="0" x2="1"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="${accent2}"/></linearGradient></defs><rect x="32" y="80" width="80" height="10" rx="2" fill="white" opacity="0.95"/><rect x="32" y="98" width="140" height="6" rx="2" fill="white" opacity="0.7"/><rect x="220" y="86" width="72" height="28" rx="14" fill="white"/>`
  ),
};

const FALLBACK = svgUrl(
  `<rect x="40" y="80" width="240" height="40" rx="10" fill="${line}"/><rect x="120" y="94" width="80" height="12" rx="3" fill="${muted}"/>`
);

export function saasVariantThumbnail(blockType: string, variantId: string): string {
  return THUMBS[`${blockType}:${variantId}`] ?? FALLBACK;
}
