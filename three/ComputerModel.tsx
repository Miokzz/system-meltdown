import { memo, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Line } from "@react-three/drei";
import * as THREE from "three";
import { Part, Vec3 } from "./parts";
import { useSystem } from "@/utils/store";
const metal = "#697178",
  dark = "#171d23";
function Box({
  size,
  position = [0, 0, 0],
  color = dark,
  emissive = false,
}: {
  size: Vec3;
  position?: Vec3;
  color?: string;
  emissive?: boolean;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        metalness={emissive ? 0 : 0.82}
        roughness={0.29}
        emissive={emissive ? color : "#000000"}
        emissiveIntensity={emissive ? 1.7 : 0}
      />
    </mesh>
  );
}
function Ring({
  radius = 0.37,
  position = [0, 0, 0],
  color = "#a4e9ff",
}: {
  radius?: number;
  position?: Vec3;
  color?: string;
}) {
  return (
    <mesh position={position}>
      <torusGeometry args={[radius, 0.017, 8, 48]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.8}
        toneMapped={false}
      />
    </mesh>
  );
}
function Fan({ small = false }: { small?: boolean }) {
  const rotor = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (rotor.current)
      rotor.current.rotation.z +=
        Math.min(dt, 0.04) * (useSystem.getState().phase === "failure" ? 3 : 9);
  });
  return (
    <group scale={small ? 0.7 : 1}>
      <RoundedBox args={[0.89, 0.89, 0.1]} radius={0.06} smoothness={2}>
        <meshStandardMaterial
          color="#141b21"
          metalness={0.8}
          roughness={0.28}
        />
      </RoundedBox>
      <Ring position={[0, 0, 0.07]} />
      <Ring radius={0.32} position={[0, 0, 0.073]} color="#4187a3" />
      <group ref={rotor} position={[0, 0, 0.08]}>
        {Array.from({ length: 9 }, (_, i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 9]}>
            <mesh position={[0.13, 0.08, 0]} rotation={[0, 0, 0.55]}>
              <boxGeometry args={[0.29, 0.095, 0.022]} />
              <meshStandardMaterial
                color="#73838f"
                metalness={0.9}
                roughness={0.22}
              />
            </mesh>
          </group>
        ))}
      </group>
      <mesh position={[0, 0, 0.105]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.105, 0.105, 0.07, 24]} />
        <meshStandardMaterial
          color="#272f36"
          metalness={0.85}
          roughness={0.18}
        />
      </mesh>
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((y) => (
          <mesh key={`${x}${y}`} position={[x * 0.37, y * 0.37, 0.066]}>
            <circleGeometry args={[0.018, 8]} />
            <meshStandardMaterial color="#899299" />
          </mesh>
        )),
      )}
    </group>
  );
}
function Circuitry() {
  const ref = useRef<THREE.InstancedMesh>(null);
  useFrame(() => {
    if (!ref.current || ref.current.userData.built) return;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 65; i++) {
      dummy.position.set(
        Math.sin(i * 17.3) * 0.98,
        Math.cos(i * 7.6) * 1.18,
        0.085,
      );
      dummy.scale.set(0.035 + (i % 3) * 0.025, 0.04 + (i % 4) * 0.012, 0.02);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.userData.built = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 65]}>
      <boxGeometry />
      <meshStandardMaterial color="#768088" metalness={0.75} roughness={0.38} />
    </instancedMesh>
  );
}
export const ComputerModel = memo(function ComputerModel({
  part,
}: {
  part: Part;
}) {
  const { kind, size } = part;
  const tube = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.3, 0.3, -0.12),
        new THREE.Vector3(-0.5, 0.9, 0.3),
        new THREE.Vector3(0.4, 1.05, 0.3),
        new THREE.Vector3(0.65, 0.6, -0.2),
      ]),
    [],
  );
  if (kind === "fan")
    return (
      <group rotation={[0, Math.PI / 2, 0]}>
        <Fan />
      </group>
    );
  if (kind === "glass")
    return (
      <group>
        <mesh raycast={() => {}}>
          <boxGeometry args={size} />
          <meshPhysicalMaterial
            color="#8bb5c9"
            metalness={0.05}
            roughness={0.06}
            transparent
            opacity={0.035}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <Line
          points={[
            [-1.31, -1.74, 0],
            [-1.31, 1.74, 0],
            [1.31, 1.74, 0],
            [1.31, -1.74, 0],
            [-1.31, -1.74, 0],
          ]}
          color="#45606d"
          transparent
          opacity={0.42}
          lineWidth={0.65}
        />
      </group>
    );
  if (kind === "board")
    return (
      <group>
        <Box size={size} color="#172b2c" />
        <Circuitry />
        {Array.from({ length: 15 }, (_, i) => (
          <Line
            key={i}
            points={[
              [-0.95 + i * 0.13, -1.2, 0.06],
              [-0.95 + i * 0.13, -0.8 + (i % 4) * 0.22, 0.06],
              [0.45, -0.5 + (i % 4) * 0.22, 0.06],
              [0.45, 0.9, 0.06],
            ]}
            color="#446165"
            lineWidth={0.5}
          />
        ))}
        <Box
          size={[0.3, 0.85, 0.16]}
          position={[-0.8, 0.65, 0.13]}
          color={metal}
        />
        {Array.from({ length: 8 }, (_, i) => (
          <Box
            key={i}
            size={[0.02, 0.84, 0.08]}
            position={[-0.94 + i * 0.039, 0.65, 0.24]}
            color="#252c31"
          />
        ))}
        <Box size={[1.55, 0.08, 0.13]} position={[-0.15, -0.7, 0.13]} />
      </group>
    );
  if (kind === "gpu")
    return (
      <group>
        <RoundedBox args={size} radius={0.045} smoothness={2}>
          <meshStandardMaterial
            color="#5c6871"
            metalness={0.96}
            roughness={0.23}
          />
        </RoundedBox>
        <Box size={[2, 0.055, 0.72]} position={[0, 0.245, 0]} color="#1a2529" />
        {[-0.65, 0, 0.65].map((x) => (
          <group
            key={x}
            position={[x, -0.24, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <Fan small />
          </group>
        ))}
        <Box
          size={[1.8, 0.032, 0.035]}
          position={[0, 0.06, 0.443]}
          color="#b8f1ff"
          emissive
        />
        <Box
          size={[0.4, 0.13, 0.025]}
          position={[0.7, -0.075, 0.444]}
          color="#11171c"
        />
        {Array.from({ length: 21 }, (_, i) => (
          <Box
            key={i}
            size={[0.025, 0.21, 0.76]}
            position={[-0.9 + i * 0.085, 0, 0]}
            color="#a0a8ae"
          />
        ))}
        <Box
          size={[1.2, 0.11, 0.02]}
          position={[-0.2, 0.29, -0.3]}
          color="#aa9157"
        />
      </group>
    );
  if (kind === "ram")
    return (
      <group>
        <Box size={size} color="#2e3e46" />
        <Box
          size={[0.16, 1.15, 0.04]}
          position={[0, 0, 0.17]}
          color="#b7efff"
          emissive
        />
        {[-0.4, -0.2, 0, 0.2, 0.4].map((y) => (
          <Box
            key={y}
            size={[0.16, 0.12, 0.14]}
            position={[0, y, 0]}
            color="#101819"
          />
        ))}
        <Box
          size={[0.08, 1.08, 0.03]}
          position={[0, 0, -0.17]}
          color="#b5a471"
        />
      </group>
    );
  if (kind === "cpu" || kind === "cooler")
    return (
      <group>
        <RoundedBox args={size} radius={0.045} smoothness={2}>
          <meshStandardMaterial
            color={kind === "cpu" ? "#b3b8ba" : "#26323a"}
            metalness={0.92}
            roughness={0.18}
          />
        </RoundedBox>
        {kind === "cooler" ? (
          <>
            <Ring radius={0.24} position={[0, 0, 0.19]} />
            <Ring radius={0.19} position={[0, 0, 0.2]} color="#3a7799" />
            <Box
              size={[0.08, 0.17, 0.02]}
              position={[0, 0, 0.21]}
              color="#d3f4ff"
              emissive
            />
          </>
        ) : (
          <Box
            size={[0.33, 0.33, 0.015]}
            position={[0, 0, 0.06]}
            color="#656e72"
          />
        )}
      </group>
    );
  if (kind === "psu")
    return (
      <group>
        <Box size={size} color="#272e32" />
        {Array.from({ length: 14 }, (_, i) => (
          <Box
            key={i}
            size={[0.055, 0.28, 0.02]}
            position={[-0.6 + i * 0.09, 0, 0.61]}
            color="#090e12"
          />
        ))}
        <Box
          size={[0.43, 0.21, 0.015]}
          position={[-0.35, 0.242, 0.3]}
          color="#899297"
        />
      </group>
    );
  if (kind === "ssd")
    return (
      <group>
        <Box size={size} color="#4e5a64" />
        {Array.from({ length: 13 }, (_, i) => (
          <Box
            key={i}
            size={[0.035, 0.28, 0.06]}
            position={[-0.42 + i * 0.067, 0, 0.07]}
            color="#a0a4a4"
          />
        ))}
      </group>
    );
  if (kind === "screw")
    return (
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.027, 0.027, 0.14, 8]} />
          <meshStandardMaterial
            color="#a9b4b9"
            metalness={1}
            roughness={0.17}
          />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.024, 6]} />
          <meshStandardMaterial color="#a2aeb7" metalness={1} roughness={0.2} />
        </mesh>
      </group>
    );
  if (kind === "cable")
    return (
      <group>
        <mesh>
          <tubeGeometry args={[tube, 24, 0.035, 7, false]} />
          <meshStandardMaterial
            color="#18232b"
            metalness={0.3}
            roughness={0.58}
          />
        </mesh>
        <Box
          size={[0.14, 0.15, 0.13]}
          position={[0.65, 0.6, -0.2]}
          color="#59666d"
        />
      </group>
    );
  return (
    <group>
      <Box size={size} color={kind === "rail" ? "#849099" : "#263039"} />
      {part.id === "roof" &&
        Array.from({ length: 20 }, (_, i) => (
          <Box
            key={i}
            size={[0.06, 0.008, 1.4]}
            position={[-1.1 + i * 0.115, 0.048, 0]}
            color="#0a1016"
          />
        ))}
      {part.id === "base" && (
        <Box
          size={[2.4, 0.022, 0.022]}
          position={[0, 0.075, 0.85]}
          color="#9deaff"
          emissive
        />
      )}
    </group>
  );
});
