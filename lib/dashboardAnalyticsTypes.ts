export interface DashboardMonthlyTarget {
  scan_mtd: number;
  view_mtd: number;
  direct_view_mtd: number;
  scan_last_month_partial: number;
  view_last_month_partial: number;
  direct_view_last_month_partial: number;
  target_progress_percent: number;
  month_over_month_percent: number;
  today_page_views: number;
}

export interface DashboardChartBlock {
  start: string;
  end: string;
  labels: string[];
  page_views: number[];
  qr_scans: number[];
}

export interface DashboardStatsResponse {
  total_products: number;
  active_events: number;
  total_contacts: number;
  qr_scans: number;
  page_views: number;
  form_submissions: number;
  leads: number;
  views_trend: number;
  products_trend: number;
  events_trend: number;
  contacts_trend: number;
  form_submissions_trend: number;
  monthly_qr_scans: number[];
  scans_year: number;
  chart: DashboardChartBlock;
  monthly_target: DashboardMonthlyTarget;
}

export interface DashboardContactRow {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  contact_type: string;
  contact_source: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}
