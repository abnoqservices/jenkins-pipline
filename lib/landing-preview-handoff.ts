/**
 * Hands off a built Puck document from an in-app editor to a freshly opened
 * preview tab via localStorage. The new tab reads the document by key, then
 * removes the entry. Stale entries are cleaned up on every write.
 *
 * We use localStorage (not sessionStorage) because sessionStorage is per-tab.
 * Documents can be 100KB+ which is too big for URL hash transport.
 */

const STORAGE_PREFIX = "lp-preview:";
const TTL_MS = 1000 * 60 * 60; // 1 hour

export type LandingPreviewPayload = {
  name: string;
  description?: string;
  document: Record<string, unknown>;
  backHref?: string;
  backLabel?: string;
  badge?: string;
};

type StoredEntry = LandingPreviewPayload & { savedAt: number };

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function randomKey(): string {
  // 12 chars from a-z0-9 — collision risk negligible at this scale
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-6);
}

function pruneStale(): void {
  if (!isBrowser()) return;
  const now = Date.now();
  try {
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const k = window.localStorage.key(i);
      if (!k || !k.startsWith(STORAGE_PREFIX)) continue;
      const raw = window.localStorage.getItem(k);
      if (!raw) {
        window.localStorage.removeItem(k);
        continue;
      }
      try {
        const parsed = JSON.parse(raw) as StoredEntry;
        if (!parsed?.savedAt || now - parsed.savedAt > TTL_MS) {
          window.localStorage.removeItem(k);
        }
      } catch {
        window.localStorage.removeItem(k);
      }
    }
  } catch {
    /* localStorage may be disabled — ignore */
  }
}

/**
 * Stores the payload, opens `/landing-pages/preview?key=<id>` in a new tab.
 * Returns the key written, or null if the browser blocked the popup.
 */
export function openLandingPreviewInNewTab(payload: LandingPreviewPayload): string | null {
  if (!isBrowser()) return null;
  pruneStale();
  const key = randomKey();
  const entry: StoredEntry = { ...payload, savedAt: Date.now() };
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
  } catch {
    return null;
  }
  const url = `/landing-pages/preview?key=${encodeURIComponent(key)}`;
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    // Popup blocked — fall back to same-tab navigation, the user explicitly clicked
    window.location.assign(url);
  }
  return key;
}

/**
 * Reads + clears a payload by key. Used by the preview page on mount.
 * Returns null if the key is missing, malformed, or expired.
 */
export function consumeLandingPreviewPayload(key: string): LandingPreviewPayload | null {
  if (!isBrowser() || !key) return null;
  const fullKey = STORAGE_PREFIX + key;
  const raw = window.localStorage.getItem(fullKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredEntry;
    window.localStorage.removeItem(fullKey);
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > TTL_MS) return null;
    if (!parsed.document || typeof parsed.document !== "object") return null;
    return {
      name: parsed.name,
      description: parsed.description,
      document: parsed.document,
      backHref: parsed.backHref,
      backLabel: parsed.backLabel,
      badge: parsed.badge,
    };
  } catch {
    window.localStorage.removeItem(fullKey);
    return null;
  }
}
