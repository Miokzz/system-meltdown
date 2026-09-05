export type Vec3 = [number, number, number];
export type Kind =
  | "rail"
  | "panel"
  | "glass"
  | "board"
  | "gpu"
  | "cpu"
  | "cooler"
  | "fan"
  | "ram"
  | "psu"
  | "ssd"
  | "screw"
  | "cable";
export interface Part {
  id: string;
  kind: Kind;
  position: Vec3;
  size: Vec3;
  explode: Vec3;
  start: number;
  label?: string;
  release: number;
}
const p = (
  id: string,
  kind: Kind,
  position: Vec3,
  size: Vec3,
  explode: Vec3,
  start: number,
  release: number,
  label?: string,
): Part => ({ id, kind, position, size, explode, start, release, label });
export const parts: Part[] = [
  p(
    "motherboard",
    "board",
    [-0.15, 0.15, -0.61],
    [2.2, 2.6, 0.09],
    [-0.4, 0.1, -0.5],
    0.52,
    0.48,
    "MOTHERBOARD",
  ),
  p(
    "gpu",
    "gpu",
    [-0.1, -0.53, 0.12],
    [2.1, 0.43, 0.85],
    [-2.5, -0.6, 1.25],
    0.29,
    0.29,
    "GPU",
  ),
  p(
    "processor",
    "cpu",
    [-0.35, 0.55, -0.4],
    [0.54, 0.54, 0.1],
    [-0.8, 0.9, 1.6],
    0.48,
    0.43,
    "PROCESSOR",
  ),
  p(
    "cooler",
    "cooler",
    [-0.35, 0.55, -0.2],
    [0.65, 0.65, 0.35],
    [-1.5, 1.5, 2],
    0.49,
    0.39,
    "COOLING",
  ),
  p(
    "ram-1",
    "ram",
    [0.55, 0.65, -0.35],
    [0.14, 1.2, 0.28],
    [1.2, 1.2, 0.8],
    0.4,
    0.23,
    "MEMORY",
  ),
  p(
    "ram-2",
    "ram",
    [0.8, 0.65, -0.35],
    [0.14, 1.2, 0.28],
    [1.6, 1.4, 0.8],
    0.43,
    0.26,
  ),
  p(
    "power",
    "psu",
    [-0.5, -1.46, -0.05],
    [1.5, 0.46, 1.2],
    [-1.1, -1, 0.5],
    0.54,
    0.5,
    "POWER",
  ),
  p(
    "storage",
    "ssd",
    [-0.6, -0.97, -0.47],
    [0.95, 0.3, 0.1],
    [1.6, -1.3, 0.7],
    0.5,
    0.35,
    "STORAGE",
  ),
  p(
    "side-glass",
    "glass",
    [0, 0, 0.82],
    [2.64, 3.5, 0.035],
    [3.8, 0.2, 1.5],
    0.13,
    0.53,
  ),
  p(
    "rear",
    "panel",
    [0, 0, -0.84],
    [2.64, 3.5, 0.055],
    [0.3, 0.3, -1.4],
    0.56,
    0.6,
  ),
  p(
    "roof",
    "panel",
    [0, 1.79, 0],
    [2.72, 0.08, 1.75],
    [0, 1.4, -0.5],
    0.52,
    0.55,
  ),
  p(
    "base",
    "panel",
    [0, -1.79, 0],
    [2.72, 0.12, 1.75],
    [0, -1.1, -0.2],
    0.55,
    0.57,
  ),
  ...[-1, 0, 1].map((n) =>
    p(
      `fan-${n + 1}`,
      "fan",
      [1.25, n * 1.04, 0],
      [0.19, 0.93, 0.93],
      [1.4 + n * 0.2, n * 0.35, 0.2],
      0.42 + n * 0.035,
      0.14 + (n + 1) * 0.035,
      n === 1 ? "AIRFLOW" : undefined,
    ),
  ),
  ...[-1, 1].flatMap((x) =>
    [-1, 1].map((z) =>
      p(
        `rail-${x}-${z}`,
        "rail",
        [x * 1.32, 0, z * 0.82],
        [0.075, 3.6, 0.075],
        [x * 0.6, 0.1, z * 0.5],
        0.55,
        0.62,
      ),
    ),
  ),
  ...[-1, 1].flatMap((x) =>
    [-1, 1].map((y) =>
      p(
        `screw-${x}-${y}`,
        "screw",
        [x * 1.22, y * 1.63, 0.88],
        [0.085, 0.085, 0.13],
        [x * 0.35, y * 0.2, 1.6],
        0.065,
        0.015 + (x + 1) * 0.018 + (y + 1) * 0.009,
      ),
    ),
  ),
  p(
    "tube-a",
    "cable",
    [0, 0.45, 0],
    [0.1, 0.1, 0.1],
    [0.5, 1.1, 1.1],
    0.45,
    0.33,
  ),
  p(
    "tube-b",
    "cable",
    [0.14, 0.45, 0],
    [0.1, 0.1, 0.1],
    [0.7, 1.3, 1.3],
    0.47,
    0.36,
  ),
  p(
    "gpu-power",
    "cable",
    [0.4, -0.65, 0.25],
    [0.1, 0.1, 0.1],
    [1.3, -0.5, 1.2],
    0.27,
    0.3,
  ),
];
