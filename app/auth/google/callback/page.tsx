"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const userStr = searchParams.get("user");
    const orgStr = searchParams.get("organization");
    const isNewUser = searchParams.get("is_new_user") === "1";
    const departmentSelectionRequired = searchParams.get("departmentSelectionRequired") === "1";
    const selectedDepartmentId = searchParams.get("selectedDepartmentId");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const organization = orgStr ? JSON.parse(orgStr) : null;

        // Store token and user data
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        if (organization) {
          localStorage.setItem("organization", JSON.stringify(organization));
        }

        // Handle department selection
        if (departmentSelectionRequired) {
          // Redirect to department selection
          router.push("/select-department");
        } else if (selectedDepartmentId) {
          localStorage.setItem("selectedDepartmentId", selectedDepartmentId);
          // Redirect based on whether it's a new user
          if (isNewUser) {
            router.push("/account-setup");
          } else {
            router.push("/dashboard");
          }
        } else {
          // Redirect based on whether it's a new user
          if (isNewUser) {
            router.push("/account-setup");
          } else {
            router.push("/dashboard");
          }
        }
      } catch (err) {
        console.error("Error parsing callback data:", err);
        router.push(`/signin?error=${encodeURIComponent("Authentication failed")}`);
      }
    } else {
      // Error handling
      const error = searchParams.get("error");
      router.push(`/signin?error=${encodeURIComponent(error || "Authentication failed")}`);
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pexifly mx-auto mb-4"></div>
        <div className="text-lg font-medium">Completing sign in...</div>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pexifly mx-auto mb-4"></div>
            <div className="text-lg font-medium">Completing sign in...</div>
          </div>
        </div>
      }
    >
      <GoogleCallbackContent />
    </Suspense>
  );
}
