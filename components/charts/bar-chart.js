"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTheme, THEME_CHART_GRADIENTS, THEME_TOOLTIP, THEME_GRID, THEME_AXIS } from "@/components/providers/theme-provider";

function CustomTooltip({ active, payload, label, theme, colors }) {
  if (!active || !payload?.length) return null;
  const t = THEME_TOOLTIP[theme] || THEME_TOOLTIP.corporate;
  return (
    <div className={`${t.bg} backdrop-blur-sm rounded-xl border ${t.border} ${t.shadow} px-4 py-3 min-w-[160px]`}>
      <p className={`text-[11px] font-medium ${t.label} mb-2`}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill?.startsWith("url") ? colors[i % colors.length] : entry.fill }} />
            <span className={`text-[12px] ${t.name}`}>{entry.name}</span>
          </div>
          <span className={`text-[12px] font-semibold ${t.value}`}>
            {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function BarChartComponent({ data, bars, xKey = "name" }) {
  const { theme } = useTheme();
  const gradients = THEME_CHART_GRADIENTS[theme] || THEME_CHART_GRADIENTS.corporate;
  const colors = gradients.strokes;
  const grid = THEME_GRID[theme] || THEME_GRID.corporate;
  const axis = THEME_AXIS[theme] || THEME_AXIS.corporate;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <defs>
          {colors.map((color, i) => (
            <linearGradient key={i} id={`bar-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.7} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="0" stroke={grid} vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 10, fill: axis }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: axis }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : v}
        />
        <Tooltip content={<CustomTooltip theme={theme} colors={colors} />} cursor={{ fill: theme === "prism" ? "rgba(108,92,231,0.06)" : "rgba(89,169,255,0.06)" }} />
        <Legend
          iconType="circle"
          iconSize={6}
          wrapperStyle={{ fontSize: "11px", color: axis, paddingTop: "12px" }}
        />
        {bars.map((bar, i) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name}
            fill={`url(#bar-grad-${i % colors.length})`}
            radius={[6, 6, 0, 0]}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
