# Build & Publish Guide

This guide covers how to build Drei locally and how releases are published to npm.

---

## Building Locally

### Quick Build

```bash
yarn build
```

This runs the full build pipeline:

1. `rimraf dist` — Clean the dist folder
2. `yarn typegen` — Generate TypeScript declarations
3. `obuild` — Bundle all entries with per-entry aliases
4. `yarn copy` — Copy package.json, README, LICENSE to dist
5. `yarn copy:native` — Copy React Native package.json

### What Gets Built

The build produces **7 entry points** in the `dist/` folder:

| Entry                   | Source                      | Three.js Alias | Purpose                                     |
| ----------------------- | --------------------------- | -------------- | ------------------------------------------- |
| `index.js`              | `src/index.ts`              | `three`        | Root — core + external + experimental       |
| `core/index.js`         | `src/core/index.ts`         | `three`        | Renderer-agnostic components only           |
| `external/index.js`     | `src/external/index.ts`     | `three`        | Third-party library wrappers                |
| `experimental/index.js` | `src/experimental/index.ts` | `three`        | Rough/unstable components                   |
| `legacy/index.js`       | `src/legacy/index.ts`       | `three`        | Core + WebGL-only implementations           |
| `webgpu/index.js`       | `src/webgpu/index.ts`       | `three/webgpu` | Core + WebGPU-only implementations          |
| `native/index.js`       | `src/native/index.ts`       | `three/webgpu` | Core + WebGPU for React Native (exclusions) |

Each entry point gets:

- ESM bundle (`.js`)
- CommonJS bundle (`.cjs.js`)
- TypeScript declarations (`.d.ts`)

### Entry Point Exports

**Important**: The `legacy`, `webgpu`, and `native` entries export ALL of core plus their platform-specific components. This means:

```ts
// These both export Box, Sphere, OrbitControls, etc.
import { Box, MeshDistortMaterial } from '@react-three/drei/legacy' // WebGL version
import { Box, MeshDistortMaterial } from '@react-three/drei/webgpu' // WebGPU version

// The difference is the THREE.js aliasing:
// - legacy: all #three imports → 'three' (WebGL)
// - webgpu: all #three imports → 'three/webgpu' (WebGPU)
```

**Native exclusions**: Some components don't work on React Native and throw helpful errors:

- `Html` — Requires DOM
- `Caustics` — Not yet supported on native

### Output Structure

```
dist/
├── index.js              # Root ESM (core + external + experimental)
├── index.cjs.js          # Root CJS
├── index.d.ts            # Root types
├── core/                 # Core components (renderer-agnostic)
│   └── ...
├── legacy/               # Core + WebGL implementations
│   └── ...
├── webgpu/               # Core + WebGPU implementations
│   └── ...
├── external/             # External library wrappers
│   └── ...
├── experimental/         # Experimental components
│   └── ...
├── native/               # Core + WebGPU for React Native
│   └── ...
├── package.json          # Cleaned for npm
├── README.md
└── LICENSE
```

---

## Build Configuration

Drei uses a single `build.config.ts` with per-entry alias configuration via rolldown's `resolve.alias`:

### WebGL Entries (root, core, external, experimental, legacy)

```ts
resolve: {
  alias: {
    '#three': 'three',
    '#drei-platform': './src/utils/drei-platform.ts',
    '#three-addons': './src/utils/three-addons.ts',
  }
}
```

### WebGPU Entries (webgpu, native)

```ts
resolve: {
  alias: {
    '#three': 'three/webgpu',
    '#drei-platform': './src/utils/drei-platform-webgpu.ts',
    '#three-addons': './src/utils/three-addons-webgpu.ts',
  }
}
```

### Why Per-Entry Aliases?

When you import **anything** from `'three'`, even a simple `Vector3`, the bundler may include the WebGLRenderer in the bundle. By aliasing `#three` to `'three/webgpu'` for WebGPU builds, we ensure:

- **Legacy bundle**: Only imports from `'three'` (WebGL-safe)
- **WebGPU bundle**: Only imports from `'three/webgpu'` (no WebGLRenderer)

This keeps bundle sizes optimal for each platform.

---

## Verifying Builds

After building, verify the bundles have correct imports:

```bash
yarn build
node scripts/verify-bundles.js
```

This checks:

- ✅ Legacy: no `'three/webgpu'` or `'three/tsl'` imports
- ✅ WebGPU: no plain `'three'` imports (only `'three/webgpu'`)
- ✅ Native: no plain `'three'` imports (WebGPU-based)

---

## Pre-Build Checks

Before building, run the full test suite:

```bash
yarn test
```

This runs:

- `yarn eslint:ci` — Linting
- `yarn typecheck` — TypeScript type checking
- `yarn prettier` — Code formatting check
- E2E tests (if configured)

### Individual Checks

```bash
yarn eslint        # Fix linting issues
yarn prettier-fix  # Fix formatting issues
yarn typecheck     # Check types only
```

---

## Publishing

### Automatic Releases (CI)

We use **semantic-release** for automated publishing. Releases are triggered by commits to specific branches:

| Branch     | Release Type | npm Tag  |
| ---------- | ------------ | -------- |
| `master`   | Production   | `latest` |
| `beta`     | Prerelease   | `beta`   |
| `alpha`    | Prerelease   | `alpha`  |
| `rc`       | Prerelease   | `rc`     |
| `canary-*` | Prerelease   | `canary` |

### Commit Message Format

Commit messages determine the version bump:

| Commit Type        | Example                        | Version Bump    |
| ------------------ | ------------------------------ | --------------- |
| `fix:`             | `fix: resolve FBO memory leak` | `0.0.x` (patch) |
| `feat:`            | `feat: add MeshWobbleMaterial` | `0.x.0` (minor) |
| `BREAKING CHANGE:` | `feat!: remove deprecated API` | `x.0.0` (major) |

Follow the [Conventional Commits](https://www.conventionalcommits.org/) spec.

### What Gets Published

The `dist/` folder is published to npm. The copy script cleans up `package.json`:

- Removes `private: true`
- Removes `devDependencies`
- Removes `scripts`, `husky`, `prettier`, `jest`, `lint-staged`

The published package includes:

- All bundled entry points
- TypeScript declarations
- README and LICENSE

### Manual Publishing (Emergency)

If you need to publish manually (rare):

```bash
# Build first
yarn build

# Publish from dist
cd dist
npm publish --access public
```

**Note:** This bypasses semantic-release and should only be used in emergencies.

---

## Package Exports

The `package.json` exports field defines how consumers import the package:

```json
{
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "import": "./index.js",
      "require": "./index.cjs.js"
    },
    "./core": { ... },
    "./legacy": { ... },
    "./webgpu": { ... },
    "./external": { ... },
    "./experimental": { ... },
    "./native": { ... }
  }
}
```

This enables:

```ts
import { OrbitControls } from '@react-three/drei' // Root (core + external + experimental)
import { OrbitControls } from '@react-three/drei/core' // Core only
import { Box, MeshDistortMaterial } from '@react-three/drei/legacy' // Core + WebGL materials
import { Box, MeshDistortMaterial } from '@react-three/drei/webgpu' // Core + WebGPU materials
import { Box } from '@react-three/drei/native' // Core + WebGPU for React Native
```

---

## Troubleshooting

### Build fails with alias errors

Make sure the alias files exist:

- `src/utils/drei-platform.ts`
- `src/utils/drei-platform-webgpu.ts`
- `src/utils/three-addons.ts`
- `src/utils/three-addons-webgpu.ts`

### Types not generating

Run `yarn typegen` separately to see TypeScript errors:

```bash
yarn typegen
```

### Bundle size seems large

Check if dependencies are being bundled instead of externalized. All `dependencies` and `peerDependencies` should be marked as external in `build.config.ts`.

### "Cannot find module" after publish

Ensure the entry point is listed in both:

1. `build.config.ts` or `build.config.webgpu.ts` entries
2. `package.json` exports

### WebGPU bundle has 'three' imports

Run `node scripts/verify-bundles.js` after build to check. If it fails:

1. Ensure the component uses `#three` alias, not direct `'three'` imports
2. Check that the entry's `resolve.alias` configuration in `build.config.ts` is correct

---

## Related Docs

- [Platform Aliases](./PLATFORM_ALIASES.md) — How `#three` and `#drei-platform` work
- [Contributing](../CONTRIBUTING.md) — How to contribute
- [Migration Guide](../MIGRATION_V10_TO_V11.md) — v11 architecture overview
