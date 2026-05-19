"use client";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { parse, format } from "date-fns";
import ChartTab from "../common/ChartTab";
import type { ChartRangePreset } from "../common/ChartTab";
import { Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardChartBlock } from "@/lib/dashboardAnalyticsTypes";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function StatisticsChart({
  chart,
  loading,
  chartStart,
  chartEnd,
  onRangePick,
  chartPreset,
  onChartPresetChange,
}: {
  chart?: DashboardChartBlock;
  loading: boolean;
  chartStart: string;
  chartEnd: string;
  onRangePick: (from: Date, to: Date) => void;
  chartPreset: ChartRangePreset;
  onChartPresetChange: (preset: "monthly" | "quarterly" | "annually") => void;
}) {
  const datePickerRef = useRef<HTMLInputElement>(null);
  const fpRef = useRef<ReturnType<typeof flatpickr> | null>(null);

  useEffect(() => {
    if (!datePickerRef.current) return;

    const start = parse(chartStart, "yyyy-MM-dd", new Date());
    const end = parse(chartEnd, "yyyy-MM-dd", new Date());

    fpRef.current?.destroy();
    const fp = flatpickr(datePickerRef.current, {
      mode: "range",
      dateFormat: "M d, Y",
      defaultDate: [start, end],
      static: true,
      clickOpens: true,
      monthSelectorType: "static",
      prevArrow:
        '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 15L7.5 10L12.5 5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      nextArrow:
        '<svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 15L12.5 10L7.5 5" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      onChange: (selectedDates) => {
        if (selectedDates.length === 2) {
          onRangePick(selectedDates[0], selectedDates[1]);
        }
      },
    });
    fpRef.current = fp;

    return () => {
      fpRef.current?.destroy();
      fpRef.current = null;
    };
  }, [chartStart, chartEnd, onRangePick]);

  const labels = chart?.labels?.length ? chart.labels : ["—"];
  const views = chart?.page_views?.length ? chart.page_views : [0];
  const scans = chart?.qr_scans?.length ? chart.qr_scans : [0];

  const options: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "area",
      toolbar: { show: false },
    },
    colors: ["#465FFF", "#9CB9FF"],
    stroke: {
      curve: "straight",
      width: [2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 6 },
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    tooltip: {
      enabled: true,
      x: { show: true },
      y: {
        formatter: (val: number, { seriesIndex }: { seriesIndex: number }) => {
          return seriesIndex === 0 ? `${val} views` : `${val} scans`;
        },
      },
    },
    xaxis: {
      type: "category",
      categories: labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },
      title: { text: "", style: { fontSize: "0px" } },
    },
  };

  const series = [
    { name: "Page views", data: views },
    { name: "QR scans", data: scans },
  ];

  const rangeLabel =
    chart?.start && chart?.end
      ? `${format(parse(chart.start, "yyyy-MM-dd", new Date()), "MMM d, yyyy")} – ${format(
          parse(chart.end, "yyyy-MM-dd", new Date()),
          "MMM d, yyyy"
        )}`
      : "";

  return (
    <div className="rounded-2xl  border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Statistics</h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Overview of views and scans
            {rangeLabel ? (
              <span className="block text-theme-xs mt-0.5 text-gray-400">{rangeLabel}</span>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div key={`${chartStart}_${chartEnd}`} className="relative inline-flex items-center">
            <input
              ref={datePickerRef}
              type="text"
              placeholder="Select date range"
              className="w-48 pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:focus:ring-purple-600"
              readOnly
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-600 pointer-events-none" />
          </div>

          <ChartTab value={chartPreset} onChange={onChartPresetChange} />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          {loading && !chart ? (
            <Skeleton className="h-[310px] w-full" />
          ) : (
            <Chart options={options} series={series} type="area" height={310} />
          )}
        </div>
      </div>
    </div>
  );
}
