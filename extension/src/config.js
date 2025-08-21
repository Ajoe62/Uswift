// Supabase configuration for Chrome extension
const SUPABASE_CONFIG = {
  url: 'https://sigoorxtktxtbcneodux.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpZ29vcnh0a3R4dGJjbmVvZHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NzMwOTMsImV4cCI6MjA3MTA0OTA5M30.x1e1_9GNoNtQUF4EPYlSAf0HWfrwUzQAuwiWTnMhbN8'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SUPABASE_CONFIG;
}

// Make available globally for Chrome extension
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
