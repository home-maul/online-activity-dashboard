"use client";

export default function ChannelBar({ data, valueKey, maxValue, label, format = "number" }) {
  const max = maxValue || Math.max(...data.map((d) => d[valueKey]));

  function formatVal(v) {
    if (format === "currency") return `$${v.toLocaleString()}`;
    if (format === "percent") return `${v}%`;
    return v.toLocaleString();
  }

  return (
    <div className="space-y-3">
      {label && <p className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">{label}</p>}
      {data.map((item) => {
        const width = max > 0 ? Math.max((item[valueKey] / max) * 100, 3) : 3;
        return (
          <div key={item.channel || item.name} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-[12px] text-navy/70 truncate">{item.channel || item.name}</span>
            <div className="flex-1 bg-blue-sky rounded-md h-6 overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-500"
                style={{ width: `${width}%`, backgroundColor: item.color || "#C6D2DF" }}
              />
            </div>
            <span className="w-20 shrink-0 text-right text-[12px] font-medium text-navy/80">{formatVal(item[valueKey])}</span>
          </div>
        );
      })}
    </div>
  );
}
