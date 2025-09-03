"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollEffects(): null {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
    // Lenis doesn't expose `update()` in all versions — call its raf method once on refresh
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
        { y: 28, opacity: 0, willChange: "transform,opacity" },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          ease: "power3.out",
          overwrite: true,
          scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
        }
      );
    });

    // STAGGER: grid/card containers with data-animate="stagger" and .card children
    gsap.utils.toArray<HTMLElement>("[data-animate='stagger']").forEach((container) => {
      const cards = container.querySelectorAll<HTMLElement>(".card");
      if (!cards.length) return;
      gsap.from(cards, {
        y: 30,
        opacity: 0,
        stagger: 0.12,
        duration: 0.72,
        ease: "power3.out",
        scrollTrigger: { trigger: container, start: "top 78%" },
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
          // subtle movement proportional to progress
          const move = (self.progress - 0.5) * -20; // tweak multiplier
          gsap.to(el, { y: move, ease: "none", overwrite: true });
        },
      });
    });

    // CLEANUP
    return () => {
      cancelAnimationFrame(rafId);
      ScrollTrigger.getAll().forEach((t) => t.kill());
      try {
        lenis.destroy();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return null;
}