"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setMessage(error.message);
    else setMessage("Password reset email sent!");
    setLoading(false);
  }

  return (
    <main className="max-w-md mx-auto mt-16 p-8 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-uswift-navy">
        Forgot Password
      </h1>
      <form onSubmit={handleReset} className="flex flex-col gap-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setEmail(e.target.value)
          }
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Email"}
        </Button>
      </form>
      {message && (
        <div className="mt-4 text-center text-uswift-accent">{message}</div>
      )}
      <div className="mt-6 text-center">
        <a href="/auth/signin" className="text-uswift-blue hover:underline">
          Back to Sign In
        </a>
      </div>
    </main>
  );
}
