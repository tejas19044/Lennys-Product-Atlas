import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Reverted Clean Schema (Camel Case)
type SummaryJSON = {
  tldr: {
    coreTakeaways: string[];
  };
  aboutSpeaker: {
    who: string;
    credibility: string[];
    philosophy: string;
  };
  company: {
    name: string;
    businessModel: string;
    customer: string;
    winningLooksLike: string;
    description: string;
  };
  podcastSummary: {
    paragraphs: string[];
    majorPoints: string[];
  };
  keyHighlights: string[]; // Reverted to string array to support "[Label] Text" format
  memorableQuotes: { quote: string; why: string }[];
  frameworks: {
    name: string;
    explanation: string;
    actionableInsight: string; // "how to use tomorrow"
  }[];
  whereThisIsUseful: string[];
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

    console.log("API Received Transcript Length:", transcriptRaw.length);

    if (!transcriptRaw.trim()) {
      return NextResponse.json({ error: "No transcript provided" }, { status: 400 });
    }

    const { text: transcript, truncated } = clampTranscript(transcriptRaw);

    const system = `
You are a senior Product Leader (CPO-level). Summarize the provided podcast transcript with executive clarity for a Product Manager with ~5 years experience.

GROUND RULES
- Transcript is the primary source of truth.
- You may use public web info (Lenny’s site, company site) only for speaker/company background. Do not invent transcript claims.
- If something is not in the transcript, write: “Not mentioned in transcript.”
- High signal, no fluff. Short paragraphs and bullets.
- Minmize reasoning tokens. Go straight to the answer.
`.trim();

    const user = `
Guest: ${guest}
Company: ${company}
Existing Summary Context: ${ceoSummary}

OUTPUT FORMAT (STRICT JSON):
Target 900–1300 words total content.

1. TL;DR:
- 4 core takeaways (<= 18 words each)

2. About the Speaker:
- Who they are (1 sentence)
- Credibility signals (max 4 bullets)
- Product philosophy (1 sentence)

3. Company:
- Name, Business Model, Customer, What "winning" looks like (<= 14 words each)
- Company Description: CEO/board-level one-liner.

4. Podcast Summary:
- 2–3 short paragraphs summary.
- 8–12 bullets capturing major points in order.

5. Key Highlights:
- Exactly 7 bullets.
- Start each with a label: [Idea] [Counterintuitive] [Strategy] [Execution] [Leadership] [Growth] [Career] [GTM] [AI]
- Keep each <= 20 words.

6. Memorable Quotes:
- Exactly 5 quotes (<= 25 words).
- Add "Why: <one sentence>" for each.
- Quotes MUST be self-sufficient and trackable back to this podcast. Avoid random fragments.

7. Frameworks (Deep Explanation):
- Identify up to 3 frameworks.
- If no explicit named framework exists, SYNTHESIZE one from the guest's methodology (e.g. "The <Topic> Loop").
- For each: Name, Explanation (2 sentences), and Actionable Insight (how to use it tomorrow).

8. Where This Episode Is Most Useful:
- 5 bullets (e.g. "When you're deciding X...")

9. Meta:
- Attempt to find the YouTube Video ID for this episode if known or mentioned.

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
          name: "podcast_deep_summary",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              tldr: {
                type: "object",
                additionalProperties: false,
                properties: {
                  coreTakeaways: { type: "array", items: { type: "string" } }
                },
                required: ["coreTakeaways"]
              },
              aboutSpeaker: {
                type: "object",
                additionalProperties: false,
                properties: {
                  who: { type: "string" },
                  credibility: { type: "array", items: { type: "string" } },
                  philosophy: { type: "string" },
                },
                required: ["who", "credibility", "philosophy"],
              },
              company: {
                type: "object",
                additionalProperties: false,
                properties: {
                  name: { type: "string" },
                  businessModel: { type: "string" },
                  customer: { type: "string" },
                  winningLooksLike: { type: "string" },
                  description: { type: "string" },
                },
                required: ["name", "businessModel", "customer", "winningLooksLike", "description"],
              },
              podcastSummary: {
                type: "object",
                additionalProperties: false,
                properties: {
                  paragraphs: { type: "array", items: { type: "string" } },
                  majorPoints: { type: "array", items: { type: "string" } }
                },
                required: ["paragraphs", "majorPoints"]
              },
              keyHighlights: {
                type: "array",
                items: { type: "string" }, // RESTORED TO STRING ARRAY
                minItems: 7,
                maxItems: 7
              },
              memorableQuotes: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: { quote: { type: "string" }, why: { type: "string" } },
                  required: ["quote", "why"],
                },
                minItems: 5, maxItems: 5
              },
              frameworks: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    name: { type: "string" },
                    explanation: { type: "string" },
                    actionableInsight: { type: "string" }
                  },
                  required: ["name", "explanation", "actionableInsight"],
                },
                maxItems: 4
              },
              whereThisIsUseful: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 5 },
              youtubeVideoId: { type: ["string", "null"] }
            },
            required: [
              "tldr",
              "aboutSpeaker",
              "company",
              "podcastSummary",
              "keyHighlights",
              "memorableQuotes",
              "frameworks",
              "whereThisIsUseful",
              "youtubeVideoId"
            ],
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
