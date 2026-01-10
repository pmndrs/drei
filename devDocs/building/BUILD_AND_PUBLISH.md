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
3. `obuild` — Bundle all entry points with Rolldown
4. `yarn copy` — Copy package.json, README, LICENSE to dist
5. `yarn copy:native` — Copy React Native package.json

### What Gets Built

The build produces **7 entry points** in the `dist/` folder:

| Entry | Source | Purpose |
|-------|--------|---------|
| `index.js` | `src/index.ts` | Root — core + external + experimental |
| `core/index.js` | `src/core/index.ts` | Renderer-agnostic components |
| `external/index.js` | `src/external/index.ts` | Third-party library wrappers |
| `experimental/index.js` | `src/experimental/index.ts` | Rough/unstable components |
| `legacy/index.js` | `src/legacy/index.ts` | WebGL-only implementations |
| `webgpu/index.js` | `src/webgpu/index.ts` | WebGPU-only implementations |
| `native/index.js` | `src/native/index.ts` | React Native support |

Each entry point gets:
- ESM bundle (`.js`)
- CommonJS bundle (`.cjs.js`)
- TypeScript declarations (`.d.ts`)

### Output Structure

```
dist/
├── index.js              # Root ESM
├── index.cjs.js          # Root CJS
├── index.d.ts            # Root types
├── core/
│   ├── index.js
│   ├── index.cjs.js
│   └── index.d.ts
├── legacy/
│   └── ...
├── webgpu/
│   └── ...
├── external/
│   └── ...
├── experimental/
│   └── ...
├── native/
│   └── ...
├── package.json          # Cleaned for npm
├── README.md
└── LICENSE
```

---

## Build Configuration

The build is configured in `build.config.ts` using obuild (powered by Rolldown).

### Key Settings

```ts
// Entry points
entries: [
  { input: './src/index', name: 'index' },
  { input: './src/core/index', name: 'core/index' },
  { input: './src/legacy/index', name: 'legacy/index' },
  { input: './src/webgpu/index', name: 'webgpu/index' },
  // ...
]

// External dependencies (not bundled)
externals: [
  'react', 'react-dom', 'three', '@react-three/fiber',
  // + all dependencies from package.json
]

// Rolldown options
rolldown: {
  alias: { '#three': 'three' },
  treeshake: true,
  output: { format: 'esm', preserveModules: true }
}
```

### Platform Aliases

The build resolves platform aliases differently per entry:

| Entry | `#three` resolves to | `#drei-platform` resolves to |
|-------|---------------------|------------------------------|
| root, core, external, experimental | `three` | `drei-platform.ts` (WebGL) |
| legacy | `three` | `drei-platform.ts` (WebGL) |
| webgpu | `three/webgpu` | `drei-platform-webgpu.ts` |

See [Platform Aliases](./PLATFORM_ALIASES.md) for details.

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

| Branch | Release Type | npm Tag |
|--------|-------------|---------|
| `master` | Production | `latest` |
| `beta` | Prerelease | `beta` |
| `alpha` | Prerelease | `alpha` |
| `rc` | Prerelease | `rc` |
| `canary-*` | Prerelease | `canary` |

### Commit Message Format

Commit messages determine the version bump:

| Commit Type | Example | Version Bump |
|------------|---------|--------------|
| `fix:` | `fix: resolve FBO memory leak` | `0.0.x` (patch) |
| `feat:` | `feat: add MeshWobbleMaterial` | `0.x.0` (minor) |
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
import { OrbitControls } from '@react-three/drei'        // Root
import { OrbitControls } from '@react-three/drei/core'   // Core only
import { MeshDistortMaterial } from '@react-three/drei/legacy'  // WebGL
import { MeshDistortMaterial } from '@react-three/drei/webgpu'  // WebGPU
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

Check if dependencies are being bundled instead of externalized. All `dependencies` and `peerDependencies` should be in the `externals` array in `build.config.ts`.

### "Cannot find module" after publish

Ensure the entry point is listed in both:
1. `build.config.ts` entries
2. `package.json` exports

---

## Related Docs

- [Platform Aliases](./PLATFORM_ALIASES.md) — How `#three` and `#drei-platform` work
- [Contributing](../CONTRIBUTING.md) — How to contribute
- [Migration Guide](../MIGRATION_V10_TO_V11.md) — v11 architecture overview

