import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { solanaMonitorWorkflow, walletInputSchema } from "./solana-workflow";

export const solanaMonitorTool = createTool({
  id: "solana-monitor-tool",
  description: "Monitor Solana wallet activity and summarize it",
  inputSchema: walletInputSchema,
  outputSchema: z.object({
    summary: z.string(),
    latestSignature: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const run = solanaMonitorWorkflow.createRun();
    const result = await run.start({ inputData: context });

    if (result.status !== "success") {
      const failedStep = Object.values(result.steps).find(
        (step) => step.status === "failed",
      );
      const errorMessage = failedStep?.error || "Unknown error in workflow.";
      throw new Error(`Workflow failed: ${errorMessage}`);
    }

    return {
      summary: result.result.summary,
      latestSignature: result.result.latestSignature,
    };
  },
});
