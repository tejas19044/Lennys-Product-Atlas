import fs from "fs";
import path from "path";

const CSV_IN = path.resolve("data/episodes.csv");
const TRANSCRIPTS_IN_DIR = path.resolve("transcripts_raw");
const CSV_OUT = path.resolve("public/data/episodes.csv");
const INDEX_OUT = path.resolve("public/data/index.json");
const TRANSCRIPTS_OUT_DIR = path.resolve("public/transcripts");

const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['".,()]/g, "")
    .replace(/&/g, " and ")
    .replace(/\s+/g, " ")
    .trim();

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  return lines.map((line) =>
    line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((v) => v.replace(/^"|"$/g, "").trim())
  );
};

const similarity = (a, b) => {
  const A = new Set(normalize(a).split(" ").filter(Boolean));
  const B = new Set(normalize(b).split(" ").filter(Boolean));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  return inter / Math.max(A.size, B.size);
};

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function main() {
  if (!fs.existsSync(CSV_IN)) throw new Error("Missing data/episodes.csv");
  if (!fs.existsSync(TRANSCRIPTS_IN_DIR)) throw new Error("Missing transcripts_raw/ folder");

  ensureDir(path.dirname(CSV_OUT));
  ensureDir(path.dirname(INDEX_OUT));
  ensureDir(TRANSCRIPTS_OUT_DIR);

  // copy csv to public
  fs.copyFileSync(CSV_IN, CSV_OUT);

  const transcriptFiles = fs.readdirSync(TRANSCRIPTS_IN_DIR).filter(f => f.toLowerCase().endsWith(".txt"));
  const fileByNorm = new Map();
  for (const f of transcriptFiles) {
    const base = f.replace(/\.txt$/i, "");
    fileByNorm.set(normalize(base), f);
  }

  const csvText = fs.readFileSync(CSV_IN, "utf8");
  const rows = parseCSV(csvText);
  const headers = rows[0];
  const guestCol = headers.indexOf("Podcast Guest");
  if (guestCol === -1) throw new Error('CSV missing "Podcast Guest" header');

  const index = {};
  const unmatched = [];
  const fuzzy = [];

  for (const r of rows.slice(1)) {
    const guest = (r[guestCol] || "").trim();
    if (!guest) continue;
    const gNorm = normalize(guest);

    let file = fileByNorm.get(gNorm);

    if (!file) {
      let best = { f: null, score: 0 };
      for (const f of transcriptFiles) {
        const base = f.replace(/\.txt$/i, "");
        const s = similarity(guest, base);
        if (s > best.score) best = { f, score: s };
      }
      if (best.f && best.score >= 0.8) {
        file = best.f;
        fuzzy.push({ guest, file, score: best.score });
      }
    }

    if (file) {
      index[gNorm] = file;

      // Copy transcript to public/transcripts (no rename in MVP)
      const src = path.join(TRANSCRIPTS_IN_DIR, file);
      const dst = path.join(TRANSCRIPTS_OUT_DIR, file);
      if (!fs.existsSync(dst)) fs.copyFileSync(src, dst);
    } else {
      unmatched.push(guest);
    }
  }

  fs.writeFileSync(INDEX_OUT, JSON.stringify(index, null, 2), "utf8");

  console.log(`✅ Copied CSV to ${CSV_OUT}`);
  console.log(`✅ Wrote index to ${INDEX_OUT}`);
  console.log(`✅ Copied ${Object.keys(index).length} transcripts to ${TRANSCRIPTS_OUT_DIR}`);

  if (fuzzy.length) {
    console.log("\n⚠️ Fuzzy matches (review):");
    fuzzy.forEach(x => console.log(`- ${x.guest} → ${x.file} (score ${x.score.toFixed(2)})`));
  }

  if (unmatched.length) {
    console.log("\n❌ Unmatched guests (needs rename or better naming):");
    unmatched.forEach(g => console.log(`- ${g}`));
    process.exitCode = 1;
  }
}

main();
