import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[10px] bg-gradient-to-r from-app-border/25 via-app-border/40 to-app-border/25 bg-[length:200%_100%]",
        className,
      )}
      aria-hidden
    />
  );
}

/**
 * Generic shell placeholder while persisted app state hydrates (matches max-w-lg layout).
 */
export function PageSkeleton() {
  return (
    <div>
      <div className="border-b border-app-border-subtle pb-3">
        <Shimmer className="h-2 w-16" />
        <Shimmer className="mt-2 h-5 w-40" />
        <Shimmer className="mt-2 h-3 w-full max-w-[14rem]" />
      </div>
      <Shimmer className="mt-3 h-16 w-full rounded-lg" />
      <Shimmer className="mt-2 h-10 w-full rounded-[10px]" />
      <div className="mt-3 space-y-2">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-20 w-full rounded-[10px]" />
        <Shimmer className="h-20 w-full rounded-[10px]" />
      </div>
      <div className="mt-4 space-y-2">
        <Shimmer className="h-3 w-28" />
        <Shimmer className="h-14 w-full rounded-[10px]" />
      </div>
      <p className="mt-4 text-center text-[10px] font-medium text-app-muted">
        Cargando…
      </p>
    </div>
  );
}
