"use client"

import { useEffect, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import axiosClient from "@/lib/axiosClient"
import { showToast } from "@/lib/showToast"

interface ProductMetrics {
  product: {
    id: number
    name: string
    // ... other product fields
  }
  metrics: {
    page_views: number
    unique_visitors: number
    button_clicks: number
    form_submissions: number
    conversion_rate: number
    avg_time_on_page: number
    avg_scroll_depth: number
  }
}

interface ApiResponse {
  success: boolean
  data: ProductMetrics
}

type ChartDataItem = {
  name: string
  value: number
}

interface ProductMetricChartProps {
  productId: number | string
  eventId?: number | string          // optional
}

export default function ProductMetricChart({ 
  productId, 
  eventId 
}: ProductMetricChartProps) {
  
  const [chartData, setChartData] = useState<ChartDataItem[]>([])
  const [metrics, setMetrics] = useState<ProductMetrics["metrics"] | null>(null)
  const [productName, setProductName] = useState<string>("Loading...")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        
        let url = `/analytics/products/${productId}/metrics`
        if (eventId) {
          url += `?event_id=${eventId}`
        }

        const response = await axiosClient.get<ApiResponse>(url)
        
        if (!response.data.success) {
          throw new Error("API returned unsuccessful response")
        }

        const { product, metrics } = response.data.data
        
        setProductName(product.name)
        setMetrics(metrics)

        const newChartData: ChartDataItem[] = [
          { name: "Page Views", value: metrics.page_views },
          { name: "Visitors",    value: metrics.unique_visitors },
          { name: "Clicks",      value: metrics.button_clicks },
          { name: "Submissions", value: metrics.form_submissions },
        ]

        setChartData(newChartData)

      } catch (error) {
      
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchMetrics()
    }
  }, [productId, eventId])

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
          <CardDescription>Loading metrics...</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">Fetching data...</p>
        </CardContent>
      </Card>
    )
  }

  // Error / no data state
  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Performance</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No metrics available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{productName} – Performance</CardTitle>
        <CardDescription>User engagement & conversions</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Chart */}
        <ChartContainer
          config={{
            value: { label: "Count", color: "hsl(220, 90%, 55%)" },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="value" 
                fill="var(--color-value)" 
                radius={[6, 6, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* KPI Section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Kpi label="Conversion Rate" value={`${metrics.conversion_rate}%`} />
          <Kpi label="Avg Time on Page" value={`${metrics.avg_time_on_page}s`} />
          <Kpi label="Scroll Depth" value={`${metrics.avg_scroll_depth}%`} />
        </div>
      </CardContent>
    </Card>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 text-center">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  )
}