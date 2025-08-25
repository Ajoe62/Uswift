import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Button from '../../components/ui/Button';
import CTAButton from '../../components/ui/CTAButton';
import Input from '../../components/ui/Input';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    else setMessage('Signed in successfully!');
    setLoading(false);
  }

  return (
    <main className="max-w-md mx-auto mt-16 p-8 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-uswift-navy">Sign In</h1>
      <form onSubmit={handleSignIn} className="flex flex-col gap-4">
  <Input type="email" placeholder="Email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required />
  <Input type="password" placeholder="Password" value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} required />
        <Button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</Button>
      </form>
  {message && <div className="mt-4 text-center text-uswift-accent">{message}</div>}
      <div className="mt-6 text-center">
    <a href="/auth/forgot-password" className="text-uswift-blue hover:underline">Forgot password?</a>
    <br />
  <CTAButton href="/auth/signup" className="mt-2 inline-block px-4 py-2 text-sm">Create an account</CTAButton>
      </div>
    </main>
  );
}
