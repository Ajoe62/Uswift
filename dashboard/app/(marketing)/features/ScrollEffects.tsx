"use client";

import { useLayoutEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useScrollSystem from "@/hooks/useScrollSystem";

const ScrollEffects = () => {
  const { isGsapReady } = useScrollSystem();

  useLayoutEffect(() => {
    if (!isGsapReady) return;

    gsap.registerPlugin(ScrollTrigger);

    const revealElements = gsap.utils.toArray<HTMLElement>("[data-animate='reveal']");

    revealElements.forEach((elem) => {
      gsap.fromTo(
        elem,
        {
          y: 50,
          opacity: 0,
        },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: elem,
            start: "top 90%",
            end: "bottom 20%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    return () => {
      // Kill ScrollTriggers to prevent memory leaks
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [isGsapReady]);

  return null;
};

export default ScrollEffects;