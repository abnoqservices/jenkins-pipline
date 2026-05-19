"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, Crown, Zap } from "lucide-react";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import { DashboardLayout } from "@/components/dashboard/layout";
import { cn } from "@/lib/utils";
import { useLabels } from '@/app/context/TenantLabelsContext';
interface Plan {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  annual_price: number | null;
  currency: string;
  max_departments: number | null;
  max_products_per_department: number | null;
  max_forms_per_department: number | null;
  max_customers_per_department: number | null;
  has_analytics: boolean;
  has_custom_fields: boolean;
  has_api_access: boolean;
  has_priority_support: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CurrentPlan {
  id: number;
  name: string;
  slug: string;
  subscription_status?: string;
  billing_period?: string;
}

export default function PlansPage() {
  const router = useRouter();
  const [plans, setPlans] = React.useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = React.useState<CurrentPlan | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState<number | null>(null);
  const [billingPeriod, setBillingPeriod] = React.useState<"monthly" | "annual">("monthly");
  const { getLabel, labels } = useLabels();
  React.useEffect(() => {
    loadPlans();
    loadCurrentPlan();
    loadRazorpayScript();
  }, []);

  const loadRazorpayScript = () => {
    if (document.getElementById("razorpay-script")) return;

    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  };

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/plans");
      if (res.data.success) {
        setPlans(res.data.data);
      }
    } catch (error) {
      console.error("Failed to load plans:", error);
      showToast("Failed to load plans. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentPlan = async () => {
    try {
      const res = await axiosClient.get("/plans/current");
      if (res.data.success && res.data.data.current_plan) {
        setCurrentPlan(res.data.data.current_plan);
        // Set billing period from current plan if available
        if (res.data.data.billing_period) {
          setBillingPeriod(res.data.data.billing_period as "monthly" | "annual");
        }
      }
    } catch (error) {
      console.error("Failed to load current plan:", error);
      // Not critical, just log the error
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    try {
      setProcessing(plan.id);

      // If free plan, activate directly
      if (plan.price === 0) {
        const res = await axiosClient.post("/plans/create-subscription", {
          plan_id: plan.id,
          billing_period: "monthly",
        });

        if (res.data.success) {
          showToast("Free plan activated successfully!", "success");
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        }
        return;
      }

      // For paid plans, create subscription
      const subscriptionRes = await axiosClient.post("/plans/create-subscription", {
        plan_id: plan.id,
        billing_period: billingPeriod,
      });

      if (!subscriptionRes.data.success) {
        throw new Error(subscriptionRes.data.message || "Failed to create subscription");
      }

      const subscriptionData = subscriptionRes.data.data;
      const subscriptionId = subscriptionData.subscription_id; // Store subscription ID from backend

      // Initialize Razorpay checkout
      const options = {
        key: subscriptionData.razorpay_key_id,
        subscription_id: subscriptionId,
        name: "Pexifly",
        description: `${plan.name} Plan - ${billingPeriod === "annual" ? "Annual" : "Monthly"}`,
        handler: async function (response: any) {
          try {
            // Log the response for debugging
            console.log('Razorpay response:', response);
            console.log('Response keys:', Object.keys(response));
            
            // Extract payment ID and signature - Razorpay may use different field names
            const paymentId = response.razorpay_payment_id || 
                            response.razorpay_paymentId || 
                            response.payment_id ||
                            response.razorpay_payment_id;
            
            const signature = response.razorpay_signature || 
                            response.razorpaySignature || 
                            response.signature;
            
            console.log('Extracted values:', { subscriptionId, paymentId, hasSignature: !!signature });
            
            // Verify subscription - use subscription_id from backend, not from Razorpay response
            const verifyRes = await axiosClient.post("/plans/verify-subscription", {
              razorpay_subscription_id: subscriptionId, // Use the subscription ID from backend
              razorpay_payment_id: paymentId,
              razorpay_signature: signature,
              plan_id: plan.id,
              billing_period: billingPeriod,
            });

            if (verifyRes.data.success) {
              showToast("Subscription activated successfully!", "success");
              // Reload plans and current plan to show updated subscription
              await Promise.all([loadPlans(), loadCurrentPlan()]);
              setTimeout(() => {
                router.push("/dashboard");
              }, 2000);
            } else {
              throw new Error(verifyRes.data.message || "Verification failed");
            }
          } catch (error: any) {
            console.error("Subscription verification error:", error);
            showToast(
              error.response?.data?.message || "Failed to verify subscription. Please contact support.",
              "error"
            );
          }
        },
        prefill: {
          email: subscriptionData.organization.email,
          name: subscriptionData.organization.name,
        },
        theme: {
          color: "#6366f1",
        },
        modal: {
          ondismiss: function () {
            setProcessing(null);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Subscription error:", error);
      showToast(
        error.response?.data?.message || "Failed to create subscription. Please try again.",
        "error"
      );
      setProcessing(null);
    }
  };

  const getPrice = (plan: Plan) => {
    if (plan.price === 0) return "Free";
    return billingPeriod === "annual" && plan.annual_price
      ? `₹${plan.annual_price.toLocaleString()}/year`
      : `₹${plan.price.toLocaleString()}/month`;
  };

  const getSavings = (plan: Plan) => {
    if (plan.price === 0 || !plan.annual_price) return null;
    const monthlyTotal = plan.price * 12;
    const savings = monthlyTotal - plan.annual_price;
    return savings > 0 ? `Save ₹${savings.toLocaleString()}/year` : null;
  };

  const getPlanIcon = (slug: string) => {
    switch (slug) {
      case "basic":
        return null;
      case "pro":
        return <Zap className="h-5 w-5" />;
      case "enterprise":
        return <Crown className="h-5 w-5" />;
      default:
        return null;
    }
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

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-gray-600 mb-6">Select the perfect plan for your business needs</p>

          {/* Billing Period Toggle */}
          <div className="inline-flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                billingPeriod === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                billingPeriod === "annual"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Annual
              <Badge variant="secondary" className="ml-2 text-xs">
                Save 17%
              </Badge>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isPopular = plan.slug === "pro";
            const isCurrentPlan = currentPlan && currentPlan.id === plan.id;
            const savings = getSavings(plan);

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative flex flex-col",
                  isCurrentPlan && "border-2 border-green-500 shadow-lg",
                  isPopular && !isCurrentPlan && "border-2 border-blue-500 shadow-lg scale-105"
                )}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-500 text-white">Current Plan</Badge>
                  </div>
                )}
                {isPopular && !isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {getPlanIcon(plan.slug)}
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <div className="text-3xl font-bold">{getPrice(plan)}</div>
                    {savings && (
                      <div className="text-sm text-green-600 font-medium mt-1">{savings}</div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>
                        {plan.max_departments === null
                          ? "Unlimited"
                          : plan.max_departments}{" "}
                        {plan.max_departments === 1 ? `${getLabel('label.department')}` : `${getLabel('label.department')}s`}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>
                        {plan.max_products_per_department === null
                          ? "Unlimited"
                          : plan.max_products_per_department}{" "}
                        Products per {getLabel('label.department')}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>
                        {plan.max_forms_per_department === null
                          ? "Unlimited"
                          : plan.max_forms_per_department}{" "}
                        Forms per {getLabel('label.department')}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>
                        {plan.max_customers_per_department === null
                          ? "Unlimited"
                          : plan.max_customers_per_department}{" "}
                        Customers per {getLabel('label.department')}
                      </span>
                    </li>
                    {plan.has_analytics && (
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Advanced Analytics</span>
                      </li>
                    )}
                    {plan.has_custom_fields && (
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Custom Fields</span>
                      </li>
                    )}
                    {plan.has_api_access && (
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>API Access</span>
                      </li>
                    )}
                    {plan.has_priority_support && (
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Priority Support</span>
                      </li>
                    )}
                  </ul>
                </CardContent>

                <CardFooter>
                  {currentPlan && currentPlan.id === plan.id ? (
                    <div className="w-full">
                      <Button
                        className="w-full"
                        variant="outline"
                        disabled
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Current Plan
                      </Button>
                      {currentPlan.billing_period && (
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          Billed {currentPlan.billing_period === "annual" ? "annually" : "monthly"}
                        </p>
                      )}
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      variant={isPopular ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan)}
                      disabled={processing === plan.id}
                    >
                      {processing === plan.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : plan.price === 0 ? (
                        "Get Started"
                      ) : (
                        "Subscribe"
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
