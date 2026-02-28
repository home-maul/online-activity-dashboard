"use client";

export default function MetricCard({ title, value, format = "number", change, invertChange = false }) {
  const formatted = formatValue(value, format);
  const hasChange = change != null && change !== undefined;

  // For bounce rate, a decrease is good (so invert the color logic)
  const isPositive = invertChange ? change < 0 : change > 0;
  const isNeutral = change === 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{formatted}</p>
      {hasChange && (
        <div className="mt-2 flex items-center gap-1">
          {!isNeutral && (
            <svg
              className={`w-4 h-4 ${isPositive ? "text-emerald-500" : "text-red-500"}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d={change > 0 ? "M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" : "M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25"}
              />
            </svg>
          )}
          <span className={`text-sm font-medium ${isNeutral ? "text-gray-400" : isPositive ? "text-emerald-500" : "text-red-500"}`}>
            {change > 0 ? "+" : ""}{change}%
          </span>
          <span className="text-xs text-gray-400 ml-1">vs prev period</span>
        </div>
      )}
    </div>
  );
}

function formatValue(value, format) {
  if (value == null) return "\u2014";
  switch (format) {
    case "currency":
      return `$${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case "percent":
      return `${value}%`;
    case "duration": {
      const mins = Math.floor(value / 60);
      const secs = Math.round(value % 60);
      return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }
    case "number":
    default:
      return Number(value).toLocaleString("en-US");
  }
}
