"use client";

import { AuthProvider } from "@/lib/contexts/AuthContext";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

