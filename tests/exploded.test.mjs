import test from "node:test";
import assert from "node:assert/strict";
import {
  explosionAmount,
  partPosition,
  writePartTransform,
  rebuildAmount,
} from "../three/ExplodedView.ts";
import { parts } from "../three/parts.ts";
test("scroll is clamped and exactly reversible without accumulated drift", () => {
  const part = { position: [1, 2, 3], explode: [4, -2, 1], start: 0.2 };
  assert.deepEqual(partPosition(part, 0), part.position);
  assert.deepEqual(partPosition(part, 1), [5, 0, 4]);
  const midpoint = partPosition(part, 0.3);
  for (let i = 0; i < 1000; i++) {
    partPosition(part, Math.sin(i));
  }
  assert.deepEqual(partPosition(part, 0.3), midpoint);
  assert.deepEqual(partPosition(part, 0), part.position);
  assert.equal(explosionAmount(-1, 0.2), 0);
  assert.equal(explosionAmount(2, 0.2), 1);
});

test("every mechanical part returns exactly after arbitrary scrub direction changes", () => {
  const position = [0, 0, 0],
    rotation = [0, 0, 0];
  for (const part of parts) {
    for (const progress of [0, 0.73, 0.12, 1, 0.41, 0.82, 0.04, 0]) {
      writePartTransform(part, progress, position, rotation);
      assert.ok([...position, ...rotation].every(Number.isFinite), part.id);
    }
    assert.deepEqual(
      position,
      part.position,
      `${part.id} accumulated translation`,
    );
    assert.ok(
      rotation.every((v) => v === 0),
      `${part.id} accumulated rotation`,
    );
    writePartTransform(part, 1, position, rotation);
    assert.deepEqual(
      position,
      part.position.map((v, i) => v + part.explode[i]),
      `${part.id} misses exploded target`,
    );
  }
});

test("fasteners rotate before glass clears; GPU has connector clearance before long travel", () => {
  const screw = parts.find((p) => p.id === "screw-1-1");
  const glass = parts.find((p) => p.id === "side-glass");
  const gpu = parts.find((p) => p.id === "gpu");
  const position = [0, 0, 0],
    rotation = [0, 0, 0];
  writePartTransform(screw, 0.1, position, rotation);
  assert.ok(rotation[2] > Math.PI * 2, "screw must visibly unthread first");
  assert.deepEqual(
    partPosition(glass, 0.1),
    glass.position,
    "glass moved before fasteners released",
  );
  writePartTransform(gpu, gpu.start + 0.03, position, rotation);
  assert.ok(
    position[2] > gpu.position[2] + 0.12,
    "GPU needs forward PCIe clearance",
  );
  assert.ok(
    Math.abs(position[0] - gpu.position[0]) < 0.02,
    "GPU moved sideways through its socket",
  );
});

test("rebuild restores chassis before electronics and secures glass before fasteners", () => {
  const get = (id) => parts.find((p) => p.id === id);
  assert.ok(rebuildAmount(get("base"), 0.4) > 0.99);
  assert.ok(rebuildAmount(get("gpu"), 0.4) < 0.6);
  assert.equal(rebuildAmount(get("side-glass"), 0.4), 0);
  assert.equal(rebuildAmount(get("screw-1-1"), 0.6), 0);
  for (const part of parts) {
    assert.equal(rebuildAmount(part, -1), 0);
    assert.equal(rebuildAmount(part, 1), 1);
    let previous = 0;
    for (let i = 0; i <= 100; i++) {
      const amount = rebuildAmount(part, i / 100);
      assert.ok(
        amount >= previous,
        `${part.id} reverses during reconstruction`,
      );
      previous = amount;
    }
  }
});
