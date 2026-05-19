"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Copy,
  Eye,
  Filter,
  GripVertical,
  Plus,
  Save,
  Search,
  Send,
  Share2,
  Upload,
  X,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  CatalogDesign,
  CatalogDesignPreview,
  CatalogPreviewData,
  CatalogProduct,
  CatalogSection,
} from "@/components/catalog/catalog-design-preview"

type EventOption = {
  id: string
  name: string
  location: string
  scannedProductIds: number[]
}

type SavedCatalog = CatalogPreviewData & {
  id: string
  status: "draft" | "published"
  createdAt: string
  selectedProductIds: number[]
}

const STORAGE_KEY = "demo.catalog.builder.items"

const availableProducts: CatalogProduct[] = [
  {
    id: 1,
    name: "Premium Laptop Pro",
    category: "Electronics",
    price: 1299.99,
    image: "/modern-laptop-workspace.png",
    sku: "LAP-001",
    description: "High performance laptop for business and design teams.",
    isBestSeller: true,
    isSpecial: true,
    relatedTo: ["Electronics"],
    scanCount: 42,
  },
  {
    id: 2,
    name: "Smartphone X",
    category: "Electronics",
    price: 899.99,
    image: "/modern-smartphone.png",
    sku: "PHN-002",
    description: "Flagship smartphone with sharp display and fast charging.",
    isNew: true,
    isBestSeller: true,
    relatedTo: ["Electronics"],
    scanCount: 64,
  },
  {
    id: 3,
    name: "Wireless Headphones",
    category: "Audio",
    price: 299.99,
    image: "/diverse-people-listening-headphones.png",
    sku: "AUD-003",
    description: "Noise cancelling headphones with long battery life.",
    isSpecial: true,
    relatedTo: ["Electronics", "Audio"],
    scanCount: 31,
  },
  {
    id: 4,
    name: "Smart Watch",
    category: "Wearables",
    price: 399.99,
    image: "/wrist-watch-close-up.png",
    sku: "WAT-004",
    description: "Fitness tracking watch with calls, alerts, and health stats.",
    isNew: true,
    relatedTo: ["Wearables"],
    scanCount: 27,
  },
  {
    id: 5,
    name: "Tablet Device",
    category: "Electronics",
    price: 599.99,
    image: "/modern-tablet-display.png",
    sku: "TAB-005",
    description: "Portable tablet for catalog viewing, notes, and demos.",
    isBestSeller: true,
    relatedTo: ["Electronics"],
    scanCount: 35,
  },
  {
    id: 6,
    name: "Ergonomic Office Chair",
    category: "Office Furniture",
    price: 249.99,
    image: "https://picsum.photos/id/20/800/800",
    sku: "FUR-006",
    description: "Premium office chair with lumbar support and breathable mesh.",
    isNew: true,
    isBestSeller: true,
    relatedTo: ["Office Furniture"],
    scanCount: 72,
  },
  {
    id: 7,
    name: "Luxury Armchair",
    category: "Living Room",
    price: 549.99,
    image: "https://picsum.photos/id/64/800/800",
    sku: "FUR-007",
    description: "Elegant seating for lounge, reception, and home interiors.",
    isSpecial: true,
    relatedTo: ["Living Room"],
    scanCount: 49,
  },
  {
    id: 8,
    name: "Modern Dining Chair Set",
    category: "Dining Furniture",
    price: 699.99,
    image: "https://picsum.photos/id/1015/800/800",
    sku: "FUR-008",
    description: "Set of four dining chairs with sturdy frame and soft finish.",
    isNew: true,
    relatedTo: ["Dining Furniture", "Living Room"],
    scanCount: 24,
  },
]

const eventOptions: EventOption[] = [
  {
    id: "lucknow-expo",
    name: "Lucknow Furniture Expo",
    location: "Lucknow",
    scannedProductIds: [6, 7, 8, 4],
  },
  {
    id: "tech-demo",
    name: "Tech Demo Day",
    location: "Delhi",
    scannedProductIds: [1, 2, 3, 5],
  },
  {
    id: "retail-walkin",
    name: "Retail Store Walk-in",
    location: "Mumbai",
    scannedProductIds: [2, 3, 6, 7],
  },
]

const defaultSections: CatalogSection[] = [
  { id: "s1", type: "cover", title: "Cover Page" },
  { id: "s2", type: "welcome", title: "Welcome" },
  { id: "s3", type: "toc", title: "Table of Content" },
  { id: "s4", type: "new_products", title: "New Arrivals" },
  { id: "s5", type: "products", title: "Best Sellers" },
  { id: "s6", type: "special_products", title: "Special Offers" },
  { id: "s7", type: "related_products", title: "Related Models" },
  { id: "s8", type: "about", title: "Our Vision & Mission" },
  { id: "s9", type: "contact", title: "Get In Touch" },
]

const defaultDesign: CatalogDesign = {
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
}

const productDisplayOptions: Array<{
  key: "showPrice" | "showSKU" | "showDescription" | "showSpecs" | "showQR"
  label: string
}> = [
  { key: "showPrice", label: "Show product prices" },
  { key: "showSKU", label: "Show SKU codes" },
  { key: "showDescription", label: "Show product descriptions" },
  { key: "showSpecs", label: "Show specifications" },
  { key: "showQR", label: "Show QR codes for each product" },
]

const encodeCatalog = (data: CatalogPreviewData) => {
  const encoded = encodeURIComponent(JSON.stringify(data))
  return btoa(encoded)
}

const createId = () => `catalog-${Date.now()}`

export default function NewCatalogPage() {
  const [catalogName, setCatalogName] = React.useState("Product Catalog")
  const [customerName, setCustomerName] = React.useState("Rahul Sharma")
  const [brandName, setBrandName] = React.useState("Brand Name")
  const [tagline, setTagline] = React.useState("2026 Collection")
  const [description, setDescription] = React.useState("Premium furniture and technology products")
  const [phone, setPhone] = React.useState("+91 87654 32109")
  const [email, setEmail] = React.useState("info@brandname.com")
  const [address, setAddress] = React.useState("123, Furniture Market, Gomti Nagar, Lucknow, Uttar Pradesh 226010")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [eventFilter, setEventFilter] = React.useState("lucknow-expo")
  const [search, setSearch] = React.useState("")
  const [scannedOnly, setScannedOnly] = React.useState(true)
  const [selectedProducts, setSelectedProducts] = React.useState<number[]>([6, 7, 8])
  const [design, setDesign] = React.useState<CatalogDesign>(defaultDesign)
  const [sections, setSections] = React.useState<CatalogSection[]>(defaultSections)
  const [savedCatalogs, setSavedCatalogs] = React.useState<SavedCatalog[]>([])
  const [activePreview, setActivePreview] = React.useState<CatalogPreviewData | null>(null)
  const [shareUrl, setShareUrl] = React.useState("")
  const [notice, setNotice] = React.useState("")

  React.useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      setSavedCatalogs(JSON.parse(raw))
    }
  }, [])

  const categories = React.useMemo(
    () => Array.from(new Set(availableProducts.map((product) => product.category))),
    []
  )

  const selectedEvent = React.useMemo(
    () => eventOptions.find((event) => event.id === eventFilter),
    [eventFilter]
  )

  const filteredProducts = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return availableProducts.filter((product) => {
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
      const matchesEvent = !scannedOnly || selectedEvent?.scannedProductIds.includes(product.id)
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.sku.toLowerCase().includes(normalizedSearch) ||
        product.category.toLowerCase().includes(normalizedSearch)

      return matchesCategory && matchesEvent && matchesSearch
    })
  }, [categoryFilter, scannedOnly, search, selectedEvent])

  const selectedCatalogProducts = React.useMemo(
    () => availableProducts.filter((product) => selectedProducts.includes(product.id)),
    [selectedProducts]
  )

  const buildPreviewData = React.useCallback((): CatalogPreviewData => {
    const products = selectedCatalogProducts.length > 0 ? selectedCatalogProducts : filteredProducts

    return {
      catalogName,
      customerName,
      brandName,
      tagline,
      description,
      phone,
      email,
      address,
      sections,
      products,
      design,
    }
  }, [
    address,
    brandName,
    catalogName,
    customerName,
    description,
    design,
    email,
    filteredProducts,
    phone,
    sections,
    selectedCatalogProducts,
    tagline,
  ])

  const persistCatalogs = (items: SavedCatalog[]) => {
    setSavedCatalogs(items)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }

  const createShareLink = (data: CatalogPreviewData) => {
    const origin = window.location.origin
    const encoded = encodeCatalog(data)
    return `${origin}/catalogs/preview?data=${encoded}`
  }

  const saveCatalog = (status: "draft" | "published") => {
    const data = buildPreviewData()
    const item: SavedCatalog = {
      ...data,
      id: createId(),
      status,
      createdAt: new Date().toISOString(),
      selectedProductIds: selectedProducts,
    }
    const next = [item, ...savedCatalogs]
    persistCatalogs(next)
    setActivePreview(data)
    setShareUrl(createShareLink(data))
    setNotice(status === "draft" ? "Draft saved for future use." : "Catalog published and share link generated.")
  }

  const loadSavedCatalog = (catalog: SavedCatalog) => {
    setCatalogName(catalog.catalogName)
    setCustomerName(catalog.customerName)
    setBrandName(catalog.brandName)
    setTagline(catalog.tagline)
    setDescription(catalog.description)
    setPhone(catalog.phone)
    setEmail(catalog.email)
    setAddress(catalog.address)
    setSections(catalog.sections)
    setDesign(catalog.design)
    setSelectedProducts(catalog.selectedProductIds)
    setActivePreview(catalog)
    setShareUrl(createShareLink(catalog))
    setNotice("Saved catalog loaded.")
  }

  const toggleProduct = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    )
  }

  const toggleAllFilteredProducts = () => {
    const filteredIds = filteredProducts.map((product) => product.id)
    const allFilteredSelected = filteredIds.every((id) => selectedProducts.includes(id))

    setSelectedProducts((prev) =>
      allFilteredSelected
        ? prev.filter((id) => !filteredIds.includes(id))
        : Array.from(new Set([...prev, ...filteredIds]))
    )
  }

  const updateDesign = <K extends keyof CatalogDesign>(key: K, value: CatalogDesign[K]) => {
    setDesign((prev) => ({ ...prev, [key]: value }))
  }

  const toggleSection = (sectionId: string) => {
    setSections((prev) => {
      const section = defaultSections.find((item) => item.id === sectionId)
      if (!section) return prev

      return prev.some((item) => item.id === sectionId)
        ? prev.filter((item) => item.id !== sectionId)
        : [...prev, section].sort(
            (a, b) =>
              defaultSections.findIndex((item) => item.id === a.id) -
              defaultSections.findIndex((item) => item.id === b.id)
          )
    })
  }

  const previewNow = () => {
    const data = buildPreviewData()
    setActivePreview(data)
    setShareUrl(createShareLink(data))
    setNotice("Preview generated from current filters and selected products.")
  }

  const copyShareLink = async () => {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setNotice("Share link copied.")
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl space-y-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <Link href="/catalogs">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create Catalog</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Filter scanned products, publish selected items, and generate a shareable catalog.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={previewNow}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button variant="outline" onClick={() => saveCatalog("draft")}>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => saveCatalog("published")}>
              <Send className="mr-2 h-4 w-4" />
              Generate Catalog
            </Button>
          </div>
        </div>

        {notice && (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            {notice}
          </div>
        )}

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="flex h-auto flex-wrap justify-start">
            <TabsTrigger value="details">Catalog Details</TabsTrigger>
            <TabsTrigger value="filters">Event Filters</TabsTrigger>
            <TabsTrigger value="products">Select Products</TabsTrigger>
            <TabsTrigger value="layout">Layout & Design</TabsTrigger>
            <TabsTrigger value="preview">Preview & Share</TabsTrigger>
            <TabsTrigger value="saved">Saved Catalogs</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Catalog Name *</Label>
                    <Input id="name" value={catalogName} onChange={(event) => setCatalogName(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input id="customerName" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Brand Name</Label>
                    <Input id="brandName" value={brandName} onChange={(event) => setBrandName(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Catalog Tagline</Label>
                    <Input id="tagline" value={tagline} onChange={(event) => setTagline(event.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" value={address} onChange={(event) => setAddress(event.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Catalog Sections</Label>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {defaultSections.map((section) => (
                      <label key={section.id} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                        <Checkbox checked={sections.some((item) => item.id === section.id)} onCheckedChange={() => toggleSection(section.id)} />
                        {section.title}
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="filters" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Event and Category Wise Filter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Event</Label>
                    <Select value={eventFilter} onValueChange={setEventFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {eventOptions.map((event) => (
                          <SelectItem key={event.id} value={event.id}>
                            {event.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Search Product</Label>
                    <div className="relative">
                      <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search by product, SKU, or category"
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={scannedOnly} onCheckedChange={(checked) => setScannedOnly(Boolean(checked))} />
                  Show only products scanned in selected event
                </label>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-4">
                    <div className="text-2xl font-semibold">{selectedEvent?.scannedProductIds.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Event scanned products</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-2xl font-semibold">{filteredProducts.length}</div>
                    <div className="text-sm text-muted-foreground">Products after filter</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-2xl font-semibold">{selectedProducts.length}</div>
                    <div className="text-sm text-muted-foreground">Selected for publish</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <CardTitle>Select Products ({selectedProducts.length} selected)</CardTitle>
                  <Button variant="outline" size="sm" onClick={toggleAllFilteredProducts}>
                    <Plus className="mr-2 h-4 w-4" />
                    Select Filtered
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                      <Checkbox checked={selectedProducts.includes(product.id)} onCheckedChange={() => toggleProduct(product.id)} />
                      <GripVertical className="h-5 w-5 cursor-grab text-muted-foreground" />
                      <img src={product.image || "/placeholder.svg"} alt={product.name} className="h-16 w-16 rounded object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {product.sku} - {product.category} - {product.scanCount || 0} scans
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {product.isNew && <Badge variant="secondary">New</Badge>}
                          {product.isBestSeller && <Badge variant="secondary">Best Seller</Badge>}
                          {product.isSpecial && <Badge variant="secondary">Special</Badge>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${product.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Publish Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Products shown here are the final items that will publish in the catalog preview.
                  </p>
                  <div className="space-y-2">
                    {selectedCatalogProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2">
                        <GripVertical className="h-5 w-5 cursor-grab text-muted-foreground" />
                        <span className="w-8 text-sm font-medium">{index + 1}</span>
                        <img src={product.image || "/placeholder.svg"} alt={product.name} className="h-10 w-10 rounded object-cover" />
                        <span className="flex-1 text-sm">{product.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => toggleProduct(product.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="layout" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Layout Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Page Size</Label>
                    <Select value={design.pageSize} onValueChange={(value) => updateDesign("pageSize", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4">A4 (210 x 297 mm)</SelectItem>
                        <SelectItem value="letter">Letter (8.5 x 11 in)</SelectItem>
                        <SelectItem value="a5">A5 (148 x 210 mm)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Orientation</Label>
                    <Select value={design.orientation} onValueChange={(value) => updateDesign("orientation", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Products per Page</Label>
                    <Select value={design.productsPerPage} onValueChange={(value) => updateDesign("productsPerPage", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 product</SelectItem>
                        <SelectItem value="2">2 products</SelectItem>
                        <SelectItem value="4">4 products</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Template Style</Label>
                    <Select value={design.template} onValueChange={(value) => updateDesign("template", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="classic">Classic</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="elegant">Elegant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Information Display</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {productDisplayOptions.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2">
                    <Checkbox
                      checked={design[key]}
                      onCheckedChange={(checked) => updateDesign(key, Boolean(checked))}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="cursor-pointer rounded-lg border-2 border-dashed border-muted p-6 text-center transition-colors hover:border-primary/50">
                    <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Upload logo placeholder</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={design.primaryColor}
                        onChange={(event) => updateDesign("primaryColor", event.target.value)}
                        className="h-10 w-16 p-1"
                      />
                      <Input value={design.primaryColor} onChange={(event) => updateDesign("primaryColor", event.target.value)} className="flex-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={design.secondaryColor}
                        onChange={(event) => updateDesign("secondaryColor", event.target.value)}
                        className="h-10 w-16 p-1"
                      />
                      <Input value={design.secondaryColor} onChange={(event) => updateDesign("secondaryColor", event.target.value)} className="flex-1" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Preview & Share
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={previewNow}>
                      <Eye className="mr-2 h-4 w-4" />
                      Refresh Preview
                    </Button>
                    <Button onClick={() => saveCatalog("published")}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Publish Link
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {shareUrl && (
                  <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row">
                    <Input value={shareUrl} readOnly />
                    <Button variant="outline" onClick={copyShareLink}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                )}
                <CatalogDesignPreview data={activePreview || buildPreviewData()} onShare={copyShareLink} onDownload={() => window.print()} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Saved Catalogs</CardTitle>
              </CardHeader>
              <CardContent>
                {savedCatalogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No saved catalogs yet. Save a draft or publish a catalog to reuse it later.</p>
                ) : (
                  <div className="space-y-3">
                    {savedCatalogs.map((catalog) => (
                      <div key={catalog.id} className="flex flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{catalog.catalogName}</p>
                            <Badge variant={catalog.status === "published" ? "default" : "secondary"}>{catalog.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {catalog.customerName} - {catalog.products.length} products - {new Date(catalog.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => loadSavedCatalog(catalog)}>
                          Load
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
