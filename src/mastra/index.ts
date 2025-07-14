import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { solanaTradeAgent } from "./agents/solana-trade-agent/solana-trade-agent";
import { solanaTradeWorkflow } from "./agents/solana-trade-agent/solana-trade-workflow";

export const mastra = new Mastra({
	workflows: { weatherWorkflow, solanaTradeWorkflow }, // can be deleted later
	agents: { weatherAgent, yourAgent, solanaTradeAgent },
	logger: new PinoLogger({
		name: "Mastra",
		level: "info",
	}),
	server: {
		port: 8080,
		timeout: 10000,
	},
});
