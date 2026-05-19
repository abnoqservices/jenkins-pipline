"use client";

import { useCallback, useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import axiosClient from "@/lib/axiosClient";
import PendingSetupShortcuts from "@/components/dashboard/PendingSetupShortcuts";
import { ProductEventMetrics } from "@/components/dashboardanalytics/ProductEventMetrics";
import MonthlyTarget from "@/components/dashboardanalytics/MonthlyTarget";
import MonthlyScanChart from "@/components/dashboardanalytics/MonthlyScanChart";
import StatisticsChart from "@/components/dashboardanalytics/StatisticsChart";
import RecentContacts from "@/components/dashboardanalytics/RecentContacts";
import EmailTrackingAnalytics from "@/components/dashboardanalytics/EmailTrackingAnalytics";
import type {
  DashboardContactRow,
  DashboardStatsResponse,
} from "@/lib/dashboardAnalyticsTypes";
import type { ChartRangePreset } from "@/components/common/ChartTab";

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export default function DashboardAnalyticsShell() {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [contacts, setContacts] = useState<DashboardContactRow[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);

  const [chartPreset, setChartPreset] = useState<ChartRangePreset>("monthly");
  const [chartStart, setChartStart] = useState(() =>
    format(subDays(new Date(), 29), "yyyy-MM-dd")
  );
  const [chartEnd, setChartEnd] = useState(() =>
    format(new Date(), "yyyy-MM-dd")
  );

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await axiosClient.get<{ success: boolean; data: DashboardStatsResponse }>(
        "/analytics/dashboard/stats",
        { params: { chart_start: chartStart, chart_end: chartEnd } }
      );
      if (res.data?.success && res.data.data) {
        setStats(res.data.data);
      } else {
        setStats(null);
      }
    } catch {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [chartStart, chartEnd]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setContactsLoading(true);
      try {
        const res = await axiosClient.get("/contacts", { params: { per_page: 5 } });
        if (cancelled) return;
        const rows = res.data?.data?.data;
        if (Array.isArray(rows)) {
          setContacts(rows as DashboardContactRow[]);
        } else {
          setContacts([]);
        }
      } catch {
        if (!cancelled) setContacts([]);
      } finally {
        if (!cancelled) setContactsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyPresetDays = useCallback((days: number) => {
    const end = endOfToday();
    const start = subDays(end, days - 1);
    setChartStart(format(start, "yyyy-MM-dd"));
    setChartEnd(format(end, "yyyy-MM-dd"));
  }, []);

  const handleChartTabPreset = useCallback(
    (preset: "monthly" | "quarterly" | "annually") => {
      setChartPreset(preset);
      const days = preset === "monthly" ? 30 : preset === "quarterly" ? 90 : 365;
      applyPresetDays(days);
    },
    [applyPresetDays]
  );

  const onChartRangePick = useCallback((from: Date, to: Date) => {
    setChartPreset("custom");
    setChartStart(format(from, "yyyy-MM-dd"));
    setChartEnd(format(to, "yyyy-MM-dd"));
  }, []);

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <PendingSetupShortcuts />
      <div className="col-span-12 space-y-6 xl:col-span-7">
        <ProductEventMetrics stats={stats} loading={statsLoading} />

        <MonthlyScanChart
          monthlyQrScans={stats?.monthly_qr_scans}
          scansYear={stats?.scans_year}
          loading={statsLoading}
        />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <MonthlyTarget monthlyTarget={stats?.monthly_target} loading={statsLoading} />
      </div>

      <div className="col-span-12">
        <StatisticsChart
          chart={stats?.chart}
          loading={statsLoading}
          chartStart={chartStart}
          chartEnd={chartEnd}
          onRangePick={onChartRangePick}
          chartPreset={chartPreset}
          onChartPresetChange={handleChartTabPreset}
        />
      </div>

      <div className="col-span-12">
        <EmailTrackingAnalytics />
      </div>

      <div className="col-span-12">
        <RecentContacts contacts={contacts} loading={contactsLoading} />
      </div>
    </div>
  );
}
