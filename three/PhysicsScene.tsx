import { useEffect, useRef } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import {
  Physics,
  RigidBody,
  CuboidCollider,
  CylinderCollider,
  RapierRigidBody,
  useRapier,
  CollisionEnterPayload,
} from "@react-three/rapier";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { parts, Part, Vec3 } from "./parts";
import { ComputerModel } from "./ComputerModel";
import { writePartTransform, rebuildAmount } from "./ExplodedView";
import { timeline, useSystem } from "@/utils/store";
import { audio } from "@/utils/AudioManager";
import { diagnostics } from "@/utils/diagnostics";
import {
  causalTargets,
  ImpactMaterial,
  physicalProfile,
  physicsRuntime,
  releaseAfterImpact,
} from "@/utils/physics";
import { thermal } from "@/utils/thermal";

const isFailure = (phase: string) =>
  phase === "failure" || phase === "blackout" || phase === "destroyed";
const deadline = (p: Part) =>
  p.id === "screw-1-1"
    ? 0.012
    : p.kind === "screw"
      ? 0.15 + p.release
      : p.id === "fan-2"
        ? 0.16
        : p.id === "ram-1"
          ? 0.26
          : p.id === "gpu"
            ? 0.37
            : Math.max(0.25, p.release);

/** One bounded, fixed-step clock owns slow motion, gravity transitions and audio mixing. */
function PhysicsClock() {
  const { step, world } = useRapier();
  const worldRef = useRef(world);
  const gravity = useRef(-2.6);
  useFrame((_, dt) => {
    const s = useSystem.getState();
    if (s.photo && s.photoPaused) {
      audio.updateMix({
        rpm: thermal.rpm,
        load: thermal.load,
        silence: true,
        macro: false,
        failure: false,
      });
      return;
    }
    const delta = Math.min(dt, 0.05);
    const slow =
      s.phase === "failure" &&
      timeline.failure > 0.29 &&
      timeline.failure < 0.43;
    const speed = slow && !s.reducedMotion ? 0.24 : 1;
    timeline.timeScale = THREE.MathUtils.damp(
      timeline.timeScale,
      speed,
      9,
      delta,
    );
    timeline.impact = Math.max(0, timeline.impact - delta * 1.8);
    gravity.current = THREE.MathUtils.damp(
      gravity.current,
      s.gravity,
      2.8,
      delta,
    );
    worldRef.current.gravity.y = gravity.current;
    physicsRuntime.time += delta * timeline.timeScale;
    step(delta * timeline.timeScale);
    const silence =
      s.phase === "armed" ||
      s.phase === "blackout" ||
      s.phase === "destroyed" ||
      (s.phase === "failure" && timeline.failure < 0.12);
    audio.updateMix({
      rpm: thermal.rpm,
      load: thermal.load,
      silence,
      macro: timeline.progress > 0.2 && timeline.progress < 0.45,
      failure: s.phase === "failure",
      speed: slow ? 0.6 : 1,
    });
  }, -40);
  return null;
}

function Piece({ part }: { part: Part }) {
  const body = useRef<RapierRigidBody>(null),
    dynamic = useRef(false),
    pulsed = useRef(false),
    drag = useRef(false),
    snapped = useRef(false);
  const pendingDrag = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );
  const dragDistance = useRef(5),
    previous = useRef(new THREE.Vector3()),
    velocity = useRef(new THREE.Vector3());
  const work = useRef({
    position: new THREE.Vector3(),
    force: new THREE.Vector3(),
    screen: new THREE.Vector3(),
    q: new THREE.Quaternion(),
    euler: new THREE.Euler(),
    identity: new THREE.Quaternion(),
    p: [0, 0, 0] as Vec3,
    r: [0, 0, 0] as Vec3,
  });
  const restore = useRef<{ p: THREE.Vector3; q: THREE.Quaternion } | null>(
    null,
  );
  const previousSpeed = useRef(0),
    lastMechanical = useRef(0),
    heldToast = useRef(false);
  const developer = useSystem((s) => s.developer),
    chapter = useSystem((s) => s.chapter),
    phase = useSystem((s) => s.phase);
  const profile = physicalProfile(part.kind);
  useEffect(() => {
    if (body.current) physicsRuntime.bodies.set(part.id, body.current);
    return () => {
      physicsRuntime.bodies.delete(part.id);
      delete diagnostics.bodies[part.id];
    };
  }, [part.id]);
  useFrame((state, dt) => {
    const b = body.current;
    if (!b) return;
    const s = useSystem.getState(),
      w = work.current;
    const pos = b.translation();
    if (part.id === "screw-1-1")
      physicsRuntime.heroPosition.set(pos.x, pos.y, pos.z);
    if (s.developer) {
      w.screen.set(pos.x, pos.y, pos.z).project(state.camera);
      const d =
        diagnostics.bodies[part.id] ??
        (diagnostics.bodies[part.id] = {
          x: 0,
          y: 0,
          z: 0,
          dynamic: false,
          screenX: 0,
          screenY: 0,
        });
      d.x = pos.x;
      d.y = pos.y;
      d.z = pos.z;
      d.dynamic = dynamic.current;
      d.screenX = (w.screen.x * 0.5 + 0.5) * state.size.width;
      d.screenY = (-w.screen.y * 0.5 + 0.5) * state.size.height;
    }
    if (s.photo && s.photoPaused) return;
    const fail = isFailure(s.phase);
    const sandbox =
      s.developer &&
      (s.gravity !== -2.6 || (s.magnet && part.kind === "screw"));
    const shouldFall =
      (fail &&
        (timeline.failure >= deadline(part) ||
          physicsRuntime.released.has(part.id))) ||
      (s.gpuLoose && part.id === "gpu") ||
      drag.current ||
      sandbox;
    if (s.phase === "rebuild") {
      if (!restore.current) {
        const q = b.rotation();
        restore.current = {
          p: new THREE.Vector3(pos.x, pos.y, pos.z),
          q: new THREE.Quaternion(q.x, q.y, q.z, q.w),
        };
        b.setBodyType(2, true);
        dynamic.current = false;
        drag.current = false;
        pendingDrag.current = null;
        b.setLinvel({ x: 0, y: 0, z: 0 }, true);
        b.setAngvel({ x: 0, y: 0, z: 0 }, true);
        snapped.current = false;
      }
      const t = rebuildAmount(part, timeline.rebuild);
      w.position.set(...part.position).lerp(restore.current.p, 1 - t);
      // A shallow return arc keeps heavy pieces clear of the chassis until the final snap.
      const arc = Math.sin(Math.PI * t) * (part.kind === "screw" ? 0.2 : 0.65);
      w.position.y += arc;
      w.position.z += arc * 0.55;
      w.q.copy(restore.current.q).slerp(w.identity, t);
      if (part.kind === "screw" && t > 0.75) {
        w.euler.set(0, 0, (1 - t) * Math.PI * 12);
        w.q.setFromEuler(w.euler);
      }
      b.setNextKinematicTranslation(w.position);
      b.setNextKinematicRotation(w.q);
      if (t > 0.98 && !snapped.current) {
        snapped.current = true;
        if (["gpu", "ram", "glass", "cable"].includes(part.kind))
          audio.play("connector");
      }
      pulsed.current = false;
      return;
    }
    restore.current = null;
    if (shouldFall && !dynamic.current) {
      b.setBodyType(0, true);
      dynamic.current = true;
      physicsRuntime.released.add(part.id);
      const targetId = fail ? causalTargets[part.id] : undefined;
      const target = targetId ? physicsRuntime.bodies.get(targetId) : undefined;
      if (target && part.id !== "gpu") {
        const aim = target.translation();
        const flight =
          part.kind === "screw" ? 0.72 : part.kind === "fan" ? 0.48 : 0.62;
        w.force
          .set(
            (aim.x - pos.x) / flight,
            (aim.y - pos.y) / flight - s.gravity * flight * 0.5,
            (aim.z - pos.z) / flight,
          )
          .clampLength(0, 9);
        b.setLinvel(w.force, true);
        b.setAngvel(
          { x: 0.2, y: part.kind === "screw" ? 1.4 : 0.3, z: 0.3 },
          true,
        );
      } else {
        b.applyImpulse(
          {
            x: -profile.mass * 0.12,
            y: profile.mass * 0.08,
            z: profile.mass * 0.15,
          },
          true,
        );
        b.setAngvel(
          { x: 0.14, y: 0.12, z: part.kind === "gpu" ? -0.28 : 0.22 },
          true,
        );
      }
      if (part.id === "screw-1-1") physicsRuntime.event = "FASTENER RELEASED";
      if (part.id === "gpu") {
        physicsRuntime.event = "PCIe RETENTION LOST";
        timeline.impact = Math.max(timeline.impact, 0.14);
      }
      if (part.kind === "cable") audio.play("connector");
    }
    if (dynamic.current) {
      const v = b.linvel();
      previousSpeed.current = Math.hypot(v.x, v.y, v.z);
      if (drag.current) {
        state.raycaster.ray.at(dragDistance.current, w.position);
        velocity.current
          .copy(w.position)
          .sub(previous.current)
          .divideScalar(Math.max(dt, 0.01))
          .clampLength(0, 13);
        previous.current.copy(w.position);
        // Mass-dependent spring impulse: PSU and glass visibly lag behind small components.
        const stiffness = 34 * Math.pow(profile.mass, 0.35),
          damping = 2 * Math.sqrt(stiffness * profile.mass) * 0.85;
        w.force
          .set(
            (w.position.x - pos.x) * stiffness - v.x * damping,
            (w.position.y - pos.y) * stiffness -
              v.y * damping -
              s.gravity * profile.mass,
            (w.position.z - pos.z) * stiffness - v.z * damping,
          )
          .multiplyScalar(Math.min(dt, 0.04) * timeline.timeScale)
          .clampLength(0, profile.mass * 2.2);
        b.applyImpulse(w.force, true);
        if (
          part.id === "gpu" &&
          pendingDrag.current &&
          performance.now() - pendingDrag.current.time > 5000 &&
          !heldToast.current
        ) {
          heldToast.current = true;
          s.set({ toast: "PLEASE PUT THAT BACK." });
        }
      }
      if (
        s.magnet &&
        s.developer &&
        profile.material === "metal" &&
        profile.mass < 0.4
      ) {
        w.force
          .set(-pos.x, 1.7 - pos.y, -0.3 - pos.z)
          .multiplyScalar(profile.mass * Math.min(dt, 0.04) * 2.2);
        b.applyImpulse(w.force, true);
      }
      if (fail && timeline.failure > 0.7 && !pulsed.current) {
        w.force
          .set(pos.x, pos.y + 0.7, pos.z)
          .normalize()
          .multiplyScalar(Math.min(3, 0.32 + Math.sqrt(profile.mass) * 1.4));
        w.force.y += profile.mass * 1.5;
        b.applyImpulse(w.force, true);
        b.applyTorqueImpulse(
          {
            x: profile.mass * 0.12,
            y: profile.mass * 0.18,
            z: profile.mass * 0.08,
          },
          true,
        );
        pulsed.current = true;
      }
      if (!shouldFall && !s.developer && !s.gpuLoose && !fail) {
        b.setBodyType(2, true);
        dynamic.current = false;
      } else return;
    }
    writePartTransform(part, timeline.progress, w.p, w.r);
    if (!s.reducedMotion) w.p[1] += Math.sin(physicsRuntime.time * 0.7) * 0.018;
    w.euler.set(...w.r);
    w.q.setFromEuler(w.euler);
    w.position.set(...w.p);
    b.setNextKinematicTranslation(w.position);
    b.setNextKinematicRotation(w.q);
    const movement = Math.min(
      1,
      Math.max(0, (timeline.progress - part.start) / 0.19),
    );
    if (
      movement > 0.18 &&
      lastMechanical.current <= 0.18 &&
      ["gpu", "ram", "cable", "glass"].includes(part.kind)
    )
      audio.play("connector");
    lastMechanical.current = movement;
  }, -50);
  function collision(event: CollisionEnterPayload) {
    if (!dynamic.current) return;
    diagnostics.collisions++;
    const other = event.other.rigidBodyObject?.userData ?? {};
    const otherVelocity = event.other.rigidBody?.linvel();
    const speed = Math.max(
      previousSpeed.current,
      otherVelocity
        ? Math.hypot(otherVelocity.x, otherVelocity.y, otherVelocity.z)
        : 0,
    );
    audio.impact(
      profile.material,
      (other.material as ImpactMaterial) ?? "floor",
      speed,
      profile.mass,
      (body.current?.translation().x ?? 0) / 5,
    );
    if (speed > 0.4) {
      const intensity = Math.min(0.45, Math.sqrt(profile.mass) * speed * 0.06);
      timeline.impact = Math.max(timeline.impact, intensity);
      physicsRuntime.lastImpact = physicsRuntime.time;
      if (useSystem.getState().phase === "failure")
        releaseAfterImpact(
          part.id,
          typeof other.partId === "string" ? other.partId : "floor",
        );
    }
  }
  function click(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    if (
      part.id !== "gpu" ||
      useSystem.getState().phase !== "running" ||
      drag.current
    )
      return;
    const n = useSystem.getState().gpuClicks + 1;
    useSystem
      .getState()
      .set({
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
  const release = (e: ThreeEvent<PointerEvent>) => {
    pendingDrag.current = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    if (!drag.current) return;
    drag.current = false;
    // Keep the object's existing momentum and add a bounded, mass-sensitive throw.
    const b = body.current;
    if (b) {
      const v = b.linvel();
      work.current.force
        .copy(velocity.current)
        .multiplyScalar(0.55 / Math.max(1, Math.sqrt(profile.mass)))
        .add(new THREE.Vector3(v.x, v.y, v.z).multiplyScalar(0.45))
        .clampLength(0, 12);
      b.setLinvel(work.current.force, true);
    }
  };
  return (
    <RigidBody
      ref={body}
      name={part.id}
      userData={{
        partId: part.id,
        material: profile.material,
        mass: profile.mass,
      }}
      type="kinematicPosition"
      colliders={false}
      position={part.position}
      linearDamping={profile.damping}
      angularDamping={0.75}
      restitution={profile.restitution}
      friction={profile.friction}
      ccd
      onCollisionEnter={collision}
    >
      <CuboidCollider
        args={part.size.map((v) => Math.max(v / 2, 0.012)) as Vec3}
        mass={profile.mass}
        contactSkin={0.001}
      />
      <group
        onClick={click}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (part.label) useSystem.getState().set({ hover: part.label });
        }}
        onPointerOut={() => useSystem.getState().set({ hover: null })}
        onPointerDown={(e) => {
          if (!developer || useSystem.getState().photo) return;
          e.stopPropagation();
          pendingDrag.current = {
            x: e.nativeEvent.clientX,
            y: e.nativeEvent.clientY,
            time: performance.now(),
          };
          dragDistance.current = e.distance;
          previous.current.copy(e.point);
          velocity.current.set(0, 0, 0);
          heldToast.current = false;
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
        onPointerUp={release}
        onPointerCancel={release}
      >
        <ComputerModel part={part} />
        {chapter === 4 && part.label && phase === "running" && (
          <group>
            <Line
              points={[
                [0, 0, 0],
                [0.35, 0.34, 0.15],
                [0.72, 0.34, 0.15],
              ]}
              color="#97b0bb"
              lineWidth={0.6}
            />
            <Html
              position={[0.74, 0.34, 0.15]}
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
  const low = useSystem((s) => s.low),
    colliders = useSystem((s) => s.colliders),
    developer = useSystem((s) => s.developer);
  return (
    <Physics
      gravity={[0, -2.6, 0]}
      timeStep={low ? 1 / 60 : 1 / 120}
      numSolverIterations={low ? 5 : 10}
      paused
      interpolate={false}
      debug={developer && colliders}
    >
      <PhysicsClock />
      {parts
        .filter((p) => !low || !["tube-b", "ram-2"].includes(p.id))
        .map((p) => (
          <Piece key={p.id} part={p} />
        ))}
      <RigidBody
        type="fixed"
        colliders={false}
        userData={{ material: "floor", partId: "floor" }}
      >
        <CuboidCollider
          position={[0, -3.345, 0]}
          args={[35, 0.1, 35]}
          friction={0.9}
          restitution={0.06}
        />
        <CylinderCollider
          position={[0, -3.239, 0]}
          args={[0.006, 4.3]}
          friction={0.8}
          restitution={0.08}
        />
        {[-1, 1].map((x) => (
          <CuboidCollider
            key={x}
            position={[x * 4.3, -3.2, -2.1]}
            args={[0.06, 0.04, 1.55]}
          />
        ))}
      </RigidBody>
    </Physics>
  );
}
