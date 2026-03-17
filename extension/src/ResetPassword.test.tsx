import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ResetPassword from "./ResetPassword";
import { getSupabaseClient } from "./supabaseClient";

vi.mock("./supabaseClient", () => ({
  getSupabaseClient: vi.fn(),
}));

describe("ResetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates password from recovery link tokens", async () => {
    const updatePassword = vi
      .fn()
      .mockResolvedValue({ ok: true, message: "Password updated successfully." });

    vi.mocked(getSupabaseClient).mockReturnValue({
      updatePassword,
    } as any);

    window.history.pushState(
      {},
      "",
      "/home#access_token=abc123&refresh_token=ref123&expires_at=1773010424&expires_in=3600&token_type=bearer&type=recovery"
    );

    render(<ResetPassword />);

    fireEvent.change(screen.getByPlaceholderText("New password"), {
      target: { value: "NewPassword123!" },
    });
    fireEvent.change(screen.getByPlaceholderText("Confirm new password"), {
      target: { value: "NewPassword123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));

    await waitFor(() => {
      expect(updatePassword).toHaveBeenCalledWith(
        "NewPassword123!",
        expect.objectContaining({
          accessToken: "abc123",
          refreshToken: "ref123",
          expiresAt: 1773010424,
          expiresIn: 3600,
          tokenType: "bearer",
        })
      );
    });

    expect(
      screen.getByText("Password updated successfully.")
    ).toBeInTheDocument();
  });

  it("shows invalid-link state when access token is missing", () => {
    vi.mocked(getSupabaseClient).mockReturnValue({
      updatePassword: vi.fn(),
    } as any);

    window.history.pushState({}, "", "/auth/reset-password");
    render(<ResetPassword />);

    expect(
      screen.getByText(/This password reset link is invalid or expired/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Update Password" })
    ).not.toBeInTheDocument();
  });

  it("shows an expired-link message from Supabase error hashes", () => {
    vi.mocked(getSupabaseClient).mockReturnValue({
      updatePassword: vi.fn(),
    } as any);

    window.history.pushState(
      {},
      "",
      "/home#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired"
    );
    render(<ResetPassword />);

    expect(
      screen.getByText(/This password reset link has expired/i)
    ).toBeInTheDocument();
  });
});
