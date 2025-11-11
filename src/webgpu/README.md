# WebGPU Overrides

This directory contains WebGPU-specific implementations of components that differ from the WebGL versions.

## Directory Structure

The structure mirrors `src/` - place override files in the same relative path:

```
src/core/Fbo.tsx           → src/webgpu/core/Fbo.tsx
src/core/Effects.tsx       → src/webgpu/core/Effects.tsx
```

## When to Add an Override

Only add files here when a component needs a different implementation for WebGPU. Components that work with both renderers (just need import aliasing) should NOT have overrides.

### Needs Override:

- Components using `WebGLRenderTarget`
- Components using `WebGLCubeRenderTarget`
- Custom render passes or effects
- Direct WebGL API calls

### No Override Needed:

- Camera components
- Controls (OrbitControls, etc.)
- Helpers and utilities
- Components that only use Three.js objects

## Implementation Guidelines

1. **Maintain API compatibility** - The component should export the same types/props
2. **Keep interfaces identical** - Users shouldn't need to change their code
3. **Document differences** - Add comments explaining WebGPU-specific logic
4. **Test both versions** - Ensure feature parity where possible

## Example

```typescript
// src/core/Fbo.tsx (WebGL)
const target = new THREE.WebGLRenderTarget(width, height, options)

// src/webgpu/core/Fbo.tsx (WebGPU)
const target = new THREE.RenderTarget(width, height, options) // WebGPU API
```

See `docs/WEBGPU_BUILD.md` for complete build system documentation.
