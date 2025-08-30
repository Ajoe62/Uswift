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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTour, setShowTour] = useState(false);

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

      // Load user preferences (including Q&A profile and basic info)
      const { data: preferences, error: prefError } = await supabase
        .from("user_preferences")
        .select("qa_profile, first_name, last_name, email, phone, linkedin, portfolio")
        .eq("user_id", user.id)
        .single();
      
      if (!prefError && preferences) {
        setQaProfile(preferences.qa_profile || "");
        setFirstName(preferences.first_name || "");
        setLastName(preferences.last_name || "");
        setEmail(preferences.email || "");
        setPhone(preferences.phone || "");
        setLinkedin(preferences.linkedin || "");
        setPortfolio(preferences.portfolio || "");
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
        ["resume", "coverLetter", "qaProfile", "firstName", "lastName", "email", "phone", "linkedin", "portfolio"],
        (result: any) => {
        if (result.resume) setResume(result.resume);
        if (result.coverLetter) setCoverLetter(result.coverLetter);
        if (result.qaProfile) setQaProfile(result.qaProfile);
          if (result.firstName) setFirstName(result.firstName);
          if (result.lastName) setLastName(result.lastName);
          if (result.email) setEmail(result.email);
          if (result.phone) setPhone(result.phone);
          if (result.linkedin) setLinkedin(result.linkedin);
          if (result.portfolio) setPortfolio(result.portfolio);
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

      // Save basic profile information
      if (firstName || lastName || email || phone) {
        const { error: profileError } = await supabase
          .from("user_preferences")
          .upsert(
            {
              user_id: user.id,
              first_name: firstName,
              last_name: lastName,
              email: email,
              phone: phone,
              linkedin: linkedin,
              portfolio: portfolio,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "user_id",
            }
          );

        if (profileError) throwNormalized(profileError);
      }
      
      // Save resume
      if (resume.trim()) {
        const { error: resumeError } = await supabase.from("resumes").upsert(
          {
            user_id: user.id,
            type: "resume",
            title: resumeFile?.name || "Default Resume",
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
      chrome.storage.sync.set({
        resume,
        coverLetter,
        qaProfile,
        firstName,
        lastName,
        email,
        phone,
        linkedin,
        portfolio
      }, () => {
        alert("Profile saved locally!");
      });
    } else {
      alert("Storage is not available.");
    }
  };

  const handleResumeFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert("Please upload a PDF, DOC, or DOCX file");
        return;
      }

      setResumeFile(file);
      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        setResume(base64); // Store as base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  // Validation function for auto-apply readiness
  const isProfileCompleteForAutoApply = () => {
    const requiredFields = [firstName, lastName, email, phone, resume];
    return requiredFields.every(field => field.trim() !== "");
  };

  // Create profile object for auto-apply
  const createProfileForAutoApply = () => {
    return {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      resume: resume, // This is the base64 encoded file
      coverLetter: coverLetter.trim() || undefined,
      linkedin: linkedin.trim() || undefined,
      portfolio: portfolio.trim() || undefined,
    };
  };

  // Tour Guide Component
  const TourGuide = () => {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "1.5rem",
          borderRadius: "1rem",
          marginBottom: "1.5rem",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            cursor: "pointer",
            fontSize: "1.2rem",
          }}
          onClick={() => setShowTour(false)}
        >
          ✕
        </div>

        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.2rem" }}>
          🚀 Auto-Apply Setup Guide
        </h3>

        <div style={{ fontSize: "0.9rem", lineHeight: "1.5" }}>
          <div style={{ marginBottom: "1rem" }}>
            <strong>📋 Required Information:</strong>
            <ul style={{ margin: "0.5rem 0", paddingLeft: "1.2rem" }}>
              <li><strong>Basic Info:</strong> First Name, Last Name, Email, Phone</li>
              <li><strong>Resume:</strong> Upload your resume file (PDF/DOC)</li>
            </ul>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>📝 Optional but Recommended:</strong>
            <ul style={{ margin: "0.5rem 0", paddingLeft: "1.2rem" }}>
              <li><strong>Cover Letter:</strong> Template or custom content</li>
              <li><strong>LinkedIn:</strong> Your LinkedIn profile URL</li>
              <li><strong>Portfolio:</strong> Website or portfolio link</li>
              <li><strong>Q&A Profile:</strong> Interview answers and skills</li>
            </ul>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <strong>🎯 How Auto-Apply Works:</strong>
            <ol style={{ margin: "0.5rem 0", paddingLeft: "1.2rem" }}>
              <li>Opens job application page</li>
              <li>Detects form fields automatically</li>
              <li>Fills your information</li>
              <li>Uploads your resume</li>
              <li>Submits the application</li>
            </ol>
          </div>

          <div style={{ marginTop: "1rem", padding: "0.8rem", background: "rgba(255,255,255,0.1)", borderRadius: "8px" }}>
            <strong>💡 Pro Tip:</strong> Complete all required fields to ensure successful auto-application on all major job boards!
          </div>
        </div>
      </div>
    );
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
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => setShowTour(!showTour)}
            style={{
              background: "#F3F4F6",
              color: "#6B7280",
              border: "none",
              borderRadius: "6px",
              padding: "4px 8px",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            ❓ Guide
          </button>
        {isAuthenticated && (
            <span
              style={{ color: "#10B981", fontSize: "0.8rem", fontWeight: 600 }}
            >
              ☁️ Cloud Sync
            </span>
          )}
        </div>
      </div>
      
      {/* Tour Guide */}
      {showTour && <TourGuide />}

      {/* Required Information Section */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#111827", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#EF4444" }}>●</span>
          Required for Auto-Apply
        </h3>

        {/* Basic Information */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
      <div className="uswift-card">
            <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
              First Name *
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
          style={{ 
                width: "100%",
                padding: "8px 12px",
            borderRadius: 8, 
                border: "1px solid #E5E7EB",
                fontSize: "0.9rem",
          }} 
              placeholder="Your first name"
          disabled={loading}
        />
      </div>
      
      <div className="uswift-card">
            <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
              Last Name *
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                fontSize: "0.9rem",
              }}
              placeholder="Your last name"
              disabled={loading}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div className="uswift-card">
            <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
          style={{ 
                width: "100%",
                padding: "8px 12px",
            borderRadius: 8, 
                border: "1px solid #E5E7EB",
                fontSize: "0.9rem",
          }} 
              placeholder="your.email@example.com"
          disabled={loading}
        />
      </div>
      
      <div className="uswift-card">
            <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
              Phone Number *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                fontSize: "0.9rem",
              }}
              placeholder="+1 (555) 123-4567"
              disabled={loading}
            />
          </div>
        </div>

        {/* Resume File Upload */}
        <div className="uswift-card">
          <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
            Resume File *
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeFileUpload}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                fontSize: "0.9rem",
              }}
              disabled={loading}
            />
            {resumeFile && (
              <span style={{ color: "#10B981", fontSize: "0.8rem", fontWeight: 500 }}>
                ✓ {resumeFile.name}
              </span>
            )}
          </div>
          <small style={{ color: "#6B7280", fontSize: "0.8rem", marginTop: "4px", display: "block" }}>
            Supported formats: PDF, DOC, DOCX (Max 10MB)
          </small>
        </div>
      </div>

      {/* Optional Information Section */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#111827", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#F59E0B" }}>●</span>
          Optional (Recommended)
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
          <div className="uswift-card">
            <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
              LinkedIn Profile
            </label>
            <input
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
          style={{ 
                width: "100%",
                padding: "8px 12px",
            borderRadius: 8, 
                border: "1px solid #E5E7EB",
                fontSize: "0.9rem",
          }} 
              placeholder="https://linkedin.com/in/yourprofile"
          disabled={loading}
        />
      </div>
      
      <div className="uswift-card">
            <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
              Portfolio/Website
            </label>
            <input
              type="url"
              value={portfolio}
              onChange={(e) => setPortfolio(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                fontSize: "0.9rem",
              }}
              placeholder="https://yourportfolio.com"
              disabled={loading}
            />
          </div>
        </div>
      </div>

        <div className="uswift-card">
          <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
            Cover Letter Template
          </label>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #E5E7EB",
              fontSize: "0.9rem",
              resize: "vertical",
            }}
            placeholder="Write your cover letter template here. Use [COMPANY] and [POSITION] as placeholders..."
            disabled={loading}
          />
          <small style={{ color: "#6B7280", fontSize: "0.8rem", marginTop: "4px", display: "block" }}>
            Tip: Use placeholders like [COMPANY] and [POSITION] for auto-customization
          </small>
        </div>

        <div className="uswift-card">
          <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>
            Interview Q&A Profile
          </label>
        <textarea 
          value={qaProfile} 
            onChange={(e) => setQaProfile(e.target.value)}
          rows={4} 
          style={{ 
              width: "100%",
              padding: "8px 12px",
            borderRadius: 8, 
              border: "1px solid #E5E7EB",
              fontSize: "0.9rem",
              resize: "vertical",
            }}
            placeholder="List your key skills, experience highlights, and common interview answers..."
          disabled={loading}
        />
        <small style={{ color: "#6B7280", fontSize: "0.8rem", marginTop: "4px", display: "block" }}>
          Used by AI interview preparation features
        </small>
      </div>
    </div> {/* End Optional Information Section */}

      {/* Auto-Apply Readiness Status */}
      <div
        style={{
          marginTop: "1.5rem",
          padding: "1rem",
          borderRadius: "8px",
          background: isProfileCompleteForAutoApply()
            ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)"
            : "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)",
          border: `1px solid ${isProfileCompleteForAutoApply() ? "#10B981" : "#F59E0B"}`
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.5rem" }}>
          {isProfileCompleteForAutoApply() ? (
            <span style={{ color: "#10B981", fontSize: "1.2rem" }}>✅</span>
          ) : (
            <span style={{ color: "#F59E0B", fontSize: "1.2rem" }}>⚠️</span>
          )}
          <span style={{ fontWeight: 600, color: "#111827" }}>
            Auto-Apply Status: {isProfileCompleteForAutoApply() ? "Ready" : "Incomplete"}
          </span>
        </div>

        {isProfileCompleteForAutoApply() ? (
          <p style={{ color: "#10B981", fontSize: "0.9rem", margin: 0 }}>
            🎉 Your profile is complete! You can now use auto-apply on supported job boards.
          </p>
        ) : (
          <div style={{ fontSize: "0.9rem", color: "#92400E" }}>
            <p style={{ margin: "0 0 0.5rem 0", fontWeight: 500 }}>
              Complete these fields to enable auto-apply:
            </p>
            <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
              {!firstName.trim() && <li>First Name</li>}
              {!lastName.trim() && <li>Last Name</li>}
              {!email.trim() && <li>Email Address</li>}
              {!phone.trim() && <li>Phone Number</li>}
              {!resume.trim() && <li>Resume File</li>}
            </ul>
          </div>
        )}
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

      {/* Export profile for debugging */}
      {isProfileCompleteForAutoApply() && (
        <button
          onClick={() => {
            const profile = createProfileForAutoApply();
            console.log("📋 Profile for Auto-Apply:", profile);
            navigator.clipboard.writeText(JSON.stringify(profile, null, 2));
            alert("Profile copied to clipboard for debugging!");
          }}
          style={{
            marginTop: "8px",
            marginLeft: "8px",
            padding: "8px 16px",
            background: "#F3F4F6",
            color: "#6B7280",
            border: "none",
            borderRadius: "6px",
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          📋 Export Profile
      </button>
      )}
    </div>
  );
}
