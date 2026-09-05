import type { Phase } from "./store";
/** Narrative substates are derived from the existing phase + reversible timeline. */
export function sequenceStage(phase: Phase, chapter: number, failure: number) {
  if (phase === "boot") return "BOOT";
  if (phase === "armed") return "OVERRIDE / SILENCE";
  if (phase === "blackout") return "AFTERMATH";
  if (phase === "destroyed") return "INCIDENT REPORT";
  if (phase === "rebuild") return "RECONSTRUCTION";
  if (phase === "failure")
    return failure < 0.16
      ? "FASTENER RELEASE"
      : failure < 0.29
        ? "CAUSAL FAILURE"
        : failure < 0.43
          ? "RETENTION LOST / SLOW MOTION"
          : failure < 0.7
            ? "CONTAINMENT LOST"
            : failure < 0.84
              ? "SHOCKWAVE"
              : "POWER DOWN";
  return [
    "IDLE",
    "INSPECTION",
    "GPU EXTRACTION",
    "DISASSEMBLY",
    "EXPLODED",
    "LOAD TEST / CRITICAL",
  ][chapter];
}
