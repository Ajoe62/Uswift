import FeaturesHero from "./FeaturesHero";
import FeatureShowcase from "./FeatureShowcase";
import ScrollEffects from "@/components/ScrollEffects";
import Footer from "@/components/Footer";

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