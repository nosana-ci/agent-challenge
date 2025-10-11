import { MCPServer } from "@mastra/mcp";
import { fetchMarketData } from "../tools";
import { nosightAgent } from "../agents";

export const server = new MCPServer({
  name: "Nosight Crypto Server",
  version: "1.0.0",
  tools: { fetchMarketData },
  agents: { nosightAgent }, // this agent will become tool "ask_nosightAgent"
  // workflows: {
  // dataProcessingWorkflow, // this workflow will become tool "run_dataProcessingWorkflow"
  // }
});
  