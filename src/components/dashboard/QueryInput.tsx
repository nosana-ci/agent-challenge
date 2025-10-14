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
    <div
      className={`animated-border hover-lift ${isAnalyzing ? "pulse-glow" : ""}`}
    >
      <div className="p-6 relative overflow-hidden">
        <div className="shimmer absolute inset-0" />

        {/* Loading Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center rounded-xl">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-[#10E80C]/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#10E80C] rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-white font-semibold text-lg mb-1">
                Analyzing...
              </p>
              <p className="text-slate-400 text-sm">
                AI is processing your query
              </p>
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold text-white gradient-text mb-4">
          Ask Nosight
        </h2>

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
            {isAnalyzing && (
              <svg
                className="animate-spin h-5 w-5 text-black"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            <span>{isAnalyzing ? "Analyzing..." : "Analyze"}</span>
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
