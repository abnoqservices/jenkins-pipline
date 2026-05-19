import {
    Line,
    LineChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    XAxis,
    YAxis,
  } from "recharts"
  import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
  
  interface EngagementProps {
    timeData?: Array<{
      time: string
      scans: number
      views: number
    }>
  }
  
  export default function EngagementHeatmap({ timeData }: EngagementProps) {
    if (!timeData || timeData.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Engagement Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      )
    }
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>Engagement Heatmap</CardTitle>
          <CardDescription>Activity by time of day</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              scans: { label: "Scans", color: "hsl(250, 80%, 60%)" },
              views: { label: "Views", color: "hsl(210, 100%, 50%)" },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="scans" stroke="var(--color-scans)" strokeWidth={2} />
                <Line type="monotone" dataKey="views" stroke="var(--color-views)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    )
  }