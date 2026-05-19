"use client"

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

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function UtmAnalytics() {
  const data = {
    event: {
      id: 45,
      name: "Annual Expo 2026",
    },
    utm_analytics: [
      {
        utm_source: "google",
        utm_medium: "cpc",
        utm_campaign: "summer_sale",
        utm_term: "product",
        utm_content: "banner_ad",
        page_views: 500,
        unique_visitors: 350,
      },
      {
        utm_source: "facebook",
        utm_medium: "social",
        utm_campaign: "product_launch",
        utm_term: null,
        utm_content: "video_ad",
        page_views: 300,
        unique_visitors: 220,
      },
    ],
  }

  const chartData = data.utm_analytics.map(item => ({
    name: item.utm_source,
    page_views: item.page_views,
    visitors: item.unique_visitors,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>UTM Analytics</CardTitle>
        <CardDescription>
          Traffic sources for {data.event.name}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Chart */}
        <ChartContainer
          config={{
            page_views: { label: "Page Views", color: "hsl(220, 90%, 55%)" },
            visitors: { label: "Visitors", color: "hsl(160, 70%, 45%)" },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="page_views" fill="var(--color-page_views)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="visitors" fill="var(--color-visitors)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Medium</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Content</TableHead>
                <TableHead className="text-right">Page Views</TableHead>
                <TableHead className="text-right">Visitors</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.utm_analytics.map((utm, index) => (
                <TableRow key={index}>
                  <TableCell>{utm.utm_source}</TableCell>
                  <TableCell>{utm.utm_medium}</TableCell>
                  <TableCell>{utm.utm_campaign}</TableCell>
                  <TableCell>{utm.utm_term ?? "—"}</TableCell>
                  <TableCell>{utm.utm_content}</TableCell>
                  <TableCell className="text-right">{utm.page_views}</TableCell>
                  <TableCell className="text-right">{utm.unique_visitors}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
