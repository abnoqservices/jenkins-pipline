export default function CustomersLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex space-x-4 border-b border-slate-200">
        <div className="h-10 w-24 bg-slate-200 rounded-t animate-pulse" />
        <div className="h-10 w-24 bg-slate-200 rounded-t animate-pulse" />
      </div>

      {/* Search and Filters Skeleton */}
      <div className="flex gap-4">
        <div className="h-10 flex-1 bg-slate-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-slate-200 rounded animate-pulse" />
      </div>

      {/* Table Skeleton */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-4">
          <div className="flex gap-4">
            <div className="h-4 w-4 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Table Rows */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="border-b border-slate-200 p-4">
            <div className="flex gap-4 items-center">
              <div className="h-4 w-4 bg-slate-200 rounded animate-pulse" />
              <div className="h-10 w-10 bg-slate-200 rounded-full animate-pulse" />
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
              <div className="h-6 w-16 bg-slate-200 rounded animate-pulse" />
              <div className="h-6 w-20 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-slate-200 rounded animate-pulse" />
          <div className="h-10 w-24 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
