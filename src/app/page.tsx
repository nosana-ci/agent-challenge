"use client";

import { useCoAgent, useCopilotAction } from "@copilotkit/react-core";
import { useState } from "react";
import { AgentState as AgentStateSchema } from "@/mastra/agents";
import { z } from "zod";
import { FaCirclePlus } from "react-icons/fa6";
import AuthGate from "@/components/auth/AuthGate";
import Sidebar from "@/components/layout/Sidebar";
import BackgroundEffects from "@/components/ui/BackgroundEffects";
import QueryInput from "@/components/dashboard/QueryInput";
import MarketStatsCard from "@/components/dashboard/MarketStatsCard";
import NetworkStatsCard from "@/components/dashboard/NetworkStatsCard";
import SentimentCard from "@/components/dashboard/SentimentCard";
import LiveAnalysisPanel from "@/components/dashboard/LiveAnalysisPanel";
import PriceChart from "@/components/dashboard/PriceChart";
import ExecutiveSummary from "@/components/analysis/ExecutiveSummary";
import RiskScoreCard from "@/components/analysis/RiskScoreCard";
import PortfolioDistribution from "@/components/charts/PortfolioDistribution";
import MarketHeatmap from "@/components/charts/MarketHeatmap";
import CorrelationMatrix from "@/components/charts/CorrelationMatrix";
import ExportReport from "@/components/reports/ExportReport";
import DeepAnalysisMode from "@/components/analysis/DeepAnalysisMode";
import SmartExplanations from "@/components/analysis/SmartExplanations";
import type {
  MarketData,
  NetworkStats,
  SentimentData,
  AnalysisResult,
  ChartDataPoint,
} from "@/types/dashboard";
import type { EnhancedAnalysisResult } from "@/types/enhanced-analysis";

type AgentState = z.infer<typeof AgentStateSchema>;

export default function NosightDashboard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timeframe, setTimeframe] = useState<"1D" | "7D" | "30D">("7D");

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { state } = useCoAgent<AgentState>({
    name: "nosightAgent",
    initialState: {
      crypto_analyses: [],
    },
  });

  // Mock data (replace with real data from your agent)
  const marketData: MarketData = {
    symbol: "NOS",
    name: "NOS Token",
    price: 2.45,
    change24h: 12.5,
    volume24h: "$2.3M",
    marketCap: "$45.2M",
  };

  const networkStats: NetworkStats = {
    activeNodes: 342,
    jobsPerDay: "1.2K",
    utilizationRate: 67,
  };

  const sentiment: SentimentData = {
    score: 0.78,
    label: "Positive",
    trend: "up",
    icon: <FaCirclePlus className="text-green-400" />,
  };

  const chartData: ChartDataPoint[] = [
    { day: "Mon", value: 2.1 },
    { day: "Tue", value: 2.25 },
    { day: "Wed", value: 2.35 },
    { day: "Thu", value: 2.5 },
    { day: "Fri", value: 2.4 },
    { day: "Sat", value: 2.55 },
    { day: "Sun", value: 2.45 },
  ];

  // Portfolio distribution mock data
  const portfolioData = [
    { name: "NOS", value: 45000, color: "#14b8a6" },
    { name: "BTC", value: 30000, color: "#f59e0b" },
    { name: "ETH", value: 18000, color: "#8b5cf6" },
    { name: "SOL", value: 12000, color: "#06b6d4" },
    { name: "Others", value: 8000, color: "#6366f1" },
  ];

  // Market heatmap mock data
  const heatmapData = [
    { asset: "NOS", change: 12.5, volume: "$2.3M" },
    { asset: "BTC", change: 3.2, volume: "$45.2B" },
    { asset: "ETH", change: -1.8, volume: "$22.1B" },
    { asset: "SOL", change: 8.7, volume: "$3.8B" },
    { asset: "ADA", change: 5.4, volume: "$890M" },
    { asset: "AVAX", change: -3.2, volume: "$720M" },
    { asset: "DOT", change: 2.1, volume: "$450M" },
    { asset: "MATIC", change: -5.6, volume: "$380M" },
  ];

  // Correlation matrix mock data
  const correlationAssets = ["NOS", "BTC", "ETH", "SOL"];
  const correlationMatrix = [
    [1.0, 0.65, 0.72, 0.58],
    [0.65, 1.0, 0.89, 0.74],
    [0.72, 0.89, 1.0, 0.81],
    [0.58, 0.74, 0.81, 1.0],
  ];

  // Enhanced analysis mock data
  const enhancedAnalysis: EnhancedAnalysisResult = {
    id: "enhanced-1",
    timestamp: Date.now(),
    query: "Comprehensive NOS Token Analysis",
    asset: "NOS",
    timeframe: "7D",
    executiveSummary: {
      bullets: [
        "Strong upward momentum with 12.5% gain in 24h",
        "Network utilization at healthy 67% with growing node count",
        "Technical indicators suggest continued bullish trend",
      ],
      overallSentiment: "bullish",
      confidence: 0.82,
    },
    riskScore: {
      buy: 75,
      sell: 15,
      hold: 10,
      recommendation: "buy",
      reasoning: [
        "Strong technical momentum",
        "Increasing network activity",
        "Positive market sentiment",
      ],
    },
    anomalies: [
      {
        date: "2024-01-15",
        type: "volume_spike",
        description: "Trading volume increased 340% compared to 7-day average",
        impact: "high",
      },
      {
        date: "2024-01-14",
        type: "dev_activity",
        description:
          "Major protocol upgrade deployed, enabling new GPU job types",
        impact: "high",
      },
      {
        date: "2024-01-12",
        type: "whale_movement",
        description: "Large wallet accumulated 2.5M NOS tokens",
        impact: "medium",
      },
    ],
    chartData: {
      priceVolume: [],
      volatility: [],
      marketShare: [],
      correlation: { assets: [], matrix: [] },
    },
    technicalIndicators: {
      rsi: 68.5,
      macd: { value: 0.042, signal: 0.035, histogram: 0.007 },
      bollingerBands: { upper: 2.65, middle: 2.45, lower: 2.25 },
      movingAverages: {
        sma20: 2.38,
        sma50: 2.25,
        ema12: 2.42,
        ema26: 2.35,
      },
    },
    signals: [
      {
        type: "bullish",
        title: "Golden Cross Formation",
        description:
          "SMA 20 crossed above SMA 50, indicating strong bullish momentum",
        action: "Consider accumulating on dips",
        priority: "high",
      },
      {
        type: "bullish",
        title: "Network Growth Accelerating",
        description:
          "Active nodes increased 15% this week, signaling ecosystem expansion",
        action: "Long-term hold recommended",
        priority: "medium",
      },
      {
        type: "alert",
        title: "RSI Approaching Overbought",
        description: "RSI at 68.5, nearing the 70 overbought threshold",
        action: "Monitor for potential short-term correction",
        priority: "medium",
      },
    ],
    status: "complete",
  };

  const analyses: AnalysisResult[] = [
    {
      id: "analysis-1",
      timestamp: Date.now(),
      query: "Analyze NOS token performance and market trends",
      findings: [
        "NOS price increased 12.5% in the last 24 hours, outperforming most altcoins",
        "Network utilization rate is at a healthy 67% with 342 active nodes",
        "Trading volume surged 340% compared to the 7-day average",
        "Strong buying pressure detected with RSI at 68.5 (approaching overbought)",
        "Recent protocol upgrade enabling new GPU job types is driving adoption",
      ],
      insight:
        "Strong fundamentals with increasing network adoption. The combination of technical momentum, growing network activity, and recent infrastructure improvements suggests continued bullish sentiment. However, monitor RSI levels as we approach overbought territory.",
      status: "complete" as const,
    },
  ];

  const handleAnalyze = (query: string) => {
    setIsAnalyzing(true);
    console.log("Analyzing:", query);
    // The CopilotKit agent will handle this
    setTimeout(() => setIsAnalyzing(false), 3000);
  };

  useCopilotAction({
    name: "updateWorkingMemory",
    available: "frontend",
    render: () => <></>,
  });

  return (
    <AuthGate>
      <div className="min-h-screen bg-black relative flex">
        <BackgroundEffects />

        {/* Sidebar */}
        <Sidebar userName="Builder" />

        {/* Main Content */}
        <div className="flex-1 ml-64 transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 relative z-10">
            {/* Dashboard Section */}
            <div id="dashboard" className="scroll-mt-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold gradient-text neon-glow-sm mb-2">
                  Dashboard
                </h2>
                <p className="text-slate-400">
                  Real-time market intelligence and analytics
                </p>
              </div>

              {/* Query Input Section */}
              <QueryInput onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />

              {/* Stats Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                <MarketStatsCard data={marketData} />
                <NetworkStatsCard stats={networkStats} />
                <SentimentCard sentiment={sentiment} />
              </div>
            </div>

            {/* Analysis Section */}
            <div id="analysis" className="scroll-mt-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold gradient-text neon-glow-sm mb-2">
                  Analysis
                </h2>
                <p className="text-slate-400">
                  Comprehensive market analysis and insights
                </p>
              </div>

              {/* Enhanced Analysis Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                  <ExecutiveSummary analysis={enhancedAnalysis} />
                </div>
                <div>
                  <RiskScoreCard riskScore={enhancedAnalysis.riskScore} />
                </div>
              </div>

              {/* Live Analysis Panel */}
              <div className="mb-8">
                <LiveAnalysisPanel
                  analyses={analyses}
                  enhancedAnalysis={enhancedAnalysis}
                />
              </div>
            </div>

            {/* Charts Section */}
            <div id="charts" className="scroll-mt-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold gradient-text neon-glow-sm mb-2">
                  Charts
                </h2>
                <p className="text-slate-400">Visual market data and trends</p>
              </div>

              {/* Price Chart */}
              <PriceChart
                data={chartData}
                title="NOS Price Chart (7D)"
                timeframe={timeframe}
                onTimeframeChange={setTimeframe}
              />

              {/* Additional Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <PortfolioDistribution data={portfolioData} />
                <MarketHeatmap data={heatmapData} />
              </div>

              {/* Correlation Matrix */}
              <div className="mt-8">
                <CorrelationMatrix
                  assets={correlationAssets}
                  matrix={correlationMatrix}
                />
              </div>
            </div>

            {/* Portfolio Section */}
            <div id="portfolio" className="scroll-mt-8">
              <div className="mb-8 mt-12">
                <h2 className="text-3xl font-bold gradient-text neon-glow-sm mb-2">
                  Portfolio
                </h2>
                <p className="text-slate-400">
                  Track your crypto holdings and performance
                </p>
              </div>

              {/* Deep Analysis Mode */}
              <DeepAnalysisMode asset={marketData.symbol} />
            </div>

            {/* Questions Section (Placeholder) */}
            <div id="questions" className="scroll-mt-8">
              <div className="mb-8 mt-12">
                <h2 className="text-3xl font-bold gradient-text neon-glow-sm mb-2">
                  Questions
                </h2>
                <p className="text-slate-400">
                  Set up custom price alerts and notifications
                </p>
              </div>

              {/* Smart Explanations */}
              <SmartExplanations />
            </div>

            {/* History Section */}
            <div id="history" className="scroll-mt-8">
              <div className="mb-8 mt-12">
                <h2 className="text-3xl font-bold gradient-text neon-glow-sm mb-2">
                  History
                </h2>
                <p className="text-slate-400">
                  View your analysis history and reports
                </p>
              </div>

              {/* Export Report Section */}
              <ExportReport analysis={enhancedAnalysis} />
            </div>

            {/* Footer */}
            <div className="text-center text-slate-500 text-sm mt-16 pb-8">
              <p>
                Built for the{" "}
                <span className="text-[#10E80C] font-semibold">
                  Nosana Builders Challenge
                </span>
              </p>
              <p className="text-xs mt-1">
                Powered by Mastra AI • Real-time Market Intelligence
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGate>
  );
}

// Crypto card component where the symbol and themeColor are based on what the agent
// sets via tool calls.
// function CryptoCard({
//   symbol,
//   result,
//   status,
// }: {
//   symbol?: string;
//   days?: number;
//   result: {
//     symbol: string;
//     name: string;
//     current_price: number;
//     market_cap?: number;
//     total_volume?: number;
//     price_change_percentage_24h?: number;
//     price_change_percentage_7d?: number;
//     analysis_summary?: string;
//   } | null;
//   status: "inProgress" | "executing" | "complete";
// }) {
//   if (status !== "complete") {
//     return (
//       <div className="rounded-xl shadow-lg mt-6 mb-4 max-w-md w-full bg-white border border-[[#10E80C]]200">
//         <div className="bg-gradient-to-r from-[[#10E80C]]50 to-[[#0CAF09]]50 p-6 w-full">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[[#10E80C]]400 to-[[#0CAF09]]600 animate-pulse" />
//             <div>
//               <p className="text-gray-700 font-medium">
//                 Analyzing {symbol || "cryptocurrency"}...
//               </p>
//               <p className="text-gray-500 text-sm">Fetching market data</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (!result) return null;

//   const priceChange24h = result.price_change_percentage_24h || 0;
//   const isPositive = priceChange24h > 0;

//   return (
//     <div className="rounded-xl shadow-xl mt-6 mb-4 max-w-md w-full bg-white border-2 border-[[#10E80C]]200 overflow-hidden">
//       {/* Header with gradient */}
//       <div className="bg-gradient-to-r from-[[#10E80C]]500 to-[[#0CAF09]]600 p-6">
//         <div className="flex items-center justify-between">
//           <div>
//             <h3 className="text-2xl font-bold text-white uppercase tracking-wide">
//               {result.symbol}
//             </h3>
//             <p className="text-teal-100">{result.name}</p>
//           </div>
//           <CryptoIcon symbol={result.symbol} />
//         </div>

//         {/* Price section */}
//         <div className="mt-4 flex items-end justify-between">
//           <div className="text-4xl font-bold text-white">
//             ${result.current_price?.toFixed(4)}
//           </div>
//           <div
//             className={`text-lg font-bold px-3 py-1 rounded-full ${
//               isPositive
//                 ? "bg-green-400/30 text-green-100"
//                 : "bg-red-400/30 text-red-100"
//             }`}
//           >
//             {isPositive ? "↗" : "↘"} {Math.abs(priceChange24h).toFixed(2)}%
//           </div>
//         </div>
//       </div>

//       {/* Stats section */}
//       <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
//         <div className="grid grid-cols-3 gap-4 text-center">
//           <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
//             <p className="text-gray-500 text-xs font-medium mb-1">Market Cap</p>
//             <p className="text-gray-900 font-bold">
//               {result.market_cap
//                 ? `$${(result.market_cap / 1e9).toFixed(2)}B`
//                 : "N/A"}
//             </p>
//           </div>
//           <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
//             <p className="text-gray-500 text-xs font-medium mb-1">
//               Volume (24h)
//             </p>
//             <p className="text-gray-900 font-bold">
//               {result.total_volume
//                 ? `$${(result.total_volume / 1e6).toFixed(1)}M`
//                 : "N/A"}
//             </p>
//           </div>
//           <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
//             <p className="text-gray-500 text-xs font-medium mb-1">7d Change</p>
//             <p
//               className={`font-bold ${
//                 (result.price_change_percentage_7d || 0) > 0
//                   ? "text-green-600"
//                   : "text-red-600"
//               }`}
//             >
//               {result.price_change_percentage_7d?.toFixed(1) || "0"}%
//             </p>
//           </div>
//         </div>

//         {/* Analysis section */}
//         {result.analysis_summary && (
//           <div className="mt-4 p-4 bg-[[#10E80C]]50 rounded-lg border border-[[#10E80C]]200">
//             <div className="flex items-center gap-2 mb-2">
//               <span className="text-teal-600 text-lg">🔍</span>
//               <p className="text-teal-900 text-sm font-semibold">AI Analysis</p>
//             </div>
//             <p className="text-gray-700 text-sm leading-relaxed">
//               {result.analysis_summary}
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// function CryptoIcon({ symbol }: { symbol: string }) {
//   if (!symbol) return <DefaultCryptoIcon />;

//   const symbolLower = symbol.toLowerCase();

//   if (symbolLower === "btc" || symbolLower === "bitcoin") {
//     return <BitcoinIcon />;
//   }

//   if (symbolLower === "eth" || symbolLower === "ethereum") {
//     return <EthereumIcon />;
//   }

//   return <DefaultCryptoIcon />;
// }

// // Bitcoin icon
// function BitcoinIcon() {
//   return (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       viewBox="0 0 24 24"
//       fill="currentColor"
//       className="w-14 h-14 text-orange-300"
//     >
//       <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.562c-.375 1.5-1.938 2.063-3.938 1.688V12c1.125.188 2.125-.375 2.125-1.438 0-.75-.5-1.25-1.188-1.25v1.25h-1v-1.25c-.562 0-1.062.188-1.062.75v4.5c0 .562.5.75 1.062.75v-1.25h1v1.25c.688 0 1.188-.5 1.188-1.25 0-1.063-1-1.625-2.125-1.438V10.25c2-.375 3.563.188 3.938 1.688z" />
//     </svg>
//   );
// }

// // Ethereum icon
// function EthereumIcon() {
//   return (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       viewBox="0 0 24 24"
//       fill="currentColor"
//       className="w-14 h-14 text-blue-300"
//     >
//       <path d="M12 0L5.5 12.25L12 16.5l6.5-4.25L12 0z" />
//       <path d="M5.5 13.5L12 24l6.5-10.5L12 17.75L5.5 13.5z" />
//     </svg>
//   );
// }

// // Default crypto icon
// function DefaultCryptoIcon() {
//   return (
//     <svg
//       xmlns="http://www.w3.org/2000/svg"
//       viewBox="0 0 24 24"
//       fill="currentColor"
//       className="w-14 h-14 text-green-300"
//     >
//       <circle
//         cx="12"
//         cy="12"
//         r="10"
//         stroke="currentColor"
//         strokeWidth="2"
//         fill="none"
//       />
//       <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" />
//     </svg>
//   );
// }
