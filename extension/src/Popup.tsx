// Declare chrome as a global variable for TypeScript
declare const chrome: any;

import React, { useState, useEffect } from "react";
import "./index.css";
import ProfileVault from "./ProfileVault";
import JobTracker from "./JobTracker";
import ChatInterface from "./ChatInterface";
import ResumeEnhancement from "./ResumeEnhancement";
import CoverLetterGenerator from "./CoverLetterGenerator";
import FileManager from "./FileManager";
import JobAnalysis from "./JobAnalysis";
import InterviewPrep from "./InterviewPrep";
import { useAuth } from "./hooks/useAuth";
import Auth from "./Auth";
import { getSupabaseClient } from "./supabaseClient";

export default function Popup() {
  const { user, signOut, isAuthenticated, loading, refreshAuth } = useAuth();
  const [forceRerender, setForceRerender] = useState(0);

  // Toggle a body class so CSS can change colors for authenticated state
  useEffect(() => {
    try {
      if (isAuthenticated) document.body.classList.add("is-auth");
      else document.body.classList.remove("is-auth");
    } catch (e) {
      // ignore in non-browser environments
    }
    return () => {
      try {
        document.body.classList.remove("is-auth");
      } catch (e) {}
    };
  }, [isAuthenticated]);

  // Force re-render when authentication state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      setForceRerender((prev) => prev + 1);
    }
  }, [isAuthenticated, user]);
  const [page, setPage] = useState<
    | "home"
    | "profile"
    | "tracker"
    | "chat"
    | "resume"
    | "cover-letter"
    | "files"
    | "job-analysis"
    | "interview-prep"
  >("home");
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    resume: "",
    coverLetter: "",
    linkedin: "",
    portfolio: "",
    qaProfile: "",
  });

  // Load profile data for auto-apply
  useEffect(() => {
    if (isAuthenticated) {
      // Load from Supabase instead of Chrome storage
      loadProfileFromSupabase();
    } else {
      // Fallback to Chrome storage for unauthenticated users
      chrome.storage.sync.get(
        [
          "resume",
          "coverLetter",
          "qaProfile",
          "firstName",
          "lastName",
          "email",
          "phone",
          "linkedin",
          "portfolio",
        ],
        (result: any) => {
          setProfile({
            firstName: result.firstName || "",
            lastName: result.lastName || "",
            email: result.email || "",
            phone: result.phone || "",
            resume: result.resume || "",
            coverLetter: result.coverLetter || "",
            linkedin: result.linkedin || "",
            portfolio: result.portfolio || "",
            qaProfile: result.qaProfile || "",
          });
        }
      );
    }
  }, [page, isAuthenticated]);

  const loadProfileFromSupabase = async () => {
    try {
      if (!user?.id) return;

      const supabase = getSupabaseClient();
      if (!supabase) {
        console.warn("Supabase client not available");
        return;
      }

      // Load resumes from Supabase using makeRequest
      const resumes = await supabase.makeRequest(
        "resumes?user_id=eq." + user.id
      );

      // Load user preferences for basic info and Q&A profile
      const preferences = await supabase.makeRequest(
        "user_preferences?user_id=eq." + user.id
      );

      // Get the first resume and cover letter
      const resume = resumes?.find((r: any) => r.type === "resume");
      const coverLetter = resumes?.find((r: any) => r.type === "cover_letter");

      // Get user preferences (should be single record)
      const userPrefs = preferences?.[0] || {};

      setProfile({
        firstName: userPrefs.first_name || "",
        lastName: userPrefs.last_name || "",
        email: userPrefs.email || "",
        phone: userPrefs.phone || "",
        resume: resume?.content || resume?.file_url || "",
        coverLetter: coverLetter?.content || coverLetter?.file_url || "",
        linkedin: userPrefs.linkedin || "",
        portfolio: userPrefs.portfolio || "",
        qaProfile: userPrefs.qa_profile || "",
      });
    } catch (error) {
      console.error("Error loading profile from Supabase:", error);
    }
  };

  // Handler for auto-apply (sends profile data to content script)
  const [autoStatus, setAutoStatus] = useState<null | {
    status: string;
    message?: string;
    details?: any;
    jobBoard?: string;
    session?: {
      jobBoard: string;
      startTime: number;
      steps: string[];
      errors: string[];
      success: boolean;
    };
  }>(null);
  const [lastAutoDetails, setLastAutoDetails] = useState<any>(null);

  const handleAutoApply = async () => {
    setAutoStatus({ status: "pending", message: "Starting auto-apply..." });

    try {
      // Get current tab
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const tab = tabs[0];

      if (!tab?.id) {
        throw new Error("No active tab found");
      }

      // First, check if content script is responding with a ping
      try {
        console.log("🔍 Checking if content script is responding...");
        await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(
            tab.id!,
            { action: "ping" },
            (response: any) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else if (response?.status === "pong") {
                console.log("✅ Content script is responding");
                resolve(response);
              } else {
                reject(new Error("Content script not responding"));
              }
            }
          );
        });
      } catch (pingError) {
        console.warn("⚠️ Content script ping failed:", pingError);
        throw new Error("CONTENT_SCRIPT_NOT_RESPONDING");
      }

      // Send auto-apply message to content script
      const response = await new Promise<any>((resolve, reject) => {
        chrome.tabs.sendMessage(
          tab.id!,
          { action: "autoApply", profile },
          (response: any) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(response);
            }
          }
        );
      });

      if (!response) {
        throw new Error("No response from content script");
      }

      setLastAutoDetails(response.details || null);

      if (response.status === "success") {
        setAutoStatus({
          status: "success",
          message:
            response.message ||
            `Successfully applied on ${response.jobBoard || "site"}`,
          jobBoard: response.jobBoard,
          session: response.session,
        });
      } else {
        setAutoStatus({
          status: "error",
          message: response.message || "Auto-apply failed",
          session: response.session,
        });
      }
    } catch (error: any) {
      console.error("Auto-apply error:", error);

      // Enhanced error handling for different scenarios
      if (
        error.message === "CONTENT_SCRIPT_NOT_RESPONDING" ||
        error.message?.includes("Receiving end does not exist") ||
        error.message?.includes("Could not establish connection") ||
        error.message?.includes("content script")
      ) {
        setAutoStatus({
          status: "error",
          message:
            "No response from page (content script missing or blocked). Follow these steps:",
          details: {
            troubleshooting: [
              "1. 🔄 Refresh the current page (Ctrl+F5) and wait for full load",
              "2. 🔍 Open browser console (F12) → Run: checkUSwiftHealth()",
              "3. 🎯 Run: testJobBoard() to check platform detection",
              "4. ⚙️ Check extension permissions in chrome://extensions/",
              "5. 🚫 Try incognito mode (may have different permissions)",
              "6. 🔌 Disable other extensions temporarily",
              "7. 🛡️ Check if site uses anti-bot protection",
              "8. 📄 Ensure you're on actual application page (not job listing)",
            ],
            quickTests: [
              "checkUSwiftHealth() - Check if extension is loaded",
              "testJobBoard() - Test platform detection",
              "console.log(window.location.href) - Verify current URL",
            ],
            currentUrl: window.location?.href || "Unknown",
          },
        });
      } else if (
        error.message?.includes("Cannot read property") ||
        error.message?.includes("undefined") ||
        error.message?.includes("null")
      ) {
        setAutoStatus({
          status: "error",
          message:
            "Page not fully loaded. Please wait for the page to load completely and try again.",
        });
      } else if (error.message?.includes("Extension context invalidated")) {
        setAutoStatus({
          status: "error",
          message:
            "Extension was reloaded. Please refresh the page and try again.",
        });
      } else if (error.message?.includes("Cannot access")) {
        setAutoStatus({
          status: "error",
          message:
            "Cannot access this page. The site may block extensions or have strict security policies.",
        });
      } else {
        setAutoStatus({
          status: "error",
          message:
            error.message ||
            "Auto-apply failed. Please check the console for details.",
        });
      }
    }
  };

  // If not authenticated, show auth form
  if (!isAuthenticated && !loading) {
    return (
      <Auth
        onAuthSuccess={async () => {
          // Force a re-render and ensure we're on the home page
          setPage("home");

          // Refresh authentication state to ensure it's properly updated
          await refreshAuth();

          // Force re-render
          setForceRerender((prev) => prev + 1);

          // Additional check after a small delay to ensure state is consistent
          setTimeout(async () => {
            await refreshAuth();
            setForceRerender((prev) => prev + 1);
          }, 500);
        }}
      />
    );
  }

  // Show loading state while authentication is being determined
  if (loading) {
    return (
      <div
        style={{
          padding: "2rem",
          textAlign: "center",
          minHeight: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div>
          <div
            style={{
              width: 40,
              height: 40,
              border: "4px solid #e5e7eb",
              borderTop: "4px solid #6d28d9",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: "#6b7280", margin: 0 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (page === "profile") {
    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "1rem",
          }}
        >
          <button className="uswift-btn" onClick={() => setPage("home")}>
            ← Back
          </button>
          <button
            onClick={signOut}
            style={{
              background: "#EDE9FE",
              color: "#6D28D9",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
        <ProfileVault />
      </div>
    );
  }

  if (page === "tracker") {
    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "1rem",
          }}
        >
          <button className="uswift-btn" onClick={() => setPage("home")}>
            ← Back
          </button>
          <button
            onClick={signOut}
            style={{
              background: "#EDE9FE",
              color: "#6D28D9",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
        <JobTracker />
      </div>
    );
  }

  if (page === "chat") {
    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "1rem",
          }}
        >
          <button className="uswift-btn" onClick={() => setPage("home")}>
            ← Back
          </button>
          <button
            onClick={signOut}
            style={{
              background: "#EDE9FE",
              color: "#6D28D9",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
        <ChatInterface />
      </div>
    );
  }

  if (page === "resume") {
    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "1rem",
          }}
        >
          <button className="uswift-btn" onClick={() => setPage("home")}>
            ← Back
          </button>
          <button
            onClick={signOut}
            style={{
              background: "#EDE9FE",
              color: "#6D28D9",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
        <ResumeEnhancement />
      </div>
    );
  }

  if (page === "cover-letter") {
    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "1rem",
          }}
        >
          <button className="uswift-btn" onClick={() => setPage("home")}>
            ← Back
          </button>
          <button
            onClick={signOut}
            style={{
              background: "#EDE9FE",
              color: "#6D28D9",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
        <CoverLetterGenerator />
      </div>
    );
  }

  if (page === "files") {
    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "1rem",
          }}
        >
          <button className="uswift-btn" onClick={() => setPage("home")}>
            ← Back
          </button>
          <button
            onClick={signOut}
            style={{
              background: "#EDE9FE",
              color: "#6D28D9",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
        <FileManager />
      </div>
    );
  }

  if (page === "job-analysis") {
    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "1rem",
          }}
        >
          <button className="uswift-btn" onClick={() => setPage("home")}>
            ← Back
          </button>
          <button
            onClick={signOut}
            style={{
              background: "#EDE9FE",
              color: "#6D28D9",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
        <JobAnalysis />
      </div>
    );
  }

  if (page === "interview-prep") {
    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            margin: "1rem",
          }}
        >
          <button className="uswift-btn" onClick={() => setPage("home")}>
            ← Back
          </button>
          <button
            onClick={signOut}
            style={{
              background: "#EDE9FE",
              color: "#6D28D9",
              border: "none",
              borderRadius: 8,
              padding: "8px 12px",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
        <InterviewPrep />
      </div>
    );
  }

  return (
    <div
      style={{
        minWidth: 380,
        maxWidth: 420,
        background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
        borderRadius: "20px",
        boxShadow:
          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Inter', sans-serif",
        color: "#1f2937",
        border: "1px solid rgba(255, 255, 255, 0.8)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Pattern */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)
          `,
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
          borderRadius: "20px 20px 0 0",
          padding: "2rem 2rem 1.5rem",
          textAlign: "center",
          color: "#FFFFFF",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            background: "rgba(255, 255, 255, 0.2)",
            borderRadius: "16px",
            margin: "0 auto 1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(10px)",
            border: "2px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          <span style={{ fontSize: "1.8rem" }}>🚀</span>
        </div>
        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: 800,
            margin: "0 0 0.5rem 0",
            background: "linear-gradient(45deg, #ffffff, #f0f9ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          USwift
        </h1>
        <p
          style={{
            fontSize: "0.9rem",
            margin: 0,
            opacity: 0.95,
            fontWeight: 500,
          }}
        >
          AI-Powered Career Excellence
        </p>

        {/* User Welcome */}
        <div
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            background: "rgba(255, 255, 255, 0.15)",
            borderRadius: "12px",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <div
            style={{
              fontSize: "0.8rem",
              opacity: 0.9,
              fontWeight: 600,
            }}
          >
            Welcome back, {user?.email?.split("@")[0] || "Professional"}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: "1.5rem 2rem", position: "relative", zIndex: 1 }}>
        {/* Quick Actions */}
        <div style={{ marginBottom: "2rem" }}>
          <h2
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "#1f2937",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            Quick Actions
          </h2>

          {/* Auto-Apply Section */}
          <div
            style={{
              background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
              borderRadius: "16px",
              padding: "1.5rem",
              marginBottom: "1.5rem",
              border: "1px solid rgba(59, 130, 246, 0.1)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-20px",
                right: "-20px",
                width: "60px",
                height: "60px",
                background:
                  "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
                borderRadius: "50%",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                }}
              >
                <span style={{ fontSize: "1.2rem", color: "white" }}>⚡</span>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: "#1e40af",
                    margin: 0,
                  }}
                >
                  Smart Auto-Apply
                </h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#64748b",
                    margin: "0.25rem 0 0 0",
                  }}
                >
                  Apply to jobs instantly with AI-optimized profiles
                </p>
              </div>
            </div>

            <button
              onClick={handleAutoApply}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "12px",
                padding: "12px 20px",
                fontSize: "0.95rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(59, 130, 246, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(59, 130, 246, 0.3)";
              }}
            >
              <span>🚀</span>
              Auto-Apply to Job
            </button>

            {autoStatus && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "1rem",
                  borderRadius: "12px",
                  fontSize: "0.9rem",
                  background:
                    autoStatus.status === "success"
                      ? "linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)"
                      : autoStatus.status === "error"
                      ? "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)"
                      : "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)",
                  color:
                    autoStatus.status === "success"
                      ? "#16a34a"
                      : autoStatus.status === "error"
                      ? "#dc2626"
                      : "#1e40af",
                  border: `1px solid ${
                    autoStatus.status === "success"
                      ? "rgba(34, 197, 94, 0.3)"
                      : autoStatus.status === "error"
                      ? "rgba(239, 68, 68, 0.3)"
                      : "rgba(59, 130, 246, 0.3)"
                  }`,
                }}
              >
                {autoStatus.status === "pending" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "12px",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        border: "3px solid rgba(59, 130, 246, 0.3)",
                        borderTop: "3px solid #3b82f6",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                        🚀 Advanced Auto-Apply in Progress
                      </div>
                      <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
                        Detecting job board, filling forms, uploading files...
                      </div>
                    </div>
                  </div>
                )}
                {autoStatus.status === "success" && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                        fontWeight: 600,
                      }}
                    >
                      <span>✅</span>
                      <span>Application Submitted Successfully!</span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        opacity: 0.9,
                        marginBottom: "8px",
                      }}
                    >
                      {autoStatus.message}
                    </div>
                    {autoStatus.jobBoard && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          opacity: 0.7,
                          padding: "6px 12px",
                          background: "rgba(255, 255, 255, 0.5)",
                          borderRadius: "6px",
                          display: "inline-block",
                        }}
                      >
                        Platform: {autoStatus.jobBoard}
                      </div>
                    )}
                  </div>
                )}
                {autoStatus.status === "error" && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                        fontWeight: 600,
                      }}
                    >
                      <span>❌</span>
                      <span>Auto-Apply Failed</span>
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        opacity: 0.9,
                        marginBottom: "12px",
                      }}
                    >
                      {autoStatus.message}
                    </div>
                    {autoStatus.session &&
                      autoStatus.session.errors &&
                      autoStatus.session.errors.length > 0 && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            opacity: 0.8,
                            marginBottom: "12px",
                            padding: "8px",
                            background: "rgba(255, 255, 255, 0.3)",
                            borderRadius: "6px",
                          }}
                        >
                          <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                            Issues detected:
                          </div>
                          {autoStatus.session.errors
                            .slice(0, 3)
                            .map((error, index) => (
                              <div key={index} style={{ marginBottom: "2px" }}>
                                • {error}
                              </div>
                            ))}
                          {autoStatus.session.errors.length > 3 && (
                            <div>
                              ... and {autoStatus.session.errors.length - 3}{" "}
                              more
                            </div>
                          )}
                        </div>
                      )}
                    <button
                      onClick={handleAutoApply}
                      style={{
                        background:
                          "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px 16px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(220, 38, 38, 0.3)",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 12px rgba(220, 38, 38, 0.4)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(220, 38, 38, 0.3)";
                      }}
                    >
                      🔄 Retry Auto-Apply
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Core Features */}
          <div style={{ marginBottom: "2rem" }}>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "#374151",
                marginBottom: "1rem",
                textAlign: "center",
              }}
            >
              Core Features
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <button
                onClick={() => setPage("profile")}
                style={{
                  background: "#ffffff",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "1rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#6366f1";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 16px rgba(99, 102, 241, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    background:
                      "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: "1rem", color: "white" }}>📋</span>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "#1f2937",
                    }}
                  >
                    Profile Vault
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                    Manage profiles
                  </div>
                </div>
              </button>

              <button
                onClick={() => setPage("tracker")}
                style={{
                  background: "#ffffff",
                  border: "2px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "1rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#f59e0b";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 16px rgba(245, 158, 11, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    background:
                      "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: "1rem", color: "white" }}>📊</span>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "#1f2937",
                    }}
                  >
                    Job Tracker
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                    Track applications
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* AI Tools Section */}
          <div>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: "#374151",
                marginBottom: "1rem",
                textAlign: "center",
              }}
            >
              🤖 AI-Powered Tools
            </h3>

            {/* Primary AI Tools */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              <button
                onClick={() => setPage("chat")}
                style={{
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  border: "none",
                  borderRadius: "12px",
                  padding: "1rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  color: "white",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(16, 185, 129, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(16, 185, 129, 0.3)";
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    background: "rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>💬</span>
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                    AI Assistant
                  </div>
                  <div style={{ fontSize: "0.7rem", opacity: 0.9 }}>
                    Career guidance
                  </div>
                </div>
              </button>

              <button
                onClick={() => setPage("resume")}
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  border: "none",
                  borderRadius: "12px",
                  padding: "1rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  color: "white",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(59, 130, 246, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(59, 130, 246, 0.3)";
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    background: "rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <span style={{ fontSize: "1rem" }}>📄</span>
                </div>
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                    Resume AI
                  </div>
                  <div style={{ fontSize: "0.7rem", opacity: 0.9 }}>
                    Enhance & optimize
                  </div>
                </div>
              </button>
            </div>

            {/* Secondary AI Tools */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "0.5rem",
              }}
            >
              <button
                onClick={() => setPage("cover-letter")}
                style={{
                  background: "#ffffff",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "0.75rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#8b5cf6";
                  e.currentTarget.style.background = "#faf5ff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.background = "#ffffff";
                }}
              >
                <span style={{ fontSize: "1rem" }}>✍️</span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "#1f2937",
                  }}
                >
                  Cover Letter
                </span>
              </button>

              <button
                onClick={() => setPage("files")}
                style={{
                  background: "#ffffff",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "0.75rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#f59e0b";
                  e.currentTarget.style.background = "#fffbeb";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.background = "#ffffff";
                }}
              >
                <span style={{ fontSize: "1rem" }}>📁</span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "#1f2937",
                  }}
                >
                  File Manager
                </span>
              </button>

              <button
                onClick={() => setPage("job-analysis")}
                style={{
                  background: "#ffffff",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "0.75rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#ec4899";
                  e.currentTarget.style.background = "#fdf2f8";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.background = "#ffffff";
                }}
              >
                <span style={{ fontSize: "1rem" }}>🔍</span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "#1f2937",
                  }}
                >
                  Job Analysis
                </span>
              </button>
            </div>

            {/* Interview Prep - Full Width */}
            <button
              onClick={() => setPage("interview-prep")}
              style={{
                marginTop: "0.75rem",
                width: "100%",
                background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                border: "none",
                borderRadius: "12px",
                padding: "1rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                boxShadow: "0 4px 12px rgba(20, 184, 166, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow =
                  "0 8px 20px rgba(20, 184, 166, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 4px 12px rgba(20, 184, 166, 0.3)";
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  background: "rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backdropFilter: "blur(10px)",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>🎤</span>
              </div>
              <div style={{ textAlign: "left", flex: 1 }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                  Interview Preparation
                </div>
                <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>
                  AI-powered practice questions & tips
                </div>
              </div>
              <span style={{ fontSize: "1rem", opacity: 0.8 }}>→</span>
            </button>
          </div>
        </div>

        {/* Sign Out */}
        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <button
            onClick={signOut}
            style={{
              background: "transparent",
              color: "#6b7280",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              padding: "8px 16px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 500,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#9ca3af";
              e.currentTarget.style.color = "#4b5563";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#d1d5db";
              e.currentTarget.style.color = "#6b7280";
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
