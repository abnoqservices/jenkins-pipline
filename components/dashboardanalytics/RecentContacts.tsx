"use client";

import Link from "next/link";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardContactRow } from "@/lib/dashboardAnalyticsTypes";

function displayName(c: DashboardContactRow): string {
  const parts = [c.first_name, c.last_name].filter(Boolean);
  const name = parts.join(" ").trim();
  return name || "Unnamed contact";
}

function subtitle(c: DashboardContactRow): string {
  const type = c.contact_type.replace(/_/g, " ");
  const tail = c.company?.trim() || c.email?.trim() || "—";
  return `${type} • ${tail}`;
}

function lastContactLabel(updatedAt: string): string {
  try {
    return formatDistanceToNow(parseISO(updatedAt), { addSuffix: true });
  } catch {
    return "—";
  }
}

function statusLabel(status: DashboardContactRow["status"]): "Active" | "Inactive" {
  return status === "active" ? "Active" : "Inactive";
}

export default function RecentContacts({
  contacts,
  loading,
}: {
  contacts: DashboardContactRow[];
  loading: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl  border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Latest contacts</h3>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            See all
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
            ))}
          </>
        ) : contacts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No contacts yet.</p>
        ) : (
          contacts.map((contact) => {
            const st = statusLabel(contact.status);
            return (
              <div
                key={contact.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 p-3.5 hover:bg-gray-50/50 dark:border-gray-800 dark:hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate text-theme-sm dark:text-white/90">
                      {displayName(contact)}
                    </p>
                    <p className="text-gray-500 truncate text-theme-xs dark:text-gray-400">
                      {subtitle(contact)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="hidden sm:block text-right">
                    <p className="text-gray-500 text-theme-xs dark:text-gray-400">Last updated</p>
                    <p className="text-gray-700 text-theme-sm font-medium dark:text-gray-300">
                      {lastContactLabel(contact.updated_at)}
                    </p>
                  </div>

                  <Badge size="sm" variant={st === "Active" ? "success" : "secondary"}>
                    {st}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
