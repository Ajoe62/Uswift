import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Auth from "./Auth";
import { useAuth } from "./hooks/useAuth";

vi.mock("./hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

describe("Auth forgot-password flow", () => {
  it("submits email and calls resetPassword", async () => {
    const resetPassword = vi
      .fn()
      .mockResolvedValue({ error: null, message: "Reset link sent." });

    vi.mocked(useAuth).mockReturnValue({
      signIn: vi.fn(),
      signUp: vi.fn(),
      resetPassword,
      signOut: vi.fn(),
      refreshAuth: vi.fn(),
      user: null,
      loading: false,
      pending: false,
      isAuthenticated: false,
    });

    render(<Auth />);

    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    expect(
      screen.getByText(/Enter your email and we'll send a password reset link/i)
    ).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Password")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "person@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send Reset Link" }));

    await waitFor(() => {
      expect(resetPassword).toHaveBeenCalledWith("person@example.com");
    });
    expect(screen.getByText("Reset link sent.")).toBeInTheDocument();
  });
});
