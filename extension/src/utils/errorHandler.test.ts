import { describe, expect, it } from "vitest";
import {
  getFriendlyErrorMessage,
  isRecoverableError,
  requiresUserAction,
  validateProfile,
} from "./errorHandler";

describe("errorHandler utilities", () => {
  it("returns expected message for known error code", () => {
    const response = getFriendlyErrorMessage("NO_ACTIVE_TAB");
    expect(response.code).toBe("NO_ACTIVE_TAB");
    expect(response.message).toContain("No active tab found");
  });

  it("validates profile and reports missing required fields", () => {
    const result = validateProfile({
      firstName: "Ada",
      lastName: "",
      email: "ada@example.com",
      phone: "",
      resume: "",
    });

    expect(result.valid).toBe(false);
    expect(result.missing).toEqual(["lastName", "phone", "resume"]);
  });

  it("classifies recoverable and user-action errors", () => {
    expect(isRecoverableError("NETWORK_ERROR")).toBe(true);
    expect(requiresUserAction("CAPTCHA_DETECTED")).toBe(true);
    expect(isRecoverableError("PERMISSION_DENIED")).toBe(false);
  });
});
