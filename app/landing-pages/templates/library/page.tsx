"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import { migratePuckDocument } from "@/lib/puck/migrate-puck-document";
import { sanitizePuckDataForEngageConfig } from "@/lib/puck/sanitize-puck-document";
import {
  PREBUILT_PUCK_TEMPLATE_LIBRARY,
  type PrebuiltPuckTemplateLibraryItem,
  type PrebuiltTemplateCategory,
} from "@/lib/puck/prebuilt-puck-template-library";
import { Loader2, Plus, Pencil, Trash2, ArrowLeft, Eye } from "lucide-react";

type LibRow = {
  id: number;
  name: string;
  description: string | null;
  updated_at?: string;
};

export default function PuckTemplateLibraryListPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [rows, setRows] = React.useState<LibRow[]>([]);
  const [addingPrebuiltId, setAddingPrebuiltId] = React.useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/admin/landing-page/puck-template-library");
      if (res.data.success) setRows(res.data.data ?? []);
    } catch {
      showToast("Failed to load templates", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const addPrebuilt = async (item: (typeof PREBUILT_PUCK_TEMPLATE_LIBRARY)[number]) => {
    setAddingPrebuiltId(item.id);
    try {
      const puck_document = sanitizePuckDataForEngageConfig(
        migratePuckDocument(
          JSON.parse(JSON.stringify(item.puck_document)) as Record<string, unknown>
        ) as Record<string, unknown>
      );
      const res = await axiosClient.post("/admin/landing-page/puck-template-library", {
        name: item.suggestedLibraryName,
        description: item.description,
        puck_document,
        is_active: true,
      });
      if (res.data?.success && res.data?.data?.id) {
        showToast("Template added to your library", "success");
        router.push(`/landing-pages/templates/library/${res.data.data.id}`);
        return;
      }
      showToast("Could not create template", "error");
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Create failed";
      showToast(msg, "error");
    } finally {
      setAddingPrebuiltId(null);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this template from the library?")) return;
    try {
      await axiosClient.delete(`/admin/landing-page/puck-template-library/${id}`);
      showToast("Deleted", "success");
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Delete failed";
      showToast(msg, "error");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[40vh] items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Loading…</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" className="mb-2 -ml-2 gap-1" asChild>
              <Link href="/landing-pages/hub">
                <ArrowLeft className="h-4 w-4" />
                Landing pages home
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Puck template library</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create layouts here with Puck + AI. Then link them to global, category, or tag on{" "}
              <Link href="/landing-pages/templates/assignments" className="underline font-medium">
                assignments
              </Link>
              .
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Templates</DialogTitle>
                  <DialogDescription>Preview starters before adding them to your library.</DialogDescription>
                </DialogHeader>
                <PrebuiltTemplatesPicker
                  addingPrebuiltId={addingPrebuiltId}
                  onAdd={(item) => void addPrebuilt(item)}
                  onCloseDialog={() => setTemplatesOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <Button asChild>
              <Link href="/landing-pages/templates/library/new">
                <Plus className="h-4 w-4 mr-2" />
                New template
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>Department-scoped (from your session).</CardDescription>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No templates yet. Create one to get started.</p>
            ) : (
              <ul className="divide-y rounded-md border">
                {rows.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 text-sm"
                  >
                    <div>
                      <div className="font-medium">{r.name}</div>
                      {r.description ? (
                        <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/landing-pages/templates/library/${r.id}`}>
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => void remove(r.id)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

const CATEGORY_LABEL: Record<PrebuiltTemplateCategory, string> = {
  products: "For products",
  "landing-pages": "For landing pages",
};

const CATEGORY_HINT: Record<PrebuiltTemplateCategory, string> = {
  products: "Use one of these as a starting point for product detail pages.",
  "landing-pages": "Use one of these for marketing, campaign, or landing pages.",
};

function PrebuiltTemplatesPicker({
  addingPrebuiltId,
  onAdd,
  onCloseDialog,
}: {
  addingPrebuiltId: string | null;
  onAdd: (item: PrebuiltPuckTemplateLibraryItem) => void;
  onCloseDialog: () => void;
}) {
  const productItems = React.useMemo(
    () => PREBUILT_PUCK_TEMPLATE_LIBRARY.filter((i) => i.category === "products"),
    []
  );
  const landingItems = React.useMemo(
    () => PREBUILT_PUCK_TEMPLATE_LIBRARY.filter((i) => i.category === "landing-pages"),
    []
  );
  const initialTab: PrebuiltTemplateCategory = productItems.length ? "products" : "landing-pages";
  const [tab, setTab] = React.useState<PrebuiltTemplateCategory>(initialTab);

  const renderGrid = (items: PrebuiltPuckTemplateLibraryItem[]) => (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.id} className="overflow-hidden rounded-xl border bg-card shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.previewImageUrl} alt={`${item.name} preview`} className="h-44 w-full object-cover" />
          <div className="space-y-2 p-4">
            <div className="font-semibold text-foreground">{item.name}</div>
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
            <div className="flex items-center gap-2 pt-1">
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/landing-pages/templates/library/prebuilt/${item.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye className="mr-1 h-4 w-4" />
                  Preview
                </Link>
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={addingPrebuiltId !== null}
                onClick={() => onAdd(item)}
              >
                {addingPrebuiltId === item.id ? (
                  <>
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    Adding…
                  </>
                ) : (
                  "Use template"
                )}
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as PrebuiltTemplateCategory)} className="space-y-4">
      <TabsList className="w-full">
        <TabsTrigger value="products">
          {CATEGORY_LABEL.products}
          <span className="ml-1.5 rounded-full bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
            {productItems.length}
          </span>
        </TabsTrigger>
        <TabsTrigger value="landing-pages">
          {CATEGORY_LABEL["landing-pages"]}
          <span className="ml-1.5 rounded-full bg-muted-foreground/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
            {landingItems.length}
          </span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="products" className="space-y-3">
        <p className="text-xs text-muted-foreground">{CATEGORY_HINT.products}</p>
        {productItems.length ? renderGrid(productItems) : (
          <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No product templates available.
          </p>
        )}
      </TabsContent>
      <TabsContent value="landing-pages" className="space-y-3">
        <p className="text-xs text-muted-foreground">{CATEGORY_HINT["landing-pages"]}</p>
        {landingItems.length ? renderGrid(landingItems) : (
          <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No landing page templates available.
          </p>
        )}
      </TabsContent>
    </Tabs>
  );
}
