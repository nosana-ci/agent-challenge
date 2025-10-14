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
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🤖</span>
        <h2 className="text-xl font-bold text-white">Ask Nosight</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Analyze NOS token performance over the last 7 days..."
          className="flex-1 bg-slate-700/50 text-white border border-slate-600 rounded-xl px-4 py-3 
                   focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 
                   transition-all placeholder:text-slate-500"
          disabled={isAnalyzing}
        />
        <button
          onClick={handleSubmit}
          disabled={isAnalyzing || !query.trim()}
          className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 
                   disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl 
                   font-semibold transition-all flex items-center justify-center gap-2 min-w-[140px]
                   shadow-lg hover:shadow-teal-500/25"
        >
          <span className="text-lg">{isAnalyzing ? "⏳" : "🚀"}</span>
          {isAnalyzing ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-slate-400 text-sm">Quick Actions:</span>
        {quickActions.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              setQuery(item.action);
              onAnalyze(item.action);
            }}
            disabled={isAnalyzing}
            className="text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 px-3 py-1 
                     rounded-lg text-sm transition-all disabled:opacity-50"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
