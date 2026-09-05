# SYSTEM MELTDOWN

An interactive hardware experiment. A floating computer in a dark laboratory comes apart as you scroll. Every transform is reversible — until curiosity takes over.

## Run locally

Requires Node.js 22.13 or later and npm.

```sh
npm install
npm run dev
```

Open http://localhost:3000. No API keys, environment variables, external 3D models, audio downloads, or account setup are required.

```sh
npm run build
npm start
```

## Experience

- Boot sequence with a real scene-readiness gate.
- Procedural, individually modeled chassis, glass, PCB, GPU, processor, cooler, fans, RAM, PSU, SSD, cables, and fasteners.
- Six chapters controlled by GSAP ScrollTrigger. Scroll backwards to reassemble, or jump using the chapter navigation.
- Component hover telemetry, cursor-reactive camera and limited drag orbit in the anatomy chapter.
- A delayed manual override releases Rapier rigid bodies in sequence, with collision response, weight, friction, an energy impulse and instanced sparks.
- A two-second blackout, incident report, and animated reconstruction from the actual positions of the destroyed components.
- Optional synthesized Web Audio ambience and effects. The audio context is only created after clicking SOUND ON.

## Easter eggs

1. Click the GPU five times: **STOP TOUCHING THE GPU.** Eight clicks: **I’M SERIOUS.** Eleven: **fine.** The GPU loses containment.
2. Click the logo seven times to enable **DEVELOPER MODE**. An FPS monitor appears; drag components and release to throw them. Read-only `window.__SYSTEM_DIAGNOSTICS__` reports body transforms and collision counts only while this mode is active.

## Stack

Next.js App Router, React, TypeScript, Tailwind CSS 4, Three.js, React Three Fiber, Drei, GSAP, React Three Rapier, React Three Postprocessing, and Zustand. CSS transitions handle the light DOM transitions; Framer Motion is unnecessary for this implementation.

## Architecture

```text
app/           App Router entry, metadata and layout
components/    Experience, HUD, ScrollController
three/         ComputerModel, ExplodedView, CameraRig, Lighting,
               PhysicsScene, Particles, Sparks and component definitions
scenes/        Laboratory canvas, effects and scene lifecycle
animations/    FailureSequence and RebuildSequence
hooks/         Device and motion preference detection
utils/         State, mutable animation timeline, AudioManager, diagnostics
public/        Local favicon
styles/        Responsive, scene-integrated interface
tests/         Reversibility unit test and real browser journeys
```

`parts.ts` is the single source of truth for assembled transforms, exploded offsets, release timing and collision dimensions. Scroll transforms are pure functions of progress. At failure, the same bodies change from kinematic to dynamic. Reconstruction interpolates from live Rapier transforms to the original definitions. Per-frame transforms use refs and mutable state rather than React rendering.

## Graphics and performance

Metallic PBR materials, local studio reflections generated with Lightformers, translucent glass, shadow mapping, bloom, subtle depth of field, fog, film noise, vignette and failure-only chromatic aberration. The shockwave uses an expanding luminous ring and impulses on the real rigid bodies. Camera interpolation provides a sense of motion without a heavy full-screen motion blur pass.

The 3D entry point is lazy-loaded without server rendering. Circuit components and sparks use instancing. Particles are bounded at 200 (70 in adaptive mode), sparks at 48 (18 in adaptive mode), device pixel ratio at 1.6. Small screens, low core counts, reduced-motion preferences and sustained low FPS select adaptive quality: DPR 1, fewer pieces, lower solver iterations, no shadow map or depth-of-field pass. Rendering pauses when the tab is hidden. Timelines, event listeners, audio nodes and Three resources are disposed through component lifecycles.

## Validation

```sh
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
```

Keep the dev server running during browser tests. To validate a deployment, set `TEST_BASE_URL` to its HTTPS URL. An existing Chrome executable can be selected through `CHROME_EXECUTABLE`. Test screenshots go to ignored `artifacts/`; Playwright failure reports stay in ignored `test-results/`.

## Deploy to Vercel

Import this GitHub repository in Vercel and select **Next.js**. The root directory is the repository root, install command is `npm install`, build command is `npm run build`, and output remains the Next.js default. No environment variables are needed. `vercel.json` records these settings. Pushes to the production branch can use Vercel's Git integration.

## Technical boundaries

- Requires WebGL 2 and hardware acceleration. Unsupported graphics devices receive a reconnect message; a 2D poster does not replace the interactive model.
- Colliders use simplified boxes for predictable performance. Tubes and glass are rigid stylized components, not a soft-body cable or fracture simulation. Collision outcomes vary with frame timing and user throws.
- This is an experimental computer design, not a dimensionally accurate commercial hardware model.
- Adaptive mobile rendering deliberately uses fewer pieces and effects. Full cinematic rendering depends on the device GPU.
- Rapier's current bundled WASM loader may emit an upstream initialization-deprecation warning. It is nonfatal and is not suppressed.

All application assets are procedural or included locally. No secrets or credentials belong in this repository.
