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
  visualUntil: 0,
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
    .logo { width: 29px; height: 29px; display: grid; place-items: center; border: 2px solid #171915; border-radius: 50%; background: #dfff68; font-size: 17px; transform: rotate(-6deg); }
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
    .mascot-callout { width: min(390px, calc(100vw - 20px)); height: 270px; position: absolute; left: var(--post-x); top: var(--post-y); display: grid; place-items: center; opacity: 0; filter: drop-shadow(0 20px 25px rgba(20,23,18,.2)); }
    .mascot-callout::before { content: ""; width: 360px; height: 235px; position: absolute; left: 50%; top: 54%; z-index: -1; transform: translate(-50%,-50%); border-radius: 50%; background: radial-gradient(ellipse, rgba(255,255,255,.96) 0 44%, rgba(255,255,255,.46) 61%, rgba(255,255,255,0) 75%); }
    .mascot-callout.dm { animation: mascot-rise 2.35s cubic-bezier(.2,.9,.3,1) both; }.mascot-callout.maybe { animation: mascot-peek 2.35s cubic-bezier(.2,.9,.3,1) both; }.mascot-callout.skip { animation: mascot-drop 2.35s cubic-bezier(.2,.9,.3,1) both; }
    .mascot-art { width: 280px; height: 270px; position: relative; }.mascot-art img { width: 100%; height: 100%; display: block; object-fit: contain; }
    .mascot-sign { min-width: 150px; position: absolute; left: 50%; top: 52%; transform: translate(-50%,-50%); color: #171915; text-align: center; font: 950 38px/.9 sans-serif; letter-spacing: -.06em; text-transform: uppercase; text-shadow: 0 2px 0 white, 0 0 8px rgba(255,255,255,.95); -webkit-text-stroke: .35px currentColor; }
    .mascot-callout.dm .mascot-sign { color: #087854; }.mascot-callout.maybe .mascot-sign { color: #9b5b00; }.mascot-callout.skip .mascot-art { width: 340px; }.mascot-callout.skip .mascot-sign { top: 67%; color: #696c66; font-size: 38px; }
    .flying { width: 190px; height: 65px; padding: 7px 13px 7px 7px; position: absolute; left: var(--start-x); top: var(--start-y); display: flex; align-items: center; gap: 9px; border: 3px solid #171915; border-radius: 99px; color: #171915; background: white; box-shadow: 7px 8px 0 #171915; animation: fly-to-zone 1.02s 1.25s cubic-bezier(.38,0,.7,.24) both; }
    .fly-avatar { width: 47px; height: 47px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 50%; color: white; background: var(--avatar); font: 800 10px/1 sans-serif; }.fly-copy { min-width: 0; }.fly-copy strong { display: block; max-width: 105px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 800 11px/1.1 sans-serif; }.fly-copy small { display: block; margin-top: 4px; color: #777b73; font: 700 8px/1 monospace; }
    @keyframes pulse { to { opacity: .3; transform: scale(.7); } }
    @keyframes fly-to-zone { 0% { transform: translate(0,0) rotate(-5deg) scale(.72); opacity: 0; } 24% { transform: translate(calc(var(--dx) * .14), -42px) rotate(7deg) scale(1); opacity: 1; } 48% { transform: translate(calc(var(--dx) * .34), -24px) rotate(-4deg) scale(.9); } 100% { transform: translate(var(--dx), var(--dy)) rotate(12deg) scale(.28); opacity: .1; } }
    @keyframes mascot-rise { 0% { opacity: 0; transform: translate(-50%, 190px) rotate(-5deg) scale(.65); } 8% { opacity: 1; transform: translate(-50%, -14px) rotate(3deg) scale(1.08); } 12%,78% { opacity: 1; transform: translate(-50%, 0) rotate(0) scale(1); } 100% { opacity: 0; transform: translate(-50%, 115px) rotate(5deg) scale(.8); } }
    @keyframes mascot-peek { 0% { opacity: 0; transform: translate(-50%, -220px) rotate(10deg) scale(.7); } 8% { opacity: 1; transform: translate(-50%, 13px) rotate(-4deg) scale(1.05); } 12%,78% { opacity: 1; transform: translate(-50%, 0) rotate(0) scale(1); } 100% { opacity: 0; transform: translate(-50%, -120px) rotate(-6deg) scale(.78); } }
    @keyframes mascot-drop { 0% { opacity: 0; transform: translate(-50%, -260px) rotate(-7deg) scale(.68); } 8% { opacity: 1; transform: translate(-50%, 17px) rotate(3deg) scale(1.06); } 12%,78% { opacity: 1; transform: translate(-50%, 0) rotate(0) scale(1); } 100% { opacity: 0; transform: translate(-50%, 75px) rotate(3deg) scale(.82); } }
    @keyframes land { from { opacity: 0; transform: translateY(-38px) scale(.4) rotate(12deg); } 70% { transform: translateY(4px) scale(1.12) rotate(-4deg); } }
    @media (max-width: 620px) { .dock { bottom: 7px; }.brand small, .text-button { display: none; }.zones { gap: 4px; padding: 6px; }.zone { min-height: 74px; padding: 6px; }.zone-title span { display: none; }.mascot-callout { width: 300px; height: 220px; }.mascot-art { width: 230px; height: 220px; }.mascot-callout.skip .mascot-art { width: 285px; }.mascot-sign { min-width: 120px; font-size: 27px; }.mascot-callout.skip .mascot-sign { font-size: 30px; }.stats { grid-template-columns: repeat(2, 1fr); }.flying { width: 160px; } }
    @media (prefers-reduced-motion: reduce) { .flying, .mascot-callout, .speech, .mini-person { animation-duration: .01ms; } }
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
          <span class="logo">🐱</span>
          <span class="brand">JevvieScout<small>CAT SCOUT MODE · v0.4.1</small></span>
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

function showMascot(article, result) {
  const root = ensureDock();
  const effects = root.querySelector(".effects");
  const callout = document.createElement("div");
  const postRect = article.getBoundingClientRect();
  const horizontalMargin = Math.min(220, window.innerWidth / 2 - 10);
  const targetX = Math.max(horizontalMargin, Math.min(window.innerWidth - horizontalMargin, postRect.left + postRect.width / 2));
  const targetY = Math.max(35, Math.min(window.innerHeight - 310, postRect.top + 5));
  const asset = result.decision === "DM" ? "jev-cat-dm.png" : result.decision === "Maybe" ? "jev-cat-maybe.png" : "jev-cat-skip.png";
  const copy = result.decision === "DM" ? "DM 👋" : result.decision === "Maybe" ? "MAYBE 👀" : "SKIP 💤";
  callout.className = `mascot-callout ${result.decision.toLowerCase()}`;
  callout.style.setProperty("--post-x", `${targetX}px`);
  callout.style.setProperty("--post-y", `${targetY}px`);
  callout.innerHTML = `<div class="mascot-art"><img alt="" /><strong class="mascot-sign"></strong></div>`;
  callout.querySelector("img").src = chrome.runtime.getURL(`assets/${asset}`);
  callout.querySelector(".mascot-sign").textContent = copy;
  effects.appendChild(callout);
  setTimeout(() => callout.remove(), 2370);
}

function articleCardStart(article) {
  const rect = article.getBoundingClientRect();
  return {
    x: Math.max(10, Math.min(window.innerWidth - 200, rect.left + Math.min(60, rect.width * .08))),
    y: Math.max(12, Math.min(window.innerHeight - 78, rect.top + 35)),
  };
}

function animateToZone(article, post, result, generation) {
  if (generation !== state.generation) return;
  const root = ensureDock();
  const effects = root.querySelector(".effects");
  const destination = root.querySelector(`[data-zone="${result.decision}"] .pile`).getBoundingClientRect();
  const start = articleCardStart(article);
  const startX = start.x;
  const startY = start.y;
  const targetX = destination.left + destination.width / 2 - 95;
  const targetY = destination.top + destination.height / 2 - 32;
  const flyer = document.createElement("div");
  flyer.className = "flying";
  flyer.innerHTML = `<span class="fly-avatar"></span><span class="fly-copy"><strong></strong><small>INCOMING SIGNAL</small></span>`;
  flyer.querySelector(".fly-avatar").style.setProperty("--avatar", hashColor(post.handle));
  flyer.querySelector(".fly-avatar").textContent = post.initials;
  flyer.querySelector("strong").textContent = post.name;
  flyer.style.setProperty("--start-x", `${startX}px`);
  flyer.style.setProperty("--start-y", `${startY}px`);
  flyer.style.setProperty("--dx", `${targetX - startX}px`);
  flyer.style.setProperty("--dy", `${targetY - startY}px`);
  effects.appendChild(flyer);
  showMascot(article, result);

  setTimeout(() => {
    flyer.remove();
    if (generation !== state.generation) return;
    state.people[result.decision].push(post);
    state.counts[result.decision] += 1;
    state.analyzed += 1;
    renderPile(result.decision);
    updateDockStats();
  }, 2330);
}

function queueArticle(article) {
  if (!state.enabled || !article.isConnected) return;
  const post = extractPost(article);
  if (!post) return;
  const nextFingerprint = fingerprint(post);
  if (state.cache.get(article) === nextFingerprint) return;
  state.cache.set(article, nextFingerprint);
  state.queue.set(article, post);
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

function scheduleVisual(article, post, result, generation) {
  const now = Date.now();
  const startsAt = Math.max(now, state.visualUntil);
  const delay = startsAt - now;
  state.visualUntil = startsAt + 2350;
  setTimeout(() => {
    if (generation !== state.generation || !article.isConnected) return;
    animateToZone(article, post, result, generation);
  }, delay);
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
      scheduleVisual(article, post, result, generation);
    });
    setDockStatus("watching the feed");
  } catch {
    setDockStatus("Jev needs a retry");
  } finally {
    state.busy = false;
    if (state.queue.size > 0) scheduleProcess(250);
  }
}

function resetScout() {
  state.generation += 1;
  state.visualUntil = 0;
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
  document.querySelectorAll(`[${INLINE_ATTRIBUTE}]`).forEach((node) => node.remove());
  const settings = await chrome.storage.sync.get(DEFAULTS);
  state.enabled = settings.enabled;
  state.goal = settings.goal;
  pageObserver.observe(document.documentElement, { childList: true, subtree: true });
  if (state.enabled) watchPage();
}

start();
