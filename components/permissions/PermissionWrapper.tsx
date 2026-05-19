"use client";

import { usePermissions } from "@/lib/usePermissions";

interface Props {
  resource: string;
  action: string;
  children: React.ReactNode;
}

export function PermissionWrapper({ resource, action, children }: Props) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(resource, action)) return null;

  return <>{children}</>;
}

{/* <PermissionWrapper resource="products" action="delete">
<Button>Delete</Button>
</PermissionWrapper> */}