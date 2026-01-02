# Platform & Internal Aliases

Drei v11 uses build-time aliases for cleaner imports and to handle WebGL/WebGPU splits without duplicating code.

## Overview

### Platform Aliases (WebGL/WebGPU Split)

| Alias            | Purpose               | WebGL Resolves To  | WebGPU Resolves To        |
| ---------------- | --------------------- | ------------------ | ------------------------- |
| `#three`         | Three.js core         | `three`            | `three/webgpu`            |
| `#three-addons`  | Split Three.js addons | `three-addons.ts`  | `three-addons-webgpu.ts`  |
| `#drei-platform` | Split drei components | `drei-platform.ts` | `drei-platform-webgpu.ts` |

### Internal Aliases (Cleaner Imports)

| Alias             | Resolves To          | Example Usage                              |
| ----------------- | -------------------- | ------------------------------------------ |
| `@core/*`         | `src/core/*`         | `import { X } from '@core/Cameras'`        |
| `@legacy/*`       | `src/legacy/*`       | `import { X } from '@legacy/Materials/Y'`  |
| `@webgpu/*`       | `src/webgpu/*`       | `import { X } from '@webgpu/Materials/Y'`  |
| `@external/*`     | `src/external/*`     | `import { X } from '@external/Controls/Y'` |
| `@experimental/*` | `src/experimental/*` | `import { X } from '@experimental/Y'`      |
| `@utils/*`        | `src/utils/*`        | `import { X } from '@utils/ts-utils'`      |

---

## Internal Aliases

Use `@` aliases to avoid deep relative imports:

```ts
// ❌ DON'T: Deep relative imports
import { useFBO } from '../../../legacy/Helpers/Fbo'
import { ForwardRefComponent } from '../../../utils/ts-utils'

// ✅ DO: Use internal aliases
import { useFBO } from '@legacy/Helpers/Fbo'
import { ForwardRefComponent } from '@utils/ts-utils'
```

### Cross-Tier Imports

```ts
// From core, importing legacy component
import { CubeCamera } from '@legacy/Cameras/CubeCamera'

// From core, importing external component
import { CameraControls } from '@external/Controls/CameraControls'

// From anywhere, importing utils
import { ForwardRefComponent } from '@utils/ts-utils'
```

---

## `#three` - Three.js Core

For the main Three.js import. Most components should use this.

```ts
// ✅ DO: Use #three for core Three.js
import * as THREE from '#three'
import { Vector3, Color, Mesh } from '#three'

// ❌ DON'T: Import directly (won't work in WebGPU builds)
import * as THREE from 'three'
```

**When to use:** Always, for any Three.js core imports.

---

## `#three-addons` - Split Three.js Addons

Some Three.js addons have separate WebGL and WebGPU implementations. These are re-exported through mapping files.

### Usage

```ts
// ✅ DO: Use #three-addons for split addons
import { Line2, LineGeometry, LineMaterial } from '#three-addons'

// ✅ DO: Import non-split addons directly
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'

// ❌ DON'T: Import split addons directly (won't work in WebGPU)
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
```

### Currently Split Addons

Located in `src/utils/three-addons.ts` and `src/utils/three-addons-webgpu.ts`:

| Export          | WebGL Path               | WebGPU Path                     |
| --------------- | ------------------------ | ------------------------------- |
| `Line2`         | `lines/Line2.js`         | `lines/webgpu/Line2.js`         |
| `LineSegments2` | `lines/LineSegments2.js` | `lines/webgpu/LineSegments2.js` |
| `LineGeometry`  | `lines/LineGeometry.js`  | `lines/webgpu/LineGeometry.js`  |
| `LineMaterial`  | `lines/LineMaterial.js`  | `lines/webgpu/LineMaterial.js`  |

### Adding a New Split Addon

1. Check Three.js docs to confirm the addon has a webgpu variant
2. Add export to **both** files:

```ts
// src/utils/three-addons.ts (WebGL)
export { NewAddon } from 'three/examples/jsm/path/NewAddon.js'

// src/utils/three-addons-webgpu.ts (WebGPU)
export { NewAddon } from 'three/examples/jsm/path/webgpu/NewAddon.js'
```

---

## `#drei-platform` - Split Drei Components

Drei components that have different WebGL/WebGPU implementations (usually due to shader differences).

### Usage

```ts
// ✅ DO: Use #drei-platform for split drei components
import { ContactShadows, AccumulativeShadows } from '#drei-platform'
import { useFBO, MeshTransmissionMaterial } from '#drei-platform'

// ✅ DO: Import core components directly (they're renderer-agnostic)
import { OrbitControls } from '@react-three/drei/core'
import { Billboard } from '../Abstractions/Billboard'

// ❌ DON'T: Import platform components from legacy/webgpu directly in core
import { ContactShadows } from '../../../legacy/Materials/ContactShadows'
```

### Currently Split Components

Located in `src/utils/drei-platform.ts` and `src/utils/drei-platform-webgpu.ts`:

**Shadows:**

- `ContactShadows`, `ContactShadowsProps`
- `AccumulativeShadows`, `AccumulativeShadowsProps`
- `RandomizedLight`, `RandomizedLightProps`

**Materials:**

- `Caustics`
- `MeshTransmissionMaterial`
- `MeshReflectorMaterial`
- `MeshRefractionMaterial`
- `MeshPortalMaterial`
- `MeshDistortMaterial`
- `MeshWobbleMaterial`
- `Outlines`

**Effects & Helpers:**

- `Effects`
- `useFBO`

**Portal:**

- `RenderTexture`
- `RenderCubeTexture`
- `Hud`

**Cameras:**

- `CubeCamera`

### Adding a New Split Component

1. Ensure implementations exist in both `legacy/` and `webgpu/` tiers
2. Add export to **both** mapping files:

```ts
// src/utils/drei-platform.ts (WebGL)
export { MyComponent } from '../legacy/Category/MyComponent'
export type { MyComponentProps } from '../legacy/Category/MyComponent'

// src/utils/drei-platform-webgpu.ts (WebGPU)
export { MyComponent } from '../webgpu/Category/MyComponent'
export type { MyComponentProps } from '../webgpu/Category/MyComponent'
```

---

## Build Configuration

### TypeScript (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "#three": ["./node_modules/three"],
      "#three-addons": ["./src/utils/three-addons"],
      "#drei-platform": ["./src/utils/drei-platform"],
      "@core/*": ["./src/core/*"],
      "@legacy/*": ["./src/legacy/*"],
      "@webgpu/*": ["./src/webgpu/*"],
      "@external/*": ["./src/external/*"],
      "@experimental/*": ["./src/experimental/*"],
      "@utils/*": ["./src/utils/*"]
    }
  }
}
```

### Vite (for examples/development)

```ts
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '#three': 'three',
      '#three-addons': path.resolve(__dirname, '../src/utils/three-addons'),
      '#drei-platform': path.resolve(__dirname, '../src/utils/drei-platform'),
      '@core': path.resolve(__dirname, '../src/core'),
      '@legacy': path.resolve(__dirname, '../src/legacy'),
      '@webgpu': path.resolve(__dirname, '../src/webgpu'),
      '@external': path.resolve(__dirname, '../src/external'),
      '@experimental': path.resolve(__dirname, '../src/experimental'),
      '@utils': path.resolve(__dirname, '../src/utils'),
    },
  },
})
```

### obuild (for production builds)

Configure in `obuild.config.ts` to resolve aliases differently per entry:

```ts
// WebGL build
'#three-addons': './src/utils/three-addons.ts',
'#drei-platform': './src/utils/drei-platform.ts',

// WebGPU build
'#three-addons': './src/utils/three-addons-webgpu.ts',
'#drei-platform': './src/utils/drei-platform-webgpu.ts',
```

---

## Decision Tree

```
Need to import something?
│
├─ Three.js core (Vector3, Mesh, etc.)
│  └─ Use: import { X } from '#three'
│
├─ Three.js addon
│  ├─ Has webgpu/ variant? (check three/examples/jsm/path/webgpu/)
│  │  └─ Yes: Add to #three-addons, use: import { X } from '#three-addons'
│  │  └─ No:  Import directly: import { X } from 'three/examples/jsm/...'
│  │
├─ Drei component
│  ├─ In core/? (renderer-agnostic)
│  │  └─ Use relative import or @react-three/drei/core
│  ├─ In legacy/ AND webgpu/? (platform-specific)
│  │  └─ Add to #drei-platform, use: import { X } from '#drei-platform'
│  └─ Only in legacy/ or external/?
│     └─ Import from that tier: @react-three/drei/legacy
```

---

## FAQ

### Why not just duplicate components?

Duplication leads to drift. With aliases, `Stage.tsx` exists once in `core/` but automatically gets the right shadow implementation per build.

### What if a component isn't split yet?

Import it directly from its tier. When you create the WebGPU version, add both to the mapping files.

### How do I know if something needs splitting?

- **Three.js addons**: Check if `three/examples/jsm/[path]/webgpu/` exists
- **Drei components**: If it uses GLSL shaders, it probably needs a TSL (WebGPU) version
