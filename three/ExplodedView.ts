import type { Part, Vec3 } from "./parts";
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
/** Pure and reversible: the same scroll sample always produces the same transform. */
export function explosionAmount(progress: number, start: number) {
  return smooth((progress - start) / 0.19);
}
/** A short mechanical disengagement precedes the longer engineering-view travel. */
export function writePartTransform(
  part: Part,
  progress: number,
  position: Vec3,
  rotation: Vec3,
) {
  const raw = clamp((progress - part.start) / 0.19);
  const travel = smooth((raw - 0.18) / 0.82);
  const release = smooth(raw / 0.22) * (1 - travel);
  const t = part.kind ? travel : smooth(raw);
  for (let i = 0; i < 3; i++) {
    position[i] = part.position[i] + part.explode[i] * t;
    rotation[i] = 0;
  }
  if (part.kind === "screw") {
    const unscrew = smooth(raw / 0.44);
    position[2] += release * 0.1;
    rotation[2] = unscrew * Math.PI * 10;
    rotation[0] = Math.sin(raw * Math.PI * 7) * release * 0.035;
  } else if (part.kind === "gpu") {
    position[1] += release * 0.045;
    position[2] += release * 0.19;
    rotation[2] = Math.sin(raw * Math.PI) * -0.07;
    rotation[0] = travel * 0.1;
  } else if (part.kind === "glass") {
    position[1] += release * 0.055;
    position[2] += release * 0.13;
    rotation[1] = travel * -1.05;
  } else if (part.kind === "ram") {
    position[2] += release * 0.16;
    rotation[0] = Math.sin(raw * Math.PI) * 0.035;
  } else if (part.kind === "cable") {
    position[2] += release * 0.15;
    rotation[2] = Math.sin(raw * Math.PI * 2) * release * 0.12;
  } else if (part.kind === "fan" || part.kind === "cooler") {
    position[2] += release * 0.075;
    rotation[2] =
      Math.sin(raw * Math.PI) * (part.kind === "fan" ? 0.06 : -0.04);
  }
}
export function partPosition(part: Part, progress: number): Vec3 {
  const position: Vec3 = [0, 0, 0];
  writePartTransform(part, progress, position, [0, 0, 0]);
  return position;
}
/** Reassembly is ordered: structure, electronics, harness, glass, fasteners. */
export function rebuildAmount(part: Part, progress: number) {
  const delay =
    part.kind === "rail" || part.kind === "panel"
      ? 0.035
      : part.kind === "board"
        ? 0.1
        : part.kind === "psu"
          ? 0.16
          : part.kind === "gpu"
            ? 0.23
            : part.kind === "ram" || part.kind === "cpu" || part.kind === "ssd"
              ? 0.3
              : part.kind === "cooler" || part.kind === "fan"
                ? 0.35
                : part.kind === "cable"
                  ? 0.43
                  : part.kind === "glass"
                    ? 0.55
                    : 0.64;
  return smooth((progress - delay) / Math.min(0.36, 1 - delay));
}
