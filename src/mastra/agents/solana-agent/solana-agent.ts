import { Agent } from "@mastra/core/agent";
import { model } from "../../config";
import { solanaMonitorTool } from "../solana-agent/solana-tool";
import { solanaMonitorWorkflow } from "./solana-workflow";

// Define Agent Name
const name = "Solana Monitor Agent";

// Define instructions for the agent
const instructions = `
  You are a Solana blockchain monitor agent.
  Your job is to analyze and summarize wallet activity including:
  - SOL transfers
  - SPL token transfers
  - Smart contract interactions

  Your output should include:
  - A clear summary of the wallet's recent activity
  - Number of transactions and total token amounts involved
  - Any noticeable time-based patterns (e.g., frequent transfers, inactive periods)

  Never ask for a seed phrase or private key.
`;

export const solanaAgent = new Agent({
  name,
  instructions,
  model,
  tools: { solanaMonitorTool },
  workflows: { solanaMonitorWorkflow },
});
