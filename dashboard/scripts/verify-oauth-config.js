const fs = require("fs");
const path = require("path");

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    env[key] = value;
  }
  return env;
}

function deriveSupabaseCallbackUrl(supabaseUrl) {
  if (!supabaseUrl) return null;
  try {
    const url = new URL(supabaseUrl);
    return `${url.origin}/auth/v1/callback`;
  } catch {
    return null;
  }
}

const envPath = path.join(process.cwd(), ".env.local");
const env = readEnvFile(envPath);
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseCallback = deriveSupabaseCallbackUrl(supabaseUrl);

console.log("OAuth Config Verification (dashboard)");
console.log("-----------------------------------");
console.log(`Env file: ${envPath}`);
console.log(`NEXT_PUBLIC_SUPABASE_URL: ${env.NEXT_PUBLIC_SUPABASE_URL ? "present" : "missing"}`);
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "present" : "missing"}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${env.SUPABASE_SERVICE_ROLE_KEY ? "present" : "missing (optional for frontend)"}`);
console.log("");
console.log("Expected Google Authorized JavaScript origins:");
console.log(" - http://localhost:3000");
console.log(" - https://uswift-dashboard.vercel.app");
console.log("");
console.log("Expected Google Authorized redirect URIs:");
console.log(" - http://localhost:3000/auth/callback");
console.log(" - https://uswift-dashboard.vercel.app/auth/callback");
if (supabaseCallback) {
  console.log(` - ${supabaseCallback}`);
} else {
  console.log(" - <unable to derive Supabase callback URL because NEXT_PUBLIC_SUPABASE_URL is missing/invalid>");
}
console.log("");
if (!supabaseCallback) {
  console.log("WARNING: Fix NEXT_PUBLIC_SUPABASE_URL before testing OAuth.");
  process.exitCode = 1;
}

