import { DEFAULT_ROOT_STYLE, PUCK_ROOT_STYLE_KEYS } from "@/lib/puck/root-theme-defaults";
import { DEFAULT_LAYOUT_PROPS } from "@/lib/puck/layout-fields";

type LooseProps = Record<string, unknown>;

function isNewShape(props: LooseProps): boolean {
  return (
    props.content != null &&
    typeof props.content === "object" &&
    props.style != null &&
    typeof props.style === "object" &&
    props.layout != null &&
    typeof props.layout === "object"
  );
}

function defaultLayout(): Record<string, string> {
  return { ...DEFAULT_LAYOUT_PROPS };
}

function migrateRootProps(flat: LooseProps): { content: LooseProps; style: Record<string, string>; layout: Record<string, string> } {
  const style: Record<string, string> = { ...DEFAULT_ROOT_STYLE };
  for (const k of PUCK_ROOT_STYLE_KEYS) {
    const v = flat[k];
    if (typeof v === "string" && v.length > 0) {
      style[k] = v;
    }
  }
  return {
    content: {
      title: typeof flat.title === "string" ? flat.title : "Landing page",
    },
    style,
    layout: defaultLayout(),
  };
}

function migrateHero(flat: LooseProps) {
  return {
    content: {
      title: typeof flat.title === "string" ? flat.title : "Product title",
      subtitle: typeof flat.subtitle === "string" ? flat.subtitle : "",
    },
    style: {
      sectionBackgroundColor: typeof flat.sectionBackgroundColor === "string" ? flat.sectionBackgroundColor : "",
      borderColor: typeof flat.borderColor === "string" ? flat.borderColor : "",
    },
    layout: defaultLayout(),
  };
}

function migrateText(flat: LooseProps) {
  return {
    content: {
      text: typeof flat.text === "string" ? flat.text : "Body copy goes here.",
    },
    style: {
      textColor: typeof flat.textColor === "string" ? flat.textColor : "",
      backgroundColor: typeof flat.backgroundColor === "string" ? flat.backgroundColor : "",
    },
    layout: defaultLayout(),
  };
}

function migrateCta(flat: LooseProps) {
  return {
    content: {
      label: typeof flat.label === "string" ? flat.label : "Learn more",
      href: typeof flat.href === "string" ? flat.href : "#",
    },
    style: {
      buttonBackgroundColor: typeof flat.buttonBackgroundColor === "string" ? flat.buttonBackgroundColor : "",
      buttonTextColor: typeof flat.buttonTextColor === "string" ? flat.buttonTextColor : "",
    },
    layout: defaultLayout(),
  };
}

function migrateImage(flat: LooseProps) {
  return {
    content: {
      src: typeof flat.src === "string" ? flat.src : "",
      alt: typeof flat.alt === "string" ? flat.alt : "",
    },
    style: {
      borderRadius: typeof flat.borderRadius === "string" ? flat.borderRadius : "8px",
    },
    layout: defaultLayout(),
  };
}

function migrateFormEmbed(flat: LooseProps) {
  const content =
    flat.content && typeof flat.content === "object"
      ? (flat.content as LooseProps)
      : flat;
  const layout =
    flat.layout && typeof flat.layout === "object"
      ? (flat.layout as Record<string, string>)
      : defaultLayout();

  return {
    content: {
      formIdentifier:
        typeof content.formIdentifier === "string"
          ? content.formIdentifier
          : typeof content.formId === "string"
          ? content.formId
          : typeof content.form_id === "string"
          ? content.form_id
          : "",
      formTitle: typeof content.formTitle === "string" ? content.formTitle : "",
    },
    layout,
  };
}

function migrateBlock(type: string, props: LooseProps): LooseProps {
  switch (type) {
    case "FormEmbedBlock":
      return migrateFormEmbed(props);
    default:
      break;
  }
  if (isNewShape(props)) return props;
  switch (type) {
    case "HeroBlock":
      return migrateHero(props);
    case "TextBlock":
      return migrateText(props);
    case "CtaBlock":
      return migrateCta(props);
    case "ImageBlock":
      return migrateImage(props);
    case "CmsWpPostsBlock":
      return {
        content: {
          heading: typeof (props as { heading?: string }).heading === "string" ? (props as { heading?: string }).heading! : "From the blog",
          perPage: typeof (props as { perPage?: number }).perPage === "number" ? (props as { perPage?: number }).perPage! : 6,
          layout: typeof (props as { layout?: string }).layout === "string" ? (props as { layout?: string }).layout! : "grid",
          categoryId: typeof (props as { categoryId?: string }).categoryId === "string" ? (props as { categoryId?: string }).categoryId! : "",
          emptyMessage: typeof (props as { emptyMessage?: string }).emptyMessage === "string" ? (props as { emptyMessage?: string }).emptyMessage! : "No posts yet.",
        },
        style: {},
        layout: defaultLayout(),
      };
    default:
      return {
        content: {},
        style: {},
        layout: defaultLayout(),
      };
  }
}

/**
 * Normalizes saved Puck JSON: flat root/blocks → Content / Style / Layout shape.
 */
export function migratePuckDocument(doc: Record<string, unknown> | null | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = doc && typeof doc === "object" ? { ...doc } : { content: [], root: { props: {} } };

  const rootIn = out.root && typeof out.root === "object" ? (out.root as { props?: LooseProps }) : { props: {} };
  const rp = rootIn.props && typeof rootIn.props === "object" ? rootIn.props : {};

  if (isNewShape(rp)) {
    out.root = { props: rp };
  } else {
    out.root = { props: migrateRootProps(rp) };
  }

  const rawContent = Array.isArray(out.content) ? out.content : [];
  out.content = rawContent.map((item) => {
    if (!item || typeof item !== "object") return item;
    const b = item as Record<string, unknown>;
    const type = typeof b.type === "string" ? b.type : "";
    const props = b.props && typeof b.props === "object" ? (b.props as LooseProps) : {};
    return { ...b, props: migrateBlock(type, props) };
  });

  return out;
}
