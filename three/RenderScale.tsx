"use client";
import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { qualityPresets } from "@/utils/quality";
import { calculateRenderScale } from "@/utils/renderScale";
import { useSystem } from "@/utils/store";

/** Resize the existing renderer; preserve the scene, physics and photo controls. */
export default function RenderScale() {
  const quality = useSystem((s) => s.effectiveQuality);
  const get = useThree((s) => s.get);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const currentDpr = useThree((s) => s.viewport.dpr);

  useLayoutEffect(() => {
    const update = () => {
      const state = get();
      const presetDpr = qualityPresets[quality].dpr;
      const desiredDpr =
        quality === "ultra"
          ? presetDpr
          : Math.min(window.devicePixelRatio || 1, presetDpr);
      const dpr = calculateRenderScale(
        state.size.width,
        state.size.height,
        desiredDpr,
        state.gl.capabilities.maxTextureSize,
      );
      if (Math.abs(state.viewport.dpr - dpr) > 0.001) state.setDpr(dpr);
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, [get, width, height, quality, currentDpr]);

  return null;
}
