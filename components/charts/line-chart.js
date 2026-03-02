"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTheme, THEME_CHART_GRADIENTS, THEME_TOOLTIP, THEME_GRID, THEME_AXIS } from "@/components/providers/theme-provider";

function CustomTooltip({ active, payload, label, theme }) {
  if (!active || !payload?.length) return null;
  const t = THEME_TOOLTIP[theme] || THEME_TOOLTIP.corporate;
  return (
    <div className={`${t.bg} backdrop-blur-sm rounded-xl border ${t.border} ${t.shadow} px-4 py-3 min-w-[160px]`}>
      <p className={`text-[11px] font-medium ${t.label} mb-2`}>
        {label?.includes("-") ? new Date(label + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke || entry.color }} />
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

export default function LineChartComponent({ data, lines, xKey = "date" }) {
  const { theme } = useTheme();
  const gradients = THEME_CHART_GRADIENTS[theme] || THEME_CHART_GRADIENTS.corporate;
  const grid = THEME_GRID[theme] || THEME_GRID.corporate;
  const axis = THEME_AXIS[theme] || THEME_AXIS.corporate;

  const palette = gradients.strokes.map((stroke, i) => ({
    stroke,
    fill: `url(#grad-${i})`,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <defs>
          {gradients.fills.map((color, i) => (
            <linearGradient key={i} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={i === 0 ? 0.2 : 0.12} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="0" stroke={grid} vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 10, fill: axis }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => {
            const parts = v.split("-");
            return parts.length === 3 ? `${parts[1]}/${parts[2]}` : v;
          }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: axis }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : v}
        />
        <Tooltip content={<CustomTooltip theme={theme} />} cursor={{ stroke: gradients.strokes[0], strokeWidth: 1, strokeDasharray: "4 4" }} />
        <Legend
          iconType="circle"
          iconSize={6}
          wrapperStyle={{ fontSize: "11px", color: axis, paddingTop: "12px" }}
        />
        {lines.map((line, i) => (
          <Area
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={palette[i % palette.length].stroke}
            fill={palette[i % palette.length].fill}
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 5,
              strokeWidth: 2.5,
              stroke: "#fff",
              fill: palette[i % palette.length].stroke,
              style: { filter: `drop-shadow(0 2px 4px ${theme === "prism" ? "rgba(108,92,231,0.3)" : "rgba(43,124,233,0.3)"})` },
            }}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
