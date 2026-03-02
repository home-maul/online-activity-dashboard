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

const PALETTE = [
  { stroke: "#2B7CE9", fill: "url(#grad-0)" },
  { stroke: "#59A9FF", fill: "url(#grad-1)" },
  { stroke: "#070E1A", fill: "url(#grad-2)" },
  { stroke: "#4A6FA5", fill: "url(#grad-3)" },
];

const GRADIENT_STOPS = [
  "#2B7CE9",
  "#59A9FF",
  "#070E1A",
  "#4A6FA5",
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-[#D8E1EB] shadow-[0_8px_32px_rgba(7,14,26,0.12)] px-4 py-3 min-w-[160px]">
      <p className="text-[11px] font-medium text-[#8896A8] mb-2">
        {label?.includes("-") ? new Date(label + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : label}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke || entry.color }} />
            <span className="text-[12px] text-[#070E1A]/70">{entry.name}</span>
          </div>
          <span className="text-[12px] font-semibold text-[#070E1A]">
            {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function LineChartComponent({ data, lines, xKey = "date" }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <defs>
          {GRADIENT_STOPS.map((color, i) => (
            <linearGradient key={i} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={i === 0 ? 0.2 : 0.12} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="0" stroke="#E8F1FF" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 10, fill: "#8896A8" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => {
            const parts = v.split("-");
            return parts.length === 3 ? `${parts[1]}/${parts[2]}` : v;
          }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#8896A8" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : v}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#59A9FF", strokeWidth: 1, strokeDasharray: "4 4" }} />
        <Legend
          iconType="circle"
          iconSize={6}
          wrapperStyle={{ fontSize: "11px", color: "#8896A8", paddingTop: "12px" }}
        />
        {lines.map((line, i) => (
          <Area
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={PALETTE[i % PALETTE.length].stroke}
            fill={PALETTE[i % PALETTE.length].fill}
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 5,
              strokeWidth: 2.5,
              stroke: "#fff",
              fill: PALETTE[i % PALETTE.length].stroke,
              style: { filter: "drop-shadow(0 2px 4px rgba(43,124,233,0.3))" },
            }}
            animationDuration={1200}
            animationEasing="ease-out"
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
