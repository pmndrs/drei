# Changelog (v11 Alpha)

This changelog tracks changes made during the v11 alpha development cycle.

## Unreleased

### Internal

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
