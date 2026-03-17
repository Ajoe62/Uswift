export interface RecoveryParams {
  accessToken: string | null;
  refreshToken: string | null;
  type: string | null;
  tokenType: string | null;
  expiresAt: number | null;
  expiresIn: number | null;
  error: string | null;
  errorCode: string | null;
  errorDescription: string | null;
}

function toNullableNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseRecoveryParams(hash: string): RecoveryParams {
  const cleanHash = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(cleanHash);

  return {
    accessToken: params.get("access_token"),
    refreshToken: params.get("refresh_token"),
    type: params.get("type"),
    tokenType: params.get("token_type"),
    expiresAt: toNullableNumber(params.get("expires_at")),
    expiresIn: toNullableNumber(params.get("expires_in")),
    error: params.get("error"),
    errorCode: params.get("error_code"),
    errorDescription: params.get("error_description"),
  };
}

function normalizePath(pathname: string): string {
  if (!pathname) return "/";
  const normalized = pathname.replace(/\/+$/, "") || "/";
  return normalized.toLowerCase();
}

function isResetPasswordPath(pathname: string): boolean {
  const normalized = normalizePath(pathname);
  return (
    normalized === "/reset-password" ||
    normalized === "/auth/reset-password" ||
    normalized.endsWith("/reset-password")
  );
}

function isLegacyPasswordResetPath(pathname: string): boolean {
  return normalizePath(pathname) === "/home";
}

function hasRecoveryError(params: RecoveryParams): boolean {
  const description = (params.errorDescription || "").toLowerCase();
  return (
    params.errorCode === "otp_expired" ||
    description.includes("email link is invalid or has expired")
  );
}

export function isRecoveryRoute(
  pathname: string,
  hash: string,
  search: string = ""
): boolean {
  const params = parseRecoveryParams(hash);
  const searchParams = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  );

  if (isResetPasswordPath(pathname)) return true;
  if (searchParams.get("mode") === "recovery") return true;
  if (searchParams.get("flow") === "password-reset") return true;
  if (params.type === "recovery" && !!params.accessToken) return true;
  if (!!params.accessToken) return true;
  if (isLegacyPasswordResetPath(pathname) && hasRecoveryError(params)) return true;

  return false;
}
