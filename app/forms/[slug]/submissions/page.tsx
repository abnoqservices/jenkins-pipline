"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, Search, Loader2, Calendar, Globe, FileText, Download } from "lucide-react";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";

interface FormSubmission {
  id: number;
  form_id: number;
  product_id?: number;
  product?: {
    id: number;
    name: string;
  };
  event_id?: number;
  event?: {
    id: number;
    name: string;
  };
  values: Record<string, {
    label: string;
    value: any;
    type: string;
  }>;
  ip_address?: string;
  user_agent?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  traffic_source?: string;
  created_at: string;
  updated_at: string;
}

interface Form {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export default function FormSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.slug as string;

  const [form, setForm] = React.useState<Form | null>(null);
  const [submissions, setSubmissions] = React.useState<FormSubmission[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedSubmission, setSelectedSubmission] = React.useState<FormSubmission | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);

  React.useEffect(() => {
    if (formId) {
      loadForm();
      loadSubmissions();
    }
  }, [formId, page, searchQuery]);

  const loadForm = async () => {
    try {
      const res = await axiosClient.get(`/forms/${formId}`);
      if (res.data.success) {
        setForm(res.data.data);
      }
    } catch (err) {
      console.error("Error loading form:", err);
      showToast("Failed to load form", "error");
    }
  };

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: "15",
      });
      
      if (searchQuery) {
        params.append("search", searchQuery);
      }

      const res = await axiosClient.get(`/forms/${formId}/submissions?${params.toString()}`);
      if (res.data.success) {
        console.log("Submissions data:", res.data.data);
        setSubmissions(res.data.data || []);
        setTotalPages(res.data.meta?.last_page || 1);
        setTotal(res.data.meta?.total || 0);
      } else {
        showToast("Failed to load submissions", "error");
      }
    } catch (err) {
      console.error("Error loading submissions:", err);
      showToast("Failed to load submissions", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadSubmissions();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatValue = (value: any, type: string): string => {
    if (value === null || value === undefined) return "—";
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const exportCSV = () => {
    if (submissions.length === 0) {
      showToast("No submissions to export", "error");
      return;
    }

    // Get all unique field keys
    const allKeys = new Set<string>();
    submissions.forEach((sub) => {
      Object.keys(sub.values).forEach((key) => allKeys.add(key));
    });

    // Create CSV header
    const headers = ["Submitted At", "IP Address", "Traffic Source", ...Array.from(allKeys)];
    const rows = [headers];

    // Create CSV rows
    submissions.forEach((sub) => {
      const row = [
        formatDate(sub.created_at),
        sub.ip_address || "—",
        sub.traffic_source || "—",
        ...Array.from(allKeys).map((key) => {
          const field = sub.values[key];
          return field ? formatValue(field.value, field.type) : "—";
        }),
      ];
      rows.push(row);
    });

    // Convert to CSV string
    const csvContent = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `form-submissions-${formId}-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Submissions exported successfully", "success");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/forms")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Form Submissions
              </h1>
              {form && (
                <p className="text-muted-foreground mt-1">
                  {form.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Page</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{submissions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Page</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {page} / {totalPages}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Search Submissions</CardTitle>
            <CardDescription>Search by any field value</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search submissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Search</Button>
              {searchQuery && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setPage(1);
                  }}
                >
                  Clear
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Submissions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
            <CardDescription>
              View and manage form submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No submissions found</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Fields</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission) => {
                        const fieldCount = submission.values ? Object.keys(submission.values).length : 0;
                        const firstFields = submission.values ? Object.entries(submission.values).slice(0, 2) : [];
                        
                        return (
                          <TableRow key={submission.id}>
                            <TableCell className="whitespace-nowrap">
                              <div className="text-sm font-medium">
                                {formatDate(submission.created_at)}
                              </div>
                              {submission.ip_address && (
                                <div className="text-xs text-muted-foreground">
                                  {submission.ip_address}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {fieldCount === 0 ? (
                                <span className="text-sm text-muted-foreground">No field values</span>
                              ) : (
                                <div className="space-y-1">
                                  {firstFields.map(([key, field]) => (
                                    <div key={key} className="text-sm">
                                      <span className="font-medium">{field.label}:</span>{" "}
                                      <span className="text-muted-foreground">
                                        {formatValue(field.value, field.type).substring(0, 50)}
                                        {formatValue(field.value, field.type).length > 50 ? "..." : ""}
                                      </span>
                                    </div>
                                  ))}
                                  {fieldCount > 2 && (
                                    <div className="text-xs text-muted-foreground">
                                      +{fieldCount - 2} more fields
                                    </div>
                                  )}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {submission.traffic_source && (
                                  <Badge variant="outline">{submission.traffic_source}</Badge>
                                )}
                                {submission.utm_source && (
                                  <div className="text-xs text-muted-foreground">
                                    UTM: {submission.utm_source}
                                    {submission.utm_medium && ` / ${submission.utm_medium}`}
                                  </div>
                                )}
                                {submission.product && (
                                  <div className="text-xs text-muted-foreground">
                                    Product: {submission.product.name}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  setDialogOpen(true);
                                }}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Showing page {page} of {totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Submission Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              {selectedSubmission && formatDate(selectedSubmission.created_at)}
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              {/* Field Values */}
              <div>
                <h3 className="font-semibold mb-3">Form Fields</h3>
                {!selectedSubmission.values || Object.keys(selectedSubmission.values).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No field values available</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(selectedSubmission.values).map(([key, field]) => (
                      <div key={key} className="border-b pb-3">
                        <div className="font-medium text-sm text-muted-foreground mb-1">
                          {field.label}
                        </div>
                        <div className="text-sm">
                          {formatValue(field.value, field.type)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Metadata</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">IP Address</div>
                    <div className="font-medium">{selectedSubmission.ip_address || "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Traffic Source</div>
                    <div className="font-medium">{selectedSubmission.traffic_source || "—"}</div>
                  </div>
                  {selectedSubmission.utm_source && (
                    <div>
                      <div className="text-muted-foreground">UTM Source</div>
                      <div className="font-medium">{selectedSubmission.utm_source}</div>
                    </div>
                  )}
                  {selectedSubmission.utm_medium && (
                    <div>
                      <div className="text-muted-foreground">UTM Medium</div>
                      <div className="font-medium">{selectedSubmission.utm_medium}</div>
                    </div>
                  )}
                  {selectedSubmission.utm_campaign && (
                    <div>
                      <div className="text-muted-foreground">UTM Campaign</div>
                      <div className="font-medium">{selectedSubmission.utm_campaign}</div>
                    </div>
                  )}
                  {selectedSubmission.product && (
                    <div>
                      <div className="text-muted-foreground">Product</div>
                      <div className="font-medium">{selectedSubmission.product.name}</div>
                    </div>
                  )}
                  {selectedSubmission.event && (
                    <div>
                      <div className="text-muted-foreground">Event</div>
                      <div className="font-medium">{selectedSubmission.event.name}</div>
                    </div>
                  )}
                </div>
                {selectedSubmission.user_agent && (
                  <div className="mt-4">
                    <div className="text-muted-foreground text-sm mb-1">User Agent</div>
                    <div className="text-xs font-mono bg-muted p-2 rounded">
                      {selectedSubmission.user_agent}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
