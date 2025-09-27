"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/contexts/AuthContext";
import Button from "@/components/ui/Button";
import CTAButton from "@/components/ui/CTAButton";
import Input from "@/components/ui/Input";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await signIn(email, password);
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Signed in successfully!");
      router.push("/dashboard");
    }
    setLoading(false);
  }

  // Added: Google sign in handler
  async function handleGoogleSignIn() {
    setLoading(true);
    setMessage("");
    const { error } = await import("../../../lib/supabaseClient").then(({ supabase }) =>
      supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/dashboard" },
      })
    );
    if (error) setMessage(error.message);
    setLoading(false);
  }

  return (
    <main className="max-w-md mx-auto mt-8 sm:mt-16 p-4 sm:p-8 bg-white rounded shadow">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-uswift-navy">Sign In</h1>
      <form onSubmit={handleSignIn} className="flex flex-col gap-3 sm:gap-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setPassword(e.target.value)
          }
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
      {/* Added: Google authentication button */}
      <div className="mt-4 flex flex-col items-center">
        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 text-white w-full"
        >
          {loading ? "Redirecting..." : "Sign In with Google"}
        </Button>
      </div>
      {message && (
        <div className="mt-4 text-center text-uswift-accent text-base sm:text-lg">
          {message}
        </div>
      )}
      <div className="mt-6 text-center">
        <a
          href="/auth/forgot-password"
          className="text-uswift-blue hover:underline text-base sm:text-lg"
        >
          Forgot password?
        </a>
        <br />
        <CTAButton
          href="/auth/signup"
          className="mt-2 inline-block px-4 py-2 text-base sm:text-lg"
        >
          Login to your account
        </CTAButton>
      </div>
    </main>
  );
}