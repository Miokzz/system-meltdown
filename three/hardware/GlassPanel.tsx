import { useMemo } from "react";
import { GeometryBatch, ModelBuilder } from "./GeometryBatch";

/** Real transmission pass with closed, thick geometry and green cut edges. */
export function GlassPanel() {
  const batch = useMemo(() => {
    const b = new ModelBuilder();
    b.box("glass", [2.615, 3.472, 0.045], [0, 0, 0], 0.01);
    for (const x of [-1.31, 1.31]) {
      b.box("glassEdge", [0.009, 3.469, 0.047], [x, 0, 0], 0.003);
      b.box("rubber", [0.011, 3.46, 0.013], [x * 0.994, 0, -0.018], 0.003);
    }
    for (const y of [-1.742, 1.742]) {
      b.box("glassEdge", [2.623, 0.009, 0.047], [0, y, 0], 0.003);
      b.box("rubber", [2.61, 0.011, 0.013], [0, y * 0.994, -0.018], 0.003);
    }
    for (const x of [-1.22, 1.22])
      for (const y of [-1.63, 1.63]) {
        b.cylinder("rubber", 0.048, 0.049, [x, y, 0], undefined, 24);
        b.ring("steel", 0.04, 0.004, [x, y, 0.026], undefined, 24);
      }
    return b.finish();
  }, []);
  return <GeometryBatch batch={batch} raycast={false} />;
}
