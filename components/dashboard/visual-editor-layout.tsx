"use client";

import * as React from "react";
import AuthWrapper from "@/components/AuthWrapper";
import { Toaster } from "sonner";

/**
 * Full-viewport shell for visual builders (Puck): no app sidebar or top nav,
 * similar to Elementor / Webflow editor chrome.
 */
export function VisualEditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthWrapper>
      <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-zinc-100 text-foreground dark:bg-zinc-950">
        <Toaster richColors position="top-right" />
        {children}
      </div>
    </AuthWrapper>
  );
}
