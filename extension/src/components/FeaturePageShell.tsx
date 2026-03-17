import React, { ReactNode } from "react";

interface FeaturePageShellProps {
  onBack: () => void;
  onSignOut: () => void;
  children: ReactNode;
}

export default function FeaturePageShell({
  onBack,
  onSignOut,
  children,
}: FeaturePageShellProps) {
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
        <button className="uswift-btn" onClick={onBack}>
          {"<- Back"}
        </button>
        <button
          onClick={onSignOut}
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
      {children}
    </div>
  );
}
