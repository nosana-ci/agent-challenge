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
    <div className="glass-dark card-glow hover-lift rounded-xl p-6 relative overflow-hidden">
      <div className="shimmer absolute inset-0" />

      <h3 className="text-slate-400 text-sm mb-4 font-medium relative z-10">
        Sentiment
      </h3>

      <div className="flex items-center gap-3 mb-3 relative z-10">
        <span className="text-4xl float">{sentiment.icon}</span>
        <div>
          <div className="text-white font-bold text-xl count-up">
            {sentiment.label}
          </div>
          <div className="text-slate-400 text-sm">
            Score: {sentiment.score.toFixed(2)}
          </div>
        </div>
      </div>

      <div
        className={`flex items-center gap-2 ${getTrendColor()} font-semibold relative z-10`}
      >
        <span>Trend:</span>
        <span className="text-lg">{getTrendIcon()}</span>
      </div>

      {/* Sentiment Bar */}
      <div className="mt-4 glass rounded-full h-3 overflow-hidden relative z-10">
        <div
          className="bg-gradient-to-r from-[#10E80C] to-[#0abf08] h-full transition-all duration-500 neon-border"
          style={{ width: `${sentiment.score * 100}%` }}
        />
      </div>
    </div>
  );
}
