import { twitterMonitorTool } from "../src/mastra/agents/solana-trade-agent/tools/twitter-monitor-tool";
import { sentimentAnalysisTool } from "../src/mastra/agents/solana-trade-agent/tools/sentiment-analysis-tool";
import { solanaMarketTool } from "../src/mastra/agents/solana-trade-agent/tools/solana-market-tool";
import { tradingSignalTool } from "../src/mastra/agents/solana-trade-agent/tools/trading-signal-tool";

// Simple test function to verify tools work
export async function testSolanaTradeAgent() {
	console.log("🧪 Testing Solana Trade Agent Tools...\n");
	
	try {
		// Test 1: Twitter Monitor Tool
		console.log("1. Testing Twitter Monitor Tool...");
		const twitterResult = await twitterMonitorTool.execute({
			context: {
				accounts: ["elonmusk", "solana"],
				keywords: ["solana", "blockchain"]
			}
		});
		console.log(`✅ Twitter Monitor: Found ${twitterResult.count} tweets from ${twitterResult.source}`);
		
		// Test 2: Sentiment Analysis Tool
		console.log("\n2. Testing Sentiment Analysis Tool...");
		const sentimentResult = await sentimentAnalysisTool.execute({
			context: {
				tweets: twitterResult.tweets
			}
		});
		console.log(`✅ Sentiment Analysis: ${sentimentResult.overall_label} sentiment with ${(sentimentResult.confidence * 100).toFixed(1)}% confidence`);
		
		// Test 3: Market Data Tool
		console.log("\n3. Testing Market Data Tool...");
		const marketResult = await solanaMarketTool.execute({
			context: {}
		});
		console.log(`✅ Market Data: SOL price $${marketResult.price} (${marketResult.change_24h_percent.toFixed(2)}% 24h)`);
		
		// Test 4: Trading Signal Tool
		console.log("\n4. Testing Trading Signal Tool...");
		const signalResult = await tradingSignalTool.execute({
			context: {
				sentiment_data: sentimentResult,
				market_data: marketResult,
				risk_tolerance: 'medium'
			}
		});
		console.log(`✅ Trading Signal: ${signalResult.signal} with ${(signalResult.confidence * 100).toFixed(1)}% confidence`);
		
		// Test Summary
		console.log("\n📊 Test Summary:");
		console.log(`   Social Sentiment: ${sentimentResult.overall_label}`);
		console.log(`   Market Momentum: ${marketResult.momentum_indicator}`);
		console.log(`   Trading Signal: ${signalResult.signal}`);
		console.log(`   Position Size: ${signalResult.position_size_percent.toFixed(2)}%`);
		console.log(`   Entry Price: $${signalResult.entry_price}`);
		console.log(`   Stop Loss: $${signalResult.stop_loss}`);
		console.log(`   Take Profit: $${signalResult.take_profit}`);
		
		console.log("\n🎉 All tests passed successfully!");
		
	} catch (error) {
		console.error("❌ Test failed:", error);
	}
}

// Run tests if this file is executed directly
if (require.main === module) {
	testSolanaTradeAgent();
}
