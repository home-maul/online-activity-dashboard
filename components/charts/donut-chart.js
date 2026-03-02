"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } from "recharts";
import { useTheme, THEME_CHART_COLORS, THEME_TOOLTIP, THEME_AXIS, THEME_CENTER_LABEL } from "@/components/providers/theme-provider";

function CustomTooltip({ active, payload, theme }) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const t = THEME_TOOLTIP[theme] || THEME_TOOLTIP.corporate;
  return (
    <div className={`${t.bg} backdrop-blur-sm rounded-xl border ${t.border} ${t.shadow} px-4 py-3 min-w-[140px]`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.payload?.fill }} />
        <span className={`text-[12px] font-medium ${t.value}`}>{entry.name}</span>
      </div>
      <p className={`text-[18px] font-semibold ${t.value} pl-[18px]`}>
        {entry.value.toLocaleString()}
      </p>
    </div>
  );
}

function renderCenterLabel({ viewBox, total, centerColor, axisColor }) {
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" fill={centerColor} style={{ fontSize: "22px", fontWeight: 700 }}>
        {total >= 1000 ? `${(total / 1000).toFixed(1)}k` : total.toLocaleString()}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={axisColor} style={{ fontSize: "10px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Total
      </text>
    </g>
  );
}

function CustomLegend({ data, nameKey, colors, axisColor }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 pt-3">
      {data.map((item, i) => (
        <div key={item[nameKey]} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
          <span className="text-[11px]" style={{ color: axisColor }}>{item[nameKey]}</span>
        </div>
      ))}
    </div>
  );
}

export default function DonutChart({ data, dataKey = "sessions", nameKey = "device" }) {
  const { theme } = useTheme();
  const colors = THEME_CHART_COLORS[theme] || THEME_CHART_COLORS.corporate;
  const axisColor = THEME_AXIS[theme] || THEME_AXIS.corporate;
  const centerColor = THEME_CENTER_LABEL[theme] || THEME_CENTER_LABEL.corporate;
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
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
            <Label content={(props) => renderCenterLabel({ ...props, total, centerColor, axisColor })} position="center" />
          </Pie>
          <Tooltip content={<CustomTooltip theme={theme} />} />
        </PieChart>
      </ResponsiveContainer>
      <CustomLegend data={data} nameKey={nameKey} colors={colors} axisColor={axisColor} />
    </div>
  );
}
