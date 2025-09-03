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
      className="py-16 px-4 bg-gradient-to-b from-slate-900/80 via-transparent to-slate-900 text-white"
      data-animate="reveal"
      aria-labelledby="modern-showcase-heading"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="mx-auto w-full md:w-[70%] rounded-3xl bg-gradient-to-br from-white/4 to-white/2 backdrop-blur-md p-6 md:p-10 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Left: Headline + bullets */}
            <div>
              <h2
                id="modern-showcase-heading"
                className="text-3xl md:text-4xl font-extrabold leading-tight"
              >
                Get hired faster with privacy-first automation
              </h2>
              <p className="mt-3 text-gray-300 max-w-lg">
                Auto-apply, AI-crafted resumes, and job insights — all encrypted and ephemeral.
                Focus on interviews, not forms.
              </p>

              <div className="mt-6 flex flex-wrap gap-3" data-animate="reveal">
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
                    <div className="text-sm text-gray-300">Save hours—apply to matched jobs automatically while you focus on interviews.</div>
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
                    <div className="text-sm text-gray-300">Your data is processed ephemeral—never stored for training.</div>
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
                    <div className="text-sm text-gray-300">See which listings are most likely to convert and which recruiters are active now.</div>
                  </div>
                </li>
              </ul>

              <div className="mt-6 text-sm text-gray-400">Trusted by job seekers worldwide — 1.2k+ reviews, 24k+ auto-applies.</div>
            </div>

            {/* Right: screenshot / visual card */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-md rounded-xl overflow-hidden ring-1 ring-white/6">
                <div
                  className="bg-gradient-to-tr from-slate-800 to-slate-900 p-6"
                  data-parallax="0.12"
                  data-animate="reveal"
                >
                  {/* Placeholder "screenshot" card */}
                  <div className="h-48 rounded-lg bg-gradient-to-br from-white/3 to-white/5 p-4 flex flex-col justify-between card">
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

      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8" data-animate="stagger" role="list">
          {/* About / CTA */}
          <div className="card" role="listitem">
            <h4 className="text-lg font-semibold text-white">Uswift</h4>
            <p className="mt-2 text-sm text-gray-400 max-w-sm">
              Job search automation built for privacy-first professionals. We keep your data secure and your applications efficient.
            </p>

            <NewsletterForm />
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-6 md:col-span-1" role="listitem">
            <div className="card">
              <h5 className="text-sm font-medium text-white">Product</h5>
              <ul className="mt-3 space-y-2 text-sm text-gray-400">
                <li><a href="/features" className="hover:underline">Features</a></li>
                <li><a href="/pricing" className="hover:underline">Pricing</a></li>
                <li><a href="/how-it-works" className="hover:underline">How it works</a></li>
                <li><a href="/trust" className="hover:underline">Trust</a></li>
              </ul>
            </div>

            <div className="card">
              <h5 className="text-sm font-medium text-white">Company</h5>
              <ul className="mt-3 space-y-2 text-sm text-gray-400">
                <li><a href="/about" className="hover:underline">About</a></li>
                <li><a href="/careers" className="hover:underline">Careers</a></li>
                <li><a href="/blog" className="hover:underline">Blog</a></li>
                <li><a href="/contact" className="hover:underline">Contact</a></li>
              </ul>
            </div>
          </div>

          {/* Social / Legal */}
          <div className="card" role="listitem">
            <h5 className="text-sm font-medium text-white">Connect</h5>
            <div className="mt-3 flex items-center gap-3" aria-label="Social links">
              <a href="https://x.com/yourhandle" aria-label="X / Twitter" className="p-2 rounded-md hover:bg-white/5">
                <svg className="w-5 h-5 text-gray-200" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M20 7.5c-.6.3-1.2.5-1.9.6.7-.4 1.2-1.1 1.5-1.9-.7.4-1.4.7-2.2.9C17 6 16 5.5 15 5.5c-2 0-3.3 1.8-2.8 3.6C9 8.9 6.5 7.5 4.6 5.3c-.8 1.4-.2 3.2 1.1 4.1-.5 0-1-.2-1.4-.4 0 1.6 1.1 3 2.8 3.3-.5.2-1 .2-1.5.1.4 1.3 1.6 2.3 3.1 2.3-1.1.9-2.4 1.4-3.9 1.4-.2 0-.5 0-.7-.1 1.4.9 3.1 1.4 4.8 1.4 5.7 0 8.8-4.8 8.8-8.9v-.4c.6-.4 1.2-1 1.6-1.6-.6.3-1.3.5-2 .6z" />
                </svg>
              </a>

              <a href="https://linkedin.com/company/yourcompany" aria-label="LinkedIn" className="p-2 rounded-md hover:bg-white/5">
                <svg className="w-5 h-5 text-gray-200" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M4.98 3.5C4.98 4.88 3.87 6 2.49 6 1.11 6 0 4.88 0 3.5 0 2.12 1.11 1 2.49 1 3.87 1 4.98 2.12 4.98 3.5zM0 8.98h4.98V24H0zM8.98 8.98H13v2.07h.07c.56-1.06 1.93-2.18 3.98-2.18 4.26 0 5.04 2.8 5.04 6.45V24H16.2v-7.24c0-1.73 0-3.96-2.41-3.96-2.41 0-2.78 1.88-2.78 3.84V24H8.98z" />
                </svg>
              </a>

              <a href="https://github.com/yourorg" aria-label="GitHub" className="p-2 rounded-md hover:bg-white/5">
                <svg className="w-5 h-5 text-gray-200" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 .5C5.73.5.98 5.24.98 11.5c0 4.66 3.02 8.62 7.21 10.02.53.1.72-.23.72-.5 0-.25-.01-.92-.01-1.8-2.94.64-3.57-1.25-3.57-1.25-.48-1.21-1.16-1.53-1.16-1.53-.95-.65.07-.64.07-.64 1.06.07 1.62 1.1 1.62 1.1.93 1.6 2.44 1.14 3.03.87.09-.67.37-1.14.67-1.4-2.35-.27-4.82-1.18-4.82-5.24 0-1.16.41-2.11 1.08-2.86-.11-.27-.47-1.36.1-2.84 0 0 .88-.28 2.88 1.09A9.93 9.93 0 0112 6.8c.89.01 1.79.12 2.63.36 2-1.37 2.88-1.09 2.88-1.09.57 1.48.21 2.57.1 2.84.67.75 1.09 1.7 1.09 2.86 0 4.07-2.47 4.96-4.82 5.22.38.33.72.98.72 1.98 0 1.43-.01 2.58-.01 2.93 0 .27.19.61.73.5C20 20.12 23 16.16 23 11.5 23 5.24 18.27.5 12 .5z" />
                </svg>
              </a>

              <a href="https://instagram.com/yourhandle" aria-label="Instagram" className="p-2 rounded-md hover:bg-white/5">
                <svg className="w-5 h-5 text-gray-200" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 5.5a4 4 0 100 8 4 4 0 000-8zm6.5-.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM12 9a3 3 0 110 6 3 3 0 010-6z" />
                </svg>
              </a>
            </div>

            <div className="mt-6 text-xs text-gray-500">
              <a href="/privacy" className="hover:underline mr-3">Privacy</a>
              <a href="/terms" className="hover:underline mr-3">Terms</a>
              <a href="/security" className="hover:underline">Security</a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-white/6 pt-6 text-sm text-gray-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>© {new Date().getFullYear()} Uswift — All rights reserved.</div>
          <div>Made with care · <a href="/contact" className="hover:underline">Contact us</a></div>
        </div>
      </div>
    </footer>
  );
}

export default ModernShowcase;