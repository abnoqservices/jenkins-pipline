import { DEFAULT_ROOT_STYLE, PUCK_ROOT_STYLE_KEYS } from "@/lib/puck/root-theme-defaults";
import { DEFAULT_LAYOUT_PROPS } from "@/lib/puck/layout-fields";
import {
  AI_ALLOWED_BLOCK_TYPES,
  AI_BLOCK_REGISTRY,
  type AiAllowedBlockType,
  type AiBlockSpec,
} from "@/lib/puck/ai-block-catalog";

/**
 * Sanitize / normalize anything the model emitted. Strategy:
 *   - Unknown block types are dropped.
 *   - Each known block uses its registry-defined defaults; the model's content
 *     and style props are merged on top, type-checked, and clamped.
 *   - Array fields (links, features, plans, columns…) get per-item default
 *     fill so partial AI output still renders.
 *   - Layout uses the standard layout-fields defaults.
 *
 * Re-exported `AI_ALLOWED_BLOCK_TYPES` so the API route can read the
 * authoritative whitelist from a single source.
 */

export { AI_ALLOWED_BLOCK_TYPES };
export type { AiAllowedBlockType };

const ALLOWED = new Set<string>(AI_ALLOWED_BLOCK_TYPES);

const MAX_BLOCKS_PER_DOC = 24;
const MAX_DEFAULT_ARRAY = 12;

function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max);
}

function newBlockId(index: number): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return `ai-${c.randomUUID()}`;
  return `ai-${Date.now()}-${index}`;
}

function sanitizeLayout(input: unknown): Record<string, string> {
  const out: Record<string, string> = { ...DEFAULT_LAYOUT_PROPS };
  if (!input || typeof input !== "object") return out;
  const o = input as Record<string, unknown>;
  for (const k of Object.keys(DEFAULT_LAYOUT_PROPS) as (keyof typeof DEFAULT_LAYOUT_PROPS)[]) {
    if (typeof o[k] === "string") {
      out[k] = clip(o[k] as string, 24);
    }
  }
  return out;
}

function sanitizeRootFromAi(input: unknown): {
  content: Record<string, string>;
  style: Record<string, string>;
  layout: Record<string, string>;
} {
  const style: Record<string, string> = { ...DEFAULT_ROOT_STYLE };
  const content = { title: "Landing page" };
  if (!input || typeof input !== "object") {
    return { content, style, layout: { ...DEFAULT_LAYOUT_PROPS } };
  }
  const root = input as { props?: unknown };
  const p = root.props && typeof root.props === "object" ? (root.props as Record<string, unknown>) : {};

  if (p.content && typeof p.content === "object") {
    const c = p.content as Record<string, unknown>;
    if (typeof c.title === "string") {
      content.title = clip(c.title, 200);
    }
  } else if (typeof (p as { title?: unknown }).title === "string") {
    content.title = clip((p as { title: string }).title, 200);
  }

  const styleIn = p.style && typeof p.style === "object" ? (p.style as Record<string, unknown>) : p;
  for (const k of PUCK_ROOT_STYLE_KEYS) {
    if (typeof styleIn[k] === "string") {
      style[k] = clip(styleIn[k] as string, 40);
    }
  }

  const layout = sanitizeLayout(p.layout);
  return { content, style, layout };
}

/**
 * Coerce a single primitive to a safe value. Strings are clipped; numbers stay numeric;
 * booleans pass through. Anything weird becomes the default value.
 */
function coerceValue(value: unknown, fallback: unknown, maxStringLen: number): unknown {
  if (value === undefined || value === null) return fallback;
  if (typeof fallback === "string") {
    return typeof value === "string" ? clip(value, maxStringLen) : typeof value === "number" || typeof value === "boolean" ? clip(String(value), maxStringLen) : fallback;
  }
  if (typeof fallback === "number") {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const n = Number(value);
      return Number.isFinite(n) ? n : fallback;
    }
    return fallback;
  }
  if (typeof fallback === "boolean") {
    return typeof value === "boolean" ? value : value === "true" ? true : value === "false" ? false : fallback;
  }
  // Objects fall through; nested merging happens elsewhere.
  return value;
}

/**
 * Merge AI props into the spec defaults: every key the spec knows is preserved,
 * unknown keys are dropped. Strings are clipped at 8000 characters (very generous —
 * blocks like accordion answers can legitimately be long).
 */
function mergeFlatProps(
  defaults: Record<string, unknown>,
  ai: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(defaults)) {
    const v = ai[key];
    if (Array.isArray(def)) {
      out[key] = Array.isArray(v) ? v : def;
    } else if (def && typeof def === "object") {
      out[key] = v && typeof v === "object" && !Array.isArray(v) ? v : def;
    } else {
      out[key] = coerceValue(v, def, 8000);
    }
  }
  return out;
}

/**
 * Normalize a content array (e.g. links, features, plans, columns) by filling
 * each item with `itemDefaults` and recursing into nested arrays.
 */
function sanitizeArrayItems(
  raw: unknown,
  itemDefaults: Record<string, unknown>,
  maxItems: number,
  nestedArrayFields: Array<{
    name: string;
    itemDefaults: Record<string, unknown>;
    maxItems?: number;
  }> = []
): Array<Record<string, unknown>> {
  if (!Array.isArray(raw)) return [];
  const out: Array<Record<string, unknown>> = [];
  for (const entry of raw) {
    if (out.length >= maxItems) break;
    if (!entry || typeof entry !== "object") continue;
    const merged = mergeFlatProps(itemDefaults, entry as Record<string, unknown>);
    for (const nested of nestedArrayFields) {
      const nestedRaw = (entry as Record<string, unknown>)[nested.name];
      merged[nested.name] = sanitizeArrayItems(
        nestedRaw,
        nested.itemDefaults,
        nested.maxItems ?? MAX_DEFAULT_ARRAY
      );
    }
    out.push(merged);
  }
  return out;
}

function sanitizeBlockProps(
  spec: AiBlockSpec,
  rawProps: Record<string, unknown>
): Record<string, unknown> {
  const aiContent =
    rawProps.content && typeof rawProps.content === "object"
      ? (rawProps.content as Record<string, unknown>)
      : (rawProps as Record<string, unknown>);
  const aiStyle =
    rawProps.style && typeof rawProps.style === "object"
      ? (rawProps.style as Record<string, unknown>)
      : {};
  const aiLayout = rawProps.layout && typeof rawProps.layout === "object" ? rawProps.layout : undefined;

  const content = mergeFlatProps(spec.defaults.content, aiContent);
  for (const arr of spec.arrayFields ?? []) {
    content[arr.name] = sanitizeArrayItems(
      aiContent[arr.name],
      arr.itemDefaults,
      arr.maxItems ?? MAX_DEFAULT_ARRAY,
      arr.nestedArrayFields ?? []
    );
  }
  const style = mergeFlatProps(spec.defaults.style, aiStyle);
  const layout = sanitizeLayout(aiLayout ?? spec.defaults.layout);

  return { content, style, layout };
}

export type SanitizedPuckDocument = {
  root: { props: Record<string, unknown> };
  content: Array<{ type: string; props: Record<string, unknown>; id: string }>;
};

function defaultRootDoc(): SanitizedPuckDocument["root"] {
  return {
    props: {
      content: { title: "Landing page" },
      style: { ...DEFAULT_ROOT_STYLE },
      layout: { ...DEFAULT_LAYOUT_PROPS },
    },
  };
}

export function sanitizeAiPuckOutput(input: unknown): SanitizedPuckDocument {
  if (!input || typeof input !== "object") {
    return { root: defaultRootDoc(), content: [] };
  }
  const o = input as Record<string, unknown>;

  let root: SanitizedPuckDocument["root"];
  if (o.root && typeof o.root === "object") {
    const merged = sanitizeRootFromAi(o.root);
    root = { props: merged as unknown as Record<string, unknown> };
  } else {
    root = defaultRootDoc();
  }

  const raw = Array.isArray(o.content) ? o.content : [];
  const content: SanitizedPuckDocument["content"] = [];
  let index = 0;
  for (const item of raw) {
    if (content.length >= MAX_BLOCKS_PER_DOC) break;
    if (!item || typeof item !== "object") continue;
    const b = item as Record<string, unknown>;
    const type = typeof b.type === "string" ? b.type : "";
    if (!ALLOWED.has(type)) continue;
    const spec = AI_BLOCK_REGISTRY[type];
    const propsIn = b.props && typeof b.props === "object" ? (b.props as Record<string, unknown>) : {};
    const id = typeof b.id === "string" && b.id.length > 0 ? clip(b.id, 120) : newBlockId(index);
    content.push({
      type,
      props: sanitizeBlockProps(spec, propsIn),
      id,
    });
    index += 1;
  }

  return { root, content };
}

export function mergePuckAppend(
  current: SanitizedPuckDocument | null,
  newBlocks: SanitizedPuckDocument
): SanitizedPuckDocument {
  const base = current ?? { root: defaultRootDoc(), content: [] };
  return {
    root: base.root,
    content: [...base.content, ...newBlocks.content].slice(0, MAX_BLOCKS_PER_DOC),
  };
}
