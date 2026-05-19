"use client";

import dynamic from "next/dynamic";

/**
 * Load all section components client-side only
 * This avoids SSR issues with sliders, window, YouTube, etc.
 */
export const SECTION_COMPONENTS: Record<string, any> = {
  brand_header: dynamic(() => import("./brand_header"), { ssr: true }),
  header: dynamic(() => import("./header"), { ssr: true }),
  hero: dynamic(() => import("./hero"), { ssr: true }),
  image_gallery: dynamic(() => import("./image_gallery"), { ssr: true }),
  image_gallery_overlay: dynamic(() => import("./image_gallery_overlay"), { ssr: true }),
  image_gallery_coverflow: dynamic(() => import("./image_gallery_coverflow"), { ssr: true }),
  product_header: dynamic(() => import("./product_header"), { ssr: true }),
  product_header_alt: dynamic(() => import("./product_header_alt"), { ssr: true }),
  video: dynamic(() => import("./video"), { ssr: true }),
  cta: dynamic(() => import("./CTA"), { ssr: true }),
  social_links: dynamic(() => import("./social_links"), { ssr: true }),
  contact: dynamic(() => import("./contact"), { ssr: true }),
  testimonials: dynamic(() => import("./testimonials"), { ssr: true }),
  form: dynamic(() => import("./form"), { ssr: true }),
  form_popup: dynamic(() => import("./form_popup"), { ssr: true }),
  popup: dynamic(() => import("./popup"), { ssr: true }),
  // ProductDetail: dynamic(() => import("./ProductDetail"), { ssr: true })
};
