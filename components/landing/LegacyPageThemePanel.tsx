"use client";

import { useDebouncedCallback } from "use-debounce";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";

const THEME_FIELDS = [
  { key: "background_color", label: "Page background" },
  { key: "primary_text_color", label: "Primary text" },
  { key: "secondary_text_color", label: "Secondary text" },
  { key: "accent_color", label: "Accent" },
  { key: "link_color", label: "Links" },
  { key: "button_background_color", label: "Button background" },
  { key: "button_text_color", label: "Button text" },
] as const;

export type LegacyThemeSection = {
  sectionId: number;
  content: Record<string, unknown>;
};

type LegacyPageThemePanelProps = {
  productId: number;
  customizeSection: LegacyThemeSection | null;
  onContentChange: (content: Record<string, unknown>) => void;
  onAddCustomizeSection: () => Promise<void>;
};

function isHex6(s: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(s);
}

export function LegacyPageThemePanel({
  productId,
  customizeSection,
  onContentChange,
  onAddCustomizeSection,
}: LegacyPageThemePanelProps) {
  const debouncedSave = useDebouncedCallback(async (content: Record<string, unknown>) => {
    if (!customizeSection) return;
    try {
      await axiosClient.put(
        `/products/${productId}/landing-page/sections/${customizeSection.sectionId}`,
        { content }
      );
    } catch {
      showToast("Failed to save theme colors", "error");
    }
  }, 500);

  const updateField = (key: string, value: string) => {
    if (!customizeSection) return;
    const next = { ...customizeSection.content, [key]: value };
    onContentChange(next);
    debouncedSave(next);
  };

  if (!customizeSection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Page colors (legacy)</CardTitle>
          <CardDescription>
            Add the <strong>customize webpage</strong> global section to control background, text, links,
            and buttons for the traditional landing preview.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="secondary" size="sm" onClick={() => void onAddCustomizeSection()}>
            Add customize webpage section
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Page colors</CardTitle>
        <CardDescription>
          Customize webpage section — saved automatically as you edit.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {THEME_FIELDS.map(({ key, label }) => {
          const raw = customizeSection.content[key];
          const strVal = typeof raw === "string" ? raw : "";
          const pickerSafe = isHex6(strVal) ? strVal : "#888888";
          return (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  aria-label={label}
                  className="h-9 w-12 shrink-0 cursor-pointer rounded border border-input bg-transparent"
                  value={pickerSafe}
                  onChange={(e) => updateField(key, e.target.value)}
                />
                <input
                  className="flex h-9 min-w-0 flex-1 rounded-md border border-input bg-transparent px-2 text-xs font-mono"
                  value={strVal}
                  placeholder="#RRGGBB"
                  onChange={(e) => updateField(key, e.target.value)}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
