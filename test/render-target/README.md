# Offscreen render target regression (#2876)

After installing the repository dependencies and Chromium:

```sh
node test/render-target/run.mjs
```

Set `CHROMIUM_EXECUTABLE_PATH` to use an existing Chromium installation. The runner
starts and closes its own Vite servers and browser. It uses the production WebGL
and WebGPU aliases separately, requires the native WebGPU backend (no WebGL
fallback), and runs an active R3F frame loop rather than Storybook's frozen loop.

The 42 cases cover the core depth hook on both renderers, the directly imported
WebGPU depth hook, and both ContactShadows implementations. Each runs with a bound
outer target, the default target, `frames={1}`, `frames={0}`, and two nested
RenderTextures, plus a nonzero cube face and mip level. All cases also check clear
color and alpha preservation. The WebGPU-specific depth hook currently is not re-exported by
the public WebGPU entry; both implementations are tested explicitly.

An early `update` callback binds an outer target before capture. A `render`
callback checks that capture preserved it, then continues drawing green without
rebinding it. A WebGL EffectComposer/ShaderPass or a WebGPU RenderPipeline copies
the outer texture into a readback target: red means the continuation missed the
outer target; green means it reached it. The default-target case asserts that
the caller still has `null` bound. Render-call counts ensure capture actually
runs and stops at the requested frame limit. Nested JSX alone is not treated as
proof that a component runs while a RenderTexture target is bound.

The cube case reads back face 3 directly after the continuation. The mip case
checks the active mip level rather than pixel readback. `TEST_COMPONENT` and
`TEST_SCENARIO` can select a focused subset of cases.

The error case throws once from a mesh's `onBeforeRender` during capture and
checks state after the error reaches R3F's scheduler. The expected error must
propagate; target, scene background, override material, visibility, and clear
state must already be restored. The two ContactShadows implementations also
run with `visible={false}` to check that capture does not make them visible.

This checks capture state restoration and rendering continuation, not artistic
shadow quality or every renderer state. Other sites listed in #2876 are outside
this focused regression.
