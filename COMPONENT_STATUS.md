# Drei v11 Component Status Checklist

Track the status of each component through the migration and testing process.

**Legend:**
- 🟢 = Complete & Verified
- 🟡 = Needs Work
- 🔴 = Not Started
- ⚪ = N/A

**Status Columns:**
- **Structure**: Component in CaaF folder with index.ts
- **Imports**: All imports fixed (paths, #three alias)
- **Types**: No TypeScript errors
- **Example**: Working visual demo in examples/
- **Tests**: Real tests implemented
- **Docs**: Documentation updated

---

## How to Use This Checklist

### Workflow

1. **Pick a component** from the list below
2. **Create an example** in `examples/src/demos/[tier]/[category]/ComponentName.tsx`
3. **Test visually** - Run `yarn examples` and verify it works
4. **Copy to test** - Copy working example code to component's `.test.tsx`
5. **Update status** - Mark columns green as you complete them

### Quick Start

```bash
# Terminal 1: Watch drei source changes
yarn dev

# Terminal 2: Run examples dev server
yarn examples
```

### Example Template

```tsx
// examples/src/demos/core/geometry/RoundedBox.tsx
import { RoundedBox } from '@react-three/drei/core'
import Scene from '../../../components/Scene'

export default function RoundedBoxDemo() {
  return (
    <div className="demo-container">
      <div className="demo-info">
        <h2>RoundedBox</h2>
        <p>Description of the component and what it does.</p>
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

---

## Core Components (103 total)

### Cameras (3)

| Component | Structure | Imports | Types | Example | Tests | Docs | Notes |
|-----------|-----------|---------|-------|---------|-------|------|-------|
| OrthographicCamera | 🟢 | 🟢 | 🟡 | 🟢 | 🔴 | ⚪ | Example created |
| PerspectiveCamera | 🟢 | 🟢 | 🟡 | 🟢 | 🔴 | ⚪ | Example created |
| useCamera | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | Hook - needs example |

### Controls (19)

| Component | Structure | Imports | Types | Example | Tests | Docs | Notes |
|-----------|-----------|---------|-------|---------|-------|------|-------|
| ArcballControls | 🟢 | 🟢 | 🟡 | 🔴 | 🔴 | ⚪ | |
| DeviceOrientationControls | 🟢 | 🟢 | 🟡 | 🔴 | 🔴 | ⚪ | |
| DragControls | 🟢 | 🟢 | 🟡 | 🔴 | 🔴 | ⚪ | |
| FaceControls | 🟢 | 🟡 | 🟡 | 🔴 | 🔴 | ⚪ | |
| FirstPersonControls | 🟢 | 🟢 | 🟡 | 🔴 | 🔴 | ⚪ | |
| FlyControls | 🟢 | 🟢 | 🟡 | 🔴 | 🔴 | ⚪ | |
| KeyboardControls | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| MapControls | 🟢 | 🟢 | 🟡 | 🔴 | 🔴 | ⚪ | |
| MotionPathControls | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| OrbitControls | 🟢 | 🟢 | 🟡 | 🟢 | 🔴 | ⚪ | Example created |
| PointerLockControls | 🟢 | 🟢 | 🟡 | 🔴 | 🔴 | ⚪ | |
| PresentationControls | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| PivotControls | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| ScrollControls | 🟢 | 🟢 | 🟡 | 🔴 | 🔴 | ⚪ | |
| Select | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| TrackballControls | 🟢 | 🟢 | 🟡 | 🔴 | 🔴 | ⚪ | |
| TransformControls | 🟢 | 🟢 | 🟡 | 🔴 | 🔴 | ⚪ | |
| GizmoHelper | 🟢 | 🟡 | 🟡 | 🔴 | 🔴 | ⚪ | |
| GizmoViewport | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |

### Staging (17)

| Component | Structure | Imports | Types | Example | Tests | Docs | Notes |
|-----------|-----------|---------|-------|---------|-------|------|-------|
| AccumulativeShadows | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Backdrop | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| BBAnchor | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Bounds | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Center | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| ContactShadows | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Environment | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Float | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Grid | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Lightformer | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Resize | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| ScreenSizer | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Shadow | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Sky | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| SpotLight | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Stage | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Stars | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |

### Geometry (15)

| Component | Structure | Imports | Types | Example | Tests | Docs | Notes |
|-----------|-----------|---------|-------|---------|-------|------|-------|
| CatmullRomLine | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| CubicBezierLine | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| CurveModifier | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Decal | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Detailed | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Edges | 🟢 | 🟢 | 🟡 | 🔴 | 🔴 | ⚪ | |
| Line | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Points | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| QuadraticBezierLine | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| RoundedBox | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| ScreenQuad | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Segments | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Text3D | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Trail | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Wireframe | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |

### Abstractions (9)

| Component | Structure | Imports | Types | Example | Tests | Docs | Notes |
|-----------|-----------|---------|-------|---------|-------|------|-------|
| AsciiRenderer | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Billboard | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Clone | 🟢 | 🟢 | 🟡 | 🔴 | 🔴 | ⚪ | |
| ComputedAttribute | 🟢 | 🟢 | 🟡 | 🔴 | 🔴 | ⚪ | |
| Example | 🟢 | 🟡 | 🟡 | 🔴 | 🔴 | ⚪ | |
| Instances | 🟢 | 🟢 | 🟡 | 🔴 | 🔴 | ⚪ | |
| Sampler | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| ScreenSpace | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Svg | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |

### Performance (7)

| Component | Structure | Imports | Types | Example | Tests | Docs | Notes |
|-----------|-----------|---------|-------|---------|-------|------|-------|
| AdaptiveDpr | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| AdaptiveEvents | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| DetectGPU | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| meshBounds | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| PerformanceMonitor | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Stats | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| StatsGl | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |

### Loaders (15)

| Component | Structure | Imports | Types | Example | Tests | Docs | Notes |
|-----------|-----------|---------|-------|---------|-------|------|-------|
| Loader | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Preload | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| ScreenVideoTexture | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| useCubeTexture | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| useFBX | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| useFont | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| useGLTF | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| useKTX2 | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| useMatcapTexture | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| useProgress | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| useSpriteLoader | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| useTexture | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| useTrailTexture | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| useVideoTexture | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| WebcamVideoTexture | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |

### Helpers (12)

| Component | Structure | Imports | Types | Example | Tests | Docs | Notes |
|-----------|-----------|---------|-------|---------|-------|------|-------|
| CycleRaycast | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Html | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| PointMaterial | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| PositionalAudio | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| SpriteAnimator | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Text | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| useAnimations | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| useAspect | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| useContextBridge | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| useCursor | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| useHelper | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| useIntersect | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |

### Portal (3)

| Component | Structure | Imports | Types | Example | Tests | Docs | Notes |
|-----------|-----------|---------|-------|---------|-------|------|-------|
| Fisheye | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Mask | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| View | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |

### Effects (3)

| Component | Structure | Imports | Types | Example | Tests | Docs | Notes |
|-----------|-----------|---------|-------|---------|-------|------|-------|
| CameraShake | 🟢 | 🟢 | 🟡 | 🔴 | 🔴 | ⚪ | |
| Cloud | 🟢 | 🟡 | 🟡 | 🔴 | 🔴 | ⚪ | |
| Sparkles | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |

---

## External Components (6)

| Component | Structure | Imports | Types | Example | Tests | Docs | Notes |
|-----------|-----------|---------|-------|---------|-------|------|-------|
| Bvh | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| CameraControls | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Facemesh | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| FaceLandmarker | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| NormalTexture | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |
| Splat | 🟢 | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | |

---

## Experimental Components (1)

| Component | Structure | Imports | Types | Example | Tests | Docs | Notes |
|-----------|-----------|---------|-------|---------|-------|------|-------|
| MarchingCubes | 🟢 | 🟢 | 🟡 | 🔴 | 🔴 | ⚪ | |

---

## Summary Statistics

### Overall Progress
- **Total Components**: 137
- **Structure Complete**: 137/137 (100%)
- **Imports Fixed**: ~120/137 (87%)
- **Types Clean**: ~100/137 (73%)
- **Examples Created**: 3/137 (2%) ⬅️ **Start here!**
- **Tests Implemented**: 0/137 (0%)

### Next Priority: Create Examples

Focus on creating visual examples first. This is the fastest path to:
1. ✅ Verify components work
2. ✅ Find bugs/issues quickly
3. ✅ Easy copy to tests later
4. ✅ Build component gallery

**Suggested Order:**
1. Core components (most commonly used)
2. External components (external dependencies)
3. Experimental components (bleeding edge)
4. Legacy/WebGPU (after core is solid)

---

**Last Updated**: December 31, 2025

