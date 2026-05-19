"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LandingPreviewViewer } from "@/components/landing/LandingPreviewViewer";
import { consumeLandingPreviewPayload, type LandingPreviewPayload } from "@/lib/landing-preview-handoff";
import { AlertTriangle, Loader2 } from "lucide-react";

function LandingPreviewPageInner() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key") || "";
  const [state, setState] = React.useState<
    | { kind: "loading" }
    | { kind: "ready"; payload: LandingPreviewPayload }
    | { kind: "missing" }
  >({ kind: "loading" });

  React.useEffect(() => {
    if (!key) {
      setState({ kind: "missing" });
      return;
    }
    const payload = consumeLandingPreviewPayload(key);
    setState(payload ? { kind: "ready", payload } : { kind: "missing" });
  }, [key]);

  if (state.kind === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading preview…
      </div>
    );
  }

  if (state.kind === "missing") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="max-w-md space-y-4 rounded-2xl border border-amber-300 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Preview unavailable</h1>
          <p className="text-sm text-slate-600">
            This preview link has expired or was opened directly. Reopen the preview from your editor.
          </p>
          <Button asChild>
            <Link href="/landing-pages/hub">Go to landing pages</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <LandingPreviewViewer
      name={state.payload.name}
      description={state.payload.description}
      document={state.payload.document}
      backHref={state.payload.backHref}
      backLabel={state.payload.backLabel}
      badge={state.payload.badge}
    />
  );
}

export default function LandingPreviewPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading preview…
        </div>
      }
    >
      <LandingPreviewPageInner />
    </React.Suspense>
  );
}
