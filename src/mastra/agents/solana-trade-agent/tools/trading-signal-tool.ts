import { createTool } from "@mastra/core/tools";
import { z } from "zod";

interface SentimentData {
	overall_sentiment: number;
	overall_label: string;
	confidence: number;
	sentiment_distribution: {
		positive: number;
		negative: number;
		neutral: number;
	};
}

interface MarketData {
	price: number;
	change_24h_percent: number;
	volume_24h: number;
	market_cap: number;
	momentum_indicator: string;
	volume_signal: string;
	volatility_indicator: string;
	market_sentiment: string;
}

type RiskTolerance = 'low' | 'medium' | 'high';

interface TradingSignal {
	signal: string;
	confidence: number;
	signal_strength: number;
	position_size_percent: number;
	entry_price: number;
	stop_loss: number;
	take_profit: number;
	hold_duration: string;
	risk_reward_ratio: number;
	reasoning: {
		sentiment_impact: string;
		market_impact: string;
		risk_assessment: string;
		technical_analysis: string;
	};
	timestamp: string;
}

const generateTradingSignal = async (
	sentimentData: SentimentData,
	marketData: MarketData,
	riskTolerance: RiskTolerance
): Promise<TradingSignal> => {
	
	// Component weights for signal calculation
	const SENTIMENT_WEIGHT = 0.35;
	const MARKET_MOMENTUM_WEIGHT = 0.30;
	const VOLUME_WEIGHT = 0.20;
	const VOLATILITY_WEIGHT = 0.15;
	
	let signalStrength = 0;
	
	// 1. Sentiment Analysis Component (35%)
	const sentimentScore = sentimentData.overall_sentiment;
	const sentimentConfidence = sentimentData.confidence;
	const sentimentContribution = sentimentScore * sentimentConfidence * SENTIMENT_WEIGHT;
	signalStrength += sentimentContribution;
	
	// 2. Market Momentum Component (30%)
	const momentumScore = getMomentumScore(marketData.momentum_indicator);
	const momentumContribution = momentumScore * MARKET_MOMENTUM_WEIGHT;
	signalStrength += momentumContribution;
	
	// 3. Volume Component (20%)
	const volumeScore = getVolumeScore(marketData.volume_signal);
	const volumeContribution = volumeScore * VOLUME_WEIGHT;
	signalStrength += volumeContribution;
	
	// 4. Volatility Component (15%)
	const volatilityScore = getVolatilityScore(marketData.volatility_indicator);
	const volatilityContribution = volatilityScore * VOLATILITY_WEIGHT;
	signalStrength += volatilityContribution;
	
	// Normalize signal strength to -1 to 1 range
	const normalizedSignalStrength = Math.max(-1, Math.min(1, signalStrength));
	
	// Determine signal type based on strength
	let signal = 'HOLD';
	let confidence = Math.abs(normalizedSignalStrength) * 0.8; // Max 80% confidence
	
	if (normalizedSignalStrength > 0.6) {
		signal = 'STRONG_BUY';
		confidence = Math.min(0.95, confidence + 0.15);
	} else if (normalizedSignalStrength > 0.3) {
		signal = 'BUY';
		confidence = Math.min(0.90, confidence + 0.10);
	} else if (normalizedSignalStrength > 0.1) {
		signal = 'WEAK_BUY';
		confidence = Math.min(0.80, confidence + 0.05);
	} else if (normalizedSignalStrength < -0.6) {
		signal = 'STRONG_SELL';
		confidence = Math.min(0.95, confidence + 0.15);
	} else if (normalizedSignalStrength < -0.3) {
		signal = 'SELL';
		confidence = Math.min(0.90, confidence + 0.10);
	} else if (normalizedSignalStrength < -0.1) {
		signal = 'WEAK_SELL';
		confidence = Math.min(0.80, confidence + 0.05);
	}
	
	// Risk-adjusted position sizing
	const riskMultiplier = getRiskMultiplier(riskTolerance);
	const volatilityAdjustment = getVolatilityAdjustment(marketData.volatility_indicator);
	const basePositionSize = riskMultiplier * volatilityAdjustment;
	const positionSize = basePositionSize * confidence;
	
	// Calculate stop loss and take profit levels
	const { stopLoss, takeProfit, riskRewardRatio } = calculateStopLossTakeProfit(
		marketData.price,
		signal,
		marketData.volatility_indicator,
		riskTolerance
	);
	
	// Determine hold duration based on signal strength and volatility
	const holdDuration = getHoldDuration(signal, marketData.volatility_indicator);
	
	// Generate detailed reasoning
	const reasoning = {
		sentiment_impact: `Sentiment: ${sentimentData.overall_label} (${sentimentScore.toFixed(2)}) with ${(sentimentConfidence * 100).toFixed(1)}% confidence. Distribution: ${sentimentData.sentiment_distribution.positive}+ ${sentimentData.sentiment_distribution.negative}- ${sentimentData.sentiment_distribution.neutral}=`,
		market_impact: `Market: ${marketData.market_sentiment} momentum with ${marketData.momentum_indicator} trend. Volume: ${marketData.volume_signal}, Volatility: ${marketData.volatility_indicator}`,
		risk_assessment: `Risk: ${riskTolerance} tolerance, ${(positionSize * 100).toFixed(2)}% position size, ${marketData.volatility_indicator} volatility adjustment`,
		technical_analysis: `Price: $${marketData.price.toFixed(2)} (${marketData.change_24h_percent.toFixed(2)}% 24h), Volume: $${(marketData.volume_24h / 1e9).toFixed(2)}B, Market Cap: $${(marketData.market_cap / 1e9).toFixed(2)}B`
	};
	
	return {
		signal,
		confidence: Math.round(confidence * 100) / 100,
		signal_strength: Math.round(normalizedSignalStrength * 100) / 100,
		position_size_percent: Math.round(positionSize * 100 * 100) / 100,
		entry_price: marketData.price,
		stop_loss: stopLoss,
		take_profit: takeProfit,
		hold_duration: holdDuration,
		risk_reward_ratio: riskRewardRatio,
		reasoning,
		timestamp: new Date().toISOString(),
	};
};

const getMomentumScore = (momentum: string): number => {
	const momentumMap: { [key: string]: number } = {
		'very_bullish': 0.9,
		'bullish': 0.6,
		'slightly_bullish': 0.3,
		'slightly_bearish': -0.3,
		'bearish': -0.6,
		'very_bearish': -0.9
	};
	return momentumMap[momentum] || 0;
};

const getVolumeScore = (volume: string): number => {
	const volumeMap: { [key: string]: number } = {
		'very_high': 0.5,
		'high': 0.3,
		'medium': 0.1,
		'low': -0.1,
		'very_low': -0.3
	};
	return volumeMap[volume] || 0;
};

const getVolatilityScore = (volatility: string): number => {
	// High volatility can be positive for short-term trades but negative for long-term
	const volatilityMap: { [key: string]: number } = {
		'very_high': -0.2, // Too risky
		'high': 0.1,       // Good for active trading
		'medium': 0.2,     // Optimal
		'low': 0.1,        // Stable but less opportunity
		'very_low': -0.1   // Too stable, less opportunity
	};
	return volatilityMap[volatility] || 0;
};

const getRiskMultiplier = (riskTolerance: RiskTolerance): number => {
	const riskMap: { [key in RiskTolerance]: number } = {
		'low': 0.01,    // 1% max position
		'medium': 0.03, // 3% max position
		'high': 0.05    // 5% max position
	};
	return riskMap[riskTolerance];
};

const getVolatilityAdjustment = (volatility: string): number => {
	const adjustmentMap: { [key: string]: number } = {
		'very_high': 0.5,
		'high': 0.7,
		'medium': 1.0,
		'low': 1.0,
		'very_low': 1.0
	};
	return adjustmentMap[volatility] || 1.0;
};

const calculateStopLossTakeProfit = (
	price: number,
	signal: string,
	volatility: string,
	riskTolerance: RiskTolerance
) => {
	// Base stop loss percentages
	const baseStopLossPercent = riskTolerance === 'low' ? 0.03 : 
								riskTolerance === 'medium' ? 0.05 : 0.08;
	
	// Adjust for volatility
	const volatilityMultiplier = volatility === 'very_high' ? 1.5 :
								 volatility === 'high' ? 1.3 :
								 volatility === 'medium' ? 1.0 :
								 volatility === 'low' ? 0.8 : 0.6;
	
	const stopLossPercent = baseStopLossPercent * volatilityMultiplier;
	
	// Calculate stop loss and take profit
	let stopLoss: number;
	let takeProfit: number;
	
	if (signal.includes('BUY')) {
		stopLoss = price * (1 - stopLossPercent);
		takeProfit = price * (1 + (stopLossPercent * 2.5)); // 2.5:1 risk-reward ratio
	} else if (signal.includes('SELL')) {
		stopLoss = price * (1 + stopLossPercent);
		takeProfit = price * (1 - (stopLossPercent * 2.5));
	} else {
		// HOLD
		stopLoss = price * (1 - stopLossPercent);
		takeProfit = price * (1 + stopLossPercent);
	}
	
	const riskRewardRatio = Math.abs((takeProfit - price) / (price - stopLoss));
	
	return {
		stopLoss: Math.round(stopLoss * 100) / 100,
		takeProfit: Math.round(takeProfit * 100) / 100,
		riskRewardRatio: Math.round(riskRewardRatio * 100) / 100
	};
};

const getHoldDuration = (signal: string, volatility: string): string => {
	if (signal === 'HOLD') return 'Monitor continuously';
	
	const isStrong = signal.includes('STRONG');
	const isVolatile = volatility === 'very_high' || volatility === 'high';
	
	if (isStrong && isVolatile) return '1-3 hours';
	if (isStrong && !isVolatile) return '4-12 hours';
	if (!isStrong && isVolatile) return '30 minutes - 2 hours';
	return '2-6 hours';
};

export const tradingSignalTool = createTool({
	id: "trading-signal-generator",
	description: "Generate comprehensive trading signals based on sentiment analysis and market data. Provides risk-adjusted position sizing and stop-loss/take-profit levels.",
	inputSchema: z.object({
		sentiment_data: z.object({
			overall_sentiment: z.number(),
			overall_label: z.string(),
			confidence: z.number(),
			sentiment_distribution: z.object({
				positive: z.number(),
				negative: z.number(),
				neutral: z.number(),
			}),
		}),
		market_data: z.object({
			price: z.number(),
			change_24h_percent: z.number(),
			volume_24h: z.number(),
			market_cap: z.number(),
			momentum_indicator: z.string(),
			volume_signal: z.string(),
			volatility_indicator: z.string(),
			market_sentiment: z.string(),
		}),
		risk_tolerance: z.enum(['low', 'medium', 'high']),
	}),
	outputSchema: z.object({
		signal: z.string(),
		confidence: z.number(),
		signal_strength: z.number(),
		position_size_percent: z.number(),
		entry_price: z.number(),
		stop_loss: z.number(),
		take_profit: z.number(),
		hold_duration: z.string(),
		risk_reward_ratio: z.number(),
		reasoning: z.object({
			sentiment_impact: z.string(),
			market_impact: z.string(),
			risk_assessment: z.string(),
			technical_analysis: z.string(),
		}),
		timestamp: z.string(),
	}),
	execute: async ({ context }) => {
		return await generateTradingSignal(
			context.sentiment_data,
			context.market_data,
			context.risk_tolerance
		);
	},
});
