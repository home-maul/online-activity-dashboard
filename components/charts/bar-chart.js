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

const COLORS = ["#6EB3F7", "#3D6B99", "#B0BEC5", "#8E8E93"];

export default function BarChartComponent({ data, bars, xKey = "name" }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="0" stroke="#F0F0F2" vertical={false} />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: "#8E8E93" }}
          tickLine={false}
          axisLine={false}
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
