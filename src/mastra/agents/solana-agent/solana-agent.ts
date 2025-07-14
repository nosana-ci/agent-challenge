import { Agent } from "@mastra/core/agent";
import { model } from "../../config";
import { solanaMonitorTool } from "../solana-agent/solana-tool";
import { solanaMonitorWorkflow } from "./solana-workflow";

// Define Agent Name
const name = "Solana Monitor Agent";

// Define instructions for the agent
const instructions = `
 You are a Solana blockchain monitor agent.
    Your job is to summarize and explain wallet activity such as:
    - Token transfers
    - SOL transfers
    - Smart contract interactions

    Provide:
    - Summarized view of activity
    - Transaction count and token amounts
    - Time-based patterns if visible

    Never ask for a seed phrase or private key.
`;

export const solanaAgent = new Agent({
  name,
  instructions,
  model,
  tools: { solanaMonitorTool },
  workflows: { solanaMonitorWorkflow },
});
