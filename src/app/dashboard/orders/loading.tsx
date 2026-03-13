import { Skeleton } from "@/components/ui/skeleton";

export default function OrdersLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-x-2">
          <Skeleton className="inline-block h-7 w-16 rounded-md" />
          <Skeleton className="inline-block h-7 w-16 rounded-md" />
          <Skeleton className="inline-block h-7 w-20 rounded-md" />
          <Skeleton className="inline-block h-7 w-20 rounded-md" />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-4 py-2">
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="grid grid-cols-5 items-center gap-4 px-4 py-3"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-10 justify-self-end" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

