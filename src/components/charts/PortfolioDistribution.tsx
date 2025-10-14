"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface PortfolioData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number; // Add index signature for Recharts compatibility
}

interface PortfolioDistributionProps {
  data: PortfolioData[];
}

const renderLabel = (entry: { name: string; percent: number }) => {
  return `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`;
};

export default function PortfolioDistribution({
  data,
}: PortfolioDistributionProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur-md glass-dark card-glow hover-lift rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">📊</span>
        <h3 className="text-xl font-bold text-white">Asset Distribution</h3>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel as never}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "8px",
              color: "#fff",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      {/* Asset List */}
      <div className="mt-6 space-y-2">
        {data.map((asset, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: asset.color }}
              />
              <span className="text-slate-200 font-medium">{asset.name}</span>
            </div>
            <span className="text-white font-bold">
              ${asset.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
