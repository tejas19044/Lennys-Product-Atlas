"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "./ui/Sidebar";
import ResultsGrid from "./ui/ResultsGrid";
import DrawerV2 from "./ui/DrawerV2";
import { parseCSV, splitTags, normalizeKey } from "./ui/csv";

export type EpisodeRow = {
  srNo?: string;
  guest: string;
  companyName: string;
  companyDescription?: string;
  frameworks?: string;
  ceoSummary: string;
  level1Tags: string[];
  level2Tags: string[];
  level3Tags: string[];
  level4Tags: string[];
  transcriptFile?: string;
};

type IndexMap = Record<string, string>;

function PageContent() {
  const [data, setData] = useState<EpisodeRow[]>([]);
  const [indexMap, setIndexMap] = useState<IndexMap>({});

  const [selected, setSelected] = useState({
    l1: new Set<string>(),
    l2: new Set<string>(),
    l3: new Set<string>(),
    l4: new Set<string>(),
  });

  const [selectedCompany, setSelectedCompany] = useState("");
  const [search, setSearch] = useState("");
  const [openEpisode, setOpenEpisode] = useState<EpisodeRow | null>(null);

  /* =======================
     LOAD CSV + INDEX
  ======================= */
  useEffect(() => {
    (async () => {
      const [csvRes, idxRes] = await Promise.all([
        fetch("/data/episodes.csv", { cache: "no-store" }),
        fetch("/data/index.json", { cache: "no-store" }).catch(() => null),
      ]);

      const csvText = await csvRes.text();
      const rows = parseCSV(csvText);
      const headers = rows[0];

      const col = (name: string) => headers.indexOf(name);

      const guestCol = col("Podcast Guest");
      const companyCol = col("Company Name");
      const compDescCol = col("Company Description");
      const fwCol = col("Frameworks");
      const summaryCol = col("CEO Summary");
      const l1Col = col("Level 1 Tags");
      const l2Col = col("Level 2 Tags");
      const l3Col = col("Level 3 Tags");
      const l4Col = col("Level 4 Tags");
      const srCol = col("Sr No");

      let idx: IndexMap = {};
      if (idxRes && idxRes.ok) {
        idx = await idxRes.json();
        setIndexMap(idx);
      }

      const parsed: EpisodeRow[] = rows.slice(1).map((r) => {
        const guest = (r[guestCol] || "").trim();
        const key = normalizeKey(guest);

        return {
          srNo: srCol >= 0 ? (r[srCol] || "").trim() : undefined,
          guest,
          companyName: (r[companyCol] || "").trim(),
          companyDescription:
            compDescCol >= 0 ? (r[compDescCol] || "").trim() : undefined,
          frameworks: fwCol >= 0 ? (r[fwCol] || "").trim() : undefined,
          ceoSummary: (r[summaryCol] || "").trim(),
          level1Tags: splitTags(l1Col >= 0 ? r[l1Col] : ""),
          level2Tags: splitTags(l2Col >= 0 ? r[l2Col] : ""),
          level3Tags: splitTags(l3Col >= 0 ? r[l3Col] : ""),
          level4Tags: splitTags(l4Col >= 0 ? r[l4Col] : ""),
          transcriptFile: idx[key] || undefined,
        };
      });

      setData(parsed);
    })();
  }, []);

  /* =======================
     DERIVED DATA
  ======================= */

  const companies = useMemo(
    () =>
      Array.from(new Set(data.map((d) => d.companyName))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [data]
  );

  const vocab = useMemo(() => {
    const make = (getter: (e: EpisodeRow) => string[]) =>
      Array.from(new Set(data.flatMap(getter))).sort((a, b) =>
        a.localeCompare(b)
      );

    return {
      l1: make((d) => d.level1Tags),
      l2: make((d) => d.level2Tags),
      l3: make((d) => d.level3Tags),
      l4: make((d) => d.level4Tags),
    };
  }, [data]);

  const filtered = useMemo(() => {
    const allSelected = (set: Set<string>, tags: string[]) =>
      Array.from(set).every((t) => tags.includes(t));

    const q = search.toLowerCase();

    return data.filter((ep) => {
      const tagMatch =
        allSelected(selected.l1, ep.level1Tags) &&
        allSelected(selected.l2, ep.level2Tags) &&
        allSelected(selected.l3, ep.level3Tags) &&
        allSelected(selected.l4, ep.level4Tags);

      if (!tagMatch) return false;
      if (selectedCompany && ep.companyName !== selectedCompany) return false;

      if (!q) return true;

      return (
        ep.guest.toLowerCase().includes(q) ||
        ep.ceoSummary.toLowerCase().includes(q)
      );
    });
  }, [data, selected, selectedCompany, search]);

  const tagCounts = useMemo(() => {
    const counts = { l1: {}, l2: {}, l3: {}, l4: {} } as any;
    for (const ep of filtered) {
      ep.level1Tags.forEach((t) => (counts.l1[t] = (counts.l1[t] || 0) + 1));
      ep.level2Tags.forEach((t) => (counts.l2[t] = (counts.l2[t] || 0) + 1));
      ep.level3Tags.forEach((t) => (counts.l3[t] = (counts.l3[t] || 0) + 1));
      ep.level4Tags.forEach((t) => (counts.l4[t] = (counts.l4[t] || 0) + 1));
    }
    return counts;
  }, [filtered]);

  /* =======================
     ACTIONS
  ======================= */

  const onToggle = (k: "l1" | "l2" | "l3" | "l4", tag: string) => {
    setSelected((prev) => {
      const next = { ...prev, [k]: new Set(prev[k]) };
      next[k].has(tag) ? next[k].delete(tag) : next[k].add(tag);
      return next;
    });
  };

  const clearAll = () => {
    setSelected({ l1: new Set(), l2: new Set(), l3: new Set(), l4: new Set() });
    setSelectedCompany("");
    setSearch("");
  };

  /* =======================
     RENDER
  ======================= */

  return (
    <>
      <div className="page-wrapper">
        <header className="brand-header">
          <h1>Product Atlas</h1>
          <p className="hero-sub">One Place to Explore a Goldmine of Product Insights.</p>
          <p className="powered-by">Powered by Lenny&apos;s Podcast</p>
        </header>

        <div className="shell">
          <div className="app-grid">
            <Sidebar
              vocab={vocab}
              selected={selected}
              onToggle={onToggle}
              onClear={clearAll}
              search={search}
              setSearch={setSearch}
              tagCounts={tagCounts}
              resultCount={filtered.length}
              companies={companies}
              selectedCompany={selectedCompany}
              setSelectedCompany={setSelectedCompany}
            />

            <main>
              <ResultsGrid
                rows={filtered}
                selected={selected}
                onOpen={(ep) => setOpenEpisode(ep)}
              />
            </main>
          </div>
        </div>

        <footer className="page-footer">
          Built by Tejas Dhekane
        </footer>
      </div>

      {openEpisode && (
        <DrawerV2 episode={openEpisode} onClose={() => setOpenEpisode(null)} />
      )}
    </>
  );
}

export default function Page() {
  return <PageContent />;
}
