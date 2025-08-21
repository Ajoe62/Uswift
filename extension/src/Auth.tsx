import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import './index.css';

export default function Auth() {
  const { signIn, signUp, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      let result;
      if (isSignUp) {
        result = await signUp(email, password, { full_name: fullName });
      } else {
        result = await signIn(email, password);
      }

      if (result.error) {
        let errorMessage = 'An error occurred';
        if (typeof result.error === 'string') {
          errorMessage = result.error;
        } else if (result.error && typeof result.error === 'object') {
          errorMessage = (result.error as any).message || result.error.toString();
        }
        setError(errorMessage);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#FFFFFF', borderRadius: '1.5rem', padding: '2rem', minWidth: 350 }}>
      <div className="uswift-gradient" style={{ height: 8, borderRadius: 8, marginBottom: 24 }} />
      
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111827', marginBottom: 16, textAlign: 'center' }}>
        {isSignUp ? 'Sign Up for Uswift' : 'Sign In to Uswift'}
      </h2>

      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            style={{ width: '100%', marginBottom: 12, borderRadius: 8, border: '1px solid #E5E7EB', padding: 12 }}
            required
          />
        )}
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', marginBottom: 12, borderRadius: 8, border: '1px solid #E5E7EB', padding: 12 }}
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', marginBottom: 16, borderRadius: 8, border: '1px solid #E5E7EB', padding: 12 }}
          required
        />

        {error && (
          <p style={{ color: '#DC2626', fontSize: '0.9rem', marginBottom: 12 }}>{error}</p>
        )}

        <button type="submit" className="uswift-btn" style={{ width: '100%', marginBottom: 16 }}>
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>

      <p style={{ textAlign: 'center', color: '#4B5563' }}>
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          style={{ background: 'none', border: 'none', color: '#6D28D9', textDecoration: 'underline', cursor: 'pointer' }}
        >
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
}
