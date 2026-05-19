"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ArrowDown, ArrowUp, Package, Users, UserRound } from "lucide-react";
import type { DashboardStatsResponse } from "@/lib/dashboardAnalyticsTypes";

function formatCount(n: number): string {
  return n.toLocaleString();
}

function TrendBadge({ value }: { value: number }) {
  const up = value > 0;
  const down = value < 0;
  const Icon = down ? ArrowDown : ArrowUp;
  const label = `${Math.abs(value).toFixed(1)}%`;
  const className = down
    ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
    : "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800";

  return (
    <Badge variant="outline" className={className}>
      <Icon className="h-3.5 w-3.5 mr-1" />
      {label}
    </Badge>
  );
}

function MetricCard({
  label,
  value,
  trend,
  icon,
  iconWrapClass,
  iconClass,
}: {
  label: string;
  value: string;
  trend: number;
  icon: React.ReactNode;
  iconWrapClass: string;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl  border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6  hover:shadow transition-shadow">
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${iconWrapClass}`}>
        <span className={iconClass}>{icon}</span>
      </div>
      <div className="flex items-end justify-between mt-5">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
          <h4 className="mt-1 font-bold text-gray-900 text-title-sm dark:text-white">{value}</h4>
        </div>
        <TrendBadge value={trend} />
      </div>
    </div>
  );
}

export function ProductEventMetrics({
  stats,
  loading,
}: {
  stats: DashboardStatsResponse | null;
  loading: boolean;
}) {
  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
          >
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="mt-5 h-4 w-24" />
            <Skeleton className="mt-2 h-8 w-20" />
          </div>
        ))}
      </div>
    );
  }

  const s = stats ?? {
    total_products: 0,
    active_events: 0,
    total_contacts: 0,
    form_submissions: 0,
    products_trend: 0,
    events_trend: 0,
    contacts_trend: 0,
    form_submissions_trend: 0,
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      <MetricCard
        label="Total Products"
        value={formatCount(s.total_products)}
        trend={s.products_trend}
        icon={<Package className="size-6" />}
        iconWrapClass="bg-blue-50 dark:bg-blue-950/30"
        iconClass="text-blue-600 dark:text-blue-400"
      />
      <MetricCard
        label="Active Events"
        value={formatCount(s.active_events)}
        trend={s.events_trend}
        icon={<Users className="size-6" />}
        iconWrapClass="bg-amber-50 dark:bg-amber-950/30"
        iconClass="text-amber-600 dark:text-amber-400"
      />
      <MetricCard
        label="Total Contacts"
        value={formatCount(s.total_contacts)}
        trend={s.contacts_trend}
        icon={<UserRound className="size-6" />}
        iconWrapClass="bg-emerald-50 dark:bg-emerald-950/30"
        iconClass="text-emerald-600 dark:text-emerald-400"
      />
      <MetricCard
        label="Form Submissions"
        value={formatCount(s.form_submissions)}
        trend={s.form_submissions_trend}
        icon={<FileText className="size-6" />}
        iconWrapClass="bg-purple-50 dark:bg-purple-950/30"
        iconClass="text-purple-600 dark:text-purple-400"
      />
    </div>
  );
}
