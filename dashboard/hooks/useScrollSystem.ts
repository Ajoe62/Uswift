"use client";

import { useLayoutEffect, useState } from "react";
import { gsap } from "gsap";
import Lenis from "@studio-freight/lenis";
// dynamically load initScroll to avoid compile-time "is not a module" error
// import initScroll from "@/lib/scroll/initScroll";

const useScrollSystem = () => {
  const [isGsapReady, setIsGsapReady] = useState(false);

  useLayoutEffect(() => {
    let cleanup: () => void = () => {};
    let mounted = true;

    (async () => {
      try {
        const path = "@/lib/scroll/initScroll";
        const mod = await import(path);
        // support either default export or named export/init function fallback
        const init =
          (mod && (mod.default ?? (mod as any).initScroll)) ??
          (() => () => {});
        if (!mounted) return;
        cleanup = init(Lenis, gsap) ?? (() => {});
        setIsGsapReady(true);
      } catch (e) {
        // if module cannot be loaded, keep a safe no-op cleanup
        // console.warn("initScroll dynamic import failed:", e);
      }
    })();

    return () => {
      mounted = false;
      try {
        cleanup();
      } catch {
        // ignore cleanup errors
      }
      setIsGsapReady(false);
    };
  }, []);

  return { isGsapReady };
};

export default useScrollSystem;