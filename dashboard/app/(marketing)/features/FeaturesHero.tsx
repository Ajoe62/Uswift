"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

const FeaturesHero = () => {
  return (
    <section className="relative py-20 md:py-32 bg-gray-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.07] [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]"></div>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1
            className="text-4xl md:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent"
            data-animate="reveal"
          >
            Powerful Features, Effortless Results
          </h1>
          <p
            className="text-lg md:text-xl max-w-3xl mx-auto text-gray-300 mb-8"
            data-animate="reveal"
          >
            Uswift is packed with cutting-edge tools designed to streamline your
            workflow, enhance your creativity, and bring your ideas to life
            faster than ever before.
          </p>
          <div data-animate="reveal">
            <Button className="group px-6 py-3 text-lg">
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