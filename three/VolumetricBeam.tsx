import { type RefObject, useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { SpotLightMaterial } from "@react-three/drei/materials/SpotLightMaterial";
import { Group, SpotLight, Vector3 } from "three";

/** Same optical cone as Drei, with declarative geometry and explicit material ownership. */
export default function VolumetricBeam({
  light,
}: {
  light: RefObject<SpotLight | null>;
}) {
  const group = useRef<Group>(null);
  const [material] = useState(() => new SpotLightMaterial());
  const materialRef = useRef<SpotLightMaterial>(null);
  const [target] = useState(() => new Vector3());
  useEffect(() => () => material.dispose(), [material]);
  useFrame(({ camera }) => {
    if (!light.current || !group.current || !materialRef.current) return;
    light.current.getWorldPosition(
      materialRef.current.uniforms.spotPosition.value,
    );
    group.current.lookAt(light.current.target.getWorldPosition(target));
    materialRef.current.uniforms.cameraNear.value = camera.near;
    materialRef.current.uniforms.cameraFar.value = camera.far;
  });
  return (
    <group ref={group}>
      <mesh
        position={[0, 0, 11]}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={() => null}
      >
        <cylinderGeometry args={[0.1, 0.57 * 7, 22, 128, 64, true]} />
        <primitive
          ref={materialRef}
          object={material}
          attach="material"
          dispose={null}
          uniforms-opacity-value={0.025}
          uniforms-lightColor-value="#eef1ed"
          uniforms-attenuation-value={9}
          uniforms-anglePower-value={6}
          uniforms-resolution-value={[0, 0]}
        />
      </mesh>
    </group>
  );
}
