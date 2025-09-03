import CTAButton from "./ui/CTAButton";

export default function LandingHero() {
  return (
    <section className="relative py-20 md:py-32 bg-gray-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.07] [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center">
          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent"
            data-animate="reveal"
          >
            Auto-apply & Track Jobs Effortlessly
          </h1>

          <p
            className="text-lg md:text-xl max-w-3xl mx-auto text-gray-300 mb-8"
            data-animate="reveal"
          >
            Uswift helps you land your dream job faster with smart automation and a
            beautiful dashboard.
          </p>

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