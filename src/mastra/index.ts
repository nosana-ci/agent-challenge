import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { weatherAgent } from "./agents/weather-agent/weather-agent"; // This can be deleted later
import { weatherWorkflow } from "./agents/weather-agent/weather-workflow"; // This can be deleted later
import { yourAgent } from "./agents/your-agent/your-agent"; // Build your agent here
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
