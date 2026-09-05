import test from "node:test";
import assert from "node:assert/strict";
import { explosionAmount, partPosition } from "../three/ExplodedView.ts";
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
