class SupabaseClient {
  config;
  authToken = null;
  constructor(config) {
    this.config = config;
  }
  async signIn(email, password) {
    const res = await fetch(`${this.config.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "apikey": this.config.anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.access_token) {
      this.authToken = data.access_token;
      await this.saveSession(data);
    }
    return data;
  }
  async signOut() {
    if (!this.authToken)
      return;
    await fetch(`${this.config.url}/auth/v1/logout`, {
      method: "POST",
      headers: { "apikey": this.config.anonKey, "Authorization": `Bearer ${this.authToken}` }
    });
    this.authToken = null;
    await this.clearSession();
  }
  async saveSession(session) {
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ supabase_session: session }, () => resolve());
      } else {
        try {
          localStorage.setItem("supabase_session", JSON.stringify(session));
        } catch {
        }
        resolve();
      }
    });
  }
  async loadSession() {
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["supabase_session"], (result) => {
          if (result && result.supabase_session)
            this.authToken = result.supabase_session.access_token;
          resolve(result && result.supabase_session);
        });
      } else {
        try {
          const v = localStorage.getItem("supabase_session");
          if (v) {
            const s = JSON.parse(v);
            this.authToken = s.access_token;
            resolve(s);
            return;
          }
        } catch {
        }
        resolve(null);
      }
    });
  }
  async clearSession() {
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.remove(["supabase_session"], () => resolve());
      } else {
        try {
          localStorage.removeItem("supabase_session");
        } catch {
        }
        resolve();
      }
    });
  }
  async makeRequest(endpoint, options = {}) {
    const url = `${this.config.url}/rest/v1/${endpoint}`;
    const headers = {
      "apikey": this.config.anonKey,
      "Content-Type": "application/json",
      ...options.headers || {}
    };
    if (this.authToken)
      headers["Authorization"] = `Bearer ${this.authToken}`;
    const res = await fetch(url, { ...options, headers });
    if (!res.ok)
      throw new Error(`Supabase error ${res.status}`);
    return res.json();
  }
}
let singleton = null;
function resolveConfig() {
  try {
    const url = typeof import.meta !== "undefined" && {"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false} && ({}).VITE_SUPABASE_URL || window.SUPABASE_CONFIG?.url;
    const anonKey = typeof import.meta !== "undefined" && {"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false} && ({}).VITE_SUPABASE_ANON_KEY || window.SUPABASE_CONFIG?.anonKey || window.SUPABASE_CONFIG?.ANON_KEY;
    if (url && anonKey)
      return { url, anonKey };
  } catch (e) {
  }
  return null;
}
function getSupabaseClient() {
  if (singleton)
    return singleton;
  const cfg = resolveConfig();
  if (!cfg) {
    throw new Error("Supabase configuration missing: set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY or window.SUPABASE_CONFIG");
  }
  singleton = new SupabaseClient(cfg);
  singleton.loadSession().catch(() => {
  });
  try {
    window.supabaseClient = singleton;
  } catch {
  }
  return singleton;
}
try {
  if (typeof window !== "undefined" && resolveConfig())
    getSupabaseClient();
} catch (e) {
  console.error(e);
}

export { getSupabaseClient };
