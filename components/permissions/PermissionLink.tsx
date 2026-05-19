"use client";

import Link from "next/link";
import { usePermissions } from "@/lib/usePermissions";

interface Props {
  resource: string;
  action: string;
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function PermissionLink({
  resource,
  action,
  href,
  children,
  className,
}: Props) {
  const { hasPermission } = usePermissions();

  const allowed = hasPermission(resource, action);

  if (!allowed) {
    return (
      <span className={`opacity-50 cursor-not-allowed ${className}`}>
      
      </span>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

{/*     <PermissionLink
  resource={item.name}
  action={item.action}
  href={item.href ?? "#"}
>
Products
</PermissionLink> */}