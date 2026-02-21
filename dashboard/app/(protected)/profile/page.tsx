'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ProfilePage() {
  const [session, setSession] = useState<any>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data?.session ?? null);
    }
    load();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  if (!session) {
    return null; 
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: 'auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#111827' }}>
          Uswift Profile
        </h1>
        <button 
          onClick={() => supabase.auth.signOut()} 
          style={{ 
            padding: '8px 16px', 
            background: '#fee2e2', 
            color: '#b91c1c', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: '600' 
          }}
        >
          Sign Out
        </button>
      </header>
      <main style={{ marginTop: '2rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>Account Details</h2>
          <p style={{ color: '#374151' }}><strong>Email:</strong> {session.user.email}</p>
          <p style={{ color: '#374151', wordBreak: 'break-all' }}><strong>User ID:</strong> {session.user.id}</p>
        </div>
      </main>
    </div>
  );
}