import { DashboardLayout } from "@/components/dashboard/layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function ProductsLoading() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </div>
          <Skeleton className="h-10 w-[140px]" />
        </div>

        {/* Filters Bar Skeleton */}
        <div className="rounded-xl border border-slate-200 bg-card p-4 ">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Skeleton className="h-10 w-full max-w-md" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-10 w-[140px]" />
              <Skeleton className="h-10 w-[120px]" />
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-[120px]" />
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="rounded-xl border border-slate-200 bg-card  p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
