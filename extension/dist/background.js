chrome.runtime.onInstalled.addListener(() => {
  console.log("Job Board Auto-Apply extension installed.");
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "APPLY_JOB") {
    sendResponse({ status: "queued" });
  }
});
