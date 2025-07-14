import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { weatherAgent } from "./agents/weather-agent/weather-agent"; // This can be deleted later
import { weatherWorkflow } from "./agents/weather-agent/weather-workflow"; // This can be deleted later
import { solanaAgent } from "./agents/solana-agent/solana-agent"; // Build your agent here
import { solanaMonitorWorkflow } from "./agents/solana-agent/solana-workflow";

export const mastra = new Mastra({
  workflows: { solanaMonitorWorkflow }, // can be deleted later
  agents: { weatherAgent, solanaAgent },
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  server: {
    port: 8080,
    timeout: 10000,
  },
});
