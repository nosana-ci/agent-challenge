"use client";

import { NetworkStats } from "@/types/dashboard";

interface NetworkStatsCardProps {
  stats: NetworkStats;
}

export default function NetworkStatsCard({ stats }: NetworkStatsCardProps) {
  return (
    <div
      className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl p-6
                  hover:border-cyan-500/30 transition-all hover:shadow-xl hover:shadow-cyan-500/10"
    >
      <h3 className="text-slate-400 text-sm mb-4 font-medium">Network Stats</h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
          <span className="text-slate-300 text-sm">Active Nodes</span>
          <span className="text-white font-bold text-lg">
            {stats.activeNodes}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
          <span className="text-slate-300 text-sm">Jobs/Day</span>
          <span className="text-white font-bold text-lg">
            {stats.jobsPerDay}
          </span>
        </div>

        {stats.utilizationRate !== undefined && (
          <div className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
            <span className="text-slate-300 text-sm">Utilization</span>
            <span className="text-cyan-400 font-bold text-lg">
              {stats.utilizationRate}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
