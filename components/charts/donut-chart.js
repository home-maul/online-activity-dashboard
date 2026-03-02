"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } from "recharts";

const COLORS = [
  "#2B7CE9",
  "#59A9FF",
  "#070E1A",
  "#4A6FA5",
  "#93C5FD",
  "#1E40AF",
  "#000055",
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-[#D8E1EB] shadow-[0_8px_32px_rgba(7,14,26,0.12)] px-4 py-3 min-w-[140px]">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.payload?.fill }} />
        <span className="text-[12px] font-medium text-[#070E1A]">{entry.name}</span>
      </div>
      <p className="text-[18px] font-semibold text-[#070E1A] pl-[18px]">
        {entry.value.toLocaleString()}
      </p>
    </div>
  );
}

function renderCenterLabel({ viewBox, total }) {
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#070E1A" style={{ fontSize: "22px", fontWeight: 700 }}>
        {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toLocaleString()}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="#8896A8" style={{ fontSize: "10px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Total
      </text>
    </g>
  );
}

function CustomLegend({ data, nameKey, colors }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 pt-3">
      {data.map((item, i) => (
        <div key={item[nameKey]} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
          <span className="text-[11px] text-[#8896A8]">{item[nameKey]}</span>
        </div>
      ))}
    </div>
  );
}

export default function DonutChart({ data, dataKey = "sessions", nameKey = "device" }) {
  const total = data.reduce((sum, d) => sum + (d[dataKey] || 0), 0);

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={72}
            outerRadius={105}
            paddingAngle={3}
            dataKey={dataKey}
            nameKey={nameKey}
            strokeWidth={0}
            cornerRadius={4}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
            <Label content={(props) => renderCenterLabel({ ...props, total })} position="center" />
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <CustomLegend data={data} nameKey={nameKey} colors={COLORS} />
    </div>
  );
}
