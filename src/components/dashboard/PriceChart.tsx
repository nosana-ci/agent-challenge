"use client";

import { ChartDataPoint } from "@/types/dashboard";
import { FaChartLine } from "react-icons/fa6";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PriceChartProps {
  data: ChartDataPoint[];
  title?: string;
  timeframe?: "1D" | "7D" | "30D";
  onTimeframeChange?: (timeframe: "1D" | "7D" | "30D") => void;
}

export default function PriceChart({
  data,
  title = "Price Chart",
  timeframe = "7D",
  onTimeframeChange,
}: PriceChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const currentPrice = data[data.length - 1]?.value || 0;
  const priceChange =
    ((currentPrice - data[0]?.value) / data[0]?.value) * 100 || 0;
  const isPositive = priceChange >= 0;

  const timeframes: Array<"1D" | "7D" | "30D"> = ["1D", "7D", "30D"];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: unknown) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-[#10E80C]/50 rounded-lg p-3 shadow-xl">
          <p className="text-slate-400 text-xs mb-1">
            {payload[0].payload.day}
          </p>
          <p className="text-white font-bold text-lg">
            ${payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-dark card-glow hover-lift rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="shimmer absolute inset-0" />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl">
            <FaChartLine />
          </span>
          <h2 className="text-xl font-bold text-white gradient-text">
            {title}
          </h2>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2 glass p-1 rounded-lg">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange?.(tf)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                timeframe === tf
                  ? "bg-gradient-to-r from-[#10E80C] to-[#0CAF09] text-black shadow-lg neon-border font-bold"
                  : "text-slate-400 hover:text-[#10E80C] hover:bg-[#10E80C]/10"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-80 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10E80C" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10E80C" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              opacity={0.3}
            />
            <XAxis
              dataKey="day"
              stroke="#94a3b8"
              style={{ fontSize: "12px" }}
              tickLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              style={{ fontSize: "12px" }}
              tickLine={false}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#10E80C"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorValue)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Price Info */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-xs mb-1">Current Price</div>
          <div className="text-white text-2xl font-bold">
            ${currentPrice.toFixed(2)}
          </div>
          <div
            className={`text-sm font-semibold mt-1 ${
              isPositive ? "text-green-400" : "text-red-400"
            }`}
          >
            {isPositive ? "↗" : "↘"} {Math.abs(priceChange).toFixed(2)}%
          </div>
        </div>
        <div className="bg-slate-700/30 rounded-xl p-4">
          <div className="text-slate-400 text-xs mb-1">High / Low</div>
          <div className="text-white text-sm font-medium">
            ${maxValue.toFixed(2)} / ${minValue.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-slate-400 text-xs mb-1">Change</div>
          <div
            className={`text-sm font-bold ${
              data[data.length - 1]?.value > data[0]?.value
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {(
              ((data[data.length - 1]?.value - data[0]?.value) /
                data[0]?.value) *
              100
            ).toFixed(2)}
            %
          </div>
        </div>
      </div>
    </div>
  );
}
