export type PuckTemplateScope = "global" | "category" | "tag";

export type PuckTemplateScopeMeta = {
  scope_type: string;
  category_id: number | null;
  tag: string | null;
  summary: string;
};

export type PuckTemplateRow = {
  id: number;
  department_id: number | null;
  scope_key: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  scope_meta?: PuckTemplateScopeMeta;
  /** From library table when assignment uses puck_template_id */
  library_template?: { id: number; name: string } | null;
};

export type PuckTemplateCategory = { id: number; name: string };

export function scopeSummaryPreview(
  scopeType: PuckTemplateScope,
  categoryId: string,
  tag: string,
  categories: PuckTemplateCategory[]
): string {
  if (scopeType === "global") {
    return "All products in this department when no tag-specific or category template matches (lowest priority).";
  }
  if (scopeType === "category") {
    if (!categoryId) return "Choose a category below before saving.";
    const name = categories.find((c) => c.id === Number(categoryId))?.name;
    return name
      ? `Only products in category “${name}” (this department).`
      : `Only products in category #${categoryId} (this department).`;
  }
  if (!tag.trim()) return "Enter a tag below before saving.";
  return `Products that have tag “${tag.trim()}” (case-insensitive; wins over category and global).`;
}

export function scopeBadgeLabel(t: PuckTemplateRow, categories: PuckTemplateCategory[]): string {
  const m = t.scope_meta;
  if (!m) return t.scope_key;
  if (m.scope_type === "global") return "Global · this department";
  if (m.scope_type === "category" && m.category_id != null) {
    const name = categories.find((c) => c.id === m.category_id)?.name;
    return name ? `Category · ${name}` : `Category · #${m.category_id}`;
  }
  if (m.scope_type === "tag" && m.tag) return `Tag · ${m.tag}`;
  return m.summary || t.scope_key;
}
