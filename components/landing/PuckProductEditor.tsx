"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { Config, Overrides } from "@measured/puck";
import "@measured/puck/puck.css";
import { engagePuckConfig, defaultEngagePuckData } from "@/lib/puck/engage-puck-config";
import { migratePuckDocument } from "@/lib/puck/migrate-puck-document";
import { sanitizePuckDataForEngageConfig } from "@/lib/puck/sanitize-puck-document";
import { engagePuckOverrides } from "@/lib/puck/puck-inspector-tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import {
  applyPuckPlaceholders,
  buildPuckPlaceholderMap,
  PRODUCT_PLACEHOLDER_KEYS,
  type PuckPlaceholderProduct,
  type SectionContentSource,
} from "@/lib/puck/puck-placeholders";
import { openLandingPreviewInNewTab } from "@/lib/landing-preview-handoff";
import { PuckEditorWithVariantPicker } from "@/components/landing/PuckEditorWithVariantPicker";
import { type Screenshot } from "@/components/landing/ScreenshotUploader";
import { AiAssistantSheetPanel } from "@/components/landing/AiAssistantSheetPanel";
import {
  PuckBindingProvider,
  flattenSectionSchemaFields,
  type PuckBindingFieldOption,
} from "@/lib/puck/puck-binding-context";
import { PuckWebsiteMediaProvider } from "@/lib/puck/puck-website-media-context";
import {
  Loader2,
  Sparkles,
  Eye,
  ExternalLink,
  MoreHorizontal,
  BookOpen,
  Tags,
  Smartphone,
  Tablet,
  Monitor,
} from "lucide-react";

const Puck = dynamic(() => import("@measured/puck").then((m) => m.Puck), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[320px] flex-1 items-center justify-center bg-muted/30">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

const studioPuckOverrides: Partial<Overrides<Config>> = {
  puck: ({ children }) => (
    <div className="puck-studio-host flex min-h-0 flex-1 flex-col">{children}</div>
  ),
};

const mergedStudioOverrides: Partial<Overrides<Config>> = {
  ...engagePuckOverrides,
  ...studioPuckOverrides,
};

export type PuckProductEditorProps = {
  productId: number;
  initialDocument: Record<string, unknown> | null;
  resolvedTemplateDocument: Record<string, unknown>;
  puckPublished: boolean;
  /** Legacy section rows for {{section_key.field}} substitution in preview */
  placeholderSections?: SectionContentSource[];
};

function normalizeDoc(doc: Record<string, unknown> | null | undefined) {
  const base = defaultEngagePuckData() as Record<string, unknown>;
  const merged =
    doc && typeof doc === "object"
      ? {
          ...base,
          ...doc,
          content: Array.isArray(doc.content) ? doc.content : base.content,
        }
      : base;
  const migrated = migratePuckDocument(merged) as Record<string, unknown>;
  return sanitizePuckDataForEngageConfig(migrated) as Record<string, unknown>;
}

export function PuckProductEditor({
  productId,
  initialDocument,
  resolvedTemplateDocument,
  puckPublished: initialPublished,
  placeholderSections = [],
}: PuckProductEditorProps) {
  const [data, setData] = React.useState(() =>
    normalizeDoc(initialDocument ?? resolvedTemplateDocument)
  );
  const [puckPublished, setPuckPublished] = React.useState(initialPublished);
  const [saving, setSaving] = React.useState(false);
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [aiMode, setAiMode] = React.useState<"replace" | "append">("replace");
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiSheetOpen, setAiSheetOpen] = React.useState(false);
  const [aiScreenshot, setAiScreenshot] = React.useState<Screenshot | null>(null);
  const [aiLastModel, setAiLastModel] = React.useState<string | null>(null);
  const [helpSheetOpen, setHelpSheetOpen] = React.useState(false);
  /** Puck keeps internal state; bump key so external data (AI / template) always shows. */
  const [puckMountKey, setPuckMountKey] = React.useState(0);
  const [productContext, setProductContext] = React.useState<PuckPlaceholderProduct | null>(null);
  const [sectionFieldOptions, setSectionFieldOptions] = React.useState<PuckBindingFieldOption[]>([]);
  const [tagsSheetOpen, setTagsSheetOpen] = React.useState(false);
  const [tagQuery, setTagQuery] = React.useState("");
  const [recentTags, setRecentTags] = React.useState<string[]>([]);
  const [openGroups, setOpenGroups] = React.useState<Record<string, boolean>>({
    Product: true,
    "Section fields": true,
  });
  const [productCustomFieldOptions, setProductCustomFieldOptions] = React.useState<
    Array<{ token: string; label: string }>
  >([]);
  const [viewport, setViewport] = React.useState<"mobile" | "tablet" | "desktop">("desktop");
  const [zoom, setZoom] = React.useState("100");
  const [activeStage, setActiveStage] = React.useState<"design" | "settings" | "integrations" | "publish">("design");
  const lastEditableRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    setPuckPublished(initialPublished);
  }, [initialPublished]);

  React.useEffect(() => {
    setData(normalizeDoc(initialDocument ?? resolvedTemplateDocument));
  }, [initialDocument, resolvedTemplateDocument]);

  React.useEffect(() => {
    setPuckMountKey((k) => k + 1);
  }, [productId]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosClient.get(`/products/${productId}`);
        if (cancelled || !res.data?.success || !res.data?.data) return;
        const p = res.data.data;
        setProductContext({
          name: typeof p.name === "string" ? p.name : "",
          description: typeof p.description === "string" ? p.description : "",
          url_slug: typeof p.url_slug === "string" ? p.url_slug : "",
          sku: typeof p.sku === "string" ? p.sku : "",
          price: p.price ?? "",
          video_url: typeof p.video_url === "string" ? p.video_url : "",
          meta_title: typeof p.meta_title === "string" ? p.meta_title : "",
          meta_description: typeof p.meta_description === "string" ? p.meta_description : "",
          qr_code_url: typeof p.qr_code_url === "string" ? p.qr_code_url : "",
          image_url: typeof p.images?.[0]?.url === "string" ? p.images[0].url : "",
          image_1: typeof p.images?.[0]?.url === "string" ? p.images[0].url : "",
          image_2: typeof p.images?.[1]?.url === "string" ? p.images[1].url : "",
          image_3: typeof p.images?.[2]?.url === "string" ? p.images[2].url : "",
          image_4: typeof p.images?.[3]?.url === "string" ? p.images[3].url : "",
          custom_fields: Array.isArray(p.custom_field_values)
            ? p.custom_field_values.reduce(
                (acc: Record<string, string>, row: Record<string, unknown>) => {
                  const customField = row.custom_field as { slug?: string; name?: string } | undefined;
                  const slug = typeof customField?.slug === "string" ? customField.slug : "";
                  if (!slug) return acc;

                  const candidate =
                    row.value_text ??
                    row.value_number ??
                    row.value_boolean ??
                    row.value_date ??
                    row.value_file_url ??
                    row.value_json;
                  if (candidate === null || candidate === undefined) return acc;
                  acc[slug] = typeof candidate === "string" ? candidate : JSON.stringify(candidate);
                  return acc;
                },
                {}
              )
            : {},
        });
        const customOptions = Array.isArray(p.custom_field_values)
          ? p.custom_field_values
              .map((row: Record<string, unknown>) => {
                const customField = row.custom_field as { slug?: string; name?: string } | undefined;
                const slug = typeof customField?.slug === "string" ? customField.slug : "";
                if (!slug) return null;
                return {
                  token: `{{product.custom.${slug}}}`,
                  label: customField?.name || `custom.${slug}`,
                };
              })
              .filter((item): item is { token: string; label: string } => Boolean(item))
          : [];
        setProductCustomFieldOptions(customOptions);
      } catch {
        /* optional context */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const deptId = localStorage.getItem("selectedDepartmentId");
        const res = await axiosClient.get("/landing-page/sections", {
          params: { department_id: deptId },
        });
        if (cancelled || !res.data?.success) return;
        const raw = res.data.data?.sections ?? [];
        const list = Array.isArray(raw) ? raw : [];
        const active = list.filter((s: { is_active?: boolean }) => s.is_active !== false);
        setSectionFieldOptions(
          flattenSectionSchemaFields(
            active.map(
              (s: {
                key?: string;
                schema?: { fields?: Array<{ key: string; label?: string }> };
              }) => ({
                key: String(s.key ?? ""),
                schema: s.schema,
              })
            )
          )
        );
      } catch {
        /* optional binding list */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const onFocusIn = (ev: FocusEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable
      ) {
        lastEditableRef.current = target;
      }
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);

  const runAi = async () => {
    const trimmed = aiPrompt.trim();
    if (!trimmed && !aiScreenshot) {
      showToast("Add a prompt or attach a screenshot", "error");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/puck-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          mode: aiMode,
          currentDocument: data,
          productContext: productContext ?? undefined,
          screenshot: aiScreenshot
            ? { mimeType: aiScreenshot.mimeType, data: aiScreenshot.data }
            : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success || !json.data?.puck_document) {
        showToast(json.error || "AI generation failed", "error");
        return;
      }
      setData(normalizeDoc(json.data.puck_document));
      setPuckMountKey((k) => k + 1);
      const fromVision = Boolean(json.data?.meta?.vision);
      const usedModel = typeof json.data?.meta?.model === "string" ? json.data.meta.model : null;
      if (usedModel) setAiLastModel(usedModel);
      showToast(
        fromVision
          ? aiMode === "append"
            ? "AI added blocks from your screenshot"
            : "AI rebuilt the page from your screenshot — publish when ready"
          : aiMode === "append"
            ? "AI blocks appended"
            : "AI page applied — use Publish to save",
        "success"
      );
      setAiScreenshot(null);
      setAiSheetOpen(false);
    } catch {
      showToast("AI request failed", "error");
    } finally {
      setAiLoading(false);
    }
  };

  const save = async (doc: Record<string, unknown>, published?: boolean) => {
    setSaving(true);
    try {
      await axiosClient.put(`/products/${productId}/landing-page/puck`, {
        puck_document: doc,
        puck_is_published: published ?? puckPublished,
      });
      showToast("Puck page saved", "success");
    } catch {
      showToast("Failed to save Puck page", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleStageClick = async (stage: "design" | "settings" | "integrations" | "publish") => {
    setActiveStage(stage);
    if (stage === "settings") {
      setHelpSheetOpen(true);
      return;
    }
    if (stage === "integrations") {
      setTagsSheetOpen(true);
      return;
    }
    if (stage === "publish") {
      setPuckPublished(true);
      await save(data, true);
    }
  };

  const placeholderPreviewDoc = React.useMemo(() => {
    const map = buildPuckPlaceholderMap(productContext ?? {}, placeholderSections);
    return applyPuckPlaceholders(data, map) as Record<string, unknown>;
  }, [data, productContext, placeholderSections]);

  const openPreviewTab = React.useCallback(() => {
    const productLabel = productContext?.name?.trim() || "product";
    openLandingPreviewInNewTab({
      name: `Preview — ${productLabel}`,
      description: "Live data substitution applied (same as the public product page).",
      document: placeholderPreviewDoc,
      backHref: typeof window !== "undefined" ? window.location.pathname : "/products",
      backLabel: "Back to editor",
      badge: "Preview",
    });
  }, [placeholderPreviewDoc, productContext]);

  const applyResolvedTemplate = async () => {
    try {
      const res = await axiosClient.post(`/products/${productId}/landing-page/apply-puck-template`, {});
      if (res.data.success && res.data.data?.puck_document) {
        setData(normalizeDoc(res.data.data.puck_document));
        setPuckMountKey((k) => k + 1);
        showToast("Applied resolved template (tag → category → global)", "success");
      }
    } catch {
      showToast("Failed to apply template", "error");
    }
  };

  const dynamicGroups = React.useMemo(() => {
    const q = tagQuery.trim().toLowerCase();
    const filter = (token: string, label: string) =>
      q === "" || token.toLowerCase().includes(q) || label.toLowerCase().includes(q);
    const product = PRODUCT_PLACEHOLDER_KEYS.map((k) => ({
      token: `{{${k}}}`,
      label: k.replace(/^product\./, "").replace(/_/g, " "),
    })).filter((t) => filter(t.token, t.label));
    const section = sectionFieldOptions
      .map((s) => ({ token: s.token, label: s.label }))
      .filter((t) => filter(t.token, t.label));
    return [
      { title: "Product", items: product },
      { title: "Product custom fields", items: productCustomFieldOptions },
      { title: "Section fields", items: section },
    ].filter((g) => g.items.length > 0);
  }, [tagQuery, sectionFieldOptions, productCustomFieldOptions]);

  const insertAtCursor = (target: HTMLElement, token: string): boolean => {
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      const start = target.selectionStart ?? target.value.length;
      const end = target.selectionEnd ?? start;
      const next = `${target.value.slice(0, start)}${token}${target.value.slice(end)}`;
      const caret = start + token.length;
      target.value = next;
      target.setSelectionRange(caret, caret);
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.focus();
      return true;
    }
    if (target.isContentEditable) {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return false;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(token));
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.focus();
      return true;
    }
    return false;
  };

  const onTokenPick = async (token: string) => {
    setRecentTags((prev) => [token, ...prev.filter((t) => t !== token)].slice(0, 8));
    const editable = lastEditableRef.current;
    if (editable && document.contains(editable) && insertAtCursor(editable, token)) {
      showToast(`Inserted ${token}`, "success");
      return;
    }
    try {
      await navigator.clipboard.writeText(token);
      showToast(`${token} copied — place cursor in a field and paste`, "success");
    } catch {
      showToast("Could not insert token automatically", "error");
    }
  };

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !(prev[title] ?? true) }));
  };

  return (
    <PuckBindingProvider sectionFields={sectionFieldOptions}>
      <PuckWebsiteMediaProvider
        listUrl={`/products/${productId}/landing-page/website-media`}
        uploadUrl={`/products/${productId}/landing-page/website-media`}
      >
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-2">
          <div className="mr-2 hidden items-center gap-2 md:flex">
            <span className="text-xs font-semibold text-foreground">My Product Landing Page</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                puckPublished ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}
            >
              {puckPublished ? "Published" : "Draft"}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
                Tools
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem onSelect={() => setAiSheetOpen(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                AI assistant…
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setHelpSheetOpen(true)}>
                <BookOpen className="mr-2 h-4 w-4" />
                Placeholders &amp; templates…
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void applyResolvedTemplate()}>
                Reset to resolved template
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openPreviewTab()}>
                <Eye className="mr-2 h-4 w-4" />
                Preview with live data…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-5" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => openPreviewTab()}
          >
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Preview
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setTagsSheetOpen(true)}
          >
            <Tags className="mr-1.5 h-3.5 w-3.5" />
            Dynamic tags
          </Button>

          <div className="flex flex-1" />

          <div className="flex items-center gap-2 pr-1">
            <Switch id="puck-pub" checked={puckPublished} onCheckedChange={(v) => setPuckPublished(v)} />
            <Label htmlFor="puck-pub" className="text-xs text-muted-foreground whitespace-nowrap">
              Published
            </Label>
          </div>

          <Button
            type="button"
            size="sm"
            className="h-8"
            disabled={saving}
            variant="secondary"
            onClick={() => save(data, puckPublished)}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>

        <div className="flex h-11 shrink-0 items-center gap-3 border-b border-border bg-background px-3">
          <div className="rounded-lg border bg-muted/30 p-1">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant={viewport === "mobile" ? "default" : "ghost"}
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setViewport("mobile")}
              >
                <Smartphone className="h-3.5 w-3.5" />
                Mobile
              </Button>
              <Button
                type="button"
                variant={viewport === "tablet" ? "default" : "ghost"}
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setViewport("tablet")}
              >
                <Tablet className="h-3.5 w-3.5" />
                Tablet
              </Button>
              <Button
                type="button"
                variant={viewport === "desktop" ? "default" : "ghost"}
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setViewport("desktop")}
              >
                <Monitor className="h-3.5 w-3.5" />
                Desktop
              </Button>
            </div>
          </div>
          <Select value={zoom} onValueChange={setZoom}>
            <SelectTrigger className="h-8 w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="75">75%</SelectItem>
              <SelectItem value="90">90%</SelectItem>
              <SelectItem value="100">100%</SelectItem>
              <SelectItem value="110">110%</SelectItem>
              <SelectItem value="125">125%</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Builder preview mode</p>
        </div>

        <div
          key={puckMountKey}
          className="puck-studio-root min-h-0 flex-1 overflow-hidden"
          data-viewport={viewport}
          data-zoom={zoom}
        >
          <PuckEditorWithVariantPicker
            PuckComponent={Puck}
            config={engagePuckConfig}
            data={data}
            overrides={mergedStudioOverrides}
            onChange={(next) => setData(next as Record<string, unknown>)}
            onPublish={async (next) => {
              setData(next as Record<string, unknown>);
              await save(next as Record<string, unknown>, puckPublished);
            }}
            headerTitle={`Product #${productId}`}
          />
        </div>

        <div className="flex h-12 shrink-0 items-center justify-center gap-2 border-t border-border bg-background px-3">
          <Button
            type="button"
            size="sm"
            variant={activeStage === "design" ? "default" : "ghost"}
            className="h-8"
            onClick={() => void handleStageClick("design")}
          >
            1. Design
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeStage === "settings" ? "default" : "ghost"}
            className="h-8"
            onClick={() => void handleStageClick("settings")}
          >
            2. Settings
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeStage === "integrations" ? "default" : "ghost"}
            className="h-8"
            onClick={() => void handleStageClick("integrations")}
          >
            3. Integrations
          </Button>
          <Button
            type="button"
            size="sm"
            variant={activeStage === "publish" ? "default" : "secondary"}
            className="h-8"
            onClick={() => void handleStageClick("publish")}
          >
            4. Publish
          </Button>
        </div>
      </div>

      <Sheet open={aiSheetOpen} onOpenChange={setAiSheetOpen}>
        <SheetContent side="right" className="flex w-full p-0 sm:max-w-md">
          <SheetHeader className="sr-only">
            <SheetTitle>AI assistant</SheetTitle>
            <SheetDescription>
              Generate or extend the product page from a prompt, a screenshot, or both.
            </SheetDescription>
          </SheetHeader>
          <AiAssistantSheetPanel
            scope="product"
            prompt={aiPrompt}
            setPrompt={setAiPrompt}
            mode={aiMode}
            setMode={setAiMode}
            screenshot={aiScreenshot}
            setScreenshot={setAiScreenshot}
            loading={aiLoading}
            onGenerate={() => void runAi()}
            lastModel={aiLastModel}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={helpSheetOpen} onOpenChange={setHelpSheetOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Placeholders &amp; templates</SheetTitle>
            <SheetDescription>
              Product pages merge department templates (tag → category → global), then apply your product-specific
              overrides.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4 overflow-y-auto text-sm text-muted-foreground px-1 pb-6">
            <p>
              Use{" "}
              <code className="rounded bg-muted px-1 text-xs text-foreground">{"{{product.name}}"}</code> and{" "}
              <code className="rounded bg-muted px-1 text-xs text-foreground">{"{{section_key.field_key}}"}</code>{" "}
              in text fields so copy stays in sync with catalog and legacy sections.
            </p>
            <p>
              Manage shared layouts from{" "}
              <Link href="/landing-pages/templates/library" className="font-medium text-foreground underline underline-offset-2">
                Template library
              </Link>{" "}
              and{" "}
              <Link href="/landing-pages/templates/assignments" className="font-medium text-foreground underline underline-offset-2">
                Assignments
              </Link>
              .
            </p>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={tagsSheetOpen} onOpenChange={setTagsSheetOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Dynamic tags</SheetTitle>
            <SheetDescription>
              Search and insert placeholders into the currently focused content field.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 flex flex-1 flex-col gap-3 overflow-y-auto px-1 pb-6">
            <Input
              value={tagQuery}
              onChange={(e) => setTagQuery(e.target.value)}
              placeholder="Search tags…"
              className="h-9"
            />
            {recentTags.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Recently used
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {recentTags.map((token) => (
                    <button
                      key={`recent-${token}`}
                      type="button"
                      onClick={() => void onTokenPick(token)}
                      className="rounded-md border bg-background px-2 py-1 font-mono text-[11px] transition hover:border-primary/40 hover:bg-muted/40"
                    >
                      {token}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {dynamicGroups.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matching tags.</p>
            ) : (
              dynamicGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    className="flex w-full items-center justify-between rounded-md border bg-muted/30 px-2.5 py-2 text-left"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {openGroups[group.title] ?? true ? "Hide" : "Show"}
                    </span>
                  </button>
                  {openGroups[group.title] ?? true ? (
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <button
                          key={`${group.title}-${item.token}`}
                          type="button"
                          onClick={() => void onTokenPick(item.token)}
                          className="flex w-full items-center justify-between rounded-md border bg-background px-2.5 py-2 text-left text-xs transition hover:border-primary/40 hover:bg-muted/40"
                        >
                          <code className="font-mono text-[11px]">{item.token}</code>
                          <span className="ml-3 truncate text-muted-foreground">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      </PuckWebsiteMediaProvider>
    </PuckBindingProvider>
  );
}
