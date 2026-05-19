"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CreditCard, Calendar, TrendingUp, X, CheckCircle2 } from "lucide-react";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import { DashboardLayout } from "@/components/dashboard/layout";
import { Progress } from "@/components/ui/progress";
import { useLabels } from '@/app/context/TenantLabelsContext';

interface CurrentPlan {
  id: number;
  name: string;
  slug: string;
  price: number;
  annual_price: number | null;
}

interface SubscriptionData {
  current_plan: CurrentPlan;
  subscription_status: string;
  subscription_starts_at: string | null;
  subscription_ends_at: string | null;
  billing_period: "monthly" | "annual";
  razorpay_subscription_id: string | null;
  has_active_subscription: boolean;
}

interface UsageData {
  plan: CurrentPlan;
  limits: {
    max_departments: number | null;
    max_products_per_department: number | null;
    max_forms_per_department: number | null;
    max_customers_per_department: number | null;
  };
  usage: {
    departments_count: number;
    current_department: {
      department_id: number;
      department_name: string;
      products_count: number;
      forms_count: number;
      customers_count: number;
    } | null;
  };
}

export default function BillingPage() {
  const router = useRouter();
  const [subscription, setSubscription] = React.useState<SubscriptionData | null>(null);
  const [usage, setUsage] = React.useState<UsageData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState(false);
  const [newBillingPeriod, setNewBillingPeriod] = React.useState<"monthly" | "annual">("monthly");
  const { getLabel, labels } = useLabels();
  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subscriptionRes, usageRes] = await Promise.all([
        axiosClient.get("/plans/current"),
        axiosClient.get("/plans/usage"),
      ]);

      if (subscriptionRes.data.success) {
        setSubscription(subscriptionRes.data.data);
        setNewBillingPeriod(subscriptionRes.data.data.billing_period || "monthly");
      }

      if (usageRes.data.success) {
        setUsage(usageRes.data.data);
      }
    } catch (error) {
      console.error("Failed to load billing data:", error);
      showToast("Failed to load billing information. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setProcessing(true);
      const res = await axiosClient.post("/plans/cancel");

      if (res.data.success) {
        showToast("Subscription cancelled successfully", "success");
        await loadData();
      } else {
        throw new Error(res.data.message || "Failed to cancel subscription");
      }
    } catch (error: any) {
      console.error("Cancel subscription error:", error);
      showToast(
        error.response?.data?.message || "Failed to cancel subscription. Please try again.",
        "error"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleChangeBillingPeriod = async () => {
    try {
      setProcessing(true);
      const res = await axiosClient.post("/plans/change-billing-period", {
        billing_period: newBillingPeriod,
      });

      if (res.data.success) {
        showToast("Billing period changed successfully", "success");
        await loadData();
      } else {
        throw new Error(res.data.message || "Failed to change billing period");
      }
    } catch (error: any) {
      console.error("Change billing period error:", error);
      showToast(
        error.response?.data?.message || "Failed to change billing period. Please try again.",
        "error"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleUpgrade = () => {
    router.push("/plans");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "expired":
        return <Badge variant="secondary">Expired</Badge>;
      case "past_due":
        return <Badge className="bg-yellow-500">Past Due</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getUsagePercentage = (current: number, limit: number | null) => {
    if (limit === null) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-gray-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!subscription || !usage) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Failed to load billing information.</p>
        </div>
      </DashboardLayout>
    );
  }

  const currentPlan = subscription.current_plan;
  const isFreePlan = currentPlan.price === 0;
  const canChangeBilling = !isFreePlan && subscription.has_active_subscription;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-gray-600">Manage your subscription and billing preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plan Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Current Plan</CardTitle>
                    <CardDescription>Your active subscription details</CardDescription>
                  </div>
                  {getStatusBadge(subscription.subscription_status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-2xl font-bold mb-1">{currentPlan.name}</div>
                  <div className="text-gray-600">
                    {isFreePlan
                      ? "Free Forever"
                      : subscription.billing_period === "annual" && currentPlan.annual_price
                      ? `₹${currentPlan.annual_price.toLocaleString()}/year`
                      : `₹${currentPlan.price.toLocaleString()}/month`}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Started</div>
                    <div className="font-medium">
                      {formatDate(subscription.subscription_starts_at)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      {isFreePlan ? "Expires" : "Renews"}
                    </div>
                    <div className="font-medium">
                      {subscription.subscription_ends_at
                        ? formatDate(subscription.subscription_ends_at)
                        : "Never"}
                    </div>
                  </div>
                </div>

                {subscription.razorpay_subscription_id && (
                  <div className="pt-4 border-t">
                    <div className="text-sm text-gray-600 mb-1">Subscription ID</div>
                    <div className="font-mono text-xs">{subscription.razorpay_subscription_id}</div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleUpgrade} variant="outline">
                    Change Plan
                  </Button>
                  {canChangeBilling && (
                    <Button
                      onClick={handleChangeBillingPeriod}
                      variant="outline"
                      disabled={processing || newBillingPeriod === subscription.billing_period}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Switch to ${newBillingPeriod === "monthly" ? "Annual" : "Monthly"}`
                      )}
                    </Button>
                  )}
                  {subscription.has_active_subscription && !isFreePlan && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={processing}>
                          Cancel Subscription
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel your subscription? You will continue to
                            have access until the end of your current billing period (
                            {formatDate(subscription.subscription_ends_at)}).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleCancelSubscription}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {processing ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              "Cancel Subscription"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            {usage.current_department && (
              <Card>
                <CardHeader>
                  <CardTitle>Usage Statistics</CardTitle>
                  <CardDescription>
                    Current usage for {usage.current_department.department_name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Products Usage */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Products</span>
                      <span>
                        {usage.current_department.products_count} /{" "}
                        {usage.limits.max_products_per_department === null
                          ? "∞"
                          : usage.limits.max_products_per_department}
                      </span>
                    </div>
                    <Progress
                      value={getUsagePercentage(
                        usage.current_department.products_count,
                        usage.limits.max_products_per_department
                      )}
                    />
                  </div>

                  {/* Forms Usage */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Forms</span>
                      <span>
                        {usage.current_department.forms_count} /{" "}
                        {usage.limits.max_forms_per_department === null
                          ? "∞"
                          : usage.limits.max_forms_per_department}
                      </span>
                    </div>
                    <Progress
                      value={getUsagePercentage(
                        usage.current_department.forms_count,
                        usage.limits.max_forms_per_department
                      )}
                    />
                  </div>

                  {/* Customers Usage */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Customers</span>
                      <span>
                        {usage.current_department.customers_count} /{" "}
                        {usage.limits.max_customers_per_department === null
                          ? "∞"
                          : usage.limits.max_customers_per_department}
                      </span>
                    </div>
                    <Progress
                      value={getUsagePercentage(
                        usage.current_department.customers_count,
                        usage.limits.max_customers_per_department
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Plan Limits Card */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Limits</CardTitle>
              <CardDescription>Your current plan features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-gray-600 mb-1">{getLabel('label.department')}s</div>
                <div className="font-medium">
                  {usage.limits.max_departments === null
                    ? "Unlimited"
                    : `${usage.usage.departments_count} / ${usage.limits.max_departments}`}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Products per {getLabel('label.department')}</div>
                <div className="font-medium">
                  {usage.limits.max_products_per_department === null
                    ? "Unlimited"
                    : usage.limits.max_products_per_department}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Forms per {getLabel('label.department')}</div>
                <div className="font-medium">
                  {usage.limits.max_forms_per_department === null
                    ? "Unlimited"
                    : usage.limits.max_forms_per_department}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Customers per {getLabel('label.department')}</div>
                <div className="font-medium">
                  {usage.limits.max_customers_per_department === null
                    ? "Unlimited"
                    : usage.limits.max_customers_per_department}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
