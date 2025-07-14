import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// ===== INTERFACES =====

interface TweetData {
	id: string;
	text: string;
	engagement: {
		likes: number;
		retweets: number;
		replies: number;
		quotes: number;
	};
}

interface TwitterSearchResponse {
	data?: {
		id: string;
		text: string;
		created_at: string;
		author_id: string;
		public_metrics: {
			retweet_count: number;
			like_count: number;
			reply_count: number;
			quote_count: number;
		};
	}[];
	meta?: {
		result_count: number;
		newest_id: string;
		oldest_id: string;
	};
}

interface CoinGeckoResponse {
	solana: {
		usd: number;
		usd_24h_change: number;
		usd_24h_vol: number;
		usd_market_cap: number;
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
	timestamp: string;
}

interface SentimentData {
	individual_sentiments: Array<{
		tweet_id: string;
		sentiment_score: number;
		sentiment_label: string;
		confidence: number;
		key_phrases: string[];
		engagement_impact: number;
		raw_word_score: number;
	}>;
	overall_sentiment: number;
	overall_label: string;
	confidence: number;
	total_tweets_analyzed: number;
	sentiment_distribution: {
		positive: number;
		negative: number;
		neutral: number;
	};
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

// ===== TWITTER MONITORING FUNCTIONALITY =====

const monitorTwitterAccounts = async (accounts: string[], keywords: string[]) => {
	const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
	
	if (!TWITTER_BEARER_TOKEN) {
		console.log("Twitter API token not found, using mock data for demonstration");
		return getMockTwitterData(accounts, keywords);
	}

	const accountQuery = accounts.map(acc => `from:${acc}`).join(' OR ');
	const keywordQuery = keywords.join(' OR ');
	const query = `(${accountQuery}) AND (${keywordQuery}) -is:retweet`;
	
	const url = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&tweet.fields=created_at,author_id,public_metrics&max_results=10`;
	
	try {
		const response = await fetch(url, {
			headers: {
				'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
				'Content-Type': 'application/json',
			},
		});
		
		if (!response.ok) {
			console.log(`Twitter API error: ${response.status}, falling back to mock data`);
			return getMockTwitterData(accounts, keywords);
		}
		
		const data = await response.json() as TwitterSearchResponse;
		
		return {
			tweets: data.data?.map(tweet => ({
				id: tweet.id,
				text: tweet.text,
				created_at: tweet.created_at,
				author_id: tweet.author_id,
				engagement: {
					likes: tweet.public_metrics.like_count,
					retweets: tweet.public_metrics.retweet_count,
					replies: tweet.public_metrics.reply_count,
					quotes: tweet.public_metrics.quote_count,
				},
			})) || [],
			count: data.meta?.result_count || 0,
			source: 'twitter_api'
		};
	} catch (error) {
		console.log(`Twitter API error: ${error}, falling back to mock data`);
		return getMockTwitterData(accounts, keywords);
	}
};

const getMockTwitterData = (accounts: string[], keywords: string[]) => {
	const mockTweets = [
		{
			id: "mock_elon_1",
			text: "Solana's parallel processing capabilities are truly remarkable. The future of blockchain scalability is here. #Solana #Web3",
			created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
			author_id: "elonmusk",
			engagement: { likes: 15420, retweets: 3280, replies: 892, quotes: 156 }
		},
		{
			id: "mock_solana_1",
			text: "🚀 Solana network processed 65M transactions today with average cost of $0.00025 per transaction. Lightning fast, ultra-low fees. The future is parallel! #SolanaSpeed",
			created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
			author_id: "solana",
			engagement: { likes: 8901, retweets: 2145, replies: 456, quotes: 89 }
		},
		{
			id: "mock_elon_2",
			text: "Impressed by Solana's validator performance and network stability. This is what we need for mass adoption of crypto payments.",
			created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
			author_id: "elonmusk",
			engagement: { likes: 12750, retweets: 2890, replies: 678, quotes: 134 }
		},
		{
			id: "mock_solana_2",
			text: "Major DeFi protocols are choosing Solana for their next-gen applications. 🔥 Jupiter, Raydium, Orca leading the way. DeFi summer on Solana is just beginning!",
			created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
			author_id: "solana",
			engagement: { likes: 6543, retweets: 1456, replies: 234, quotes: 67 }
		},
		{
			id: "mock_elon_3",
			text: "The speed and efficiency of Solana's proof-of-stake consensus is game-changing. Perfect for high-frequency applications.",
			created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
			author_id: "elonmusk",
			engagement: { likes: 9876, retweets: 1987, replies: 345, quotes: 78 }
		}
	];

	const filteredTweets = mockTweets.filter(tweet => {
		const matchesAccount = accounts.length === 0 || accounts.includes(tweet.author_id);
		const matchesKeyword = keywords.length === 0 || keywords.some(keyword => 
			tweet.text.toLowerCase().includes(keyword.toLowerCase())
		);
		return matchesAccount && matchesKeyword;
	});

	return {
		tweets: filteredTweets,
		count: filteredTweets.length,
		source: 'mock_data'
	};
};

// ===== SENTIMENT ANALYSIS FUNCTIONALITY =====

const analyzeSentiment = async (tweets: TweetData[]): Promise<SentimentData> => {
	const sentimentScores = tweets.map(tweet => {
		const text = tweet.text.toLowerCase();
		let score = 0;
		
		const positiveWords = [
			'bullish', 'moon', 'revolutionary', 'breakthrough', 'amazing', 'incredible', 
			'future', 'innovation', 'scalable', 'fast', 'cheap', 'adoption', 'growth',
			'impressive', 'remarkable', 'efficient', 'perfect', 'excellent', 'outstanding',
			'game-changing', 'leading', 'powerful', 'superior', 'advanced', 'lightning',
			'ultra-low', 'mass adoption', 'next-gen', 'promising', 'solid', 'strong'
		];
		
		const negativeWords = [
			'bearish', 'dump', 'crash', 'problem', 'issue', 'slow', 'expensive', 
			'centralized', 'scam', 'warning', 'risk', 'danger', 'concern', 'worried',
			'decline', 'fall', 'drop', 'weak', 'poor', 'bad', 'terrible', 'awful',
			'disappointing', 'failing', 'broken', 'unstable', 'volatile', 'risky'
		];
		
		// Count positive words
		positiveWords.forEach(word => {
			const regex = new RegExp(`\\b${word}\\b`, 'gi');
			const matches = text.match(regex);
			if (matches) {
				score += matches.length;
			}
		});
		
		// Count negative words
		negativeWords.forEach(word => {
			const regex = new RegExp(`\\b${word}\\b`, 'gi');
			const matches = text.match(regex);
			if (matches) {
				score -= matches.length;
			}
		});
		
		// Engagement-based weight calculation
		const totalEngagement = tweet.engagement.likes + tweet.engagement.retweets + 
								tweet.engagement.replies + tweet.engagement.quotes;
		const engagementWeight = Math.log(totalEngagement + 1) / 10;
		
		const weightedScore = score * (1 + engagementWeight);
		const normalizedScore = Math.max(-1, Math.min(1, weightedScore / 3));
		
		let sentimentLabel = 'neutral';
		if (normalizedScore > 0.3) sentimentLabel = 'positive';
		else if (normalizedScore > 0.6) sentimentLabel = 'very_positive';
		else if (normalizedScore < -0.3) sentimentLabel = 'negative';
		else if (normalizedScore < -0.6) sentimentLabel = 'very_negative';
		
		const confidence = Math.min(0.95, 0.5 + Math.abs(normalizedScore) * 0.3 + engagementWeight * 0.2);
		
		const keyPhrases = [];
		const solanaTerms = ['solana', 'sol', 'blockchain', 'crypto', 'defi', 'nft', 'web3', 'validator', 'consensus', 'proof-of-stake'];
		
		solanaTerms.forEach(term => {
			const regex = new RegExp(`\\b${term}\\b`, 'gi');
			const matches = text.match(regex);
			if (matches) {
				keyPhrases.push(...matches);
			}
		});
		
		return {
			tweet_id: tweet.id,
			sentiment_score: normalizedScore,
			sentiment_label: sentimentLabel,
			confidence: confidence,
			key_phrases: [...new Set(keyPhrases)],
			engagement_impact: engagementWeight,
			raw_word_score: score,
		};
	});
	
	const totalWeight = sentimentScores.reduce((sum, score) => sum + (score.confidence * score.engagement_impact + 1), 0);
	const weightedSentimentSum = sentimentScores.reduce((sum, score) => 
		sum + (score.sentiment_score * (score.confidence * score.engagement_impact + 1)), 0);
	
	const overallSentiment = totalWeight > 0 ? weightedSentimentSum / totalWeight : 0;
	
	let overallLabel = 'neutral';
	if (overallSentiment > 0.2) overallLabel = 'positive';
	else if (overallSentiment > 0.5) overallLabel = 'very_positive';
	else if (overallSentiment < -0.2) overallLabel = 'negative';
	else if (overallSentiment < -0.5) overallLabel = 'very_negative';
	
	const overallConfidence = sentimentScores.reduce((sum, score) => sum + score.confidence, 0) / sentimentScores.length;
	
	return {
		individual_sentiments: sentimentScores,
		overall_sentiment: overallSentiment,
		overall_label: overallLabel,
		confidence: overallConfidence,
		total_tweets_analyzed: sentimentScores.length,
		sentiment_distribution: {
			positive: sentimentScores.filter(s => s.sentiment_score > 0.2).length,
			negative: sentimentScores.filter(s => s.sentiment_score < -0.2).length,
			neutral: sentimentScores.filter(s => Math.abs(s.sentiment_score) <= 0.2).length,
		}
	};
};

// ===== MARKET DATA FUNCTIONALITY =====

const getSolanaMarketData = async (): Promise<MarketData> => {
	try {
		const response = await fetch(
			'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true',
			{
				headers: {
					'Accept': 'application/json',
					'User-Agent': 'SolanaTradeAgent/1.0'
				}
			}
		);
		
		if (!response.ok) {
			console.log(`CoinGecko API error: ${response.status}, using mock data`);
			return getMockMarketData();
		}
		
		const data = await response.json() as CoinGeckoResponse;
		
		if (!data.solana) {
			console.log('No Solana data in response, using mock data');
			return getMockMarketData();
		}
		
		const solData = data.solana;
		
		const price = solData.usd;
		const change24h = solData.usd_24h_change;
		const volume24h = solData.usd_24h_vol;
		const marketCap = solData.usd_market_cap;
		
		// Calculate technical indicators
		const momentum = change24h > 8 ? 'very_bullish' : 
						change24h > 3 ? 'bullish' :
						change24h > 0 ? 'slightly_bullish' :
						change24h > -3 ? 'slightly_bearish' :
						change24h > -8 ? 'bearish' : 'very_bearish';
		
		const volumeRatio = volume24h / marketCap;
		const volumeSignal = volumeRatio > 0.15 ? 'very_high' :
							volumeRatio > 0.08 ? 'high' :
							volumeRatio > 0.04 ? 'medium' :
							volumeRatio > 0.02 ? 'low' : 'very_low';
		
		const volatility = Math.abs(change24h);
		const volatilityIndicator = volatility > 10 ? 'very_high' :
									volatility > 5 ? 'high' :
									volatility > 2 ? 'medium' :
									volatility > 0.5 ? 'low' : 'very_low';
		
		let marketSentiment = 'neutral';
		const sentimentScore = (change24h > 0 ? 1 : -1) * Math.abs(change24h) / 10 + 
							   (volumeRatio > 0.08 ? 0.5 : -0.2);
		
		if (sentimentScore > 0.5) marketSentiment = 'bullish';
		else if (sentimentScore > 0.8) marketSentiment = 'very_bullish';
		else if (sentimentScore < -0.5) marketSentiment = 'bearish';
		else if (sentimentScore < -0.8) marketSentiment = 'very_bearish';
		
		return {
			price,
			change_24h_percent: change24h,
			volume_24h: volume24h,
			market_cap: marketCap,
			momentum_indicator: momentum,
			volume_signal: volumeSignal,
			volatility_indicator: volatilityIndicator,
			market_sentiment: marketSentiment,
			timestamp: new Date().toISOString(),
		};
		
	} catch (error) {
		console.log(`Market data fetch error: ${error}, using mock data`);
		return getMockMarketData();
	}
};

const getMockMarketData = (): MarketData => {
	const basePrice = 145.00;
	const priceVariation = (Math.random() - 0.5) * 20;
	const price = basePrice + priceVariation;
	
	const baseChange = 2.5;
	const changeVariation = (Math.random() - 0.5) * 10;
	const change24h = baseChange + changeVariation;
	
	const baseVolume = 2500000000;
	const volumeVariation = Math.random() * 1000000000;
	const volume24h = baseVolume + volumeVariation;
	
	const marketCap = price * 470000000;
	
	const momentum = change24h > 8 ? 'very_bullish' : 
					change24h > 3 ? 'bullish' :
					change24h > 0 ? 'slightly_bullish' :
					change24h > -3 ? 'slightly_bearish' :
					change24h > -8 ? 'bearish' : 'very_bearish';
	
	const volumeRatio = volume24h / marketCap;
	const volumeSignal = volumeRatio > 0.15 ? 'very_high' :
						volumeRatio > 0.08 ? 'high' :
						volumeRatio > 0.04 ? 'medium' :
						volumeRatio > 0.02 ? 'low' : 'very_low';
	
	const volatility = Math.abs(change24h);
	const volatilityIndicator = volatility > 10 ? 'very_high' :
								volatility > 5 ? 'high' :
								volatility > 2 ? 'medium' :
								volatility > 0.5 ? 'low' : 'very_low';
	
	let marketSentiment = 'neutral';
	const sentimentScore = (change24h > 0 ? 1 : -1) * Math.abs(change24h) / 10 + 
						   (volumeRatio > 0.08 ? 0.5 : -0.2);
	
	if (sentimentScore > 0.5) marketSentiment = 'bullish';
	else if (sentimentScore > 0.8) marketSentiment = 'very_bullish';
	else if (sentimentScore < -0.5) marketSentiment = 'bearish';
	else if (sentimentScore < -0.8) marketSentiment = 'very_bearish';
	
	return {
		price: Math.round(price * 100) / 100,
		change_24h_percent: Math.round(change24h * 100) / 100,
		volume_24h: Math.round(volume24h),
		market_cap: Math.round(marketCap),
		momentum_indicator: momentum,
		volume_signal: volumeSignal,
		volatility_indicator: volatilityIndicator,
		market_sentiment: marketSentiment,
		timestamp: new Date().toISOString(),
	};
};

// ===== TRADING SIGNAL FUNCTIONALITY =====

const generateTradingSignal = async (
	sentimentData: SentimentData,
	marketData: MarketData,
	riskTolerance: RiskTolerance
): Promise<TradingSignal> => {
	
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
	
	const normalizedSignalStrength = Math.max(-1, Math.min(1, signalStrength));
	
	let signal = 'HOLD';
	let confidence = Math.abs(normalizedSignalStrength) * 0.8;
	
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
	
	const riskMultiplier = getRiskMultiplier(riskTolerance);
	const volatilityAdjustment = getVolatilityAdjustment(marketData.volatility_indicator);
	const basePositionSize = riskMultiplier * volatilityAdjustment;
	const positionSize = basePositionSize * confidence;
	
	const { stopLoss, takeProfit, riskRewardRatio } = calculateStopLossTakeProfit(
		marketData.price,
		signal,
		marketData.volatility_indicator,
		riskTolerance
	);
	
	const holdDuration = getHoldDuration(signal, marketData.volatility_indicator);
	
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

// ===== HELPER FUNCTIONS =====

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
	const volatilityMap: { [key: string]: number } = {
		'very_high': -0.2,
		'high': 0.1,
		'medium': 0.2,
		'low': 0.1,
		'very_low': -0.1
	};
	return volatilityMap[volatility] || 0;
};

const getRiskMultiplier = (riskTolerance: RiskTolerance): number => {
	const riskMap: { [key in RiskTolerance]: number } = {
		'low': 0.01,
		'medium': 0.03,
		'high': 0.05
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
	const baseStopLossPercent = riskTolerance === 'low' ? 0.03 : 
								riskTolerance === 'medium' ? 0.05 : 0.08;
	
	const volatilityMultiplier = volatility === 'very_high' ? 1.5 :
								 volatility === 'high' ? 1.3 :
								 volatility === 'medium' ? 1.0 :
								 volatility === 'low' ? 0.8 : 0.6;
	
	const stopLossPercent = baseStopLossPercent * volatilityMultiplier;
	
	let stopLoss: number;
	let takeProfit: number;
	
	if (signal.includes('BUY')) {
		stopLoss = price * (1 - stopLossPercent);
		takeProfit = price * (1 + (stopLossPercent * 2.5));
	} else if (signal.includes('SELL')) {
		stopLoss = price * (1 + stopLossPercent);
		takeProfit = price * (1 - (stopLossPercent * 2.5));
	} else {
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

// ===== MAIN COMPREHENSIVE ANALYSIS FUNCTION =====

const performComprehensiveAnalysis = async (
	accounts: string[],
	keywords: string[],
	riskTolerance: RiskTolerance
) => {
	// 1. Monitor Twitter for sentiment data
	const twitterData = await monitorTwitterAccounts(accounts, keywords);
	
	// 2. Analyze sentiment from tweets
	const sentimentData = await analyzeSentiment(twitterData.tweets);
	
	// 3. Get market data
	const marketData = await getSolanaMarketData();
	
	// 4. Generate trading signal
	const tradingSignal = await generateTradingSignal(sentimentData, marketData, riskTolerance);
	
	return {
		twitter_data: twitterData,
		sentiment_analysis: sentimentData,
		market_data: marketData,
		trading_signal: tradingSignal,
		analysis_timestamp: new Date().toISOString(),
	};
};

// ===== CONSOLIDATED TOOL EXPORT =====

export const solanaTradeComboTool = createTool({
	id: "solana-trade-tool",
	description: "Comprehensive Solana trading analysis tool that combines Twitter monitoring, sentiment analysis, market data, and trading signal generation into a single integrated analysis.",
	inputSchema: z.object({
		accounts: z.array(z.string()).default(["elonmusk", "solana", "solanalabs"]).describe("Twitter usernames to monitor (without @)"),
		keywords: z.array(z.string()).default(["solana", "sol", "blockchain", "crypto"]).describe("Keywords to search for in tweets"),
		risk_tolerance: z.enum(['low', 'medium', 'high']).default('medium').describe("Risk tolerance level for position sizing"),
	}),
	outputSchema: z.object({
		twitter_data: z.object({
			tweets: z.array(z.object({
				id: z.string(),
				text: z.string(),
				created_at: z.string(),
				author_id: z.string(),
				engagement: z.object({
					likes: z.number(),
					retweets: z.number(),
					replies: z.number(),
					quotes: z.number(),
				}),
			})),
			count: z.number(),
			source: z.string(),
		}),
		sentiment_analysis: z.object({
			individual_sentiments: z.array(z.object({
				tweet_id: z.string(),
				sentiment_score: z.number(),
				sentiment_label: z.string(),
				confidence: z.number(),
				key_phrases: z.array(z.string()),
				engagement_impact: z.number(),
				raw_word_score: z.number(),
			})),
			overall_sentiment: z.number(),
			overall_label: z.string(),
			confidence: z.number(),
			total_tweets_analyzed: z.number(),
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
			timestamp: z.string(),
		}),
		trading_signal: z.object({
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
		analysis_timestamp: z.string(),
	}),
	execute: async ({ context }) => {
		return await performComprehensiveAnalysis(
			context.accounts,
			context.keywords,
			context.risk_tolerance
		);
	},
});
