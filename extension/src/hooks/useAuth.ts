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
        // Extract user info from the result
        const user = { id: result.user?.id || "user", email: email };
        setUser(user);
        return { user, error: null };
      } else if (result.error) {
        throw new Error(result.error);
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
        const user = { id: result.user?.id || "user", email: email };
        setUser(user);
        return { user, error: null };
      } else if (result.error) {
        throw new Error(result.error);
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
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };
}
