import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { timeline, useSystem } from "@/utils/store";
import { cinema, shockEnvelope, smoothRange } from "@/utils/cinema";
import { physicsRuntime } from "@/utils/physics";

type Shot = {
  at: number;
  eye: [number, number, number];
  look: [number, number, number];
  lens: number;
  range: number;
  aperture: number;
};
// Product reveal, fastener insert, low GPU dolly, DIMM crane, engineering wide.
// Explicit holds give each mechanical action room to read in either direction.
const shots: Shot[] = [
  {
    at: 0,
    eye: [6.6, 2.7, 11.1],
    look: [-0.8, 0.08, 0],
    lens: 45,
    range: 4,
    aperture: 0.4,
  },
  {
    at: 0.07,
    eye: [6.3, 2.4, 10.8],
    look: [-0.8, 0.12, 0],
    lens: 45,
    range: 3.5,
    aperture: 0.45,
  },
  {
    at: 0.16,
    eye: [4.7, 2.5, 7.8],
    look: [0.45, 0.7, 0.6],
    lens: 62,
    range: 2.4,
    aperture: 0.85,
  },
  {
    at: 0.23,
    eye: [3.8, 1.8, 7],
    look: [-0.05, 0.4, 0.3],
    lens: 55,
    range: 2.5,
    aperture: 0.7,
  },
  {
    at: 0.32,
    eye: [2.4, -1.85, 7.4],
    look: [-0.55, -0.6, 0.35],
    lens: 61,
    range: 1.6,
    aperture: 0.85,
  },
  {
    at: 0.39,
    eye: [0.7, -2.2, 8.6],
    look: [-1.8, -0.9, 0.9],
    lens: 55,
    range: 2.1,
    aperture: 0.65,
  },
  {
    at: 0.47,
    eye: [5.6, 2.7, 9.8],
    look: [0.2, 0.6, 0.45],
    lens: 47,
    range: 3.5,
    aperture: 0.65,
  },
  {
    at: 0.62,
    eye: [7, 3.8, 14.4],
    look: [-0.45, 0.2, 0.45],
    lens: 38,
    range: 6,
    aperture: 0.35,
  },
  {
    at: 0.81,
    eye: [5.1, 2.6, 14.8],
    look: [-0.4, 0.18, 0.45],
    lens: 39,
    range: 6,
    aperture: 0.4,
  },
  {
    at: 1,
    eye: [5.3, 1.75, 13.6],
    look: [-0.9, -0.15, 0.5],
    lens: 40,
    range: 5.6,
    aperture: 0.45,
  },
];
const goal = new THREE.Vector3(),
  look = new THREE.Vector3(),
  offset = new THREE.Vector3();
const focusGoal = new THREE.Vector3(),
  gpuPosition = new THREE.Vector3();
const screwOffset = new THREE.Vector3(1.8, 1.15, 4.4);

export default function CameraRig() {
  const orbit = useRef<OrbitControlsImpl>(null);
  const photo = useSystem((s) => s.photo);
  const initialized = useRef(false);
  useEffect(() => {
    if (photo && orbit.current) {
      orbit.current.target.copy(cinema.look);
      orbit.current.update();
    }
  }, [photo]);
  useFrame(({ camera: cameraBase, pointer, size }, rawDelta) => {
    const camera = cameraBase as THREE.PerspectiveCamera;
    const s = useSystem.getState();
    const dt = Math.min(rawDelta, 0.06);
    if (!(s.photo && s.photoPaused)) cinema.time += dt * timeline.timeScale;
    cinema.pulse = s.phase === "failure" ? shockEnvelope(timeline.failure) : 0;
    if (s.photo) {
      camera.setFocalLength(s.photoSettings.focalLength);
      camera.zoom = s.photoSettings.zoom;
      camera.updateProjectionMatrix();
      cinema.focalLength = s.photoSettings.focalLength;
      if (s.photoSettings.autoFocus) {
        if (orbit.current) cinema.focus.copy(orbit.current.target);
      } else {
        camera
          .getWorldDirection(focusGoal)
          .multiplyScalar(s.photoSettings.focusDistance)
          .add(camera.position);
        cinema.focus.copy(focusGoal);
      }
      cinema.aperture = s.photoSettings.aperture;
      cinema.focusRange = Math.max(0.25, 3.2 - s.photoSettings.aperture * 2);
      cinema.exposure = s.photoSettings.exposure;
      return;
    }
    const p = timeline.progress;
    let index = 0;
    while (index < shots.length - 2 && p > shots[index + 1].at) index++;
    const a = shots[index],
      b = shots[index + 1];
    const t = smoothRange(p, a.at, b.at);
    goal.fromArray(a.eye).lerp(offset.fromArray(b.eye), t);
    look.fromArray(a.look).lerp(offset.fromArray(b.look), t);
    let lens = THREE.MathUtils.lerp(a.lens, b.lens, t);
    let range = THREE.MathUtils.lerp(a.range, b.range, t);
    let aperture = THREE.MathUtils.lerp(a.aperture, b.aperture, t);
    focusGoal.copy(look);
    if (p < 0.1) focusGoal.set(0, 0.2, 0.2);
    if (p > 0.275 && p < 0.43) {
      const gpu = physicsRuntime.bodies.get("gpu");
      if (gpu) {
        gpuPosition.copy(gpu.translation());
        focusGoal.copy(gpuPosition);
        // Track actual disengagement, including its short mechanical hold.
        // A fixed look point drifts ahead of the GPU and clips it at frame right.
        const macro =
          smoothRange(p, 0.28, 0.325) * (1 - smoothRange(p, 0.405, 0.43));
        offset.copy(gpuPosition);
        offset.x -= 0.4;
        offset.z += 0.05;
        look.lerp(offset, macro);
        offset.copy(gpuPosition);
        offset.x += 1.4;
        offset.y = Math.max(-2.95, offset.y - 2.15);
        offset.z += 5.9;
        goal.lerp(offset, macro);
        lens = THREE.MathUtils.lerp(lens, 50, macro);
        range = THREE.MathUtils.lerp(range, 2.1, macro);
      }
    }
    if (s.phase === "boot") {
      goal.multiplyScalar(1.16);
      aperture = 0.3;
    }
    if (s.phase === "failure") {
      const f = timeline.failure;
      const screwWeight =
        (1 - smoothRange(f, 0.12, 0.25)) * smoothRange(f, 0, 0.055);
      const gpu = physicsRuntime.bodies.get("gpu");
      if (gpu) gpuPosition.copy(gpu.translation());
      else gpuPosition.set(-2.6, -1.13, 1.37);
      look.lerp(physicsRuntime.heroPosition, screwWeight);
      offset.copy(physicsRuntime.heroPosition).add(screwOffset);
      goal.lerp(offset, screwWeight);
      lens = THREE.MathUtils.lerp(lens, 76, screwWeight);
      range = THREE.MathUtils.lerp(range, 0.65, screwWeight);
      aperture = THREE.MathUtils.lerp(aperture, 1.1, screwWeight);
      const orbitWeight =
        smoothRange(f, 0.22, 0.3) * (1 - smoothRange(f, 0.43, 0.56));
      const arc = smoothRange(f, 0.29, 0.44) * 0.45;
      offset
        .set(Math.sin(0.4 + arc) * 9, 1.8, Math.cos(0.4 + arc) * 9)
        .add(gpuPosition);
      goal.lerp(offset, orbitWeight);
      look.lerp(gpuPosition, orbitWeight);
      lens = THREE.MathUtils.lerp(lens, 55, orbitWeight);
      range = THREE.MathUtils.lerp(range, 2.1, orbitWeight);
      const pullback = smoothRange(f, 0.5, 0.81);
      goal.lerp(offset.set(7.5, 3.4, 16.5), pullback);
      look.lerp(offset.set(-0.3, -0.65, 0), pullback);
      lens = THREE.MathUtils.lerp(lens, 36, pullback);
      focusGoal.copy(look);
    }
    if (s.phase === "rebuild") {
      const t = smoothRange(timeline.rebuild, 0, 1);
      goal.set(7.5, 3.4, 16.5).lerp(offset.fromArray(shots[0].eye), t);
      look.set(-0.3, -0.65, 0).lerp(offset.fromArray(shots[0].look), t);
      lens = THREE.MathUtils.lerp(36, 45, t);
      focusGoal.set(0, 0, 0);
      range = 5;
    }
    const mobile = size.width < 760;
    if (mobile) {
      const wide = smoothRange(p, 0.36, 0.61);
      goal.set(6.2 + wide * 2, 2.6 + wide * 0.9, 12 + wide * 7);
      goal.multiplyScalar(THREE.MathUtils.lerp(0.88, 0.94, wide));
      look.set(-0.2, 0.55, 0.2);
      lens = 33;
      range = 7;
      aperture = 0.3;
      if (s.phase === "failure")
        goal.multiplyScalar(1 + timeline.failure * 0.17);
    }
    offset
      .copy(goal)
      .sub(look)
      .applyAxisAngle(THREE.Object3D.DEFAULT_UP, timeline.orbitX);
    goal.copy(look).add(offset);
    goal.y += timeline.orbitY;
    if (!s.reducedMotion && !mobile) {
      goal.x += pointer.x * 0.15;
      goal.y += pointer.y * 0.12;
    }
    const damping = 1 - Math.exp(-dt * (s.reducedMotion ? 7 : 3.6));
    if (!initialized.current) {
      camera.position.copy(goal);
      cinema.look.copy(look);
      initialized.current = true;
    }
    camera.position.lerp(goal, damping);
    cinema.look.lerp(look, damping);
    cinema.focus.lerp(focusGoal, 1 - Math.exp(-dt * 4.5));
    cinema.focalLength = THREE.MathUtils.damp(
      cinema.focalLength,
      lens,
      4.5,
      dt,
    );
    cinema.focusRange = THREE.MathUtils.damp(cinema.focusRange, range, 4, dt);
    cinema.aperture = THREE.MathUtils.damp(cinema.aperture, aperture, 4, dt);
    cinema.exposure = THREE.MathUtils.damp(
      cinema.exposure,
      s.phase === "boot" ? 0.55 : 1,
      3,
      dt,
    );
    camera.zoom = 1;
    camera.setFocalLength(cinema.focalLength);
    if (!s.reducedMotion) {
      const trauma = Math.min(1, timeline.impact * 0.4 + cinema.pulse * 0.8);
      camera.position.x += Math.sin(cinema.time * 51) * trauma * 0.026;
      camera.position.y += Math.cos(cinema.time * 43) * trauma * 0.018;
    }
    camera.lookAt(cinema.look);
  });
  return (
    <OrbitControls
      ref={orbit}
      enabled={photo}
      enableDamping
      dampingFactor={0.08}
      minDistance={2}
      maxDistance={35}
      minPolarAngle={0.12}
      maxPolarAngle={Math.PI * 0.82}
    />
  );
}
