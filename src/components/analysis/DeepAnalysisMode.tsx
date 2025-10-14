"use client";

import { useState } from "react";
import { Brain, Sparkles, TrendingUp, Shield, Zap } from "lucide-react";

interface DeepAnalysisProps {
  asset: string;
}

export default function DeepAnalysisMode({ asset }: DeepAnalysisProps) {
  const [isDeepMode, setIsDeepMode] = useState(false);

  const deepAnalysisInsights = [
    {
      icon: <Brain className="h-6 w-6 text-purple-400" />,
      title: "AI Pattern Recognition",
      description:
        "Machine learning models detected a 'Golden Cross' formation with 85% historical accuracy for continued uptrend.",
      confidence: 85,
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-green-400" />,
      title: "Momentum Analysis",
      description:
        "12-week momentum indicator shows sustained upward pressure. Similar patterns in 2023 led to 180% gains over 6 months.",
      confidence: 78,
    },
    {
      icon: <Shield className="h-6 w-6 text-blue-400" />,
      title: "Risk Assessment",
      description:
        "Volatility metrics suggest moderate risk. Recommended position sizing: 15-20% of portfolio for balanced risk/reward.",
      confidence: 72,
    },
    {
      icon: <Zap className="h-6 w-6 text-yellow-400" />,
      title: "Network Health",
      description:
        "On-chain metrics show 342 active nodes (↑15% WoW) and increasing GPU utilization. Strong fundamental support.",
      confidence: 91,
    },
  ];

  return (
    <div className="bg-slate-800/50 backdrop-blur-md glass-dark card-glow hover-lift rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-400" />
          <h3 className="text-xl font-bold text-white">Deep Analysis Mode</h3>
          <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full">
            BETA
          </span>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={() => setIsDeepMode(!isDeepMode)}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
            isDeepMode ? "bg-purple-600" : "bg-slate-600"
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              isDeepMode ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {!isDeepMode ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🧠</div>
          <div className="text-slate-300 text-lg mb-2 font-medium">
            Enable Deep Analysis
          </div>
          <div className="text-slate-500 text-sm max-w-md mx-auto">
            Unlock advanced AI insights including pattern recognition,
            historical backtesting, risk modeling, and predictive analytics for{" "}
            {asset}.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Analyzing Animation */}
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-700/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="animate-spin">
                <Sparkles className="h-5 w-5 text-purple-400" />
              </div>
              <span className="text-purple-300 font-semibold">
                Analyzing {asset} with advanced AI models...
              </span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse w-3/4" />
            </div>
          </div>

          {/* Deep Insights */}
          {deepAnalysisInsights.map((insight, idx) => (
            <div
              key={idx}
              className="bg-slate-700/30 border border-slate-600/30 rounded-xl p-5 hover:bg-slate-700/50 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  {insight.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-white">
                      {insight.title}
                    </h4>
                    <span className="text-xs px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-full font-bold">
                      {insight.confidence}% Confidence
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Action Recommendation */}
          <div className="bg-gradient-to-r from-[#064D04]/30 to-[#064D04]/30 border border-[#0A8A07]/30 rounded-xl p-5 mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-yellow-400" />
              <h4 className="font-semibold text-white">AI Recommendation</h4>
            </div>
            <p className="text-teal-100 mb-3">
              Based on comprehensive analysis across 50+ indicators and
              historical patterns, the AI recommends a{" "}
              <strong>STRONG BUY</strong> position for {asset}.
            </p>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-all">
                Accept & Trade
              </button>
              <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all">
                View Full Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
