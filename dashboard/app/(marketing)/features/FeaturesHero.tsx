"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

const FeaturesHero = () => {
  return (
    <section className="relative py-12 sm:py-20 md:py-32 bg-gray-900 text-white overflow-hidden"> {/* Changed: py-12 for mobile, sm:py-20 for tablets, md:py-32 for desktop */}
      <div className="absolute inset-0 bg-grid-white/[0.07] [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]"></div>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1
            className="text-2xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent" // Changed: text-2xl for mobile, sm:text-4xl for tablets, md:text-6xl for desktop
            data-animate="reveal"
          >
            Powerful Features, Effortless Results
          </h1>
          <p
            className="text-base sm:text-lg md:text-xl max-w-md sm:max-w-3xl mx-auto text-gray-300 mb-6 sm:mb-8" // Changed: text-base for mobile, sm:text-lg for tablets, md:text-xl for desktop; max-w-md for mobile, sm:max-w-3xl for larger screens; mb-6 for mobile, sm:mb-8 for larger screens
            data-animate="reveal"
          >
            Uswift is packed with cutting-edge tools designed to streamline your
            workflow, enhance your creativity, and bring your ideas to life
            faster than ever before.
          </p>
          <div data-animate="reveal">
            <Button className="group px-4 py-2 sm:px-6 sm:py-3 text-base sm:text-lg"> {/* Changed: px-4 py-2 text-base for mobile, sm:px-6 sm:py-3 text-lg for larger screens */}
              Get Started for Free
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesHero;