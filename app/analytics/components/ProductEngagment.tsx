"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import axiosClient from "@/lib/axiosClient"
import { showToast } from "@/lib/showToast"

interface EngagementData {
  avg_time_on_page: number
  avg_scroll_depth: number
  bounce_rate: number
}

interface ApiResponse {
  success: boolean
  data: {
    product: {
      id: number
      name: string
      // ... other fields
    }
    engagement: EngagementData
  }
}

interface ProductEngagementProps {
  productId: string | number
  eventId?: string | number    // optional
}

export default function ProductEngagement({
  productId,
  eventId,
}: ProductEngagementProps) {
  const [engagement, setEngagement] = useState<EngagementData | null>(null)
  const [productName, setProductName] = useState<string>("Loading...")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEngagement = async () => {
      if (!productId) return

      try {
        setLoading(true)

        let url = `/analytics/products/${productId}/engagement`
        if (eventId) {
          url += `?event_id=${eventId}`
        }

        const response = await axiosClient.get<ApiResponse>(url)

        if (!response.data.success) {
          throw new Error("API returned unsuccessful response")
        }

        const { product, engagement } = response.data.data

        setProductName(product.name)
        setEngagement(engagement)
      } catch (error) {
      
     
      } finally {
        setLoading(false)
      }
    }

    fetchEngagement()
  }, [productId, eventId])

  const timeInMinutes = engagement
    ? (engagement.avg_time_on_page / 60).toFixed(1)
    : "0.0"

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Engagement</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">Fetching engagement data...</p>
        </CardContent>
      </Card>
    )
  }

  if (!engagement) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Engagement</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">No engagement data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{productName} – Engagement</CardTitle>
        <CardDescription>User behavior on product page</CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Avg Time on Page */}
        <div className="rounded-xl border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Avg Time on Page</p>
          <p className="text-4xl font-bold mt-2">
            {timeInMinutes} <span className="text-2xl">min</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            ({engagement.avg_time_on_page} seconds)
          </p>
        </div>

        {/* Scroll Depth */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Avg Scroll Depth</span>
            <span className="font-medium">{engagement.avg_scroll_depth}%</span>
          </div>
          <Progress value={engagement.avg_scroll_depth} className="h-3" />
        </div>

        {/* Bounce Rate */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Bounce Rate</span>
            <span className="font-medium">{engagement.bounce_rate}%</span>
          </div>
          <Progress
            value={engagement.bounce_rate}
            className="h-3"
            indicatorColor={
              engagement.bounce_rate > 60
                ? "bg-red-500"
                : engagement.bounce_rate > 40
                ? "bg-amber-500"
                : "bg-green-500"
            }
          />
          <p className="text-xs text-muted-foreground">Lower is better</p>
        </div>
      </CardContent>
    </Card>
  )
}