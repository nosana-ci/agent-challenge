"use client";

import { useState } from "react";
import { MessageSquare, Bot, HelpCircle } from "lucide-react";

interface SmartExplanation {
  concept: string;
  explanation: string;
  example?: string;
}

export default function SmartExplanations() {
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null);

  const explanations: SmartExplanation[] = [
    {
      concept: "RSI (Relative Strength Index)",
      explanation:
        "RSI measures the speed and magnitude of price changes on a scale of 0-100. Values above 70 indicate the asset may be overbought (potentially overvalued), while values below 30 suggest it may be oversold (potentially undervalued).",
      example:
        "NOS currently has an RSI of 68.5, approaching the overbought threshold. This suggests strong buying pressure but also a potential for short-term correction.",
    },
    {
      concept: "MACD (Moving Average Convergence Divergence)",
      explanation:
        "MACD shows the relationship between two moving averages of an asset's price. When the MACD line crosses above the signal line, it's a bullish signal. When it crosses below, it's bearish.",
      example:
        "NOS's MACD is currently at 0.042 with a positive histogram, indicating upward momentum is strengthening.",
    },
    {
      concept: "Bollinger Bands",
      explanation:
        "Bollinger Bands consist of three lines: a middle band (simple moving average) and two outer bands representing standard deviations. Prices touching the upper band may indicate overbought conditions, while touching the lower band suggests oversold conditions.",
      example:
        "NOS is trading near the middle Bollinger Band ($2.45), suggesting balanced buying and selling pressure with room to move in either direction.",
    },
    {
      concept: "Golden Cross",
      explanation:
        "A Golden Cross occurs when a short-term moving average (like the 20-day) crosses above a long-term moving average (like the 50-day). This is considered a strong bullish signal, suggesting the start of a sustained uptrend.",
      example:
        "NOS's 20-day SMA recently crossed above the 50-day SMA, forming a Golden Cross pattern. Historically, this pattern has led to significant price appreciation.",
    },
    {
      concept: "Correlation Analysis",
      explanation:
        "Correlation measures how two assets move in relation to each other, ranging from -1 (move in opposite directions) to +1 (move together). Understanding correlations helps diversify your portfolio to reduce risk.",
      example:
        "NOS has a correlation of 0.65 with BTC, meaning they tend to move in the same direction but not perfectly. This provides some diversification benefit.",
    },
    {
      concept: "Network Utilization",
      explanation:
        "For blockchain networks like Nosana, utilization rate shows what percentage of available resources (GPU nodes) are actively being used. Higher utilization typically indicates strong demand for the network's services.",
      example:
        "Nosana's current utilization rate of 67% is healthy - high enough to show strong demand, but with capacity for growth.",
    },
  ];

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <Bot className="h-6 w-6 text-cyan-400" />
        <h3 className="text-xl font-bold text-white">Smart Explanations</h3>
        <HelpCircle className="h-4 w-4 text-slate-400" />
      </div>

      <p className="text-slate-300 mb-6">
        Click on any concept below to learn what it means and how to interpret
        it for better investment decisions.
      </p>

      {/* Concept Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {explanations.map((item, idx) => (
          <button
            key={idx}
            onClick={() =>
              setSelectedConcept(
                selectedConcept === item.concept ? null : item.concept
              )
            }
            className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-105 ${
              selectedConcept === item.concept
                ? "bg-cyan-900/30 border-cyan-500"
                : "bg-slate-700/30 border-slate-600/30 hover:border-slate-500"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-cyan-400" />
              <h4 className="font-semibold text-white text-sm">
                {item.concept}
              </h4>
            </div>
            <p className="text-slate-400 text-xs">Click to learn more</p>
          </button>
        ))}
      </div>

      {/* Expanded Explanation */}
      {selectedConcept && (
        <div className="mt-6 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-700/30 rounded-xl p-6 animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Bot className="h-6 w-6 text-cyan-400" />
            </div>
            <h4 className="text-lg font-bold text-white">{selectedConcept}</h4>
          </div>

          {explanations
            .filter((item) => item.concept === selectedConcept)
            .map((item, idx) => (
              <div key={idx}>
                <div className="mb-4">
                  <div className="text-sm text-cyan-400 font-semibold mb-2">
                    📖 What it means:
                  </div>
                  <p className="text-slate-200 leading-relaxed">
                    {item.explanation}
                  </p>
                </div>

                {item.example && (
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-cyan-700/20">
                    <div className="text-sm text-cyan-400 font-semibold mb-2">
                      💡 Example with NOS:
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {item.example}
                    </p>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Help Footer */}
      <div className="mt-6 p-4 bg-slate-700/30 rounded-lg flex items-start gap-3">
        <HelpCircle className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="text-slate-400 text-sm">
          <strong className="text-slate-300">Pro Tip:</strong> Understanding
          these concepts will help you make more informed trading decisions. Use
          them together for comprehensive market analysis, not in isolation.
        </p>
      </div>
    </div>
  );
}
