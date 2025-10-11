#!/usr/bin/env tsx
import "dotenv/config";
import { nosightAgent } from "./src/mastra/agents";

async function testNosightAgent() {
  console.log("🚀 Testing Nosight Agent...");

  try {
    const response = await nosightAgent.generate([
      {
        role: "user",
        content: "Get market data for Ethereum and explain the current trends",
      },
    ]);

    console.log("✅ Agent Response:");
    console.log(response.text);
  } catch (error) {
    console.error("❌ Error testing agent:", error);
  }
}

testNosightAgent();
