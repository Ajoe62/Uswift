"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase may append the recovery token as a query param or inside the
    // URL fragment (hash) depending on configuration. Check both.
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
    setMessage("");

    if (!password || password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (token) {
        // Try to set the session with the token so updateUser works
        // setSession accepts access_token and refresh_token; refresh_token can be empty
        const { error: setErr } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: "",
        } as any);
        if (setErr) {
          // If setSession failed, try direct REST call using the recovery token
          console.warn("setSession failed:", setErr.message);
          try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
            const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
            if (!supabaseUrl) throw new Error("Missing Supabase URL");

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
              setMessage(errMsg || "Failed to reset password");
              setLoading(false);
              return;
            }

            setMessage("Password updated. Redirecting to sign in...");
            setTimeout(() => router.push("/auth/signin"), 1400);
            return;
          } catch (restErr: any) {
            console.error("REST password update failed:", restErr);
            setMessage(restErr?.message || "Failed to reset password");
            setLoading(false);
            return;
          }
        }

        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
          setMessage(error.message || "Failed to reset password");
          setLoading(false);
          return;
        }

        setMessage("Password updated. Redirecting to sign in...");
        setTimeout(() => router.push("/auth/signin"), 1400);
        return;
      }

      // No token: attempt to update via current session
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(error.message || "Failed to update password");
      } else {
        setMessage("Password updated successfully.");
        setTimeout(() => router.push("/auth/signin"), 1200);
      }
    } catch (err: any) {
      setMessage(err?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto mt-16 p-8 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-uswift-navy">Reset password</h1>
      <p className="text-sm text-gray-600 mb-4">Create a new password for your account.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e: any) => setPassword(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e: any) => setConfirm(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update password"}
        </Button>
      </form>
      {message && <div className="mt-4 text-center text-uswift-accent">{message}</div>}
      {!token && (
        <div className="mt-4 text-sm text-gray-500">
          If you reached this page without a reset link, request a password reset from the
          sign-in page.
        </div>
      )}
    </main>
  );
}
