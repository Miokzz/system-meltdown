import { useMemo } from "react";
import type { Part } from "../parts";
import { GeometryBatch, ModelBuilder } from "./GeometryBatch";
import { Fan } from "./Fan";

export function Memory() {
  const batch = useMemo(() => {
    const b = new ModelBuilder();
    b.box("pcb", [0.031, 1.17, 0.246], [0, 0, -0.006]);
    for (const x of [-0.048, 0.048]) {
      b.box("anodized", [0.037, 1.13, 0.203], [x, 0.014, 0.028], 0.008);
      for (let i = 0; i < 8; i++) {
        b.box(
          "chips",
          [0.045, 0.102, 0.07],
          [x * 0.4, -0.445 + i * 0.125, -0.073],
        );
        b.box(
          "brushed",
          [0.043, 0.014, 0.173],
          [x, -0.47 + i * 0.135, 0.038],
          0.003,
        );
      }
      for (let i = 0; i < 30; i++)
        b.box(
          "gold",
          [0.002, 0.022, 0.036],
          [x * 0.35, -0.55 + i * 0.037, -0.118],
        );
    }
    b.box("plastic", [0.117, 1.11, 0.025], [0, 0.006, 0.132], 0.009);
    b.box("led", [0.044, 1.048, 0.018], [0, 0.008, 0.151], 0.006);
    b.label(
      5,
      0.45,
      0.074,
      [0.069, 0.02, 0.018],
      [0, Math.PI / 2, Math.PI / 2],
    );
    for (const y of [-0.48, 0.49]) b.screw(0, y, 0.155, 0.014);
    return b.finish();
  }, []);
  return <GeometryBatch batch={batch} />;
}

export function Processor() {
  const batch = useMemo(() => {
    const b = new ModelBuilder();
    b.box("pcb", [0.54, 0.54, 0.025], [0, 0, -0.029], 0.009);
    b.box("cpuLid", [0.465, 0.467, 0.054], [0, 0, 0.012], 0.014);
    for (const x of [-0.24, 0.24])
      for (let i = 0; i < 10; i++)
        b.box("steel", [0.018, 0.024, 0.008], [x, -0.2 + i * 0.044, -0.01]);
    for (let x = 0; x < 12; x++)
      for (let y = 0; y < 12; y++) {
        if (x > 3 && x < 8 && y > 3 && y < 8) continue;
        b.cylinder(
          "gold",
          0.009,
          0.002,
          [-0.225 + x * 0.041, -0.225 + y * 0.041, -0.044],
          undefined,
          8,
        );
      }
    b.label(2, 0.356, 0.062, [0, 0.016, 0.041]);
    b.box("gold", [0.025, 0.025, 0.001], [-0.228, -0.228, -0.014]);
    return b.finish();
  }, []);
  return <GeometryBatch batch={batch} />;
}

export function CoolingPump() {
  const batch = useMemo(() => {
    const b = new ModelBuilder();
    b.box("steel", [0.72, 0.084, 0.031], [0, 0, -0.151], 0.014);
    b.box("steel", [0.084, 0.72, 0.031], [0, 0, -0.151], 0.014);
    b.cylinder("copper", 0.258, 0.034, [0, 0, -0.151], undefined, 48);
    b.box("pumpCover", [0.6, 0.6, 0.26], [0, 0, -0.009], 0.055);
    b.cylinder("anodized", 0.263, 0.046, [0, 0, 0.131], undefined, 48);
    b.ring("steel", 0.251, 0.011, [0, 0, 0.164]);
    b.ring("led", 0.223, 0.0065, [0, 0, 0.168]);
    b.cylinder("plastic", 0.212, 0.016, [0, 0, 0.17], undefined, 48);
    b.label(6, 0.304, 0.063, [0, 0, 0.179]);
    for (const x of [-0.255, 0.255])
      for (const y of [-0.255, 0.255]) b.screw(x, y, 0.125, 0.023);
    for (const x of [-0.11, 0.11]) {
      b.cylinder("steel", 0.058, 0.12, [x, 0.32, 0.025], [0, 0, 0], 24);
      b.cylinder("rubber", 0.047, 0.06, [x, 0.382, 0.025], [0, 0, 0], 16);
      for (let j = 0; j < 4; j++)
        b.ring(
          "anodized",
          0.054,
          0.004,
          [x, 0.285 + j * 0.021, 0.025],
          [Math.PI / 2, 0, 0],
          24,
        );
    }
    return b.finish();
  }, []);
  return <GeometryBatch batch={batch} />;
}

export function PowerSupply() {
  const batch = useMemo(() => {
    const b = new ModelBuilder();
    b.box("paint", [1.5, 0.46, 1.2], [0, 0, 0], 0.02);
    b.label(3, 0.73, 0.13, [-0.22, 0.004, 0.602]);
    b.box("brushed", [1.42, 0.014, 0.014], [0, 0.211, 0.6]);
    for (let i = 0; i < 6; i++) {
      const x = -0.58 + i * 0.2;
      b.box("plastic", [0.137, 0.105, 0.026], [x, -0.04, -0.608], 0.003);
      for (let j = 0; j < 6; j++)
        b.box(
          "gold",
          [0.018, 0.02, 0.004],
          [
            x - 0.044 + (j % 3) * 0.044,
            -0.065 + Math.floor(j / 3) * 0.048,
            -0.623,
          ],
        );
    }
    for (let i = 0; i < 14; i++) {
      b.box("chips", [0.037, 0.25, 0.004], [-0.62 + i * 0.075, 0, 0.604]);
      b.box("steel", [0.004, 0.25, 0.002], [-0.602 + i * 0.075, 0, 0.607]);
    }
    b.box("paint", [0.8, 0.19, 0.014], [-0.22, 0.006, 0.613], 0.005);
    b.label(3, 0.75, 0.125, [-0.22, 0.003, 0.622]);
    b.cylinder("plastic", 0.319, 0.012, [0.32, 0.235, 0], [0, 0, 0], 48);
    for (let i = 0; i < 7; i++)
      b.ring(
        "steel",
        0.075 + i * 0.038,
        0.006,
        [0.32, 0.286, 0],
        [Math.PI / 2, 0, 0],
      );
    b.box("steel", [0.63, 0.011, 0.013], [0.32, 0.285, 0]);
    b.box("steel", [0.013, 0.011, 0.63], [0.32, 0.285, 0]);
    for (const x of [-0.68, 0.68])
      for (const y of [-0.169, 0.167]) b.screw(x, y, 0.607, 0.021);
    return b.finish();
  }, []);
  return (
    <group>
      <GeometryBatch batch={batch} />
      <group position={[0.32, 0.234, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <Fan scale={0.8} housing={false} index={4} />
      </group>
    </group>
  );
}

export function Storage() {
  const batch = useMemo(() => {
    const b = new ModelBuilder();
    b.box("pcb", [0.95, 0.295, 0.019], [0, 0, -0.027], 0.007);
    for (let i = 0; i < 4; i++)
      b.box(
        "chips",
        [0.156, 0.206, 0.031],
        [-0.285 + i * 0.19, 0, -0.004],
        0.007,
      );
    b.box("anodized", [0.8, 0.274, 0.025], [-0.02, 0, 0.028], 0.011);
    for (let i = 0; i < 24; i++)
      b.box(
        "brushed",
        [0.011, 0.257, 0.039],
        [-0.386 + i * 0.032, 0, 0.05],
        0.003,
      );
    b.box("paint", [0.4, 0.15, 0.008], [-0.044, 0, 0.074], 0.004);
    b.label(4, 0.37, 0.069, [-0.044, 0, 0.079]);
    for (let i = 0; i < 16; i++)
      b.box("gold", [0.047, 0.012, 0.002], [0.451, -0.12 + i * 0.016, -0.017]);
    b.screw(-0.447, 0, -0.01, 0.031);
    return b.finish();
  }, []);
  return <GeometryBatch batch={batch} />;
}

export function Fastener() {
  const batch = useMemo(() => {
    const b = new ModelBuilder();
    b.cylinder("steel", 0.022, 0.136, [0, 0, -0.021], undefined, 16);
    for (let i = 0; i < 8; i++)
      b.ring(
        "brushed",
        0.023,
        0.0037,
        [0, 0, -0.081 + i * 0.016],
        undefined,
        16,
      );
    b.cylinder("anodized", 0.048, 0.023, [0, 0, 0.055], undefined, 24);
    b.cylinder("steel", 0.043, 0.003, [0, 0, 0.069], undefined, 24);
    b.cylinder("chips", 0.021, 0.003, [0, 0, 0.072], undefined, 6);
    b.ring("steel", 0.041, 0.005, [0, 0, 0.071], undefined, 24);
    return b.finish();
  }, []);
  return <GeometryBatch batch={batch} />;
}

export function Chassis({ part }: { part: Part }) {
  const batch = useMemo(() => {
    const b = new ModelBuilder();
    if (part.kind === "rail") {
      b.box("anodized", part.size, [0, 0, 0], 0.014);
      for (const z of [-0.032, 0.032])
        b.box("brushed", [0.012, 3.49, 0.007], [0, 0, z], 0.002);
      for (const y of [-1.65, -0.9, 0, 0.9, 1.65]) b.screw(0, y, 0.041, 0.014);
    } else if (part.id === "roof") {
      // Hollow perimeter and radiator form a credible cooling assembly.
      for (const x of [-1.31, 1.31])
        b.box("anodized", [0.1, 0.095, 1.75], [x, 0, 0], 0.013);
      for (const z of [-0.83, 0.83])
        b.box("anodized", [2.57, 0.095, 0.1], [0, 0, z], 0.013);
      for (let i = 0; i < 29; i++)
        b.box(
          "paint",
          [0.026, 0.014, 1.52],
          [-1.205 + i * 0.086, 0.036, 0],
          0.003,
        );
      for (const z of [-0.55, 0.55])
        b.box("paint", [2.4, 0.2, 0.12], [0, -0.126, z], 0.012);
      for (const x of [-1.13, 1.13])
        b.box("anodized", [0.17, 0.2, 1.08], [x, -0.126, 0], 0.014);
      for (let i = 0; i < 55; i++)
        b.box("brushed", [0.009, 0.137, 1.02], [-1.04 + i * 0.0385, -0.121, 0]);
      for (const x of [0.63, 0.83])
        b.cylinder("steel", 0.056, 0.1, [x, -0.14, 0.626], undefined, 16);
      b.label(6, 0.84, 0.088, [-0.26, -0.119, 0.615]);
      for (const x of [-1.22, 1.22])
        for (const z of [-0.69, 0.69])
          b.cylinder("steel", 0.025, 0.007, [x, 0.053, z], [0, 0, 0], 12);
    } else if (part.id === "base") {
      b.box("paint", part.size, [0, 0, 0], 0.02);
      for (const x of [-1.0, 1.0])
        for (const z of [-0.61, 0.61]) {
          b.box("anodized", [0.39, 0.14, 0.27], [x, -0.108, z], 0.035);
          b.box("rubber", [0.33, 0.035, 0.23], [x, -0.19, z], 0.013);
        }
      for (const x of [-1.21, 1.21])
        b.box("brushed", [0.019, 0.045, 1.58], [x, 0.081, 0], 0.005);
      b.box("led", [1.98, 0.009, 0.01], [0, 0.069, 0.853], 0.003);
      for (let i = 0; i < 23; i++)
        b.box("chips", [0.039, 0.001, 0.55], [-1.14 + i * 0.1, 0.061, 0.05]);
    } else {
      b.box("paint", part.size, [0, 0, 0], 0.019);
      for (const x of [-1.22, 1.22])
        b.box("anodized", [0.071, 3.3, 0.07], [x, 0, 0.059], 0.008);
      for (const y of [-1.63, 1.63])
        b.box("brushed", [2.41, 0.037, 0.017], [0, y, 0.037]);
      // Embossed cable channels and slots remain legible from rear orbit.
      for (const x of [-0.96, 0.85])
        b.box("rubber", [0.19, 0.79, 0.022], [x, 0.52, 0.039], 0.035);
      for (let i = 0; i < 12; i++)
        b.box("chips", [0.64, 0.037, 0.008], [-0.44, -0.57 - i * 0.07, -0.032]);
      for (const x of [-1.16, 1.16])
        for (const y of [-1.53, 1.53]) b.screw(x, y, 0.04, 0.028);
      b.label(7, 1.03, 0.115, [0.02, 0.7, -0.032], [0, Math.PI, 0]);
    }
    return b.finish();
  }, [part]);
  return (
    <group>
      <GeometryBatch batch={batch} />
      {part.id === "roof" &&
        [-0.62, 0.62].map((x, i) => (
          <group
            key={x}
            position={[x, -0.247, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <Fan scale={1.04} housing={false} index={i + 5} />
          </group>
        ))}
    </group>
  );
}
