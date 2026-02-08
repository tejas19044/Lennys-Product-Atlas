import { useState, useEffect } from "react";
import { EpisodeRow } from "../page";

export default function Drawer({
  episode,
  onClose,
}: {
  episode: EpisodeRow;
  onClose: () => void;
}) {
  const [transcript, setTranscript] = useState<string>("");

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

  return (
    <>
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

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "32px 40px",
              whiteSpace: "pre-wrap",
              fontSize: "15px",
              color: "#1d1d1f",
              lineHeight: 1.6,
            }}
          >
            {transcript}
          </div>

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
