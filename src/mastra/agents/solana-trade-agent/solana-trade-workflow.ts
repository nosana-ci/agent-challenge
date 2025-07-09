import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { twitterMonitorTool } from "./tools/twitter-monitor-tool";
import { sentimentAnalysisTool } from "./tools/sentiment-analysis-tool";
import { solanaMarketTool } from "./tools/solana-market-tool";
import { tradingSignalTool } from "./tools/trading-signal-tool";

// Step 1: Monitor social media for Solana-related content
const monitorSocialMedia = createStep({
	id: "monitor-social-media",
	description: "Monitor Twitter accounts for Solana-related content",
	inputSchema: z.object({
		accounts: z.array(z.string()).default(["elonmusk", "solana", "solanalabs"]),
		keywords: z.array(z.string()).default(["solana", "sol", "blockchain", "crypto", "defi"]),
	}),
	outputSchema: z.object({
		tweets: z.array(z.any()),
		tweet_count: z.number(),
		data_source: z.string(),
	}),
	execute: async ({ inputData }) => {
		const result = await twitterMonitorTool.execute({
			context: {
				accounts: inputData.accounts,
				keywords: inputData.keywords,
			},
		});
		
		return {
			tweets: result.tweets,
			tweet_count: result.count,
			data_source: result.source,
		};
	},
});

// Step 2: Analyze sentiment of collected tweets
const analyzeSentiment = createStep({
	id: "analyze-sentiment",
	description: "Analyze sentiment of collected tweets",
	inputSchema: z.object({
		tweets: z.array(z.any()),
	}),
	outputSchema: z.object({
		sentiment_analysis: z.any(),
	}),
	execute: async ({ inputData }) => {
		const result = await sentimentAnalysisTool.execute({
			context: {
				tweets: inputData.tweets,
			},
		});
		
		return {
			sentiment_analysis: result,
		};
	},
});

// Step 3: Fetch current market data
const fetchMarketData = createStep({
	id: "fetch-market-data",
	description: "Fetch current Solana market data",
	inputSchema: z.object({}),
	outputSchema: z.object({
		market_data: z.any(),
	}),
	execute: async ({ inputData }) => {
		const result = await solanaMarketTool.execute({
			context: {},
		});
		
		return {
			market_data: result,
		};
	},
});

// Step 4: Generate trading signal
const generateTradingSignal = createStep({
	id: "generate-trading-signal",
	description: "Generate trading signal based on sentiment and market data",
	inputSchema: z.object({
		sentiment_analysis: z.any(),
		market_data: z.any(),
		risk_tolerance: z.enum(['low', 'medium', 'high']).default('medium'),
	}),
	outputSchema: z.object({
		trading_signal: z.any(),
	}),
	execute: async ({ inputData }) => {
		const result = await tradingSignalTool.execute({
			context: {
				sentiment_data: inputData.sentiment_analysis,
				market_data: inputData.market_data,
				risk_tolerance: inputData.risk_tolerance,
			},
		});
		
		return {
			trading_signal: result,
		};
	},
});

// Step 5: Compile comprehensive analysis
const compileAnalysis = createStep({
	id: "compile-analysis",
	description: "Compile comprehensive trading analysis",
	inputSchema: z.object({
		tweets: z.array(z.any()),
		tweet_count: z.number(),
		data_source: z.string(),
		sentiment_analysis: z.any(),
		market_data: z.any(),
		trading_signal: z.any(),
	}),
	outputSchema: z.object({
		comprehensive_analysis: z.object({
			summary: z.string(),
			social_media_insights: z.object({
				tweets_analyzed: z.number(),
				data_source: z.string(),
				overall_sentiment: z.string(),
				confidence: z.number(),
				key_influences: z.array(z.string()),
			}),
			market_analysis: z.object({
				current_price: z.number(),
				price_change_24h: z.number(),
				volume_analysis: z.string(),
				momentum: z.string(),
				volatility: z.string(),
			}),
			trading_recommendation: z.object({
				signal: z.string(),
				confidence: z.number(),
				position_size: z.number(),
				entry_price: z.number(),
				stop_loss: z.number(),
				take_profit: z.number(),
				hold_duration: z.string(),
				risk_reward_ratio: z.number(),
			}),
			risk_assessment: z.object({
				risk_level: z.string(),
				volatility_warning: z.boolean(),
				market_conditions: z.string(),
			}),
		}),
	}),
	execute: async ({ inputData }) => {
		const {
			tweets,
			tweet_count,
			data_source,
			sentiment_analysis,
			market_data,
			trading_signal,
		} = inputData;
		
		// Extract key influences from tweets
		const keyInfluences = tweets
			.sort((a: any, b: any) => 
				(b.engagement.likes + b.engagement.retweets) - 
				(a.engagement.likes + a.engagement.retweets)
			)
			.slice(0, 3)
			.map((tweet: any) => `@${tweet.author_id}: "${tweet.text.slice(0, 100)}..."`);
		
		// Assess risk level
		const volatilityWarning = market_data.volatility_indicator === 'very_high' || 
								  market_data.volatility_indicator === 'high';
		
		const riskLevel = trading_signal.confidence > 0.8 ? 'Low' :
						  trading_signal.confidence > 0.6 ? 'Medium' : 'High';
		
		// Generate summary
		const summary = `Based on analysis of ${tweet_count} tweets from ${data_source} and current market conditions, ` +
						`the overall sentiment is ${sentiment_analysis.overall_label} with ${(sentiment_analysis.confidence * 100).toFixed(1)}% confidence. ` +
						`Market shows ${market_data.momentum_indicator} momentum with ${market_data.volume_signal} volume. ` +
						`Recommendation: ${trading_signal.signal} with ${(trading_signal.confidence * 100).toFixed(1)}% confidence.`;
		
		return {
			comprehensive_analysis: {
				summary,
				social_media_insights: {
					tweets_analyzed: tweet_count,
					data_source,
					overall_sentiment: sentiment_analysis.overall_label,
					confidence: sentiment_analysis.confidence,
					key_influences: keyInfluences,
				},
				market_analysis: {
					current_price: market_data.price,
					price_change_24h: market_data.change_24h_percent,
					volume_analysis: market_data.volume_signal,
					momentum: market_data.momentum_indicator,
					volatility: market_data.volatility_indicator,
				},
				trading_recommendation: {
					signal: trading_signal.signal,
					confidence: trading_signal.confidence,
					position_size: trading_signal.position_size_percent,
					entry_price: trading_signal.entry_price,
					stop_loss: trading_signal.stop_loss,
					take_profit: trading_signal.take_profit,
					hold_duration: trading_signal.hold_duration,
					risk_reward_ratio: trading_signal.risk_reward_ratio,
				},
				risk_assessment: {
					risk_level: riskLevel,
					volatility_warning: volatilityWarning,
					market_conditions: market_data.market_sentiment,
				},
			},
		};
	},
});

// Create the main workflow
export const solanaTradeWorkflow = createWorkflow({
	id: "solana-trading-workflow",
	inputSchema: z.object({
		accounts: z.array(z.string()).optional(),
		keywords: z.array(z.string()).optional(),
		risk_tolerance: z.enum(['low', 'medium', 'high']).optional(),
	}),
	outputSchema: z.object({
		comprehensive_analysis: z.any(),
	}),
})
.then(monitorSocialMedia)
.then(analyzeSentiment)
.then(fetchMarketData)
.then(generateTradingSignal)
.then(compileAnalysis);
