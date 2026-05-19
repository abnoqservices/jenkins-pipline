"use client";

import * as React from "react";
import type { Config, Overrides } from "@measured/puck";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_LABELS = ["Content", "Style", "Advanced"];

function extractText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(" ");
  if (React.isValidElement(node)) {
    return extractText((node as React.ReactElement<{ children?: React.ReactNode }>).props?.children);
  }
  return "";
}

function looksLikeRootPageSelection(childrenArr: React.ReactNode[]): boolean {
  const text = extractText(childrenArr).toLowerCase();
  return text.includes("page title");
}

/**
 * Wraps Puck’s right-hand field groups (one React child per top-level field).
 * We use exactly three groups: content, style, layout → tabs like Elementor.
 */
export const engagePuckOverrides: Partial<Overrides<Config>> = {
  fields: ({ children }) => {
    const arr = React.Children.toArray(children).filter(
      (c) => c != null && c !== false && c !== true
    );
    const [tab, setTab] = React.useState("0");
    const isRootSelection = looksLikeRootPageSelection(arr);

    if (arr.length <= 1 || isRootSelection) {
      return (
        <div className="flex h-full min-h-[220px] items-center justify-center px-4 text-center text-sm text-muted-foreground">
          Drag a component to the canvas and select it to edit content and style.
        </div>
      );
    }

    const count = Math.min(arr.length, 3);
    const labels = TAB_LABELS.slice(0, count);
    const safeTab = Number(tab) >= count ? "0" : tab;

    return (
      <Tabs
        value={safeTab}
        onValueChange={setTab}
        className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-2 rounded-xl border bg-background/70 px-2 py-2"
      >
        <TabsList
          className={
            count === 2
              ? "grid h-auto w-full shrink-0 grid-cols-2 rounded-lg border bg-muted/40 p-1"
              : "grid h-auto w-full shrink-0 grid-cols-3 gap-0 rounded-lg border bg-muted/40 p-1"
          }
        >
          {labels.map((label, i) => (
            <TabsTrigger
              key={label}
              value={String(i)}
              className="whitespace-normal rounded-md px-1 py-2 text-center text-[11px] font-medium leading-tight"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {arr.slice(0, count).map((child, i) => (
          <TabsContent
            key={i}
            value={String(i)}
            className="mt-2 min-h-0 flex-1 overflow-y-auto space-y-3 rounded-lg border bg-background p-2 data-[state=inactive]:hidden outline-none"
          >
            {child}
          </TabsContent>
        ))}
        {arr.length > count ? (
          <div className="mt-2 space-y-2 border-t px-1 pt-3 text-xs text-muted-foreground">
            {arr.slice(count)}
          </div>
        ) : null}
      </Tabs>
    );
  },
};
