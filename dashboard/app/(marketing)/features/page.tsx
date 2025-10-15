"use client";

import dynamic from "next/dynamic";
import FeaturesHero from "./FeaturesHero";
import FeatureShowcase from "./FeatureShowcase";
import Footer from "@/components/Footer";

// Lazy load ScrollEffects to reduce initial bundle
const ScrollEffects = dynamic(() => import("@/components/ScrollEffects"), {
  ssr: false,
});

const FeaturesPage = () => {
  return (
    <>
      <ScrollEffects />
      <FeaturesHero />
      <FeatureShowcase />
      <Footer />
    </>
  );
};

export default FeaturesPage;