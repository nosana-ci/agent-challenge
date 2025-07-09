import { createTool } from "@mastra/core/tools";
import { z } from "zod";

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

const analyzeSentiment = async (tweets: TweetData[]) => {
	// Advanced sentiment analysis using keyword matching and engagement weighting
	// In production, you'd use a sentiment analysis API like Google Cloud Natural Language API
	
	const sentimentScores = tweets.map(tweet => {
		const text = tweet.text.toLowerCase();
		let score = 0;
		
		// Positive indicators for Solana/crypto
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
		const engagementWeight = Math.log(totalEngagement + 1) / 10; // Logarithmic scaling
		
		// Apply engagement weight to sentiment score
		const weightedScore = score * (1 + engagementWeight);
		
		// Normalize score to -1 to 1 range
		const normalizedScore = Math.max(-1, Math.min(1, weightedScore / 3));
		
		// Determine sentiment label
		let sentimentLabel = 'neutral';
		if (normalizedScore > 0.3) sentimentLabel = 'positive';
		else if (normalizedScore > 0.6) sentimentLabel = 'very_positive';
		else if (normalizedScore < -0.3) sentimentLabel = 'negative';
		else if (normalizedScore < -0.6) sentimentLabel = 'very_negative';
		
		// Calculate confidence based on absolute score and engagement
		const confidence = Math.min(0.95, 0.5 + Math.abs(normalizedScore) * 0.3 + engagementWeight * 0.2);
		
		// Extract key phrases related to Solana
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
			key_phrases: [...new Set(keyPhrases)], // Remove duplicates
			engagement_impact: engagementWeight,
			raw_word_score: score,
		};
	});
	
	// Calculate overall sentiment
	const totalWeight = sentimentScores.reduce((sum, score) => sum + (score.confidence * score.engagement_impact + 1), 0);
	const weightedSentimentSum = sentimentScores.reduce((sum, score) => 
		sum + (score.sentiment_score * (score.confidence * score.engagement_impact + 1)), 0);
	
	const overallSentiment = totalWeight > 0 ? weightedSentimentSum / totalWeight : 0;
	
	// Determine overall label
	let overallLabel = 'neutral';
	if (overallSentiment > 0.2) overallLabel = 'positive';
	else if (overallSentiment > 0.5) overallLabel = 'very_positive';
	else if (overallSentiment < -0.2) overallLabel = 'negative';
	else if (overallSentiment < -0.5) overallLabel = 'very_negative';
	
	// Calculate overall confidence
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

export const sentimentAnalysisTool = createTool({
	id: "sentiment-analysis",
	description: "Analyze sentiment of tweets and their potential trading implications. Provides weighted sentiment scores based on engagement metrics.",
	inputSchema: z.object({
		tweets: z.array(z.object({
			id: z.string(),
			text: z.string(),
			engagement: z.object({
				likes: z.number(),
				retweets: z.number(),
				replies: z.number(),
				quotes: z.number(),
			}),
		})),
	}),
	outputSchema: z.object({
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
	execute: async ({ context }) => {
		return await analyzeSentiment(context.tweets);
	},
});
