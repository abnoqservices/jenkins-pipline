"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, LayoutTemplate, Library, PanelsTopLeft } from "lucide-react";

export default function LandingPagesHubPage() {
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
        <div>
          <h1 className="text-2xl font-bold">Landing pages</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build reusable layouts in the <strong>library</strong>, then wire them to <strong>global</strong>,{" "}
            <strong>categories</strong>, and <strong>tags</strong> on the assignments page. From the product
            list, <strong>Landing Page</strong> opens the live preview in a new tab; edit a specific product layout at{" "}
            <code className="text-xs bg-muted px-1 rounded">/products/&lt;id&gt;/landing-page</code>.
          </p>
        </div>

        <div className="grid gap-4">
          <Link
            href="/landing-pages/department-site"
            className="block rounded-lg transition-colors hover:bg-muted/50"
          >
            <Card className="h-full border-2 border-emerald-500/20 hover:border-emerald-500/35">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-400">
                  <Globe className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Department website</CardTitle>
                  <CardDescription className="mt-2 text-sm leading-relaxed">
                    Build a multi-page-ready site for the <strong>current department</strong> with Puck. Public home
                    lives at <code className="text-xs">/sites/{"{orgSlug}"}/{"{siteSlug}"}</code> when published.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/landing-pages/templates/library" className="block rounded-lg transition-colors hover:bg-muted/50">
            <Card className="h-full border-2 border-primary/20 hover:border-primary/35">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Library className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Template library</CardTitle>
                  <CardDescription className="mt-2 text-sm leading-relaxed">
                    Create and edit all Puck layouts here with drag-and-drop blocks, field bindings (static vs
                    product/section data), and the AI assistant.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link
            href="/landing-pages/templates/assignments"
            className="block rounded-lg transition-colors hover:bg-muted/50"
          >
            <Card className="h-full border-2 border-primary/15 hover:border-primary/30">
              <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <LayoutTemplate className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-lg">Assignments</CardTitle>
                  <CardDescription className="mt-2 text-sm leading-relaxed">
                    Choose which library template applies globally, per product category, and per product tag — and
                    see every current assignment in one place.
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>

        <Card className="border-dashed">
          <CardHeader className="flex flex-row items-start gap-4 space-y-0">
            <PanelsTopLeft className="h-6 w-6 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <CardTitle className="text-base">Legacy: department section library</CardTitle>
              <CardDescription className="mt-2">
                Defines global sections and field keys used in dynamic bindings.
              </CardDescription>
              <Link
                href="/global-landing-page"
                className="text-sm font-medium text-primary underline underline-offset-4 mt-3 inline-block"
              >
                Open global landing page builder
              </Link>
            </div>
          </CardHeader>
        </Card>
      </div>
    </DashboardLayout>
  );
}
