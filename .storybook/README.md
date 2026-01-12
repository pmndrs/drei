# Storybook Guide

This guide covers how to write and run Storybook stories for Drei components.

---

## Running Storybook

```bash
yarn storybook
```

This picks up all `*.stories.tsx` files across all platforms (`/core`, `/legacy`, `/webgpu`, `/external`, `/experimental`).

---

## Story Structure

Stories are co-located with their components:

```
src/core/Category/ComponentName/
  ├── index.ts
  ├── ComponentName.tsx
  └── ComponentName.stories.tsx  # Story file
```

### Basic Story Template

```tsx
import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react-vite'

import { Setup } from '@sb/Setup'
import { MyComponent, OrbitControls } from 'drei'

export default {
  title: 'Category/MyComponent',
  component: MyComponent,
  decorators: [
    (Story, context) => (
      <Setup renderer={context.globals.renderer} controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof MyComponent>

type Story = StoryObj<typeof MyComponent>

export const Default = {
  render: (args) => (
    <>
      <MyComponent {...args} />
      <OrbitControls />
    </>
  ),
  name: 'Default',
} satisfies Story
```

---

## Imports

### The `drei` Alias

In Storybook, use the `drei` alias to import components:

```tsx
import { OrbitControls, Environment, MeshDistortMaterial } from 'drei'
```

This alias maps to a combined export file (`.storybook/drei-exports.ts`) that includes everything from core, external, experimental, and legacy. It's a Storybook convenience — in production, users import from specific entry points.

### Platform-Specific Imports

For dual components that need platform-specific implementations, import directly from the platform:

```tsx
// When you need the WebGPU-specific version
import { FakeCloudMaterial } from '../../../webgpu/Materials/FakeCloudMaterial'

// Or use the path aliases
import { ContactShadows } from '@legacy/Staging/ContactShadows'
import { ContactShadows } from '@webgpu/Staging/ContactShadows'
```

**Why?** Storybook doesn't go through the production build, so platform aliases like `#drei-platform` resolve to the WebGL version by default. For dual components, you may need to explicitly import and switch.

---

## Platform Switching

### Global Renderer Toggle

There's a renderer toggle in the Storybook toolbar (CPU icon). It switches between:
- **Legacy** — WebGL renderer
- **WebGPU** — WebGPU renderer

The current value is available via `context.globals.renderer` in decorators.

### Setup Component

The `<Setup>` decorator handles canvas creation with the right renderer:

```tsx
import { Setup } from '@sb/Setup'

decorators: [
  (Story, context) => (
    <Setup 
      renderer={context.globals.renderer}  // 'legacy' or 'webgpu'
      controls={true}                       // Include OrbitControls
      lights={true}                         // Include default lighting
      floor={true}                          // Include grid floor
      cameraPosition={new Vector3(0, 0, 10)}
      cameraFov={75}
    >
      <Story />
    </Setup>
  ),
]
```

### PlatformSwitch Component

For components that need different JSX based on the active renderer:

```tsx
import { PlatformSwitch } from '@sb/components/PlatformSwitch'

<PlatformSwitch
  legacy={<Cloud materialFactory={LegacyCloudMaterial} />}
  webgpu={<Cloud materialFactory={WebGPUCloudMaterial} />}
/>
```

`PlatformSwitch` uses R3F's `useThree().isLegacy` to detect the renderer at runtime.

### Limiting Stories to a Platform

For stories that only work on one platform:

```tsx
export const MyStory = {
  render: (args) => <MyScene {...args} />,
  name: 'WebGPU Feature',
  parameters: {
    limitedTo: 'webgpu',  // or 'legacy'
  },
  tags: ['webgpuOnly'],  // Shows badge in sidebar
} satisfies Story
```

The `limitedTo` parameter is read by the `<Setup>` decorator and forces that renderer.

### Component Injection Pattern

Some components use platform-specific dependencies internally (like materials or sub-components). Since Storybook doesn't resolve platform aliases correctly at dev time, these components support **injection props** to override the internal implementation.

#### LineComponent Injection

Components using `Line` internally accept a `LineComponent` prop:

```tsx
import { PlatformSwitch } from '@sb/components/PlatformSwitch'
import { CatmullRomLine, QuadraticBezierLine, CubicBezierLine, Edges } from 'drei'
import { Line as WebGPULine } from '@webgpu/Geometry/Line/Line'

// Bezier line components
<PlatformSwitch
  legacy={<CatmullRomLine points={points} />}
  webgpu={<CatmullRomLine points={points} LineComponent={WebGPULine as any} />}
/>

// Edges component
<PlatformSwitch
  legacy={<Edges threshold={15} />}
  webgpu={<Edges threshold={15} LineComponent={WebGPULine as any} />}
/>

// PivotControls (uses Line internally for gizmo lines)
<PlatformSwitch
  legacy={<PivotControls />}
  webgpu={<PivotControls LineComponent={WebGPULine as any} />}
/>
```

**Components with LineComponent prop:**
- `CatmullRomLine`, `QuadraticBezierLine`, `CubicBezierLine`
- `Edges`
- `PivotControls`
- `Facemesh`

#### materialFactory Injection

Components with platform-specific materials accept a `materialFactory` prop:

```tsx
import { PlatformSwitch } from '@sb/components/PlatformSwitch'
import { Cloud, Clouds } from 'drei'
import { CloudMaterial as LegacyCloudMaterial } from '@legacy/Materials/CloudMaterial'
import { CloudMaterial as WebGPUCloudMaterial } from '@webgpu/Materials/CloudMaterial'

<PlatformSwitch
  legacy={<Clouds materialFactory={LegacyCloudMaterial}><Cloud /></Clouds>}
  webgpu={<Clouds materialFactory={WebGPUCloudMaterial}><Cloud /></Clouds>}
/>
```

**Components with materialFactory prop:**
- `Clouds`

#### Why Injection?

These injection props exist because:
1. Platform aliases (`#drei-platform`) resolve to WebGL by default in Storybook's dev server
2. Some components use materials/sub-components that are fundamentally different between WebGL and WebGPU
3. Injection allows the story to explicitly provide the correct implementation at runtime

**Note:** End users don't need these props — the production build correctly resolves platform aliases. These are primarily for Storybook development.

---

## Tags & Badges

Tags control the badges shown in the Storybook sidebar and toolbar. Add them to individual stories or the default export.

| Tag | Badge | When to use |
|-----|-------|-------------|
| `legacyOnly` | Legacy Only (yellow) | Component only works with WebGL |
| `webgpuOnly` | WebGPU Only (blue) | Component only works with WebGPU |
| `dual` | Dual (teal) | Works on both, but needs platform-specific imports |
| `experimental` | Experimental (default) | Rough/unstable component |

### Usage

```tsx
// On the default export (applies to all stories)
export default {
  title: 'Materials/MeshDistortMaterial',
  component: MeshDistortMaterial,
  tags: ['dual'],
  // ...
} satisfies Meta<typeof MeshDistortMaterial>

// On individual stories
export const WebGPUOnly = {
  render: (args) => <MyScene {...args} />,
  tags: ['webgpuOnly'],
} satisfies Story
```

---

## Show Code (Docs)

Storybook's "Show code" feature displays source code in the Docs tab. There are two approaches:

### Auto-Extract (Simple Scenes)

For simple inline renders, Storybook auto-extracts the JSX:

```tsx
export const Simple = {
  render: (args) => (
    <Billboard {...args}>
      <Plane args={[3, 2]} material-color="red" />
    </Billboard>
  ),
} satisfies Story
```

The preview config extracts the JSX from the render function automatically.

### Manual Code Block (Complex Scenes)

When your render calls a scene function like `<MyScene />`, the auto-extract isn't helpful. Provide an explicit code snippet:

```tsx
function ComplexScene(props) {
  return (
    <>
      <Billboard {...props} position={[0, 0, 0]}>
        <Plane args={[3, 2]} material-color="red" />
      </Billboard>
      <OrbitControls />
    </>
  )
}

export const Complex = {
  render: (args) => <ComplexScene {...args} />,
  name: 'Complex Example',
  parameters: {
    docs: {
      source: {
        code: `
<Billboard follow={true} lockX={false} position={[0, 0, 0]}>
  <Plane args={[3, 2]} material-color="red" />
</Billboard>
        `.trim(),
      },
    },
  },
} satisfies Story
```

**Tip:** The manual code block should show the essential usage pattern, not necessarily the full scene code.

---

## Args & Controls

Use Storybook args for interactive controls:

```tsx
export default {
  title: 'Staging/Billboard',
  component: Billboard,
  args: {
    follow: true,
    lockX: false,
    lockY: false,
  },
  argTypes: {
    follow: { control: 'boolean' },
    lockX: { control: 'boolean' },
    lockY: { control: 'boolean' },
  },
} satisfies Meta<typeof Billboard>
```

Then spread args in your render:

```tsx
render: (args) => <Billboard {...args}>...</Billboard>
```

---

## Combining Stories

For simple related components (like shape variants), consider combining stories in one file rather than creating separate files for each:

```tsx
// Good: One file for related shapes
export const BoxShape = { render: () => <Box /> }
export const SphereShape = { render: () => <Sphere /> }
export const CylinderShape = { render: () => <Cylinder /> }

// Avoid: Separate files for every variant (gets tedious)
```

---

## File Reference

| File | Purpose |
|------|---------|
| `.storybook/main.ts` | Storybook config, aliases, addons |
| `.storybook/preview.tsx` | Global decorators, renderer toggle, auto-extract config |
| `.storybook/manager.ts` | Sidebar config, tag badges |
| `.storybook/Setup.tsx` | Canvas decorator with renderer switching |
| `.storybook/components/PlatformSwitch.tsx` | Runtime platform detection component |
| `.storybook/drei-exports.ts` | Combined exports for the `drei` alias |
| `.storybook/theme.ts` | Storybook theme |

---

## Troubleshooting

### Story shows wrong platform version

Make sure you're either:
1. Using `<PlatformSwitch>` to render platform-specific content
2. Importing directly from the platform folder (`@legacy/...` or `@webgpu/...`)

### "Show code" shows `<MyScene />`

Your render function calls a component. Add a manual `parameters.docs.source.code` block with the essential usage pattern.

### Component doesn't render in WebGPU

Check if it's a dual component that needs `#drei-platform`. In Storybook, you may need to explicitly import from `@webgpu/...`.

---

## Related Docs

- [Platform Aliases](../devDocs/building/PLATFORM_ALIASES.md) — How `#three` and `#drei-platform` work
- [Migration Guide](../devDocs/MIGRATION_V10_TO_V11.md) — v11 architecture overview

