"use client";

import dynamic from "next/dynamic";
import LandingHero from "@/components/LandingHero";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorks from "@/components/HowItWorks";
import ResumeBuilder from "@/components/ResumeBuilder";
import TrustStats from "@/components/TrustStats";
import Testimonials from "@/components/Testimonials";
import { ModernShowcase, SiteFooter } from "@/components/ModernShowcaseAndFooter";
import NewsletterForm from "@/components/NewsletterForm";

// Lazy load ScrollEffects
const ScrollEffects = dynamic(() => import("@/components/ScrollEffects"), {
  ssr: false,
});

export default function HomePage() {
  return (
    <>
      <ScrollEffects />
      <div className="container mx-auto px-2 sm:px-4">
        <LandingHero />
        <FeaturesSection />
        <ResumeBuilder />
        <HowItWorks />
        <TrustStats />
        <Testimonials />
        <ModernShowcase />
        <NewsletterForm />
        <SiteFooter />
      </div>
    </>
  );
}
