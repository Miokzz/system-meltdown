import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { timeline, useSystem } from "@/utils/store";
export default function Particles() {
  const low = useSystem((s) => s.low),
    ref = useRef<THREE.Points>(null);
  const positions = useMemo(
    () =>
      new Float32Array(
        Array.from(
          { length: (low ? 70 : 200) * 3 },
          (_, i) => Math.sin(i * 78.233) * 12,
        ),
      ),
    [low],
  );
  useFrame((_, dt) => {
    if (ref.current) {
      ref.current.rotation.y += dt * 0.008;
      ref.current.rotation.z = Math.sin(timeline.failure * Math.PI) * 0.2;
    }
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.017}
        color="#91b6ce"
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
