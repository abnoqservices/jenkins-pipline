/** Page-level colors (nested under root.props.style). */
export const DEFAULT_ROOT_STYLE = {
  pageBackground: "#ffffff",
  pageText: "#1f2937",
  headingColor: "#0b1220",
  mutedText: "#475569",
  accentColor: "#6366f1",
  buttonTextColor: "#ffffff",
} as const;

export const PUCK_ROOT_STYLE_KEYS = Object.keys(DEFAULT_ROOT_STYLE);

/** @deprecated flat shape — use migratePuckDocument */
export const DEFAULT_PUCK_ROOT_THEME: Record<string, string> = {
  title: "Landing page",
  ...DEFAULT_ROOT_STYLE,
};

export const PUCK_ROOT_THEME_KEYS = Object.keys(DEFAULT_PUCK_ROOT_THEME);
