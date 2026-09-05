# Rendering verification

Measured before and after the upgrade on September 5, 2026, using the same native Chrome 152 executable, a 1440 × 1000 viewport, device pixel ratio 1, and the local Next.js development server. The upgraded scene used the default HIGH preset. Each sample covers the last 180 rendered frames after an eight-second settling period in the opening shot.

| Measurement                               |    Original |     Upgrade |
| ----------------------------------------- | ----------: | ----------: |
| Average frame time                        |     6.26 ms |     6.13 ms |
| Approximate average FPS                   |       159.7 |       163.2 |
| Approximate 1% low FPS                    |        82.0 |        82.6 |
| Draw calls per frame                      |         656 |         673 |
| Submitted triangles per frame             |      79,324 |     337,609 |
| JavaScript heap                           |    48.1 MiB |    58.9 MiB |
| Navigation to interactive scene           |      4.75 s |      5.13 s |
| Transferred resources, development server |     2.73 MB |     2.78 MB |
| Rendered canvas                           | 1440 × 1000 | 1440 × 1000 |

The small FPS difference is within run-to-run variation, not a claimed speed improvement. The useful result is substantially more visible hardware detail, transmissive glass and additional optics at similar frame pacing in this environment. Draw calls and triangles count all observed WebGL draw submissions, including shadow, transmission and postprocessing passes; they are not unique scene geometry counts. Heap is JavaScript memory, not GPU memory. Development transfers and loading times include the development runtime and are not production bundle ratings.

The baseline and upgraded scene both use a generated studio reflection environment and key/rim/practical lighting. The upgrade separates neutral key and fill, rim light, two internal practicals and emissive fixtures; HIGH includes soft shadows, depth of field, restrained bloom, film grain, tone mapping and subtle optical effects. ULTRA increases render scale, shadow and environment resolution and adds ambient occlusion. Presets and exact bounds are documented in the README.

The automated browser journeys cover scroll reversal, collision propagation, destruction and recovery, mobile layout, GPU Easter eggs, mass-sensitive throwing, gesture-gated audio and mute, X-ray/thermal modes, ULTRA, photo orbit and PNG export, and benchmark/terminal operation. Pure mechanical tests verify round trips and release/reconstruction ordering. Screenshots and raw measurements remain in ignored `artifacts/` rather than inflating the repository.

These are local comparative observations, not a guarantee for another GPU, browser, thermal state or display. The built-in developer benchmark gives visitors a short measurement on their own device.
