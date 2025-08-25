class SupabaseClient {
  config;
  authToken = null;
  constructor(config) {
    this.config = config;
  }
  async signIn(email, password) {
    try {
      const res = await fetch(
        `${this.config.url}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            apikey: this.config.anonKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email, password }),
          // ensure CORS mode for clarity (host_permissions should allow this)
          mode: "cors"
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
            data.expires_at = Date.now() + data.expires_in * 1e3;
        } catch {
        }
        await this.saveSession(data);
        return { ok: true, user: data.user || null, access_token: data.access_token };
      }
      const errObj = {
        status: res.status,
        message: data?.error || data?.message || data?.msg || `HTTP ${res.status}`,
        payload: data
      };
      return { ok: false, error: errObj };
    } catch (err) {
      return { ok: false, error: { message: err?.message || String(err) } };
    }
  }
  async signUp(email, password, options = {}) {
    try {
      const res = await fetch(`${this.config.url}/auth/v1/signup`, {
        method: "POST",
        headers: {
          apikey: this.config.anonKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password,
          data: options
        }),
        mode: "cors"
      });
      const data = await res.json().catch(async () => {
        const txt = await res.text().catch(() => "");
        return { error: `HTTP ${res.status} - ${txt}` };
      });
      if (res.ok && data && data.access_token) {
        this.authToken = data.access_token;
        try {
          if (data.expires_in)
            data.expires_at = Date.now() + data.expires_in * 1e3;
        } catch {
        }
        await this.saveSession(data);
        return { ok: true, user: data.user || null, access_token: data.access_token };
      }
      if (res.ok && data && data.user && !data.access_token) {
        try {
          await this.saveSession({ user: data.user });
        } catch {
        }
        return {
          ok: true,
          user: data.user,
          message: data?.message || "Account created. Please check your email to confirm your account."
        };
      }
      const errObj = {
        status: res.status,
        message: data?.error || data?.message || data?.msg || `HTTP ${res.status}`,
        payload: data
      };
      return { ok: false, error: errObj };
    } catch (err) {
      return { ok: false, error: { message: err?.message || String(err) } };
    }
  }
  async getUser() {
    if (!this.authToken) {
      const session = await this.loadSession();
      if (!session || !session.access_token)
        return null;
      this.authToken = session.access_token;
    }
    try {
      const res = await fetch(`${this.config.url}/auth/v1/user`, {
        method: "GET",
        headers: {
          apikey: this.config.anonKey,
          Authorization: `Bearer ${this.authToken}`
        },
        mode: "cors"
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        let payload = txt;
        try {
          payload = txt ? JSON.parse(txt) : txt;
        } catch (e) {
        }
        if (res.status === 401 || res.status === 403 || /expired|bad_jwt|invalid token/i.test(txt)) {
          const refreshed = await this.tryRefresh();
          if (refreshed) {
            const retry = await fetch(`${this.config.url}/auth/v1/user`, {
              method: "GET",
              headers: {
                apikey: this.config.anonKey,
                Authorization: `Bearer ${this.authToken}`
              },
              mode: "cors"
            });
            if (retry.ok)
              return await retry.json();
            const rtxt = await retry.text().catch(() => "");
            console.warn("getUser retry failed", retry.status, rtxt);
            return { error: { status: retry.status, message: `HTTP ${retry.status}`, payload: rtxt } };
          }
        }
        console.warn("getUser HTTP error", res.status, txt);
        const msg = payload && (payload.error || payload.message || payload.msg) || `HTTP ${res.status}`;
        return { error: { status: res.status, message: msg, payload } };
      }
      return await res.json();
    } catch (error) {
      console.error("Error getting user:", error?.message || error);
      return null;
    }
  }
  async tryRefresh() {
    const session = await this.loadSession();
    const refreshToken = session?.refresh_token;
    if (!refreshToken)
      return false;
    try {
      const res = await fetch(`${this.config.url}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: {
          apikey: this.config.anonKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        mode: "cors"
      });
      const data = await res.json().catch(async () => {
        const txt = await res.text().catch(() => "");
        return { error: `HTTP ${res.status} - ${txt}` };
      });
      if (res.ok && data && data.access_token) {
        this.authToken = data.access_token;
        try {
          if (data.expires_in)
            data.expires_at = Date.now() + data.expires_in * 1e3;
        } catch {
        }
        await this.saveSession(data);
        return true;
      }
    } catch (e) {
    }
    await this.clearSession();
    this.authToken = null;
    return false;
  }
  async signOut() {
    if (!this.authToken)
      return;
    await fetch(`${this.config.url}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: this.config.anonKey,
        Authorization: `Bearer ${this.authToken}`
      }
    });
    this.authToken = null;
    await this.clearSession();
  }
  async resetPassword(email) {
    try {
      const res = await fetch(`${this.config.url}/auth/v1/recover`, {
        method: "POST",
        headers: {
          apikey: this.config.anonKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email }),
        mode: "cors"
      });
      const data = await res.json().catch(async () => {
        const txt = await res.text().catch(() => "");
        return { error: `HTTP ${res.status} - ${txt}` };
      });
      if (res.ok) {
        return { ok: true, message: data?.message || "If an account exists, a password reset email has been sent." };
      }
      return { ok: false, error: { status: res.status, message: data?.error || data?.message || `HTTP ${res.status}`, payload: data } };
    } catch (err) {
      return { ok: false, error: { message: err?.message || String(err) } };
    }
  }
  async saveSession(session) {
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set(
          { supabase_session: session },
          () => resolve()
        );
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
        chrome.storage.local.get(
          ["supabase_session"],
          (result) => {
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
        } catch {
        }
        resolve(null);
      }
    });
  }
  async clearSession() {
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.remove(
          ["supabase_session"],
          () => resolve()
        );
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
      apikey: this.config.anonKey,
      "Content-Type": "application/json",
      ...options.headers || {}
    };
    if (this.authToken)
      headers["Authorization"] = `Bearer ${this.authToken}`;
    try {
      const res = await fetch(url, { ...options, headers, mode: "cors" });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Supabase error ${res.status}: ${txt}`);
      }
      return await res.json();
    } catch (err) {
      throw new Error(err?.message || String(err));
    }
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
    console.warn(
      "Supabase configuration missing: set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY or window.SUPABASE_CONFIG"
    );
    return null;
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
