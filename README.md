[![Storybook](https://img.shields.io/static/v1?message=Storybook&style=flat&colorA=000000&colorB=000000&label=&logo=storybook&logoColor=ffffff)](https://drei.pmnd.rs/)
[![Version](https://img.shields.io/npm/v/@react-three/drei?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@react-three/drei)
[![Downloads](https://img.shields.io/npm/dt/@react-three/drei.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@react-three/drei)
[![Discord Shield](https://img.shields.io/discord/740090768164651008?style=flat&colorA=000000&colorB=000000&label=discord&logo=discord&logoColor=ffffff)](https://discord.com/channels/740090768164651008/741751532592038022)
[![Open in GitHub Codespaces](https://img.shields.io/static/v1?&message=Open%20in%20%20Codespaces&style=flat&colorA=000000&colorB=000000&label=GitHub&logo=github&logoColor=ffffff)](https://github.com/codespaces/new?template_repository=pmndrs%2Fdrei)

[![logo](docs/logo.jpg)](https://codesandbox.io/s/bfplr)

A growing collection of useful helpers and fully functional, ready-made abstractions for [@react-three/fiber](https://github.com/pmndrs/react-three-fiber).

If you make a component that is generic enough to be useful to others, think about [CONTRIBUTING](CONTRIBUTING.md)!

```bash
npm install @react-three/drei
```

> [!IMPORTANT]
> this package is using the stand-alone [`three-stdlib`](https://github.com/pmndrs/three-stdlib) instead of [`three/examples/jsm`](https://github.com/mrdoob/three.js/tree/master/examples/jsm).

## Basic usage

### Standard Import (Recommended)

```jsx
import { PerspectiveCamera, OrbitControls, Environment } from '@react-three/drei'
```

The root import includes renderer-agnostic components (core + external + experimental).

### Entry Points (v11+)

Drei v11 introduces multiple entry points for better tree-shaking and renderer-specific code:

```jsx
// Renderer-agnostic components (works with both WebGL and WebGPU)
import { OrbitControls, Environment } from '@react-three/drei' // All
import { OrbitControls } from '@react-three/drei/core' // Core only
import { Bvh } from '@react-three/drei/external' // External wrappers
import { MarchingCubes } from '@react-three/drei/experimental' // Experimental

// Platform-specific components
import { MeshDistortMaterial, Fbo } from '@react-three/drei/legacy' // WebGL only
import { MeshDistortMaterial, Fbo } from '@react-three/drei/webgpu' // WebGPU only
```

**When to use each:**

- **Root import**: Best for most projects, includes all renderer-agnostic components
- **/core**: Smallest bundle, production-ready components only
- **/external**: External library wrappers (Bvh, CameraControls, etc.)
- **/experimental**: Rough/experimental features
- **/legacy**: WebGL-specific implementations (GLSL materials, WebGLRenderTarget)
- **/webgpu**: WebGPU-specific implementations (TSL materials, WebGPU render targets)

See [MIGRATION_V10_TO_V11.md](MIGRATION_V10_TO_V11.md) for details.

## React-native

```jsx
import { PerspectiveCamera, PositionalAudio, ... } from '@react-three/drei/native'
```

The `native` route of the library **does not** export `Html` or `Loader`. The default export of the library is `web` which **does** export `Html` and `Loader`.

## Documentation

https://pmndrs.github.io/drei

<details>
  <summary>Old doc</summary>

> [!WARNING]
> Below is an archive of the anchors links with their new respective locations to the documentation website.
> Do not update the links below, they are for reference only.

## Dev

### INSTALL

```sh
$ corepack enable
$ yarn install
```

### Test

#### Local

Pre-requisites:

- ```sh
  $ npx playwright install
  ```

To run visual tests locally:

```sh
$ yarn build
$ yarn test
```

To update a snapshot:

```sh
$ PLAYWRIGHT_UPDATE_SNAPSHOTS=1 yarn test
```

#### Docker

> [!IMPORTANT]
> Snapshots are system-dependent, so to run playwright in the same environment as the CI:

```sh
$ docker run --init --rm \
    -v $(pwd):/app -w /app \
    ghcr.io/pmndrs/playwright:drei \
      sh -c "corepack enable && yarn install && yarn build && yarn test"
```

To update a snapshot:

```sh
$ docker run --init --rm \
    -v $(pwd):/app -w /app \
    -e PLAYWRIGHT_UPDATE_SNAPSHOTS=1 \
    ghcr.io/pmndrs/playwright:drei \
      sh -c "corepack enable && yarn install && yarn build && yarn test"
```
