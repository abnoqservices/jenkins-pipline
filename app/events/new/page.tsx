"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Plus, Search, Package, CalendarIcon, MapPin, Loader2, Check, CheckCircle2, Trash2,ArrowLeft } from 'lucide-react'
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import axiosClient from "@/lib/axiosClient"
import { useRouter, useParams } from "next/navigation"
import { showToast } from "@/lib/showToast"
import useInfiniteScroll from "react-infinite-scroll-hook"
import { usePermissions } from "@/lib/usePermissions";
import { PermissionRestrictedButton ,PermissionRestrictedMenuItem} from "@/components/PermissionRestrictedButton";
type ProductCategory = {
  id: number
  name: string
  slug: string
  parent_id: number | null
  children: ProductCategory[]
  // ... other fields if needed
}

type Product = {
  id: number
  name: string
  sku: string
  url_slug: string
  category?: ProductCategory
  primary_image?: string
}

type BoothProduct = {
  id: number
  name: string
  url_slug: string
}

type Booth = {
  id: number
  booth_name: string
  booth_code: string | null
  products: BoothProduct[]
}

type EventData = {
  id: number
  name: string
  location: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  booth: Booth | null
}

export default function EventFormPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id ? Number(params.id) : null
  const isEditMode = !!eventId

  // Form states
  const [name, setName] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [startDate, setStartDate] = React.useState<Date | undefined>()
  const [endDate, setEndDate] = React.useState<Date | undefined>()
  const [isActive, setIsActive] = React.useState(false)
  const [boothName, setBoothName] = React.useState("")
  const [boothCode, setBoothCode] = React.useState("")

  const [selectedProductIds, setSelectedProductIds] = React.useState<number[]>([])
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  // UI states
  const [loading, setLoading] = React.useState(false)
  const [pageLoading, setPageLoading] = React.useState(isEditMode)

  // Product dialog states
  const [isProductDialogOpen, setIsProductDialogOpen] = React.useState(false)
  const [products, setProducts] = React.useState<Product[]>([])
  const [productSearch, setProductSearch] = React.useState("")
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | undefined>(undefined)
  const [categories, setCategories] = React.useState<ProductCategory[]>([])
  const [categoriesLoaded, setCategoriesLoaded] = React.useState(false)
  const [loadingCategories, setLoadingCategories] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(true)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [loadingProducts, setLoadingProducts] = React.useState(false)

  const perPage = 20
  React.useEffect(() => {
    if (!permissionsLoading && !hasPermission("events", "create")) {
      showToast("You don't have permission to create events", "error");
      router.push("/events");
    }
  }, [permissionsLoading, hasPermission, router]);
  // ─── Fetch root categories ────────────────────────────────────────
  const fetchCategories = React.useCallback(async () => {
    if (categoriesLoaded || loadingCategories) return

    setLoadingCategories(true)
    try {
      const params = new URLSearchParams({ parent_id: 'null' })
      const res = await axiosClient.get(`/product-categories?${params}`)
      const data = res.data.data || []
      setCategories(data)
      setCategoriesLoaded(true)
    } catch (err: any) {
      console.error("Categories fetch failed:", err)
      showToast("Failed to load product categories", "error")
      setCategories([])
    } finally {
      setLoadingCategories(false)
    }
  }, [categoriesLoaded, loadingCategories])

  // ─── Fetch products ───────────────────────────────────────────────
  const fetchProducts = async (page: number) => {
    setLoadingProducts(true)
    try {
      const params = new URLSearchParams({
        per_page: perPage.toString(),
        page: page.toString(),
        ...(productSearch && { search: productSearch }),
        ...(selectedCategoryId && { category_id: selectedCategoryId.toString() }),
        is_active: "true",
        with: "images,category",
      })

      const res = await axiosClient.get(`/products?${params}`)
      const newProducts = res.data.data.data || []

      const productsWithImage = newProducts.map((p: any) => {
        let primaryUrl: string | undefined
        if (p.images?.length > 0) {
          const sorted = [...p.images].sort((a: any, b: any) => (a.position || 999) - (b.position || 999))
          primaryUrl = sorted[0]?.url
        }
        return { ...p, primary_image: primaryUrl }
      })

      setProducts(prev => page === 1 ? productsWithImage : [...prev, ...productsWithImage])

      const total = res.data.data.total || 0
      setHasMore(page * perPage < total)
    } catch (err) {
      console.error("Products fetch failed:", err)
      showToast("Failed to load products", "error")
      setHasMore(false)
    } finally {
      setLoadingProducts(false)
    }
  }

  // ─── Dialog open → load categories + products ─────────────────────
  React.useEffect(() => {
    if (!isProductDialogOpen) return

    fetchCategories()

    setCurrentPage(1)
    setProducts([])
    setHasMore(true)
    fetchProducts(1)
  }, [isProductDialogOpen, fetchCategories])

  // ─── Search / category change → reset & refetch ───────────────────
  React.useEffect(() => {
    if (!isProductDialogOpen) return

    setCurrentPage(1)
    setProducts([])
    setHasMore(true)
    fetchProducts(1)
  }, [productSearch, selectedCategoryId, isProductDialogOpen])

  const [sentryRef] = useInfiniteScroll({
    loading: loadingProducts,
    hasNextPage: hasMore,
    onLoadMore: () => {
      if (!loadingProducts && hasMore) {
        const nextPage = currentPage + 1
        setCurrentPage(nextPage)
        fetchProducts(nextPage)
      }
    },
    disabled: !isProductDialogOpen,
    rootMargin: "0px 0px 200px 0px",
  })

  const toggleProduct = (productId: number) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  // ─── Load event in edit mode ──────────────────────────────────────
  React.useEffect(() => {
    if (!isEditMode || !eventId) return

    const loadEvent = async () => {
      setPageLoading(true)
      try {
        const res = await axiosClient.get(`/events/${eventId}`)
        const event: EventData = res.data.data

        setName(event.name)
        setLocation(event.location || "")
        setStartDate(event.start_date ? new Date(event.start_date) : undefined)
        setEndDate(event.end_date ? new Date(event.end_date) : undefined)
        setIsActive(event.is_active)

        if (event.booth) {
          setBoothName(event.booth.booth_name)
          setBoothCode(event.booth.booth_code || "")
          setSelectedProductIds(event.booth.products.map(p => p.id))
        }
      } catch (err: any) {
        showToast(err.response?.data?.message || "Failed to load event", "error")
      } finally {
        setPageLoading(false)
      }
    }

    loadEvent()
  }, [isEditMode, eventId])

  // ─── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!name.trim()) return showToast("Event name is required", "error")
    if (!location.trim()) return showToast("Location name is required", "error")
    if (!startDate) return showToast("Start Date is required", "error")
    if (!endDate) return showToast("End Date is required", "error")
    if (!boothName) return showToast("Hall / Booth name  is required", "error")
    if (!boothCode) return showToast("Booth code is required", "error")

    if (location?.trim()) {
      if (location.trim().length > 200) {
        return showToast("Location cannot exceed 200 characters");
      }
    }
    if (startDate && endDate) {
      if (endDate < startDate) {
        return showToast("End date must be after or equal to start date",'error');
      }
  
      // Optional: prevent events in the very distant past/future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(today.getFullYear() + 1);
  
      if (startDate < today) {
        return showToast("Start date cannot be in the past",'error');
      }
      // if (startDate > oneYearFromNow) {
      //   errors.push("Start date cannot be more than 1 year in the future");
      // }
    }
    const wantsBooth = boothName.trim() || boothCode?.trim();
  if (wantsBooth) {
    if (!boothName.trim()) {
      return showToast("Booth name is required when creating a booth",'error');
    } else if (boothName.trim().length < 2) {
      return showToast("Booth name must be at least 2 characters",'error');
    }

    if (boothCode?.trim() && boothCode.trim().length > 30) {
      return showToast("Booth code cannot exceed 20 characters",'error');
    }
    // You can add format check e.g. alphanumeric only
    // if (boothCode?.trim() && !/^[A-Za-z0-9-]+$/.test(boothCode.trim())) {
    //   errors.push("Booth code can only contain letters, numbers and hyphens");
    // }
  }
    setLoading(true)
    try {
      let currentEventId = eventId

      // Create or Update event
      if (isEditMode) {
        await axiosClient.put(`/events/${eventId}`, {
          name,
          location: location || null,
          start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
          end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
          is_active: isActive,
        })
      } else {
        const res = await axiosClient.post("/events", {
          name,
          location: location || null,
          start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
          end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
          is_active: isActive,
        })
        currentEventId = res.data.data.id
      }

      // Booth
      if (boothName.trim() && currentEventId) {
        try {
          if (isEditMode) {
            await axiosClient.put(`/events/${currentEventId}/booth`, {
              booth_name: boothName,
              booth_code: boothCode || null,
            })
          } else {
            await axiosClient.post(`/events/${currentEventId}/booth`, {
              booth_name: boothName,
              booth_code: boothCode || null,
            })
          }
        } catch (e: any) {
          if (isEditMode && e.response?.status === 404) {
            await axiosClient.post(`/events/${currentEventId}/booth`, {
              booth_name: boothName,
              booth_code: boothCode || null,
            })
          } else {
            throw e
          }
        }
      }

      // Products sync (simple: clear + re-add)
      if (currentEventId) {
        try { await axiosClient.delete(`/events/${currentEventId}/products`) } catch {}
        for (const pid of selectedProductIds) {
          try {
            await axiosClient.post(`/events/${currentEventId}/products`, { product_id: pid })
          } catch (e: any) {
            if (!e.response?.data?.message?.includes("already")) console.warn(e)
          }
        }
      }

      // Activate if needed
      if (isActive && currentEventId) {
        await axiosClient.patch(`/events/${currentEventId}/activate`)
      }

      showToast(isEditMode ? "Event updated" : "Event created", "success")
      router.push("/events")
   } catch (err: any) {
  const response = err.response?.data;

  if (response && !response.success) {
    // 1. Try to show all field-specific validation messages
    if (response.errors && typeof response.errors === 'object') {
      const errorMessages: string[] = [];

      Object.entries(response.errors).forEach(([field, messages]) => {
        // messages can be string or string[]
        const msgs = Array.isArray(messages) ? messages : [messages];
        errorMessages.push(...msgs);
      });

      if (errorMessages.length > 0) {
        // Show each message one by one (most user-friendly)
        errorMessages.forEach(msg => showToast(msg, "error"));

        // ─────────────── OR ───────────────
        // Show as one combined toast (cleaner if many errors)
        // showToast(errorMessages.join("\n• "), "error");
        return;
      }
    }

    // 2. Fallback to general message if no errors object
    showToast(response.message || "Save failed", "error");
  } else {
    // Network error / no response / unexpected format
    showToast("Something went wrong. Please try again.", "error");
  }
} finally {
  setLoading(false);
}
  }

  const completionScore = React.useMemo(() => {
    const checks = [
      !!name.trim(),
      !!location.trim(),
      !!startDate,
      !!endDate,
      !!boothName.trim(),
      selectedProductIds.length > 0,
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [name, location, startDate, endDate, boothName, selectedProductIds.length])

  const statusEmoji = (ok: boolean) => (ok ? "🟢" : "🟠")

  if (pageLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-10 w-10 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50/50 p-4 md:p-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-slate-50 px-3 py-1 text-xs text-slate-600">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    Event setup
                  </div>
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    {isEditMode ? "Edit Event" : "Create Event"}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    {isEditMode ? "Update event, booth and showcased products." : "Configure your event and booth."}
                  </p>
                </div>
                <Button variant="outline" onClick={() => router.push("/events")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to events
                </Button>
              </div>
            </div>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
                <CardDescription>
                  {isEditMode ? "Modify event information" : "Only one event can be active at a time."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                <div className="flex items-center space-x-2">
                  <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                  <Label htmlFor="active">
                    {isEditMode ? "Keep event active" : "Activate immediately"}
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label required>Event Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Tech Expo 2026" />
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <div className="relative">
                    <Input className="pl-9" value={location} onChange={e => setLocation(e.target.value)} />
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start", !startDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start", !endDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Hall / Booth Name</Label>
                    <Input value={boothName} onChange={e => setBoothName(e.target.value)} placeholder="e.g. Hall 5 - B42" />
                  </div>
                  <div className="space-y-2">
                    <Label>Booth Code</Label>
                    <Input value={boothCode} onChange={e => setBoothCode(e.target.value)} placeholder="e.g. H5-B42" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>Showcased Products</CardTitle>
                <CardDescription>
                  {selectedProductIds.length} product{selectedProductIds.length !== 1 ? "s" : ""} selected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setIsProductDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Manage Products
                  </Button>
                </div>

                {selectedProductIds.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {selectedProductIds.map((id) => {
                      const product = products.find((p) => p.id === id) || {
                        id,
                        name: `Product #${id}`,
                        sku: "—",
                        primary_image: undefined,
                        category: { name: "Uncategorized" },
                      }

                      return (
                        <div
                          key={id}
                          className={cn(
                            "group relative border rounded-xl overflow-hidden bg-card",
                            "hover:shadow-md hover:border-primary/50 transition-all",
                            "cursor-pointer"
                          )}
                          onClick={() => toggleProduct(id)}
                        >
                          <div className="aspect-square relative bg-muted">
                            {product.primary_image ? (
                              <img
                                src={product.primary_image}
                                alt={product.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Package className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50" />
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleProduct(id)
                              }}
                              className={cn(
                                "absolute top-2 right-2 z-10",
                                "h-7 w-7 rounded-full bg-background/90 backdrop-blur-sm shadow-sm border",
                                "flex items-center justify-center text-muted-foreground",
                                "hover:bg-destructive/10 hover:text-destructive transition-colors",
                                "opacity-80 group-hover:opacity-100 focus:opacity-100"
                              )}
                              aria-label="Remove product"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="p-2.5 text-center">
                            <p className="font-medium text-sm line-clamp-2 leading-snug">
                              {product.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {product.sku ? `SKU: ${product.sku}` : "—"}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="lg:sticky lg:top-6 lg:h-fit">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Publish Panel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Completion</span>
                    <span className="font-medium">{completionScore}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completionScore}%` }} />
                  </div>
                </div>

                <div className="space-y-1 text-sm text-slate-600">
                  <p>{statusEmoji(!!name.trim())} Name</p>
                  <p>{statusEmoji(!!location.trim())} Location</p>
                  <p>{statusEmoji(!!startDate)} Start date</p>
                  <p>{statusEmoji(!!endDate)} End date</p>
                  <p>{statusEmoji(!!boothName.trim())} Booth name</p>
                  <p>{statusEmoji(selectedProductIds.length > 0)} Products</p>
                </div>

                <div className="space-y-2 pt-2">
                  <Button variant="outline" className="w-full" onClick={() => router.push("/events")} disabled={loading}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {loading ? "Saving..." : isEditMode ? "Save Changes" : "Create Event"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

        {/* ─── Product Selection Dialog ──────────────────────────────────────── */}
        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogContent className="!max-w-6xl w-[95vw] !max-h-[92vh] p-0 flex flex-col">
            <div className="p-6 border-b">
              <DialogHeader className="mb-5">
                <DialogTitle>Select Products</DialogTitle>
                <DialogDescription>
                  Choose which products will be showcased at this event booth.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or SKU..."
                    className="pl-10"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                  />
                </div>

                <Select
                  value={selectedCategoryId?.toString() ?? "all"}
                  onValueChange={v => setSelectedCategoryId(v === "all" ? undefined : Number(v))}
                  disabled={loadingCategories || categories.length === 0}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder={
                      loadingCategories
                        ? "Loading categories..."
                        : categories.length === 0
                          ? "No categories"
                          : "All Categories"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingProducts && products.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-10 w-10 animate-spin" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  {productSearch || selectedCategoryId
                    ? "No matching products found"
                    : "No products available"}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {products.map(product => {
                    const isSelected = selectedProductIds.includes(product.id)
                    return (
                      <div
                        key={product.id}
                        className={cn(
                          "group relative border rounded-xl overflow-hidden cursor-pointer transition-all",
                          "hover:border-primary/50 hover:shadow-md",
                          isSelected && "border-primary shadow-sm bg-primary/5"
                        )}
                        onClick={() => toggleProduct(product.id)}
                      >
                        <div className="absolute top-3 right-3 z-10 pointer-events-none">
                          <Checkbox
                            checked={isSelected}
                            className={cn(
                              "h-8 w-8 rounded-full border-2 shadow",
                              isSelected ? "bg-primary border-primary" : "bg-background/80 border-muted"
                            )}
                          />
                        </div>

                        <div className="aspect-square bg-muted relative">
                          {product.primary_image ? (
                            <img
                              src={product.primary_image}
                              alt={product.name}
                              className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <Package className="absolute inset-0 m-auto h-12 w-12 text-muted-foreground/40" />
                          )}
                        </div>

                        <div className="p-3">
                          <p className="font-medium text-sm line-clamp-2">{product.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {product.sku ? `SKU: ${product.sku}` : "—"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {product.category?.name ?? "Uncategorized"}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {hasMore && (
                <div ref={sentryRef} className="py-10 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>

            <div className="border-t px-6 py-4 bg-muted/40">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">
                  {selectedProductIds.length} product{selectedProductIds.length !== 1 ? "s" : ""} selected
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsProductDialogOpen(false)}>
                    Done
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}