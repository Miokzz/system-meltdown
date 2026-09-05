import { useRef } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import {
  Physics,
  RigidBody,
  CuboidCollider,
  RapierRigidBody,
} from "@react-three/rapier";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { parts, Part } from "./parts";
import { ComputerModel } from "./ComputerModel";
import { explosionAmount, partPosition } from "./ExplodedView";
import { timeline, useSystem } from "@/utils/store";
import { audio } from "@/utils/AudioManager";
import { diagnostics } from "@/utils/diagnostics";
const rotation = new THREE.Quaternion(),
  euler = new THREE.Euler();
function Piece({ part }: { part: Part }) {
  const body = useRef<RapierRigidBody>(null),
    dynamic = useRef(false),
    pulsed = useRef(false),
    drag = useRef(false),
    pendingDrag = useRef<{ x: number; y: number } | null>(null),
    dragDistance = useRef(5),
    previous = useRef(new THREE.Vector3()),
    velocity = useRef(new THREE.Vector3()),
    restore = useRef<{ p: THREE.Vector3; q: THREE.Quaternion } | null>(null);
  const developer = useSystem((s) => s.developer),
    chapter = useSystem((s) => s.chapter),
    phase = useSystem((s) => s.phase);
  useFrame((state, dt) => {
    const b = body.current;
    if (!b) return;
    const s = useSystem.getState();
    if (s.developer) {
      const pos = b.translation();
      const screen = new THREE.Vector3(pos.x, pos.y, pos.z).project(
        state.camera,
      );
      diagnostics.bodies[part.id] = {
        x: pos.x,
        y: pos.y,
        z: pos.z,
        dynamic: dynamic.current,
        screenX: (screen.x * 0.5 + 0.5) * state.size.width,
        screenY: (-screen.y * 0.5 + 0.5) * state.size.height,
      };
      diagnostics.frames++;
      diagnostics.quality = s.low ? "adaptive" : "high";
    }
    const fail =
      s.phase === "failure" ||
      s.phase === "blackout" ||
      s.phase === "destroyed";
    const shouldFall =
      (fail && timeline.failure >= part.release) ||
      (s.gpuLoose && part.id === "gpu") ||
      drag.current;
    if (s.phase === "rebuild") {
      if (!restore.current) {
        const p = b.translation(),
          q = b.rotation();
        restore.current = {
          p: new THREE.Vector3(p.x, p.y, p.z),
          q: new THREE.Quaternion(q.x, q.y, q.z, q.w),
        };
        b.setBodyType(2, true);
        dynamic.current = false;
        b.setLinvel({ x: 0, y: 0, z: 0 }, true);
        b.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
      const t = timeline.rebuild;
      const p = restore.current.p
        .clone()
        .lerp(new THREE.Vector3(...part.position), t);
      const q = restore.current.q.clone().slerp(new THREE.Quaternion(), t);
      b.setNextKinematicTranslation(p);
      b.setNextKinematicRotation(q);
      pulsed.current = false;
      return;
    }
    restore.current = null;
    if (shouldFall && !dynamic.current) {
      b.setBodyType(0, true);
      dynamic.current = true;
      const initial = part.kind === "screw" ? 0.02 : 0.18;
      b.applyImpulse({ x: -initial, y: 0.02, z: initial }, true);
      b.applyTorqueImpulse({ x: 0.02, y: 0.015, z: 0.03 }, true);
      if (part.kind === "fan") b.setLinvel({ x: -1.4, y: 0.7, z: 0.35 }, true);
      audio.play("metal");
    }
    if (dynamic.current) {
      if (drag.current) {
        const target = state.raycaster.ray.at(
          dragDistance.current,
          new THREE.Vector3(),
        );
        const pos = b.translation();
        velocity.current
          .copy(target)
          .sub(previous.current)
          .divideScalar(Math.max(dt, 0.01))
          .clampLength(0, 12);
        previous.current.copy(target);
        b.setLinvel(
          {
            x: (target.x - pos.x) * 12,
            y: (target.y - pos.y) * 12,
            z: (target.z - pos.z) * 12,
          },
          true,
        );
      }
      if (fail && timeline.failure > 0.7 && !pulsed.current) {
        const pos = b.translation();
        b.applyImpulse(
          { x: pos.x * 0.7, y: 2.5 + Math.abs(pos.y) * 0.3, z: pos.z * 0.7 },
          true,
        );
        b.applyTorqueImpulse({ x: 0.3, y: 0.5, z: 0.3 }, true);
        pulsed.current = true;
      }
      if (!shouldFall && !developer && !s.gpuLoose && !fail) {
        b.setBodyType(2, true);
        dynamic.current = false;
      } else return;
    }
    const position = partPosition(part, timeline.progress);
    position[1] += Math.sin(state.clock.elapsedTime * 0.7) * 0.035;
    const amount = explosionAmount(timeline.progress, part.start);
    const spin = part.kind === "screw" ? amount * Math.PI * 8 : 0;
    euler.set(0, 0, spin);
    rotation.setFromEuler(euler);
    b.setNextKinematicTranslation({
      x: position[0],
      y: position[1],
      z: position[2],
    });
    b.setNextKinematicRotation(rotation);
  });
  function click(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    if (part.id !== "gpu" || useSystem.getState().phase !== "running") return;
    const n = useSystem.getState().gpuClicks + 1;
    useSystem.getState().set({
      gpuClicks: n,
      ...(n === 5
        ? { toast: "STOP TOUCHING THE GPU." }
        : n === 8
          ? { toast: "I’M SERIOUS." }
          : n >= 11
            ? { toast: "fine.", gpuLoose: true }
            : {}),
    });
    audio.play("click");
  }
  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={part.position}
      linearDamping={0.32}
      angularDamping={0.5}
      restitution={0.42}
      friction={0.7}
      onCollisionEnter={() => {
        diagnostics.collisions++;
        audio.play("metal");
      }}
    >
      <CuboidCollider
        args={
          part.size.map((v) => Math.max(v / 2, 0.025)) as [
            number,
            number,
            number,
          ]
        }
        mass={part.kind === "screw" ? 0.04 : part.kind === "gpu" ? 1.5 : 0.5}
      />
      <group
        onClick={click}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (part.label) useSystem.getState().set({ hover: part.label });
        }}
        onPointerOut={() => useSystem.getState().set({ hover: null })}
        onPointerDown={(e) => {
          if (!developer) return;
          e.stopPropagation();
          pendingDrag.current = {
            x: e.nativeEvent.clientX,
            y: e.nativeEvent.clientY,
          };
          dragDistance.current = e.distance;
          previous.current.copy(e.point);
          (e.target as Element).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!pendingDrag.current) return;
          if (
            Math.hypot(
              e.nativeEvent.clientX - pendingDrag.current.x,
              e.nativeEvent.clientY - pendingDrag.current.y,
            ) > 8
          )
            drag.current = true;
        }}
        onPointerUp={(e) => {
          pendingDrag.current = null;
          (e.target as Element).releasePointerCapture?.(e.pointerId);
          if (!drag.current) return;
          drag.current = false;
          body.current?.setLinvel(velocity.current, true);
        }}
      >
        <ComputerModel part={part} />
        {chapter === 4 && part.label && phase === "running" && (
          <group>
            <Line
              points={[
                [0, 0, 0],
                [0.5, 0.4, 0.2],
                [0.95, 0.4, 0.2],
              ]}
              color="#97b0bb"
              lineWidth={0.6}
            />
            <Html
              position={[0.96, 0.4, 0.2]}
              center
              distanceFactor={9}
              style={{ pointerEvents: "none" }}
            >
              <span className="part-label">{part.label}</span>
            </Html>
          </group>
        )}
      </group>
    </RigidBody>
  );
}
export default function PhysicsScene() {
  const low = useSystem((s) => s.low);
  return (
    <Physics
      gravity={[0, -2.6, 0]}
      timeStep={1 / 60}
      numSolverIterations={low ? 4 : 8}
    >
      <group>
        {parts
          .filter((p) => !low || !["tube-b", "ram-2"].includes(p.id))
          .map((p) => (
            <Piece key={p.id} part={p} />
          ))}
      </group>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider position={[0, -3.35, 0]} args={[15, 0.1, 15]} />
      </RigidBody>
    </Physics>
  );
}
