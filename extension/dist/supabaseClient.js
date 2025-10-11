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
      if (session.expires_at && session.expires_at < Date.now() + 6e4) {
        console.log("🔄 Token expiring soon, refreshing proactively...");
        await this.tryRefresh();
      }
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
          console.log("🔐 Token expired, attempting automatic refresh...");
          const refreshed = await this.tryRefresh();
          if (refreshed) {
            console.log("✅ Token refreshed, retrying user fetch...");
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
              console.log("✅ User authenticated successfully");
              return userData;
            }
            const rtxt = await retry.text().catch(() => "");
            console.log("⚠️ Authentication failed after refresh:", retry.status);
            if (retry.status === 401 || retry.status === 403) {
              await this.clearSession();
            }
            return null;
          } else {
            console.log("ℹ️ Session expired - please sign in again");
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
        console.log("✅ Token refreshed successfully");
        return true;
      } else {
        console.log("⚠️ Token refresh unsuccessful:", data?.error || "Unknown error");
        return false;
      }
    } catch (e) {
      console.log("⚠️ Token refresh network error:", e);
      return false;
    }
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
      const contentLength = res.headers.get("content-length");
      if (contentLength === "0" || res.status === 204) {
        return null;
      }
      const text = await res.text();
      if (!text || text.trim() === "") {
        return null;
      }
      return JSON.parse(text);
    } catch (err) {
      throw new Error(err?.message || String(err));
    }
  }
  // Query builder API for Supabase-style queries
  from(tableName) {
    return new QueryBuilder(this, tableName);
  }
}
class QueryBuilder {
  client;
  tableName;
  selectFields = "*";
  filters = [];
  limitValue;
  singleResult = false;
  constructor(client, tableName) {
    this.client = client;
    this.tableName = tableName;
  }
  select(fields = "*") {
    this.selectFields = fields;
    return this;
  }
  eq(column, value) {
    this.filters.push(`${column}=eq.${encodeURIComponent(value)}`);
    return this;
  }
  limit(count) {
    this.limitValue = count;
    return this;
  }
  single() {
    this.singleResult = true;
    return this;
  }
  async upsert(data, options = {}) {
    const headers = {
      Prefer: "resolution=merge-duplicates"
    };
    if (options.onConflict) {
      headers["Prefer"] = `resolution=merge-duplicates,on_conflict=${options.onConflict}`;
    }
    try {
      const result = await this.client.makeRequest(this.tableName, {
        method: "POST",
        headers,
        body: JSON.stringify(data)
      });
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
  async insert(data) {
    try {
      const result = await this.client.makeRequest(this.tableName, {
        method: "POST",
        body: JSON.stringify(data)
      });
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
  async update(data) {
    let endpoint = this.tableName;
    if (this.filters.length > 0) {
      endpoint += "?" + this.filters.join("&");
    }
    try {
      const result = await this.client.makeRequest(endpoint, {
        method: "PATCH",
        body: JSON.stringify(data)
      });
      return { data: result, error: null };
    } catch (error) {
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
        method: "DELETE"
      });
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
  async executeQuery() {
    let endpoint = `${this.tableName}?select=${this.selectFields}`;
    if (this.filters.length > 0) {
      endpoint += "&" + this.filters.join("&");
    }
    if (this.limitValue) {
      endpoint += `&limit=${this.limitValue}`;
    }
    const headers = {};
    if (this.singleResult) {
      headers["Accept"] = "application/vnd.pgrst.object+json";
    }
    try {
      const result = await this.client.makeRequest(endpoint, { headers });
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }
  // Make QueryBuilder thenable so it can be awaited
  then(onfulfilled, onrejected) {
    return this.executeQuery().then(onfulfilled, onrejected);
  }
}
let singleton = null;
function resolveConfig() {
  try {
    const url = typeof import.meta !== "undefined" && {"VITE_MISTRAL_API_KEY":"","VITE_MISTRAL_BASE_URL":"https://api.mistral.ai","VITE_MISTRAL_CHAT_API_URL":"https://api.mistral.ai/v1/chat/completions","VITE_MISTRAL_FILES_API_URL":"https://api.mistral.ai/v1/files","VITE_MISTRAL_EMBEDDINGS_API_URL":"https://api.mistral.ai/v1/embeddings","VITE_MISTRAL_PROXY_URL":"http://localhost:3000/api/mistral","VITE_SUPABASE_URL":"","VITE_SUPABASE_ANON_KEY":"","BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false,"VITE_BACKEND_API_URL":"","VITE_DEBUG_MODE":false} && "" || window.SUPABASE_CONFIG?.url;
    const anonKey = typeof import.meta !== "undefined" && {"VITE_MISTRAL_API_KEY":"","VITE_MISTRAL_BASE_URL":"https://api.mistral.ai","VITE_MISTRAL_CHAT_API_URL":"https://api.mistral.ai/v1/chat/completions","VITE_MISTRAL_FILES_API_URL":"https://api.mistral.ai/v1/files","VITE_MISTRAL_EMBEDDINGS_API_URL":"https://api.mistral.ai/v1/embeddings","VITE_MISTRAL_PROXY_URL":"http://localhost:3000/api/mistral","VITE_SUPABASE_URL":"","VITE_SUPABASE_ANON_KEY":"","BASE_URL":"/","MODE":"production","DEV":false,"PROD":true,"SSR":false,"VITE_BACKEND_API_URL":"","VITE_DEBUG_MODE":false} && "" || window.SUPABASE_CONFIG?.anonKey || window.SUPABASE_CONFIG?.ANON_KEY;
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
