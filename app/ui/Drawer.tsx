import { useState, useEffect } from "react";
import { EpisodeRow } from "../page";

// Reverted Clean Schema (Camel Case) to match route.ts
// Reverted Clean Schema (Camel Case) to match route.ts but allowing snake_case for defensive rendering
type SummaryJSON = {
  tldr?: {
    coreTakeaways?: string[];
    core_takeaways?: string[];
  };
  aboutSpeaker?: {
    who?: string;
    who_they_are?: string;
    credibility?: string[];
    credibility_signals?: string[];
    philosophy?: string;
    product_philosophy?: string;
  };
  about_speaker?: { // for full object check
    who_they_are?: string;
    credibility_signals?: string[];
    product_philosophy?: string;
  };
  company?: {
    name?: string;
    businessModel?: string;
    business_model?: string;
    customer?: string;
    winningLooksLike?: string;
    winning_looks_like?: string;
    description?: string;
  };
  podcastSummary?: {
    paragraphs?: string[];
    majorPoints?: string[];
    major_points_in_order?: string[];
    bullets?: string[];
  };
  podcast_summary?: {
    paragraphs?: string[];
    major_points_in_order?: string[];
  };
  keyHighlights?: any[]; // Allow string or object
  key_highlights?: any[];
  memorableQuotes?: any[];
  memorable_quotes?: any[];
  frameworks?: {
    name?: string;
    explanation?: string;
    actionableInsight?: string;
    actionable_insight?: string;
  }[];
  whereThisIsUseful?: string[];
  where_most_useful?: string[];
  youtubeVideoId?: string | null;
  meta?: {
    youtube_video_id?: string | null;
  };
};

export default function Drawer({
  episode,
  onClose,
}: {
  episode: EpisodeRow;
  onClose: () => void;
}) {
  const [transcript, setTranscript] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Initializing AI...");
  const [summary, setSummary] = useState<SummaryJSON | null>(null);
  const [wasTruncated, setWasTruncated] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load Transcript
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

  const summarizeWithOpenAI = async () => {
    try {
      setLoading(true);
      setApiError(null);
      setSummary(null);

      // Loading Animation Cycle
      const messages = [
        "Reading 25k tokens...",
        "Identifying key frameworks...",
        "Extracting strategic insights...",
        "Synthesizing summary...",
        "Finalizing output..."
      ];
      let msgIdx = 0;
      setLoadingText(messages[0]);
      const interval = setInterval(() => {
        msgIdx = (msgIdx + 1) % messages.length;
        setLoadingText(messages[msgIdx]);
      }, 3000);

      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          guest: episode.guest,
          companyName: episode.companyName,
          ceoSummary: episode.ceoSummary,
        }),
      });

      clearInterval(interval);

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Request failed");

      console.log("Summary JSON from API:", json.summary);
      setWasTruncated(!!json.truncated);
      setSummary(json.summary as SummaryJSON);
    } catch (e: any) {
      console.error(e);
      setApiError(e?.message || "Failed to summarize");
    } finally {
      setLoading(false);
    }
  };

  // Re-added this helper to force single items into arrays if AI returns sloppy JSON
  function safeList(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (!data) return [];
    return [data];
  }

  // Re-added regex helper for [Strategy] Label parsing
  function boldLabel(text: string) {
    const match = String(text || "").match(/^\[(.*?)\]\s*(.*)/);
    if (match) {
      return (
        <>
          <span style={{
            color: "#000",
            background: "#82f5d8",
            fontSize: 10,
            fontWeight: 800,
            padding: "2px 6px",
            borderRadius: 4,
            marginRight: 8,
            textTransform: "uppercase"
          }}>
            {match[1]}
          </span>
          <span style={{ color: "#ddd" }}>{match[2]}</span>
        </>
      )
    }
    return text; // fallback if no [Label] found
  }

  function boldTerms(text: string) {
    const parts = String(text || "").split(":");
    if (parts.length > 1) {
      return `<strong>${parts[0]}:</strong>${parts.slice(1).join(":")}`;
    }
    return text;
  }

  return (
    <>
      <style jsx global>{`
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); transform: scale(1); }
          50% { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); transform: scale(1.02); }
          100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); transform: scale(1); }
        }
        .loading-pulse {
          animation: pulse-glow 2s infinite ease-in-out;
        }
        .section-title {
            margin: 0 0 16px 0;
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            color: #666;
            letter-spacing: 0.05em;
            border-bottom: 1px solid #222;
            padding-bottom: 8px;
        }
      `}</style>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          zIndex: 100,
          animation: "fadeIn 0.2s ease-out",
        }}
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          margin: "auto",
          width: "90%",
          maxWidth: "1000px",
          height: "90vh",
          background: "rgba(20, 23, 31, 0.98)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "24px",
          padding: "50px 0",
          zIndex: 101,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        {/* Header - Fixed */}
        <div style={{ padding: "0 60px 40px 60px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 24,
              right: 24,
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "none",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              fontSize: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
          >
            ×
          </button>

          <div style={{
            color: "#888",
            fontSize: 13,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 12
          }}>
            {episode.companyName}
          </div>
          <h1 style={{
            margin: 0,
            fontSize: "42px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            background: "linear-gradient(180deg, #fff 0%, #aaa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>
            {episode.guest}
          </h1>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "40px 60px" }}>

          {/* Initial State / Executive Summary */}
          {!summary && (
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                padding: "32px 40px",
                borderRadius: 16,
                marginBottom: 32,
                lineHeight: 1.6,
                fontSize: "18px",
                color: "#ddd",
                border: "1px solid rgba(255,255,255,0.05)",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 16, textTransform: "uppercase" }}>Executive Summary</div>
              {episode.ceoSummary}
            </div>
          )}

          {/* AI Action */}
          {!summary && (
            <div style={{ display: "flex", justifyContent: "center", marginTop: 40, flexDirection: "column", alignItems: "center" }}>
              <button
                onClick={summarizeWithOpenAI}
                disabled={loading}
                className={loading ? "loading-pulse" : ""}
                style={{
                  padding: "16px 36px",
                  borderRadius: 30,
                  border: "none",
                  background: "#fff",
                  color: "#000",
                  fontWeight: 700,
                  fontSize: "16px",
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading ? 0.9 : 1,
                  boxShadow: loading ? "0 0 30px rgba(255,255,255,0.5)" : "0 0 30px rgba(255,255,255,0.1)",
                  transition: "all 0.3s",
                  minWidth: "260px"
                }}
                onMouseOver={(e) => !loading && (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseOut={(e) => !loading && (e.currentTarget.style.transform = "scale(1)")}
              >
                {loading ? loadingText : "Generate Deep Analysis"}
              </button>
              {apiError && <div style={{ marginTop: 10, color: "red" }}>{apiError}</div>}
            </div>
          )}

          {/* THE CONTENT */}
          {summary && (
            <div style={{ animation: "fadeIn 0.5s ease-out" }}>

              {/* TL;DR Section */}
              {(() => {
                const tldr = summary.tldr || (summary as any).tldr;
                // Handle both { coreTakeaways: [] } and { core_takeaways: [] } and []
                const takeaways = Array.isArray(tldr) ? tldr : (tldr?.coreTakeaways || tldr?.core_takeaways || []);

                if (safeList(takeaways).length > 0) return (
                  <div style={{ marginBottom: 48 }}>
                    <h4 className="section-title">TL;DR Analysis</h4>
                    <ul style={{ paddingLeft: 20, fontSize: "16px", lineHeight: 1.6 }}>
                      {safeList(takeaways).map((t: string, i: number) => <li key={i} style={{ marginBottom: 8 }} dangerouslySetInnerHTML={{ __html: boldTerms(t) }} />)}
                    </ul>
                  </div>
                );
              })()}

              <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: 48 }} />

              {/* Speaker & Company Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginBottom: 48 }}>
                {(() => {
                  const speaker = summary.aboutSpeaker || (summary as any).about_speaker;
                  if (speaker) return (
                    <div>
                      <h4 className="section-title">About {speaker.who || speaker.who_they_are}</h4>
                      <ul style={{ paddingLeft: 20, color: "#ccc" }}>
                        {safeList(speaker.credibility || speaker.credibility_signals).map((c: string, i: number) => <li key={i} style={{ marginBottom: 4 }}>{c}</li>)}
                      </ul>
                      <div style={{ marginTop: 12, padding: "12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, fontStyle: "italic", color: "#aaa" }}>
                        "{speaker.philosophy || speaker.product_philosophy}"
                      </div>
                    </div>
                  );
                })()}

                {(() => {
                  const company = summary.company;
                  if (company) return (
                    <div>
                      <h4 className="section-title">Company Profile</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 16px", fontSize: "14px", marginBottom: 16 }}>
                        <div style={{ color: "#888" }}>Name</div><div>{company.name}</div>
                        <div style={{ color: "#888" }}>Model</div><div>{company.businessModel || (company as any).business_model}</div>
                        <div style={{ color: "#888" }}>Customer</div><div>{company.customer}</div>
                        <div style={{ color: "#888" }}>Winning</div><div>{company.winningLooksLike || (company as any).winning_looks_like}</div>
                      </div>
                      <div style={{ fontSize: 13, color: "#888" }}>{company.description}</div>
                    </div>
                  );
                })()}
              </div>

              {/* Summary Narrative */}
              {(() => {
                const pod = summary.podcastSummary || (summary as any).podcast_summary;
                if (pod) return (
                  <Section title="Podcast Narrative">
                    {safeList(pod.paragraphs).map((p: string, i: number) => <p key={i} style={{ marginBottom: 12, color: "#ddd" }}>{p}</p>)}
                    <ul style={{ marginTop: 20, paddingLeft: 20, columns: 2 }}>
                      {safeList(pod.majorPoints || pod.major_points_in_order || pod.bullets).map((b: string, i: number) => <li key={i} style={{ marginBottom: 8, fontSize: 14, color: "#ccc" }}>{b}</li>)}
                    </ul>
                  </Section>
                );
              })()}

              {/* Key Highlights */}
              <Section title="Strategic Highlights">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {(() => {
                    const highlights = summary.keyHighlights || (summary as any).key_highlights || [];
                    return safeList(highlights).map((h: any, i: number) => {
                      // Handle both string "[Label] Text" and object { label, highlight }
                      if (typeof h === 'string') {
                        return (
                          <div key={i} style={{ background: "#222", padding: "12px 16px", borderRadius: 8, border: "1px solid #333", fontSize: 14 }}>
                            {boldLabel(h)}
                          </div>
                        );
                      } else {
                        return (
                          <div key={i} style={{ background: "#222", padding: "12px 16px", borderRadius: 8, border: "1px solid #333", fontSize: 14 }}>
                            <span style={{
                              color: "#000",
                              background: "#82f5d8",
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: 4,
                              marginRight: 8,
                              textTransform: "uppercase"
                            }}>{h.label}</span>
                            <span style={{ color: "#ddd" }}>{h.highlight}</span>
                          </div>
                        );
                      }
                    });
                  })()}
                </div>
              </Section>

              {/* Memorable Quotes */}
              <Section title="Memorable Quotes">
                {(() => {
                  const quotes = summary.memorableQuotes || (summary as any).memorable_quotes || [];
                  return safeList(quotes).map((q: any, i: number) => (
                    <div key={i} style={{ marginBottom: 16, paddingLeft: 12, borderLeft: "2px solid #333" }}>
                      <div style={{ fontStyle: "italic", marginBottom: 4 }}>"{q.quote}"</div>
                      <div style={{ fontSize: "12px", color: "#888" }}>— {q.why}</div>
                    </div>
                  ));
                })()}
              </Section>

              {/* Deep Frameworks */}
              <h4 className="section-title" style={{ marginTop: 40, fontSize: 16 }}>Core Frameworks</h4>
              <div style={{ display: "grid", gap: 32, marginBottom: 40 }}>
                {(() => {
                  const frameworks = summary.frameworks || [];
                  return safeList(frameworks).map((fw: any, i: number) => (
                    <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, overflow: "hidden" }}>
                      <div style={{ background: "rgba(255,255,255,0.05)", padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontWeight: 700, fontSize: 16 }}>
                        {fw.name}
                      </div>
                      <div style={{ padding: 24 }}>
                        <div style={{ marginBottom: 16, fontSize: 15, color: "#ddd", lineHeight: 1.6 }}>{fw.explanation}</div>
                        <div style={{ marginTop: 16, padding: "16px", background: "rgba(130, 245, 216, 0.1)", borderRadius: 8, border: "1px solid rgba(130, 245, 216, 0.2)" }}>
                          <div style={{ textTransform: "uppercase", color: "#82f5d8", fontWeight: 700, fontSize: 11, marginBottom: 4 }}>Actionable Insight</div>
                          <div style={{ fontSize: 14, color: "#fff" }}>{fw.actionableInsight || fw.actionable_insight}</div>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Use Cases */}
              <div style={{ background: "linear-gradient(90deg, #1a2236 0%, transparent 100%)", padding: 24, borderRadius: 12, marginBottom: 40 }}>
                <h4 className="section-title" style={{ border: "none", marginBottom: 12 }}>Where to use this</h4>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {(() => {
                    const cases = summary.whereThisIsUseful || (summary as any).where_most_useful;
                    return safeList(cases).map((u: string, i: number) => <li key={i} style={{ marginBottom: 6, color: "#abcdef" }}>{u}</li>);
                  })()}
                </ul>
              </div>

              {/* YouTube Embed */}
              {(() => {
                const yt = summary.youtubeVideoId || (summary as any).meta?.youtube_video_id;
                if (yt) return (
                  <div style={{ marginBottom: 40, borderRadius: 12, overflow: "hidden", border: "1px solid #333" }}>
                    <iframe
                      width="100%"
                      height="400"
                      src={`https://www.youtube.com/embed/${yt}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                );
              })()}


            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: "auto",
          padding: "20px 60px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 20
        }}>
          <div style={{ fontSize: 14, color: "#666" }}>If this sounds interesting, go to the source:</div>

          <button
            onClick={downloadTranscript}
            style={{
              padding: "10px 20px",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "#fff",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "#fff"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}
          >
            Download Full Transcript
          </button>
        </div>

      </div>
    </>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h4 className="section-title">{title}</h4>
      <div style={{ fontSize: "16px", lineHeight: 1.7, color: "#eee" }}>
        {children}
      </div>
    </div>
  );
}
