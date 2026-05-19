"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { QrCode, ArrowLeft, ArrowRight, Eye, EyeOff, Mail } from "lucide-react";
import axiosClient from "@/lib/axiosClient";
import Logo from "@/public/pexifly_logo.png";
import Image from "next/image";
import TestimonialsCarousel from "@/components/Signin/TestimonialsCarousel";
import MiddleContent from "@/components/Signin/MiddleContent";
import TrustedByMarquee from "@/components/Signin/TrustedByMarquee";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [signupSuccess, setSignupSuccess] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; type: "error" | "success" | null }>({
    text: "",
    type: null,
  });

  const [resendMessage, setResendMessage] = React.useState<{ text: string; type: "error" | "success" | null }>({
    text: "",
    type: null,
  });
  const [resending, setResending] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    agreeToTerms: false,
    organization: {
      name: "",
    },
  });

  const validateStep1 = () => {
    const { name, email, password, password_confirmation, agreeToTerms } = formData;

    if (!name || !email || !password || !password_confirmation) {
      setError("All fields are required.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return false;
    }

    if (password !== password_confirmation) {
      setError("Password and Confirm Password do not match.");
      return false;
    }

    if (!agreeToTerms) {
      setError("Please agree to the terms and conditions.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateStep1()) return;

    setLoading(true);
    try {
      const res = await axiosClient.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        organization: {
          name: formData.organization.name || `${formData.name || "New"} Organization`,
        },
      });

      if (res.data?.data?.access_token) {
        localStorage.setItem("token", res.data.data.access_token);
      }

      if (res.data?.data?.user) {
        localStorage.setItem("user", JSON.stringify(res.data.data.user));
      }

      // After successful signup, wait for email verification first
      setSignupSuccess(true);
      setMessage({
        text: "Account created successfully! Please check your email to verify your account.",
        type: "success",
      });
      
    } catch (err: any) {
      console.error("Signup error:", err);

      if (err.response?.status === 422) {
        const errors = err.response.data.errors as Record<string, string[]>;
        const errorMessages: string[] = [];

        Object.keys(errors).forEach((key) => {
          errors[key].forEach((msg: string) => {
            errorMessages.push(msg);
          });
        });

        setError(errorMessages.join(". ") || "Validation error occurred.");
      } else if (err.response?.data?.message) {
        const backendMsg = err.response.data.message;
        if (
          typeof backendMsg === "string" &&
          backendMsg.toLowerCase().includes("email") &&
          backendMsg.toLowerCase().includes("send")
        ) {
          setSignupSuccess(true);
          setMessage({
            text: "Account created, but verification email failed to send. Use the resend button below.",
            type: "error",
          });
        } else {
          setMessage({ text: backendMsg, type: "error" });
        }
      } else {
        setMessage({ text: "Something went wrong. Please try again.", type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendMessage({ text: "", type: null });
    setResending(true);

    try {
      await axiosClient.post("/auth/email/resend", { email: formData.email });

      setResendMessage({
        text: "Verification email sent successfully! Please check your inbox (and spam folder).",
        type: "success",
      });
    } catch (err: any) {
      console.error("Resend email error:", err);

      if (err.response?.data?.message) {
        setResendMessage({ text: err.response.data.message, type: "error" });
      } else {
        setResendMessage({
          text: "Failed to resend email. Please try again or contact support.",
          type: "error",
        });
      }
    } finally {
      setResending(false);
    }
  };

  const handleGoogleSignup = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
    // Ensure we have the full path with /api prefix
    const baseUrl = apiUrl.endsWith('/api') 
      ? `${apiUrl}/auth/google` 
      : `${apiUrl}/api/auth/google`;
    
    // Pass organization name as query parameter
    const params = new URLSearchParams();
    if (formData.organization.name) {
      params.append('org_name', formData.organization.name);
    }
    
    const googleAuthUrl = params.toString() 
      ? `${baseUrl}?${params.toString()}` 
      : baseUrl;
    
    window.location.href = googleAuthUrl;
  };

  if (signupSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <Card className="w-full max-w-md border-none bg-transparent">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Image src="https://cdn-icons-png.flaticon.com/512/9014/9014330.png" 
            alt="Email Delivered" width={140} height={140} />


            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription className="text-base mt-3">
              We've sent a verification link to <strong>{formData.email}</strong>.
              <br />
              Click the link in the email to activate your account and log in.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Didn't receive the email? Check your spam/junk folder.
              </p>

              {resendMessage.text && (
                <div
                  className={`text-center text-sm font-medium p-3 rounded-md mb-4 ${
                    resendMessage.type === "success"
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {resendMessage.text}
                </div>
              )}

              <Button
                onClick={handleResendVerification}
                disabled={resending}
                variant="outline"
                className="w-full"
              >
                {resending ? "Sending..." : "Resend Verification Email"}
              </Button>
            </div>

            <Button asChild className="w-full">
              <Link href="/signin">Go to Sign In</Link>
            </Button>
          </CardContent>

          <CardFooter className="justify-center text-sm text-muted-foreground">
            Need help? Contact support.
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-7">
        {/* LEFT — SIGNUP FORM */}
        <div className="flex items-center justify-center p-4 col-span-3">
          <div className="text-card-foreground flex flex-col gap-6 rounded-xl py-6 w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex items-center justify-center">
                <Image src={Logo} alt="Logo" width={100} height={100} />
          </div>
          <CardTitle className="text-2xl font-bold -mt-4">Create an account</CardTitle>
          <CardDescription>
            Get started with Pexifly today — no credit card required
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignup}
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
                

                <div className="space-y-2 mt-2">
                  <Label htmlFor="name">Full Name*</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="!shadow-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email*</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="!shadow-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password*</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="pr-10 !shadow-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Must be at least 8 characters long</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm Password*</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password_confirmation}
                      onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                      required
                      className="pr-10 !shadow-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, agreeToTerms: checked as boolean })
                  }
                />
                <label htmlFor="terms" className="text-sm leading-none">
                  I agree to the{" "}
                  <Link href="/terms" className="text-blue-600 hover:underline text-pexifly">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-blue-600 hover:underline text-pexifly">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-pexifly cursor-pointer font-bold"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="font-medium text-pexifly hover:underline"
              >
                Sign in
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