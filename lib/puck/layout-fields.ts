import type { CSSProperties } from "react";

/** Shared “Advanced” spacing fields for blocks + page root. */
export const DEFAULT_LAYOUT_PROPS = {
  marginTop: "0px",
  marginBottom: "0px",
  marginLeft: "0px",
  marginRight: "0px",
  paddingTop: "16px",
  paddingBottom: "16px",
  paddingLeft: "16px",
  paddingRight: "16px",
  maxWidth: "100%",
} as const;

export const layoutObjectFields = {
  marginTop: { type: "text" as const, label: "Margin top" },
  marginBottom: { type: "text" as const, label: "Margin bottom" },
  marginLeft: { type: "text" as const, label: "Margin left" },
  marginRight: { type: "text" as const, label: "Margin right" },
  paddingTop: { type: "text" as const, label: "Padding top" },
  paddingBottom: { type: "text" as const, label: "Padding bottom" },
  paddingLeft: { type: "text" as const, label: "Padding left" },
  paddingRight: { type: "text" as const, label: "Padding right" },
  maxWidth: { type: "text" as const, label: "Max width" },
};

export function layoutToStyle(layout: Record<string, string | undefined> | undefined): CSSProperties {
  if (!layout) return {};
  const pick = (k: keyof typeof DEFAULT_LAYOUT_PROPS) => layout[k] || undefined;
  return {
    marginTop: pick("marginTop"),
    marginBottom: pick("marginBottom"),
    marginLeft: pick("marginLeft"),
    marginRight: pick("marginRight"),
    paddingTop: pick("paddingTop"),
    paddingBottom: pick("paddingBottom"),
    paddingLeft: pick("paddingLeft"),
    paddingRight: pick("paddingRight"),
    maxWidth: pick("maxWidth"),
  };
}
