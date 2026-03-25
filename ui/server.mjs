import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = normalize(join(__filename, ".."));
const projectRoot = normalize(join(__dirname, ".."));
const publicDir = join(__dirname, "public");

const SERVER_PORT = Number(process.env.SERVER_PORT || 3000);
const ELIZA_INTERNAL_PORT = String(process.env.ELIZA_INTERNAL_PORT || 3001);
const START_ELIZA = process.env.START_ELIZA !== "0";
const PYTHON_BIN = process.env.CLAWFOUNDER_PYTHON_BIN || "python3";
const BACKEND_SCRIPT = process.env.CLAWFOUNDER_BACKEND_SCRIPT || "backend_cli.py";
const CONFIG_PATH = process.env.CLAWFOUNDER_CONFIG_PATH || "config/config.json";

let elizaProcess = null;

function log(message, ...args) {
  console.log(`[FoundersClaw UI] ${message}`, ...args);
}

function startElizaProcess() {
  if (!START_ELIZA) {
    log("ElizaOS background process disabled via START_ELIZA=0");
    return;
  }

  const env = {
    ...process.env,
    SERVER_PORT: ELIZA_INTERNAL_PORT,
  };

  elizaProcess = spawn(
    "pnpm",
    ["exec", "elizaos", "start", "--character", "./characters/agent.character.json"],
    {
      cwd: projectRoot,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  elizaProcess.stdout.on("data", (chunk) => {
    process.stdout.write(`[eliza] ${chunk.toString()}`);
  });
  elizaProcess.stderr.on("data", (chunk) => {
    process.stderr.write(`[eliza] ${chunk.toString()}`);
  });
  elizaProcess.on("exit", (code) => {
    log(`ElizaOS process exited with code ${code}`);
  });
}

function runPythonBackend(args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [BACKEND_SCRIPT, "--config", CONFIG_PATH, ...args], {
      cwd: projectRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
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
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error(`backend returned invalid JSON: ${stdout}`));
      }
    });
  });
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks).toString("utf-8");
  return body ? JSON.parse(body) : {};
}

function contentType(pathname) {
  const ext = extname(pathname);
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "application/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  return "text/html; charset=utf-8";
}

async function serveStatic(res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const resolved = normalize(join(publicDir, safePath));
  if (!resolved.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const data = await readFile(resolved);
    res.writeHead(200, { "Content-Type": contentType(resolved) });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);

  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(
        JSON.stringify({
          ok: true,
          ui: "online",
          elizaInternalPort: ELIZA_INTERNAL_PORT,
          elizaStarted: START_ELIZA,
        })
      );
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/run-brief") {
      const payload = await readBody(req);
      const result = await runPythonBackend(["run-agent", ...(payload.send ? ["--send"] : [])]);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(result));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/tooling-status") {
      const result = await runPythonBackend(["tool", "get_github_activity"]);
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(result));
      return;
    }

    await serveStatic(res, url.pathname);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "unknown server error",
      })
    );
  }
});

startElizaProcess();

server.listen(SERVER_PORT, () => {
  log(`Custom UI listening on http://0.0.0.0:${SERVER_PORT}`);
  log(`ElizaOS internal port configured as ${ELIZA_INTERNAL_PORT}`);
});

function shutdown() {
  if (elizaProcess) {
    elizaProcess.kill("SIGTERM");
  }
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
