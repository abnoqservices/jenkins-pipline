"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePermissions } from "@/lib/usePermissions";

interface Props {
  resource: string;
  action: string;
  redirect?: string;
  children: React.ReactNode;
}

export default function PermissionGuard({
  resource,
  action,
  redirect = "/",
  children,
}: Props) {
  const { hasPermission, loading } = usePermissions();
  const router = useRouter();

  const allowed = hasPermission(resource, action);

  useEffect(() => {
    if (!loading && !allowed) {
      router.replace(redirect);
    }
  }, [loading, allowed, redirect, router]);

  if (loading) return null;

  if (!allowed) return null;

  return <>{children}</>;
}

{/* <PermissionGuard resource="products" action="create">
<CreateProductPage />
</PermissionGuard> */}