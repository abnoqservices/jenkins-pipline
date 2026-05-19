

import LandingPageBuilder from "@/app/landing-pages/new/page";

export default async function ProductLandingPage({ params }) {
  const { slug } = await params;

  console.log("Slug from URL:", slug);


  if (!slug) {
    return (
      <main className="flex h-screen items-center justify-center flex-col text-center px-4">
        <h1 className="text-2xl font-bold text-red-600">No product specified</h1>
        <p className="mt-4 text-muted-foreground">
          Please visit a URL like <code className="bg-muted px-2 py-1 rounded">/products/32</code>
        </p>
      </main>
    );
  }

  
  const productId = Number(slug);


  if (!isNaN(productId) && productId > 0 && Number.isInteger(productId)) {
    return <LandingPageBuilder productId={productId} />;
  }

 
  return (
    <main className="flex h-screen items-center justify-center flex-col text-center px-4">
      <h1 className="text-2xl font-bold text-red-600">
        Invalid product slug: "{slug}"
      </h1>
      <p className="mt-4 text-muted-foreground">
        Currently only numeric product IDs are supported (e.g. /products/32).
      </p>
    </main>
  );
}