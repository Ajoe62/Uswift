import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import FeaturePageShell from "./FeaturePageShell";

describe("FeaturePageShell", () => {
  it("renders children and triggers callbacks", () => {
    const onBack = vi.fn();
    const onSignOut = vi.fn();

    render(
      <FeaturePageShell onBack={onBack} onSignOut={onSignOut}>
        <div>Inner content</div>
      </FeaturePageShell>
    );

    expect(screen.getByText("Inner content")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "<- Back" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign Out" }));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
