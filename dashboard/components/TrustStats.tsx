import React from "react";

export default function TrustStats(): React.ReactElement {
  return (
    <section
      className="py-8 sm:py-12 px-4 bg-transparent text-white" // Changed: reduced vertical padding for mobile, added sm: for scaling
      data-animate="reveal"
      aria-labelledby="trust-heading"
    >
      <div className="container mx-auto max-w-6xl px-4">
        {/* Centered dark card: full width on small, ~70% on md+ */}
        <div className="mx-auto w-full md:w-[70%] rounded-3xl bg-gray-900/60 backdrop-blur-sm p-4 sm:p-6 md:p-8 shadow-lg"> {/* Changed: p-4 for mobile, sm:p-6 for tablets, md:p-8 for desktop */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Left: headline + rating */}
            <div className="flex-1 min-w-0">
              <h3 id="trust-heading" className="text-xl sm:text-2xl font-semibold text-white"> {/* Changed: text-xl for mobile, sm:text-2xl for larger screens */}
                Trusted, secure, and fast
              </h3>
              <p className="mt-2 text-sm sm:text-base text-gray-300 max-w-xl"> {/* Changed: text-sm for mobile, sm:text-base for larger screens */}
                We never store your data for training. All processing is ephemeral and encrypted
                end-to-end.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row items-center gap-2 sm:gap-4"> {/* Changed: flex-col for mobile, sm:flex-row for larger screens; gap-2 for mobile, sm:gap-4 for larger screens */}
                <div
                  className="flex items-center gap-1 mb-2 sm:mb-0"
                  aria-hidden="true"
                  data-parallax="0.25"
                >
                  {/* ...SVG stars unchanged... */}
                  {/* (SVGs omitted for brevity) */}
                </div>

                <div className="text-sm text-center sm:text-left"> {/* Changed: text-center for mobile, sm:text-left for larger screens */}
                  <div className="text-lg sm:text-xl font-bold">4.8</div> {/* Changed: text-lg for mobile, sm:text-xl for larger screens */}
                  <div className="text-xs text-gray-400">Average rating (based on 1.2k+ reviews)</div>
                </div>

                <div className="mt-2 sm:mt-0 sm:ml-4"> {/* Changed: mt-2 for mobile, sm:mt-0 for larger screens; sm:ml-4 for spacing on desktop */}
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
            <div className="w-full md:w-1/2 mt-6 md:mt-0"> {/* Changed: mt-6 for mobile, md:mt-0 for desktop */}
              <div
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                data-animate="stagger"
                role="list"
                aria-label="Trust metrics"
              >
                <div className="bg-white/6 rounded-lg p-4 text-center card" role="listitem">
                  <div className="text-xl sm:text-2xl font-bold"> {/* Changed: text-xl for mobile, sm:text-2xl for larger screens */}
                    1.2k+
                  </div>
                  <div className="text-xs text-gray-300 mt-1">Active users</div>
                </div>
                <div className="bg-white/6 rounded-lg p-4 text-center card" role="listitem">
                  <div className="text-xl sm:text-2xl font-bold">
                    24k+
                  </div>
                  <div className="text-xs text-gray-300 mt-1">Jobs auto-applied</div>
                </div>
                <div className="bg-white/6 rounded-lg p-4 text-center card" role="listitem">
                  <div className="text-xl sm:text-2xl font-bold">
                    99.9%
                  </div>
                  <div className="text-xs text-gray-300 mt-1">Uptime</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4"> {/* Changed: flex-col for mobile, sm:flex-row for larger screens; items-center for mobile, justify-between for desktop */}
            <div className="text-sm text-gray-400 text-center sm:text-left"> {/* Changed: text-center for mobile, sm:text-left for larger screens */}
              Built for privacy-first job seekers. Encrypted by design.
            </div>
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