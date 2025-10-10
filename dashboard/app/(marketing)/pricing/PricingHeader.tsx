"use client";

import { motion } from "framer-motion";

const PricingHeader = () => {
  return (
    <div className="text-center py-10 sm:py-16 md:py-24" data-animate="reveal"> {/* Changed: py-10 for mobile, sm:py-16 for tablets, md:py-24 for desktop */}
      <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-4 text-white"> {/* Changed: text-2xl for mobile, sm:text-4xl for tablets, md:text-6xl for desktop */}
        The Perfect Plan for Your Career
      </h1>
      <p className="text-base sm:text-lg md:text-xl max-w-md sm:max-w-2xl md:max-w-3xl mx-auto text-white"> {/* Changed: text-base for mobile, sm:text-lg for tablets, md:text-xl for desktop; max-w-md for mobile, sm:max-w-2xl for tablets, md:max-w-3xl for desktop */}
        Accelerate your job search with powerful AI tools. Start for free and upgrade when you're ready to land your dream job.
      </p>
    </div>
  );
};

export default PricingHeader;