"use client";

import * as React from "react";

export type PuckBindingFieldOption = { label: string; token: string };

type Ctx = {
  sectionFields: PuckBindingFieldOption[];
};

const PuckBindingContext = React.createContext<Ctx>({ sectionFields: [] });

export function PuckBindingProvider({
  sectionFields,
  children,
}: {
  sectionFields: PuckBindingFieldOption[];
  children: React.ReactNode;
}) {
  const value = React.useMemo(() => ({ sectionFields }), [sectionFields]);
  return <PuckBindingContext.Provider value={value}>{children}</PuckBindingContext.Provider>;
}

export function usePuckBindingOptions() {
  return React.useContext(PuckBindingContext);
}

export function flattenSectionSchemaFields(
  sections: Array<{
    key: string;
    schema?: { fields?: Array<{ key: string; label?: string }> };
  }>
): PuckBindingFieldOption[] {
  const out: PuckBindingFieldOption[] = [];
  for (const s of sections) {
    const fields = s.schema?.fields;
    if (!Array.isArray(fields)) continue;
    for (const f of fields) {
      if (!f?.key) continue;
      out.push({
        label: `${s.key} → ${f.label || f.key}`,
        token: `{{${s.key}.${f.key}}}`,
      });
    }
  }
  return out;
}
