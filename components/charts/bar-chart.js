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

const COLORS = ["#59A9FF", "#000055", "#3D7BD9", "#C6D2DF"];

export default function BarChartComponent({ data, bars, xKey = "name" }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="0" stroke="#E8EEF5" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: "#8896A8" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#8896A8" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #D8E1EB",
            boxShadow: "0 4px 20px rgba(7,14,26,0.06)",
            fontSize: "12px",
            padding: "10px 14px",
          }}
        />
        <Legend iconSize={7} iconType="circle" wrapperStyle={{ fontSize: "12px", color: "#8896A8" }} />
        {bars.map((bar, i) => (
          <Bar
            key={bar.dataKey}
            dataKey={bar.dataKey}
            name={bar.name}
            fill={COLORS[i % COLORS.length]}
            radius={[6, 6, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
