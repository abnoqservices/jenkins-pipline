import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Eye, Users, QrCode, ShoppingCart } from 'lucide-react'

interface MetricsProps {
  metrics?: {
    totalViews: number
    qrScans: number
    leadsGenerated: number
    conversionRate: string
    viewsTrend: number
    scansTrend: number
    leadsTrend: number
    conversionTrend: number
  }
}

export default function KeyMetricsCards({ metrics }: MetricsProps) {
  if (!metrics) return null

  const formatTrend = (trend: number, positiveColor = "text-green-600", negativeColor = "text-red-600") => {
    const isPositive = trend >= 0
    const Icon = isPositive ? TrendingUp : TrendingDown
    const color = isPositive ? positiveColor : negativeColor
    return (
      <p className={`text-xs ${color} flex items-center gap-1 mt-1`}>
        <Icon className="h-3 w-3" />
        <span>{isPositive ? "+" : ""}{trend}% from last period</span>
      </p>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalViews.toLocaleString()}</div>
          {formatTrend(metrics.viewsTrend)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">QR Scans</CardTitle>
          <QrCode className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.qrScans.toLocaleString()}</div>
          {formatTrend(metrics.scansTrend)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Leads Generated</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.leadsGenerated.toLocaleString()}</div>
          {formatTrend(metrics.leadsTrend)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.conversionRate}</div>
          {formatTrend(metrics.conversionTrend)}
        </CardContent>
      </Card>
    </div>
  )
}