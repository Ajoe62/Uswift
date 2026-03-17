import React from "react";
import { AutoApplyStatus } from "../types/popup";

interface AutoApplyPanelProps {
  autoStatus: AutoApplyStatus | null;
  onAutoApply: () => void;
}

export default function AutoApplyPanel({
  autoStatus,
  onAutoApply,
}: AutoApplyPanelProps) {
  return (
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
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
          }}
        >
          <span style={{ fontSize: "1.2rem", color: "white" }}>A</span>
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
        onClick={onAutoApply}
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
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(59, 130, 246, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
        }}
      >
        Start Auto-Apply
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
                  Advanced auto-apply in progress
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
                <span>Success</span>
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
                <span>Auto-apply failed</span>
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
              {autoStatus.session?.errors && autoStatus.session.errors.length > 0 && (
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
                  {autoStatus.session.errors.slice(0, 3).map((error, index) => (
                    <div key={index} style={{ marginBottom: "2px" }}>
                      - {error}
                    </div>
                  ))}
                  {autoStatus.session.errors.length > 3 && (
                    <div>
                      ... and {autoStatus.session.errors.length - 3} more
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={onAutoApply}
                style={{
                  background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
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
                Retry Auto-Apply
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
