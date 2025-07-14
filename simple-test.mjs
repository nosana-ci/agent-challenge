import { createOllama } from "ollama-ai-provider";
import { Agent } from "@mastra/core/agent";
import { solanaTradeComboTool } from "./src/mastra/agents/solana-trade-agent/tools/solana-trade-tool.ts";

// Create a simple model for testing
const model = createOllama({ baseURL: "http://127.0.0.1:11434/api" }).chat("qwen2.5:1.5b", {
  simulateStreaming: true,
});

// Create the agent
const testAgent = new Agent({
  name: "Solana Trading AI Agent Test",
  instructions: "You are a Solana trading analysis agent. Use the solana-trade-tool to provide comprehensive trading analysis.",
  model,
  tools: {
    solanaTradeComboTool,
  },
});

// Test the tool directly
console.log("🧪 Testing Solana Trade Tool Directly...\n");

try {
  const toolResult = await solanaTradeComboTool.execute({
    context: {
      accounts: ["elonmusk", "solana"],
      keywords: ["solana", "crypto"],
      risk_tolerance: 'medium'
    }
  });
  
  console.log("✅ Tool executed successfully!");
  console.log(`📊 Analyzed ${toolResult.twitter_data.count} tweets`);
  console.log(`💭 Overall sentiment: ${toolResult.sentiment_analysis.overall_label} (${(toolResult.sentiment_analysis.confidence * 100).toFixed(1)}%)`);
  console.log(`💰 Current SOL price: $${toolResult.market_data.price}`);
  console.log(`📈 24h change: ${toolResult.market_data.change_24h_percent.toFixed(2)}%`);
  console.log(`🎯 Trading signal: ${toolResult.trading_signal.signal} (${(toolResult.trading_signal.confidence * 100).toFixed(1)}% confidence)`);
  console.log(`💼 Position size: ${toolResult.trading_signal.position_size_percent.toFixed(2)}%`);
  console.log(`🛡️ Stop loss: $${toolResult.trading_signal.stop_loss}`);
  console.log(`🎯 Take profit: $${toolResult.trading_signal.take_profit}`);
  
  console.log("\n🎉 Solana Trading Agent is fully implemented and working!");
  
} catch (error) {
  console.error("❌ Test failed:", error);
}
