# Drei v11 Component Status Checklist

Track the status of each component through the migration process.

**Legend:**
- 🟢 = Complete & Verified
- 🟡 = Needs Work
- 🔴 = Not Started
- ⚪ = N/A

**Status Columns:**
- **Structure**: Component in CaaF folder with index.ts
- **Imports**: All imports fixed (paths, #three alias)
- **Types**: No TypeScript errors
- **Tests**: Real tests implemented (not placeholder)
- **Docs**: Documentation updated

---

## Core Components (103 total)

### Cameras (3)

| Component | Structure | Imports | Types | Tests | Docs | Notes |
|-----------|-----------|---------|-------|-------|------|-------|
| OrthographicCamera | 🟢 | 🟡 | 🟡 | 🔴 | ⚪ | Needs Fbo import fix |
| PerspectiveCamera | 🟢 | 🟡 | 🟡 | 🔴 | ⚪ | Needs Fbo import fix |
| useCamera | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |

### Controls (18)

| Component | Structure | Imports | Types | Tests | Docs | Notes |
|-----------|-----------|---------|-------|-------|------|-------|
| ArcballControls | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Utils import issue |
| DeviceOrientationControls | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Utils import issue |
| DragControls | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Utils import issue |
| FaceControls | 🟢 | 🟡 | 🟡 | 🔴 | ⚪ | Cross-tier imports |
| FirstPersonControls | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Utils import issue |
| FlyControls | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Utils import issue |
| KeyboardControls | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| MapControls | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Utils import issue |
| MotionPathControls | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| OrbitControls | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Utils import issue |
| PointerLockControls | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Utils import issue |
| PresentationControls | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| ScrollControls | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Utils import issue |
| Select | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| TrackballControls | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Utils import issue |
| TransformControls | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Utils import issue |
| GizmoHelper | 🟢 | 🟡 | 🟡 | 🔴 | ⚪ | Case sensitivity, cross-tier |
| GizmoViewport | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| GizmoViewcube | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| PivotControls | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | Multi-file component |

### Staging (17)

| Component | Structure | Imports | Types | Tests | Docs | Notes |
|-----------|-----------|---------|-------|-------|------|-------|
| Backdrop | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| BBAnchor | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Bounds | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Center | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Environment | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Float | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Grid | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Lightformer | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Resize | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| ScreenSizer | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Shadow | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Sky | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| SpotLight | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Stage | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Stars | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| useBoxProjectedEnv | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| useEnvironment | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |

### Geometry (15)

| Component | Structure | Imports | Types | Tests | Docs | Notes |
|-----------|-----------|---------|-------|-------|------|-------|
| CatmullRomLine | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| CubicBezierLine | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| CurveModifier | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Decal | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Detailed | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Edges | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Utils import issue |
| Line | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Points | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| QuadraticBezierLine | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| RoundedBox | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| ScreenQuad | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Segments | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Text3D | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Trail | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Wireframe | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |

### Abstractions (9)

| Component | Structure | Imports | Types | Tests | Docs | Notes |
|-----------|-----------|---------|-------|-------|------|-------|
| AsciiRenderer | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Billboard | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Clone | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |
| ComputedAttribute | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Unused @ts-expect-error |
| Example | 🟢 | 🟡 | 🟡 | 🔴 | ⚪ | Cross-component imports |
| Instances | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |
| Sampler | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| ScreenSpace | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Svg | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |

### Performance (7)

| Component | Structure | Imports | Types | Tests | Docs | Notes |
|-----------|-----------|---------|-------|-------|------|-------|
| AdaptiveDpr | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| AdaptiveEvents | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| DetectGPU | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| meshBounds | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| PerformanceMonitor | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Stats | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| StatsGl | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |

### Loaders (15)

| Component | Structure | Imports | Types | Tests | Docs | Notes |
|-----------|-----------|---------|-------|-------|------|-------|
| CubeTexture | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Loader | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| MatcapTexture | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Preload | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| ScreenVideoTexture | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| TrailTexture | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| useFBX | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| useFont | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| useGLTF | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| useKTX2 | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| useProgress | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| useSpriteLoader | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| useTexture | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| VideoTexture | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| WebcamVideoTexture | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |

### Helpers (12)

| Component | Structure | Imports | Types | Tests | Docs | Notes |
|-----------|-----------|---------|-------|-------|------|-------|
| CycleRaycast | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Html | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| PointMaterial | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| PositionalAudio | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| SpriteAnimator | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Text | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| useAnimations | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| useAspect | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| useContextBridge | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| useCursor | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| useHelper | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| useIntersect | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |

### Portal (3)

| Component | Structure | Imports | Types | Tests | Docs | Notes |
|-----------|-----------|---------|-------|-------|------|-------|
| Fisheye | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Mask | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| View | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |

### Effects (3)

| Component | Structure | Imports | Types | Tests | Docs | Notes |
|-----------|-----------|---------|-------|-------|------|-------|
| CameraShake | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Utils import issue |
| Cloud | 🟢 | 🟡 | 🟡 | 🔴 | ⚪ | Cross-component imports |
| Sparkles | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |

---

## External Components (6 total)

| Component | Structure | Imports | Types | Tests | Docs | Notes |
|-----------|-----------|---------|-------|-------|------|-------|
| Bvh | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| CameraControls | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Facemesh | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| FaceLandmarker | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| NormalTexture | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| Splat | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |

---

## Experimental Components (1 total)

| Component | Structure | Imports | Types | Tests | Docs | Notes |
|-----------|-----------|---------|-------|-------|------|-------|
| MarchingCubes | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Utils import, type issues |

---

## Legacy Components (27 total)

### Helpers (1)

| Component | Structure | Imports | Types | Tests | Docs | Notes |
|-----------|-----------|---------|-------|-------|------|-------|
| Fbo / useFBO | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | WebGL-specific |

### Portal (3)

| Component | Structure | Imports | Types | Tests | Docs | Notes |
|-----------|-----------|---------|-------|-------|------|-------|
| Hud | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | WebGL render targets |
| RenderCubeTexture | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |
| RenderTexture | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |

### Cameras (1)

| Component | Structure | Imports | Types | Tests | Docs | Notes |
|-----------|-----------|---------|-------|-------|------|-------|
| CubeCamera | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | WebGL-specific |

### Abstractions (1)

| Component | Structure | Imports | Types | Tests | Docs | Notes |
|-----------|-----------|---------|-------|-------|------|-------|
| Effects | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |

### Materials (21)

| Component | Structure | Imports | Types | Tests | Docs | Notes |
|-----------|-----------|---------|-------|-------|------|-------|
| AccumulativeShadows | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |
| BakeShadows | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| BlurPass | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |
| Caustics | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |
| ContactShadows | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |
| ConvolutionMaterial | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |
| DiscardMaterial | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |
| GradientTexture | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |
| Image | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |
| MeshDiscardMaterial | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |
| MeshDistortMaterial | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |
| MeshPortalMaterial | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |
| MeshReflectorMaterial | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| MeshRefractionMaterial | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |
| MeshTransmissionMaterial | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |
| MeshWobbleMaterial | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |
| Outlines | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |
| shaderMaterial | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| SoftShadows | 🟢 | 🟢 | 🟢 | 🔴 | ⚪ | |
| SpotLightMaterial | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |
| WireframeMaterial | 🟢 | 🟢 | 🟡 | 🔴 | ⚪ | Type issues |

---

## WebGPU Components (27 total)

**Status**: All components copied from legacy, awaiting TSL conversion

### Helpers (1)

| Component | Structure | Imports | Types | Tests | Docs | TSL Conversion | Notes |
|-----------|-----------|---------|-------|-------|------|----------------|-------|
| Fbo / useFBO | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | Needs WebGPU render targets |

### Portal (3)

| Component | Structure | Imports | Types | Tests | Docs | TSL Conversion | Notes |
|-----------|-----------|---------|-------|-------|------|----------------|-------|
| Hud | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | Needs WebGPU render targets |
| RenderCubeTexture | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | Needs WebGPU render targets |
| RenderTexture | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | Needs WebGPU render targets |

### Cameras (1)

| Component | Structure | Imports | Types | Tests | Docs | TSL Conversion | Notes |
|-----------|-----------|---------|-------|-------|------|----------------|-------|
| CubeCamera | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | Needs WebGPU render targets |

### Abstractions (1)

| Component | Structure | Imports | Types | Tests | Docs | TSL Conversion | Notes |
|-----------|-----------|---------|-------|-------|------|----------------|-------|
| Effects | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | Needs TSL shader conversion |

### Materials (21) - All Need TSL Conversion

| Component | Structure | Imports | Types | Tests | Docs | TSL Conversion | Priority |
|-----------|-----------|---------|-------|-------|------|----------------|----------|
| AccumulativeShadows | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | High |
| BakeShadows | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | Medium |
| BlurPass | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | Medium |
| Caustics | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | High |
| ContactShadows | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | High |
| ConvolutionMaterial | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | Low |
| DiscardMaterial | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | Low |
| GradientTexture | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | Medium |
| Image | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | High |
| MeshDiscardMaterial | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | Low |
| MeshDistortMaterial | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | High |
| MeshPortalMaterial | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | High |
| MeshReflectorMaterial | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | High |
| MeshRefractionMaterial | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | High |
| MeshTransmissionMaterial | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | High |
| MeshWobbleMaterial | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | Medium |
| Outlines | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | Medium |
| shaderMaterial | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | High |
| SoftShadows | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | Medium |
| SpotLightMaterial | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | Medium |
| WireframeMaterial | 🟢 | 🟢 | 🔴 | 🔴 | ⚪ | 🔴 | Low |

---

## Summary Statistics

### Overall Progress
- **Total Components**: 137 (103 core + 6 external + 1 experimental + 27 platform-specific)
- **Structure Complete**: 137/137 (100%)
- **Imports Fixed**: ~120/137 (87%)
- **Types Clean**: ~85/137 (62%)
- **Tests Implemented**: 0/137 (0%)
- **TSL Conversions**: 0/21 (0%)

### By Status
- 🟢 **Complete**: Structure and basic imports done for all components
- 🟡 **Needs Work**: ~30 components with import/type issues
- 🔴 **Not Started**: All tests, all WebGPU TSL conversions

### Next Actions
1. Fix remaining ~30 import issues (2-3 hours)
2. Resolve type errors in core components (2-3 hours)
3. Implement tests incrementally (ongoing)
4. Convert WebGPU materials to TSL (40-80 hours total)

---

## How to Use This Checklist

1. **Pick a component** from the list
2. **Check current status** across all columns
3. **Work on red/yellow items** to turn them green
4. **Update this file** when you complete a component
5. **Track progress** with the summary statistics

**Update Format**:
```markdown
| ComponentName | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 | Fixed all issues |
```

---

**Last Updated**: December 30, 2025


