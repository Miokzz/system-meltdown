import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { timeline, useSystem } from "@/utils/store";
const dummy = new THREE.Object3D();
export default function Sparks() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const low = useSystem((s) => s.low),
    count = low ? 18 : 48;
  useFrame(() => {
    const ref = mesh.current;
    if (!ref) return;
    const t = (timeline.failure - 0.38) * 7;
    ref.visible = useSystem.getState().phase === "failure" && t > 0;
    for (let i = 0; i < count; i++) {
      const age = Math.max(0, t - (i % 8) * 0.13);
      const speed = 1.2 + (i % 5) * 0.3;
      dummy.position.set(
        Math.sin(i * 2.4) * age * speed,
        1 + Math.cos(i * 3.1) * age * speed - age * age * 0.6,
        Math.cos(i * 1.7) * age * speed,
      );
      dummy.rotation.set(i + age * 3, i * 2 + age, i);
      dummy.scale.setScalar(Math.max(0, 1 - age * 0.25) * 0.035);
      dummy.updateMatrix();
      ref.setMatrixAt(i, dummy.matrix);
    }
    ref.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, count]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 3]} />
      <meshBasicMaterial color="#ffb36d" toneMapped={false} />
    </instancedMesh>
  );
}
