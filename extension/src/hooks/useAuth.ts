// Authentication hook for React components
import { useState, useEffect } from 'react';

// Extend window interface for TypeScript
declare global {
  interface Window {
    supabase: any;
  }
}

interface User {
  id: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load existing session
    const loadUser = async () => {
      try {
        if (typeof window !== 'undefined' && window.supabase) {
          const currentUser = await window.supabase.getUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    // Wait a bit for supabase to initialize
    setTimeout(loadUser, 500);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      if (!window.supabase) {
        throw new Error('Supabase not initialized');
      }
      const { user, error } = await window.supabase.signIn(email, password);
      if (error) throw error;
      setUser(user);
      return { user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  };

  const signUp = async (email: string, password: string, metadata = {}) => {
    try {
      if (!window.supabase) {
        throw new Error('Supabase not initialized');
      }
      const { user, error } = await window.supabase.signUp(email, password, metadata);
      if (error) throw error;
      setUser(user);
      return { user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  };

  const signOut = async () => {
    try {
      if (window.supabase) {
        await window.supabase.signOut();
      }
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user
  };
}
