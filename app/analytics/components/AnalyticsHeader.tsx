import { Button } from "@/components/ui/button"
import { Download } from 'lucide-react'

export default function AnalyticsHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Deep insights into your engagement metrics
        </p>
      </div>
      <Button className="gap-2">
        <Download className="h-4 w-4" />
        Export Report
      </Button>
    </div>
  )
}