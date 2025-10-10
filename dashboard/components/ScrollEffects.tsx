"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

function isMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 640; // Tailwind's 'sm' breakpoint
}

export default function ScrollEffects(): null {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // CRITICAL FIX: Wait for the layout router to mount before initializing scroll effects
    // This prevents the "invariant expected layout router to be mounted" error
    // We delay initialization by 100ms to ensure Next.js App Router is fully mounted
    const initTimeout = setTimeout(() => {
      // Optional smooth scrolling (Lenis). Remove if you don't want it.
      const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
      let rafId = 0;
      function raf(time: number) {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      }
      rafId = requestAnimationFrame(raf);

      // Connect ScrollTrigger with Lenis
      ScrollTrigger.scrollerProxy(document.scrollingElement || document.documentElement, {
        scrollTop(value) {
          if (arguments.length && value !== undefined) return lenis.scrollTo(value);
          return lenis.scroll;
        },
        getBoundingClientRect() {
          return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
        },
      });

      ScrollTrigger.addEventListener("refresh", () => {
        try {
          if (lenis && typeof (lenis as any).raf === "function")
            (lenis as any).raf(performance.now());
        } catch (e) {
          // ignore if raf is not available
        }
      });
      ScrollTrigger.refresh();

      // REVEAL: general fade+slide for elements with data-animate="reveal"
      gsap.utils.toArray<HTMLElement>("[data-animate='reveal']").forEach((el) => {
        gsap.fromTo(
          el,
          isMobile()
            ? { y: 16, opacity: 0, willChange: "transform,opacity" } // smaller movement on mobile
            : { y: 28, opacity: 0, willChange: "transform,opacity" },
          {
            y: 0,
            opacity: 1,
            duration: isMobile() ? 0.5 : 0.75, // faster on mobile
            ease: "power3.out",
            overwrite: true,
            scrollTrigger: { trigger: el, start: isMobile() ? "top 92%" : "top 85%", toggleActions: "play none none reverse" },
          }
        );
      });

      // STAGGER: grid/card containers with data-animate="stagger" and .card children
      gsap.utils.toArray<HTMLElement>("[data-animate='stagger']").forEach((container) => {
        const cards = container.querySelectorAll<HTMLElement>(".card");
        if (!cards.length) return;
        gsap.from(cards, {
          y: isMobile() ? 12 : 30,
          opacity: 0,
          stagger: isMobile() ? 0.08 : 0.12,
          duration: isMobile() ? 0.5 : 0.72,
          ease: "power3.out",
          scrollTrigger: { trigger: container, start: isMobile() ? "top 90%" : "top 78%" },
        });
      });

      // PARALLAX: small parallax for elements with data-parallax
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          onUpdate: (self) => {
            // less movement on mobile
            const move = (self.progress - 0.5) * (isMobile() ? -8 : -20);
            gsap.to(el, { y: move, ease: "none", overwrite: true });
          },
        });
      });
    }, 100); // 100ms delay to ensure layout router mounts first

    // CLEANUP - clear timeout and handle async cleanup
    return () => {
      clearTimeout(initTimeout);
      // Clean up any existing ScrollTrigger instances and Lenis
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return null;
}