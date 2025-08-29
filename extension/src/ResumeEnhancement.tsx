import React, { useState } from "react";
import { getMistralClient } from "./api/mistral";
import "./index.css";

interface EnhancementResult {
  suggestions: string;
  enhancedResume: string;
  score: number;
  improvements: string[];
}

export default function ResumeEnhancement() {
  const [resumeContent, setResumeContent] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EnhancementResult | null>(null);
  const [activeTab, setActiveTab] = useState<"input" | "result">("input");
  const [enhancementType, setEnhancementType] = useState<
    "general" | "job-specific"
  >("general");
  const mistralClient = getMistralClient();

  const handleEnhance = async () => {
    if (!resumeContent.trim()) {
      alert("Please enter your resume content");
      return;
    }

    setIsLoading(true);
    try {
      const response = await mistralClient.enhanceResume(
        resumeContent,
        enhancementType === "job-specific" ? jobDescription : undefined
      );

      // Parse the AI response to extract structured data
      const parsedResult = parseEnhancementResponse(response);
      setResult(parsedResult);
      setActiveTab("result");
    } catch (error) {
      console.error("Resume enhancement error:", error);
      alert("Failed to enhance resume. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const parseEnhancementResponse = (response: string): EnhancementResult => {
    // This is a simple parser - in production, you might want more sophisticated parsing
    const suggestions =
      extractSection(response, "Suggestions", "Enhanced Resume") ||
      extractSection(response, "Key improvements", "Enhanced") ||
      "General suggestions for resume improvement";

    const enhancedResume =
      extractSection(response, "Enhanced Resume", "Score") ||
      extractSection(response, "Enhanced version", "") ||
      response;

    const score = extractScore(response);

    const improvements = extractImprovements(response);

    return {
      suggestions,
      enhancedResume,
      score,
      improvements,
    };
  };

  const extractSection = (
    text: string,
    startMarker: string,
    endMarker: string
  ): string => {
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) return "";

    const contentStart = startIndex + startMarker.length;
    const endIndex = endMarker
      ? text.indexOf(endMarker, contentStart)
      : text.length;

    return text.substring(contentStart, endIndex).trim();
  };

  const extractScore = (text: string): number => {
    const scoreMatch = text.match(/(\d+)\/100|score[:\s]+(\d+)|(\d+)%/i);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3]);
      return Math.min(100, Math.max(0, score));
    }
    return 75; // Default score
  };

  const extractImprovements = (text: string): string[] => {
    const lines = text.split("\n");
    const improvements: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.startsWith("•") ||
        trimmed.startsWith("-") ||
        trimmed.startsWith("*")
      ) {
        improvements.push(trimmed.substring(1).trim());
      } else if (trimmed.match(/^\d+\./)) {
        improvements.push(trimmed.replace(/^\d+\.\s*/, ""));
      }
    }

    return improvements.slice(0, 5); // Limit to top 5 improvements
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10B981"; // Green
    if (score >= 60) return "#F59E0B"; // Yellow
    return "#EF4444"; // Red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Copied to clipboard!");
      })
      .catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("Copied to clipboard!");
      });
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "1.5rem",
        padding: "2rem",
        minWidth: 350,
        minHeight: 520,
      }}
    >
      {/* Header */}
      <div
        className="uswift-gradient"
        style={{
          height: 8,
          borderRadius: 8,
          marginBottom: 16,
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2
          style={{
            fontSize: "1.4rem",
            fontWeight: 700,
            color: "#111827",
            margin: 0,
          }}
        >
          Resume Enhancement
        </h2>
        {activeTab === "result" && (
          <button
            onClick={() => setActiveTab("input")}
            style={{
              background: "#EDE9FE",
              color: "#6D28D9",
              border: "none",
              borderRadius: 8,
              padding: "6px 12px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            ← Back to Edit
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          marginBottom: 16,
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <button
          onClick={() => setActiveTab("input")}
          style={{
            background: "none",
            border: "none",
            padding: "12px 16px",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: activeTab === "input" ? 600 : 400,
            color: activeTab === "input" ? "#6D28D9" : "#6B7280",
            borderBottom: activeTab === "input" ? "2px solid #6D28D9" : "none",
          }}
        >
          Input
        </button>
        <button
          onClick={() => setActiveTab("result")}
          disabled={!result}
          style={{
            background: "none",
            border: "none",
            padding: "12px 16px",
            cursor: result ? "pointer" : "not-allowed",
            fontSize: "0.9rem",
            fontWeight: activeTab === "result" ? 600 : 400,
            color: activeTab === "result" ? "#6D28D9" : "#6B7280",
            borderBottom: activeTab === "result" ? "2px solid #6D28D9" : "none",
            opacity: result ? 1 : 0.5,
          }}
        >
          Enhanced Resume
        </button>
      </div>

      {activeTab === "input" && (
        <div>
          {/* Enhancement Type Selection */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "#374151",
                marginBottom: 8,
              }}
            >
              Enhancement Type:
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setEnhancementType("general")}
                style={{
                  background:
                    enhancementType === "general" ? "#6D28D9" : "#F3F4F6",
                  color: enhancementType === "general" ? "#FFFFFF" : "#6B7280",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                }}
              >
                General Enhancement
              </button>
              <button
                onClick={() => setEnhancementType("job-specific")}
                style={{
                  background:
                    enhancementType === "job-specific" ? "#6D28D9" : "#F3F4F6",
                  color:
                    enhancementType === "job-specific" ? "#FFFFFF" : "#6B7280",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 16px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                }}
              >
                Job-Specific Tailoring
              </button>
            </div>
          </div>

          {/* Resume Input */}
          <div className="uswift-card" style={{ marginBottom: 16 }}>
            <label
              style={{
                fontWeight: 600,
                display: "block",
                marginBottom: 8,
                color: "#374151",
              }}
            >
              Your Resume Content:
            </label>
            <textarea
              value={resumeContent}
              onChange={(e) => setResumeContent(e.target.value)}
              placeholder="Paste your current resume content here..."
              rows={8}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                fontSize: "0.9rem",
                resize: "vertical",
                fontFamily: "monospace",
              }}
            />
          </div>

          {/* Job Description Input (only for job-specific) */}
          {enhancementType === "job-specific" && (
            <div className="uswift-card" style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 8,
                  color: "#374151",
                }}
              >
                Job Description (Optional):
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description to tailor your resume specifically for this role..."
                rows={6}
                style={{
                  width: "100%",
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  fontSize: "0.9rem",
                  resize: "vertical",
                }}
              />
            </div>
          )}

          {/* Enhance Button */}
          <button
            onClick={handleEnhance}
            disabled={isLoading || !resumeContent.trim()}
            className="uswift-btn"
            style={{
              width: "100%",
              opacity: isLoading || !resumeContent.trim() ? 0.6 : 1,
              cursor:
                isLoading || !resumeContent.trim() ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid #ffffff",
                    borderTop: "2px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
                Enhancing Resume...
              </div>
            ) : (
              "Enhance My Resume"
            )}
          </button>

          {/* Tips */}
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: "#F8F9FA",
              borderRadius: 8,
              fontSize: "0.8rem",
              color: "#6B7280",
            }}
          >
            <strong>Tips:</strong>
            <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
              <li>Include your full work history and key achievements</li>
              <li>Use quantifiable metrics where possible</li>
              <li>Keep it concise but comprehensive</li>
              <li>
                For job-specific enhancement, include relevant keywords from the
                job posting
              </li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === "result" && result && (
        <div>
          {/* Score Display */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 20,
              padding: 16,
              background: "#F8F9FA",
              borderRadius: 8,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color: getScoreColor(result.score),
                  marginBottom: 4,
                }}
              >
                {result.score}/100
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#6B7280",
                  fontWeight: 500,
                }}
              >
                {getScoreLabel(result.score)}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "1rem",
                  color: "#111827",
                }}
              >
                Resume Quality Score
              </h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#6B7280" }}>
                Based on content relevance, formatting, and impact statements
              </p>
            </div>
          </div>

          {/* Suggestions */}
          <div className="uswift-card" style={{ marginBottom: 16 }}>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#111827",
                marginBottom: 12,
              }}
            >
              Key Suggestions
            </h3>
            <div
              style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "#4B5563" }}
            >
              {result.suggestions}
            </div>
          </div>

          {/* Top Improvements */}
          {result.improvements.length > 0 && (
            <div className="uswift-card" style={{ marginBottom: 16 }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: 12,
                }}
              >
                Top Improvements Made
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {result.improvements.map((improvement, index) => (
                  <li
                    key={index}
                    style={{
                      fontSize: "0.9rem",
                      color: "#4B5563",
                      marginBottom: 8,
                    }}
                  >
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Enhanced Resume */}
          <div className="uswift-card" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#111827",
                  margin: 0,
                }}
              >
                Enhanced Resume
              </h3>
              <button
                onClick={() => copyToClipboard(result.enhancedResume)}
                style={{
                  background: "#EDE9FE",
                  color: "#6D28D9",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 12px",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Copy
              </button>
            </div>
            <div
              style={{
                background: "#F8F9FA",
                padding: 16,
                borderRadius: 8,
                fontSize: "0.85rem",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                maxHeight: 300,
                overflowY: "auto",
                border: "1px solid #E5E7EB",
              }}
            >
              {result.enhancedResume}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => copyToClipboard(result.enhancedResume)}
              className="uswift-btn"
              style={{ flex: 1 }}
            >
              Copy Enhanced Resume
            </button>
            <button
              onClick={() => setActiveTab("input")}
              style={{
                flex: 1,
                background: "#F3F4F6",
                color: "#6B7280",
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                padding: "12px",
                cursor: "pointer",
              }}
            >
              Make Another Edit
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: 16,
          textAlign: "center",
          fontSize: "0.8rem",
          color: "#6B7280",
        }}
      >
        Powered by Mistral AI • Get professional resume enhancement suggestions
      </div>
    </div>
  );
}
