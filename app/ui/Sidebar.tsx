"use client";

type Props = {
  vocab: { l1: string[]; l2: string[]; l3: string[]; l4: string[] };
  selected: { l1: Set<string>; l2: Set<string>; l3: Set<string>; l4: Set<string> };
  onToggle: (k: "l1" | "l2" | "l3" | "l4", tag: string) => void;
  onClear: () => void;

  // episode search (not tag search)
  search: string;
  setSearch: (v: string) => void;

  // dynamic counters
  tagCounts: {
    l1: Record<string, number>;
    l2: Record<string, number>;
    l3: Record<string, number>;
    l4: Record<string, number>;
  };

  // result count
  resultCount: number;

  // ✅ company filter (new)
  companies: string[];
  selectedCompany: string;
  setSelectedCompany: (v: string) => void;
};

const levelMeta = {
  l1: { title: "Core", colorVar: "--c1" as const },
  l2: { title: "Topics", colorVar: "--c2" as const },
  l3: { title: "Role", colorVar: "--c3" as const },
  l4: { title: "Strategy", colorVar: "--c4" as const },
};

export default function Sidebar({
  vocab,
  selected,
  onToggle,
  onClear,
  search,
  setSearch,
  tagCounts,
  resultCount,
  companies,
  selectedCompany,
  setSelectedCompany,
}: Props) {
  return (
    <aside
      className="sidebar-mobile"
      style={{
        position: "sticky",
        top: 40,
        height: "calc(100vh - 80px)",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* Top controls panel */}
      <div
        style={{
          background: "var(--panel)",
          padding: 20,
          border: "1px solid var(--border)",
          borderRadius: "var(--radius2)",
        }}
      >
        {/* ✅ Company filter dropdown (luxury select) */}
        <select
          className="sidebar-select"
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          style={{
            width: "100%",
            color: "var(--text)",
            padding: 12,
            marginBottom: 12,
            fontSize: 13,
            appearance: "none",
          }}
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Episode search */}
        <input
          className="sidebar-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter expertise tags... (search episodes)"
          style={{
            width: "100%",
            color: "var(--text)",
            padding: 12,
            marginBottom: 12,
            fontSize: 13,
          }}
        />

        <button
          className="sidebar-btn"
          onClick={onClear}
          style={{
            width: "100%",
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--muted)",
            padding: 10,
            borderRadius: "var(--radius)",
            cursor: "pointer",
            fontSize: 10,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
          title="Clear all filters"
        >
          Clear All Filters • {resultCount}
        </button>
      </div>

      {/* Tag levels stack (do not change logic — preserved) */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          paddingRight: 8,
        }}
      >
        {(["l1", "l2", "l3", "l4"] as const).map((k, idx) => (
          <div
            key={k}
            style={{
              background: "var(--panel)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius2)",
              padding: 14,
              borderLeft: `${idx === 3 ? 4 : 3}px solid var(${levelMeta[k].colorVar})`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                textTransform: "uppercase",
                fontWeight: 800,
                marginBottom: 12,
                letterSpacing: "0.08em",
                opacity: 0.8,
              }}
            >
              <span>{levelMeta[k].title}</span>
              <span>{vocab[k].length}</span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {vocab[k].map((tag) => {
                const isSel = selected[k].has(tag);
                const count = tagCounts[k][tag] || 0;

                const bg = isSel ? `var(${levelMeta[k].colorVar})` : "rgba(255,255,255,0.03)";
                const color = isSel ? "#000" : "var(--muted)";

                return (
                  <button
                    key={tag}
                    onClick={() => onToggle(k, tag)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: "var(--radius)",
                      fontSize: 11,
                      background: bg,
                      cursor: "pointer",
                      display: "inline-flex",
                      gap: 6,
                      alignItems: "center",
                      color,
                      border: "1px solid transparent",
                      transition: "0.2s",

                      // dim if 0 matches (unless selected)
                      opacity: count === 0 && !isSel ? 0.35 : 1,
                    }}
                    title={`${tag} (${count})`}
                  >
                    <span>{tag}</span>
                    <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 400 }}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
