"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { timeline, useSystem } from "@/utils/store";
import { audio } from "@/utils/AudioManager";
export default function RebuildSequence() {
  const phase = useSystem((s) => s.phase);
  useEffect(() => {
    if (phase !== "rebuild") return;
    timeline.rebuild = 0;
    timeline.orbitX = 0;
    timeline.orbitY = 0;
    audio.play("energy");
    window.scrollTo({ top: 0, behavior: "instant" });
    const tween = gsap.to(timeline, {
      rebuild: 1,
      progress: 0,
      duration: 3.5,
      ease: "power3.inOut",
      onComplete: () => {
        timeline.failure = 0;
        useSystem
          .getState()
          .set({
            phase: "running",
            gpuClicks: 0,
            gpuLoose: false,
            toast: "",
            chapter: 0,
          });
      },
    });
    return () => {
      tween.kill();
    };
  }, [phase]);
  return null;
}
