import { NextResponse } from "next/server";

const JEV_ENDPOINT = process.env.TYPESAFE_API_URL || "https://api.typesafe.ai/v1/systemone";
const JEV_MODEL = process.env.TYPESAFE_MODEL || "jev-latest";

const goalConfigs = {
  partnerships: {
    label: "find partnership opportunities",
    opportunities: {
      event_partnership: "Event partnership",
      strategic_partnership: "Strategic partnership",
      content_partnership: "Content partnership",
      community_partnership: "Community partnership",
      no_clear_opportunity: "No clear opportunity",
    },
  },
  customers: {
    label: "find potential customers",
    opportunities: {
      qualified_lead: "Qualified lead",
      warm_prospect: "Warm prospect",
      potential_user: "Potential user",
      expansion_signal: "Expansion signal",
      no_clear_opportunity: "No clear opportunity",
    },
  },
  hiring: {
    label: "find hiring or work opportunities",
    opportunities: {
      open_role: "Open role",
      contract_opportunity: "Contract opportunity",
      warm_introduction: "Warm introduction",
      future_role: "Future role",
      no_clear_opportunity: "No clear opportunity",
    },
  },
  creator: {
    label: "find creator collaborations",
    opportunities: {
      content_collaboration: "Content collaboration",
      event_collaboration: "Event collaboration",
      podcast_guest: "Podcast guest",
      community_content: "Community content",
      no_clear_opportunity: "No clear opportunity",
    },
  },
  discovery: {
    label: "find people for customer discovery",
    opportunities: {
      research_interview: "Research interview",
      user_interview: "User interview",
      expert_interview: "Expert interview",
      workflow_validation: "Workflow validation",
      no_clear_opportunity: "No clear opportunity",
    },
  },
  networking: {
    label: "find valuable networking connections",
    opportunities: {
      relevant_connection: "Relevant connection",
      peer_connection: "Peer connection",
      expert_connection: "Expert connection",
      community_connection: "Community connection",
      no_clear_opportunity: "No clear opportunity",
    },
  },
};

const reasonOptions = {
  explicit_ask: "The post contains an explicit, timely invitation that matches your goal.",
  active_need: "They describe an active need that creates a natural reason to reach out.",
  strong_context: "Their role and context strongly align, even without a direct ask.",
  weak_signal: "There is some overlap, but no clear need or timely opening yet.",
  no_fit: "The post does not contain a meaningful signal for your selected goal.",
};

function getApiKey() {
  return process.env.TYPESAFE_API_KEY;
}

function makeQuestions(posts, config) {
  const questions = {};

  posts.forEach((_, index) => {
    const id = `post_${index}`;
    const target = `Evaluate only the post with id "${id}" for the user's goal to ${config.label}. Use both its text and profile context.`;

    questions[`${id}_decision`] = {
      type: "choice",
      instructions: `${target} Should the user reach out now?`,
      criteria: {
        DM: "A strong, relevant, and timely match with enough evidence to justify outreach now.",
        Maybe: "Some meaningful relevance, but the need, timing, or opening is indirect or uncertain.",
        Skip: "Little useful evidence of relevance to the goal, or no credible outreach opening.",
      },
    };
    questions[`${id}_opportunity`] = {
      type: "choice",
      instructions: `${target} Choose the single best opportunity type.`,
      criteria: Object.fromEntries(
        Object.entries(config.opportunities).map(([key, label]) => [key, label]),
      ),
    };
    questions[`${id}_fit`] = {
      type: "score",
      instructions: `${target} Rate the strength of fit for outreach.`,
      criteria: [
        "No meaningful relevance to the goal.",
        "Weak or highly speculative relevance.",
        "Some relevant context, but an unclear opening.",
        "Strong relevance and a credible reason to reach out.",
        "Exceptional direct, explicit, and timely match.",
      ],
    };
    questions[`${id}_reason`] = {
      type: "choice",
      instructions: `${target} Choose the rationale that best explains the outreach decision.`,
      criteria: reasonOptions,
    };
  });

  return questions;
}

function normalizeResult(answers, index, config) {
  const id = `post_${index}`;
  const decision = answers[`${id}_decision`];
  const opportunity = answers[`${id}_opportunity`];
  const fit = answers[`${id}_fit`];
  const reason = answers[`${id}_reason`];

  if (!decision || !opportunity || !fit || !reason) {
    throw new Error(`Jev returned an incomplete result for ${id}.`);
  }

  const selectedDecisionProbability = decision.probabilities?.[decision.choice];

  return {
    decision: decision.choice,
    opportunity: config.opportunities[opportunity.choice] || "No clear opportunity",
    score: Math.round(Math.max(0, Math.min(4, fit.score)) * 25),
    confidence: Math.round((decision.confidence ?? selectedDecisionProbability ?? 0) * 100),
    reason: reasonOptions[reason.choice] || reasonOptions.no_fit,
  };
}

export async function POST(request) {
  const apiKey = getApiKey();

  if (!apiKey) {
    return NextResponse.json(
      { error: "Jev is not configured. Add TYPESAFE_API_KEY to your .env file." },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const config = goalConfigs[body.goal];
    const posts = Array.isArray(body.posts) ? body.posts.slice(0, 10) : [];

    if (!config || posts.length === 0) {
      return NextResponse.json({ error: "A valid goal and at least one post are required." }, { status: 400 });
    }

    const state = {
      user_goal: config.label,
      posts: posts.map((post, index) => ({
        id: `post_${index}`,
        author: String(post.name || "Unknown").slice(0, 100),
        profile_context: String(post.role || "No profile context").slice(0, 500),
        post_text: String(post.text || "").slice(0, 4000),
      })),
    };

    const startedAt = performance.now();
    const jevResponse = await fetch(JEV_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: JEV_MODEL,
        state,
        questions: makeQuestions(posts, config),
      }),
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
    const latency = Math.round(performance.now() - startedAt);
    const payload = await jevResponse.json().catch(() => null);

    if (!jevResponse.ok) {
      const detail = payload?.message || payload?.error || `Jev returned HTTP ${jevResponse.status}.`;
      throw new Error(typeof detail === "string" ? detail : "Jev rejected the request.");
    }

    if (!payload?.answers) {
      throw new Error("Jev returned a response without answers.");
    }

    const inputTokens = payload.usage?.input_tokens || 0;
    const reportedCost = payload.usage?.cost;
    const hasReportedCost = typeof reportedCost === "number" && Number.isFinite(reportedCost) && reportedCost >= 0;
    const totalCost = hasReportedCost ? reportedCost : inputTokens * 0.042 / 1_000_000;

    return NextResponse.json({
      results: posts.map((_, index) => normalizeResult(payload.answers, index, config)),
      latency,
      cost: (totalCost / posts.length).toFixed(7),
      batchCost: totalCost.toFixed(7),
      costSource: hasReportedCost ? "reported" : "estimated",
      model: payload.model || JEV_MODEL,
      usage: payload.usage || null,
    });
  } catch (error) {
    console.error("Jev classification failed:", error);
    const message = error?.name === "TimeoutError"
      ? "Jev timed out. Please try again."
      : error?.message || "Jev classification failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
