"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Component that uses useSearchParams (needs to be wrapped in Suspense)
function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getTokenFromHash = () => {
      try {
        if (typeof window === "undefined") return null;
        const hash = window.location.hash; // e.g. #access_token=...&type=recovery
        if (!hash) return null;
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        return params.get("access_token") || params.get("token");
      } catch (e) {
        return null;
      }
    };

    const accessToken =
      searchParams?.get("access_token") || 
      searchParams?.get("token") || 
      getTokenFromHash() || 
      null;
    setToken(accessToken);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!password || password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    if (!token) {
      setMessage("No recovery token found. Request a password reset from the sign-in page.");
      return;
    }

    setLoading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");

      const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const errMsg = body?.error_description || body?.message || `${res.status} ${res.statusText}`;
        throw new Error(errMsg || "Failed to reset password");
      }

      setMessage("Password updated. Redirecting to sign in...");
      setTimeout(() => router.push("/auth/signin"), 1100);
    } catch (err: any) {
      setMessage(err?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto mt-16 p-8 bg-white/95 rounded-xl shadow-lg">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold mb-2 text-gray-900">Reset your password</h1>
        <p className="text-sm text-gray-600">Enter a new password to restore access to your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">New password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-uswift-accent"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Confirm password</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-uswift-accent"
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-uswift-accent text-white px-4 py-2 font-semibold hover:brightness-95 disabled:opacity-60"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>

      {message && <div className="mt-4 text-center text-uswift-accent">{message}</div>}

      {!token && (
        <div className="mt-4 text-sm text-gray-500">
          If you opened this page directly, request a password reset from the sign-in page.
        </div>
      )}
    </main>
  );
}

// Loading fallback component
function ResetPasswordLoading() {
  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white/95 rounded-xl shadow-lg animate-pulse">
      <div className="mb-6 text-center">
        <div className="h-8 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
      </div>
      <div className="grid gap-4">
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-10 bg-gray-300 rounded"></div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}