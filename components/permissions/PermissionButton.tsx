"use client";

import { Button } from "@/components/ui/button";
import { usePermissions } from "@/lib/usePermissions";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props extends React.ComponentProps<typeof Button> {
  resource: string;
  action: string;
  children: React.ReactNode;
}

export function PermissionButton({
  resource,
  action,
  children,
  className,
  ...props
}: Props) {
  const { hasPermission, loading } = usePermissions();

  // Don't render until permissions loaded
  if (loading) {
    return (
      <Button disabled className={cn("opacity-50", className)} {...props}>
        {children}
      </Button>
    );
  }

  const allowed = hasPermission(resource, action);

  return (
    <Button
      disabled={!allowed}
      className={cn(!allowed && "opacity-50 cursor-not-allowed", className)}
      {...props}
    >
      {!allowed && <Lock className="mr-2 h-4 w-4" />}
      {children}
    </Button>
  );
}
{/* <PermissionButton resource="products" action="create">
Add Product
</PermissionButton> */}