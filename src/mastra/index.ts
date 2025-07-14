import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { solanaTradeAgent } from "./agents/solana-trade-agent/solana-trade-agent";
import { solanaTradeWorkflow } from "./agents/solana-trade-agent/solana-trade-workflow";

export const mastra = new Mastra({
	workflows: { solanaTradeWorkflow }, // can be deleted later
	agents: { solanaTradeAgent },
	bundler: { externals: ["@pythnetwork/hermes-client"] },
	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
	}),
	server: {
		port: 8080,
		timeout: 10000,
	},
});
