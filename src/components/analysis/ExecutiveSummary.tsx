"use client";

import { EnhancedAnalysisResult } from "@/types/enhanced-analysis";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ExecutiveSummaryProps {
  analysis: EnhancedAnalysisResult;
}

export default function ExecutiveSummary({ analysis }: ExecutiveSummaryProps) {
  const getSentimentColor = () => {
    switch (analysis.executiveSummary.overallSentiment) {
      case "bullish":
        return "from-green-500 to-emerald-600";
      case "bearish":
        return "from-red-500 to-rose-600";
      default:
        return "from-slate-500 to-slate-600";
    }
  };

  const getSentimentIcon = () => {
    switch (analysis.executiveSummary.overallSentiment) {
      case "bullish":
        return <TrendingUp className="h-5 w-5" />;
      case "bearish":
        return <TrendingDown className="h-5 w-5" />;
      default:
        return <Minus className="h-5 w-5" />;
    }
  };

  return (
    <div className="glass-dark card-glow hover-lift rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="shimmer absolute inset-0" />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="text-xl font-bold text-white gradient-text">
          Executive Summary
        </h3>

        {/* Sentiment Badge */}
        <div
          className={`px-4 py-2 rounded-full bg-gradient-to-r ${getSentimentColor()} text-white font-semibold flex items-center gap-2 neon-border`}
        >
          <span>{getSentimentIcon()}</span>
          <span className="capitalize">
            {analysis.executiveSummary.overallSentiment}
          </span>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="mb-6 relative z-10">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-400">Confidence Level</span>
          <span className="text-white font-semibold count-up">
            {Math.round(analysis.executiveSummary.confidence * 100)}%
          </span>
        </div>
        <div className="w-full glass rounded-full h-3">
          <div
            className="bg-gradient-to-r from-[#10E80C] to-[#0abf08] h-3 rounded-full transition-all duration-500 neon-border"
            style={{ width: `${analysis.executiveSummary.confidence * 100}%` }}
          />
        </div>
      </div>

      {/* Key Points */}
      <div className="space-y-3 relative z-10">
        {analysis.executiveSummary.bullets.map((bullet, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 glass rounded-lg hover:bg-[#10E80C]/10 transition-all hover-lift"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#10E80C] to-[#0CAF09] flex items-center justify-center flex-shrink-0 mt-0.5 neon-border">
              <span className="text-black text-xs font-bold">{index + 1}</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{bullet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
