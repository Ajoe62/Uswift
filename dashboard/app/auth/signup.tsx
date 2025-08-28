import { useState, ChangeEvent, FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

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
    <main className="max-w-md mx-auto mt-16 p-8 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-uswift-navy">Sign Up</h1>

      <form onSubmit={handlers.onSubmit} className="flex flex-col gap-4">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={handlers.onEmailChange}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={handlers.onPasswordChange}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Signing up..." : "Sign Up"}
        </Button>
      </form>

      {message && (
        <div className="mt-4 text-center text-uswift-accent">{message}</div>
      )}
      <div className="mt-6 text-center">
        <a href="/auth/signin" className="text-uswift-blue hover:underline">
          Already have an account?
        </a>
      </div>
    </main>
  );
}
