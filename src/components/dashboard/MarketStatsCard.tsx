"use client";

import { MarketData } from "@/types/dashboard";

interface MarketStatsCardProps {
  data: MarketData;
}

export default function MarketStatsCard({ data }: MarketStatsCardProps) {
  const isPositive = data.change24h > 0;

  return (
    <div
      className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 
                  hover:border-teal-500/30 transition-all group hover:shadow-xl hover:shadow-teal-500/10"
    >
      <h3 className="text-slate-400 text-sm mb-3 font-medium">{data.name}</h3>

      <div className="text-3xl font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">
        ${data.price.toFixed(2)}
      </div>

      <div
        className={`flex items-center gap-2 mb-3 text-lg font-semibold ${
          isPositive ? "text-green-400" : "text-red-400"
        }`}
      >
        <span className="text-xl">{isPositive ? "↗" : "↘"}</span>
        <span>
          {isPositive ? "+" : ""}
          {data.change24h.toFixed(2)}%
        </span>
      </div>

      <div className="text-slate-400 text-sm">24h Vol: {data.volume24h}</div>

      {data.marketCap && (
        <div className="text-slate-500 text-xs mt-1">
          MCap: {data.marketCap}
        </div>
      )}
    </div>
  );
}
