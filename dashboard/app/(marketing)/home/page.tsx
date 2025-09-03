import LandingHero from "@/components/LandingHero";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorks from "@/components/HowItWorks";
import ResumeBuilder from "@/components/ResumeBuilder";
import TrustStats from "@/components/TrustStats";
import Testimonials from "@/components/Testimonials";
// import CTAButton from "@/components/ui/CTAButton";
// import ScrollEffects from "./ScrollEffects";
import { ModernShowcase, SiteFooter } from "@/components/ModernShowcaseAndFooter";
import NewsletterForm from "@/components/NewsletterForm";
import ScrollEffects from "@/components/ScrollEffects";

const HomePage = () => {
  return (
    <>
      <ScrollEffects />
      <div className="container mx-auto px-4">
        <LandingHero />
        <FeaturesSection />
        <ResumeBuilder />
        <HowItWorks />
        <TrustStats />
        <Testimonials />
        <ModernShowcase />
        <NewsletterForm />      
        <SiteFooter />
        {/* <section className="text-center mt-8" data-animate="reveal">
          <CTAButton href="/pricing" className="px-6 py-3">
            See Pricing
          </CTAButton>
        </section> */}
      </div>
    </>
  );
};

export default HomePage;