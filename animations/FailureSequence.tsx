"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { timeline, useSystem } from "@/utils/store";
import { audio } from "@/utils/AudioManager";
export default function FailureSequence() {
  const active = useSystem((s) =>
    ["armed", "failure", "blackout"].includes(s.phase),
  );
  useEffect(() => {
    if (!active) return;
    const t = gsap.timeline();
    t.to({}, { duration: 1 })
      .call(() => {
        useSystem.getState().set({ phase: "failure", hover: null });
        audio.play("screw");
      })
      .to(timeline, { failure: 1, duration: 7.5, ease: "none" }, 1)
      .call(() => audio.play("glitch"), [], 3)
      .call(() => audio.play("energy"), [], 6.2)
      .call(() => useSystem.getState().set({ phase: "blackout" }), [], 8.5)
      .to({}, { duration: 2 })
      .call(() => useSystem.getState().set({ phase: "destroyed" }));
    return () => {
      t.kill();
    };
  }, [active]);
  return null;
}
