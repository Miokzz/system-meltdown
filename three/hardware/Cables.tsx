import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Part, Vec3 } from "../parts";
import { explosionAmount } from "../ExplodedView";
import { timeline, useSystem } from "@/utils/store";
import { GeometryBatch, ModelBuilder } from "./GeometryBatch";
import { hardwareMaterials } from "./materials";

function tube(points: Vec3[], radius: number) {
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    40,
    radius,
    10,
    false,
  );
}

/** Precomputed connector-release morphs avoid rebuilding tube geometry every frame. */
export function Cables({ part }: { part: Part }) {
  const holder = useRef<THREE.Group>(null);
  const meshes = useRef<THREE.Mesh[]>([]);
  const power = part.id === "gpu-power";
  const second = part.id === "tube-b";
  const data = useMemo(() => {
    const initial: Vec3[] = power
      ? [
          [0.24, 0.38, 0.1],
          [0.43, 0.21, 0.25],
          [0.66, -0.23, 0.18],
          [0.49, -0.69, -0.29],
          [-0.1, -0.8, -0.88],
        ]
      : [
          [second ? -0.38 : -0.46, 0.477, -0.175],
          [-0.71, 0.84, 0.02],
          [-0.46, 1.2, 0.49],
          [0.25, 1.25, 0.626],
          [second ? 0.69 : 0.63, 1.2, 0.626],
        ];
    const geometries: THREE.TubeGeometry[] = [];
    const count = power ? 6 : 1;
    for (let strand = 0; strand < count; strand++) {
      const offset = power ? (strand - 2.5) * 0.026 : 0;
      const curve = initial.map((p) => [p[0] + offset, p[1], p[2]] as Vec3);
      const released = curve.map((p, i) => {
        // Endpoints stay seated in their ferrules while the free span settles.
        if (i === 0 || i === curve.length - 1) return [...p] as Vec3;
        return [
          p[0] + Math.sin(i * 1.7) * 0.16,
          p[1] - Math.sin((i / (curve.length - 1)) * Math.PI) * 0.31,
          p[2] + Math.cos(i * 1.4) * 0.12,
        ] as Vec3;
      });
      const geometry = tube(curve, power ? 0.016 : 0.045);
      const morph = tube(released, power ? 0.016 : 0.045);
      geometry.morphAttributes.position = [
        morph.getAttribute("position").clone(),
      ];
      geometry.morphAttributes.normal = [morph.getAttribute("normal").clone()];
      morph.dispose();
      geometries.push(geometry);
    }
    const b = new ModelBuilder();
    if (power) {
      const p = initial[0];
      b.box("plastic", [0.223, 0.126, 0.142], p, 0.006);
      b.box("steel", [0.08, 0.024, 0.111], [p[0], p[1] + 0.076, p[2]], 0.003);
      for (let i = 0; i < 6; i++)
        b.box(
          "gold",
          [0.021, 0.04, 0.003],
          [p[0] - 0.085 + i * 0.034, p[1], p[2] - 0.073],
        );
      b.box("plastic", [0.203, 0.083, 0.134], initial[4], 0.008);
    } else {
      for (const p of [initial[0], initial[4]]) {
        b.cylinder("steel", 0.055, 0.108, p, [0, 0, 0], 20);
        for (let i = 0; i < 5; i++)
          b.ring(
            "anodized",
            0.057,
            0.004,
            [p[0], p[1] - 0.035 + i * 0.017, p[2]],
            [Math.PI / 2, 0, 0],
            24,
          );
      }
    }
    return { geometries, batch: b.finish() };
  }, [power, second]);
  useEffect(() => () => data.geometries.forEach((g) => g.dispose()), [data]);
  useFrame(({ clock }, dt) => {
    const s = useSystem.getState();
    if (s.photo && s.photoPaused) return;
    const release = explosionAmount(timeline.progress, part.start);
    const settling =
      Math.sin(clock.elapsedTime * 1.9 + (second ? 0.8 : 0)) * 0.018 * release;
    for (const mesh of meshes.current)
      if (mesh?.morphTargetInfluences) {
        mesh.morphTargetInfluences[0] = THREE.MathUtils.damp(
          mesh.morphTargetInfluences[0],
          Math.min(1, release + settling),
          6,
          Math.min(dt, 0.05),
        );
      }
    if (holder.current) holder.current.rotation.z = settling * 0.23;
  });
  return (
    <group ref={holder}>
      {data.geometries.map((geometry, i) => (
        <mesh
          key={i}
          args={[geometry, hardwareMaterials().braid]}
          ref={(mesh) => {
            if (mesh) {
              mesh.updateMorphTargets();
              meshes.current[i] = mesh;
            }
          }}
          castShadow
          receiveShadow
          dispose={null}
        />
      ))}
      <GeometryBatch batch={data.batch} />
    </group>
  );
}
