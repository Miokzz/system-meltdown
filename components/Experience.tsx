"use client";
import dynamic from "next/dynamic";
import { Component, useEffect } from "react";
import HUD from "./HUD";
import ScrollController from "./ScrollController";
import FailureSequence from "@/animations/FailureSequence";
import RebuildSequence from "@/animations/RebuildSequence";
import { useSystem } from "@/utils/store";
import { useQuality } from "@/hooks/useQuality";
import { audio } from "@/utils/AudioManager";
import { diagnostics } from "@/utils/diagnostics";
import LabControls from "./LabControls";
import CinematicController from "./CinematicController";
const Laboratory = dynamic(() => import("@/scenes/Laboratory"), { ssr: false });
class SceneBoundary extends Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="webgl-fallback">
        <h2>CONNECTION TO UNIT 06 LOST</h2>
        <p>Your graphics device could not initialize the laboratory.</p>
        <button onClick={() => location.reload()}>RECONNECT</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function Experience() {
  useQuality();
  const developer = useSystem((s) => s.developer);
  useEffect(() => {
    if (!developer) return;
    Object.defineProperty(window, "__SYSTEM_DIAGNOSTICS__", {
      get: () => diagnostics,
      configurable: true,
    });
    return () => {
      Reflect.deleteProperty(window, "__SYSTEM_DIAGNOSTICS__");
    };
  }, [developer]);
  const phase = useSystem((s) => s.phase),
    ready = useSystem((s) => s.ready);
  const loaded = useSystem((s) => s.loadProgress);
  const loadStage = useSystem((s) => s.loadStage);
  const photo = useSystem((s) => s.photo);
  const hideHUD = useSystem((s) => s.hideHUD);
  const reducedFlash = useSystem((s) => s.reducedFlash);
  useEffect(() => {
    if (!ready || phase !== "boot") return;
    diagnostics.loadingMs = performance.now();
    const id = setTimeout(
      () => useSystem.getState().set({ phase: "running" }),
      450,
    );
    return () => clearTimeout(id);
  }, [ready, phase]);
  useEffect(() => {
    const locked =
      ["boot", "armed", "failure", "blackout", "destroyed", "rebuild"].includes(
        phase,
      ) || photo;
    document.documentElement.style.overflow = locked ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [phase, photo]);
  useEffect(() => () => audio.dispose(), []);
  return (
    <main
      data-phase={phase}
      data-photo={photo}
      data-hide-hud={hideHUD}
      data-reduced-flash={reducedFlash}
    >
      <SceneBoundary>
        <Laboratory />
      </SceneBoundary>
      <div className="film-grain" />
      <HUD />
      <ScrollController />
      <FailureSequence />
      <RebuildSequence />
      <CinematicController />
      <LabControls />
      {phase === "boot" && (
        <div className="boot">
          <div className="boot-top">
            SM LABORATORIES <span>BOOT SEQUENCE / 06</span>
          </div>
          <div>
            <p>EXPERIMENTAL HARDWARE DIVISION</p>
            <h2>
              SYSTEM
              <br />
              MELTDOWN<span>®</span>
            </h2>
            <div className="loading-track">
              <i style={{ width: `${loaded}%` }} />
            </div>
            <div className="boot-status">
              <span>{ready ? "HARDWARE ONLINE" : loadStage}</span>
              <span>{String(loaded).padStart(3, "0")}%</span>
            </div>
          </div>
          <small>HANDLE WITH CURIOSITY.</small>
        </div>
      )}
      {(phase === "blackout" || phase === "destroyed") && (
        <div className="ending">
          {phase === "destroyed" && (
            <div className="ending-content">
              <span className="eyebrow">INCIDENT REPORT / UNIT 06</span>
              <h2>you had one job.</h2>
              <p>SYSTEM DESTROYED</p>
              <div>
                Repair cost: <strong>R$ 47.382,91</strong>
              </div>
              <button
                onClick={() => useSystem.getState().set({ phase: "rebuild" })}
              >
                TRY AGAIN <span>↗</span>
              </button>
              <small>WE WON’T TELL ANYONE.</small>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
