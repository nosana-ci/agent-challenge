"use client";

import { AnalysisResult } from "@/types/dashboard";
import { EnhancedAnalysisResult } from "@/types/enhanced-analysis";
import {
  AlertTriangle,
  Activity,
  Zap,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Info,
  Rocket,
  BarChart3,
  Download,
  RefreshCw,
  Lightbulb,
  Clock,
} from "lucide-react";

interface LiveAnalysisPanelProps {
  analyses: AnalysisResult[];
  currentAnalysis?: AnalysisResult | null;
  enhancedAnalysis?: EnhancedAnalysisResult;
}

export default function LiveAnalysisPanel({
  analyses,
  currentAnalysis,
  enhancedAnalysis,
}: LiveAnalysisPanelProps) {
  const latestAnalysis = currentAnalysis || analyses[analyses.length - 1];

  const exportAnalysisToCSV = () => {
    if (!latestAnalysis) return;

    const csvContent = [
      ["Nosight Live Analysis Report"],
      ["Generated:", new Date(latestAnalysis.timestamp).toLocaleString()],
      ["Query:", latestAnalysis.query],
      [""],
      ["Key Findings:"],
      ...latestAnalysis.findings.map((finding) => [finding]),
      [""],
      ["Insight:"],
      [latestAnalysis.insight],
      [""],
      ["Status:", latestAnalysis.status],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nosight-analysis-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  //   if (!latestAnalysis && analyses.length === 0) {
  //     return (
  //       <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
  //         <div className="flex items-center justify-between mb-6">
  //           <div className="flex items-center gap-2">
  //             <span className="text-xl">
  //               <FaChartLine />
  //             </span>
  //             <h2 className="text-xl font-bold text-white">Live Analysis</h2>
  //           </div>
  //         </div>

  //         <div className="text-center py-16">
  //           <div className="text-6xl mb-4 animate-pulse">
  //             <FaChartLine className="text-center mx-auto" />
  //           </div>
  //           <div className="text-slate-300 text-lg mb-2 font-medium">
  //             No analysis yet
  //           </div>
  //           <div className="text-slate-500 text-sm">
  //             Ask Nosight about any cryptocurrency to get started
  //           </div>
  //         </div>
  //       </div>
  //     );
  //   }

  return (
    <div className="space-y-6">
      {/* Enhanced Analysis - Technical Indicators */}
      {enhancedAnalysis && enhancedAnalysis.status === "complete" && (
        <>
          <div className="glass-dark card-glow hover-lift rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="shimmer absolute inset-0" />
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <Activity className="h-5 w-5 text-[#10E80C] pulse-glow" />
              <h3 className="text-lg font-semibold text-white gradient-text">
                Technical Indicators
              </h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* RSI */}
              <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
                <div className="text-xs font-medium text-slate-400 mb-1">
                  Relative Strength Index
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  {enhancedAnalysis.technicalIndicators.rsi.toFixed(1)}
                </div>
                <div
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                    enhancedAnalysis.technicalIndicators.rsi > 70
                      ? "bg-red-500/20 text-red-300"
                      : enhancedAnalysis.technicalIndicators.rsi < 30
                        ? "bg-green-500/20 text-green-300"
                        : "bg-slate-600/30 text-slate-300"
                  }`}
                >
                  {enhancedAnalysis.technicalIndicators.rsi > 70 ? (
                    <>
                      <TrendingUp className="h-3 w-3" /> Overbought
                    </>
                  ) : enhancedAnalysis.technicalIndicators.rsi < 30 ? (
                    <>
                      <TrendingDown className="h-3 w-3" /> Oversold
                    </>
                  ) : (
                    <>
                      <Activity className="h-3 w-3" /> Neutral
                    </>
                  )}
                </div>
              </div>

              {/* MACD */}
              <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
                <div className="text-xs font-medium text-slate-400 mb-1">
                  MACD
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  {enhancedAnalysis.technicalIndicators.macd.value.toFixed(2)}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`${
                      enhancedAnalysis.technicalIndicators.macd.histogram > 0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {enhancedAnalysis.technicalIndicators.macd.histogram > 0
                      ? "↑"
                      : "↓"}
                  </span>
                  <span className="text-slate-300">
                    Signal:{" "}
                    {enhancedAnalysis.technicalIndicators.macd.signal.toFixed(
                      2
                    )}
                  </span>
                </div>
              </div>

              {/* Moving Averages */}
              <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
                <div className="text-xs font-medium text-slate-400 mb-1">
                  Simple Moving Average
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  $
                  {enhancedAnalysis.technicalIndicators.movingAverages.sma20.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400">
                  SMA 50: $
                  {enhancedAnalysis.technicalIndicators.movingAverages.sma50.toLocaleString()}
                </div>
              </div>

              {/* Bollinger Bands */}
              <div className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
                <div className="text-xs font-medium text-slate-400 mb-1">
                  Bollinger Bands
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  $
                  {enhancedAnalysis.technicalIndicators.bollingerBands.middle.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400">
                  Upper: $
                  {enhancedAnalysis.technicalIndicators.bollingerBands.upper.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Trading Signals */}
          {enhancedAnalysis.signals.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur-md glass-dark card-glow hover-lift rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-yellow-400" />
                <h3 className="text-lg font-semibold text-white">
                  Trading Signals
                </h3>
              </div>

              <div className="space-y-3">
                {enhancedAnalysis.signals.map((signal, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all hover:scale-[1.02] ${
                      signal.priority === "high"
                        ? "bg-red-500/10 border-red-500/30"
                        : signal.priority === "medium"
                          ? "bg-yellow-500/10 border-yellow-500/30"
                          : "bg-blue-500/10 border-blue-500/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-800/50">
                        {signal.type === "bullish" ? (
                          <TrendingUp className="h-6 w-6" />
                        ) : signal.type === "bearish" ? (
                          <TrendingDown className="h-6 w-6 text-red-400" />
                        ) : signal.type === "alert" ? (
                          <AlertTriangle className="h-6 w-6 text-yellow-400" />
                        ) : (
                          <Info className="h-6 w-6 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-white">
                            {signal.title}
                          </h4>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                              signal.priority === "high"
                                ? "bg-red-500/30 text-red-200"
                                : signal.priority === "medium"
                                  ? "bg-yellow-500/30 text-yellow-200"
                                  : "bg-blue-500/30 text-blue-200"
                            }`}
                          >
                            {signal.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 mb-2">
                          {signal.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm font-medium text-[#10E80C]">
                          <Lightbulb className="h-4 w-4" />
                          <span>{signal.action}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Market Anomalies */}
          {enhancedAnalysis.anomalies.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur-md glass-dark card-glow hover-lift rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                <h3 className="text-lg font-semibold text-white">
                  Market Anomalies & Events
                </h3>
              </div>

              <div className="space-y-3">
                {enhancedAnalysis.anomalies.map((anomaly, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border flex items-start gap-3 transition-all hover:scale-[1.01] ${
                      anomaly.impact === "high"
                        ? "bg-red-500/5 border-red-500/20"
                        : anomaly.impact === "medium"
                          ? "bg-yellow-500/5 border-yellow-500/20"
                          : "bg-slate-700/30 border-slate-600/20"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-slate-800/50">
                      {anomaly.type === "volume_spike" ? (
                        <BarChart3 className="h-6 w-6 text-[#10E80C]" />
                      ) : anomaly.type === "price_surge" ? (
                        <Rocket className="h-6 w-6 text-green-400" />
                      ) : anomaly.type === "price_crash" ? (
                        <TrendingDown className="h-6 w-6 text-red-400" />
                      ) : anomaly.type === "dev_activity" ? (
                        <Zap className="h-6 w-6 text-yellow-400" />
                      ) : (
                        <Activity className="h-6 w-6 text-purple-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400">
                          {anomaly.date}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            anomaly.impact === "high"
                              ? "bg-red-500/30 text-red-200"
                              : anomaly.impact === "medium"
                                ? "bg-yellow-500/30 text-yellow-200"
                                : "bg-slate-600/30 text-slate-300"
                          }`}
                        >
                          {anomaly.impact.toUpperCase()} IMPACT
                        </span>
                      </div>
                      <p className="text-sm text-slate-200">
                        {anomaly.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Standard Live Analysis */}
      <div className="bg-slate-800/50 backdrop-blur-md glass-dark card-glow hover-lift rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-[#10E80C]" />
            <h2 className="text-xl font-bold text-white">Live Analysis</h2>
          </div>
          {latestAnalysis?.status === "analyzing" && (
            <div className="flex items-center gap-2 text-[#10E80C] text-sm">
              <div className="w-2 h-2 bg-[#10E80C] rounded-full animate-pulse"></div>
              <span>Analyzing...</span>
            </div>
          )}
        </div>

        {latestAnalysis && (
          <div className="space-y-4">
            <div className="text-slate-300 mb-4">{latestAnalysis.query}</div>

            {/* Progress Steps */}
            {latestAnalysis.status === "analyzing" && (
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Fetched price data</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Retrieved on-chain metrics</span>
                </div>
                <div className="flex items-center gap-2 text-yellow-400 animate-pulse">
                  <Clock className="h-4 w-4" />
                  <span>Analyzing sentiment...</span>
                </div>
              </div>
            )}

            {/* Key Findings */}
            {latestAnalysis.findings && latestAnalysis.findings.length > 0 && (
              <div className="bg-slate-700/30 rounded-xl p-4 mb-4 border border-slate-600/30">
                <div className="text-[#10E80C] font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Key Findings:</span>
                </div>
                <ul className="space-y-2">
                  {latestAnalysis.findings.map((finding, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-slate-300"
                    >
                      <span className="text-[#10E80C] mt-1">•</span>
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Insight */}
            {latestAnalysis.insight && latestAnalysis.status === "complete" && (
              <div className="bg-gradient-to-r from-[#064D04]/30 to-[#064D04]/30 border border-[#0A8A07]/30 rounded-xl p-4 mb-4">
                <div className="text-[#1AFF15] font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>Insight:</span>
                </div>
                <div className="text-slate-300 leading-relaxed">
                  {latestAnalysis.insight}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {latestAnalysis.status === "complete" && (
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={exportAnalysisToCSV}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Report</span>
                </button>

                <button className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
