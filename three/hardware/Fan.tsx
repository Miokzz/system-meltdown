import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { timeline, useSystem } from "@/utils/store";
import { thermal } from "@/utils/thermal";
import { GeometryBatch, ModelBuilder } from "./GeometryBatch";
import { hardwareMaterials } from "./materials";

function bladeGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(0.085, -0.015);
  shape.bezierCurveTo(0.15, -0.08, 0.26, -0.1, 0.332, -0.075);
  shape.bezierCurveTo(0.367, -0.016, 0.342, 0.065, 0.322, 0.067);
  shape.bezierCurveTo(0.246, 0.023, 0.171, 0.025, 0.084, 0.037);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: 0.014,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.003,
    bevelThickness: 0.003,
    curveSegments: 5,
  });
}

/** Swept blades are one instanced draw; angular velocity has bearing inertia. */
export function Fan({
  scale = 1,
  housing = true,
  index = 0,
}: {
  scale?: number;
  housing?: boolean;
  index?: number;
}) {
  const blades = useRef<THREE.InstancedMesh>(null);
  const rotor = useRef<THREE.Group>(null);
  const blur = useRef<THREE.MeshBasicMaterial>(null);
  const speed = useRef(0);
  const geometry = useMemo(() => bladeGeometry(), []);
  const batch = useMemo(() => {
    const b = new ModelBuilder();
    if (housing) {
      for (const x of [-1, 1]) {
        b.box("paint", [0.08, 0.89, 0.13], [x * 0.405, 0, -0.02], 0.018);
        b.box("paint", [0.74, 0.08, 0.13], [0, x * 0.405, -0.02], 0.018);
        for (const y of [-1, 1]) {
          b.cylinder("rubber", 0.059, 0.15, [x * 0.374, y * 0.374, -0.02]);
          b.screw(x * 0.374, y * 0.374, 0.065, 0.03);
        }
      }
    }
    b.ring("plastic", 0.364, 0.018, [0, 0, 0.028]);
    if (housing) b.ring("led", 0.379, 0.0055, [0, 0, 0.046]);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + 0.5;
      b.box(
        "plastic",
        [0.32, 0.027, 0.027],
        [Math.cos(a) * 0.2, Math.sin(a) * 0.2, -0.046],
        0,
        [0, 0, a],
      );
    }
    b.cylinder("anodized", 0.102, 0.055, [0, 0, 0.045]);
    b.cylinder("brushed", 0.072, 0.004, [0, 0, 0.077]);
    b.ring("steel", 0.074, 0.002, [0, 0, 0.081], undefined, 24);
    b.box("silk", [0.009, 0.043, 0.001], [-0.016, 0, 0.081]);
    b.box("silk", [0.009, 0.032, 0.001], [0.005, -0.006, 0.081]);
    return b.finish();
  }, [housing]);
  useEffect(() => {
    const instance = blades.current;
    if (!instance) return;
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < 9; i++)
      instance.setMatrixAt(
        i,
        matrix.makeRotationZ((i * Math.PI * 2) / 9),
      );
    instance.instanceMatrix.needsUpdate = true;
    return () => {
      instance.dispose();
      geometry.dispose();
    };
  }, [geometry]);
  useFrame((_, delta) => {
    const s = useSystem.getState();
    if (s.photo && s.photoPaused) return;
    const dt = Math.min(delta, 0.05) * timeline.timeScale;
    const dead = s.phase === "blackout" || s.phase === "destroyed";
    const target = dead ? 0 : thermal.rpm * 0.013 * (1 + index * 0.021);
    speed.current = THREE.MathUtils.damp(
      speed.current,
      target,
      dead ? 0.9 : 1.7,
      dt,
    );
    if (rotor.current) rotor.current.rotation.z += speed.current * dt;
    if (blur.current)
      blur.current.opacity = Math.min(speed.current / 48, 1) * 0.045;
  });
  return (
    <group scale={scale}>
      <GeometryBatch batch={batch} />
      <group ref={rotor} position={[0, 0, 0.018]}>
        <instancedMesh
          ref={blades}
          args={[geometry, hardwareMaterials().fanBlade, 9]}
          castShadow
          receiveShadow
          dispose={null}
        />
      </group>
      <mesh position={[0, 0, 0.039]} raycast={() => {}}>
        <ringGeometry args={[0.12, 0.342, 48]} />
        <meshBasicMaterial
          ref={blur}
          color="#86999d"
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
