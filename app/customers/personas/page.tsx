import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, TrendingUp, Zap } from 'lucide-react'

export default function PersonasPage() {
  // In a real app, these would come from:
  // - Aggregated data from GET /api/contacts with scoring computed client-side or via backend
  // - Possibly a dedicated /api/personas or /api/contacts/scores endpoint
  const personas = [
    { 
      name: "Hot Lead", 
      scoreRange: "90–100", 
      count: 145, 
      color: "bg-red-600", 
      description: "High intent – ready for sales" 
    },
    { 
      name: "Qualified Lead", 
      scoreRange: "80–89", 
      count: 234, 
      color: "bg-orange-600", 
      description: "Strong fit + engagement" 
    },
    { 
      name: "Marketing Qualified", 
      scoreRange: "70–79", 
      count: 456, 
      color: "bg-amber-600", 
      description: "Engaged – nurture + score" 
    },
    { 
      name: "Warm Prospect", 
      scoreRange: "60–69", 
      count: 789, 
      color: "bg-yellow-600", 
      description: "Showing interest" 
    },
    { 
      name: "Cold / Low Priority", 
      scoreRange: "40–59", 
      count: 1234, 
      color: "bg-blue-600", 
      description: "Low engagement" 
    },
    { 
      name: "Unqualified / Archived", 
      scoreRange: "0–39", 
      count: 567, 
      color: "bg-gray-600", 
      description: "Not a fit or inactive" 
    },
  ]

  // Rough total for percentage calculation (in real app → from API summary)
  const totalContacts = personas.reduce((sum, p) => sum + p.count, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contact Personas</h1>
            <p className="text-muted-foreground mt-2 flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-600" />
              AI-powered lead scoring & segmentation based on behavior, source and custom fields
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Persona
          </Button>
        </div>

        {/* Personas Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {personas.map((persona) => {
            const percentage = Math.round((persona.count / totalContacts) * 100)
            
            return (
              <Card key={persona.name} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">{persona.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Score: {persona.scoreRange} • {persona.description}
                      </CardDescription>
                    </div>
                    <div className={`h-4 w-4 rounded-full ${persona.color} ring-2 ring-offset-2 ring-offset-background`} />
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2 text-sm">
                      <span className="text-muted-foreground">Contacts</span>
                      <span className="font-semibold">{persona.count.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${persona.color} transition-all`} 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Users className="h-4 w-4 mr-1.5" />
                      View Contacts
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <TrendingUp className="h-4 w-4 mr-1.5" />
                      Scoring Insights
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Scoring Rules – aligned with API's activity-based scoring philosophy */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Scoring Configuration</CardTitle>
            <CardDescription>
              Points assigned to contact activities, sources and custom field values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { action: "Form Submission (high-value)", points: 25 },
                { action: "Demo / Product Video ≥ 75%", points: 20 },
                { action: "Pricing Page Visit", points: 15 },
                { action: "QR Scan / Booth Capture", points: 12 },
                { action: "Email Link Click (2+)", points: 10 },
                { action: "Website Session ≥ 2 min", points: 8 },
                { action: "Email Opened", points: 4 },
                { action: "Visitor from High-intent Source", points: "+5–15" },
                { action: "AI-detected Buying Intent", points: "+10–30" },
              ].map((rule, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-3.5 rounded-lg border bg-card/40 hover:bg-card/70 transition-colors"
                >
                  <span className="font-medium">{rule.action}</span>
                  <Badge variant="secondary" className="text-sm font-semibold">
                    +{rule.points} pts
                  </Badge>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-5 italic">
              Scoring combines behavioral events, contact source (factors_ai, website, product_lp, …), custom field values and origin metadata. Rules can be managed in settings.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}