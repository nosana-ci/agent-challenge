"use client";

import { EnhancedAnalysisResult } from "@/types/enhanced-analysis";
import { TrendingUp, TrendingDown, Pause } from "lucide-react";

interface RiskScoreCardProps {
  riskScore: EnhancedAnalysisResult["riskScore"];
}

export default function RiskScoreCard({ riskScore }: RiskScoreCardProps) {
  const getRecommendationColor = () => {
    switch (riskScore.recommendation) {
      case "buy":
        return "from-green-500 to-emerald-600";
      case "sell":
        return "from-red-500 to-rose-600";
      default:
        return "from-yellow-500 to-orange-600";
    }
  };

  const getRecommendationIcon = () => {
    switch (riskScore.recommendation) {
      case "buy":
        return <TrendingUp className="h-8 w-8" />;
      case "sell":
        return <TrendingDown className="h-8 w-8" />;
      default:
        return <Pause className="h-8 w-8" />;
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
      <h3 className="text-xl font-bold text-white my-3">Risk Assessment</h3>

      {/* Recommendation Badge */}
      <div
        className={`mb-6 p-4 rounded-xl bg-gradient-to-r ${getRecommendationColor()} text-white`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getRecommendationIcon()}</span>
            <div>
              <div className="text-sm opacity-90">Recommendation</div>
              <div className="text-2xl font-bold uppercase">
                {riskScore.recommendation}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Bars */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Buy Signal</span>
            <span className="text-green-400 font-semibold">
              {riskScore.buy}%
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${riskScore.buy}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Hold Signal</span>
            <span className="text-yellow-400 font-semibold">
              {riskScore.hold}%
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${riskScore.hold}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Sell Signal</span>
            <span className="text-red-400 font-semibold">
              {riskScore.sell}%
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-red-500 to-rose-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${riskScore.sell}%` }}
            />
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="bg-slate-700/30 rounded-xl p-4">
        <div className="text-teal-400 font-semibold mb-3 text-sm">
          Key Factors:
        </div>
        <ul className="space-y-2">
          {riskScore.reasoning.map((reason, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-slate-300 text-sm"
            >
              <span className="text-teal-400 mt-1">▸</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
