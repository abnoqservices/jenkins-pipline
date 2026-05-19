"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import "@measured/puck/puck.css";
import type { PublicCmsPostPayload } from "@/components/landing/DepartmentSiteCmsPost";
import { BlogPostRenderProvider } from "@/lib/puck/blog-post-render-context";
import { engagePuckConfig, defaultEngagePuckData } from "@/lib/puck/engage-puck-config";
import { migratePuckDocument } from "@/lib/puck/migrate-puck-document";
import { sanitizePuckDataForEngageConfig } from "@/lib/puck/sanitize-puck-document";
import { Loader2 } from "lucide-react";

const Render = dynamic(() => import("@measured/puck").then((m) => m.Render), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[200px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

export function PuckPublicRender({
  document,
  activeBlogPost = null,
}: {
  document: Record<string, unknown>;
  /** When set (single WordPress post view), `CmsBlogPostSlotBlock` renders this article. */
  activeBlogPost?: PublicCmsPostPayload | null;
}) {
  const data = React.useMemo(() => {
    const base = defaultEngagePuckData() as Record<string, unknown>;
    if (!document || typeof document !== "object") return base;
    const merged = {
      ...base,
      ...document,
      content: Array.isArray(document.content) ? document.content : base.content,
    };
    return sanitizePuckDataForEngageConfig(migratePuckDocument(merged) as Record<string, unknown>);
  }, [document]);

  return (
    <BlogPostRenderProvider value={activeBlogPost}>
      <div className="min-h-screen bg-white text-gray-900">
        <Render config={engagePuckConfig} data={data} />
      </div>
    </BlogPostRenderProvider>
  );
}
