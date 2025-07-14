# Pyth Network Integration for Solana Trading Agent

This document explains the integration of Pyth Network's Hermes REST API for real-time cryptocurrency price data in the Solana trading agent.

## Overview

The Solana trading agent now uses Pyth Network's Hermes REST API to fetch real-time, high-confidence price data for cryptocurrencies. This integration provides:

- **Real-time prices**: Latest price updates with millisecond precision
- **Price confidence intervals**: Statistical confidence bounds for price accuracy
- **Data freshness indicators**: Timestamps and freshness scoring
- **Multiple asset support**: SOL, BTC, ETH, and other major cryptocurrencies

## API Integration Details

### Endpoints Used

- **Base URL**: `https://hermes.pyth.network/v2/updates/price/latest`
- **Method**: GET
- **Parameters**: `ids[]` - Array of Pyth price feed IDs

### Supported Price Feeds

| Asset | Price Feed ID | Description |
|-------|---------------|-------------|
| SOL/USD | `ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d` | Solana to USD |
| BTC/USD | `e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43` | Bitcoin to USD |
| ETH/USD | `ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace` | Ethereum to USD |

### Example Request

```bash
curl -X 'GET' \
  'https://hermes.pyth.network/v2/updates/price/latest?ids%5B%5D=ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d&ids%5B%5D=e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43'
```

## Code Implementation

### Core Functions

#### `fetchPythPrices(priceFeeds: string[])`

Fetches price data from Pyth Hermes API for multiple price feeds.

```typescript
const pythData = await fetchPythPrices([PYTH_PRICE_FEEDS.SOL_USD]);
```

#### `parsePythPrice(priceData: PythPriceData)`

Converts Pyth's integer price format to decimal using the exponent.

```typescript
const price = parsePythPrice(priceData);
// Result: 145.67 (for SOL price)
```

#### `getSolanaMarketData()`

Enhanced to use real Pyth price data with fallback to mock data.

### New Tools

#### `pythPriceTool`

Standalone tool for fetching cryptocurrency prices:

```typescript
const result = await pythPriceTool.execute({
  context: {
    symbols: ['SOL', 'BTC', 'ETH'],
    include_confidence: true
  }
});
```

#### Enhanced `solanaTradeComboTool`

Now includes real-time Pyth data in comprehensive trading analysis.

## Data Quality Features

### Price Confidence Scoring

- Calculated from Pyth's confidence intervals
- Range: 0.1 to 0.99 (higher = more confident)
- Formula: `1 - (confidence_interval / price)`

### Data Freshness Indicators

- **very_fresh**: < 30 seconds old
- **fresh**: < 1 minute old  
- **recent**: < 5 minutes old
- **aging**: < 15 minutes old
- **stale**: > 15 minutes old

### Error Handling

- Graceful fallback to mock data if Pyth API is unavailable
- Comprehensive error logging
- Network timeout protection

## Example Response Format

```json
{
  "prices": {
    "SOL": {
      "price": 145.67,
      "confidence_interval": 0.12,
      "expo": -8,
      "publish_time": 1714746101,
      "data_freshness": "very_fresh",
      "price_confidence_score": 0.87
    }
  },
  "source": "Pyth Network Hermes API",
  "fetch_timestamp": "2024-07-14T10:30:00.000Z",
  "total_feeds_requested": 1,
  "successful_feeds": 1
}
```

## Testing

Run the integration test:

```bash
node test-pyth-integration.mjs
```

This test will:

- Fetch individual price feeds
- Test multiple feeds in one request
- Verify error handling
- Display price confidence and freshness data

## Benefits

### Accuracy

- Oracle-grade price data used by leading DeFi protocols
- Sub-second price updates
- Statistical confidence bounds

### Reliability  

- Decentralized oracle network
- Multiple data sources aggregated
- Built-in redundancy and fallback

### Performance

- REST API with low latency
- Batch requests for multiple assets
- Efficient data encoding

## Integration Impact

The Pyth integration enhances the trading agent's decision-making by providing:

1. **Real-time market awareness**: Latest price movements for accurate signals
2. **Confidence-based trading**: Position sizing based on price confidence
3. **Cross-asset analysis**: Compare SOL performance against BTC/ETH
4. **Data quality metrics**: Make decisions based on data freshness and reliability

## Future Enhancements

Potential improvements for the integration:

- **Historical price data**: Use Pyth's historical endpoints for trend analysis
- **More assets**: Add support for additional cryptocurrencies
- **WebSocket integration**: Real-time streaming for continuous monitoring
- **Price alerts**: Trigger trading signals on significant price movements
- **Volatility calculations**: Use confidence intervals for volatility modeling

## Resources

- [Pyth Network Documentation](https://docs.pyth.network/)
- [Hermes REST API Reference](https://docs.pyth.network/documentation/pythnet-price-feeds/hermes)
- [Price Feed IDs](https://pyth.network/developers/price-feed-ids)
- [Pyth Network Website](https://pyth.network/)
