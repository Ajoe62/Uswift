// Declare chrome as a global variable for TypeScript
declare const chrome: any;

import React, { useState, useEffect } from "react";
import "./index.css";
import ProfileVault from "./ProfileVault";
import JobTracker from "./JobTracker";
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
  const [page, setPage] = useState<"home" | "profile" | "tracker">("home");
  const [profile, setProfile] = useState({
    resume: "",
    coverLetter: "",
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
        ["resume", "coverLetter", "qaProfile"],
        (result: any) => {
          setProfile({
            resume: result.resume || "",
            coverLetter: result.coverLetter || "",
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

      // For now, just use the first resume and cover letter
      const resume = resumes?.find((r: any) => r.type === "resume");
      const coverLetter = resumes?.find((r: any) => r.type === "cover_letter");

      setProfile({
        resume: resume?.file_url || "",
        coverLetter: coverLetter?.file_url || "",
        qaProfile: "", // TODO: Load from preferences
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
  }>(null);
  const [lastAutoDetails, setLastAutoDetails] = useState<any>(null);

  const handleAutoApply = () => {
    setAutoStatus({ status: "pending" });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "AUTO_APPLY", profile },
          (response: any) => {
            if (!response) {
              setAutoStatus({
                status: "error",
                message:
                  "No response from page (content script missing or blocked).",
              });
              return;
            }
            setLastAutoDetails(response.details || null);
            if (response?.status === "success") {
              setAutoStatus({
                status: "success",
                message: `Applied on ${response.jobBoard || "site"}`,
                details: response.details,
              });
            } else {
              setAutoStatus({
                status: "error",
                message: response?.message || "Auto-apply failed",
                details: response.details,
              });
            }
          }
        );
      } else {
        setAutoStatus({ status: "error", message: "No active tab found." });
      }
    });
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

  return (
    <div
      style={{
        minWidth: 350,
        minHeight: 520,
        background: "#FFFFFF",
        borderRadius: "1.5rem",
        boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
        padding: "2rem",
      }}
    >
      {/* Header with user info and sign out */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <span style={{ color: "#4B5563", fontSize: "0.9rem" }}>
          Welcome, {user?.email || "User"}
        </span>
        <button
          onClick={signOut}
          style={{
            background: "#EDE9FE",
            color: "#6D28D9",
            border: "none",
            borderRadius: 8,
            padding: "6px 10px",
            cursor: "pointer",
            fontSize: "0.8rem",
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Gradient Accent Bar */}
      <div
        className="uswift-gradient"
        style={{ height: 8, borderRadius: 8, marginBottom: 24 }}
      />

      {/* Headline & Illustration */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1
          style={{
            fontSize: "1.7rem",
            fontWeight: 700,
            color: "#111827",
            marginBottom: 8,
          }}
        >
          Uswift Chrome Extension
        </h1>
        <p style={{ color: "#4B5563", fontSize: "1rem", marginBottom: 16 }}>
          Auto-apply to jobs on top boards. Save time, get more interviews.
        </p>
        {/* Animated Illustration Placeholder */}
        <div
          style={{
            width: 80,
            height: 80,
            margin: "0 auto 16px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #EDE9FE 0%, #6D28D9 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "pulse 2s infinite",
          }}
        >
          <svg className="uswift-icon" fill="none" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" stroke="#6D28D9" strokeWidth="2" />
            <path
              d="M10 16h12M16 10v12"
              stroke="#6D28D9"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <button
          className="uswift-btn"
          style={{ marginTop: 8 }}
          onClick={handleAutoApply}
        >
          Auto-Apply to Job
        </button>
        {autoStatus && (
          <div style={{ marginTop: 12, textAlign: "center" }}>
            {autoStatus.status === "pending" && (
              <div style={{ color: "#6B7280" }}>Applying…</div>
            )}
            {autoStatus.status === "success" && (
              <div style={{ color: "#10B981" }}>{autoStatus.message}</div>
            )}
            {autoStatus.status === "error" && (
              <div>
                <div style={{ color: "#DC2626" }}>{autoStatus.message}</div>
                <button
                  className="uswift-btn"
                  style={{ marginTop: 8 }}
                  onClick={handleAutoApply}
                >
                  Retry
                </button>
                {lastAutoDetails && (
                  <pre
                    style={{
                      textAlign: "left",
                      maxHeight: 120,
                      overflow: "auto",
                      fontSize: 11,
                      background: "#F3F4F6",
                      padding: 8,
                      borderRadius: 6,
                      marginTop: 8,
                    }}
                  >
                    {JSON.stringify(lastAutoDetails, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            className="uswift-btn"
            style={{ background: "#EDE9FE", color: "#6D28D9" }}
            onClick={() => setPage("profile")}
          >
            Profile Vault
          </button>
          <button
            className="uswift-btn"
            style={{ background: "#EDE9FE", color: "#6D28D9" }}
            onClick={() => setPage("tracker")}
          >
            Job Tracker
          </button>
        </div>
      </div>

      {/* Trust Badges */}
      <div
        className="uswift-trust"
        style={{ justifyContent: "center", marginBottom: 24 }}
      >
        <span className="uswift-badge">Secure</span>
        <span className="uswift-badge">Fast</span>
        <span className="uswift-badge">Private</span>
      </div>

      {/* Feature Cards */}
      <div>
        <div className="uswift-card">
          <svg className="uswift-icon" fill="none" viewBox="0 0 32 32">
            <rect
              x="6"
              y="10"
              width="20"
              height="12"
              rx="3"
              stroke="#6D28D9"
              strokeWidth="2"
            />
            <path
              d="M16 14v4"
              stroke="#6D28D9"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 4 }}>
            Profile Vault
          </h3>
          <p style={{ color: "#4B5563", fontSize: "0.95rem" }}>
            Store resumes, cover letters, and Q&A profiles securely.
          </p>
        </div>
        <div className="uswift-card">
          <svg className="uswift-icon" fill="none" viewBox="0 0 32 32">
            <path
              d="M8 16h16M16 8v16"
              stroke="#6D28D9"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 4 }}>
            Auto-Apply
          </h3>
          <p style={{ color: "#4B5563", fontSize: "0.95rem" }}>
            Automatically apply to jobs on Greenhouse, Lever, and more.
          </p>
        </div>
        <div className="uswift-card">
          <svg className="uswift-icon" fill="none" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="10" stroke="#6D28D9" strokeWidth="2" />
            <path
              d="M16 12v4l2 2"
              stroke="#6D28D9"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 4 }}>
            Job Tracker
          </h3>
          <p style={{ color: "#4B5563", fontSize: "0.95rem" }}>
            Track your applications and interview progress in one place.
          </p>
        </div>
        <div className="uswift-card">
          <svg className="uswift-icon" fill="none" viewBox="0 0 32 32">
            <rect
              x="8"
              y="8"
              width="16"
              height="16"
              rx="4"
              stroke="#6D28D9"
              strokeWidth="2"
            />
            <path
              d="M12 16h8"
              stroke="#6D28D9"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <h3 style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: 4 }}>
            Privacy First
          </h3>
          <p style={{ color: "#4B5563", fontSize: "0.95rem" }}>
            Your data is encrypted and never shared without consent.
          </p>
        </div>
      </div>
    </div>
  );
}
