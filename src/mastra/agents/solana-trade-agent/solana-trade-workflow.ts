import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { solanaTradeComboTool } from "./tools/solana-trade-tool";

// Single comprehensive step using the consolidated tool
const performComprehensiveAnalysis = createStep({
	id: "comprehensive-solana-analysis",
	description: "Perform comprehensive Solana trading analysis using integrated tool",
	inputSchema: z.object({
		accounts: z.array(z.string()).default(["elonmusk", "solana", "solanalabs"]),
		keywords: z.array(z.string()).default(["solana", "sol", "blockchain", "crypto"]),
		risk_tolerance: z.enum(['low', 'medium', 'high']).default('medium'),
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
		// Use the consolidated tool to get all analysis data
		const toolResult = await solanaTradeComboTool.execute({
			context: {
				accounts: inputData.accounts,
				keywords: inputData.keywords,
				risk_tolerance: inputData.risk_tolerance,
			}
		});
		
		// Extract data from tool result
		const {
			twitter_data,
			sentiment_analysis,
			market_data,
			trading_signal,
		} = toolResult;
		
		// Extract key influences from tweets
		const keyInfluences = twitter_data.tweets
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
		const summary = `Based on analysis of ${twitter_data.count} tweets from ${twitter_data.source} and current market conditions, ` +
						`the overall sentiment is ${sentiment_analysis.overall_label} with ${(sentiment_analysis.confidence * 100).toFixed(1)}% confidence. ` +
						`Market shows ${market_data.momentum_indicator} momentum with ${market_data.volume_signal} volume. ` +
						`Recommendation: ${trading_signal.signal} with ${(trading_signal.confidence * 100).toFixed(1)}% confidence.`;
		
		return {
			comprehensive_analysis: {
				summary,
				social_media_insights: {
					tweets_analyzed: twitter_data.count,
					data_source: twitter_data.source,
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

// Create the simplified workflow using the consolidated tool
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
.then(performComprehensiveAnalysis);
