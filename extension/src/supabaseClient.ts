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
    const res = await fetch(
      `${this.config.url}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          apikey: this.config.anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      }
    );
    const data = await res.json();
    if (data.access_token) {
      this.authToken = data.access_token;
      await this.saveSession(data);
    }
    return data;
  }

  async signUp(email: string, password: string, options: any = {}) {
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
    });
    const data = await res.json();
    if (data.access_token) {
      this.authToken = data.access_token;
      await this.saveSession(data);
    }
    return data;
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
      });

      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
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
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) throw new Error(`Supabase error ${res.status}`);
    return res.json();
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
