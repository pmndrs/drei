# MeshPortalMaterial SDF initialization state

Run `node test/portal-sdf-state/run.mjs` after installing dependencies and Playwright
Chromium. `CHROMIUM_EXECUTABLE_PATH` can select an installed Chromium browser.

Sibling layout effects bind an outer target before the actual portal SDF
initialization and inspect it immediately afterward. Twelve real WebGL/native
WebGPU cases cover bound/default targets, cube face 3, mip level 1, and errors
during mask rendering and the first SDF pass. Target, face/mip and clear color/
alpha must be restored; errors must propagate. Bound-target continuation is
checked through EffectComposer or WebGPU RenderPipeline pixel readback.

The Canvas frame loop is deliberately stopped because SDF initialization runs in
a layout effect, without a frame callback. Native WebGPU is asserted through
`backend.isWebGPUBackend`; a WebGL fallback cannot pass as WebGPU validation.
These checks do not grade SDF image quality or async readback normalization.

Fullscreen blend rendering is unchanged: intermediate blends render the root
and portal scenes into two buffers, then intentionally present their mixed quad
to the canvas as the owner of the render loop.
