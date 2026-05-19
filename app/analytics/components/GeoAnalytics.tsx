"use client"

import { useEffect, useState } from "react"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import axiosClient from "@/lib/axiosClient"
import { showToast } from "@/lib/showToast"

interface GeoAnalytic {
  country_code: string | null
  region: string | null
  city: string | null
  page_views: number
  unique_visitors: number
}

interface ApiResponse {
  success: boolean
  data: {
    event: any
    geo_analytics: GeoAnalytic[]
  }
}

interface GeoAnalyticsProps {
  eventId: string
}

export function GeoAnalytics({ eventId }: GeoAnalyticsProps) {
  const [geoData, setGeoData] = useState<GeoAnalytic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!eventId) {
  
      setLoading(false)
      return
    }

    const fetchGeoAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await axiosClient.get<ApiResponse>(`/analytics/events/${eventId}/geo-analytics` )

        if (!response.data.success) {
          throw new Error("API returned unsuccessful response")
        }

        const analytics = response.data.data.geo_analytics || []
        setGeoData(analytics)
      } catch (err) {
        console.error("Failed to fetch geographic analytics:", err)
        const message = err instanceof Error ? err.message : "Unknown error"
        setError(message)
      
      } finally {
        setLoading(false)
      }
    }

    fetchGeoAnalytics()
  }, [eventId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Geographic Analytics</CardTitle>
        <CardDescription>User locations</CardDescription>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading geographic data...
          </div>
        ) : error ? (
          <div className="py-8 text-center text-destructive">
            {error}
            <br />
            <small>(IP geolocation might not be configured yet)</small>
          </div>
        ) : geoData.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No geographic data available yet
            <br />
            <small>(Geolocation service might not be configured)</small>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Country</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Visitors</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {geoData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.country_code ?? "—"}</TableCell>
                  <TableCell>{row.region ?? "—"}</TableCell>
                  <TableCell>{row.city ?? "—"}</TableCell>
                  <TableCell className="text-right">{row.page_views}</TableCell>
                  <TableCell className="text-right">
                    {row.unique_visitors}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}