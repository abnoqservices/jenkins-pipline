"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import axiosClient from "@/lib/axiosClient";
import Preview from "@/app/(preview)/dummuypreview/page";

const PuckPublicRender = dynamic(
  () => import("@/components/landing/PuckPublicRender").then((m) => m.PuckPublicRender),
  { ssr: false }
);

export default function LandingPageClient({ slug,orgSlug }) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [payload, setPayload] = React.useState(null);
  const [productId, setproductId] = React.useState(null);
  const [puckDocument, setPuckDocument] = React.useState(null);
  React.useEffect(() => {

    // if (!slug || isNaN(slug)) {
    //   setIsLoading(false);
    //   return;
    // }

    const fetchPreviewData = async () => {
      try {
        setIsLoading(true);

        const res = await axiosClient.get(`public/products/${orgSlug}/${slug}/landing-page`);
        const data = res.data?.data;
        const puckDoc = data?.puck_document;
        const hasPuckBlocks =
          puckDoc &&
          Array.isArray(puckDoc.content) &&
          puckDoc.content.length > 0;
        if (res.data?.success && hasPuckBlocks) {
          setproductId(data?.product_id);
          setPuckDocument(puckDoc);
          setPayload(null);
          setIsLoading(false);
          return;
        }
        if (res.data?.success && res.data?.data?.sections?.length > 0) {
          setPuckDocument(null);
          setproductId(res.data?.data?.product_id);
          const activeSections = res.data.data.sections
            .filter((sec) => sec.is_published)
            .sort((a, b) => a.sort_order - b.sort_order);

          // Extract styles from customize_webpage section only if it exists AND is published
          const customizeSection = activeSections.find((sec) => 
            sec.global_section.key === 'customize_webpage' && sec.is_published
          );
          const customStyles = customizeSection?.content || {};

          // Get department logo from response
          const departmentLogoUrl = res.data?.data?.department?.logo_url || null;

          setPayload({
            templateName: "modern",
            sections: activeSections
              .filter((sec) => sec.global_section.key !== 'customize_webpage') // Exclude customize section from rendering
              .map((sec) => {
                const content = sec.content ?? {};
                // Add department logo to brand_header sections by default
                if (sec.global_section.key === 'brand_header' && departmentLogoUrl && !content.logo_url) {
                  content.logo_url = departmentLogoUrl;
                }
                return {
                  section: sec.global_section.key,
                  content: content,
                };
              }),
            styles: {
              primaryColor: customStyles.primary_text_color || "#000000",
              backgroundColor: customStyles.background_color || "#FFFFFF",
              textColor: customStyles.primary_text_color || "#000000",
              secondaryTextColor: customStyles.secondary_text_color || "#666666",
              accentColor: customStyles.accent_color || "#007BFF",
              linkColor: customStyles.link_color || "#007BFF",
              buttonBackgroundColor: customStyles.button_background_color || "#007BFF",
              buttonTextColor: customStyles.button_text_color || "#FFFFFF",
              headlineSize: 28,
              paragraphSize: 16,
            },
          });
        } else {
          setPuckDocument(null);
          // No published sections
          setPayload({
            templateName: "modern",
            sections: [
              {
                section: "hero",
                content: {
                  title: "No Sections Published",
                  subtitle: "Enable sections in the builder to see them here.",
                },
              },
            ],
            styles: {
              primaryColor: "#ecedf4ff",
              backgroundColor: "#000000",
              textColor: "#a97d38",
              headlineSize: 28,
              paragraphSize: 16,
            },
          });
        }
      } catch (error) {
        // Only log non-404 errors (404 is expected if product doesn't exist)
        if (error?.response?.status !== 404) {
          console.error("Error fetching landing page data:", error);
        }

        setPuckDocument(null);
        setPayload({
          templateName: "modern",
          sections: [
            {
              section: "hero",
              content: {
                title: error?.response?.status === 404 
                  ? "Product Not Found" 
                  : "Error Loading Preview",
                subtitle: error?.response?.status === 404
                  ? `The product "${slug}" was not found or is not published.`
                  : "Something went wrong. Please try again later.",
              },
            },
          ],
          styles: {
            primaryColor: "#ecedf4ff",
            backgroundColor: "#000000",
            textColor: "#a97d38",
            headlineSize: 28,
            paragraphSize: 16,
          },
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreviewData();
  }, [slug, orgSlug]);


  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-gray-600" />
      </div>
    );
  }


  if (puckDocument) {
    return <PuckPublicRender document={puckDocument} />;
  }

  if (!payload) {
    return (
      <div className="p-8 text-center text-gray-600">
        No preview data available.
      </div>
    );
  }

  return <Preview data={payload} productId={productId}  />;
}