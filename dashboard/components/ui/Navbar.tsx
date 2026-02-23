"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuthStore } from "@/stores/authStore";
import CTAButton from "@/components/ui/CTAButton";

export default function Navbar() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // Added: state for hamburger menu
  const session = useAuthStore((state) => state.session);
  const supabase = createClientComponentClient();
  const user = session?.user ?? null;

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false); // Close menu on sign out
  };

  return (
    <nav className="w-full py-4 px-4 sm:px-8 flex justify-between items-center bg-white border-b border-gray-200 text-gray-900 relative shadow-sm">
      {/* Logo with icon - Hydration safe */}
      <div className="flex items-center gap-3">
        {isLoaded ? (
          <img
            src="/icons/icon128.png"
            alt="Uswift Logo"
            width="32"
            height="32"
            className="rounded object-contain"
            onError={(e) => {
              e.currentTarget.src = "/icon128.png";
            }}
          />
        ) : (
          // Server-safe placeholder
          <div className="w-8 h-8 bg-transparent rounded" />
        )}
        {/* <span className="font-bold text-xl text-uswift-accent">Uswift</span> */}
      </div>

      {/* Hamburger Icon - mobile only */}
      <button
        className="sm:hidden flex items-center p-2"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Open menu"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Navigation links - hidden on mobile, flex on tablet/desktop */}
      <div className="hidden sm:flex space-x-6 items-center">
        <Link href="/" className="text-gray-700 hover:text-uswift-primary transition-colors" prefetch={true}>
          Home
        </Link>
        <Link href="/features" className="text-gray-700 hover:text-uswift-primary transition-colors" prefetch={true}>
          Features
        </Link>
        <Link href="/pricing" className="text-gray-700 hover:text-uswift-primary transition-colors" prefetch={true}>
          Pricing
        </Link>
        {user ? (
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-700 hover:text-uswift-primary transition-colors" prefetch={true}>
              Dashboard
            </Link>
            <button
              onClick={handleSignOut}
              className="text-gray-700 hover:text-uswift-primary transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <CTAButton href="/auth/signup">Get Started</CTAButton>
        )}
      </div>

      {/* Mobile menu - visible when hamburger is open */}
      {menuOpen && (
        <div className="absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-lg z-50 sm:hidden">
          <div className="flex flex-col gap-4 p-4">
            <Link href="/" className="text-gray-700 hover:text-uswift-primary transition-colors" onClick={() => setMenuOpen(false)} prefetch={true}>
              Home
            </Link>
            <Link href="/features" className="text-gray-700 hover:text-uswift-primary transition-colors" onClick={() => setMenuOpen(false)} prefetch={true}>
              Features
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-uswift-primary transition-colors" onClick={() => setMenuOpen(false)} prefetch={true}>
              Pricing
            </Link>
            {user ? (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-uswift-primary transition-colors" onClick={() => setMenuOpen(false)} prefetch={true}>
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-700 hover:text-uswift-primary text-left transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <CTAButton href="/auth/signup" onClick={() => setMenuOpen(false)}>
                Get Started
              </CTAButton>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
