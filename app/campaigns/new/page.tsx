"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Send, Mail, MessageSquare, SendIcon, Calendar, Users, FileText, Eye } from 'lucide-react'
import Link from "next/link"

export default function CreateCampaignPage() {
  const [campaignType, setCampaignType] = React.useState("email")

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/campaigns">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create Campaign</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Design and launch your marketing campaign
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button className="gap-2">
              <Send className="h-4 w-4" />
              Schedule & Send
            </Button>
          </div>
        </div>

        <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="bg-secondary">
            <TabsTrigger value="details">Campaign Details</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          {/* Campaign Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Set up the basic details for your campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    placeholder="e.g., Summer Product Launch"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-type">Campaign Type</Label>
                  <Select value={campaignType} onValueChange={setCampaignType}>
                    <SelectTrigger id="campaign-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Campaign
                        </div>
                      </SelectItem>
                      <SelectItem value="sms">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          SMS Campaign
                        </div>
                      </SelectItem>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <SendIcon className="h-4 w-4" />
                          WhatsApp Campaign
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the purpose and goals of this campaign..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select defaultValue="promotional">
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promotional">Promotional</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audience Tab */}
          <TabsContent value="audience" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Target Audience</CardTitle>
                <CardDescription>
                  Select who should receive this campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Audience Segment</Label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers</SelectItem>
                      <SelectItem value="hot-leads">Hot Leads</SelectItem>
                      <SelectItem value="warm-leads">Warm Leads</SelectItem>
                      <SelectItem value="cold-leads">Cold Leads</SelectItem>
                      <SelectItem value="event-attendees">Event Attendees</SelectItem>
                      <SelectItem value="product-interested">Product Interested</SelectItem>
                      <SelectItem value="custom">Custom Segment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border border-border bg-secondary/30 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-foreground">Estimated Recipients</p>
                        <p className="text-sm text-muted-foreground">Based on current filters</p>
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">4,523</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Additional Filters</Label>
                  
                  <div className="space-y-2">
                    <Label htmlFor="persona" className="text-sm font-normal">Customer Persona</Label>
                    <Select defaultValue="all">
                      <SelectTrigger id="persona">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Personas</SelectItem>
                        <SelectItem value="tech-enthusiast">Tech Enthusiast</SelectItem>
                        <SelectItem value="business-professional">Business Professional</SelectItem>
                        <SelectItem value="early-adopter">Early Adopter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="engagement" className="text-sm font-normal">Engagement Level</Label>
                    <Select defaultValue="all">
                      <SelectTrigger id="engagement">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="high">High Engagement</SelectItem>
                        <SelectItem value="medium">Medium Engagement</SelectItem>
                        <SelectItem value="low">Low Engagement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product" className="text-sm font-normal">Interested in Product</Label>
                    <Select defaultValue="any">
                      <SelectTrigger id="product">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Product</SelectItem>
                        <SelectItem value="laptop">UltraBook Pro X1</SelectItem>
                        <SelectItem value="smartphone">SmartPhone Z5</SelectItem>
                        <SelectItem value="headphones">Noise-Cancel Headphones</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            {campaignType === "email" && (
              <Card>
                <CardHeader>
                  <CardTitle>Email Content</CardTitle>
                  <CardDescription>
                    Compose your email message
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject Line</Label>
                    <Input
                      id="subject"
                      placeholder="e.g., Exclusive Summer Sale - 20% Off All Products!"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preview">Preview Text</Label>
                    <Input
                      id="preview"
                      placeholder="This text appears in email preview..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sender-name">Sender Name</Label>
                    <Input id="sender-name" defaultValue="Pexifly Team" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sender-email">Sender Email</Label>
                    <Input id="sender-email" defaultValue="hello@Pexifly.com" type="email" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-template">Email Template</Label>
                    <Select defaultValue="modern">
                      <SelectTrigger id="email-template">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">Modern Layout</SelectItem>
                        <SelectItem value="classic">Classic Newsletter</SelectItem>
                        <SelectItem value="minimal">Minimal Design</SelectItem>
                        <SelectItem value="promo">Promotional Banner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="body">Email Body</Label>
                    <Textarea
                      id="body"
                      placeholder="Write your email content here..."
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {'{'}customer_name{'}'}, {'{'}product_name{'}'}, and other variables for personalization
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="tracking" className="text-sm font-medium">Enable Email Tracking</Label>
                      <p className="text-xs text-muted-foreground">Track opens and clicks</p>
                    </div>
                    <Switch id="tracking" defaultChecked />
                  </div>
                </CardContent>
              </Card>
            )}

            {campaignType === "sms" && (
              <Card>
                <CardHeader>
                  <CardTitle>SMS Content</CardTitle>
                  <CardDescription>
                    Compose your SMS message (max 160 characters)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sms-body">Message</Label>
                      <span className="text-sm text-muted-foreground">0 / 160</span>
                    </div>
                    <Textarea
                      id="sms-body"
                      placeholder="Write your SMS message here..."
                      rows={4}
                      maxLength={160}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {'{'}name{'}'}, {'{'}code{'}'}, and {'{'}link{'}'} for personalization
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sender-id">Sender ID</Label>
                    <Input id="sender-id" defaultValue="Pexifly" maxLength={11} />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="url-shortening" className="text-sm font-medium">URL Shortening</Label>
                      <p className="text-xs text-muted-foreground">Automatically shorten URLs</p>
                    </div>
                    <Switch id="url-shortening" defaultChecked />
                  </div>
                </CardContent>
              </Card>
            )}

            {campaignType === "whatsapp" && (
              <Card>
                <CardHeader>
                  <CardTitle>WhatsApp Content</CardTitle>
                  <CardDescription>
                    Compose your WhatsApp message
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-template">Message Template</Label>
                    <Select defaultValue="promotional">
                      <SelectTrigger id="whatsapp-template">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="promotional">Promotional Message</SelectItem>
                        <SelectItem value="transactional">Transactional Update</SelectItem>
                        <SelectItem value="reminder">Event Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp-body">Message</Label>
                    <Textarea
                      id="whatsapp-body"
                      placeholder="Write your WhatsApp message here..."
                      rows={8}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Media Attachment (Optional)</Label>
                    <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload an image or document
                      </p>
                      <Button variant="outline" size="sm">
                        Choose File
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="read-receipts" className="text-sm font-medium">Read Receipts</Label>
                      <p className="text-xs text-muted-foreground">Track when messages are read</p>
                    </div>
                    <Switch id="read-receipts" defaultChecked />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Schedule</CardTitle>
                <CardDescription>
                  Choose when to send your campaign
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-lg border border-border p-4">
                    <input type="radio" name="schedule" id="send-now" defaultChecked />
                    <div className="flex-1">
                      <Label htmlFor="send-now" className="text-base font-medium cursor-pointer">
                        Send Immediately
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Campaign will be sent as soon as you click Send
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-lg border border-border p-4">
                    <input type="radio" name="schedule" id="send-later" />
                    <div className="flex-1">
                      <Label htmlFor="send-later" className="text-base font-medium cursor-pointer">
                        Schedule for Later
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Choose a specific date and time
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="schedule-date">Date</Label>
                    <Input id="schedule-date" type="date" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schedule-time">Time</Label>
                    <Input id="schedule-time" type="time" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="pst">
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                      <SelectItem value="est">Eastern Time (EST)</SelectItem>
                      <SelectItem value="cst">Central Time (CST)</SelectItem>
                      <SelectItem value="utc">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Optimal Send Time</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Based on your audience engagement patterns, we recommend sending between 
                        9:00 AM - 11:00 AM on Tuesday or Wednesday for best results.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="a-b-test" className="text-sm font-medium">A/B Testing</Label>
                    <p className="text-xs text-muted-foreground">Test different versions</p>
                  </div>
                  <Switch id="a-b-test" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
