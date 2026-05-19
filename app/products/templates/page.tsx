import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Copy, Pencil, QrCode } from 'lucide-react'

export default function QRTemplatesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">QR Code Templates</h1>
            <p className="text-muted-foreground mt-2">
              Manage and customize your QR code design templates
            </p>
          </div>
          <Button>
            <QrCode className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Classic Black", style: "Standard", scans: 1245, isDefault: true },
            { name: "Gradient Blue", style: "Modern", scans: 892, isDefault: false },
            { name: "Brand Colors", style: "Custom", scans: 567, isDefault: false },
            { name: "Minimalist White", style: "Clean", scans: 423, isDefault: false },
            { name: "Tech Pattern", style: "Modern", scans: 234, isDefault: false },
            { name: "Event Special", style: "Custom", scans: 156, isDefault: false },
          ].map((template, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <CardDescription>{template.style} style</CardDescription>
                  </div>
                  {template.isDefault && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-4">
                  <QrCode className="h-24 w-24 text-muted-foreground" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Scans</span>
                  <span className="font-medium">{template.scans.toLocaleString()}</span>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
