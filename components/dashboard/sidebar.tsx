"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Box,
  CalendarDays,
  Book,
  ClipboardList,
  Workflow,
  Radio,
  Users,
  TrendingUp,
  Puzzle,
  CreditCard,
  ChevronDown,
  PanelsTopLeft,
  QrCode
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Image from "next/image";

import whiteLogo from "@/public/white_logo.png";           // collapsed / icon version
import whiteLogoFull from "@/public/white_logo_full.png"; // expanded version

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Products",
    href: "/products",
    icon: Box,
    children: [
      { name: "List", href: "/products" },
      { name: "Add Product", href: "/products/new" },
      { name: "Bulk Import", href: "/products/import" },
      {
        name: "Settings",
        children: [
          { name: "Product Category", href: "/products/settings/product-category" },
          { name: "Custom Fields", href: "/products/settings/custom-fields" },
          { name: "QR Code Templates", href: "/products/settings/qr-codes" },
        ],
      },
    ],
  },
  {
    name: "Events",
    href: "/events",
    icon: CalendarDays,
    children: [
      { name: "List", href: "/events" },
      { name: "Create Event", href: "/events/new" },
      { name: "Booths", href: "/events/booths" },
    ],
  },
  {
    name: "Landing Page",
    href: "/landing-pages/hub",
    icon: PanelsTopLeft,
    activePrefix: "/landing-pages",
  },
  {
    name: "QR Code",
    href: "/qr-tags",
    icon: QrCode,
    children: [
      {
        name: "Product QR Code Tags",
        href: "/qr-tags/products/template",                     
      },
      
    ]
  },
  // { name: "Catalogs", href: "/catalogs", icon: Book },
  { name: "Forms", href: "/forms", icon: ClipboardList },
  { name: "Workflows", href: "/workflows", icon: Workflow },
  // { name: "Campaigns", href: "/campaigns", icon: Radio },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
    children: [
      { name: "List", href: "/customers" },
      // { name: "Personas", href: "/customers/personas" },
    ],
  },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Integrations", href: "/integrations", icon: Puzzle },
  { name: "Billing", href: "/billing", icon: CreditCard },
];

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
}

export function Sidebar({
  isOpen,
  isCollapsed,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col",
          "bg-pexifly-dark text-white border-r border-white/10",
          "transition-all duration-500 ease-in-out",
          isCollapsed ? "w-16" : "w-64",
          // Mobile: slide in/out
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible, part of flex layout
          "lg:static lg:translate-x-0 lg:inset-auto"
        )}
      >
        <div className="flex min-h-screen flex-col">
          {/* Header / Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-white/10 shrink-0">
            <Link href="/dashboard">
              <Image
                src={isCollapsed ? whiteLogo : whiteLogoFull}
                alt="Pexifly"
                width={isCollapsed ? 38 : 110}
                height={isCollapsed ? 38 : 40}
                className="object-contain"
                priority
              />
            </Link>

            {/* You can add collapse toggle button here if needed */}
          </div>

          {/* Navigation – scrollable if many items */}
          <nav className="flex-1 overflow-y-auto px-3 py-5">
            <div className="space-y-1.5">
              {navigation.map((item) => (
                <NavItem
                  key={item.name}
                  item={item}
                  pathname={pathname}
                  isCollapsed={isCollapsed}
                  onClose={onClose}
                  level={0}
                />
              ))}
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}

// ────────────────────────────────────────────────

type NavItemProps = {
  item: any;
  pathname: string;
  isCollapsed: boolean;
  onClose: () => void;
  level: number;
};

function NavItem({ item, pathname, isCollapsed, onClose, level }: NavItemProps) {
  const [open, setOpen] = React.useState(false);

  const hasChildren = !!item.children;
  const activePrefix = item.activePrefix as string | undefined;
  const isActive =
    pathname === item.href ||
    (!!activePrefix && pathname.startsWith(activePrefix)) ||
    (item.href && pathname.startsWith(item.href + "/"));
  const isBranchActive =
    (!!activePrefix && pathname.startsWith(activePrefix)) ||
    (!!item.href && pathname.startsWith(item.href));

  if (hasChildren) {
    return (
      <Collapsible
        open={open && !isCollapsed}
        onOpenChange={setOpen}
        disabled={isCollapsed}
      >
        <CollapsibleTrigger asChild>
          <button
            title={isCollapsed ? item.name : undefined}
            className={cn(
              "group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isCollapsed ? "justify-center" : "justify-between",
              isBranchActive || open
                ? "bg-white/15 text-white"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              {item.icon && (
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform",
                    (isBranchActive || open) ? "scale-110 text-white" : "text-white/70"
                  )}
                />
              )}
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </div>

            {!isCollapsed && (
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform duration-300",
                  open && "rotate-180"
                )}
              />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className={cn("space-y-1 pt-1", isCollapsed && "hidden")}>
            {item.children.map((child: any) => (
              <NavItem
                key={child.name || child.href}
                item={child}
                pathname={pathname}
                isCollapsed={isCollapsed}
                onClose={onClose}
                level={level + 1}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Link
      href={item.href ?? "#"}
      prefetch
      onClick={() => window.innerWidth < 1024 && onClose()}
      title={isCollapsed ? item.name : undefined}
      className={cn(
        "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isCollapsed ? "justify-center" : "gap-3",
        level > 0 && !isCollapsed && "pl-10",
        isActive
          ? "bg-white/15 text-white font-medium"
          : "text-white/70 hover:bg-white/10 hover:text-white"
      )}
    >
      {level > 0 && !isCollapsed && !item.icon && (
        <div className="h-1.5 w-1.5 rounded-full bg-white/50 shrink-0" />
      )}

      {item.icon && (
        <item.icon
          className={cn(
            "h-5 w-5 shrink-0",
            isActive ? "text-white scale-110" : "text-white/70"
          )}
        />
      )}

      {!isCollapsed && <span className="truncate">{item.name}</span>}
    </Link>
  );
}