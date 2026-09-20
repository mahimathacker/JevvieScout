const DEFAULT_ENDPOINT = "http://localhost:3000/api/classify";
const endpoint = document.querySelector("#endpoint");
const save = document.querySelector("#save");
const message = document.querySelector("#message");

function permissionPattern(url) {
  return `${url.protocol}//${url.host}/*`;
}

save.addEventListener("click", async () => {
  message.textContent = "";
  try {
    const url = new URL(endpoint.value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Use an HTTP or HTTPS URL.");

    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (!isLocal) {
      const granted = await chrome.permissions.request({ origins: [permissionPattern(url)] });
      if (!granted) throw new Error("Host permission is required for this endpoint.");
    }

    await chrome.storage.sync.set({ apiEndpoint: url.toString() });
    message.textContent = "Endpoint saved. Return to X and scan the page.";
  } catch (error) {
    message.textContent = error.message || "Could not save this endpoint.";
  }
});

chrome.storage.sync.get({ apiEndpoint: DEFAULT_ENDPOINT }).then((values) => {
  endpoint.value = values.apiEndpoint;
});
