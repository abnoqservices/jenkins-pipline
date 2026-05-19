'use client';

import { useEffect, useState } from 'react';
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import { format, subDays } from 'date-fns';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, RefreshCw, MailCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

// ✅ FIXED INTERFACE (match API)
interface DepartmentAnalytics {
  department_id: number;
  department_name: string;
  total_sent: number;
  total_unique_opens: number;
  open_rate_formatted: string;
  avg_opens_per_email: number;
}

export default function EmailAnalyticsPage() {
  const [analytics, setAnalytics] = useState<DepartmentAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // ✅ FIXED FETCH
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {};
      if (dateRange?.from) params.start_date = dateRange.from.toISOString().split('T')[0];
      if (dateRange?.to)   params.end_date   = dateRange.to.toISOString().split('T')[0];

      const res = await axiosClient.get('/email-analytics', { params });

      if (!res.data?.success) {
        throw new Error(res.data?.error || 'Failed to load analytics');
      }

      const apiData = res.data.data ?? [];

      // ✅ MAP API → FRONTEND
      const formattedData = apiData.map((item: any) => ({
        department_id: item.department_id,
        department_name: item.department_name,
        total_sent: item.total_sent,
        total_unique_opens: item.total_unique_opens,
        open_rate_formatted: item.open_rate_formatted,
        avg_opens_per_email: item.avg_opens_per_email,
      }));

      setAnalytics(formattedData);

    } catch (err: any) {
      console.error("Analytics fetch failed:", err);
      const msg = err.response?.data?.error || err.message || "Could not load analytics";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ CHECK STATUS (no change)
  const checkEmailStatus = async () => {
    try {
      setCheckingStatus(true);

      const res = await axiosClient.post('/integrations/google/send-check-status');

      if (res.data?.success) {
        showToast(res.data.message || "Email status updated", "success");
        setTimeout(fetchAnalytics, 1500);
      } else {
        throw new Error(res.data?.error);
      }

    } catch (err: any) {
      const msg = err.response?.data?.error || err.message;
      showToast(msg, "error");
    } finally {
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  // ✅ FIXED TOTALS
  const totals = analytics.reduce(
    (acc, dept) => ({
      total_sent: acc.total_sent + dept.total_sent,
      total_opens: acc.total_opens + dept.total_unique_opens,
    }),
    { total_sent: 0, total_opens: 0 }
  );

  const overallOpenRate =
    totals.total_sent > 0
      ? ((totals.total_opens / totals.total_sent) * 100).toFixed(2) + "%"
      : "0%";

  return (
    <div className="p-4">
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <div>
            <CardTitle>Email Analytics</CardTitle>
            <CardDescription>Department performance</CardDescription>
          </div>

          <div className="flex gap-2">
            <Button onClick={fetchAnalytics} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>

            <Button onClick={checkEmailStatus} disabled={checkingStatus}>
              <MailCheck className="mr-2 h-4 w-4" />
              Check Status
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Opens</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Avg</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {analytics.map((dept) => (
                  <TableRow key={dept.department_id}>
                    <TableCell>{dept.department_name}</TableCell>
                    <TableCell className="text-right">{dept.total_sent}</TableCell>
                    <TableCell className="text-right">{dept.total_unique_opens}</TableCell>
                    <TableCell className="text-right">{dept.open_rate_formatted}</TableCell>
                    <TableCell className="text-right">{dept.avg_opens_per_email}</TableCell>
                  </TableRow>
                ))}

                {/* TOTAL */}
                <TableRow className="font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{totals.total_sent}</TableCell>
                  <TableCell className="text-right">{totals.total_opens}</TableCell>
                  <TableCell className="text-right">{overallOpenRate}</TableCell>
                  <TableCell className="text-right">
                    {totals.total_sent > 0
                      ? (totals.total_opens / totals.total_sent).toFixed(2)
                      : "0"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}