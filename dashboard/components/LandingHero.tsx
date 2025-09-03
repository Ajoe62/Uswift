import CTAButton from "./ui/CTAButton";

export default function LandingHero() {
  return (
    <section
      className="relative py-20 md:py-32 bg-gray-900 text-white overflow-hidden"
      aria-labelledby="landing-hero-heading"
      data-animate="reveal"
    >
      {/* Decorative overlay with subtle parallax (animated by ScrollEffects) */}
      <div
        className="absolute inset-0 bg-grid-white/[0.07] [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]"
        data-parallax
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center">
          <h1
            id="landing-hero-heading"
            className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent"
            data-animate="reveal"
          >
            Auto-apply & Track Jobs Effortlessly
          </h1>

          <p
            className="text-lg md:text-xl max-w-3xl mx-auto text-gray-300 mb-6"
            data-animate="reveal"
          >
            Uswift helps you land your dream job faster with smart automation and a
            beautiful dashboard.
          </p>

          {/* small trust badge that also reveals */}
          <div className="flex items-center justify-center gap-3 mb-6" data-animate="reveal" aria-hidden={false}>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/6 px-3 py-1 text-sm text-white">
              <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.29a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.289c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.897 2.03c-.785.57-1.84-.197-1.54-1.118l1.07-3.289a1 1 0 00-.364-1.118L3.47 8.717c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.29z" />
              </svg>
              <span className="font-medium">1.2k+ users</span>
              <span className="text-xs text-gray-300 ml-2 hidden sm:inline">· Trusted & private</span>
            </div>
          </div>

          <div data-animate="reveal">
            <CTAButton href="/auth/signup" className="px-8 py-4">
              Get Started
            </CTAButton>
          </div>
        </div>
      </div>
    </section>
  );
}