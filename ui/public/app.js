const statusEl = document.getElementById("status");
const briefEl = document.getElementById("brief-output");
const healthEl = document.getElementById("health-output");
const toolingEl = document.getElementById("tooling-output");
const memoryEl = document.getElementById("memory-output");
const sendCheckbox = document.getElementById("send-telegram");
const runButton = document.getElementById("run-brief");

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || `Request failed with ${response.status}`);
  }
  return payload;
}

async function refreshHealth() {
  try {
    const health = await fetchJson("/api/health");
    healthEl.textContent = `UI: online\nEliza background: ${health.elizaStarted ? "enabled" : "disabled"}\nEliza internal port: ${health.elizaInternalPort}`;
  } catch (error) {
    healthEl.textContent = `Health check failed: ${error.message}`;
  }
}

async function refreshTooling() {
  try {
    const tooling = await fetchJson("/api/tooling-status");
    toolingEl.textContent = `GitHub tool status: ${tooling.status}\nRepo configured: ${tooling.data?.repo ? "yes" : "no"}\nCommits (24h): ${tooling.data?.commit_count_24h ?? 0}`;
  } catch (error) {
    toolingEl.textContent = `Tooling check failed: ${error.message}`;
  }
}

async function refreshMemory() {
  try {
    const memory = await fetchJson("/api/memory");
    const latestRun = memory.latest_run;
    if (!latestRun) {
      memoryEl.textContent = "Memory: no saved runs yet. Run the agent once to seed founder context.";
      return;
    }

     if (!briefEl.textContent || briefEl.textContent === "No brief generated yet.") {
      briefEl.textContent = latestRun.brief || "No saved brief available yet.";
    }

    const comparison = latestRun.snapshot?.memory_context;
    const previousFlag = comparison?.previous_run_available ? "yes" : "no";
    const priorities = comparison?.priorities?.slice(0, 2).join("\n- ") || "No saved priorities yet.";
    memoryEl.textContent =
      `Memory online\nLatest saved run: ${latestRun.created_at}\nHas prior comparison: ${previousFlag}\nTop priorities:\n- ${priorities}`;
  } catch (error) {
    memoryEl.textContent = `Memory check failed: ${error.message}`;
  }
}

async function runBrief() {
  statusEl.textContent = "Generating daily founder brief...";
  runButton.disabled = true;
  try {
    const result = await fetchJson("/api/run-brief", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        send: sendCheckbox.checked,
      }),
    });

    briefEl.textContent = result.brief || "No brief returned.";
    const comparison = result.structured_data?.memory?.comparison;
    if (comparison) {
      const priorities = comparison.priorities?.slice(0, 2).join("\n- ") || "No priorities available.";
      memoryEl.textContent =
        `Memory online\nLatest run saved just now\nHas prior comparison: ${comparison.previous_run_available ? "yes" : "no"}\nTop priorities:\n- ${priorities}`;
    }
    if (!sendCheckbox.checked) {
      statusEl.textContent = "Daily founder brief generated.";
    } else if (result.delivery?.status === "ok") {
      statusEl.textContent = "Daily founder brief generated and sent.";
    } else {
      const reason = result.delivery?.error || "Telegram send failed";
      statusEl.textContent = `Daily founder brief generated, but send failed: ${reason}`;
    }
  } catch (error) {
    statusEl.textContent = `Failed: ${error.message}`;
  } finally {
    runButton.disabled = false;
  }
}

runButton.addEventListener("click", runBrief);

refreshHealth();
refreshTooling();
refreshMemory();
