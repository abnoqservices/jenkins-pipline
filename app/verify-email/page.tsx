"use client";
export const dynamic = "force-dynamic";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, CheckCircle } from "lucide-react";
interface VerifyEmailPageProps {
  searchParams: {
    id?: string;
    hash?: string;
    expires?: string;
    signature?: string;
  };
}

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  

  // Extract from query string
  const id = searchParams.get("id");
  const hash = searchParams.get("hash");
  const expires = searchParams.get("expires");
  const signature = searchParams.get("signature");

  const [status, setStatus] = useState<"verifying" | "success" | "already_verified" | "failed">("verifying");
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);

  // Pre-fill email when failed
  useEffect(() => {
    if (status === "failed") {
      const savedEmail = localStorage.getItem("pendingVerificationEmail");
      if (savedEmail && savedEmail.includes("@")) {
        setEmail(savedEmail);
      }
    }
  }, [status]);

  // Auto verify on mount
  useEffect(() => {
   
    if (!id || !hash || !expires || !signature) {
      setStatus("failed");
      showToast("Invalid or missing verification link parameters.", "error");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await axiosClient.post(
          `/auth/email/verify/${id}/${hash}`, // ← Correct endpoint with /api
          {}, // ← No body
          {
            params: {
              expires,
              signature,
            }, // ← Query params go here
          }
        );
 
        const message = response.data.message || "Email verified successfully";
        console.log("Verification response:", response);
        if (message.toLowerCase().includes("already verified")) {
          setStatus("already_verified");
          showToast(message, "info");
        } else {
          setStatus("success");
          showToast(message, "success");
          localStorage.removeItem("pendingVerificationEmail"); // Clean up
          
          // Check if user is logged in and account setup status
          const token = localStorage.getItem("token");
          if (token) {
            try {
              const setupRes = await axiosClient.get("/account-setup/status");
              if (setupRes.data.success) {
                const isAccountSetUp = setupRes.data.data.is_account_set_up;
                if (!isAccountSetUp) {
                  // Redirect to account-setup if incomplete
                  setTimeout(() => {
                    router.push("/account-setup");
                  }, 1500);
                  return;
                } else {
                  // Account is set up, redirect to dashboard
                  setTimeout(() => {
                    router.push("/dashboard");
                  }, 1500);
                  return;
                }
              }
            } catch (error) {
              // If check fails, continue with normal flow (user will sign in)
              console.error("Failed to check account setup status:", error);
            }
          }
          // If not logged in, user will need to sign in, and AuthWrapper will handle redirect
        }
      } catch (error: any) {
        const message =
          error.response?.data?.message ||
          "Verification link has expired or is invalid.";

        setStatus("failed");
        showToast(message, "error");
      }
    };

    verifyEmail();
  }, [id, hash, expires, signature, router]);

  // Resend verification email
  const handleResend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResendLoading(true);

    if (!email || !email.includes("@")) {
      showToast("Please enter a valid email address.", "error");
      setResendLoading(false);
      return;
    }

    try {
      await axiosClient.post("/auth/email/resend", { email }); // ← Also ensure /api here if needed

      showToast("Verification email sent successfully!", "success");
      localStorage.setItem("pendingVerificationEmail", email);
      setEmail(""); // Clear input after success
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.email?.[0] ||
        "Unable to send verification email.";

      showToast(msg, "error");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>

          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription>
            {status === "verifying"
              ? "Checking your verification link..."
              : "Confirm your email address to continue"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Verifying State */}
          {status === "verifying" && (
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-3 text-blue-600">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-lg">Verifying your email...</span>
              </div>
            </div>
          )}

          {/* Success or Already Verified */}
          {(status === "success" || status === "already_verified") && (
            <div className="text-center py-8 space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <p className="text-lg font-medium text-green-700">
                {status === "success" ? "Email Verified Successfully!" : "Email Already Verified"}
              </p>
              <p className="text-muted-foreground">
                You can now sign in to your account.
              </p>
            </div>
          )}

          {/* Failed State + Resend */}
          {status === "failed" && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <p className="text-lg font-medium text-red-600">Verification Failed</p>
                <p className="text-sm text-muted-foreground mt-2">
                  The link may have expired or is invalid.
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-center text-sm text-muted-foreground">
                  Enter your email to receive a new verification link
                </p>

                <form onSubmit={handleResend} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={resendLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {resendLoading ? "Sending..." : "Resend Verification Email"}
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* Continue to Sign In or Account Setup after success */}
          {(status === "success" || status === "already_verified") && (
            <div className="text-center pt-6">
              <Button
                onClick={async () => {
                  // Check account setup status before redirecting
                  try {
                    const setupRes = await axiosClient.get("/account-setup/status");
                    if (setupRes.data.success) {
                      const isAccountSetUp = setupRes.data.data.is_account_set_up;
                      if (!isAccountSetUp) {
                        router.push("/account-setup");
                        return;
                      }
                    }
                  } catch (error) {
                    console.error("Failed to check account setup status:", error);
                  }
                  // If account is set up or check fails, go to sign in
                  router.push("/signin");
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Continue
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Back to{" "}
            <Link href="/signin" className="font-medium text-blue-600 hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}