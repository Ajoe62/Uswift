import React, { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import "./index.css";

interface AuthProps {
  onAuthSuccess?: () => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const { signIn, signUp, loading: authLoading, pending } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      let result: any;
      if (isSignUp) {
        result = await signUp(email, password, { full_name: fullName });
      } else if (isForgot) {
        // The current useAuth does not expose resetPassword; provide a local UX-friendly response.
        // If you later add resetPassword to the hook, replace this branch with a call to it.
        result = {
          message:
            "If an account with that email exists, password reset instructions have been sent.",
        };
      } else {
        result = await signIn(email, password);
      }

      if (result && result.error) {
        // Prefer structured payload messages when available
        let errorMessage = "An error occurred. Please try again.";
        if (typeof result.error === "string") errorMessage = result.error;
        else if (result.error.message) errorMessage = result.error.message;
        else if (result.error.payload) {
          const p = result.error.payload;
          if (typeof p === "string") errorMessage = p;
          else if (p?.errors && Array.isArray(p.errors))
            errorMessage = p.errors.map((x: any) => x.message || x).join("; ");
          else if (p?.details) errorMessage = p.details;
          else errorMessage = JSON.stringify(p);
        }
        setError(errorMessage || "An error occurred. Please try again.");
      } else if (result && (result.user || result.message)) {
        // Show server-provided message if present (useful for 'check your email')
        if (result.message) setSuccess(result.message);
        else
          setSuccess(
            isSignUp
              ? "\u2705 Account created successfully!"
              : "\u2705 Signed in successfully!"
          );
        // Clear form fields
        setEmail("");
        setPassword("");
        setFullName("");

        // Call the success callback after a brief delay to show the success message
        // and ensure authentication state is fully updated
        setTimeout(() => {
          if (onAuthSuccess) {
            onAuthSuccess();
          }
        }, 2000);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  if (authLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "1.5rem",
            padding: "2rem",
            minWidth: 350,
          }}
        >
          <div
            className="uswift-gradient"
            style={{ height: 8, borderRadius: 8, marginBottom: 24 }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                border: "2px solid #6D28D9",
                borderTop: "2px solid transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
            <p style={{ margin: 0, color: "#6D28D9", fontWeight: 600 }}>
              Initializing...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "1.5rem",
        padding: "2rem",
        minWidth: 350,
      }}
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
          textAlign: "center",
        }}
      >
        {isSignUp ? "Sign Up for Uswift" : "Sign In to Uswift"}
      </h2>

      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{
              width: "100%",
              marginBottom: 12,
              borderRadius: 8,
              border: "1px solid #E5E7EB",
              padding: 12,
              fontSize: "1rem",
              transition: "all 0.2s ease",
            }}
            required
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            marginBottom: 12,
            borderRadius: 8,
            border: "1px solid #E5E7EB",
            padding: 12,
            fontSize: "1rem",
            transition: "all 0.2s ease",
          }}
          required
        />

        {!isForgot && (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              marginBottom: 16,
              borderRadius: 8,
              border: "1px solid #E5E7EB",
              padding: 12,
              fontSize: "1rem",
              transition: "all 0.2s ease",
            }}
            required
          />
        )}

        {isForgot && (
          <div
            style={{ fontSize: "0.9rem", color: "#6B7280", marginBottom: 12 }}
          >
            Enter your email and we'll send a password reset link if an account
            exists.
          </div>
        )}

        {error && (
          <div
            style={{
              color: "#DC2626",
              fontSize: "0.9rem",
              marginBottom: 12,
              padding: "8px 12px",
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 6,
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              color: "#059669",
              fontSize: "0.9rem",
              marginBottom: 12,
              padding: "8px 12px",
              background: "#ECFDF5",
              border: "1px solid #A7F3D0",
              borderRadius: 6,
              animation: "fadeIn 0.3s ease-in",
            }}
          >
            {success}
            {pending && (
              <div
                style={{ fontSize: "0.85rem", color: "#065F46", marginTop: 8 }}
              >
                Verifying account... this may take a few seconds.
              </div>
            )}
            {!pending && success.includes("successfully") && (
              <div
                style={{ fontSize: "0.85rem", color: "#065F46", marginTop: 8 }}
              >
                Redirecting to dashboard...
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          className="uswift-btn"
          disabled={submitting}
          style={{
            width: "100%",
            marginBottom: 16,
            opacity: submitting ? 0.7 : 1,
            cursor: submitting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s ease",
          }}
        >
          {submitting && (
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
          )}
          {submitting
            ? isSignUp
              ? "Creating Account..."
              : "Signing In..."
            : isSignUp
            ? "Sign Up"
            : "Sign In"}
        </button>

        <div style={{ textAlign: "center", marginTop: 8 }}>
          {!isForgot ? (
            <button
              type="button"
              onClick={() => {
                setIsForgot(true);
                setError("");
                setSuccess("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#6D28D9",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Forgot password?
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsForgot(false);
                setError("");
                setSuccess("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#6D28D9",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Back to sign in
            </button>
          )}
        </div>
      </form>

      <p style={{ textAlign: "center", color: "#4B5563" }}>
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError("");
            setSuccess("");
          }}
          style={{
            background: "none",
            border: "none",
            color: "#6D28D9",
            textDecoration: "underline",
            cursor: "pointer",
            fontSize: "inherit",
            transition: "color 0.2s ease",
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.color = "#5B21B6";
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.currentTarget.style.color = "#6D28D9";
          }}
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </p>
    </div>
  );
}
