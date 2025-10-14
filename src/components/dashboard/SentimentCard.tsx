"use client";

import { SentimentData } from "@/types/dashboard";

interface SentimentCardProps {
  sentiment: SentimentData;
}

export default function SentimentCard({ sentiment }: SentimentCardProps) {
  const getTrendColor = () => {
    switch (sentiment.trend) {
      case "up":
        return "text-green-400";
      case "down":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  const getTrendIcon = () => {
    switch (sentiment.trend) {
      case "up":
        return "↗";
      case "down":
        return "↘";
      default:
        return "→";
    }
  };

  return (
    <div
      className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl p-6
                  hover:border-purple-500/30 transition-all hover:shadow-xl hover:shadow-purple-500/10"
    >
      <h3 className="text-slate-400 text-sm mb-4 font-medium">Sentiment</h3>

      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl">{sentiment.icon}</span>
        <div>
          <div className="text-white font-bold text-xl">{sentiment.label}</div>
          <div className="text-slate-400 text-sm">
            Score: {sentiment.score.toFixed(2)}
          </div>
        </div>
      </div>

      <div
        className={`flex items-center gap-2 ${getTrendColor()} font-semibold`}
      >
        <span>Trend:</span>
        <span className="text-lg">{getTrendIcon()}</span>
      </div>

      {/* Sentiment Bar */}
      <div className="mt-4 bg-slate-700/50 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-teal-500 to-cyan-500 h-full transition-all duration-500"
          style={{ width: `${sentiment.score * 100}%` }}
        />
      </div>
    </div>
  );
}
