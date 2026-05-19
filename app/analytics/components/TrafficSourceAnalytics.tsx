"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import axiosClient from "@/lib/axiosClient"
import { showToast } from "@/lib/showToast"

interface TrafficSource {
  traffic_source: string
  page_views: number
  unique_visitors: number
}

interface ApiResponse {
  success: boolean
  data: {
    event: { id: string | number; name: string }
    traffic_sources: TrafficSource[]
  }
}

interface ChartDataItem {
  name: string
  views: number
  visitors: number
}

interface TrafficSourceAnalyticsProps {
  eventId: string
}

export function TrafficSourceAnalytics({ eventId }: TrafficSourceAnalyticsProps) {
  const [chartData, setChartData] = useState<ChartDataItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) {
    
      setLoading(false)
      return
    }

    const fetchTrafficSources = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await axiosClient.get<ApiResponse>(
          `/analytics/events/${eventId}/traffic-sources`
        )

        if (!response.data.success) {
          throw new Error("Failed to fetch traffic sources data")
        }

        const sources = response.data.data.traffic_sources || []

        const formattedData = sources
          .map(item => ({
            name: item.traffic_source,
            views: item.page_views,
            visitors: item.unique_visitors,
          }))
          // Optional: sort by views descending
          .sort((a, b) => b.views - a.views)

        setChartData(formattedData)
      } catch (err) {
        console.error("Error fetching traffic sources:", err)
        const message = err instanceof Error ? err.message : "Something went wrong"
        setError(message)
      
      } finally {
        setLoading(false)
      }
    }

    fetchTrafficSources()
  }, [eventId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Sources</CardTitle>
        <CardDescription>Where users are coming from</CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="h-[280px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading traffic sources...</p>
          </div>
        ) : error ? (
          <div className="h-[280px] flex items-center justify-center text-destructive">
            {error}
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center">
            <p className="text-muted-foreground">No traffic source data available yet</p>
          </div>
        ) : (
          <ChartContainer
            config={{
              views: { label: "Page Views", color: "hsl(220,90%,55%)" },
              visitors: { label: "Visitors", color: "hsl(160,70%,45%)" },
            }}
            className="h-[280px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="views"
                  fill="var(--color-views)"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="visitors"
                  fill="var(--color-visitors)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}