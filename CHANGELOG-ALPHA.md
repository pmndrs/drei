# Changelog (v11 Alpha)

This changelog tracks changes made during the v11 alpha development cycle.

## Unreleased

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
