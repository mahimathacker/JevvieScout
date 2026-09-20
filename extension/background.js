const DEFAULTS = {
  enabled: true,
  goal: "partnerships",
  apiEndpoint: "http://localhost:3000/api/classify",
};

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.sync.get(DEFAULTS);
  await chrome.storage.sync.set(current);
});

function validateEndpoint(value) {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("The Jev endpoint must use HTTP or HTTPS.");
  }
  return url.toString();
}

async function classify(message) {
  const settings = await chrome.storage.sync.get(DEFAULTS);
  const endpoint = validateEndpoint(settings.apiEndpoint);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      goal: message.goal || settings.goal,
      posts: message.posts,
    }),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || `The Jev server returned HTTP ${response.status}.`);
  }
  return payload;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "JEVVIE_CLASSIFY") return false;

  classify(message)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((error) => sendResponse({ ok: false, error: error.message || "Classification failed." }));

  return true;
});
