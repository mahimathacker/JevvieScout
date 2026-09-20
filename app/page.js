"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IconBolt,
  IconChevronDown,
  IconClock,
  IconCurrencyDollar,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconSparkles,
} from "@tabler/icons-react";

const goals = [
  { id: "partnerships", label: "Partnerships" },
  { id: "customers", label: "Customers" },
  { id: "hiring", label: "Opportunities" },
  { id: "creator", label: "Creator collabs" },
  { id: "discovery", label: "Customer discovery" },
  { id: "networking", label: "Networking" },
];

const posts = [
  { name: "Maya Chen", handle: "@mayabuilds", initials: "MC", role: "Community & DevRel · Orbit Labs", color: "#f07352", text: "Looking for AI tooling companies to collaborate with for an upcoming developer event in SF. DMs open!" },
  { name: "Theo Martin", handle: "@theomakes", initials: "TM", role: "Indie founder · Clove", color: "#7a63d5", text: "Reminder: consistency beats talent when talent doesn't show up. Keep building." },
  { name: "Jon Bell", handle: "@jonbelltweets", initials: "JB", role: "Creator · The Operator Edit", color: "#27876f", text: "Putting together an interview series on how founders find their first 20 customers. Looking for thoughtful operators with stories to share." },
  { name: "Alex Rivera", handle: "@alexonproduct", initials: "AR", role: "VP Product · Relay", color: "#4966b1", text: "Our team spends hours combing through social posts to find actual intent. Evaluating tools now. Any recommendations?" },
  { name: "Priya Shah", handle: "@priyashah", initials: "PS", role: "Co-founder · Looma", color: "#ad5f86", text: "Just shipped our new landing page. Six weeks of iteration and one very patient designer." },
  { name: "Nadia Okafor", handle: "@nadiaokafor", initials: "NO", role: "Head of Growth · Common Thread", color: "#ba743d", text: "Our founder community crossed 8,000 members. Now looking for partners to help us keep conversations genuinely useful as we grow." },
  { name: "Marcus Liu", handle: "@marcusbuilds", initials: "ML", role: "Founder · Tallypath", color: "#18758f", text: "We're hiring our first partnerships lead. Developer tools experience is a huge plus. Intros appreciated." },
  { name: "Elena Rossi", handle: "@elenatalks", initials: "ER", role: "Host · Practical AI", color: "#dd665b", text: "Who is doing genuinely interesting work in AI agents? Booking guests for a new podcast mini-series." },
  { name: "Sam Wilson", handle: "@samdotbuild", initials: "SW", role: "Designer · Independent", color: "#58616e", text: "Coffee, a clean desk, and four uninterrupted hours. Perfect Saturday." },
  { name: "Omar Farouk", handle: "@omargrows", initials: "OF", role: "Growth · Northstar", color: "#239769", text: "Searching for three design partners who sell to technical teams. We'll build your custom intent workflow with you." },
  { name: "Ava Brooks", handle: "@avabrooks", initials: "AB", role: "Writer · On the Way", color: "#ce8c26", text: "Your network is your net worth. Read that again." },
  { name: "Dani Kim", handle: "@danikim", initials: "DK", role: "Ecosystem · Arcadia", color: "#7254b2", text: "Planning our Q4 partner showcase. If your product helps early-stage teams move faster, I would love to see it." },
  { name: "Luis Ortega", handle: "@luisops", initials: "LO", role: "Revenue Ops · Frame", color: "#306ca4", text: "Our outbound stack has nine tools and somehow the reps still live in spreadsheets. There has to be a simpler way." },
  { name: "Zoe Palmer", handle: "@zoepalmer", initials: "ZP", role: "Founder · Sunday", color: "#c25368", text: "Beautiful morning run. Sometimes the best product strategy is leaving your laptop at home." },
  { name: "Ishan Gupta", handle: "@ishangupta", initials: "IG", role: "Community builder · DevHouse", color: "#257e7b", text: "Opening five sponsor spots for our developer residency. Looking for tools our members would actually use every day." },
];

const buckets = [
  { decision: "DM", emoji: "👋", title: "DM them", note: "clear signal" },
  { decision: "Maybe", emoji: "👀", title: "Keep watching", note: "worth a look" },
  { decision: "Skip", emoji: "💤", title: "Let it pass", note: "not right now" },
];

const chunk = (items, size) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, index * size + size));

function PersonAvatar({ post, small = false }) {
  return <span className={`person-avatar${small ? " small" : ""}`} style={{ "--avatar": post.color }}>{post.initials}</span>;
}

function GoalSelect({ goal, onChange }) {
  return (
    <label className="goal-select">
      <span>I&apos;m looking for</span>
      <select value={goal} onChange={(event) => onChange(event.target.value)}>
        {goals.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
      <IconChevronDown size={16} stroke={1.8} />
    </label>
  );
}

function IncomingCard({ post, result, phase }) {
  if (!post) return null;
  const destination = result?.decision?.toLowerCase() || "maybe";
  const decisionCopy = result?.decision === "DM" ? "DM them" : result?.decision === "Maybe" ? "keep watching" : "skip";
  const decisionEmoji = result?.decision === "DM" ? "👋" : result?.decision === "Maybe" ? "👀" : "🏃";

  return (
    <article className={`incoming-card phase-${phase} to-${destination}`}>
      <div className="person-row">
        <PersonAvatar post={post} />
        <div><strong>{post.name}</strong><span>{post.handle}</span></div>
        <span className="post-now">now</span>
      </div>
      <p>{post.text}</p>
      <div className="thinking-line"><span /><span /><span /><em>Jev is reading the signal</em></div>
      {result && (
        <div className="verdict-stamp">
          <strong><span>{decisionEmoji}</span>{decisionCopy}</strong>
          <small>{result.opportunity} · {result.confidence}%</small>
        </div>
      )}
    </article>
  );
}

function Bucket({ config, people }) {
  return (
    <section className={`bucket bucket-${config.decision.toLowerCase()}`}>
      <div className="bucket-label">
        <span className="bucket-emoji">{config.emoji}</span>
        <div><strong>{config.title}</strong><small>{config.note}</small></div>
        <b>{people.length}</b>
      </div>
      <div className="people-pile">
        {people.map(({ post, result, index }, pileIndex) => (
          <div className="pile-person" key={`${post.handle}-${index}`} style={{ "--pile": pileIndex }} title={`${post.name} · ${result.opportunity} · ${result.confidence}%`}>
            <PersonAvatar post={post} small />
            <span>{post.name.split(" ")[0]}</span>
          </div>
        ))}
        {people.length === 0 && <span className="empty-bucket">waiting for a signal…</span>}
      </div>
    </section>
  );
}

function StatsDrawer({ open, setOpen, processed, metrics, counts }) {
  const cost = metrics.cost > 0 && metrics.cost < 0.0001 ? "<$0.0001" : `$${metrics.cost.toFixed(6)}`;
  return (
    <section className={`stats-drawer${open ? " open" : ""}`}>
      <button className="drawer-handle" onClick={() => setOpen(!open)}>
        <span><i />Live run</span>
        <strong>{processed} analyzed</strong>
        <IconChevronDown size={17} />
      </button>
      <div className="drawer-body">
        <div className="metric"><IconSparkles size={17} /><span>Analyzed</span><strong>{processed}<small> / {posts.length}</small></strong></div>
        <div className="metric"><IconClock size={17} /><span>Avg. API batch</span><strong>{metrics.latency || "—"}<small>{metrics.latency ? "ms" : ""}</small></strong></div>
        <div className="metric"><IconCurrencyDollar size={17} /><span>Est. run cost</span><strong>{metrics.cost ? cost : "—"}</strong></div>
        <div className="decision-totals"><span><i className="dm-dot" />DM <b>{counts.DM || 0}</b></span><span><i className="maybe-dot" />Maybe <b>{counts.Maybe || 0}</b></span><span><i className="skip-dot" />Skip <b>{counts.Skip || 0}</b></span></div>
        <div className="model-note"><IconBolt size={14} />{metrics.model || "jev-latest"}</div>
      </div>
    </section>
  );
}

export default function Home() {
  const [goal, setGoal] = useState("partnerships");
  const [results, setResults] = useState([]);
  const [processed, setProcessed] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState("waiting");
  const [playing, setPlaying] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [run, setRun] = useState(0);
  const [statsOpen, setStatsOpen] = useState(false);
  const [metrics, setMetrics] = useState({ latency: 0, cost: 0, model: "" });

  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    setResults([]);
    setProcessed([]);
    setActiveIndex(0);
    setPhase("waiting");

    async function classifyFeed() {
      try {
        const batches = chunk(posts, 5);
        const responses = await Promise.all(batches.map(async (batch) => {
          const response = await fetch("/api/classify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ goal, posts: batch.map(({ name, role, text }) => ({ name, role, text })) }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Jev could not classify this batch.");
          return data;
        }));
        if (!live) return;
        setResults(responses.flatMap((response) => response.results));
        setMetrics({
          latency: Math.round(responses.reduce((sum, response) => sum + response.latency, 0) / responses.length),
          cost: responses.reduce((sum, response) => sum + Number(response.batchCost || 0), 0),
          model: responses[0]?.model || "jev-latest",
        });
        setLoading(false);
        setPhase("thinking");
      } catch (requestError) {
        if (!live) return;
        setError(requestError.message || "Jev could not analyze the feed.");
        setLoading(false);
      }
    }

    classifyFeed();
    return () => { live = false; };
  }, [goal, run]);

  useEffect(() => {
    if (!playing || loading || error || !results[activeIndex]) return undefined;
    setPhase("thinking");
    const decide = setTimeout(() => setPhase("decided"), 260);
    const launch = setTimeout(() => setPhase("launch"), 690);
    const land = setTimeout(() => {
      setProcessed((current) => current.some((item) => item.index === activeIndex)
        ? current
        : [...current, { index: activeIndex, post: posts[activeIndex], result: results[activeIndex] }]);
      setPhase("landed");
    }, 1230);
    const advance = setTimeout(() => setActiveIndex((current) => current + 1), 1480);
    return () => [decide, launch, land, advance].forEach(clearTimeout);
  }, [activeIndex, results, playing, loading, error]);

  useEffect(() => {
    if (activeIndex >= posts.length && results.length) setPhase("complete");
  }, [activeIndex, results]);

  const counts = useMemo(() => processed.reduce((total, item) => ({ ...total, [item.result.decision]: (total[item.result.decision] || 0) + 1 }), {}), [processed]);
  const progress = Math.round((processed.length / posts.length) * 100);
  const replay = () => {
    setProcessed([]);
    setActiveIndex(0);
    setPhase(results.length ? "thinking" : "waiting");
    setPlaying(true);
  };

  return (
    <main className="scout-page">
      <header className="scout-header">
        <a className="scout-brand" href="#"><span>J</span><strong>JevvieScout</strong><small>by Jev</small></a>
        <div className="live-pill"><i />LIVE SCOUT</div>
        <GoalSelect goal={goal} onChange={setGoal} />
        <button className="round-control" onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause scouting" : "Resume scouting"}>
          {playing ? <IconPlayerPause size={17} /> : <IconPlayerPlay size={17} />}
        </button>
        <button className="round-control" onClick={replay} aria-label="Replay scouting"><IconRefresh size={17} /></button>
      </header>

      <section className="scout-intro">
        <span className="intro-kicker">WHO SHOULD I DM?</span>
        <h1>Let the right people<br /><em>find their lane.</em></h1>
        <p>Fifteen posts. One goal. Jev sorts the signal from the scroll.</p>
      </section>

      <section className="sorting-arena" style={{ "--progress": `${progress}%` }}>
        <div className="arena-progress"><span /><small>{String(Math.min(activeIndex + 1, posts.length)).padStart(2, "0")} / {posts.length}</small></div>
        <span className="float-mark mark-one">✦</span><span className="float-mark mark-two">◌</span><span className="float-mark mark-three">+</span>

        <div className="incoming-stage">
          {loading && <div className="stage-message"><span className="orb"><IconSparkles size={22} /></span><strong>Scouting the feed…</strong><p>Jev is reading 15 people in parallel.</p></div>}
          {error && <div className="stage-message error-message"><strong>Scout lost the trail.</strong><p>{error}</p><button onClick={() => setRun((value) => value + 1)}>Try again</button></div>}
          {!loading && !error && activeIndex < posts.length && <IncomingCard post={posts[activeIndex]} result={results[activeIndex]} phase={phase} />}
          {!loading && !error && phase === "complete" && <div className="stage-message complete-message"><span>✨</span><strong>Feed sorted.</strong><p>{counts.DM || 0} people are worth a hello.</p><button onClick={replay}>Watch it again</button></div>}
        </div>

        <div className="sort-paths" aria-hidden="true"><i /><i /><i /></div>

        <div className="bucket-grid">
          {buckets.map((bucket) => <Bucket key={bucket.decision} config={bucket} people={processed.filter((item) => item.result.decision === bucket.decision)} />)}
        </div>
      </section>

      <p className="privacy-line"><span>↳</span> Real Jev decisions. Sample public-style posts. No X API.</p>
      <StatsDrawer open={statsOpen} setOpen={setStatsOpen} processed={processed.length} metrics={metrics} counts={counts} />
    </main>
  );
}
