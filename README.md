# Podcast Atlas (MVP)

This is a **deployable** MVP for your PM decision-routing dashboard:
- Loads your **CSV** (tagging database)
- Filters by **Level 1–4 tags**
- Opens a **Drawer** with a placeholder “API will be called here…” message + your prompt
- Allows **Download Transcript** as a `.txt`

## What you need to provide (your current assets)
1) A single CSV file (exported from Google Sheets) containing at least these headers:
   - Podcast Guest
   - Company Name
   - Company Description
   - Level 1 Tags
   - Level 2 Tags
   - Level 3 Tags
   - Level 4 Tags
   - Frameworks
   - CEO Summary

2) A folder of transcript `.txt` files named **exactly like the guest** (example: `Alex Schultz.txt`).

> If you have multiple episodes with the same guest name, we’ll rename transcripts to stable IDs automatically during prep.

---

## Step-by-step (local run)

### 1) Install Node.js
Install **Node 18+** from nodejs.org (or via nvm).

### 2) Put your assets here
- Put your CSV at: `data/episodes.csv`
- Put transcripts in: `transcripts_raw/`

Folder structure:
```
data/episodes.csv
transcripts_raw/<Guest Name>.txt
```

### 3) Prepare public assets (auto mapping)
Run:
```bash
npm install
npm run prep:data
```

This generates:
- `public/data/episodes.csv`
- `public/transcripts/<somefile>.txt`
- `public/data/index.json` (mapping from row -> transcript filename)

### 4) Run the app
```bash
npm run dev
```
Open: http://localhost:3000

---

## Deploy to Vercel
1) Create a GitHub repo and push this project.
2) Import the repo into Vercel.
3) In Vercel, set **Build Command** to:
   - `npm run prep:data && npm run build`
4) Deploy.

---

## Customizing the Prompt
Edit `app/lib/prompt.ts` and replace `PROMPT_TEXT`.

---

## Notes
- This MVP is static-friendly: transcripts are served from `public/transcripts`.
- The Drawer includes a clear placeholder for future API summarization.
