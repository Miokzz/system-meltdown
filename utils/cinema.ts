import { Vector3 } from "three";

/** Shared render-thread values. Never send per-frame camera work through React. */
export const cinema = {
  focus: new Vector3(0, 0.2, 0),
  look: new Vector3(-0.6, 0.2, 0),
  focalLength: 45,
  focusRange: 3.8,
  aperture: 0.45,
  exposure: 1,
  pulse: 0,
  time: 0,
};

export function smoothRange(value: number, begin: number, end: number) {
  const t = Math.min(1, Math.max(0, (value - begin) / (end - begin)));
  return t * t * (3 - 2 * t);
}

/** One coherent envelope drives the lens, flash, dust, and shock front. */
export function shockEnvelope(failure: number) {
  return (
    Math.exp(-Math.max(0, failure - 0.7) * 58) *
    smoothRange(failure, 0.699, 0.708)
  );
}
