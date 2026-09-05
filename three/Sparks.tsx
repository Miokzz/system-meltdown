import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { timeline, useSystem } from "@/utils/store";
import { physicsRuntime } from "@/utils/physics";
const dummy = new THREE.Object3D();
export default function Sparks() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const origin = useRef(new THREE.Vector3());
  const lastBurst = useRef(-1);
  const burstTime = useRef(0);
  const quality = useSystem((s) => s.effectiveQuality),
    count = quality === "ultra" ? 64 : quality === "high" ? 40 : 16;
  useFrame(() => {
    const ref = mesh.current;
    if (!ref) return;
    const s = useSystem.getState();
    const f = timeline.failure;
    const burst = f < 0.27 ? -1 : f < 0.43 ? 0 : f < 0.7 ? 1 : 2;
    if (s.phase !== "failure" || burst < 0) {
      ref.visible = false;
      lastBurst.current = -1;
      return;
    }
    if (lastBurst.current !== burst) {
      const gpu = physicsRuntime.bodies.get("gpu");
      origin.current.copy(
        gpu ? gpu.translation() : { x: -0.1, y: -0.5, z: 0.5 },
      );
      lastBurst.current = burst;
      burstTime.current = physicsRuntime.time;
    }
    const t = physicsRuntime.time - burstTime.current;
    ref.visible = t >= 0 && t < 1.25;
    if (!ref.visible) return;
    for (let i = 0; i < count; i++) {
      const age = Math.max(0, t - (i % 7) * 0.016);
      const speed = 0.8 + (i % 5) * 0.27;
      dummy.position
        .copy(origin.current)
        .add({
          x: Math.sin(i * 2.4) * age * speed,
          y: Math.cos(i * 3.1) * age * speed - age * age * 2,
          z: Math.cos(i * 1.7) * age * speed,
        });
      dummy.rotation.set(i + age * 3, i * 2 + age, i);
      const scale = Math.max(0, 1 - age / 1.1) * 0.013;
      dummy.scale.set(scale, scale, scale * (4 + (i % 5)));
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
      visible={false}
    >
      <boxGeometry />
      <meshBasicMaterial color={[3.5, 1.55, 0.42]} toneMapped={false} />
    </instancedMesh>
  );
}
