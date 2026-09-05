import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { timeline, useSystem } from "@/utils/store";
import { thermal } from "@/utils/thermal";
import { disposeHardwareMaterials, hardwareMaterials } from "./materials";

const normalLed = new THREE.Color("#9fc4d4"),
  failureLed = new THREE.Color("#dc4926");
const heatColor = new THREE.Color(),
  black = new THREE.Color(0);
const hotSurfaces = [
  ["cpuLid", 1],
  ["gpuCore", 0.92],
  ["vrm", 0.79],
  ["copper", 0.69],
  ["gpuShroud", 0.57],
] as const;
let disposal: ReturnType<typeof setTimeout> | undefined;

/** One controller updates shared PBR uniforms without rerendering individual meshes. */
export function MaterialController() {
  const previous = useRef({ xray: false, wireframe: false });
  const visualTime = useRef(0);
  useEffect(() => {
    // Strict Mode immediately remounts effects. Do not delete GL programs while
    // compileAsync still owns them; a genuine canvas unmount releases next tick.
    if (disposal) clearTimeout(disposal);
    return () => {
      disposal = setTimeout(disposeHardwareMaterials, 0);
    };
  }, []);
  useFrame((_, delta) => {
    const s = useSystem.getState(),
      m = hardwareMaterials();
    const dt = Math.min(delta, 0.05);
    if (!(s.photo && s.photoPaused)) visualTime.current += dt;
    const xray = s.viewMode === "xray";
    const thermalMode = s.viewMode === "thermal";
    if (previous.current.xray !== xray) {
      for (const material of [m.gpuShroud, m.pumpCover]) {
        material.transparent = xray;
        material.depthWrite = !xray;
        material.needsUpdate = true;
      }
      previous.current.xray = xray;
    }
    m.gpuShroud.opacity = THREE.MathUtils.damp(
      m.gpuShroud.opacity,
      xray ? 0.13 : 1,
      5,
      dt,
    );
    m.pumpCover.opacity = THREE.MathUtils.damp(
      m.pumpCover.opacity,
      xray ? 0.1 : 1,
      5,
      dt,
    );
    if (previous.current.wireframe !== s.wireframe) {
      for (const material of Object.values(m)) material.wireframe = s.wireframe;
      previous.current.wireframe = s.wireframe;
    }
    const failure = s.phase === "failure";
    const dead = s.phase === "blackout" || s.phase === "destroyed";
    const flicker =
      failure && !s.reducedFlash
        ? 0.65 +
          Math.sin(visualTime.current * 39) *
            Math.sin(visualTime.current * 13) *
            0.28
        : 1;
    const startup = s.phase === "boot" ? 0 : 1;
    const pulse =
      failure && timeline.failure > 0.7 && timeline.failure < 0.73
        ? s.reducedFlash
          ? 0.4
          : 2.4
        : 0;
    m.led.emissive.lerp(failure ? failureLed : normalLed, dt * 3);
    m.led.emissiveIntensity = THREE.MathUtils.damp(
      m.led.emissiveIntensity,
      dead ? 0 : (startup * (1.0 + thermal.heat * 0.17) + pulse) * flicker,
      5,
      dt,
    );
    for (const [name, multiplier] of hotSurfaces) {
      const material = m[name];
      const heat = Math.min(1, thermal.heat * multiplier + 0.18);
      heatColor.setHSL(0.68 * (1 - heat), 0.91, 0.37 + heat * 0.12);
      material.emissive.lerp(thermalMode ? heatColor : black, dt * 5);
      material.emissiveIntensity = THREE.MathUtils.damp(
        material.emissiveIntensity,
        thermalMode ? 0.7 + heat * 0.9 : 0,
        5,
        dt,
      );
    }
  });
  return null;
}
