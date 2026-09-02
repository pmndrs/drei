# Changelog (v11 Alpha)

This changelog tracks changes made during the v11 alpha development cycle.

## Unreleased

### Features

#### `MeshDiscardMaterial` now has a WebGPU implementation

`src/webgpu/Materials/DiscardMaterial` already held the TSL material — a
`MeshBasicNodeMaterial` whose `fragmentNode` calls `Discard()` — but only as a
process-wide singleton that `MeshTransmissionMaterial` and `AccumulativeShadows`
swap onto a mesh for the duration of an FBO pass. There was no JSX wrapper, and
nothing named `MeshDiscardMaterial` was exported from `/webgpu` at all;
importing the legacy one into a WebGPU app hands `WebGPURenderer` a GLSL
`ShaderMaterial`.

Added `<MeshDiscardMaterial />` for the WebGPU entry. To give each element its
own material without duplicating the TSL, `DiscardMaterial.tsx` now exports the
constructible `DiscardNodeMaterial` class and the existing `DiscardMaterial`
export is an instance of it — unchanged in type and behaviour for its current
callers.

The prop surface is `meshBasicMaterial` rather than legacy's `shaderMaterial`,
because that is what the underlying material actually is; the props that do
anything (`side`, `transparent`, `opacity`, `depthWrite`, `colorWrite`, …) are
common to both. Ref behaviour matches: a `ForwardRefComponent` handing back the
material instance.

`src/native/index.ts` is generated from the built `/webgpu` declarations and
still predates this export, so `MeshDiscardMaterial` is not yet re-exported for
React Native — `yarn generate:native` will pick it up.

**Files changed:**
`src/webgpu/Materials/MeshDiscardMaterial/MeshDiscardMaterial.tsx`,
`src/webgpu/Materials/MeshDiscardMaterial/MeshDiscardMaterial.stories.tsx`,
`src/webgpu/Materials/MeshDiscardMaterial/index.ts`,
`src/webgpu/Materials/DiscardMaterial/DiscardMaterial.tsx`,
`src/webgpu/Materials/index.ts`

Tracked in #2660.

### Fixed

#### `BakeShadows` was a silent no-op on WebGPU

`src/webgpu/Staging/BakeShadows/BakeShadows.tsx` was byte-identical to the
WebGL implementation — copied wholesale in `a49d950b` so the `/webgpu` barrel
had something to export, never ported. It set `renderer.shadowMap.autoUpdate`
and `.needsUpdate`, but `WebGPURenderer.shadowMap` is a plain config object
(`{ enabled, transmitted, type }`, `three/src/renderers/common/Renderer.js`)
with no update flags. Nothing threw and shadows kept re-rendering every frame,
which is the one thing the component exists to prevent.

WebGPU moved shadow-update control onto the light: `ShadowNode.updateBefore()`
reads `shadow.needsUpdate || shadow.autoUpdate` and clears `needsUpdate` itself
once the map has been drawn. The port now traverses the scene for
shadow-casting lights and sets `shadow.autoUpdate = false`,
`shadow.needsUpdate = true` — which buys exactly one more shadow render, no
frame counting needed. Prior flags are recorded per light and restored on
unmount rather than blindly set to `true`. The scan runs per frame so lights
that mount later (a suspended GLTF, a conditional light) are picked up; each
shadow is only touched the first time it is seen, so a frozen light is never
re-armed. Dropped the deprecated `state.gl` access — the renderer is not needed
at all now.

Added `BakeShadows.stories.tsx`: a box orbiting over a receiving plane, pinned
to WebGPU with `limitedTo="webgpu"` and tagged `webgpuOnly`. The component
renders nothing, so a shadow that should be moving is the only way to see
whether it works.

Dropped the now-stale `BakeShadows` entry from `component-overrides.json`,
which pinned it to `todo` on the grounds that it was a copy rather than a port.
`component-status.json` / `component-status.generated.ts` need regenerating
(`yarn audit:components`) to pick up the new story and the dropped override.

**Files changed:** `src/webgpu/Staging/BakeShadows/BakeShadows.tsx`,
`src/webgpu/Staging/BakeShadows/BakeShadows.stories.tsx`,
`src/webgpu/Staging/BakeShadows/BakeShadows.test.ts`,
`component-overrides.json`

Fixes #2665.

#### WebGPU `BlurPass` is a real TSL pass

`src/webgpu/Materials/BlurPass/BlurPass.tsx` was still the WebGL implementation —
its first line said so. It imported `WebGLRenderTarget` and `WebGLRenderer` from
`#three` and pulled in the legacy GLSL `ConvolutionMaterial`, so it could not be
exported from the `/webgpu` barrel without breaking the entry point the way #2764
did. The export sat commented out.

Converted:

- `WebGLRenderTarget` → `RenderTarget` from `three/webgpu`. `three/webgpu`
  exports no `WebGLRenderer` at all, so `render()` now takes the common
  `Renderer` base that `WebGPURenderer` extends.
- The hand-rolled `Scene` + `Camera` + fullscreen-triangle `Mesh` is now a
  `QuadMesh`, three's own post-processing helper, driven with
  `quad.render(renderer)`.
- Drives the TSL `ConvolutionMaterial` next door instead of the legacy GLSL one.
  The GLSL `USE_DEPTH` define becomes the material's `useDepth` uniform, and the
  `uniforms.*.value` writes become the material's typed accessors.
- Added `setSize()` and `dispose()`.

While wiring it up: the TSL `ConvolutionMaterial` declared a
`depthToBlurRatioBias` uniform and then hard-coded `0.25` in its place, so the
prop `BlurPass` forwards was inert. The uniform is now actually read. Its default
is `0.25`, so nothing changes for existing callers.

The WebGPU `MeshReflectorMaterial` does not consume `BlurPass` — it blurs through
TSL's `reflector()` node — so nothing downstream changed shape. The only consumer
of any `BlurPass` is the legacy `MeshReflectorMaterial`, which uses the legacy one
and was not touched.

Barrel export in `src/webgpu/Materials/index.ts` is uncommented. `yarn build` and
`yarn test:bundles` pass; the `/webgpu` entry now exports `BlurPass` and contains
no `WebGLRenderer` reference.

Added `BlurPass.stories.tsx` (`webgpuOnly`, `limitedTo="webgpu"`): an offscreen
scene of primitives rendered to a target, shown beside the same target after the
blur.

Dropped the `BlurPass` entry from `component-overrides.json`. It pinned the
component to `todo` with a reason describing the pre-conversion state, which
would have outlived the conversion; the derived status now stands on its own.
`component-status.json` is regenerated centrally and is not touched here.

**Files changed:** `src/webgpu/Materials/BlurPass/BlurPass.tsx`,
`src/webgpu/Materials/BlurPass/BlurPass.stories.tsx`,
`src/webgpu/Materials/ConvolutionMaterial/ConvolutionMaterial.tsx`,
`src/webgpu/Materials/index.ts`, `component-overrides.json`

Closes #2811.

### Internal

#### "Agnostic" was an assumption about a directory, and four components broke it

110 of 143 components are classified `agnostic` — they live in `core/`,
`external/` or `experimental/`, so they are assumed to work on both renderers.
Nothing had ever checked that. Four of them are WebGL-only, and all four ship
from the **root** entry, the one that claims to work everywhere.

`core/Helpers/PointMaterial` patches `PointsMaterial`'s fragment GLSL through
`onBeforeCompile`, which `NodeMaterial` never calls — so on WebGPU points render
as hard squares instead of antialiased circles, with no error. It also reads
`renderer.capabilities`, which the WebGPU `Renderer` does not have at all; that
would throw, except the callback never fires.

`Outlines` is broken on WebGPU through **both** entries: the root entry exports
`experimental/Effects/Outlines`, a GLSL `ShaderMaterial`, while `/webgpu`
exports the TSL version that throws on every construction (#2813).

`external/Geometry/Splat` types `THREE.WebGLRenderer` into its public surface and
is raw GLSL. `core/Loaders/Preload` calls `gl.compile()`, a getter aliasing
`compileAsync` on WebGPU (#2809).

`--check` now fails on `agnosticButNot`: a component classified `agnostic` whose
`core`/`external`/`experimental` source contains GLSL, `onBeforeCompile`,
`ShaderMaterial`, or a renderer member `three/webgpu` lacks. GLSL detection was
widened to catch a raw shader body in a template literal, which is how the
`experimental/Outlines` case had stayed invisible.

The check finds three of the four. `Preload` is the limit of it — `compile`
exists on both renderers and only the semantics differ, which grep cannot see.
The other 106 agnostic components have not been read one by one for that class.

**Files changed:** `scripts/audit-components.js`, `component-overrides.json`,
`component-status.json`, `component-status.generated.ts`

Tracked in #2818.

#### The dashboard could not see five components, and counted two twice

`examples/src/demos/componentRegistry.tsx` listed `MeshPortalMaterial` and
`MeshTransmissionMaterial` twice each — the second copy of each had no demo, and
the two `MeshTransmissionMaterial` entries shared a `path`, so one was an
unreachable route. It also omitted `HtmlMaterial`, `ShadowAlpha`, `Shapes`,
`useDepthBuffer` and `useVariants`, all exported public API. The dashboard
therefore rendered 140 rows and printed every statistic over 140 while the
library has 143.

Nothing caught it. The `unknown` banner warns about registry entries the audit
does not recognise — a set that is empty — and never about audited components
the registry has dropped, which is the direction that actually drifts, because
the audit is generated and the registry is written by hand.
`audit-components.js --check` now fails on a missing entry, a duplicate entry,
and an entry with no audit record.

Two WebGPU stat cards were replaced. **"WebGPU implemented 27/27"** counted over
components whose `rendererSupport` is `dual` — and a component is only `dual`
_because_ it has a WebGPU implementation, so that card could only ever read
100%. It also silently dropped `Outlines` and `HtmlMaterial`, which have WebGPU
implementations but no legacy twin. It now counts every component with a
`src/webgpu/` file: **29**.

**"WebGPU with a story 3/27"** used `webgpuStory`, meaning a story co-located in
`src/webgpu/`. But **17** components are genuinely rendered under WebGPU, most
through a legacy story's `PlatformSwitch` branch, and `webgpuExercised` already
held that number. This is the second time the two were conflated, in opposite
directions: the card started on the aggregate `story` flag and reported 20, was
corrected to the co-located count and reported 3. Both are now shown, and the
per-row badge distinguishes them — green for a component's own story, amber for
one rendered through another tree's.

**Files changed:** `scripts/audit-components.js`,
`examples/src/demos/componentRegistry.tsx`,
`examples/src/catalog/ComponentCatalog.tsx`, `component-status.json`,
`component-status.generated.ts`

#### The audit can now tell a copy from a port

A file under `src/webgpu/` identical to its legacy twin once comments are
stripped is a copy, not a port. That is worse than a missing component: it reads
as implemented, ships from the `/webgpu` entry, and silently does nothing when
the API it calls does not exist on `WebGPURenderer`. `BakeShadows` sat that way
since #2599, calling `renderer.shadowMap.autoUpdate` — which
`WebGPURenderer.shadowMap` does not have.

`--check` now fails when such a component is classified anything other than
`todo` or `wont-port`, so it has to be ported or acknowledged in
`component-overrides.json`. The new `webgpuIsCopy` field appears in the summary
and on the dashboard. Two components match today, `BakeShadows` and `BlurPass`,
both already classified `todo`.

**Files changed:** `scripts/audit-components.js`, `component-status.json`,
`component-status.generated.ts`, `examples/src/catalog/ComponentCatalog.tsx`

Tracked in #2665, #2811.

#### Three files claimed a conversion state they did not have

`src/webgpu/Staging/BakeShadows/BakeShadows.tsx` and
`src/webgpu/Textures/GradientTexture/GradientTexture.tsx` both opened with
`//* TODO: Convert GLSL shaders to TSL for WebGPU`, copy-pasted from a template.
Neither file contains a shader of any kind — `BakeShadows` is thirteen lines
toggling `shadowMap.autoUpdate`, `GradientTexture` paints a 2D canvas. The
banner made two finished components read as unported in every triage pass.
Removed from both; `BlurPass` kept it, where it was accurate at the time — it
has since been converted, see _WebGPU `BlurPass` is a real TSL pass_ above.

Deleted `src/webgpu/Staging/SoftShadows/SoftShadows.stub.tsx`. It threw
"It uses ShaderChunk to inject PCSS shaders which is WebGL-only", but nothing
imported it and the claim was no longer true: `index.ts` exports
`SoftShadows.tsx`, which drives `PCSSShadowNode.ts` — 162 lines of TSL. Its own
comment said the stub would be replaced when the component was converted; the
conversion happened and the stub stayed, reading as a won't-port marker for a
component that had been ported.

**Files changed:** `src/webgpu/Staging/BakeShadows/BakeShadows.tsx`,
`src/webgpu/Textures/GradientTexture/GradientTexture.tsx`,
`src/webgpu/Staging/SoftShadows/SoftShadows.stub.tsx`

Tracked in #2664, #2665.

#### The component audit was under-reporting, and `done` was misleading

`scripts/audit-components.js` discovered components only by the
Component-as-a-Folder convention (`<Name>/<Name>.tsx`), so four root-exported
public components were invisible to it: `PivotControls` (implementation lives in
`index.tsx`) and `GizmoHelper` / `GizmoViewport` / `GizmoViewcube` (three
components sharing a lowercase `gizmo/` folder). The real count is **143**, not 139. Discovery now understands all three layouts; new components should still use
the convention.

Renamed the `done` classification to `implemented`. It is derived purely from
"a file exists under `src/webgpu/`" and never meant the component works — while
it was called `done`, seven `done` components had open bug reports and none of
them had a story.

Removed `## Progress: ~90%` from the migration guide. It said `~90%` for six
months while the number of WebGPU components with a story was two. Progress now
points at the generated status and the GitHub milestones. Also corrected the
claim that "every component now has stories and regression tests".

Deleted `MeshTransmissionMaterial copy.tsx` — 226 lines, unreferenced, and
divergent from the real 975-line implementation.

**Files changed:** `scripts/audit-components.js`, `component-status.json`,
`CLAUDE.md`, `devDocs/MIGRATION_V10_TO_V11.md`,
`src/webgpu/Materials/MeshTransmissionMaterial/MeshTransmissionMaterial copy.tsx`

Tracked in #2806.

#### The component dashboards can no longer drift

Four hand-maintained files claimed to describe conversion state and disagreed
with each other and with the filesystem. The examples dashboard had `tests`
wrong on **55 of 140** entries and `webgpuStatus` wrong on **19 of 33** — it
reported `AccumulativeShadows`, `BakeShadows`, `BlurPass`, `Caustics` and 15
others as having no WebGPU implementation while the files were on disk.

`scripts/audit-components.js` now also emits `component-status.generated.ts`,
and the dashboard reads it. The registry keeps only what a human has to write —
identity, prose, and which demo to render. **799 lines of hand-typed status were
deleted from it**, and `yarn test:components` fails if the generated file goes
stale.

Deleted outright as dead code: `.storybook/componentRegistry.tsx` (2,031 lines),
`.storybook/catalog/ComponentCatalog.tsx` (427) and
`.storybook/components/ExampleCard.tsx` (116). Nothing imported them, they were
not in the TypeScript program, and they imported `../demos/componentRegistry` —
a path that does not exist.

Columns that cannot be derived (`structure`, `imports`, `types`) were removed
rather than guessed. Added a `WebGPU story` column, because the aggregate
`story` flag is true for a story in _any_ tree and so reported 20 of 29 WebGPU
components as covered when the real number is **2**. An entry the audit does not
recognise now renders a visible warning instead of a confident zero.

**Files changed:** `scripts/audit-components.js`, `component-status.generated.ts`,
`component-status.json`, `examples/src/demos/componentRegistry.tsx`,
`examples/src/catalog/ComponentCatalog.tsx`,
`examples/src/components/ExampleCard.tsx`, `.prettierignore`,
`.storybook/componentRegistry.tsx`, `.storybook/catalog/ComponentCatalog.tsx`,
`.storybook/components/ExampleCard.tsx`

Tracked in #2806.

#### All 64 co-located test files assert nothing

`src/**/*.test.ts` looked like coverage. Every one of the 64 files is:

```ts
describe('Backdrop', () => {
  it('TODO: Add tests after Phase 2', () => {
    // Placeholder test - will implement after migration complete
  })
})
```

Zero `expect`, zero `assert`, zero `render` — in all 64. Wiring them into CI
as-is would have added 64 always-green tests, which is worse than not running
them.

The audit now distinguishes a test _file_ from a test that _asserts_:

```
  test files  55 / 143
  REAL tests   0 / 143   (the rest assert nothing)
```

The dashboard shows 🟡 for "file exists but asserts nothing" rather than the 🟢
it was showing for 55 components. This is the same "a file exists" mistake that
made `done` and the aggregate `story` flag misleading — third instance.

**Files changed:** `scripts/audit-components.js`, `component-status.generated.ts`,
`component-status.json`, `examples/src/catalog/ComponentCatalog.tsx`,
`examples/src/components/ExampleCard.tsx`,
`examples/src/demos/componentRegistry.tsx`

Tracked in #2802.

#### `.storybook` was declared in tsconfig but never typechecked

`include: ["./src", "./.storybook"]` looked right. TypeScript's wildcard
expansion skips entries beginning with a dot, so only the 6 `.storybook` files
reachable as imports from `src/` were in the program — 13 files on disk, 6
checked. That is how three files importing a non-existent path survived (removed
in #2806).

Globs are now explicit, and three real problems surfaced immediately:

- **`preview.tsx` declared `globalTypes` and `initialGlobals` twice.** A `backend`
  toolbar (webgl/webgpu, default webgl) arrived from master's #2593 during the
  master → v11-working merge, alongside v11's own `renderer` toolbar. Duplicate
  keys mean the last wins, so **`backend` never existed at runtime**. Nothing
  reads `globals.backend`; `context.globals.renderer` is used throughout the
  stories. The dead half is removed.
- `main.mts` imports `./favicon.ts` with an extension — allowed now via
  `allowImportingTsExtensions`, which is valid because `emitDeclarationOnly` is on.
- `theme.ts` tripped TS4082; annotated with `ThemeVars` explicitly.

Verified: `yarn test` passes, `yarn build-storybook` succeeds, and all **203
stories across 123 files** still render.

**Files changed:** `tsconfig.json`, `.storybook/preview.tsx`, `.storybook/theme.ts`

Tracked in #2807.

## 11.0.0-alpha.6

Published 2026-08-31.

### Dependencies & Stability

This is a stability-only pass: dependency updates and the fixes needed to build
against them. No component work.

#### Updated to three 0.185.1 and @react-three/fiber 10.0.0-alpha.4

R3F v10 raised its `three` peer floor to `>=0.185.0`, so drei's `>=0.182` made it
impossible to install alongside r3f alpha.4.

- `three` / `@types/three` -> `^0.185.1` / `^0.185.0`; peer `three: ">=0.185"`
- `@react-three/fiber` -> `10.0.0-alpha.4`
- `react` / `react-dom` peers -> `>=19.0 <19.3`, matching r3f v10's tested range
- `three-mesh-bvh` `^0.9.14`, `stats-gl` `^4.2.3`, `troika-three-text` `^0.52.5`

**Files changed:** `package.json`, `yarn.lock`

#### Fixed: `/webgpu` entry could not be built (#2764)

`@react-three/drei/webgpu` imported `WebGLCubeRenderTarget` from `three/webgpu`,
which does not export it — so the entry failed at build time and took dependent
projects down with it. three r183+ renamed the WebGPU cube target to
`CubeRenderTarget`. Three `core/` components also reached past the platform alias
and had to be routed through `#drei-platform`.

**Files changed:** `src/utils/drei-platform-webgpu.ts`,
`src/core/Staging/Environment/Environment.tsx`,
`src/core/Portal/RenderCubeTexture/RenderCubeTexture.tsx`,
`src/core/Loaders/Preload/Preload.tsx`

#### Removed: `Text` from the `/webgpu` entry

It depended on a vendored troika fork declared as a `file:` tarball, which could
never be published to npm. Upstream troika still ships no WebGPU build. The fork
has been removed entirely; text returns via
[@pmndrs/glyph](https://github.com/pmndrs/glyph), which covers both renderers.

This matches `11.0.0-alpha.5`, which also exported no `Text` from `/webgpu`, so
it is not a regression. **WebGL `Text` is unaffected** and is still exported from
`@react-three/drei/legacy`.

**Files changed:** `src/webgpu/UI/index.ts`, `src/webgpu/UI/Text/` (removed),
`lib/troika/` (removed), `package.json`, and five stories that referenced it

#### Type fixes for three 0.185 / r3f v10

The bump surfaced 198 type errors; all are resolved.

- `UniformNode` became generic over `<TNodeType, TValue>` (98 of them)
- `attribute()` and `varying()` need explicit node-type arguments, or their type
  parameter widens to `string` / `unknown` and every swizzle stops resolving
- `Loop()` no longer accepts a bare node — use a number or `{ start, end }`
- Added a renderer-agnostic `getMaxAnisotropy()` to `utils/generic`: WebGPU
  exposes it on the renderer, WebGL on `.capabilities`
- Fixed `HelperArgs<[]>` resolving to `never`, which made any zero-argument
  helper constructor reject every argument list. Pre-existing drei bug, surfaced
  by three-mesh-bvh 0.9.14

**Behavioural changes from upstream, worth knowing:** `ShapePath.toShapes()` lost
its `isCCW` parameter, and `FirstPersonControls.activeLook` no longer exists in
three at all.

**Files changed:** 28 files across `src/core`, `src/legacy`, `src/webgpu`,
`src/external`, `src/utils`

#### Fixed: the example app was uninstallable

`yarn examples:webgpu` failed with `Couldn't find the node_modules state file`.
`examples/package.json` still pointed `@react-three/fiber` at
`file:../lib/react-three-fiber-10.0.0-alpha.0.tgz`, a tarball deleted in #2606
("unbundle r3f now its on npm") — so `yarn --cwd examples install` could not
resolve and the app has been unusable since January.

- `@react-three/fiber` -> `10.0.0-alpha.4` from npm, matching the root package
- `three` -> `^0.185.1`, `@types/three` -> `^0.185.0`, likewise

Also fixed a dev-only `ReferenceError: __MEDIAPIPE_TASKS_VISION_VERSION__ is
not defined` thrown by `FaceLandmarker` at module scope. Vite's `define` only
reaches files under the Vite root, and drei's `src/` sits outside the examples
root, so the constant survived into the browser. The production build was
always correct. Now injected as a runtime global for dev.

**Note:** `examples/` is a separate project. It needs its own
`yarn --cwd examples install`.

**Files changed:** `examples/package.json`, `examples/yarn.lock`,
`examples/vite.config.ts`

### Known Issues

- **`Stars` does not render under WebGPU.** Confirmed during alpha.6 verification.
  Not addressed in this release; tracked for the next alpha.
- **`Text` is unavailable on the `/webgpu` entry** until the
  [@pmndrs/glyph](https://github.com/pmndrs/glyph) migration. `DetectGPU`'s story
  renders nothing under WebGPU as a result, since its only output was a text label.
- **Raw Node ESM cannot import the built entries** — `detect-gpu` is CommonJS and
  its named exports are unreadable without a bundler. Vite, webpack, Next and
  vitest all handle it. Pre-existing; alpha.5 behaves identically.

### Features

#### `useGLTF` - New Options API & KTX2 Support

Added built-in KTX2 texture support and a new options object API:

```tsx
// New options API (recommended)
useGLTF('/model.glb', { ktx2: true })
useGLTF('/model.glb', { draco: true, meshopt: true, ktx2: true })
useGLTF('/model.glb', { draco: '/custom-draco/', ktx2: '/custom-basis/' })

// Preload with KTX2 - works even before Canvas mounts
useGLTF.preload('/model.glb', { ktx2: true })

// Set transcoder path globally
useGLTF.setKTX2TranscoderPath('/custom/basis/')
```

The legacy positional API is deprecated but still works (emits console warning):

```tsx
// Legacy (deprecated)
useGLTF('/model.glb', true, true)
```

**Files changed:**

- `src/core/Loaders/useGLTF/useGLTF.tsx`

#### `useVariants` - KHR Material Variants Hook

Added a hook to interact with glTF models that use the [KHR_materials_variants](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_variants) extension. Allows switching between material variants at runtime.

```tsx
const gltf = useGLTF('model.glb')
const { activeVariant, setVariant, variants, materials } = useVariants(gltf)

// Switch variant
setVariant('midnight')

// Or pass variant directly
useVariants(gltf, 'midnight')
```

**Files added:**

- `src/core/Loaders/useVariants/useVariants.tsx`

#### `PivotControls` - `onDrag` / `onDragEnd` Now Use Named Props

`onDrag` and `onDragEnd` callbacks now receive a single object with named properties instead of positional arguments, consistent with `onDragStart` and `onHover`:

```tsx
<PivotControls
  onDrag={({ local, deltaLocal, world, deltaWorld }) => {}}
  onDragEnd={({ local }) => saveTransform(local)}
/>
```

Previously `onDrag` passed four positional `Matrix4` args `(l, deltaL, w, deltaW)` and `onDragEnd` received no arguments.

New `OnDragProps` type is exported from `@react-three/drei`.

**Files changed:**

- `src/core/Gizmos/PivotControls/context.ts`
- `src/core/Gizmos/PivotControls/index.tsx`
- `src/core/Gizmos/PivotControls/PivotControls.docs.mdx`

### Deprecations

#### `Stats` - Deprecated in Favor of `StatsGl`

`<Stats />` (based on `stats.js`) is now deprecated. Use `<StatsGl />` instead. A console warning is emitted on mount.

**Files changed:**

- `src/core/Performance/Stats/Stats.tsx`

### Bug Fixes

#### `MeshRefractionMaterial` (Legacy) - Restored React Component Wrapper

The legacy `MeshRefractionMaterial` was missing its React component wrapper after the v11 restructure, exporting only the raw shader material. Restored the full component that handles:

- BVH setup from parent mesh geometry for accurate ray-mesh intersection
- Shader defines computation (CUBEUV, CHROMATIC_ABERRATIONS, FAST_CHROMA, ENVMAP_TYPE_CUBEM)
- Per-frame camera matrix updates (viewMatrixInverse, projectionMatrixInverse)
- Viewport resolution tracking
- Fixed geometry index check: non-indexed geometry is no longer unnecessarily converted with `toNonIndexed()`

```tsx
// Now works as a proper React component again
<mesh>
  <dodecahedronGeometry />
  <MeshRefractionMaterial envMap={envMap} bounces={3} ior={2.4} />
</mesh>
```

**Files changed:**

- `src/legacy/Materials/MeshRefractionMaterial/MeshRefractionMaterial.tsx`

#### `MeshRefractionMaterial` (WebGPU) - TSL Cleanup

Cleaned up the WebGPU TSL implementation:

- Replaced custom `equirectUv` function with TSL built-in `equirectUV`
- Removed unused `_resolution` and `_thickness` uniforms (dead shader code)
- Fixed `Fn` parameter patterns to use TSL-idiomatic array destructuring
- Resolved pre-existing TypeScript error with `args={[fastChroma]}`

**Files changed:**

- `src/webgpu/Materials/MeshRefractionMaterial/MeshRefractionMaterial.tsx`

#### `MeshRefractionMaterial` Story - Added Dual Renderer Support

Updated the Storybook story to use `PlatformSwitch` for WebGL/WebGPU dual testing, with platform-specific imports for all dependent components (Caustics, AccumulativeShadows, MeshTransmissionMaterial).

**Files changed:**

- `src/legacy/Materials/MeshRefractionMaterial/MeshRefractionMaterial.stories.tsx`

#### `View` - Fixed Offscreen Detection for Non-Fullscreen Canvases

The `isOffscreen` check in `computeContainerPosition` compared tracked element coordinates against raw canvas `width`/`height`, assuming the canvas was at position `(0, 0)` in the viewport. When the canvas was offset (e.g., below a header), views would disappear prematurely during scrolling. Now uses the canvas's actual bounding edges (`canvasSize.top`, `canvasSize.left`) for correct offscreen detection.

**Files changed:**

- `src/core/Portal/View/View.tsx`

#### `Html` - Fixed Occlusion Mesh Sizing for Orthographic Cameras in Transform Mode

Previously, the occlusion mesh in transform mode grouped orthographic cameras with custom geometry, falling back to `props.scale` instead of measuring the element's `clientWidth`/`clientHeight`. When no `scale` prop was provided, the mesh size was never set. Now orthographic cameras use the same `clientWidth`/`clientHeight`-based sizing as perspective cameras, since `getObjectCSSMatrix` applies the same `distanceFactor` ratio for both camera types.

**Files changed:**

- `src/core/UI/Html/Html.tsx`

#### `useKTX2.preload()` - Fixed `detectSupport` Not Being Called

Previously, `useKTX2.preload()` never called `KTX2Loader.detectSupport(renderer)`, which meant preloaded KTX2 textures might not decode correctly. This is now fixed by deferring the preload until a renderer becomes available.

**Files changed:**

- `src/core/Loaders/useKTX2/useKTX2.tsx`

### CI

#### Package Size Reports on Pull Requests

Added a new GitHub Actions workflow ([`pkg-size/action`](https://github.com/pkg-size/action)) that automatically comments on PRs with a package size report. Shows uncompressed and gzip sizes, sorted by size delta, with unchanged files collapsed. This is purely advisory and never blocks merges.

**Files added:**

- `.github/workflows/pkg-size.yml`

### Internal

#### `KTX2LoaderService` - New Internal Singleton

Added an internal service that manages the KTX2Loader lifecycle with deferred initialization. This handles the challenge that `KTX2Loader.detectSupport(renderer)` must be called before loading, but `useLoader.preload()` runs outside React context where no renderer is available.

Key behaviors:

- Lazy initialization of KTX2Loader singleton
- Queues preload callbacks when renderer isn't available yet
- Auto-flushes queue when first hook registers the renderer
- HMR-safe via globalThis pattern

**Files added:**

- `src/utils/KTX2LoaderService.ts`
