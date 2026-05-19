import { notFound } from "next/navigation";
import { LandingPreviewViewer } from "@/components/landing/LandingPreviewViewer";
import { PREBUILT_PUCK_TEMPLATE_LIBRARY } from "@/lib/puck/prebuilt-puck-template-library";

export default async function PrebuiltTemplatePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = PREBUILT_PUCK_TEMPLATE_LIBRARY.find((t) => t.id === id);
  if (!item) notFound();

  return (
    <LandingPreviewViewer
      name={item.name}
      description={item.description}
      document={item.puck_document}
      backHref="/landing-pages/templates/library"
      backLabel="Back to library"
    />
  );
}
