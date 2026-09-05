import { useMemo } from "react";
import { GeometryBatch, ModelBuilder } from "./GeometryBatch";

function circuit(
  b: ModelBuilder,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const dx = bx - ax,
    dy = by - ay;
  b.box(
    "traces",
    [Math.hypot(dx, dy), 0.0035, 0.001],
    [(ax + bx) / 2, (ay + by) / 2, 0.051],
    0,
    [0, 0, Math.atan2(dy, dx)],
  );
}

export function Motherboard() {
  const batch = useMemo(() => {
    const b = new ModelBuilder();
    b.box("pcb", [2.2, 2.6, 0.085], [0, 0, 0], 0.022);
    // Socket carrier, retaining frame and release lever align with the CPU.
    b.box("plastic", [0.73, 0.72, 0.047], [-0.2, 0.4, 0.072], 0.02);
    for (const x of [-0.526, 0.126])
      b.box("steel", [0.023, 0.66, 0.028], [x, 0.4, 0.111], 0.005);
    for (const y of [0.083, 0.717])
      b.box("steel", [0.67, 0.025, 0.028], [-0.2, y, 0.111], 0.005);
    b.box("gold", [0.47, 0.47, 0.008], [-0.2, 0.4, 0.105]);
    b.tube(
      "steel",
      [
        [0.175, 0.07, 0.13],
        [0.177, 0.67, 0.13],
        [0.2, 0.75, 0.13],
        [0.26, 0.76, 0.13],
      ],
      0.009,
      12,
    );
    for (const x of [-0.55, 0.15])
      for (const y of [0.03, 0.77]) b.screw(x, y, 0.099, 0.023);
    // DIMM slot rails, key and four positive-lock latches.
    for (const x of [0.7, 0.95]) {
      b.box("plastic", [0.115, 1.29, 0.12], [x, 0.5, 0.104]);
      b.box("chips", [0.047, 1.17, 0.122], [x, 0.5, 0.11]);
      for (const y of [-0.16, 1.16]) {
        b.box("silk", [0.13, 0.085, 0.15], [x, y, 0.137], 0.009);
        b.box("plastic", [0.09, 0.07, 0.05], [x, y, 0.237]);
      }
      for (let j = 0; j < 28; j++)
        b.box("gold", [0.028, 0.017, 0.005], [x, -0.058 + j * 0.041, 0.174]);
    }
    // VRM power stages and two machined heatsinks.
    for (let i = 0; i < 7; i++) {
      b.box("vrm", [0.11, 0.11, 0.06], [-0.7, 0.2 + i * 0.137, 0.085], 0.008);
      b.box("vrm", [0.13, 0.1, 0.06], [-0.45 + i * 0.12, 0.965, 0.085], 0.007);
    }
    b.box("anodized", [0.27, 1.12, 0.135], [-0.93, 0.54, 0.105], 0.015);
    for (let i = 0; i < 8; i++)
      b.box("brushed", [0.012, 1.1, 0.1], [-1.043 + i * 0.032, 0.54, 0.205]);
    b.box("anodized", [0.93, 0.17, 0.13], [-0.11, 1.16, 0.109], 0.012);
    for (let i = 0; i < 23; i++)
      b.box("brushed", [0.012, 0.16, 0.075], [-0.548 + i * 0.039, 1.16, 0.2]);
    // Rear I/O shields reveal genuine depth at the exposed edge.
    for (let i = 0; i < 5; i++) {
      b.box(
        "steel",
        [0.17, 0.16, 0.18],
        [-0.987, -0.27 - i * 0.182, 0.115],
        0.009,
      );
      b.box(
        "plastic",
        [0.174, 0.081, 0.105],
        [-1.006, -0.27 - i * 0.182, 0.171],
      );
    }
    for (const y of [-0.52, -0.83]) {
      b.box("plastic", [1.5, 0.106, 0.112], [-0.02, y, 0.102], 0.005);
      b.box("steel", [1.5, 0.023, 0.12], [-0.02, y + 0.047, 0.12]);
      for (let j = 0; j < 46; j++)
        b.box("gold", [0.013, 0.04, 0.005], [-0.69 + j * 0.029, y, 0.169]);
      b.box("plastic", [0.09, 0.13, 0.11], [0.78, y + 0.029, 0.13], 0.006);
    }
    b.box("pcb", [1.17, 0.12, 0.22], [-0.05, -0.6, 0.216]);
    b.box("plastic", [1.21, 0.075, 0.07], [-0.05, -0.6, 0.355]);
    // Chipset, coin cell and NVMe standoffs.
    b.box("chips", [0.42, 0.37, 0.055], [0.52, -0.16, 0.081], 0.009);
    b.box("anodized", [0.47, 0.39, 0.06], [0.52, -0.16, 0.13], 0.012);
    for (let i = 0; i < 10; i++)
      b.box(
        "brushed",
        [0.016, 0.34, 0.025],
        [0.323 + i * 0.044, -0.16, 0.174],
        0,
        [0, 0, -0.32],
      );
    b.cylinder("plastic", 0.115, 0.02, [-0.61, -0.25, 0.07]);
    b.cylinder("steel", 0.094, 0.018, [-0.61, -0.25, 0.087], undefined, 32);
    b.box("silk", [0.055, 0.003, 0.002], [-0.61, -0.25, 0.098]);
    b.box("silk", [0.003, 0.055, 0.002], [-0.61, -0.25, 0.098]);
    // Capacitors, solder pads and grouped low-profile SMT components.
    for (let i = 0; i < 16; i++) {
      const x = i < 8 ? -0.53 : 0.34;
      const y = i < 8 ? 0.84 - i * 0.136 : -0.45 - (i - 8) * 0.099;
      b.cylinder("steel", 0.026, 0.069, [x, y, 0.081], undefined, 12);
      b.cylinder("chips", 0.021, 0.002, [x, y, 0.117], undefined, 12);
      b.box("silk", [0.029, 0.002, 0.001], [x, y, 0.12]);
    }
    for (let i = 0; i < 94; i++) {
      const band = Math.floor(i / 24),
        column = i % 24;
      const x = -0.73 + column * 0.067;
      const y = [-1.18, -0.99, -0.38, 0.835][band];
      const width = i % 5 === 0 ? 0.045 : 0.023;
      b.box(
        i % 7 === 0 ? "vrm" : "chips",
        [width, 0.027, 0.016],
        [x, y, 0.065],
      );
      b.box("steel", [0.008, 0.024, 0.011], [x - width / 2, y, 0.061]);
      b.box("steel", [0.008, 0.024, 0.011], [x + width / 2, y, 0.061]);
    }
    for (let i = 0; i < 25; i++) {
      const x = -0.75 + i * 0.057;
      circuit(b, x, -1.22, x, -1.055);
      circuit(b, x, -1.055, x + 0.13, -0.925);
      circuit(b, x + 0.13, -0.925, x + 0.13, -0.68);
    }
    for (let i = 0; i < 19; i++) {
      const y = -0.26 + i * 0.052;
      circuit(b, 0.23, y, 0.37, y);
      circuit(b, 0.37, y, 0.49, y + 0.12);
      circuit(b, 0.49, y + 0.12, 0.58, y + 0.12);
    }
    // Board edge headers and silkscreen registration marks.
    for (let i = 0; i < 20; i++) {
      b.box(
        "plastic",
        [0.061, 0.063, 0.026],
        [-0.76 + i * 0.083, -1.264, 0.059],
      );
      b.box("gold", [0.012, 0.012, 0.068], [-0.76 + i * 0.083, -1.264, 0.105]);
    }
    b.box("plastic", [0.135, 0.71, 0.18], [1.016, 0.15, 0.127], 0.008);
    for (let i = 0; i < 12; i++)
      b.box("gold", [0.022, 0.025, 0.004], [1.013, -0.153 + i * 0.054, 0.22]);
    for (const x of [-1.016, 0.975])
      for (const y of [-1.19, 1.24]) {
        b.cylinder("gold", 0.036, 0.095, [x, y, -0.045], undefined, 12);
        b.screw(x, y, 0.053, 0.029);
      }
    b.label(1, 0.91, 0.079, [-0.08, -0.085, 0.061]);
    b.label(7, 0.73, 0.043, [-0.36, -1.102, 0.061]);
    return b.finish();
  }, []);
  return <GeometryBatch batch={batch} />;
}
