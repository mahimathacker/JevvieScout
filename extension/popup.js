const DEFAULTS = { enabled: true, goal: "partnerships" };
const enabled = document.querySelector("#enabled");
const goal = document.querySelector("#goal");
const scan = document.querySelector("#scan");
const status = document.querySelector("#status");
const statusText = document.querySelector("#statusText");
const settings = document.querySelector("#settings");

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function isXPage(url = "") {
  try {
    const host = new URL(url).hostname;
    return host === "x.com" || host.endsWith(".x.com") || host === "twitter.com" || host.endsWith(".twitter.com");
  } catch {
    return false;
  }
}

async function updateStatus() {
  const tab = await activeTab();
  const onX = isXPage(tab?.url);
  scan.disabled = !onX || !enabled.checked;
  status.classList.toggle("live", onX && enabled.checked);

  if (!onX) {
    statusText.textContent = "Open x.com to start scouting visible posts.";
    return;
  }
  if (!enabled.checked) {
    statusText.textContent = "JevvieScout is paused.";
    return;
  }

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "JEVVIE_STATUS" });
    statusText.textContent = response?.analyzed
      ? `${response.analyzed} posts analyzed${response.model ? ` with ${response.model}` : ""}.`
      : "Ready to analyze visible posts with Jev.";
  } catch {
    statusText.textContent = "Refresh this X tab once to activate JevvieScout.";
  }
}

enabled.addEventListener("change", async () => {
  await chrome.storage.sync.set({ enabled: enabled.checked });
  updateStatus();
});

goal.addEventListener("change", async () => {
  await chrome.storage.sync.set({ goal: goal.value });
  statusText.textContent = "Goal updated. Re-analyzing visible posts…";
  setTimeout(updateStatus, 900);
});

scan.addEventListener("click", async () => {
  const tab = await activeTab();
  if (!tab?.id) return;
  scan.disabled = true;
  statusText.textContent = "Sending visible posts to Jev…";
  try {
    await chrome.tabs.sendMessage(tab.id, { type: "JEVVIE_RESCAN" });
    setTimeout(updateStatus, 1200);
  } catch {
    statusText.textContent = "Refresh this X tab and try again.";
    scan.disabled = false;
  }
});

settings.addEventListener("click", () => chrome.runtime.openOptionsPage());

async function init() {
  const values = await chrome.storage.sync.get(DEFAULTS);
  enabled.checked = values.enabled;
  goal.value = values.goal;
  updateStatus();
}

init();
