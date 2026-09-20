"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IconArrowUpRight as ArrowUpRight,
  IconBriefcase as BriefcaseBusiness,
  IconCheck as Check,
  IconChevronDown as ChevronDown,
  IconCurrencyDollar as CircleDollarSign,
  IconClock as Clock3,
  IconHeartHandshake as Handshake,
  IconHeart as Heart,
  IconMessageCircle as MessageCircle,
  IconDots as MoreHorizontal,
  IconNetwork as Network,
  IconPencil as PenTool,
  IconRepeat as Repeat2,
  IconSearch as Search,
  IconSend as Send,
  IconSparkles as Sparkles,
  IconUsers as Users,
  IconBolt as Zap,
} from "@tabler/icons-react";

const goals = [
  { id: "partnerships", label: "Find partnerships", icon: Handshake },
  { id: "customers", label: "Find customers", icon: CircleDollarSign },
  { id: "hiring", label: "Find opportunities", icon: BriefcaseBusiness },
  { id: "creator", label: "Creator collabs", icon: PenTool },
  { id: "discovery", label: "Customer discovery", icon: Search },
  { id: "networking", label: "Networking", icon: Network },
];

const posts = [
  {
    name: "Maya Chen", handle: "@mayabuilds", time: "12m", avatar: "MC", color: "#d9734e",
    role: "Community & DevRel · Orbit Labs",
    text: "Looking for AI tooling companies to collaborate with for an upcoming developer event in SF. Especially interested in teams building practical workflows for devs — DMs open!",
    likes: 84, comments: 19, reposts: 11,
  },
  {
    name: "Alex Rivera", handle: "@alexonproduct", time: "34m", avatar: "AR", color: "#5868a9",
    role: "VP Product · Relay",
    text: "Our sales team spends hours every week combing through social posts to find people with actual intent. Evaluating a few tools now, but most create more noise than signal. Any recommendations?",
    likes: 147, comments: 36, reposts: 8,
  },
  {
    name: "Priya Shah", handle: "@priyashah", time: "1h", avatar: "PS", color: "#237b69",
    role: "Co-founder · Looma",
    text: "Just shipped our new landing page. Six weeks of iteration, 14 discarded directions, and one very patient designer. Really proud of where we landed.",
    likes: 392, comments: 47, reposts: 21,
  },
  {
    name: "Jon Bell", handle: "@jonbelltweets", time: "2h", avatar: "JB", color: "#9a6644",
    role: "Creator · The Operator Edit",
    text: "Putting together a new interview series on how early-stage founders actually find their first 20 customers. Looking for thoughtful operators with stories to share. Who should I talk to?",
    likes: 218, comments: 62, reposts: 34,
  },
  {
    name: "Nadia Okafor", handle: "@nadiaokafor", time: "3h", avatar: "NO", color: "#9a4f74",
    role: "Head of Growth · Common Thread",
    text: "Our founder community crossed 8,000 members today. The next challenge: keeping conversations genuinely useful as we grow without adding a huge moderation burden.",
    likes: 176, comments: 28, reposts: 17,
  },
];

function DecisionBadge({ value }) {
  return <span className={`decision decision-${value.toLowerCase()}`}><span className="decision-dot" />{value}</span>;
}

function GoalPicker({ goal, setGoal }) {
  const [open, setOpen] = useState(false);
  const active = goals.find((item) => item.id === goal);
  const ActiveIcon = active.icon;
  return (
    <div className="goal-picker">
      <button className="goal-button" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="goal-icon"><ActiveIcon size={19} stroke={1.8} /></span>
        <span><small>MY GOAL</small><strong>{active.label}</strong></span>
        <ChevronDown size={18} className={open ? "rotate" : ""} />
      </button>
      {open && (
        <div className="goal-menu">
          {goals.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={item.id === goal ? "active" : ""} onClick={() => { setGoal(item.id); setOpen(false); }}>
                <Icon size={18} /><span>{item.label}</span>{item.id === goal && <Check size={17} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, result, analyzing }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <article className="post-card">
      <div className="post-main">
        <div className="avatar" style={{ background: post.color }}>{post.avatar}</div>
        <div className="post-content">
          <div className="post-head">
            <div><strong>{post.name}</strong><span>{post.handle} · {post.time}</span></div>
            <button className="icon-button" aria-label="More options"><MoreHorizontal size={20} /></button>
          </div>
          <div className="role">{post.role}</div>
          <p>{post.text}</p>
          <div className="post-actions">
            <span><MessageCircle size={16} />{post.comments}</span>
            <span><Repeat2 size={17} />{post.reposts}</span>
            <span><Heart size={16} />{post.likes}</span>
            <span><Send size={16} /></span>
          </div>
        </div>
      </div>

      <div className={`analysis ${analyzing ? "loading" : ""}`}>
        {analyzing ? (
          <div className="analyzing"><Sparkles size={18} /><span>Jev is reading the signal…</span><i /></div>
        ) : (
          <>
            <div className="analysis-top">
              <DecisionBadge value={result.decision} />
              <div className="opportunity"><span>OPPORTUNITY</span><strong>{result.opportunity}</strong></div>
              <button className="expand-button" onClick={() => setExpanded(!expanded)}>{expanded ? "Less" : "Why?"}<ChevronDown size={15} className={expanded ? "rotate" : ""} /></button>
            </div>
            <div className="signal-row">
              <div><span>FIT</span><div className="meter"><i style={{ width: `${result.score}%` }} /></div><b>{result.score}</b></div>
              <div className="confidence"><span>CONFIDENCE</span><strong>{result.confidence}%</strong></div>
            </div>
            {expanded && <div className="reason"><Sparkles size={15} /><p>{result.reason}</p></div>}
          </>
        )}
      </div>
    </article>
  );
}

export default function Home() {
  const [goal, setGoal] = useState("partnerships");
  const [results, setResults] = useState([]);
  const [analyzing, setAnalyzing] = useState(true);
  const [apiError, setApiError] = useState("");
  const [filter, setFilter] = useState("All");
  const [metrics, setMetrics] = useState({ latency: 0, cost: "0.0000000", batchCost: "0.0000000", costSource: "estimated", model: "jev-latest" });

  useEffect(() => {
    let live = true;
    async function classify() {
      setAnalyzing(true);
      setApiError("");
      try {
        const response = await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goal,
            posts: posts.map(({ name, role, text }) => ({ name, role, text })),
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Jev classification failed.");
        if (live) {
          setResults(data.results);
          setMetrics({ latency: data.latency, cost: data.cost, batchCost: data.batchCost, costSource: data.costSource, model: data.model });
        }
      } catch (error) {
        if (live) {
          setResults([]);
          setApiError(error.message || "Jev classification failed.");
        }
      } finally {
        if (live) setAnalyzing(false);
      }
    }
    classify();
    return () => { live = false; };
  }, [goal]);

  const visiblePosts = useMemo(() => posts.map((post, index) => ({ post, result: results[index] })).filter(({ result }) => analyzing || filter === "All" || result?.decision === filter), [results, filter, analyzing]);
  const counts = useMemo(() => results.reduce((acc, item) => ({ ...acc, [item.decision]: (acc[item.decision] || 0) + 1 }), {}), [results]);

  return (
    <main>
      <header>
        <a className="brand" href="#"><span>J</span>jev<sup>BETA</sup></a>
        <nav><a href="#feed" className="active">Signal feed</a><a href="#how">How it works</a></nav>
        <div className="header-actions"><span className="live-dot">LIVE</span><button className="avatar mini">JG</button></div>
      </header>

      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span /><span>WHO SHOULD I DM?</span></div><h1>Your feed, <em>with intent.</em></h1><p>Jev spots the people worth reaching out to — before the moment passes.</p></div>
        <GoalPicker goal={goal} setGoal={setGoal} />
      </section>

      <div className="workspace" id="feed">
        <section className="feed-column">
          <div className="feed-toolbar">
            <div><h2>Signal feed</h2><span>{analyzing ? "Analyzing the latest posts…" : `${posts.length} posts analyzed just now`}</span></div>
            <div className="filters">{["All", "DM", "Maybe", "Skip"].map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}{item !== "All" && <span>{counts[item] || 0}</span>}</button>)}</div>
          </div>
          <div className="feed-list">
            {apiError && <div className="api-error"><strong>Jev couldn&apos;t analyze this feed.</strong><span>{apiError}</span></div>}
            {!apiError && visiblePosts.map(({ post, result }) => <PostCard key={post.handle} post={post} result={result} analyzing={analyzing} />)}
            {!analyzing && !apiError && visiblePosts.length === 0 && <div className="empty-state">No posts in this bucket. Try another filter.</div>}
          </div>
        </section>

        <aside>
          <section className="summary-card">
            <div className="aside-title"><span>TODAY&apos;S SIGNAL</span><Sparkles size={16} /></div>
            <div className="big-stat"><strong>{counts.DM || 0}</strong><span>people worth<br />messaging</span></div>
            <div className="summary-bars">
              <div><span><i className="green" />DM</span><b>{counts.DM || 0}</b></div>
              <div><span><i className="amber" />Maybe</span><b>{counts.Maybe || 0}</b></div>
              <div><span><i className="gray" />Skip</span><b>{counts.Skip || 0}</b></div>
            </div>
            <button className="primary-button" onClick={() => { setFilter("DM"); document.querySelector("#feed")?.scrollIntoView({ behavior: "smooth" }); }}><Send size={17} />Review best matches<ArrowUpRight size={17} /></button>
          </section>

          <section className="benchmark-card">
            <div className="aside-title"><span>JEV BENCHMARK</span><Zap size={16} /></div>
            <p>Live API timing and token-based cost for the current Jev call.</p>
            <div className="benchmark-grid">
              <div><Clock3 size={18} /><strong>{metrics.latency || "—"}{metrics.latency > 0 && <small>ms</small>}</strong><span>API round trip</span></div>
              <div><CircleDollarSign size={18} /><strong>${metrics.cost}</strong><span>{metrics.costSource === "reported" ? "billed per post" : "est. per post"}</span></div>
            </div>
            <div className="vs-row"><span>LIVE JEV API</span><span>{metrics.model}</span></div>
          </section>

          <section className="privacy-note"><Users size={18} /><div><strong>Your judgment, amplified.</strong><p>Jev prioritizes. You decide who gets a message.</p></div></section>
        </aside>
      </div>

      <footer><span>Jev is a decision model for high-signal outreach.</span><span>Built for people who value their attention.</span></footer>
    </main>
  );
}
