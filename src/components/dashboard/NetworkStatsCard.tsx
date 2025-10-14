"use client";

import { NetworkStats } from "@/types/dashboard";

interface NetworkStatsCardProps {
  stats: NetworkStats;
}

export default function NetworkStatsCard({ stats }: NetworkStatsCardProps) {
  return (
    <div className="glass-dark card-glow hover-lift rounded-xl p-6 relative overflow-hidden">
      <div className="shimmer absolute inset-0" />

      <h3 className="text-slate-400 text-sm mb-4 font-medium relative z-10">
        Network Stats
      </h3>

      <div className="space-y-3 relative z-10">
        <div className="flex justify-between items-center p-3 glass rounded-lg hover:bg-[#10E80C]/10 transition-all">
          <span className="text-slate-300 text-sm">Active Nodes</span>
          <span className="text-white font-bold text-lg count-up">
            {stats.activeNodes}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 glass rounded-lg hover:bg-[#10E80C]/10 transition-all">
          <span className="text-slate-300 text-sm">Jobs/Day</span>
          <span className="text-white font-bold text-lg count-up">
            {stats.jobsPerDay}
          </span>
        </div>

        {stats.utilizationRate !== undefined && (
          <div className="flex justify-between items-center p-3 glass rounded-lg hover:bg-[#10E80C]/10 transition-all">
            <span className="text-slate-300 text-sm">Utilization</span>
            <span className="text-[#10E80C] font-bold text-lg neon-glow-sm count-up">
              {stats.utilizationRate}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
