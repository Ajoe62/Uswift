"use client";

import { motion } from "framer-motion";

const PricingHeader = () => {
  return (
    <div className="text-center py-16 md:py-24" data-animate="reveal">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
        The Perfect Plan for Your Career
      </h1>
      <p className="text-lg md:text-xl max-w-3xl mx-auto text-gray-300">
        Accelerate your job search with powerful AI tools. Start for free and upgrade when you're ready to land your dream job.
      </p>
    </div>
  );
};

export default PricingHeader;