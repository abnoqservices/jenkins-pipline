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
import { Save, Plus, Search, Package, CalendarIcon, MapPin, Loader2, Check, CheckCircle2, ArrowLeft, Trash2 } from 'lucide-react'
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import axiosClient from "@/lib/axiosClient"
import { useParams, useRouter } from "next/navigation"
import { showToast } from "@/lib/showToast"
import useInfiniteScroll from "react-infinite-scroll-hook"

type ProductCategory = {
  id: number
  org_id: number
  name: string
  slug: string
  description?: string
  parent_id: number | null
  parent?: ProductCategory | null
  children: ProductCategory[]
  custom_fields: any[]
}

type Product = {
  id: number
  name: string
  sku: string
  url_slug: string
  category?: ProductCategory
  primary_image?: string
  images?: Array<{
    url: string
    position?: number
    type?: string
  }>
}

interface Booth {
  id: number
  booth_name: string
  booth_code: string | null
  products?: Product[]
}

interface Event {
  id: number
  name: string
  location: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  booth: Booth | null
}

export default function EditEventPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id || params.slug

  const [name, setName] = React.useState("")
  const [location, setLocation] = React.useState("")
  const [startDate, setStartDate] = React.useState<Date | undefined>()
  const [endDate, setEndDate] = React.useState<Date | undefined>()
  const [isActive, setIsActive] = React.useState(false)
  const [boothName, setBoothName] = React.useState("")
  const [boothCode, setBoothCode] = React.useState("")

  const [selectedProductIds, setSelectedProductIds] = React.useState<number[]>([])
  const [initialProductIds, setInitialProductIds] = React.useState<number[]>([])

  const [isProductDialogOpen, setIsProductDialogOpen] = React.useState(false)

  const [products, setProducts] = React.useState<Product[]>([])
  const [productSearch, setProductSearch] = React.useState("")
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<number | undefined>()
  const [categories, setCategories] = React.useState<ProductCategory[]>([])
  const [hasMore, setHasMore] = React.useState(true)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [loadingProducts, setLoadingProducts] = React.useState(false)
  const [loadingCategories, setLoadingCategories] = React.useState(false)

  const perPage = 20

  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  // Flatten categories for select dropdown with proper hierarchy display
  const flattenedCategories = React.useMemo(() => {
    const result: Array<{ id: number; name: string; path: string }> = [];
    const seen = new Set<number>();
  
    const flatten = (cats: ProductCategory[], parentPath: string[] = []) => {
      cats.forEach(cat => {
        if (seen.has(cat.id)) return;
        seen.add(cat.id);
  
        const displayName = parentPath.length > 0 
          ? `${parentPath.join(" › ")} › ${cat.name}` 
          : cat.name;
  
        result.push({ id: cat.id, name: displayName, path: displayName });
  
        if (cat.children?.length > 0) {
          flatten(cat.children, [...parentPath, cat.name]);
        }
      });
    };
  
    flatten(categories);
    return result;
  }, [categories]);

  const fetchEvent = async () => {
    try {
      const res = await axiosClient.get(`/events/${eventId}`)
      const event: Event = res.data.data

      setName(event.name)
      setLocation(event.location || "")
      setIsActive(event.is_active)

      if (event.start_date) setStartDate(parseISO(event.start_date))
      if (event.end_date) setEndDate(parseISO(event.end_date))

      let linkedIds: number[] = []

      if (event.booth) {
        setBoothName(event.booth.booth_name)
        setBoothCode(event.booth.booth_code || "")
        const linked = event.booth.products || []
        linkedIds = linked.map(p => p.id)
        setSelectedProductIds(linkedIds)
        setInitialProductIds(linkedIds)
      }

      if (linkedIds.length > 0) {
        await fetchSelectedProductDetails(linkedIds)
      }

    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to load event", "error")
      router.push("/events")
    } finally {
      setLoading(false)
    }
  }

  const fetchSelectedProductDetails = async (productIds: number[]) => {
    if (productIds.length === 0) return

    try {
      const params = new URLSearchParams({
        ids: productIds.join(','),
        with: 'images,category',
        per_page: '100',
      })

      const res = await axiosClient.get(`/products?${params}`)
      const fullProducts = (res.data.data?.data || []) as Product[]

      const enriched = fullProducts.map(p => {
        let primaryUrl: string | undefined
        if (p.images && p.images.length > 0) {
          const sorted = [...p.images].sort((a, b) => (a.position ?? 999) - (b.position ?? 999))
          primaryUrl = sorted[0]?.url
        }
        return {
          ...p,
          primary_image: primaryUrl,
        }
      })

      setProducts(prev => {
        const map = new Map<number, Product>()
        prev.forEach(p => map.set(p.id, p))
        enriched.forEach(p => map.set(p.id, p))
        return Array.from(map.values())
      })

    } catch (err) {
      console.warn("Bulk fetch failed for selected products:", err)
      // Fallback individual fetch...
      try {
        const promises = productIds.map(async (id) => {
          try {
            const res = await axiosClient.get(`/products/${id}`)
            const p = res.data.data as Product
            const primary = p.images?.sort((a, b) => (a.position ?? 999) - (b.position ?? 999))?.[0]
            return {
              ...p,
              primary_image: primary?.url,
            }
          } catch {
            return null
          }
        })

        const results = (await Promise.all(promises)).filter((p): p is Product => p !== null)

        setProducts(prev => {
          const map = new Map<number, Product>()
          prev.forEach(p => map.set(p.id, p))
          results.forEach(p => map.set(p.id, p))
          return Array.from(map.values())
        })
      } catch (fallbackErr) {
        console.warn("Individual fetch fallback also failed:", fallbackErr)
      }
    }
  }

  React.useEffect(() => {
    if (eventId) fetchEvent()
  }, [eventId])

  // FIXED: Fetch ALL categories recursively
  const fetchCategories = async (parentId: number | null = null, accumulated: ProductCategory[] = []) => {
    if (loadingCategories) return;
  
    setLoadingCategories(true);
  
    try {
      const params = new URLSearchParams();
      if (parentId !== null) {
        params.set("parent_id", parentId.toString());
      } else {
        params.set("parent_id", "null"); // top level
      }
  
      const res = await axiosClient.get(`/product-categories?${params}`);
      const fetched: ProductCategory[] = res.data.data || [];
  
      // Add only new categories (by ID)
      const existingIds = new Set(accumulated.map(c => c.id));
      const reallyNew = fetched.filter(cat => !existingIds.has(cat.id));
  
      const updated = [...accumulated, ...reallyNew];
  
      // Recurse into children if any were added
      if (reallyNew.length > 0) {
        // We can continue recursively, but for UX it's better to lazy-load children on expand/select
        // For now we'll just accumulate top-down
      }
  
      setCategories(prev => {
        // Final deduplication + rebuild children links
        const all = [...prev, ...updated];
        const uniqueMap = new Map<number, ProductCategory>();
        all.forEach(cat => {
          if (!uniqueMap.has(cat.id)) {
            uniqueMap.set(cat.id, { ...cat, children: [] });
          }
        });
  
        // Rebuild parent → children relationships
        uniqueMap.forEach(cat => {
          if (cat.parent_id !== null) {
            const parent = uniqueMap.get(cat.parent_id);
            if (parent) {
              parent.children = [...parent.children, cat];
            }
          }
        });
  
        return Array.from(uniqueMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      });
  
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      showToast("Failed to load categories", "error");
    } finally {
      setLoadingCategories(false);
    }
  };

  

  const fetchProducts = async (page: number, search: string, categoryId?: number) => {
    setLoadingProducts(true)
    try {
      const params = new URLSearchParams({
        per_page: perPage.toString(),
        page: page.toString(),
        ...(search && { search }),
        ...(categoryId && { category_id: categoryId.toString() }),
        is_active: "true",
        with: "images,category",
      })

      const res = await axiosClient.get(`/products?${params}`)
      const newItems = res.data.data.data as Product[]

      const itemsWithImage = newItems.map(p => {
        let primaryUrl: string | undefined
        if (p.images && p.images.length > 0) {
          const sorted = [...p.images].sort((a, b) => (a.position ?? 999) - (b.position ?? 999))
          primaryUrl = sorted[0]?.url
        }
        return {
          ...p,
          primary_image: primaryUrl,
        }
      })

      setProducts(prev => {
        const map = new Map<number, Product>()
        prev.forEach(existing => map.set(existing.id, existing))
        itemsWithImage.forEach(item => map.set(item.id, item))
        return Array.from(map.values())
      })

      const total = res.data.data.total ?? 0
      setHasMore(page * perPage < total)
    } catch (err) {
      console.error(err)
      showToast("Failed to load products", "error")
      setHasMore(false)
    } finally {
      setLoadingProducts(false)
    }
  }

  // FIXED: Load categories when dialog opens
  React.useEffect(() => {
    if (isProductDialogOpen) {
      setLoadingCategories(true)
       // Reset categories
      fetchCategories(null) // Fetch top-level first
      setCurrentPage(1)
      setHasMore(true)
      fetchProducts(1, productSearch, selectedCategoryId)
    }
  }, [isProductDialogOpen])

  // FIXED: Debounced category/product search
  React.useEffect(() => {
    if (!isProductDialogOpen) return
    
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      setHasMore(true)
      fetchProducts(1, productSearch, selectedCategoryId)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [productSearch, selectedCategoryId, isProductDialogOpen])

  // Load child categories when parent is selected
  React.useEffect(() => {
    if (!isProductDialogOpen || !selectedCategoryId || loadingCategories) return
    
    // Check if we already have children for this category
    const currentCat = categories.find(c => c.id === selectedCategoryId)
    if (currentCat?.children.length === 0) {
      setLoadingCategories(true)
      fetchCategories(selectedCategoryId)
    }
  }, [selectedCategoryId, isProductDialogOpen])

  const [sentryRef] = useInfiniteScroll({
    loading: loadingProducts,
    hasNextPage: hasMore,
    onLoadMore: () => {
      if (!loadingProducts && hasMore && isProductDialogOpen) {
        const next = currentPage + 1
        setCurrentPage(next)
        fetchProducts(next, productSearch, selectedCategoryId)
      }
    },
    disabled: !isProductDialogOpen,
    rootMargin: "0px 0px 200px 0px",
  })

  const toggleProduct = (id: number) => {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
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

    setSaving(true)
    try {
      await axiosClient.put(`/events/${eventId}`, {
        name,
        location: location || null,
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
        end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
        is_active: isActive,
      })

      if (boothName.trim()) {
        try {
          await axiosClient.put(`/events/${eventId}/booth`, {
            booth_name: boothName,
            booth_code: boothCode || null,
          })
        } catch (e: any) {
          if (e.response?.status === 404) {
            await axiosClient.post(`/events/${eventId}/booth`, {
              booth_name: boothName,
              booth_code: boothCode || null,
            })
          } else {
            throw e
          }
        }
      }

      const initial = new Set(initialProductIds)
      const current = new Set(selectedProductIds)

      for (const id of initial) {
        if (!current.has(id)) {
          await axiosClient.delete(`/events/${eventId}/products/${id}`).catch(() => {})
        }
      }

      for (const id of current) {
        if (!initial.has(id)) {
          await axiosClient.post(`/events/${eventId}/products`, { product_id: id }).catch(() => {})
        }
      }

      if (isActive) {
        await axiosClient.patch(`/events/${eventId}/activate`).catch(() => {})
      }

      showToast("Event updated successfully", "success")
      router.push("/events")
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save changes", "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
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
                  <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Edit Event</h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Update event details, booth and showcased products.
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
                <CardDescription>Only one event can be active at a time.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                  <Label htmlFor="active">This event is currently active</Label>
                </div>

                <div className="space-y-2">
                  <Label>Event Name *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <div className="relative">
                    <Input className="pl-9" value={location} onChange={e => setLocation(e.target.value)} />
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Hall Number *</Label>
                    <Input value={boothName} onChange={e => setBoothName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Booth Code</Label>
                    <Input value={boothCode} onChange={e => setBoothCode(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle>Products in Booth</CardTitle>
                <CardDescription>
                  {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setProductSearch("")
                      setSelectedCategoryId(undefined)
                      setIsProductDialogOpen(true)
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Manage Products
                  </Button>
                </div>

                {selectedProductIds.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                    {selectedProductIds.map(id => {
                      const product = products.find(p => p.id === id) || {
                        id,
                        name: `Product #${id}`,
                        sku: "—",
                        url_slug: "",
                        category: undefined,
                        primary_image: undefined,
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
                            <p className="font-medium text-sm line-clamp-2 leading-snug">{product.name}</p>
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
                  <Button variant="outline" className="w-full" onClick={() => router.push("/events")} disabled={saving}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving} className="w-full bg-green-600 hover:bg-green-700">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

        {/* FIXED: Dialog with proper scrolling */}
        <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
          <DialogContent className="!w-[95vw] !max-w-[1400px] !max-h-[95vh] flex flex-col p-0 m-0">
            {/* Header - Fixed height */}
            <div className="p-6 border-b shrink-0">
              <DialogHeader>
                <DialogTitle>Select Products for Booth</DialogTitle>
                <DialogDescription>
                  Choose products to showcase at the event booth. Selected items show blue checkmark.
                </DialogDescription>
              </DialogHeader>

              {/* Search & Filter - Fixed height */}
              <div className="flex gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, SKU..."
                    className="pl-9 h-10"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                  />
                </div>

                <Select
  value={selectedCategoryId ? selectedCategoryId.toString() : "all"}
  onValueChange={v => setSelectedCategoryId(v === "all" ? undefined : Number(v))}
>
  <SelectTrigger className="w-[240px] h-10">
    <SelectValue 
      placeholder={loadingCategories ? "Loading categories..." : "All Categories"} 
    />
  </SelectTrigger>
  <SelectContent className="max-h-96 overflow-y-auto">
    <SelectItem value="all">
      All Categories {flattenedCategories.length > 0 ? `(${flattenedCategories.length})` : ""}
    </SelectItem>

    {flattenedCategories.map(cat => (
      <SelectItem
        key={cat.id}               // now safe because we deduplicated
        value={cat.id.toString()}
        className="truncate"
      >
        <span className="max-w-[220px] truncate block" title={cat.path}>
          {cat.path}
        </span>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
              </div>
            </div>

            {/* Scrollable Content - Takes remaining space */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {loadingProducts && products.length === 0 ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin" />
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    {productSearch || selectedCategoryId ? "No matching products" : "No products found"}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {products.map(product => {
                      const isSelected = selectedProductIds.includes(product.id)
                      return (
                        <div
                          key={product.id}
                          className={cn(
                            "group relative border rounded-xl overflow-hidden transition-all duration-200 bg-card cursor-pointer",
                            "hover:shadow-md hover:border-primary/40",
                            isSelected && "border-primary/60 bg-primary/5 shadow-sm ring-1 ring-primary/20"
                          )}
                          onClick={() => toggleProduct(product.id)}
                        >
                          <div className="absolute top-3 right-3 z-20 pointer-events-none">
                            <Checkbox
                              checked={isSelected}
                              className={cn(
                                "h-10 w-10 rounded-full border-2 shadow-sm transition-all",
                                isSelected
                                  ? "bg-primary border-primary shadow-lg shadow-primary/40 scale-105"
                                  : "border-muted-foreground/60 bg-background/80 hover:border-primary/70 hover:bg-muted/60 hover:scale-105"
                              )}
                            >
                              <Check
                                className={cn(
                                  "h-6 w-6 transition-all",
                                  isSelected
                                    ? "text-primary-foreground scale-100 opacity-100"
                                    : "text-transparent scale-75 opacity-0"
                                )}
                                strokeWidth={3}
                              />
                            </Checkbox>
                          </div>

                          <div className="aspect-square relative mb-3 rounded-lg overflow-hidden bg-muted">
                            {product.primary_image ? (
                              <img
                                src={product.primary_image}
                                alt={product.name}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted/60">
                                <Package className="h-10 w-10 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>

                          <div className="px-3 pb-4 space-y-1.5">
                            <p className="font-medium text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                              {product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              SKU: {product.sku || "—"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate" title={product.category?.name}>
                              {product.category?.name ?? "Uncategorized"}
                            </p>
                          </div>

                          {isSelected && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {hasMore && (
                  <div className="flex justify-center py-10" ref={sentryRef}>
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
              </div>

              {/* Fixed Footer */}
              <div className="p-6 border-t bg-background/80 backdrop-blur-sm shrink-0">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 text-sm font-medium">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span>
                      {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>

                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsProductDialogOpen(false)} 
                      className="flex-1 sm:flex-none"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => setIsProductDialogOpen(false)}
                      className="gap-2 flex-1 sm:flex-none"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Done ({selectedProductIds.length})
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}