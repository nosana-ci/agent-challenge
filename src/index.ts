/**
 * ZION Crypto Intelligence Plugin
 *
 * A custom ElizaOS plugin that provides:
 * - Real-time crypto price data from CoinGecko
 * - Fear & Greed Index from alternative.me
 * - Market overview with top assets
 * - Builder-authority style market brief generation
 * - Security awareness context provider
 *
 * All API calls use free, public endpoints. No API keys required.
 */

import { type Plugin } from "@elizaos/core";

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const FEAR_GREED_URL = "https://api.alternative.me/fng/?limit=1";

/**
 * Resolve a user query string to a CoinGecko coin ID.
 * Handles common aliases (btc -> bitcoin, eth -> ethereum, sol -> solana).
 * Falls back to the raw lowercase string for less common coins.
 */
function resolveCoinId(query: string): string {
  const q = query.trim().toLowerCase();
  const aliases: Record<string, string> = {
    btc: "bitcoin",
    bitcoin: "bitcoin",
    eth: "ethereum",
    ethereum: "ethereum",
    sol: "solana",
    solana: "solana",
    bnb: "binancecoin",
    xrp: "ripple",
    ada: "cardano",
    doge: "dogecoin",
    dot: "polkadot",
    avax: "avalanche-2",
    matic: "matic-network",
    polygon: "matic-network",
    link: "chainlink",
    chainlink: "chainlink",
    uni: "uniswap",
    uniswap: "uniswap",
    atom: "cosmos",
    near: "near",
    apt: "aptos",
    sui: "sui",
    arb: "arbitrum",
    op: "optimism",
    nos: "nosana",
    nosana: "nosana",
    stx: "blockstack",
    fil: "filecoin",
    aave: "aave",
    mkr: "maker",
    ldo: "lido-dao",
    rune: "thorchain",
  };
  return aliases[q] || q;
}

/**
 * Extract a coin name from the user's message text.
 * Looks for known coin names/symbols in the message.
 */
function extractCoinFromMessage(text: string): string {
  const lower = text.toLowerCase();

  // Check for explicit coin mentions
  const knownCoins = [
    "bitcoin", "btc", "ethereum", "eth", "solana", "sol",
    "bnb", "xrp", "ripple", "cardano", "ada", "dogecoin", "doge",
    "polkadot", "dot", "avalanche", "avax", "polygon", "matic",
    "chainlink", "link", "uniswap", "uni", "cosmos", "atom",
    "near", "aptos", "apt", "sui", "arbitrum", "arb",
    "optimism", "op", "nosana", "nos", "filecoin", "fil",
    "aave", "maker", "mkr", "lido", "ldo", "thorchain", "rune",
  ];

  for (const coin of knownCoins) {
    // Match whole word boundaries
    const regex = new RegExp(`\\b${coin}\\b`, "i");
    if (regex.test(lower)) {
      return coin;
    }
  }

  // Default to bitcoin if no coin is found
  return "bitcoin";
}

/**
 * Format a number as USD currency string.
 */
function formatUSD(value: number): string {
  if (value >= 1) {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  // For small values, show more decimals
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 8 })}`;
}

/**
 * Format large numbers with abbreviations.
 */
function formatLargeNumber(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return formatUSD(value);
}

// ---------------------------------------------------------------------------
// Action: GET_CRYPTO_PRICE
// ---------------------------------------------------------------------------

const getCryptoPriceAction = {
  name: "GET_CRYPTO_PRICE",
  description:
    "Fetch the current price, market cap, 24h volume, and 24h change for a cryptocurrency using CoinGecko. Use this when the user asks about any crypto price, value, or cost.",
  similes: [
    "CHECK_PRICE",
    "CRYPTO_PRICE",
    "PRICE_CHECK",
    "GET_PRICE",
    "COIN_PRICE",
    "TOKEN_PRICE",
    "WHAT_IS_PRICE",
    "HOW_MUCH_IS",
  ],
  validate: async () => true,
  handler: async (
    _runtime: unknown,
    message: { content: { text: string } },
    _state: unknown,
    _options: unknown,
    callback: (response: { text: string }) => void,
  ) => {
    try {
      const coin = extractCoinFromMessage(message.content.text);
      const coinId = resolveCoinId(coin);

      const url = `${COINGECKO_BASE}/simple/price?ids=${coinId}&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true`;
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        callback({
          text: `CoinGecko API returned status ${response.status}. The endpoint may be rate-limited. Try again in 30 seconds.`,
        });
        return true;
      }

      const data = await response.json();

      if (!data[coinId]) {
        callback({
          text: `No data found for "${coin}". Verify the coin name or symbol and try again. CoinGecko may not track this asset.`,
        });
        return true;
      }

      const info = data[coinId];
      const price = formatUSD(info.usd);
      const marketCap = formatLargeNumber(info.usd_market_cap || 0);
      const volume = formatLargeNumber(info.usd_24h_vol || 0);
      const change = (info.usd_24h_change || 0).toFixed(2);
      const direction = parseFloat(change) >= 0 ? "up" : "down";

      callback({
        text: [
          `${coinId.toUpperCase()} — Live Data (CoinGecko)`,
          ``,
          `Price: ${price}`,
          `24h Change: ${change}% (${direction})`,
          `Market Cap: ${marketCap}`,
          `24h Volume: ${volume}`,
          ``,
          `Data pulled at ${new Date().toUTCString()}.`,
        ].join("\n"),
      });

      return true;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      callback({
        text: `Failed to fetch price data: ${errMsg}. This is likely a network issue or CoinGecko rate limit.`,
      });
      return true;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "What is Bitcoin trading at right now?" },
      },
      {
        user: "ZION",
        content: {
          text: "Let me pull the latest BTC data.",
          action: "GET_CRYPTO_PRICE",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "ETH price" },
      },
      {
        user: "ZION",
        content: {
          text: "Checking ETH price now.",
          action: "GET_CRYPTO_PRICE",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "How much is Solana?" },
      },
      {
        user: "ZION",
        content: {
          text: "Pulling SOL price data.",
          action: "GET_CRYPTO_PRICE",
        },
      },
    ],
  ],
};

// ---------------------------------------------------------------------------
// Action: GET_FEAR_GREED
// ---------------------------------------------------------------------------

const getFearGreedAction = {
  name: "GET_FEAR_GREED",
  description:
    "Fetch the current Crypto Fear & Greed Index from alternative.me. Use this when the user asks about market sentiment, fear, greed, or overall market mood.",
  similes: [
    "FEAR_GREED",
    "MARKET_SENTIMENT",
    "SENTIMENT_CHECK",
    "FEAR_AND_GREED",
    "MARKET_MOOD",
    "CRYPTO_SENTIMENT",
    "CHECK_SENTIMENT",
  ],
  validate: async () => true,
  handler: async (
    _runtime: unknown,
    _message: { content: { text: string } },
    _state: unknown,
    _options: unknown,
    callback: (response: { text: string }) => void,
  ) => {
    try {
      const response = await fetch(FEAR_GREED_URL, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        callback({
          text: `Fear & Greed API returned status ${response.status}. Try again shortly.`,
        });
        return true;
      }

      const data = await response.json();
      const entry = data.data?.[0];

      if (!entry) {
        callback({ text: "No Fear & Greed data available at this time." });
        return true;
      }

      const value = parseInt(entry.value, 10);
      const classification = entry.value_classification;
      const timestamp = new Date(parseInt(entry.timestamp, 10) * 1000).toUTCString();

      // Builder-authority analysis based on the value
      let analysis: string;
      if (value <= 20) {
        analysis =
          "Extreme Fear territory. Historically, this is where long-term accumulation produces the best risk-adjusted returns. The crowd is panicking. The data says opportunity.";
      } else if (value <= 40) {
        analysis =
          "Fear zone. Capital is cautious. Smart money tends to deploy here while retail waits for confirmation that never comes at good prices.";
      } else if (value <= 60) {
        analysis =
          "Neutral zone. The market is undecided. Position sizing matters more than direction here. Wait for a conviction signal or stay flat.";
      } else if (value <= 80) {
        analysis =
          "Greed zone. Momentum is strong but so is complacency. This is where disciplined operators take profits and let the euphoric crowd carry the bag.";
      } else {
        analysis =
          "Extreme Greed. The market is overheated. Every cycle, this is where late entrants provide exit liquidity for early movers. Proceed with strict risk management.";
      }

      callback({
        text: [
          `Crypto Fear & Greed Index (alternative.me)`,
          ``,
          `Value: ${value}/100`,
          `Classification: ${classification}`,
          `Timestamp: ${timestamp}`,
          ``,
          `Analysis: ${analysis}`,
        ].join("\n"),
      });

      return true;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      callback({
        text: `Failed to fetch Fear & Greed Index: ${errMsg}.`,
      });
      return true;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "What is the market sentiment?" },
      },
      {
        user: "ZION",
        content: {
          text: "Pulling the Fear and Greed Index.",
          action: "GET_FEAR_GREED",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Fear and greed index?" },
      },
      {
        user: "ZION",
        content: {
          text: "Checking market sentiment now.",
          action: "GET_FEAR_GREED",
        },
      },
    ],
  ],
};

// ---------------------------------------------------------------------------
// Action: GET_MARKET_OVERVIEW
// ---------------------------------------------------------------------------

const getMarketOverviewAction = {
  name: "GET_MARKET_OVERVIEW",
  description:
    "Fetch a market overview showing the top cryptocurrencies by market cap with prices, 24h changes, and volumes. Use this when the user asks for a broad market view, top coins, or market overview.",
  similes: [
    "MARKET_OVERVIEW",
    "TOP_COINS",
    "MARKET_REPORT",
    "MARKET_SCAN",
    "CRYPTO_MARKET",
    "MARKET_STATUS",
    "TOP_CRYPTOS",
  ],
  validate: async () => true,
  handler: async (
    _runtime: unknown,
    _message: { content: { text: string } },
    _state: unknown,
    _options: unknown,
    callback: (response: { text: string }) => void,
  ) => {
    try {
      const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`;
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        callback({
          text: `CoinGecko markets API returned status ${response.status}. Rate limit may apply. Retry in 60 seconds.`,
        });
        return true;
      }

      const coins = await response.json();

      if (!Array.isArray(coins) || coins.length === 0) {
        callback({ text: "No market data available at this time." });
        return true;
      }

      const lines: string[] = [
        "Market Overview — Top 10 by Market Cap (CoinGecko)",
        "",
      ];

      let totalMarketCap = 0;

      for (const coin of coins) {
        const name = coin.name;
        const symbol = (coin.symbol || "").toUpperCase();
        const price = formatUSD(coin.current_price || 0);
        const change = (coin.price_change_percentage_24h || 0).toFixed(2);
        const mcap = formatLargeNumber(coin.market_cap || 0);
        const direction = parseFloat(change) >= 0 ? "+" : "";
        totalMarketCap += coin.market_cap || 0;

        lines.push(
          `${symbol} (${name}): ${price} | 24h: ${direction}${change}% | MCap: ${mcap}`,
        );
      }

      lines.push("");
      lines.push(`Combined Top-10 Market Cap: ${formatLargeNumber(totalMarketCap)}`);
      lines.push(`Data pulled at ${new Date().toUTCString()}.`);

      // Add brief analysis
      const gainers = coins.filter(
        (c: { price_change_percentage_24h?: number }) =>
          (c.price_change_percentage_24h || 0) > 0,
      ).length;
      const losers = 10 - gainers;

      if (gainers >= 8) {
        lines.push(
          "",
          `${gainers}/10 top assets are green. Broad-based strength. Risk-on environment.`,
        );
      } else if (losers >= 8) {
        lines.push(
          "",
          `${losers}/10 top assets are red. Broad-based weakness. Capital is defensive.`,
        );
      } else {
        lines.push(
          "",
          `Mixed signals: ${gainers} green, ${losers} red. Rotational market. Sector selection matters.`,
        );
      }

      callback({ text: lines.join("\n") });
      return true;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      callback({
        text: `Failed to fetch market overview: ${errMsg}.`,
      });
      return true;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Give me a market overview" },
      },
      {
        user: "ZION",
        content: {
          text: "Running a full market scan.",
          action: "GET_MARKET_OVERVIEW",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "What are the top coins doing?" },
      },
      {
        user: "ZION",
        content: {
          text: "Pulling top 10 by market cap.",
          action: "GET_MARKET_OVERVIEW",
        },
      },
    ],
  ],
};

// ---------------------------------------------------------------------------
// Action: GENERATE_MARKET_BRIEF
// ---------------------------------------------------------------------------

const generateMarketBriefAction = {
  name: "GENERATE_MARKET_BRIEF",
  description:
    "Generate a builder-authority style market brief or tweet by combining live crypto price data with Fear & Greed sentiment. Use this when the user asks to generate content, write a tweet, create a market brief, or produce a post about crypto markets.",
  similes: [
    "WRITE_TWEET",
    "GENERATE_TWEET",
    "MARKET_BRIEF",
    "CREATE_POST",
    "WRITE_POST",
    "CONTENT_GENERATE",
    "ALPHA_TWEET",
    "BUILDER_TWEET",
  ],
  validate: async () => true,
  handler: async (
    _runtime: unknown,
    message: { content: { text: string } },
    _state: unknown,
    _options: unknown,
    callback: (response: { text: string }) => void,
  ) => {
    try {
      // Fetch BTC, ETH, SOL prices and Fear & Greed in parallel
      const [priceRes, fgRes] = await Promise.all([
        fetch(
          `${COINGECKO_BASE}/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`,
          { headers: { Accept: "application/json" } },
        ),
        fetch(FEAR_GREED_URL, {
          headers: { Accept: "application/json" },
        }),
      ]);

      let btcPrice = 0,
        btcChange = 0,
        ethPrice = 0,
        ethChange = 0,
        solPrice = 0,
        solChange = 0;
      let fgValue = 50,
        fgClass = "Neutral";

      if (priceRes.ok) {
        const priceData = await priceRes.json();
        btcPrice = priceData.bitcoin?.usd || 0;
        btcChange = priceData.bitcoin?.usd_24h_change || 0;
        ethPrice = priceData.ethereum?.usd || 0;
        ethChange = priceData.ethereum?.usd_24h_change || 0;
        solPrice = priceData.solana?.usd || 0;
        solChange = priceData.solana?.usd_24h_change || 0;
      }

      if (fgRes.ok) {
        const fgData = await fgRes.json();
        const entry = fgData.data?.[0];
        if (entry) {
          fgValue = parseInt(entry.value, 10);
          fgClass = entry.value_classification;
        }
      }

      // Determine what the user wants to write about
      const userText = message.content.text.toLowerCase();
      let focusCoin = "bitcoin";
      let focusPrice = btcPrice;
      let focusChange = btcChange;
      let focusSymbol = "BTC";

      if (userText.includes("eth") || userText.includes("ethereum")) {
        focusCoin = "ethereum";
        focusPrice = ethPrice;
        focusChange = ethChange;
        focusSymbol = "ETH";
      } else if (userText.includes("sol") || userText.includes("solana")) {
        focusCoin = "solana";
        focusPrice = solPrice;
        focusChange = solChange;
        focusSymbol = "SOL";
      }

      const changeDir = focusChange >= 0 ? "+" : "";
      const changeStr = `${changeDir}${focusChange.toFixed(2)}%`;

      // Generate multiple tweet options in builder-authority style
      const tweets: string[] = [];

      // Data-driven tweet
      tweets.push(
        `${focusSymbol} at ${formatUSD(focusPrice)} (${changeStr} 24h). Fear & Greed at ${fgValue} (${fgClass}). ${
          fgValue < 30
            ? "The crowd is selling into fear. Historically, this is where conviction pays."
            : fgValue > 70
              ? "Greed is running the show. Discipline separates operators from exit liquidity."
              : "Neutral territory. The next macro catalyst will set direction. Position accordingly."
        }`,
      );

      // Contrarian tweet
      if (focusChange < -3) {
        tweets.push(
          `${focusSymbol} down ${Math.abs(focusChange).toFixed(1)}% and the timeline is calling it dead. Again. The asset that has come back from every drawdown in its history. The data has not changed. The narrative has.`,
        );
      } else if (focusChange > 3) {
        tweets.push(
          `${focusSymbol} up ${focusChange.toFixed(1)}% and everyone is a genius again. The same accounts that were silent at ${formatUSD(focusPrice * 0.85)} are now posting targets at ${formatUSD(focusPrice * 1.5)}. Price discovery rewards the positioned, not the reactive.`,
        );
      } else {
        tweets.push(
          `${focusSymbol} grinding at ${formatUSD(focusPrice)}. Low volatility. Low attention. This is the phase where positions are built quietly. By the time it trends, the entry is gone.`,
        );
      }

      // Market brief tweet
      tweets.push(
        `Market brief: BTC ${formatUSD(btcPrice)}, ETH ${formatUSD(ethPrice)}, SOL ${formatUSD(solPrice)}. Fear & Greed: ${fgValue}. ${
          btcChange > 0 && ethChange > 0 && solChange > 0
            ? "All three majors green. Risk-on across the board."
            : btcChange < 0 && ethChange < 0 && solChange < 0
              ? "All three majors red. Risk-off. Cash is a position."
              : "Mixed action in the majors. Rotation, not capitulation."
        }`,
      );

      callback({
        text: [
          "ZION Market Brief Generator — Builder-Authority Style",
          "",
          "Generated 3 tweet options using live data:",
          "",
          "--- Option 1 (Data-Driven) ---",
          tweets[0],
          "",
          "--- Option 2 (Contrarian) ---",
          tweets[1],
          "",
          "--- Option 3 (Market Brief) ---",
          tweets[2],
          "",
          `Source data: CoinGecko + alternative.me | ${new Date().toUTCString()}`,
        ].join("\n"),
      });

      return true;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      callback({
        text: `Failed to generate market brief: ${errMsg}.`,
      });
      return true;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Write a tweet about Bitcoin" },
      },
      {
        user: "ZION",
        content: {
          text: "Pulling live data to generate a builder-authority post.",
          action: "GENERATE_MARKET_BRIEF",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Generate a market brief" },
      },
      {
        user: "ZION",
        content: {
          text: "Building a data-driven market brief now.",
          action: "GENERATE_MARKET_BRIEF",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Create a post about ETH" },
      },
      {
        user: "ZION",
        content: {
          text: "Generating Ethereum-focused content with live data.",
          action: "GENERATE_MARKET_BRIEF",
        },
      },
    ],
  ],
};

// ---------------------------------------------------------------------------
// Action: SECURITY_SCAN
// ---------------------------------------------------------------------------

const securityScanAction = {
  name: "SECURITY_SCAN",
  description:
    "Provide a security analysis framework for smart contracts or crypto projects. Use this when the user asks about security, audits, contract safety, or vulnerability checks.",
  similes: [
    "CHECK_SECURITY",
    "AUDIT_CHECK",
    "CONTRACT_SECURITY",
    "VULNERABILITY_CHECK",
    "SECURITY_ANALYSIS",
    "SMART_CONTRACT_AUDIT",
    "IS_IT_SAFE",
  ],
  validate: async () => true,
  handler: async (
    _runtime: unknown,
    message: { content: { text: string } },
    _state: unknown,
    _options: unknown,
    callback: (response: { text: string }) => void,
  ) => {
    const text = message.content.text;

    // Check if user provided a contract address
    const ethAddressMatch = text.match(/0x[a-fA-F0-9]{40}/);
    const solAddressMatch = text.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);

    const lines: string[] = [
      "ZION Security Analysis Framework",
      "",
    ];

    if (ethAddressMatch) {
      const address = ethAddressMatch[0];
      lines.push(`Target: ${address} (EVM address detected)`);
      lines.push("");
      lines.push("Recommended verification steps:");
      lines.push(`1. Check contract source on Etherscan: https://etherscan.io/address/${address}`);
      lines.push(`2. Verify on Sourcify: https://sourcify.dev/#/lookup/${address}`);
      lines.push(`3. Check for known exploits on DeFi Rekt: https://rekt.news`);
      lines.push(`4. Review on DeFiSafety: https://defisafety.com`);
      lines.push("");
      lines.push("Key checks to perform:");
    } else if (solAddressMatch && !ethAddressMatch) {
      const address = solAddressMatch[0];
      lines.push(`Target: ${address} (possible Solana address detected)`);
      lines.push("");
      lines.push("Recommended verification steps:");
      lines.push(`1. Check on Solscan: https://solscan.io/account/${address}`);
      lines.push(`2. Verify program on Solana Explorer: https://explorer.solana.com/address/${address}`);
      lines.push("");
      lines.push("Key checks to perform:");
    } else {
      lines.push("No specific contract address detected. Providing general security framework.");
      lines.push("");
      lines.push("Smart Contract Security Checklist — Top 15 Vulnerabilities:");
    }

    lines.push("");
    lines.push("Critical vulnerabilities to check:");
    lines.push("  1. Reentrancy — Can external calls re-enter state-changing functions?");
    lines.push("  2. Access Control — Are admin functions properly restricted?");
    lines.push("  3. Integer Overflow/Underflow — Are arithmetic operations safe?");
    lines.push("  4. Oracle Manipulation — Can price feeds be manipulated in a single tx?");
    lines.push("  5. Flash Loan Attacks — Is the protocol vulnerable to single-block exploits?");
    lines.push("  6. Front-running — Can transactions be sandwiched or front-run?");
    lines.push("  7. Unchecked Return Values — Are external call results validated?");
    lines.push("  8. Denial of Service — Can the contract be bricked by a malicious actor?");
    lines.push("  9. Timestamp Dependence — Does logic rely on block.timestamp?");
    lines.push(" 10. Centralization Risk — Can a single key drain or pause the protocol?");
    lines.push(" 11. Storage Collision — In proxy patterns, is storage layout safe?");
    lines.push(" 12. Signature Replay — Can signed messages be reused across chains or contexts?");
    lines.push(" 13. Precision Loss — Do division operations lose significant precision?");
    lines.push(" 14. Uninitialized Proxies — Can implementation contracts be taken over?");
    lines.push(" 15. Cross-chain Message Validation — Are bridge messages properly verified?");
    lines.push("");
    lines.push("Tools for automated analysis:");
    lines.push("  - Slither (static analysis): github.com/crytic/slither");
    lines.push("  - Mythril (symbolic execution): github.com/Consensys/mythril");
    lines.push("  - Foundry (fuzzing): github.com/foundry-rs/foundry");
    lines.push("  - Aderyn (Rust-based): github.com/Cyfrin/aderyn");
    lines.push("");
    lines.push("ZION recommendation: Never interact with an unaudited contract with significant capital. Verify source code, check audit reports, and start with small test transactions.");

    callback({ text: lines.join("\n") });
    return true;
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Is this contract safe? 0x1234567890abcdef1234567890abcdef12345678" },
      },
      {
        user: "ZION",
        content: {
          text: "Running security analysis framework.",
          action: "SECURITY_SCAN",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "What should I check before interacting with a DeFi protocol?" },
      },
      {
        user: "ZION",
        content: {
          text: "Pulling the security checklist.",
          action: "SECURITY_SCAN",
        },
      },
    ],
  ],
};

// ---------------------------------------------------------------------------
// Provider: Market Data Context
// ---------------------------------------------------------------------------

const marketDataProvider = {
  name: "market-data-context",
  description:
    "Provides background market context (BTC/ETH/SOL prices and Fear & Greed) to enrich ZION's responses.",
  get: async () => {
    try {
      const [priceRes, fgRes] = await Promise.all([
        fetch(
          `${COINGECKO_BASE}/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true`,
          { headers: { Accept: "application/json" } },
        ).catch(() => null),
        fetch(FEAR_GREED_URL, {
          headers: { Accept: "application/json" },
        }).catch(() => null),
      ]);

      const parts: string[] = ["[ZION Market Context]"];

      if (priceRes?.ok) {
        const data = await priceRes.json();
        if (data.bitcoin) {
          parts.push(
            `BTC: $${data.bitcoin.usd?.toLocaleString()} (${(data.bitcoin.usd_24h_change || 0).toFixed(2)}% 24h)`,
          );
        }
        if (data.ethereum) {
          parts.push(
            `ETH: $${data.ethereum.usd?.toLocaleString()} (${(data.ethereum.usd_24h_change || 0).toFixed(2)}% 24h)`,
          );
        }
        if (data.solana) {
          parts.push(
            `SOL: $${data.solana.usd?.toLocaleString()} (${(data.solana.usd_24h_change || 0).toFixed(2)}% 24h)`,
          );
        }
      }

      if (fgRes?.ok) {
        const fgData = await fgRes.json();
        const entry = fgData.data?.[0];
        if (entry) {
          parts.push(
            `Fear & Greed: ${entry.value}/100 (${entry.value_classification})`,
          );
        }
      }

      if (parts.length <= 1) {
        return "Market data temporarily unavailable.";
      }

      parts.push(`Updated: ${new Date().toUTCString()}`);
      return parts.join(" | ");
    } catch {
      return "Market data provider: API unreachable.";
    }
  },
};

// ---------------------------------------------------------------------------
// Plugin export
// ---------------------------------------------------------------------------

/**
 * ZION Crypto Intelligence Plugin
 *
 * Provides five custom actions and one context provider:
 * - GET_CRYPTO_PRICE: Real-time crypto prices from CoinGecko
 * - GET_FEAR_GREED: Crypto Fear & Greed Index from alternative.me
 * - GET_MARKET_OVERVIEW: Top 10 cryptocurrencies by market cap
 * - GENERATE_MARKET_BRIEF: Builder-authority style content generation with live data
 * - SECURITY_SCAN: Smart contract security analysis framework
 * - market-data-context: Background provider for BTC/ETH/SOL prices
 */
export const zionPlugin: Plugin = {
  name: "zion-crypto-intelligence",
  description:
    "Sovereign crypto intelligence plugin: real-time prices, market sentiment, security analysis, and builder-authority content generation.",
  actions: [
    getCryptoPriceAction,
    getFearGreedAction,
    getMarketOverviewAction,
    generateMarketBriefAction,
    securityScanAction,
  ],
  providers: [marketDataProvider],
  evaluators: [],
};

export default zionPlugin;
