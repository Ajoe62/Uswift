import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import AutoApplyPanel from "./AutoApplyPanel";

describe("AutoApplyPanel", () => {
  it("renders base state and triggers auto-apply callback", () => {
    const onAutoApply = vi.fn();

    render(<AutoApplyPanel autoStatus={null} onAutoApply={onAutoApply} />);

    fireEvent.click(screen.getByRole("button", { name: "Start Auto-Apply" }));
    expect(onAutoApply).toHaveBeenCalledTimes(1);
  });

  it("renders error status details when auto-apply fails", () => {
    render(
      <AutoApplyPanel
        onAutoApply={vi.fn()}
        autoStatus={{
          status: "error",
          message: "Something went wrong",
          session: {
            jobBoard: "linkedin",
            startTime: Date.now(),
            steps: [],
            errors: ["Failed to find form field", "Resume upload blocked"],
            success: false,
          },
        }}
      />
    );

    expect(screen.getByText("Auto-apply failed")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Issues detected:")).toBeInTheDocument();
    expect(screen.getByText("- Failed to find form field")).toBeInTheDocument();
  });
});
