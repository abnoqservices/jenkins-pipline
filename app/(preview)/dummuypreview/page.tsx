"use client";
export const dynamic = "force-dynamic";

import React from "react";
import nextDynamic from "next/dynamic"; 
import { Skeleton } from "@/components/ui/skeleton";

const Template1 = nextDynamic(() => import("@/components/Template1"), {
  ssr: true,
  loading: () => null,
});

const Template2 = nextDynamic(() => import("@/components/Template2"), {
  ssr: true,
  loading: () => null,
});


interface PreviewData {
  templateName: string;
  sections?: any[];
  [key: string]: any;
}

interface PreviewProps {
  data?: PreviewData; 
  productId?: number;
}

function Preview({ data, productId }: PreviewProps) {
  const [localLoading, setLocalLoading] = React.useState(false);

 
  if (!data) {
    return <div>No preview data found</div>;
  }

  const getTemplateComponent = (type: string) => {
    switch (type) {
      case "modern":
        return Template1;
      case "minimal":
        return Template1;
        case "bold":
          return Template1;
          case "classic":
          return Template1;
          case "Pro":
          return Template1;
      default:
        return null;
    }
  };

  const ContentComponent = React.useMemo(() => getTemplateComponent(data?.templateName || ""),[data?.templateName]
  );

  React.useEffect(() => {
    setLocalLoading(true);
    const t = setTimeout(() => setLocalLoading(false), 300);
    return () => clearTimeout(t);
  }, [data]);

  return (
    <div className="relative">
     
      {localLoading && (
        <div className="relative min-h-screen bg-background">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="rounded-2xl p-8 shadow-1xl animate-pulse">
              <img
                src="https://media.geeksforgeeks.org/wp-content/uploads/20210511160843/gfgQR.png"
                alt="Company Logo"
                className="h-16 w-16 object-contain"
              />
            </div>
          </div>

         
          <div className="max-w-md mx-auto px-4 py-6 space-y-6">
  {/* Hero Section */}
  <div className="space-y-4">
    <Skeleton className="h-6 w-3/4" />   {/* Title */}
    <Skeleton className="h-4 w-full" />  {/* Subtitle */}
    <Skeleton className="h-4 w-5/6" />
    <Skeleton className="h-10 w-full rounded-lg" /> {/* CTA */}
  </div>

  {/* Image / Banner */}
  <Skeleton className="h-48 w-full rounded-xl" />

  {/* Feature Cards */}
  {[1, 2, 3].map((_, i) => (
    <div
      key={i}
      className="p-4 rounded-xl border bg-white space-y-3"
    >
      <Skeleton className="h-5 w-1/2" />     {/* Card title */}
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-9 w-full rounded-md" /> {/* Button */}
    </div>
  ))}
</div>

        </div>
      )}

  
      {ContentComponent ? (
        <ContentComponent data={data} productId={productId}  />
      ) : (
        <div>No template selected</div>
      )}
    </div>
  );
};

export default React.memo(Preview);
