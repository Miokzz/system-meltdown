import { create } from "zustand";
export type Phase =
  | "boot"
  | "running"
  | "armed"
  | "failure"
  | "blackout"
  | "destroyed"
  | "rebuild";
export const timeline = {
  progress: 0,
  failure: 0,
  rebuild: 0,
  orbitX: 0,
  orbitY: 0,
};
interface SystemState {
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
