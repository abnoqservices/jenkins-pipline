function svgUrl(inner: string, bg = "#f8fafc"): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><rect width="320" height="200" fill="${bg}" rx="10"/><g opacity="0.92">${inner}</g></svg>`
  )}`;
}

const m = "#54bd95";
const ink = "#1e293b";
const line = "#e2e8f0";

const THUMBS: Record<string, string> = {
  "ProductHeaderBlock:hero": svgUrl(
    `<rect x="24" y="32" width="200" height="18" rx="3" fill="${ink}"/><rect x="24" y="58" width="160" height="8" rx="2" fill="#94a3b8"/><rect x="24" y="88" width="72" height="14" rx="3" fill="${m}"/><rect x="108" y="84" width="100" height="24" rx="6" fill="${m}"/>`
  ),
  "ProductHeaderBlock:compact-bar": svgUrl(
    `<rect x="16" y="72" width="288" height="56" rx="8" fill="#fff" stroke="${line}"/><rect x="32" y="88" width="100" height="12" rx="2" fill="${ink}"/><rect x="200" y="86" width="88" height="28" rx="6" fill="${m}"/>`
  ),
  "ProductHeaderBlock:card": svgUrl(
    `<rect x="48" y="40" width="224" height="120" rx="12" fill="#fff" stroke="${line}"/><rect x="64" y="56" width="120" height="12" rx="2" fill="${ink}"/><rect x="64" y="100" width="56" height="10" rx="2" fill="${m}"/><rect x="64" y="120" width="160" height="22" rx="6" fill="${m}"/>`
  ),

  "ProductGalleryBlock:sidebar-thumbs": svgUrl(
    `<rect x="24" y="28" width="200" height="144" rx="10" fill="#e2e8f0"/><rect x="236" y="28" width="52" height="32" rx="4" fill="#cbd5e1"/><rect x="236" y="68" width="52" height="32" rx="4" fill="#cbd5e1"/><rect x="236" y="108" width="52" height="32" rx="4" fill="#cbd5e1"/>`
  ),
  "ProductGalleryBlock:stacked": svgUrl(
    `<rect x="40" y="24" width="240" height="120" rx="10" fill="#e2e8f0"/><rect x="56" y="152" width="48" height="28" rx="4" fill="#cbd5e1"/><rect x="112" y="152" width="48" height="28" rx="4" fill="#cbd5e1"/><rect x="168" y="152" width="48" height="28" rx="4" fill="#cbd5e1"/>`
  ),
  "ProductGalleryBlock:carousel": svgUrl(
    `<rect x="48" y="36" width="224" height="120" rx="10" fill="#e2e8f0"/><circle cx="128" cy="172" r="4" fill="${m}"/><circle cx="148" cy="172" r="4" fill="#cbd5e1"/><circle cx="168" cy="172" r="4" fill="#cbd5e1"/>`
  ),

  "ProductSpecsBlock:table": svgUrl(
    `<rect x="32" y="28" width="120" height="12" rx="2" fill="${ink}"/><rect x="32" y="52" width="256" height="28" fill="#f1f5f9"/><rect x="32" y="88" width="256" height="28" fill="#fff"/><rect x="32" y="124" width="256" height="28" fill="#f1f5f9"/>`
  ),
  "ProductSpecsBlock:grid": svgUrl(
    `<rect x="32" y="28" width="100" height="10" rx="2" fill="${ink}"/><rect x="32" y="52" width="80" height="56" rx="6" fill="#fff" stroke="${line}"/><rect x="120" y="52" width="80" height="56" rx="6" fill="#fff" stroke="${line}"/><rect x="208" y="52" width="80" height="56" rx="6" fill="#fff" stroke="${line}"/>`
  ),
  "ProductSpecsBlock:inline": svgUrl(
    `<rect x="48" y="36" width="90" height="10" rx="2" fill="${ink}"/><line x1="48" y1="60" x2="272" y2="60" stroke="${line}"/><rect x="48" y="72" width="60" height="8" rx="2" fill="#94a3b8"/><rect x="140" y="72" width="120" height="8" rx="2" fill="#cbd5e1"/>`
  ),

  "ProductHighlightsBlock:icon-row": svgUrl(
    `<rect x="80" y="28" width="160" height="10" rx="2" fill="${ink}"/><circle cx="64" cy="100" r="20" fill="#fff" stroke="${line}"/><circle cx="160" cy="100" r="20" fill="#fff" stroke="${line}"/><circle cx="256" cy="100" r="20" fill="#fff" stroke="${line}"/>`
  ),
  "ProductHighlightsBlock:stacked-cards": svgUrl(
    `<rect x="48" y="24" width="224" height="10" rx="2" fill="${ink}"/><rect x="48" y="48" width="224" height="44" rx="8" fill="#fff" stroke="${line}"/><rect x="48" y="100" width="224" height="44" rx="8" fill="#fff" stroke="${line}"/>`
  ),
  "ProductHighlightsBlock:bullets": svgUrl(
    `<rect x="48" y="32" width="100" height="10" rx="2" fill="${ink}"/><circle cx="56" cy="64" r="5" fill="${m}"/><rect x="72" y="60" width="180" height="8" rx="2" fill="#cbd5e1"/><circle cx="56" cy="88" r="5" fill="${m}"/><rect x="72" y="84" width="160" height="8" rx="2" fill="#cbd5e1"/>`
  ),

  "ProductTabsContentBlock:underline": svgUrl(
    `<rect x="48" y="36" width="48" height="8" rx="2" fill="${m}"/><rect x="112" y="36" width="56" height="8" rx="2" fill="#cbd5e1"/><rect x="184" y="36" width="48" height="8" rx="2" fill="#cbd5e1"/><line x1="48" y1="52" x2="96" y2="52" stroke="${m}" stroke-width="3"/><rect x="48" y="68" width="224" height="40" rx="4" fill="#f1f5f9"/>`
  ),
  "ProductTabsContentBlock:accordion": svgUrl(
    `<rect x="40" y="40" width="240" height="36" rx="6" fill="#fff" stroke="${line}"/><rect x="40" y="84" width="240" height="36" rx="6" fill="#fff" stroke="${line}"/><rect x="40" y="128" width="240" height="36" rx="6" fill="#fff" stroke="${line}"/>`
  ),
  "ProductTabsContentBlock:pills": svgUrl(
    `<rect x="56" y="40" width="56" height="22" rx="11" fill="${m}"/><rect x="124" y="40" width="64" height="22" rx="11" fill="#e2e8f0"/><rect x="198" y="40" width="52" height="22" rx="11" fill="#e2e8f0"/><rect x="40" y="80" width="240" height="72" rx="10" fill="#f8fafc" stroke="${line}"/>`
  ),

  "ProductRelatedBlock:grid": svgUrl(
    `<rect x="32" y="24" width="120" height="10" rx="2" fill="${ink}"/><rect x="24" y="48" width="62" height="80" rx="6" fill="#e2e8f0"/><rect x="96" y="48" width="62" height="80" rx="6" fill="#e2e8f0"/><rect x="168" y="48" width="62" height="80" rx="6" fill="#e2e8f0"/><rect x="240" y="48" width="56" height="80" rx="6" fill="#e2e8f0"/>`
  ),
  "ProductRelatedBlock:list": svgUrl(
    `<rect x="40" y="32" width="100" height="10" rx="2" fill="${ink}"/><rect x="40" y="56" width="240" height="36" rx="6" fill="#fff" stroke="${line}"/><rect x="40" y="100" width="240" height="36" rx="6" fill="#fff" stroke="${line}"/>`
  ),
  "ProductRelatedBlock:rail": svgUrl(
    `<rect x="32" y="28" width="100" height="10" rx="2" fill="${ink}"/><rect x="24" y="52" width="120" height="72" rx="8" fill="#fff" stroke="${line}"/><rect x="152" y="52" width="120" height="72" rx="8" fill="#fff" stroke="${line}"/><rect x="280" y="52" width="40" height="72" rx="8" fill="#e2e8f0"/>`
  ),
};

const FALLBACK = svgUrl(`<rect x="60" y="80" width="200" height="48" rx="8" fill="#e2e8f0"/>`);

export function productVariantThumbnail(blockType: string, variantId: string): string {
  return THUMBS[`${blockType}:${variantId}`] ?? FALLBACK;
}
