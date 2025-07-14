import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { solanaMonitorWorkflow, walletInputSchema } from "./solana-workflow";

export const solanaMonitorTool = createTool({
  id: "solana-monitor-tool",
  description: "Monitor Solana wallet activity and summarize it",
  inputSchema: walletInputSchema,
  outputSchema: z.object({
    summary: z.string(),
  }),
  execute: async ({ context }) => {
    const run = solanaMonitorWorkflow.createRun();
    console.log(context);
    console.log(run);
    const result = await run.start({ inputData: context });
    console.log(result);

    if (result.status !== "success") {
      throw new Error(`Workflow failed: ${result.error}`);
    }

    return result.result;
  },
});
