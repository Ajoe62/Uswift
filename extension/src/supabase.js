// Supabase client for Chrome extension
class SupabaseClient {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.url;
    this.apiKey = config.anonKey;
    this.authToken = null;
  }

  // Helper method to make authenticated requests
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}/rest/v1/${endpoint}`;
    const headers = {
      'apikey': this.apiKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Authentication methods
  async signUp(email, password, metadata = {}) {
    const response = await fetch(`${this.baseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'apikey': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        data: metadata
      })
    });

    const data = await response.json();
    if (data.access_token) {
      this.authToken = data.access_token;
      await this.saveSession(data);
    }
    return data;
  }

  async signIn(email, password) {
    const response = await fetch(`${this.baseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await response.json();
    if (data.access_token) {
      this.authToken = data.access_token;
      await this.saveSession(data);
    }
    return data;
  }

  async signOut() {
    await fetch(`${this.baseUrl}/auth/v1/logout`, {
      method: 'POST',
      headers: {
        'apikey': this.apiKey,
        'Authorization': `Bearer ${this.authToken}`
      }
    });

    this.authToken = null;
    await this.clearSession();
  }

  async getUser() {
    if (!this.authToken) return null;

    const response = await fetch(`${this.baseUrl}/auth/v1/user`, {
      headers: {
        'apikey': this.apiKey,
        'Authorization': `Bearer ${this.authToken}`
      }
    });

    return response.json();
  }

  // Session management
  async saveSession(session) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ supabase_session: session }, resolve);
    });
  }

  async loadSession() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['supabase_session'], (result) => {
        if (result.supabase_session) {
          this.authToken = result.supabase_session.access_token;
        }
        resolve(result.supabase_session);
      });
    });
  }

  async clearSession() {
    return new Promise((resolve) => {
      chrome.storage.local.remove(['supabase_session'], resolve);
    });
  }

  // Database operations
  async from(table) {
    return new SupabaseTable(this, table);
  }

  // Storage operations
  async uploadFile(bucket, path, file) {
    const formData = new FormData();
    formData.append('', file);

    const response = await fetch(`${this.baseUrl}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers: {
        'apikey': this.apiKey,
        'Authorization': `Bearer ${this.authToken}`
      },
      body: formData
    });

    return response.json();
  }

  async deleteFile(bucket, path) {
    const response = await fetch(`${this.baseUrl}/storage/v1/object/${bucket}/${path}`, {
      method: 'DELETE',
      headers: {
        'apikey': this.apiKey,
        'Authorization': `Bearer ${this.authToken}`
      }
    });

    return response.json();
  }

  getPublicUrl(bucket, path) {
    return `${this.baseUrl}/storage/v1/object/public/${bucket}/${path}`;
  }
}

// Table operations class
class SupabaseTable {
  constructor(client, table) {
    this.client = client;
    this.table = table;
    this.query = {
      select: '*',
      filters: [],
      order: null,
      limit: null
    };
  }

  select(columns = '*') {
    this.query.select = columns;
    return this;
  }

  eq(column, value) {
    this.query.filters.push(`${column}=eq.${encodeURIComponent(value)}`);
    return this;
  }

  neq(column, value) {
    this.query.filters.push(`${column}=neq.${encodeURIComponent(value)}`);
    return this;
  }

  in(column, values) {
    this.query.filters.push(`${column}=in.(${values.map(v => encodeURIComponent(v)).join(',')})`);
    return this;
  }

  order(column, ascending = true) {
    this.query.order = `${column}.${ascending ? 'asc' : 'desc'}`;
    return this;
  }

  limit(count) {
    this.query.limit = count;
    return this;
  }

  async execute() {
    let endpoint = `${this.table}?select=${this.query.select}`;
    
    if (this.query.filters.length > 0) {
      endpoint += '&' + this.query.filters.join('&');
    }
    
    if (this.query.order) {
      endpoint += `&order=${this.query.order}`;
    }
    
    if (this.query.limit) {
      endpoint += `&limit=${this.query.limit}`;
    }

    return this.client.makeRequest(endpoint);
  }

  async insert(data) {
    return this.client.makeRequest(this.table, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async update(data) {
    let endpoint = this.table;
    if (this.query.filters.length > 0) {
      endpoint += '?' + this.query.filters.join('&');
    }

    return this.client.makeRequest(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async delete() {
    let endpoint = this.table;
    if (this.query.filters.length > 0) {
      endpoint += '?' + this.query.filters.join('&');
    }

    return this.client.makeRequest(endpoint, {
      method: 'DELETE'
    });
  }
}

// Initialize Supabase client
let supabase;

// Initialize when config is available
if (typeof window !== 'undefined' && window.SUPABASE_CONFIG) {
  supabase = new SupabaseClient(window.SUPABASE_CONFIG);
  // Load existing session on initialization
  supabase.loadSession();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SupabaseClient, SupabaseTable };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.SupabaseClient = SupabaseClient;
  window.supabase = supabase;
}
