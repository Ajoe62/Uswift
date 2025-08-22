// Entry point for Chrome extension background tasks
chrome.runtime.onInstalled.addListener(() => {
  console.log("Job Board Auto-Apply extension installed.");
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "APPLY_JOB") {
    // TODO: Trigger backend API call to queue job application
    sendResponse({ status: "queued" });
  }
});

// Initialize supabase client in background (if configured)
try {
  // dynamic import to avoid window references in worker context when not needed
  import("./supabaseClient")
    .then(({ getSupabaseClient }) => {
      try {
        getSupabaseClient();
      } catch (e) {
        console.warn("Supabase background init skipped:", e);
      }
    })
    .catch(() => {});
} catch (e) {
  /* ignore */
}
