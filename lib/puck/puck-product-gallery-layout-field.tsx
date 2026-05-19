"use client";

import type { CustomField } from "@measured/puck";
import { productVariantThumbnail } from "@/lib/puck/product-variant-thumbnails";
import { cn } from "@/lib/utils";

/**
 * Keep in sync with `productDetailBlockVariants.ProductGalleryBlock` in `product-detail-variants.ts`
 * (ids, titles, descriptions — thumbnails come from `productVariantThumbnail`).
 */
const PRODUCT_GALLERY_LAYOUT_VARIANTS = [
  {
    id: "sidebar-thumbs",
    title: "Main + thumb rail",
    description: "Large image with vertical thumbnails on desktop.",
  },
  {
    id: "stacked",
    title: "Stacked gallery",
    description: "Main image with horizontal thumbnail strip below.",
  },
  {
    id: "carousel",
    title: "Carousel focus",
    description: "Single stage with dot indicators — carousel-style PDP.",
  },
] as const;

/** Sidebar control to switch gallery layout (same options as the picker when dropping the block). */
export function puckProductGalleryLayoutField(): CustomField<string> {
  return {
    type: "custom",
    label: "Gallery layout",
    render: ({ value, onChange }) => {
      const current =
        typeof value === "string" && value.trim() ? value.trim() : "sidebar-thumbs";
      return (
        <div className="space-y-2 pt-0.5">
          <p className="text-[11px] leading-snug text-muted-foreground">
            Same layouts as when you first add this block. Image URLs and styles stay the same; only the arrangement
            changes.
          </p>
          <div className="grid grid-cols-1 gap-2">
            {PRODUCT_GALLERY_LAYOUT_VARIANTS.map((v) => {
              const selected = current === v.id;
              const thumb = productVariantThumbnail("ProductGalleryBlock", v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onChange(v.id)}
                  className={cn(
                    "flex gap-2 overflow-hidden rounded-lg border bg-card p-2 text-left shadow-sm transition",
                    selected
                      ? "border-primary ring-1 ring-primary/35"
                      : "border-border hover:border-primary/35 hover:bg-muted/40"
                  )}
                >
                  <div className="relative h-14 w-[4.5rem] shrink-0 overflow-hidden rounded-md bg-muted/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumb}
                      alt=""
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold leading-tight text-foreground">{v.title}</div>
                    <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{v.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    },
  };
}
