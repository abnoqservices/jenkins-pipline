import type { Metadata } from "next";
import React from "react";
import { DashboardLayout } from "@/components/dashboard/layout";
import DashboardAnalyticsShell from "@/components/dashboardanalytics/DashboardAnalyticsShell";

export const metadata: Metadata = {
  title: "Dashboard | Engage",
  description: "Organization overview, analytics, and recent contacts",
};

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardAnalyticsShell />
    </DashboardLayout>
  );
}
