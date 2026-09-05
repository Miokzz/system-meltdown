"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { useSystem } from "@/utils/store";
/** Plays the exact reversible scroll timeline; no second animation implementation. */
export default function CinematicController() {
  const cinematic = useSystem((s) => s.cinematic);
  useEffect(() => {
    if (!cinematic) return;
    const state = useSystem.getState();
    if (state.phase !== "running") return;
    window.scrollTo({ top: 0, behavior: "instant" });
    const cursor = { progress: 0 };
    const sequence = gsap.timeline();
    sequence.to(cursor, {
      progress: 0.975,
      duration: state.benchRunning ? 2.6 : 28,
      ease: "none",
      onUpdate: () =>
        window.scrollTo({
          top:
            cursor.progress *
            (document.documentElement.scrollHeight - innerHeight),
          behavior: "instant",
        }),
    });
    sequence.call(() => useSystem.getState().set({ coverOpen: true }));
    sequence.call(
      () => {
        const current = useSystem.getState();
        if (current.phase === "running") current.set({ phase: "armed" });
      },
      [],
      "+=0.8",
    );
    const unsubscribe = useSystem.subscribe((s) => {
      sequence.paused(s.photo && s.photoPaused);
      if (s.phase === "destroyed" && s.cinematic) s.set({ cinematic: false });
    });
    return () => {
      sequence.kill();
      unsubscribe();
    };
  }, [cinematic]);
  return null;
}
