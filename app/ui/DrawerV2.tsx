"use client";

import { useState, useEffect } from "react";
import { EpisodeRow } from "../page";

async function fetchBriefingPrompt(episode: EpisodeRow): Promise<string> {
  const res = await fetch("/api/briefing-prompt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      guest: episode.guest,
      companyName: episode.companyName,
      ceoSummary: episode.ceoSummary || "",
      level1Tags: episode.level1Tags || [],
      level2Tags: episode.level2Tags || [],
      level3Tags: episode.level3Tags || [],
      level4Tags: episode.level4Tags || [],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.prompt ?? "";
}

// Minimal inline SVG icons
const IconGrid = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const IconClipboard = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <rect x="9" y="4" width="10" height="14" rx="2" />
    <path d="M8 6H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10" />
  </svg>
);
const IconDownload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IconSparkle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
    <path d="M6 15l1.5 1.5L9 18l-1.5 4.5L6 24l1.5-1.5L9 18z" />
    <path d="M18 15l1.5 1.5L21 18l-1.5 4.5L18 24l1.5-1.5L21 18z" />
  </svg>
);
const IconInfo = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function TagRow({
  label,
  tags,
  colorVar,
}: {
  label: string;
  tags: string[];
  colorVar: string;
}) {
  if (!tags?.length) return null;
  return (
    <div
      style={{
        fontSize: 12,
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
      <span>
        {tags.map((t, i) => (
          <span key={t}>
            {i > 0 && ", "}
            <span
              style={{
                color: `var(${colorVar})`,
                fontWeight: 600,
                fontSize: 11,
              }}
            >
              {t}
            </span>
          </span>
        ))}
      </span>
    </div>
  );
}

export default function DrawerV2({
  episode,
  onClose,
}: {
  episode: EpisodeRow;
  onClose: () => void;
}) {
  const [transcript, setTranscript] = useState<string>("");
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [copiedFor, setCopiedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedFor) return;
    const t = setTimeout(() => setCopiedFor(null), 4000);
    return () => clearTimeout(t);
  }, [copiedFor]);

  useEffect(() => {
    if (!episode.transcriptFile) {
      setTranscript("No transcript file linked.");
      return;
    }
    const path = `/transcripts/${episode.transcriptFile}`;
    fetch(path)
      .then(async (res) => {
        if (!res.ok) throw new Error("Transcript not found");
        return res.text();
      })
      .then((txt) => setTranscript(txt))
      .catch((err) => setTranscript("Error loading transcript: " + err.message));
  }, [episode]);

  const downloadTranscript = () => {
    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${episode.guest} - ${episode.companyName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const CLIPBOARD_INSTRUCTION =
    "Paste the prompt from your clipboard (Ctrl+V), then add the transcript below.";

  const OPENAI_URL = "https://chat.openai.com";
  const CLAUDE_URL = "https://claude.ai";
  const PERPLEXITY_URL = "https://www.perplexity.ai";
  const GEMINI_URL = "https://gemini.google.com/app";

  const openWithPrompt = async (
    platform: "chatgpt" | "claude" | "perplexity" | "gemini"
  ) => {
    setAnalyzeLoading(true);
    setAnalyzeError(null);
    try {
      const prompt = await fetchBriefingPrompt(episode);
      const encoded = encodeURIComponent(prompt);
      const urlLimit = 7000;

      let targetUrl: string;
      if (platform === "chatgpt") {
        targetUrl =
          encoded.length < urlLimit
            ? `${OPENAI_URL}/?q=${encoded}`
            : `${OPENAI_URL}/?q=${encodeURIComponent(CLIPBOARD_INSTRUCTION)}`;
        if (encoded.length >= urlLimit) await navigator.clipboard.writeText(prompt);
      } else {
        await navigator.clipboard.writeText(prompt);
        setCopiedFor(platform);
        // Claude, Perplexity, Gemini do not support prefilled URLs; open base URL
        if (platform === "claude") targetUrl = CLAUDE_URL;
        else if (platform === "perplexity") targetUrl = PERPLEXITY_URL;
        else targetUrl = GEMINI_URL;
      }
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Failed to generate prompt");
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const panelStyle = { background: "var(--panel)" };
  const btnBase = {
    padding: "10px 20px",
    fontSize: "13px",
    fontWeight: 600,
    borderRadius: "var(--radius)",
    border: "1px solid",
    cursor: "pointer" as const,
    transition: "all 0.22s ease",
  };
  const platformButtons = [
    { id: "chatgpt" as const, label: "ChatGPT", color: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.4)", textColor: "#6ee7b7" },
    { id: "claude" as const, label: "Claude", color: "rgba(212, 175, 55, 0.12)", borderColor: "rgba(212, 175, 55, 0.4)", textColor: "#d4af37" },
    { id: "perplexity" as const, label: "Perplexity", color: "rgba(100, 149, 180, 0.15)", borderColor: "rgba(100, 149, 180, 0.4)", textColor: "#89b4d4" },
    { id: "gemini" as const, label: "Gemini", color: "rgba(138, 115, 180, 0.15)", borderColor: "rgba(138, 115, 180, 0.4)", textColor: "#b8a0d4" },
  ];
  const mutedStyle = { color: "var(--muted)" };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(8px)",
          zIndex: 100,
        }}
      />

      <div
        className="drawer-overlay"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 101,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          className="drawer-panel"
          style={{
            ...panelStyle,
            width: "100%",
            maxWidth: "800px",
            height: "90vh",
            borderRadius: "var(--radius2)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "32px 40px 24px",
              textAlign: "center",
              borderBottom: "1px solid var(--border)",
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "var(--accent)",
                marginBottom: "8px",
                fontWeight: 800,
              }}
            >
              {episode.companyName}
            </div>
            <h2
              style={{
                fontSize: "28px",
                fontWeight: 400,
                color: "#fff",
                margin: 0,
                fontFamily: `"Playfair Display", serif`,
              }}
            >
              {episode.guest}
            </h2>

            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: "24px",
                right: "24px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.05)",
                color: "var(--text)",
                cursor: "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.22s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
              }}
            >
              <IconClose />
            </button>
          </div>

          {/* Frameworks (matches home page card) */}
          {episode.frameworks && (
            <div
              style={{
                padding: "16px 40px",
                borderBottom: "1px solid var(--border)",
                background: "rgba(212, 175, 55, 0.05)",
                borderLeft: "3px solid var(--accent)",
                marginLeft: "40px",
                marginRight: "40px",
                borderRadius: "0 8px 8px 0",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              <span style={{ color: "var(--accent)", marginTop: "2px", flexShrink: 0 }}>
                <IconGrid />
              </span>
              <div>
                <div
                  style={{
                    fontSize: "9px",
                    fontWeight: 900,
                    color: "var(--label-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "6px",
                  }}
                >
                  Frameworks
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "var(--c2)",
                    lineHeight: 1.6,
                    fontStyle: "italic",
                  }}
                >
                  {episode.frameworks}
                </div>
              </div>
            </div>
          )}

          {/* CEO Summary */}
          {episode.ceoSummary && (
            <div
              style={{
                padding: "20px 40px",
                borderBottom: "1px solid var(--border)",
                background: "rgba(212, 175, 55, 0.05)",
                borderLeft: "3px solid var(--accent)",
                marginLeft: "40px",
                marginRight: "40px",
                marginBottom: "0",
                borderRadius: "0 8px 8px 0",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
              }}
            >
              <span style={{ color: "var(--accent)", marginTop: "2px", flexShrink: 0 }}>
                <IconClipboard />
              </span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "9px",
                    fontWeight: 900,
                    color: "var(--label-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: "8px",
                  }}
                >
                  Executive Summary
                </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.7,
                }}
              >
                {episode.ceoSummary}
              </div>
              </div>
            </div>
          )}

          {/* Level 1–4 Tags */}
          {(episode.level1Tags?.length ||
            episode.level2Tags?.length ||
            episode.level3Tags?.length ||
            episode.level4Tags?.length) > 0 && (
            <div
              style={{
                padding: "16px 40px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {episode.level1Tags?.length > 0 && (
                <TagRow label="Core" tags={episode.level1Tags} colorVar="--c1" />
              )}
              {episode.level2Tags?.length > 0 && (
                <TagRow label="Topics" tags={episode.level2Tags} colorVar="--c2" />
              )}
              {episode.level3Tags?.length > 0 && (
                <TagRow label="Role" tags={episode.level3Tags} colorVar="--c3" />
              )}
              {episode.level4Tags?.length > 0 && (
                <TagRow label="Strategy" tags={episode.level4Tags} colorVar="--c4" />
              )}
            </div>
          )}

          {/* Content Area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "40px 40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                padding: "12px 16px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "var(--radius)",
                border: "1px solid var(--border)",
                marginBottom: "24px",
                maxWidth: "420px",
              }}
            >
              <span style={{ color: "var(--accent)", marginTop: "2px", flexShrink: 0 }}>
                <IconInfo />
              </span>
              <p
                style={{
                  fontSize: "12px",
                  ...mutedStyle,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                System prompt is auto-saved on your device. Just hit Ctrl+V on the chat of your favourite AI and upload the transcript.
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "12px",
                width: "100%",
                maxWidth: "420px",
              }}
            >
              {platformButtons.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openWithPrompt(p.id)}
                  disabled={analyzeLoading}
                  style={{
                    ...btnBase,
                    background: analyzeLoading ? "rgba(255,255,255,0.03)" : p.color,
                    borderColor: p.borderColor,
                    color: p.textColor,
                    opacity: analyzeLoading ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!analyzeLoading) {
                      e.currentTarget.style.background = p.color;
                      e.currentTarget.style.opacity = "0.9";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = p.color;
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <IconSparkle />
                    {analyzeLoading ? "Loading…" : p.label}
                  </span>
                </button>
              ))}
            </div>
            {copiedFor && (
              <div
                style={{
                  marginTop: "16px",
                  fontSize: "13px",
                  color: "var(--accent)",
                  padding: "10px 16px",
                  background: "rgba(212, 175, 55, 0.1)",
                  borderRadius: "8px",
                  border: "1px solid rgba(212, 175, 55, 0.3)",
                }}
              >
                Prompt copied! Paste it in {copiedFor === "claude" ? "Claude" : copiedFor === "perplexity" ? "Perplexity" : "Gemini"} (Ctrl+V).
              </div>
            )}
            {analyzeError && (
              <div style={{ marginTop: "16px", color: "#ff3b30", fontSize: "14px" }}>
                {analyzeError}
              </div>
            )}
          </div>

          {/* Footer */}
          {transcript && (
            <div
              style={{
                padding: "20px 40px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={downloadTranscript}
                style={{
                  padding: "10px 24px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--accent)",
                  background: "transparent",
                  border: "1px solid var(--accent)",
                  borderRadius: "var(--radius2)",
                  cursor: "pointer",
                  transition: "all 0.22s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(212, 175, 55, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <IconDownload />
                  Download Transcript
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
