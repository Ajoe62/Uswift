import React, { useState, useEffect } from "react";
import "./index.css";
import { useAuth } from "./hooks/useAuth";

// Declare globals for TypeScript
declare const supabase: any;

export default function ProfileVault() {
  // Normalize thrown values so we never throw non-Error values (like Events)
  const throwNormalized = (err: any) => {
    if (err instanceof Error) throw err;
    throw new Error(String(err));
  };
  const { user, isAuthenticated } = useAuth();
  const [resume, setResume] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [qaProfile, setQaProfile] = useState("");
  const [loading, setLoading] = useState(false);

  // Load saved profiles from Supabase or Chrome storage
  useEffect(() => {
    if (isAuthenticated && user) {
      loadFromSupabase();
    } else {
      loadFromChromeStorage();
    }
  }, [isAuthenticated, user]);

  const loadFromSupabase = async () => {
    try {
      if (!user?.id) return;

      setLoading(true);

      // Load resumes from Supabase
      const { data: resumes, error } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id);

      if (error) throwNormalized(error);

      // Find different types of documents
      const resumeDoc = resumes?.find((r: any) => r.type === "resume");
      const coverLetterDoc = resumes?.find(
        (r: any) => r.type === "cover_letter"
      );

      if (resumeDoc) setResume(resumeDoc.content || "");
      if (coverLetterDoc) setCoverLetter(coverLetterDoc.content || "");

      // Load Q&A profile from user preferences
      const { data: preferences, error: prefError } = await supabase
        .from("user_preferences")
        .select("qa_profile")
        .eq("user_id", user.id)
        .single();

      if (!prefError && preferences) {
        setQaProfile(preferences.qa_profile || "");
      }
    } catch (error) {
      console.error("Error loading from Supabase:", error);
      // Fallback to Chrome storage
      loadFromChromeStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFromChromeStorage = () => {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.sync
    ) {
      chrome.storage.sync.get(
        ["resume", "coverLetter", "qaProfile"],
        (result: any) => {
          if (result.resume) setResume(result.resume);
          if (result.coverLetter) setCoverLetter(result.coverLetter);
          if (result.qaProfile) setQaProfile(result.qaProfile);
        }
      );
    }
  };

  // Save profile data to Supabase or Chrome storage
  const saveProfile = async () => {
    if (isAuthenticated && user) {
      await saveToSupabase();
    } else {
      saveToChrome();
    }
  };

  const saveToSupabase = async () => {
    try {
      if (!user?.id) return;

      setLoading(true);

      // Save resume
      if (resume.trim()) {
        const { error: resumeError } = await supabase.from("resumes").upsert(
          {
            user_id: user.id,
            type: "resume",
            title: "Default Resume",
            content: resume,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,type",
          }
        );

        if (resumeError) throwNormalized(resumeError);
      }

      // Save cover letter
      if (coverLetter.trim()) {
        const { error: coverError } = await supabase.from("resumes").upsert(
          {
            user_id: user.id,
            type: "cover_letter",
            title: "Default Cover Letter",
            content: coverLetter,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,type",
          }
        );

        if (coverError) throwNormalized(coverError);
      }

      // Save Q&A profile in user preferences
      if (qaProfile.trim()) {
        const { error: qaError } = await supabase
          .from("user_preferences")
          .upsert(
            {
              user_id: user.id,
              qa_profile: qaProfile,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id",
            }
          );

        if (qaError) throwNormalized(qaError);
      }

      alert("Profile saved to cloud!");
    } catch (error) {
      console.error("Error saving to Supabase:", error);
      alert("Failed to save to cloud. Saving locally...");
      saveToChrome();
    } finally {
      setLoading(false);
    }
  };

  const saveToChrome = () => {
    if (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.sync
    ) {
      chrome.storage.sync.set({ resume, coverLetter, qaProfile }, () => {
        alert("Profile saved locally!");
      });
    } else {
      alert("Storage is not available.");
    }
  };

  return (
    <div
      style={{ background: "#FFFFFF", borderRadius: "1.5rem", padding: "2rem" }}
    >
      <div
        className="uswift-gradient"
        style={{ height: 8, borderRadius: 8, marginBottom: 24 }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#111827" }}>
          Profile Vault
        </h2>
        {isAuthenticated && (
          <span
            style={{ color: "#10B981", fontSize: "0.8rem", fontWeight: 600 }}
          >
            ☁️ Cloud Sync
          </span>
        )}
      </div>

      <div className="uswift-card">
        <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
          Resume
        </label>
        <textarea
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          rows={4}
          style={{
            width: "100%",
            marginBottom: 12,
            borderRadius: 8,
            border: "1px solid #E5E7EB",
            padding: 8,
            resize: "vertical",
          }}
          placeholder="Paste your resume content here..."
          disabled={loading}
        />
      </div>

      <div className="uswift-card">
        <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
          Cover Letter
        </label>
        <textarea
          value={coverLetter}
          onChange={(e) => setCoverLetter(e.target.value)}
          rows={4}
          style={{
            width: "100%",
            marginBottom: 12,
            borderRadius: 8,
            border: "1px solid #E5E7EB",
            padding: 8,
            resize: "vertical",
          }}
          placeholder="Paste your cover letter template here..."
          disabled={loading}
        />
      </div>

      <div className="uswift-card">
        <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
          Q&A Profile
        </label>
        <textarea
          value={qaProfile}
          onChange={(e) => setQaProfile(e.target.value)}
          rows={4}
          style={{
            width: "100%",
            marginBottom: 12,
            borderRadius: 8,
            border: "1px solid #E5E7EB",
            padding: 8,
            resize: "vertical",
          }}
          placeholder="Common interview Q&A, skills, experience highlights..."
          disabled={loading}
        />
      </div>

      <button
        className="uswift-btn"
        style={{ marginTop: 16, opacity: loading ? 0.6 : 1 }}
        onClick={saveProfile}
        disabled={loading}
      >
        {loading
          ? "Saving..."
          : isAuthenticated
          ? "Save to Cloud"
          : "Save Locally"}
      </button>
    </div>
  );
}
