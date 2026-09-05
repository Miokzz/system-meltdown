import { create } from "zustand";
export type Phase =
  | "boot"
  | "running"
  | "armed"
  | "failure"
  | "blackout"
  | "destroyed"
  | "rebuild";
export type Quality = "ultra" | "high" | "medium" | "low";
export type ViewMode = "normal" | "xray" | "thermal";
export interface PhotoSettings {
  focalLength: number;
  aperture: number;
  focusDistance: number;
  exposure: number;
  zoom: number;
  autoFocus: boolean;
}
/** High-frequency values live outside React; rendering never dispatches per-frame UI updates. */
export const timeline = {
  progress: 0,
  failure: 0,
  rebuild: 0,
  orbitX: 0,
  orbitY: 0,
  timeScale: 1,
  impact: 0,
};
export interface SystemState {
  phase: Phase;
  chapter: number;
  sound: boolean;
  developer: boolean;
  gpuClicks: number;
  gpuLoose: boolean;
  toast: string;
  hover: string | null;
  low: boolean;
  ready: boolean;
  mobile: boolean;
  quality: Quality | "auto";
  effectiveQuality: Quality;
  reducedMotion: boolean;
  reducedFlash: boolean;
  viewMode: ViewMode;
  photo: boolean;
  photoPaused: boolean;
  hideHUD: boolean;
  photoSettings: PhotoSettings;
  cinematic: boolean;
  coverOpen: boolean;
  gravity: number;
  magnet: boolean;
  colliders: boolean;
  wireframe: boolean;
  benchRunning: boolean;
  workload: number;
  completed: boolean;
  loadStage: string;
  loadProgress: number;
  set: (value: Partial<SystemState>) => void;
}
export const useSystem = create<SystemState>((set) => ({
  phase: "boot",
  chapter: 0,
  sound: false,
  developer: false,
  gpuClicks: 0,
  gpuLoose: false,
  toast: "",
  hover: null,
  low: false,
  ready: false,
  mobile: false,
  quality: "auto",
  effectiveQuality: "high",
  reducedMotion: false,
  reducedFlash: false,
  viewMode: "normal",
  photo: false,
  photoPaused: true,
  hideHUD: false,
  photoSettings: {
    focalLength: 50,
    aperture: 0.7,
    focusDistance: 8,
    exposure: 1,
    zoom: 1,
    autoFocus: true,
  },
  cinematic: false,
  coverOpen: false,
  gravity: -2.6,
  magnet: false,
  colliders: false,
  wireframe: false,
  benchRunning: false,
  workload: -1,
  completed: false,
  loadStage: "LOADING RENDER ENGINE",
  loadProgress: 5,
  set,
}));
export const chapterNames = [
  "CONTAINMENT",
  "ACCESS",
  "GRAPHICS",
  "COMPONENTS",
  "ANATOMY",
  "INSTABILITY",
];
