# Build & Publish Guide

This guide covers how to build Drei locally and how releases are published to npm.

---

## Build System: unbuild (Rollup)

Drei uses **unbuild** (which wraps Rollup) for bundling. This was chosen over alternatives like Rolldown for specific technical reasons.

### Why Rollup over Rolldown?

We initially tried Rolldown (via obuild) but encountered a critical issue: **Rolldown resolves external dependencies to absolute file paths** instead of preserving clean import specifiers.

For example, with Rolldown:

```js
// Expected output:
import { Vector3 } from 'three'

// Actual Rolldown output:
import { Vector3 } from 'C:\\Users\\...\\node_modules\\three\\build\\three.module.js'
```

This causes:

- **Non-portable builds** — Absolute paths don't exist on consumer machines
- **Duplicate dependency instances** — Bundlers in consuming apps can't dedupe
- **Runtime errors** — Multiple Three.js instances cause object identity mismatches

Rollup handles externals correctly out of the box — when you mark `three` as external, the output keeps `from "three"`.

---

## Building Locally

### Quick Build

```bash
yarn build
```

This runs the full build pipeline:

1. `rimraf dist` — Clean the dist folder
2. `yarn typegen` — Generate TypeScript declarations
3. `unbuild` — Bundle all entries with per-entry aliases
4. `yarn copy` — Copy package.json, README, LICENSE to dist
5. `yarn copy:native` — Copy React Native package.json

### What Gets Built

The build produces **7 entry points** in the `dist/` folder:

| Entry                    | Source                      | Three.js Alias | Purpose                                     |
| ------------------------ | --------------------------- | -------------- | ------------------------------------------- |
| `index.mjs`              | `src/index.ts`              | `three`        | Root — core + external + experimental       |
| `core/index.mjs`         | `src/core/index.ts`         | `three`        | Renderer-agnostic components only           |
| `external/index.mjs`     | `src/external/index.ts`     | `three`        | Third-party library wrappers                |
| `experimental/index.mjs` | `src/experimental/index.ts` | `three`        | Rough/unstable components                   |
| `legacy/index.mjs`       | `src/legacy/index.ts`       | `three`        | Core + WebGL-only implementations           |
| `webgpu/index.mjs`       | `src/webgpu/index.ts`       | `three/webgpu` | Core + WebGPU-only implementations          |
| `native/index.mjs`       | `src/native/index.ts`       | `three/webgpu` | Core + WebGPU for React Native (exclusions) |

Each entry point gets:

- ESM bundle (`.mjs`)
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
├── index.mjs             # Root ESM (core + external + experimental)
├── index.d.ts            # Root types
├── core/                 # Core components (renderer-agnostic)
│   ├── index.mjs
│   └── index.d.ts
├── legacy/               # Core + WebGL implementations
│   ├── index.mjs
│   └── index.d.ts
├── webgpu/               # Core + WebGPU implementations
│   ├── index.mjs
│   └── index.d.ts
├── external/             # External library wrappers
│   ├── index.mjs
│   └── index.d.ts
├── experimental/         # Experimental components
│   ├── index.mjs
│   └── index.d.ts
├── native/               # Core + WebGPU for React Native
│   ├── index.mjs
│   └── index.d.ts
├── package.json          # Cleaned for npm
├── README.md
└── LICENSE
```

---

## Build Configuration

Drei uses a single `build.config.ts` with per-entry alias configuration via `@rollup/plugin-alias`:

### WebGL Entries (root, core, external, experimental, legacy)

```ts
alias({
  entries: [
    { find: '#three', replacement: 'three' },
    { find: '#drei-platform', replacement: resolve('./src/utils/drei-platform.ts') },
    { find: '#three-addons', replacement: resolve('./src/utils/three-addons.ts') },
  ],
})
```

### WebGPU Entries (webgpu, native)

```ts
alias({
  entries: [
    { find: '#three', replacement: 'three/webgpu' },
    { find: '#drei-platform', replacement: resolve('./src/utils/drei-platform-webgpu.ts') },
    { find: '#three-addons', replacement: resolve('./src/utils/three-addons-webgpu.ts') },
  ],
})
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
yarn test:bundles
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
      "import": "./index.mjs"
    },
    "./core": {
      "types": "./core/index.d.ts",
      "import": "./core/index.mjs"
    },
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

Check if dependencies are being bundled instead of externalized. All `dependencies` and `peerDependencies` should be marked as external in `build.config.ts` via the `externals` array.

### "Cannot find module" after publish

Ensure the entry point is listed in both:

1. `build.config.ts` or `build.config.webgpu.ts` entries
2. `package.json` exports

### WebGPU bundle has 'three' imports

Run `yarn test:bundles` after build to check. If it fails:

1. Ensure the component uses `#three` alias, not direct `'three'` imports
2. Check that the entry's alias configuration in `build.config.ts` is correct

---

## Related Docs

- [Platform Aliases](./PLATFORM_ALIASES.md) — How `#three` and `#drei-platform` work
- [Contributing](../CONTRIBUTING.md) — How to contribute
- [Migration Guide](../MIGRATION_V10_TO_V11.md) — v11 architecture overview
