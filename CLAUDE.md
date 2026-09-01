# Working in drei

drei is the helper library for [react-three-fiber](https://github.com/pmndrs/react-three-fiber). The `v11-working` branch is the v11 line: r3f v10, three ≥ 0.185, and a WebGL/WebGPU split.

Read this before changing anything. The architecture is not obvious from the file tree, and several rules below exist because breaking them ships a broken package.

## The renderer split

v11 supports **two renderers from one codebase**. That single fact drives the whole layout.

| Tree                | Contains                                               | Import via                       |
| ------------------- | ------------------------------------------------------ | -------------------------------- |
| `src/core/`         | Renderer-agnostic. Works on both. ~110 components.     | `@react-three/drei`              |
| `src/legacy/`       | WebGL-only. GLSL, `ShaderMaterial`, `onBeforeCompile`. | `@react-three/drei/legacy`       |
| `src/webgpu/`       | WebGPU-only. TSL, `NodeMaterial`.                      | `@react-three/drei/webgpu`       |
| `src/external/`     | Wrappers around third-party libs.                      | `@react-three/drei/external`     |
| `src/experimental/` | Rough, may change.                                     | `@react-three/drei/experimental` |
| `src/native/`       | React Native entry.                                    | `@react-three/drei/native`       |

The root entry re-exports `core + external + experimental` only. **`legacy` and `webgpu` are deliberately excluded from root** — pulling either into the root barrel breaks the other renderer's users.

### Build-time aliases — the mechanism

Renderer-agnostic code never imports `three` directly. It imports an alias that resolves differently per build:

| Alias            | WebGL build                  | WebGPU build                        |
| ---------------- | ---------------------------- | ----------------------------------- |
| `#three`         | `three`                      | `three/webgpu`                      |
| `#three-addons`  | `src/utils/three-addons.ts`  | `src/utils/three-addons-webgpu.ts`  |
| `#drei-platform` | `src/utils/drei-platform.ts` | `src/utils/drei-platform-webgpu.ts` |

Declared in three places that must stay in sync: `tsconfig.json`, `build.config.ts`, `.storybook/main.mts`.

**Rules:**

- In `core/`, import three through **`#three`**, never bare `'three'`.
- If a symbol exists in one renderer but not the other, do **not** reach for it through `#three` — route it through **`#drei-platform`**, which exports the right implementation per build.
- `legacy/` may import `'three'` directly. `webgpu/` may import `'three/webgpu'` and `'three/tsl'` directly.

That second rule is not theoretical. [#2764](https://github.com/pmndrs/drei/issues/2764) shipped a broken `/webgpu` entry because `core/Staging/Environment`, `core/Portal/RenderCubeTexture` and `core/Loaders/Preload` imported `WebGLCubeRenderTarget` from `#three` — a symbol `three/webgpu` does not export. The entry failed to _build_, taking r3f's own demos down with it.

`yarn test:bundles` catches this class of mistake. Run it.

## Component-as-a-Folder

Every component is a folder named for itself:

```
src/core/Staging/Environment/
├── Environment.tsx        # implementation
├── index.ts               # re-export
├── Environment.stories.tsx
├── Environment.test.ts
└── Environment.docs.mdx   # optional; feeds the generated docs
```

`scripts/audit-components.js` discovers components by this convention — a folder whose name matches a `.tsx`/`.ts` inside it. **Use it for anything new.**

Two older layouts also exist and the audit now understands both, because it previously did not and silently under-reported: `PivotControls`, `GizmoHelper`, `GizmoViewport` and `GizmoViewcube` are all root-exported public API and none of them appeared in `component-status.json`.

| Layout                                                         | Example                       | Keyed on    |
| -------------------------------------------------------------- | ----------------------------- | ----------- |
| `<Name>/<Name>.tsx`                                            | `Environment/Environment.tsx` | folder name |
| `<Name>/index.tsx` — implementation in the index               | `PivotControls/index.tsx`     | folder name |
| `<lowercase>/<Name>.tsx` — several components sharing a folder | `gizmo/GizmoHelper.tsx`       | file name   |

A folder whose `index.tsx` only re-exports is a barrel, not a component. Don't add new instances of the last two layouts — they describe what is already here.

## Component status is derived, never hand-written

`component-status.json` is **generated**. Do not edit it.

```bash
yarn audit:components          # regenerate
node scripts/audit-components.js --summary   # readable table
yarn test:components           # CI check; fails on drift
```

The only hand-maintained file is `component-overrides.json`, which holds `classification` and a required `reason` for anything deliberately not ported. A `wont-port` entry without a reason fails CI.

This exists because the previous hand-maintained registry drifted badly: it claimed 27 components still needed TSL conversion when 17 already had implementations, and marked all 139 as untested while 64 test files sat in the tree. **Trust the generated file over any prose claim about progress**, including in older docs.

## Testing

```bash
yarn test          # lint · typecheck · prettier · components · bundles · canary
yarn test:bundles  # entry-point import hygiene — the real integrity check
yarn storybook     # renderer toggle in the toolbar switches WebGL/WebGPU
```

To actually render every story headlessly (not wired into `yarn test` yet):

```bash
npx vitest run --config vite.config.mts   # 203 stories, ~25s
```

Stories default to the **WebGPU** renderer (`.storybook/preview.tsx`). Tag a WebGL-only story `legacyOnly` and pass `limitedTo="legacy"` to `<Setup>`.

The example app is a **separate project** with its own `node_modules`:

```bash
yarn --cwd examples install    # once
yarn examples          # WebGL
yarn examples:webgpu   # WebGPU
```

## Conventions

- **Time in `useFrame`**: use `state.elapsed`. `state.clock` is gone in r3f v10.
- **Renderer access**: prefer `state.renderer`. `state.gl` still works but is deprecated in r3f v10 and warns on every access — don't add new uses.
- **TSL node types**: `@types/three` 0.185 parameterises nodes over their node type with no constraint, so inference widens to `string`/`unknown`. Give explicit type arguments — `attribute<'vec3'>('noise', 'vec3')`, `varying<'vec2'>(uv())`, `THREE.UniformNode<'float', number>`. Without them every downstream swizzle stops resolving.
- **Renderer-specific APIs**: `R3FRenderer` is `WebGLRenderer | WebGPURenderer`, so anything only one of them has needs narrowing. See `getMaxAnisotropy()` in `src/utils/generic.ts` for the pattern.
- Don't add a `.d.ts`-style `declare const` for a build-time constant inside a module that uses it — but note the build injects these via `define`/replace, and `define` only reaches files under the consuming project's Vite root.

## Before you open a PR

1. `yarn test` passes.
2. `yarn build` succeeds and `dist/` contains all seven entries.
3. If you touched `core/`, confirm both renderers still work — the WebGPU entry breaking is the failure mode this architecture is most prone to.
4. Add a `CHANGELOG-ALPHA.md` entry under `## Unreleased` with a **Files changed** line.

## Releasing

Semantic-release publishes from branch pushes; there is no manual version bump.

| Branch   | Publishes        |
| -------- | ---------------- |
| `alpha`  | `11.0.0-alpha.N` |
| `beta`   | `11.0.0-beta.N`  |
| `rc`     | `11.0.0-rc.N`    |
| `master` | stable           |

Work happens on `v11-working` and merges to `alpha`. Commit types drive the version — `fix:` and `feat:` do, `chore:` and `docs:` do not.

**`dist/package.json` must never contain a `file:` or `link:` dependency.** It would break every consumer's install. alpha.6 nearly shipped one.

## Where things are tracked

- **Tasks**: GitHub issues, milestone _Version 11 (WebGPU)_, label `v11`. Use `gh`.
- **Effort labels**: `effort:S|M|L`; `agent-ok` vs `human-only`; `wont-port`.
- **Changelog**: `CHANGELOG-ALPHA.md` for the alpha cycle.
- **Contributor docs**: `devDocs/`.

`agent-ok` means the work is mechanical — API mapping, stories, docs. `human-only` means it needs a real GPU, visual judgement, or shader authorship. `scripts/audit-components.js` assigns these automatically based on whether a component's source contains GLSL, `onBeforeCompile`, or `ShaderMaterial`.
