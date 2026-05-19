"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AnalyticsHeader from "./components/AnalyticsHeader"
import ProductAnalyticsTab from "./components/ProductAnalyticsTab"
import ComingSoonTab from "./components/ComingSoonTab"

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <AnalyticsHeader />

        <Tabs defaultValue="product" className="space-y-6">
          {/* <TabsList>
            <TabsTrigger value="product">Product</TabsTrigger>
            <TabsTrigger value="event">Event</TabsTrigger>
            <TabsTrigger value="booth">Booth</TabsTrigger>
            <TabsTrigger value="customer">Customer</TabsTrigger>
            <TabsTrigger value="campaign">Campaign</TabsTrigger>
          </TabsList> */}

          <TabsContent value="product">
            <ProductAnalyticsTab />
          </TabsContent>

          {/* <TabsContent value="event">
         
            <ComingSoonTab tabName="Event" />
          </TabsContent>

          <TabsContent value="booth">
         
            <ComingSoonTab tabName="Booth" />
          </TabsContent>

          <TabsContent value="customer">
         
            <ComingSoonTab tabName="Customer" />
          </TabsContent>

          <TabsContent value="campaign">
        
            <ComingSoonTab tabName="Campaign" />
          </TabsContent> */}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}