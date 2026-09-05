import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSystem } from "@/utils/store";
import { qualityPresets } from "@/utils/quality";
import { cinema } from "@/utils/cinema";
const vertexShader = `
  uniform float uTime;
  uniform float uPulse;
  uniform float uDpr;
  attribute float seed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * .06 + seed * 51.) * .12;
    p.y += sin(uTime * .11 + seed * 24.) * .1;
    p.z += cos(uTime * .08 + seed * 38.) * .13;
    p += normalize(p + vec3(.1)) * uPulse * .7;
    vec4 view = modelViewMatrix * vec4(p, 1.);
    float beam = exp(-dot(p.xz + vec2(.7, -.4), p.xz + vec2(.7, -.4)) * .11);
    vAlpha = (.035 + beam * .23) * (1. - smoothstep(5., 23., -view.z));
    gl_Position = projectionMatrix * view;
    gl_PointSize = clamp((10. + seed * 14.) * uDpr / -view.z, .6, 2.8 * uDpr);
  }`;
const fragmentShader = `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - .5);
    float a = (1. - smoothstep(.1, .5, d)) * vAlpha;
    gl_FragColor = vec4(.69, .76, .79, a);
  }`;
export default function Particles() {
  const quality = useSystem((s) => s.effectiveQuality);
  const count = qualityPresets[quality].particles;
  const material = useRef<THREE.ShaderMaterial>(null);
  const data = useMemo(() => {
    const positions = new Float32Array(count * 3),
      seeds = new Float32Array(count);
    const random = (i: number) => {
      const n = Math.sin(i * 127.1 + 311.7) * 43758.5453;
      return n - Math.floor(n);
    };
    for (let i = 0; i < count; i++) {
      positions.set(
        [
          (random(i * 3) - 0.5) * 16,
          random(i * 3 + 1) * 8 - 2.9,
          (random(i * 3 + 2) - 0.5) * 15,
        ],
        i * 3,
      );
      seeds[i] = random(i + 99);
    }
    return { positions, seeds };
  }, [count]);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uPulse: { value: 0 }, uDpr: { value: 1 } }),
    [],
  );
  useFrame(({ gl }) => {
    if (!material.current) return;
    material.current.uniforms.uTime.value = cinema.time;
    material.current.uniforms.uPulse.value = cinema.pulse;
    material.current.uniforms.uDpr.value = gl.getPixelRatio();
  });
  return (
    <points frustumCulled={false}>
      <bufferGeometry key={count}>
        <bufferAttribute
          attach="attributes-position"
          args={[data.positions, 3]}
        />
        <bufferAttribute attach="attributes-seed" args={[data.seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </points>
  );
}
