'use client'

import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Plus, QrCode, BarChart3, MapPin } from 'lucide-react'
import Link from 'next/link'
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import axiosClient from "@/lib/axiosClient"
import { showToast } from "@/lib/showToast"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000
    }
  }
})

interface Booth {
  id: number
  event_id: number
  booth_name: string
  booth_code: string | null
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

interface EventWithAnalytics extends Event {
  total_scans: number
  products_count: number
}

async function fetchEvents(): Promise<EventWithAnalytics[]> {
  const response = await axiosClient.get('/events')
  if (!response.data.success) {
    throw new Error(response.data.message || 'Could not load events')
  }

  const events = response.data.data
  const result: EventWithAnalytics[] = []

  for (const event of events) {
    let total_scans = 0
    let products_count = 0

    if (event.booth) {
      try {
        const analytics = await axiosClient.get(`/analytics/events/${event.id}`)
        if (analytics.data.success) {
          const sum = analytics.data.data.summary
          total_scans = (sum?.qr_scan || 0) + (sum?.page_view || 0) + (sum?.cta_click || 0)
        }
      } catch (err) {
        console.warn('Analytics not loaded for event', event.id)
      }

      try {
        const products = await axiosClient.get(`/events/${event.id}/products`)
        if (products.data.success) {
          products_count = products.data.data.length
        }
      } catch (err) {
        console.warn('Products not loaded for event', event.id)
      }
    }

    result.push({
      ...event,
      total_scans,
      products_count
    })
  }

  return result
}

function BoothsPageContent() {
  const { data: events = [], isLoading, error, refetch } = useQuery({
    queryKey: ['events-with-analytics'],
    queryFn: fetchEvents,
    onError: (err: any) => {
      showToast({
        title: "Error",
        description: err.message || "Failed to load events",
        variant: "destructive"
      })
    }
  })

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading your events...</div>
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500 mb-4">Something went wrong</p>
        <Button onClick={() => refetch()}>Try again</Button>
      </div>
    )
  }

  const booths = events
    .filter(e => e.booth) // Only show events that have a booth
    .map(event => ({
      id: event.booth!.id,
      boothName: event.booth!.booth_name,
      eventName: event.name,
      location: event.location || '–',
      products: event.products_count,
      scans: event.total_scans,
      eventId: event.id,
      isActive: event.is_active,
    }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Event Booths</h1>
          <p className="text-muted-foreground mt-2">
            Manage booths across all your events
          </p>
        </div>
        <Link href="/events/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Booth
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search booths..." className="pl-9" />
        </div>
        <Button variant="outline">All Events</Button>
        <Button variant="outline">All Zones</Button>
      </div>

      {/* Booths Grid */}
      {booths.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No booths yet</p>
          <p className="text-sm mt-2">Create an event and activate it to generate a booth</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {booths.map((booth) => (
            <Card key={booth.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{booth.boothName}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {booth.location}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">{booth.eventName}</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Products</p>
                    <p className="text-2xl font-bold">{booth.products}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Scans</p>
                    <p className="text-2xl font-bold">{booth.scans}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/events/${booth.eventId}/qr`}>
                      <QrCode className="h-4 w-4 mr-1" />
                      QR Code
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/events/${booth.eventId}/analytics`}>
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Analytics
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BoothsPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardLayout>
        <BoothsPageContent />
      </DashboardLayout>
    </QueryClientProvider>
  )
}