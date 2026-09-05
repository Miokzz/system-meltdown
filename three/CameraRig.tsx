import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { timeline, useSystem } from "@/utils/store";
const target = new THREE.Vector3(),
  look = new THREE.Vector3();
export default function CameraRig() {
  const smooth = useRef(new THREE.Vector3(0, 0, 0));
  useFrame(({ camera, pointer, size }, dt) => {
    const s = useSystem.getState(),
      p = timeline.progress;
    const mobile = size.width < 760;
    let distance = p < 0.2 ? 8.6 : p < 0.33 ? 5.3 : p < 0.48 ? 8.4 : 12.8;
    let angle = 0.64 - Math.sin(p * Math.PI) * 0.16;
    let height = 2.4;
    if (s.phase === "boot") distance = 11;
    if (s.phase === "failure") {
      distance = 11.5 + timeline.failure * 3;
      height = 2.1;
      angle = 0.65;
    }
    if (s.phase === "rebuild") distance = 12 - timeline.rebuild * 3.4;
    if (mobile) distance *= p > 0.5 ? 2.35 : 1.8;
    target.set(
      Math.sin(angle + timeline.orbitX) * distance + pointer.x * 0.24,
      height + pointer.y * 0.23 + timeline.orbitY,
      Math.cos(angle + timeline.orbitX) * distance,
    );
    camera.position.lerp(target, 1 - Math.exp(-dt * 2.5));
    look.set(mobile ? 0 : -0.8, mobile ? 0.5 : p > 0.55 ? -0.05 : 0.05, 0);
    smooth.current.lerp(look, 1 - Math.exp(-dt * 3));
    camera.lookAt(smooth.current);
  });
  return null;
}
