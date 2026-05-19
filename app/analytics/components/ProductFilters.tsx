"use client"

import { useState, useEffect } from "react"
import axiosClient from "@/lib/axiosClient"
import { showToast } from "@/lib/showToast"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/* ────────────────────────────────────────────── */
/* Types */
/* ────────────────────────────────────────────── */

interface Event {
  id: number
  name: string
  location: string
  start_date: string
  end_date: string
  is_active: boolean
}

interface Product {
  id: number
  name: string
  sku: string
}

interface ProductFiltersProps {
  onFilterChange: (filters: {
    productId: string
    dateRange: string
    eventId: string
  }) => void
}

/* ────────────────────────────────────────────── */
/* Component */
/* ────────────────────────────────────────────── */

export default function ProductFilters({ onFilterChange }: ProductFiltersProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [events, setEvents] = useState<Event[]>([])

  const [productId, setProductId] = useState("all")
  const [eventId, setEventId] = useState("all")
  const [dateRange, setDateRange] = useState("today")

  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingEvents, setLoadingEvents] = useState(true)

  /* ────────────────────────────────────────────── */
  /* Fetch Products */
  /* ────────────────────────────────────────────── */

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const res = await axiosClient.get("/products", {
          params: {
            per_page: 100,
            status: "published",
            is_active: true,
          },
        })

        if (res.data.success) {
          setProducts(res.data.data.data || [])
        }
      } catch (err) {
        console.error(err)
        showToast("Failed to load products", "error")
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
  }, [])

  /* ────────────────────────────────────────────── */
  /* Fetch Events */
  /* ────────────────────────────────────────────── */

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true)
        const res = await axiosClient.get("/events")

        if (res.data.success) {
          const allEvents = res.data.data || []
          setEvents(allEvents)

          const firstActive = allEvents.find((e: Event) => e.is_active)
          if (firstActive) {
            setEventId(firstActive.id.toString())
          }
        }
      } catch (err) {
        console.error(err)
        showToast("Failed to load events", "error")
      } finally {
        setLoadingEvents(false)
      }
    }

    fetchEvents()
  }, [])

  /* ────────────────────────────────────────────── */
  /* Notify Parent */
  /* ────────────────────────────────────────────── */

  useEffect(() => {
    if (loadingProducts || loadingEvents) return

    onFilterChange({
      productId,
      dateRange,
      eventId,
    })
  }, [productId, dateRange, eventId, loadingProducts, loadingEvents, onFilterChange])

  /* ────────────────────────────────────────────── */
  /* UI */
  /* ────────────────────────────────────────────── */

  return (
    <div className="flex flex-wrap gap-4">
      {/* ───────────── Product Filter ───────────── */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-[260px] justify-between"
          >
            {productId === "all"
              ? "All Products"
              : products.find(p => p.id.toString() === productId)?.name}

            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[260px] p-0">
          <Command>
            <CommandInput placeholder="Search product..." />
            <CommandEmpty>No product found.</CommandEmpty>

            <CommandGroup>
              <CommandItem onSelect={() => setProductId("all")}>
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    productId === "all" ? "opacity-100" : "opacity-0"
                  )}
                />
                All Products
              </CommandItem>

              {loadingProducts ? (
                <div className="px-3 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading products...
                </div>
              ) : (
                products.map(product => (
                  <CommandItem
                    key={product.id}
                    onSelect={() => setProductId(product.id.toString())}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        productId === product.id.toString()
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {product.name}
                    {product.sku && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({product.sku})
                      </span>
                    )}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* ───────────── Date Filter ───────────── */}
      <Select value={dateRange} onValueChange={setDateRange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Date range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="7days">Last 7 days</SelectItem>
          <SelectItem value="30days">Last 30 days</SelectItem>
          <SelectItem value="90days">Last 90 days</SelectItem>
        </SelectContent>
      </Select>

      {/* ───────────── Event Filter ───────────── */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-[300px] justify-between"
          >
            {eventId === "all"
              ? "All Events"
              : events.find(e => e.id.toString() === eventId)?.name}

            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search event..." />
            <CommandEmpty>No event found.</CommandEmpty>

            <CommandGroup>
              <CommandItem onSelect={() => setEventId("all")}>
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    eventId === "all" ? "opacity-100" : "opacity-0"
                  )}
                />
                All Events
              </CommandItem>

              {loadingEvents ? (
                <div className="px-3 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading events...
                </div>
              ) : (
                events.map(event => (
                  <CommandItem
                    key={event.id}
                    onSelect={() => setEventId(event.id.toString())}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        eventId === event.id.toString()
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>
                        {event.name}
                        {!event.is_active && (
                          <span className="ml-1 text-xs italic text-muted-foreground">
                            (Inactive)
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {event.location}
                      </span>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
