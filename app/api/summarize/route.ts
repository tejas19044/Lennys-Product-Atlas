import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Executive PM Dashboard Schema
type SummaryJSON = {
  overview: {
    executiveBrief: string; // 2-3 sentence compact summary
    coreTakeaways: string[]; // 3-5 bullets, mechanism-forward
  };
  insights: {
    tag: "Strategy" | "Execution" | "Growth" | "Leadership" | "Career" | "GTM" | "AI" | "Product" | "Research" | "Metrics";
    insight: string; // <= 20 words, one-liner
    evidence: {
      time: string; // mm:ss or early|mid|late
      cue: string; // short paraphrase
    };
  }[];
  frameworks: {
    name: string;
    whenToUse: string; // 1 line
    steps: string[]; // 3-7 bullets
    pitfalls: string[]; // 1-3 bullets
    evidence: {
      time: string;
      cue: string;
    }[];
  }[];
  about: {
    speaker: {
      who: string; // 1 sentence
      credibility: string[]; // max 4 bullets
      philosophy: string | null; // 1 sentence or null
    };
    company: {
      name: string;
      context: string; // 1 sentence or null
    };
  };
  youtubeVideoId: string | null;
};

function clampTranscript(text: string) {
  const MAX_CHARS = 120_000;
  if (text.length <= MAX_CHARS) return { text, truncated: false };
  return { text: text.slice(0, MAX_CHARS), truncated: true };
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY. Add it to .env.local and restart dev server." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    const transcriptRaw = String(body?.transcript || "");
    const guest = String(body?.guest || "");
    const company = String(body?.companyName || "");
    const ceoSummary = String(body?.ceoSummary || "");
    const level1Tags = Array.isArray(body?.level1Tags) ? body.level1Tags : [];
    const level2Tags = Array.isArray(body?.level2Tags) ? body.level2Tags : [];
    const level3Tags = Array.isArray(body?.level3Tags) ? body.level3Tags : [];
    const level4Tags = Array.isArray(body?.level4Tags) ? body.level4Tags : [];
    const episodeTags = [...level1Tags, ...level2Tags, ...level3Tags, ...level4Tags].filter(Boolean);

    console.log("API Received Transcript Length:", transcriptRaw.length);

    if (!transcriptRaw.trim()) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    const { text: transcript, truncated } = clampTranscript(transcriptRaw);

    const system = `
You are an executive Product Leader and knowledge-extraction analyst for a Product Management "Decision Routing" dashboard.

This is NOT a podcast summary task.
Your job is to extract modular, UI-ready knowledge blocks that help a busy PM understand the episode in 5 seconds and apply it immediately.

UI CONTRACT (drawer with tabs)
You must produce content that cleanly maps to:
1) OVERVIEW: a compact executive briefing (minimal scroll)
2) INSIGHTS: a ranked list of tagged one-liners ("intel rows")
3) ABOUT: stable speaker/company context

PRIMARY OUTPUT PRIORITY
Framework Cards are the most valuable artifact. Treat them as reusable knowledge blocks (screenshot-ready), not plain text.

STYLE
- Executive, calm, concise. No casual tone. No emojis. No marketing language.
- High information density. Short sentences. Bullets over paragraphs.
- Avoid generic advice. If a sentence could apply to most podcasts, delete it.

GROUNDING / TRUTHFULNESS
- The transcript is the source of truth. Do not invent facts, metrics, names, or claims.
- If something is not supported by the transcript, output null/empty or explicitly "Not mentioned in transcript."
- Do not guess YouTube IDs or external details.

ANTI-GENERIC FILTER (MANDATORY)
Before finalizing, remove or rewrite any item that:
- lacks a concrete mechanism (steps, heuristics, guardrails, diagnostics, trade-offs), OR
- is vague ("focus on…", "align…", "optimize…") without a specific how, OR
- cannot be traced to a specific moment in the transcript.

EVIDENCE ANCHORS (MANDATORY)
Every non-trivial claim must include an evidence anchor:
- time: use mm:ss if present; otherwise use {early|mid|late}
- cue: a short paraphrase that uniquely identifies where it came from
Anchors must be minimal; do not paste long quotes.

FRAMEWORK CARD RULES
A framework card must include:
- Name (named if present; otherwise synthesize ONLY if transcript implies a repeatable method)
- When to use (1 line)
- Steps or Rules (3–7 bullets)
- Pitfalls (1–3 bullets)
- Evidence anchors (1–3)

INSIGHTS ("INTEL ROWS") RULES
Insights must be:
- Ranked by usefulness (most important first)
- Tagged with a label from the allowed set (Strategy, Execution, Growth, Leadership, Career, GTM, AI, Product, Research, Metrics)
- One line each (<= 20 words), mechanism-forward, non-generic
- Evidence anchored

ABOUT TAB RULES
- Who the speaker is (1 sentence) + credibility bullets (max 4) + product philosophy (1 sentence) ONLY if supported.
- Company context ONLY if supported.

OUTPUT DISCIPLINE
Optimize for scannability and reusability. The drawer should feel like an executive briefing panel, not an essay.
`.trim();

    const tagFocusBlock = episodeTags.length
      ? `
EPISODE TAGS (PRIORITIZE THESE THEMES):
Focus insights and takeaways specifically on these episode tags: ${episodeTags.join(", ")}
Prioritize insights that relate to these themes. The insight tag field should still use the allowed set (Strategy, Execution, etc.) but the content must be grounded in the episode's Level 1-4 tags.
`
      : "";

    const user = `
Guest: ${guest}
Company: ${company}
Existing Summary Context: ${ceoSummary}
${tagFocusBlock}

OUTPUT FORMAT (STRICT JSON):

1. OVERVIEW TAB:
- executiveBrief: 2-3 sentence compact summary (what happened, why it matters)
- coreTakeaways: 3-5 bullets (<= 20 words each), mechanism-forward, non-generic

2. INSIGHTS TAB (ranked by usefulness, most important first):
- Array of insight objects, each with:
  * tag: one of [Strategy, Execution, Growth, Leadership, Career, GTM, AI, Product, Research, Metrics]
  * insight: one-liner (<= 20 words), mechanism-forward
  * evidence: { time: "mm:ss or early|mid|late", cue: "short paraphrase" }
- Target 8-12 insights total

3. FRAMEWORKS (screenshot-ready cards):
- Up to 3 framework objects, each with:
  * name: (use if named explicitly, otherwise synthesize ONLY if repeatable method exists)
  * whenToUse: 1 line describing when to apply it
  * steps: 3-7 bullets (concrete actions, heuristics, or rules)
  * pitfalls: 1-3 bullets (what to avoid or watch for)
  * evidence: array of 1-3 objects with { time, cue }

4. ABOUT TAB:
- speaker:
  * who: 1 sentence
  * credibility: max 4 bullets (only if supported by transcript)
  * philosophy: 1 sentence or null
- company:
  * name: company name
  * context: 1 sentence or null (only if supported)

5. META:
- youtubeVideoId: string or null (do NOT guess)

TRANSCRIPT:
${transcript}
`.trim();

    const resp = await client.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_completion_tokens: 25000,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "pm_dashboard_summary",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              overview: {
                type: "object",
                additionalProperties: false,
                properties: {
                  executiveBrief: { type: "string" },
                  coreTakeaways: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 }
                },
                required: ["executiveBrief", "coreTakeaways"]
              },
              insights: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    tag: {
                      type: "string",
                      enum: ["Strategy", "Execution", "Growth", "Leadership", "Career", "GTM", "AI", "Product", "Research", "Metrics"]
                    },
                    insight: { type: "string" },
                    evidence: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        time: { type: "string" },
                        cue: { type: "string" }
                      },
                      required: ["time", "cue"]
                    }
                  },
                  required: ["tag", "insight", "evidence"]
                },
                minItems: 8,
                maxItems: 12
              },
              frameworks: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    name: { type: "string" },
                    whenToUse: { type: "string" },
                    steps: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 7 },
                    pitfalls: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
                    evidence: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          time: { type: "string" },
                          cue: { type: "string" }
                        },
                        required: ["time", "cue"]
                      },
                      minItems: 1,
                      maxItems: 3
                    }
                  },
                  required: ["name", "whenToUse", "steps", "pitfalls", "evidence"]
                },
                maxItems: 3
              },
              about: {
                type: "object",
                additionalProperties: false,
                properties: {
                  speaker: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      who: { type: "string" },
                      credibility: { type: "array", items: { type: "string" }, maxItems: 4 },
                      philosophy: { type: ["string", "null"] }
                    },
                    required: ["who", "credibility", "philosophy"]
                  },
                  company: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      name: { type: "string" },
                      context: { type: ["string", "null"] }
                    },
                    required: ["name", "context"]
                  }
                },
                required: ["speaker", "company"]
              },
              youtubeVideoId: { type: ["string", "null"] }
            },
            required: ["overview", "insights", "frameworks", "about", "youtubeVideoId"],
          },
        },
      },
    });

    const choice = resp.choices[0];
    const content = choice?.message?.content;

    if (!content) {
      throw new Error("No content returned from OpenAI");
    }

    const parsed = JSON.parse(content) as SummaryJSON;
    return NextResponse.json({ truncated, summary: parsed });
  } catch (err: any) {
    console.error("API Error detailed:", err);
    return NextResponse.json({ error: err?.message || "Summarization failed" }, { status: 500 });
  }
}
