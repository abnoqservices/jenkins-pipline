"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------- */
/* Button Permission Component */
/* -------------------------------------------------- */

interface PermissionRestrictedButtonProps
  extends React.ComponentProps<typeof Button> {
  hasPermission: boolean;
  requiredPermission: string;
  resource: string;
  action: string;
  children: React.ReactNode;
}

export function PermissionRestrictedButton({
  hasPermission,
  requiredPermission,
  resource,
  action,
  children,
  onClick,
  disabled,
  className,
  ...props
}: PermissionRestrictedButtonProps) {
  const message = `You need "${requiredPermission}" permission to ${action} ${resource}`;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!hasPermission) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    if (onClick) {
      onClick(e);
    }
  };

  if (hasPermission) {
    return (
      <Button
        onClick={handleClick}
        disabled={disabled}
        className={className}
        {...props}
      >
        {children}
      </Button>
    );
  }

  const { asChild: _asChild, ...rest } = props;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-block">
            <Button
              variant="outline"
              disabled
              className={cn("opacity-50 cursor-not-allowed", className)}
              {...rest}
            >
              <Lock className="mr-2 h-4 w-4" />
              {children}
              
            </Button>
          </span>
        </TooltipTrigger>

        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium mb-1">Permission Required</p>
          <p className="text-sm">{message}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Contact your administrator to request access.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/* -------------------------------------------------- */
/* Dropdown Menu Permission Component */
/* -------------------------------------------------- */

interface PermissionRestrictedMenuItemProps {
  hasPermission: boolean;
  requiredPermission: string;
  resource: string;
  action: string;
  children: React.ReactElement;
  onClick?: () => void;
  className?: string;
}

export function PermissionRestrictedMenuItem({
  hasPermission,
  requiredPermission,
  resource,
  action,
  children,
  onClick,
  className = "",
  
}: PermissionRestrictedMenuItemProps) {
  const message = `You need "${requiredPermission}" permission to ${action} ${resource}`;

  if (hasPermission && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
  
    return React.cloneElement(child, {
      className: cn(child.props.className, className),
      onClick,
    });
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "w-full opacity-50 cursor-not-allowed",
              className
            )}
          >
          { React.cloneElement(children as React.ReactElement<any>, {
          "aria-disabled": true,
          tabIndex: -1,
          onClick: (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
          },
        })}
          </div>
        </TooltipTrigger>

        <TooltipContent>
    <div className="max-w-xs">
      <p className="font-medium mb-1">Permission Required </p>
      <p className="text-sm">{message}</p>
      <p className="text-xs text-muted-foreground mt-1">
        Contact your administrator to request access.
      </p>
    </div>
  </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}