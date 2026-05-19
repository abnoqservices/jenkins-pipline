"use client";

import * as React from "react";
import type { PublicCmsPostPayload } from "@/components/landing/DepartmentSiteCmsPost";

const BlogPostRenderContext = React.createContext<PublicCmsPostPayload | null>(null);

export function BlogPostRenderProvider({
  value,
  children,
}: {
  value: PublicCmsPostPayload | null;
  children: React.ReactNode;
}) {
  return <BlogPostRenderContext.Provider value={value}>{children}</BlogPostRenderContext.Provider>;
}

export function useBlogPostRenderPayload(): PublicCmsPostPayload | null {
  return React.useContext(BlogPostRenderContext);
}
