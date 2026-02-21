'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Minimal local stub for useAuthStore to avoid missing-module error in this file.
// Replace this with your real store implementation or restore the alias import.
const useAuthStore = () => {
  // session can be typed more specifically if available
  return { session: null as any, isLoading: false };
};

const LoadingSpinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f9fafb' }}>
    <div style={{
      width: 40, height: 40, border: '4px solid #e5e7eb',
      borderTop: '4px solid #6d28d9', borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <style jsx>{`
      @keyframes spin { to { transform: rotate(360deg); } }
    `}</style>
  </div>
);

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/');
    }
  }, [session, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (session) {
    return <>{children}</>;
  }

  return <LoadingSpinner />;
}