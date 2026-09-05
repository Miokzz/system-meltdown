"use client";
import { useEffect, useRef, useState } from "react";
import { chapterNames, timeline, useSystem } from "@/utils/store";
import { audio } from "@/utils/AudioManager";
const copy = [
  [
    "EXPERIMENTAL SYSTEM",
    "UNIT 06",
    "Engineered beyond reason.",
    "Handle with curiosity.",
  ],
  ["CONTAINMENT RELEASE", "ACCESS", "Every sealed system", "has a way in."],
  [
    "GRAPHICS SUBSYSTEM",
    "UNBOUND",
    "24 billion transistors.",
    "Nothing holding them back.",
  ],
  ["COMPONENT EXTRACTION", "DETACH", "A delicate balance.", "Piece by piece."],
  ["SYSTEM ANATOMY", "EXPOSED", "Nothing to hide.", "Everything to lose."],
  ["THERMAL ANOMALY", "UNSTABLE", "Some things are better", "left untouched."],
];
export default function HUD() {
  const { phase, chapter, sound, developer, hover, toast } = useSystem();
  const logoClicks = useRef(0);
  const [metrics, setMetrics] = useState([38, 12, 64, 420]);
  useEffect(() => {
    const id = setInterval(() => {
      const p = timeline.progress;
      const fail = useSystem.getState().phase === "failure";
      setMetrics([
        Math.round(
          38 +
            p * 65 +
            (fail ? timeline.failure * 90 : Math.sin(Date.now() / 1700) * 1.5),
        ),
        Math.round(12 + p * 83),
        64,
        Math.round(420 + p * 730),
      ]);
    }, 450);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => useSystem.getState().set({ toast: "" }), 3800);
    return () => clearTimeout(id);
  }, [toast]);
  const critical = chapter === 5 || phase === "failure";
  const current = copy[chapter];
  const navigate = (i: number) => {
    audio.play("click");
    window.scrollTo({
      top:
        (document.documentElement.scrollHeight - innerHeight) * (i / 6 + 0.025),
      behavior: "smooth",
    });
  };
  return (
    <div className={`hud ${critical ? "critical" : ""}`}>
      <header>
        <button
          className="brand"
          aria-label="SYSTEM MELTDOWN logo"
          onClick={() => {
            audio.play("click");
            if (++logoClicks.current === 7) {
              useSystem
                .getState()
                .set({
                  developer: true,
                  toast: "DEVELOPER MODE — DRAG TO THROW",
                });
            }
          }}
        >
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            SYSTEM
            <br />
            MELTDOWN<span className="brand-dot">®</span>
          </span>
        </button>
        <div className="header-center">
          <span className="status-dot" />
          {developer
            ? "DEVELOPER MODE"
            : critical
              ? "CONTAINMENT COMPROMISED"
              : "ALL SYSTEMS NOMINAL"}
        </div>
        <button
          className="sound-button"
          onClick={() => {
            void audio.toggle(!sound);
            useSystem.getState().set({ sound: !sound });
          }}
          aria-pressed={sound}
        >
          <span className={`wave ${sound ? "playing" : ""}`}>
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
          SOUND {sound ? "ON" : "OFF"}
        </button>
      </header>
      <div className="side-index">
        <span>SM—06</span>
        <span>EXPERIMENTAL HARDWARE DIVISION</span>
      </div>
      <section className="chapter-copy" key={chapter}>
        <div className="eyebrow">
          <span /> {current[0]}
        </div>
        <h1>
          {current[1]}
          <sup>{String(chapter + 1).padStart(2, "0")}</sup>
        </h1>
        <p>
          {current[2]}
          <br />
          <span>{current[3]}</span>
        </p>
        {chapter === 0 && (
          <button className="explore" onClick={() => navigate(1)}>
            EXPLORE THE SYSTEM <span>↗</span>
          </button>
        )}
        {chapter === 4 && (
          <span className="orbit-hint">DRAG TO ORBIT · HOVER TO INSPECT</span>
        )}
        {chapter === 5 && (
          <div className="danger-action">
            <span>DO NOT TOUCH ANYTHING</span>
            <button
              disabled={phase !== "running"}
              onClick={() => {
                audio.play("click");
                useSystem.getState().set({ phase: "armed" });
              }}
            >
              DO NOT PRESS <b>↗</b>
            </button>
            <small>MANUAL OVERRIDE / IRREVERSIBLE*</small>
          </div>
        )}
      </section>
      <aside className="telemetry">
        <div className="telemetry-title">
          LIVE TELEMETRY <span>↗</span>
        </div>
        {["CORE TEMP", "GPU LOAD", "MEMORY", "POWER DRAW"].map((name, i) => (
          <div className="metric" key={name}>
            <span>{name}</span>
            <div>
              <strong>{metrics[i]}</strong>
              <small>{["°C", "%", "GB", "W"][i]}</small>
            </div>
            <div className="meter">
              {Array.from({ length: 22 }, (_, n) => (
                <i
                  key={n}
                  style={{
                    opacity:
                      n <
                      (i === 0 ? metrics[i] / 5 : i === 1 ? metrics[i] / 5 : 14)
                        ? 1
                        : 0.18,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
        <div className="telemetry-foot">
          {critical ? "⚠ THRESHOLD EXCEEDED" : "↑ 0.008 ms LATENCY"}
        </div>
      </aside>
      <div className="object-coordinate">
        <span>+ X 006.82</span>
        <span>Y 024.91 +</span>
      </div>
      {hover && (
        <div className="component-tooltip">
          <span>COMPONENT IDENTIFIED</span>
          <strong>{hover === "GPU" ? "RTX EXPERIMENTAL GPU" : hover}</strong>
          <div>
            CORE CLOCK <b>2,850 MHz</b>
          </div>
          <div>
            TEMPERATURE <b>{metrics[0]}°C</b>
          </div>
          <div>
            POWER <b>320 W</b>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      {phase === "failure" && (
        <div className="failure-warning">
          <span>WARNING / 0x0006</span>
          <strong>SYSTEM FAILURE</strong>
          <span>GRAVITY CONTAINMENT LOST</span>
        </div>
      )}
      {phase === "rebuild" && (
        <div className="rebuild-caption">
          RECONSTRUCTING UNIT 06<span>PLEASE PRETEND THIS NEVER HAPPENED.</span>
        </div>
      )}
      <footer>
        <div className="scroll-cue">
          <span className="mouse-shape" />
          <div>
            {chapter === 5
              ? "PROCEED AT YOUR OWN RISK"
              : "SCROLL TO DISASSEMBLE"}
            <small>
              {chapter === 5
                ? "CURIOSITY HAS CONSEQUENCES"
                : "A LITTLE CURIOSITY NEVER HURT."}
            </small>
          </div>
        </div>
        <nav aria-label="Experience chapters">
          {chapterNames.map((name, i) => (
            <button
              key={name}
              className={i === chapter ? "active" : ""}
              onClick={() => navigate(i)}
              aria-label={`Chapter ${i + 1}: ${name}`}
              aria-current={i === chapter ? "step" : undefined}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              <i />
            </button>
          ))}
        </nav>
        <div className="chapter-counter">
          {String(chapter + 1).padStart(2, "0")}
          <span>/ 06</span>
          <small>{chapterNames[chapter]}</small>
        </div>
      </footer>
    </div>
  );
}
