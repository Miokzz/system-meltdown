# SYSTEM MELTDOWN

A cinematic, interactive hardware laboratory. Scroll to mechanically dismantle a floating experimental computer, inspect its internals, photograph it, then make a very expensive mistake.

**Live:** https://system-meltdown.vercel.app  
**Repository:** https://github.com/Miokzz/system-meltdown

## Run locally

Requires Node.js 24 LTS and npm. No environment variables, keys, asset downloads or accounts are needed.

```sh
npm install
npm run dev
```

Open http://localhost:3000. For a production build:

```sh
npm run build
npm start
```

## The experience

- Real renderer initialization, material compilation and warm frames gate the introduction.
- Six reversible scroll chapters: containment, access, GPU extraction, component release, engineering anatomy and thermal instability.
- Individual procedural hardware bodies, including an open triple-fan GPU with fin stacks, copper heatpipes, PCB, VRM, connectors, gold contacts and backplate; a structured motherboard, radiator, pump, RAM, PSU, SSD, chassis, glass and fasteners.
- Mechanical unlock, initial extraction, clearance, weighted travel and final orientation are sampled from scroll progress. Scrolling backwards returns to the original transforms without accumulated drift.
- A hinged glass safety cover protects the emergency override. Lift it, press, wait through the silence, and watch the first fastener trigger a collision-driven chain. Timed guards keep the narrative moving if user interactions change the physical outcome.
- A brief slow-motion interval, restrained refractive shock front, localized sparks, actual rigid-body impulses, blackout, incident report and ordered reconstruction from the final physical transforms.
- Optional gesture-unlocked Web Audio: fan airflow, rotational tone, transformer hum, room ambience, connectors, metallic/glass/plastic impacts, electrical glitches and a low-frequency pressure pulse. Thermal load, RPM, material, impact velocity and stereo position influence the mix.

## Optical and laboratory tools

**PLAY CINEMATIC** drives the same scroll timeline automatically and proceeds through the override and destruction. Escape stops the automatic tour.

**PHOTO MODE / P** freezes the simulation by default. Drag to orbit, scroll/pinch to dolly; adjust 24–100 mm focal length, focus distance, depth of field and exposure. Toggle autofocus, animation pause and HUD visibility. **CAPTURE FRAME** downloads a PNG of the rendered scene without interface. Escape exits. Depth of field requires HIGH or ULTRA.

**LAB TOOLS** contains NORMAL, targeted X-RAY and THERMAL inspection, graphics presets, reduced camera motion and reduced flashes. Thermal colors are an artistic visualization of the internal load model, not measurements of the visitor's computer.

## Easter eggs

1. Click the GPU five times: `STOP TOUCHING THE GPU.` Eight: `I’M SERIOUS.` Eleven: `fine.` It loses containment.
2. Click the logo seven times: **DEVELOPER MODE**. Drag and throw parts using a mass-sensitive spring; hold the GPU for five seconds to earn another warning.
3. Developer tools expose ZERO G, inverted gravity, a magnetic field, collider and wireframe overlays, renderer instrumentation and a short automated benchmark.
4. The developer console accepts a fixed allowlist: `help`, `status`, `gravity off`, `gravity on`, `gravity reverse`, `magnet`, `wireframe`, `colliders`, `repair`. It does not execute JavaScript or system commands.
5. Completing the incident unlocks **DISASSEMBLY LAB** in Lab Tools for that session.

## Rendering

The existing stack is retained: Next.js App Router, React, TypeScript and Tailwind CSS; Three.js, React Three Fiber, Drei and React Three Postprocessing; Rapier rigid-body physics; GSAP timelines; and Zustand state. This upgrade adds no runtime libraries.

Three.js WebGL 2 with React Three Fiber, Drei and React Three Postprocessing. PBR materials distinguish anodized and brushed aluminum, steel, PCB, copper, gold, plastic, rubber and tempered glass. Tiny deterministic surface textures and a shared label atlas add detail without external assets. Hardware geometry is merged by material inside each independent rigid body; swept fan blades use instancing.

A generated studio environment places broad reflections where metal edges can read. Key, fill, rim and practical lighting preserve neutral highlights. Continuous camera shots use focal-length changes, world-space autofocus and controlled rack focus. ACES tone mapping, restrained bloom, depth of field, soft shadows, fine grain, localized heat shimmer and failure-only optical distortion shape the image. ULTRA adds contact occlusion and denser rendering. Camera damping, a single slow-motion interval and fan motion discs provide motion sensation without a costly full-screen velocity-buffer blur.

### Presets

| Preset |                DPR ceiling | Shadow | Environment | Dust | Optics                |
| ------ | -------------------------: | -----: | ----------: | ---: | --------------------- |
| ULTRA  | 2, including supersampling |   2048 |         512 |  240 | DOF, AO, 4× MSAA      |
| HIGH   |                        1.6 |   1024 |         256 |  150 | DOF, 2× MSAA          |
| MEDIUM |                       1.25 |    512 |         128 |   85 | FXAA, reduced physics |
| LOW    |                          1 |    off |          64 |   35 | FXAA, reduced physics |

ULTRA is opt-in. AUTO starts at HIGH on desktop or MEDIUM on small/constrained devices and steps down after sustained low frame rates. Explicit presets remain fixed. Browser-hidden rendering pauses. Mutable frame state avoids React updates every frame; resources, listeners, timelines and audio have lifecycle cleanup. Sparks and dust have fixed bounds. Reduced physics omits a second DIMM and coolant tube and uses fewer solver iterations.

## Architecture

```text
app/          Next.js App Router entry and metadata
components/   Experience, HUD, scroll, optical controls, cinematic controller
three/        PhysicsScene, CameraRig, Lighting, effects, telemetry, laboratory set
  hardware/   Batched geometry, material library, GPU, motherboard, fans, components
scenes/       Canvas composition and renderer readiness
animations/   FailureSequence and RebuildSequence
hooks/        Device and accessibility preference detection
utils/        Store, narrative substates, thermal model, audio, physics runtime,
              shared cinema parameters, presets and diagnostics
public/       Local identity asset
styles/       Responsive laboratory interface
tests/        Mechanical invariants and real browser journeys
```

`three/parts.ts` remains the source of assembled transforms, exploded offsets and collision bounds. Existing phase names remain compatible; `utils/sequence.ts` derives finer narrative substates instead of duplicating scroll state. Rapier uses calibrated mass/friction/restitution, CCD, fixed substeps and collision propagation. The camera, thermal, audio and physics systems communicate through small mutable runtime objects; UI subscriptions handle infrequent changes.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
```

Keep the dev server running for browser tests. Set `TEST_BASE_URL` to the production HTTPS URL to run the same journeys against Vercel. `CHROME_EXECUTABLE` can select an installed browser. Screenshots, performance captures and downloaded photo PNGs go to ignored `artifacts/`; failure reports stay in ignored `test-results/`.

The browser suite checks reversible transforms, real collisions, GPU warnings and throws, safety interlock, destruction/recovery, mobile layout, inspection presets, optical controls, local PNG download and the developer benchmark. The benchmark is an approximate in-browser comparison, not a scientific GPU rating; draw and triangle counts include scene and postprocessing passes. JavaScript heap is reported when the browser provides it, not as a claim about VRAM.

## Deploy

Use the existing Vercel project **system-meltdown**, connected to this repository. Framework: **Next.js**. Root: repository root. Install: `npm install`. Build: `npm run build`. Output: Next.js default. No environment variables. `vercel.json` records the commands. Push the verified production branch to trigger the existing Git integration.

## Technical boundaries

- WebGL 2 and hardware acceleration are required. Unsupported devices receive a reconnect explanation. Chrome/Chromium desktop and mobile viewports are covered by automated browser tests; Safari and Firefox have not been device-tested.
- WebGPU was evaluated against the existing Rapier/R3F/postprocessing stack. A second renderer would require a different material/effects path without a demonstrated benefit for this scene, so the stable WebGL 2 renderer is retained.
- This is stylized experimental hardware, not a dimensionally exact commercial product. Thermal behavior and the magnetic field are fictional but internally coherent.
- Colliders simplify fine geometric detail. Cables use bounded procedural deformation and rigid connector bodies, not full soft-body rope simulation. Glass transmits/refracts but does not fracture into hundreds of simulated shards. Environment reflections are designed studio captures, not path tracing.
- Physics results can differ after user throws. The initial chain is collision-driven, with deadline safeguards to preserve the narrative.
- The current upstream Rapier WASM initializer can emit a nonfatal deprecated-parameter notice. Application warnings and shader errors should never be hidden to mask failures.
- The tested ANGLE driver also emits X4008/X4122 compiler notices for an unselected sampling branch and constant precision in Three.js's built-in `PMREMGGXConvolution` shader. Rendering remains valid; these upstream notices are left visible.

All application geometry, textures and sounds are procedural or included locally. No external asset licenses or secrets are required.

The renderer caps each frame at 8,294,400 pixels and the GPU texture limit: ULTRA retains 2× density at 1440×900, uses 1× at UHD, and automatically scales larger viewports without recreating the scene.
