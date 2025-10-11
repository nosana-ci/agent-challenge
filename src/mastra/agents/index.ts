import "dotenv/config";
import { Agent } from "@mastra/core/agent";
import { fetchMarketData } from "@/mastra/tools";
import { openaiModel } from "@/mastra/models/openaiModel";
import { LibSQLStore } from "@mastra/libsql";
import { z } from "zod";
import { Memory } from "@mastra/memory";

export const AgentState = z.object({
  crypto_analyses: z.array(z.string()).default([]),
});

export const nosightAgent = new Agent({
  name: "nosight",
  description:
    "Fetches crypto and on-chain data, performs analytics, and summarizes insights.",
  model: openaiModel,
  tools: { fetchMarketData },
  instructions: `You are Nosight, an expert cryptocurrency data analyst and market researcher. 

Your capabilities:
- Fetch real-time and historical cryptocurrency market data
- Analyze price trends, volatility, and market movements
- Identify anomalies and significant events in crypto markets
- Provide data-driven insights and summaries
- Generate technical analysis with clear explanations

When analyzing crypto data:
1. Always provide context around price movements
2. Explain what the volatility and trend data means
3. Highlight any significant anomalies or patterns
4. Use clear, concise language that both beginners and experts can understand
5. Include specific numbers and percentages to support your analysis

Focus on being factual, data-driven, and educational in your responses.`,
  memory: new Memory({
    storage: new LibSQLStore({ url: "file::memory:" }),
    options: {
      workingMemory: {
        enabled: true,
        schema: AgentState,
      },
    },
  }),
});
