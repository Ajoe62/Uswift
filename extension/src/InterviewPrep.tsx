import React, { useState } from "react";
import { getMistralClient } from "./api/mistral";
import "./index.css";

interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  suggestedAnswer: string;
  keyPoints: string[];
}

interface InterviewPrepResult {
  questions: InterviewQuestion[];
  overallTips: string[];
  companySpecificAdvice: string;
  preparationPlan: string[];
}

export default function InterviewPrep() {
  const [jobDescription, setJobDescription] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<
    "entry" | "mid" | "senior" | "executive"
  >("mid");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<InterviewPrepResult | null>(null);
  const [activeTab, setActiveTab] = useState<"input" | "questions" | "tips">(
    "input"
  );
  const mistralClient = getMistralClient();

  const experienceLevels = [
    {
      value: "entry",
      label: "Entry Level (0-2 years)",
      description: "Junior developer, intern",
    },
    {
      value: "mid",
      label: "Mid Level (2-5 years)",
      description: "Regular developer, team lead",
    },
    {
      value: "senior",
      label: "Senior Level (5-10 years)",
      description: "Senior developer, architect",
    },
    {
      value: "executive",
      label: "Executive Level (10+ years)",
      description: "Engineering manager, CTO",
    },
  ];

  const commonFocusAreas = [
    "Technical Skills",
    "Behavioral Questions",
    "System Design",
    "Leadership Experience",
    "Problem Solving",
    "Communication Skills",
    "Company Culture",
    "Career Goals",
  ];

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      alert("Please enter a job description");
      return;
    }

    setIsLoading(true);
    try {
      const preparationPrompt = `Create a comprehensive interview preparation guide for this position:

**Job Description:**
${jobDescription}

**Experience Level:** ${experienceLevel}
**Focus Areas:** ${
        focusAreas.length > 0 ? focusAreas.join(", ") : "General preparation"
      }

Please provide:

1. **15-20 Interview Questions** organized by category (Technical, Behavioral, Situational)
   - Include question difficulty (Easy/Medium/Hard)
   - Provide suggested answers for each
   - Highlight key points to emphasize

2. **Overall Preparation Tips** (8-10 key tips)

3. **Company-Specific Advice** based on the job description

4. **7-Day Preparation Plan** with daily goals

Format the response clearly with proper sections and structure.`;

      const response = await mistralClient.chatWithPrompt(preparationPrompt, {
        model: "mistral-small",
        max_tokens: 2000,
        temperature: 0.7,
      });

      const parsedResult = parseInterviewPrepResponse(response);
      setResult(parsedResult);
      setActiveTab("questions");
    } catch (error) {
      console.error("Interview prep error:", error);
      alert("Failed to generate interview preparation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const parseInterviewPrepResponse = (
    response: string
  ): InterviewPrepResult => {
    const questions = extractQuestions(response);
    const overallTips = extractTips(response);
    const companySpecificAdvice = extractCompanyAdvice(response);
    const preparationPlan = extractPreparationPlan(response);

    return {
      questions,
      overallTips,
      companySpecificAdvice,
      preparationPlan,
    };
  };

  const extractQuestions = (text: string): InterviewQuestion[] => {
    const questions: InterviewQuestion[] = [];
    const lines = text.split("\n");

    let currentCategory = "";
    let currentDifficulty: "easy" | "medium" | "hard" = "medium";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for category headers
      if (
        line.toLowerCase().includes("technical") &&
        line.includes("Question")
      ) {
        currentCategory = "Technical";
      } else if (
        line.toLowerCase().includes("behavioral") &&
        line.includes("Question")
      ) {
        currentCategory = "Behavioral";
      } else if (
        line.toLowerCase().includes("situational") &&
        line.includes("Question")
      ) {
        currentCategory = "Situational";
      }

      // Check for difficulty indicators
      if (line.toLowerCase().includes("easy")) currentDifficulty = "easy";
      else if (line.toLowerCase().includes("hard")) currentDifficulty = "hard";
      else if (line.toLowerCase().includes("medium"))
        currentDifficulty = "medium";

      // Extract questions (numbered or bulleted)
      if (
        line.match(/^\d+\./) ||
        line.startsWith("•") ||
        line.startsWith("-")
      ) {
        const questionMatch = line.match(/^[\d•\-]+\s*(.+?)(?:\(|$)/);
        if (questionMatch && questionMatch[1].length > 10) {
          const question = questionMatch[1].trim();

          // Get answer from next few lines
          let answer = "";
          let keyPoints: string[] = [];
          let j = i + 1;

          while (j < lines.length && j < i + 10) {
            const nextLine = lines[j].trim();
            if (
              nextLine &&
              !nextLine.match(/^\d+\./) &&
              !nextLine.startsWith("•") &&
              !nextLine.includes("Question")
            ) {
              if (
                nextLine.includes("Answer:") ||
                nextLine.includes("Response:")
              ) {
                answer = nextLine.replace(/^(Answer|Response):\s*/i, "");
              } else if (nextLine.startsWith("-") || nextLine.startsWith("•")) {
                keyPoints.push(nextLine.substring(1).trim());
              } else if (answer) {
                answer += " " + nextLine;
              }
            } else if (nextLine.match(/^\d+\./) || nextLine.startsWith("•")) {
              break;
            }
            j++;
          }

          questions.push({
            id: `q-${questions.length + 1}`,
            question,
            category: currentCategory,
            difficulty: currentDifficulty,
            suggestedAnswer:
              answer ||
              "Practice providing a structured answer that demonstrates your experience and problem-solving approach.",
            keyPoints,
          });
        }
      }
    }

    return questions.slice(0, 15); // Limit to 15 questions
  };

  const extractTips = (text: string): string[] => {
    const tips: string[] = [];
    const tipSection = text.match(
      /(?:tips|advice|recommendations):?\s*(.*?)(?:\n\n|\n[A-Z]|$)/is
    );

    if (tipSection) {
      const tipLines = tipSection[1].split("\n");
      for (const line of tipLines) {
        const trimmed = line.trim();
        if (
          trimmed.startsWith("•") ||
          trimmed.startsWith("-") ||
          trimmed.match(/^\d+\./)
        ) {
          tips.push(trimmed.replace(/^[\d•\-]\s*/, "").trim());
        }
      }
    }

    return tips.slice(0, 10);
  };

  const extractCompanyAdvice = (text: string): string => {
    const adviceSection = text.match(
      /(?:company|organization)(?:\s|-)(?:specific|advice|tips):?\s*(.*?)(?:\n\n|\n[A-Z]|$)/is
    );
    return adviceSection
      ? adviceSection[1].trim()
      : "Research the company culture, values, and recent news. Prepare questions about their challenges and goals.";
  };

  const extractPreparationPlan = (text: string): string[] => {
    const planSection = text.match(
      /(?:plan|schedule|timeline):?\s*(.*?)(?:\n\n|\n[A-Z]|$)/is
    );

    if (planSection) {
      const planLines = planSection[1].split("\n");
      const plan: string[] = [];

      for (const line of planLines) {
        const trimmed = line.trim();
        if (
          trimmed.startsWith("•") ||
          trimmed.startsWith("-") ||
          trimmed.match(/^\d+\./) ||
          trimmed.match(/Day \d+:/)
        ) {
          plan.push(trimmed.replace(/^[\d•\-]\s*/, "").trim());
        }
      }

      return plan.slice(0, 7);
    }

    // Default plan if not found
    return [
      "Day 1: Research company and review job description",
      "Day 2: Practice technical questions and coding problems",
      "Day 3: Prepare behavioral questions and stories",
      "Day 4: Mock interviews with friends or mentors",
      "Day 5: Review resume and prepare questions for interviewer",
      "Day 6: Rest and mental preparation",
      "Day 7: Final review and confidence building",
    ];
  };

  const toggleFocusArea = (area: string) => {
    setFocusAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "#10B981";
      case "medium":
        return "#F59E0B";
      case "hard":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
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
          Interview Preparation
        </h2>
        {activeTab !== "input" && (
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
          onClick={() => setActiveTab("questions")}
          disabled={!result}
          style={{
            background: "none",
            border: "none",
            padding: "12px 16px",
            cursor: result ? "pointer" : "not-allowed",
            fontSize: "0.9rem",
            fontWeight: activeTab === "questions" ? 600 : 400,
            color: activeTab === "questions" ? "#6D28D9" : "#6B7280",
            borderBottom:
              activeTab === "questions" ? "2px solid #6D28D9" : "none",
            opacity: result ? 1 : 0.5,
          }}
        >
          Questions
        </button>
        <button
          onClick={() => setActiveTab("tips")}
          disabled={!result}
          style={{
            background: "none",
            border: "none",
            padding: "12px 16px",
            cursor: result ? "pointer" : "not-allowed",
            fontSize: "0.9rem",
            fontWeight: activeTab === "tips" ? 600 : 400,
            color: activeTab === "tips" ? "#6D28D9" : "#6B7280",
            borderBottom: activeTab === "tips" ? "2px solid #6D28D9" : "none",
            opacity: result ? 1 : 0.5,
          }}
        >
          Tips & Plan
        </button>
      </div>

      {activeTab === "input" && (
        <div>
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
              placeholder="Paste the job description to generate relevant interview questions..."
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

          {/* Experience Level */}
          <div className="uswift-card" style={{ marginBottom: 16 }}>
            <label
              style={{
                fontWeight: 600,
                display: "block",
                marginBottom: 8,
                color: "#374151",
              }}
            >
              Your Experience Level:
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {experienceLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setExperienceLevel(level.value as any)}
                  style={{
                    background:
                      experienceLevel === level.value ? "#6D28D9" : "#F3F4F6",
                    color:
                      experienceLevel === level.value ? "#FFFFFF" : "#6B7280",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    minWidth: 120,
                    textAlign: "left",
                  }}
                  title={level.description}
                >
                  <div style={{ fontWeight: 600 }}>{level.label}</div>
                  <div style={{ fontSize: "0.7rem", opacity: 0.8 }}>
                    {level.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Focus Areas */}
          <div className="uswift-card" style={{ marginBottom: 16 }}>
            <label
              style={{
                fontWeight: 600,
                display: "block",
                marginBottom: 8,
                color: "#374151",
              }}
            >
              Focus Areas (Optional):
            </label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {commonFocusAreas.map((area) => (
                <button
                  key={area}
                  onClick={() => toggleFocusArea(area)}
                  style={{
                    background: focusAreas.includes(area)
                      ? "#6D28D9"
                      : "#F3F4F6",
                    color: focusAreas.includes(area) ? "#FFFFFF" : "#6B7280",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                  }}
                >
                  {focusAreas.includes(area) ? "✓" : "+"} {area}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
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
                Generating Interview Prep...
              </div>
            ) : (
              "Generate Interview Preparation"
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
            <strong>Interview Preparation Tips:</strong>
            <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
              <li>
                Use the STAR method (Situation, Task, Action, Result) for
                behavioral questions
              </li>
              <li>Practice coding problems on platforms like LeetCode</li>
              <li>Research the company and prepare thoughtful questions</li>
              <li>Review your resume and be ready to discuss any experience</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === "questions" && result && (
        <div>
          {/* Questions List */}
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {result.questions.map((question) => (
              <div
                key={question.id}
                className="uswift-card"
                style={{ marginBottom: 12 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <h4
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "#111827",
                      margin: 0,
                      flex: 1,
                      marginRight: 12,
                    }}
                  >
                    {question.question}
                  </h4>
                  <div
                    style={{ display: "flex", gap: 4, alignItems: "center" }}
                  >
                    <span
                      style={{
                        background: "#EDE9FE",
                        color: "#6D28D9",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: "0.7rem",
                        fontWeight: 500,
                      }}
                    >
                      {question.category}
                    </span>
                    <span
                      style={{
                        background: getDifficultyColor(question.difficulty),
                        color: "#FFFFFF",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontSize: "0.7rem",
                        fontWeight: 500,
                      }}
                    >
                      {getDifficultyLabel(question.difficulty)}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "#4B5563",
                    lineHeight: 1.5,
                    marginBottom: 8,
                  }}
                >
                  <strong>Suggested Answer:</strong> {question.suggestedAnswer}
                </div>

                {question.keyPoints.length > 0 && (
                  <div>
                    <strong style={{ fontSize: "0.8rem", color: "#374151" }}>
                      Key Points:
                    </strong>
                    <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                      {question.keyPoints.map((point, index) => (
                        <li
                          key={index}
                          style={{
                            fontSize: "0.8rem",
                            color: "#6B7280",
                            marginBottom: 4,
                          }}
                        >
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "tips" && result && (
        <div>
          {/* Preparation Tips */}
          <div className="uswift-card" style={{ marginBottom: 16 }}>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#111827",
                marginBottom: 12,
              }}
            >
              💡 Overall Preparation Tips
            </h3>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {result.overallTips.map((tip, index) => (
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

          {/* Company-Specific Advice */}
          <div className="uswift-card" style={{ marginBottom: 16 }}>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#111827",
                marginBottom: 12,
              }}
            >
              🏢 Company-Specific Advice
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                lineHeight: 1.6,
                color: "#4B5563",
                margin: 0,
              }}
            >
              {result.companySpecificAdvice}
            </p>
          </div>

          {/* Preparation Plan */}
          <div className="uswift-card" style={{ marginBottom: 16 }}>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#111827",
                marginBottom: 12,
              }}
            >
              📅 7-Day Preparation Plan
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {result.preparationPlan.map((day, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: 8,
                    background: "#F8F9FA",
                    borderRadius: 6,
                  }}
                >
                  <span
                    style={{
                      background: "#6D28D9",
                      color: "#FFFFFF",
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    {index + 1}
                  </span>
                  <span
                    style={{
                      fontSize: "0.9rem",
                      color: "#4B5563",
                      flex: 1,
                    }}
                  >
                    {day}
                  </span>
                </div>
              ))}
            </div>
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
        Powered by Mistral AI • Comprehensive interview preparation and practice
        questions
      </div>
    </div>
  );
}
