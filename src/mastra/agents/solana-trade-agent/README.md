# Solana Trading AI Agent (Consolidated)

This directory contains a comprehensive Solana trading AI agent that combines social sentiment analysis with real-time market data to provide intelligent trading insights.

## 🔄 Changes Made

The original architecture with separate tools has been **consolidated into a single, integrated agent**:

### Before (Tool-based Architecture)

- `tools/twitter-monitor-tool.ts` - Twitter monitoring
- `tools/sentiment-analysis-tool.ts` - Sentiment analysis  
- `tools/solana-market-tool.ts` - Market data fetching
- `tools/trading-signal-tool.ts` - Signal generation
- `solana-trade-agent.ts` - Agent using external tools

### After (Consolidated Architecture)

- `solana-trade-agent.ts` - **Single integrated agent with all functionality**
- `solana-trade-workflow.ts` - Workflow with integrated functions
- `tools/` - **Legacy tools (kept for reference)**

## 🚀 Features

### Integrated Capabilities

1. **Social Media Monitoring**: Monitors Twitter accounts for Solana-related content
2. **Advanced Sentiment Analysis**: Analyzes sentiment using keyword matching and engagement weighting
3. **Market Data Integration**: Fetches real-time Solana market data and technical indicators
4. **Comprehensive Trading Signals**: Generates detailed trading recommendations with risk management

### Key Algorithms

- **Sentiment Scoring**: Uses positive/negative keyword analysis with engagement weighting
- **Market Analysis**: Combines price action, volume, momentum, and volatility indicators
- **Signal Generation**: Multi-factor analysis (35% sentiment, 30% momentum, 20% volume, 15% volatility)
- **Risk Management**: Position sizing based on risk tolerance and volatility adjustment

## 🎯 Usage

### Using the Agent Directly

```typescript
import { solanaTradeAgent } from "./solana-trade-agent";

const response = await solanaTradeAgent.generate([
    { role: "user", content: "Give me a Solana trading analysis with medium risk tolerance" }
]);

console.log(response.content);
```

### Using the Workflow

```typescript
import { solanaTradeWorkflow } from "./solana-trade-workflow";

const result = await solanaTradeWorkflow.run({
    accounts: ["elonmusk", "solana", "solanalabs"],
    keywords: ["solana", "sol", "blockchain", "crypto"],
    risk_tolerance: 'medium'
});

const analysis = result.data.comprehensive_analysis;
```

## 📊 Response Format

The agent provides structured trading analysis:

```
📊 MARKET OVERVIEW
- Current SOL Price: $145.67 (+2.34% 24h)
- Volume: $2.8B (high)
- Market Cap: $68.5B
- Momentum: bullish

🐦 SOCIAL SENTIMENT ANALYSIS  
- Tweets Analyzed: 5
- Overall Sentiment: positive (78.5%)
- Key Influences: [top influential posts]
- Engagement Impact: high

🎯 TRADING SIGNAL
- Recommendation: BUY
- Confidence: 82%
- Signal Strength: 67/100

🛡️ RISK MANAGEMENT
- Position Size: 2.5% of portfolio
- Entry Price: $145.67
- Stop Loss: $138.39 (5% below entry)  
- Take Profit: $164.02 (12.6% above entry)
- Risk-Reward Ratio: 2.5:1
- Hold Duration: 2-6 hours

💡 REASONING
[Detailed explanation of factors]

⚠️ DISCLAIMERS
- Educational content, not financial advice
- Significant risk involved
- DYOR (Do Your Own Research)
```

## 🔧 Configuration

### Risk Tolerance Levels

- **Low**: 1% position size, 3% stop loss
- **Medium**: 3% position size, 5% stop loss  
- **High**: 5% position size, 8% stop loss

### Default Parameters

- Accounts: `["elonmusk", "solana", "solanalabs"]`
- Keywords: `["solana", "sol", "blockchain", "crypto"]`
- Risk Tolerance: `medium`
- Risk-Reward Ratio: `2.5:1`

### Environment Variables

- `TWITTER_BEARER_TOKEN` - Optional, falls back to mock data if not provided

## 🧪 Testing

Run the test suite to verify functionality:

```bash
# Test the consolidated agent and workflow
npm test

# Or run specific test file
npx ts-node tests/test-solana-agent.ts
```

## 📋 API Reference

### Agent Methods

- `generate(messages)` - Generate trading analysis from conversation
- Integrated capabilities - No external tool calls needed

### Workflow Methods  

- `run(input)` - Execute complete trading analysis workflow

### Input Schema

```typescript
{
  accounts?: string[];        // Twitter accounts to monitor
  keywords?: string[];        // Keywords to search for
  risk_tolerance?: 'low' | 'medium' | 'high';
}
```

### Output Schema

```typescript
{
  comprehensive_analysis: {
    summary: string;
    social_media_insights: { ... };
    market_analysis: { ... };
    trading_recommendation: { ... };
    risk_assessment: { ... };
  }
}
```

## 🚦 Migration Notes

If you were using the individual tools before:

1. **Import Change**: Import `solanaTradeAgent` instead of individual tools
2. **Usage Change**: Use agent conversations or workflow execution
3. **No Tool Calls**: All functionality is now integrated into the agent
4. **Same Functionality**: All original capabilities preserved and enhanced

## 🔮 Benefits of Consolidation

1. **Simplified Architecture**: Single agent vs. multiple tools
2. **Better Integration**: Seamless data flow between components
3. **Improved Performance**: No external tool call overhead
4. **Enhanced Reasoning**: Agent can reason about all data holistically
5. **Easier Maintenance**: Single codebase to maintain
6. **Better Error Handling**: Integrated error handling and fallbacks

The consolidated agent maintains all the sophisticated analysis capabilities while providing a much cleaner and more maintainable architecture.
