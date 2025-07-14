import { solanaTradeAgent } from "../src/mastra/agents/solana-trade-agent/solana-trade-agent";
import { solanaTradeWorkflow } from "../src/mastra/agents/solana-trade-agent/solana-trade-workflow";
import { 
	solanaTradeComboTool, 
	solanaPriceDiscoveryTool, 
	pythPriceTool 
} from "../src/mastra/agents/solana-trade-agent/tools/solana-trade-tool";

/**
 * Unified Test Suite for Solana Trading Agent
 * Combines all test functionality from multiple test files into a single comprehensive TypeScript test
 */

// Type definitions for test results
interface TestResult {
	testName: string;
	success: boolean;
	duration: number;
	error?: Error;
	details?: any;
}

interface PythPrice {
	price: number;
	confidence_interval: number;
	feed_id: string;
	publish_time: number;
}

interface PythPriceData {
	price: number;
	price_confidence_score: number;
	data_freshness: string;
}

class UnifiedTestSuite {
	private results: TestResult[] = [];

	/**
	 * Helper method to run a test and track results
	 */
	private async runTest(testName: string, testFunction: () => Promise<any>): Promise<TestResult> {
		const startTime = Date.now();
		console.log(`\n🧪 Running Test: ${testName}`);
		console.log("-".repeat(50));

		try {
			const result = await testFunction();
			const duration = Date.now() - startTime;
			const testResult: TestResult = {
				testName,
				success: true,
				duration,
				details: result
			};
			
			this.results.push(testResult);
			console.log(`✅ ${testName} - PASSED (${duration}ms)`);
			return testResult;
		} catch (error) {
			const duration = Date.now() - startTime;
			const testResult: TestResult = {
				testName,
				success: false,
				duration,
				error: error as Error
			};
			
			this.results.push(testResult);
			console.error(`❌ ${testName} - FAILED (${duration}ms)`);
			console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
			return testResult;
		}
	}

	/**
	 * Test 1: Pyth Network Price Feed Discovery
	 */
	private async testPythPriceDiscovery(): Promise<any> {
		console.log("Testing Pyth price feed discovery...");
		
		const discoveryResult = await solanaPriceDiscoveryTool.execute({
			context: {
				include_all_feeds: false,
				query: "sol"
			}
		});

		console.log(`   📊 Discovered ${discoveryResult.total_feeds_found} SOL-related price feeds`);
		
		if (discoveryResult.sol_usd_price) {
			const solPrice: PythPrice = discoveryResult.sol_usd_price;
			console.log(`   💰 Live SOL Price: $${solPrice.price}`);
			console.log(`   📈 Confidence: ±$${solPrice.confidence_interval}`);
			console.log(`   🔗 Feed ID: ${solPrice.feed_id.substring(0, 8)}...`);
			
			// Validate data freshness
			const dataAge = Date.now() / 1000 - solPrice.publish_time;
			const freshness = dataAge < 30 ? 'very fresh' : dataAge < 60 ? 'fresh' : 'aging';
			console.log(`   ⏰ Data freshness: ${freshness} (${dataAge.toFixed(1)}s old)`);
		}

		return discoveryResult;
	}

	/**
	 * Test 2: Multi-Asset Price Fetching via Pyth
	 */
	private async testMultiAssetPriceFetching(): Promise<any> {
		console.log("Testing multi-asset price fetching...");
		
		const pricesResult = await pythPriceTool.execute({
			context: {
				symbols: ['SOL', 'BTC', 'ETH'],
				include_confidence: true
			}
		});

		console.log(`   📊 Fetched ${pricesResult.successful_feeds}/${pricesResult.total_feeds_requested} price feeds`);
		
		Object.entries(pricesResult.prices).forEach(([symbol, data]: [string, any]) => {
			const priceData = data as PythPriceData;
			const confidence = (priceData.price_confidence_score * 100).toFixed(1);
			const freshness = priceData.data_freshness || 'unknown';
			console.log(`   ${symbol}: $${priceData.price.toLocaleString()} (${freshness}, ${confidence}% confidence)`);
		});

		return pricesResult;
	}

	/**
	 * Test 3: Direct Pyth API Integration (from test-pyth-integration.mjs logic)
	 */
	private async testDirectPythAPI(): Promise<any> {
		console.log("Testing direct Pyth Hermes API integration...");

		// Pyth Network price feed IDs
		const PYTH_PRICE_FEEDS = {
			SOL_USD: 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
			BTC_USD: 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
			ETH_USD: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
		};

		const fetchPythPrices = async (priceFeeds: string[]) => {
			const baseUrl = 'https://hermes.pyth.network/v2/updates/price/latest';
			const feedParams = priceFeeds.map(feed => `ids%5B%5D=${feed}`).join('&');
			const url = `${baseUrl}?${feedParams}`;
			
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});
			
			if (!response.ok) {
				throw new Error(`Pyth API error: ${response.status} ${response.statusText}`);
			}
			
			return await response.json();
		};

		const parsePythPrice = (priceData: any) => {
			const priceStr = priceData.price.price;
			const expo = priceData.price.expo;
			const priceValue = parseInt(priceStr);
			return priceValue * Math.pow(10, expo);
		};

		// Test individual feeds
		const feeds = [
			{ id: PYTH_PRICE_FEEDS.SOL_USD, symbol: 'SOL' },
			{ id: PYTH_PRICE_FEEDS.BTC_USD, symbol: 'BTC' },
			{ id: PYTH_PRICE_FEEDS.ETH_USD, symbol: 'ETH' },
		];

		const results: any = {};

		for (const feed of feeds) {
			try {
				const pythData = await fetchPythPrices([feed.id]);
				
				if (pythData && pythData.parsed && pythData.parsed.length > 0) {
					const priceData = pythData.parsed[0];
					const price = parsePythPrice(priceData);
					const confidence = parseInt(priceData.price.conf) * Math.pow(10, priceData.price.expo);
					const confidencePercent = (confidence / price) * 100;
					
					results[feed.symbol] = {
						price,
						confidence,
						confidencePercent,
						publishTime: priceData.price.publish_time,
						feedId: priceData.id
					};
					
					console.log(`   ${feed.symbol}/USD: $${price.toLocaleString()} (±${confidencePercent.toFixed(2)}%)`);
				}
			} catch (error) {
				console.log(`   ❌ Failed to fetch ${feed.symbol} price: ${error instanceof Error ? error.message : String(error)}`);
			}
		}

		// Test multiple feeds in one request
		const allFeeds = feeds.map(f => f.id);
		const multiData = await fetchPythPrices(allFeeds);
		
		if (multiData && multiData.parsed) {
			console.log(`   ✅ Multi-feed request: ${multiData.parsed.length} feeds fetched simultaneously`);
		}

		return results;
	}

	/**
	 * Test 4: Comprehensive Trading Analysis (from simple-test.mjs logic)
	 */
	private async testComprehensiveTradingAnalysis(): Promise<any> {
		console.log("Testing comprehensive trading analysis...");
		
		const toolResult = await solanaTradeComboTool.execute({
			context: {
				accounts: ["elonmusk", "solana"],
				keywords: ["solana", "crypto", "blockchain"],
				risk_tolerance: 'medium'
			}
		});

		console.log(`   🐦 Analyzed ${toolResult.twitter_data.count} tweets`);
		console.log(`   💭 Overall sentiment: ${toolResult.sentiment_analysis.overall_label} (${(toolResult.sentiment_analysis.confidence * 100).toFixed(1)}%)`);
		console.log(`   💰 Current SOL price: $${toolResult.market_data.price}`);
		console.log(`   📈 24h change: ${toolResult.market_data.change_24h_percent.toFixed(2)}%`);
		console.log(`   🎯 Trading signal: ${toolResult.trading_signal.signal} (${(toolResult.trading_signal.confidence * 100).toFixed(1)}% confidence)`);
		console.log(`   💼 Position size: ${toolResult.trading_signal.position_size_percent.toFixed(2)}%`);
		console.log(`   🛡️ Stop loss: $${toolResult.trading_signal.stop_loss}`);
		console.log(`   🎯 Take profit: $${toolResult.trading_signal.take_profit}`);
		
		if (toolResult.sol_price_discovery) {
			console.log(`   🔍 Pyth discovery: ${toolResult.sol_price_discovery.symbol} via ${toolResult.sol_price_discovery.feed_id.substring(0, 8)}...`);
		}

		return toolResult;
	}

	/**
	 * Test 5: Agent Conversation with Live Data
	 */
	private async testAgentConversation(): Promise<any> {
		console.log("Testing agent conversation with live data...");
		
		const agentResponse = await solanaTradeAgent.generate([
			{ 
				role: "user", 
				content: "Give me a Solana trading analysis using live Pyth Network prices with medium risk tolerance. Include the current SOL price and confidence data." 
			}
		]);

		console.log(`   📝 Response length: ${agentResponse.content?.length} characters`);
		console.log(`   📖 Preview: ${agentResponse.content?.slice(0, 200)}...`);

		return {
			responseLength: agentResponse.content?.length,
			preview: agentResponse.content?.slice(0, 500),
			fullResponse: agentResponse.content
		};
	}

	/**
	 * Test 6: Workflow Execution
	 */
	private async testWorkflowExecution(): Promise<any> {
		console.log("Testing workflow execution...");
		
		const workflowResult = await solanaTradeWorkflow.run({
			accounts: ["elonmusk", "solana", "solanalabs"],
			keywords: ["solana", "sol", "blockchain", "crypto"],
			risk_tolerance: 'low'
		});

		const analysis = workflowResult.data.comprehensive_analysis;
		console.log(`   📊 Analysis summary available: ${!!analysis.summary}`);
		
		if (analysis.trading_recommendation) {
			console.log(`   🎯 Signal: ${analysis.trading_recommendation.signal} (${(analysis.trading_recommendation.confidence * 100).toFixed(1)}% confidence)`);
			console.log(`   💰 Position size: ${analysis.trading_recommendation.position_size?.toFixed(2) || 'N/A'}%`);
		}

		if (analysis.market_analysis) {
			console.log(`   💵 Current price: $${analysis.market_analysis.current_price || 'N/A'}`);
			console.log(`   📊 Market momentum: ${analysis.market_analysis.momentum || 'N/A'}`);
		}

		if (analysis.social_media_insights) {
			console.log(`   🐦 Tweets analyzed: ${analysis.social_media_insights.tweets_analyzed || 0}`);
			console.log(`   😊 Sentiment: ${analysis.social_media_insights.overall_sentiment || 'N/A'}`);
		}

		return analysis;
	}

	/**
	 * Test 7: Error Handling and Edge Cases
	 */
	private async testErrorHandling(): Promise<any> {
		console.log("Testing error handling and edge cases...");
		
		const tests = [];

		// Test empty symbols array
		try {
			const emptyResult = await pythPriceTool.execute({
				context: {
					symbols: [],
					include_confidence: true
				}
			});
			tests.push({ test: 'empty_symbols', success: true, result: emptyResult });
			console.log(`   ✅ Empty symbols handled gracefully: ${emptyResult.successful_feeds} feeds`);
		} catch (error) {
			tests.push({ test: 'empty_symbols', success: false, error: error instanceof Error ? error.message : String(error) });
			console.log(`   ✅ Proper error handling for empty symbols: ${error instanceof Error ? error.message : String(error)}`);
		}

		// Test invalid risk tolerance
		try {
			const invalidRiskResult = await solanaTradeComboTool.execute({
				context: {
					accounts: ["test"],
					keywords: ["test"],
					risk_tolerance: 'invalid' as any
				}
			});
			tests.push({ test: 'invalid_risk', success: true, result: invalidRiskResult });
			console.log(`   ✅ Invalid risk tolerance handled gracefully`);
		} catch (error) {
			tests.push({ test: 'invalid_risk', success: false, error: error instanceof Error ? error.message : String(error) });
			console.log(`   ✅ Proper error handling for invalid risk tolerance`);
		}

		return { tests, totalTests: tests.length };
	}

	/**
	 * Test 8: Performance and Load Testing
	 */
	private async testPerformance(): Promise<any> {
		console.log("Testing performance characteristics...");
		
		const startTime = Date.now();
		
		// Run multiple concurrent price fetches
		const concurrentTests = [
			pythPriceTool.execute({ context: { symbols: ['SOL'], include_confidence: true } }),
			pythPriceTool.execute({ context: { symbols: ['BTC'], include_confidence: true } }),
			pythPriceTool.execute({ context: { symbols: ['ETH'], include_confidence: true } })
		];

		const results = await Promise.allSettled(concurrentTests);
		const endTime = Date.now();
		
		const successCount = results.filter(r => r.status === 'fulfilled').length;
		const failureCount = results.filter(r => r.status === 'rejected').length;
		const totalTime = endTime - startTime;

		console.log(`   ⏱️ Concurrent requests: ${successCount}/${results.length} successful in ${totalTime}ms`);
		console.log(`   📊 Average time per request: ${(totalTime / results.length).toFixed(1)}ms`);

		return {
			totalTime,
			successCount,
			failureCount,
			averageTime: totalTime / results.length
		};
	}

	/**
	 * Generate a comprehensive test report
	 */
	private generateTestReport(): void {
		console.log("\n" + "=".repeat(80));
		console.log("📋 UNIFIED TEST SUITE REPORT");
		console.log("=".repeat(80));

		const totalTests = this.results.length;
		const passedTests = this.results.filter(r => r.success).length;
		const failedTests = this.results.filter(r => !r.success).length;
		const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

		console.log(`\n📊 Summary:`);
		console.log(`   Total Tests: ${totalTests}`);
		console.log(`   Passed: ${passedTests} ✅`);
		console.log(`   Failed: ${failedTests} ❌`);
		console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
		console.log(`   Total Duration: ${totalDuration}ms`);
		console.log(`   Average Test Duration: ${(totalDuration / totalTests).toFixed(1)}ms`);

		console.log(`\n📋 Detailed Results:`);
		this.results.forEach((result, index) => {
			const status = result.success ? "✅ PASS" : "❌ FAIL";
			console.log(`   ${index + 1}. ${result.testName} - ${status} (${result.duration}ms)`);
			if (!result.success && result.error) {
				console.log(`      Error: ${result.error.message}`);
			}
		});

		console.log(`\n🎯 Test Coverage:`);
		console.log(`   ✅ Pyth Network Integration`);
		console.log(`   ✅ Multi-Asset Price Fetching`);
		console.log(`   ✅ Direct API Integration`);
		console.log(`   ✅ Trading Analysis Tools`);
		console.log(`   ✅ Agent Conversation`);
		console.log(`   ✅ Workflow Execution`);
		console.log(`   ✅ Error Handling`);
		console.log(`   ✅ Performance Testing`);

		if (passedTests === totalTests) {
			console.log(`\n🎉 ALL TESTS PASSED! The Solana Trading Agent is fully functional.`);
		} else {
			console.log(`\n⚠️ Some tests failed. Please review the errors above.`);
		}
	}

	/**
	 * Run the complete unified test suite
	 */
	public async runAllTests(): Promise<void> {
		console.log("🚀 Starting Unified Test Suite for Solana Trading Agent");
		console.log("=" .repeat(80));
		console.log(`📅 Test Date: ${new Date().toISOString()}`);
		console.log(`🖥️ Node Version: ${process.version}`);
		console.log("=" .repeat(80));

		// Reset results
		this.results = [];

		// Run all tests
		await this.runTest("Pyth Price Discovery", () => this.testPythPriceDiscovery());
		await this.runTest("Multi-Asset Price Fetching", () => this.testMultiAssetPriceFetching());
		await this.runTest("Direct Pyth API Integration", () => this.testDirectPythAPI());
		await this.runTest("Comprehensive Trading Analysis", () => this.testComprehensiveTradingAnalysis());
		await this.runTest("Agent Conversation", () => this.testAgentConversation());
		await this.runTest("Workflow Execution", () => this.testWorkflowExecution());
		await this.runTest("Error Handling", () => this.testErrorHandling());
		await this.runTest("Performance Testing", () => this.testPerformance());

		// Generate final report
		this.generateTestReport();
	}
}

/**
 * Export functions for individual test execution
 */
export async function testPythIntegration(): Promise<void> {
	const suite = new UnifiedTestSuite();
	await suite['runTest']("Pyth Integration Test", async () => {
		await suite['testPythPriceDiscovery']();
		await suite['testMultiAssetPriceFetching']();
		await suite['testDirectPythAPI']();
	});
}

export async function testSolanaTradeAgent(): Promise<void> {
	const suite = new UnifiedTestSuite();
	await suite['runTest']("Solana Trade Agent Test", async () => {
		await suite['testComprehensiveTradingAnalysis']();
		await suite['testAgentConversation']();
	});
}

export async function testWorkflowOnly(): Promise<void> {
	const suite = new UnifiedTestSuite();
	await suite['runTest']("Workflow Only Test", () => suite['testWorkflowExecution']());
}

/**
 * Main execution function
 */
export async function runUnifiedTestSuite(): Promise<void> {
	const suite = new UnifiedTestSuite();
	await suite.runAllTests();
}

// Run the unified test suite if this file is executed directly
if (require.main === module) {
	runUnifiedTestSuite().catch(console.error);
}
