import { useMemo } from "react";
import { GeometryBatch, ModelBuilder } from "./GeometryBatch";
import { Fan } from "./Fan";

/** Open shroud: fin stack and heatpipes remain visible from low macro angles. */
export function GraphicsCard() {
  const batch = useMemo(() => {
    const b = new ModelBuilder();
    // Thin PCB and perforated backplate instead of an opaque solid box.
    b.box("pcb", [2.06, 0.025, 0.76], [0, 0.195, 0]);
    for (const z of [-0.35, 0.35]) {
      b.box("gpuShroud", [2.08, 0.038, 0.115], [0, 0.24, z], 0.012);
      b.box("gpuShroud", [2.08, 0.062, 0.058], [0, -0.195, z * 1.13], 0.013);
    }
    for (const x of [-1.015, 1.015])
      b.box("gpuShroud", [0.06, 0.37, 0.85], [x, 0.016, 0], 0.013);
    for (const x of [-0.65, 0, 0.65]) {
      b.ring("gpuShroud", 0.266, 0.027, [x, -0.213, 0], [Math.PI / 2, 0, 0]);
      // Angled bridges make the cooling assembly read as a manufactured casting.
      b.box(
        "gpuShroud",
        [0.04, 0.032, 0.67],
        [x + 0.3, -0.215, 0],
        0.008,
        [0, 0.17, 0],
      );
    }
    // Side rail leaves a deliberate window onto the dense fin pack.
    b.box("brushed", [1.95, 0.068, 0.025], [0, 0.155, 0.425], 0.009);
    b.box("anodized", [1.95, 0.05, 0.025], [0, -0.126, 0.425], 0.005);
    b.box("led", [1.35, 0.009, 0.012], [-0.25, 0.154, 0.444]);
    b.label(0, 0.96, 0.068, [0.26, 0.082, 0.433]);
    // 67 fins cost a single merged draw, with real negative space between them.
    for (let i = 0; i < 67; i++) {
      const x = -0.94 + i * 0.0284;
      b.box("brushed", [0.008, 0.205, 0.64], [x, 0.035, -0.015]);
    }
    for (let i = 0; i < 5; i++) {
      const z = -0.24 + i * 0.105;
      b.tube(
        "copper",
        [
          [-0.96, 0.095, z],
          [-0.89, -0.08, z],
          [-0.6, -0.1, z],
          [0.45, -0.1, z],
          [0.89, -0.055, z],
          [0.96, 0.11, z],
        ],
        0.023,
        28,
      );
    }
    b.box("gpuCore", [0.3, 0.04, 0.28], [-0.11, 0.235, -0.01], 0.007);
    for (const x of [-0.37, 0.13])
      for (const z of [-0.23, 0.22]) {
        b.box("chips", [0.16, 0.026, 0.13], [x, 0.224, z]);
      }
    for (let i = 0; i < 10; i++) {
      b.box(
        "vrm",
        [0.054, 0.042, 0.07],
        [0.54 + (i % 2) * 0.094, 0.231, -0.27 + Math.floor(i / 2) * 0.12],
      );
    }
    // Gold fingers, slot notch and a real keyed power socket.
    b.box("pcb", [1.21, 0.098, 0.025], [-0.21, 0.265, -0.342]);
    for (let i = 0; i < 43; i++) {
      if (i === 12 || i === 13) continue;
      b.box("gold", [0.016, 0.066, 0.003], [-0.79 + i * 0.027, 0.271, -0.327]);
    }
    b.box("plastic", [0.31, 0.14, 0.13], [0.74, 0.245, 0.27], 0.008);
    for (let i = 0; i < 12; i++)
      b.box(
        "gold",
        [0.027, 0.037, 0.004],
        [0.62 + (i % 6) * 0.047, 0.211 + Math.floor(i / 6) * 0.056, 0.338],
      );
    b.box("plastic", [0.1, 0.028, 0.043], [0.74, 0.32, 0.3]);
    b.box("steel", [0.026, 0.48, 0.87], [-1.067, -0.004, 0]);
    for (let i = 0; i < 3; i++)
      b.box("plastic", [0.031, 0.1, 0.16], [-1.084, -0.045, -0.26 + i * 0.25]);
    // Backplate vent bars and exposed mounting screws.
    for (let i = 0; i < 19; i++)
      b.box(
        "gpuShroud",
        [0.014, 0.022, 0.34],
        [-0.93 + i * 0.044, 0.248, -0.015],
        0,
        [0, -0.25, 0],
      );
    for (const x of [-0.95, -0.34, 0.34, 0.95]) {
      b.screw(x, 0.145, 0.442, 0.018);
      b.screw(x, -0.139, 0.442, 0.017);
    }
    return b.finish();
  }, []);
  return (
    <group>
      <GeometryBatch batch={batch} />
      {[-0.65, 0, 0.65].map((x, i) => (
        <group key={x} position={[x, -0.238, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <Fan scale={0.7} housing={false} index={i + 1} />
        </group>
      ))}
    </group>
  );
}
