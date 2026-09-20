import { NextResponse } from "next/server";

const results = {
  partnerships: [
    { decision: "DM", opportunity: "Event partnership", score: 96, confidence: 92, reason: "Actively seeking AI tooling partners for a relevant developer audience." },
    { decision: "Maybe", opportunity: "Strategic partnership", score: 68, confidence: 81, reason: "Strong audience overlap, but there is no direct collaboration ask yet." },
    { decision: "Skip", opportunity: "Product update", score: 22, confidence: 95, reason: "A shipping update without a clear partnership need or opening." },
    { decision: "DM", opportunity: "Content partnership", score: 87, confidence: 89, reason: "Explicitly looking for practitioners to contribute to a founder-focused series." },
    { decision: "Maybe", opportunity: "Community partnership", score: 64, confidence: 78, reason: "Their community is relevant, though the post is informational rather than an ask." },
  ],
  customers: [
    { decision: "Maybe", opportunity: "Warm prospect", score: 73, confidence: 84, reason: "Runs developer events and may need tooling, but shows no active buying signal." },
    { decision: "DM", opportunity: "Qualified lead", score: 94, confidence: 93, reason: "Describes a painful workflow and is actively evaluating solutions this month." },
    { decision: "Skip", opportunity: "Product update", score: 18, confidence: 96, reason: "No problem statement, buying signal, or request for recommendations." },
    { decision: "Maybe", opportunity: "Potential user", score: 61, confidence: 76, reason: "The role and topic fit, but the post is seeking contributors—not a product." },
    { decision: "DM", opportunity: "Qualified lead", score: 86, confidence: 88, reason: "A growing team with a stated need to improve community operations." },
  ],
  hiring: [
    { decision: "Maybe", opportunity: "Team introduction", score: 57, confidence: 73, reason: "A relevant company, but the post does not mention open roles." },
    { decision: "DM", opportunity: "Open role", score: 91, confidence: 94, reason: "The team is hiring for a role that closely matches your selected interests." },
    { decision: "Skip", opportunity: "Product update", score: 16, confidence: 97, reason: "No hiring signal or useful path to a role in this post." },
    { decision: "DM", opportunity: "Contract opportunity", score: 82, confidence: 86, reason: "Seeking experienced operators for a paid, short-term contributor role." },
    { decision: "Maybe", opportunity: "Future role", score: 66, confidence: 79, reason: "The team is growing, though no suitable role is open right now." },
  ],
  creator: [
    { decision: "DM", opportunity: "Creator collaboration", score: 88, confidence: 90, reason: "The upcoming developer event is a strong setting for a joint content format." },
    { decision: "Maybe", opportunity: "Podcast guest", score: 69, confidence: 77, reason: "Good subject fit, but no explicit call for guests or collaborators." },
    { decision: "Skip", opportunity: "Product update", score: 21, confidence: 94, reason: "A company announcement without a creator collaboration angle." },
    { decision: "DM", opportunity: "Content collaboration", score: 97, confidence: 95, reason: "Explicit contributor request with excellent topic and audience alignment." },
    { decision: "Maybe", opportunity: "Community content", score: 72, confidence: 82, reason: "Strong audience fit; a concrete creative angle would be needed." },
  ],
  discovery: [
    { decision: "Maybe", opportunity: "Expert interview", score: 67, confidence: 76, reason: "Relevant operator, but the post focuses on an event rather than a pain point." },
    { decision: "DM", opportunity: "Research interview", score: 98, confidence: 96, reason: "Clearly articulates the exact workflow problem you are researching." },
    { decision: "Maybe", opportunity: "User interview", score: 56, confidence: 72, reason: "Recently shipped and may have useful context, but no pain is visible." },
    { decision: "DM", opportunity: "Expert interview", score: 84, confidence: 87, reason: "Has direct experience in the market and is openly inviting conversation." },
    { decision: "DM", opportunity: "Research interview", score: 89, confidence: 91, reason: "Leads a relevant community and mentions the operational challenge directly." },
  ],
  networking: [
    { decision: "DM", opportunity: "Relevant connection", score: 85, confidence: 86, reason: "Strong shared interests and a timely, natural reason to start a conversation." },
    { decision: "Maybe", opportunity: "Peer connection", score: 71, confidence: 80, reason: "Relevant operator with mutual context, though the post is narrowly tactical." },
    { decision: "Skip", opportunity: "Low-context connection", score: 32, confidence: 89, reason: "Not enough shared context to make a useful introduction right now." },
    { decision: "DM", opportunity: "Expert connection", score: 90, confidence: 92, reason: "Clear overlap in interests plus an explicit invitation to connect." },
    { decision: "Maybe", opportunity: "Community connection", score: 74, confidence: 82, reason: "Worth knowing, but a warmer hook would improve the outreach." },
  ],
};

export async function POST(request) {
  const { goal = "partnerships" } = await request.json();
  await new Promise((resolve) => setTimeout(resolve, 520));
  return NextResponse.json({
    results: results[goal] || results.partnerships,
    latency: 184 + Math.floor(Math.random() * 38),
    cost: "0.00014",
  });
}
