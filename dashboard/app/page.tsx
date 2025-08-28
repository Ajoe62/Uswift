import LandingHero from "@/components/LandingHero";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import CTAButton from "@/components/ui/CTAButton";
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
