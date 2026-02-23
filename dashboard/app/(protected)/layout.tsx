'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

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
      router.push('/auth/signin');
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
