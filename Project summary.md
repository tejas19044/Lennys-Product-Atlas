# Project Summary: Product Atlas

## Overview

**Product Atlas** is a Product Management knowledge dashboard web application. It is **not** a content browsing app—it is a **decision-routing tool** for Product Managers under cognitive stress. The goal is to help busy PMs quickly filter, discover, and understand podcast episodes and extract actionable frameworks without long reading.

---

## Target User

- Mid–Senior Product Managers
- ~5 years experience
- Time-constrained
- Need quick clarity, not long-form content
- Value frameworks and structured thinking

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** CSS variables + inline styles
- **AI:** No in-app AI summarization; user copies briefing prompt to external AI (ChatGPT, Claude, Perplexity, Gemini)
- **Data:** Static CSV + JSON index, served from `public/`

---

## Architecture

### Data Flow

1. **CSV (`data/episodes.csv` → `public/data/episodes.csv`)**  
   - Columns: Sr No, Podcast Guest, Company Name, Company Description, Level 1–4 Tags, Frameworks, CEO Summary  
   - Parsed client-side via `parseCSV()` and `splitTags()` in `app/ui/csv.ts`

2. **Transcript Index (`public/data/index.json`)**  
   - Maps normalized guest name → transcript filename (e.g. `"ada chen rekhi"` → `"Ada Chen Rekhi.txt"`)  
   - Built by `scripts/prep-data.mjs` from `transcripts_raw/` → `public/transcripts/`

3. **Transcripts**  
   - Fetched from `/transcripts/{filename}` when the user opens an episode drawer

### App Structure

```
app/
├── page.tsx              # Main orchestrator: state, filtering, layout
├── layout.tsx            # Root layout with metadata
├── globals.css           # CSS variables (dark theme, luxury gold accent)
├── lib/prompt.ts         # Legacy prompt (unused)
├── ui/
│   ├── Sidebar.tsx       # Tag filters (4 levels), company filter, search, clear
│   ├── ResultsGrid.tsx   # 3-column episode cards
│   ├── DrawerV2.tsx      # Active drawer: CEO summary, frameworks, tags, AI buttons
│   ├── Drawer.tsx        # Legacy (unused)
│   └── csv.ts            # CSV parsing and tag utilities
└── api/
    ├── briefing-prompt/
    │   └── route.ts       # POST: generates executive briefing prompt (used by all AI buttons)
    └── summarize/
        └── route.ts      # Legacy in-app summarization (unused by DrawerV2)
```

---

## Layout (Current)

### Header
- **Product Atlas** (h1)
- **Powered by Lenny's Podcast** (subtitle)

### Left Panel (Sidebar)
- Company filter dropdown
- Episode search (filters by guest/summary text)
- Clear filters button + result count
- 4 hierarchical tag levels (Core, Topics, Role, Strategy)
- Each tag shows count; multi-select tag filtering

### Main Grid
- **3-column** episode cards (responsive: 2 cols < 1400px, 1 col < 900px)
- Card content: Company, Guest, Frameworks, CEO Summary, tag highlights
- Click card → opens DrawerV2

### DrawerV2 (Episode Detail Panel)
- **Centered modal** (max 800px, 90vh)
- **Dark theme** aligned with main app (`--panel`, `--border`, `--accent`)
- **Header:** Company name, Guest name, close button
- **Content blocks:**
  - Frameworks (gold accent, left border)
  - Executive Summary (CEO summary from CSV)
  - Level 1–4 tags (Core, Topics, Role, Strategy)
  - Instruction: "System prompt is auto-saved on your device. Just hit Ctrl+V on the chat of your favourite AI and upload the transcript."
  - **4 AI buttons:** ChatGPT, Claude, Perplexity, Gemini
- **Footer:** Download Transcript button (when transcript available)

**AI button behavior:**
- **ChatGPT:** Prefills URL with prompt when short enough; otherwise copies to clipboard
- **Claude, Perplexity, Gemini:** Copy prompt to clipboard, open base URL; show "Prompt copied!" for 4s

---

## Briefing Prompt API

- **Endpoint:** `POST /api/briefing-prompt`
- **Input:** `{ guest, companyName, ceoSummary, level1Tags, level2Tags, level3Tags, level4Tags }`
- **Output:** `{ prompt }` — full system prompt with placeholders filled
- **Placeholders:** `{{GUEST}}`, `{{COMPANY}}`, `{{EXISTING_SUMMARY}}`, `{{TAGS_FROM_API}}`
- **Usage:** User copies prompt, pastes in external AI chat, uploads/pastes transcript there

**Prompt flow (3-step conversational):**
1. **Step 1:** Episode Overview + Question 1 (learning style: Long answers / Short & sweet / Highlights only / Frameworks focus)
2. **Step 2:** Question 2 (focus area from tags; 4–6 options + "Balanced / full episode")
3. **Step 3:** Full tailored briefing (depth varies by Q1; focus varies by Q2)

**Briefing sections:** Episode Overview, Key Insights, Stories Shared, Frameworks, Trade-offs, Links

**System prompts:** `System Prompts.md` — V2, V3, V4 variants; API uses V4

---

## Tag Taxonomy

- **Level 1:** 10 core PM domains (Product Discovery, Product Strategy, Product Execution, Product Design, Growth & Acquisition, Retention & Monetization, Go-To-Market, AI Product Management, Leadership & Management, Career & Organization)
- **Level 2:** 62 mechanism/subdomain tags (6–7 per Level 1); some map to multiple Level 1s
- **Level 3:** 19 context filters (B2B, B2C, IC, Manager, Founder, etc.)
- **Level 4:** 17 thinking-frame filters (Systems Thinking, First Principles, Trade Offs, etc.)
- **Source:** `Level 1 to Level 2 Mapping.md` — full taxonomy and overlap mapping

---

## Design System

- **Theme:** Dark luxury – `--bg: #0b0c0f`, `--panel: #14171f`, `--accent: #d4af37`
- **Typography:** Inter (body), Playfair Display (headings)
- **Tag colors:** `--c1`, `--c2`, `--c3`, `--c4` per level
- **DrawerV2:** Dark theme, gold accent blocks for Frameworks and Executive Summary

---

## Known Issues / Observations

1. **Legacy components:** `Drawer.tsx` and `app/api/summarize/route.ts` exist but are unused.
2. **Transcript not sent:** Briefing prompt does not include transcript; user pastes it in the AI chat.
3. **ChatGPT URL limit:** Prompt prefills only when under ~7k chars; otherwise clipboard copy.
4. **`app/lib/prompt.ts`:** Unused; briefing prompt lives in `app/api/briefing-prompt/route.ts`.

---

## File Reference

| File | Purpose |
|------|---------|
| `app/page.tsx` | State, filtering, layout, data loading; uses DrawerV2 |
| `app/ui/DrawerV2.tsx` | Episode detail panel, AI buttons, transcript download |
| `app/ui/Drawer.tsx` | Legacy (unused) |
| `app/ui/Sidebar.tsx` | Tag filters, company filter, search |
| `app/ui/ResultsGrid.tsx` | Episode cards |
| `app/ui/csv.ts` | CSV parsing, tag splitting, key normalization |
| `app/api/briefing-prompt/route.ts` | Generates executive briefing prompt for AI |
| `app/api/summarize/route.ts` | Legacy in-app summarization (unused) |
| `app/globals.css` | Design tokens, layout, responsive grid |
| `scripts/prep-data.mjs` | Copy CSV + transcripts, build index.json |
| `System Prompts.md` | V2, V3, V4 briefing prompts |
| `Level 1 to Level 2 Mapping.md` | Tag taxonomy (10 L1, 62 L2) |
| `data/episodes.csv` | Source episode data |
| `transcripts_raw/` | Source transcripts |
| `public/data/` | Served CSV + index |
| `public/transcripts/` | Served transcripts |
