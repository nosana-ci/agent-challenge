#!/usr/bin/env node

/**
 * Test script for Pyth Network Price Feeds Discovery
 * Tests the /v2/price_feeds?query=sol&asset_type=crypto endpoint
 */

async function testPythPriceFeedsDiscovery() {
	console.log('🚀 Testing Pyth Network Price Feeds Discovery\n');
	
	const discoveryUrl = 'https://hermes.pyth.network/v2/price_feeds?query=sol&asset_type=crypto';
	
	try {
		console.log(`🔍 Querying: ${discoveryUrl}\n`);
		
		const response = await fetch(discoveryUrl, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		
		if (!response.ok) {
			throw new Error(`API error: ${response.status} ${response.statusText}`);
		}
		
		const data = await response.json();
		
		console.log(`✅ Successfully discovered ${data.data?.length || 0} price feeds\n`);
		
		// Display all discovered feeds
		console.log('📊 Discovered Price Feeds:');
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
		
		data.data.forEach((feed, index) => {
			console.log(`${index + 1}. ${feed.attributes.symbol}`);
			console.log(`   ID: ${feed.id}`);
			console.log(`   Base: ${feed.attributes.base}`);
			console.log(`   Quote: ${feed.attributes.quote_currency}`);
			console.log(`   Description: ${feed.attributes.description}`);
			console.log(`   Asset Type: ${feed.attributes.asset_type}`);
			console.log('');
		});
		
		// Find SOL/USD specifically
		const solUsdFeeds = data.data.filter(feed => 
			feed.attributes.base.toLowerCase() === 'sol' && 
			feed.attributes.quote_currency.toLowerCase() === 'usd'
		);
		
		console.log(`💰 Found ${solUsdFeeds.length} SOL/USD feed(s):`);
		
		if (solUsdFeeds.length > 0) {
			const primaryFeed = solUsdFeeds[0];
			console.log(`🎯 Primary SOL/USD Feed: ${primaryFeed.attributes.symbol}`);
			console.log(`   Feed ID: ${primaryFeed.id}`);
			console.log(`   Description: ${primaryFeed.attributes.description}`);
			
			// Now get the current price for this feed
			console.log('\n🔄 Fetching current price...');
			await testPriceForFeed(primaryFeed.id, primaryFeed.attributes.symbol);
		}
		
		// Show pagination info if available
		if (data.pagination) {
			console.log('\n📄 Pagination Info:');
			console.log(`   Total Count: ${data.pagination.count}`);
			if (data.pagination.next_cursor) {
				console.log(`   Next Cursor: ${data.pagination.next_cursor}`);
			}
		}
		
	} catch (error) {
		console.error('❌ Error discovering price feeds:', error.message);
	}
}

async function testPriceForFeed(feedId, symbol) {
	try {
		const priceUrl = `https://hermes.pyth.network/v2/updates/price/latest?ids%5B%5D=${feedId}`;
		console.log(`📡 Price endpoint: ${priceUrl}`);
		
		const response = await fetch(priceUrl);
		
		if (!response.ok) {
			throw new Error(`Price API error: ${response.status} ${response.statusText}`);
		}
		
		const data = await response.json();
		
		if (data.parsed && data.parsed.length > 0) {
			const priceData = data.parsed[0];
			const priceValue = parseInt(priceData.price.price);
			const expo = priceData.price.expo;
			const price = priceValue * Math.pow(10, expo);
			
			const confidence = parseInt(priceData.price.conf);
			const confidenceValue = confidence * Math.pow(10, expo);
			
			const publishTime = new Date(priceData.price.publish_time * 1000);
			const dataAge = (Date.now() - publishTime.getTime()) / 1000;
			
			console.log(`✅ ${symbol} Current Price:`);
			console.log(`   💵 Price: $${price.toFixed(2)}`);
			console.log(`   📊 Confidence: ±$${confidenceValue.toFixed(2)}`);
			console.log(`   ⏰ Published: ${publishTime.toISOString()}`);
			console.log(`   🕐 Data Age: ${dataAge.toFixed(1)} seconds`);
			
			// Data freshness indicator
			let freshness = 'stale';
			if (dataAge < 30) freshness = 'very fresh';
			else if (dataAge < 60) freshness = 'fresh';
			else if (dataAge < 300) freshness = 'recent';
			else if (dataAge < 900) freshness = 'aging';
			
			console.log(`   📈 Freshness: ${freshness}`);
		} else {
			console.log('❌ No price data found in response');
		}
		
	} catch (error) {
		console.error('❌ Error fetching price:', error.message);
	}
}

// Test with different queries
async function testMultipleQueries() {
	console.log('\n🔄 Testing different search queries:\n');
	
	const queries = [
		{ query: 'sol', description: 'Search for "sol"' },
		{ query: 'solana', description: 'Search for "solana"' },
		{ query: 'btc', description: 'Search for "btc"' },
		{ query: 'eth', description: 'Search for "eth"' },
	];
	
	for (const test of queries) {
		console.log(`🔍 ${test.description}:`);
		
		try {
			const url = `https://hermes.pyth.network/v2/price_feeds?query=${test.query}&asset_type=crypto`;
			const response = await fetch(url);
			const data = await response.json();
			
			console.log(`   Found ${data.data?.length || 0} feeds`);
			
			// Show first few results
			if (data.data && data.data.length > 0) {
				const firstFew = data.data.slice(0, 3);
				firstFew.forEach(feed => {
					console.log(`   • ${feed.attributes.symbol} (${feed.attributes.base}/${feed.attributes.quote_currency})`);
				});
				if (data.data.length > 3) {
					console.log(`   ... and ${data.data.length - 3} more`);
				}
			}
			
		} catch (error) {
			console.log(`   ❌ Error: ${error.message}`);
		}
		
		console.log('');
	}
}

// Run all tests
async function runAllTests() {
	await testPythPriceFeedsDiscovery();
	await testMultipleQueries();
	console.log('🎉 All tests completed!');
}

runAllTests().catch(console.error);
