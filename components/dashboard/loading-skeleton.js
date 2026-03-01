export function MetricCardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-border p-5 animate-pulse">
      <div className="h-3 w-20 bg-gray-brand/20 rounded" />
      <div className="mt-3 h-7 w-28 bg-gray-brand/20 rounded" />
      <div className="mt-2 h-3 w-16 bg-gray-brand/15 rounded" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-border p-6 animate-pulse">
      <div className="h-3 w-32 bg-gray-brand/20 rounded mb-5" />
      <div className="h-64 bg-blue-sky/80 rounded-xl" />
    </div>
  );
}
