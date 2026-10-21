# AccumulativeShadows render-state regression

Run `node test/accumulative-shadows/run.mjs` after installing the repository dependencies and Playwright Chromium. Set `CHROMIUM_EXECUTABLE_PATH` to use an existing Chrome installation.

The runner uses separate WebGL and WebGPU source aliases and rejects a WebGPU fallback. It runs the real frame loop, unlike the frozen story runner. Six cases run per renderer:

- Bound and default render targets, with temporal accumulation stopping after two frames.
- Imperative `reset()` followed by another `update()`.
- An exception from a mesh's `onBeforeRender`, a registered light's `update()`, or `renderer.clear()` during reset.

The probe retains an outer FBO across callbacks and checks that subsequent rendering reaches it. Exception cases also check scene background, mesh and catcher materials, light intensity, internal light visibility, frustum culling, and clear color/alpha. Each then updates the same accumulator again.

On the original `v11-working` implementation, 10 of 12 cases fail: active accumulation and reset discard the caller's target; render/light exceptions leave scene state modified; a clear exception leaves the clear alpha changed. With the fix, all 12 pass on WebGL and native WebGPU. These tests establish state restoration, not artistic shadow quality or every other renderer state.
