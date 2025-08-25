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
          // supabase.getUser may return an object with an 'error' property when it failed
          if (currentUser && !(currentUser as any).error) {
            setUser(currentUser as User);
          } else if ((currentUser as any)?.error) {
            console.warn(
              "loadUser - getUser error",
              (currentUser as any).error
            );
            // cleared or invalid session - ensure no stale user
            setUser(null);
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
    // Basic client-side validation
    if (!email || !password)
      return { user: null, error: "Please enter your email and password." };
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        return {
          user: null,
          error: "Auth service unavailable. Try again later.",
        };
      }
      const result: any = await supabase.signIn(email, password);
      if (result.ok) {
        // token present - poll for user up to 6 times
        setPending(true);
        for (let i = 0; i < 6; i++) {
          const userProfile = await supabase.getUser();
          if (userProfile && !(userProfile as any).error) {
            setUser(userProfile as User);
            setPending(false);
            return { user: userProfile, error: null };
          }
          // If getUser returned an error object, stop polling and surface the error
          if ((userProfile as any)?.error) {
            const e = (userProfile as any).error;
            setPending(false);
            // Map to friendly message
            const friendly =
              e?.message ||
              (e?.payload && JSON.stringify(e.payload)) ||
              "Authentication failed. Please sign in again.";
            return { user: null, error: friendly };
          }
          await new Promise((r) => setTimeout(r, 500));
        }
        setPending(false);
        return {
          user: null,
          error: "Signed in, but verification timed out. Please try again.",
        };
      }

      // Friendly mapping of common error messages
      if (result.error) {
        // Try to extract server payload for better messages
        const payload = result.error.payload;
        const rawMsg =
          result.error.message || result.error.msg || String(result.error);
        const candidate = (function extract() {
          if (!payload) return rawMsg;
          if (typeof payload === "string") return payload;
          if (Array.isArray(payload?.errors))
            return payload.errors.map((x: any) => x?.message || x).join("; ");
          return (
            payload?.error ||
            payload?.message ||
            payload?.msg ||
            JSON.stringify(payload)
          );
        })();
        const msg = candidate || rawMsg;
        if (/invalid/i.test(msg) || /password/i.test(msg))
          return { user: null, error: "Invalid email or password." };
        if (/not found|user not found/i.test(msg))
          return { user: null, error: "No account found for that email." };
        // fallback
        return {
          user: null,
          error: msg || "Sign in failed. Please try again.",
        };
      }
      return { user: null, error: "Sign in failed. Please try again." };
    } catch (error: any) {
      return {
        user: null,
        error: error?.message || "Sign in failed. Please try again.",
      };
    }
  };

  const signUp = async (email: string, password: string, metadata = {}) => {
    // Basic validation
    if (!email || !password)
      return { user: null, error: "Please enter an email and a password." };
    if (password.length < 6)
      return { user: null, error: "Password must be at least 6 characters." };
    try {
      const supabase = getSupabaseClient();
      if (!supabase)
        return {
          user: null,
          error: "Auth service unavailable. Try again later.",
        };
      const result: any = await supabase.signUp(email, password, metadata);
      if (result.ok) {
        // If user is returned without token, likely requires email confirmation
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
          return {
            user: null,
            error:
              "Account created, but verification timed out. Please check your email.",
          };
        }
        return {
          user: result.user || null,
          error: null,
          message:
            result.message || "Account created. Check your email to confirm.",
        };
      }

      if (result.error) {
        const payload = result.error.payload;
        const rawMsg =
          result.error.message || result.error.msg || String(result.error);
        const candidate = (function extract() {
          if (!payload) return rawMsg;
          if (typeof payload === "string") return payload;
          if (Array.isArray(payload?.errors))
            return payload.errors.map((x: any) => x?.message || x).join("; ");
          // Supabase/PostgREST sometimes returns details/hint
          if (payload?.details) return payload.details;
          return (
            payload?.error ||
            payload?.message ||
            payload?.msg ||
            JSON.stringify(payload)
          );
        })();
        const msg = candidate || rawMsg;
        // Map common server-side errors to friendly messages
        if (
          /invalid email/i.test(msg) ||
          (/email/i.test(msg) && /invalid/i.test(msg))
        )
          return { user: null, error: "Please provide a valid email address." };
        if (/password/i.test(msg) && /weak|short/i.test(msg))
          return {
            user: null,
            error: "Password is too weak. Try a longer password.",
          };
        if (/already exists|duplicate|user exists/i.test(msg))
          return {
            user: null,
            error: "An account with that email already exists. Try signing in.",
          };
        return {
          user: null,
          error: msg || "Sign up failed. Please try again.",
        };
      }
      return { user: null, error: "Sign up failed. Please try again." };
    } catch (error: any) {
      return {
        user: null,
        error: error?.message || "Sign up failed. Please try again.",
      };
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

  const resetPassword = async (email: string) => {
    if (!email) return { ok: false, error: "Please enter your email." };
    try {
      const supabase = getSupabaseClient();
      if (!supabase)
        return {
          ok: false,
          error: "Auth service unavailable. Try again later.",
        };
      const result: any = await supabase.resetPassword(email);
      if (result.ok) return { ok: true, message: result.message };
      if (result.error) {
        const msg =
          result.error.message ||
          JSON.stringify(result.error.payload || result.error);
        return { ok: false, error: msg };
      }
      return { ok: false, error: "Failed to request password reset." };
    } catch (error: any) {
      return {
        ok: false,
        error: error?.message || "Failed to request password reset.",
      };
    }
  };

  return {
    user,
    loading,
    pending,
    signIn,
    signUp,
    resetPassword,
    signOut,
    isAuthenticated: !!user,
  };
}
