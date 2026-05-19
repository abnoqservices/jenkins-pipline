import { notFound } from "next/navigation";
import {
  DepartmentSiteCmsPost,
  type PublicCmsPostPayload,
} from "@/components/landing/DepartmentSiteCmsPost";
import { PuckPublicRender } from "@/components/landing/PuckPublicRender";
import { SiteRuntimeProvider } from "@/lib/puck/site-runtime-context";

type PageProps = {
  params: Promise<{ orgSlug: string; siteSlug: string; path?: string[] }>;
};

type PublicSitePayload = {
  success?: boolean;
  data?: {
    kind?: string;
    page?: { puck_document?: Record<string, unknown>; title?: string | null; path?: string };
    post?: PublicCmsPostPayload;
    /** When set, WordPress single posts render inside this Puck page (nav/footer slot). */
    shell_puck_document?: Record<string, unknown> | null;
  };
};

export default async function DepartmentSitePublicPage({ params }: PageProps) {
  const { orgSlug, siteSlug, path } = await params;
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) {
    notFound();
  }

  const suffix =
    path?.length && path.length > 0 ? `/${path.map((s) => encodeURIComponent(s)).join("/")}` : "";

  const url = `${base}/public/organizations/${encodeURIComponent(orgSlug)}/sites/${encodeURIComponent(siteSlug)}${suffix}`;

  const res = await fetch(url, { next: { revalidate: 30 } });
  if (!res.ok) {
    notFound();
  }

  const json = (await res.json()) as PublicSitePayload;

  if (!json.success || !json.data) {
    notFound();
  }

  const d = json.data;
  const puckDoc = d.page?.puck_document;

  if (puckDoc && typeof puckDoc === "object") {
    return (
      <SiteRuntimeProvider orgSlug={orgSlug} siteSlug={siteSlug}>
        <PuckPublicRender document={puckDoc} />
      </SiteRuntimeProvider>
    );
  }

  if (d.kind === "cms_post" && d.post && typeof d.post === "object") {
    const raw = d.post as Record<string, unknown>;
    const post: PublicCmsPostPayload = {
      id: typeof raw.id === "number" ? raw.id : Number(raw.id) || 0,
      slug: typeof raw.slug === "string" ? raw.slug : "",
      title: typeof raw.title === "string" ? raw.title : "",
      excerpt: typeof raw.excerpt === "string" ? raw.excerpt : "",
      date: typeof raw.date === "string" ? raw.date : null,
      link: typeof raw.link === "string" ? raw.link : "",
      featured_image: typeof raw.featured_image === "string" ? raw.featured_image : null,
      content_html: typeof raw.content_html === "string" ? raw.content_html : "",
    };
    if (!post.slug) {
      notFound();
    }
    const shell = d.shell_puck_document;
    if (shell && typeof shell === "object" && !Array.isArray(shell)) {
      return (
        <SiteRuntimeProvider orgSlug={orgSlug} siteSlug={siteSlug}>
          <PuckPublicRender document={shell} activeBlogPost={post} />
        </SiteRuntimeProvider>
      );
    }
    return (
      <SiteRuntimeProvider orgSlug={orgSlug} siteSlug={siteSlug}>
        <DepartmentSiteCmsPost post={post} />
      </SiteRuntimeProvider>
    );
  }

  notFound();
}
