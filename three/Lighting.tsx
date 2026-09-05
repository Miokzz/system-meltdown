import { useRef } from "react";
import { Environment, Lightformer, SpotLight } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { timeline, useSystem } from "@/utils/store";
export default function Lighting() {
  const low = useSystem((s) => s.low);
  const key = useRef<THREE.PointLight>(null),
    rim = useRef<THREE.PointLight>(null);
  useFrame((_, dt) => {
    if (!key.current || !rim.current) return;
    const phase = useSystem.getState().phase,
      fail = phase === "failure";
    key.current.color.lerp(
      new THREE.Color(fail ? "#ff3030" : "#b8e4ff"),
      dt * 3,
    );
    const pulse =
      fail && timeline.failure > 0.7 && timeline.failure < 0.76 ? 70 : 0;
    key.current.intensity = THREE.MathUtils.damp(
      key.current.intensity,
      phase === "boot" ? 0 : 30 + pulse,
      2,
      dt,
    );
    rim.current.color.set(fail ? "#ff1800" : "#1b7bff");
  });
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight ref={key} position={[2, 3, 4]} intensity={30} distance={15} />
      <pointLight
        ref={rim}
        position={[-3, 1, -2]}
        intensity={28}
        distance={15}
      />
      <SpotLight
        position={[1, 7, 3]}
        angle={0.5}
        penumbra={1}
        intensity={65}
        distance={13}
        attenuation={6}
        anglePower={5}
        opacity={0.07}
        volumetric={!low}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.001}
      />
      <Environment resolution={128}>
        <Lightformer
          form="rect"
          intensity={3}
          position={[0, 5, -1]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[9, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={2}
          position={[-5, 1, 2]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[2, 8, 1]}
        />
        <Lightformer
          form="rect"
          color="#6ab6ff"
          intensity={4}
          position={[4, 2, -3]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={[1, 6, 1]}
        />
      </Environment>
    </>
  );
}
