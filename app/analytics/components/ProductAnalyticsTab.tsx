"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect,useCallback } from "react"
import axiosClient from "@/lib/axiosClient"
import { showToast } from "@/lib/showToast"
import ProductFilters from "./ProductFilters"
import KeyMetricsCards from "./KeyMetricsCards"
import ProductPerformanceChart from "./ProductPerformanceChart"
import EngagementHeatmap from "./EngagementHeatmap"
import ConversionFunnel from "./ConversionFunnel"
import ProductEngagement from "./ProductEngagment" // ← typo in original name?
import UtmAnalytics from "./UtmAnalytics"
import EventProductAnalyticsDashboard from "./ProductEventAnalytic"
import FormSubmission from "./FormSubmission"
import { TrafficSourceAnalytics } from "./TrafficSourceAnalytics"
import { GeoAnalytics } from "./GeoAnalytics"
import { DeviceAnalytics } from "./DeviceAnalytics"

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

interface Filters {
  productId: string
  dateRange: string
  eventId: string
}

interface Metrics {
  totalViews: number
  qrScans: number
  leadsGenerated: number
  conversionRate: string
  viewsTrend: number
  scansTrend: number
  leadsTrend: number
  conversionTrend: number
}

interface ProductData {
  name: string
  views: number
  scans: number
  leads: number
}

interface TimeData {
  time: string
  scans: number
  views: number
}

interface FunnelData {
  stage: string
  count: number
  color: string
}

interface AnalyticsData {
  metrics: Metrics
  productData: ProductData[]
  timeData: TimeData[]
  funnelData: FunnelData[]
}

// ──────────────────────────────────────────────────────────────────────────────
// Fallback Data
// ──────────────────────────────────────────────────────────────────────────────

const FALLBACK_DATA: AnalyticsData = {
  metrics: {
    totalViews: 12450,
    qrScans: 4520,
    leadsGenerated: 890,
    conversionRate: "7.2",
    viewsTrend: 12.5,
    scansTrend: 18.2,
    leadsTrend: 23.1,
    conversionTrend: 5.8,
  },
  productData: [
    { name: "iPhone 16 Pro", views: 3240, scans: 1450, leads: 320 },
    { name: "MacBook Pro M4", views: 2890, scans: 980, leads: 210 },
    { name: "AirPods Pro 2", views: 2340, scans: 760, leads: 180 },
    { name: "iPad Air M2", views: 1980, scans: 620, leads: 140 },
  ],
  timeData: [
    { time: "Mon", scans: 450, views: 1200 },
    { time: "Tue", scans: 520, views: 1350 },
    { time: "Wed", scans: 480, views: 1280 },
    { time: "Thu", scans: 610, views: 1450 },
    { time: "Fri", scans: 580, views: 1320 },
  ],
  funnelData: [
    { stage: "Page Views", count: 12450, color: "#3b82f6" },
    { stage: "QR Scans", count: 4520, color: "#8b5cf6" },
    { stage: "Leads", count: 890, color: "#10b981" },
  ],
}

// ──────────────────────────────────────────────────────────────────────────────
// Custom Hook - Main Analytics Data
// ──────────────────────────────────────────────────────────────────────────────

const USE_STATIC_DATA = true; // ← change to false when you want real API
// const USE_STATIC_DATA = process.env.NODE_ENV === 'development';

const useAnalyticsData = (filters: Filters) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (USE_STATIC_DATA) {
      setData(FALLBACK_DATA);
      setIsLoading(false);
      
      // Optional: notify developer
      if (process.env.NODE_ENV === 'development') {
        console.log("[DEV] Using static fallback analytics data");
 
      }
      return;
    }

    // ── Normal API fetch ────────────────────────────────
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params: Record<string, any> = {
          date_range: filters.dateRange,
        };

        if (filters.productId !== "all") params.product_id = filters.productId;
        if (filters.eventId !== "all") params.event_id = filters.eventId;

        const response = await axiosClient.get("/analytics", { params });

        if (response.data?.success && response.data?.data) {
          const apiData = response.data.data;
          // ... rest of your parsing logic ...
          setData({ /* parsed data */ });
        } else {
          setData(FALLBACK_DATA);
        
        }
      } catch (err: any) {
        // ... error handling ...
        setData(FALLBACK_DATA);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [filters.productId, filters.eventId, filters.dateRange]);

  return { data: data ?? FALLBACK_DATA, isLoading, error };
};
// ──────────────────────────────────────────────────────────────────────────────
// Main Dashboard Component
// ──────────────────────────────────────────────────────────────────────────────

export default function ProductAnalyticsTab() {
  const [filters, setFilters] = useState<Filters>({
    productId: "all",
    dateRange: "7days",
    eventId: "all",
  })
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters)
    // You can also do other stable side effects here
    // fetchData(newFilters) ← better to do it in useEffect below
  }, []) // ← empty deps if you don't depend on other state

  // Or if you need to react to filter changes:
  useEffect(() => {
    // fetch data, save to localStorage, etc.
    console.log("Filters changed →", filters)
    // fetchAnalytics(filters)
  }, [filters])
  const { data, isLoading } = useAnalyticsData(filters)

  // We always show something — real data or fallback
  const safeData = data ?? FALLBACK_DATA

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Filters at the top */}
      <Card>
      <div className="card flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Product Analytics</h2>
        <ProductFilters onFilterChange={handleFilterChange} />
      </div>
      </Card>
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <span>Loading analytics...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
           {filters.eventId !== "all" ? (
        
        filters.productId !== "all" ? (
          // Both event and specific product are selected
          <EventProductAnalyticsDashboard 
            eventId={filters.eventId}
            defaultProductId={filters.productId}
          />
        ) : (
          // Only event is selected (product = all)
          <EventProductAnalyticsDashboard 
            eventId={filters.eventId}
          />
        )
      ) : (
        // No specific event selected → show placeholder/message
        <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-lg bg-muted/30">
          <h3 className="text-xl font-medium mb-2">Select an event to view analytics</h3>
          <p className="text-muted-foreground max-w-md">
            Choose a specific event from the dropdown above to see detailed analytics, 
            including page views, CTA clicks, top products, and trends.
          </p>
        </div>
      )}

          <div className="grid gap-6 lg:grid-cols-2">
          <ProductPerformanceChart productId={filters.productId} />

          <ProductPerformanceChart productId={filters.productId} eventId={filters.eventId} />
         
          </div>
          <ConversionFunnel eventId={filters.eventId} />
        
        

          <ProductEngagement productId={filters.productId} />
<ProductEngagement productId={filters.productId} eventId={filters.eventId} />
        

        
         
          
         

         
          {/* Traffic & Geo - currently hardcoded event */}
          <TrafficSourceAnalytics eventId={filters.eventId}/>
          <div className="grid gap-6 md:grid-cols-2">
            <GeoAnalytics eventId={filters.eventId} />
            <DeviceAnalytics eventId={filters.eventId} />
          </div>
          <UtmAnalytics productId={filters.productId} dateRange={filters.dateRange} eventId={filters.eventId} />
        </div>
        
      )}
    </div>
  )
}