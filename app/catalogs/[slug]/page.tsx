"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  CatalogDesignPreview,
  CatalogPreviewData,
} from "@/components/catalog/catalog-design-preview"

const fallbackCatalog: CatalogPreviewData = {
  catalogName: "Product Catalog",
  customerName: "Rahul Sharma",
  brandName: "Brand Name",
  tagline: "2026 Collection",
  description: "Premium products",
  phone: "+91 87654 32109",
  email: "info@brandname.com",
  address: "123, Furniture Market, Gomti Nagar, Lucknow, Uttar Pradesh 226010",
  sections: [
    { id: "s1", type: "cover", title: "Cover Page" },
    { id: "s2", type: "welcome", title: "Welcome" },
    { id: "s3", type: "toc", title: "Table of Content" },
    { id: "s4", type: "new_products", title: "New Arrivals" },
    { id: "s5", type: "products", title: "Best Sellers" },
    { id: "s6", type: "special_products", title: "Special Offers" },
    { id: "s7", type: "related_products", title: "Related Models" },
    { id: "s8", type: "about", title: "Our Vision & Mission" },
    { id: "s9", type: "contact", title: "Get In Touch" },
  ],
  products: [
    {
      id: 1,
      name: "Ergonomic Office Chair",
      image: "https://picsum.photos/id/20/800/800",
      category: "Office Furniture",
      price: 249.99,
      sku: "FUR-001",
      description: "Premium quality modern design with lumbar support.",
      isNew: true,
      isBestSeller: true,
      relatedTo: ["Office Furniture"],
      scanCount: 72,
    },
    {
      id: 2,
      name: "Luxury Armchair",
      image: "https://picsum.photos/id/64/800/800",
      category: "Living Room",
      price: 549.99,
      sku: "FUR-002",
      description: "Elegant and comfortable seating.",
      isSpecial: true,
      relatedTo: ["Living Room"],
      scanCount: 49,
    },
  ],
  design: {
    pageSize: "a4",
    orientation: "portrait",
    productsPerPage: "4",
    template: "modern",
    primaryColor: "#ca8a04",
    secondaryColor: "#92400e",
    showPrice: true,
    showSKU: true,
    showDescription: true,
    showSpecs: false,
    showQR: true,
  },
}

const decodeCatalog = (value: string | null): CatalogPreviewData => {
  if (!value) return fallbackCatalog

  try {
    return JSON.parse(decodeURIComponent(atob(value))) as CatalogPreviewData
  } catch {
    return fallbackCatalog
  }
}

function CatalogPreviewContent() {
  const searchParams = useSearchParams()
  const catalog = React.useMemo(() => decodeCatalog(searchParams.get("data")), [searchParams])

  const copyCurrentLink = async () => {
    await navigator.clipboard.writeText(window.location.href)
  }

  return (
    <div>
      <div className="bg-gray-100 px-4 pt-6">
        <div className="mx-auto max-w-6xl">
          <Link href="/catalogs/new">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Builder
            </Button>
          </Link>
        </div>
      </div>
      <CatalogDesignPreview data={catalog} onShare={copyCurrentLink} onDownload={() => window.print()} />
    </div>
  )
}

export default function CatalogPreviewPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading catalog...</div>}>
      <CatalogPreviewContent />
    </React.Suspense>
  )
}
