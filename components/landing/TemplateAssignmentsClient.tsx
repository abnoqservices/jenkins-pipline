"use client";

import * as React from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import type { PuckTemplateRow } from "@/lib/puck/puck-template-shared";
import { scopeBadgeLabel } from "@/lib/puck/puck-template-shared";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";

type LibRow = { id: number; name: string };
type Category = { id: number; name: string };

function assignmentForGlobal(rows: PuckTemplateRow[]): PuckTemplateRow | undefined {
  return rows.find((r) => r.scope_meta?.scope_type === "global");
}

function assignmentForCategory(rows: PuckTemplateRow[], categoryId: number): PuckTemplateRow | undefined {
  return rows.find(
    (r) => r.scope_meta?.scope_type === "category" && r.scope_meta?.category_id === categoryId
  );
}

function tagAssignments(rows: PuckTemplateRow[]): PuckTemplateRow[] {
  return rows.filter((r) => r.scope_meta?.scope_type === "tag");
}

export function TemplateAssignmentsClient() {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [library, setLibrary] = React.useState<LibRow[]>([]);
  const [assignments, setAssignments] = React.useState<PuckTemplateRow[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);

  const [globalLibId, setGlobalLibId] = React.useState<string>("");

  const [newTag, setNewTag] = React.useState("");
  const [newTagLib, setNewTagLib] = React.useState<string>("");

  const [catSelections, setCatSelections] = React.useState<Record<number, string>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [libRes, asRes, catRes] = await Promise.all([
        axiosClient.get("/admin/landing-page/puck-template-library"),
        axiosClient.get("/admin/landing-page/page-templates"),
        axiosClient.get("/product-categories"),
      ]);
      if (libRes.data.success) {
        const list = libRes.data.data ?? [];
        setLibrary(Array.isArray(list) ? list : []);
      }
      if (asRes.data.success) {
        const list = asRes.data.data ?? [];
        setAssignments(Array.isArray(list) ? list : []);
      }
      const cats = catRes.data?.data ?? catRes.data ?? [];
      setCategories(Array.isArray(cats) ? cats : []);
    } catch {
      showToast("Failed to load assignments", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    const g = assignmentForGlobal(assignments);
    const lid = g?.library_template?.id;
    setGlobalLibId(lid ? String(lid) : "");
  }, [assignments]);

  React.useEffect(() => {
    const next: Record<number, string> = {};
    for (const c of categories) {
      const row = assignmentForCategory(assignments, c.id);
      next[c.id] = row?.library_template?.id ? String(row.library_template.id) : "";
    }
    setCatSelections(next);
  }, [assignments, categories]);

  const upsert = async (body: {
    scope_type: "global" | "category" | "tag";
    puck_template_id: number;
    category_id?: number;
    tag?: string;
  }) => {
    setSaving(true);
    try {
      const existing = assignments.find((r) => {
        const m = r.scope_meta;
        if (!m) return false;
        if (body.scope_type === "global") return m.scope_type === "global";
        if (body.scope_type === "category")
          return m.scope_type === "category" && m.category_id === body.category_id;
        if (body.scope_type === "tag")
          return m.scope_type === "tag" && (m.tag ?? "").toLowerCase() === (body.tag ?? "").toLowerCase();
        return false;
      });

      if (existing) {
        await axiosClient.put(`/admin/landing-page/page-templates/${existing.id}`, {
          puck_template_id: body.puck_template_id,
        });
      } else {
        await axiosClient.post("/admin/landing-page/page-templates", {
          ...body,
          is_active: true,
          sort_order: 0,
        });
      }
      showToast("Assignment saved", "success");
      await load();
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Save failed";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteAssignmentById = async (id: number) => {
    try {
      await axiosClient.delete(`/admin/landing-page/page-templates/${id}`);
      showToast("Removed", "success");
      await load();
    } catch {
      showToast("Failed to remove", "error");
    }
  };

  const clearAssignment = async (row: Pick<PuckTemplateRow, "id">) => {
    if (!confirm("Remove this assignment?")) return;
    await deleteAssignmentById(row.id);
  };

  const saveGlobal = async () => {
    if (!globalLibId) {
      const cur = assignmentForGlobal(assignments);
      if (cur) {
        setSaving(true);
        try {
          await deleteAssignmentById(cur.id);
        } finally {
          setSaving(false);
        }
      }
      return;
    }
    await upsert({ scope_type: "global", puck_template_id: Number(globalLibId) });
  };

  const saveCategory = async (categoryId: number) => {
    const sel = catSelections[categoryId];
    if (!sel) {
      const cur = assignmentForCategory(assignments, categoryId);
      if (cur) {
        setSaving(true);
        try {
          await deleteAssignmentById(cur.id);
        } finally {
          setSaving(false);
        }
      }
      return;
    }
    await upsert({
      scope_type: "category",
      puck_template_id: Number(sel),
      category_id: categoryId,
    });
  };

  const saveNewTag = async () => {
    const t = newTag.trim().toLowerCase();
    if (!t) {
      showToast("Enter a tag", "error");
      return;
    }
    if (!newTagLib) {
      showToast("Choose a template", "error");
      return;
    }
    await upsert({ scope_type: "tag", puck_template_id: Number(newTagLib), tag: t });
    setNewTag("");
    setNewTagLib("");
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

  const tags = tagAssignments(assignments);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 py-8 px-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-1" asChild>
            <Link href="/landing-pages/hub">
              <ArrowLeft className="h-4 w-4" />
              Landing pages home
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Template assignments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Point global, category, and tag scopes at layouts from your{" "}
            <Link href="/landing-pages/templates/library" className="underline font-medium">
              template library
            </Link>
            . Resolution order on a product: <strong>tag → category → global</strong>.
          </p>
        </div>

        {library.length === 0 ? (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-6 text-sm">
              You don&apos;t have any library templates yet.{" "}
              <Link href="/landing-pages/templates/library/new" className="font-medium underline">
                Create one first
              </Link>
              .
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Global (department default)</CardTitle>
            <CardDescription>Lowest priority when no category or tag template matches.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="space-y-2 flex-1">
              <Label>Library template</Label>
              <Select
                value={globalLibId ? globalLibId : "__none__"}
                onValueChange={(v) => setGlobalLibId(v === "__none__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {library.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="button" disabled={saving} onClick={() => void saveGlobal()}>
                Save
              </Button>
              {assignmentForGlobal(assignments) ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => {
                    const cur = assignmentForGlobal(assignments);
                    if (cur) void clearAssignment(cur);
                  }}
                >
                  Clear
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>One optional template per product category.</CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories in this account.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>
                        <Select
                          value={catSelections[c.id] ? catSelections[c.id] : "__none__"}
                          onValueChange={(v) =>
                            setCatSelections((prev) => ({
                              ...prev,
                              [c.id]: v === "__none__" ? "" : v,
                            }))
                          }
                        >
                          <SelectTrigger className="max-w-xs">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">None</SelectItem>
                            {library.map((t) => (
                              <SelectItem key={t.id} value={String(t.id)}>
                                {t.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={saving}
                          onClick={() => void saveCategory(c.id)}
                        >
                          Save
                        </Button>
                        {assignmentForCategory(assignments, c.id) ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            disabled={saving}
                            onClick={() =>
                              void clearAssignment(assignmentForCategory(assignments, c.id)!)
                            }
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
            <CardDescription>Highest priority. Case-insensitive match on product tags.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="space-y-2 flex-1">
                <Label>New tag</Label>
                <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="e.g. premium" />
              </div>
              <div className="space-y-2 flex-1">
                <Label>Library template</Label>
                <Select value={newTagLib || undefined} onValueChange={setNewTagLib}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose template" />
                  </SelectTrigger>
                  <SelectContent>
                    {library.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" disabled={saving} onClick={() => void saveNewTag()}>
                Add assignment
              </Button>
            </div>

            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tag assignments yet.</p>
            ) : (
              <ul className="divide-y rounded-md border text-sm">
                {tags.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3"
                  >
                    <div>
                      <div className="font-medium">{scopeBadgeLabel(t, categories)}</div>
                      <div className="text-xs text-muted-foreground">
                        Library: {t.library_template?.name ?? "—"}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => void clearAssignment(t)}
                      aria-label="Remove assignment"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
