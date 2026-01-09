# Migration Guide: Drei v10 → v11

This guide covers the breaking changes and new features in Drei v11.

## Overview

Drei v11 introduces a major architectural change to support both WebGL and WebGPU renderers through separate entry points while maintaining a renderer-agnostic core.

### Key Changes

1. **New Entry Point Structure** - Multiple import paths for different component tiers
2. **Component-as-a-Folder (CaaF)** - New modular organization
3. **Platform-Specific Components** - Separate implementations for WebGL and WebGPU
4. **Build System** - Migrated from Rollup to obuild (Rolldown)
5. **Import Alias** - Internal use of `#three` alias for renderer flexibility

## Entry Points

### Before (v10)

```typescript
// Single entry point for everything
import { OrbitControls, Environment, Bvh, MeshDistortMaterial } from '@react-three/drei'
```

### After (v11)

```typescript
// Root - Renderer-agnostic components only (recommended for most users)
import { OrbitControls, Environment, Bvh } from '@react-three/drei'

// Explicit entry points
import { OrbitControls } from '@react-three/drei/core' // Core only
import { Bvh } from '@react-three/drei/external' // External wrappers
import { MarchingCubes } from '@react-three/drei/experimental' // Experimental

// Platform-specific
import { MeshDistortMaterial } from '@react-three/drei/legacy' // WebGL only
import { MeshDistortMaterial } from '@react-three/drei/webgpu' // WebGPU only
```

## Component Classification

### Renderer-Agnostic (Root Export)

These components work with both WebGL and WebGPU renderers:

**Core:**

- All cameras: `OrthographicCamera`, `PerspectiveCamera`
- All controls: `OrbitControls`, `MapControls`, `TrackballControls`, etc.
- Staging: `Environment`, `Float`, `Sky`, `Stars`, `Stage`, `Grid`, etc.
- Geometry: `Line`, `Capsule`, `RoundedBox`, `Text3D`, `Points`, etc.
- Helpers: `Html`, `Text`, `PositionalAudio`, `Gizmos`, etc.
- All loaders and hooks

**External:**

- `Bvh` (three-mesh-bvh)
- `CameraControls` (camera-controls)
- `Facemesh`, `Splat`, `FaceLandmarker`

**Experimental:**

- `MarchingCubes`
- `useTrail`

### Platform-Specific (Explicit Imports)

These components have separate implementations for each renderer:

**Render Targets:**

- `Fbo` / `useFBO`
- `useDepthBuffer`
- `RenderTexture`
- `RenderCubeTexture`
- `CubeCamera`
- `Effects`

**Materials (GLSL vs TSL):**

- `MeshDistortMaterial`
- `MeshReflectorMaterial`
- `MeshTransmissionMaterial`
- `MeshRefractionMaterial`
- `MeshWobbleMaterial`
- `MeshPortalMaterial`
- `Outlines`
- `Caustics`
- `ContactShadows`
- `AccumulativeShadows`
- And more...

## Migration Steps

### Step 1: Update Dependencies

```bash
npm install @react-three/drei@11
# or
yarn add @react-three/drei@11
```

### Step 2: Update Imports

#### If you're using WebGL (default):

```typescript
// Most components can stay as-is
import { OrbitControls, Environment } from '@react-three/drei'

// Materials need explicit /legacy import
import { MeshDistortMaterial } from '@react-three/drei/legacy'
import { Fbo } from '@react-three/drei/legacy'
```

#### If you're using WebGPU:

```typescript
// Renderer-agnostic components work the same
import { OrbitControls, Environment } from '@react-three/drei'

// Use /webgpu for platform-specific components
import { MeshDistortMaterial } from '@react-three/drei/webgpu'
import { Fbo } from '@react-three/drei/webgpu'
```

### Step 3: Bundle Optimization (Optional)

For smaller bundles, use explicit entry points:

```typescript
// Instead of root import
import { OrbitControls, Environment, Bvh, MarchingCubes } from '@react-three/drei'

// Use specific entry points
import { OrbitControls, Environment } from '@react-three/drei/core'
import { Bvh } from '@react-three/drei/external'
import { MarchingCubes } from '@react-three/drei/experimental'
```

## Breaking Changes

### 1. Material Imports

**Before:**

```typescript
import { MeshDistortMaterial, MeshReflectorMaterial } from '@react-three/drei'
```

**After:**

```typescript
// WebGL
import { MeshDistortMaterial, MeshReflectorMaterial } from '@react-three/drei/legacy'

// WebGPU
import { MeshDistortMaterial, MeshReflectorMaterial } from '@react-three/drei/webgpu'
```

### 2. Render Target Components

**Before:**

```typescript
import { Fbo, RenderTexture } from '@react-three/drei'
```

**After:**

```typescript
// WebGL
import { Fbo, RenderTexture } from '@react-three/drei/legacy'

// WebGPU
import { Fbo, RenderTexture } from '@react-three/drei/webgpu'
```

### 3. Directory Structure (For Contributors)

Components are now organized in Component-as-a-Folder structure:

**Before:**

```
src/core/OrbitControls.tsx
src/core/Environment.tsx
```

**After:**

```
src/core/Controls/OrbitControls/
  ├── index.ts
  ├── OrbitControls.tsx
  └── OrbitControls.test.ts

src/core/Staging/Environment/
  ├── index.ts
  ├── Environment.tsx
  └── Environment.test.ts
```

## API Compatibility

### No Changes Required

These components have **no API changes** - they work identically:

- All cameras
- All controls
- Most helpers
- All loaders
- Staging components
- Geometry components

### Platform-Specific Behavior

These components have **identical APIs** but different internal implementations:

- Materials (GLSL vs TSL under the hood)
- Render targets (WebGLRenderTarget vs RenderTarget)
- Post-processing effects

## Performance Considerations

### Bundle Size

- **Root import**: Includes core + external + experimental (~same as v10)
- **/core**: Smallest bundle, production-ready components only
- **/external**: External library wrappers (e.g., Bvh)
- **/experimental**: Rough/experimental features
- **/legacy**: WebGL-specific implementations
- **/webgpu**: WebGPU-specific implementations

### Tree-Shaking

All entry points support tree-shaking. Importing from root won't pull in legacy or webgpu code.

## WebGPU-Specific Notes

### TSL Materials

WebGPU materials use Three Shading Language (TSL) instead of GLSL:

- Better performance in many cases
- Type-safe shader construction
- Improved debugging
- Different syntax but same visual results

### Render Targets

WebGPU uses a different render target API:

- `RenderTarget` instead of `WebGLRenderTarget`
- Different configuration options
- Same functionality, different implementation

## Troubleshooting

### "Cannot find module '@react-three/drei/legacy'"

Make sure you're using Drei v11 and your bundler supports package.json `exports` field.

### Materials look different between WebGL and WebGPU

This is a known issue being worked on. Report discrepancies on GitHub.

### Type errors after upgrade

Clear your node_modules and reinstall:

```bash
rm -rf node_modules
npm install
# or
yarn install
```

## Examples

### WebGL Project (Legacy)

```typescript
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, MeshDistortMaterial } from '@react-three/drei/legacy'

function Scene() {
  return (
    <>
      <OrbitControls />
      <Environment preset="sunset" />
      <mesh>
        <sphereGeometry />
        <MeshDistortMaterial distort={0.5} speed={2} />
      </mesh>
    </>
  )
}
```

### WebGPU Project

```typescript
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { MeshDistortMaterial } from '@react-three/drei/webgpu'

function Scene() {
  return (
    <>
      <OrbitControls />
      <Environment preset="sunset" />
      <mesh>
        <sphereGeometry />
        <MeshDistortMaterial distort={0.5} speed={2} />
      </mesh>
    </>
  )
}
```

### Mixed (Recommended)

```typescript
import { Canvas } from '@react-three/fiber'
// Renderer-agnostic components from root
import { OrbitControls, Environment } from '@react-three/drei'
// Platform-specific from /legacy or /webgpu
import { MeshDistortMaterial } from '@react-three/drei/legacy' // or /webgpu

function Scene() {
  return (
    <>
      <OrbitControls />
      <Environment preset="sunset" />
      <mesh>
        <sphereGeometry />
        <MeshDistortMaterial distort={0.5} speed={2} />
      </mesh>
    </>
  )
}
```

## Getting Help

- 📖 [Documentation](https://drei.docs.pmnd.rs)
- 💬 [Discord](https://discord.gg/poimandres)
- 🐛 [GitHub Issues](https://github.com/pmndrs/drei/issues)

## Feedback

We'd love to hear your feedback on the v11 architecture! Please open an issue or discussion on GitHub.
