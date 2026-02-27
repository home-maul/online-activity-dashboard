export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="h-4 w-24 bg-gray-200 rounded" />
      <div className="mt-3 h-8 w-32 bg-gray-200 rounded" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
      <div className="h-64 bg-gray-100 rounded" />
    </div>
  );
}
