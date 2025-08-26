// Authentication hook for React components
import { useState, useEffect } from "react";
import { getSupabaseClient } from "../supabaseClient";

// Extend window interface for TypeScript
declare global {
  interface Window {
    supabase: any;
    supabaseClient: any;
  }
}

interface User {
  id: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    // Load existing session
  const loadUser = async () => {
      try {
        // Get supabase client using our singleton
        const supabase = getSupabaseClient();
        if (supabase) {
          const currentUser = await supabase.getUser();
          if (currentUser) {
            setUser(currentUser);
          }
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setLoading(false);
      }
    };

    // Try immediate load, then fallback with delay
    loadUser().catch(() => {
      // If immediate load fails, try again after config loads
      setTimeout(loadUser, 300);
    });
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase not initialized");
      }
      const result = await supabase.signIn(email, password);
      if (result.access_token) {
        // token present, mark pending and poll for user for a short time
        setPending(true);
        // poll up to 6 times over 3s
        for (let i = 0; i < 6; i++) {
          const userProfile = await supabase.getUser();
          if (userProfile) {
            setUser(userProfile);
            setPending(false);
            return { user: userProfile, error: null };
          }
          await new Promise((r) => setTimeout(r, 500));
        }
        setPending(false);
        return { user: null, error: "Signed in but verification timed out" };
      } else if (result.error) {
        return { user: null, error: result.error };
      }
      return { user: null, error: "Sign in failed" };
    } catch (error) {
      return { user: null, error };
    }
  };

  const signUp = async (email: string, password: string, metadata = {}) => {
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase not initialized");
      }
      // Use the signUp method from the client
      const result = await supabase.signUp(email, password, metadata);
      if (result.access_token) {
        setPending(true);
        for (let i = 0; i < 6; i++) {
          const userProfile = await supabase.getUser();
          if (userProfile) {
            setUser(userProfile);
            setPending(false);
            return { user: userProfile, error: null };
          }
          await new Promise((r) => setTimeout(r, 500));
        }
        setPending(false);
        return { user: null, error: "Signed up but verification timed out" };
      } else if (result.error) {
        return { user: null, error: result.error };
      }
      return { user: null, error: "Sign up failed" };
    } catch (error) {
      return { user: null, error };
    }
  };

  const signOut = async () => {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.signOut();
      }
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return {
    user,
    loading,
  pending,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };
}
