"use client";

import { AuthProvider as AuthProviderBase } from "../lib/contexts/AuthContext";

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProviderBase>{children}</AuthProviderBase>;
}
