# Texture capture publication and finite frames

Run `node test/cube-capture/run.mjs` after installing dependencies and Playwright
Chromium. Set `CHROMIUM_EXECUTABLE_PATH` to select an existing Chromium.

The runner exercises core RenderTexture and RenderCubeTexture on WebGL and native
WebGPU (no fallback), plus legacy RenderCubeTexture on WebGL. Each starts with a
stopped scheduler and requests individual demand frames. The portal background
changes red → green → blue; the attached map/envMap is actually rendered to a 2D
target and read back.

For `frames={1}`, the first capture must display red and remain red after further
invalidations and a React re-render. For `frames={2}`, it must finish green. An
unlimited capture must track every color, and `frames={0}` must not capture at all.
Render counts check the finite budget, and attachment identity checks that the
displayed texture matches the latest capture and public ref/FBO. RenderTexture
also covers string/path/function attachments, texture properties on both buffers,
callback-ref cleanup and restoring the prior attachment on unmount. Material
versions check that string attachments do not recompile shaders every capture.
An actual `onBeforeRender` exception checks that the failed capture restores the
caller target/autoClear, propagates its error, and can retry without consuming a
finite frame or publishing a failed buffer.
These are correctness checks, not a visual/artistic review of Fisheye distortion.
