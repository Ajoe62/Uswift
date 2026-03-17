import React, { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "./supabaseClient";
import { parseRecoveryParams } from "./utils/recovery";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const recovery = useMemo(
    () =>
      parseRecoveryParams(
        typeof window !== "undefined" ? window.location.hash : ""
      ),
    []
  );

  const invalidLinkMessage = useMemo(() => {
    if (recovery.errorCode === "otp_expired") {
      return "This password reset link has expired. Request a new reset email from the sign-in page.";
    }

    if (recovery.errorDescription) {
      return `Password reset could not be verified: ${recovery.errorDescription}.`;
    }

    return "This password reset link is invalid or expired. Request a new reset email from the sign-in page.";
  }, [recovery.errorCode, recovery.errorDescription]);

  useEffect(() => {
    // Remove recovery tokens from the URL after capture.
    if (
      typeof window !== "undefined" &&
      recovery.accessToken &&
      window.location.hash
    ) {
      window.history.replaceState(
        {},
        document.title,
        `${window.location.pathname}${window.location.search}`
      );
    }
  }, [recovery.accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!recovery.accessToken) {
      setError("Recovery token is missing. Open the latest reset link again.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase is not configured. Contact support.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await supabase.updatePassword(password, {
        accessToken: recovery.accessToken,
        refreshToken: recovery.refreshToken || undefined,
        expiresAt: recovery.expiresAt || undefined,
        expiresIn: recovery.expiresIn || undefined,
        tokenType: recovery.tokenType || undefined,
      });

      if (result?.ok) {
        setSuccess(
          result.message ||
            "Password updated successfully. You can now sign in with the new password."
        );
        setPassword("");
        setConfirmPassword("");
      } else {
        setError(result?.error?.message || "Failed to reset password.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to reset password.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasToken = !!recovery.accessToken;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        background: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 20px 35px rgba(15, 23, 42, 0.08)",
          padding: "1.5rem",
        }}
      >
        <h1
          style={{
            margin: "0 0 0.5rem 0",
            fontSize: "1.3rem",
            color: "#111827",
          }}
        >
          Reset Your Password
        </h1>
        <p style={{ margin: "0 0 1rem 0", fontSize: "0.92rem", color: "#4b5563" }}>
          Enter a new password for your USwift account.
        </p>

        {!hasToken && (
          <div
            style={{
              color: "#b91c1c",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "0.75rem",
              fontSize: "0.9rem",
            }}
          >
            {invalidLinkMessage}
          </div>
        )}

        {hasToken && (
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              style={{
                width: "100%",
                marginBottom: 12,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: 12,
                fontSize: "0.95rem",
                boxSizing: "border-box",
              }}
              required
            />

            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              style={{
                width: "100%",
                marginBottom: 12,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: 12,
                fontSize: "0.95rem",
                boxSizing: "border-box",
              }}
              required
            />

            {error && (
              <div
                style={{
                  color: "#b91c1c",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 8,
                  padding: "0.65rem",
                  fontSize: "0.85rem",
                  marginBottom: 10,
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                style={{
                  color: "#065f46",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  borderRadius: 8,
                  padding: "0.65rem",
                  fontSize: "0.85rem",
                  marginBottom: 10,
                }}
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 9999,
                padding: "0.75rem 1rem",
                background: "linear-gradient(90deg, #1cb5e0 0%, #000851 100%)",
                color: "#fff",
                fontWeight: 700,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
