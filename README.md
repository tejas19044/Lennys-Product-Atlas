# Product Atlas

**Decision-routing for PMs.** Filter Lenny's Podcast episodes by strategy, domain, and context—then generate AI-powered executive briefings in one click.

[![Powered by Lenny's Podcast](https://img.shields.io/badge/Powered%20by-Lenny's%20Podcast-d4af37?style=flat)](https://www.lennyspodcast.com/)

---

## The Problem

Lenny's Podcast is a goldmine of PM frameworks—but when you're under cognitive load, you need *the right episode*, *fast*. Scrolling through hundreds of hours isn't an option.

## The Solution

Product Atlas turns the catalog into a **queryable decision-routing tool**:
- Filter by **10 PM domains** (Discovery, Strategy, Growth, AI, Leadership, etc.) and **62 sub-topics**
- Narrow by **context** (B2B, Scale-up, Founder) and **thinking frame** (Systems Thinking, First Principles)
- Get a **curated briefing prompt**—paste it into ChatGPT, Claude, Perplexity, or Gemini with the transcript for a tailored executive summary

**Not a summary app.** You route to the right episode, then use your preferred AI. The prompt handles the rest.

---

## Key Features

| Feature | What it does |
|---------|--------------|
| **4-level taxonomy** | Core → Topics → Role → Strategy for precise filtering |
| **AI briefing prompt** | One-click copy; paste in any AI with transcript for executive briefs |
| **3-step flow** | Episode overview → pick learning style → pick focus → full briefing |
| **Transcript download** | Grab the raw transcript when available |

---

## Tech Stack

- **Next.js 14** (App Router) · **TypeScript**
- **Static data**: CSV + JSON index (no DB)
- **No in-app AI**: Prompt is copied; user pastes transcript in external AI

---

## Quick Start

```bash
npm install
npm run prep:data    # Copies CSV + transcripts, builds index
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
data/episodes.csv          # Source: guest, company, tags, frameworks, CEO summary
transcripts_raw/           # Source transcripts (named to match guest)
scripts/prep-data.mjs      # Builds public/data/ + index.json
app/api/briefing-prompt/   # Generates prompt for ChatGPT/Claude/etc.
System Prompts.md          # Prompt variants (V2–V4)
```

---

## Taxonomy (PM Lens)

- **Level 1 (Core):** Product Discovery, Strategy, Execution, Design, Growth, Retention, GTM, AI PM, Leadership, Career
- **Level 2 (Topics):** 62 mechanism tags (e.g. Product-Market Fit, PLG, Marketplace Dynamics)
- **Level 3 (Role):** B2B, B2C, IC, Manager, Founder, Scale-up
- **Level 4 (Strategy):** Systems Thinking, First Principles, Trade Offs, etc.

See `Level 1 to Level 2 Mapping.md` for the full taxonomy.

---

## Deploy (Vercel)

1. Push to GitHub.
2. Import repo in [Vercel](https://vercel.com).
3. Build command: `npm run prep:data && npm run build`
4. Deploy.

No env vars required for the core flow; briefing prompt API runs serverless.

---

## Built By

**Tejas Dhekane** — PM building tools for PMs.

---

## License

MIT
