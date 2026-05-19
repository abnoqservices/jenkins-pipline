"use client"

import * as React from "react"
import {
  Download,
  ExternalLink,
  Eye,
  Mail,
  MapPin,
  Phone,
  Scan,
  Share2,
  Target,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export type CatalogProduct = {
  id: number
  name: string
  image: string
  category: string
  price: number
  sku: string
  description: string
  isNew?: boolean
  isBestSeller?: boolean
  isSpecial?: boolean
  relatedTo?: string[]
  scanCount?: number
}

export type CatalogSection = {
  id: string
  type:
    | "cover"
    | "welcome"
    | "toc"
    | "products"
    | "new_products"
    | "special_products"
    | "related_products"
    | "about"
    | "contact"
  title: string
  content?: string
}

export type CatalogDesign = {
  pageSize: string
  orientation: string
  productsPerPage: string
  template: string
  primaryColor: string
  secondaryColor: string
  showPrice: boolean
  showSKU: boolean
  showDescription: boolean
  showSpecs: boolean
  showQR: boolean
}

export type CatalogPreviewData = {
  catalogName: string
  customerName: string
  brandName: string
  tagline: string
  description: string
  phone: string
  email: string
  address: string
  sections: CatalogSection[]
  products: CatalogProduct[]
  design: CatalogDesign
}

type CatalogDesignPreviewProps = {
  data: CatalogPreviewData
  onShare?: () => void
  onDownload?: () => void
  showActions?: boolean
}

const productMatchesSection = (product: CatalogProduct, sectionType: CatalogSection["type"]) => {
  if (sectionType === "new_products") return product.isNew
  if (sectionType === "products") return product.isBestSeller
  if (sectionType === "special_products") return product.isSpecial
  if (sectionType === "related_products") return product.relatedTo && product.relatedTo.length > 0
  return true
}

const getSectionTitle = (type: CatalogSection["type"], title: string) => {
  switch (type) {
    case "new_products":
      return "NEW ARRIVALS"
    case "products":
      return "BEST SELLERS"
    case "special_products":
      return "SPECIAL OFFERS"
    case "related_products":
      return "RELATED MODELS"
    case "about":
      return "OUR VISION & MISSION"
    default:
      return title
  }
}

const getSectionDescription = (type: CatalogSection["type"]) => {
  switch (type) {
    case "new_products":
      return "Discover the latest products scanned and shortlisted for this catalog."
    case "products":
      return "Most demanded products from your selected event and category filters."
    case "special_products":
      return "Limited offers and highlighted products ready for publishing."
    case "related_products":
      return "Similar products that complete the selected customer requirement."
    default:
      return "Premium collection crafted for your customer."
  }
}

export function CatalogDesignPreview({
  data,
  onShare,
  onDownload,
  showActions = true,
}: CatalogDesignPreviewProps) {
  const accent = data.design.primaryColor || "#ca8a04"
  const secondary = data.design.secondaryColor || "#92400e"

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="mx-auto max-w-6xl">
        {showActions && (
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-950">{data.catalogName}</h1>
              <p className="text-sm text-gray-500">Personalized for {data.customerName}</p>
            </div>
            <div className="flex w-full gap-3 sm:w-auto">
              <Button variant="outline" className="flex-1 gap-2 sm:flex-none" onClick={onShare}>
                <Share2 className="h-5 w-5" />
                Share
              </Button>
              <Button className="flex-1 gap-2 sm:flex-none" style={{ backgroundColor: accent }} onClick={onDownload}>
                <Download className="h-5 w-5" />
                Download PDF
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white">
          {data.sections.map((section) => {
            const sectionProducts = data.products.filter((product) => productMatchesSection(product, section.type))
            const visibleProducts = sectionProducts.length > 0 ? sectionProducts : data.products

            return (
              <div key={section.id} className="border-b last:border-none">
                {section.type === "cover" && (
                  <div className="relative flex min-h-[500px] flex-col overflow-hidden text-black md:min-h-[680px] md:flex-row">
                    <div className="relative h-80 flex-1 md:h-auto">
                      <img
                        src={data.products[0]?.image || "/placeholder.svg"}
                        alt="Catalog cover"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-center bg-white p-8 md:p-16">
                      <div className="mb-8 md:mb-12">
                        <div className="mb-6 text-5xl font-black leading-none tracking-normal md:text-7xl">
                          PRODUCT
                          <br />
                          CATALOG
                        </div>
                        <div
                          className="inline-block rounded px-6 py-2 text-xl font-bold text-white md:px-8 md:py-3 md:text-2xl"
                          style={{ backgroundColor: accent }}
                        >
                          {data.tagline}
                        </div>
                      </div>
                      <div className="mt-auto">
                        <div className="mb-4 flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
                            style={{ backgroundColor: "#111827" }}
                          >
                            {data.brandName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xl font-bold tracking-widest md:text-2xl">{data.brandName}</div>
                            <div className="text-sm opacity-75">{data.description || "PREMIUM PRODUCTS"}</div>
                          </div>
                        </div>
                        <p className="text-base md:text-lg">
                          Personalized for <span className="font-semibold">{data.customerName}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {section.type === "welcome" && (
                  <div className="bg-white p-10 text-center md:p-20">
                    <h2 className="mb-6 text-4xl font-bold md:text-6xl" style={{ color: accent }}>
                      WELCOME TO OUR COLLECTION
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg text-gray-700 md:text-2xl">
                      {section.content || "Discover a curated catalog created from scanned event products and category filters."}
                    </p>
                  </div>
                )}

                {section.type === "toc" && (
                  <div className="grid grid-cols-1 gap-10 bg-white p-8 md:grid-cols-2 md:p-20">
                    <div>
                      <div className="mb-10 flex items-center justify-center gap-3">
                        <Scan className="h-8 w-8" style={{ color: accent }} />
                        <h3 className="text-4xl font-bold tracking-normal md:text-5xl" style={{ color: accent }}>
                          TABLE OF CONTENT
                        </h3>
                      </div>
                      <div className="space-y-6 text-lg md:space-y-8 md:text-2xl">
                        {data.sections
                          .filter((item) => item.type !== "cover" && item.type !== "toc")
                          .map((item, index) => (
                            <div key={item.id} className="flex justify-between border-b border-gray-200 pb-4 last:border-none">
                              <span className="font-medium">{getSectionTitle(item.type, item.title)}</span>
                              <span className="font-mono font-semibold" style={{ color: accent }}>
                                {String(index + 1).padStart(2, "0")}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="overflow-hidden rounded-3xl shadow-xl">
                      <img
                        src={data.products[1]?.image || data.products[0]?.image || "/placeholder.svg"}
                        alt="Catalog interior"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {(section.type === "new_products" ||
                  section.type === "products" ||
                  section.type === "special_products" ||
                  section.type === "related_products") && (
                  <div className="bg-white p-8 md:p-16">
                    <div className="mb-4 flex items-center justify-center gap-3">
                      <Scan className="h-8 w-8" style={{ color: accent }} />
                      <h2 className="text-center text-4xl font-bold tracking-normal text-black md:text-5xl">
                        VISITOR SCAN PRODUCT
                      </h2>
                    </div>
                    <p className="mb-4 text-center text-xl text-gray-600">{getSectionDescription(section.type)}</p>
                    <h3 className="mb-12 text-center text-3xl font-semibold md:text-4xl" style={{ color: accent }}>
                      {getSectionTitle(section.type, section.title)}
                    </h3>
                    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-8 lg:grid-cols-4">
                      {visibleProducts.map((product) => (
                        <div key={`${section.id}-${product.id}`} className="group relative text-center">
                          <div className="relative mb-5 aspect-square overflow-hidden rounded-2xl bg-gray-50 shadow-sm">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute right-4 bottom-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
                              <button className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-medium text-black shadow-md transition-colors hover:bg-yellow-600 hover:text-white">
                                View More
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2 px-2">
                            <div className="text-xs uppercase tracking-widest text-gray-500 md:text-sm">{product.category}</div>
                            <h4 className="line-clamp-2 text-lg font-semibold leading-tight md:text-xl">{product.name}</h4>
                            {data.design.showDescription && (
                              <p className="line-clamp-2 text-sm text-gray-600">{product.description}</p>
                            )}
                            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                              {data.design.showPrice && <span className="font-semibold">${product.price.toFixed(2)}</span>}
                              {data.design.showSKU && <span className="text-gray-500">{product.sku}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {section.type === "about" && (
                  <div className="bg-white p-8 md:p-20">
                    <div className="mx-auto max-w-4xl">
                      <div className="mb-16 text-center">
                        <h2 className="mb-6 text-4xl font-bold tracking-normal md:text-5xl" style={{ color: accent }}>
                          ABOUT OUR COMPANY
                        </h2>
                        <p className="mx-auto max-w-3xl text-xl leading-relaxed text-gray-700">
                          {data.brandName} creates carefully curated catalogs from real visitor scans, selected product categories,
                          and customer needs. Every catalog can be saved, reused, shared, and published for a personalized buying journey.
                        </p>
                      </div>
                      <div className="mb-16 text-center">
                        <h2 className="mb-4 text-4xl font-bold tracking-normal md:text-5xl" style={{ color: accent }}>
                          OUR VISION & MISSION
                        </h2>
                        <p className="mx-auto max-w-2xl text-xl text-gray-600">
                          Building product discovery that feels personal, useful, and easy to share.
                        </p>
                      </div>
                      <div className="grid gap-12 md:grid-cols-2 md:gap-16">
                        <div>
                          <div className="mb-6 flex items-center gap-4">
                            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-yellow-100">
                              <Eye className="h-8 w-8" style={{ color: accent }} />
                            </div>
                            <h3 className="text-3xl font-bold text-black">Our Vision</h3>
                          </div>
                          <div className="border-l-4 pl-2 text-lg leading-relaxed text-gray-700" style={{ borderColor: accent }}>
                            To make every product presentation relevant to the customer by using event activity, category choices,
                            and selected products as the heart of the catalog.
                          </div>
                        </div>
                        <div>
                          <div className="mb-6 flex items-center gap-4">
                            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-yellow-100">
                              <Target className="h-8 w-8" style={{ color: accent }} />
                            </div>
                            <h3 className="text-3xl font-bold text-black">Our Mission</h3>
                          </div>
                          <div className="border-l-4 pl-2 text-lg leading-relaxed text-gray-700" style={{ borderColor: accent }}>
                            To help teams generate polished catalogs quickly, publish filtered products, and share a clean preview
                            link with customers after every event.
                          </div>
                        </div>
                      </div>
                      <div className="mt-20 text-center">
                        <p className="mx-auto max-w-2xl text-xl italic text-gray-500">
                          "Personalized catalogs built from what your customers actually explored."
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {section.type === "contact" && (
                  <div
                    className="px-8 py-16 text-white md:px-20 md:py-24"
                    style={{ background: `linear-gradient(135deg, ${accent}, ${secondary})` }}
                  >
                    <div className="mx-auto max-w-3xl text-center">
                      <h3 className="mb-12 text-4xl font-bold md:text-5xl">GET IN TOUCH</h3>
                      <div className="mx-auto max-w-lg space-y-10 text-left">
                        <div className="flex items-start gap-5">
                          <div className="mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20">
                            <Phone className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 text-sm tracking-widest opacity-75">PHONE</div>
                            <a href={`tel:${data.phone}`} className="text-2xl font-medium hover:underline md:text-3xl">
                              {data.phone}
                            </a>
                          </div>
                        </div>
                        <div className="flex items-start gap-5">
                          <div className="mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20">
                            <Mail className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 text-sm tracking-widest opacity-75">EMAIL</div>
                            <a href={`mailto:${data.email}`} className="break-all text-2xl font-medium hover:underline md:text-3xl">
                              {data.email}
                            </a>
                          </div>
                        </div>
                        <div className="flex items-start gap-5">
                          <div className="mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20">
                            <MapPin className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 text-sm tracking-widest opacity-75">ADDRESS</div>
                            <div className="text-2xl font-medium leading-tight md:text-3xl">{data.address}</div>
                          </div>
                        </div>
                      </div>
                      <div className="mx-auto mt-16 max-w-md text-lg opacity-90 md:text-xl">
                        Share this catalog link with the customer or publish it after final approval.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-10 px-4 text-center text-sm text-gray-500">
          (c) 2026 {data.brandName} - Personalized for {data.customerName}
        </div>
      </div>
    </div>
  )
}
