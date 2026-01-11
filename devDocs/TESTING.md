# Testing Guide

This guide covers the testing strategy and commands for Drei.

---

## Overview

Drei uses a multi-layered testing approach:

| Test Type | Tool | What It Catches |
|-----------|------|-----------------|
| **Static Analysis** | ESLint, TypeScript, Prettier | Code quality, type errors, formatting |
| **Bundle Verification** | `verify-bundles.js` | THREE import correctness per entry point |
| **Canary Tests** | Vitest | Export map issues, import errors |
| **Visual Regression** | Chromatic | Visual changes in components |
| **Cross-Platform Parity** | Playwright (optional) | Legacy vs WebGPU visual differences |
| **Storybook Tests** | Vitest + Storybook | Component behavior, interaction tests |

---

## Quick Start

```bash
# Run all tests (after build)
yarn build && yarn test

# Run individual test suites
yarn test:lint      # ESLint + TypeScript + Prettier
yarn test:bundles   # Bundle structure verification
yarn test:canary    # Import verification tests
```

---

## Test Commands

### `yarn test`

Runs the full test suite:
1. `yarn test:lint` - Static analysis
2. `yarn test:bundles` - Bundle verification
3. `yarn test:canary` - Import canary tests

**Note:** Requires `yarn build` to complete first (bundle tests need `dist/`).

---

### `yarn test:lint`

Static analysis checks:

```bash
yarn eslint:ci   # ESLint (no auto-fix)
yarn typecheck   # TypeScript --noEmit
yarn prettier    # Prettier check
```

**When to run:** Before committing, or when CI fails on formatting.

---

### `yarn test:bundles`

Runs `scripts/verify-bundles.js` to verify bundle correctness.

**What it checks:**
- Each entry point (`core`, `legacy`, `webgpu`, etc.) has correct THREE imports
- `legacy/` has no `three/webgpu` or `three/tsl` imports (WebGL only)
- `webgpu/` has no plain `three` imports (only `three/webgpu`)
- Root entry is renderer-agnostic

**Example output:**

```
🔍 Drei Bundle Analysis Report
============================================================

📦 Legacy entry (@react-three/drei/legacy)
------------------------------------------------------------
   📄 Entry: dist/legacy/legacy/index.mjs
   📊 Files analyzed: 45

   Forbidden imports:
   ✅ Does not contain: from 'three/webgpu'
   ✅ Does not contain: from 'three/tsl'

   📝 Legacy entry should only have WebGL (no WebGPU imports)
```

**When to run:** After build, before release. CI runs this automatically.

---

### `yarn test:canary`

Runs Vitest canary tests that verify the built package works:

```bash
yarn test:canary
```

**What it checks:**
- All entry points are importable (`index.js`, `core/index.js`, etc.)
- Key exports exist (OrbitControls, Environment, materials, etc.)
- CJS entry points exist (`index.cjs.js`)
- TypeScript declarations exist (`.d.ts` files)

**Location:** `test/canary/imports.test.ts`

**When to run:** After build. These catch export map issues that would break users.

---

### `yarn test:e2e` (Legacy)

Runs the heavyweight E2E test that creates fresh apps:

```bash
yarn test:e2e
```

**What it does:**
- Creates a temp Vite React app, installs drei, tests rendering
- Creates a temp Next.js app, installs drei, tests rendering
- Creates a temp CJS Next.js app, tests CommonJS compatibility

**When to run:** Rarely needed. The canary tests + Chromatic cover most cases. Use this for deep integration debugging.

**Note:** This is the old test flow and may be deprecated in the future.

---

## Visual Regression (Chromatic)

Drei uses [Chromatic](https://www.chromatic.com/) for visual regression testing.

**How it works:**
1. Every Storybook story is a visual test
2. Chromatic snapshots each story on every PR
3. Visual changes are flagged for review

**For contributors:**
- Every component should have at least one story
- Stories should show key visual states
- Chromatic runs automatically in CI

**Reviewing visual changes:**
- Chromatic will comment on PRs with visual diffs
- Approve expected changes, reject unexpected ones
- See the Chromatic dashboard for detailed comparisons

---

## Test Environment Detection

Drei provides a provider-agnostic `isTesting()` utility that detects various test environments without coupling to specific providers.

### Location

```
.storybook/testing.ts
```

### Usage

```typescript
import { isTesting, getTestEnvironment, shouldFreezeAnimations } from '@sb/Setup';

// Simple boolean check
if (isTesting()) {
  // We're in a test environment
}

// Full environment info
const env = getTestEnvironment();
// env.isTesting       - any test environment
// env.isChromatic     - Chromatic visual tests
// env.isPlaywright    - Playwright tests
// env.isVitest        - Vitest unit tests
// env.shouldFreezeAnimations - should we pause animations?
// env.runner          - 'chromatic' | 'playwright' | 'vitest' | null

// React hook version
function MyComponent() {
  const { shouldFreezeAnimations } = useTestEnvironment();
  return <CameraShake intensity={shouldFreezeAnimations ? 0 : 1} />;
}
```

### Detected Environments

| Environment | Detection Method |
|-------------|------------------|
| Chromatic | `CHROMATIC=true` env var, userAgent check |
| Playwright | `PLAYWRIGHT=true` env var, `window.__playwright__` |
| Vitest | `VITEST=true` env var, `import.meta.vitest` |
| Cypress | `window.Cypress` |

### Behavioral Flags

The utility provides behavioral flags that determine what should happen in each test environment:

| Flag | True When | Use For |
|------|-----------|---------|
| `shouldFreezeAnimations` | Chromatic, Playwright | Pause render loop for consistent snapshots |
| `shouldDisableTransitions` | Chromatic | Disable CSS transitions |
| `shouldSkipDelays` | Vitest | Make unit tests fast |

---

## Animation Freezing

For visual tests to be deterministic, animations must be paused. The `<Setup>` component handles this automatically.

### How It Works

1. `getTestEnvironment()` detects if we're in a visual test runner
2. If `shouldFreezeAnimations` is true, `<SchedulerPause>` is rendered
3. `<SchedulerPause>` uses R3F v10's `set({ frameloop: 'never' })` to stop the render loop

### Manual Override

```tsx
// Force animations to freeze
<Setup freezeAnimations={true}>
  <MyScene />
</Setup>

// Force animations to run (even in tests)
<Setup freezeAnimations={false}>
  <MyScene />
</Setup>
```

### In Components

For components with internal animations that need test awareness:

```tsx
import { shouldFreezeAnimations } from '@sb/Setup';

function AnimatedComponent({ intensity = 1 }) {
  const actualIntensity = shouldFreezeAnimations() ? 0 : intensity;
  return <CameraShake intensity={actualIntensity} />;
}
```

---

## Cross-Platform Testing (Hidden Variants)

To test that Legacy (WebGL) and WebGPU renders look identical, we can create hidden story variants that Chromatic captures but don't clutter the Storybook UI.

### Creating Platform Variants

```typescript
import { createPlatformVariant, createPlatformVariants } from '@sb/Setup';

// Base story (visible in Storybook)
export const Default = {
  render: (args) => <Billboard {...args} />,
} satisfies Story;

// Hidden variants for Chromatic (not visible in Storybook sidebar)
export const DefaultLegacy = createPlatformVariant(Default, 'legacy');
export const DefaultWebGPU = createPlatformVariant(Default, 'webgpu');
```

### Batch Generation

For stories with many exports:

```typescript
import { generatePlatformVariants } from '@sb/Setup';

// Create variants for multiple stories at once
const variants = generatePlatformVariants({
  Default: DefaultStory,
  WithProps: WithPropsStory,
  Complex: ComplexStory,
});

export const DefaultLegacy = variants.DefaultLegacy;
export const DefaultWebGPU = variants.DefaultWebGPU;
// ... etc
```

### How Hidden Variants Work

The variant helpers add these tags:
- `!dev` - Hidden from development sidebar
- `!autodocs` - Hidden from auto-generated docs  
- `test` - Marked as test story
- `legacyOnly` or `webgpuOnly` - Platform badge

Chromatic ignores the `!dev` tag and captures all stories, so these variants are tested but don't clutter the UI.

### Chromatic Parameters

```typescript
import { withChromaticParams } from '@sb/Setup';

export const LoadingStory = {
  render: () => <Environment preset="city" />,
  parameters: {
    ...withChromaticParams({
      delay: 1000,        // Wait for HDR to load
      diffThreshold: 0.2, // Allow slight differences
    }),
  },
} satisfies Story;
```

---

## CI Flow

The GitHub Actions workflow (`.github/workflows/release.yml`) runs:

```yaml
jobs:
  lint:     # Fast static analysis (parallel)
    - yarn test:lint

  test:     # Build + verify (parallel with lint)
    - yarn build
    - yarn test:bundles
    - yarn test:canary

  build-and-release:  # Only after lint + test pass
    - yarn build
    - yarn build-storybook
    - yarn release
```

**Why split jobs?**
- `lint` is fast and doesn't need `dist/`
- `test` needs build output
- Running them in parallel speeds up CI
- Release only happens if both pass

---

## Writing Tests

### Canary Tests

Add to `test/canary/imports.test.ts`:

```typescript
describe('New Entry - @react-three/drei/newentry', () => {
  it('should export new components', async () => {
    const mod = await importDist('newentry/index.js');
    expect(mod.NewComponent).toBeDefined();
  });
});
```

### Bundle Verification

Edit `scripts/verify-bundles.js` to add new entry points:

```javascript
const checks = [
  // ...existing checks
  {
    name: 'New entry (@react-three/drei/newentry)',
    file: 'newentry/newentry/index.mjs',
    shouldNotContain: ["from 'three/webgpu'"],
    notes: 'New entry description',
  },
]
```

### Storybook Stories (Visual Tests)

Stories double as visual tests via Chromatic. See [Storybook Guide](../.storybook/README.md).

---

## Troubleshooting

### "dist folder not found"

Run `yarn build` before running tests that need the build output:

```bash
yarn build && yarn test
```

### Canary tests fail with "Cannot find module"

The dist structure may have changed. Check:
1. `dist/` folder exists
2. Entry point paths in `test/canary/imports.test.ts` match actual paths
3. `package.json` exports field matches dist structure

### Bundle verification fails

Check the specific entry point that failed:
- **"Found plain 'three' import in webgpu/"** - A WebGPU component imports from `three` instead of `three/webgpu`
- **"Found 'three/webgpu' import in legacy/"** - A legacy component imports WebGPU code

Fix the import in the source file and rebuild.

### Visual diffs in Chromatic

1. Check if the change is expected (e.g., you updated a component)
2. If expected, approve in Chromatic dashboard
3. If unexpected, investigate the component changes

---

## File Reference

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Vitest config for canary tests |
| `test/canary/imports.test.ts` | Canary import tests |
| `scripts/verify-bundles.js` | Bundle verification script |
| `test/e2e/` | Legacy E2E tests (may be deprecated) |
| `.github/workflows/release.yml` | CI workflow |
| `.storybook/vitest.setup.ts` | Storybook + Vitest integration |
| `.storybook/testing.ts` | Test environment detection (`isTesting()`, etc.) |
| `.storybook/variants.ts` | Hidden variant helpers for Chromatic |
| `.storybook/Setup.tsx` | Story decorator with test integration |

