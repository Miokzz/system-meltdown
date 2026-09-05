import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useSystem } from "@/utils/store";

/** A restrained physical set. Floor machining is shader detail, not hundreds of rings. */
export default function LaboratorySet() {
  const quality = useSystem((s) => s.effectiveQuality);
  const floorMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: "#1a1e20",
      metalness: 0.32,
      roughness: 0.48,
    });
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vSetPosition;",
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvSetPosition = position;",
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vSetPosition;",
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        float machining = sin(length(vSetPosition.xy) * 220.) * .025;
        roughnessFactor = clamp(roughnessFactor + machining, .35, .75);
      `,
      );
    };
    material.customProgramCacheKey = () => "laboratory-floor-v1";
    return material;
  }, []);
  useEffect(() => () => floorMaterial.dispose(), [floorMaterial]);
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -3.245, 0]}
        receiveShadow
      >
        <planeGeometry args={[70, 70]} />
        <primitive object={floorMaterial} attach="material" />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -3.233, 0]}
        receiveShadow
      >
        <circleGeometry args={[4.3, 96]} />
        <meshStandardMaterial
          color="#22272a"
          metalness={0.65}
          roughness={0.36}
        />
      </mesh>
      {[4.31, 4.34, 3.86].map((radius, i) => (
        <mesh
          key={radius}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -3.226 + i * 0.001, 0]}
        >
          <ringGeometry
            args={[radius, radius + (i === 1 ? 0.006 : 0.012), 128]}
          />
          <meshStandardMaterial
            color={i === 1 ? "#9badb3" : "#525c62"}
            metalness={0.9}
            roughness={0.3}
          />
        </mesh>
      ))}
      {[-1, 1].map((x) => (
        <group key={x} position={[x * 4.3, -3.2, -2.1]}>
          <mesh>
            <boxGeometry args={[0.12, 0.08, 3.1]} />
            <meshStandardMaterial
              color="#101519"
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0, 0.045, 0]}>
            <boxGeometry args={[0.018, 0.012, 2.8]} />
            <meshStandardMaterial
              color="#a9d0df"
              emissive="#a9d0df"
              emissiveIntensity={0.5}
            />
          </mesh>
        </group>
      ))}
      {quality === "ultra" &&
        [-1, 1].map((x) => (
          <group key={x} position={[x * 7.5, 1, -7]}>
            <mesh>
              <boxGeometry args={[0.3, 8, 0.3]} />
              <meshStandardMaterial
                color="#131719"
                metalness={0.8}
                roughness={0.3}
              />
            </mesh>
            <mesh position={[0, 0, 0.155]}>
              <boxGeometry args={[0.025, 5, 0.012]} />
              <meshBasicMaterial color="#596b76" />
            </mesh>
          </group>
        ))}
    </group>
  );
}
