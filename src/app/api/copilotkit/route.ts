import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { MastraAgent } from "@ag-ui/mastra";
import { NextRequest } from "next/server";
import { mastra } from "@/mastra";

// 1. You can use any service adapter here for multi-agent support.
const serviceAdapter = new ExperimentalEmptyAdapter();

// 2. Build a Next.js API route that handles the CopilotKit runtime requests.
export const POST = async (req: NextRequest) => {
  console.log("🚀 CopilotKit API route called");
  console.log("⏰ Request timestamp:", new Date().toISOString());

  try {
    // Log the request body to see what's being sent
    const requestClone = req.clone();
    const body = await requestClone.json();
    console.log("📦 Request body:", JSON.stringify(body, null, 2));

    // 3. Create the CopilotRuntime instance and utilize the Mastra AG-UI
    //    integration to get the remote agents. Cache this for performance.
    const agents = MastraAgent.getLocalAgents({ mastra });
    console.log("✅ Agents loaded:", Object.keys(agents));
    const runtime = new CopilotRuntime({
      agents,
    });

    console.log("🤖 Runtime created with agents:", Object.keys(agents));

    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter,
      endpoint: "/api/copilotkit",
    });

    console.log("📨 About to handle request...");
    const startTime = Date.now();
    const response = await handleRequest(req);
    const duration = Date.now() - startTime;
    console.log(`✅ Response generated in ${duration}ms:`, response.status);
    console.log(
      "📤 Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    return response;
  } catch (error) {
    console.error("❌ Error in CopilotKit API route:", error);
    console.error(
      "❌ Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    // Return a proper error response instead of throwing
    return new Response(
      JSON.stringify({
        error: "Failed to process request",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
