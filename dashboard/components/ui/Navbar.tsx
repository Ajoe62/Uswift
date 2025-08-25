"use client";

import { useState, useEffect } from "react";
import CTAButton from "./CTAButton";

export default function Navbar() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <nav className="w-full py-4 px-8 flex justify-between items-center bg-uswift-gradient text-white">
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
        <span className="font-bold text-xl text-uswift-accent">Uswift</span>
      </div>

      {/* Navigation links */}
      <div className="space-x-6 flex items-center">
        <a href="/" className="hover:text-uswift-accent">
          Home
        </a>
        <a href="/features" className="hover:text-uswift-accent">
          Features
        </a>
        <a href="/pricing" className="hover:text-uswift-accent">
          Pricing
        </a>
        {/* CTAButton centralized for consistent CTA styling */}
        <CTAButton href="/auth/signup">Get Started</CTAButton>
      </div>
    </nav>
  );
}