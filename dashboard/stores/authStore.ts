import { create } from 'zustand';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/auth-helpers-nextjs';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  initializeAuth: () => void;
  initializeSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,
  isInitialized: false,

  initializeAuth: () => {
    if (useAuthStore.getState().isInitialized) {
      return;
    }

    const supabase = createClientComponentClient();
    set({ isInitialized: true });

    // Listen for auth state changes
    supabase.auth.onAuthStateChange(
      (event, session) => {
        set({ session, isLoading: false });
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, isLoading: false });
    });
  },

  initializeSession: () => {
    useAuthStore.getState().initializeAuth();
  },
}));
