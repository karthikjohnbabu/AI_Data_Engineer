"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { ResolutionBreakdown } from "@/types";

interface ResolutionChartProps {
  data: ResolutionBreakdown;
}

export function ResolutionChart({ data }: ResolutionChartProps) {
  const chartData = [
    { name: "Success", value: data.success, color: "#10b981" },
    { name: "In Progress", value: data.inProgress, color: "#f59e0b" },
    { name: "Failed", value: data.failed, color: "#ef4444" },
  ];

  return (
    <div className="flex items-center gap-8">
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#e2e8f0",
            }}
            formatter={(value) => [`${value}%`, ""]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-3">
        <p className="text-3xl font-bold text-white">{data.success}%</p>
        <p className="text-sm text-slate-400">Success Rate</p>
        <div className="space-y-2">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-400">{item.name}</span>
              <span className="font-medium text-slate-200">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
