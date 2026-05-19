"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Mail,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosClient from "@/lib/axiosClient";
import { showToast } from "@/lib/showToast";
import { motion } from "framer-motion";

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<"loading" | "success" | "error" | "signup" | null>(null);
  const [message, setMessage] = React.useState("");
  const [invitationEmail, setInvitationEmail] = React.useState("");
  const [invitationData, setInvitationData] = React.useState<any>(null);
  const [error, setError] = React.useState("");

  // Signup form state
  const [signupForm, setSignupForm] = React.useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  React.useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid invitation link. No token provided.");
      return;
    }

    const checkInvitation = async () => {
      setLoading(true);
      setStatus("loading");
      try {
        const res = await axiosClient.post("/auth/invitations/accept", {
          token,
        });

        if (res.data.success) {
          setStatus("success");
          setMessage("Invitation accepted successfully! Redirecting to dashboard...");
          
          // Store token and user data
          if (res.data.data.access_token) {
            localStorage.setItem("token", res.data.data.access_token);
          }
          if (res.data.data.user) {
            localStorage.setItem("user", JSON.stringify(res.data.data.user));
          }

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        } else {
          setStatus("error");
          setMessage(res.data.message || "Failed to accept invitation");
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || "Failed to accept invitation";
        
        // If user needs to sign up, show signup form
        if (error.response?.data?.requires_signup && error.response?.data?.email) {
          setInvitationEmail(error.response.data.email);
          setSignupForm({
            ...signupForm,
            email: error.response.data.email,
          });
          setStatus("signup");
          setMessage("Please create an account to accept this invitation");
        } else {
          setStatus("error");
          setMessage(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    checkInvitation();
  }, [token, router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate
    if (!signupForm.name || !signupForm.email || !signupForm.password || !signupForm.password_confirmation) {
      setMessage("All fields are required");
      setLoading(false);
      return;
    }

    if (signupForm.password.length < 8) {
      setMessage("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (signupForm.password !== signupForm.password_confirmation) {
      setMessage("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await axiosClient.post("/auth/register", {
        name: signupForm.name,
        email: signupForm.email,
        password: signupForm.password,
        password_confirmation: signupForm.password_confirmation,
        invitation_token: token,
      });

      if (res.data.success) {
        setStatus("success");
        setMessage("Account created and invitation accepted! Redirecting to dashboard...");
        
        // Store token and user data
        if (res.data.data.access_token) {
          localStorage.setItem("token", res.data.data.access_token);
        }
        if (res.data.data.user) {
          localStorage.setItem("user", JSON.stringify(res.data.data.user));
        }

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch (error: any) {
      setMessage(error.response?.data?.message || error.response?.data?.errors 
        ? Object.values(error.response.data.errors).flat().join(", ")
        : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500"
          >
            <Mail className="h-8 w-8 text-white" />
          </motion.div>
          <CardTitle className="text-2xl font-bold">Accept Invitation</CardTitle>
          <CardDescription>
            {status === "loading" && "Processing your invitation..."}
            {status === "success" && "You've been successfully added to the team!"}
            {status === "signup" && "Create your account to join the team"}
            {status === "error" && "Unable to process invitation"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-sm text-muted-foreground text-center">{message || "Please wait..."}</p>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <CheckCircle2 className="h-12 w-12 text-green-600 mb-4" />
              <p className="text-sm text-center text-muted-foreground mb-4">{message}</p>
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {status === "signup" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="text-center mb-4">
                <UserPlus className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={signupForm.name}
                    onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    required
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-muted-foreground">Email is locked to invitation</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    required
                    disabled={loading}
                    minLength={8}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password_confirmation">Confirm Password</Label>
                  <Input
                    id="password_confirmation"
                    type="password"
                    placeholder="Confirm your password"
                    value={signupForm.password_confirmation}
                    onChange={(e) => setSignupForm({ ...signupForm, password_confirmation: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                
                {message && message !== "Please create an account to accept this invitation" && (
                  <p className="text-sm text-red-600">{message}</p>
                )}
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account & Accept Invitation
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <XCircle className="h-12 w-12 text-red-600 mb-4" />
              <p className="text-sm text-center text-muted-foreground mb-4">{message}</p>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => router.push("/signin")}
                  className="flex-1"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push("/signup")}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Sign Up
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-lg border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
              <p className="text-sm text-muted-foreground">Processing invitation...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
