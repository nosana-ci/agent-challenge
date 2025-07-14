import { Agent } from "@mastra/core/agent";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { model } from "../../config";

const agent = new Agent({
  name: "Solana Monitor Agent",
  model,
  instructions: `
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
  `,
});

export const walletInputSchema = z.object({
  walletAddress: z.string().describe("The solana wallet address to monitor"),
});

const walletActivitySchema = z.object({
  transactions: z.array(
    z.object({
      signature: z.string(),
      slot: z.number(),
      timestamp: z.number().optional(),
    }),
  ),
});

const fetchWalletActivity = createStep({
  id: "fetch-wallet-activity",
  description: "Fetch recent transactions for a wallet",
  inputSchema: walletInputSchema,
  outputSchema: walletActivitySchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error("Input Data not found");
    }

    const res = await fetch("https://api.mainnet-beta.solana.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [inputData.walletAddress, { limit: 10 }],
      }),
    });

    const data = await res.json();
    console.log("[STEP: fetchWalletActivity] Raw response:", data);

    return {
      transactions: data.result.map((tx: any) => ({
        signature: tx.signature,
        slot: tx.slot,
        timestamp: tx.blockTime,
      })),
    };
  },
});

const summarizeActivity = createStep({
  id: "summarize-wallet-activity",
  description: "Summarize the activity fetched from Solana",
  inputSchema: walletActivitySchema,
  outputSchema: z.object({ summary: z.string() }),
  execute: async ({ inputData }) => {
    const prompt = `Here are the last few transactions for a wallet:
${JSON.stringify(inputData.transactions, null, 2)}
Summarize this activity clearly and concisely.`;

    const response = await agent.stream([{ role: "user", content: prompt }]);

    let summary = "";
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      summary += chunk;
    }

    return { summary };
  },
});

const solanaMonitorWorkflow = createWorkflow({
  id: "solana-monitor-workflow",
  inputSchema: walletInputSchema,
  outputSchema: z.object({ summary: z.string() }),
})
  .then(fetchWalletActivity)
  .then(summarizeActivity);

solanaMonitorWorkflow.commit();

export { solanaMonitorWorkflow };
