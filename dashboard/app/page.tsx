import LandingHero from "../components/LandingHero";
import FeaturesSection from "../components/FeaturesSection";
const HowItWorks = () => (
  <section className="text-center mt-8">
    {/* Placeholder for HowItWorks component */}
    <p>How it works content will appear here.</p>
  </section>
);
const Testimonials = () => (
  <section className="text-center mt-8">
    {/* Fallback placeholder for missing module */}
    <p>Testimonials will appear here.</p>
  </section>
);
import CTAButton from "../components/ui/CTAButton";
// using a plain anchor tag instead of next/link to avoid missing module/type errors

export default function HomePage() {
  return (
    <main>
      {/* Centered logo removed per design preference */}
      <LandingHero />
      <FeaturesSection />
      <HowItWorks />
      <Testimonials />
      <section className="text-center mt-8">
        <CTAButton href="/pricing" className="px-6 py-3">
          See Pricing
        </CTAButton>
      </section>
    </main>
  );
}
