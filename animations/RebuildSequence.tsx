"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { timeline, useSystem } from "@/utils/store";
import { audio } from "@/utils/AudioManager";
import { physicsRuntime } from "@/utils/physics";
export default function RebuildSequence() {
  const phase = useSystem((s) => s.phase),
    paused = useSystem((s) => s.photo && s.photoPaused);
  const sequence = useRef<gsap.core.Tween | null>(null);
  useEffect(() => {
    if (phase !== "rebuild") return;
    timeline.rebuild = 0;
    timeline.orbitX = 0;
    timeline.orbitY = 0;
    timeline.timeScale = 1;
    timeline.impact = 0;
    physicsRuntime.reset();
    useSystem
      .getState()
      .set({
        coverOpen: false,
        viewMode: "normal",
        gravity: -2.6,
        magnet: false,
        cinematic: false,
      });
    audio.play("restore");
    window.scrollTo({ top: 0, behavior: "instant" });
    // Parts have distinct return windows and clearance arcs in PhysicsScene.
    const tween = gsap.to(timeline, {
      rebuild: 1,
      progress: 0,
      duration: 4.7,
      ease: "none",
      onComplete: () => {
        timeline.failure = 0;
        physicsRuntime.event = "SYSTEM RESTORED";
        useSystem
          .getState()
          .set({
            phase: "running",
            gpuClicks: 0,
            gpuLoose: false,
            toast: "SYSTEM RESTORED · DIAGNOSTICS PASS",
            chapter: 0,
          });
      },
    });
    sequence.current = tween;
    if (useSystem.getState().photo && useSystem.getState().photoPaused)
      tween.pause();
    return () => {
      tween.kill();
      sequence.current = null;
    };
  }, [phase]);
  useEffect(() => {
    sequence.current?.paused(paused);
  }, [paused]);
  return null;
}
