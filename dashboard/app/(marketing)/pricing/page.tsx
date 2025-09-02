import PricingHeader from "./PricingHeader";
import PricingTiers from "./PricingTiers";
import FAQ from "./FAQ";
import ScrollEffects from "./ScrollEffects";

const PricingPage = () => {
  return (
    <>
      <ScrollEffects />
      <div className="container mx-auto px-4">
        <PricingHeader />
        <PricingTiers />
        <FAQ />
      </div>
    </>
  );
};

export default PricingPage;