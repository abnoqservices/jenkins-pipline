"use client";

import * as React from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/layout";
import { DepartmentSiteEditor } from "@/components/landing/DepartmentSiteEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import { Loader2 } from "lucide-react";

type SiteRow = {
  id: number;
  slug: string;
  name: string | null;
  is_published: boolean;
  blog_post_shell_site_page_id?: number | null;
  organization?: { slug: string | null; name?: string };
  pages?: Array<{
    id: number;
    path: string;
    title?: string | null;
    puck_document: Record<string, unknown> | null;
    is_published: boolean;
  }>;
};

export default function DepartmentSiteSetupPage() {
  const [loading, setLoading] = React.useState(true);
  const [sites, setSites] = React.useState<SiteRow[]>([]);
  const [slug, setSlug] = React.useState("");
  const [name, setName] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/admin/landing-page/sites");
      if (!res.data?.success) {
        showToast(res.data?.message || "Failed to load site", "error");
        setSites([]);
        return;
      }
      setSites(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      showToast("Failed to load department site", "error");
      setSites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const createSite = async () => {
    const s = slug.trim().toLowerCase();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
      showToast("Use a lowercase slug with letters, numbers, and hyphens only.", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await axiosClient.post("/admin/landing-page/sites", {
        slug: s,
        name: name.trim() || undefined,
        is_published: false,
      });
      if (!res.data?.success) {
        showToast(res.data?.message || "Could not create site", "error");
        return;
      }
      showToast("Department site created", "success");
      await load();
    } catch {
      showToast("Could not create site", "error");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Loading…</span>
        </div>
      </DashboardLayout>
    );
  }

  const site = sites[0];
  const home = site?.pages?.find((p) => p.path === "/");

  if (site && home) {
    return <DepartmentSiteEditor site={site} homePage={home} onRefresh={load} />;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
        <div>
          <Button variant="ghost" size="sm" className="mb-4 -ml-2" asChild>
            <Link href="/landing-pages/hub">← Landing pages hub</Link>
          </Button>
          <h1 className="text-2xl font-bold">Department website</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One published site per department (phase 1). Visitors open{" "}
            <code className="rounded bg-muted px-1 text-xs">/sites/{"{orgSlug}"}/{"{siteSlug}"}</code> on this app.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create your site</CardTitle>
            <CardDescription>
              Choose a URL slug for this department. You need a selected department in the app and an organization
              slug for public links.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site-slug">Site slug</Label>
              <Input
                id="site-slug"
                placeholder="e.g. showroom or marketing-team"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-name">Display name (optional)</Label>
              <Input
                id="site-name"
                placeholder="Shown in the editor header"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <Button type="button" disabled={creating} onClick={() => void createSite()}>
              {creating ? "Creating…" : "Create department site"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
