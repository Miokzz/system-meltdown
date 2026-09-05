"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { timeline, useSystem } from "@/utils/store";
export default function ScrollController() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    window.scrollTo({ top: 0, behavior: "instant" });
    const tween = gsap.to(timeline, {
      progress: 1,
      ease: "none",
      scrollTrigger: {
        trigger: ".scroll-track",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        onUpdate: (self) => {
          const chapter = Math.min(5, Math.floor(self.progress * 6));
          if (useSystem.getState().chapter !== chapter)
            useSystem.getState().set({ chapter });
        },
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);
  return <div className="scroll-track" aria-hidden="true" />;
}
