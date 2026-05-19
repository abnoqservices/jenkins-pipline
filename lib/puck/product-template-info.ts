"use client";

export type TemplateInfoFieldType = "text" | "textarea" | "number" | "url";

export type TemplateInfoField = {
  id: string;
  label: string;
  type: TemplateInfoFieldType;
  path: Array<string | number>;
  componentType: string;
  initialValue: string;
};

type PuckDoc = Record<string, unknown>;

function getAtPath(obj: unknown, path: Array<string | number>): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[String(key)];
  }
  return cur;
}

function setAtPath(obj: unknown, path: Array<string | number>, value: unknown): void {
  if (!obj || typeof obj !== "object" || path.length === 0) return;
  let cur: Record<string, unknown> = obj as Record<string, unknown>;
  for (let i = 0; i < path.length - 1; i++) {
    const key = String(path[i]);
    const next = cur[key];
    if (!next || typeof next !== "object") {
      const nextKey = path[i + 1];
      cur[key] = typeof nextKey === "number" ? [] : {};
    }
    cur = cur[key] as Record<string, unknown>;
  }
  cur[String(path[path.length - 1])] = value;
}

const COMPONENT_FIELD_MAP: Record<
  string,
  Array<{ key: string; label: string; type?: TemplateInfoFieldType }>
> = {
  ProductHeaderBlock: [
    { key: "title", label: "Header title" },
    { key: "subtitle", label: "Header subtitle", type: "textarea" },
    { key: "sku", label: "SKU line" },
    { key: "price", label: "Price", type: "number" },
    { key: "compareAtPrice", label: "Compare price", type: "number" },
    { key: "badge", label: "Badge" },
    { key: "stockHint", label: "Stock/shipping hint" },
    { key: "ctaLabel", label: "CTA label" },
    { key: "ctaHref", label: "CTA link", type: "url" },
  ],
  ProductHighlightsBlock: [{ key: "title", label: "Highlights title" }],
  ProductSpecsBlock: [{ key: "title", label: "Specs section title" }],
  ProductTabsContentBlock: [],
  ProductRelatedBlock: [{ key: "title", label: "Related products title" }],
  FormEmbedBlock: [
    { key: "formIdentifier", label: "Form ID or slug" },
    { key: "formId", label: "Form ID or slug (legacy formId)" },
    { key: "form_id", label: "Form ID or slug (legacy form_id)" },
    { key: "formTitle", label: "Form title override" },
  ],
};

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

export function deriveTemplateInfoFields(doc: unknown): TemplateInfoField[] {
  if (!doc || typeof doc !== "object") return [];
  const content = (doc as PuckDoc).content;
  if (!Array.isArray(content)) return [];

  const out: TemplateInfoField[] = [];

  content.forEach((block, blockIndex) => {
    if (!block || typeof block !== "object") return;
    const type = asString((block as PuckDoc).type);
    if (!type.startsWith("Product") && !COMPONENT_FIELD_MAP[type]) return;

    const baseContentPath: Array<string | number> = ["content", blockIndex, "props", "content"];
    const simpleDefs = COMPONENT_FIELD_MAP[type] || [];
    simpleDefs.forEach((def) => {
      const path = [...baseContentPath, def.key];
      out.push({
        id: `${blockIndex}:${type}:${def.key}`,
        label: `${type.replace("Block", "")} - ${def.label}`,
        type: def.type || "text",
        path,
        componentType: type,
        initialValue: asString(getAtPath(doc, path)),
      });
    });

    if (type === "ProductHighlightsBlock") {
      const itemsPath = [...baseContentPath, "items"];
      const items = getAtPath(doc, itemsPath);
      if (Array.isArray(items)) {
        items.forEach((_item, idx) => {
          const titlePath = [...itemsPath, idx, "title"];
          const bodyPath = [...itemsPath, idx, "body"];
          out.push({
            id: `${blockIndex}:${type}:items.${idx}.title`,
            label: `Highlight ${idx + 1} title`,
            type: "text",
            path: titlePath,
            componentType: type,
            initialValue: asString(getAtPath(doc, titlePath)),
          });
          out.push({
            id: `${blockIndex}:${type}:items.${idx}.body`,
            label: `Highlight ${idx + 1} description`,
            type: "textarea",
            path: bodyPath,
            componentType: type,
            initialValue: asString(getAtPath(doc, bodyPath)),
          });
        });
      }
    }

    if (type === "ProductSpecsBlock") {
      const specsPath = [...baseContentPath, "specs"];
      const specs = getAtPath(doc, specsPath);
      if (Array.isArray(specs)) {
        specs.forEach((_item, idx) => {
          const labelPath = [...specsPath, idx, "label"];
          const valuePath = [...specsPath, idx, "value"];
          out.push({
            id: `${blockIndex}:${type}:specs.${idx}.label`,
            label: `Spec ${idx + 1} label`,
            type: "text",
            path: labelPath,
            componentType: type,
            initialValue: asString(getAtPath(doc, labelPath)),
          });
          out.push({
            id: `${blockIndex}:${type}:specs.${idx}.value`,
            label: `Spec ${idx + 1} value`,
            type: "text",
            path: valuePath,
            componentType: type,
            initialValue: asString(getAtPath(doc, valuePath)),
          });
        });
      }
    }

    if (type === "ProductTabsContentBlock") {
      const tabsPath = [...baseContentPath, "tabs"];
      const tabs = getAtPath(doc, tabsPath);
      if (Array.isArray(tabs)) {
        tabs.forEach((_item, idx) => {
          const tabLabelPath = [...tabsPath, idx, "tabLabel"];
          const bodyPath = [...tabsPath, idx, "body"];
          out.push({
            id: `${blockIndex}:${type}:tabs.${idx}.tabLabel`,
            label: `Tab ${idx + 1} label`,
            type: "text",
            path: tabLabelPath,
            componentType: type,
            initialValue: asString(getAtPath(doc, tabLabelPath)),
          });
          out.push({
            id: `${blockIndex}:${type}:tabs.${idx}.body`,
            label: `Tab ${idx + 1} content`,
            type: "textarea",
            path: bodyPath,
            componentType: type,
            initialValue: asString(getAtPath(doc, bodyPath)),
          });
        });
      }
    }

    if (type === "ProductRelatedBlock") {
      const productsPath = [...baseContentPath, "products"];
      const products = getAtPath(doc, productsPath);
      if (Array.isArray(products)) {
        products.forEach((_item, idx) => {
          const namePath = [...productsPath, idx, "name"];
          const pricePath = [...productsPath, idx, "price"];
          out.push({
            id: `${blockIndex}:${type}:products.${idx}.name`,
            label: `Related item ${idx + 1} name`,
            type: "text",
            path: namePath,
            componentType: type,
            initialValue: asString(getAtPath(doc, namePath)),
          });
          out.push({
            id: `${blockIndex}:${type}:products.${idx}.price`,
            label: `Related item ${idx + 1} price`,
            type: "number",
            path: pricePath,
            componentType: type,
            initialValue: asString(getAtPath(doc, pricePath)),
          });
        });
      }
    }
  });

  return out;
}

export function applyTemplateInfoValues(
  doc: unknown,
  fields: TemplateInfoField[],
  values: Record<string, string>
): Record<string, unknown> {
  const cloned = JSON.parse(JSON.stringify(doc || {})) as Record<string, unknown>;
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(values, field.id)) continue;
    setAtPath(cloned, field.path, values[field.id]);
  }
  return cloned;
}

export function setProductHighlightsCount(doc: unknown, desiredCount: number): Record<string, unknown> {
  const cloned = JSON.parse(JSON.stringify(doc || {})) as Record<string, unknown>;
  const safeCount = Math.max(1, Math.min(12, Math.floor(desiredCount || 1)));
  const content = Array.isArray(cloned.content) ? (cloned.content as Array<Record<string, unknown>>) : [];
  const idx = content.findIndex((b) => String(b?.type || "") === "ProductHighlightsBlock");
  if (idx < 0) return cloned;

  const block = content[idx] || {};
  const props = (block.props && typeof block.props === "object" ? block.props : {}) as Record<string, unknown>;
  const blockContent =
    (props.content && typeof props.content === "object" ? props.content : {}) as Record<string, unknown>;
  const items = Array.isArray(blockContent.items) ? (blockContent.items as Array<Record<string, unknown>>) : [];

  const nextItems = [...items];
  while (nextItems.length < safeCount) {
    const n = nextItems.length + 1;
    nextItems.push({
      icon: "✓",
      title: `Highlight ${n}`,
      body: `Describe highlight ${n}.`,
    });
  }
  if (nextItems.length > safeCount) nextItems.splice(safeCount);

  blockContent.items = nextItems;
  props.content = blockContent;
  block.props = props;
  content[idx] = block;
  cloned.content = content;
  return cloned;
}

