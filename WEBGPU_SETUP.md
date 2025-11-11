# WebGPU Build Setup

This document outlines the setup steps needed to enable the WebGPU build system for Drei.

## Installation

### Add Required Dependency

The build system uses `@rollup/plugin-alias` to redirect Three.js imports. Add it to your devDependencies:

```bash
yarn add -D @rollup/plugin-alias
```

Or with npm:

```bash
npm install --save-dev @rollup/plugin-alias
```

## Package.json Configuration

After building, update the `dist/package.json` to expose the WebGPU build via exports. The build script already copies and modifies package.json - you'll need to update the `copy` script to preserve the exports field.

Add this to your root `package.json` **before** it gets copied to `dist/`:

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
    },
    "./native": {
      "types": "./native/index.d.ts",
      "import": "./native/index.js",
      "require": "./native/index.cjs.js"
    }
  }
}
```

## Build Process

The existing build command will now generate both WebGL and WebGPU builds:

```bash
yarn build
```

This will create:

- `dist/` - WebGL build (default, backward compatible)
- `dist/webgpu/` - WebGPU build (opt-in)

## Testing

### Local Testing

1. Build the package: `yarn build`
2. Link locally: `cd dist && yarn link`
3. In a test project:

   ```typescript
   // Test WebGL (default)
   import { Fbo } from '@react-three/drei'

   // Test WebGPU
   import { Fbo } from '@react-three/drei/webgpu'
   ```

### Verify Bundle Size

Check that WebGPU builds are smaller:

```bash
# Compare bundle sizes
ls -lh dist/index.js
ls -lh dist/webgpu/index.js
```

The WebGPU version should be several MB smaller since it doesn't include WebGL-specific code.

## Creating WebGPU Overrides

When a component needs a WebGPU-specific implementation:

1. Create the override file:

   ```bash
   # For src/core/Fbo.tsx
   mkdir -p src/webgpu/core
   touch src/webgpu/core/Fbo.tsx
   ```

2. Implement the WebGPU version (see `src/webgpu/README.md`)

3. Rebuild: `yarn build`

4. The build system automatically uses overrides for WebGPU build

## Troubleshooting

### Plugin Not Found

```
Error: Could not load ./rollup-plugin-webgpu-overrides.js
```

**Solution**: Ensure the plugin file exists at the project root and uses `.js` extension.

### Alias Plugin Missing

```
Error: Cannot find module '@rollup/plugin-alias'
```

**Solution**: Install the dependency: `yarn add -D @rollup/plugin-alias`

### WebGPU Build Not Creating

Check that:

1. The `src/webgpu/` directory exists
2. No syntax errors in `rollup.config.js`
3. Run build with verbose logging: set `verbose: true` in the plugin options

### Import Not Resolving

If WebGPU imports don't work:

1. Verify `exports` field in `dist/package.json`
2. Check bundler supports package.json `exports` (most modern bundlers do)
3. Try absolute import: `import { Fbo } from '@react-three/drei/webgpu/core/Fbo'`

## Next Steps

1. Install `@rollup/plugin-alias` dependency
2. Test the build: `yarn build`
3. Create your first WebGPU override (start with `Fbo.tsx`)
4. Update package.json exports as shown above
5. Test in a real project with WebGPU renderer

See `docs/WEBGPU_BUILD.md` for complete documentation.
