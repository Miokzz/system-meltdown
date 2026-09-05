"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import PhysicsScene from "@/three/PhysicsScene";
import CameraRig from "@/three/CameraRig";
import Lighting from "@/three/Lighting";
import Particles from "@/three/Particles";
import Sparks from "@/three/Sparks";
import CinematicEffects from "@/three/CinematicEffects";
import LaboratorySet from "@/three/LaboratorySet";
import SceneTelemetry from "@/three/SceneTelemetry";
import EmergencySwitch from "@/three/EmergencySwitch";
import RenderScale from "@/three/RenderScale";
import { timeline, useSystem } from "@/utils/store";
import { qualityPresets } from "@/utils/quality";

function Ready() {
  const { gl, scene, camera } = useThree();
  const compiled = useRef(false),
    warmFrames = useRef(0),
    started = useRef(false),
    alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useFrame(() => {
    // Environment capture and the composer's tone mapping must settle first.
    // Compiling earlier races shader variants retired by the first render.
    if (!started.current && ++warmFrames.current >= 3) {
      started.current = true;
      useSystem
        .getState()
        .set({ loadStage: "COMPILING HARDWARE MATERIALS", loadProgress: 52 });
      void gl
        .compileAsync(scene, camera)
        .then(() => {
          if (!alive.current) return;
          compiled.current = true;
          warmFrames.current = 0;
          useSystem
            .getState()
            .set({ loadStage: "WARMING LIGHT & PHYSICS", loadProgress: 86 });
        })
        .catch(() => {
          // Drivers without asynchronous compilation compile during first draw.
          if (alive.current) compiled.current = true;
        });
    }
    if (!compiled.current || useSystem.getState().ready) return;
    if (++warmFrames.current >= 8)
      useSystem
        .getState()
        .set({ ready: true, loadStage: "HARDWARE ONLINE", loadProgress: 100 });
  });
  return null;
}
function EnergyPulse() {
  const ref = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ opacity: { value: 0 } }), []);
  useFrame(() => {
    if (!ref.current) return;
    const s = useSystem.getState(),
      t = (timeline.failure - 0.7) / 0.13;
    ref.current.visible =
      t > 0 && t < 1 && s.phase === "failure" && !s.reducedFlash;
    ref.current.scale.setScalar(0.2 + Math.max(t, 0) * 12);
    if (material.current)
      material.current.uniforms.opacity.value =
        Math.pow(Math.max(0, 1 - t), 2) * 0.22;
  });
  return (
    <mesh ref={ref} visible={false} position={[0, -0.7, 0]}>
      <sphereGeometry args={[1, 40, 24]} />
      <shaderMaterial
        ref={material}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        uniforms={uniforms}
        vertexShader={`varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`}
        fragmentShader={`varying vec3 vN; varying vec3 vV; uniform float opacity; void main(){float edge=pow(1.-abs(dot(normalize(vN),normalize(vV))),20.); gl_FragColor=vec4(vec3(1.2,1.6,1.8),edge*opacity); }`}
      />
    </mesh>
  );
}
export default function Laboratory() {
  const quality = useSystem((s) => s.effectiveQuality);
  const preset = qualityPresets[quality];
  const photo = useSystem((s) => s.photo);
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
      style={{ touchAction: photo ? "none" : "pan-y" }}
      onPointerDown={(e) => {
        const s = useSystem.getState();
        if (s.chapter === 4 && !s.developer && !s.photo)
          drag.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (!drag.current) return;
        timeline.orbitX = THREE.MathUtils.clamp(
          timeline.orbitX + (e.clientX - drag.current.x) * 0.003,
          -0.8,
          0.8,
        );
        timeline.orbitY = THREE.MathUtils.clamp(
          timeline.orbitY + (e.clientY - drag.current.y) * 0.004,
          -1.2,
          1.2,
        );
        drag.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerLeave={() => {
        drag.current = null;
      }}
    >
      <Canvas
        shadows={preset.shadowSize > 0 ? "soft" : false}
        dpr={1}
        camera={{ position: [7.6, 3.1, 12.5], fov: 32, near: 0.08, far: 70 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        frameloop={visible ? "always" : "never"}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1;
        }}
        fallback={
          <div className="webgl-fallback">
            WebGL is unavailable. Enable hardware acceleration and reload to
            enter the laboratory.
          </div>
        }
      >
        <RenderScale />
        <color attach="background" args={["#07090b"]} />
        <fog attach="fog" args={["#07090b", 18, 45]} />
        <Suspense fallback={null}>
          <SceneTelemetry />
          <Lighting />
          <PhysicsScene />
          <CameraRig />
          <LaboratorySet />
          <Particles />
          <Sparks />
          <EnergyPulse />
          <EmergencySwitch />
          <CinematicEffects />
          <Ready />
        </Suspense>
      </Canvas>
    </div>
  );
}
