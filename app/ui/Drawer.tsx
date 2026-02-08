import { useState, useEffect } from "react";
import { EpisodeRow } from "../page";

// Executive PM Dashboard Schema
type SummaryJSON = {
  overview: {
    executiveBrief: string;
    coreTakeaways: string[];
  };
  insights: {
    tag: "Strategy" | "Execution" | "Growth" | "Leadership" | "Career" | "GTM" | "AI" | "Product" | "Research" | "Metrics";
    insight: string;
    evidence: {
      time: string;
      cue: string;
    };
  }[];
  frameworks: {
    name: string;
    whenToUse: string;
    steps: string[];
    pitfalls: string[];
    evidence: {
      time: string;
      cue: string;
    }[];
  }[];
  about: {
    speaker: {
      who: string;
      credibility: string[];
      philosophy: string | null;
    };
    company: {
      name: string;
      context: string | null;
    };
  };
  youtubeVideoId: string | null;
};

type TabType = "about" | "overview" | "insights";

export default function Drawer({
  episode,
  onClose,
}: {
  episode: EpisodeRow;
  onClose: () => void;
}) {
  const [transcript, setTranscript] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Analyzing transcript...");
  const [summary, setSummary] = useState<SummaryJSON | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("about");

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

  // Loading messages cycle
  useEffect(() => {
    if (!loading) return;
    const messages = [
      "Analyzing transcript...",
      "Extracting key insights...",
      "Identifying frameworks...",
      "Building knowledge cards...",
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % messages.length;
      setLoadingText(messages[idx]);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

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
    setLoading(true);
    setApiError(null);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          guest: episode.guest,
          companyName: episode.companyName,
          ceoSummary: episode.ceoSummary || "",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setSummary(data.summary);
    } catch (err: any) {
      setApiError(err.message || "Failed to generate analysis");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
        }}
      />

      {/* Drawer */}
      <div
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
          style={{
            background: "#ffffff",
            width: "100%",
            maxWidth: "800px",
            height: "90vh",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "32px 40px 24px",
              textAlign: "center",
              borderBottom: "1px solid #e5e5e7",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#86868b",
                marginBottom: "8px",
              }}
            >
              {episode.companyName}
            </div>
            <h2
              style={{
                fontSize: "28px",
                fontWeight: 600,
                color: "#1d1d1f",
                margin: 0,
              }}
            >
              {episode.guest}
            </h2>

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: "24px",
                right: "24px",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "none",
                background: "#f5f5f7",
                color: "#1d1d1f",
                cursor: "pointer",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e8e8ed";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f5f5f7";
              }}
            >
              ×
            </button>
          </div>

          {/* Segmented Control */}
          <div
            style={{
              padding: "20px 40px",
              borderBottom: "1px solid #e5e5e7",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                background: "#f5f5f7",
                borderRadius: "10px",
                padding: "2px",
                position: "relative",
              }}
            >
              {(["about", "overview", "insights"] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "8px 20px",
                    border: "none",
                    background: activeTab === tab ? "#ffffff" : "transparent",
                    color: activeTab === tab ? "#1d1d1f" : "#86868b",
                    fontSize: "15px",
                    fontWeight: 500,
                    cursor: "pointer",
                    borderRadius: "8px",
                    transition: "all 0.25s ease",
                    textTransform: "capitalize",
                    boxShadow: activeTab === tab ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "32px 40px",
            }}
          >
            {!summary ? (
              <div style={{ textAlign: "center", paddingTop: "60px" }}>
                <div
                  style={{
                    fontSize: "15px",
                    color: "#6e6e73",
                    marginBottom: "24px",
                    lineHeight: 1.5,
                  }}
                >
                  Generate an executive analysis with frameworks, insights, and key takeaways.
                </div>
                <button
                  onClick={summarizeWithOpenAI}
                  disabled={loading || !transcript}
                  style={{
                    padding: "12px 32px",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "#ffffff",
                    background: loading ? "#86868b" : "#007aff",
                    border: "none",
                    borderRadius: "20px",
                    cursor: loading || !transcript ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && transcript) {
                      e.currentTarget.style.background = "#0051d5";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading && transcript) {
                      e.currentTarget.style.background = "#007aff";
                    }
                  }}
                >
                  {loading ? loadingText : "Generate Analysis"}
                </button>
                {apiError && (
                  <div
                    style={{
                      marginTop: "16px",
                      color: "#ff3b30",
                      fontSize: "14px",
                    }}
                  >
                    {apiError}
                  </div>
                )}
              </div>
            ) : (
              <>
                {activeTab === "about" && <AboutTab summary={summary} />}
                {activeTab === "overview" && <OverviewTab summary={summary} />}
                {activeTab === "insights" && <InsightsTab summary={summary} />}
              </>
            )}
          </div>

          {/* Footer */}
          {transcript && (
            <div
              style={{
                padding: "20px 40px",
                borderTop: "1px solid #e5e5e7",
                textAlign: "center",
              }}
            >
              <button
                onClick={downloadTranscript}
                style={{
                  padding: "10px 24px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#007aff",
                  background: "transparent",
                  border: "1px solid #007aff",
                  borderRadius: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#007aff";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#007aff";
                }}
              >
                Download Transcript
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// About Tab Component
function AboutTab({ summary }: { summary: SummaryJSON }) {
  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <section style={{ marginBottom: "40px" }}>
        <h3
          style={{
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "#86868b",
            marginBottom: "16px",
            fontWeight: 600,
          }}
        >
          Speaker
        </h3>
        <p
          style={{
            fontSize: "17px",
            color: "#1d1d1f",
            lineHeight: 1.5,
            marginBottom: "16px",
          }}
        >
          {summary.about.speaker.who}
        </p>
        {summary.about.speaker.credibility.length > 0 && (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            {summary.about.speaker.credibility.map((item, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: "15px",
                  color: "#6e6e73",
                  lineHeight: 1.6,
                  marginBottom: "8px",
                  paddingLeft: "16px",
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    color: "#007aff",
                  }}
                >
                  •
                </span>
                {item}
              </li>
            ))}
          </ul>
        )}
        {summary.about.speaker.philosophy && (
          <div
            style={{
              marginTop: "16px",
              padding: "16px",
              background: "#f5f5f7",
              borderRadius: "8px",
              fontSize: "15px",
              color: "#1d1d1f",
              fontStyle: "italic",
            }}
          >
            "{summary.about.speaker.philosophy}"
          </div>
        )}
      </section>

      <section>
        <h3
          style={{
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "#86868b",
            marginBottom: "16px",
            fontWeight: 600,
          }}
        >
          Company
        </h3>
        <div
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: "#1d1d1f",
            marginBottom: "8px",
          }}
        >
          {summary.about.company.name}
        </div>
        {summary.about.company.context && (
          <p
            style={{
              fontSize: "15px",
              color: "#6e6e73",
              lineHeight: 1.6,
            }}
          >
            {summary.about.company.context}
          </p>
        )}
      </section>

      {summary.youtubeVideoId && (
        <section style={{ marginTop: "40px" }}>
          <h3
            style={{
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#86868b",
              marginBottom: "16px",
              fontWeight: 600,
            }}
          >
            Video
          </h3>
          <div
            style={{
              position: "relative",
              paddingBottom: "56.25%",
              height: 0,
              overflow: "hidden",
              borderRadius: "12px",
            }}
          >
            <iframe
              src={`https://www.youtube.com/embed/${summary.youtubeVideoId}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            />
          </div>
        </section>
      )}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ summary }: { summary: SummaryJSON }) {
  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <p
        style={{
          fontSize: "17px",
          color: "#1d1d1f",
          lineHeight: 1.6,
          marginBottom: "32px",
        }}
      >
        {summary.overview.executiveBrief}
      </p>

      <section>
        <h3
          style={{
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "#86868b",
            marginBottom: "16px",
            fontWeight: 600,
          }}
        >
          Core Takeaways
        </h3>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
          }}
        >
          {summary.overview.coreTakeaways.map((item, idx) => (
            <li
              key={idx}
              style={{
                fontSize: "15px",
                color: "#1d1d1f",
                lineHeight: 1.6,
                marginBottom: "12px",
                paddingLeft: "24px",
                position: "relative",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#007aff",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {idx + 1}
              </span>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// Insights Tab Component
function InsightsTab({ summary }: { summary: SummaryJSON }) {
  const tagColors: Record<string, string> = {
    Strategy: "#007aff",
    Execution: "#34c759",
    Growth: "#ff9500",
    Leadership: "#5856d6",
    Career: "#ff2d55",
    GTM: "#af52de",
    AI: "#00c7be",
    Product: "#ff3b30",
    Research: "#5ac8fa",
    Metrics: "#ffcc00",
  };

  return (
    <div>
      {/* Insights List */}
      <section style={{ marginBottom: "48px" }}>
        <h3
          style={{
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "#86868b",
            marginBottom: "20px",
            fontWeight: 600,
          }}
        >
          Key Insights
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {summary.insights.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: "16px",
                background: "#f5f5f7",
                borderRadius: "8px",
                borderLeft: `3px solid ${tagColors[item.tag] || "#86868b"}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: tagColors[item.tag] || "#86868b",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {item.tag}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: "#86868b",
                  }}
                >
                  {item.evidence.time}
                </span>
              </div>
              <div
                style={{
                  fontSize: "15px",
                  color: "#1d1d1f",
                  lineHeight: 1.5,
                  marginBottom: "6px",
                }}
              >
                {item.insight}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#6e6e73",
                  fontStyle: "italic",
                }}
              >
                {item.evidence.cue}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Frameworks */}
      {summary.frameworks.length > 0 && (
        <section>
          <h3
            style={{
              fontSize: "13px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#86868b",
              marginBottom: "20px",
              fontWeight: 600,
            }}
          >
            Frameworks
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {summary.frameworks.map((fw, idx) => (
              <div
                key={idx}
                style={{
                  padding: "24px",
                  background: "#ffffff",
                  border: "1px solid #e5e5e7",
                  borderRadius: "12px",
                }}
              >
                <h4
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "#1d1d1f",
                    marginBottom: "8px",
                  }}
                >
                  {fw.name}
                </h4>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#6e6e73",
                    marginBottom: "20px",
                    fontStyle: "italic",
                  }}
                >
                  {fw.whenToUse}
                </p>

                <div style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#86868b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "12px",
                    }}
                  >
                    Steps
                  </div>
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: "20px",
                    }}
                  >
                    {fw.steps.map((step, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: "15px",
                          color: "#1d1d1f",
                          lineHeight: 1.6,
                          marginBottom: "8px",
                        }}
                      >
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#86868b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "12px",
                    }}
                  >
                    Pitfalls
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: "20px",
                    }}
                  >
                    {fw.pitfalls.map((pitfall, i) => (
                      <li
                        key={i}
                        style={{
                          fontSize: "15px",
                          color: "#ff3b30",
                          lineHeight: 1.6,
                          marginBottom: "6px",
                        }}
                      >
                        {pitfall}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#86868b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "8px",
                    }}
                  >
                    Evidence
                  </div>
                  {fw.evidence.map((ev, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: "13px",
                        color: "#6e6e73",
                        marginBottom: "4px",
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{ev.time}:</span> {ev.cue}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
