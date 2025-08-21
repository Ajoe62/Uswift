import "./index.css";

export default function Features() {
  return (
    <div
      style={{ background: "#FFFFFF", borderRadius: "1.5rem", padding: "2rem" }}
    >
      <div
        className="uswift-gradient"
        style={{ height: 8, borderRadius: 8, marginBottom: 24 }}
      />
      <h2
        style={{
          fontSize: "1.4rem",
          fontWeight: 700,
          color: "#111827",
          marginBottom: 16,
        }}
      >
        Extension Features
      </h2>
      <div className="uswift-card">
        <h3 style={{ fontWeight: 700 }}>Automated Job Applications</h3>
        <p>
          Apply to jobs on Greenhouse, Lever, and more automatically—even when
          your computer is off.
        </p>
      </div>
      <div className="uswift-card">
        <h3 style={{ fontWeight: 700 }}>Profile Vault</h3>
        <p>
          Securely store resumes, cover letters, and Q&A profiles for quick
          access and auto-fill.
        </p>
      </div>
      <div className="uswift-card">
        <h3 style={{ fontWeight: 700 }}>Job Tracking</h3>
        <p>
          Track your applications and interview progress in a unified dashboard.
        </p>
      </div>
    </div>
  );
}
