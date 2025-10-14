"use client";

import { MarketData } from "@/types/dashboard";

interface MarketStatsCardProps {
  data: MarketData;
}

export default function MarketStatsCard({ data }: MarketStatsCardProps) {
  const isPositive = data.change24h > 0;

  return (
    <div className="glass-dark card-glow hover-lift rounded-xl p-6 group relative overflow-hidden">
      <div className="shimmer absolute inset-0" />

      <h3 className="text-slate-400 text-sm mb-3 font-medium relative z-10">
        {data.name}
      </h3>

      <div className="text-3xl font-bold text-white mb-2 group-hover:neon-glow-sm transition-all count-up relative z-10">
        ${data.price.toFixed(2)}
      </div>

      <div
        className={`flex items-center gap-2 mb-3 text-lg font-semibold relative z-10 ${
          isPositive ? "text-[#10E80C]" : "text-red-400"
        }`}
      >
        <span className="text-xl">{isPositive ? "↗" : "↘"}</span>
        <span>
          {isPositive ? "+" : ""}
          {data.change24h.toFixed(2)}%
        </span>
      </div>

      <div className="text-slate-400 text-sm relative z-10">
        24h Vol: {data.volume24h}
      </div>

      {data.marketCap && (
        <div className="text-slate-500 text-xs mt-1 relative z-10">
          MCap: {data.marketCap}
        </div>
      )}
    </div>
  );
}
