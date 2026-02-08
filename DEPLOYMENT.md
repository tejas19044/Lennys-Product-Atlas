# Deployment Guide: GitHub → Vercel

## Step 1: Prepare for GitHub

### 1.1 Ensure `.gitignore` is correct
Your project already ignores:
- `node_modules`, `.next`, `.env*`
- `public/data/*.csv`, `public/transcripts/` (generated at build time)

### 1.2 (Optional) Remove `private: true` from package.json
If you want the repo to be public, change `"private": true` to `"private": false` in `package.json`.

---

## Step 2: Push to GitHub

### 2.1 Initialize git (if not already)
```bash
cd "c:\Users\ADMIN\Desktop\podcast-routing-atlas\Prototype_2"
git init
```

### 2.2 Create a new repo on GitHub
1. Go to [github.com/new](https://github.com/new)
2. Name it: `product-atlas` (or `podcast-routing-atlas`)
3. Choose **Public**
4. Do **not** add README, .gitignore, or license (you already have them)
5. Click **Create repository**

### 2.3 Add remote and push
```bash
git add .
git commit -m "Initial commit: Product Atlas - PM decision-routing dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/product-atlas.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 3: Deploy on Vercel

### 3.1 Sign up / Log in
- Go to [vercel.com](https://vercel.com)
- Sign in with **GitHub**

### 3.2 Import project
1. Click **Add New** → **Project**
2. Select your **product-atlas** repo
3. Click **Import**

### 3.3 Configure build settings
- **Framework Preset:** Next.js (auto-detected)
- **Build Command:**  
  ```
  npm run prep:data && npm run build
  ```
  *(This runs the prep script before build so transcripts and index are generated.)*
- **Output Directory:** leave default
- **Install Command:** `npm install` (default)

### 3.4 Environment variables
- **None required** for the core app (briefing prompt API has no secrets)
- If you add features later (e.g. in-app AI), add `OPENAI_API_KEY` in Vercel → Settings → Environment Variables

### 3.5 Deploy
Click **Deploy**. Wait 1–2 minutes.

---

## Step 4: Post-deploy

- Vercel gives you a URL like `product-atlas-xxx.vercel.app`
- Each push to `main` triggers a new deployment
- Optional: Add a custom domain in Vercel → Settings → Domains

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails: "Missing data/episodes.csv" | Ensure `data/episodes.csv` is committed |
| Build fails: "Missing transcripts_raw" | Ensure `transcripts_raw/` folder exists and is committed |
| Site loads but no episodes | Check that `prep:data` ran (Build Command must include it) |
| Large repo size | `transcripts_raw/` has many files; consider Git LFS or hosting transcripts elsewhere later |
