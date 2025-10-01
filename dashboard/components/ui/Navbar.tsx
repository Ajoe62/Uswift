"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import CTAButton from "@/components/ui/CTAButton";

export default function Navbar() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // Added: state for hamburger menu
  const { user, signOut } = useAuth();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false); // Close menu on sign out
  };

  return (
    <nav className="w-full py-4 px-4 sm:px-8 flex justify-between items-center bg-uswift-gradient text-white relative"> {/* Changed: px-4 for mobile, sm:px-8 for tablets and up, relative for mobile menu */}
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
        <a href="/" className="hover:text-uswift-accent">
          Home
        </a>
        <a href="/features" className="hover:text-uswift-accent">
          Features
        </a>
        <a href="/pricing" className="hover:text-uswift-accent">
          Pricing
        </a>
        {user ? (
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="hover:text-uswift-accent">
              Dashboard
            </a>
            <button
              onClick={handleSignOut}
              className="text-white hover:text-uswift-accent"
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
        <div className="absolute top-full left-0 w-full bg-uswift-gradient shadow-lg z-50 sm:hidden animate-fade-in"> {/* Changed: mobile menu styles, animate-fade-in for smoothness */}
          <div className="flex flex-col gap-4 p-4">
            <a href="/" className="hover:text-uswift-accent" onClick={() => setMenuOpen(false)}>
              Home
            </a>
            <a href="/features" className="hover:text-uswift-accent" onClick={() => setMenuOpen(false)}>
              Features
            </a>
            <a href="/pricing" className="hover:text-uswift-accent" onClick={() => setMenuOpen(false)}>
              Pricing
            </a>
            {user ? (
              <>
                <a href="/dashboard" className="hover:text-uswift-accent" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </a>
                <button
                  onClick={handleSignOut}
                  className="text-white hover:text-uswift-accent text-left"
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