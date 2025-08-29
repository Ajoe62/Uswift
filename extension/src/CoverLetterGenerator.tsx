import React, { useState } from "react";
import { getMistralClient } from "./api/mistral";
import "./index.css";

interface CoverLetterResult {
  content: string;
  keyPoints: string[];
  tone: string;
  wordCount: number;
}

export default function CoverLetterGenerator() {
  const [resumeContent, setResumeContent] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [tone, setTone] = useState<
    "professional" | "enthusiastic" | "confident"
  >("professional");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CoverLetterResult | null>(null);
  const [activeTab, setActiveTab] = useState<"input" | "result">("input");
  const mistralClient = getMistralClient();

  const toneOptions = [
    {
      value: "professional",
      label: "Professional",
      description: "Formal and polished tone",
    },
    {
      value: "enthusiastic",
      label: "Enthusiastic",
      description: "Energetic and passionate",
    },
    {
      value: "confident",
      label: "Confident",
      description: "Strong and self-assured",
    },
  ];

  const handleGenerate = async () => {
    if (!resumeContent.trim() || !jobDescription.trim()) {
      alert("Please fill in both resume and job description");
      return;
    }

    setIsLoading(true);
    try {
      const response = await mistralClient.generateCoverLetter(
        resumeContent,
        jobDescription,
        companyName || undefined
      );

      // Parse the AI response
      const parsedResult = parseCoverLetterResponse(response, tone);
      setResult(parsedResult);
      setActiveTab("result");
    } catch (error) {
      console.error("Cover letter generation error:", error);
      alert("Failed to generate cover letter. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const parseCoverLetterResponse = (
    response: string,
    selectedTone: string
  ): CoverLetterResult => {
    // Extract key points from the response
    const keyPoints = extractKeyPoints(response);

    // Count words
    const wordCount = response.split(/\s+/).length;

    return {
      content: response,
      keyPoints,
      tone: selectedTone,
      wordCount,
    };
  };

  const extractKeyPoints = (text: string): string[] => {
    const lines = text.split("\n");
    const keyPoints: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.startsWith("•") ||
        trimmed.startsWith("-") ||
        trimmed.startsWith("*")
      ) {
        keyPoints.push(trimmed.substring(1).trim());
      } else if (trimmed.match(/^\d+\./)) {
        keyPoints.push(trimmed.replace(/^\d+\.\s*/, ""));
      }
    }

    // If no bullet points found, extract first few sentences as key points
    if (keyPoints.length === 0) {
      const sentences = text
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 20);
      return sentences.slice(0, 5).map((s) => s.trim());
    }

    return keyPoints.slice(0, 6); // Limit to top 6 points
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Cover letter copied to clipboard!");
      })
      .catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("Cover letter copied to clipboard!");
      });
  };

  const downloadAsText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          Cover Letter Generator
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
          Generated Letter
        </button>
      </div>

      {activeTab === "input" && (
        <div>
          {/* Basic Info */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 4,
                }}
              >
                Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #E5E7EB",
                  fontSize: "0.9rem",
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 4,
                }}
              >
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Google"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "1px solid #E5E7EB",
                  fontSize: "0.9rem",
                }}
              />
            </div>
          </div>

          {/* Tone Selection */}
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
              Cover Letter Tone:
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {toneOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTone(option.value as any)}
                  style={{
                    background: tone === option.value ? "#6D28D9" : "#F3F4F6",
                    color: tone === option.value ? "#FFFFFF" : "#6B7280",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    minWidth: 120,
                    textAlign: "left",
                  }}
                  title={option.description}
                >
                  <div style={{ fontWeight: 600 }}>{option.label}</div>
                  <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Resume Content */}
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
              placeholder="Paste your resume content here to help tailor the cover letter..."
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

          {/* Job Description */}
          <div className="uswift-card" style={{ marginBottom: 16 }}>
            <label
              style={{
                fontWeight: 600,
                display: "block",
                marginBottom: 8,
                color: "#374151",
              }}
            >
              Job Description:
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the complete job description here..."
              rows={8}
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

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={
              isLoading || !resumeContent.trim() || !jobDescription.trim()
            }
            className="uswift-btn"
            style={{
              width: "100%",
              opacity:
                isLoading || !resumeContent.trim() || !jobDescription.trim()
                  ? 0.6
                  : 1,
              cursor:
                isLoading || !resumeContent.trim() || !jobDescription.trim()
                  ? "not-allowed"
                  : "pointer",
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
                Generating Cover Letter...
              </div>
            ) : (
              "Generate Cover Letter"
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
            <strong>Tips for Better Results:</strong>
            <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
              <li>
                Include specific achievements and metrics from your resume
              </li>
              <li>Highlight relevant skills that match the job requirements</li>
              <li>
                Keep the job description comprehensive for better tailoring
              </li>
              <li>Choose a tone that matches the company culture</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === "result" && result && (
        <div>
          {/* Cover Letter Stats */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginBottom: 20,
              padding: 16,
              background: "#F8F9FA",
              borderRadius: 8,
            }}
          >
            <div style={{ textAlign: "center", flex: 1 }}>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#6D28D9",
                  marginBottom: 4,
                }}
              >
                {result.wordCount}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#6B7280",
                  fontWeight: 500,
                }}
              >
                Words
              </div>
            </div>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "#10B981",
                  marginBottom: 4,
                }}
              >
                {result.tone}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#6B7280",
                  fontWeight: 500,
                }}
              >
                Tone
              </div>
            </div>
          </div>

          {/* Key Points */}
          {result.keyPoints.length > 0 && (
            <div className="uswift-card" style={{ marginBottom: 16 }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: 12,
                }}
              >
                Key Highlights
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {result.keyPoints.map((point, index) => (
                  <li
                    key={index}
                    style={{
                      fontSize: "0.9rem",
                      color: "#4B5563",
                      marginBottom: 8,
                    }}
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Generated Cover Letter */}
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
                Your Cover Letter
              </h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => copyToClipboard(result.content)}
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
                <button
                  onClick={() =>
                    downloadAsText(result.content, "cover-letter.txt")
                  }
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
                  Download
                </button>
              </div>
            </div>
            <div
              style={{
                background: "#F8F9FA",
                padding: 16,
                borderRadius: 8,
                fontSize: "0.9rem",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                maxHeight: 400,
                overflowY: "auto",
                border: "1px solid #E5E7EB",
              }}
            >
              {result.content}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => copyToClipboard(result.content)}
              className="uswift-btn"
              style={{ flex: 1 }}
            >
              Copy to Clipboard
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
              Generate Another
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
        Powered by Mistral AI • Create professional cover letters tailored to
        each job
      </div>
    </div>
  );
}
