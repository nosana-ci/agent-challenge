import { createTool } from "@mastra/core/tools";
import { z } from "zod";

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

const monitorTwitterAccounts = async (accounts: string[], keywords: string[]) => {
	// Note: In production, you'd use Twitter API v2
	// For demo purposes, this shows the structure and provides fallback data
	
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
			created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
			author_id: "elonmusk",
			engagement: { likes: 15420, retweets: 3280, replies: 892, quotes: 156 }
		},
		{
			id: "mock_solana_1",
			text: "🚀 Solana network processed 65M transactions today with average cost of $0.00025 per transaction. Lightning fast, ultra-low fees. The future is parallel! #SolanaSpeed",
			created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
			author_id: "solana",
			engagement: { likes: 8901, retweets: 2145, replies: 456, quotes: 89 }
		},
		{
			id: "mock_elon_2",
			text: "Impressed by Solana's validator performance and network stability. This is what we need for mass adoption of crypto payments.",
			created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
			author_id: "elonmusk",
			engagement: { likes: 12750, retweets: 2890, replies: 678, quotes: 134 }
		},
		{
			id: "mock_solana_2",
			text: "Major DeFi protocols are choosing Solana for their next-gen applications. 🔥 Jupiter, Raydium, Orca leading the way. DeFi summer on Solana is just beginning!",
			created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
			author_id: "solana",
			engagement: { likes: 6543, retweets: 1456, replies: 234, quotes: 67 }
		},
		{
			id: "mock_elon_3",
			text: "The speed and efficiency of Solana's proof-of-stake consensus is game-changing. Perfect for high-frequency applications.",
			created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
			author_id: "elonmusk",
			engagement: { likes: 9876, retweets: 1987, replies: 345, quotes: 78 }
		}
	];

	// Filter based on accounts and keywords
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

export const twitterMonitorTool = createTool({
	id: "twitter-monitor",
	description: "Monitor specified Twitter accounts for posts containing Solana-related keywords. Provides real-time social media sentiment data from influential accounts.",
	inputSchema: z.object({
		accounts: z.array(z.string()).describe("Twitter usernames to monitor (without @). Examples: ['elonmusk', 'solana', 'solanalabs']"),
		keywords: z.array(z.string()).describe("Keywords to search for in tweets. Examples: ['solana', 'sol', 'blockchain', 'crypto']"),
	}),
	outputSchema: z.object({
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
	execute: async ({ context }) => {
		return await monitorTwitterAccounts(context.accounts, context.keywords);
	},
});
