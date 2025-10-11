"use client";

import { useCoAgent, useCopilotAction } from "@copilotkit/react-core";
import { CopilotKitCSSProperties, CopilotSidebar } from "@copilotkit/react-ui";
import { useState } from "react";
import { AgentState as AgentStateSchema } from "@/mastra/agents";
import { z } from "zod";

type AgentState = z.infer<typeof AgentStateSchema>;

export default function CopilotKitPage() {
  const [themeColor, setThemeColor] = useState("#6366f1");

  // 🪁 Frontend Actions: https://docs.copilotkit.ai/guides/frontend-actions
  useCopilotAction({
    name: "setThemeColor",
    parameters: [
      {
        name: "themeColor",
        description: "The theme color to set. Make sure to pick nice colors.",
        required: true,
      },
    ],
    handler({ themeColor }) {
      setThemeColor(themeColor);
    },
  });

  return (
    <main
      style={
        { "--copilot-kit-primary-color": themeColor } as CopilotKitCSSProperties
      }
    >
      <YourMainContent themeColor={themeColor} />
      <CopilotSidebar
        clickOutsideToClose={false}
        defaultOpen={true}
        labels={{
          title: "Popup Assistant",
          initial:
            '👋 Hi, there! You\'re chatting with an agent. This agent comes with a few tools to get you started.\n\nFor example you can try:\n- **Frontend Tools**: "Set the theme to orange"\n- **Shared State**: "Write a proverb about AI"\n- **Generative UI**: "Get the weather in SF"\n\nAs you interact with the agent, you\'ll see the UI update in real-time to reflect the agent\'s **state**, **tool calls**, and **progress**.',
        }}
      />
    </main>
  );
}

function YourMainContent({ themeColor }: { themeColor: string }) {
  // 🪁 Shared State: https://docs.copilotkit.ai/coagents/shared-state
  const { state, setState } = useCoAgent<AgentState>({
    name: "nosightAgent",
    initialState: {
      crypto_analyses: ["Welcome to Nosight - your crypto market analyst!"],
    },
  });

  //🪁 Generative UI: https://docs.copilotkit.ai/coagents/generative-ui
  useCopilotAction({
    name: "fetchMarketData",
    description: "Get cryptocurrency market data and analysis.",
    available: "frontend",
    parameters: [
      { name: "symbol", type: "string", required: true },
      { name: "days", type: "number", required: false },
    ],
    render: ({ args, result, status }) => {
      return (
        <CryptoCard
          symbol={args.symbol}
          days={args.days}
          themeColor={themeColor}
          result={result}
          status={status}
        />
      );
    },
  });

  useCopilotAction({
    name: "updateWorkingMemory",
    available: "frontend",
    render: ({ args }) => {
      return (
        <div
          style={{ backgroundColor: themeColor }}
          className="rounded-2xl max-w-md w-full text-white p-4"
        >
          <p>✨ Memory updated</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-white">See updates</summary>
            <pre
              style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
              className="overflow-x-auto text-sm bg-white/20 p-4 rounded-lg mt-2"
            >
              {JSON.stringify(args, null, 2)}
            </pre>
          </details>
        </div>
      );
    },
  });

  return (
    <div
      style={{ backgroundColor: themeColor }}
      className="h-screen w-screen flex justify-center items-center flex-col transition-colors duration-300"
    >
      <div className="bg-white/20 backdrop-blur-md p-8 rounded-2xl shadow-xl max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-white mb-2 text-center">
          Proverbs
        </h1>
        <p className="text-gray-200 text-center italic mb-6">
          This is a demonstrative page, but it could be anything you want! 🪁
        </p>
        <hr className="border-white/20 my-6" />
        <div className="flex flex-col gap-3">
          {state.crypto_analyses?.map((analysis: string, index: number) => (
            <div
              key={index}
              className="bg-white/15 p-4 rounded-xl text-white relative group hover:bg-white/20 transition-all"
            >
              <p className="pr-8">{analysis}</p>
              <button
                onClick={() =>
                  setState({
                    ...state,
                    crypto_analyses: state.crypto_analyses?.filter(
                      (_, i) => i !== index
                    ),
                  })
                }
                className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity 
                  bg-red-500 hover:bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {state.crypto_analyses?.length === 0 && (
          <p className="text-center text-white/80 italic my-8">
            No crypto analyses yet. Ask the Nosight agent to analyze some
            cryptocurrencies!
          </p>
        )}
      </div>
    </div>
  );
}

// Crypto card component where the symbol and themeColor are based on what the agent
// sets via tool calls.
function CryptoCard({
  symbol,
  themeColor,
  result,
  status,
}: {
  symbol?: string;
  days?: number;
  themeColor: string;
  result: {
    symbol: string;
    name: string;
    current_price: number;
    market_cap?: number;
    total_volume?: number;
    price_change_percentage_24h?: number;
    price_change_percentage_7d?: number;
    analysis_summary?: string;
  } | null;
  status: "inProgress" | "executing" | "complete";
}) {
  if (status !== "complete") {
    return (
      <div
        className="rounded-xl shadow-xl mt-6 mb-4 max-w-md w-full"
        style={{ backgroundColor: themeColor }}
      >
        <div className="bg-white/20 p-4 w-full">
          <p className="text-white animate-pulse">
            Loading market data for {symbol}...
          </p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const priceChange24h = result.price_change_percentage_24h || 0;
  const isPositive = priceChange24h > 0;

  return (
    <div
      style={{ backgroundColor: themeColor }}
      className="rounded-xl shadow-xl mt-6 mb-4 max-w-md w-full"
    >
      <div className="bg-white/20 p-4 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white uppercase">
              {result.symbol}
            </h3>
            <p className="text-white">{result.name}</p>
          </div>
          <CryptoIcon symbol={result.symbol} />
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div className="text-3xl font-bold text-white">
            <span className="">${result.current_price?.toFixed(4)}</span>
          </div>
          <div
            className={`text-sm font-medium ${isPositive ? "text-green-300" : "text-red-300"}`}
          >
            {isPositive ? "↗" : "↘"} {Math.abs(priceChange24h).toFixed(2)}%
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-white text-xs">Market Cap</p>
              <p className="text-white font-medium">
                {result.market_cap
                  ? `$${(result.market_cap / 1e9).toFixed(2)}B`
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-white text-xs">Volume</p>
              <p className="text-white font-medium">
                {result.total_volume
                  ? `$${(result.total_volume / 1e6).toFixed(1)}M`
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-white text-xs">7d Change</p>
              <p
                className={`font-medium ${(result.price_change_percentage_7d || 0) > 0 ? "text-green-300" : "text-red-300"}`}
              >
                {result.price_change_percentage_7d?.toFixed(1) || "0"}%
              </p>
            </div>
          </div>
        </div>

        {result.analysis_summary && (
          <div className="mt-4 pt-4 border-t border-white">
            <p className="text-white text-xs mb-2">Analysis</p>
            <p className="text-white text-sm">{result.analysis_summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CryptoIcon({ symbol }: { symbol: string }) {
  if (!symbol) return <DefaultCryptoIcon />;

  const symbolLower = symbol.toLowerCase();

  if (symbolLower === "btc" || symbolLower === "bitcoin") {
    return <BitcoinIcon />;
  }

  if (symbolLower === "eth" || symbolLower === "ethereum") {
    return <EthereumIcon />;
  }

  return <DefaultCryptoIcon />;
}

// Bitcoin icon
function BitcoinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-14 h-14 text-orange-300"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.562c-.375 1.5-1.938 2.063-3.938 1.688V12c1.125.188 2.125-.375 2.125-1.438 0-.75-.5-1.25-1.188-1.25v1.25h-1v-1.25c-.562 0-1.062.188-1.062.75v4.5c0 .562.5.75 1.062.75v-1.25h1v1.25c.688 0 1.188-.5 1.188-1.25 0-1.063-1-1.625-2.125-1.438V10.25c2-.375 3.563.188 3.938 1.688z" />
    </svg>
  );
}

// Ethereum icon
function EthereumIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-14 h-14 text-blue-300"
    >
      <path d="M12 0L5.5 12.25L12 16.5l6.5-4.25L12 0z" />
      <path d="M5.5 13.5L12 24l6.5-10.5L12 17.75L5.5 13.5z" />
    </svg>
  );
}

// Default crypto icon
function DefaultCryptoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-14 h-14 text-green-300"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
