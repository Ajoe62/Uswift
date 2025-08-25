// Minimal Supabase client singleton for extension (TypeScript)
// - Uses Vite env variables when available: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
// - Falls back to window.SUPABASE_CONFIG (for existing workflows)
// - Provides getSupabaseClient() to return the singleton instance

type SupabaseConfig = {
  url: string;
  anonKey: string;
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
          const refreshed = await this.tryRefresh();
          if (refreshed) {
            const retry = await fetch(`${this.config.url}/auth/v1/user`, {
              method: "GET",
              headers: {
                apikey: this.config.anonKey,
                Authorization: `Bearer ${this.authToken}`,
              },
              mode: "cors",
            });
            if (retry.ok) return await retry.json();
            const rtxt = await retry.text().catch(() => "");
            console.warn("getUser retry failed", retry.status, rtxt);
            return {
              error: {
                status: retry.status,
                message: `HTTP ${retry.status}`,
                payload: rtxt,
              },
            };
          }
        }

        console.warn("getUser HTTP error", res.status, txt);
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
    if (!refreshToken) return false;
    try {
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
        return true;
      }
    } catch (e) {
      // ignore
    }
    await this.clearSession();
    this.authToken = null;
    return false;
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

  async resetPassword(email: string) {
    try {
      const res = await fetch(`${this.config.url}/auth/v1/recover`, {
        method: "POST",
        headers: {
          apikey: this.config.anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
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
      return await res.json();
    } catch (err: any) {
      throw new Error(err?.message || String(err));
    }
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
