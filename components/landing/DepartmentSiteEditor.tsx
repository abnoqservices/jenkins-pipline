"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Config, Overrides } from "@measured/puck";
import "@measured/puck/puck.css";
import { VisualEditorLayout } from "@/components/dashboard/visual-editor-layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
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
import { engagePuckConfig, defaultEngagePuckData } from "@/lib/puck/engage-puck-config";
import { migratePuckDocument } from "@/lib/puck/migrate-puck-document";
import { sanitizePuckDataForEngageConfig } from "@/lib/puck/sanitize-puck-document";
import { engagePuckOverrides } from "@/lib/puck/puck-inspector-tabs";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import { PuckEditorWithVariantPicker } from "@/components/landing/PuckEditorWithVariantPicker";
import {
  PuckBindingProvider,
  flattenSectionSchemaFields,
  type PuckBindingFieldOption,
} from "@/lib/puck/puck-binding-context";
import { PuckWebsiteMediaProvider } from "@/lib/puck/puck-website-media-context";
import { SiteRuntimeProvider } from "@/lib/puck/site-runtime-context";
import { createBlogShellStarterDocument } from "@/lib/puck/blog-shell-starter-document";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Database, ExternalLink, Globe, Loader2, RotateCcw } from "lucide-react";

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

export type DepartmentSiteEditorHomePage = {
  id: number;
  path: string;
  title?: string | null;
  puck_document: Record<string, unknown> | null;
  is_published: boolean;
};

export type DepartmentSiteEditorSite = {
  id: number;
  slug: string;
  name: string | null;
  is_published: boolean;
  blog_post_shell_site_page_id?: number | null;
  organization?: { slug: string | null; name?: string } | null;
  pages?: DepartmentSiteEditorHomePage[];
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
  return sanitizePuckDataForEngageConfig(migrated);
}

export function DepartmentSiteEditor({
  site,
  homePage,
  onRefresh,
}: {
  site: DepartmentSiteEditorSite;
  homePage: DepartmentSiteEditorHomePage;
  onRefresh?: () => void;
}) {
  const pagesList = React.useMemo(() => {
    const raw = site.pages && site.pages.length > 0 ? site.pages : [homePage];
    return [...raw].sort((a, b) => a.path.localeCompare(b.path));
  }, [site.pages, homePage]);

  const [editingPageId, setEditingPageId] = React.useState(homePage.id);

  React.useEffect(() => {
    setEditingPageId((prev) => {
      if (pagesList.some((p) => p.id === prev)) return prev;
      return homePage.id;
    });
  }, [site.id, pagesList, homePage.id]);

  const editingPage = React.useMemo(
    () => pagesList.find((p) => p.id === editingPageId) ?? homePage,
    [pagesList, editingPageId, homePage]
  );

  const [data, setData] = React.useState(() => normalizeDoc(homePage.puck_document ?? undefined));
  const [sitePublished, setSitePublished] = React.useState(site.is_published);
  const [pagePublished, setPagePublished] = React.useState(homePage.is_published);
  const [saving, setSaving] = React.useState(false);
  const [shellWorking, setShellWorking] = React.useState(false);
  const [blogShellSelection, setBlogShellSelection] = React.useState(() =>
    site.blog_post_shell_site_page_id != null ? String(site.blog_post_shell_site_page_id) : "none"
  );
  const [puckMountKey, setPuckMountKey] = React.useState(0);
  const [sectionFieldOptions, setSectionFieldOptions] = React.useState<PuckBindingFieldOption[]>([]);
  const [cmsOpen, setCmsOpen] = React.useState(false);
  const [cmsLoading, setCmsLoading] = React.useState(false);
  const [cmsSaving, setCmsSaving] = React.useState(false);
  const [cmsBaseUrl, setCmsBaseUrl] = React.useState("");
  const [cmsUser, setCmsUser] = React.useState("");
  const [cmsPassword, setCmsPassword] = React.useState("");
  const [cmsTtl, setCmsTtl] = React.useState(300);
  const [cmsActive, setCmsActive] = React.useState(true);
  const [cmsHasSecret, setCmsHasSecret] = React.useState(false);

  const [domainsOpen, setDomainsOpen] = React.useState(false);
  const [domainsLoading, setDomainsLoading] = React.useState(false);
  const [domainsSaving, setDomainsSaving] = React.useState(false);
  const [domains, setDomains] = React.useState<
    Array<{
      id: number;
      hostname: string;
      status: string;
      verified_at: string | null;
      txt_record_fqdn: string;
      txt_record_host: string;
      txt_record_value: string | null;
    }>
  >([]);
  const [newHostname, setNewHostname] = React.useState("");

  const orgSlug = site.organization?.slug ?? "";

  React.useEffect(() => {
    setBlogShellSelection(
      site.blog_post_shell_site_page_id != null ? String(site.blog_post_shell_site_page_id) : "none"
    );
  }, [site.id, site.blog_post_shell_site_page_id]);

  React.useEffect(() => {
    setData(normalizeDoc(editingPage.puck_document ?? undefined));
    setSitePublished(site.is_published);
    setPagePublished(editingPage.is_published);
    setPuckMountKey((k) => k + 1);
  }, [site.id, editingPage.id, editingPage.puck_document, editingPage.is_published, site.is_published]);

  const puckHeaderTitle =
    editingPage.path === "/"
      ? "Home"
      : (editingPage.title?.trim() || editingPage.path.replace(/^\//, "") || "Page");

  const pageLabel = (p: DepartmentSiteEditorHomePage) =>
    p.path === "/" ? "Home" : p.title?.trim() || p.path;

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
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadCms = React.useCallback(async () => {
    setCmsLoading(true);
    try {
      const res = await axiosClient.get(`/admin/landing-page/sites/${site.id}/cms-connection`);
      if (!res.data?.success) return;
      const row = res.data.data;
      if (!row) {
        setCmsBaseUrl("");
        setCmsUser("");
        setCmsPassword("");
        setCmsTtl(300);
        setCmsActive(true);
        setCmsHasSecret(false);
        return;
      }
      setCmsBaseUrl(row.base_url ?? "");
      setCmsUser(row.auth_username ?? "");
      setCmsPassword("");
      setCmsTtl(Number(row.cache_ttl_seconds) || 300);
      setCmsActive(row.is_active !== false);
      setCmsHasSecret(!!row.has_application_password);
    } catch {
      showToast("Could not load CMS settings", "error");
    } finally {
      setCmsLoading(false);
    }
  }, [site.id]);

  React.useEffect(() => {
    if (cmsOpen) void loadCms();
  }, [cmsOpen, loadCms]);

  const loadDomains = React.useCallback(async () => {
    setDomainsLoading(true);
    try {
      const res = await axiosClient.get(`/admin/landing-page/sites/${site.id}/domains`);
      if (!res.data?.success) return;
      const raw = res.data.data;
      setDomains(Array.isArray(raw) ? raw : []);
    } catch {
      showToast("Could not load custom domains", "error");
    } finally {
      setDomainsLoading(false);
    }
  }, [site.id]);

  React.useEffect(() => {
    if (domainsOpen) void loadDomains();
  }, [domainsOpen, loadDomains]);

  const addDomain = async () => {
    const h = newHostname.trim().toLowerCase();
    if (!h) {
      showToast("Enter a hostname", "error");
      return;
    }
    setDomainsSaving(true);
    try {
      await axiosClient.post(`/admin/landing-page/sites/${site.id}/domains`, { hostname: h });
      showToast("Domain added — add the TXT record, then verify.", "success");
      setNewHostname("");
      await loadDomains();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg || "Failed to add domain", "error");
    } finally {
      setDomainsSaving(false);
    }
  };

  const verifyDomain = async (domainId: number) => {
    setDomainsSaving(true);
    try {
      await axiosClient.post(`/admin/landing-page/sites/${site.id}/domains/${domainId}/verify`);
      showToast("Domain verified", "success");
      await loadDomains();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg || "Verification failed", "error");
    } finally {
      setDomainsSaving(false);
    }
  };

  const removeDomain = async (domainId: number) => {
    setDomainsSaving(true);
    try {
      await axiosClient.delete(`/admin/landing-page/sites/${site.id}/domains/${domainId}`);
      showToast("Domain removed", "success");
      await loadDomains();
    } catch {
      showToast("Failed to remove domain", "error");
    } finally {
      setDomainsSaving(false);
    }
  };

  const saveCms = async () => {
    setCmsSaving(true);
    try {
      await axiosClient.put(`/admin/landing-page/sites/${site.id}/cms-connection`, {
        base_url: cmsBaseUrl.trim(),
        auth_username: cmsUser.trim() || undefined,
        auth_application_password: cmsPassword.trim() || undefined,
        cache_ttl_seconds: cmsTtl,
        is_active: cmsActive,
      });
      showToast("CMS connection saved", "success");
      setCmsPassword("");
      await loadCms();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg || "Failed to save CMS connection", "error");
    } finally {
      setCmsSaving(false);
    }
  };

  const removeCms = async () => {
    setCmsSaving(true);
    try {
      await axiosClient.delete(`/admin/landing-page/sites/${site.id}/cms-connection`);
      showToast("CMS connection removed", "success");
      await loadCms();
    } catch {
      showToast("Failed to remove CMS connection", "error");
    } finally {
      setCmsSaving(false);
    }
  };

  const savePage = async (doc: Record<string, unknown>) => {
    setSaving(true);
    try {
      await axiosClient.put(`/admin/landing-page/sites/${site.id}/pages/${editingPage.id}`, {
        puck_document: doc,
        is_published: pagePublished,
      });
      showToast("Page saved", "success");
      onRefresh?.();
    } catch {
      showToast("Failed to save page", "error");
    } finally {
      setSaving(false);
    }
  };

  const savePublishFlags = async () => {
    setSaving(true);
    try {
      await axiosClient.put(`/admin/landing-page/sites/${site.id}`, {
        is_published: sitePublished,
      });
      await axiosClient.put(`/admin/landing-page/sites/${site.id}/pages/${editingPage.id}`, {
        is_published: pagePublished,
      });
      showToast("Publish settings updated", "success");
      onRefresh?.();
    } catch {
      showToast("Failed to update publish settings", "error");
    } finally {
      setSaving(false);
    }
  };

  const persistBlogShell = async (value: string) => {
    setBlogShellSelection(value);
    setShellWorking(true);
    try {
      const payload =
        value === "none"
          ? { blog_post_shell_site_page_id: null }
          : { blog_post_shell_site_page_id: Number(value) };
      await axiosClient.put(`/admin/landing-page/sites/${site.id}`, payload);
      showToast("Blog layout updated", "success");
      onRefresh?.();
    } catch (e: unknown) {
      const revert = site.blog_post_shell_site_page_id;
      setBlogShellSelection(revert != null ? String(revert) : "none");
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg || "Could not save blog layout", "error");
    } finally {
      setShellWorking(false);
    }
  };

  const createBlogLayoutPage = async () => {
    setShellWorking(true);
    try {
      const res = await axiosClient.post(`/admin/landing-page/sites/${site.id}/pages`, {
        path: "/_blog",
        title: "Blog post layout",
        is_published: true,
        puck_document: createBlogShellStarterDocument(),
      });
      if (!res.data?.success) {
        showToast(res.data?.message || "Could not create page", "error");
        return;
      }
      const newPage = res.data.data as { id: number };
      await axiosClient.put(`/admin/landing-page/sites/${site.id}`, {
        blog_post_shell_site_page_id: newPage.id,
      });
      showToast("Blog layout page created — add nav/footer around the post slot, then Save.", "success");
      setEditingPageId(newPage.id);
      onRefresh?.();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg || "Could not create layout page (path /_blog may already exist).", "error");
    } finally {
      setShellWorking(false);
    }
  };

  const publicUrl =
    typeof window !== "undefined" && orgSlug
      ? `${window.location.origin}/sites/${encodeURIComponent(orgSlug)}/${encodeURIComponent(site.slug)}`
      : null;

  const resetCanvasToEmpty = React.useCallback(() => {
    const empty = sanitizePuckDataForEngageConfig(defaultEngagePuckData() as Record<string, unknown>);
    setData(empty);
    setPuckMountKey((k) => k + 1);
    showToast("Canvas reset to a blank page (not saved yet).", "success");
  }, []);

  return (
    <VisualEditorLayout>
      <header className="flex h-11 shrink-0 flex-wrap items-center gap-2 border-b border-border bg-background px-2 sm:px-3">
        <Button variant="ghost" size="sm" asChild className="h-8 gap-1.5 px-2 text-muted-foreground">
          <Link href="/landing-pages/department-site">
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Department site</span>
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <span className="max-w-[200px] truncate text-sm font-medium">{site.name || site.slug}</span>
        <div className="flex flex-1" />
        {publicUrl ? (
          <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
            <a href={publicUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              View live
            </a>
          </Button>
        ) : null}
        <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setDomainsOpen(true)}>
          <Globe className="h-3.5 w-3.5" />
          Domains
        </Button>
        <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setCmsOpen(true)}>
          <Database className="h-3.5 w-3.5" />
          CMS
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1 text-destructive hover:text-destructive">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset canvas
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset the entire canvas?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes all blocks from the current page and restores an empty layout. Use this if the editor is
                stuck or you want to start over. Click Save afterward to persist, or you can reload without saving to undo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={resetCanvasToEmpty}
              >
                Reset canvas
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button
          type="button"
          size="sm"
          className="h-8"
          variant="secondary"
          disabled={saving}
          onClick={() => savePage(data)}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
        <div className="flex h-auto min-h-10 shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border bg-muted/30 px-3 py-2">
          <div className="flex items-center gap-2">
            <Switch
              id="dept-site-pub"
              checked={sitePublished}
              onCheckedChange={(v) => setSitePublished(v)}
            />
            <Label htmlFor="dept-site-pub" className="text-xs text-muted-foreground">
              Site live
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="dept-page-pub"
              checked={pagePublished}
              onCheckedChange={(v) => setPagePublished(v)}
            />
            <Label htmlFor="dept-page-pub" className="text-xs text-muted-foreground">
              This page live
            </Label>
          </div>
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs" disabled={saving} onClick={() => void savePublishFlags()}>
            Apply publish
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-xs text-muted-foreground">Editing</Label>
            <Select
              value={String(editingPageId)}
              onValueChange={(v) => setEditingPageId(Number(v))}
              disabled={saving}
            >
              <SelectTrigger size="sm" className="h-8 min-w-[140px] max-w-[220px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pagesList.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {pageLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-xs text-muted-foreground">Blog post layout</Label>
            <Select value={blogShellSelection} onValueChange={(v) => void persistBlogShell(v)} disabled={shellWorking}>
              <SelectTrigger size="sm" className="h-8 min-w-[160px] max-w-[240px] text-xs">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Default (article only)</SelectItem>
                {pagesList.map((p) => (
                  <SelectItem key={`shell-${p.id}`} value={String(p.id)}>
                    {pageLabel(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              disabled={shellWorking}
              onClick={() => void createBlogLayoutPage()}
            >
              {shellWorking ? "Working…" : "Create layout page"}
            </Button>
          </div>
          {!orgSlug ? (
            <span className="text-xs text-amber-700 dark:text-amber-400">
              Set an organization slug to use public URLs.
            </span>
          ) : null}
        </div>

        <PuckBindingProvider sectionFields={sectionFieldOptions}>
          <PuckWebsiteMediaProvider
            listUrl={`/admin/landing-page/sites/${site.id}/website-media`}
            uploadUrl={`/admin/landing-page/sites/${site.id}/website-media`}
          >
            {orgSlug ? (
              <SiteRuntimeProvider orgSlug={orgSlug} siteSlug={site.slug}>
                <div key={puckMountKey} className="puck-studio-root min-h-0 flex-1 overflow-hidden">
                  <PuckEditorWithVariantPicker
                    PuckComponent={Puck}
                    config={engagePuckConfig}
                    data={data}
                    overrides={mergedStudioOverrides}
                    onChange={(next) => setData(next as Record<string, unknown>)}
                    onPublish={async (next) => {
                      setData(next as Record<string, unknown>);
                      await savePage(next as Record<string, unknown>);
                    }}
                    headerTitle={puckHeaderTitle}
                  />
                </div>
              </SiteRuntimeProvider>
            ) : (
              <div key={puckMountKey} className="puck-studio-root min-h-0 flex-1 overflow-hidden">
                <PuckEditorWithVariantPicker
                  PuckComponent={Puck}
                  config={engagePuckConfig}
                  data={data}
                  overrides={mergedStudioOverrides}
                  onChange={(next) => setData(next as Record<string, unknown>)}
                  onPublish={async (next) => {
                    setData(next as Record<string, unknown>);
                    await savePage(next as Record<string, unknown>);
                  }}
                  headerTitle={puckHeaderTitle}
                />
              </div>
            )}
          </PuckWebsiteMediaProvider>
        </PuckBindingProvider>
      </div>

      <Sheet open={domainsOpen} onOpenChange={setDomainsOpen}>
        <SheetContent side="right" className="flex w-full flex-col overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Custom domains</SheetTitle>
            <SheetDescription>
              Connect a hostname to this site so visitors see your domain in the address bar. Follow the steps below end
              to end.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4 px-1 pb-8">
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              <p className="mb-2 font-medium text-foreground">How to go live</p>
              <ol className="list-decimal space-y-2 pl-4">
                <li>
                  <span className="text-foreground">Verify ownership:</span> add the hostname below, create the{" "}
                  <strong className="font-medium text-foreground">TXT</strong> record we show (name{" "}
                  <code className="rounded bg-muted px-1 py-px text-xs">_engage-verify</code> under your domain), wait for
                  DNS, then <strong className="font-medium text-foreground">Verify DNS</strong>. TXT is only for proof — it
                  does not send web traffic.
                </li>
                <li>
                  <span className="text-foreground">Publish this site:</span> turn on <strong className="font-medium text-foreground">Site live</strong>{" "}
                  and <strong className="font-medium text-foreground">This page live</strong> for each page you need, then click{" "}
                  <strong className="font-medium text-foreground">Apply publish</strong>. Unpublished sites do not load on
                  custom domains.
                </li>
                <li>
                  <span className="text-foreground">Send traffic to your app:</span> in DNS, add{" "}
                  <strong className="font-medium text-foreground">CNAME</strong> or <strong className="font-medium text-foreground">A</strong>{" "}
                  records pointing your hostname to your web host (e.g. Vercel’s target). Use the values from your host’s
                  “Add domain” instructions — separate from the TXT record.
                </li>
                <li>
                  <span className="text-foreground">Enable HTTPS:</span> add the same hostname in your host’s dashboard
                  (e.g. Vercel <span className="text-foreground">Settings → Domains</span>) so they issue a certificate.
                </li>
                <li>
                  <span className="text-foreground">Deployment settings (your team):</span> the Next.js app needs{" "}
                  <code className="rounded bg-muted px-1 py-px text-xs">NEXT_PUBLIC_API_URL</code> pointing at this API,
                  and <code className="rounded bg-muted px-1 py-px text-xs">NEXT_PUBLIC_PRIMARY_APP_HOSTS</code> listing
                  your main app hostnames (not customer domains) so the dashboard URL is not treated as a microsite.
                </li>
              </ol>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-domain-host">Hostname</Label>
              <Input
                id="new-domain-host"
                placeholder="www.example.com"
                value={newHostname}
                onChange={(e) => setNewHostname(e.target.value)}
                autoComplete="off"
              />
              <Button type="button" size="sm" disabled={domainsSaving} onClick={() => void addDomain()}>
                {domainsSaving ? "Saving…" : "Add domain"}
              </Button>
            </div>
            {domainsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : domains.length === 0 ? (
              <p className="text-sm text-muted-foreground">No custom domains yet.</p>
            ) : (
              <ul className="space-y-4">
                {domains.map((d) => (
                  <li key={d.id} className="rounded-md border border-border p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{d.hostname}</span>
                      <span className="text-xs text-muted-foreground capitalize">{d.status}</span>
                    </div>
                    {d.verified_at ? (
                      <div className="mt-2 space-y-2 rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">Verified — finish going live</p>
                        <ul className="list-disc space-y-1 pl-4">
                          <li>
                            Publish: <strong className="text-foreground">Site live</strong> +{" "}
                            <strong className="text-foreground">Apply publish</strong> above.
                          </li>
                          <li>
                            DNS: point this hostname to your web host with CNAME/A (not the TXT record).
                          </li>
                          <li>Add this hostname in your host’s domain/SSL settings for HTTPS.</li>
                        </ul>
                        {!sitePublished ? (
                          <p className="pt-1 text-amber-800 dark:text-amber-200">
                            This site is not published yet — turn on Site live and Apply publish.
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <p>
                          <span className="font-medium text-foreground">TXT</span> name/host:{" "}
                          <code className="rounded bg-muted px-1 py-0.5">{d.txt_record_host}</code> (under{" "}
                          <code className="rounded bg-muted px-1 py-0.5">{d.hostname}</code>)
                        </p>
                        <p>
                          Full record: <code className="break-all rounded bg-muted px-1 py-0.5">{d.txt_record_fqdn}</code>
                        </p>
                        {d.txt_record_value ? (
                          <p className="break-all">
                            Value: <code className="rounded bg-muted px-1 py-0.5">{d.txt_record_value}</code>
                          </p>
                        ) : null}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {!d.verified_at ? (
                        <Button type="button" size="sm" variant="secondary" disabled={domainsSaving} onClick={() => void verifyDomain(d.id)}>
                          Verify DNS
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        disabled={domainsSaving}
                        onClick={() => void removeDomain(d.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={cmsOpen} onOpenChange={setCmsOpen}>
        <SheetContent side="right" className="flex w-full flex-col overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>WordPress (REST API)</SheetTitle>
            <SheetDescription>
              Posts are fetched server-side and cached. Use an{" "}
              <a
                className="font-medium text-foreground underline underline-offset-2"
                href="https://make.wordpress.org/core/2020/11/05/application-passwords-integration-in-wordpress-5-6/"
                target="_blank"
                rel="noreferrer"
              >
                application password
              </a>{" "}
              if the site is not public-read.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4 px-1 pb-8">
            {cmsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cms-base">Site base URL</Label>
                  <Input
                    id="cms-base"
                    placeholder="https://blog.example.com"
                    value={cmsBaseUrl}
                    onChange={(e) => setCmsBaseUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cms-user">WordPress username (optional)</Label>
                  <Input id="cms-user" value={cmsUser} onChange={(e) => setCmsUser(e.target.value)} autoComplete="off" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cms-pass">Application password</Label>
                  <Input
                    id="cms-pass"
                    type="password"
                    placeholder={cmsHasSecret ? "•••••••• (leave blank to keep)" : ""}
                    value={cmsPassword}
                    onChange={(e) => setCmsPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cms-ttl">Cache TTL (seconds)</Label>
                  <Input
                    id="cms-ttl"
                    type="number"
                    min={30}
                    max={86400}
                    value={cmsTtl}
                    onChange={(e) => setCmsTtl(Number(e.target.value) || 300)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="cms-active" checked={cmsActive} onCheckedChange={setCmsActive} />
                  <Label htmlFor="cms-active" className="text-sm">
                    Connection active
                  </Label>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button type="button" disabled={cmsSaving} onClick={() => void saveCms()}>
                    {cmsSaving ? "Saving…" : "Save connection"}
                  </Button>
                  <Button type="button" variant="outline" className="text-destructive" disabled={cmsSaving} onClick={() => void removeCms()}>
                    Remove
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </VisualEditorLayout>
  );
}
