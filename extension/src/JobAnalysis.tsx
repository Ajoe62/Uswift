import React, { useState } from "react";
import { getMistralClient } from "./api/mistral";
import "./index.css";

interface JobAnalysisResult {
  overallMatch: number;
  keyRequirements: string[];
  missingSkills: string[];
  matchingSkills: string[];
  recommendations: string[];
  salaryInsights: string;
  companyCulture: string;
  applicationTips: string[];
}

interface JobDetails {
  title: string;
  company: string;
  location: string;
  salary?: string;
  type: string;
}

export default function JobAnalysis() {
  const [jobDescription, setJobDescription] = useState("");
  const [userProfile, setUserProfile] = useState("");
  const [jobDetails, setJobDetails] = useState<JobDetails>({
    title: "",
    company: "",
    location: "",
    salary: "",
    type: "full-time",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<JobAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<"input" | "analysis">("input");
  const mistralClient = getMistralClient();

  const jobTypes = [
    "full-time",
    "part-time",
    "contract",
    "freelance",
    "internship",
    "remote",
  ];

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      alert("Please enter a job description");
      return;
    }

    setIsLoading(true);
    try {
      const analysisPrompt = `Please analyze this job posting and provide a comprehensive assessment:

**Job Details:**
- Title: ${jobDetails.title || "Not specified"}
- Company: ${jobDetails.company || "Not specified"}
- Location: ${jobDetails.location || "Not specified"}
- Salary: ${jobDetails.salary || "Not specified"}
- Type: ${jobDetails.type}

**Job Description:**
${jobDescription}

${
  userProfile
    ? `**User Profile/Skills:**
${userProfile}

`
    : ""
}Please provide a detailed analysis including:

1. **Overall Match Score (0-100)**: How well does this job match typical requirements
2. **Key Requirements**: List the most important skills, experience, and qualifications
3. **Missing Skills**: Skills that would be beneficial but aren't strictly required
4. **Matching Skills**: Skills that align well with the job requirements
5. **Recommendations**: Specific advice for applying to this role
6. **Salary Insights**: Analysis of compensation expectations
7. **Company Culture Indicators**: What the job posting reveals about company culture
8. **Application Tips**: Specific strategies for success

Format your response clearly with sections and bullet points.`;

      const response = await mistralClient.chatWithPrompt(analysisPrompt, {
        model: "mistral-small",
        max_tokens: 1500,
        temperature: 0.7,
      });

      const parsedResult = parseAnalysisResponse(response);
      setResult(parsedResult);
      setActiveTab("analysis");
    } catch (error) {
      console.error("Job analysis error:", error);
      alert("Failed to analyze job. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const parseAnalysisResponse = (response: string): JobAnalysisResult => {
    // Extract overall match score
    const scoreMatch = response.match(/(\d+)\/100|score[:\s]+(\d+)|(\d+)%/i);
    const overallMatch = scoreMatch
      ? parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3])
      : 75;

    return {
      overallMatch,
      keyRequirements: extractSectionItems(
        response,
        "Key Requirements",
        "Missing Skills"
      ),
      missingSkills: extractSectionItems(
        response,
        "Missing Skills",
        "Matching Skills"
      ),
      matchingSkills: extractSectionItems(
        response,
        "Matching Skills",
        "Recommendations"
      ),
      recommendations: extractSectionItems(
        response,
        "Recommendations",
        "Salary Insights"
      ),
      salaryInsights: extractSectionText(
        response,
        "Salary Insights",
        "Company Culture"
      ),
      companyCulture: extractSectionText(
        response,
        "Company Culture",
        "Application Tips"
      ),
      applicationTips: extractSectionItems(response, "Application Tips", ""),
    };
  };

  const extractSectionItems = (
    text: string,
    startMarker: string,
    endMarker: string
  ): string[] => {
    const items: string[] = [];
    const startIndex = text.indexOf(startMarker);

    if (startIndex === -1) return items;

    const contentStart = startIndex + startMarker.length;
    const endIndex = endMarker
      ? text.indexOf(endMarker, contentStart)
      : text.length;
    const sectionContent = text.substring(contentStart, endIndex);

    const lines = sectionContent.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.startsWith("•") ||
        trimmed.startsWith("-") ||
        trimmed.startsWith("*") ||
        trimmed.match(/^\d+\./)
      ) {
        items.push(trimmed.replace(/^[\d•\-*]\s*/, "").trim());
      }
    }

    return items.slice(0, 8); // Limit to top 8 items
  };

  const extractSectionText = (
    text: string,
    startMarker: string,
    endMarker: string
  ): string => {
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) return "No specific insights available";

    const contentStart = startIndex + startMarker.length;
    const endIndex = endMarker
      ? text.indexOf(endMarker, contentStart)
      : text.length;
    const sectionContent = text.substring(contentStart, endIndex).trim();

    // Clean up the content
    return sectionContent
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .join(" ")
      .trim();
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return "#10B981"; // Green - Great match
    if (score >= 60) return "#F59E0B"; // Yellow - Good match
    return "#EF4444"; // Red - Poor match
  };

  const getMatchLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    return "Needs Improvement";
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert("Analysis copied to clipboard!");
      })
      .catch(() => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("Analysis copied to clipboard!");
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
          Job Analysis
        </h2>
        {activeTab === "analysis" && (
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
            ← Back to Input
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
          onClick={() => setActiveTab("analysis")}
          disabled={!result}
          style={{
            background: "none",
            border: "none",
            padding: "12px 16px",
            cursor: result ? "pointer" : "not-allowed",
            fontSize: "0.9rem",
            fontWeight: activeTab === "analysis" ? 600 : 400,
            color: activeTab === "analysis" ? "#6D28D9" : "#6B7280",
            borderBottom:
              activeTab === "analysis" ? "2px solid #6D28D9" : "none",
            opacity: result ? 1 : 0.5,
          }}
        >
          Analysis
        </button>
      </div>

      {activeTab === "input" && (
        <div>
          {/* Job Details */}
          <div className="uswift-card" style={{ marginBottom: 16 }}>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#111827",
                marginBottom: 12,
              }}
            >
              Job Details
            </h3>

            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
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
                  value={jobDetails.title}
                  onChange={(e) =>
                    setJobDetails({ ...jobDetails, title: e.target.value })
                  }
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
                  Company
                </label>
                <input
                  type="text"
                  value={jobDetails.company}
                  onChange={(e) =>
                    setJobDetails({ ...jobDetails, company: e.target.value })
                  }
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

            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
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
                  Location
                </label>
                <input
                  type="text"
                  value={jobDetails.location}
                  onChange={(e) =>
                    setJobDetails({ ...jobDetails, location: e.target.value })
                  }
                  placeholder="e.g., San Francisco, CA"
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
                  Job Type
                </label>
                <select
                  value={jobDetails.type}
                  onChange={(e) =>
                    setJobDetails({ ...jobDetails, type: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #E5E7EB",
                    fontSize: "0.9rem",
                    background: "#FFFFFF",
                  }}
                >
                  {jobTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: "#374151",
                  marginBottom: 4,
                }}
              >
                Salary Range (Optional)
              </label>
              <input
                type="text"
                value={jobDetails.salary}
                onChange={(e) =>
                  setJobDetails({ ...jobDetails, salary: e.target.value })
                }
                placeholder="e.g., $120K - $150K"
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

          {/* User Profile (Optional) */}
          <div className="uswift-card" style={{ marginBottom: 16 }}>
            <label
              style={{
                fontWeight: 600,
                display: "block",
                marginBottom: 8,
                color: "#374151",
              }}
            >
              Your Profile/Skills (Optional):
            </label>
            <textarea
              value={userProfile}
              onChange={(e) => setUserProfile(e.target.value)}
              placeholder="Describe your skills, experience, and qualifications to get personalized analysis..."
              rows={4}
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

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !jobDescription.trim()}
            className="uswift-btn"
            style={{
              width: "100%",
              opacity: isLoading || !jobDescription.trim() ? 0.6 : 1,
              cursor:
                isLoading || !jobDescription.trim() ? "not-allowed" : "pointer",
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
                Analyzing Job...
              </div>
            ) : (
              "Analyze Job"
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
            <strong>Pro Tips:</strong>
            <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
              <li>
                Include your skills section for personalized matching analysis
              </li>
              <li>
                The more detailed the job description, the better the analysis
              </li>
              <li>
                Look for key requirements, responsibilities, and qualifications
              </li>
              <li>Consider both technical skills and soft skills mentioned</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === "analysis" && result && (
        <div>
          {/* Match Score */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginBottom: 20,
              padding: 20,
              background: "#F8F9FA",
              borderRadius: 8,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 700,
                  color: getMatchColor(result.overallMatch),
                  marginBottom: 8,
                }}
              >
                {result.overallMatch}/100
              </div>
              <div
                style={{
                  fontSize: "1rem",
                  color: "#6B7280",
                  fontWeight: 600,
                }}
              >
                {getMatchLabel(result.overallMatch)}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "1.2rem",
                  color: "#111827",
                }}
              >
                Job Match Analysis
              </h3>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#6B7280" }}>
                Based on requirements analysis and market standards
              </p>
            </div>
          </div>

          {/* Key Requirements */}
          <div className="uswift-card" style={{ marginBottom: 16 }}>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#111827",
                marginBottom: 12,
              }}
            >
              Key Requirements
            </h3>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {result.keyRequirements.map((req, index) => (
                <span
                  key={index}
                  style={{
                    background: "#DBEAFE",
                    color: "#1E40AF",
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    display: "inline-block",
                    marginBottom: 4,
                  }}
                >
                  {req}
                </span>
              ))}
            </div>
          </div>

          {/* Skills Analysis */}
          {result.matchingSkills.length > 0 && (
            <div className="uswift-card" style={{ marginBottom: 16 }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: 12,
                }}
              >
                Matching Skills
              </h3>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {result.matchingSkills.map((skill, index) => (
                  <span
                    key={index}
                    style={{
                      background: "#D1FAE5",
                      color: "#065F46",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: "0.8rem",
                      fontWeight: 500,
                    }}
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.missingSkills.length > 0 && (
            <div className="uswift-card" style={{ marginBottom: 16 }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: 12,
                }}
              >
                Beneficial Skills (Not Required)
              </h3>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {result.missingSkills.map((skill, index) => (
                  <span
                    key={index}
                    style={{
                      background: "#FEF3C7",
                      color: "#92400E",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: "0.8rem",
                      fontWeight: 500,
                    }}
                  >
                    + {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Salary Insights */}
          <div className="uswift-card" style={{ marginBottom: 16 }}>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#111827",
                marginBottom: 12,
              }}
            >
              💰 Salary Insights
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                lineHeight: 1.6,
                color: "#4B5563",
                margin: 0,
              }}
            >
              {result.salaryInsights}
            </p>
          </div>

          {/* Company Culture */}
          <div className="uswift-card" style={{ marginBottom: 16 }}>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#111827",
                marginBottom: 12,
              }}
            >
              🏢 Company Culture Indicators
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                lineHeight: 1.6,
                color: "#4B5563",
                margin: 0,
              }}
            >
              {result.companyCulture}
            </p>
          </div>

          {/* Application Tips */}
          <div className="uswift-card" style={{ marginBottom: 16 }}>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#111827",
                marginBottom: 12,
              }}
            >
              🎯 Application Tips
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {result.applicationTips.map((tip, index) => (
                <li
                  key={index}
                  style={{
                    fontSize: "0.9rem",
                    color: "#4B5563",
                    marginBottom: 8,
                  }}
                >
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="uswift-card" style={{ marginBottom: 16 }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: 12,
                }}
              >
                💡 Recommendations
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {result.recommendations.map((rec, index) => (
                  <li
                    key={index}
                    style={{
                      fontSize: "0.9rem",
                      color: "#4B5563",
                      marginBottom: 8,
                    }}
                  >
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() =>
                copyToClipboard(`
Job Analysis Report
==================

Overall Match: ${result.overallMatch}/100

Key Requirements:
${result.keyRequirements.map((req) => `• ${req}`).join("\n")}

${
  result.matchingSkills.length > 0
    ? `Matching Skills:
${result.matchingSkills.map((skill) => `✓ ${skill}`).join("\n")}

`
    : ""
}${
                  result.missingSkills.length > 0
                    ? `Beneficial Skills:
${result.missingSkills.map((skill) => `+ ${skill}`).join("\n")}

`
                    : ""
                }Salary Insights:
${result.salaryInsights}

Company Culture:
${result.companyCulture}

Application Tips:
${result.applicationTips.map((tip) => `• ${tip}`).join("\n")}

Recommendations:
${result.recommendations.map((rec) => `• ${rec}`).join("\n")}
              `)
              }
              className="uswift-btn"
              style={{ flex: 1 }}
            >
              Copy Full Report
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
              Analyze Another Job
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
        Powered by Mistral AI • Smart job analysis and career insights
      </div>
    </div>
  );
}
