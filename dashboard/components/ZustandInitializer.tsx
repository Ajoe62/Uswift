'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function ZustandInitializer() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    // Initialize auth state when the app loads
    initializeAuth();
  }, [initializeAuth]);

  // This component doesn't render anything
  return null;
}