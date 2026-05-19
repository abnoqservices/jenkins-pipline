// app/preview/[slug]/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import axiosClient from "@/lib/axiosClient";

export const metadata: Metadata = {
  title: "Landing Page Preview",
  description: "Preview your landing page design",
  robots: { index: false, follow: false },
};

export default async function PreviewLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgSlug?: string[] }>;
}) {
  const resolvedParams = await params;
  const segments = resolvedParams.orgSlug ?? [];
  const orgSlug = segments[0];
  const productSlug = segments[1];

  // Fetch tracking IDs from your API
  let productId: number | null = null;
  let eventId: number | null = null;
  let boothId: number | null = null;

  try {
    if (orgSlug && productSlug) {
      const res = await axiosClient.get(
        `public/products/${orgSlug}/${productSlug}/landing-page`
      );

      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        productId = data.product_id ?? null;
        eventId = data.event_id ?? null;
        boothId = data.booth_id ?? null;
      }
    }
  } catch (err: any) {
    // Silently handle 404 - product might not exist or not be published yet
    if (err?.response?.status !== 404) {
      console.error("[PreviewLayout] Failed to fetch tracking information:", err);
    }
    // Continue with fallback values
  }

  // Final values with fallback
  const finalProductId = productId ?? null;
  const finalEventId = eventId ?? null;
  const finalBoothId = boothId ?? null;

  console.log("Analytics tracking values:", {
    orgSlug,
    productSlug,
    productId: finalProductId,
    eventId: finalEventId,
    boothId: finalBoothId,
  });

  return (
    <>
      {productSlug && (
        <>
          {/* 1. Load the tracker script */}
          <Script
            src="/landing-page-tracker.js"
            strategy="afterInteractive"
          />

          {/* 2. Safe initialization with retry mechanism */}
          <Script
            id="landing-page-tracker-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function initTracker() {
                  let attempts = 0;
                  const maxAttempts = 40; // ~4 seconds max wait

                  function tryInitialize() {
                    if (typeof LandingPageTracker !== 'undefined') {
                      window.tracker = new LandingPageTracker({
                        slug: "${productSlug}",
                        productId: ${finalProductId !== null ? finalProductId : 'null'},
                        eventId: ${finalEventId !== null ? finalEventId : 'null'},
                        boothId: ${finalBoothId !== null ? finalBoothId : 'null'},
                        apiBaseUrl: "http://127.0.0.1:8000/api" // ← Change to production URL later
                      });

                      console.log("Analytics tracker initialized successfully", {
                        slug: "${productSlug}",
                        productId: ${finalProductId},
                        eventId: ${finalEventId},
                        boothId: ${finalBoothId}
                      });

                      // Optional: for manual debugging in console
                      window.trackerDebug = window.tracker;
                    } 
                    else if (attempts < maxAttempts) {
                      attempts++;
                      console.log("Waiting for tracker script... attempt " + attempts);
                      setTimeout(tryInitialize, 100);
                    } 
                    else {
                      console.error("Failed to initialize LandingPageTracker - class not found");
                    }
                  }

                  // Start when DOM is ready
                  if (document.readyState === 'complete' || document.readyState === 'interactive') {
                    tryInitialize();
                  } else {
                    document.addEventListener('DOMContentLoaded', tryInitialize);
                  }
                })();
              `,
            }}
          />
        </>
      )}

      {children}
    </>
  );
}