# MeshTransmissionMaterial - Legacy Implementation Breakdown

This document provides a detailed breakdown of the legacy (WebGL/GLSL) MeshTransmissionMaterial implementation for reference when porting to WebGPU/TSL.

---

## Table of Contents

1. [Overview & Purpose](#overview--purpose)
2. [Architecture Summary](#architecture-summary)
3. [Uniforms Reference](#uniforms-reference)
4. [FBO Render Pipeline](#fbo-render-pipeline)
5. [GLSL Shader Breakdown](#glsl-shader-breakdown)
6. [React Component Logic](#react-component-logic)
7. [Critical Implementation Details](#critical-implementation-details)

---

## Overview & Purpose

MeshTransmissionMaterial is an enhanced MeshPhysicalMaterial that provides:

- **Custom refraction sampling** - Samples from a pre-rendered scene buffer instead of relying on Three.js's built-in transmission
- **Chromatic aberration** - Separates RGB channels with different IOR values
- **Noise-based distortion** - Animated simplex noise for organic glass effects
- **Multi-sample blur** - Roughness-based blur via multiple refraction samples
- **See-through capability** - Can see other transmissive/transparent objects (unlike built-in transmission)

### Key Trade-off

The material **sets `transmission = 0`** on the base MeshPhysicalMaterial to prevent Three.js from doing its own transmission render pass. Instead, we manually render the scene to FBOs and sample from those in our custom shader.

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                         useFrame Loop                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Save current state (toneMapping, background, envMapIntensity)
│                                                                 │
│  2. Setup for FBO render:                                       │
│     - Disable tone mapping (avoid double tone mapping)          │
│     - Set custom background if provided                         │
│     - Swap parent mesh material → DiscardMaterial               │
│       (mesh invisible but shadows still cast)                   │
│                                                                 │
│  3. IF backside enabled:                                        │
│     ┌─────────────────────────────────────────────────┐         │
│     │ BACKSIDE FBO PASS                               │         │
│     │ • Render scene → fboBack                        │         │
│     │ • This captures what's behind the object        │         │
│     └─────────────────────────────────────────────────┘         │
│     • Swap material back to MeshTransmissionMaterial            │
│     • Set buffer = fboBack.texture                              │
│     • Set thickness = backsideThickness                         │
│     • Set side = BackSide                                       │
│     • Set envMapIntensity = backsideEnvMapIntensity             │
│                                                                 │
│  4. MAIN FBO PASS                                               │
│     ┌─────────────────────────────────────────────────┐         │
│     │ • Render scene → fboMain                        │         │
│     │ • If backside: material shows backside view     │         │
│     │ • Otherwise: DiscardMaterial makes mesh invisible│        │
│     └─────────────────────────────────────────────────┘         │
│                                                                 │
│  5. Reset material for final render:                            │
│     • material = MeshTransmissionMaterial                       │
│     • thickness = original thickness                            │
│     • side = original side (usually FrontSide)                  │
│     • buffer = fboMain.texture                                  │
│     • envMapIntensity = original value                          │
│                                                                 │
│  6. Restore original state                                      │
│     • scene.background = oldBg                                  │
│     • gl.setRenderTarget(null) - back to screen                 │
│     • gl.toneMapping = oldTone                                  │
│                                                                 │
│  7. THREE.js renders the final scene (automatic)                │
│     • MeshTransmissionMaterial samples from fboMain.texture     │
│     • Custom GLSL applies refraction + chromatic aberration     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Uniforms Reference

### Custom Uniforms (defined in material class)

| Uniform               | Type      | Default  | Description                                  |
| --------------------- | --------- | -------- | -------------------------------------------- |
| `chromaticAberration` | float     | 0.05     | Strength of RGB separation                   |
| `transmission`        | float     | 0        | **Always 0** (reserved, see `_transmission`) |
| `_transmission`       | float     | 1        | Actual transmission amount (workaround)      |
| `transmissionMap`     | sampler2D | null     | Texture to modulate transmission             |
| `roughness`           | float     | 0        | Blur amount (0 = sharp, 1 = blurry)          |
| `thickness`           | float     | 0        | Refraction depth / glass thickness           |
| `thicknessMap`        | sampler2D | null     | Texture to modulate thickness                |
| `attenuationDistance` | float     | Infinity | Beer's law attenuation distance              |
| `attenuationColor`    | vec3      | white    | Beer's law absorption color                  |
| `anisotropicBlur`     | float     | 0.1      | Directional blur amount                      |
| `time`                | float     | 0        | Animation time (from useFrame)               |
| `distortion`          | float     | 0        | Noise distortion strength                    |
| `distortionScale`     | float     | 0.5      | Noise frequency scale                        |
| `temporalDistortion`  | float     | 0        | Noise animation speed                        |
| `buffer`              | sampler2D | null     | **THE KEY TEXTURE** - FBO with scene render  |

### Why `transmission = 0` and `_transmission`?

Three.js's WebGLRenderer checks `material.transmission > 0` and triggers its own internal transmission render pass. We want to avoid this double-render, so:

1. We set `transmission = 0` on the material
2. We use `_transmission` as our actual transmission value in the shader
3. We force `USE_TRANSMISSION` define so Three.js includes transmission-related code
4. Our custom shader replaces the transmission calculations

**Exception:** When `transmissionSampler = true`, we use Three.js's built-in sampler and set `transmission` to the actual value.

---

## FBO Render Pipeline

### Without Backside (default)

```
Frame N:
├── useFrame runs BEFORE Three.js main render
│   ├── Set scene.background (optional custom)
│   ├── Swap material → DiscardMaterial (mesh invisible)
│   ├── Render scene → fboMain
│   │   └── Everything EXCEPT our mesh (it's discarded)
│   ├── Swap material → MeshTransmissionMaterial
│   ├── Set buffer = fboMain.texture
│   └── Restore state, setRenderTarget(null)
│
└── Three.js renders to screen
    └── Our mesh visible with MeshTransmissionMaterial
        └── Shader samples fboMain.texture for refraction
```

### With Backside Enabled

```
Frame N:
├── useFrame runs BEFORE Three.js main render
│   ├── Set scene.background
│   ├── Swap material → DiscardMaterial
│   │
│   ├── BACKSIDE PASS
│   │   └── Render scene → fboBack (captures scene from front)
│   │
│   ├── Swap material → MeshTransmissionMaterial
│   ├── Set buffer = fboBack.texture
│   ├── Set side = BackSide
│   ├── Set thickness = backsideThickness
│   │
│   ├── MAIN PASS
│   │   └── Render scene → fboMain
│   │       └── Our mesh renders its BACKSIDE, sampling fboBack
│   │       └── This gives internal reflections/refractions
│   │
│   ├── Reset: buffer = fboMain.texture
│   ├── Reset: side = FrontSide
│   ├── Reset: thickness = original
│   └── Restore state, setRenderTarget(null)
│
└── Three.js renders to screen
    └── Our mesh renders FRONT, sampling fboMain
        └── fboMain contains backside render
        └── Creates double-refraction effect
```

### Key Insight: Buffer Contents

- **fboMain** contains the scene **without** our mesh (mesh uses DiscardMaterial)
- **fboBack** (when backside enabled) contains the scene, also without our mesh
- The difference is **which side of our mesh** was rendered when fboMain was captured

---

## GLSL Shader Breakdown

### Shader Injection Points

The material uses `onBeforeCompile` to modify MeshPhysicalMaterial's shader:

1. **Prepend custom code** to fragment shader (noise functions, uniforms)
2. **Replace `#include <transmission_pars_fragment>`** with custom transmission functions
3. **Replace `#include <transmission_fragment>`** with custom refraction sampling

### Custom Functions Added

#### Noise Functions

```glsl
// 3D simplex noise for organic distortion
vec3 random3(vec3 c)           // Hash function for noise
float snoise(vec3 p)           // 3D simplex noise
float snoiseFractal(vec3 m)    // Multi-octave fractal noise

// Per-fragment pseudo-random (for sample jittering)
uint hash(uint x)              // Integer hash
float floatConstruct(uint m)   // Convert hash to [0,1] float
float rand(float seed)         // Fragment-stable random
```

#### Transmission Functions (replace Three.js built-in)

```glsl
// Calculate refraction ray direction and length
vec3 getVolumeTransmissionRay(n, v, thickness, ior, modelMatrix)

// Scale roughness based on IOR
float applyIorToRoughness(roughness, ior)

// Sample the buffer texture (THIS IS THE KEY FUNCTION)
vec4 getTransmissionSample(fragCoord, roughness, ior)
  ├── IF USE_SAMPLER: use Three.js transmissionSamplerMap with LOD
  └── ELSE: use our custom buffer texture (no LOD/blur from mips)

// Beer's law light absorption
vec3 applyVolumeAttenuation(radiance, transmissionDistance, attenuationColor, attenuationDistance)

// Main refraction calculation
vec4 getIBLVolumeRefraction(...)
  ├── Get refraction ray
  ├── Calculate exit point in world space
  ├── Project to screen coordinates
  ├── Sample buffer at those coordinates
  ├── Apply volume attenuation
  └── Apply Fresnel (1.0 - F)
```

### Main Transmission Loop (the heart of the effect)

```glsl
// In #include <transmission_fragment> replacement:

// Setup
vec3 pos = vWorldPosition;
vec3 v = normalize(cameraPosition - pos);
vec3 n = inverseTransformDirection(normal, viewMatrix);
vec3 transmission = vec3(0.0);

// Noise-based distortion normal
vec3 distortionNormal = vec3(0.0);
if (distortion > 0.0) {
  distortionNormal = distortion * vec3(
    snoiseFractal(pos * distortionScale + temporalOffset),
    snoiseFractal(pos.zxy * distortionScale - temporalOffset),
    snoiseFractal(pos.yxz * distortionScale + temporalOffset)
  );
}

// Multi-sample loop for blur + chromatic aberration
for (float i = 0.0; i < SAMPLES; i++) {

  // Perturbed normal for this sample (roughness-based spread)
  vec3 sampleNorm = normalize(
    n +
    roughnessFactor² * 2.0 * randomDirection * pow(rand(), 0.33) +
    distortionNormal
  );

  // Thickness varies per sample (for blur)
  float sampleThickness = thickness + thickness_smear * (i + randomCoords) / SAMPLES;

  // RED channel - base IOR
  transmissionR = getIBLVolumeRefraction(
    sampleNorm, v, roughness, ...,
    pos, ...,
    ior,                              // <-- Base IOR
    sampleThickness, ...
  ).r;

  // GREEN channel - IOR + chromatic offset
  transmissionG = getIBLVolumeRefraction(
    sampleNorm, v, roughness, ...,
    pos, ...,
    ior * (1.0 + chromaticAberration * progress),  // <-- Shifted IOR
    sampleThickness, ...
  ).g;

  // BLUE channel - IOR + 2x chromatic offset
  transmissionB = getIBLVolumeRefraction(
    sampleNorm, v, roughness, ...,
    pos, ...,
    ior * (1.0 + 2.0 * chromaticAberration * progress),  // <-- 2x shift
    sampleThickness, ...
  ).b;

  transmission += vec3(transmissionR, transmissionG, transmissionB);
}

// Average and blend with diffuse
transmission /= SAMPLES;
totalDiffuse = mix(totalDiffuse, transmission.rgb, material.transmission);
```

### Chromatic Aberration Explained

Each color channel samples with a different IOR:

- **Red**: `ior` (base)
- **Green**: `ior * (1.0 + chromaticAberration * progress)`
- **Blue**: `ior * (1.0 + 2.0 * chromaticAberration * progress)`

Where `progress = (i + randomCoords) / SAMPLES`

Higher IOR = less bending, so:

- Red bends the most (lowest IOR)
- Blue bends the least (highest IOR)
- Creates the classic glass prism RGB separation

---

## React Component Logic

### Props → Material Mapping

| Prop                      | Used For                                                                          |
| ------------------------- | --------------------------------------------------------------------------------- |
| `transmissionSampler`     | Use Three.js built-in sampler (cheaper, but can't see other transmissive objects) |
| `backside`                | Enable double-refraction (costlier, better for solid glass)                       |
| `backsideThickness`       | Thickness for inner refraction pass                                               |
| `backsideEnvMapIntensity` | Environment intensity for inner pass                                              |
| `resolution`              | FBO resolution (undefined = fullscreen)                                           |
| `backsideResolution`      | Backside FBO resolution                                                           |
| `samples`                 | Number of refraction samples (more = smoother blur, costlier)                     |
| `background`              | Custom scene background during FBO render                                         |

### Key Component Flow

```jsx
// 1. Create FBOs
const fboBack = useFBO(backsideResolution || resolution)
const fboMain = useFBO(resolution)

// 2. Create discard material for hiding mesh during FBO render
const [discardMaterial] = React.useState(() => new DiscardMaterial())

// 3. useFrame: render to FBOs before main render
useFrame((state) => {
  ref.current.time = state.elapsed  // Update time uniform

  // Only do custom rendering if using our buffer (not transmissionSampler)
  if (ref.current.buffer === fboMain.texture && !transmissionSampler) {
    // ... FBO render logic (see FBO Render Pipeline)
  }
})

// 4. Return material JSX
<meshTransmissionMaterial
  args={[samples, transmissionSampler]}  // Constructor args
  buffer={buffer || fboMain.texture}      // Our FBO or external buffer
  _transmission={transmission}            // Actual transmission value
  transmission={transmissionSampler ? transmission : 0}  // Three.js prop
  anisotropicBlur={anisotropicBlur ?? anisotropy}
  thickness={thickness}
  side={side}
  {...props}
/>
```

---

## Critical Implementation Details

### 1. Transmission Workaround is Essential

```javascript
// WRONG: This triggers Three.js internal transmission pass
this.transmission = 1

// CORRECT: Disable Three.js transmission, use our own
this.transmission = 0
this._transmission = 1 // Our custom uniform
shader.defines.USE_TRANSMISSION = '' // Force include transmission code
```

### 2. Tone Mapping Must Be Disabled During FBO Render

```javascript
// FBO contains linear color data
// If tone mapping is applied, then applied AGAIN during final render = wrong
state.gl.toneMapping = THREE.NoToneMapping
// ... render to FBO ...
state.gl.toneMapping = oldTone
```

### 3. DiscardMaterial Preserves Shadows

The mesh must be invisible during FBO render (so we capture what's BEHIND it), but we want shadows to remain. DiscardMaterial:

```glsl
void main() { }  // Vertex: nothing special
void main() { gl_FragColor = vec4(0,0,0,0); discard; }  // Fragment: discard all
```

The mesh still casts shadows because shadow maps are rendered separately.

### 4. Buffer Must Be Set BEFORE Main Render

The FBO render happens in `useFrame`, which runs before Three.js's main render. When the main render happens, `ref.current.buffer` must already point to the correct texture.

### 5. Backside Logic: Two-Pass Refraction

For solid glass objects:

1. First pass (→ fboBack): Render scene, mesh invisible
2. Set material to render BackSide, sampling fboBack (inner refraction)
3. Second pass (→ fboMain): Render scene including mesh's backside
4. Set material to render FrontSide, sampling fboMain (outer refraction)
5. Final render: Front of mesh shows double-refracted scene

### 6. Sample Count Baked Into Shader

```javascript
args={[samples, transmissionSampler]}
```

The `samples` value is baked into the GLSL as a literal number in the for loop:

```glsl
for (float i = 0.0; i < ${samples}.0; i++)
```

Changing `samples` requires shader recompilation (new material instance).

---

## Common Pitfalls When Porting

1. **Using outputNode wrong** - The legacy version modifies `totalDiffuse` inside the transmission fragment chunk, not the final output. The output node approach in TSL needs to properly integrate with the physical material's lighting pipeline.

2. **Missing the Fresnel term** - `(1.0 - F)` in `getIBLVolumeRefraction` applies the Fresnel effect. Without this, the material won't properly blend reflections and transmission.

3. **Wrong coordinate space** - The refraction ray must be calculated in world space, then projected to screen space for UV lookup.

4. **Double tone mapping** - Forgetting to disable tone mapping during FBO render.

5. **Not using \_transmission** - Using the material's `transmission` property instead of the custom `_transmission` uniform.

6. **Missing USE_TRANSMISSION define** - Without this, Three.js won't include transmission-related variables and structs in the shader.

---

## Output Summary

**Final output** = `mix(totalDiffuse, transmission.rgb, _transmission)`

Where:

- `totalDiffuse` = material's computed diffuse lighting (from MeshPhysicalMaterial)
- `transmission.rgb` = average of all refraction samples with chromatic aberration
- `_transmission` = user's transmission value (0-1)

The result blends between the material's normal appearance and the refracted scene view.

// raw note about webgpu port

I've created the outline document at materialOutline.md.

Key Issues Identified in WebGPU Port
Looking at the differences between legacy and WebGPU versions, here are the critical problems:

1. Wrong Output Integration
   Legacy: Modifies totalDiffuse inside the transmission_fragment chunk - this integrates with MeshPhysicalMaterial's lighting pipeline
   WebGPU: Uses outputNode which completely replaces the output, bypassing all physical material lighting calculations (specular, environment, etc.)
2. Missing Fresnel Term
   Legacy: getIBLVolumeRefraction applies (1.0 - F) _ attenuatedColor _ diffuseColor where F is the Fresnel via EnvironmentBRDF
   WebGPU: No Fresnel calculation - just raw transmission without proper reflection/transmission balance
3. Missing Specular F90 and EnvironmentBRDF
   Legacy: Uses material.specularColor, material.specularF90, and EnvironmentBRDF() for physically correct blending
   WebGPU: None of this - just raw buffer sampling
4. DiscardMaterial Usage Bug
   Legacy: new DiscardMaterial() creates an instance
   WebGPU: DiscardMaterial is assigned directly (the class/constructor, not an instance)
5. Wrong Coordinate Transform
   Legacy: inverseTransformDirection(normal, viewMatrix) transforms normal to world space
   WebGPU: Uses normalWorld directly which should be correct, but the refraction direction calculation differs
6. Thickness Smear Calculation
   Legacy: thickness \* max(pow(roughnessFactor, 0.33), anisotropicBlur)
   WebGPU: Same formula but roughnessFactor comes from float(materialRef.roughness) which may not match the actual resolved roughness after maps
   The fundamental issue is that outputNode bypasses the physical material pipeline entirely. You need to either use transmissionNode or properly integrate with the material's color/lighting nodes.
