"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#6EB3F7", "#3D6B99", "#B0BEC5", "#8E8E93", "#D1D1D6", "#A3C4E0", "#7A9BB5"];

export default function DonutChart({ data, dataKey = "sessions", nameKey = "device" }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={68}
          outerRadius={98}
          paddingAngle={2}
          dataKey={dataKey}
          nameKey={nameKey}
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => value.toLocaleString()}
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #E5E5EA",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            fontSize: "12px",
            padding: "10px 14px",
          }}
        />
        <Legend
          iconType="circle"
          iconSize={6}
          wrapperStyle={{ fontSize: "12px", color: "#8E8E93" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
