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
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Check, Percent, DollarSign, Calendar, Tag, Users, Settings, AlertCircle, QrCode, Download } from 'lucide-react'
import Link from "next/link"

export default function CreateOfferPage() {
  const [discountType, setDiscountType] = React.useState("percentage")
  const [hasLimit, setHasLimit] = React.useState(true)
  const [hasExpiry, setHasExpiry] = React.useState(true)
  const [showQrCode, setShowQrCode] = React.useState(false)
  const [enableQrCode, setEnableQrCode] = React.useState(true)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/offers">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create Offer</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Set up a new promotional offer or discount code
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
            <Button className="gap-2">
              <Check className="h-4 w-4" />
              Publish Offer
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Offer Details</CardTitle>
                <CardDescription>
                  Configure the basic information for your offer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="offer-name">Offer Name</Label>
                  <Input
                    id="offer-name"
                    placeholder="e.g., Summer Sale 2024"
                  />
                  <p className="text-xs text-muted-foreground">
                    Internal name for tracking purposes
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this offer includes and any terms..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="promo-code">Promo Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="promo-code"
                      placeholder="e.g., SUMMER20"
                      className="font-mono uppercase"
                    />
                    <Button variant="outline">
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Code customers will use to redeem this offer
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Discount Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Discount Value</CardTitle>
                <CardDescription>
                  Set the discount amount for this offer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <button
                      onClick={() => setDiscountType("percentage")}
                      className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                        discountType === "percentage"
                          ? "border-blue-600 bg-blue-50"
                          : "border-border hover:border-blue-300"
                      }`}
                    >
                      <div className={`rounded-lg p-2 ${
                        discountType === "percentage" ? "bg-blue-600" : "bg-secondary"
                      }`}>
                        <Percent className={`h-5 w-5 ${
                          discountType === "percentage" ? "text-white" : "text-muted-foreground"
                        }`} />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">Percentage</p>
                        <p className="text-xs text-muted-foreground">% off total</p>
                      </div>
                    </button>

                    <button
                      onClick={() => setDiscountType("fixed")}
                      className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                        discountType === "fixed"
                          ? "border-blue-600 bg-blue-50"
                          : "border-border hover:border-blue-300"
                      }`}
                    >
                      <div className={`rounded-lg p-2 ${
                        discountType === "fixed" ? "bg-blue-600" : "bg-secondary"
                      }`}>
                        <DollarSign className={`h-5 w-5 ${
                          discountType === "fixed" ? "text-white" : "text-muted-foreground"
                        }`} />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">Fixed Amount</p>
                        <p className="text-xs text-muted-foreground">$ off total</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount-value">
                    {discountType === "percentage" ? "Percentage Off" : "Amount Off"}
                  </Label>
                  <div className="relative">
                    {discountType === "percentage" ? (
                      <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    ) : (
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    )}
                    <Input
                      id="discount-value"
                      type="number"
                      placeholder={discountType === "percentage" ? "20" : "50"}
                      className="pl-10"
                      min="0"
                      max={discountType === "percentage" ? "100" : undefined}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-purchase">Minimum Purchase Amount (Optional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="min-purchase"
                      type="number"
                      placeholder="0"
                      className="pl-10"
                      min="0"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum order value required to use this offer
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Usage Limits */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Limits</CardTitle>
                <CardDescription>
                  Control how many times this offer can be used
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="has-limit" className="text-sm font-medium">
                      Limit Total Redemptions
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Set a maximum number of times this code can be used
                    </p>
                  </div>
                  <Switch
                    id="has-limit"
                    checked={hasLimit}
                    onCheckedChange={setHasLimit}
                  />
                </div>

                {hasLimit && (
                  <div className="space-y-2">
                    <Label htmlFor="usage-limit">Maximum Uses</Label>
                    <Input
                      id="usage-limit"
                      type="number"
                      placeholder="e.g., 1000"
                      min="1"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="per-customer">Uses Per Customer</Label>
                  <Select defaultValue="unlimited">
                    <SelectTrigger id="per-customer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                      <SelectItem value="1">1 time per customer</SelectItem>
                      <SelectItem value="2">2 times per customer</SelectItem>
                      <SelectItem value="3">3 times per customer</SelectItem>
                      <SelectItem value="5">5 times per customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Validity Period */}
            <Card>
              <CardHeader>
                <CardTitle>Validity Period</CardTitle>
                <CardDescription>
                  Set when this offer is available
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input id="start-date" type="date" />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="has-expiry" className="text-sm font-medium">
                      Set Expiry Date
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Offer will automatically deactivate after this date
                    </p>
                  </div>
                  <Switch
                    id="has-expiry"
                    checked={hasExpiry}
                    onCheckedChange={setHasExpiry}
                  />
                </div>

                {hasExpiry && (
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input id="end-date" type="date" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Applicable Products */}
            <Card>
              <CardHeader>
                <CardTitle>Applicable Products</CardTitle>
                <CardDescription>
                  Choose which products this offer applies to
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Product Selection</Label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      <SelectItem value="specific">Specific Products</SelectItem>
                      <SelectItem value="category">Product Categories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Offer Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border-2 border-dashed border-border bg-gradient-to-br from-blue-50 to-purple-50 p-6 text-center">
                  <Tag className="h-8 w-8 mx-auto text-blue-600 mb-3" />
                  <p className="text-2xl font-bold text-blue-600 mb-2">
                    {discountType === "percentage" ? "20% OFF" : "$50 OFF"}
                  </p>
                  <code className="inline-block rounded bg-white px-3 py-1 text-sm font-mono font-bold">
                    SUMMER20
                  </code>
                  <p className="text-xs text-muted-foreground mt-3">
                    Valid until Aug 31, 2024
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* QR Code Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">QR Code</CardTitle>
                <CardDescription>
                  Generate QR code for this offer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enable-qr" className="text-sm font-medium">
                      Enable QR Code
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Allow this offer via QR scan
                    </p>
                  </div>
                  <Switch 
                    id="enable-qr" 
                    checked={enableQrCode}
                    onCheckedChange={setEnableQrCode}
                  />
                </div>

                {enableQrCode && (
                  <>
                    <div className="flex justify-center p-4 bg-slate-50 rounded-lg">
                      <img 
                        src="/offer-qr-code.jpg"
                        alt="QR Code"
                        className="w-32 h-32"
                      />
                    </div>
                    
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={() => setShowQrCode(true)}
                    >
                      <QrCode className="h-4 w-4" />
                      View/Download QR
                    </Button>

                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs text-blue-800">
                        This QR code can be combined with other offers. Enable the offer and select it in the Offers page to generate a multi-offer QR code.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Offer Status</Label>
                  <Select defaultValue="draft">
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="flex gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800">
                      This offer will be saved as draft. Publish it to make it available to customers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Additional Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-apply" className="text-sm font-medium">
                      Auto-apply
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Automatically apply at checkout
                    </p>
                  </div>
                  <Switch id="auto-apply" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="stackable" className="text-sm font-medium">
                      Stackable
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Can combine with other offers
                    </p>
                  </div>
                  <Switch id="stackable" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="featured" className="text-sm font-medium">
                      Featured
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Show on homepage
                    </p>
                  </div>
                  <Switch id="featured" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* QR Code Preview Dialog */}
        {showQrCode && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowQrCode(false)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Offer QR Code</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Scan to apply this offer automatically
                  </p>
                </div>

                {/* QR Code Large Preview */}
                <div className="flex justify-center p-6 bg-slate-50 rounded-lg">
                  <img 
                    src="/offer-qr-code-preview.jpg"
                    alt="QR Code"
                    className="w-56 h-56"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-foreground">Summer Sale 2024</p>
                      <code className="text-xs font-mono">SUMMER20</code>
                    </div>
                    <p className="text-xl font-bold text-blue-600">20% OFF</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button className="gap-2">
                    <Download className="h-4 w-4" />
                    Download PNG
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download SVG
                  </Button>
                </div>

                <Button variant="outline" className="w-full" onClick={() => setShowQrCode(false)}>
                  Close
                </Button>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs text-amber-800">
                    <strong>Tip:</strong> You can combine multiple offers into one QR code from the Offers list page by selecting multiple active offers and clicking "Generate QR".
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
