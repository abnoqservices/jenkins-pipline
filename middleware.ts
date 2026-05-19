import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function parseHostList(raw: string | undefined): string[] {
  return (raw || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * App routes that must not be rewritten to a department microsite when the Host is a custom domain.
 */
const APP_PATH_PREFIXES = [
  "/api",
  "/_next",
  "/favicon.ico",
  "/signin",
  "/signup",
  "/dashboard",
  "/select-department",
  "/landing-pages",
  "/products",
  "/departments",
  "/forms",
  "/events",
  "/settings",
  "/account-setup",
  "/integrations",
  "/billing",
  "/customers",
  "/catalogs",
  "/campaigns",
  "/analytics",
  "/workflows",
  "/offers",
  "/scan",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/plans",
  "/invitations",
  "/global-landing-page",
  "/form-builder",
  "/auth",
] as const;

function shouldSkipPath(pathname: string): boolean {
  if (pathname.startsWith("/sites/")) return true;
  for (const p of APP_PATH_PREFIXES) {
    if (pathname === p || pathname.startsWith(`${p}/`)) return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() || "";

  const primary = parseHostList(
    process.env.NEXT_PUBLIC_PRIMARY_APP_HOSTS || "localhost,127.0.0.1"
  );

  if (!host || primary.includes(host)) {
    return NextResponse.next();
  }

  if (host.endsWith(".vercel.app")) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  if (shouldSkipPath(pathname)) {
    return NextResponse.next();
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  if (!apiBase) {
    return NextResponse.next();
  }

  try {
    const resolveUrl = `${apiBase}/public/domains/resolve?host=${encodeURIComponent(host)}`;
    const res = await fetch(resolveUrl, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.next();
    }
    const json = (await res.json()) as {
      success?: boolean;
      data?: { organization_slug?: string; site_slug?: string };
    };
    if (!json.success || !json.data?.organization_slug || !json.data?.site_slug) {
      return NextResponse.next();
    }
    const { organization_slug, site_slug } = json.data;
    const suffix = pathname === "/" ? "" : pathname;
    const dest = `/sites/${encodeURIComponent(organization_slug)}/${encodeURIComponent(site_slug)}${suffix}`;
    return NextResponse.rewrite(new URL(dest, request.url));
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
