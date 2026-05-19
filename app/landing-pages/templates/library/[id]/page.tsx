import { PuckLibraryEditor } from "@/components/landing/PuckLibraryEditor";

export default async function PuckLibraryEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const templateId = id === "new" ? null : Number(id);
  if (templateId !== null && (!Number.isFinite(templateId) || templateId < 1)) {
    return (
      <div className="p-8 text-center text-sm text-destructive">Invalid template id</div>
    );
  }
  return <PuckLibraryEditor templateId={templateId} />;
}
