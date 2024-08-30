[![logo](docs/logo.jpg)](https://codesandbox.io/s/bfplr)

[![Version](https://img.shields.io/npm/v/@react-three/drei?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@react-three/drei)
[![Downloads](https://img.shields.io/npm/dt/@react-three/drei.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@react-three/drei)
[![Discord Shield](https://img.shields.io/discord/740090768164651008?style=flat&colorA=000000&colorB=000000&label=discord&logo=discord&logoColor=ffffff)](https://discord.com/channels/740090768164651008/741751532592038022)
[![Open in GitHub Codespaces](https://img.shields.io/static/v1?&message=Open%20in%20%20Codespaces&style=flat&colorA=000000&colorB=000000&label=GitHub&logo=github&logoColor=ffffff)](https://github.com/codespaces/new?template_repository=pmndrs%2Fdrei)

A growing collection of useful helpers and fully functional, ready-made abstractions for [@react-three/fiber](https://github.com/pmndrs/react-three-fiber). If you make a component that is generic enough to be useful to others, think about [CONTRIBUTING](CONTRIBUTING.md)!

```bash
npm install @react-three/drei
```

> [!IMPORTANT]
> this package is using the stand-alone [`three-stdlib`](https://github.com/pmndrs/three-stdlib) instead of [`three/examples/jsm`](https://github.com/mrdoob/three.js/tree/master/examples/jsm).

### Basic usage

```jsx
import { PerspectiveCamera, PositionalAudio, ... } from '@react-three/drei'
```

### React-native

```jsx
import { PerspectiveCamera, PositionalAudio, ... } from '@react-three/drei/native'
```

The `native` route of the library **does not** export `Html` or `Loader`. The default export of the library is `web` which **does** export `Html` and `Loader`.

### Index

<!-- <table>
  <tr>
    <td valign="top">
      <ul>
        <li><a href="#cameras">Cameras</a></li>
        <ul>
          <li><a href="#perspectivecamera">PerspectiveCamera</a></li>
          <li><a href="#orthographiccamera">OrthographicCamera</a></li>
          <li><a href="#cubecamera">CubeCamera</a></li>
        </ul>
        <li><a href="#controls">Controls</a></li>
        <ul>
          <li><a href="#cameracontrols">CameraControls</a></li>
          <li><a href="#controls">FlyControls</a></li>
          <li><a href="#controls">MapControls</a></li>
          <li><a href="#controls">DeviceOrientationControls</a></li>
          <li><a href="#controls">TrackballControls</a></li>
          <li><a href="#controls">ArcballControls</a></li>
          <li><a href="#controls">PointerLockControls</a></li>
          <li><a href="#controls">FirstPersonControls</a></li>
          <li><a href="#scrollcontrols">ScrollControls</a></li>
          <li><a href="#presentationcontrols">PresentationControls</a></li>
          <li><a href="#keyboardcontrols">KeyboardControls</a></li>
          <li><a href="#FaceControls">FaceControls</a></li>
          <li><a href="#motionpathcontrols">MotionPathControls</a></li>
        </ul>
        <li><a href="#gizmos">Gizmos</a></li>
        <ul>
          <li><a href="#gizmohelper">GizmoHelper</a></li>
          <li><a href="#pivotcontrols">PivotControls</a></li>
          <li><a href="#dragcontrols">DragControls</a></li>
          <li><a href="#transformcontrols">TransformControls</a></li>
          <li><a href="#grid">Grid</a></li>
          <li><a href="#helper--usehelper">Helper / useHelper</a></li>
          <li><a href="#helper">Helper</a></li>
        </ul>
        <li><a href="#abstractions">Abstractions</a></li>
        <ul>
          <li><a href="#image">Image</a></li>
          <li><a href="#text">Text</a></li>
          <li><a href="#text3d">Text3D</a></li>
          <li><a href="#positionalaudio">PositionalAudio</a></li>
          <li><a href="#billboard">Billboard</a></li>
          <li><a href="#screenspace">ScreenSpace</a></li>
          <li><a href="#screensizer">ScreenSizer</a></li>
          <li><a href="#effects">Effects</a></li>
          <li><a href="#gradienttexture">GradientTexture</a></li>
          <li><a href="#edges">Edges</a></li>
          <li><a href="#outlines">Outlines</a></li>
          <li><a href="#trail">Trail</a></li>
          <li><a href="#sampler">Sampler</a></li>
          <li><a href="#computedattribute">ComputedAttribute</a></li>
          <li><a href="#clone">Clone</a></li>
          <li><a href="#useanimations">useAnimations</a></li>
          <li><a href="#marchingcubes">MarchingCubes</a></li>
          <li><a href="#decal">Decal</a></li>
          <li><a href="#svg">Svg</a></li>
          <li><a href="#gltf">Gltf</a></li>
          <li><a href="#asciirenderer">AsciiRenderer</a></li>
          <li><a href="#splat">Splat</a></li>
        </ul>
        <li><a href="#shaders">Shaders</a></li>
        <ul>
          <li><a href="#meshreflectormaterial">MeshReflectorMaterial</a></li>
          <li><a href="#meshwobblematerial">MeshWobbleMaterial</a></li>
          <li><a href="#meshdistortmaterial">MeshDistortMaterial</a></li>
          <li><a href="#meshrefractionmaterial">MeshRefractionMaterial</a></li>
          <li><a href="#meshtransmissionmaterial">MeshTransmissionMaterial</a></li>
          <li><a href="#meshdiscardmaterial">MeshDiscardMaterial</a></li>
          <li><a href="#pointmaterial">PointMaterial</a></li>
          <li><a href="#softshadows">SoftShadows</a></li>
          <li><a href="#shadermaterial">shaderMaterial</a></li>
        </ul>
      </ul>
    </td>
    <td valign="top">
      <ul>
        <li><a href="#misc">Misc</a></li>
        <ul>
          <li><a href="#example">Example</a></li>
          <li><a href="#html">Html</a></li>
          <li><a href="#cycleraycast">CycleRaycast</a></li>
          <li><a href="#select">Select</a></li>
          <li><a href="#sprite-animator">Sprite Animator</a></li>
          <li><a href="#stats">Stats</a></li>
          <li><a href="#stats-gl">StatsGl</a></li>
          <li><a href="#wireframe">Wireframe</a></li>
          <li><a href="#usedepthbuffer">useDepthBuffer</a></li>
          <li><a href="#usecontextbridge">useContextBridge</a></li>
          <li><a href="#fbo--usefbo">Fbo / useFBO</a></li>
          <li><a href="#usecamera">useCamera</a></li>
          <li><a href="#cubecamera--usecubecamera">CubeCamera / useCubeCamera</a></li>
          <li><a href="#detectgpu--usedetectgpu">DetectGPU / useDetectGPU</a></li>
          <li><a href="#useaspect">useAspect</a></li>
          <li><a href="#usecursor">useCursor</a></li>
          <li><a href="#useintersect">useIntersect</a></li>
          <li><a href="#useboxprojectedenv">useBoxProjectedEnv</a></li>
          <li><a href="#trail--useTrail">Trail / useTrail</a></li>
          <li><a href="#useSurfaceSampler">useSurfaceSampler</a></li>
          <li><a href="#facelandmarker">FaceLandmarker</a></li>
        </ul>
        <li><a href="#loading">Loaders</a></li>
        <ul>
          <li><a href="#loader">Loader</a></li>
          <li><a href="#progress--useprogress">Progress / useProgress</a></li>
          <li><a href="#gltf--usegltf">Gltf / useGLTF</a></li>
          <li><a href="#fbx--usefbx">FBX / useFBX</a></li>
          <li><a href="#texture--usetexture">Texture / useTexture</a></li>
          <li><a href="#ktx2--usektx2">Ktx2 / useKTX2</a></li>
          <li><a href="#cubetexture--usecubetexture">CubeTexture / useCubeTexture</a></li>
          <li><a href="#videotexture--usevideotexture">VideoTexture / useVideoTexture</a></li>
          <li><a href="#trailtexture--usetrailtexture">TrailTexture / useTrailTexture</a></li>
          <li><a href="#usefont">useFont</a></li>
          <li><a href="#usespriteloader">useSpriteLoader</a></li>
        </ul>
        <li><a href="#performance">Performance</a></li>
        <ul>
          <li><a href="#instances">Instances</a></li>
          <li><a href="#merged">Merged</a></li>
          <li><a href="#points">Points</a></li>
          <li><a href="#segments">Segments</a></li>
          <li><a href="#detailed">Detailed</a></li>
          <li><a href="#preload">Preload</a></li>
          <li><a href="#bakeshadows">BakeShadows</a></li>
          <li><a href="#meshbounds">meshBounds</a></li>
          <li><a href="#adaptivedpr">AdaptiveDpr</a></li>
          <li><a href="#adaptiveevents">AdaptiveEvents</a></li>
          <li><a href="#bvh">Bvh</a></li>
          <li><a href="#performancemonitor">PerformanceMonitor</a></li>
        </ul>
        <li><a href="#portals">Portals</a></li>
        <ul>
          <li><a href="#hud">Hud</a></li>
          <li><a href="#view">View</a></li>
          <li><a href="#rendertexture">RenderTexture</a></li>
          <li><a href="#rendercubetexture">RenderCubeTexture</a></li>
          <li><a href="#fisheye">Fisheye</a></li>
          <li><a href="#mask">Mask</a></li>
          <li><a href="#meshportalmaterial">MeshPortalMaterial</a></li>
        </ul>
        <li><a href="#modifiers">Modifiers</a></li>
        <ul>
          <li><a href="#curvemodifier">CurveModifier</a></li>
        </ul>
      </ul>
    </td>
    <td valign="top">
      <ul>
        <li><a href="#shapes">Shapes</a></li>
        <ul>
          <li><a href="#shapes">Plane</a></li>
          <li><a href="#shapes">Box</a></li>
          <li><a href="#shapes">Sphere</a></li>
          <li><a href="#shapes">Circle</a></li>
          <li><a href="#shapes">Cone</a></li>
          <li><a href="#shapes">Cylinder</a></li>
          <li><a href="#shapes">Tube</a></li>
          <li><a href="#shapes">Torus</a></li>
          <li><a href="#shapes">TorusKnot</a></li>
          <li><a href="#shapes">Ring</a></li>
          <li><a href="#shapes">Tetrahedron</a></li>
          <li><a href="#shapes">Polyhedron</a></li>
          <li><a href="#shapes">Icosahedron</a></li>
          <li><a href="#shapes">Octahedron</a></li>
          <li><a href="#shapes">Dodecahedron</a></li>
          <li><a href="#shapes">Extrude</a></li>
          <li><a href="#shapes">Lathe</a></li>
          <li><a href="#shapes">Shape</a></li>
          <li><a href="#roundedbox">RoundedBox</a></li>
          <li><a href="#screenquad">Screenquad</a></li>
          <li><a href="#line">Line</a></li>
          <li><a href="#quadraticbezierline">QuadraticBezierLine</a></li>
          <li><a href="#cubicbezierline">CubicBezierLine</a></li>
          <li><a href="#catmullromline">CatmullRomLine</a></li>
          <li><a href="#facemesh">Facemesh</a></li>
        </ul>
        <li><a href="#staging">Staging</a></li>
        <ul>
          <li><a href="#center">Center</a></li>
          <li><a href="#resize">Resize</a></li>
          <li><a href="#BBAnchor">BBAnchor</a></li>
          <li><a href="#bounds">Bounds</a></li>
          <li><a href="#camerashake">CameraShake</a></li>
          <li><a href="#float">Float</a></li>
          <li><a href="#stage">Stage</a></li>
          <li><a href="#backdrop">Backdrop</a></li>
          <li><a href="#environment">Environment</a></li>
          <li><a href="#lightformer">Lightformer</a></li>
          <li><a href="#spotlight">SpotLight</a></li>
          <li><a href="#spotlightshadow">SpotLightShadow</a></li>
          <li><a href="#shadow">Shadow</a></li>
          <li><a href="#caustics">Caustics</a></li>
          <li><a href="#contactshadows">ContactShadows</a></li>
          <li><a href="#randomizedlight">RandomizedLight</a></li>
          <li><a href="#accumulativeshadows">AccumulativeShadows</a></li>
          <li><a href="#sky">Sky</a></li>
          <li><a href="#stars">Stars</a></li>
          <li><a href="#sparkles">Sparkles</a></li>
          <li><a href="#cloud">Cloud</a></li>
          <li><a href="#useenvironment">useEnvironment</a></li>
          <li><a href="#matcaptexture--usematcaptexture">MatcapTexture / useMatcapTexture</a></li>
          <li><a href="#normaltexture--usenormaltexture">NormalTexture / useNormalTexture</a></li>
          <li><a href="#shadowalpha">ShadowAlpha</a></li>
        </ul>
      </ul>
    </td>
  </tr>
</table> -->

# Cameras

#### PerspectiveCamera

[docs](https://pmndrs.github.io/drei/cameras/persective-camera)

#### OrthographicCamera

[docs](https://pmndrs.github.io/drei/cameras/orhtographic-camera)

#### CubeCamera

[docs](https://pmndrs.github.io/drei/cameras/cube-camera)

# Controls

#### CameraControls

[docs](https://pmndrs.github.io/drei/controls/camera-controls)

#### ScrollControls

[docs](https://pmndrs.github.io/drei/controls/scoll-controls)

#### PresentationControls

[docs](https://pmndrs.github.io/drei/controls/presentation-controls)

#### KeyboardControls

[docs](https://pmndrs.github.io/drei/controls/keybord-controls)

#### FaceControls

[docs](https://pmndrs.github.io/drei/controls/fase-controls)

#### MotionPathControls

[docs](https://pmndrs.github.io/drei/controls/motion-path-controls)

# Gizmos

#### GizmoHelper

[docs](https://pmndrs.github.io/drei/gizmos/gizmo-helper)

#### PivotControls

[docs](https://pmndrs.github.io/drei/gizmos/pivot-controls)

#### DragControls

[docs](https://pmndrs.github.io/drei/gizmos/drag-controls)

#### TransformControls

[docs](https://pmndrs.github.io/drei/gizmos/transfrom-controls)

#### Grid

[docs](https://pmndrs.github.io/drei/gizmos/grid)

#### Helper / useHelper

[docs](https://pmndrs.github.io/drei/gizmos/helper-use-helper)

# Shapes

#### Plane, Box, Sphere, Circle, Cone, Cylinder, Tube, Torus, TorusKnot, Ring, Tetrahedron, Polyhedron, Icosahedron, Octahedron, Dodecahedron, Extrude, Lathe, Shape

[docs](https://pmndrs.github.io/drei/shapes/mesh)

#### RoundedBox

[docs](https://pmndrs.github.io/drei/shapes/rounded-box)

#### ScreenQuad

[docs](https://pmndrs.github.io/drei/shapes/screen-quad)

#### Line

[docs](https://pmndrs.github.io/drei/shapes/line)

#### QuadraticBezierLine

[docs](https://pmndrs.github.io/drei/shapes/quadratic-bezier-line)

#### CubicBezierLine

[docs](https://pmndrs.github.io/drei/shapes/cubic-bezier-line)

#### CatmullRomLine

[docs](https://pmndrs.github.io/drei/shapes/catmull-rom-line)

#### Facemesh

[docs](https://pmndrs.github.io/drei/shapes/facemesh)

# Abstractions

#### Image

[docs](https://pmndrs.github.io/drei/abstractions/image)

#### Text

[docs](https://pmndrs.github.io/drei/abstractions/text)

#### Text3D

[docs](https://pmndrs.github.io/drei/abstractions/text3d)

#### Effects

[docs](https://pmndrs.github.io/drei/abstractions/effects)

#### PositionalAudio

[docs](https://pmndrs.github.io/drei/abstractions/postional-audio)

#### Billboard

[docs](https://pmndrs.github.io/drei/abstractions/billboard)

#### ScreenSpace

[docs](https://pmndrs.github.io/drei/abstractions/screen-space)

#### ScreenSizer

[docs](https://pmndrs.github.io/drei/abstractions/screen-sizer)

#### GradientTexture

[docs](https://pmndrs.github.io/drei/abstractions/gradiant-texture)

#### Edges

[docs](https://pmndrs.github.io/drei/abstractions/edges)

#### Outlines

[docs](https://pmndrs.github.io/drei/abstractions/outlines)

#### Trail

[docs](https://pmndrs.github.io/drei/abstractions/trail)

#### Sampler

[docs](https://pmndrs.github.io/drei/abstractions/sampler)

#### ComputedAttribute

[docs](https://pmndrs.github.io/drei/abstractions/computed-attribute)

#### Clone

[docs](https://pmndrs.github.io/drei/abstractions/clone)

#### useAnimations

[docs](https://pmndrs.github.io/drei/abstractions/use-animations)

#### MarchingCubes

[docs](https://pmndrs.github.io/drei/abstractions/marching-cubes)

#### Decal

[docs](https://pmndrs.github.io/drei/abstractions/decal)

#### Svg

[docs](https://pmndrs.github.io/drei/abstractions/svg)

#### AsciiRenderer

[docs](https://pmndrs.github.io/drei/abstractions/ascci-renderer)

#### Splat

[docs](https://pmndrs.github.io/drei/abstractions/splat)

# Shaders

#### MeshReflectorMaterial

[docs](https://pmndrs.github.io/drei/shaders/mesh-reflector-material)

#### MeshWobbleMaterial

[docs](https://pmndrs.github.io/drei/shaders/mesh-wobble-material)

#### MeshDistortMaterial

[docs](https://pmndrs.github.io/drei/shaders/mesh-distort-material)

#### MeshRefractionMaterial

[docs](https://pmndrs.github.io/drei/shaders/mesh-refraction-material)

#### MeshTransmissionMaterial

[docs](https://pmndrs.github.io/drei/shaders/mesh-transmission-material)

#### MeshDiscardMaterial

[docs](https://pmndrs.github.io/drei/shaders/mesh-discard-material)

#### PointMaterial

[docs](https://pmndrs.github.io/drei/shaders/point-material)

#### SoftShadows

[docs](https://pmndrs.github.io/drei/shaders/soft-shadows)

#### shaderMaterial

[docs](https://pmndrs.github.io/drei/shaders/shader-material)

# Modifiers

#### CurveModifier

[docs](https://pmndrs.github.io/drei/modifiers/curve-modifier)

# Misc

#### useContextBridge

[docs](https://pmndrs.github.io/drei/misc/use-context-bridge)

#### Example

[docs](https://pmndrs.github.io/drei/misc/example)

#### Html

[docs](https://pmndrs.github.io/drei/misc/html)

#### CycleRaycast

[docs](https://pmndrs.github.io/drei/misc/cycle-raycast)

#### Select

[docs](https://pmndrs.github.io/drei/misc/select)

#### Sprite Animator

[docs](https://pmndrs.github.io/drei/misc/sprite-animator)

#### Stats

[docs](https://pmndrs.github.io/drei/misc/stats)

#### StatsGl

[docs](https://pmndrs.github.io/drei/misc/stats-gl)

#### Wireframe

[docs](https://pmndrs.github.io/drei/misc/wireframe)

#### useDepthBuffer

[docs](https://pmndrs.github.io/drei/misc/use-depth-buffer)

#### Fbo / useFBO

[docs](https://pmndrs.github.io/drei/misc/fbo-use-fbo)

#### useCamera

[docs](https://pmndrs.github.io/drei/misc/use-camera)

#### CubeCamera / useCubeCamera

[docs](https://pmndrs.github.io/drei/misc/cube-camera-use-cube-camera)

#### DetectGPU / useDetectGPU

[docs](https://pmndrs.github.io/drei/misc/detect-gpu-use-detect-gpu)

#### useAspect

[docs](https://pmndrs.github.io/drei/misc/use-aspect)

#### useCursor

[docs](https://pmndrs.github.io/drei/misc/use-cursor)

#### useIntersect

[docs](https://pmndrs.github.io/drei/misc/use-intersect)

#### useBoxProjectedEnv

[docs](https://pmndrs.github.io/drei/misc/use-box-projected-env)

#### Trail / useTrail

[docs](https://pmndrs.github.io/drei/misc/trail-use-trail)

#### useSurfaceSampler

[docs](https://pmndrs.github.io/drei/misc/use-surface-sampler)

#### FaceLandmarker

[docs](https://pmndrs.github.io/drei/misc/face-landmarker)

# Loading

#### Loader

[docs](https://pmndrs.github.io/drei/loading/loader)

#### Progress / useProgress

[docs](https://pmndrs.github.io/drei/loading/use-progress)

#### Gltf / useGLTF

[docs](https://pmndrs.github.io/drei/loading/use-gltf)

#### Fbx / useFBX

[docs](https://pmndrs.github.io/drei/loading/fbx-use-fbx)

#### Texture / useTexture

[docs](https://pmndrs.github.io/drei/loading/textue-use-texture)

#### Ktx2 / useKTX2

[docs](https://pmndrs.github.io/drei/loading/ktx2-use-ktx2)

#### CubeTexture / useCubeTexture

[docs](https://pmndrs.github.io/drei/loading/cube-texture-use-cube-texture)

#### VideoTexture / useVideoTexture

[docs](https://pmndrs.github.io/drei/loading/video-texture-use-video-texture)

#### TrailTexture / useTrailTexture

[docs](https://pmndrs.github.io/drei/loading/trail-texture-use-trail-texture)

#### useFont

[docs](https://pmndrs.github.io/drei/loading/use-font)

#### useSpriteLoader

[docs](https://pmndrs.github.io/drei/loading/use-sprite-loader)

# Performance

#### Instances

[docs](https://pmndrs.github.io/drei/performance/instances)

#### Merged

[docs](https://pmndrs.github.io/drei/performance/merged)

#### Points

[docs](https://pmndrs.github.io/drei/performance/points)

#### Segments

[docs](https://pmndrs.github.io/drei/performance/segments)

#### Detailed

[docs](https://pmndrs.github.io/drei/performance/detailed)

#### Preload

[docs](https://pmndrs.github.io/drei/performance/preload)

#### BakeShadows

[docs](https://pmndrs.github.io/drei/performance/bake-shadows)

#### meshBounds

[docs](https://pmndrs.github.io/drei/performance/mesh-bounds)

#### AdaptiveDpr

[docs](https://pmndrs.github.io/drei/performance/adaptive-dpr)

#### AdaptiveEvents

[docs](https://pmndrs.github.io/drei/performance/adaptive-events)

#### Bvh

[docs](https://pmndrs.github.io/drei/performance/bvh)

#### PerformanceMonitor

[docs](https://pmndrs.github.io/drei/performance/performance-monitor)

# Portals

#### Hud

[docs](https://pmndrs.github.io/drei/portals/hud)

#### View

[docs](https://pmndrs.github.io/drei/portals/view)

#### RenderTexture

[docs](https://pmndrs.github.io/drei/portals/render-texture)

#### RenderCubeTexture

[docs](https://pmndrs.github.io/drei/portals/render-cube-texture)

#### Fisheye

[docs](https://pmndrs.github.io/drei/portals/fisheye)

#### Mask

[docs](https://pmndrs.github.io/drei/portals/mask)

#### MeshPortalMaterial

[docs](https://pmndrs.github.io/drei/portals/mesh-portal-material)

# Staging

#### Center

[docs](https://pmndrs.github.io/drei/staging/center)

#### Resize

[docs](https://pmndrs.github.io/drei/staging/resize)

#### BBAnchor

[docs](https://pmndrs.github.io/drei/staging/bb-anchor)

#### Bounds

[docs](https://pmndrs.github.io/drei/staging/bounds)

#### CameraShake

[docs](https://pmndrs.github.io/drei/staging/camera-shake)

#### Float

[docs](https://pmndrs.github.io/drei/staging/float)

#### Stage

[docs](https://pmndrs.github.io/drei/staging/stage)

#### Backdrop

[docs](https://pmndrs.github.io/drei/staging/backdrop)

#### Shadow

[docs](https://pmndrs.github.io/drei/staging/shadow)

#### Caustics

[docs](https://pmndrs.github.io/drei/staging/caustics)

#### ContactShadows

[docs](https://pmndrs.github.io/drei/staging/contact-shadows)

#### RandomizedLight

[docs](https://pmndrs.github.io/drei/staging/randomized-light)

#### AccumulativeShadows

[docs](https://pmndrs.github.io/drei/staging/acumulative-shadows)

#### SpotLight

[docs](https://pmndrs.github.io/drei/staging/spot-light)

#### SpotLightShadow

[docs](https://pmndrs.github.io/drei/staging/spot-light-shadow)

#### Environment

[docs](https://pmndrs.github.io/drei/staging/environment)

#### Lightformer

[docs](https://pmndrs.github.io/drei/staging/lightformer)

#### Sky

[docs](https://pmndrs.github.io/drei/staging/sky)

#### Stars

[docs](https://pmndrs.github.io/drei/staging/stars)

#### Sparkles

[docs](https://pmndrs.github.io/drei/staging/sparkles)

#### Cloud

[docs](https://pmndrs.github.io/drei/staging/cloud)

#### useEnvironment

[docs](https://pmndrs.github.io/drei/staging/use-environment)

#### MatcapTexture / useMatcapTexture

[docs](https://pmndrs.github.io/drei/staging/matcap-texture-use-matcap-texture)

#### NormalTexture / useNormalTexture

[docs](https://pmndrs.github.io/drei/staging/normal-texture-use-normal-texture)

#### ShadowAlpha

[docs](https://pmndrs.github.io/drei/staging/shadow-alpha)
