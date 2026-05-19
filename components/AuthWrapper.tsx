"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import axiosClient from "@/lib/axiosClient";

const PUBLIC_ROUTES = [
  "/signin",
  "/signup",
  "/forgot-password",
  "/select-department",
  "/account-setup",
  "/plans",
  "/verify-email",
] as const;

type PublicRoute = (typeof PUBLIC_ROUTES)[number];

export default function AuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const publicRoutes = ["/signin", "/signup", "/forgot-password", "/select-department", "/account-setup", "/plans", "/verify-email"];
    const ensureDepartmentContext = async (): Promise<boolean> => {
      try {
        const meRes = await axiosClient.get("/auth/me");
        const data = meRes.data?.data;
        if (!data) return true;

        const departmentSelectionRequired =
          Boolean(data.department_selection_required) ||
          (!data.department_id &&
            Array.isArray(data.available_departments) &&
            data.available_departments.length > 1);

        if (departmentSelectionRequired) {
          localStorage.setItem(
            "loginData",
            JSON.stringify({
              departments: data.available_departments || [],
              selectedDepartmentId: data.department_id || null,
            })
          );
          router.replace("/select-department");
          return false;
        }
      } catch {
        // ignore; existing route guards handle auth errors elsewhere
      }
      return true;
    };

    // Not logged in → block protected routes
    if (!token && !publicRoutes.includes(pathname)) {
      router.replace("/signin"); // replace prevents flicker
      return;
    }

    // Logged in → block auth pages (but allow select-department and account-setup)
    if (token && (pathname === "/signin" || pathname === "/signup")) {
      // Check if account is set up before redirecting
      const checkAccountSetup = async () => {
        try {
          const res = await axiosClient.get("/account-setup/status");
          if (res.data.success) {
            const isAccountSetUp = res.data.data.is_account_set_up;
            const emailVerified = res.data.data.email_verified;
            if (!emailVerified) {
              router.replace("/verify-email");
            } else if (isAccountSetUp) {
              const canProceed = await ensureDepartmentContext();
              if (canProceed) {
                router.replace("/dashboard");
              }
            } else {
              router.replace("/account-setup");
            }
          } else {
            router.replace("/dashboard");
          }
        } catch (error) {
          router.replace("/dashboard");
        }
      };
      checkAccountSetup();
      return;
    }

    // Check account setup status for protected routes (excluding account-setup and verify-email)
    if (token && !publicRoutes.includes(pathname) && pathname !== "/account-setup" && pathname !== "/verify-email") {
      const checkAccountSetup = async () => {
        try {
          const res = await axiosClient.get("/account-setup/status");
          if (res.data.success) {
            const isAccountSetUp = res.data.data.is_account_set_up;
            const emailVerified = res.data.data.email_verified;
            if (!emailVerified) {
              router.replace("/verify-email");
              return;
            }
            if (!isAccountSetUp) {
              router.replace("/account-setup");
              return;
            }
          }
        } catch (error) {
          // If check fails, allow the route (error handling on protected routes will handle auth)
        }
        const canProceed = await ensureDepartmentContext();
        if (!canProceed) {
          return;
        }
        setIsReady(true);
      };
      checkAccountSetup();
      return;
    }

    //  Only allow render when route is valid
    setIsReady(true);
  }, [pathname, router]);

  // Prevent any flash of incorrect content
  // if (!isReady) {
  //   return (
  //     <div className="flex min-h-screen items-center justify-center">
  //       <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  //     </div>
  //   );
  // }

  return <>{children}</>;
}