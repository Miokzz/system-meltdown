"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { timeline, useSystem } from "@/utils/store";
import { audio } from "@/utils/AudioManager";
import { physicsRuntime } from "@/utils/physics";
/** Narrative time remains stable while the physics clock briefly enters slow motion. */
export default function FailureSequence() {
  const active = useSystem((s) =>
    ["armed", "failure", "blackout"].includes(s.phase),
  );
  const paused = useSystem((s) => s.photo && s.photoPaused);
  const sequence = useRef<gsap.core.Timeline | null>(null);
  useEffect(() => {
    if (!active) return;
    physicsRuntime.reset();
    timeline.failure = 0;
    timeline.timeScale = 1;
    const t = gsap.timeline();
    sequence.current = t;
    t.to({}, { duration: 1 })
      .call(() => {
        useSystem.getState().set({ phase: "failure", hover: null });
      })
      .to(timeline, { failure: 1, duration: 7.5, ease: "none" }, 1)
      .call(() => audio.play("glitch"), [], 3.5)
      .call(
        () => {
          audio.play("energy");
          timeline.impact = 0.8;
          physicsRuntime.event = "CONTAINMENT FIELD COLLAPSE";
        },
        [],
        6.25,
      )
      .call(() => useSystem.getState().set({ phase: "blackout" }), [], 8.5)
      .to({}, { duration: 2 })
      .call(() => {
        timeline.timeScale = 1;
        useSystem.getState().set({ phase: "destroyed", completed: true });
      });
    if (useSystem.getState().photo && useSystem.getState().photoPaused)
      t.pause();
    return () => {
      t.kill();
      sequence.current = null;
    };
  }, [active]);
  useEffect(() => {
    sequence.current?.paused(paused);
  }, [paused]);
  return null;
}
