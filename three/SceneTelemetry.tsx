"use client";
import { useEffect, useRef } from "react";
import { addAfterEffect, useFrame, useThree } from "@react-three/fiber";
import { diagnostics } from "@/utils/diagnostics";
import { timeline, useSystem, type Quality } from "@/utils/store";
import { updateThermal } from "@/utils/thermal";
import { sequenceStage } from "@/utils/sequence";
import { physicsRuntime } from "@/utils/physics";

export default function SceneTelemetry() {
  const get = useThree((s) => s.get);
  const samples = useRef<number[]>([]);
  const elapsed = useRef(0),
    report = useRef(0),
    capture = useRef(false);
  const bench = useRef({
    active: false,
    ms: [] as number[],
    elapsed: 0,
    draws: 0,
    triangles: 0,
  });
  useEffect(() => {
    const gl = get().gl;
    // Reset once for the entire scene + postprocessing, not for each render pass.
    gl.info.autoReset = false;
    const request = () => {
      capture.current = true;
    };
    window.addEventListener("meltdown:capture", request);
    const remove = addAfterEffect(() => {
      if (!capture.current) return;
      capture.current = false;
      gl.domElement.toBlob((blob) => {
        if (!blob) {
          useSystem.getState().set({ toast: "CAPTURE FAILED — TRY AGAIN" });
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `system-meltdown-${Date.now()}.png`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        useSystem.getState().set({ toast: "FRAME CAPTURED / PNG" });
      }, "image/png");
    });
    return () => {
      remove();
      gl.info.autoReset = true;
      window.removeEventListener("meltdown:capture", request);
    };
  }, [get]);
  useFrame((_, dt) => {
    const gl = get().gl;
    const state = useSystem.getState();
    const render = gl.info.render;
    diagnostics.draws = render.calls;
    diagnostics.triangles = render.triangles;
    diagnostics.geometries = gl.info.memory.geometries;
    diagnostics.textures = gl.info.memory.textures;
    diagnostics.width = gl.domElement.width;
    diagnostics.height = gl.domElement.height;
    diagnostics.dpr = gl.getPixelRatio();
    diagnostics.quality = state.effectiveQuality;
    diagnostics.stage = sequenceStage(
      state.phase,
      state.chapter,
      timeline.failure,
    );
    diagnostics.chain = physicsRuntime.chain;
    gl.info.reset();
    if (!(state.photo && state.photoPaused))
      updateThermal(
        Math.min(dt, 0.1),
        timeline.progress,
        timeline.failure,
        state.phase,
        state.workload,
      );
    if (state.phase === "boot" || dt > 0.5) return;
    elapsed.current += dt;
    report.current += dt;
    const values = samples.current;
    values.push(dt * 1000);
    if (values.length > 240) values.shift();
    if (report.current > 0.5) {
      report.current = 0;
      const sorted = [...values].sort((a, b) => a - b);
      diagnostics.frameMs = values.reduce((a, b) => a + b, 0) / values.length;
      diagnostics.fps = 1000 / diagnostics.frameMs;
      diagnostics.onePercentLow =
        1000 /
        sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.99))];
      const memory = performance as Performance & {
        memory?: { usedJSHeapSize: number };
      };
      diagnostics.heapMB = (memory.memory?.usedJSHeapSize ?? 0) / 1048576;
      // Sustained low frame rates degrade AUTO only. Explicit user presets stay fixed.
      if (
        state.quality === "auto" &&
        !state.benchRunning &&
        elapsed.current > 8 &&
        values.length >= 120 &&
        diagnostics.frameMs > 29
      ) {
        const lower: Record<Quality, Quality> = {
          ultra: "high",
          high: "medium",
          medium: "low",
          low: "low",
        };
        const effectiveQuality = lower[state.effectiveQuality];
        if (effectiveQuality !== state.effectiveQuality)
          state.set({
            effectiveQuality,
            low: effectiveQuality === "low" || effectiveQuality === "medium",
          });
        elapsed.current = 0;
        values.length = 0;
      }
    }
    const run = bench.current;
    if (state.benchRunning && !run.active) {
      run.active = true;
      run.ms = [];
      run.elapsed = 0;
      run.draws = 0;
      run.triangles = 0;
    }
    if (!state.benchRunning) run.active = false;
    if (run.active) {
      run.ms.push(dt * 1000);
      run.elapsed += dt;
      run.draws += diagnostics.draws;
      run.triangles += diagnostics.triangles;
      if (run.elapsed >= 10) {
        const sorted = [...run.ms].sort((a, b) => a - b),
          n = sorted.length;
        diagnostics.benchmark = {
          fps: n / run.elapsed,
          low: 1000 / sorted[Math.floor(n * 0.99)],
          frameMs: (run.elapsed * 1000) / n,
          frames: n,
          draws: Math.round(run.draws / n),
          triangles: Math.round(run.triangles / n),
          quality: state.effectiveQuality,
        };
        run.active = false;
        state.set({
          benchRunning: false,
          toast: "BENCHMARK COMPLETE / 10 SECONDS",
        });
      }
    }
  }, -100);
  return null;
}
