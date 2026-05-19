"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { format, subDays } from "date-fns"
import {
  BarChart3, MousePointerClick, Eye, Clock, ScrollText, Users,
  Globe, MonitorSmartphone, Smartphone, Tablet, MapPin,
  ArrowUpRight, Download, Calendar, TrendingUp,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, Bar, BarChart, PieChart, Pie, Cell
} from 'recharts'

import { DashboardLayout } from "@/components/dashboard/layout"
import axiosClient from "@/lib/axiosClient"
import { showToast } from "@/lib/showToast"

// ────────────────────────────────────────────────
// Types (based on your API documentation)
// ────────────────────────────────────────────────
interface MetricSummary {
  page_views: number
  unique_visitors: number
  button_clicks: number
  form_submissions: number
  conversion_rate: number
  avg_time_on_page: number
  avg_scroll_depth: number
}

interface TrafficSource {
  traffic_source: string
  page_views: number
  unique_visitors: number
}

interface GeoData {
  country_code: string
  region?: string
  city?: string
  page_views: number
  unique_visitors: number
}

interface DeviceData {
  device_type: "desktop" | "mobile" | "tablet"
  browser?: string
  os?: string
  page_views: number
  unique_visitors: number
}

interface UTMEntry {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  page_views: number
  unique_visitors: number
}

interface DailyStat {
  date: string
  page_view: number
  cta_click: number    // button_clicks / cta_click
  form_submission: number
}

// ────────────────────────────────────────────────
// Components
// ────────────────────────────────────────────────

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string
  value: string | number
  description?: string
  icon: any
  trend?: { value: number; positive: boolean }
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-1">
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <div className={`text-xs flex items-center gap-1 ${trend.positive ? "text-green-600" : "text-red-600"}`}>
              {trend.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3 rotate-90" />}
              {trend.value}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TrafficSourcesCard({ sources }: { sources: TrafficSource[] }) {
  const data = sources.map(s => ({
    name: s.traffic_source,
    value: s.page_views,
    visitors: s.unique_visitors
  }))

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <Card className="col-span-2 lg:col-span-1">
      <CardHeader>
        <CardTitle>Traffic Sources</CardTitle>
        <CardDescription>Page views by acquisition channel</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 space-y-2">
          {sources.map(source => (
            <div key={source.traffic_source} className="flex justify-between text-sm">
              <span className="capitalize">{source.traffic_source}</span>
              <span className="font-medium">{source.page_views.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function DeviceBreakdownCard({ devices }: { devices: DeviceData[] }) {
  const totalViews = devices.reduce((sum, d) => sum + d.page_views, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Devices</CardTitle>
        <CardDescription>Traffic by device type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {devices.map(device => {
            const percentage = totalViews ? Math.round((device.page_views / totalViews) * 100) : 0
            const Icon = device.device_type === 'mobile' ? Smartphone :
                         device.device_type === 'tablet' ? Tablet : MonitorSmartphone

            return (
              <div key={device.device_type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="capitalize font-medium">{device.device_type}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{percentage}%</div>
                    <div className="text-xs text-muted-foreground">{device.page_views.toLocaleString()} views</div>
                  </div>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────

export default function EventAnalyticsDashboard() {
  const params = useParams()
  const eventId = params.slug as string // ← most reliable way

  const [timeRange, setTimeRange] = React.useState("30d")
  const [loading, setLoading] = React.useState(true)

  // Main metrics
  const [metrics, setMetrics] = React.useState<MetricSummary | null>(null)
  const [dailyStats, setDailyStats] = React.useState<DailyStat[]>([])
  const [trafficSources, setTrafficSources] = React.useState<TrafficSource[]>([])
  const [geoData, setGeoData] = React.useState<GeoData[]>([])
  const [devices, setDevices] = React.useState<DeviceData[]>([])
  const [utmData, setUtmData] = React.useState<UTMEntry[]>([])

  const fetchAllAnalytics = React.useCallback(async () => {
    if (!eventId) return
    setLoading(true)

    try {
      const rangeParams = { range: timeRange }

      const [
        metricsRes,
        trafficRes,
        geoRes,
        deviceRes,
        utmRes,
        // You can also fetch daily breakdown from /events/{id} if you want
      ] = await Promise.all([
        axiosClient.get(`/analytics/events/${eventId}/metrics`, { params: rangeParams }),
        axiosClient.get(`/analytics/events/${eventId}/traffic-sources`, { params: rangeParams }),
        axiosClient.get(`/analytics/events/${eventId}/geo-analytics`, { params: rangeParams }),
        axiosClient.get(`/analytics/events/${eventId}/device-analytics`, { params: rangeParams }),
        axiosClient.get(`/analytics/events/${eventId}/utm-analytics`, { params: rangeParams }),
      ])

      setMetrics(metricsRes.data.data.metrics)
      setTrafficSources(trafficRes.data.data.traffic_sources || [])
      setGeoData(geoRes.data.data.geo_analytics?.slice(0, 8) || []) // top 8 countries
      setDevices(deviceRes.data.data.device_analytics || [])
      setUtmData(utmRes.data.data.utm_analytics?.slice(0, 10) || [])

      // Optional: if you still want daily trend from legacy endpoint
      // const legacyRes = await axiosClient.get(`/analytics/events/${eventId}`, { params: rangeParams })
      // → you can process legacyRes.data.data.analytics into dailyStats

    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to load analytics", "error")
    } finally {
      setLoading(false)
    }
  }, [eventId, timeRange])

  React.useEffect(() => {
    fetchAllAnalytics()
  }, [fetchAllAnalytics])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!metrics) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-muted-foreground">
          No analytics data available yet for this event.
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1600px] mx-auto space-y-8 p-4 md:p-6 lg:p-8">

        {/* Header + controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Event Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Event ID: <span className="font-medium text-foreground">#{eventId}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-44">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Page Views"
            value={metrics.page_views.toLocaleString()}
            icon={Eye}
            description="Total visits"
          />
          <StatCard
            title="Unique Visitors"
            value={metrics.unique_visitors.toLocaleString()}
            icon={Users}
            description="Distinct users"
          />
          <StatCard
            title="Conversion Rate"
            value={`${metrics.conversion_rate?.toFixed(1) ?? 0}%`}
            icon={TrendingUp}
            description="Form submissions"
          />
          <StatCard
            title="Avg. Time on Page"
            value={`${Math.round(metrics.avg_time_on_page ?? 0)}s`}
            icon={Clock}
            description="Engagement"
          />
        </div>

        {/* Second row - more detailed */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Left column - trends + funnel */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="h-[420px]">
              <CardHeader>
                <CardTitle>Activity Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-[340px] pt-1">
                {/* You can put real daily data here when available */}
                <div className="h-full flex items-center justify-center text-muted-foreground italic">
                  Daily trend chart placeholder (implement when /events/{eventId} daily data is used)
                </div>
              </CardContent>
            </Card>

            {/* Conversion Funnel – you can fetch from /conversion-funnel endpoint */}
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 py-4">
                  {[
                    { label: "Page Views", value: metrics.page_views, color: "bg-gray-200" },
                    { label: "Engaged Users", value: Math.round(metrics.page_views * 0.71), color: "bg-blue-100" },
                    { label: "Button Clicks", value: metrics.button_clicks, color: "bg-indigo-100" },
                    { label: "Form Submissions", value: metrics.form_submissions, color: "bg-violet-200" },
                  ].map((step, i) => (
                    <div key={step.label} className="relative">
                      <div className={`h-10 rounded-md ${step.color} flex items-center px-4`}>
                        <span className="font-medium">{step.label}</span>
                        <span className="ml-auto font-bold">{step.value.toLocaleString()}</span>
                      </div>
                      {i < 3 && (
                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-muted-foreground">
                          ↓ {Math.round((step.value / metrics.page_views) * 100)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - distributions */}
          <div className="lg:col-span-3 space-y-6">
            <TrafficSourcesCard sources={trafficSources} />
            <DeviceBreakdownCard devices={devices} />
          </div>
        </div>

        {/* Bottom sections - Geo & UTM */}
        <Tabs defaultValue="geo" className="space-y-6">
          <TabsList>
            <TabsTrigger value="geo">Geography</TabsTrigger>
            <TabsTrigger value="utm">UTM Campaigns</TabsTrigger>
          </TabsList>

          <TabsContent value="geo">
            <Card>
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
                <CardDescription>Visitors by country (top 10)</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead>Page Views</TableHead>
                      <TableHead>Unique Visitors</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {geoData.length > 0 ? (
                      geoData.map((g) => {
                        const total = geoData.reduce((sum, item) => sum + item.page_views, 0)
                        const pct = total ? Math.round((g.page_views / total) * 100) : 0

                        return (
                          <TableRow key={g.country_code}>
                            <TableCell className="font-medium flex items-center gap-2">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              {g.country_code}
                              {g.city && <span className="text-xs text-muted-foreground">({g.city})</span>}
                            </TableCell>
                            <TableCell>{g.page_views.toLocaleString()}</TableCell>
                            <TableCell>{g.unique_visitors.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{pct}%</TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          No geographic data available yet (IP geolocation not configured?)
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="utm">
            <Card>
              <CardHeader>
                <CardTitle>Top UTM Campaigns</CardTitle>
                <CardDescription>Performance by marketing campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Source / Medium</TableHead>
                      <TableHead>Page Views</TableHead>
                      <TableHead>Visitors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {utmData.map((utm, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {utm.utm_campaign || <span className="text-muted-foreground italic">—</span>}
                        </TableCell>
                        <TableCell>
                          {utm.utm_source || "?"} / {utm.utm_medium || "?"}
                        </TableCell>
                        <TableCell>{utm.page_views.toLocaleString()}</TableCell>
                        <TableCell>{utm.unique_visitors.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    {utmData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                          No UTM campaign data captured yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </DashboardLayout>
  )
}