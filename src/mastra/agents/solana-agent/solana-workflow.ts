import { Agent } from "@mastra/core/agent";
import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { model } from "../../config";

const agent = new Agent({
  name: "Solana Monitor Agent",
  model,
  instructions: `
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
`,
});

export const walletInputSchema = z.object({
  walletAddress: z.string().describe("The Solana wallet address to monitor"),
  lastKnownSignature: z
    .string()
    .optional()
    .describe("Previously seen transaction signature"),
  pollIntervalSeconds: z.number().optional().default(15),
  maxAttempts: z.number().optional().default(10),
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

const pollForNewTransactions = createStep({
  id: "poll-for-new-transactions",
  description: "Poll the wallet until new transactions appear",
  inputSchema: walletInputSchema,
  outputSchema: walletActivitySchema,
  execute: async ({ inputData }) => {
    const {
      walletAddress,
      lastKnownSignature,
      pollIntervalSeconds = 15,
      maxAttempts = 10,
    } = inputData;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const res = await fetch(
        `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getSignaturesForAddress",
            params: [walletAddress, { limit: 10 }],
          }),
        },
      );

      const data = await res.json();
      const allTxs = data.result.map((tx: any) => ({
        signature: tx.signature,
        slot: tx.slot,
        timestamp: tx.blockTime,
      }));

      if (!lastKnownSignature) return { transactions: allTxs };

      const newTxs = [];
      for (const tx of allTxs) {
        if (tx.signature === lastKnownSignature) break;
        newTxs.push(tx);
      }

      if (newTxs.length > 0) return { transactions: newTxs };

      await new Promise((resolve) =>
        setTimeout(resolve, pollIntervalSeconds * 1000),
      );
      attempts++;
    }

    return { transactions: [] };
  },
});

const summarizeActivity = createStep({
  id: "summarize-wallet-activity",
  description: "Summarize the activity fetched from Solana",
  inputSchema: walletActivitySchema,
  outputSchema: z.object({
    summary: z.string(),
    latestSignature: z.string().optional(),
  }),
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

    return {
      summary,
      latestSignature: inputData.transactions[0]?.signature,
    };
  },
});

const solanaMonitorWorkflow = createWorkflow({
  id: "solana-monitor-workflow",
  inputSchema: walletInputSchema,
  outputSchema: z.object({
    summary: z.string(),
    latestSignature: z.string().optional(),
  }),
})
  .then(pollForNewTransactions)
  .then(summarizeActivity);

solanaMonitorWorkflow.commit();

export { solanaMonitorWorkflow };
