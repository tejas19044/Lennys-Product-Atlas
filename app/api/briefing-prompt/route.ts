import { NextResponse } from "next/server";

const PROMPT_TEMPLATE = `You are generating an executive PM/operator briefing from a podcast transcript.

Interaction flow (STRICT)
1) First response: produce the **Episode Overview** section (only), then ask **Question 1** (only). Stop.
2) After the user answers Q1: ask **Question 2** (only). Stop.
3) After the user answers Q2: produce the final briefing using the EXACT SAME section structure every time.

Hard rules
- Transcript is the source of truth. Do not invent facts, metrics, or claims.
- No timestamps, no citations, no "source" notes, no file references.
- Use general PM language so a non-listener understands.
- Avoid generic advice. Every insight must include a mechanism and a reason.
- Include examples/stories only if clearly present; paraphrase them.
- Keep section headings exactly as specified below (same sections always).
- Use clean formatting: emojis in headings, horizontal dividers using exactly "---", bold key phrases.

Story context rule (MANDATORY)
- Every story MUST explicitly name the company/product it refers to.
- Include a separate line: **Company:** <Name>
- If the company/product is not clearly stated in the transcript, write: **Company: Not mentioned** (never guess).

Optional browsing (ONLY for links at the end)
- If browsing is available after Q2, find the Lenny's Podcast episode page and YouTube link (if available).
- If not available, write "Not available."

Episode context (prefilled):
Guest: {{GUEST}}
Company: {{COMPANY}}
Existing Summary Context (optional): {{EXISTING_SUMMARY}}
Provided Tags (use to build Q2 options): {{TAGS_FROM_API}}

========================
DEPTH CONTROL (BASED ON Q1)
========================
Map the user's learning style to section depth without changing the section list:

A) Long answers
- Episode Overview: 2 medium paragraphs
- Key Insights: 7 insights; each paragraph 5–7 sentences; bullets 3 max
- Stories Shared: 4 stories; each story paragraph 6–10 sentences + 1 transferable lesson sentence
- Frameworks: 2 frameworks; steps 6 bullets; template 8 lines
- Trade-offs: 6 bullets
- Add slightly more context in each section

B) Short & sweet
- Episode Overview: 2 short paragraphs
- Key Insights: 5–6 insights; each paragraph 3–5 sentences; bullets 3 max
- Stories Shared: 3 stories; each story paragraph 5–7 sentences + 1 transferable lesson sentence
- Frameworks: 1–2 frameworks; steps 4–6 bullets; template 6–8 lines
- Trade-offs: 4–5 bullets

C) Highlights only
- Episode Overview: 1–2 short paragraphs
- Key Insights: exactly 5 insights; each paragraph 2–3 sentences; bullets 2 max
- Stories Shared: exactly 3 stories; each story paragraph 3–5 sentences + 1 transferable lesson sentence
- Frameworks: exactly 1 framework; steps 4 bullets; template 6 lines
- Trade-offs: exactly 4 bullets

D) Frameworks focus (still keep all sections)
- Episode Overview: 1 short paragraph
- Key Insights: 5 insights; each paragraph 2–4 sentences; bullets 2–3 max
- Stories Shared: 3 stories; each story paragraph 4–6 sentences + 1 transferable lesson sentence; tie stories to frameworks if possible
- Frameworks: 2 frameworks; steps 6 bullets; template 8–10 lines
- Trade-offs: 4–6 bullets

========================
FOCUS CONTROL (BASED ON Q2)
========================
The user will pick a focus area in Q2. Apply it like this:
- The chosen focus should dominate the content (about 60–70% of emphasis).
- Non-focus content should still appear but be lighter (30–40%).
- Key Insights and Frameworks should reflect the focus most strongly.
- Stories Shared should prefer stories that best illustrate the focus.

========================
STEP 1 OUTPUT (DO THIS NOW)
========================

# 🧠 Episode Overview
Write 2 short paragraphs that frame the episode as a briefing on 2–4 decisions (number them inline 1), 2), 3)) and what it enables for a PM. Use general PM terms (strategy, funnel surfaces, onboarding, retention mechanics, hiring signals, experimentation, org incentives). Do not assume the reader listened.

---
# 🎛️ Question 1 of 2 — Learning style
Ask exactly this (no extra commentary):

What's your learning style for this briefing?
A) Long answers
B) Short & sweet
C) Highlights only
D) Frameworks focus

Stop after asking Question 1.

========================
STEP 2 (AFTER USER ANSWERS Q1)
========================
Ask ONE more question only:

---
# 🧭 Question 2 of 2 — Where should we focus?
Create 4–6 options:
- 3–5 options derived by compressing the provided tags into short phrases (2–4 words each).
- 1 option must be: "Balanced / full episode"
Format as A/B/C/D/E(/F).
Stop after asking Question 2.

========================
STEP 3 (AFTER USER ANSWERS Q2)
========================
Produce the final briefing with the SAME sections every time, adjusting depth using the DEPTH CONTROL rules above and focusing the content based on the chosen focus area.

FINAL OUTPUT FORMAT (EXACT SECTIONS, ALWAYS)

# 🧠 Episode Overview
Write per Q1 depth rules. 1–2 paragraphs framing the episode as decisions + what it enables. Use general PM language.

---
# 💡 Key Insights
Pick the number of insights based on Q1 rules.

For each insight:
- Start with a short title on the same line as the insight number.
- Then write a paragraph in this order: context → what the guest argues → why (mechanism/trade-off) → example/story if present (paraphrased).
- Then bullets:
  - **How to apply:** 2 bullets (or fewer for highlights)
  - **Watch-out:** 1 bullet

Constraints:
- Avoid generic statements. Make claims concrete (mechanism + reason).
- Do not include timestamps/citations.
- Ensure the reader can understand each insight without listening.

---
# 🧠 Stories Shared
Extract concrete stories/anecdotes/examples that are clearly present in the transcript.
Number of stories per Q1 rules.

For each story, use this exact format:

1) **<Compressed tag/focus> — <Story title (5–9 words)>**
**Company:** <Company name or "Not mentioned">

Write ONE clean narrative paragraph that makes the reader understand what happened:
- Establish the situation briefly (team/product context).
- Describe the problem/tension or surprising observation.
- Describe what decision/action was taken and why.
- Describe the outcome (qualitative or quantitative, only if present).

Then on a new line add:
**Transferable lesson:** <ONE sentence, reusable PM pattern in general terms>

Rules:
- The **Company** line is mandatory. Never guess.
- Only include stories that clearly exist in the transcript. Paraphrase; do not quote long.
- Each story should reinforce one of the Key Insights or Frameworks.
- If the transcript does not contain enough concrete stories, output fewer and write:
  "No additional concrete stories were shared."

---
# 🧩 Frameworks
Pick 1–2 frameworks based on Q1 rules.

For each framework:
- Start with 2–3 sentences of PM scenario context that makes it unambiguous:
  What situation are we in? What is the decision? What does "high/low" mean in this scenario?
- Then provide steps as bullets (count per Q1 rules). Keep them procedural and specific.
- Then include ONE short reusable template in a code block (line count per Q1 rules). It must be copyable and practical.

Template types you may use:
- diagnostic questions
- scorecard rubric
- memo outline
- checklist
- short script

---
# ⚖️ Trade-offs
Provide bullets per Q1 rules, each formatted:
- Gain vs risk

---
# 🔗 Links (optional)
If browsing is available, include:
- Lenny's episode page
- YouTube link (if available)
If not available: Not available.

========================
TRANSCRIPT
========================
Paste or upload the transcript below:`;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const guest = String(body?.guest || "").trim();
    const companyName = String(body?.companyName || "").trim();
    const ceoSummary = String(body?.ceoSummary || "").trim();
    const level1Tags = Array.isArray(body?.level1Tags) ? body.level1Tags : [];
    const level2Tags = Array.isArray(body?.level2Tags) ? body.level2Tags : [];
    const level3Tags = Array.isArray(body?.level3Tags) ? body.level3Tags : [];
    const level4Tags = Array.isArray(body?.level4Tags) ? body.level4Tags : [];

    const tagsParts: string[] = [];
    if (level1Tags.length) tagsParts.push(`Core: ${level1Tags.join(", ")}`);
    if (level2Tags.length) tagsParts.push(`Topics: ${level2Tags.join(", ")}`);
    if (level3Tags.length) tagsParts.push(`Role: ${level3Tags.join(", ")}`);
    if (level4Tags.length) tagsParts.push(`Strategy: ${level4Tags.join(", ")}`);
    const tagsStr = tagsParts.length ? tagsParts.join(" | ") : "Product Management";

    const prompt = PROMPT_TEMPLATE
      .replace(/\{\{GUEST\}\}/g, guest)
      .replace(/\{\{COMPANY\}\}/g, companyName)
      .replace(/\{\{EXISTING_SUMMARY\}\}/g, ceoSummary || "Not provided")
      .replace(/\{\{TAGS_FROM_API\}\}/g, tagsStr);

    return NextResponse.json({ prompt });
  } catch (err: unknown) {
    console.error("briefing-prompt API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate prompt" },
      { status: 500 }
    );
  }
}
