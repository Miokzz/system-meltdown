"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, Stats } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
  ChromaticAberration,
  DepthOfField,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import PhysicsScene from "@/three/PhysicsScene";
import CameraRig from "@/three/CameraRig";
import Lighting from "@/three/Lighting";
import Particles from "@/three/Particles";
import Sparks from "@/three/Sparks";
import { timeline, useSystem } from "@/utils/store";
function Ready() {
  useEffect(() => {
    useSystem.getState().set({ ready: true });
  }, []);
  return null;
}
function EnergyPulse() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = (timeline.failure - 0.7) / 0.2;
    ref.current.visible =
      t > 0 && t < 1 && useSystem.getState().phase === "failure";
    ref.current.scale.setScalar(0.2 + Math.max(t, 0) * 13);
    (ref.current.material as THREE.MeshBasicMaterial).opacity =
      Math.max(0, 1 - t) * 0.65;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]} visible={false}>
      <torusGeometry args={[1, 0.015, 8, 80]} />
      <meshBasicMaterial color="#c1eaff" transparent toneMapped={false} />
    </mesh>
  );
}
function Effects() {
  const low = useSystem((s) => s.low),
    phase = useSystem((s) => s.phase);
  return (
    <EffectComposer multisampling={low ? 0 : 2} enableNormalPass={!low}>
      <Bloom
        intensity={phase === "failure" ? 1.6 : 0.65}
        luminanceThreshold={1}
        mipmapBlur
      />
      <Vignette offset={0.2} darkness={0.55} />
      <Noise opacity={0.013} blendFunction={BlendFunction.SOFT_LIGHT} />
      {!low ? (
        <DepthOfField target={[0, 0, 0]} focalLength={0.025} bokehScale={0.4} />
      ) : (
        <></>
      )}
      {phase === "failure" ? (
        <ChromaticAberration
          offset={new THREE.Vector2(0.0014, 0.0007)}
          radialModulation
          modulationOffset={0.1}
        />
      ) : (
        <></>
      )}
    </EffectComposer>
  );
}
export default function Laboratory() {
  const low = useSystem((s) => s.low),
    developer = useSystem((s) => s.developer);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const change = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);
  const drag = useRef<{ x: number; y: number } | null>(null);
  return (
    <div
      className="scene"
      aria-label="Interactive 3D experimental computer"
      onPointerDown={(e) => {
        if (useSystem.getState().chapter === 4 && !developer)
          drag.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (drag.current) {
          timeline.orbitX = THREE.MathUtils.clamp(
            timeline.orbitX + (e.clientX - drag.current.x) * 0.003,
            -0.65,
            0.65,
          );
          timeline.orbitY = THREE.MathUtils.clamp(
            timeline.orbitY + (e.clientY - drag.current.y) * 0.004,
            -1,
            1,
          );
          drag.current = { x: e.clientX, y: e.clientY };
        }
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerLeave={() => (drag.current = null)}
    >
      <Canvas
        shadows={low ? false : "percentage"}
        dpr={low ? 1 : [1, 1.6]}
        camera={{ position: [6, 2.4, 8], fov: 38, near: 0.1, far: 60 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        frameloop={visible ? "always" : "never"}
        fallback={
          <div className="webgl-fallback">
            WebGL is unavailable. Enable hardware acceleration and reload to
            enter the laboratory.
          </div>
        }
      >
        <color attach="background" args={["#080b0e"]} />
        <fog attach="fog" args={["#080b0e", 12, 32]} />
        <Suspense fallback={null}>
          <Lighting />
          <PhysicsScene />
          <CameraRig />
          <Particles />
          <Sparks />
          <EnergyPulse />
          <Ready />
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -3.22, 0]}
            receiveShadow
          >
            <planeGeometry args={[60, 60]} />
            <meshStandardMaterial
              color="#10171d"
              metalness={0.65}
              roughness={0.28}
            />
          </mesh>
          <gridHelper
            args={[36, 36, "#121b20", "#0d151a"]}
            position={[0, -3.2, 0]}
          />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.19, 0]}>
            <ringGeometry args={[3.05, 3.065, 128]} />
            <meshBasicMaterial color="#42697a" transparent opacity={0.55} />
          </mesh>
          <Effects />
          <PerformanceMonitor
            onDecline={() => useSystem.getState().set({ low: true })}
          />
          <AdaptiveDpr pixelated />
          {developer && <Stats className="fps-monitor" />}
        </Suspense>
      </Canvas>
    </div>
  );
}
