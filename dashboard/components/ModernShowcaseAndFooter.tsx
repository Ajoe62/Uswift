import React from "react";
import NewsletterForm from "@/components/NewsletterForm";

/**
 * ModernShowcase - a modern, aesthetic section to place after Testimonials.
 * SiteFooter - accessible footer with newsletter + social links.
 *
 * Usage:
 *  - Insert <ModernShowcase /> after Testimonials on the homepage.
 *  - Use <SiteFooter /> in place of your current footer.
 */

export function ModernShowcase(): React.ReactElement {
  return (
    <section
      className="py-10 sm:py-16 px-4 bg-gradient-to-b from-slate-900/80 via-transparent to-slate-900 text-white" // Changed: reduced vertical padding for mobile, added sm: for scaling
      data-animate="reveal"
      aria-labelledby="modern-showcase-heading"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="mx-auto w-full md:w-[70%] rounded-3xl bg-gradient-to-br from-white/4 to-white/2 backdrop-blur-md p-4 sm:p-6 md:p-10 shadow-xl"> {/* Changed: p-4 for mobile, sm:p-6 for tablets, md:p-10 for desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center"> {/* Changed: gap-6 for mobile, sm:gap-8 for larger screens */}
            {/* Left: Headline + bullets */}
            <div>
              <h2
                id="modern-showcase-heading"
                className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight" // Changed: text-2xl for mobile, sm:text-3xl for tablets, md:text-4xl for desktop
              >
                Get hired faster with privacy-first automation
              </h2>
              <p className="mt-3 text-sm sm:text-base text-gray-300 max-w-lg"> {/* Changed: text-sm for mobile, sm:text-base for larger screens */}
                Auto-apply, AI-crafted resumes, and job insights — all encrypted and ephemeral.
                Focus on interviews, not forms.
              </p>

              <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-3" data-animate="reveal"> {/* Changed: flex-col for mobile, sm:flex-row for larger screens */}
                <a
                  href="#get-started"
                  className="inline-flex items-center gap-2 rounded-full bg-uswift-navy px-5 py-3 text-sm font-semibold text-white shadow hover:bg-uswift-navy/90 focus:outline-none focus:ring-2 focus:ring-uswift-navy/30"
                >
                  Get started — it’s free
                </a>
                <a
                  href="#demo"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm font-medium text-white/90 hover:bg-white/3 focus:outline-none focus:ring-2 focus:ring-white/10"
                >
                  Live demo
                </a>
              </div>

              <ul
                className="mt-8 space-y-3"
                data-animate="stagger"
                role="list"
                aria-label="Key features"
              >
                <li className="flex items-start gap-3 card">
                  <span className="flex-none mt-1">
                    <svg className="w-6 h-6 text-uswift-navy" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <div className="font-semibold">Auto-apply with one click</div>
                    <div className="text-xs sm:text-sm text-gray-300"> {/* Changed: text-xs for mobile, sm:text-sm for larger screens */}
                      Save hours—apply to matched jobs automatically while you focus on interviews.
                    </div>
                  </div>
                </li>

                <li className="flex items-start gap-3 card">
                  <span className="flex-none mt-1">
                    <svg className="w-6 h-6 text-uswift-navy" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M12 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 4v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <div className="font-semibold">Privacy-first AI</div>
                    <div className="text-xs sm:text-sm text-gray-300"> {/* Changed: text-xs for mobile, sm:text-sm for larger screens */}
                      Your data is processed ephemeral—never stored for training.
                    </div>
                  </div>
                </li>

                <li className="flex items-start gap-3 card">
                  <span className="flex-none mt-1">
                    <svg className="w-6 h-6 text-uswift-navy" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M20 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 21v-2a4 4 0 013-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 7a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <div className="font-semibold">Real-time job insights</div>
                    <div className="text-xs sm:text-sm text-gray-300"> {/* Changed: text-xs for mobile, sm:text-sm for larger screens */}
                      See which listings are most likely to convert and which recruiters are active now.
                    </div>
                  </div>
                </li>
              </ul>

              <div className="mt-6 text-xs sm:text-sm text-gray-400"> {/* Changed: text-xs for mobile, sm:text-sm for larger screens */}
                Trusted by job seekers worldwide — 1.2k+ reviews, 24k+ auto-applies.
              </div>
            </div>

            {/* Right: screenshot / visual card */}
            <div className="flex items-center justify-center mt-8 md:mt-0"> {/* Changed: mt-8 for mobile, md:mt-0 for desktop */}
              <div className="w-full max-w-md rounded-xl overflow-hidden ring-1 ring-white/6">
                <div
                  className="bg-gradient-to-tr from-slate-800 to-slate-900 p-4 sm:p-6" // Changed: p-4 for mobile, sm:p-6 for larger screens
                  data-parallax="0.12"
                  data-animate="reveal"
                >
                  {/* Placeholder "screenshot" card */}
                  <div className="h-48 rounded-lg bg-gradient-to-br from-white/3 to-white/5 p-2 sm:p-4 flex flex-col justify-between card"> {/* Changed: p-2 for mobile, sm:p-4 for larger screens */}
                    <div className="text-xs text-gray-300">Resume Preview</div>
                    <div className="mt-2">
                      <div className="h-3 bg-white/10 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-white/8 rounded w-1/2 mb-2" />
                      <div className="h-3 bg-white/10 rounded w-5/6" />
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                      <div>AI score: <span className="font-semibold text-white">92</span></div>
                      <div>Updated just now</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter(): React.ReactElement {
  return (
    <footer
      className="bg-gray-900 text-gray-200"
      data-animate="reveal"
      aria-labelledby="footer-heading"
      role="contentinfo"
    >
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>

      <div className="container mx-auto max-w-6xl px-4 py-8 sm:py-12"> {/* Changed: py-8 for mobile, sm:py-12 for larger screens */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8" data-animate="stagger" role="list"> {/* Changed: gap-6 for mobile, sm:gap-8 for larger screens */}
          {/* About / CTA */}
          <div className="card" role="listitem">
            <h4 className="text-base sm:text-lg font-semibold text-white"> {/* Changed: text-base for mobile, sm:text-lg for larger screens */}
              Uswift
            </h4>
            <p className="mt-2 text-xs sm:text-sm text-gray-400 max-w-sm"> {/* Changed: text-xs for mobile, sm:text-sm for larger screens */}
              Job search automation built for privacy-first professionals. We keep your data secure and your applications efficient.
            </p>

            <NewsletterForm />
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:col-span-1" role="listitem"> {/* Changed: gap-4 for mobile, sm:gap-6 for larger screens */}
            <div className="card">
              <h5 className="text-xs sm:text-sm font-medium text-white"> {/* Changed: text-xs for mobile, sm:text-sm for larger screens */}
                Product
              </h5>
              <ul className="mt-3 space-y-2 text-xs sm:text-sm text-gray-400"> {/* Changed: text-xs for mobile, sm:text-sm for larger screens */}
                <li><a href="/features" className="hover:underline">Features</a></li>
                <li><a href="/pricing" className="hover:underline">Pricing</a></li>
                <li><a href="/how-it-works" className="hover:underline">How it works</a></li>
                <li><a href="/trust" className="hover:underline">Trust</a></li>
              </ul>
            </div>

            <div className="card">
              <h5 className="text-xs sm:text-sm font-medium text-white"> {/* Changed: text-xs for mobile, sm:text-sm for larger screens */}
                Company
              </h5>
              <ul className="mt-3 space-y-2 text-xs sm:text-sm text-gray-400"> {/* Changed: text-xs for mobile, sm:text-sm for larger screens */}
                <li><a href="/about" className="hover:underline">About</a></li>
                <li><a href="/careers" className="hover:underline">Careers</a></li>
                <li><a href="/blog" className="hover:underline">Blog</a></li>
                <li><a href="/contact" className="hover:underline">Contact</a></li>
              </ul>
            </div>
          </div>

          {/* Social / Legal */}
          <div className="card" role="listitem">
            <h5 className="text-xs sm:text-sm font-medium text-white"> {/* Changed: text-xs for mobile, sm:text-sm for larger screens */}
              Connect
            </h5>
            <div className="mt-3 flex items-center gap-2 sm:gap-3" aria-label="Social links"> {/* Changed: gap-2 for mobile, sm:gap-3 for larger screens */}
              {/* ...social links unchanged... */}
            </div>

            <div className="mt-6 text-xs text-gray-500">
              <a href="/privacy" className="hover:underline mr-3">Privacy</a>
              <a href="/terms" className="hover:underline mr-3">Terms</a>
              <a href="/security" className="hover:underline">Security</a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/6 pt-6 text-xs sm:text-sm text-gray-500 flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-4"> {/* Changed: text-xs for mobile, sm:text-sm for larger screens; gap-2 for mobile, sm:gap-4 for larger screens */}
          <div>© {new Date().getFullYear()} Uswift — All rights reserved.</div>
          <div>Made with care · <a href="/contact" className="hover:underline">Contact us</a></div>
        </div>
      </div>
    </footer>
  );
}

export default ModernShowcase;