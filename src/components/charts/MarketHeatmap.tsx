"use client";

interface HeatmapCell {
  asset: string;
  change: number;
  volume: string;
}

interface MarketHeatmapProps {
  data: HeatmapCell[];
}

export default function MarketHeatmap({ data }: MarketHeatmapProps) {
  const getColorClass = (change: number) => {
    if (change >= 10) return "bg-green-600";
    if (change >= 5) return "bg-green-500";
    if (change >= 0) return "bg-green-400";
    if (change >= -5) return "bg-red-400";
    if (change >= -10) return "bg-red-500";
    return "bg-red-600";
  };

  const getTextColor = (change: number) => {
    return Math.abs(change) > 3 ? "text-white" : "text-slate-900";
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🔥</span>
        <h3 className="text-xl font-bold text-white">Market Heatmap</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {data.map((cell, index) => (
          <div
            key={index}
            className={`${getColorClass(cell.change)} ${getTextColor(cell.change)} p-4 rounded-xl transition-all hover:scale-105 cursor-pointer shadow-lg`}
          >
            <div className="font-bold text-lg mb-1">{cell.asset}</div>
            <div className="text-2xl font-extrabold mb-1">
              {cell.change > 0 ? "+" : ""}
              {cell.change.toFixed(1)}%
            </div>
            <div className="text-xs opacity-80">Vol: {cell.volume}</div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded" />
          <span className="text-slate-300">Strong Gain (+10%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-400 rounded" />
          <span className="text-slate-300">Moderate Gain (0-5%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-400 rounded" />
          <span className="text-slate-300">Moderate Loss (0-5%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-600 rounded" />
          <span className="text-slate-300">Strong Loss (-10%)</span>
        </div>
      </div>
    </div>
  );
}
