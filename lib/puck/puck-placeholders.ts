/**
 * Puck documents may include {{product.name}}, {{section_key.field_key}}, etc.
 * Public pages replace these on the server; use the same logic client-side for preview.
 */

export const PLACEHOLDER_CHEATSHEET =
  "Double curly braces anywhere in text or URL fields. Unknown tokens are left as-is until you add matching section content.";

export const PRODUCT_PLACEHOLDER_KEYS = [
  "product.name",
  "product.description",
  "product.url_slug",
  "product.sku",
  "product.price",
  "product.video_url",
  "product.meta_title",
  "product.meta_description",
  "product.qr_code_url",
  "product.image_url",
  "product.image_1",
  "product.image_2",
  "product.image_3",
  "product.image_4",
] as const;

export type PuckPlaceholderProduct = {
  name?: string;
  description?: string;
  url_slug?: string;
  sku?: string;
  price?: string | number | null;
  video_url?: string;
  meta_title?: string;
  meta_description?: string;
  qr_code_url?: string;
  image_url?: string;
  image_1?: string;
  image_2?: string;
  image_3?: string;
  image_4?: string;
  custom_fields?: Record<string, string>;
};

export type SectionContentSource = {
  sectionKey: string;
  content: Record<string, unknown>;
};

function scalarize(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "1" : "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return "";
}

export function buildPuckPlaceholderMap(
  product: PuckPlaceholderProduct,
  sections: SectionContentSource[]
): Record<string, string> {
  const price = product.price;
  const map: Record<string, string> = {
    "product.name": product.name ?? "",
    "product.description": product.description ?? "",
    "product.url_slug": product.url_slug ?? "",
    "product.sku": product.sku ?? "",
    "product.price":
      price !== null && price !== undefined && price !== "" ? String(price) : "",
    "product.video_url": product.video_url ?? "",
    "product.meta_title": product.meta_title ?? "",
    "product.meta_description": product.meta_description ?? "",
    "product.qr_code_url": product.qr_code_url ?? "",
    "product.image_url": product.image_url ?? "",
    "product.image_1": product.image_1 ?? "",
    "product.image_2": product.image_2 ?? "",
    "product.image_3": product.image_3 ?? "",
    "product.image_4": product.image_4 ?? "",
  };

  if (product.custom_fields && typeof product.custom_fields === "object") {
    for (const [slug, value] of Object.entries(product.custom_fields)) {
      if (!slug) continue;
      map[`product.custom.${slug}`] = scalarize(value);
    }
  }

  for (const sec of sections) {
    const sk = sec.sectionKey;
    if (!sk) continue;
    for (const [fieldKey, value] of Object.entries(sec.content || {})) {
      if (typeof fieldKey !== "string") continue;
      map[`${sk}.${fieldKey}`] = scalarize(value);
    }
  }
  return map;
}

function replaceInString(s: string, map: Record<string, string>): string {
  return s.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (full, key: string) =>
    Object.prototype.hasOwnProperty.call(map, key) ? map[key] : full
  );
}

export function applyPuckPlaceholders<T>(node: T, map: Record<string, string>): T {
  if (typeof node === "string") {
    return replaceInString(node, map) as T;
  }
  if (Array.isArray(node)) {
    return node.map((item) => applyPuckPlaceholders(item, map)) as T;
  }
  if (node !== null && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      out[k] = applyPuckPlaceholders(v, map);
    }
    return out as T;
  }
  return node;
}
