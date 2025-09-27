"use client"; // Ensure this is a client component

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { supabase } from "../../../lib/supabaseClient";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else setMessage("Signup successful! Check your email for confirmation.");
    setLoading(false);
  }

  // Added: Google sign up handler
  async function handleGoogleSignUp() {
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/dashboard" }, // Redirect after login
    });
    if (error) setMessage(error.message);
    setLoading(false);
  }

  interface FormHandlers {
    onEmailChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onPasswordChange: (e: ChangeEvent<HTMLInputElement>) => void;
    onSubmit: (e: FormEvent) => Promise<void> | void;
  }

  const handlers: FormHandlers = {
    onEmailChange: (e) => setEmail(e.target.value),
    onPasswordChange: (e) => setPassword(e.target.value),
    onSubmit: handleSignUp,
  };

  return (
    <main className="max-w-md mx-auto mt-8 sm:mt-16 p-4 sm:p-8 bg-white rounded shadow">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-uswift-navy">Sign Up</h1>
      <form onSubmit={handlers.onSubmit} className="flex flex-col gap-3 sm:gap-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={handlers.onEmailChange}
          required
          className="text-gray-800 placeholder-gray-500" // Fixed: ensure input text and placeholder are visible
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={handlers.onPasswordChange}
          required
          className="text-gray-800 placeholder-gray-500" // Fixed: ensure input text and placeholder are visible
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Signing up..." : "Sign Up"}
        </Button>
      </form>

      {/* Added: Google authentication button */}
      <div className="mt-4 flex flex-col items-center">
        <Button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="bg-red-500 hover:bg-red-600 text-white w-full"
        >
          {loading ? "Redirecting..." : "Sign Up with Google"}
        </Button>
      </div>

      {message && (
        <div className="mt-4 text-center text-uswift-accent text-base sm:text-lg">
          {message}
        </div>
      )}
      <div className="mt-6 text-center">
        <a href="/auth/signin" className="text-uswift-blue hover:underline text-base sm:text-lg">
          Already have an account?
        </a>
      </div>
    </main>
  );
}