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

    // Reveal animations
    const revealElements = gsap.utils.toArray<HTMLElement>("[data-animate='reveal']");
    revealElements.forEach((elem, index) => {
      const delay = Math.min(index * 0.075, 0.6);
      gsap.fromTo(
        elem,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          delay,
          ease: "power3.out",
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: elem,
            start: "top 85%",
            end: "bottom 15%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    // Parallax for elements tagged with data-parallax
    const parallaxElems = gsap.utils.toArray<HTMLElement>("[data-parallax]");
    parallaxElems.forEach((elem) => {
      const speedAttr = elem.getAttribute("data-parallax-speed");
      const speed = speedAttr ? parseFloat(speedAttr) : 0.3;
      gsap.fromTo(
        elem,
        { yPercent: -speed * 20 },
        {
          yPercent: speed * 20,
          ease: "none",
          scrollTrigger: {
            trigger: elem,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [isGsapReady]);

  return null;
};

export default ScrollEffects;