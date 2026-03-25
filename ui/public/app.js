const statusEl = document.getElementById("status");
const briefEl = document.getElementById("brief-output");
const healthEl = document.getElementById("health-output");
const toolingEl = document.getElementById("tooling-output");
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
    statusEl.textContent = sendCheckbox.checked
      ? "Daily founder brief generated and sent."
      : "Daily founder brief generated.";
  } catch (error) {
    statusEl.textContent = `Failed: ${error.message}`;
  } finally {
    runButton.disabled = false;
  }
}

runButton.addEventListener("click", runBrief);

refreshHealth();
refreshTooling();
