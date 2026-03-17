import { describe, expect, it, vi, afterEach } from "vitest";

describe("supabaseClient reset password", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("includes redirect_to in recover payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({}),
      text: vi.fn().mockResolvedValue(""),
    });
    vi.stubGlobal("fetch", fetchMock);

    (window as any).SUPABASE_CONFIG = {
      url: "https://example.supabase.co",
      anonKey: "anon-key",
      passwordResetRedirectUrl: "https://uswift-ai.vercel.app/auth/reset-password",
    };

    const { getSupabaseClient } = await import("./supabaseClient");
    const client = getSupabaseClient();
    expect(client).toBeTruthy();

    await client!.resetPassword("person@example.com");

    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.email).toBe("person@example.com");
    expect(body.redirect_to).toBe(
      "https://uswift-ai.vercel.app/auth/reset-password"
    );
  });
});
