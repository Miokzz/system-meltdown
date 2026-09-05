import { memo } from "react";
import type { Part } from "./parts";
import { GraphicsCard } from "./hardware/GraphicsCard";
import { Motherboard } from "./hardware/Motherboard";
import { Fan } from "./hardware/Fan";
import { GlassPanel } from "./hardware/GlassPanel";
import { Cables } from "./hardware/Cables";
import {
  Chassis,
  CoolingPump,
  Fastener,
  Memory,
  PowerSupply,
  Processor,
  Storage,
} from "./hardware/Components";
import { MaterialController } from "./hardware/MaterialController";

/** Part IDs, origins and body boundaries are intentionally unchanged from v1. */
export const ComputerModel = memo(function ComputerModel({
  part,
}: {
  part: Part;
}) {
  switch (part.kind) {
    case "board":
      return (
        <>
          <MaterialController />
          <Motherboard />
        </>
      );
    case "gpu":
      return <GraphicsCard />;
    case "fan":
      return (
        <group rotation={[0, Math.PI / 2, 0]}>
          <Fan index={Number(part.id.slice(-1))} />
        </group>
      );
    case "glass":
      return <GlassPanel />;
    case "cpu":
      return <Processor />;
    case "cooler":
      return <CoolingPump />;
    case "ram":
      return <Memory />;
    case "psu":
      return <PowerSupply />;
    case "ssd":
      return <Storage />;
    case "screw":
      return <Fastener />;
    case "cable":
      return <Cables part={part} />;
    default:
      return <Chassis part={part} />;
  }
});
