# Offscreen render target regression (#2876)

After installing the repository dependencies and Chromium:

```sh
node test/render-target/run.mjs
```

Set `CHROMIUM_EXECUTABLE_PATH` to use an existing Chromium installation. The runner
starts and closes its own Vite servers and browser. It uses the production WebGL
and WebGPU aliases separately, requires the native WebGPU backend (no WebGL
fallback), and runs an active R3F frame loop rather than Storybook's frozen loop.

The 25 cases cover the core depth hook on both renderers, the directly imported
WebGPU depth hook, and both ContactShadows implementations. Each runs with a bound
outer target, the default target, `frames={1}`, `frames={0}`, and two nested
RenderTextures. The WebGPU-specific depth hook currently is not re-exported by
the public WebGPU entry; both implementations are tested explicitly.

An early `update` callback binds an outer target before capture. A `render`
callback checks that capture preserved it, then continues drawing green without
rebinding it. A WebGL EffectComposer/ShaderPass or a WebGPU RenderPipeline copies
the outer texture into a readback target: red means the continuation missed the
outer target; green means it reached it. The default-target case asserts that
the caller still has `null` bound. Render-call counts ensure capture actually
runs and stops at the requested frame limit. Nested JSX alone is not treated as
proof that a component runs while a RenderTexture target is bound.

This checks target restoration and rendering continuation, not artistic shadow
quality or all other renderer state. Other sites listed in #2876 are outside
this focused regression.
