"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosClient from "@/lib/axiosClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail } from "lucide-react";
import Logo from "@/public/pexifly_logo.png";
import Image from "next/image";
import TestimonialsCarousel from "@/components/Signin/TestimonialsCarousel";
import MiddleContent from "@/components/Signin/MiddleContent";
import TrustedByMarquee from "@/components/Signin/TrustedByMarquee";

interface LoginResponse {
  success: boolean;
  user?: any;
  token?: string;
  mfaRequired?: boolean;
  mfaToken?: string;
  departments?: Array<{ id: number; name: string; description?: string }>;
  departmentSelectionRequired?: boolean;
  selectedDepartmentId?: number | null;
  error?: string;
}

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
  const [mfaRequired, setMfaRequired] = useState<boolean>(false);
  const [mfaToken, setMfaToken] = useState<string>("");
  const [mfaCode, setMfaCode] = useState<string>("");

  // Check if user is already logged in → redirect
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      // You can add optional token validation here if you want
      // e.g. call a /me or /validate-token endpoint

      const redirectPath =
        searchParams.get("redirect") ||
        localStorage.getItem("redirectAfterLogin") ||
        "/dashboard";

      // Clean up
      localStorage.removeItem("redirectAfterLogin");

      router.replace(redirectPath);
    } else {
      setCheckingAuth(false);
    }
  }, [router, searchParams]);

  // Handle error from URL params (e.g., from Google OAuth callback)
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }
  }, [searchParams]);

  const handleGoogleLogin = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    // Ensure we have the full path with /api prefix
    const googleAuthUrl = apiUrl.endsWith('/api') ? `${apiUrl}/auth/google` : `${apiUrl}/api/auth/google`;
    window.location.href = googleAuthUrl;
  };

  const loginUser = async (
    email: string,
    password: string
  ): Promise<LoginResponse> => {
    try {
      const response = await axiosClient.post("/auth/login", {
        email,
        password,
      });

      return {
        success: true,
        user: response.data.data.user,
        token: response.data.data.access_token,
        mfaRequired: response.data.data.mfa_required || false,
        mfaToken: response.data.data.mfa_token || "",
        departments: response.data.data.departments || [],
        departmentSelectionRequired:
          response.data.data.departmentSelectionRequired || false,
        selectedDepartmentId: response.data.data.selectedDepartmentId || null,
      };
    } catch (error: any) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data.message || "Login failed",
        };
      }
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  };

  const verifyMfaLogin = async (
    challengeToken: string,
    code: string
  ): Promise<LoginResponse> => {
    try {
      const response = await axiosClient.post("/auth/login/verify-mfa", {
        mfa_token: challengeToken,
        code,
      });

      return {
        success: true,
        user: response.data.data.user,
        token: response.data.data.access_token,
        departments: response.data.data.departments || [],
        departmentSelectionRequired:
          response.data.data.departmentSelectionRequired || false,
        selectedDepartmentId: response.data.data.selectedDepartmentId || null,
      };
    } catch (error: any) {
      if (error.response) {
        return {
          success: false,
          error: error.response.data.message || "MFA verification failed",
        };
      }
      return {
        success: false,
        error: "Network error. Please try again.",
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        setError("Please fill in all fields");
        return;
      }

      const result = mfaRequired
        ? await verifyMfaLogin(mfaToken, mfaCode)
        : await loginUser(email, password);

      if (result.success && result.mfaRequired && result.mfaToken) {
        setMfaRequired(true);
        setMfaToken(result.mfaToken);
        setMfaCode("");
        return;
      }

      if (result.success && result.user && result.token) {
        localStorage.setItem("user", JSON.stringify(result.user));
        localStorage.setItem("token", result.token);

        // Handle department selection logic
        if (
          result.departmentSelectionRequired &&
          result.departments &&
          result.departments.length > 1
        ) {
          localStorage.setItem(
            "loginData",
            JSON.stringify({
              departments: result.departments,
              selectedDepartmentId: result.selectedDepartmentId,
            })
          );
          router.push("/select-department");
        } else if (result.selectedDepartmentId) {
          localStorage.setItem(
            "selectedDepartmentId",
            result.selectedDepartmentId.toString()
          );
          const dept = result.departments?.find(
            (d) => d.id === result.selectedDepartmentId
          );
          if (dept) {
            localStorage.setItem("selectedDepartmentName", dept.name);
          }

          // Final redirect after department handling
          const redirectPath =
            searchParams.get("redirect") ||
            localStorage.getItem("redirectAfterLogin") ||
            "/dashboard";

          localStorage.removeItem("redirectAfterLogin");
          router.push(redirectPath);
        } else {
          // No department selection needed
          const redirectPath =
            searchParams.get("redirect") ||
            localStorage.getItem("redirectAfterLogin") ||
            "/dashboard";

          localStorage.removeItem("redirectAfterLogin");
          router.push(redirectPath);
        }
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    router.push("/dashboard");
  };

  // Show loading state while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-lg">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-7">
        {/* LEFT — LOGIN FORM */}
        <div className="flex items-center justify-center p-4 col-span-3">
          <div className="text-card-foreground flex flex-col gap-6 rounded-xl py-6 w-full max-w-md">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex items-center justify-center">
                <Image src={Logo} alt="Logo" width={100} height={100} />
              </div>
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your Pexifly account to continue
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                className="w-full border-gray-300 !shadow-none cursor-pointer hover:bg-gray-50"
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email*</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="!shadow-none"
                    disabled={mfaRequired}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password*</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-blue-600 hover:underline text-pexifly"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="!shadow-none"
                    disabled={mfaRequired}
                  />
                </div>

                {mfaRequired && (
                  <div className="space-y-2">
                    <Label htmlFor="mfa-code">Authenticator Code</Label>
                    <Input
                      id="mfa-code"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      value={mfaCode}
                      onChange={(e) =>
                        setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      required
                      className="!shadow-none"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-pexifly cursor-pointer font-bold"
                >
                  {loading ? "Signing in..." : mfaRequired ? "Verify Code" : "Sign In"}
                </Button>
              </form>

              <Separator />

          
            </CardContent>

            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-pexifly hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </div>
        </div>

        {/* RIGHT — INFO / TESTIMONIALS */}
        <div className="hidden col-span-4 relative lg:flex flex-col justify-between p-12 bg-pexifly overflow-hidden">
          <div className="absolute inset-0 bg-purple-800/80" />

          <div className="relative z-10 flex h-full flex-col">
            <TestimonialsCarousel />
            <MiddleContent />
            <TrustedByMarquee />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}