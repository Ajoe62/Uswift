import React, { useState, useEffect } from "react";
import { getMistralClient } from "./api/mistral";
import "./index.css";

interface FileItem {
  id: string;
  name: string;
  type: "resume" | "cover_letter" | "portfolio" | "certificate" | "other";
  content: string;
  size: number;
  uploadedAt: Date;
  url?: string;
}

interface FileAnalysis {
  summary: string;
  keywords: string[];
  suggestions: string[];
  score: number;
}

export default function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [analysis, setAnalysis] = useState<FileAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "manage" | "analyze">(
    "upload"
  );
  const [fileType, setFileType] = useState<FileItem["type"]>("resume");
  const [dragActive, setDragActive] = useState(false);
  const mistralClient = getMistralClient();

  // Load files from Chrome storage on mount
  useEffect(() => {
    loadFilesFromStorage();
  }, []);

  const loadFilesFromStorage = async () => {
    try {
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.local
      ) {
        chrome.storage.local.get(["uploadedFiles"], (result: any) => {
          if (result.uploadedFiles) {
            const parsedFiles = result.uploadedFiles.map((file: any) => ({
              ...file,
              uploadedAt: new Date(file.uploadedAt),
            }));
            setFiles(parsedFiles);
          }
        });
      }
    } catch (error) {
      console.error("Error loading files:", error);
    }
  };

  const saveFilesToStorage = async (filesToSave: FileItem[]) => {
    try {
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.local
      ) {
        await chrome.storage.local.set({ uploadedFiles: filesToSave });
      }
    } catch (error) {
      console.error("Error saving files:", error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsLoading(true);
    try {
      const content = await readFileContent(file);
      const newFile: FileItem = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: fileType,
        content,
        size: file.size,
        uploadedAt: new Date(),
      };

      const updatedFiles = [...files, newFile];
      setFiles(updatedFiles);
      await saveFilesToStorage(updatedFiles);

      alert(`File "${file.name}" uploaded successfully!`);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      await handleFileUpload(droppedFiles[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      await handleFileUpload(selectedFiles[0]);
    }
  };

  const analyzeFile = async (file: FileItem) => {
    setIsLoading(true);
    try {
      let analysisPrompt = "";

      switch (file.type) {
        case "resume":
          analysisPrompt = `Analyze this resume and provide:
1. Overall quality score (0-100)
2. Key strengths
3. Areas for improvement
4. Missing elements
5. Keyword optimization suggestions
6. Formatting recommendations

Resume content:
${file.content}`;
          break;

        case "cover_letter":
          analysisPrompt = `Analyze this cover letter and provide:
1. Overall quality score (0-100)
2. Effectiveness assessment
3. Tone and professionalism
4. Content structure analysis
5. Improvement suggestions
6. Length appropriateness

Cover letter content:
${file.content}`;
          break;

        default:
          analysisPrompt = `Analyze this document and provide:
1. Overall quality score (0-100)
2. Content assessment
3. Clarity and professionalism
4. Structure analysis
5. Improvement suggestions

Document content:
${file.content}`;
      }

      const response = await mistralClient.chatWithPrompt(analysisPrompt, {
        model: "mistral-small",
        max_tokens: 1024,
        temperature: 0.7,
      });

      const parsedAnalysis = parseAnalysisResponse(response);
      setAnalysis(parsedAnalysis);
      setSelectedFile(file);
      setActiveTab("analyze");
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Failed to analyze file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const parseAnalysisResponse = (response: string): FileAnalysis => {
    const scoreMatch = response.match(/(\d+)\/100|score[:\s]+(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2]) : 75;

    const keywords = extractKeywords(response);
    const suggestions = extractSuggestions(response);

    return {
      summary: response.split("\n").slice(0, 3).join("\n"),
      keywords,
      suggestions,
      score,
    };
  };

  const extractKeywords = (text: string): string[] => {
    const keywordSection = text.match(
      /keywords?:?\s*(.*?)(?:\n\n|\n\d+\.|\n[A-Z]|$)/is
    );
    if (keywordSection) {
      return keywordSection[1]
        .split(/[,\n•\-*]/)
        .map((k) => k.trim())
        .filter((k) => k.length > 0)
        .slice(0, 10);
    }
    return [];
  };

  const extractSuggestions = (text: string): string[] => {
    const suggestions: string[] = [];
    const lines = text.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (
        trimmed.match(/^\d+\./) ||
        trimmed.startsWith("•") ||
        trimmed.startsWith("-")
      ) {
        if (
          trimmed.toLowerCase().includes("suggest") ||
          trimmed.toLowerCase().includes("improve") ||
          trimmed.toLowerCase().includes("recommend")
        ) {
          suggestions.push(trimmed.replace(/^[\d•\-*]\s*/, ""));
        }
      }
    }

    return suggestions.slice(0, 5);
  };

  const deleteFile = async (fileId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    const updatedFiles = files.filter((f) => f.id !== fileId);
    setFiles(updatedFiles);
    await saveFilesToStorage(updatedFiles);

    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
      setAnalysis(null);
    }
  };

  const getFileTypeIcon = (type: FileItem["type"]) => {
    switch (type) {
      case "resume":
        return "📄";
      case "cover_letter":
        return "✉️";
      case "portfolio":
        return "💼";
      case "certificate":
        return "🏆";
      default:
        return "📎";
    }
  };

  const getFileTypeColor = (type: FileItem["type"]) => {
    switch (type) {
      case "resume":
        return "#3B82F6";
      case "cover_letter":
        return "#10B981";
      case "portfolio":
        return "#8B5CF6";
      case "certificate":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
          File Manager
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <span
            style={{
              color: "#6B7280",
              fontSize: "0.8rem",
              alignSelf: "center",
            }}
          >
            {files.length} files
          </span>
        </div>
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
          onClick={() => setActiveTab("upload")}
          style={{
            background: "none",
            border: "none",
            padding: "12px 16px",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: activeTab === "upload" ? 600 : 400,
            color: activeTab === "upload" ? "#6D28D9" : "#6B7280",
            borderBottom: activeTab === "upload" ? "2px solid #6D28D9" : "none",
          }}
        >
          Upload
        </button>
        <button
          onClick={() => setActiveTab("manage")}
          style={{
            background: "none",
            border: "none",
            padding: "12px 16px",
            cursor: "pointer",
            fontSize: "0.9rem",
            fontWeight: activeTab === "manage" ? 600 : 400,
            color: activeTab === "manage" ? "#6D28D9" : "#6B7280",
            borderBottom: activeTab === "manage" ? "2px solid #6D28D9" : "none",
          }}
        >
          Manage ({files.length})
        </button>
        <button
          onClick={() => setActiveTab("analyze")}
          disabled={!selectedFile}
          style={{
            background: "none",
            border: "none",
            padding: "12px 16px",
            cursor: selectedFile ? "pointer" : "not-allowed",
            fontSize: "0.9rem",
            fontWeight: activeTab === "analyze" ? 600 : 400,
            color: activeTab === "analyze" ? "#6D28D9" : "#6B7280",
            borderBottom:
              activeTab === "analyze" ? "2px solid #6D28D9" : "none",
            opacity: selectedFile ? 1 : 0.5,
          }}
        >
          Analyze
        </button>
      </div>

      {activeTab === "upload" && (
        <div>
          {/* File Type Selection */}
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
              Document Type:
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { value: "resume", label: "Resume", icon: "📄" },
                { value: "cover_letter", label: "Cover Letter", icon: "✉️" },
                { value: "portfolio", label: "Portfolio", icon: "💼" },
                { value: "certificate", label: "Certificate", icon: "🏆" },
                { value: "other", label: "Other", icon: "📎" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFileType(option.value as FileItem["type"])}
                  style={{
                    background:
                      fileType === option.value ? "#6D28D9" : "#F3F4F6",
                    color: fileType === option.value ? "#FFFFFF" : "#6B7280",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span>{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Area */}
          <div
            className="uswift-card"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: dragActive ? "2px dashed #6D28D9" : "2px dashed #E5E7EB",
              background: dragActive ? "#F8F9FA" : "#FFFFFF",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "center",
              padding: "2rem",
              marginBottom: 16,
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: "2rem",
                  marginBottom: 8,
                  color: dragActive ? "#6D28D9" : "#6B7280",
                }}
              >
                📁
              </div>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: 8,
                }}
              >
                Drop your file here
              </h3>
              <p
                style={{
                  color: "#6B7280",
                  fontSize: "0.9rem",
                  marginBottom: 16,
                }}
              >
                or click to browse
              </p>
            </div>

            <input
              type="file"
              accept=".txt,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              style={{ display: "none" }}
              id="file-input"
            />
            <label
              htmlFor="file-input"
              style={{
                background: "#6D28D9",
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "12px 24px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              Choose File
            </label>
          </div>

          {/* Upload Tips */}
          <div
            style={{
              padding: 12,
              background: "#F8F9FA",
              borderRadius: 8,
              fontSize: "0.8rem",
              color: "#6B7280",
            }}
          >
            <strong>Supported formats:</strong> .txt, .pdf, .doc, .docx
            <br />
            <strong>Max file size:</strong> 5MB
            <br />
            <strong>Recommended:</strong> Plain text files work best for AI
            analysis
          </div>
        </div>
      )}

      {activeTab === "manage" && (
        <div>
          {files.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: "#6B7280",
              }}
            >
              <div style={{ fontSize: "3rem", marginBottom: 16 }}>📂</div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: 8 }}>
                No files uploaded yet
              </h3>
              <p style={{ fontSize: "0.9rem" }}>
                Upload your first document to get started
              </p>
            </div>
          ) : (
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {files.map((file) => (
                <div
                  key={file.id}
                  className="uswift-card"
                  style={{
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: "1.2rem" }}>
                        {getFileTypeIcon(file.type)}
                      </span>
                      <div>
                        <h4
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            color: "#111827",
                            margin: 0,
                          }}
                        >
                          {file.name}
                        </h4>
                        <p
                          style={{
                            fontSize: "0.7rem",
                            color: "#6B7280",
                            margin: 0,
                          }}
                        >
                          {file.type.replace("_", " ")} •{" "}
                          {formatFileSize(file.size)} •{" "}
                          {file.uploadedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => analyzeFile(file)}
                      disabled={isLoading}
                      style={{
                        background: "#10B981",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 4,
                        padding: "4px 8px",
                        cursor: "pointer",
                        fontSize: "0.7rem",
                      }}
                    >
                      Analyze
                    </button>
                    <button
                      onClick={() => deleteFile(file.id)}
                      style={{
                        background: "#EF4444",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 4,
                        padding: "4px 8px",
                        cursor: "pointer",
                        fontSize: "0.7rem",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "analyze" && selectedFile && analysis && (
        <div>
          {/* File Info */}
          <div className="uswift-card" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>
                {getFileTypeIcon(selectedFile.type)}
              </span>
              <div>
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  {selectedFile.name}
                </h3>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#6B7280",
                    margin: 0,
                  }}
                >
                  {selectedFile.type.replace("_", " ")} •{" "}
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>

            {/* Analysis Score */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                background: "#F8F9FA",
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: 700,
                    color:
                      analysis.score >= 80
                        ? "#10B981"
                        : analysis.score >= 60
                        ? "#F59E0B"
                        : "#EF4444",
                    marginBottom: 4,
                  }}
                >
                  {analysis.score}/100
                </div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#6B7280",
                    fontWeight: 500,
                  }}
                >
                  Quality Score
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="uswift-card" style={{ marginBottom: 16 }}>
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#111827",
                marginBottom: 12,
              }}
            >
              Analysis Summary
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                lineHeight: 1.6,
                color: "#4B5563",
                margin: 0,
              }}
            >
              {analysis.summary}
            </p>
          </div>

          {/* Keywords */}
          {analysis.keywords.length > 0 && (
            <div className="uswift-card" style={{ marginBottom: 16 }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: 12,
                }}
              >
                Key Keywords
              </h3>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {analysis.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    style={{
                      background: "#EDE9FE",
                      color: "#6D28D9",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: "0.8rem",
                      fontWeight: 500,
                    }}
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="uswift-card" style={{ marginBottom: 16 }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: 12,
                }}
              >
                Improvement Suggestions
              </h3>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {analysis.suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    style={{
                      fontSize: "0.9rem",
                      color: "#4B5563",
                      marginBottom: 8,
                    }}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setActiveTab("upload")}
              className="uswift-btn"
              style={{ flex: 1 }}
            >
              Upload Another File
            </button>
            <button
              onClick={() => setActiveTab("manage")}
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
              Back to Files
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
        Powered by Mistral AI • Secure file storage and AI-powered analysis
      </div>
    </div>
  );
}
