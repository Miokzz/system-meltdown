import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  FXAA,
  Noise,
  SSAO,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import {
  BlendFunction,
  BloomEffect,
  ChromaticAberrationEffect,
  DepthOfFieldEffect,
  Effect,
  EffectAttribute,
  SSAOEffect,
  ToneMappingMode,
} from "postprocessing";
import { Texture, Uniform, Vector2, Vector3 } from "three";
import { cinema, smoothRange } from "@/utils/cinema";
import { timeline, useSystem } from "@/utils/store";
import { qualityPresets } from "@/utils/quality";
import { thermal } from "@/utils/thermal";
import { physicsRuntime } from "@/utils/physics";

const fragment = `
  uniform float elapsed;
  uniform float heat;
  uniform float pulse;
  uniform float shock;
  uniform float exposure;
  uniform float failure;
  uniform float aspect;
  uniform vec2 heatCenter;
  void mainImage(const in vec4 inputColor, const in vec2 inputUv, out vec4 outputColor) {
    vec2 uv = inputUv;
    vec2 d = uv - heatCenter;
    d.x *= aspect;
    float mask = exp(-dot(d, d) * 110.);
    uv.x += sin(uv.y * 123. + elapsed * 13.) * .0007 * heat * mask;
    uv.y += sin(uv.x * 91. + elapsed * 8.) * .0003 * heat * mask;
    vec2 r = uv - .5;
    r.x *= aspect;
    float radius = length(r);
    float wave = exp(-pow((radius - shock * .9) * 29., 2.));
    uv += normalize(r + .0001) * wave * pulse * .0024;
    vec4 refracted = texture2D(inputBuffer, uv);
    vec3 c = refracted.rgb * exposure;
    float luma = dot(c, vec3(.2126, .7152, .0722));
    vec3 shadowTint = mix(vec3(.975, 1., 1.025), vec3(1.025, .98, .97), failure);
    c *= mix(shadowTint, vec3(1.015, 1.006, .99), smoothstep(.03, .55, luma));
    outputColor = vec4(c, refracted.a);
  }`;

/** Localized optical heat shimmer, pressure-front refraction, and restrained grading. */
class LaboratoryOptics extends Effect {
  constructor() {
    super("LaboratoryOptics", fragment, {
      attributes: EffectAttribute.CONVOLUTION,
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ["elapsed", new Uniform(0)],
        ["heat", new Uniform(0)],
        ["pulse", new Uniform(0)],
        ["shock", new Uniform(0)],
        ["exposure", new Uniform(1)],
        ["failure", new Uniform(0)],
        ["aspect", new Uniform(1)],
        ["heatCenter", new Uniform(new Vector2(0.5, 0.5))],
      ]),
    });
  }
}
const center = new Vector3();
function ownOcclusionNoise(effect: SSAOEffect | null) {
  if (!effect) return;
  // SSAO disposes its passes, but its generated noise texture lives in a uniform.
  const noise = effect.ssaoMaterial.uniforms.noiseTexture
    .value as Texture | null;
  return () => noise?.dispose();
}
function Optics() {
  const effect = useMemo(() => new LaboratoryOptics(), []);
  const ref = useRef<LaboratoryOptics>(null);
  useEffect(() => () => effect.dispose(), [effect]);
  useFrame(({ camera, size }) => {
    if (!ref.current) return;
    const s = useSystem.getState(),
      u = ref.current.uniforms;
    const processor = physicsRuntime.bodies.get("processor");
    center
      .copy(
        processor ? processor.translation() : { x: -0.35, y: 0.55, z: -0.4 },
      )
      .project(camera);
    (u.get("heatCenter")!.value as Vector2).set(
      center.x * 0.5 + 0.5,
      center.y * 0.5 + 0.5,
    );
    u.get("elapsed")!.value = cinema.time;
    u.get("aspect")!.value = size.width / size.height;
    u.get("heat")!.value =
      s.reducedMotion || s.low ? 0 : smoothRange(thermal.heat, 0.65, 1);
    u.get("shock")!.value = Math.max(0, (timeline.failure - 0.7) * 8);
    u.get("pulse")!.value = s.reducedFlash ? 0 : cinema.pulse;
    u.get("exposure")!.value =
      cinema.exposure * (1 + (s.reducedFlash ? 0 : cinema.pulse * 0.18));
    u.get("failure")!.value =
      s.phase === "failure" ? smoothRange(timeline.failure, 0.15, 0.5) : 0;
  });
  return <primitive ref={ref} object={effect} dispose={null} />;
}

export default function CinematicEffects() {
  const quality = useSystem((s) => s.effectiveQuality);
  const preset = qualityPresets[quality];
  const bloom = useRef<BloomEffect>(null),
    dof = useRef<DepthOfFieldEffect>(null),
    aberration = useRef<ChromaticAberrationEffect>(null);
  const offset = useMemo(() => new Vector2(0, 0), []);
  useFrame(() => {
    const s = useSystem.getState();
    if (bloom.current)
      bloom.current.intensity =
        0.34 + (s.reducedFlash ? 0 : cinema.pulse * 0.9);
    if (dof.current) {
      dof.current.target = cinema.focus;
      dof.current.bokehScale = cinema.aperture;
      dof.current.cocMaterial.focusRange = cinema.focusRange;
    }
    if (aberration.current) {
      const burst = s.reducedFlash
        ? 0
        : cinema.pulse * 0.0012 +
          (s.phase === "failure" ? timeline.impact * 0.00015 : 0);
      aberration.current.offset.set(burst, burst * 0.36);
    }
  });
  return (
    <EffectComposer
      key={quality}
      multisampling={preset.msaa}
      enableNormalPass={preset.ao}
    >
      <Optics />
      {preset.ao ? (
        <SSAO
          ref={ownOcclusionNoise}
          samples={16}
          rings={3}
          radius={0.075}
          intensity={0.72}
          luminanceInfluence={0.65}
          bias={0.025}
          worldDistanceThreshold={24}
          worldDistanceFalloff={5}
          worldProximityThreshold={0.3}
          worldProximityFalloff={0.12}
          resolutionScale={0.5}
        />
      ) : (
        <></>
      )}
      <Bloom
        ref={bloom}
        intensity={0.34}
        luminanceThreshold={1.2}
        luminanceSmoothing={0.2}
        mipmapBlur
      />
      {preset.dof ? (
        <DepthOfField
          ref={dof}
          target={[0, 0, 0]}
          focusRange={4}
          bokehScale={0.45}
          resolutionScale={quality === "ultra" ? 0.75 : 0.5}
        />
      ) : (
        <></>
      )}
      <ChromaticAberration
        ref={aberration}
        offset={offset}
        radialModulation
        modulationOffset={0.35}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette offset={0.25} darkness={0.36} />
      <Noise opacity={0.004} blendFunction={BlendFunction.SOFT_LIGHT} />
      {preset.msaa === 0 ? <FXAA /> : <></>}
    </EffectComposer>
  );
}
