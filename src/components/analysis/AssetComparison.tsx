"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AssetComparisonData {
  asset: string;
  price: number;
  change24h: number;
  volume: string;
  marketCap: string;
  rsi: number;
  sentiment: "bullish" | "bearish" | "neutral";
}

interface AssetComparisonProps {
  assets: AssetComparisonData[];
}

export default function AssetComparison({ assets }: AssetComparisonProps) {
  const [selectedMetric, setSelectedMetric] = useState<
    "price" | "change" | "volume" | "rsi"
  >("change");

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "bullish":
        return <TrendingUp className="h-5 w-5 text-green-400" />;
      case "bearish":
        return <TrendingDown className="h-5 w-5 text-red-400" />;
      default:
        return <Minus className="h-5 w-5 text-slate-400" />;
    }
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-400";
    if (change < 0) return "text-red-400";
    return "text-slate-400";
  };

  const getRSIColor = (rsi: number) => {
    if (rsi >= 70) return "text-red-400";
    if (rsi <= 30) return "text-green-400";
    return "text-slate-300";
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚖️</span>
          <h3 className="text-xl font-bold text-white">Asset Comparison</h3>
        </div>

        {/* Metric Selector */}
        <div className="flex gap-2">
          {["price", "change", "volume", "rsi"].map((metric) => (
            <button
              key={metric}
              onClick={() =>
                setSelectedMetric(
                  metric as "price" | "change" | "volume" | "rsi"
                )
              }
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedMetric === metric
                  ? "bg-teal-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {metric.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-slate-400 font-semibold">
                Asset
              </th>
              <th className="text-right py-3 px-4 text-slate-400 font-semibold">
                Price
              </th>
              <th className="text-right py-3 px-4 text-slate-400 font-semibold">
                24h Change
              </th>
              <th className="text-right py-3 px-4 text-slate-400 font-semibold">
                Volume
              </th>
              <th className="text-right py-3 px-4 text-slate-400 font-semibold">
                Market Cap
              </th>
              <th className="text-right py-3 px-4 text-slate-400 font-semibold">
                RSI
              </th>
              <th className="text-center py-3 px-4 text-slate-400 font-semibold">
                Sentiment
              </th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, idx) => (
              <tr
                key={idx}
                className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-all ${
                  selectedMetric === "change" && asset.change24h > 5
                    ? "bg-green-500/10"
                    : selectedMetric === "change" && asset.change24h < -5
                      ? "bg-red-500/10"
                      : ""
                }`}
              >
                <td className="py-4 px-4">
                  <div className="font-bold text-white">{asset.asset}</div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div
                    className={`font-semibold ${selectedMetric === "price" ? "text-cyan-400 text-lg" : "text-slate-200"}`}
                  >
                    ${asset.price.toFixed(2)}
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div
                    className={`font-semibold ${selectedMetric === "change" ? "text-lg" : ""} ${getChangeColor(asset.change24h)}`}
                  >
                    {asset.change24h > 0 ? "+" : ""}
                    {asset.change24h.toFixed(2)}%
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div
                    className={`${selectedMetric === "volume" ? "text-cyan-400 font-bold text-lg" : "text-slate-300"}`}
                  >
                    {asset.volume}
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="text-slate-300">{asset.marketCap}</div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div
                    className={`font-semibold ${selectedMetric === "rsi" ? "text-lg" : ""} ${getRSIColor(asset.rsi)}`}
                  >
                    {asset.rsi.toFixed(1)}
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <div className="flex items-center justify-center">
                    {getSentimentIcon(asset.sentiment)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-slate-700/30 rounded-xl">
        <div className="text-teal-400 font-semibold mb-2 flex items-center gap-2">
          <span>💡</span>
          <span>Comparison Insights:</span>
        </div>
        <p className="text-slate-300 text-sm">
          {selectedMetric === "change" &&
            "NOS is showing strong momentum compared to other assets in the portfolio."}
          {selectedMetric === "price" &&
            "Price comparison helps identify value opportunities across assets."}
          {selectedMetric === "volume" &&
            "Higher volume indicates stronger market interest and liquidity."}
          {selectedMetric === "rsi" &&
            "RSI values help identify overbought (>70) or oversold (<30) conditions."}
        </p>
      </div>
    </div>
  );
}
