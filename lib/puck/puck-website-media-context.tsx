"use client";

import * as React from "react";

export type PuckWebsiteMediaConfig = {
  /** GET — returns { success, data: { items: { key, url, name }[] } } */
  listUrl: string;
  /** POST multipart field "file" — returns { success, data: { key, url } } */
  uploadUrl: string;
};

const PuckWebsiteMediaContext = React.createContext<PuckWebsiteMediaConfig | null>(null);

export function PuckWebsiteMediaProvider({
  listUrl,
  uploadUrl,
  children,
}: PuckWebsiteMediaConfig & { children: React.ReactNode }) {
  const value = React.useMemo(() => ({ listUrl, uploadUrl }), [listUrl, uploadUrl]);
  return (
    <PuckWebsiteMediaContext.Provider value={value}>{children}</PuckWebsiteMediaContext.Provider>
  );
}

export function usePuckWebsiteMedia(): PuckWebsiteMediaConfig | null {
  return React.useContext(PuckWebsiteMediaContext);
}
