import { spawn } from "node:child_process";
import { type Plugin } from "@elizaos/core";

type BackendResult = Record<string, unknown>;

const PYTHON_BIN = process.env.CLAWFOUNDER_PYTHON_BIN || "python3";
const BACKEND_SCRIPT = process.env.CLAWFOUNDER_BACKEND_SCRIPT || "backend_cli.py";
const CONFIG_PATH = process.env.CLAWFOUNDER_CONFIG_PATH || "config/config.json";

const CLAWFOUNDER_SYSTEM_PROMPT =
  "You are ClawFounder, an AI Chief of Staff for a crypto founder. " +
  "You monitor code, treasury, and community activity. " +
  "You generate daily operational briefings with insights and risks. " +
  "You do not output raw data. You summarize and highlight what matters.";

async function runBackend(args: string[]): Promise<BackendResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [BACKEND_SCRIPT, "--config", CONFIG_PATH, ...args], {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `backend exited with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as BackendResult);
      } catch {
        reject(new Error(`backend returned invalid JSON: ${stdout}`));
      }
    });
  });
}

const runDailyBriefAction = {
  name: "RUN_DAILY_BRIEF",
  similes: ["FOUNDER_BRIEF", "DAILY_BRIEF", "CHECK_FOUNDER_SIGNALS"],
  description: "Generate the daily founder brief from GitHub, treasury, price, and Telegram signals.",
  validate: async (_runtime: unknown, message: { content?: { text?: string } }) => {
    const text = message.content?.text?.toLowerCase() || "";
    return (
      text.includes("daily brief") ||
      text.includes("founder brief") ||
      text.includes("run clawfounder") ||
      text.includes("check founder signals")
    );
  },
  handler: async (_runtime: unknown, _message: unknown, state?: { values?: Record<string, unknown> }) => {
    const send = Boolean(state?.values?.sendToTelegram);
    const result = await runBackend(["run-agent", ...(send ? ["--send"] : [])]);
    const brief = String(result.brief || "ClawFounder could not generate a brief.");
    console.log(brief);
    return true;
  },
  examples: [],
};

const founderBriefProvider = {
  name: "founderBriefProvider",
  description: "Provides the latest ClawFounder operational brief on demand.",
  get: async () => {
    try {
      const result = await runBackend(["run-agent"]);
      return {
        text: `System: ${CLAWFOUNDER_SYSTEM_PROMPT}\n\nLatest Brief:\n${String(result.brief || "")}`,
        values: {
          brief: result.brief,
        },
      };
    } catch (error) {
      return {
        text: "ClawFounder backend is currently unavailable.",
        values: {
          error: error instanceof Error ? error.message : "unknown backend error",
        },
      };
    }
  },
};

export const clawFounderPlugin: Plugin = {
  name: "clawfounder-plugin",
  description: "ClawFounder plugin for founder ops monitoring and daily briefing generation.",
  actions: [runDailyBriefAction],
  providers: [founderBriefProvider],
  evaluators: [],
};

export default clawFounderPlugin;
