import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const fetchMarketDataInputSchema = z.object({
  symbol: z
    .string()
    .describe(
      "Cryptocurrency symbol (e.g., 'bitcoin', 'ethereum', 'solana') or asset slug"
    ),
  days: z
    .number()
    .default(7)
    .describe("Number of days of historical data (1-365)"),
  interval: z
    .enum(["daily", "hourly"])
    .default("daily")
    .describe("Data interval (daily recommended for longer periods)"),
});

const fetchMarketDataOutputSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  current_price: z.number(),
  market_cap: z.number().nullable(),
  total_volume: z.number().nullable(),
  price_change_24h: z.number().nullable(),
  price_change_percentage_24h: z.number().nullable(),
  price_change_percentage_7d: z.number().nullable(),
  rank: z.number().nullable(),
  supply: z.number().nullable(),
  max_supply: z.number().nullable(),
  historical_data: z.array(
    z.object({
      timestamp: z.number(),
      price: z.number(),
    })
  ),
  technical_indicators: z.object({
    rsi: z.number().nullable(),
    sma_20: z.number().nullable(),
    ema_20: z.number().nullable(),
    volatility: z.number(),
  }),
  analysis_summary: z.string(),
});

export const fetchMarketData = createTool({
  id: "fetchMarketData",
  inputSchema: fetchMarketDataInputSchema,
  outputSchema: fetchMarketDataOutputSchema,
  description:
    "Fetches comprehensive cryptocurrency market data from CoinCap API v3 including current prices, historical data, and technical indicators",
  execute: async ({ context }) => {
    const { symbol, days, interval } = context;

    console.log("🔍 Fetching market data for:", { symbol, days, interval });

    try {
      // Get API key from environment (optional for free tier)
      const apiKey = process.env.COINCAP_API_KEY;
      console.log("🔑 API Key available:", !!apiKey);
      const headers: { [key: string]: string } = {
        "Content-Type": "application/json",
      };

      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      // Normalize symbol to CoinCap slug format
      const symbolSlug = symbol.toLowerCase().replace(/[^a-z0-9-]/g, "");
      console.log("🔍 Normalized symbol:", symbolSlug);

      // First, try to get the asset by slug (using v2 API which is more reliable)
      let assetData;
      try {
        const assetUrl = `https://api.coincap.io/v2/assets/${symbolSlug}`;
        console.log("📡 Fetching asset data from:", assetUrl);
        const assetResponse = await fetch(assetUrl, { headers });
        console.log("📊 Asset response status:", assetResponse.status);

        if (assetResponse.ok) {
          const assetResult = await assetResponse.json();
          console.log(
            "✅ Asset data received:",
            JSON.stringify(assetResult, null, 2)
          );
          assetData = assetResult.data;
        } else {
          console.log("❌ First attempt failed, trying search...");
          // If slug doesn't work, search by symbol
          const searchUrl = `https://api.coincap.io/v2/assets?search=${symbol}&limit=1`;
          console.log("🔍 Searching with URL:", searchUrl);
          const searchResponse = await fetch(searchUrl, { headers });
          console.log("🔍 Search response status:", searchResponse.status);

          if (searchResponse.ok) {
            const searchResult = await searchResponse.json();
            console.log(
              "🔍 Search result:",
              JSON.stringify(searchResult, null, 2)
            );
            if (searchResult.data && searchResult.data.length > 0) {
              assetData = searchResult.data[0];
            }
          } else {
            console.log("❌ Search also failed:", await searchResponse.text());
          }
        }
      } catch (error) {
        console.error("❌ Error fetching asset data:", error);
      }

      if (!assetData) {
        console.log("❌ No asset data found for symbol:", symbol);
        throw new Error(`Asset '${symbol}' not found`);
      }

      console.log("✅ Asset data found:", {
        id: assetData.id,
        symbol: assetData.symbol,
        name: assetData.name,
        priceUsd: assetData.priceUsd,
      });

      // Get historical data
      const historyUrl = `https://rest.coincap.io/v3/assets/${assetData.id}/history?interval=${interval === "hourly" ? "h1" : "d1"}&start=${Date.now() - days * 24 * 60 * 60 * 1000}&end=${Date.now()}`;
      const historyResponse = await fetch(historyUrl, { headers });

      let historical_data: Array<{ timestamp: number; price: number }> = [];
      if (historyResponse.ok) {
        const historyResult = await historyResponse.json();
        historical_data = historyResult.data.map(
          (point: { time: number; priceUsd: string }) => ({
            timestamp: point.time,
            price: parseFloat(point.priceUsd),
          })
        );
      }

      // Get technical indicators (requires paid tier, so we'll calculate basic ones)
      const technical_indicators = {
        rsi: null as number | null,
        sma_20: null as number | null,
        ema_20: null as number | null,
        volatility: 0,
      };

      if (apiKey) {
        try {
          // Try to get RSI
          const rsiUrl = `https://rest.coincap.io/v3/ta/${assetData.id}/rsi/latest`;
          const rsiResponse = await fetch(rsiUrl, { headers });
          if (rsiResponse.ok) {
            const rsiResult = await rsiResponse.json();
            technical_indicators.rsi = rsiResult.data?.rsi || null;
          }

          // Try to get SMA
          const smaUrl = `https://rest.coincap.io/v3/ta/${assetData.id}/sma/latest?period=20`;
          const smaResponse = await fetch(smaUrl, { headers });
          if (smaResponse.ok) {
            const smaResult = await smaResponse.json();
            technical_indicators.sma_20 = smaResult.data?.sma || null;
          }

          // Try to get EMA
          const emaUrl = `https://rest.coincap.io/v3/ta/${assetData.id}/ema/latest?period=20`;
          const emaResponse = await fetch(emaUrl, { headers });
          if (emaResponse.ok) {
            const emaResult = await emaResponse.json();
            technical_indicators.ema_20 = emaResult.data?.ema || null;
          }
        } catch (error) {
          console.warn("Failed to fetch technical indicators:", error);
        }
      }

      // Calculate volatility from historical data
      const prices = historical_data.map((d) => d.price);
      technical_indicators.volatility = calculateVolatility(prices);

      // Calculate price changes
      const currentPrice = parseFloat(assetData.priceUsd);
      const price_change_24h =
        (parseFloat(assetData.changePercent24Hr) * currentPrice) / 100;
      const price_change_percentage_24h = parseFloat(
        assetData.changePercent24Hr
      );

      // Calculate 7d change from historical data
      let price_change_percentage_7d = null;
      if (historical_data.length >= 2) {
        const oldestPrice = historical_data[0]?.price;
        if (oldestPrice && oldestPrice > 0) {
          price_change_percentage_7d =
            ((currentPrice - oldestPrice) / oldestPrice) * 100;
        }
      }

      const result = {
        id: assetData.id,
        symbol: assetData.symbol,
        name: assetData.name,
        current_price: currentPrice,
        market_cap: assetData.marketCapUsd
          ? parseFloat(assetData.marketCapUsd)
          : null,
        total_volume: assetData.volumeUsd24Hr
          ? parseFloat(assetData.volumeUsd24Hr)
          : null,
        price_change_24h,
        price_change_percentage_24h,
        price_change_percentage_7d,
        rank: assetData.rank ? parseInt(assetData.rank) : null,
        supply: assetData.supply ? parseFloat(assetData.supply) : null,
        max_supply: assetData.maxSupply
          ? parseFloat(assetData.maxSupply)
          : null,
        historical_data,
        technical_indicators,
        analysis_summary: generateAnalysisSummary({
          name: assetData.name,
          current_price: currentPrice,
          price_change_24h,
          price_change_percentage_24h,
          price_change_percentage_7d: price_change_percentage_7d || 0,
          minPrice: Math.min(...prices) || currentPrice,
          maxPrice: Math.max(...prices) || currentPrice,
          avgPrice:
            prices.length > 0
              ? prices.reduce((sum, price) => sum + price, 0) / prices.length
              : currentPrice,
          volatility: technical_indicators.volatility,
          days,
        }),
      };

      return result;
    } catch (error) {
      throw new Error(
        `Failed to fetch market data: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});

// Helper function to calculate volatility (standard deviation of returns)
function calculateVolatility(prices: number[]): number {
  if (prices.length < 2) return 0;

  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }

  const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance =
    returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) /
    returns.length;

  return Math.sqrt(variance) * 100; // Convert to percentage
}

// Helper function to generate analysis summary
function generateAnalysisSummary(data: {
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  minPrice: number;
  maxPrice: number;
  avgPrice: number;
  volatility: number;
  days: number;
}): string {
  const {
    name,
    current_price,
    price_change_percentage_24h,
    price_change_percentage_7d,
    minPrice,
    maxPrice,
    volatility,
    days,
  } = data;

  const pricePosition =
    ((current_price - minPrice) / (maxPrice - minPrice)) * 100;
  const trend24h = price_change_percentage_24h > 0 ? "up" : "down";
  const trend7d = price_change_percentage_7d > 0 ? "up" : "down";
  const volatilityLevel =
    volatility > 5 ? "high" : volatility > 2 ? "moderate" : "low";

  return `${name} is currently trading at $${current_price.toFixed(4)}, ${trend24h} ${Math.abs(price_change_percentage_24h).toFixed(2)}% in 24h and ${trend7d} ${Math.abs(price_change_percentage_7d).toFixed(2)}% over 7 days. Over the past ${days} days, it's trading at ${pricePosition.toFixed(1)}% of its range ($${minPrice.toFixed(4)} - $${maxPrice.toFixed(4)}). Volatility is ${volatilityLevel} at ${volatility.toFixed(2)}%.`;
}
