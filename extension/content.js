const DEFAULTS = { enabled: true, goal: "partnerships" };
const INLINE_ATTRIBUTE = "data-jevvie-inline";
const DOCK_ATTRIBUTE = "data-jevvie-dock";

const state = {
  enabled: true,
  goal: "partnerships",
  busy: false,
  processTimer: null,
  scanTimer: null,
  generation: 0,
  queue: new Map(),
  cache: new WeakMap(),
  observed: new WeakSet(),
  analyzed: 0,
  lastModel: "",
  latencies: [],
  totalCost: 0,
  counts: { DM: 0, Maybe: 0, Skip: 0 },
  people: { DM: [], Maybe: [], Skip: [] },
};

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function extractPost(article) {
  const tweetNode = article.querySelector('[data-testid="tweetText"]');
  if (!tweetNode) return null;
  const text = cleanText(tweetNode.innerText || tweetNode.textContent);
  if (!text) return null;

  const userNode = article.querySelector('[data-testid="User-Name"]');
  const userText = cleanText(userNode?.innerText || userNode?.textContent);
  const handle = userText.match(/@[A-Za-z0-9_]+/)?.[0] || "";
  const name = cleanText(userText.split("@")[0]) || handle || "X user";
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "X";
  const statusLink = Array.from(article.querySelectorAll('a[href*="/status/"]')).map((link) => link.href).find(Boolean) || location.href;
  const context = [userText];
  const currentProfile = location.pathname.split("/").filter(Boolean)[0];

  if (handle && currentProfile && handle.slice(1).toLowerCase() === currentProfile.toLowerCase()) {
    const bio = cleanText(document.querySelector('[data-testid="UserDescription"]')?.innerText);
    const profileItems = cleanText(document.querySelector('[data-testid="UserProfileHeader_Items"]')?.innerText);
    if (bio) context.push(`Bio: ${bio}`);
    if (profileItems) context.push(profileItems);
  }

  const socialContext = cleanText(article.querySelector('[data-testid="socialContext"]')?.innerText);
  if (socialContext) context.push(socialContext);

  return {
    name,
    handle,
    initials,
    role: context.filter(Boolean).join(" · ").slice(0, 500),
    text: text.slice(0, 4000),
    url: statusLink,
  };
}

function fingerprint(post) {
  return `${state.goal}|${post.handle}|${post.text}`;
}

function hashColor(value) {
  const palette = ["#f07352", "#6b65c7", "#21836c", "#3e68ad", "#bb5f86", "#b97835", "#1f7d92"];
  const hash = Array.from(value || "X").reduce((total, character) => total + character.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function dockStyles() {
  return `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .world { position: fixed; inset: 0; z-index: 2147483646; pointer-events: none; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #171915; }
    .dock { width: min(520px, calc(100vw - 24px)); position: absolute; left: 50%; bottom: 13px; transform: translateX(-50%); border: 1px solid rgba(24,26,22,.16); border-radius: 19px; background: rgba(251,251,247,.94); box-shadow: 0 15px 45px rgba(25,28,22,.18); backdrop-filter: blur(18px); overflow: hidden; pointer-events: auto; transition: transform .3s ease, opacity .3s ease; }
    .dock.minimized { transform: translate(-50%, calc(100% - 43px)); opacity: .9; }
    .dock-head { height: 42px; padding: 0 12px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #e3e3dc; }
    .logo { width: 22px; height: 22px; display: grid; place-items: center; border-radius: 50%; color: white; background: #191b17; font: italic 15px Georgia, serif; transform: rotate(-6deg); }
    .brand { font: 700 10px/1 sans-serif; letter-spacing: -.01em; }.brand small { display: block; margin-top: 2px; color: #8b8e86; font: 500 7px/1 monospace; letter-spacing: .08em; }
    .status { margin-left: auto; display: flex; align-items: center; gap: 6px; color: #777b73; font: 500 8px/1 monospace; }.status i { width: 6px; height: 6px; border-radius: 50%; background: #239c69; box-shadow: 0 0 0 3px rgba(35,156,105,.12); }.status.thinking i { background: #3158e8; animation: pulse .55s infinite alternate; }
    .text-button { border: 0; background: transparent; color: #777b73; padding: 6px; font: 600 8px/1 monospace; cursor: pointer; }
    .minimize { width: 24px; height: 24px; border: 0; border-radius: 50%; background: #efefe9; cursor: pointer; }
    .zones { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 8px; }
    .zone { min-width: 0; min-height: 86px; padding: 8px; border: 1px solid; border-radius: 13px; position: relative; overflow: hidden; }
    .zone.dm { color: #087854; border-color: #b8dcca; background: #f0faf4; }.zone.maybe { color: #9b5b00; border-color: #e8d4aa; background: #fff9ed; }.zone.skip { color: #6d7069; border-color: #dadbd5; background: #f5f5f2; }
    .zone-title { display: flex; align-items: center; gap: 5px; font: 700 8px/1 sans-serif; }.zone-title em { font-style: normal; font-size: 13px; }.zone-title b { margin-left: auto; font: 500 13px Georgia, serif; }
    .pile { height: 48px; margin-top: 7px; display: flex; align-items: flex-end; justify-content: center; }
    .mini-person { width: 28px; margin-left: -5px; display: flex; flex-direction: column; align-items: center; animation: land .5s cubic-bezier(.2,1.7,.4,1) both; }.mini-person:first-child { margin-left: 0; }.mini-person:nth-child(2n) { transform: translateY(-5px) rotate(5deg); }
    .avatar { width: 26px; height: 26px; display: grid; place-items: center; border: 2px solid white; border-radius: 50%; color: white; background: var(--avatar); box-shadow: 0 1px 5px rgba(0,0,0,.18); font: 700 7px/1 sans-serif; }
    .more { margin-left: 3px; color: #777b73; font: 600 8px/26px monospace; }
    .stats { display: none; grid-template-columns: repeat(4, 1fr); gap: 1px; border-top: 1px solid #e3e3dc; background: #e3e3dc; }.stats.open { display: grid; }
    .metric { padding: 9px; background: #fbfbf7; }.metric span { display: block; color: #959890; font: 500 7px/1 monospace; }.metric strong { display: block; margin-top: 4px; font: 600 10px/1 monospace; }
    .toast { min-width: 265px; max-width: calc(100vw - 30px); position: absolute; left: 50%; bottom: 164px; transform: translate(-50%, 14px) scale(.9); display: flex; align-items: center; gap: 9px; padding: 9px 12px; border: 1px solid #deded7; border-radius: 99px; background: rgba(255,255,252,.97); box-shadow: 0 10px 30px rgba(25,28,22,.14); opacity: 0; animation: toast 1.65s ease both; }
    .toast .avatar { width: 31px; height: 31px; flex: 0 0 auto; }.toast-copy { min-width: 0; }.toast-copy strong { display: block; font: 700 11px/1.1 sans-serif; }.toast-copy small { display: block; max-width: 195px; margin-top: 3px; color: #777b73; font: 500 8px/1.1 monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }.toast-emoji { margin-left: auto; font-size: 22px; }
    .flying { width: 38px; height: 38px; position: absolute; left: var(--start-x); top: var(--start-y); display: grid; place-items: center; border: 3px solid white; border-radius: 50%; color: white; background: var(--avatar); box-shadow: 0 6px 18px rgba(0,0,0,.22); font: 700 9px/1 sans-serif; animation: fly .82s cubic-bezier(.42,0,.72,.25) both; }
    @keyframes pulse { to { opacity: .3; transform: scale(.7); } }
    @keyframes fly { 0% { transform: translate(0,0) scale(.72); } 32% { transform: translate(calc(var(--dx) * .22), -42px) scale(1.15) rotate(-8deg); } 100% { transform: translate(var(--dx), var(--dy)) scale(.62) rotate(10deg); opacity: .18; } }
    @keyframes toast { 0% { opacity: 0; transform: translate(-50%, 14px) scale(.9); } 15%,78% { opacity: 1; transform: translate(-50%, 0) scale(1); } 100% { opacity: 0; transform: translate(-50%, -9px) scale(.96); } }
    @keyframes land { from { opacity: 0; transform: translateY(-38px) scale(.4) rotate(12deg); } 70% { transform: translateY(4px) scale(1.12) rotate(-4deg); } }
    @media (max-width: 620px) { .dock { bottom: 7px; }.brand small, .text-button { display: none; }.zones { gap: 4px; padding: 6px; }.zone { min-height: 74px; padding: 6px; }.zone-title span { display: none; }.toast { bottom: 146px; }.stats { grid-template-columns: repeat(2, 1fr); } }
    @media (prefers-reduced-motion: reduce) { .flying { animation-duration: .01ms; }.toast, .mini-person { animation-duration: .01ms; } }
  `;
}

function ensureDock() {
  let host = document.querySelector(`[${DOCK_ATTRIBUTE}]`);
  if (host) return host.shadowRoot;

  host = document.createElement("div");
  host.setAttribute(DOCK_ATTRIBUTE, "");
  document.documentElement.appendChild(host);
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
    <style>${dockStyles()}</style>
    <div class="world">
      <section class="dock">
        <div class="dock-head">
          <span class="logo">J</span>
          <span class="brand">JevvieScout<small>SCROLL. SPOT. SAY HELLO.</small></span>
          <span class="status"><i></i><span>watching the feed</span></span>
          <button class="text-button stats-toggle" type="button">STATS</button>
          <button class="minimize" type="button" aria-label="Minimize JevvieScout">−</button>
        </div>
        <div class="zones">
          <div class="zone dm" data-zone="DM"><div class="zone-title"><em>👋</em><span>DM</span><b>0</b></div><div class="pile"></div></div>
          <div class="zone maybe" data-zone="Maybe"><div class="zone-title"><em>👀</em><span>Maybe</span><b>0</b></div><div class="pile"></div></div>
          <div class="zone skip" data-zone="Skip"><div class="zone-title"><em>💤</em><span>Skip</span><b>0</b></div><div class="pile"></div></div>
        </div>
        <div class="stats">
          <div class="metric"><span>ANALYZED</span><strong data-stat="analyzed">0</strong></div>
          <div class="metric"><span>AVG API BATCH</span><strong data-stat="latency">—</strong></div>
          <div class="metric"><span>EST. COST</span><strong data-stat="cost">—</strong></div>
          <div class="metric"><span>MODEL</span><strong data-stat="model">—</strong></div>
        </div>
      </section>
      <div class="effects"></div>
    </div>`;

  root.querySelector(".minimize").addEventListener("click", () => root.querySelector(".dock").classList.toggle("minimized"));
  root.querySelector(".stats-toggle").addEventListener("click", () => root.querySelector(".stats").classList.toggle("open"));
  return root;
}

function setDockStatus(text, thinking = false) {
  const root = ensureDock();
  const status = root.querySelector(".status");
  status.classList.toggle("thinking", thinking);
  status.querySelector("span").textContent = text;
}

function updateDockStats() {
  const root = ensureDock();
  Object.entries(state.counts).forEach(([decision, count]) => {
    root.querySelector(`[data-zone="${decision}"] b`).textContent = count;
  });
  const averageLatency = state.latencies.length ? Math.round(state.latencies.reduce((sum, value) => sum + value, 0) / state.latencies.length) : 0;
  const cost = state.totalCost > 0 && state.totalCost < 0.0001 ? "<$0.0001" : state.totalCost ? `$${state.totalCost.toFixed(5)}` : "—";
  root.querySelector('[data-stat="analyzed"]').textContent = state.analyzed;
  root.querySelector('[data-stat="latency"]').textContent = averageLatency ? `${averageLatency}ms` : "—";
  root.querySelector('[data-stat="cost"]').textContent = cost;
  root.querySelector('[data-stat="model"]').textContent = state.lastModel || "—";
}

function renderPile(decision) {
  const root = ensureDock();
  const pile = root.querySelector(`[data-zone="${decision}"] .pile`);
  pile.replaceChildren();
  const visible = state.people[decision].slice(-5);
  visible.forEach((post) => {
    const person = document.createElement("div");
    person.className = "mini-person";
    person.title = post.name;
    person.innerHTML = `<span class="avatar"></span>`;
    person.querySelector(".avatar").style.setProperty("--avatar", hashColor(post.handle));
    person.querySelector(".avatar").textContent = post.initials;
    pile.appendChild(person);
  });
  if (state.people[decision].length > visible.length) {
    const more = document.createElement("span");
    more.className = "more";
    more.textContent = `+${state.people[decision].length - visible.length}`;
    pile.appendChild(more);
  }
}

function showToast(post, result) {
  const root = ensureDock();
  const effects = root.querySelector(".effects");
  const toast = document.createElement("div");
  const copy = result.decision === "DM" ? "DM them" : result.decision === "Maybe" ? "keep watching" : "let it pass";
  const emoji = result.decision === "DM" ? "👋" : result.decision === "Maybe" ? "👀" : "💤";
  toast.className = "toast";
  toast.innerHTML = `<span class="avatar"></span><span class="toast-copy"><strong></strong><small></small></span><span class="toast-emoji"></span>`;
  toast.querySelector(".avatar").style.setProperty("--avatar", hashColor(post.handle));
  toast.querySelector(".avatar").textContent = post.initials;
  toast.querySelector("strong").textContent = `${post.name} — ${copy}`;
  toast.querySelector("small").textContent = `${result.opportunity} · ${result.confidence}%`;
  toast.querySelector(".toast-emoji").textContent = emoji;
  effects.appendChild(toast);
  setTimeout(() => toast.remove(), 1700);
}

function articleAvatarRect(article) {
  const avatar = article.querySelector('[data-testid^="UserAvatar-"]') || article.querySelector('[data-testid="Tweet-User-Avatar"]') || article;
  const rect = avatar.getBoundingClientRect();
  return {
    x: Math.max(10, Math.min(window.innerWidth - 48, rect.left + rect.width / 2 - 19)),
    y: Math.max(10, Math.min(window.innerHeight - 48, rect.top + rect.height / 2 - 19)),
  };
}

function animateToZone(article, post, result, generation) {
  if (generation !== state.generation) return;
  const root = ensureDock();
  const effects = root.querySelector(".effects");
  const destination = root.querySelector(`[data-zone="${result.decision}"] .pile`).getBoundingClientRect();
  const start = articleAvatarRect(article);
  const targetX = destination.left + destination.width / 2 - 19;
  const targetY = destination.top + destination.height / 2 - 19;
  const flyer = document.createElement("div");
  flyer.className = "flying";
  flyer.textContent = post.initials;
  flyer.style.setProperty("--avatar", hashColor(post.handle));
  flyer.style.setProperty("--start-x", `${start.x}px`);
  flyer.style.setProperty("--start-y", `${start.y}px`);
  flyer.style.setProperty("--dx", `${targetX - start.x}px`);
  flyer.style.setProperty("--dy", `${targetY - start.y}px`);
  effects.appendChild(flyer);
  showToast(post, result);

  setTimeout(() => {
    flyer.remove();
    if (generation !== state.generation) return;
    state.people[result.decision].push(post);
    state.counts[result.decision] += 1;
    state.analyzed += 1;
    renderPile(result.decision);
    updateDockStats();
  }, 820);
}

function inlineStyles() {
  return `
    :host { all: initial; }
    .pill { width: max-content; margin: 8px 0 2px; padding: 5px 8px; display: flex; align-items: center; gap: 6px; border-radius: 99px; font: 600 10px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; animation: arrive .3s cubic-bezier(.2,1.5,.4,1); }
    .pill.dm { color: #087854; background: #e0f2e8; }.pill.maybe { color: #955700; background: #f7ead1; }.pill.skip { color: #676a64; background: #e9e9e5; }
    .pill small { opacity: .72; font: 500 8px/1 monospace; }.dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
    .loading { color: #73776f; background: #f0f0eb; }.loading .dot { background: #3158e8; animation: pulse .6s infinite alternate; }
    @keyframes arrive { from { opacity: 0; transform: translateY(-5px) scale(.85); } } @keyframes pulse { to { opacity: .25; transform: scale(.6); } }
  `;
}

function inlineHost(article) {
  let host = article.querySelector(`:scope [${INLINE_ATTRIBUTE}]`);
  if (host) return host.shadowRoot;
  host = document.createElement("span");
  host.setAttribute(INLINE_ATTRIBUTE, "");
  const textNode = article.querySelector('[data-testid="tweetText"]');
  (textNode?.parentElement || article).appendChild(host);
  return host.attachShadow({ mode: "open" });
}

function renderInlineLoading(article) {
  inlineHost(article).innerHTML = `<style>${inlineStyles()}</style><div class="pill loading"><span class="dot"></span>Jevvie is scouting…</div>`;
}

function renderInlineResult(article, result) {
  const root = inlineHost(article);
  const decision = result.decision.toLowerCase();
  const emoji = result.decision === "DM" ? "👋" : result.decision === "Maybe" ? "👀" : "💤";
  root.innerHTML = `<style>${inlineStyles()}</style><div class="pill ${decision}"><span>${emoji}</span><strong></strong><small></small></div>`;
  root.querySelector("strong").textContent = result.decision;
  root.querySelector("small").textContent = `${result.opportunity} · ${result.confidence}%`;
}

function renderInlineError(article) {
  inlineHost(article).innerHTML = `<style>${inlineStyles()}</style><div class="pill skip"><span>↻</span><strong>Jev unavailable</strong></div>`;
}

function queueArticle(article) {
  if (!state.enabled || !article.isConnected) return;
  const post = extractPost(article);
  if (!post) return;
  const nextFingerprint = fingerprint(post);
  if (state.cache.get(article) === nextFingerprint) return;
  state.cache.set(article, nextFingerprint);
  state.queue.set(article, post);
  renderInlineLoading(article);
  setDockStatus(`reading ${state.queue.size} signal${state.queue.size === 1 ? "" : "s"}`, true);
  scheduleProcess();
}

const visibilityObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting && entry.intersectionRatio >= 0.3) queueArticle(entry.target);
  });
}, { threshold: [0.3, 0.65] });

function watchPage(force = false) {
  if (!state.enabled) return;
  ensureDock();
  document.querySelectorAll('article[data-testid="tweet"]').forEach((article) => {
    if (!state.observed.has(article)) {
      state.observed.add(article);
      visibilityObserver.observe(article);
    }
    if (force) state.cache.delete(article);
    const rect = article.getBoundingClientRect();
    const isVisible = rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
    if (isVisible) queueArticle(article);
  });
}

function scheduleProcess(delay = 420) {
  clearTimeout(state.processTimer);
  state.processTimer = setTimeout(processQueue, delay);
}

async function processQueue() {
  if (!state.enabled || state.busy || state.queue.size === 0) return;
  state.busy = true;
  const generation = state.generation;
  const batch = Array.from(state.queue.entries()).filter(([article]) => article.isConnected).slice(0, 8);
  batch.forEach(([article]) => state.queue.delete(article));
  if (batch.length === 0) {
    state.busy = false;
    return;
  }
  setDockStatus(`Jev is sorting ${batch.length}`, true);

  try {
    const response = await chrome.runtime.sendMessage({ type: "JEVVIE_CLASSIFY", goal: state.goal, posts: batch.map(([, post]) => post) });
    if (!response?.ok) throw new Error(response?.error || "JevvieScout could not reach Jev.");
    if (!Array.isArray(response.data?.results) || response.data.results.length !== batch.length) throw new Error("Jev returned an incomplete batch.");
    if (generation !== state.generation) return;

    state.lastModel = response.data.model || "Jev";
    state.latencies.push(Number(response.data.latency || 0));
    state.totalCost += Number(response.data.batchCost || 0);
    updateDockStats();

    batch.forEach(([article, post], index) => {
      const result = response.data.results[index];
      setTimeout(() => {
        if (!article.isConnected || generation !== state.generation) return;
        renderInlineResult(article, result);
        animateToZone(article, post, result, generation);
      }, index * 230);
    });
    setDockStatus("watching the feed");
  } catch {
    batch.forEach(([article]) => { if (article.isConnected) renderInlineError(article); });
    setDockStatus("Jev needs a retry");
  } finally {
    state.busy = false;
    if (state.queue.size > 0) scheduleProcess(250);
  }
}

function resetScout() {
  state.generation += 1;
  clearTimeout(state.processTimer);
  clearTimeout(state.scanTimer);
  state.queue.clear();
  state.cache = new WeakMap();
  state.observed = new WeakSet();
  visibilityObserver.disconnect();
  state.analyzed = 0;
  state.lastModel = "";
  state.latencies = [];
  state.totalCost = 0;
  state.counts = { DM: 0, Maybe: 0, Skip: 0 };
  state.people = { DM: [], Maybe: [], Skip: [] };
  document.querySelectorAll(`[${INLINE_ATTRIBUTE}]`).forEach((node) => node.remove());
  document.querySelector(`[${DOCK_ATTRIBUTE}]`)?.remove();
}

function removeScout() {
  resetScout();
  visibilityObserver.disconnect();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "JEVVIE_RESCAN") {
    state.cache = new WeakMap();
    watchPage(true);
    sendResponse({ ok: true });
    return false;
  }
  if (message?.type === "JEVVIE_STATUS") {
    sendResponse({ ok: true, analyzed: state.analyzed, queued: state.queue.size, model: state.lastModel });
    return false;
  }
  return false;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  if (changes.enabled) state.enabled = changes.enabled.newValue;
  if (changes.goal) state.goal = changes.goal.newValue;
  resetScout();
  if (state.enabled) watchPage();
});

const pageObserver = new MutationObserver(() => {
  if (!state.enabled) return;
  clearTimeout(state.scanTimer);
  state.scanTimer = setTimeout(() => watchPage(false), 280);
});

async function start() {
  const settings = await chrome.storage.sync.get(DEFAULTS);
  state.enabled = settings.enabled;
  state.goal = settings.goal;
  pageObserver.observe(document.documentElement, { childList: true, subtree: true });
  if (state.enabled) watchPage();
}

start();
