# Getting Started with Drei v11 Development

Welcome! This guide will get you up and running with the new visual development workflow.

## 🚀 Quick Start

### 1. Install Examples Dependencies

```bash
cd examples
yarn install
```

### 2. Start Development

```bash
# In the examples folder
yarn dev
```

The examples will open at **http://localhost:3000**

> **Note**: Vite imports directly from `src/` via aliases, so changes to drei source files are picked up immediately - no separate watch/build step needed!

## 📖 Development Workflow

### Step-by-Step: Adding a Component Example

Let's walk through creating an example for `RoundedBox`:

#### 1. Create the Demo File

Create: `examples/src/demos/core/geometry/RoundedBox.tsx`

```tsx
import { RoundedBox } from '@react-three/drei/core'
import Scene from '../../../components/Scene'

export default function RoundedBoxDemo() {
  return (
    <div className="demo-container">
      <div className="demo-info">
        <h2>RoundedBox</h2>
        <p>A box geometry with rounded edges. Perfect for smooth, modern UI elements.</p>
      </div>

      <div className="demo-canvas">
        <Scene>
          <RoundedBox args={[1, 1, 1]} radius={0.05} smoothness={4}>
            <meshStandardMaterial color="hotpink" />
          </RoundedBox>
        </Scene>
      </div>
    </div>
  )
}
```

#### 2. Register in App.tsx

Add to `examples/src/App.tsx`:

```tsx
// At top with other imports
import RoundedBoxDemo from './demos/core/geometry/RoundedBox'

// In the demos array
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

#### 3. View in Browser

Navigate to: http://localhost:3000/core/geometry/roundedbox

🎉 **That's it!** Your component is now live. Make changes, see them instantly.

#### 4. Copy to Test

Once working, copy to `src/core/Geometry/RoundedBox/RoundedBox.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Canvas } from '@react-three/fiber'
import { RoundedBox } from './RoundedBox'

describe('RoundedBox', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <Canvas>
        <RoundedBox args={[1, 1, 1]} radius={0.05}>
          <meshStandardMaterial />
        </RoundedBox>
      </Canvas>
    )
    expect(container).toBeTruthy()
  })
})
```

#### 5. Update Status

Mark in `COMPONENT_STATUS.md`:

```markdown
| RoundedBox | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | ⚪ | Complete! |
```

---

## 🎨 Using the Scene Template

The `<Scene>` component provides a ready-to-use environment:

```tsx
import Scene from '../../../components/Scene'

<Scene
  camera={{ position: [5, 5, 5], fov: 50 }}  // Default camera
  showGrid={true}                              // Show/hide grid
  showOrbitControls={true}                     // Show/hide controls
>
  {/* Your component here */}
</Scene>
```

### When NOT to Use Scene Template

For components that **are** cameras or controls, build your own Canvas:

```tsx
import { Canvas } from '@react-three/fiber'

<Canvas>
  <YourCameraComponent makeDefault />
  {/* scene content */}
</Canvas>
```

---

## 📁 Project Structure

```
examples/
├── src/
│   ├── components/
│   │   └── Scene.tsx              # Reusable scene template
│   ├── demos/
│   │   ├── core/
│   │   │   ├── cameras/
│   │   │   │   ├── OrthographicCamera.tsx
│   │   │   │   └── PerspectiveCamera.tsx
│   │   │   ├── controls/
│   │   │   │   └── OrbitControls.tsx
│   │   │   ├── geometry/          # Add geometry demos here
│   │   │   ├── staging/           # Add staging demos here
│   │   │   └── ...
│   │   ├── legacy/                # Legacy tier demos
│   │   ├── webgpu/                # WebGPU tier demos
│   │   ├── external/              # External tier demos
│   │   └── experimental/          # Experimental tier demos
│   ├── App.tsx                    # Router and navigation
│   ├── App.css                    # Styles
│   └── main.tsx                   # Entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔧 Tips & Tricks

### Import Patterns

```tsx
// ✅ Correct - Tier-specific imports
import { Component } from '@react-three/drei/core'
import { Component } from '@react-three/drei/legacy'
import { Component } from '@react-three/drei/webgpu'

// ✅ Correct - Three.js
import * as THREE from 'three'

// ❌ Wrong - Don't use #three in examples
import * as THREE from '#three'
```

### Hot Reload

- **Examples hot reload automatically** on save
- **Drei source changes also hot reload** (Vite imports directly from src/)
- If changes don't appear, check the terminal for errors

### Debugging

```tsx
// Console logging
useEffect(() => {
  console.log('Component mounted:', props)
}, [])

// Use React DevTools in browser
// Use Three.js Inspector browser extension
```

### Common Patterns

**Animation**:
```tsx
import { useFrame } from '@react-three/fiber'

function AnimatedBox() {
  const ref = useRef()
  useFrame((state) => {
    ref.current.rotation.x += 0.01
  })
  return <mesh ref={ref}>...</mesh>
}
```

**Interactivity**:
```tsx
<mesh onClick={() => console.log('clicked')}>
  <boxGeometry />
  <meshStandardMaterial color="hotpink" />
</mesh>
```

---

## 📊 Progress Tracking

Use `COMPONENT_STATUS.md` to track your progress:

- 🟢 **Complete & Verified** - Example works, test written
- 🟡 **Needs Work** - Has issues to resolve
- 🔴 **Not Started** - Ready to work on
- ⚪ **N/A** - Not applicable

### Update Workflow

1. Pick a 🔴 component
2. Create example → Mark 🟡
3. Get it working → Mark 🟢
4. Write test → Mark 🟢
5. Move to next component

---

## 🆘 Troubleshooting

### Examples Won't Start

```bash
# Make sure dependencies are installed
cd examples
yarn install

# Try cleaning and reinstalling
rm -rf node_modules
yarn install
```

### Drei Changes Not Appearing

```bash
# Usually just need to save the file again
# If persistent, restart the dev server (Ctrl+C, yarn dev)
```

### TypeScript Errors in Examples

```bash
# Examples use different tsconfig
# Check examples/tsconfig.json paths
```

### Component Not Importing

```tsx
// Check tier-specific imports
import { Component } from '@react-three/drei/core'     // ✅
import { Component } from '@react-three/drei'          // ❌
```

---

## 📚 Resources

- **Examples README**: `examples/README.md` - Detailed examples docs
- **Component Status**: `COMPONENT_STATUS.md` - Track progress
- **Migration Guide**: `docs/development/MIGRATION_V10_TO_V11.md` - Migration details
- **Three.js Docs**: https://threejs.org/docs/
- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber/

---

## 🎯 Next Steps

1. ✅ `cd examples && yarn install`
2. ✅ `yarn dev` (stay in examples folder)
3. ✅ Browse existing examples at localhost:3000
4. ✅ Pick a component from `COMPONENT_STATUS.md`
5. ✅ Create an example
6. ✅ Copy to test
7. ✅ Repeat!

**Happy coding! 🚀**

