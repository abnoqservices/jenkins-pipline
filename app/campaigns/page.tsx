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
import { Plus, Search, Mail, MessageSquare, Send, Eye, Edit, Copy, Trash2, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react'

const campaigns = [
  {
    id: "1",
    name: "Summer Product Launch",
    type: "email",
    status: "sent",
    recipients: 2341,
    opened: 1876,
    clicked: 542,
    sentDate: "2024-03-15",
  },
  {
    id: "2",
    name: "Event Reminder SMS",
    type: "sms",
    status: "scheduled",
    recipients: 567,
    opened: 0,
    clicked: 0,
    sentDate: "2024-03-20",
  },
  {
    id: "3",
    name: "New Feature Announcement",
    type: "email",
    status: "draft",
    recipients: 4523,
    opened: 0,
    clicked: 0,
    sentDate: "-",
  },
  {
    id: "4",
    name: "Customer Feedback Request",
    type: "whatsapp",
    status: "sent",
    recipients: 1234,
    opened: 987,
    clicked: 456,
    sentDate: "2024-03-10",
  },
]

const statusColors = {
  sent: "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
  draft: "bg-gray-100 text-gray-700",
}

const typeIcons = {
  email: Mail,
  sms: MessageSquare,
  whatsapp: Send,
}

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = React.useState("")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Campaigns</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage marketing campaigns
            </p>
          </div>
          <Link href="/campaigns/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Campaign
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card p-6 ">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Campaigns</p>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold text-foreground mt-2">24</p>
            <p className="text-xs text-muted-foreground mt-1">+3 this month</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 ">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Recipients</p>
              <Send className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold text-foreground mt-2">8,665</p>
            <p className="text-xs text-muted-foreground mt-1">Across all campaigns</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 ">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Average Open Rate</p>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold text-foreground mt-2">72.4%</p>
            <p className="text-xs text-green-600 mt-1">+5.2% from last month</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 ">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Click Rate</p>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-3xl font-bold text-foreground mt-2">28.9%</p>
            <p className="text-xs text-green-600 mt-1">+2.1% from last month</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4  sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>

            <Select defaultValue="all">
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Campaigns Table */}
        <div className="rounded-xl border border-border bg-card ">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Campaign Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Recipients</TableHead>
                <TableHead className="text-right">Opened</TableHead>
                <TableHead className="text-right">Clicked</TableHead>
                <TableHead>Sent Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => {
                const Icon = typeIcons[campaign.type as keyof typeof typeIcons]
                const openRate = campaign.opened > 0 ? ((campaign.opened / campaign.recipients) * 100).toFixed(1) : "0"
                const clickRate = campaign.clicked > 0 ? ((campaign.clicked / campaign.recipients) * 100).toFixed(1) : "0"

                return (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      <a href={`/campaigns/${campaign.id}`} className="hover:text-primary">
                        {campaign.name}
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">{campaign.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[campaign.status as keyof typeof statusColors]}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {campaign.recipients.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {campaign.opened > 0 ? (
                        <div>
                          <p className="font-medium">{campaign.opened.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{openRate}%</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {campaign.clicked > 0 ? (
                        <div>
                          <p className="font-medium">{campaign.clicked.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{clickRate}%</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {campaign.sentDate}
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
                            <Eye className="mr-2 h-4 w-4" />
                            View Report
                          </DropdownMenuItem>
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
              <span className="font-medium text-foreground">24</span> campaigns
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
      </div>
    </DashboardLayout>
  )
}
