"use client";

import type { EpisodeRow } from "../page";

type Props = {
  rows: EpisodeRow[];
  selected: { l1: Set<string>; l2: Set<string>; l3: Set<string>; l4: Set<string> };
  onOpen: (ep: EpisodeRow) => void;
};

function hl(tag: string, set: Set<string>, colorVar: string) {
  if (!set.has(tag)) return <span key={tag}>{tag}</span>;
  return (
    <span key={tag} style={{ fontWeight: 800, color: `var(${colorVar})` }}>
      {tag}
    </span>
  );
}

function row(label: string, tags: string[], set: Set<string>, colorVar: string) {
  if (!tags?.length) return null;
  return (
    <div
      style={{
        fontSize: 11,
        color: "var(--muted)",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
    >
      <strong
        style={{
          fontSize: 9,
          color: "var(--label-muted)",
          minWidth: 75,
          textTransform: "uppercase",
          paddingTop: 2,
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </strong>
      <span>{tags.map((t, i) => (i ? [", ", hl(t, set, colorVar)] : hl(t, set, colorVar)))}</span>
    </div>
  );
}

export default function ResultsGrid({ rows, selected, onOpen }: Props) {
  // ✅ THIS is the ONLY grid now (3 columns controlled by .results-grid CSS)
  return (
    <div className="results-grid">
      {rows.map((ep) => (
        <div
          key={`${ep.guest}-${ep.companyName}-${ep.srNo || ""}`}
          onClick={() => onOpen(ep)}
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius2)",
            padding: 32,
            display: "flex",
            flexDirection: "column",
            cursor: "pointer",
            transition: "all 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)";
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
            (e.currentTarget as HTMLDivElement).style.background = "var(--panel-hover)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
            (e.currentTarget as HTMLDivElement).style.transform = "translateY(0px)";
            (e.currentTarget as HTMLDivElement).style.background = "var(--panel)";
          }}
        >
          {/* Head */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                color: "var(--accent)",
                fontSize: 10,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginBottom: 8,
              }}
            >
              {ep.companyName || "—"}
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: 24,
                color: "#fff",
                fontFamily: `"Playfair Display", serif`,
                fontWeight: 400,
              }}
            >
              {ep.guest}
            </h2>
          </div>

          {/* Frameworks */}
          {ep.frameworks ? (
            <div
              style={{
                fontSize: 13,
                color: "var(--c2)",
                lineHeight: 1.6,
                marginBottom: 20,
                fontStyle: "italic",
                padding: 12,
                background: "rgba(212, 175, 55, 0.05)",
                borderRadius: "var(--radius)",
                borderLeft: "2px solid var(--accent)",
              }}
            >
              <span style={{ fontWeight: 900, fontStyle: "normal", fontSize: 9, color: "var(--label-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: 10 }}>
                Frameworks
              </span>
              {ep.frameworks}
            </div>
          ) : null}

          {/* Summary */}
          <div
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              marginBottom: 24,
              flexGrow: 1,
            }}
          >
            {ep.ceoSummary}
          </div>

          {/* Footer tags */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.06)",
              paddingTop: 20,
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {row("Core", ep.level1Tags, selected.l1, "--c1")}
            {row("Topics", ep.level2Tags, selected.l2, "--c2")}
            {row("Role", ep.level3Tags, selected.l3, "--c3")}
            {row("Strategy", ep.level4Tags, selected.l4, "--c4")}
          </div>
        </div>
      ))}
    </div>
  );
}
