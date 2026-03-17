// Minimal Supabase client singleton for extension (TypeScript)
// - Uses Vite env variables when available: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
// - Falls back to window.SUPABASE_CONFIG (for existing workflows)
// - Provides getSupabaseClient() to return the singleton instance

type SupabaseConfig = {
  url: string;
  anonKey: string;
};

type PasswordUpdateOptions = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  expiresIn?: number;
  tokenType?: string;
};

class SupabaseClient {
  config: SupabaseConfig;
  authToken: string | null = null;

  constructor(config: SupabaseConfig) {
    this.config = config;
  }

  async signIn(email: string, password: string) {
    try {
      const res = await fetch(
        `${this.config.url}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            apikey: this.config.anonKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
          // ensure CORS mode for clarity (host_permissions should allow this)
          mode: "cors",
        }
      );

      // If network-level failure, fetch will throw and be caught below
      const data = await res.json().catch(async () => {
        // If response is not JSON, return raw text
        const txt = await res.text().catch(() => "");
        return { error: `HTTP ${res.status} - ${txt}` };
      });

      // success with token
      if (res.ok && data && data.access_token) {
        this.authToken = data.access_token;
        try {
          if (data.expires_in)
            data.expires_at = Date.now() + data.expires_in * 1000;
        } catch {}
        await this.saveSession(data);
        return {
          ok: true,
          user: data.user || null,
          access_token: data.access_token,
        };
      }

      // case: sign-in failed or returned structured error
      const errObj = {
        status: res.status,
        message:
          data?.error || data?.message || data?.msg || `HTTP ${res.status}`,
        payload: data,
      };
      return { ok: false, error: errObj };
    } catch (err: any) {
      // Network or CORS error
      return { ok: false, error: { message: err?.message || String(err) } };
    }
  }

  async signUp(email: string, password: string, options: any = {}) {
    try {
      const res = await fetch(`${this.config.url}/auth/v1/signup`, {
        method: "POST",
        headers: {
          apikey: this.config.anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          data: options,
        }),
        mode: "cors",
      });

      const data = await res.json().catch(async () => {
        const txt = await res.text().catch(() => "");
        return { error: `HTTP ${res.status} - ${txt}` };
      });

      // success with token
      if (res.ok && data && data.access_token) {
        this.authToken = data.access_token;
        try {
          if (data.expires_in)
            data.expires_at = Date.now() + data.expires_in * 1000;
        } catch {}
        await this.saveSession(data);
        return {
          ok: true,
          user: data.user || null,
          access_token: data.access_token,
        };
      }

      // success but no token (common when email confirmation is required)
      if (res.ok && data && data.user && !data.access_token) {
        // Persist a minimal session if available
        try {
          await this.saveSession({ user: data.user });
        } catch {}
        return {
          ok: true,
          user: data.user,
          message:
            data?.message ||
            "Account created. Please check your email to confirm your account.",
        };
      }

      // failure
      const errObj = {
        status: res.status,
        message:
          data?.error || data?.message || data?.msg || `HTTP ${res.status}`,
        payload: data,
      };
      return { ok: false, error: errObj };
    } catch (err: any) {
      return { ok: false, error: { message: err?.message || String(err) } };
    }
  }

  async getUser() {
    if (!this.authToken) {
      // Try to load session first
      const session = await this.loadSession();
      if (!session || !session.access_token) return null;
      this.authToken = session.access_token;

      // Check if token is about to expire and refresh proactively
      if (session.expires_at && session.expires_at < Date.now() + 60000) {
        console.log("🔄 Token expiring soon, refreshing proactively...");
        await this.tryRefresh();
      }
    }

    try {
      const res = await fetch(`${this.config.url}/auth/v1/user`, {
        method: "GET",
        headers: {
          apikey: this.config.anonKey,
          Authorization: `Bearer ${this.authToken}`,
        },
        mode: "cors",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        // parse payload if JSON
        let payload: any = txt;
        try {
          payload = txt ? JSON.parse(txt) : txt;
        } catch (e) {
          // leave payload as raw text
        }

        // try to refresh token on auth errors
        if (
          res.status === 401 ||
          res.status === 403 ||
          /expired|bad_jwt|invalid token/i.test(txt)
        ) {
          console.log("🔐 Token expired, attempting automatic refresh...");
          const refreshed = await this.tryRefresh();
          if (refreshed) {
            console.log("✅ Token refreshed, retrying user fetch...");
            const retry = await fetch(`${this.config.url}/auth/v1/user`, {
              method: "GET",
              headers: {
                apikey: this.config.anonKey,
                Authorization: `Bearer ${this.authToken}`,
              },
              mode: "cors",
            });
            if (retry.ok) {
              const userData = await retry.json();
              console.log("✅ User authenticated successfully");
              return userData;
            }
            const rtxt = await retry.text().catch(() => "");
            console.log("⚠️ Authentication failed after refresh:", retry.status);
            // Only clear session if we're absolutely sure it's invalid
            if (retry.status === 401 || retry.status === 403) {
              await this.clearSession();
            }
            return null;
          } else {
            console.log("ℹ️ Session expired - please sign in again");
            // Don't clear session immediately - allow retry on next load
            return null;
          }
        }

        console.warn("getUser HTTP error", res.status, payload);
        const msg =
          (payload && (payload.error || payload.message || payload.msg)) ||
          `HTTP ${res.status}`;
        return { error: { status: res.status, message: msg, payload } };
      }
      return await res.json();
    } catch (error: any) {
      console.error("Error getting user:", error?.message || error);
      return null;
    }
  }

  async tryRefresh() {
    // load session to get refresh token
    const session = await this.loadSession();
    const refreshToken = session?.refresh_token;
    if (!refreshToken) {
      console.log("No refresh token available - session may have expired");
      return false;
    }
    try {
      console.log("🔄 Refreshing authentication token...");
      const res = await fetch(
        `${this.config.url}/auth/v1/token?grant_type=refresh_token`,
        {
          method: "POST",
          headers: {
            apikey: this.config.anonKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
          mode: "cors",
        }
      );
      const data = await res.json().catch(async () => {
        const txt = await res.text().catch(() => "");
        return { error: `HTTP ${res.status} - ${txt}` };
      });
      if (res.ok && data && data.access_token) {
        this.authToken = data.access_token;
        try {
          if (data.expires_in)
            data.expires_at = Date.now() + data.expires_in * 1000;
        } catch {}
        await this.saveSession(data);
        console.log("✅ Token refreshed successfully");
        return true;
      } else {
        console.log("⚠️ Token refresh unsuccessful:", data?.error || "Unknown error");
        // Don't clear session immediately - might be temporary network issue
        return false;
      }
    } catch (e) {
      console.log("⚠️ Token refresh network error:", e);
      // Don't clear session on network errors
      return false;
    }
  }

  async signOut() {
    if (!this.authToken) return;
    await fetch(`${this.config.url}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: this.config.anonKey,
        Authorization: `Bearer ${this.authToken}`,
      },
    });
    this.authToken = null;
    await this.clearSession();
  }

  async updatePassword(newPassword: string, options: PasswordUpdateOptions = {}) {
    const accessToken = options.accessToken || this.authToken;
    if (!accessToken) {
      return {
        ok: false,
        error: { message: "Missing recovery session. Open the reset email link again." },
      };
    }

    this.authToken = accessToken;
    try {
      if (options.accessToken) {
        const session: any = {
          access_token: options.accessToken,
          refresh_token: options.refreshToken,
          token_type: options.tokenType || "bearer",
        };
        if (typeof options.expiresAt === "number") {
          session.expires_at = options.expiresAt * 1000;
        } else if (typeof options.expiresIn === "number") {
          session.expires_in = options.expiresIn;
          session.expires_at = Date.now() + options.expiresIn * 1000;
        }
        await this.saveSession(session);
      }

      const res = await fetch(`${this.config.url}/auth/v1/user`, {
        method: "PUT",
        headers: {
          apikey: this.config.anonKey,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
        mode: "cors",
      });

      const data = await res.json().catch(async () => {
        const txt = await res.text().catch(() => "");
        return { error: `HTTP ${res.status} - ${txt}` };
      });

      if (res.ok) {
        return {
          ok: true,
          user: data || null,
          message: "Password updated successfully.",
        };
      }

      return {
        ok: false,
        error: {
          status: res.status,
          message: data?.error || data?.message || `HTTP ${res.status}`,
          payload: data,
        },
      };
    } catch (err: any) {
      return { ok: false, error: { message: err?.message || String(err) } };
    }
  }

  async resetPassword(email: string) {
    try {
      const redirectTo = resolvePasswordResetRedirectUrl();
      const payload: Record<string, string> = { email };
      if (redirectTo) payload.redirect_to = redirectTo;

      const res = await fetch(`${this.config.url}/auth/v1/recover`, {
        method: "POST",
        headers: {
          apikey: this.config.anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        mode: "cors",
      });

      const data = await res.json().catch(async () => {
        const txt = await res.text().catch(() => "");
        return { error: `HTTP ${res.status} - ${txt}` };
      });

      if (res.ok) {
        return {
          ok: true,
          message:
            data?.message ||
            "If an account exists, a password reset email has been sent.",
          redirectTo,
        };
      }

      return {
        ok: false,
        error: {
          status: res.status,
          message: data?.error || data?.message || `HTTP ${res.status}`,
          payload: data,
        },
      };
    } catch (err: any) {
      return { ok: false, error: { message: err?.message || String(err) } };
    }
  }

  async saveSession(session: any) {
    return new Promise<void>((resolve) => {
      if (
        typeof chrome !== "undefined" &&
        (chrome as any).storage &&
        (chrome as any).storage.local
      ) {
        (chrome as any).storage.local.set({ supabase_session: session }, () =>
          resolve()
        );
      } else {
        try {
          localStorage.setItem("supabase_session", JSON.stringify(session));
        } catch {}
        resolve();
      }
    });
  }

  async loadSession() {
    return new Promise<any>((resolve) => {
      if (
        typeof chrome !== "undefined" &&
        (chrome as any).storage &&
        (chrome as any).storage.local
      ) {
        (chrome as any).storage.local.get(
          ["supabase_session"],
          (result: any) => {
            if (result && result.supabase_session)
              this.authToken = result.supabase_session.access_token;
            resolve(result && result.supabase_session);
          }
        );
      } else {
        try {
          const v = localStorage.getItem("supabase_session");
          if (v) {
            const s = JSON.parse(v);
            this.authToken = s.access_token;
            resolve(s);
            return;
          }
        } catch {}
        resolve(null);
      }
    });
  }

  async clearSession() {
    return new Promise<void>((resolve) => {
      if (
        typeof chrome !== "undefined" &&
        (chrome as any).storage &&
        (chrome as any).storage.local
      ) {
        (chrome as any).storage.local.remove(["supabase_session"], () =>
          resolve()
        );
      } else {
        try {
          localStorage.removeItem("supabase_session");
        } catch {}
        resolve();
      }
    });
  }

  async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.config.url}/rest/v1/${endpoint}`;
    const headers: Record<string, string> = {
      apikey: this.config.anonKey,
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };
    if (this.authToken) headers["Authorization"] = `Bearer ${this.authToken}`;
    try {
      const res = await fetch(url, { ...options, headers, mode: "cors" });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Supabase error ${res.status}: ${txt}`);
      }

      // Handle empty responses (e.g., 204 No Content from upsert/delete)
      const contentLength = res.headers.get("content-length");
      if (contentLength === "0" || res.status === 204) {
        return null;
      }

      const text = await res.text();
      if (!text || text.trim() === "") {
        return null;
      }

      return JSON.parse(text);
    } catch (err: any) {
      throw new Error(err?.message || String(err));
    }
  }

  // Query builder API for Supabase-style queries
  from(tableName: string) {
    return new QueryBuilder(this, tableName);
  }
}

// Query builder class to support .from('table').select().eq() pattern
class QueryBuilder {
  private client: SupabaseClient;
  private tableName: string;
  private selectFields: string = "*";
  private filters: string[] = [];
  private limitValue?: number;
  private singleResult: boolean = false;

  constructor(client: SupabaseClient, tableName: string) {
    this.client = client;
    this.tableName = tableName;
  }

  select(fields: string = "*") {
    this.selectFields = fields;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push(`${column}=eq.${encodeURIComponent(value)}`);
    return this;
  }

  limit(count: number) {
    this.limitValue = count;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  async upsert(data: any, options: { onConflict?: string } = {}) {
    const headers: Record<string, string> = {
      Prefer: "resolution=merge-duplicates",
    };

    if (options.onConflict) {
      headers["Prefer"] = `resolution=merge-duplicates,on_conflict=${options.onConflict}`;
    }

    try {
      const result = await this.client.makeRequest(this.tableName, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async insert(data: any) {
    try {
      const result = await this.client.makeRequest(this.tableName, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async update(data: any) {
    let endpoint = this.tableName;
    if (this.filters.length > 0) {
      endpoint += "?" + this.filters.join("&");
    }

    try {
      const result = await this.client.makeRequest(endpoint, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  async delete() {
    let endpoint = this.tableName;
    if (this.filters.length > 0) {
      endpoint += "?" + this.filters.join("&");
    }

    try {
      const result = await this.client.makeRequest(endpoint, {
        method: "DELETE",
      });
      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  private async executeQuery() {
    let endpoint = `${this.tableName}?select=${this.selectFields}`;

    if (this.filters.length > 0) {
      endpoint += "&" + this.filters.join("&");
    }

    if (this.limitValue) {
      endpoint += `&limit=${this.limitValue}`;
    }

    const headers: Record<string, string> = {};
    if (this.singleResult) {
      headers["Accept"] = "application/vnd.pgrst.object+json";
    }

    try {
      const result = await this.client.makeRequest(endpoint, { headers });
      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  // Make QueryBuilder thenable so it can be awaited
  then(
    onfulfilled?: ((value: any) => any) | null,
    onrejected?: ((reason: any) => any) | null
  ) {
    return this.executeQuery().then(onfulfilled, onrejected);
  }
}

let singleton: SupabaseClient | null = null;

function resolveConfig(): SupabaseConfig | null {
  try {
    // @ts-ignore
    const url =
      (typeof import.meta !== "undefined" &&
        (import.meta as any).env &&
        (import.meta as any).env.VITE_SUPABASE_URL) ||
      (window as any).SUPABASE_CONFIG?.url;
    // @ts-ignore
    const anonKey =
      (typeof import.meta !== "undefined" &&
        (import.meta as any).env &&
        (import.meta as any).env.VITE_SUPABASE_ANON_KEY) ||
      (window as any).SUPABASE_CONFIG?.anonKey ||
      (window as any).SUPABASE_CONFIG?.ANON_KEY;
    if (url && anonKey) return { url, anonKey };
  } catch (e) {
    // ignore
  }
  return null;
}

function resolvePasswordResetRedirectUrl(): string | null {
  try {
    // @ts-ignore
    const envRedirect =
      typeof import.meta !== "undefined" &&
      (import.meta as any).env &&
      (import.meta as any).env.VITE_PASSWORD_RESET_REDIRECT_URL;
    if (envRedirect) return envRedirect;

    const runtimeRedirect =
      (window as any).SUPABASE_CONFIG?.passwordResetRedirectUrl ||
      (window as any).EXTENSION_CONFIG?.supabase?.passwordResetRedirectUrl;
    if (runtimeRedirect) return runtimeRedirect;

    if (typeof window !== "undefined") {
      if (window.location.protocol === "chrome-extension:") {
        return "https://uswift-ai.vercel.app/auth/reset-password";
      }
      return `${window.location.origin}/auth/reset-password`;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (singleton) return singleton;
  const cfg = resolveConfig();
  if (!cfg) {
    // don't throw here; return null so callers can decide what to do
    console.warn(
      "Supabase configuration missing: set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY or window.SUPABASE_CONFIG"
    );
    return null;
  }
  singleton = new SupabaseClient(cfg);
  // attempt to load saved session (don't await)
  singleton.loadSession().catch(() => {});
  // expose globally for legacy code
  try {
    (window as any).supabaseClient = singleton;
  } catch {}
  return singleton;
}

// auto-initialize in popup context if possible (safe no-op in service worker)
try {
  if (typeof window !== "undefined" && resolveConfig()) getSupabaseClient();
} catch (e) {
  console.error(e);
}
