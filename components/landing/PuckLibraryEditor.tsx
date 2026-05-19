"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Config, Overrides } from "@measured/puck";
import "@measured/puck/puck.css";
import { VisualEditorLayout } from "@/components/dashboard/visual-editor-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { engagePuckConfig, defaultEngagePuckData } from "@/lib/puck/engage-puck-config";
import { migratePuckDocument } from "@/lib/puck/migrate-puck-document";
import { sanitizePuckDataForEngageConfig } from "@/lib/puck/sanitize-puck-document";
import { engagePuckOverrides } from "@/lib/puck/puck-inspector-tabs";
import {
  PuckBindingProvider,
  flattenSectionSchemaFields,
} from "@/lib/puck/puck-binding-context";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import {
  applyPuckPlaceholders,
  buildPuckPlaceholderMap,
  PLACEHOLDER_CHEATSHEET,
  PRODUCT_PLACEHOLDER_KEYS,
  type PuckPlaceholderProduct,
  type SectionContentSource,
} from "@/lib/puck/puck-placeholders";
import { Loader2, Sparkles, ArrowLeft, Braces, MoreHorizontal, Eye, ExternalLink } from "lucide-react";
import { PuckEditorWithVariantPicker } from "@/components/landing/PuckEditorWithVariantPicker";
import { type Screenshot } from "@/components/landing/ScreenshotUploader";
import { AiAssistantSheetPanel } from "@/components/landing/AiAssistantSheetPanel";
import { openLandingPreviewInNewTab } from "@/lib/landing-preview-handoff";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

function apiProductToPlaceholderProduct(p: Record<string, unknown>): PuckPlaceholderProduct {
  const images = Array.isArray(p.images) ? p.images : [];
  const urlAt = (i: number) => {
    const row = images[i] as { url?: string } | undefined;
    return typeof row?.url === "string" ? row.url : "";
  };
  return {
    name: String(p.name ?? ""),
    description: String(p.description ?? ""),
    url_slug: String(p.url_slug ?? ""),
    sku: String(p.sku ?? ""),
    price: p.price as string | number | null | undefined,
    video_url: String(p.video_url ?? ""),
    meta_title: String(p.meta_title ?? ""),
    meta_description: String(p.meta_description ?? ""),
    qr_code_url: String(p.qr_code_url ?? ""),
    image_url: urlAt(0),
    image_1: urlAt(0),
    image_2: urlAt(1),
    image_3: urlAt(2),
    image_4: urlAt(3),
  };
}

function extraProductTokenMap(p: Record<string, unknown>): Record<string, string> {
  const cat = p.category;
  const catName =
    cat && typeof cat === "object" && cat !== null && "name" in cat
      ? String((cat as { name?: string }).name ?? "")
      : "";
  return {
    "product.category": catName,
    "product.status": String(p.status ?? ""),
  };
}

function landingPageSectionsToSources(sections: unknown): SectionContentSource[] {
  if (!Array.isArray(sections)) return [];
  const out: SectionContentSource[] = [];
  for (const raw of sections) {
    if (!raw || typeof raw !== "object") continue;
    const s = raw as Record<string, unknown>;
    const gs = (s.global_section ?? s.globalSection) as Record<string, unknown> | undefined;
    const key = gs && typeof gs.key === "string" ? gs.key : "";
    const content = s.content;
    if (!key || !content || typeof content !== "object") continue;
    out.push({ sectionKey: key, content: content as Record<string, unknown> });
  }
  return out;
}

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

export function PuckLibraryEditor({ templateId }: { templateId: number | null }) {
  const router = useRouter();
  const isNew = templateId == null;

  const [loading, setLoading] = React.useState(!isNew);
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState(isNew ? "Untitled layout" : "");
  const [description, setDescription] = React.useState("");
  const [data, setData] = React.useState<Record<string, unknown>>(() => normalizeDoc(null));
  const [puckMountKey, setPuckMountKey] = React.useState(0);
  const [sectionFields, setSectionFields] = React.useState(flattenSectionSchemaFields([]));
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [aiMode, setAiMode] = React.useState<"replace" | "append">("replace");
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiSheetOpen, setAiSheetOpen] = React.useState(false);
  const [aiScreenshot, setAiScreenshot] = React.useState<Screenshot | null>(null);
  const [aiLastModel, setAiLastModel] = React.useState<string | null>(null);
  const [tokensSheetOpen, setTokensSheetOpen] = React.useState(false);
  const [detailsSheetOpen, setDetailsSheetOpen] = React.useState(false);

  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewListLoading, setPreviewListLoading] = React.useState(false);
  const [previewProducts, setPreviewProducts] = React.useState<
    { id: number; name: string; sku: string }[]
  >([]);
  const [previewProductId, setPreviewProductId] = React.useState<string>("");
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewDocument, setPreviewDocument] = React.useState<Record<string, unknown> | null>(null);
  const [previewProductLabel, setPreviewProductLabel] = React.useState("");

  const loadPreviewProducts = React.useCallback(async () => {
    setPreviewListLoading(true);
    try {
      const deptId = localStorage.getItem("selectedDepartmentId");
      const res = await axiosClient.get("/products", {
        params: {
          per_page: 200,
          ...(deptId ? { department_id: parseInt(deptId, 10) } : {}),
        },
      });
      if (!res.data?.success) return;
      const raw = res.data.data?.data ?? res.data.data;
      const list = Array.isArray(raw) ? raw : [];
      setPreviewProducts(
        list.map((row: { id: number; name?: string; sku?: string }) => ({
          id: row.id,
          name: String(row.name ?? "Untitled"),
          sku: String(row.sku ?? "—"),
        }))
      );
    } catch {
      showToast("Failed to load products for preview", "error");
    } finally {
      setPreviewListLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!previewOpen) return;
    setPreviewProductId("");
    setPreviewDocument(null);
    setPreviewProductLabel("");
    void loadPreviewProducts();
  }, [previewOpen, loadPreviewProducts]);

  const runPreviewForProduct = React.useCallback(
    async (productId: number) => {
      setPreviewLoading(true);
      try {
        const [prodRes, lpRes] = await Promise.allSettled([
          axiosClient.get(`/products/${productId}`),
          axiosClient.get(`/products/${productId}/landing-page`),
        ]);
        if (prodRes.status !== "fulfilled" || !prodRes.value.data?.success || !prodRes.value.data.data) {
          showToast("Failed to load product", "error");
          return;
        }
        const p = prodRes.value.data.data as Record<string, unknown>;
        let sectionSources: SectionContentSource[] = [];
        if (lpRes.status === "fulfilled" && lpRes.value.data?.success && lpRes.value.data.data) {
          const d = lpRes.value.data.data as { sections?: unknown };
          sectionSources = landingPageSectionsToSources(d.sections);
        }
        const base = buildPuckPlaceholderMap(apiProductToPlaceholderProduct(p), sectionSources);
        const merged = { ...base, ...extraProductTokenMap(p) };
        setPreviewDocument(applyPuckPlaceholders(data, merged) as Record<string, unknown>);
        setPreviewProductLabel(String(p.name ?? "Product"));
      } catch {
        showToast("Preview failed", "error");
      } finally {
        setPreviewLoading(false);
      }
    },
    [data]
  );

  React.useEffect(() => {
    if (!previewOpen || !previewProductId) return;
    const id = parseInt(previewProductId, 10);
    if (!Number.isFinite(id) || id < 1) return;
    void runPreviewForProduct(id);
  }, [previewOpen, previewProductId, runPreviewForProduct]);

  React.useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const deptId = localStorage.getItem("selectedDepartmentId");
        const [tplRes, secRes] = await Promise.all([
          axiosClient.get(`/admin/landing-page/puck-template-library/${templateId}`),
          axiosClient.get("/landing-page/sections", { params: { department_id: deptId } }),
        ]);
        if (cancelled || !tplRes.data?.success || !tplRes.data.data) return;
        const row = tplRes.data.data;
        setName(row.name ?? "");
        setDescription(row.description ?? "");
        setData(normalizeDoc(row.puck_document as Record<string, unknown>));
        setPuckMountKey((k) => k + 1);

        if (secRes.data?.success) {
          const raw = secRes.data.data?.sections ?? [];
          const list = Array.isArray(raw) ? raw : [];
          const active = list.filter((s: { is_active?: boolean }) => s.is_active !== false);
          setSectionFields(
            flattenSectionSchemaFields(
              active.map(
                (s: { key?: string; schema?: { fields?: { key: string; label?: string }[] } }) => ({
                  key: String(s.key ?? ""),
                  schema: s.schema,
                })
              )
            )
          );
        }
      } catch {
        if (!cancelled) showToast("Failed to load template", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isNew, templateId]);

  React.useEffect(() => {
    if (!isNew) return;
    let cancelled = false;
    (async () => {
      try {
        const deptId = localStorage.getItem("selectedDepartmentId");
        const secRes = await axiosClient.get("/landing-page/sections", {
          params: { department_id: deptId },
        });
        if (cancelled || !secRes.data?.success) return;
        const raw = secRes.data.data?.sections ?? [];
        const list = Array.isArray(raw) ? raw : [];
        const active = list.filter((s: { is_active?: boolean }) => s.is_active !== false);
        setSectionFields(
          flattenSectionSchemaFields(
            active.map(
              (s: { key?: string; schema?: { fields?: { key: string; label?: string }[] } }) => ({
                key: String(s.key ?? ""),
                schema: s.schema,
              })
            )
          )
        );
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isNew]);

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
            : "AI rebuilt the page from your screenshot — save when ready"
          : aiMode === "append"
            ? "AI blocks appended"
            : "AI layout applied — save when ready",
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

  const save = async () => {
    const nm = name.trim();
    if (!nm) {
      showToast("Template name is required", "error");
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const res = await axiosClient.post("/admin/landing-page/puck-template-library", {
          name: nm,
          description: description.trim() || undefined,
          puck_document: data,
          is_active: true,
          sort_order: 0,
        });
        if (!res.data?.success || !res.data.data?.id) {
          showToast("Failed to create template", "error");
          return;
        }
        showToast("Template created", "success");
        router.replace(`/landing-pages/templates/library/${res.data.data.id}`);
        return;
      }
      await axiosClient.put(`/admin/landing-page/puck-template-library/${templateId}`, {
        name: nm,
        description: description.trim() || undefined,
        puck_document: data,
      });
      showToast("Template saved", "success");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to save";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <VisualEditorLayout>
        <div className="flex min-h-0 flex-1 items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm">Loading template…</span>
        </div>
      </VisualEditorLayout>
    );
  }

  return (
    <VisualEditorLayout>
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-background px-2 sm:px-3">
        <Button variant="ghost" size="sm" asChild className="h-8 gap-1.5 px-2 text-muted-foreground">
          <Link href="/landing-pages/templates/library">
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Library</span>
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Template name"
          className="h-8 max-w-[200px] border-0 bg-muted/50 text-sm font-medium shadow-none sm:max-w-[280px]"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground"
          onClick={() => setDetailsSheetOpen(true)}
        >
          Details
        </Button>
        <div className="flex flex-1" />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => setPreviewOpen(true)}
        >
          <Eye className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Preview</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
              Tools
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => setPreviewOpen(true)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview with product…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setAiSheetOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              AI assistant…
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTokensSheetOpen(true)}>
              <Braces className="mr-2 h-4 w-4" />
              Placeholder tokens…
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => {
                setData(normalizeDoc(null));
                setPuckMountKey((k) => k + 1);
              }}
            >
              Reset canvas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button type="button" size="sm" className="h-8" disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : isNew ? "Create" : "Save"}
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        <PuckBindingProvider sectionFields={sectionFields}>
          <div key={puckMountKey} className="puck-studio-root min-h-0 flex-1 overflow-hidden">
            <PuckEditorWithVariantPicker
              PuckComponent={Puck}
              config={engagePuckConfig}
              data={data}
              overrides={mergedStudioOverrides}
              onChange={(next) => setData(next as Record<string, unknown>)}
              onPublish={async (next) => {
                setData(next as Record<string, unknown>);
                await save();
              }}
              headerTitle="Template"
            />
          </div>
        </PuckBindingProvider>
      </div>

      <Sheet open={detailsSheetOpen} onOpenChange={setDetailsSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Template details</SheetTitle>
            <SheetDescription>Shown only in your library, not on the storefront.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4 px-1">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">
              Assign layouts under{" "}
              <Link href="/landing-pages/templates/assignments" className="underline underline-offset-2">
                Assignments
              </Link>
              .
            </p>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={aiSheetOpen} onOpenChange={setAiSheetOpen}>
        <SheetContent side="right" className="flex w-full p-0 sm:max-w-md">
          <SheetHeader className="sr-only">
            <SheetTitle>AI assistant</SheetTitle>
            <SheetDescription>
              Generate or extend the page from a prompt, a screenshot, or both.
            </SheetDescription>
          </SheetHeader>
          <AiAssistantSheetPanel
            scope="library"
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

      <Sheet open={tokensSheetOpen} onOpenChange={setTokensSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Placeholder tokens</SheetTitle>
            <SheetDescription>{PLACEHOLDER_CHEATSHEET}</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-1 rounded-md border bg-muted/30 px-3 py-2 font-mono text-xs">
            {PRODUCT_PLACEHOLDER_KEYS.map((k) => (
              <div key={k}>
                <code>{`{{${k}}}`}</code>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Preview with a product</DialogTitle>
            <DialogDescription>
              Pick a product to fill <code className="text-xs">{"{{product.*}}"}</code> and{" "}
              <code className="text-xs">{"{{section_key.field}}"}</code> placeholders. Preview opens in a new tab with
              desktop / tablet / mobile views.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lib-preview-product">Product</Label>
              <Select
                value={previewProductId || undefined}
                onValueChange={setPreviewProductId}
                disabled={previewListLoading}
              >
                <SelectTrigger id="lib-preview-product" className="w-full">
                  <SelectValue
                    placeholder={previewListLoading ? "Loading products…" : "Select a product…"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {previewProducts.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} ({p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!previewListLoading && previewProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No products found for the current department. Create a product, then try again.
                </p>
              ) : null}
            </div>
            {previewLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                Building preview…
              </div>
            ) : null}
            {!previewLoading && previewProductId && !previewDocument ? (
              <p className="text-sm text-amber-700">Could not build preview for this product.</p>
            ) : null}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setPreviewOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!previewProductId || previewLoading || !previewDocument}
                onClick={() => {
                  if (!previewDocument) return;
                  openLandingPreviewInNewTab({
                    name: name?.trim() || "Template preview",
                    description: previewProductLabel ? `Previewing with ${previewProductLabel}` : undefined,
                    document: previewDocument,
                    backHref: window.location.pathname,
                    backLabel: "Back to editor",
                    badge: "Preview",
                  });
                  setPreviewOpen(false);
                }}
              >
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Open preview in new tab
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </VisualEditorLayout>
  );
}
