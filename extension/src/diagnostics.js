// Diagnostic script to check extension configuration and functionality
// Run this in the browser console to diagnose issues

(function () {
  console.log("🔍 USwift Extension Diagnostics");
  console.log("=================================");

  // Check configuration
  console.log("\n1. Configuration Check:");
  if (typeof window !== "undefined" && window.EXTENSION_CONFIG) {
    const config = window.EXTENSION_CONFIG;

    console.log("✅ Extension config found");
    console.log(
      "   Supabase URL:",
      config.supabase?.url ? "✅ Configured" : "❌ Missing"
    );
    console.log(
      "   Mistral API Key:",
      config.mistral?.apiKey &&
        config.mistral.apiKey !== "your-mistral-api-key-here"
        ? "✅ Configured"
        : "❌ Missing/Not configured"
    );
    console.log(
      "   Mistral Base URL:",
      config.mistral?.baseUrl || "❌ Missing"
    );

    if (config.mistral?.apiKey === "your-mistral-api-key-here") {
      console.error("🚨 CRITICAL: Mistral API key not configured!");
      console.log(
        "   📝 Fix: Set VITE_MISTRAL_API_KEY in extension/.env or set mistral.apiKey in extension/public/config.js"
      );
      console.log("   🔗 Get key from: https://mistral.ai/");
    }
  } else {
    console.error("❌ Extension config not found");
    console.log("   📝 Fix: Ensure config.js is loaded properly");
  }

  // Check network connectivity
  console.log("\n2. Network Connectivity:");
  fetch("https://api.mistral.ai/v1/models", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      console.log("✅ Mistral API reachable:", response.status);
    })
    .catch((error) => {
      console.error("❌ Mistral API unreachable:", error.message);
    });

  // Check Chrome extension APIs
  console.log("\n3. Chrome Extension APIs:");
  if (typeof chrome !== "undefined") {
    console.log("✅ Chrome APIs available");

    if (chrome.storage) {
      console.log("   ✅ Storage API available");
    } else {
      console.error("   ❌ Storage API missing");
    }

    if (chrome.tabs) {
      console.log("   ✅ Tabs API available");
    } else {
      console.error("   ❌ Tabs API missing");
    }

    if (chrome.runtime) {
      console.log("   ✅ Runtime API available");
    } else {
      console.error("   ❌ Runtime API missing");
    }
  } else {
    console.error("❌ Chrome APIs not available");
  }

  // Test Mistral client initialization
  console.log("\n4. Mistral Client Test:");
  try {
    // This would normally be imported, but we'll simulate the check
    if (
      window.EXTENSION_CONFIG?.mistral?.apiKey &&
      window.EXTENSION_CONFIG.mistral.apiKey !== "your-mistral-api-key-here"
    ) {
      console.log("✅ Mistral client should initialize correctly");
    } else {
      console.error("❌ Mistral client will fail due to missing API key");
    }
  } catch (e) {
    console.error("❌ Mistral client test failed:", e.message);
  }

  console.log("\n=================================");
  console.log("🔧 Diagnostics complete!");
  console.log("📋 Check the errors above and fix any ❌ issues");
  console.log("📖 See README.md for detailed setup instructions");
})();
