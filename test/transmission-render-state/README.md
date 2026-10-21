# Transmission capture state regression

Run `node test/transmission-render-state/run.mjs` after installing the repository
dependencies and Playwright Chromium. `CHROMIUM_EXECUTABLE_PATH` can select an
existing Chromium installation.

The runner uses separate production aliases and requires the native WebGPU
backend, with no WebGL fallback. It exercises the actual component in an active
R3F loop on both renderers: bound/default targets, a RenderTexture portal, material
arrays, and both backside modes. It injects a synchronous render exception in
each offscreen pass and allows the scheduler to report that expected exception
without unmounting the test scene. All other browser/GPU errors fail the test.

An outer pass binds a red target before capture, then continues drawing green
without rebinding. EffectComposer/ShaderPass (WebGL) or RenderPipeline (WebGPU)
copies it for readback. Green proves that continuation reached the outer target.
Assertions also check the parent material, scene background, tone mapping, and
transmission side/thickness. The default-target control checks state restoration
without expecting an outer-target pixel. This verifies capture state, not the
artistic appearance of refraction or XR rendering.
