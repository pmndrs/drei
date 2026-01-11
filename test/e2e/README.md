# Legacy E2E Tests

> **⚠️ These tests are largely superseded by the new testing strategy.**
> See [devDocs/TESTING.md](../../devDocs/TESTING.md) for the current approach.

---

## What These Tests Do

The `e2e.sh` script creates fresh React apps and installs the drei package to verify real-world integration:

1. **Vite app** - ESM imports
2. **Next.js app** - SSR/bundler compatibility  
3. **CJS Next.js app** - CommonJS compatibility

Each app renders a simple scene with `<Sphere>`, `<Environment>`, and `<CameraControls>`, then takes a Playwright screenshot.

---

## When to Use

These tests are **heavyweight** (create temp apps, npm install, build). Use them for:

- Deep integration debugging
- Verifying bundler-specific issues
- Troubleshooting "works in dev, breaks in production" problems

For regular CI, use the lighter canary tests:
```bash
yarn test:canary
```

---

## Running

```bash
# From repo root
yarn test:e2e

# Or directly
cd test/e2e && ./e2e.sh
```

**Requirements:**
- `yarn build` must complete first
- Shell environment (bash)
- Node.js, npm

---

## Why Legacy?

The new testing strategy provides:

| Old (E2E) | New (Canary + Chromatic) |
|-----------|--------------------------|
| Slow (creates 3 apps) | Fast (imports dist directly) |
| 1 visual snapshot | 100+ stories via Chromatic |
| Requires Docker in CI | No special containers |
| Tests installation | Tests exports + visuals |

The canary tests (`test/canary/`) catch export map issues without the overhead. Chromatic catches visual regressions across all components.

---

## Files

| File | Purpose |
|------|---------|
| `e2e.sh` | Main test script |
| `App.tsx` | Test scene (copied to temp apps) |
| `snapshot.test.ts` | Playwright test |
| `snapshot.test.ts-snapshots/` | Baseline screenshots |

