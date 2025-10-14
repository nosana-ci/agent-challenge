export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: string;
  marketCap?: string;
}

export interface NetworkStats {
  activeNodes: number;
  jobsPerDay: string;
  utilizationRate?: number;
}

export interface SentimentData {
  score: number;
  label: string;
  trend: "up" | "down" | "neutral";
  emoji: string;
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  query: string;
  findings: string[];
  insight: string;
  status: "analyzing" | "complete" | "error";
}

export interface ChartDataPoint {
  day: string;
  value: number;
}
