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

### Bug Fixes

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
