import { deepMergePlain } from "@/lib/puck/deep-merge-plain";
import {
  getProductDetailDefaultProps,
  type ProductDetailPickableType,
} from "@/lib/puck/product-detail-blocks";
import { productVariantThumbnail } from "@/lib/puck/product-variant-thumbnails";

export type ProductVariantEntry = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  resolveProps: () => Record<string, unknown>;
};

function patch(type: ProductDetailPickableType, partial: Record<string, unknown>): Record<string, unknown> {
  const base = getProductDetailDefaultProps(type);
  if (!base) throw new Error(`Missing defaults for ${type}`);
  return deepMergePlain(base, partial) as Record<string, unknown>;
}

function entry(
  block: ProductDetailPickableType,
  id: string,
  title: string,
  description: string,
  resolveProps: () => Record<string, unknown>
): ProductVariantEntry {
  return {
    id,
    title,
    description,
    imageSrc: productVariantThumbnail(block, id),
    resolveProps,
  };
}

export const productDetailBlockVariants: Record<ProductDetailPickableType, ProductVariantEntry[]> = {
  ProductHeaderBlock: [
    entry("ProductHeaderBlock", "hero", "Hero PDP title", "Large title, price, and primary CTA — typical product hero.", () =>
      getProductDetailDefaultProps("ProductHeaderBlock")!
    ),
    entry("ProductHeaderBlock", "compact-bar", "Compact title bar", "Single row with title, SKU badge, price, and CTA.", () =>
      patch("ProductHeaderBlock", {
        content: {
          designVariant: "compact-bar",
          badge: "Sale",
          subtitle: "",
        },
      })
    ),
    entry("ProductHeaderBlock", "card", "Card buy box", "Bordered summary card with price block and full-width CTA.", () =>
      patch("ProductHeaderBlock", {
        content: { designVariant: "card", badge: "" },
      })
    ),
  ],

  ProductGalleryBlock: [
    entry("ProductGalleryBlock", "sidebar-thumbs", "Main + thumb rail", "Large image with vertical thumbnails on desktop.", () =>
      getProductDetailDefaultProps("ProductGalleryBlock")!
    ),
    entry("ProductGalleryBlock", "stacked", "Stacked gallery", "Main image with horizontal thumbnail strip below.", () =>
      patch("ProductGalleryBlock", { content: { designVariant: "stacked" } })
    ),
    entry("ProductGalleryBlock", "carousel", "Carousel focus", "Single stage with dot indicators — carousel-style PDP.", () =>
      patch("ProductGalleryBlock", { content: { designVariant: "carousel" } })
    ),
  ],

  ProductSpecsBlock: [
    entry("ProductSpecsBlock", "table", "Spec table", "Striped two-column specification table.", () =>
      getProductDetailDefaultProps("ProductSpecsBlock")!
    ),
    entry("ProductSpecsBlock", "grid", "Spec cards", "Each attribute in its own card in a responsive grid.", () =>
      patch("ProductSpecsBlock", { content: { designVariant: "grid", title: "Tech specs" } })
    ),
    entry("ProductSpecsBlock", "inline", "Definition list", "Tight label / value pairs with dividers.", () =>
      patch("ProductSpecsBlock", { content: { designVariant: "inline", title: "At a glance" } })
    ),
  ],

  ProductHighlightsBlock: [
    entry("ProductHighlightsBlock", "icon-row", "Three-up icons", "Centered row of icon tiles with short copy.", () =>
      getProductDetailDefaultProps("ProductHighlightsBlock")!
    ),
    entry("ProductHighlightsBlock", "stacked-cards", "Stacked story cards", "Vertical cards with emoji and narrative.", () =>
      patch("ProductHighlightsBlock", { content: { designVariant: "stacked-cards" } })
    ),
    entry("ProductHighlightsBlock", "bullets", "Checklist", "Compact checkmark list for scanners.", () =>
      patch("ProductHighlightsBlock", { content: { designVariant: "bullets", title: "Included & guarantees" } })
    ),
  ],

  ProductTabsContentBlock: [
    entry("ProductTabsContentBlock", "underline", "Underline tabs", "Horizontal tabs with underline active state.", () =>
      getProductDetailDefaultProps("ProductTabsContentBlock")!
    ),
    entry("ProductTabsContentBlock", "accordion", "Accordion", "Expand/collapse panels — mobile-friendly.", () =>
      patch("ProductTabsContentBlock", { content: { designVariant: "accordion" } })
    ),
    entry("ProductTabsContentBlock", "pills", "Pill switcher", "Pill buttons above a single content panel.", () =>
      patch("ProductTabsContentBlock", { content: { designVariant: "pills" } })
    ),
  ],

  ProductRelatedBlock: [
    entry("ProductRelatedBlock", "grid", "Product grid", "Four-up image cards with price.", () =>
      getProductDetailDefaultProps("ProductRelatedBlock")!
    ),
    entry("ProductRelatedBlock", "list", "Compact list", "Horizontal cards stacked vertically.", () =>
      patch("ProductRelatedBlock", { content: { designVariant: "list", title: "Pairs well with" } })
    ),
    entry("ProductRelatedBlock", "rail", "Scrolling rail", "Horizontal scroll of narrow product cards.", () =>
      patch("ProductRelatedBlock", { content: { designVariant: "rail", title: "Customers also bought" } })
    ),
  ],
};

export function getVariantsForProductBlock(type: string): ProductVariantEntry[] {
  if (type in productDetailBlockVariants) {
    return productDetailBlockVariants[type as ProductDetailPickableType];
  }
  return [];
}
