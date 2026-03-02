"use client";

import { useTheme } from "@/components/providers/theme-provider";

const DEFAULT_COLORS = {
  corporate: ["#2B7CE9", "#59A9FF", "#070E1A", "#4A6FA5", "#93C5FD", "#1E40AF"],
  prism: ["#6C5CE7", "#0EA5E9", "#F59E0B", "#10B981", "#EC4899", "#8B5CF6"],
};

export default function ChannelBar({ data, valueKey, maxValue, label, format = "number" }) {
  const { theme } = useTheme();
  const colors = DEFAULT_COLORS[theme] || DEFAULT_COLORS.corporate;
  const max = maxValue || Math.max(...data.map((d) => d[valueKey]));

  function formatVal(v) {
    if (format === "currency") return `$${v.toLocaleString()}`;
    if (format === "percent") return `${v}%`;
    return v.toLocaleString();
  }

  return (
    <div className="space-y-3">
      {label && <p className="text-[11px] font-medium text-gray-muted uppercase tracking-wider">{label}</p>}
      {data.map((item, i) => {
        const width = max > 0 ? Math.max((item[valueKey] / max) * 100, 4) : 4;
        const color = item.color || colors[i % colors.length];
        return (
          <div key={item.channel || item.name} className="flex items-center gap-3 group">
            <span className="w-28 shrink-0 text-[12px] text-navy/70 truncate group-hover:text-navy transition-colors">{item.channel || item.name}</span>
            <div className="flex-1 bg-blue-ice rounded-lg h-7 overflow-hidden">
              <div
                className="h-full rounded-lg transition-all duration-700 ease-out relative overflow-hidden"
                style={{ width: `${width}%`, backgroundColor: color }}
              >
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                  }}
                />
              </div>
            </div>
            <span className="w-20 shrink-0 text-right text-[12px] font-semibold text-navy/80">{formatVal(item[valueKey])}</span>
          </div>
        );
      })}
    </div>
  );
}
