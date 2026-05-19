"use client"

import * as React from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, Percent, Calendar, Edit, Copy, Trash2, MoreVertical, ChevronLeft, ChevronRight, QrCode, Download } from 'lucide-react'

const offers = [
  {
    id: "1",
    name: "Summer Sale 2024",
    type: "percentage",
    value: "20%",
    code: "SUMMER20",
    status: "active",
    used: 234,
    limit: 1000,
    startDate: "2024-06-01",
    endDate: "2024-08-31",
  },
  {
    id: "2",
    name: "Early Bird Discount",
    type: "percentage",
    value: "15%",
    code: "EARLY15",
    status: "active",
    used: 89,
    limit: 500,
    startDate: "2024-03-01",
    endDate: "2024-03-31",
  },
  {
    id: "3",
    name: "New Customer Welcome",
    type: "fixed",
    value: "$50",
    code: "WELCOME50",
    status: "active",
    used: 156,
    limit: null,
    startDate: "2024-01-01",
    endDate: "2024-12-31",
  },
  {
    id: "4",
    name: "Flash Sale",
    type: "percentage",
    value: "30%",
    code: "FLASH30",
    status: "expired",
    used: 567,
    limit: 1000,
    startDate: "2024-01-15",
    endDate: "2024-01-17",
  },
]

const statusColors = {
  active: "bg-green-100 text-green-700",
  expired: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-100 text-blue-700",
}

export default function OffersPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [showQrDialog, setShowQrDialog] = React.useState(false)
  const [selectedOffers, setSelectedOffers] = React.useState<string[]>([])

  const toggleOfferSelection = (offerId: string) => {
    setSelectedOffers(prev => 
      prev.includes(offerId) 
        ? prev.filter(id => id !== offerId)
        : [...prev, offerId]
    )
  }

  const handleGenerateQR = () => {
    if (selectedOffers.length === 0) {
      alert("Please select at least one offer to generate QR code")
      return
    }
    setShowQrDialog(true)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Offers</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage promotional offers and discounts
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleGenerateQR}
              disabled={selectedOffers.length === 0}
            >
              <QrCode className="h-4 w-4" />
              Generate QR ({selectedOffers.length})
            </Button>
            <Link href="/offers/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Offer
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-6 ">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Offers</p>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold text-foreground mt-2">18</p>
            <p className="text-xs text-muted-foreground mt-1">8 active</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 ">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Redemptions</p>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold text-foreground mt-2">1,046</p>
            <p className="text-xs text-green-600 mt-1">+23% this month</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 ">
            <p className="text-sm font-medium text-muted-foreground">Revenue Impact</p>
            <p className="text-3xl font-bold text-foreground mt-2">$42.3K</p>
            <p className="text-xs text-muted-foreground mt-1">Generated revenue</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 ">
            <p className="text-sm font-medium text-muted-foreground">Avg Redemption</p>
            <p className="text-3xl font-bold text-foreground mt-2">58.1</p>
            <p className="text-xs text-muted-foreground mt-1">Per offer</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4  sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search offers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all">
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Offers Table */}
        <div className="rounded-xl border border-slate-200 bg-card ">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">
                  <input 
                    type="checkbox"
                    className="rounded border-slate-300"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOffers(offers.filter(o => o.status === 'active').map(o => o.id))
                      } else {
                        setSelectedOffers([])
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Offer Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Used / Limit</TableHead>
                <TableHead>Valid Period</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offers.map((offer) => {
                const usagePercentage = offer.limit ? (offer.used / offer.limit) * 100 : 0

                return (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <input 
                        type="checkbox"
                        className="rounded border-slate-300"
                        checked={selectedOffers.includes(offer.id)}
                        onChange={() => toggleOfferSelection(offer.id)}
                        disabled={offer.status !== 'active'}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <a href={`/offers/${offer.id}`} className="hover:text-primary">
                        {offer.name}
                      </a>
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-secondary px-2 py-1 text-sm font-mono">
                        {offer.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {offer.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-blue-700">
                      {offer.value}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[offer.status as keyof typeof statusColors]}>
                        {offer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {offer.used} / {offer.limit || "∞"}
                        </p>
                        {offer.limit && (
                          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600"
                              style={{ width: `${usagePercentage}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{offer.startDate}</p>
                        <p className="text-muted-foreground">{offer.endDate}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">1-4</span> of{" "}
              <span className="font-medium text-foreground">18</span> offers
            </div>
            <div className="flex items-center gap-2">
              <Select defaultValue="10">
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / page</SelectItem>
                  <SelectItem value="20">20 / page</SelectItem>
                  <SelectItem value="50">50 / page</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" disabled>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {showQrDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQrDialog(false)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Multi-Offer QR Code</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    This QR code contains {selectedOffers.length} active offer(s)
                  </p>
                </div>

                {/* QR Code Preview */}
                <div className="flex justify-center p-6 bg-slate-50 rounded-lg">
                  <img 
                    src={`/generic-qr-code.png?key=ub5lx&height=200&width=200&query=QR code for ${selectedOffers.length} offers`}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>

                {/* Selected Offers List */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Included Offers:</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {offers.filter(o => selectedOffers.includes(o.id)).map(offer => (
                      <div key={offer.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="text-sm font-medium">{offer.name}</span>
                        <Badge className="bg-green-100 text-green-700">{offer.value}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button className="flex-1 gap-2">
                    <Download className="h-4 w-4" />
                    Download QR
                  </Button>
                  <Button variant="outline" onClick={() => setShowQrDialog(false)}>
                    Close
                  </Button>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs text-blue-800">
                    When customers scan this QR code, all selected active offers will be applied to their purchase automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
