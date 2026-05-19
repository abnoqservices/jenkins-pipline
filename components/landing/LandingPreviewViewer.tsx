"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PuckPublicRender } from "@/components/landing/PuckPublicRender";
import { ArrowLeft, Monitor, Smartphone, Tablet, X } from "lucide-react";

type Viewport = "mobile" | "tablet" | "desktop";

const VIEWPORT_WIDTH_PX: Record<Viewport, number | null> = {
  mobile: 390,
  tablet: 820,
  desktop: null,
};

const VIEWPORT_LABEL: Record<Viewport, string> = {
  mobile: "Mobile",
  tablet: "Tablet",
  desktop: "Desktop",
};

export function LandingPreviewViewer({
  name,
  description,
  document,
  backHref = "/landing-pages/templates/library",
  backLabel = "Back to library",
  badge = "Preview",
}: {
  name: string;
  description?: string;
  document: Record<string, unknown>;
  backHref?: string;
  backLabel?: string;
  badge?: string;
}) {
  const [viewport, setViewport] = React.useState<Viewport>("desktop");
  const widthPx = VIEWPORT_WIDTH_PX[viewport];

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {/*
        z-[60] keeps this toolbar above any sticky NavBar inside the rendered
        template (those use z-40, mobile menu z-[60]). Without it the rendered
        nav would slide over our "Preview" badge on scroll.
      */}
      <header className="sticky top-0 z-[60] border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="sm" className="-ml-2 gap-1" asChild>
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{backLabel}</span>
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
                {name}
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  {badge}
                </span>
              </h1>
              {description ? (
                <p className="hidden truncate text-xs text-slate-500 sm:block">{description}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <ToggleGroup
              type="single"
              value={viewport}
              onValueChange={(v) => {
                if (v === "mobile" || v === "tablet" || v === "desktop") setViewport(v);
              }}
              size="sm"
              variant="outline"
              className="bg-white"
            >
              <ToggleGroupItem value="mobile" aria-label={VIEWPORT_LABEL.mobile} className="gap-1.5">
                <Smartphone className="h-4 w-4" />
                <span className="hidden md:inline">Mobile</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="tablet" aria-label={VIEWPORT_LABEL.tablet} className="gap-1.5">
                <Tablet className="h-4 w-4" />
                <span className="hidden md:inline">Tablet</span>
              </ToggleGroupItem>
              <ToggleGroupItem value="desktop" aria-label={VIEWPORT_LABEL.desktop} className="gap-1.5">
                <Monitor className="h-4 w-4" />
                <span className="hidden md:inline">Desktop</span>
              </ToggleGroupItem>
            </ToggleGroup>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => window.close()}
              aria-label="Close preview tab"
              className="hidden sm:inline-flex"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 justify-center px-3 py-6 sm:px-6">
        <div
          className="origin-top overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_80px_-32px_rgba(15,23,42,0.25)] transition-[max-width] duration-300 ease-out"
          style={{
            width: "100%",
            maxWidth: widthPx ? `${widthPx}px` : "1440px",
          }}
        >
          <PuckPublicRender document={document} />
        </div>
      </div>
    </div>
  );
}
