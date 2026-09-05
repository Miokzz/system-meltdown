/** Read-only browser instrumentation. Exposed globally only in developer mode. */
export const diagnostics = {
  collisions: 0,
  frames: 0,
  chain: [] as { source: string; target: string; time: number }[],
  bodies: {} as Record<
    string,
    {
      x: number;
      y: number;
      z: number;
      dynamic: boolean;
      screenX: number;
      screenY: number;
    }
  >,
  quality: "high",
  fps: 0,
  frameMs: 0,
  onePercentLow: 0,
  draws: 0,
  triangles: 0,
  geometries: 0,
  textures: 0,
  heapMB: 0,
  width: 0,
  height: 0,
  dpr: 1,
  renderer: "WebGL 2",
  loadingMs: 0,
  stage: "BOOT",
  benchmark: null as null | {
    fps: number;
    low: number;
    frameMs: number;
    frames: number;
    draws: number;
    triangles: number;
    quality: string;
  },
};
