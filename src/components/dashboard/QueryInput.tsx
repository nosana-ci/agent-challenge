"use client";

import { useState } from "react";

interface QueryInputProps {
  onAnalyze: (query: string) => void;
  isAnalyzing?: boolean;
}

export default function QueryInput({
  onAnalyze,
  isAnalyzing = false,
}: QueryInputProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = () => {
    if (query.trim() && !isAnalyzing) {
      onAnalyze(query);
    }
  };

  const quickActions = [
    {
      label: "Check Market Overview",
      action: "Get market overview for top cryptocurrencies",
    },
    {
      label: "Analyze On-Chain Metric",
      action: "Analyze on-chain metrics for Bitcoin",
    },
    { label: "Check NOS Token Stats", action: "Get NOS token statistics" },
  ];

  return (
    <div className="animated-border hover-lift">
      <div className="p-6 relative overflow-hidden">
        <div className="shimmer absolute inset-0" />

        <div className="flex items-center gap-2 mb-4 relative z-10">
          <span className="text-2xl">🤖</span>
          <h2 className="text-xl font-bold text-white gradient-text">
            Ask Nosight
          </h2>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-4 relative z-10">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Analyze NOS token performance over the last 7 days..."
            className="flex-1 glass text-white border border-[#10E80C]/20 rounded-xl px-4 py-3 
                     focus:outline-none focus:border-[#10E80C] focus:ring-2 focus:ring-[#10E80C]/30 
                     transition-all placeholder:text-slate-500 hover:border-[#10E80C]/40"
            disabled={isAnalyzing}
          />
          <button
            onClick={handleSubmit}
            disabled={isAnalyzing || !query.trim()}
            className="bg-gradient-to-r from-[#10E80C] to-[#0CAF09] hover:from-[#0CAF09] hover:to-[#0A8A07] 
                     disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold px-6 py-3 rounded-xl 
                     transition-all flex items-center justify-center gap-2 min-w-[140px]
                     shadow-lg hover:shadow-[#10E80C]/40 hover:scale-105 neon-border"
          >
            <span className="text-lg">{isAnalyzing ? "⏳" : "🚀"}</span>
            {isAnalyzing ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <span className="text-slate-400 text-sm">Quick Actions:</span>
          {quickActions.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setQuery(item.action);
                onAnalyze(item.action);
              }}
              disabled={isAnalyzing}
              className="text-[#10E80C] hover:text-white hover:bg-[#10E80C]/20 px-3 py-1 
                       rounded-lg text-sm transition-all disabled:opacity-50 glass border border-[#10E80C]/20 
                       hover:border-[#10E80C]/50 hover:neon-glow-sm"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
