import PricingHeader from "./PricingHeader";
import PricingTiers from "./PricingTiers";
import FAQ from "./FAQ";
import ScrollEffects from "@/components/ScrollEffects";

const PricingPage = () => {
  return (
    <>
      <ScrollEffects />
      <div className="container mx-auto px-2 sm:px-4"> {/* Changed: px-2 for mobile, sm:px-4 for tablets and up */}
        <PricingHeader />
        <PricingTiers />
        <FAQ />
      </div>
    </>
  );
};

export default PricingPage;