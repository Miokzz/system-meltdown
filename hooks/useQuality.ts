import { useEffect } from "react";
import { type Quality, useSystem } from "@/utils/store";
export function useQuality() {
  useEffect(() => {
    const mobile = matchMedia("(max-width: 760px)");
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const weak = navigator.hardwareConcurrency <= 4;
      const effectiveQuality: Quality =
        mobile.matches || weak ? "medium" : "high";
      const state = useSystem.getState();
      state.set({
        mobile: mobile.matches,
        reducedMotion: motion.matches,
        reducedFlash: motion.matches,
        ...(state.quality === "auto"
          ? { effectiveQuality, low: effectiveQuality === "medium" }
          : {}),
      });
    };
    update();
    mobile.addEventListener("change", update);
    motion.addEventListener("change", update);
    return () => {
      mobile.removeEventListener("change", update);
      motion.removeEventListener("change", update);
    };
  }, []);
}
