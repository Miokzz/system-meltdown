import type { Part, Vec3 } from "./parts";
/** Pure, reversible timeline. Never accumulates transforms while scrolling. */
export function explosionAmount(progress: number, start: number) {
  const t = Math.max(0, Math.min(1, (progress - start) / 0.19));
  return t * t * (3 - 2 * t);
}
export function partPosition(part: Part, progress: number): Vec3 {
  const t = explosionAmount(progress, part.start);
  return part.position.map((v, i) => v + part.explode[i] * t) as Vec3;
}
