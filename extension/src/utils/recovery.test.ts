import { describe, expect, it } from "vitest";
import { isRecoveryRoute, parseRecoveryParams } from "./recovery";

describe("recovery helpers", () => {
  it("parses recovery hash parameters", () => {
    const parsed = parseRecoveryParams(
      "#access_token=abc123&refresh_token=xyz789&type=recovery&expires_at=1773010424&expires_in=3600&token_type=bearer"
    );

    expect(parsed.accessToken).toBe("abc123");
    expect(parsed.refreshToken).toBe("xyz789");
    expect(parsed.type).toBe("recovery");
    expect(parsed.tokenType).toBe("bearer");
    expect(parsed.expiresAt).toBe(1773010424);
    expect(parsed.expiresIn).toBe(3600);
    expect(parsed.error).toBeNull();
    expect(parsed.errorCode).toBeNull();
    expect(parsed.errorDescription).toBeNull();
  });

  it("detects recovery route from hash or reset path", () => {
    expect(
      isRecoveryRoute("/home", "#type=recovery&access_token=token123")
    ).toBe(true);
    expect(isRecoveryRoute("/reset-password", "")).toBe(true);
    expect(isRecoveryRoute("/auth/reset-password", "")).toBe(true);
    expect(
      isRecoveryRoute(
        "/home",
        "#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired"
      )
    ).toBe(true);
    expect(isRecoveryRoute("/home", "", "?mode=recovery")).toBe(true);
    expect(isRecoveryRoute("/home", "#type=magiclink")).toBe(false);
  });
});
