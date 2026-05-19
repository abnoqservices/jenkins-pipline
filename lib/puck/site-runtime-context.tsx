"use client";

import * as React from "react";

export type SiteRuntimeValue = {
  orgSlug: string;
  siteSlug: string;
};

const SiteRuntimeContext = React.createContext<SiteRuntimeValue | null>(null);

export function SiteRuntimeProvider({
  orgSlug,
  siteSlug,
  children,
}: {
  orgSlug: string;
  siteSlug: string;
  children: React.ReactNode;
}) {
  const value = React.useMemo(() => ({ orgSlug, siteSlug }), [orgSlug, siteSlug]);
  return <SiteRuntimeContext.Provider value={value}>{children}</SiteRuntimeContext.Provider>;
}

export function useSiteRuntime(): SiteRuntimeValue | null {
  return React.useContext(SiteRuntimeContext);
}
