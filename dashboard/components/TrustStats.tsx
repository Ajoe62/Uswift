import React from "react";

export default function TrustStats(): React.ReactElement {
  return (
    <section
      className="py-12 px-4 bg-transparent text-white"
      data-animate="reveal"
      aria-labelledby="trust-heading"
    >
      <div className="container mx-auto max-w-6xl px-4">
        {/* Centered dark card: full width on small, ~70% on md+ */}
        <div className="mx-auto w-full md:w-[70%] rounded-3xl bg-gray-900/60 backdrop-blur-sm p-6 md:p-8 shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Left: headline + rating */}
            <div className="flex-1 min-w-0">
              <h3 id="trust-heading" className="text-2xl font-semibold text-white">
                Trusted, secure, and fast
              </h3>
              <p className="mt-2 text-sm text-gray-300 max-w-xl">
                We never store your data for training. All processing is ephemeral and encrypted
                end-to-end.
              </p>

              <div className="mt-4 flex items-center gap-4">
                <div
                  className="flex items-center gap-1"
                  aria-hidden="true"
                  data-parallax="0.25"
                >
                  <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.29a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.289c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.897 2.03c-.785.57-1.84-.197-1.54-1.118l1.07-3.289a1 1 0 00-.364-1.118L3.47 8.717c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.29z" />
                  </svg>
                  <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.29a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.289c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.897 2.03c-.785.57-1.84-.197-1.54-1.118l1.07-3.289a1 1 0 00-.364-1.118L3.47 8.717c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.29z" />
                  </svg>
                  <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.29a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.289c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.897 2.03c-.785.57-1.84-.197-1.54-1.118l1.07-3.289a1 1 0 00-.364-1.118L3.47 8.717c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.29z" />
                  </svg>
                  <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.29a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.289c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.897 2.03c-.785.57-1.84-.197-1.54-1.118l1.07-3.289a1 1 0 00-.364-1.118L3.47 8.717c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.29z" />
                  </svg>
                  <svg className="w-5 h-5 text-yellow-400/80" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.29a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.289c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.897 2.03c-.785.57-1.84-.197-1.54-1.118l1.07-3.289a1 1 0 00-.364-1.118L3.47 8.717c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.29z" />
                  </svg>
                </div>

                <div className="text-sm">
                  <div className="text-xl font-bold">4.8</div>
                  <div className="text-xs text-gray-400">Average rating (based on 1.2k+ reviews)</div>
                </div>

                <div className="ml-4">
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 rounded-md bg-white/6 px-3 py-1 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                    aria-label="See reviews"
                  >
                    View reviews
                  </a>
                </div>
              </div>
            </div>

            {/* Metrics block */}
            <div className="w-full md:w-1/2">
              <div
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 md:mt-0"
                data-animate="stagger"
                role="list"
                aria-label="Trust metrics"
              >
                <div className="bg-white/6 rounded-lg p-4 text-center card" role="listitem">
                  <div className="text-2xl font-bold">1.2k+</div>
                  <div className="text-xs text-gray-300 mt-1">Active users</div>
                </div>
                <div className="bg-white/6 rounded-lg p-4 text-center card" role="listitem">
                  <div className="text-2xl font-bold">24k+</div>
                  <div className="text-xs text-gray-300 mt-1">Jobs auto-applied</div>
                </div>
                <div className="bg-white/6 rounded-lg p-4 text-center card" role="listitem">
                  <div className="text-2xl font-bold">99.9%</div>
                  <div className="text-xs text-gray-300 mt-1">Uptime</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="mt-6 flex items-center justify-between gap-4">
            <div className="text-sm text-gray-400">Built for privacy-first job seekers. Encrypted by design.</div>
            <div>
              <a
                href="#get-started"
                className="inline-flex items-center gap-2 rounded-md bg-uswift-navy px-4 py-2 text-sm font-semibold text-white hover:bg-uswift-navy/90 focus:outline-none focus:ring-2 focus:ring-uswift-navy/30"
              >
                Get started — it’s free
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}