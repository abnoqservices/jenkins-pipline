"use client";

import * as React from "react";
import type { Config } from "@measured/puck";
import {
  DEFAULT_LAYOUT_PROPS,
  layoutObjectFields,
  layoutToStyle,
} from "@/lib/puck/layout-fields";
import { useSiteRuntime } from "@/lib/puck/site-runtime-context";
import { useBlogPostRenderPayload } from "@/lib/puck/blog-post-render-context";
import { DepartmentSiteCmsPost } from "@/components/landing/DepartmentSiteCmsPost";
import {
  ACCENT_FALLBACK,
  ACCENT_FALLBACK_2,
  EyebrowChip,
  SafeImage,
  containerMaxWidthPx,
  headingVar,
  mutedVar,
  puckPresetField,
} from "@/lib/puck/puck-design-system";
import { puckBindingTextField } from "@/lib/puck/puck-binding-custom-fields";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Loader2 } from "lucide-react";

type WpPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  link: string;
  date: string | null;
  featured_image: string | null;
};

function stripApiBase(url: string): string {
  return url.replace(/\/$/, "");
}

function sitePostPath(orgSlug: string, siteSlug: string, postSlug: string, pathPrefix?: string): string {
  const pre = (pathPrefix || "").trim().replace(/^\/+|\/+$/g, "");
  const base = `/sites/${encodeURIComponent(orgSlug)}/${encodeURIComponent(siteSlug)}`;
  if (!pre) {
    return `${base}/${encodeURIComponent(postSlug)}`;
  }

  return `${base}/${encodeURIComponent(pre)}/${encodeURIComponent(postSlug)}`;
}

function formatPostDate(date: string | null | undefined): string {
  if (!date) return "";
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

function readingTime(html: string): number {
  if (!html) return 0;
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.round(words / 220));
}

function CmsWpPostsBlockRender(props: {
  content?: {
    eyebrow?: string;
    heading?: string;
    subtitle?: string;
    perPage?: number;
    layout?: string;
    categoryId?: string;
    emptyMessage?: string;
    postLinks?: string;
    postUrlPrefix?: string;
    showReadTime?: string;
    ctaLabel?: string;
    ctaHref?: string;
  };
  layout?: Record<string, string>;
  editMode?: boolean;
}) {
  const ctx = useSiteRuntime();
  const c = props.content || {};
  const perPage = Math.min(24, Math.max(1, Number(c.perPage) || 6));
  const layoutMode = (c.layout || "grid").trim() || "grid";
  const categoryRaw = (c.categoryId || "").trim();
  const categoryId = categoryRaw !== "" && /^\d+$/.test(categoryRaw) ? categoryRaw : undefined;
  const linkOnSite = (c.postLinks || "same_site").trim() !== "wordpress";
  const postUrlPrefix = (c.postUrlPrefix || "").trim();
  const showReadTime = (c.showReadTime || "yes").trim() === "yes";
  const l = (props.layout || {}) as Record<string, string>;
  const editMode = Boolean(props.editMode);

  const [posts, setPosts] = React.useState<WpPost[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!ctx) {
      setPosts(null);
      setError(null);
      return;
    }
    const base = typeof window !== "undefined" ? stripApiBase(process.env.NEXT_PUBLIC_API_URL || "") : "";
    if (!base) {
      setError("Missing NEXT_PUBLIC_API_URL");
      setPosts([]);
      return;
    }
    let cancelled = false;
    setPosts(null);
    setError(null);
    const q = new URLSearchParams({ per_page: String(perPage) });
    if (categoryId) q.set("categories", categoryId);
    const url = `${base}/public/organizations/${encodeURIComponent(ctx.orgSlug)}/sites/${encodeURIComponent(ctx.siteSlug)}/cms/posts?${q}`;

    void fetch(url, { method: "GET", credentials: "omit" })
      .then(async (res) => {
        const json = (await res.json()) as { success?: boolean; data?: { posts?: WpPost[] }; message?: string };
        if (cancelled) return;
        if (!res.ok || !json.success) {
          setError(json.message || "Could not load posts");
          setPosts([]);
          return;
        }
        setPosts(Array.isArray(json.data?.posts) ? json.data!.posts! : []);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Network error");
          setPosts([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [ctx, perPage, categoryId]);

  const headerEl = (c.heading?.trim() || c.eyebrow?.trim() || c.subtitle?.trim()) ? (
    <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
      <div className="max-w-2xl space-y-3">
        {c.eyebrow ? <EyebrowChip>{c.eyebrow}</EyebrowChip> : null}
        {c.heading ? (
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.5rem]" style={{ color: headingVar() }}>
            {c.heading}
          </h2>
        ) : null}
        {c.subtitle ? (
          <p className="text-base leading-relaxed md:text-lg" style={{ color: mutedVar() }}>{c.subtitle}</p>
        ) : null}
      </div>
      {c.ctaLabel?.trim() ? (
        <a
          href={c.ctaHref || "#"}
          className="group inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {c.ctaLabel}
          <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
        </a>
      ) : null}
    </div>
  ) : null;

  if (!ctx) {
    return (
      <section style={layoutToStyle(l)} className="px-4 py-12">
        <div
          className={cn(
            "mx-auto max-w-3xl rounded-3xl border border-dashed border-muted-foreground/30 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground",
            editMode && "pointer-events-none select-none"
          )}
        >
          {headerEl}
          <p className="mt-4">
            WordPress posts load on a <strong>published department site</strong> with a CMS connection. On the live site,
            single posts open at <code className="rounded bg-muted px-1">/sites/…/your-post-slug</code> or{" "}
            <code className="rounded bg-muted px-1">/sites/…/blog/your-post-slug</code> if you set a URL prefix on this
            block.
          </p>
        </div>
      </section>
    );
  }

  if (posts === null) {
    return (
      <section
        style={layoutToStyle(l)}
        className={cn(
          "flex min-h-[160px] items-center justify-center gap-3 px-4 py-12 text-muted-foreground",
          editMode && "pointer-events-none select-none"
        )}
      >
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm font-medium">Loading posts…</span>
      </section>
    );
  }

  if (error || posts.length === 0) {
    return (
      <section
        style={layoutToStyle(l)}
        className={cn("px-4 py-12", editMode && "pointer-events-none select-none")}
      >
        <div className="mx-auto max-w-4xl">
          {headerEl}
          <p className="text-sm text-muted-foreground">{error || c.emptyMessage || "No posts to show yet."}</p>
        </div>
      </section>
    );
  }

  const featured = layoutMode === "featured";
  const [first, ...rest] = posts;

  const cardLink = (p: WpPost) => {
    const hrefOnSite =
      linkOnSite && ctx && p.slug?.trim()
        ? sitePostPath(ctx.orgSlug, ctx.siteSlug, p.slug.trim(), postUrlPrefix)
        : null;
    const href = hrefOnSite || p.link || "#";
    const external = Boolean(p.link && !hrefOnSite);
    return { href, external };
  };

  const card = (p: WpPost, opts?: { large?: boolean }) => {
    const { href, external } = cardLink(p);
    const link = (children: React.ReactNode, className?: string) => (
      <a
        href={href}
        className={className}
        {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
      >
        {children}
      </a>
    );
    return (
      <article
        key={p.id}
        className={cn(
          "group flex flex-col overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl",
          opts?.large && "md:flex-row"
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden",
            opts?.large ? "shrink-0 md:w-[55%]" : "aspect-[16/10]"
          )}
          style={{
            background: `linear-gradient(135deg, ${ACCENT_FALLBACK}1f, ${ACCENT_FALLBACK_2}1f)`,
          }}
        >
          {link(
            <SafeImage
              src={p.featured_image ?? ""}
              alt={p.title || "Post image"}
              role="photo"
              className={cn(
                "h-full w-full object-cover transition duration-500 group-hover:scale-105",
                opts?.large && "min-h-[280px]"
              )}
              fallbackClassName={cn("h-full w-full", opts?.large && "min-h-[280px]")}
              showCaption={false}
            />,
            "absolute inset-0"
          )}
        </div>
        <div className="flex flex-1 flex-col gap-3 p-6 md:p-7">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {p.date ? (
              <time className="font-semibold uppercase tracking-[0.14em] text-slate-500">
                {formatPostDate(p.date)}
              </time>
            ) : null}
            {showReadTime && p.excerpt ? (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700">
                {readingTime(p.excerpt)} min read
              </span>
            ) : null}
          </div>
          <h3
            className={cn(
              "text-balance font-semibold leading-snug transition group-hover:text-indigo-700",
              opts?.large ? "text-2xl md:text-[1.65rem]" : "text-lg"
            )}
            style={{ color: headingVar() }}
          >
            {link(p.title || "Untitled", "")}
          </h3>
          {p.excerpt ? (
            <p
              className={cn("line-clamp-3 text-sm leading-relaxed md:text-base", opts?.large && "max-w-prose")}
              style={{ color: mutedVar() }}
              dangerouslySetInnerHTML={{ __html: p.excerpt }}
            />
          ) : null}
          <div className="mt-auto pt-2">
            {link(
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 transition group-hover:gap-2">
                Read article
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </span>,
              ""
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <section style={layoutToStyle(l)} className="px-4 py-16 md:py-20">
      <div className={cn("mx-auto", editMode && "pointer-events-none select-none")} style={{ maxWidth: containerMaxWidthPx("wide") }}>
        {headerEl}

        {featured && first ? (
          <div className="space-y-8">
            {card(first, { large: true })}
            {rest.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rest.map((p) => card(p))}</div>
            ) : null}
          </div>
        ) : layoutMode === "list" ? (
          <div className="mx-auto max-w-3xl space-y-4">{posts.map((p) => card(p))}</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{posts.map((p) => card(p))}</div>
        )}
      </div>
    </section>
  );
}

function CmsBlogPostSlotBlockRender({ layout }: { layout?: Record<string, string> }) {
  const post = useBlogPostRenderPayload();
  const l = (layout || {}) as Record<string, string>;

  if (!post) {
    return (
      <section
        style={layoutToStyle(l)}
        className="border border-dashed border-muted-foreground/40 bg-muted/20 px-4 py-16 text-center text-sm text-muted-foreground"
      >
        <p className="font-semibold text-foreground">Blog post content</p>
        <p className="mx-auto mt-2 max-w-lg">
          The WordPress article appears here on live URLs such as{" "}
          <code className="rounded bg-muted px-1 text-xs">/sites/…/your-post-slug</code>. Put your nav and footer on this
          same page above and below this block.
        </p>
      </section>
    );
  }

  return (
    <div style={layoutToStyle(l)}>
      <DepartmentSiteCmsPost post={post} variant="embed" />
    </div>
  );
}

export const cmsBlockConfigs: Config["components"] = {
  CmsWpPostsBlock: {
    label: "Blog (WordPress posts)",
    fields: {
      content: {
        type: "object",
        label: "Content",
        objectFields: {
          eyebrow: puckBindingTextField("Eyebrow"),
          heading: puckBindingTextField("Section heading"),
          subtitle: puckBindingTextField("Subtitle / lead"),
          perPage: { type: "number", label: "Posts to show (max 24)" },
          layout: puckPresetField("Layout", [
            { value: "grid", label: "Grid", hint: "3-column" },
            { value: "list", label: "List", hint: "Stacked" },
            { value: "featured", label: "Featured + grid", hint: "Hero post" },
          ]),
          categoryId: { type: "text", label: "WP category ID (optional)" },
          showReadTime: {
            type: "radio",
            label: "Show read time",
            options: [
              { label: "Yes", value: "yes" },
              { label: "No", value: "no" },
            ],
          },
          emptyMessage: { type: "textarea", label: "Empty state message" },
          postLinks: puckPresetField("Post links open", [
            { value: "same_site", label: "On this site", hint: "/sites/…/post-slug" },
            { value: "wordpress", label: "WordPress", hint: "Original URL" },
          ]),
          postUrlPrefix: {
            type: "text",
            label: 'URL prefix (optional, e.g. "blog" → /sites/…/blog/post-slug)',
          },
          ctaLabel: puckBindingTextField("Header CTA label (optional)"),
          ctaHref: puckBindingTextField("Header CTA URL"),
        },
      },
      layout: {
        type: "object",
        label: "Advanced",
        objectFields: layoutObjectFields,
      },
    },
    defaultProps: {
      content: {
        eyebrow: "Latest from the team",
        heading: "Stories, ideas, and product updates",
        subtitle: "Field reports from operators putting Lumen to work — every week.",
        perPage: 6,
        layout: "featured",
        categoryId: "",
        showReadTime: "yes",
        emptyMessage: "No posts yet — check back soon.",
        postLinks: "same_site",
        postUrlPrefix: "",
        ctaLabel: "View all posts",
        ctaHref: "#",
      },
      layout: { ...DEFAULT_LAYOUT_PROPS },
    },
    render: (p) => (
      <CmsWpPostsBlockRender
        content={p.content as never}
        layout={p.layout as never}
        editMode={Boolean((p as { editMode?: boolean }).editMode)}
      />
    ),
  },

  CmsBlogPostSlotBlock: {
    label: "Blog post content (slot)",
    fields: {
      content: {
        type: "object",
        label: "Content",
        objectFields: {},
      },
      layout: {
        type: "object",
        label: "Advanced",
        objectFields: layoutObjectFields,
      },
    },
    defaultProps: {
      content: {},
      layout: { ...DEFAULT_LAYOUT_PROPS },
    },
    render: (p) => <CmsBlogPostSlotBlockRender layout={p.layout as never} />,
  },
};
