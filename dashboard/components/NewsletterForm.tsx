"use client";

import React, { useState } from "react";

export default function NewsletterForm(): React.ReactElement {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<null | "idle" | "saving" | "ok" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("saving");

    try {
      // Replace with real API call if available.
      await new Promise((r) => setTimeout(r, 700));
      setStatus("ok");
      setEmail("");
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 flex flex-col md:flex-row items-stretch md:items-center gap-2" // Changed: flex-col for mobile, md:flex-row for desktop; items-stretch for mobile, items-center for desktop
      aria-label="Subscribe to newsletter"
      data-animate="reveal"
      aria-busy={status === "saving"}
    >
      <label htmlFor="newsletter" className="sr-only">
        Subscribe to newsletter
      </label>

      <input
        id="newsletter"
        name="email"
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full md:w-auto min-w-0 rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-uswift-navy/30 transition-shadow"
        required
        aria-required="true"
        aria-label="Email address"
        disabled={status === "saving"}
        data-parallax="0.06"
      />

      <button
        type="submit"
        className="rounded-md bg-uswift-navy px-4 py-2 text-sm font-semibold text-white hover:bg-uswift-navy/90 disabled:opacity-60 disabled:cursor-not-allowed w-full md:w-auto" // Changed: w-full for mobile, md:w-auto for desktop
        disabled={status === "saving"}
        aria-disabled={status === "saving"}
        aria-live="polite"
      >
        {status === "saving" ? "Saving…" : "Subscribe"}
      </button>

      <div className="text-sm text-gray-400 md:ml-3 mt-2 md:mt-0 text-center md:text-left" role="status" aria-live="polite"> {/* Changed: mt-2 for mobile, md:mt-0 for desktop; text-center for mobile, md:text-left for desktop; md:ml-3 for spacing on desktop */}
        {status === "ok" && "Thanks — check your inbox."}
        {status === "error" && "Something went wrong."}
      </div>
    </form>
  );
}