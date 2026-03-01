"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#6EB3F7", "#3D6B99", "#B0BEC5", "#8E8E93"];

export default function LineChartComponent({ data, lines, xKey = "date" }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="0" stroke="#F0F0F2" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: "#8E8E93" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => {
            const parts = v.split("-");
            return parts.length === 3 ? `${parts[1]}/${parts[2]}` : v;
          }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#8E8E93" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #E5E5EA",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            fontSize: "12px",
            padding: "10px 14px",
          }}
        />
        <Legend iconSize={7} iconType="circle" wrapperStyle={{ fontSize: "12px", color: "#8E8E93" }} />
        {lines.map((line, i) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: COLORS[i % COLORS.length] }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
