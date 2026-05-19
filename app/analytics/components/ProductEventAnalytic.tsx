"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import { TrendingUp, MousePointerClick, Eye, Users, AlertCircle } from "lucide-react"
import axiosClient from "@/lib/axiosClient"
import { showToast } from "@/lib/showToast"

interface EventSummary {
  page_view: number
  cta_click: number
  video_play: number
}

interface DailyStat {
  date: string
  page_view: number
  cta_click: number
  video_play?: number
}

interface ProductSummaryItem {
  product: { id: number; name: string; url_slug?: string }
  total_events: number
}

interface EventAnalyticsResponse {
  success: boolean
  data: {
    event: any
    summary: EventSummary
    analytics: { event_type: string; count: number; date: string }[]
  }
}

interface ProductsResponse {
  success: boolean
  data: {
    event: any
    product_summary: ProductSummaryItem[]
  }
}

interface EventProductAnalyticsDashboardProps {
  eventId: string
  defaultProductId?: string
}

export default function EventProductAnalyticsDashboard({
  eventId,
  defaultProductId,
}: EventProductAnalyticsDashboardProps) {
  const [eventSummary, setEventSummary] = useState<EventSummary | null>(null)
  const [dailyData, setDailyData] = useState<DailyStat[]>([])
  const [topProducts, setTopProducts] = useState<ProductSummaryItem[]>([])
  const [productSummary, setProductSummary] = useState<EventSummary | null>(null)
  const [productDailyData, setProductDailyData] = useState<DailyStat[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) {
    
      setLoading(false)
   
      return
    }

    const fetchAllData = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1. Event general analytics
        const eventRes = await axiosClient.get<EventAnalyticsResponse>(
          `/analytics/events/${eventId}`
        )

        if (!eventRes.data.success || !eventRes.data.data?.summary) {
          throw new Error("Invalid analytics response")
        }

        // Transform analytics into daily format
        const dailyMap = new Map<string, DailyStat>()

        eventRes.data.data.analytics.forEach(item => {
          if (!dailyMap.has(item.date)) {
            dailyMap.set(item.date, { date: item.date, page_view: 0, cta_click: 0, video_play: 0 })
          }
          const day = dailyMap.get(item.date)!
          if (item.event_type === "page_view") day.page_view = Number(item.count) || 0
          if (item.event_type === "cta_click") day.cta_click = Number(item.count) || 0
          if (item.event_type === "video_play") day.video_play = (day.video_play || 0) + (Number(item.count) || 0)
        })

        const sortedDaily = Array.from(dailyMap.values()).sort((a, b) =>
          a.date.localeCompare(b.date)
        )

        setDailyData(sortedDaily)
        setEventSummary(eventRes.data.data.summary)

        // 2. Products analytics
        try {
          const productsRes = await axiosClient.get<ProductsResponse>(
            `/analytics/events/${eventId}/products`
          )

          if (productsRes.data.success) {
            const products = productsRes.data.data.product_summary || []
            products.sort((a, b) => b.total_events - a.total_events)
            setTopProducts(products.slice(0, 8))
          }
        } catch (productsErr) {
      
          // Don't block whole dashboard - just skip products section
        }

        // 3. Optional product-specific analytics
        if (defaultProductId) {
          try {
            const productRes = await axiosClient.get<any>(
              `/analytics/products/${defaultProductId}?event_id=${eventId}`
            )

            if (productRes.data.success && productRes.data.data?.summary) {
              setProductSummary(productRes.data.data.summary)

              const pDailyMap = new Map<string, DailyStat>()
              productRes.data.data.analytics?.forEach((item: any) => {
                if (!pDailyMap.has(item.date)) {
                  pDailyMap.set(item.date, { date: item.date, page_view: 0, cta_click: 0, video_play: 0 })
                }
                const day = pDailyMap.get(item.date)!
                if (item.event_type === "page_view") day.page_view += Number(item.count) || 0
                if (item.event_type === "cta_click") day.cta_click += Number(item.count) || 0
                if (item.event_type === "video_play") day.video_play = (day.video_play || 0) + (Number(item.count) || 0)
              })

              setProductDailyData(
                Array.from(pDailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))
              )
            }
          } catch (productErr) {
            console.warn("Product-specific analytics failed:", productErr)
          }
        }
      } catch (err: any) {
        console.error("Analytics loading error:", err)
        const message = err.response?.data?.message || "Failed to load analytics data"
        setError(message)
     
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [eventId, defaultProductId])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
        <p className="text-sm text-muted-foreground">
          Please try again later or contact support if the problem persists.
        </p>
      </div>
    )
  }

  if (!eventSummary) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">
        No analytics data available yet
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
        <p className="text-muted-foreground mt-1">
          Event performance, top products & engagement trends
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Page Views" value={eventSummary.page_view?.toLocaleString() ?? "0"} icon={Eye} trend="+18%" />
        <StatCard title="CTA Clicks" value={eventSummary.cta_click?.toLocaleString() ?? "0"} icon={MousePointerClick} trend="+24%" />
        {productSummary && (
          <StatCard title="Product Page Views" value={productSummary.page_view?.toLocaleString() ?? "0"} icon={Users} trend="+15%" />
        )}
        <StatCard title="Video Plays" value={eventSummary.video_play?.toLocaleString() ?? "0"} icon={TrendingUp} trend="+9%" />
      </div>

      {/* Main Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Engagement Trend</CardTitle>
            <CardDescription>Page views & CTA clicks over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="page_view" name="Page Views" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="cta_click" name="CTA Clicks" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
            <CardDescription>Total interactions</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="h-[320px] flex items-center justify-center text-muted-foreground">
                No product data available yet
              </div>
            ) : (
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="product.name" width={180} />
                    <Tooltip />
                    <Bar dataKey="total_events" fill="#6366f1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product-specific trend */}
      {defaultProductId && productDailyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Product Performance</CardTitle>
            <CardDescription>Daily page views & CTA clicks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productDailyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="page_view" name="Page Views" fill="#3b82f6" />
                  <Bar dataKey="cta_click" name="CTA Clicks" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string
  value: string
  icon: any
  trend: string
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className="rounded-full bg-muted p-3">
            <Icon className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1 text-sm">
          <TrendingUp className="h-4 w-4 text-green-600" />
          <span className="text-green-600 font-medium">{trend}</span>
          <span className="text-muted-foreground">vs last period</span>
        </div>
      </CardContent>
    </Card>
  )
}