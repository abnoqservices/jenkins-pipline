"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import axiosClient from "@/lib/axiosClient"
import { showToast } from "@/lib/showToast"

interface FunnelStage {
  stage: string
  count: number
  percentage: number
  color?: string
}

interface FunnelData {
  page_views: { count: number; percentage: number }
  engaged_users: { count: number; percentage: number }
  button_clicks: { count: number; percentage: number }
  form_submissions: { count: number; percentage: number }
  [key: string]: any
}

interface ApiResponse {
  success: boolean
  data: {
    event: any
    funnel: FunnelData
  }
}

const STAGE_COLORS = [
  "bg-blue-500",
  "bg-indigo-500",
  "bg-purple-500",
  "bg-green-500",
]

interface ConversionFunnelProps {
  eventId: string | number
}

export default function ConversionFunnel({ eventId }: ConversionFunnelProps) {
  const [stages, setStages] = useState<FunnelStage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) {
      setError("Event ID is required")
      setLoading(false)
      return
    }

    const fetchFunnel = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await axiosClient.get<ApiResponse>(
          `/analytics/events/${eventId}/conversion-funnel`
        )

        if (!response.data.success) {
          throw new Error("Failed to fetch conversion funnel")
        }

        const { funnel } = response.data.data

        const newStages: FunnelStage[] = [
          {
            stage: "Page Views",
            count: funnel.page_views?.count ?? 0,
            percentage: funnel.page_views?.percentage ?? 100,
            color: STAGE_COLORS[0],
          },
          {
            stage: "Engaged Users",
            count: funnel.engaged_users?.count ?? 0,
            percentage: funnel.engaged_users?.percentage ?? 0,
            color: STAGE_COLORS[1],
          },
          {
            stage: "Button Clicks",
            count: funnel.button_clicks?.count ?? 0,
            percentage: funnel.button_clicks?.percentage ?? 0,
            color: STAGE_COLORS[2],
          },
          {
            stage: "Form Submissions",
            count: funnel.form_submissions?.count ?? 0,
            percentage: funnel.form_submissions?.percentage ?? 0,
            color: STAGE_COLORS[3],
          },
        ].filter((stage) => stage.count > 0) // hide zero-count stages

        setStages(newStages)
      } catch (err) {
      
      
      } finally {
        setLoading(false)
      }
    }

    fetchFunnel()
  }, [eventId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center text-muted-foreground">
          Fetching conversion data...
        </CardContent>
      </Card>
    )
  }

  if (error || stages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center text-muted-foreground">
          {error || "No conversion data available yet"}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversion Funnel</CardTitle>
        <CardDescription>Customer journey from view to conversion</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {stages.map((item, index) => (
            <div key={item.stage} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.stage}</span>
                <span className="text-muted-foreground">
                  {item.count.toLocaleString()} ({item.percentage.toFixed(1)}%)
                </span>
              </div>

              <div className="h-10 rounded-full overflow-hidden bg-muted/40">
                <div
                  className={`h-full ${item.color} transition-all duration-700 flex items-center justify-end pr-3 text-xs font-medium text-white`}
                  style={{ width: `${item.percentage}%` }}
                >
                  {item.percentage > 8 && `${item.percentage.toFixed(1)}%`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}