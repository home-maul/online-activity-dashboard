"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = ["#59A9FF", "#000055", "#3D7BD9", "#C6D2DF", "#8896A8", "#A8D4FF", "#0f1a2e"];

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
            border: "1px solid #D8E1EB",
            boxShadow: "0 4px 20px rgba(7,14,26,0.06)",
            fontSize: "12px",
            padding: "10px 14px",
          }}
        />
        <Legend
          iconType="circle"
          iconSize={6}
          wrapperStyle={{ fontSize: "12px", color: "#8896A8" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
