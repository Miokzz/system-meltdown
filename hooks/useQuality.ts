import { useEffect } from "react";
import { useSystem } from "@/utils/store";
export function useQuality() {
  useEffect(() => {
    const media = matchMedia("(max-width: 760px)");
    const update = () =>
      useSystem
        .getState()
        .set({
          low:
            media.matches ||
            navigator.hardwareConcurrency <= 4 ||
            matchMedia("(prefers-reduced-motion: reduce)").matches,
        });
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
}
