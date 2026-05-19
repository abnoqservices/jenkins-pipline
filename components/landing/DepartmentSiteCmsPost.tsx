"use client";

import * as React from "react";

export type PublicCmsPostPayload = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string | null;
  link: string;
  featured_image: string | null;
  content_html: string;
};

/**
 * Renders a single WordPress post resolved at /sites/{org}/{site}/{slug} (public API kind cms_post).
 * Use variant="embed" inside a Puck “Blog post content” block (shell layout).
 */
export function DepartmentSiteCmsPost({
  post,
  variant = "page",
}: {
  post: PublicCmsPostPayload;
  variant?: "page" | "embed";
}) {
  const title = post.title?.trim() || "Post";
  const dateLabel = post.date
    ? new Date(post.date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const inner = (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        <header className="mb-8 border-b border-gray-200 pb-8">
          {dateLabel ? (
            <time className="text-sm text-gray-500" dateTime={post.date || undefined}>
              {dateLabel}
            </time>
          ) : null}
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">{title}</h1>
          {post.excerpt ? <p className="mt-4 text-lg text-gray-600">{post.excerpt}</p> : null}
        </header>

        {post.featured_image ? (
          <div className="mb-10 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.featured_image}
              alt=""
              className="max-h-[420px] w-full object-cover"
            />
          </div>
        ) : null}

        {post.content_html ? (
          <div
            className="cms-post-body max-w-none text-gray-800 [&_a]:text-emerald-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-gray-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-4 [&_p]:leading-relaxed [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: post.content_html }}
          />
        ) : post.excerpt ? (
          <p className="text-muted-foreground text-sm">No body content was returned for this post.</p>
        ) : null}
      </div>
  );

  if (variant === "embed") {
    return <article className="bg-white text-gray-900">{inner}</article>;
  }

  return <article className="min-h-screen bg-white text-gray-900">{inner}</article>;
}
