# Example → Test Workflow

Quick reference for converting working examples into tests.

## TL;DR

```
1. Create example demo → examples/src/demos/[tier]/[category]/Component.tsx
2. Register in App.tsx → import + add to demos array
3. Test visually → yarn dev → http://localhost:3000
4. Copy to test file → src/[tier]/[Category]/Component/Component.test.tsx
5. Update status → examples/src/ComponentCatalog.tsx
```

---

## Step 1: Create Example

```tsx
// examples/src/demos/core/geometry/RoundedBox.tsx
import { RoundedBox } from '@react-three/drei/core'
import Scene from '../../../components/Scene'

export default function RoundedBoxDemo() {
  return (
    <div className="demo-container">
      <div className="demo-info">
        <h2>RoundedBox</h2>
        <p>A box with rounded edges.</p>
      </div>
      <div className="demo-canvas">
        <Scene>
          <RoundedBox args={[1, 1, 1]} radius={0.1}>
            <meshStandardMaterial color="hotpink" />
          </RoundedBox>
        </Scene>
      </div>
    </div>
  )
}
```

### File Location Pattern

| Tier | Location |
|------|----------|
| core | `demos/core/[category]/ComponentName.tsx` |
| legacy | `demos/legacy/[category]/ComponentName.tsx` |
| webgpu | `demos/webgpu/[category]/ComponentName.tsx` |
| external | `demos/external/ComponentName.tsx` |
| experimental | `demos/experimental/ComponentName.tsx` |

---

## Step 2: Register in App.tsx

```tsx
// examples/src/App.tsx

// 1. Add import at top
import RoundedBoxDemo from './demos/core/geometry/RoundedBox'

// 2. Add to demos array
const demos: Demo[] = [
  // ... existing demos
  { 
    path: '/core/geometry/roundedbox', 
    name: 'RoundedBox', 
    component: RoundedBoxDemo, 
    tier: 'core', 
    category: 'Geometry' 
  },
]
```

---

## Step 3: Test Visually

```bash
cd examples
yarn dev
# Open http://localhost:3000/core/geometry/roundedbox
```

---

## Step 4: Copy to Test File

```tsx
// src/core/Geometry/RoundedBox/RoundedBox.test.tsx
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { RoundedBox } from './RoundedBox'

describe('RoundedBox', () => {
  it('renders without crashing', () => {
    render(
      <Canvas>
        <RoundedBox args={[1, 1, 1]} radius={0.1}>
          <meshStandardMaterial />
        </RoundedBox>
      </Canvas>
    )
  })

  it('accepts custom dimensions', () => {
    const { container } = render(
      <Canvas>
        <RoundedBox args={[2, 3, 4]} radius={0.2} />
      </Canvas>
    )
    expect(container).toBeTruthy()
  })

  // Add more specific tests based on component behavior
})
```

### Test File Location

The test goes next to the component:
```
src/core/Geometry/RoundedBox/
├── RoundedBox.tsx
├── RoundedBox.test.tsx  ← Put test here
└── index.ts
```

---

## Step 5: Update Status

Edit `examples/src/ComponentCatalog.tsx`:

```tsx
// Find the component entry and update statuses
{ 
  name: 'RoundedBox', 
  tier: 'core', 
  category: 'Geometry', 
  examplePath: '/core/geometry/roundedbox', 
  structure: '🟢', 
  imports: '🟢', 
  types: '🟢', 
  example: '🟢',  // ← Update this
  tests: '🟢',    // ← And this
  notes: 'Example and tests complete' 
},
```

---

## Commands

| Command | Description |
|---------|-------------|
| `yarn dev` | Run examples dev server (from examples/) |
| `yarn test` | Run all tests (from root) |
| `yarn test:watch` | Run tests in watch mode |
| `yarn build` | Build drei (for verifying imports work) |

---

## Tips

- **Use Scene template** for simple demos - includes lighting, grid, orbit controls
- **Build custom Canvas** for camera/controls demos that need specific setup
- **Three imports**: Use `'three'` directly in examples (not `'#three'`)
- **Drei imports**: Use tier-specific: `'@react-three/drei/core'`, `'@react-three/drei/legacy'`, etc.
- **Check the catalog** at `/catalog` to see what needs work next

