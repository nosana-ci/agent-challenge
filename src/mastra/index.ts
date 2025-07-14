import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { solanaAgent } from "./agents/solana-agent/solana-agent"; // Build your agent here
import { solanaMonitorWorkflow } from "./agents/solana-agent/solana-workflow";

export const mastra = new Mastra({
  workflows: { solanaMonitorWorkflow },
  agents: { solanaAgent },
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  server: {
    port: 8080,
    timeout: 10000,
  },
});
