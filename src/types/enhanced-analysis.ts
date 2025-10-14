export interface EnhancedAnalysisResult {
  id: string;
  timestamp: number;
  query: string;
  asset: string;
  timeframe: string;

  // Executive Summary
  executiveSummary: {
    bullets: string[];
    overallSentiment: "bullish" | "bearish" | "neutral";
    confidence: number;
  };

  // Risk Assessment
  riskScore: {
    buy: number; // 0-100
    sell: number; // 0-100
    hold: number; // 0-100
    recommendation: "buy" | "sell" | "hold";
    reasoning: string[];
  };

  // Anomalies & Events
  anomalies: {
    date: string;
    type:
      | "volume_spike"
      | "price_surge"
      | "price_crash"
      | "dev_activity"
      | "whale_movement";
    description: string;
    impact: "high" | "medium" | "low";
  }[];

  // Chart Data
  chartData: {
    priceVolume: Array<{
      date: string;
      price: number;
      volume: number;
    }>;

    volatility: Array<{
      date: string;
      value: number;
    }>;

    marketShare: Array<{
      name: string;
      value: number;
      color: string;
    }>;

    correlation: {
      assets: string[];
      matrix: number[][]; // correlation coefficients
    };
  };

  // Technical Indicators
  technicalIndicators: {
    rsi: number;
    macd: { value: number; signal: number; histogram: number };
    bollingerBands: { upper: number; middle: number; lower: number };
    movingAverages: {
      sma20: number;
      sma50: number;
      ema12: number;
      ema26: number;
    };
  };

  // Actionable Signals
  signals: {
    type: "bullish" | "bearish" | "neutral" | "alert";
    title: string;
    description: string;
    action: string;
    priority: "high" | "medium" | "low";
  }[];

  status: "analyzing" | "complete" | "error";
}

export interface ComparisonData {
  assets: string[];
  metrics: {
    name: string;
    values: number[];
  }[];
  correlation: number;
  recommendation: string;
}
