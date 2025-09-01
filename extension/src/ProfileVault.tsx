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
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false);

  const isProfileCompleteForAutoApply = () => {
    return firstName.trim() && lastName.trim() && email.trim() && phone.trim() && resume.trim();
  };

  const createProfileForAutoApply = () => {
    return {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      resume: resume.trim(),
      linkedin: linkedin.trim(),
      portfolio: portfolio.trim()
    };
  };

  const handleResumeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        alert("Only PDF, DOC, and DOCX files are allowed");
        return;
      }
      
      setResumeFile(file);
      
      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setResume(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const loadFromSupabase = async () => {
    try {
      if (!user?.id) return;
      
      // Load basic profile
      const { data: profileData } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) {
        setFirstName(profileData.first_name || '');
        setLastName(profileData.last_name || '');
        setEmail(profileData.email || '');
        setPhone(profileData.phone || '');
        setLinkedin(profileData.linkedin || '');
        setPortfolio(profileData.portfolio || '');
      }
      
      // Load resume
      const { data: resumeData } = await supabase
        .from('resumes')
        .select('content')
        .eq('user_id', user.id)
        .single();
      
      if (resumeData) {
        setResume(resumeData.content || '');
      }
    } catch (error) {
      console.error('Error loading from Supabase:', error);
    }
  };

  const saveToSupabase = async () => {
    try {
      if (!user?.id) return;
      
      // Save basic profile
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone: phone,
          linkedin: linkedin,
          portfolio: portfolio
        }, { onConflict: 'user_id' });
      
      // Save resume
      if (resume) {
        await supabase
          .from('resumes')
          .upsert({
            user_id: user.id,
            content: resume
          }, { onConflict: 'user_id' });
      }
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      throw error;
    }
  };

  const loadFromChromeStorage = async () => {
    try {
      const result = await chrome.storage.sync.get([
        'firstName', 'lastName', 'email', 'phone', 'linkedin', 'portfolio', 'resume'
      ]);
      
      setFirstName(result.firstName || '');
      setLastName(result.lastName || '');
      setEmail(result.email || '');
      setPhone(result.phone || '');
      setLinkedin(result.linkedin || '');
      setPortfolio(result.portfolio || '');
      setResume(result.resume || '');
    } catch (error) {
      console.error('Error loading from Chrome storage:', error);
    }
  };

  const saveToChrome = async () => {
    try {
      await chrome.storage.sync.set({
        firstName,
        lastName,
        email,
        phone,
        linkedin,
        portfolio,
        resume
      });
    } catch (error) {
      console.error('Error saving to Chrome storage:', error);
      throw error;
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      if (isAuthenticated) {
        await saveToSupabase();
      } else {
        await saveToChrome();
      }
      setLastSaved(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadFromSupabase();
    } else {
      loadFromChromeStorage();
    }
  }, [isAuthenticated, user]);

  const TourGuide = () => {
    return (
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "1.5rem",
        borderRadius: "1rem",
        marginBottom: "1.5rem",
        position: "relative",
      }}>
        <div style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          cursor: "pointer",
          fontSize: "1.2rem",
        }} onClick={() => setShowTour(false)}>
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
    <div style={{ background: "#FFFFFF", borderRadius: "1.5rem", padding: "2rem" }}>
      <div className="uswift-gradient" style={{ height: 8, borderRadius: 8, marginBottom: 24 }} />

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
      }}>
        <div>
          <h2 className="uswift-text-gradient" style={{ fontSize: "1.5rem", margin: 0 }}>
            Profile Vault
          </h2>
          <p style={{ color: "#6B7280", fontSize: "0.9rem", margin: "4px 0 0 0" }}>
            Manage your career documents and auto-apply settings
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {lastSaved && (
            <span style={{ fontSize: "0.8rem", color: "#10B981" }}>
              ✓ Saved {lastSaved}
            </span>
          )}
          <button
            onClick={() => setShowTour(!showTour)}
            style={{
              background: "#F3F4F6",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "0.8rem",
              cursor: "pointer",
              color: "#374151",
            }}
          >
            ❓ Guide
          </button>
        </div>
      </div>

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
      </div>

      {/* Auto-Apply Readiness Status */}
      <div style={{
        marginTop: "1.5rem",
        padding: "1rem",
        borderRadius: "8px",
        background: isProfileCompleteForAutoApply()
          ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)"
          : "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)",
        border: `1px solid ${isProfileCompleteForAutoApply() ? "#10B981" : "#F59E0B"}`
      }}>
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
