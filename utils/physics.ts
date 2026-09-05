import { Vector3 } from "three";
import type { RapierRigidBody } from "@react-three/rapier";
import type { Kind } from "@/three/parts";

export type ImpactMaterial = "metal" | "glass" | "plastic" | "rubber" | "floor";
export interface PhysicalProfile {
  mass: number;
  restitution: number;
  friction: number;
  damping: number;
  material: ImpactMaterial;
}
/** Relative masses are in kilograms. Broad-phase shapes intentionally omit tiny details. */
const profiles: Record<Kind, PhysicalProfile> = {
  screw: {
    mass: 0.006,
    restitution: 0.32,
    friction: 0.58,
    damping: 0.24,
    material: "metal",
  },
  ram: {
    mass: 0.075,
    restitution: 0.12,
    friction: 0.66,
    damping: 0.48,
    material: "plastic",
  },
  fan: {
    mass: 0.18,
    restitution: 0.18,
    friction: 0.7,
    damping: 0.65,
    material: "plastic",
  },
  gpu: {
    mass: 1.65,
    restitution: 0.07,
    friction: 0.72,
    damping: 0.42,
    material: "metal",
  },
  glass: {
    mass: 1.85,
    restitution: 0.08,
    friction: 0.76,
    damping: 0.48,
    material: "glass",
  },
  psu: {
    mass: 2.1,
    restitution: 0.035,
    friction: 0.84,
    damping: 0.5,
    material: "metal",
  },
  cooler: {
    mass: 0.45,
    restitution: 0.1,
    friction: 0.7,
    damping: 0.5,
    material: "metal",
  },
  board: {
    mass: 0.65,
    restitution: 0.08,
    friction: 0.76,
    damping: 0.48,
    material: "plastic",
  },
  cpu: {
    mass: 0.08,
    restitution: 0.1,
    friction: 0.62,
    damping: 0.4,
    material: "metal",
  },
  ssd: {
    mass: 0.045,
    restitution: 0.15,
    friction: 0.62,
    damping: 0.4,
    material: "plastic",
  },
  cable: {
    mass: 0.11,
    restitution: 0.02,
    friction: 0.9,
    damping: 1.3,
    material: "rubber",
  },
  rail: {
    mass: 0.27,
    restitution: 0.12,
    friction: 0.7,
    damping: 0.42,
    material: "metal",
  },
  panel: {
    mass: 0.85,
    restitution: 0.09,
    friction: 0.75,
    damping: 0.48,
    material: "metal",
  },
};
export const physicalProfile = (kind: Kind) => profiles[kind];
/** Mutable, non-React state lets camera, cables and physics share actual world transforms. */
export const physicsRuntime = {
  bodies: new Map<string, RapierRigidBody>(),
  released: new Set<string>(),
  heroPosition: new Vector3(1.22, 1.63, 0.88),
  stage: 0,
  event: "CONTAINMENT STABLE",
  time: 0,
  lastImpact: 0,
  chain: [] as { source: string; target: string; time: number }[],
  reset() {
    this.released.clear();
    this.chain.length = 0;
    this.stage = 0;
    this.event = "CONTAINMENT STABLE";
    this.time = 0;
    this.lastImpact = 0;
  },
};
export const causalTargets: Record<string, string> = {
  "screw-1-1": "fan-2",
  "fan-2": "ram-1",
  "ram-1": "gpu",
  "ram-2": "gpu",
  gpu: "gpu-power",
};
export function releaseAfterImpact(id: string, hit: string) {
  // The nearer DIMM can intercept the fan first on desktop; reduced scenes only have RAM 1.
  const memoryContact =
    (id === "fan-2" || id.startsWith("ram-")) &&
    hit.startsWith("ram-") &&
    hit !== id;
  const next = memoryContact ? hit : causalTargets[id];
  if (
    !next ||
    physicsRuntime.released.has(next) ||
    (id !== "gpu" && hit !== next)
  )
    return;
  physicsRuntime.chain.push({
    source: id,
    target: hit,
    time: physicsRuntime.time,
  });
  physicsRuntime.released.add(next);
  physicsRuntime.stage++;
  physicsRuntime.event =
    next === "gpu"
      ? "PCIe RETENTION LOST"
      : next === "gpu-power"
        ? "POWER CONNECTOR SEVERED"
        : next === "ram-1"
          ? "MEMORY LATCH FAILURE"
          : "FAN MOUNT FRACTURED";
}
