# Drei v11 Examples

Visual development environment for testing and developing Drei components.

## Getting Started

```bash
# From this directory (examples/)
yarn install    # Install dependencies (first time only)
yarn dev        # Start dev server
```

Then open http://localhost:3000

> Vite imports directly from `../src/` via aliases, so drei source changes are picked up immediately!

## Workflow

1. **Start**: Run `yarn dev` in examples folder
2. **Create**: Add new demo in `src/demos/[tier]/[category]/ComponentName.tsx`
3. **Register**: Import and add to `demos` array in `src/App.tsx`
4. **Test**: View in browser, make changes, see updates live
5. **Copy**: Once working, copy demo code to component test file

## Structure

```
examples/
├── src/
│   ├── components/
│   │   └── Scene.tsx           # Reusable scene template
│   ├── demos/
│   │   ├── core/               # Core tier demos
│   │   ├── legacy/             # Legacy tier demos
│   │   ├── webgpu/             # WebGPU tier demos
│   │   ├── external/           # External tier demos
│   │   └── experimental/       # Experimental tier demos
│   ├── App.tsx                 # Router and navigation
│   └── main.tsx                # Entry point
└── package.json
```

## Creating a New Demo

### 1. Create the demo file

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

### 2. Register in App.tsx

```tsx
// Import
import RoundedBoxDemo from './demos/core/geometry/RoundedBox'

// Add to demos array
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

### 3. View in browser

Navigate to http://localhost:3000/core/geometry/roundedbox

## Using the Scene Template

The `<Scene>` component provides a ready-to-use environment:

```tsx
import Scene from '../../../components/Scene'

<Scene
  camera={{ position: [5, 5, 5], fov: 50 }}
  showGrid={true}
  showOrbitControls={true}
>
  {/* Your component here */}
</Scene>
```

Or build your own canvas setup for specialized needs (like camera components).

## Tips

- **Hot reload**: Changes to demos AND drei source update instantly (Vite magic!)
- **Console**: Use browser DevTools for debugging
- **Three imports**: Import from `'three'` directly, not `'#three'`
- **Drei imports**: Use tier-specific imports: `'@react-three/drei/core'`
- **Copy to tests**: Once working, copy demo to component's `.test.tsx` file

## Next Steps

After creating a working demo:
1. ✅ Verify it works visually
2. ✅ Copy the setup to the component's test file
3. ✅ Add proper assertions to the test
4. ✅ Update `COMPONENT_STATUS.md` with 🟢 status

