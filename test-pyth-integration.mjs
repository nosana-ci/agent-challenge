#!/usr/bin/env node

/**
 * Test script for Pyth Network Hermes API integration
 * This script tests the Pyth price fetching functionality directly
 */

// Pyth Network price feed IDs
const PYTH_PRICE_FEEDS = {
	SOL_USD: 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
	BTC_USD: 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
	ETH_USD: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
};

async function fetchPythPrices(priceFeeds) {
	try {
		const baseUrl = 'https://hermes.pyth.network/v2/updates/price/latest';
		const feedParams = priceFeeds.map(feed => `ids%5B%5D=${feed}`).join('&');
		const url = `${baseUrl}?${feedParams}`;
		
		console.log(`🔍 Fetching Pyth prices from: ${url}`);
		
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});
		
		if (!response.ok) {
			throw new Error(`Pyth API error: ${response.status} ${response.statusText}`);
		}
		
		const data = await response.json();
		console.log(`✅ Successfully fetched ${data.parsed?.length || 0} price feeds from Pyth`);
		
		return data;
	} catch (error) {
		console.error('❌ Error fetching Pyth prices:', error.message);
		return null;
	}
}

function parsePythPrice(priceData) {
	const priceStr = priceData.price.price;
	const expo = priceData.price.expo;
	const priceValue = parseInt(priceStr);
	return priceValue * Math.pow(10, expo);
}

function formatPrice(price, symbol) {
	if (symbol === 'BTC') {
		return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	} else if (symbol === 'ETH') {
		return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	} else if (symbol === 'SOL') {
		return `$${price.toFixed(2)}`;
	}
	return `$${price.toFixed(2)}`;
}

function getDataFreshness(publishTime) {
	const currentTime = Date.now() / 1000;
	const dataAge = currentTime - publishTime;
	
	if (dataAge < 30) return 'very_fresh (< 30s)';
	if (dataAge < 60) return 'fresh (< 1m)';
	if (dataAge < 300) return 'recent (< 5m)';
	if (dataAge < 900) return 'aging (< 15m)';
	return 'stale (> 15m)';
}

async function testPythIntegration() {
	console.log('🚀 Testing Pyth Network Hermes API Integration\n');
	
	// Test individual feeds
	const feeds = [
		{ id: PYTH_PRICE_FEEDS.SOL_USD, symbol: 'SOL' },
		{ id: PYTH_PRICE_FEEDS.BTC_USD, symbol: 'BTC' },
		{ id: PYTH_PRICE_FEEDS.ETH_USD, symbol: 'ETH' },
	];
	
	for (const feed of feeds) {
		console.log(`\n📊 Testing ${feed.symbol} price feed...`);
		const pythData = await fetchPythPrices([feed.id]);
		
		if (pythData && pythData.parsed && pythData.parsed.length > 0) {
			const priceData = pythData.parsed[0];
			const price = parsePythPrice(priceData);
			const confidence = parseInt(priceData.price.conf) * Math.pow(10, priceData.price.expo);
			const confidencePercent = (confidence / price) * 100;
			const freshness = getDataFreshness(priceData.price.publish_time);
			
			console.log(`  ✅ ${feed.symbol}/USD: ${formatPrice(price, feed.symbol)}`);
			console.log(`  📈 Confidence: ±${formatPrice(confidence, feed.symbol)} (${confidencePercent.toFixed(2)}%)`);
			console.log(`  ⏰ Published: ${new Date(priceData.price.publish_time * 1000).toISOString()}`);
			console.log(`  🕐 Freshness: ${freshness}`);
			console.log(`  🔗 Feed ID: ${priceData.id}`);
		} else {
			console.log(`  ❌ Failed to fetch ${feed.symbol} price`);
		}
	}
	
	// Test multiple feeds in one request
	console.log('\n🔄 Testing multiple feeds in single request...');
	const allFeeds = feeds.map(f => f.id);
	const multiData = await fetchPythPrices(allFeeds);
	
	if (multiData && multiData.parsed) {
		console.log(`✅ Successfully fetched ${multiData.parsed.length} feeds in one request:`);
		multiData.parsed.forEach(priceData => {
			const symbol = feeds.find(f => f.id === priceData.id)?.symbol || 'Unknown';
			const price = parsePythPrice(priceData);
			console.log(`  • ${symbol}: ${formatPrice(price, symbol)}`);
		});
	} else {
		console.log('❌ Failed to fetch multiple feeds');
	}
	
	// Test error handling with invalid feed ID
	console.log('\n🔧 Testing error handling with invalid feed ID...');
	const invalidData = await fetchPythPrices(['invalid-feed-id']);
	if (!invalidData) {
		console.log('✅ Error handling works correctly for invalid feed IDs');
	}
	
	console.log('\n🎉 Pyth integration test complete!');
}

// Run the test
testPythIntegration().catch(console.error);
