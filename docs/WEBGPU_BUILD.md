# WebGPU Build System

Drei supports both WebGL and WebGPU renderers. To minimize bundle size, we provide separate builds optimized for each renderer.

## Architecture

### Dual Build System

We maintain two builds from a single source codebase:

```
dist/              # WebGL build (default)
  core/...
  index.js
  index.cjs.js

dist/webgpu/       # WebGPU build
  core/...
  index.js
  index.cjs.js
```

### Import Aliasing

The build system automatically handles Three.js imports:

- **WebGL Build**: `import * as THREE from 'three'` → stays as-is
- **WebGPU Build**: `import * as THREE from 'three'` → becomes `import * as THREE from 'three/webgpu'`

This happens automatically during build time. Source code always imports from `'three'`.

### File Override System

Some components require platform-specific implementations (e.g., render targets). We use a file override system:

```
src/
  core/
    Fbo.tsx                    # WebGL implementation (default)
    PerspectiveCamera.tsx      # Renderer-agnostic (works for both)

  webgpu/                      # Override directory
    core/
      Fbo.tsx                  # WebGPU-specific implementation
```

**How it works:**

1. Place WebGPU-specific files in `src/webgpu/` matching the `src/` directory structure
2. During WebGPU build, the custom Rollup plugin checks for overrides
3. When a file imports `'./Fbo'`, it automatically resolves to:
   - `src/webgpu/core/Fbo.tsx` if it exists (override)
   - `src/core/Fbo.tsx` if no override exists (fallback)

## Usage

### For Users

```typescript
// WebGL (default)
import { Fbo, PerspectiveCamera } from '@react-three/drei'

// WebGPU
import { Fbo, PerspectiveCamera } from '@react-three/drei/webgpu'
```

Both imports have identical TypeScript types - they're just optimized for different renderers.

### For Contributors

#### When to Create an Override

Create a WebGPU override file when a component:

- Uses `WebGLRenderTarget` → WebGPU uses different render target APIs
- Uses `WebGLCubeRenderTarget` → WebGPU cube rendering differs
- Calls WebGL-specific APIs like `gl.setRenderTarget()`
- Uses post-processing or custom shaders that differ between renderers

#### When NOT to Create an Override

Most components work with both renderers:

- Camera components (they just need the correct `three` import)
- Controls (OrbitControls, etc.)
- Helpers and utilities
- Components that only use Three.js core objects

#### Creating an Override

1. Create the WebGPU version in the mirror location:

   ```
   src/core/MyComponent.tsx
   → src/webgpu/core/MyComponent.tsx
   ```

2. Export the same types/interfaces in both versions

3. The API should be identical from a user perspective

4. Test both builds work correctly

## Build Process

```bash
yarn build
```

This runs:

1. TypeScript compilation (types generated once, shared by both builds)
2. WebGL build (4 configs: ESM/CJS × multi/single)
3. WebGPU build (4 configs: ESM/CJS × multi/single)

## Technical Details

### Rollup Plugin: webgpu-override-resolver

See `rollup-plugin-webgpu-overrides.js` for implementation.

The plugin intercepts module resolution during the build:

```javascript
// During WebGPU build
import { useFBO } from './Fbo'

// Plugin checks:
// 1. Does src/webgpu/core/Fbo.tsx exist? YES → use it
// 2. Does src/webgpu/core/Fbo.ts exist? NO
// 3. Fall back to normal resolution → src/core/Fbo.tsx
```

### Plugin Order

Plugin order in the Rollup config matters:

```javascript
plugins: [
  webgpuOverrideResolver(),  // 1. Check for internal overrides
  alias({ ... }),             // 2. Alias 'three' → 'three/webgpu'
  resolve({ ... }),           // 3. Normal module resolution
  babel({ ... }),             // 4. Transpile
]
```

### Type Definitions

Types are generated once and shared by both builds because:

- Three.js types are identical for WebGL and WebGPU (same `@types/three`)
- Drei's API is identical regardless of renderer
- Only runtime implementations differ, not type signatures

## Components with Overrides

Current components requiring WebGPU-specific implementations:

- `Fbo.tsx` / `useFBO` - Render targets
- `Effects.tsx` - Post-processing
- `RenderTexture.tsx` - Render-to-texture
- `RenderCubeTexture.tsx` - Cube maps
- `CubeCamera.tsx` - Cube camera rendering
- `useDepthBuffer.ts` - Depth buffer handling
- (More to be added as needed)

## Debugging

Enable verbose logging in the plugin:

```javascript
webgpuOverrideResolver({ verbose: true })
```

This will log all override resolutions during build:

```
[WebGPU Override] ./Fbo → src/webgpu/core/Fbo.tsx
```

## Package.json Exports

The dual build is exposed via package.json exports field:

```json
{
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "import": "./index.js",
      "require": "./index.cjs.js"
    },
    "./webgpu": {
      "types": "./webgpu/index.d.ts",
      "import": "./webgpu/index.js",
      "require": "./webgpu/index.cjs.js"
    }
  }
}
```

This allows users to explicitly choose which renderer build to use while maintaining tree-shaking and optimal bundle sizes.
