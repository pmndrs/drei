# Migration Guide: Drei v10 → v11

---

## Overview

Drei v11 introduces a major architectural change to support both WebGL and WebGPU renderers through separate entry points while maintaining a renderer-agnostic core. This is a coordinated release with R3F v10 — Three.js split their renderer, R3F followed, and Drei completes the stack.

Since we were already making breaking changes, we took the opportunity to modernize: new build tooling, reorganized components into a folder structure that enables future workflows, and comprehensive TSDocs throughout. Your intellisense is about to get a lot more useful.

### What's New for Users

- [New Entry Point Structure](#entry-points) — Platform-specific components now live in `/legacy` and `/webgpu`
- [Platform-Specific Components](#component-classification) — Materials, render targets, and effects require explicit imports
- [External & Experimental Folders](#component-classification) — Third-party wrappers and rough features have dedicated paths
- [Migration Steps](#migration-steps) — Most projects upgrade in 3 steps

### What's New for Contributors

- [Component-as-a-Folder](#component-as-a-folder-caaf-structure) — Each component gets its own folder with co-located files
- [Build System (obuild)](#build-system-obuild) — Modern tooling, ESM-first with CJS compat
- [Import Aliases](#import-aliases) — `#three` maps to the right renderer automatically
- [Stories & Visual Testing](#storybook) — Every component now has stories and regression tests

---

# 🎯 For Users

## Entry Points

The biggest user-facing change is how you import platform-specific components.

### Before (v10)

```tsx
// Single entry point for everything
import { OrbitControls, Environment, Bvh, MeshDistortMaterial } from '@react-three/drei'
```

### After (v11)

```tsx
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

**📝 Bundle behavior:** When importing from root, components use the default Three.js renderer path (WebGL). For WebGPU projects, import platform-specific components from `/webgpu` to get properly aliased code that won't bundle the WebGL renderer.

---

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

### Platform-Specific (Explicit Imports Required)

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

---

## Migration Steps

### Step 1: Update Dependencies

Drei v11 requires R3F v10 — this isn't optional, even for legacy WebGL projects. R3F v10 introduces WebGPU support, a new Scheduler, and Nodes integration that Drei v11 depends on throughout. For Three.js, we recommend 0.182+ (the version this release was built against), though earlier WebGPU-capable versions may work.

> **⚠️ TODO: Test installation commands**
>
> **Testing needed:** Verify these commands work across:
>
> - npm vs yarn vs pnpm
> - Different R3F v10 alpha versions
> - Peer dependency resolution (especially Three.js version conflicts)
>
> **Blocker?** Do we need R3F v10 officially released first, or can users test with alpha?

```bash
npm install @react-three/drei@11
# or
yarn add @react-three/drei@11
```

### Step 2: Update Imports

#### If you're using WebGL (default):

```tsx
// Most components can stay as-is
import { OrbitControls, Environment } from '@react-three/drei'

// Materials and render targets need explicit /legacy import
import { MeshDistortMaterial } from '@react-three/drei/legacy'
import { Fbo } from '@react-three/drei/legacy'
```

**Why explicit imports?** Components like `Fbo` and materials are tightly coupled to the renderer. Importing from root defaults to WebGL — if you're using WebGPU, these will break. Always import render targets and materials from your platform path.

#### If you're using WebGPU:

```tsx
// Renderer-agnostic components work the same
import { OrbitControls, Environment } from '@react-three/drei'

// Use /webgpu for platform-specific components
import { MeshDistortMaterial } from '@react-three/drei/webgpu'
import { Fbo } from '@react-three/drei/webgpu'
```

### Step 3: Bundle Optimization (Optional)

For smaller bundles, use explicit entry points:

```tsx
// Instead of root import
import { OrbitControls, Environment, Bvh, MarchingCubes } from '@react-three/drei'

// Use specific entry points
import { OrbitControls, Environment } from '@react-three/drei/core'
import { Bvh } from '@react-three/drei/external'
import { MarchingCubes } from '@react-three/drei/experimental'
```

---

## Examples

Here's how the same scene looks with different renderer configurations:

### WebGL Project

```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { MeshDistortMaterial } from '@react-three/drei/legacy'

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

```tsx
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

**📝 Pattern:** Notice how `OrbitControls` and `Environment` always come from root - they're renderer-agnostic. Only `MeshDistortMaterial` changes based on your renderer.

---

# 🔧 For Contributors

## Component-as-a-Folder (CaaF) Structure

Components are now organized in a modular folder structure:

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
  ├── OrbitControls.docs.mdx  // optional
  └── OrbitControls.stories.tsx

src/core/Staging/Environment/
  ├── index.ts
  ├── Environment.tsx
  └── Environment.stories.tsx
```

**Why CaaF?**

- **Co-location** — Component, stories, and docs live together. No hunting across folders.
- **Self-contained** — Each component is a portable unit. Easy to understand, easy to update.
- **Scalable** — Adding new components is straightforward: create a folder, follow the pattern.
- **Future-ready** — This structure enables workflows like component-level code generation down the road.

**Naming conventions:**

```
src/core/Category/ComponentName/
  ├── index.ts                   # Re-exports the component
  ├── ComponentName.tsx          # Main implementation
  ├── ComponentName.stories.tsx  # Storybook stories (also serve as tests)
  └── ComponentName.docs.mdx     # Optional documentation
```

### Component Types

Components fall into four categories based on renderer compatibility:

| Type                    | Example              | Where it lives                               | How it works                                   |
| ----------------------- | -------------------- | -------------------------------------------- | ---------------------------------------------- |
| **Universal**           | `OrbitControls`      | `/core`                                      | Just works everywhere                          |
| **Platform-Aliased**    | `Cloud`              | `/core`, exported from `/legacy` & `/webgpu` | Uses `#drei-platform` aliases at build time    |
| **Dual Implementation** | `MeshWobbleMaterial` | Separate files in `/legacy` and `/webgpu`    | Same API, different code (GLSL vs TSL)         |
| **Platform-Only**       | `AsciiRenderer`      | Only in `/legacy`                            | Not ported yet, or renderer-specific by nature |

> **⚠️ Open Question:** Should platform-aliased components live in a `/dual` folder instead of `/core`? Currently they're in core but don't export from the core entry point, which can be confusing for contributors.

---

## Build System (obuild)

Drei v11 uses **obuild**, the successor to Unbuild (which powers R3F v10). It's built on **Rolldown** — the Rust-based bundler that's generating a lot of excitement — and uses modern tooling like OXC under the hood.

**Why obuild?**

- Handles our complex multi-entry setup (root, core, legacy, webgpu, etc.) cleanly
- Same API and workflow as Unbuild, so familiar patterns
- ESM-first with CJS compatibility
- Great support for the platform aliasing system that makes WebGL/WebGPU splitting work

Build commands work the same as before: `yarn build` handles everything.

For details on how the alias system works, see [Platform Aliases](./building/PLATFORM_ALIASES.md).

---

## Documentation Generation

Drei v11 includes a redesigned documentation system. TSDoc comments in components automatically generate MDX documentation for [docs.pmnd.rs](https://docs.pmnd.rs).

See [Documentation Generation](./DOCS_GENERATION.md) for details on writing TSDoc and using the generation scripts.

---

## Import Aliases

**For contributors only:** Internal aliases enable renderer-agnostic code. Users don't interact with these directly.

| Alias            | Purpose                                                    |
| ---------------- | ---------------------------------------------------------- |
| `#three`         | Maps to `three` or `three/webgpu` depending on entry point |
| `#three-addons`  | Split Three.js addons (Line2, etc.)                        |
| `#drei-platform` | Split drei components (materials, shadows, render targets) |

**How it works:** When you build for WebGL, `#three` resolves to `three`. When you build for WebGPU, it resolves to `three/webgpu`. This lets components in `/core` work with both renderers without code duplication.

For the full guide on when to use each alias and how to add new split components, see [Platform Aliases](./building/PLATFORM_ALIASES.md).

---

## Storybook

Run Storybook from root:

```bash
yarn storybook
```

This picks up all stories across all platforms.

**Platform switching:** There's a global renderer toggle in Storybook. The `<Setup>` component handles canvas switching, and `<PlatformSwitch>` detects the active renderer to output the right content. See `.storybook/Setup.tsx` and `.storybook/components/PlatformSwitch.tsx`.

**Caveat:** Because Storybook doesn't go through the production build, platform aliases don't resolve automatically. For dual components, you may need to explicitly import and inject platform-specific code in your story (see `Cloud.stories.tsx` for an example).

**Adding stories:**

- Create `ComponentName.stories.tsx` in the component folder
- For simple components, consider combining multiple stories in one file (individual story files for every shape variant gets tedious)

See [Storybook Guide](../.storybook/README.md) for the full documentation on Setup, PlatformSwitch, tags, and story patterns.

---

## Visual Regression Testing

We use **Chromatic** for visual regression testing. Stories double as visual tests — Chromatic snapshots each story and flags visual changes in PRs.

**What this means for contributors:**

- Every component should have at least one story
- Stories should exercise the component's key visual states
- Chromatic runs in CI and will flag visual diffs for review

> **📝 TODO:** Document Chromatic workflow, how to review diffs, and threshold settings.

---

# 📚 Reference

## Breaking Changes

### 1. Material Imports

**Before:**

```tsx
import { MeshDistortMaterial, MeshReflectorMaterial } from '@react-three/drei'
```

**After:**

```tsx
// WebGL
import { MeshDistortMaterial, MeshReflectorMaterial } from '@react-three/drei/legacy'

// WebGPU
import { MeshDistortMaterial, MeshReflectorMaterial } from '@react-three/drei/webgpu'
```

### 2. Render Target Components

Render targets (`Fbo`, `RenderTexture`, `RenderCubeTexture`) are platform-specific and must be imported from `/legacy` or `/webgpu`.

```tsx
// WebGL
import { Fbo, RenderTexture } from '@react-three/drei/legacy'

// WebGPU
import { Fbo, RenderTexture } from '@react-three/drei/webgpu'
```

---

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
- Some Experimental components like Volumetric Spotlights need work

---

## Performance Considerations

### Bundle Size

| Entry Point                | Contents                                          |
| -------------------------- | ------------------------------------------------- |
| Root (`@react-three/drei`) | core + external + experimental (~same as v10)     |
| `/core`                    | Smallest bundle, production-ready components only |
| `/external`                | External library wrappers (e.g., Bvh)             |
| `/experimental`            | Rough/experimental features                       |
| `/legacy`                  | WebGL-specific implementations                    |
| `/webgpu`                  | WebGPU-specific implementations                   |

### Tree-Shaking

All entry points support tree-shaking. Importing from root won't pull in legacy or webgpu code.

---

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

---

## Troubleshooting

### "Cannot find module '@react-three/drei/legacy'"

Make sure you're using Drei v11 and your bundler supports package.json `exports` field.

### Materials look different between WebGL and WebGPU

This is a known issue being worked on as we refine TSL implementations. Report discrepancies on GitHub.

**💡 EXPAND:** List known visual differences and expected timeline for fixes

### Type errors after upgrade

Clear your node_modules and reinstall:

```bash
rm -rf node_modules
npm install
# or
yarn install
```

---

## Getting Help

- 📖 [Documentation](https://drei.docs.pmnd.rs/)
- 💬 [Discord](https://discord.gg/poimandres)
- 🐛 [GitHub Issues](https://github.com/pmndrs/drei/issues)

## Feedback

We'd love to hear your feedback on the v11 architecture! Please open an issue or discussion on GitHub.
