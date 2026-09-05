"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { timeline, useSystem } from "@/utils/store";
import { audio } from "@/utils/AudioManager";

/** A hinged physical interlock and matching accessible DOM controls share one state. */
export default function EmergencySwitch() {
  const group = useRef<THREE.Group>(null),
    guard = useRef<THREE.Group>(null),
    button = useRef<THREE.Mesh>(null);
  const label = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#141619";
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = "#adb4b5";
    ctx.font = "26px monospace";
    ctx.textAlign = "center";
    ctx.fillText("GRAVITY CONTAINMENT", 256, 44);
    ctx.fillStyle = "#b45d52";
    ctx.font = "bold 31px monospace";
    ctx.fillText("MANUAL OVERRIDE", 256, 93);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
  useEffect(() => () => label.dispose(), [label]);
  useFrame((_, dt) => {
    const s = useSystem.getState();
    if (!group.current || !guard.current || !button.current) return;
    group.current.visible =
      s.chapter === 5 &&
      !["blackout", "destroyed", "rebuild"].includes(s.phase) &&
      timeline.failure < 0.35;
    guard.current.rotation.x = THREE.MathUtils.damp(
      guard.current.rotation.x,
      s.coverOpen ? -1.55 : 0,
      7,
      dt,
    );
    button.current.position.y = THREE.MathUtils.damp(
      button.current.position.y,
      s.phase === "armed" ? 0.23 : 0.29,
      14,
      dt,
    );
  });
  const open = () => {
    const s = useSystem.getState();
    if (s.phase === "running") {
      s.set({ coverOpen: !s.coverOpen });
      audio.play("click");
    }
  };
  const press = () => {
    const s = useSystem.getState();
    if (s.phase === "running" && s.coverOpen) {
      s.set({ phase: "armed" });
      audio.play("click");
    }
  };
  return (
    <group
      ref={group}
      position={[-2.5, -1.85, 2]}
      rotation={[0, 0.25, 0]}
      visible={false}
    >
      <mesh position={[0, -0.75, 0]} castShadow>
        <boxGeometry args={[0.12, 1.5, 0.17]} />
        <meshStandardMaterial
          color="#343b3f"
          metalness={0.85}
          roughness={0.32}
        />
      </mesh>
      <RoundedBox
        args={[1.35, 0.35, 1.05]}
        radius={0.07}
        smoothness={3}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#1d2227"
          metalness={0.8}
          roughness={0.31}
        />
      </RoundedBox>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.19, 0.3]}>
        <planeGeometry args={[1.16, 0.29]} />
        <meshStandardMaterial map={label} metalness={0.25} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.205, -0.1]}>
        <cylinderGeometry args={[0.33, 0.33, 0.07, 48]} />
        <meshStandardMaterial
          color="#53565a"
          metalness={0.93}
          roughness={0.23}
        />
      </mesh>
      <mesh
        ref={button}
        position={[0, 0.29, -0.1]}
        onClick={(e) => {
          e.stopPropagation();
          press();
        }}
        castShadow
      >
        <cylinderGeometry args={[0.26, 0.28, 0.15, 48]} />
        <meshPhysicalMaterial
          color="#7d1914"
          roughness={0.24}
          clearcoat={1}
          clearcoatRoughness={0.2}
          emissive="#a2200f"
          emissiveIntensity={0.23}
        />
      </mesh>
      <group ref={guard} position={[0, 0.34, -0.48]}>
        <mesh
          position={[0, 0.07, 0.38]}
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
        >
          <boxGeometry args={[0.9, 0.09, 0.8]} />
          <meshPhysicalMaterial
            color="#d5e1de"
            transmission={0.94}
            roughness={0.09}
            thickness={0.05}
            ior={1.49}
            transparent
            opacity={1}
          />
        </mesh>
        <mesh position={[0, 0.07, 0.77]}>
          <boxGeometry args={[0.9, 0.045, 0.035]} />
          <meshStandardMaterial
            color="#62736f"
            metalness={0.8}
            roughness={0.23}
          />
        </mesh>
      </group>
      {[-0.43, 0.43].map((x) => (
        <mesh
          key={x}
          position={[x, 0.32, -0.47]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.055, 0.055, 0.16, 20]} />
          <meshStandardMaterial
            color="#727b7e"
            metalness={0.96}
            roughness={0.22}
          />
        </mesh>
      ))}
      {[-0.57, 0.57].flatMap((x) =>
        [-0.4, 0.4].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.19, z]}>
            <cylinderGeometry args={[0.035, 0.035, 0.025, 6]} />
            <meshStandardMaterial
              color="#52595c"
              metalness={0.92}
              roughness={0.25}
            />
          </mesh>
        )),
      )}
    </group>
  );
}
