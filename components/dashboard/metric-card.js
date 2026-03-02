"use client";

export default function MetricCard({ title, value, format = "number", change, invertChange = false, subtitle }) {
  const formatted = formatValue(value, format);
  const hasChange = change != null && change !== undefined;

  const isPositive = invertChange ? change < 0 : change > 0;
  const isNeutral = change === 0;

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 hover:shadow-[0_4px_24px_rgba(43,124,233,0.08)] hover:border-blue/20 transition-all duration-300 group">
      <p className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">{title}</p>
      <p className="mt-2 text-[26px] font-semibold tracking-tight text-navy group-hover:text-blue-mid transition-colors duration-300">{formatted}</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        {hasChange && (
          <>
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md ${
                isNeutral
                  ? "text-gray-muted bg-blue-sky"
                  : isPositive
                  ? "text-emerald-600 bg-emerald-50"
                  : "text-rose-500 bg-rose-50"
              }`}
            >
              {!isNeutral && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={change > 0 ? "M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" : "M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25"}
                  />
                </svg>
              )}
              {change > 0 ? "+" : ""}{change}%
            </span>
            <span className="text-[10px] text-gray-brand">vs prev</span>
          </>
        )}
        {!hasChange && subtitle && <span className="text-[10px] text-gray-brand">{subtitle}</span>}
      </div>
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
    case "decimal":
      return Number(value).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    case "number":
    default:
      return Number(value).toLocaleString("en-US");
  }
}
