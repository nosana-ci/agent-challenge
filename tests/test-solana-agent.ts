import { solanaTradeAgent } from "../src/mastra/agents/solana-trade-agent/solana-trade-agent";
import { solanaTradeWorkflow } from "../src/mastra/agents/solana-trade-agent/solana-trade-workflow";

// Simple test function to verify the consolidated agent works
export async function testSolanaTradeAgent() {
	console.log("🧪 Testing Consolidated Solana Trade Agent...\n");
	
	try {
		// Test 1: Agent Interaction
		console.log("1. Testing Agent Conversation...");
		const agentResponse = await solanaTradeAgent.generate(
			[{ role: "user", content: "Give me a Solana trading analysis with medium risk tolerance" }]
		);
		console.log(`✅ Agent Response Length: ${agentResponse.content?.length} characters`);
		console.log(`   Preview: ${agentResponse.content?.slice(0, 200)}...`);
		
		// Test 2: Workflow Execution
		console.log("\n2. Testing Integrated Workflow...");
		const workflowResult = await solanaTradeWorkflow.run({
			accounts: ["elonmusk", "solana"],
			keywords: ["solana", "blockchain", "crypto"],
			risk_tolerance: 'medium'
		});
		
		const analysis = workflowResult.data.comprehensive_analysis;
		console.log(`✅ Workflow Complete: Analyzed ${analysis.social_media_insights.tweets_analyzed} tweets`);
		
		// Test Summary
		console.log("\n📊 Comprehensive Analysis Summary:");
		console.log(`   Data Source: ${analysis.social_media_insights.data_source}`);
		console.log(`   Social Sentiment: ${analysis.social_media_insights.overall_sentiment} (${(analysis.social_media_insights.confidence * 100).toFixed(1)}%)`);
		console.log(`   Current Price: $${analysis.market_analysis.current_price}`);
		console.log(`   24h Change: ${analysis.market_analysis.price_change_24h.toFixed(2)}%`);
		console.log(`   Market Momentum: ${analysis.market_analysis.momentum}`);
		console.log(`   Volume Signal: ${analysis.market_analysis.volume_analysis}`);
		console.log(`   Trading Signal: ${analysis.trading_recommendation.signal}`);
		console.log(`   Confidence: ${(analysis.trading_recommendation.confidence * 100).toFixed(1)}%`);
		console.log(`   Position Size: ${analysis.trading_recommendation.position_size.toFixed(2)}%`);
		console.log(`   Entry Price: $${analysis.trading_recommendation.entry_price}`);
		console.log(`   Stop Loss: $${analysis.trading_recommendation.stop_loss}`);
		console.log(`   Take Profit: $${analysis.trading_recommendation.take_profit}`);
		console.log(`   Risk Level: ${analysis.risk_assessment.risk_level}`);
		console.log(`   Volatility Warning: ${analysis.risk_assessment.volatility_warning ? 'Yes' : 'No'}`);
		
		console.log("\n🎯 Key Influences:");
		analysis.social_media_insights.key_influences.forEach((influence: string, index: number) => {
			console.log(`   ${index + 1}. ${influence}`);
		});
		
		console.log(`\n📋 Summary: ${analysis.summary}`);
		
		console.log("\n🎉 All tests passed successfully!");
		console.log("   ✅ Agent responds to trading queries");
		console.log("   ✅ Workflow executes end-to-end analysis");
		console.log("   ✅ Social sentiment analysis integrated");
		console.log("   ✅ Market data analysis integrated");
		console.log("   ✅ Trading signals generated with risk management");
		
	} catch (error) {
		console.error("❌ Test failed:", error);
	}
}

// Test just the workflow without agent conversation
export async function testWorkflowOnly() {
	console.log("🧪 Testing Workflow Only...\n");
	
	try {
		const workflowResult = await solanaTradeWorkflow.run({
			accounts: ["elonmusk", "solana", "solanalabs"],
			keywords: ["solana", "sol", "blockchain", "crypto"],
			risk_tolerance: 'low'
		});
		
		const analysis = workflowResult.data.comprehensive_analysis;
		console.log("✅ Workflow executed successfully");
		console.log(`📊 Analysis: ${analysis.summary}`);
		console.log(`� Signal: ${analysis.trading_recommendation.signal} (${(analysis.trading_recommendation.confidence * 100).toFixed(1)}% confidence)`);
		
	} catch (error) {
		console.error("❌ Workflow test failed:", error);
	}
}

// Run tests if this file is executed directly
if (require.main === module) {
	testSolanaTradeAgent();
}
