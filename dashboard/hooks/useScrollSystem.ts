"use client";

import { useLayoutEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";
import Lenis from "lenis"; // Updated to new package

const useScrollSystem = () => {
  const [isGsapReady, setIsGsapReady] = useState(false);

  useLayoutEffect(() => {
    // Register the GSAP ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    // Sync GSAP ScrollTrigger with Lenis's scroll events
    lenis.on('scroll', ScrollTrigger.update);

    // Create a GSAP ticker to drive Lenis's animation frame updates
    const update = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    // Set state to true once setup is complete
    setIsGsapReady(true);

    // Return a cleanup function to run when the component unmounts
    return () => {
      setIsGsapReady(false);
      // Remove the ticker function
      gsap.ticker.remove(update);
      // Destroy the Lenis instance to prevent memory leaks
      lenis.destroy();
      // Optional: kill all scroll triggers
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return { isGsapReady };
};

export default useScrollSystem;