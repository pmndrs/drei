# Caustics render-state regression

Run `node test/caustics/run.mjs` after installing dependencies and Playwright Chromium. `CHROMIUM_EXECUTABLE_PATH` can select an existing Chrome installation; `TEST_SCENARIOS` can select a comma-separated subset.

The standalone runner uses production WebGL and WebGPU source aliases separately, asserts the actual backend, and rejects WebGPU fallback. The real frame loop executes the normal-map and caustic passes. It covers eight cases per backend:

- Bound/default targets, cube face 3 and mip level 1.
- `causticsOnly` with back-face rendering, and previously hidden content with the default target.
- `frames={1}` stopping after one capture and `frames={0}` skipping capture.
- A mesh's actual `onBeforeRender` throwing during the normal pass.

An early callback binds the caller's target and an existing override material. A later callback checks the binding, override, content visibility and parent transform before continuing rendering into the caller's target. The bound and cube cases read back green continuation pixels. Mip cases assert the binding directly because the readback API reads mip 0. The exception case verifies cleanup immediately after the expected exception; that specific error is recorded separately from unexpected browser/GPU errors.

Before the fix, 14 of 16 cases fail: active captures discard the caller target/face/mip, clear its content scene override, or leave previously hidden content visible. A thrown render also skips cleanup. The zero-frame case passes on both backends. After the fix, all 16 pass in real WebGL and native WebGPU.

These checks establish state restoration and capture limits. They do not compare the artistic caustic appearance or claim coverage of every renderer state.
