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

interface DeviceAnalytic {
  device_type: string
  browser: string
  os: string
  page_views: number
  unique_visitors: number
}

interface ApiResponse {
  success: boolean
  data: {
    event: any
    device_analytics: DeviceAnalytic[]
  }
}

interface ChartData {
  name: string
  views: number
  visitors: number
}

interface DeviceAnalyticsProps {
  eventId: string // You need to pass eventId from parent component
}

export function DeviceAnalytics({ eventId }: DeviceAnalyticsProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!eventId) {
    
      setLoading(false)
      return
    }

    const fetchDeviceAnalytics = async () => {
      try {
        setLoading(true)
        const response = await axiosClient.get<ApiResponse>(
          `/analytics/events/${eventId}/device-analytics`
        )

        if (!response.data.success) {
          throw new Error("API returned unsuccessful response")
        }

        // Group by device_type (you can change grouping logic if needed)
        const grouped = response.data.data.device_analytics.reduce(
          (acc: Record<string, ChartData>, item: DeviceAnalytic) => {
            const key = item.device_type

            if (!acc[key]) {
              acc[key] = {
                name: key,
                views: 0,
                visitors: 0,
              }
            }

            acc[key].views += item.page_views
            acc[key].visitors += item.unique_visitors

            return acc
          },
          {}
        )

        const formattedData = Object.values(grouped).sort((a, b) =>
          a.name.localeCompare(b.name)
        )

        setChartData(formattedData)
      } catch (error) {
       
      } finally {
        setLoading(false)
      }
    }

    fetchDeviceAnalytics()
  }, [eventId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Analytics</CardTitle>
        <CardDescription>Usage by device type</CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="h-[280px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading device analytics...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center">
            <p className="text-muted-foreground">No data available</p>
          </div>
        ) : (
          <ChartContainer
            config={{
              views: { label: "Page Views", color: "hsl(200,90%,55%)" },
              visitors: { label: "Visitors", color: "hsl(140,70%,45%)" },
            }}
            className="h-[280px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="views" fill="var(--color-views)" />
                <Bar dataKey="visitors" fill="var(--color-visitors)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}