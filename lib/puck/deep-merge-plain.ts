/** Plain JSON-style deep merge: nested objects merge; arrays and scalars from `patch` replace. */
export function deepMergePlain(base: unknown, patch: unknown): unknown {
  if (patch === undefined) return base;
  if (patch === null) return patch;
  if (typeof patch !== "object" || Array.isArray(patch)) return patch;
  if (typeof base !== "object" || base === null || Array.isArray(base)) {
    return patch;
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const k of Object.keys(patch as object)) {
    const pv = (patch as Record<string, unknown>)[k];
    const bv = out[k];
    if (
      pv &&
      typeof pv === "object" &&
      !Array.isArray(pv) &&
      bv &&
      typeof bv === "object" &&
      !Array.isArray(bv)
    ) {
      out[k] = deepMergePlain(bv, pv);
    } else {
      out[k] = pv;
    }
  }
  return out;
}
