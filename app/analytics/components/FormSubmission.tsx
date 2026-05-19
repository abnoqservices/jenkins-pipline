"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Package, CheckCircle2, Clock, Globe } from "lucide-react"

// ── Static / Demo Data (same style as real tracking would look) ────────────────
const DEMO_FORM_SUBMISSIONS = [
  {
    id: 1,
    submitted_at: "2025-01-14 14:35:22",
    name: "Rahul Sharma",
    email: "rahul.sharma@example.com",
    phone: "+91 98765 43210",
    product: "iPhone 16 Pro",
    product_id: 59,
    event: "Tech Expo Lucknow 2025",
    event_id: 456,
    booth: "B-12",
    booth_id: 789,
    utm_source: "google",
    utm_medium: "cpc",
    utm_campaign: "winter_sale_2025",
    traffic_source: "Google Ads",
    status: "success",
  },
  {
    id: 2,
    submitted_at: "2025-01-14 13:12:45",
    name: "Priya Singh",
    email: "priya.singh92@gmail.com",
    phone: "+91 87654 32109",
    product: "MacBook Pro M4",
    product_id: 37,
    event: null,
    event_id: null,
    booth: null,
    booth_id: null,
    utm_source: "facebook",
    utm_medium: "social",
    utm_campaign: "product_launch",
    traffic_source: "Facebook",
    status: "success",
  },
  {
    id: 3,
    submitted_at: "2025-01-13 17:48:10",
    name: "Amit Verma",
    email: "amitverma.work@gmail.com",
    phone: null,
    product: "AirPods Pro 2",
    product_id: 36,
    event: "Tech Expo Lucknow 2025",
    event_id: 456,
    booth: "A-08",
    booth_id: 790,
    utm_source: "direct",
    utm_medium: null,
    utm_campaign: null,
    traffic_source: "Direct",
    status: "success",
  },
  {
    id: 4,
    submitted_at: "2025-01-13 09:22:33",
    name: "Neha Gupta",
    email: "neha.gupta.designer@gmail.com",
    phone: "+91 76543 21098",
    product: null,
    product_id: null,
    event: "Tech Expo Lucknow 2025",
    event_id: 456,
    booth: null,
    booth_id: null,
    utm_source: "newsletter",
    utm_medium: "email",
    utm_campaign: "weekly_update",
    traffic_source: "Email",
    status: "success",
  },
]

// ──────────────────────────────────────────────────────────────────────────────
export default function FormSubmissionTracking() {
  // You will replace this later with real API fetch
  const submissions = DEMO_FORM_SUBMISSIONS

  // For future real API version (just example structure)
 
//   const [submissions, setSubmissions] = useState([])
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     const fetchSubmissions = async () => {
//       try {
//         const res = await axiosClient.get("/analytics/form-submissions", {
//           params: { limit: 50, page: 1 }
//         })
//         setSubmissions(res.data.data || [])
//       } catch (err) {
//         console.error(err)
//       } finally {
//         setLoading(false)
//       }
//     }
//     fetchSubmissions()
//   }, [])


  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Recent Form Submissions</CardTitle>
            <CardDescription>
              Latest leads captured through product/event landing pages
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing last {submissions.length} submissions
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Submitted</TableHead>
                <TableHead>Name / Contact</TableHead>
                <TableHead>Product / Event</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub) => (
                <TableRow key={sub.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(sub.submitted_at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div>
                      <div className="font-medium">{sub.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {sub.email}
                        {sub.phone && ` • ${sub.phone}`}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {sub.product && (
                        <div className="flex items-center gap-1.5">
                          <Package className="h-3.5 w-3.5 text-blue-600" />
                          <span className="text-sm">{sub.product}</span>
                        </div>
                      )}
                      {sub.event && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-purple-600" />
                          <span className="text-sm">{sub.event}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {sub.utm_source && (
                        <Badge variant="outline" className="w-fit text-xs">
                          {sub.utm_source}
                          {sub.utm_medium && ` • ${sub.utm_medium}`}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {sub.traffic_source}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Success
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {submissions.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            No form submissions recorded yet
          </div>
        )}
      </CardContent>
    </Card>
  )
}