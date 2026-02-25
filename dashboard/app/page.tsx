'use client';

import { useAuthStore } from '@/stores/authStore';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const LoadingSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f9fafb' }}>
    <div style={{ 
      width: 40, 
      height: 40, 
      border: '4px solid #e5e7eb', 
      borderTop: '4px solid #6d28d9', 
      borderRadius: '50%', 
      animation: 'spin 1s linear infinite' 
    }}></div>
    <style jsx>{`
      @keyframes spin { to { transform: rotate(360deg); } }
    `}</style>
  </div>
);

const SignInComponent = () => {
  const supabase = createClientComponentClient();
  
  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      },
    });
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: 'sans-serif', 
      textAlign: 'center', 
      padding: '2rem' 
    }}>
      <div style={{
        background: 'white',
        padding: '3rem',
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: '#111827',
          marginBottom: '0.5rem'
        }}>
          Welcome to Uswift
        </h1>
        <p style={{ 
          color: '#6b7280', 
          marginBottom: '2rem', 
          fontSize: '1rem' 
        }}>
          Sign in to continue to your dashboard
        </p>
        <button 
          onClick={handleGoogleSignIn} 
          style={{ 
            padding: '14px 28px', 
            fontSize: '16px', 
            background: '#6d28d9', 
            color: 'white', 
            border: 'none', 
            borderRadius: '10px', 
            cursor: 'pointer',
            fontWeight: '600',
            width: '100%',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#5b21b6'}
          onMouseOut={(e) => e.currentTarget.style.background = '#6d28d9'}
        >
          Sign In with Google
        </button>
      </div>
    </div>
  );
};

export default function HomePage() {
  const { session, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      const next = `/auth/callback?${params.toString()}`;
      router.replace(next);
      return;
    }

    // Redirect authenticated users to dashboard
    if (!isLoading && session) {
      console.log('User authenticated, redirecting to dashboard...');
      router.push('/dashboard');
    }
  }, [session, isLoading, router]);

  // Show loading while checking auth state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Show sign-in page if not authenticated
  if (!session) {
    return <SignInComponent />;
  }

  // Show loading while redirecting
  return <LoadingSpinner />;
}
