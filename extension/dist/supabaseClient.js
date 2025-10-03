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
        return {
          ok: true,
          user: data.user || null,
          access_token: data.access_token
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
        return {
          ok: true,
          user: data.user || null,
          access_token: data.access_token
        };
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
          console.log("Token expired, attempting refresh...");
          const refreshed = await this.tryRefresh();
          if (refreshed) {
            console.log("Token refreshed successfully, retrying getUser...");
            const retry = await fetch(`${this.config.url}/auth/v1/user`, {
              method: "GET",
              headers: {
                apikey: this.config.anonKey,
                Authorization: `Bearer ${this.authToken}`
              },
              mode: "cors"
            });
            if (retry.ok) {
              const userData = await retry.json();
              console.log("getUser succeeded after token refresh");
              return userData;
            }
            const rtxt = await retry.text().catch(() => "");
            console.warn("getUser retry failed", retry.status, rtxt);
            return null;
          } else {
            console.warn("Token refresh failed, user needs to re-login");
            await this.clearSession();
            return null;
          }
        }
        console.warn("getUser HTTP error", res.status, payload);
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
    if (!refreshToken) {
      console.log("No refresh token available");
      return false;
    }
    try {
      console.log("Attempting token refresh...");
      const res = await fetch(
        `${this.config.url}/auth/v1/token?grant_type=refresh_token`,
        {
          method: "POST",
          headers: {
            apikey: this.config.anonKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
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
        console.log("Token refresh successful");
        return true;
      } else {
        console.warn("Token refresh failed:", data);
      }
    } catch (e) {
      console.error("Token refresh error:", e);
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
        return {
          ok: true,
          message: data?.message || "If an account exists, a password reset email has been sent."
        };
      }
      return {
        ok: false,
        error: {
          status: res.status,
          message: data?.error || data?.message || `HTTP ${res.status}`,
          payload: data
        }
      };
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
    const url = typeof import.meta !== "undefined" && {"VITE_MISTRAL_API_KEY":"","VITE_MISTRAL_BASE_URL":"https://api.mistral.ai","VITE_SUPABASE_URL":"","VITE_SUPABASE_ANON_KEY":"","VITE_BACKEND_API_URL":"","VITE_SENTRY_DSN":"","VITE_ANALYTICS_ID":"","VITE_DEBUG_MODE":false,"VITE_ENABLE_AUTO_APPLY":"true","VITE_ENABLE_AI_FEATURES":"true","VITE_ENABLE_FILE_UPLOADS":"true","VITE_ENABLE_CLOUD_SYNC":"true","VITE_AI_RATE_LIMIT":"10","VITE_AUTO_APPLY_RATE_LIMIT":"20","VITE_USER_NODE_ENV":"development","BASE_URL":"/","MODE":"production","DEV":true,"PROD":false,"SSR":false} && "" || window.SUPABASE_CONFIG?.url;
    const anonKey = typeof import.meta !== "undefined" && {"VITE_MISTRAL_API_KEY":"","VITE_MISTRAL_BASE_URL":"https://api.mistral.ai","VITE_SUPABASE_URL":"","VITE_SUPABASE_ANON_KEY":"","VITE_BACKEND_API_URL":"","VITE_SENTRY_DSN":"","VITE_ANALYTICS_ID":"","VITE_DEBUG_MODE":false,"VITE_ENABLE_AUTO_APPLY":"true","VITE_ENABLE_AI_FEATURES":"true","VITE_ENABLE_FILE_UPLOADS":"true","VITE_ENABLE_CLOUD_SYNC":"true","VITE_AI_RATE_LIMIT":"10","VITE_AUTO_APPLY_RATE_LIMIT":"20","VITE_USER_NODE_ENV":"development","BASE_URL":"/","MODE":"production","DEV":true,"PROD":false,"SSR":false} && "" || window.SUPABASE_CONFIG?.anonKey || window.SUPABASE_CONFIG?.ANON_KEY;
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
