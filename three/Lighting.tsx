import { useRef } from "react";
import { Lightformer } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { timeline, useSystem } from "@/utils/store";
import { qualityPresets } from "@/utils/quality";
import { thermal } from "@/utils/thermal";
import { cinema, smoothRange } from "@/utils/cinema";
import StudioEnvironment from "./StudioEnvironment";
import VolumetricBeam from "./VolumetricBeam";
const cold = new THREE.Color("#dae6ee"),
  warning = new THREE.Color("#f1d2b7");
const rimNormal = new THREE.Color("#87b4d4"),
  rimFailure = new THREE.Color("#d34732");
const keyColor = new THREE.Color(),
  rimColor = new THREE.Color();

export default function Lighting() {
  const quality = useSystem((s) => s.effectiveQuality);
  const preset = qualityPresets[quality];
  const key = useRef<THREE.PointLight>(null),
    rim = useRef<THREE.PointLight>(null);
  const overhead = useRef<THREE.SpotLight>(null),
    practical = useRef<THREE.PointLight>(null);
  useFrame((_, dt) => {
    if (!key.current || !rim.current || !overhead.current || !practical.current)
      return;
    const s = useSystem.getState(),
      fail = s.phase === "failure";
    const dead = s.phase === "blackout" || s.phase === "destroyed";
    const fade = dead ? 0.008 : s.phase === "boot" ? 0.12 : 1;
    const tension = smoothRange(thermal.heat, 0.55, 1);
    const failMix = fail ? smoothRange(timeline.failure, 0.12, 0.43) : 0;
    // Neutral key survives failure; the practical/rim alone becomes red.
    keyColor.copy(cold).lerp(warning, tension * 0.24);
    rimColor.copy(rimNormal).lerp(rimFailure, failMix);
    key.current.color.lerp(keyColor, Math.min(1, dt * 3));
    rim.current.color.lerp(rimColor, Math.min(1, dt * 4));
    const pulse = s.reducedFlash ? 0 : cinema.pulse;
    const flicker =
      fail && !s.reducedFlash
        ? Math.sin(cinema.time * 37) > 0.96
          ? 0.45
          : 1
        : 1;
    key.current.intensity = THREE.MathUtils.damp(
      key.current.intensity,
      (56 - failMix * 16 + pulse * 70) * fade,
      3,
      dt,
    );
    rim.current.intensity = (34 + pulse * 34) * fade * flicker;
    overhead.current.intensity = (110 + pulse * 80) * fade;
    practical.current.intensity =
      fade * (fail ? 5 + failMix * 12 : 2.8 + tension * 3);
    practical.current.color.copy(fail ? rimFailure : cold);
  });
  return (
    <>
      <ambientLight intensity={0.18} color="#adc0cc" />
      <pointLight
        ref={key}
        position={[3.5, 4.4, 5]}
        intensity={56}
        distance={20}
        decay={2}
      />
      <pointLight
        ref={rim}
        position={[-3.8, 2.2, -3.5]}
        intensity={34}
        distance={18}
        decay={2}
      />
      <pointLight
        ref={practical}
        position={[1.1, 0.4, 0.25]}
        intensity={2}
        distance={4}
        decay={2}
      />
      <spotLight
        ref={overhead}
        position={[-2.8, 7, 3]}
        angle={0.57}
        penumbra={0.85}
        color="#eef1ed"
        intensity={110}
        distance={22}
        castShadow={preset.shadowSize > 0}
        shadow-mapSize={[preset.shadowSize || 256, preset.shadowSize || 256]}
        shadow-bias={-0.00012}
        shadow-normalBias={0.024}
        shadow-radius={3}
        shadow-camera-near={0.5}
        shadow-camera-far={22}
      >
        {(quality === "high" || quality === "ultra") && (
          <VolumetricBeam light={overhead} />
        )}
      </spotLight>
      <StudioEnvironment resolution={preset.environmentResolution}>
        <color attach="background" args={["#080a0c"]} />
        <Lightformer
          form="rect"
          intensity={4}
          color="#f1f0e7"
          position={[1, 6, 2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[8, 2, 1]}
        />
        <Lightformer
          form="rect"
          intensity={3.5}
          color="#e2ecf2"
          position={[5, 2, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[0.65, 7, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2.1}
          color="#b2c7dc"
          position={[-4, 0.4, -2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[1.4, 6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.45}
          color="#dcc9b0"
          position={[0, -3, 3]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[7, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          color="#d6e0e5"
          position={[-2, 2, 6]}
          rotation={[0, Math.PI, 0]}
          scale={[4, 1.6, 1]}
        />
      </StudioEnvironment>
    </>
  );
}
