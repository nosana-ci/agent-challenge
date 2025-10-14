# Nosight Dashboard - Backend Integration Guide

## 📋 Overview

This document outlines all the integrations needed to make the Nosight dashboard fully functional. The UI is complete and ready to receive real data.

---

## 🎯 Integration Priority

### Priority 1: Critical (Must Have)

1. **Mastra AI Agent Integration** - Core analysis functionality
2. **Real-time Crypto Market Data** - Price feeds and market stats
3. **CopilotKit Agent Streaming** - AI responses to user queries

### Priority 2: Important (Should Have)

4. **Solana On-Chain Data** - Network stats and wallet info
5. **Privy Wallet Authentication** - User wallet management
6. **Data Caching Layer** - Performance optimization

### Priority 3: Nice to Have (Could Have)

7. **Social Sentiment Analysis** - Twitter/Reddit sentiment
8. **Historical Data & Charts** - Price history

---

## 🏗️ System Architecture

```
USER → Frontend (React) → API Routes → Mastra Agent → External APIs
                                    ↓
                              Storage Layer
                            (PostgreSQL + Redis)
```

## 🏗️ System Architecture

```
USER → Frontend (React) → API Routes → Mastra Agent → External APIs
                                    ↓
                              Storage Layer
                            (PostgreSQL + Redis)
```

## 🏗️ System Architecture

```
USER → Frontend (React) → API Routes → Mastra Agent → External APIs
                                    ↓
                              Storage Layer
                            (PostgreSQL + Redis)
```

USER QUERY → Mastra Agent → Mastra Tools → External APIs → Response


┌─────────────────────────────────────────────────────┐
│           USER INTERFACE (React Components)          │
│  • QueryInput                                        │
│  • LiveAnalysisPanel                                 │
│  • MarketStatsCard                                   │
└──────────────────┬───────────────────────────────────┘
                   │
                   │ User asks: "Analyze Bitcoin"
                   ▼
┌─────────────────────────────────────────────────────┐
│          COPILOTKIT (Streaming Layer)                │
│  • Receives user query                               │
│  • Routes to Mastra agent                            │
│  • Streams response back to UI                       │
└──────────────────┬───────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│         MASTRA AGENT (AI Orchestration)              │
│  • Understands user intent                           │
│  • Decides which tools to use                        │
│  • Calls tools in sequence                           │
│  • Synthesizes results with LLM                      │
└──────────────────┬───────────────────────────────────┘
                   │
                   ├─► Tool: get-crypto-price
                   │   └─► Fetches from CoinGecko
                   │
                   ├─► Tool: get-solana-network-stats
                   │   └─► Fetches from Solana RPC
                   │
                   ├─► Tool: get-market-sentiment
                   │   └─► Fetches from LunarCrush
                   │
                   └─► Tool: get-price-history
                       └─► Fetches from CoinGecko
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│          EXTERNAL APIs (Data Sources)                │
│  • CoinGecko API (crypto prices)                     │
│  • Solana RPC (blockchain data)                      │
│  • LunarCrush (sentiment)                            │
│  • Twitter API (optional)                            │
└─────────────────────────────────────────────────────┘

## 1️⃣ Mastra AI Agent Integration

### Current State

- **File**: \`src/mastra/agents/index.ts\`
- **Status**: Agent exists but needs to call real APIs
- **UI Component**: \`src/components/dashboard/QueryInput.tsx\`

### What Needs to be Done

#### A. Update Agent Tools to Fetch Real Data

\`\`\`typescript
// File: src/mastra/tools/index.ts

\`\`\`

#### B. API Keys Needed

Add these to \`.env.local\`:
\`\`\`bash

# Alternative: CoinMarketCap (Free tier: 333 calls/day)

COINMARKETCAP_API_KEY=your_cmc_api_key

# Solana RPC

SOLANA_RPC_URL=https://api.mainnet-beta.solana.com

# OpenAI for agent

OPENAI_API_KEY=sk-your_openai_key

\`\`\`

---

## 2️⃣ Real-Time Market Data Integration

### A. MarketStatsCard Component

**File**: \`src/components/dashboard/MarketStatsCard.tsx\`

**Props Interface**:
\`\`\`typescript
interface MarketData {
symbol: string; // "NOS", "BTC", "SOL"
name: string; // "Nosana Token"
price: number; // 2.45
change24h: number; // 12.5 (percentage)
volume24h: string; // "$2.3M"
marketCap?: string; // "$45.2M"
}
\`\`\`

**API Endpoint Needed**:
\`\`\`typescript
// File: src/app/api/market-stats/route.ts

\`\`\`

### B. NetworkStatsCard Component

**File**: \`src/components/dashboard/NetworkStatsCard.tsx\`

**Props Interface**:
\`\`\`typescript
interface NetworkStats {
activeNodes: number; // 342
jobsPerDay: string; // "1.2K"
utilizationRate?: number; // 67
}
\`\`\`

**API Endpoint**:
\`\`\`typescript

\`\`\`

---

## 3️⃣ Component Data Requirements

### All Components That Need Real Data:

| Component         | File                                | Data Type        | Update Frequency |
| ----------------- | ----------------------------------- | ---------------- | ---------------- |
| MarketStatsCard   | \`dashboard/MarketStatsCard.tsx\`   | MarketData       | 30s              |
| NetworkStatsCard  | \`dashboard/NetworkStatsCard.tsx\`  | NetworkStats     | 60s              |
| SentimentCard     | \`dashboard/SentimentCard.tsx\`     | SentimentData    | 120s             |
| PriceChart        | \`dashboard/PriceChart.tsx\`        | ChartDataPoint[] | On change        |
| LiveAnalysisPanel | \`dashboard/LiveAnalysisPanel.tsx\` | AnalysisResult   | Real-time        |

## 5️⃣ API Services & Keys

### Required (Free Tier)

- **CoinGecko**: Crypto data → https://www.coingecko.com/en/api
- **Privy**: Wallet auth → https://dashboard.privy.io
- **OpenAI**: AI agent → https://platform.openai.com

