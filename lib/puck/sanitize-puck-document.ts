import { engagePuckConfig } from "@/lib/puck/engage-puck-config";

const VALID_TYPES = new Set(Object.keys(engagePuckConfig.components));

/**
 * Puck’s root canvas rows live in `data.content`. A stale `zones["root:default-zone"]` (from older saves or
 * tooling) makes `walkAppState` process that zone again and overwrite root indexes — often showing many
 * duplicate blocks (e.g. repeated footers) in the editor outline.
 *
 * Nested component zones use other keys (`{blockId}:{slot}`); those are preserved.
 */
export const PUCK_ROOT_DROP_ZONE_KEY = "root:default-zone";

export function stripConflictingPuckRootZone<T extends Record<string, unknown>>(doc: T): T {
  const content = doc.content;
  if (!Array.isArray(content) || content.length === 0) return doc;
  if (!doc.zones || typeof doc.zones !== "object") return doc;
  const zones = { ...(doc.zones as Record<string, unknown>) };
  if (!(PUCK_ROOT_DROP_ZONE_KEY in zones)) return doc;
  const next = { ...doc } as T & { zones?: Record<string, unknown> };
  delete zones[PUCK_ROOT_DROP_ZONE_KEY];
  if (Object.keys(zones).length === 0) {
    delete next.zones;
  } else {
    next.zones = zones;
  }
  return next as T;
}

function newBlockId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `puck-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function sanitizeItem(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const type = typeof b.type === "string" ? b.type : "";
  if (!type || !VALID_TYPES.has(type)) return null;
  const props =
    b.props && typeof b.props === "object" ? { ...(b.props as Record<string, unknown>) } : {};
  if (typeof props.id !== "string" || !props.id.trim()) {
    props.id = newBlockId();
  }
  return { type, props };
}

/**
 * Drops unknown component types and ensures every block has a stable `props.id`
 * so Puck indexes stay consistent (avoids broken drag/preview state).
 */
export function sanitizePuckDataForEngageConfig(data: Record<string, unknown>): Record<string, unknown> {
  const stripped = stripConflictingPuckRootZone({ ...data });
  const content = Array.isArray(stripped.content)
    ? (stripped.content.map(sanitizeItem).filter(Boolean) as Record<string, unknown>[])
    : [];

  const next: Record<string, unknown> = { ...stripped, content };

  if (stripped.zones && typeof stripped.zones === "object") {
    const zonesIn = stripped.zones as Record<string, unknown>;
    const zonesOut: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(zonesIn)) {
      if (Array.isArray(val)) {
        zonesOut[key] = val.map(sanitizeItem).filter(Boolean);
      } else {
        zonesOut[key] = val;
      }
    }
    next.zones = zonesOut;
  }

  return next;
}
