import type { Quality } from "./store";
/** Deliberately bounded presets: ULTRA is opt-in, auto starts conservatively. */
export const qualityPresets = {
  ultra: {
    dpr: 2,
    shadowSize: 2048,
    environmentResolution: 512,
    particles: 240,
    dof: true,
    ao: true,
    msaa: 4,
  },
  high: {
    dpr: 1.6,
    shadowSize: 1024,
    environmentResolution: 256,
    particles: 150,
    dof: true,
    ao: false,
    msaa: 2,
  },
  medium: {
    dpr: 1.25,
    shadowSize: 512,
    environmentResolution: 128,
    particles: 85,
    dof: false,
    ao: false,
    msaa: 0,
  },
  low: {
    dpr: 1,
    shadowSize: 0,
    environmentResolution: 64,
    particles: 35,
    dof: false,
    ao: false,
    msaa: 0,
  },
} satisfies Record<
  Quality,
  {
    dpr: number;
    shadowSize: number;
    environmentResolution: number;
    particles: number;
    dof: boolean;
    ao: boolean;
    msaa: number;
  }
>;
