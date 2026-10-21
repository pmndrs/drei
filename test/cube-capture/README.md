# Cube capture publication and finite frames

Run `node test/cube-capture/run.mjs` after installing dependencies and Playwright
Chromium. Set `CHROMIUM_EXECUTABLE_PATH` to select an existing Chromium.

The runner exercises the core component on WebGL and native WebGPU (no fallback),
plus the legacy WebGL component. Each starts with a stopped scheduler and requests
individual demand frames. The portal background changes red → green → blue;
the attached envMap is actually rendered to a 2D target and read back.

For `frames={1}`, the first capture must display red and remain red after further
invalidations and a React re-render. For `frames={2}`, it must finish green. An
unlimited capture must track every color, and `frames={0}` must not capture at all.
Render counts check the finite budget, and attachment identity checks that the
displayed texture matches the public FBO. These are rendering correctness checks,
not a visual/artistic review of Fisheye distortion or other RenderTexture paths.
