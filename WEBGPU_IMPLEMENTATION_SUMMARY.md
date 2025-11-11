# WebGPU Implementation Summary

## What Was Done

### 1. Created Custom Rollup Plugin

**File**: `rollup-plugin-webgpu-overrides.js`

- Intercepts module resolution during build
- Checks for WebGPU overrides in `src/webgpu/` directory
- Falls back to default `src/` files when no override exists
- Supports verbose logging for debugging

### 2. Updated Build Configuration

**File**: `rollup.config.js`

- Refactored to use a `createConfig()` helper function
- Added `@rollup/plugin-alias` import for Three.js aliasing
- Created 8 build configurations (4 WebGL + 4 WebGPU):
  - ESM multi-file
  - ESM single-entry with preserved modules
  - CJS multi-file (minified)
  - CJS single-entry (minified)
- WebGPU builds output to `dist/webgpu/`
- Excludes `src/webgpu/**` from build inputs

### 3. Created Documentation

**Files Created**:

- `docs/WEBGPU_BUILD.md` - Complete technical documentation
- `src/webgpu/README.md` - Guide for creating overrides
- `WEBGPU_SETUP.md` - Setup and installation instructions
- `WEBGPU_IMPLEMENTATION_SUMMARY.md` - This file

### 4. Created Directory Structure

- Created `src/webgpu/core/` directory for override files
- Ready to receive WebGPU-specific implementations

## How It Works

### For Components That Work with Both Renderers

Example: `PerspectiveCamera.tsx`

```typescript
// Source: src/core/PerspectiveCamera.tsx
import * as THREE from 'three'
```

**WebGL Build**: Import stays as `'three'`
**WebGPU Build**: Import becomes `'three/webgpu'` (via alias plugin)

### For Components Needing Custom Implementations

Example: `Fbo.tsx`

```
src/core/Fbo.tsx           (WebGL: uses WebGLRenderTarget)
src/webgpu/core/Fbo.tsx    (WebGPU: uses different render target API)
```

**WebGL Build**: Uses `src/core/Fbo.tsx`
**WebGPU Build**: Automatically uses `src/webgpu/core/Fbo.tsx` (via override plugin)

### For Cross-File Imports

Example: PerspectiveCamera imports Fbo

```typescript
// src/core/PerspectiveCamera.tsx
import { useFBO } from './Fbo'
```

**WebGL Build**: Resolves to `src/core/Fbo.tsx`
**WebGPU Build**: Override plugin redirects to `src/webgpu/core/Fbo.tsx`

## Plugin Order (Important!)

```javascript
plugins: [
  webgpuOverrideResolver(),  // 1. Check for src/webgpu/ overrides
  alias({ ... }),             // 2. Alias 'three' → 'three/webgpu'
  resolve({ ... }),           // 3. Normal module resolution
  babel({ ... }),             // 4. Transpile code
]
```

## Usage for End Users

```typescript
// WebGL (default, backward compatible)
import { Fbo, PerspectiveCamera, OrbitControls } from '@react-three/drei'

// WebGPU (opt-in, smaller bundle)
import { Fbo, PerspectiveCamera, OrbitControls } from '@react-three/drei/webgpu'
```

## Next Steps (Action Items)

### Immediate (Required)

- [ ] Install dependency: `yarn add -D @rollup/plugin-alias`
- [ ] Test build: `yarn build`
- [ ] Verify both `dist/` and `dist/webgpu/` directories are created

### Configuration (Required)

- [ ] Add `exports` field to package.json (see WEBGPU_SETUP.md)
- [ ] Update `copy` script to preserve exports in dist/package.json

### Implementation (As Needed)

- [ ] Create WebGPU override for `Fbo.tsx` (uses WebGLRenderTarget)
- [ ] Create WebGPU override for `Effects.tsx` (uses WebGLRenderTarget)
- [ ] Create WebGPU override for `RenderTexture.tsx` (render targets)
- [ ] Create WebGPU override for `RenderCubeTexture.tsx` (cube render targets)
- [ ] Create WebGPU override for `CubeCamera.tsx` (cube rendering)
- [ ] Create WebGPU override for `useDepthBuffer.ts` (depth buffer handling)

### Testing

- [ ] Test WebGL build in a project
- [ ] Test WebGPU build in a project with WebGPU renderer
- [ ] Verify bundle size difference (WebGPU should be several MB smaller)
- [ ] Ensure type definitions work for both builds

## Key Benefits

1. **Zero Source Code Duplication**: Single codebase for both renderers
2. **Automatic Import Handling**: Build system manages `three` vs `three/webgpu` imports
3. **Selective Overrides**: Only duplicate ~10-15% of files that truly differ
4. **Bundle Size Optimization**: Users only download renderer-specific code
5. **Type Safety**: Shared type definitions, no duplication
6. **Developer Experience**: Clean imports, no runtime configuration needed
7. **Maintainability**: Clear separation of platform-specific code

## Technical Specs

- **Build Time**: Approximately 2x (due to dual builds)
- **Output Size**: ~2x disk space (but users download only one version)
- **Type Generation**: Once (shared by both builds)
- **Override Files**: ~10-15 expected (render target related)
- **Backward Compatibility**: 100% (default export remains WebGL)

## Questions or Issues?

- See `docs/WEBGPU_BUILD.md` for detailed documentation
- Check `WEBGPU_SETUP.md` for troubleshooting
- Review plugin code in `rollup-plugin-webgpu-overrides.js`
