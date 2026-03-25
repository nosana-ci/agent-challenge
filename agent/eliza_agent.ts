import { spawn } from "node:child_process";

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

type ToolResult = {
  tool: string;
  status: "ok" | "error";
  data: JsonObject;
  error: string | null;
};

type DailyBriefResult = {
  brief: string;
  delivery?: JsonObject | null;
  toolResponses: {
    github: ToolResult;
    price: ToolResult;
    wallet: ToolResult;
    telegram: ToolResult;
  };
};

const PYTHON_BIN = process.env.CLAWFOUNDER_PYTHON_BIN || "python3";
const BACKEND_SCRIPT = process.env.CLAWFOUNDER_BACKEND_SCRIPT || "backend_cli.py";
const CONFIG_PATH = process.env.CLAWFOUNDER_CONFIG_PATH || "config/config.json";

export const clawFounderIdentity = {
  name: "ClawFounder",
  description: "AI Chief of Staff for crypto founders",
  systemPrompt:
    "You monitor code, treasury, and community activity. " +
    "You generate daily operational briefings with insights and risks. " +
    "You do not output raw data. You summarize and highlight what matters.",
};

async function runPythonBackend(args: string[]): Promise<JsonObject> {
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
        reject(new Error(stderr || `Python backend exited with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`Invalid backend JSON: ${stdout}`));
      }
    });
  });
}

async function callPythonTool(name: string, payload: JsonObject = {}): Promise<ToolResult> {
  const result = (await runPythonBackend([
    "tool",
    name,
    "--payload",
    JSON.stringify(payload),
  ])) as ToolResult;
  return result;
}

function inferCommunitySentiment(messages: JsonObject[]): { sentiment: string; count: number } {
  const positives = ["gm", "great", "bullish", "ship", "love", "strong"];
  const negatives = ["bad", "bearish", "rug", "problem", "delay", "dump"];

  let positiveHits = 0;
  let negativeHits = 0;
  for (const message of messages) {
    const text = String(message.text || "").toLowerCase();
    if (positives.some((word) => text.includes(word))) positiveHits += 1;
    if (negatives.some((word) => text.includes(word))) negativeHits += 1;
  }

  const sentiment =
    negativeHits > positiveHits ? "Negative" : positiveHits > negativeHits ? "Positive" : "Neutral";
  return { sentiment, count: messages.length };
}

function buildFallbackBrief(toolResponses: DailyBriefResult["toolResponses"]): string {
  const today = new Date().toISOString().slice(0, 10);
  const github = toolResponses.github.data;
  const wallet = toolResponses.wallet.data;
  const telegram = toolResponses.telegram.data;
  const price = toolResponses.price.data;

  const community = inferCommunitySentiment((telegram.messages as JsonObject[]) || []);
  const alerts: string[] = [];
  const largestTx = Number(((wallet.largest_transaction_24h as JsonObject) || {}).usd_value || 0);
  const priceChange = Number(price.change_24h_pct || 0);

  if (Number(github.commit_count_24h || 0) === 0) alerts.push("No commits landed in the last 24 hours.");
  if (largestTx >= 10000) alerts.push(`Large treasury transaction detected: $${largestTx.toFixed(2)}.`);
  if (community.sentiment === "Negative") alerts.push("Community sentiment is negative.");
  if (priceChange <= -10) alerts.push(`Token price is down sharply over 24h (${priceChange.toFixed(2)}%).`);
  if (alerts.length === 0) alerts.push("No unusual activity detected.");

  return [
    `ClawFounder Daily Brief — ${today}`,
    "",
    "Code Activity",
    `- Commits: ${github.commit_count_24h || 0}`,
    `- PRs: ${github.pull_request_count_24h || 0}`,
    `- Issues: ${github.issue_count_24h || 0}`,
    "",
    "Treasury",
    `- Balance: $${Number(wallet.balance_usd || 0).toFixed(2)}`,
    `- Largest Tx: $${largestTx.toFixed(2)}`,
    "",
    "Community",
    `- Messages: ${community.count}`,
    `- Sentiment: ${community.sentiment}`,
    "",
    "Alerts",
    ...alerts.map((alert) => `- ${alert}`),
  ].join("\n");
}

async function generateBriefWithQwen(toolResponses: DailyBriefResult["toolResponses"]): Promise<string> {
  const endpoint = process.env.OPENAI_API_URL;
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.MODEL_NAME || "Qwen3.5-27B-AWQ-4bit";

  if (!endpoint || !apiKey) {
    return buildFallbackBrief(toolResponses);
  }

  const prompt = [
    clawFounderIdentity.systemPrompt,
    "",
    "Return only the final founder brief in this format:",
    "ClawFounder Daily Brief — [DATE]",
    "",
    "Code Activity",
    "- Commits: X",
    "- PRs: X",
    "- Issues: X",
    "",
    "Treasury",
    "- Balance: $X",
    "- Largest Tx: $X",
    "",
    "Community",
    "- Messages: X",
    "- Sentiment: X",
    "",
    "Alerts",
    "- Any unusual activity",
    "",
    `Tool data: ${JSON.stringify(toolResponses)}`,
  ].join("\n");

  try {
    const response = await fetch(`${endpoint.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: clawFounderIdentity.systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      return buildFallbackBrief(toolResponses);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content?.trim();
    return content || buildFallbackBrief(toolResponses);
  } catch {
    return buildFallbackBrief(toolResponses);
  }
}

export const clawFounderTools = [
  {
    name: "get_github_activity",
    description: "Fetch GitHub repository activity from the Python backend.",
    execute: (payload: JsonObject = {}) => callPythonTool("get_github_activity", payload),
  },
  {
    name: "get_wallet_data",
    description: "Fetch treasury wallet balance and transaction activity from the Python backend.",
    execute: (payload: JsonObject = {}) => callPythonTool("get_wallet_data", payload),
  },
  {
    name: "get_token_price",
    description: "Fetch treasury asset pricing from the Python backend.",
    execute: (payload: JsonObject = {}) => callPythonTool("get_token_price", payload),
  },
  {
    name: "get_telegram_activity",
    description: "Fetch Telegram community activity from the Python backend.",
    execute: (payload: JsonObject = {}) => callPythonTool("get_telegram_activity", payload),
  },
  {
    name: "send_telegram_message",
    description: "Send the final founder brief to Telegram using the Python backend.",
    execute: (payload: JsonObject = {}) => callPythonTool("send_telegram_message", payload),
  },
];

export async function runDailyBrief(options: { send?: boolean } = {}): Promise<DailyBriefResult> {
  const price = await callPythonTool("get_token_price");
  const github = await callPythonTool("get_github_activity");
  const wallet = await callPythonTool("get_wallet_data", { price_data: price.data });
  const telegram = await callPythonTool("get_telegram_activity");

  const toolResponses = { github, price, wallet, telegram };
  const brief = await generateBriefWithQwen(toolResponses);
  let delivery: JsonObject | null = null;

  if (options.send) {
    const sendResult = await callPythonTool("send_telegram_message", { text: brief });
    delivery = sendResult.data;
  }

  return { brief, delivery, toolResponses };
}

export default {
  identity: clawFounderIdentity,
  tools: clawFounderTools,
  runDailyBrief,
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const shouldSend = process.argv.includes("--send");
  runDailyBrief({ send: shouldSend })
    .then((result) => {
      console.log(result.brief);
      if (result.delivery) {
        console.error(`Telegram delivery: ${JSON.stringify(result.delivery)}`);
      }
    })
    .catch((error: Error) => {
      console.error(error.message);
      process.exit(1);
    });
}
