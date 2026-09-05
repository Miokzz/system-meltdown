"use client";
import { useEffect, useState } from "react";
import {
  useSystem,
  type PhotoSettings,
  type Quality,
  type ViewMode,
} from "@/utils/store";
import { diagnostics } from "@/utils/diagnostics";
import { thermal } from "@/utils/thermal";

function selectQuality(quality: Quality | "auto") {
  const state = useSystem.getState();
  const effectiveQuality =
    quality === "auto" ? (state.mobile ? "medium" : "high") : quality;
  state.set({
    quality,
    effectiveQuality,
    low: effectiveQuality === "low" || effectiveQuality === "medium",
  });
}
export function togglePhoto() {
  const s = useSystem.getState();
  if (["boot", "destroyed", "blackout"].includes(s.phase)) return;
  s.set({ photo: !s.photo, hideHUD: !s.photo, hover: null });
}
function Range({
  name,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  name: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="control-range">
      <span>
        {name}
        <output>
          {value.toFixed(step < 1 ? 1 : 0)}
          {unit}
        </output>
      </span>
      <input
        type="range"
        aria-label={name}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
function DiagnosticsPanel() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 500);
    return () => clearInterval(id);
  }, []);
  const s = useSystem();
  const [command, setCommand] = useState(""),
    [response, setResponse] = useState("Type help for commands.");
  const runCommand = (input: string) => {
    const value = input.trim().toLowerCase();
    const state = useSystem.getState();
    const actions: Record<string, () => string> = {
      help: () =>
        "status / gravity off|on|reverse / magnet / wireframe / colliders / repair",
      status: () =>
        `${state.phase.toUpperCase()} · ${Math.round(thermal.cpu)}°C · ${diagnostics.draws} DRAWS`,
      "gravity off": () => {
        state.set({ gravity: 0 });
        return "GRAVITY CONTAINMENT: ZERO";
      },
      "gravity on": () => {
        state.set({ gravity: -2.6 });
        return "GRAVITY RESTORED";
      },
      "gravity reverse": () => {
        state.set({ gravity: 2.6 });
        return "CEILING IS THE NEW FLOOR";
      },
      magnet: () => {
        state.set({ magnet: !state.magnet });
        return `MAGNET ${state.magnet ? "OFF" : "ON"}`;
      },
      wireframe: () => {
        state.set({ wireframe: !state.wireframe });
        return "GEOMETRY INSPECTION TOGGLED";
      },
      colliders: () => {
        state.set({ colliders: !state.colliders });
        return "COLLIDER OVERLAY TOGGLED";
      },
      repair: () => {
        state.set({
          phase: "rebuild",
          photo: false,
          hideHUD: false,
          cinematic: false,
        });
        return "REBUILDING";
      },
    };
    setResponse(actions[value]?.() ?? "UNKNOWN COMMAND. Try help.");
    setCommand("");
  };
  const b = diagnostics.benchmark;
  return (
    <div className="developer-controls" data-sample={tick}>
      <div className="instrument-readout">
        <strong>
          {Math.round(diagnostics.fps)}
          <small>FPS</small>
        </strong>
        <span>
          {diagnostics.frameMs.toFixed(1)} MS
          <br />
          1% LOW {Math.round(diagnostics.onePercentLow)}
        </span>
      </div>
      <dl className="debug-values">
        <dt>DRAW CALLS</dt>
        <dd>{diagnostics.draws}</dd>
        <dt>TRIANGLES</dt>
        <dd>{diagnostics.triangles.toLocaleString()}</dd>
        <dt>GEOMETRY / TEX</dt>
        <dd>
          {diagnostics.geometries} / {diagnostics.textures}
        </dd>
        <dt>RENDER</dt>
        <dd>
          {diagnostics.width} × {diagnostics.height}
        </dd>
        <dt>HEAP / COLLISIONS</dt>
        <dd>
          {diagnostics.heapMB.toFixed(1)} MB / {diagnostics.collisions}
        </dd>
        <dt>DPR / PRESET</dt>
        <dd>
          {diagnostics.dpr.toFixed(1)} / {diagnostics.quality.toUpperCase()}
        </dd>
        <dt>RENDERER / BODIES</dt>
        <dd>
          {diagnostics.renderer} / {Object.keys(diagnostics.bodies).length}
        </dd>
      </dl>
      <button
        className="control-action"
        disabled={s.phase !== "running" || s.benchRunning}
        onClick={() =>
          s.set({
            benchRunning: true,
            cinematic: true,
            photo: false,
            hideHUD: false,
          })
        }
      >
        {s.benchRunning ? "SAMPLING…" : "RUN BENCHMARK"}
        <span>10 S</span>
      </button>
      {b && (
        <p className="benchmark-result">
          {b.fps.toFixed(1)} AVG · {b.low.toFixed(1)} LOW
          <br />
          {b.draws} DRAWS · {b.quality.toUpperCase()}
        </p>
      )}
      <div className="control-segment" aria-label="Gravity">
        <button
          aria-pressed={s.gravity === -2.6}
          onClick={() => s.set({ gravity: -2.6 })}
        >
          NORMAL
        </button>
        <button
          aria-pressed={s.gravity === 0}
          onClick={() => s.set({ gravity: 0 })}
        >
          ZERO G
        </button>
        <button
          aria-pressed={s.gravity === 2.6}
          onClick={() => s.set({ gravity: 2.6 })}
        >
          INVERT
        </button>
      </div>
      <label className="control-toggle">
        <input
          type="checkbox"
          checked={s.magnet}
          onChange={(e) => s.set({ magnet: e.target.checked })}
        />{" "}
        MAGNET FIELD
      </label>
      <label className="control-toggle">
        <input
          type="checkbox"
          checked={s.colliders}
          onChange={(e) => s.set({ colliders: e.target.checked })}
        />{" "}
        COLLIDERS
      </label>
      <label className="control-toggle">
        <input
          type="checkbox"
          checked={s.wireframe}
          onChange={(e) => s.set({ wireframe: e.target.checked })}
        />{" "}
        WIREFRAME
      </label>
      <form
        className="debug-terminal"
        onSubmit={(e) => {
          e.preventDefault();
          runCommand(command);
        }}
      >
        <label htmlFor="terminal">SM:// CONSOLE</label>
        <input
          id="terminal"
          autoComplete="off"
          spellCheck={false}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="help"
        />
        <output>{response}</output>
      </form>
    </div>
  );
}
export default function LabControls() {
  const s = useSystem();
  const [open, setOpen] = useState(false);
  const photoChange = (value: Partial<PhotoSettings>) =>
    s.set({ photoSettings: { ...s.photoSettings, ...value } });
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches("input, textarea, select")) return;
      if (e.key.toLowerCase() === "p") togglePhoto();
      if (e.key === "Escape") {
        setOpen(false);
        useSystem
          .getState()
          .set({ photo: false, hideHUD: false, cinematic: false });
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  if (["boot", "blackout", "destroyed"].includes(s.phase)) return null;
  return (
    <div className={`lab-controls ${s.photo ? "photo-active" : ""}`}>
      <div className="lab-toolbar">
        {s.phase === "running" && !s.photo && (
          <button
            className={s.cinematic ? "selected" : ""}
            onClick={() => s.set({ cinematic: !s.cinematic })}
          >
            {s.cinematic ? "STOP CINEMATIC" : "PLAY CINEMATIC"}
            <span>↗</span>
          </button>
        )}
        <button
          className={s.photo ? "selected" : ""}
          aria-pressed={s.photo}
          onClick={togglePhoto}
        >
          {s.photo ? "EXIT PHOTO" : "PHOTO MODE"}
          <kbd>P</kbd>
        </button>
        <button aria-expanded={open} onClick={() => setOpen(!open)}>
          {s.developer ? "LAB / DEV" : "LAB TOOLS"}
          <span>{open ? "−" : "+"}</span>
        </button>
      </div>
      {(open || s.photo) && (
        <section
          className="control-panel"
          aria-label={s.photo ? "Photo controls" : "Laboratory controls"}
        >
          <div className="control-heading">
            <span>{s.photo ? "OPTICAL CONTROL" : "LABORATORY / 06"}</span>
            <button
              aria-label="Close controls"
              onClick={() => {
                setOpen(false);
                if (s.photo) togglePhoto();
              }}
            >
              ×
            </button>
          </div>
          {s.photo ? (
            <>
              <p className="control-note">DRAG TO ORBIT · SCROLL TO DOLLY</p>
              <Range
                name="FOCAL LENGTH"
                value={s.photoSettings.focalLength}
                min={24}
                max={100}
                unit=" MM"
                onChange={(v) => photoChange({ focalLength: v })}
              />
              <Range
                name="DEPTH OF FIELD"
                value={s.photoSettings.aperture}
                min={0}
                max={3}
                step={0.1}
                onChange={(v) => photoChange({ aperture: v })}
              />
              <Range
                name="FOCUS DISTANCE"
                value={s.photoSettings.focusDistance}
                min={1}
                max={25}
                step={0.1}
                unit=" M"
                onChange={(v) =>
                  photoChange({ focusDistance: v, autoFocus: false })
                }
              />
              <Range
                name="EXPOSURE"
                value={s.photoSettings.exposure}
                min={0.4}
                max={1.8}
                step={0.1}
                onChange={(v) => photoChange({ exposure: v })}
              />
              <label className="control-toggle">
                <input
                  type="checkbox"
                  checked={s.photoSettings.autoFocus}
                  onChange={(e) => photoChange({ autoFocus: e.target.checked })}
                />{" "}
                AUTOFOCUS
              </label>
              <label className="control-toggle">
                <input
                  type="checkbox"
                  checked={s.photoPaused}
                  onChange={(e) => s.set({ photoPaused: e.target.checked })}
                />{" "}
                PAUSE SIMULATION
              </label>
              <label className="control-toggle">
                <input
                  type="checkbox"
                  checked={s.hideHUD}
                  onChange={(e) => s.set({ hideHUD: e.target.checked })}
                />{" "}
                HIDE HUD
              </label>
              <button
                className="control-action"
                onClick={() =>
                  window.dispatchEvent(new Event("meltdown:capture"))
                }
              >
                CAPTURE FRAME<span>PNG ↗</span>
              </button>
              <p className="control-note">
                {s.effectiveQuality === "low" || s.effectiveQuality === "medium"
                  ? "DOF REQUIRES HIGH OR ULTRA. "
                  : ""}
                CAPTURES THE RENDER WITHOUT INTERFACE.
              </p>
            </>
          ) : (
            <>
              <label className="select-control">
                RENDER QUALITY
                <select
                  value={s.quality}
                  onChange={(e) =>
                    selectQuality(e.target.value as Quality | "auto")
                  }
                >
                  <option value="auto">
                    AUTO ({s.effectiveQuality.toUpperCase()})
                  </option>
                  {(["ultra", "high", "medium", "low"] as const).map((q) => (
                    <option key={q} value={q}>
                      {q.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
              <p className="control-note">
                {s.quality === "ultra"
                  ? "FULL OPTICS · 2× DPR · CONTACT OCCLUSION"
                  : "ADAPTIVE OPTICS / GEOMETRY PRESERVED"}
              </p>
              <div className="control-label">INSPECTION SPECTRUM</div>
              <div className="control-segment">
                {(["normal", "xray", "thermal"] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    aria-pressed={s.viewMode === mode}
                    onClick={() => s.set({ viewMode: mode })}
                  >
                    {mode === "xray" ? "X-RAY" : mode.toUpperCase()}
                  </button>
                ))}
              </div>
              {s.viewMode === "thermal" && (
                <div className="thermal-key">
                  <i />
                  <span>26°C</span>
                  <span>120°C</span>
                </div>
              )}
              <label className="control-toggle">
                <input
                  type="checkbox"
                  checked={s.reducedMotion}
                  onChange={(e) => s.set({ reducedMotion: e.target.checked })}
                />{" "}
                REDUCE CAMERA MOTION
              </label>
              <label className="control-toggle">
                <input
                  type="checkbox"
                  checked={s.reducedFlash}
                  onChange={(e) => s.set({ reducedFlash: e.target.checked })}
                />{" "}
                REDUCE FLASHES
              </label>
              {s.completed && !s.developer && (
                <button
                  className="control-action"
                  onClick={() =>
                    s.set({
                      developer: true,
                      toast: "DISASSEMBLY LAB UNLOCKED / DRAG TO THROW",
                    })
                  }
                >
                  ENTER DISASSEMBLY LAB<span>↗</span>
                </button>
              )}
              {s.developer && <DiagnosticsPanel />}
            </>
          )}
        </section>
      )}
    </div>
  );
}
