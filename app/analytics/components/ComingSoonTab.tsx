import { Card, CardContent } from "@/components/ui/card"

interface ComingSoonTabProps {
  tabName: string
}

export default function ComingSoonTab({ tabName }: ComingSoonTabProps) {
  return (
    <Card>
      <CardContent className="p-12 text-center text-muted-foreground">
        {tabName} analytics coming soon...
      </CardContent>
    </Card>
  )
}