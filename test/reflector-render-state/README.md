# MeshReflectorMaterial render state regression

Run `node test/reflector-render-state/run.mjs` after installing the repository
dependencies and Playwright Chromium. `CHROMIUM_EXECUTABLE_PATH` can select an
existing Chromium installation.

The active R3F frame loop runs the actual legacy material with blur enabled and
disabled. Thirteen WebGL cases cover bound/default targets, cube face 3, mip level
1, an explicitly hidden parent, and errors during reflection and blur rendering.
The caller target, active face/mip, parent visibility, XR enabled flag and shadow
auto-update flag must survive each pass. Injected errors must reach the scheduler.
Continuation drawing is checked through EffectComposer/ShaderPass pixel readback;
cube face 3 is read directly. Mip checks assert the active level without claiming
mip pixel validation.

This targets the legacy WebGL implementation. The WebGPU material delegates its
offscreen passes to Three's TSL `reflector()` node and is neither changed nor
claimed as WebGPU runtime validation here.
