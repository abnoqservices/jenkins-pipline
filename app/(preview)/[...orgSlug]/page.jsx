import LandingPageClient from "./LandingPageClients";
export default async function Page({ params }) {
  const resolvedParams = await params;

  const segments = resolvedParams.orgSlug || [];

  const [slug1, slug2, slug3] = segments;

  return <LandingPageClient slug={slug2} orgSlug={slug1} />;
}