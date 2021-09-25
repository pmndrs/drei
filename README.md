![logo](logo.jpg)

[![Version](https://img.shields.io/npm/v/@react-three/drei?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@react-three/drei)
[![Downloads](https://img.shields.io/npm/dt/@react-three/drei.svg?style=flat&colorA=000000&colorB=000000)](https://www.npmjs.com/package/@react-three/drei)
[![Discord Shield](https://img.shields.io/discord/740090768164651008?style=flat&colorA=000000&colorB=000000&label=discord&logo=discord&logoColor=ffffff)](https://discord.gg/ZZjjNvJ)

A growing collection of useful helpers and abstractions for [react-three-fiber](https://github.com/pmndrs/react-three-fiber).

```bash
npm install @react-three/drei
```

:point_right: this package is using the stand-alone [`three-stdlib`](https://github.com/pmndrs/three-stdlib) instead of [`three/examples/jsm`](https://github.com/mrdoob/three.js/tree/dev/examples/jsm). :point_left:

### Basic usage:

```jsx
import { PerspectiveCamera, PositionalAudio, ... } from '@react-three/drei'
```

### React-native:

```jsx
import { PerspectiveCamera, PositionalAudio, ... } from '@react-three/drei/native'
```

The `native` route of the library **does not** export `Html` or `Loader`. The default export of the library is `web` which **does** export `Html` and `Loader`.

### Index

<table>
  <tr>
    <td valign="top">
      <ul>
        <li><a href="#cameras">Cameras</a></li>
        <ul>
          <li><a href="#perspectivecamera">PerspectiveCamera</a></li>
          <li><a href="#orthographiccamera">OrthographicCamera</a></li>
          <li><a href="#cubecamera">CubeCamera</a></li>
          <li><a href="#camerashake">CameraShake</a></li>
        </ul>
        <li><a href="#controls">Controls</a></li>
        <ul>
          <li><a href="#controls">OrbitControls</a></li>
          <li><a href="#controls">FlyControls</a></li>
          <li><a href="#controls">MapControls</a></li>
          <li><a href="#controls">DeviceOrientationControls</a></li>
          <li><a href="#controls">TrackballControls</a></li>
          <li><a href="#controls">TransformControls</a></li>
          <li><a href="#controls">PointerLockControls</a></li>
          <li><a href="#controls">FirstPersonControls</a></li>
        </ul>
        <li><a href="#abstractions">Abstractions</a></li>
        <ul>
          <li><a href="#text">Text</a></li>
          <li><a href="#line">Line</a></li>
          <li><a href="#quadraticbezierline">QuadraticBezierLine</a></li>
          <li><a href="#cubicbezierline">CubicBezierLine</a></li>
          <li><a href="#positionalaudio">PositionalAudio</a></li>
          <li><a href="#billboard">Billboard</a></li>
          <li><a href="#gizmoHelper">GizmoHelper</a></li>
          <li><a href="#environment">Environment</a></li>
          <li><a href="#effects">Effects</a></li>
          <li><a href="#gradienttexture">GradientTexture</a></li>
          <li><a href="#useanimations">useAnimations</a></li>
        </ul>
        <li><a href="#shaders">Shaders</a></li>
        <ul>
          <li><a href="#meshwobblematerial">MeshWobbleMaterial</a></li>
          <li><a href="#meshdistortmaterial">MeshDistortMaterial</a></li>
          <li><a href="#pointmaterial">PointMaterial</a></li>
          <li><a href="#sky">Sky</a></li>
          <li><a href="#stars">Stars</a></li>
          <li><a href="#contactshadows">ContactShadows</a></li>
          <li><a href="#reflector">Reflector</a></li>
          <li><a href="#reflector">SpotLight</a></li>
          <li><a href="#softshadows">softShadows</a></li>
          <li><a href="#shadermaterial">shaderMaterial</a></li>
        </ul>
      </ul>
    </td>
    <td valign="top">
      <ul>
        <li><a href="#misc">Misc</a></li>
        <ul>
          <li><a href="#html">Html</a></li>
          <li><a href="#cycleraycast">CycleRaycast</a></li>
          <li><a href="#shadow">Shadow</a></li>
          <li><a href="#stats">Stats</a></li>
          <li><a href="#center">Center</a></li>
          <li><a href="#depthbuffer">DepthBuffer</a></li>
          <li><a href="#usecontextbridge">useContextBridge</a></li>
          <li><a href="#usefbo">useFBO</a></li>
          <li><a href="#usecamera">useCamera</a></li>
          <li><a href="#usedetectgpu">useDetectGPU</a></li>
          <li><a href="#usehelper">useHelper</a></li>
          <li><a href="#useaspect">useAspect</a></li>
          <li><a href="#usecursor">useCursor</a></li>
        </ul>
        <li><a href="#loading">Loaders</a></li>
        <ul>
          <li><a href="#loader">Loader</a></li>
          <li><a href="#useprogress">useProgress</a></li>
          <li><a href="#usegltf">useGLTF</a></li>
          <li><a href="#usefbx">useFBX</a></li>
          <li><a href="#usetexture">useTexture</a></li>
          <li><a href="#usecubetexture">useCubeTexture</a></li>
        </ul>
        <li><a href="#modifiers">Modifiers</a></li>
        <ul>
          <li><a href="#curvemodifier">CurveModifier</a></li>
          <li><a href="#useedgesplit">useEdgeSplit</a></li>
          <li><a href="#usetessellation">useTessellation</a></li>
          <li><a href="#usesimplification">useSimplification</a></li>
        </ul>
        <li><a href="#prototyping">Prototyping</a></li>
        <ul>
          <li><a href="#usematcaptexture">useMatcapTexture</a></li>
          <li><a href="#usenormaltexture">useNormalTexture</a></li>
          <li><a href="#stage">Stage</a></li>
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
          <li><a href="#shapes">Parametric</a></li>
          <li><a href="#roundedbox">RoundedBox</a></li>
          <li><a href="#screenquad">Screenquad</a></li>
        </ul>
        <li><a href="#performance">Performance</a></li>
        <ul>
          <li><a href="#instances">Instances</a></li>
          <li><a href="#merged">Merged</a></li>
          <li><a href="#points">Points</a></li>          
          <li><a href="#detailed">Detailed</a></li>
          <li><a href="#preload">Preload</a></li>
          <li><a href="#bakeshadows">BakeShadows</a></li>
          <li><a href="#meshbounds">meshBounds</a></li>
          <li><a href="#adaptivedpr">AdaptiveDpr</a></li>
          <li><a href="#adaptiveevents">AdaptiveEvents</a></li>
          <li><a href="#usebvh">useBVH</a></li>
        </ul>
      </ul>
    </td>
  </tr>
</table>

# Cameras

#### PerspectiveCamera

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/camera-perspectivecamera--perspective-camera-scene-st)

A responsive [THREE.PerspectiveCamera](https://threejs.org/docs/index.html#api/en/cameras/PerspectiveCamera) that can set itself as the default.

```jsx
<PerspectiveCamera makeDefault {...props}>
  <mesh />
</PerspectiveCamera>
```

#### OrthographicCamera

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/camera-orthographiccamera--orthographic-camera-scene-st)

A responsive [THREE.OrthographicCamera](https://threejs.org/docs/index.html#api/en/cameras/OrthographicCamera) that can set itself as the default.

```jsx
<OrthographicCamera makeDefault {...props}>
  <mesh />
</OrthographicCamera>
```

#### CameraShake

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/camera-camerashake--camera-shake-st)

A component for applying a configurable camera shake effect. Currently only supports rotational camera shake. Pass a ref to recieve the `ShakeController` API.

If you use shake in combination with controls make sure to set the `makeDefault` prop on your controls, in that case you do not have to pass them via the `controls` prop.

```js
const config = {
  maxYaw: 0.1, // Max amount camera can yaw in either direction
  maxPitch: 0.1, // Max amount camera can pitch in either direction
  maxRoll: 0.1, // Max amount camera can roll in either direction
  yawFrequency: 1, // Frequency of the the yaw rotation
  pitchFrequency: 1, // Frequency of the pitch rotation
  rollFrequency: 1, // Frequency of the roll rotation
  intensity: 1, // initial intensity of the shake
  decay: false, // should the intensity decay over time
  decayRate: 0.65, // if decay = true this is the rate at which intensity will reduce at
  controls: undefined, // if using orbit controls, pass a ref here so we can update the rotation
}

<CameraShake {...config} />
```

```ts
interface ShakeController {
  getIntensity: () => number
  setIntensity: (val: number) => void
}
```

#### CubeCamera

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.pmnd.rs/?path=/story/camera-cubecamera--default-story)

A [THREE.CubeCamera](https://threejs.org/docs/index.html#api/en/cameras/CubeCamera) that returns its texture as a render-prop. It makes children invisible while rendering to the internal buffer so that they are not included in the reflection.

Using the `frames` prop you can control if this camera renders indefinitively or statically (a given number of times).
If you have two static objects in the scene, make it `frames={2}` for instance, so that both objects get to "see" one another in the reflections, which takes multiple renders.
If you have moving objects, unset the prop and use a smaller `resolution` instead.

```jsx
<CubeCamera resolution={256} frames={Infinity} fog={customFog} near={1} far={1000}>
  {(texture) => (
    <mesh>
      <sphereGeometry />
      <meshStandardMaterial envMap={texture} />
    </mesh>
  )}
</CubeCamera>
```

# Controls

If available controls have damping enabled by default, they manage their own updates, remove themselves on unmount, are compatible with the `invalidateFrameloop` canvas-flag. They inherit all props from their underlying [THREE controls](https://github.com/mrdoob/three.js/tree/dev/examples/jsm/controls).

Some controls allow you to set `makeDefault`, similar to, for instance, PerspectiveCamera. This will set react-three-fiber's `controls` field in the root store. This can make it easier in situations where you want controls to be known and other parts of the app could respond to it. Some drei controls already take it into account, like CameraShake and Gizmo.

Drei currently exports OrbitControls [![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/controls-orbitcontrols--orbit-controls-story), MapControls [![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/controls-mapcontrols--map-controls-scene-st), TrackballControls, FlyControls, DeviceOrientationControls, TransformControls [![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/controls-transformcontrols--transform-controls-story), PointerLockControls [![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/controls-pointerlockcontrols--pointer-lock-controls-scene-st), FirstPersonControls [![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/controls-firstpersoncontrols--first-person-controls-story)

Every control component can be used with a custom camera using the `camera` prop:

```jsx
const myCamera = useResource()

return (
  <>
    <PerspectiveCamera ref={myCamera} position={[0, 5, 5]} />
    <OrbitControls camera={myCamera.current} />
  </>
)
```

PointerLockControls additionally supports a `selector` prop, which enables the binding of `click` event handlers for control activation to other elements than `document` (e.g. a 'Click here to play' button). All elements matching the `selector` prop will activate the controls.

# Shapes

[Buffer-geometry](https://threejs.org/docs/index.html#api/en/core/BufferGeometry) short-cuts for Plane, Box, Sphere, Circle, Cone, Cylinder, Tube, Torus, TorusKnot, Ring, Tetrahedron, Polyhedron, Icosahedron, Octahedron, Dodecahedron, Extrude, Lathe, Parametric.

```jsx
<Plane args={[2, 2]} />
<Sphere>
  <meshBasicMaterial attach="material" color="hotpink" />
</Sphere>
```

#### RoundedBox

A box buffer geometry with rounded corners, done with extrusion.

```jsx
<RoundedBox args={[1, 1, 1]} radius={0.05} smoothness={4} {...meshProps}>
  <meshPhongMaterial attach="material" color="#f3f3f3" wireframe />
</RoundedBox>
```

#### ScreenQuad

```jsx
<ScreenQuad>
  <myMaterial />
</ScreenQuad>
```

A triangle that fills the screen, ideal for full-screen fragment shader work (raymarching, postprocessing).
👉 [Why a triangle?](https://www.cginternals.com/en/blog/2018-01-10-screen-aligned-quads-and-triangles.html)
👉 [Use as a post processing mesh](https://medium.com/@luruke/simple-postprocessing-in-three-js-91936ecadfb7)

# Abstractions

#### Text

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/abstractions-text--text-st)

Hi-quality text rendering w/ signed distance fields (SDF) and antialiasing, using [troika-3d-text](https://github.com/protectwise/troika/tree/master/packages/troika-3d-text). All of troikas props are valid!

```jsx
<Text color="black" anchorX="center" anchorY="middle">
  hello world!
</Text>
```

#### Line

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/abstractions-line--basic-line)

Renders a THREE.Line2.

```jsx
<Line
  points={[[0, 0, 0], ...]}       // Array of points
  color="black"                   // Default
  lineWidth={1}                   // In pixels (default)
  dashed={false}                  // Default
  vertexColors={[[0, 0, 0], ...]} // Optional array of RGB values for each point
  {...lineProps}                  // All THREE.Line2 props are valid
  {...materialProps}              // All THREE.LineMaterial props are valid
/>
```

#### QuadraticBezierLine

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/abstractions-line--quadratic-bezier)

Renders a THREE.Line2 using THREE.QuadraticBezierCurve3 for interpolation.

```jsx
<QuadraticBezierLine
  start={[0, 0, 0]}               // Starting point
  end={[10, 0, 10]}               // Ending point
  mid={[5, 0, 5]}                 // Optional control point
  color="black"                   // Default
  lineWidth={1}                   // In pixels (default)
  dashed={false}                  // Default
  vertexColors={[[0, 0, 0], ...]} // Optional array of RGB values for each point
  {...lineProps}                  // All THREE.Line2 props are valid
  {...materialProps}              // All THREE.LineMaterial props are valid
/>
```

#### CubicBezierLine

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/abstractions-line--cubic-bezier)

Renders a THREE.Line2 using THREE.CubicBezierCurve3 for interpolation.

```jsx
<CubicBezierLine
  start={[0, 0, 0]}               // Starting point
  end={[10, 0, 10]}               // Ending point
  midA={[5, 0, 0]}                // First control point
  midB={[0, 0, 5]}                // Second control point
  color="black"                   // Default
  lineWidth={1}                   // In pixels (default)
  dashed={false}                  // Default
  vertexColors={[[0, 0, 0], ...]} // Optional array of RGB values for each point
  {...lineProps}                  // All THREE.Line2 props are valid
  {...materialProps}              // All THREE.LineMaterial props are valid
/>
```

#### PositionalAudio

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/abstractions-positionalaudio--positional-audio-scene-st) ![](https://img.shields.io/badge/-suspense-brightgreen)

A wrapper around [THREE.PositionalAudio](https://threejs.org/docs/index.html#api/en/audio/PositionalAudio). Add this to groups or meshes to tie them to a sound that plays when the camera comes near.

```jsx
<PositionalAudio
  url="/sound.mp3"
  distance={1}
  loop
  {...props} // All THREE.PositionalAudio props are valid
/>
```

#### Billboard

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.pmnd.rs/?path=/story/abstractions-billboard--billboard-st)

Adds a `<group />` that always faces the camera.

```jsx
<Billboard
  follow={true}
  lockX={false}
  lockY={false}
  lockZ={false} // Lock the rotation on the z axis (default=false)
>
  <Text fontSize={1}>I'm a billboard</Text>
</Billboard>
```

#### GizmoHelper

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.pmnd.rs/?path=/story/gizmos-gizmohelper--default-story)

Used by widgets that visualize and control camera position.

Two example gizmos are included: GizmoViewport and GizmoViewcube, and `useGizmoContext` makes it easy to create your own.

Make sure to set the `makeDefault` prop on your controls, in that case you do not have to define the onTarget and onUpdate props.

```jsx
<GizmoHelper
  alignment="bottom-right" // widget alignment within scene
  margin={[80, 80]} // widget margins (X, Y)
  onUpdate={/* called during camera animation  */}
  onTarget={/* return current camera target (e.g. from orbit controls) to center animation */}
  renderPriority={/* use renderPriority to prevent the helper from disappearing if there is another useFrame(..., 1)*/}
>
  <GizmoViewport axisColors={['red', 'green', 'blue']} labelColor="black" />
  {/* alternative: <GizmoViewcube /> */}
</GizmoHelper>
```

#### Environment

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.pmnd.rs/?path=/story/abstractions-environment--environment-st)

Sets up a global cubemap, which affects the default `scene.environment`, and optionally `scene.background`, unless a custom scene has been passed. A selection of [presets](src/helpers/environment-assets.ts) from [HDRI Haven](https://hdrihaven.com/) are available for convenience. If you pass an array of files it will use THREE.CubeTextureLoader.

```jsx
<Environment
  background={false}
  files={['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']}
  path="/"
  preset={null}
  scene={undefined} // adds the ability to pass a custom THREE.Scene
/>
```

If you provide a single string it will use THREE.RGBELoader.

```jsx
<Environment files="file.hdr" />
```

#### Effects

Abstraction around threes own [EffectComposer](https://threejs.org/docs/index.html#examples/en/postprocessing/EffectComposer).

```jsx
<Effects multisamping={8} renderIndex={1} disableGamma={false} disableRenderPass={false}>
  <lUTPass attachArray="passes" lut={texture3D} />
</Effects>
```

#### GradientTexture

A declarative THREE.Texture which attaches to "map" by default. You can use this to create gradient backgrounds.

```jsx
<mesh>
  <planeGeometry />
  <meshBasicMaterial depthWrite={false}>
    <GradientTexture
      stops={[0, 1]} // As many stops as you want
      colors={['aquamarine', 'hotpink']} // Colors need to match the number of stops
      size={1024} // Size is optional, default = 1024
    />
  </meshBasicMaterial>
</mesh>
```

#### useAnimations

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.pmnd.rs/?path=/story/abstractions-useanimations--use-animations-st)

A hook that abstracts [AnimationMixer](https://threejs.org/docs/index.html#api/en/animation/AnimationMixer).

```jsx
const { nodes, materials, animations } = useGLTF(url)
const { ref, mixer, names, actions, clips } = useAnimations(animations)
useEffect(() => {
  actions?.jump.play()
})
return (
  <mesh ref={ref} />
```

The hook can also take a pre-existing root (which can be a plain object3d or a reference to one):

```jsx
const { scene, animations } = useGLTF(url)
const { actions } = useAnimations(animations, scene)
return <primitive object={scene} />
```

# Shaders

#### MeshWobbleMaterial

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/shaders-meshwobblematerial--mesh-wobble-material-st)

This material makes your geometry wobble and wave around. It was taken from the [threejs-examples](https://threejs.org/examples/#webgl_materials_modified) and adapted into a self-contained material.

```jsx
<mesh>
  <boxBufferGeometry attach="geometry" />
  <MeshWobbleMaterial attach="material" factor={1} speed={10} />
</mesh>
```

#### MeshDistortMaterial

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/shaders-meshdistortmaterial--mesh-distort-material-st)

This material makes your geometry distort following simplex noise.

```jsx
<mesh>
  <boxBufferGeometry attach="geometry" />
  <MeshDistortMaterial attach="material" distort={1} speed={10} />
</mesh>
```

#### PointMaterial

An antialiased round dot that always keeps the same size.

```jsx
<points>
  <PointMaterial scale={20} />
</points>
```

#### Sky

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/shaders-sky--sky-st)

Adds a [sky](https://threejs.org/examples/webgl_shaders_sky.html) to your scene.

```jsx
<Sky distance={450000} sunPosition={[0, 1, 0]} inclination={0} azimuth={0.25} {...props} />
```

#### Stars

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/shaders-stars--stars-st)

Adds a blinking shader-based starfield to your scene.

```jsx
<Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
```

#### ContactShadows

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/shaders-contactshadows--contact-shadow-st)

A [contact shadow](https://threejs.org/examples/?q=con#webgl_shadow_contact) implementation.

```jsx
<ContactShadows opacity={1} width={1} height={1} blur={1} far={10} resolution={256} />
```

Since this is a rather expensive effect you can limit the amount of frames it renders when your objects are static. For instance making it render only once:

```jsx
<ContactShadows frames={1} />
```

#### Reflector

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/misc-reflector--reflector-st)

Easily add reflections and/or blur to a planar surface. This reflector can also blur and takes surface roughness into account for a more realistic effect.

```jsx
<Reflector
  args={[1, 1]} // PlaneBufferGeometry arguments
  resolution={256} // Off-buffer resolution, lower=faster, higher=better quality
  mirror={0.5} // Mirror environment, 0 = texture colors, 1 = pick up env colors
  mixBlur={1.0} // How much blur mixes with surface roughness (default = 0), note that this can affect performance
  mixStrength={0.5} // Strength of the reflections
  depthScale={1} // Scale the depth factor (0 = no depth, default = 0)
  minDepthThreshold={0.9} // Lower edge for the depthTexture interpolation (default = 0)
  maxDepthThreshold={1} // Upper edge for the depthTexture interpolation (default = 0)
  depthToBlurRatioBias={0.25} // Adds a bias factor to the depthTexture before calculating the blur amount [blurFactor = blurTexture * (depthTexture + bias)]. It accepts values between 0 and 1, default is 0.25. An amount > 0 of bias makes sure that the blurTexture is not too sharp because of the multiplication with the depthTexture
  distortion={0} // Amount of distortion based on the distortionMap texture
  distortionMap={distortionTexture} // The red channel of this texture is used as the distortion map. Default is null
  debug={0} /* Depending on the assigned value, one of the following channels is shown:
    0 = no debug
    1 = depth channel
    2 = base channel
    3 = distortion channel
    4 = lod channel (based on the roughness)
  */
>
  {(Material, props) => <Material {...props}>}
</Reflector>
```

#### SpotLight

A Volumetric spotligt.

```jsx
<SpotLight
  distance={5}
  angle={0.15}
  attenuation={5}
  anglePower={5} // Diffuse-cone anglePower (default: 5)
/>
```

Optionally you can provide a depth-buffer which converts the spotlight into a soft particle.

```jsx
function Foo() {
  const [depthBuffer, setDepthBuffer] = useState()
  return (
    <>
      <DepthBuffer ref={setDepthBuffer} size={256}>
      <SpotLight depthBuffer={depthBuffer} />
```

#### softShadows

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/shaders-softshadows--soft-shadows-st)

Injects [percent closer soft shadows (pcss)](https://threejs.org/examples/?q=pcss#webgl_shadowmap_pcss) into threes shader chunk.

```jsx
softShadows({
  frustum: 3.75,
  size: 0.005,
  near: 9.5,
  samples: 17,
  rings: 11, // Rings (default: 11) must be a int
})
```

#### shaderMaterial

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/shaders-shadermaterial--shader-material-story)

Creates a THREE.ShaderMaterial for you with easier handling of uniforms, which are also automatically declared as setter/getters on the object.

```jsx
import { extend } from 'react-three-fiber'
import glsl from 'babel-plugin-glsl/macro'

const ColorShiftMaterial = shaderMaterial(
  { time: 0, color: new THREE.Color(0.2, 0.0, 0.1) },
  // vertex shader
  glsl`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment shader
  glsl`
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;
    void main() {
      gl_FragColor.rgba = vec4(0.5 + 0.3 * sin(vUv.yxx + time) + color, 1.0);
    }
  `
)

extend({ ColorShiftMaterial })

// in your component
<mesh>
  <colorShiftMaterial attach="material" color="hotpink" time={1} />
</mesh>
```

# Misc

#### useContextBridge

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.pmnd.rs/?path=/story/misc-usecontextbridge--use-context-bridge-st)

Allows you to forward contexts provided above the `<Canvas />` to be consumed from within the `<Canvas />` normally

```jsx
function SceneWrapper() {
  // bridge any number of contexts
  const ContextBridge = useContextBridge(ThemeContext, GreetingContext)
  return (
    <Canvas>
      <ContextBridge>
        <Scene />
      </ContextBridge>
    </Canvas>
  )
}

function Scene() {
  // we can now consume a context within the Canvas
  const theme = React.useContext(ThemeContext)
  const greeting = React.useContext(GreetingContext)
  return (
    //...
  )
}
```

#### Html

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/misc-html--html-st) ![](https://img.shields.io/badge/-Dom only-red)

Allows you to tie HTML content to any object of your scene. It will be projected to the objects whereabouts automatically.

```jsx
<Html
  as='div' // Wrapping element (default: 'div')
  prepend // Project content behind the canvas (default: false)
  center // Adds a -50%/-50% css transform (default: false) [ignored in transform mode]
  fullscreen // Aligns to the upper-left corner, fills the screen (default:false) [ignored in transform mode]
  distanceFactor={10} // If set (default: undefined), children will be scaled by this factor, and also by distance to a PerspectiveCamera / zoom by a OrthographicCamera.
  zIndexRange={[100, 0]} // Z-order range (default=[16777271, 0])
  portal={domnodeRef} // Reference to target container (default=undefined)
  transform // If true, applies matrix3d transformations (default=false)
  sprite // Renders as sprite, but only in transform mode (default=false)
  calculatePosition={(el: Object3D, camera: Camera, size: { width: number; height: number }) => number[]} // Override default positioning function. (default=undefined) [ignored in transform mode]
  occlude={[ref]} // Can be true or a Ref<Object3D>[], true occludes the entire scene (default: undefined)
  onOcclude={(visible) => null} // Callback when the visibility changes (default: undefined)
  {...groupProps} // All THREE.Group props are valid
  {...divProps} // All HTMLDivElement props are valid
>
  <h1>hello</h1>
  <p>world</p>
</Html>
```

Html can hide behind geometry using the `occlude` prop.

```jsx
// Raytrace the entire scene
<Html occlude />
// Raytrace only specific elements
<Html occlude={[ref1, ref2]} />
```

When the Html object hides it sets the opacity prop on the innermost div. If you want to animate or control the transition yourself then you can use `onOcclude`.

```jsx
const [hidden, set] = useState()

<Html
  occlude
  onOcclude={set}
  style={{
    transition: 'all 0.5s',
    opacity: hidden ? 0 : 1,
    transform: `scale(${hidden ? 0.5 : 1})`
  }} />
```

#### CycleRaycast

This component allows you to cycle through all objects underneath the cursor with optional visual feedback. This can be useful for non-trivial selection, CAD data, housing, everything that has layers. It does this by changing the raycasters filter function and then refreshing the raycaster.

For this to work properly your event handler have to call `event.stopPropagation()`, for instance in `onPointerOver` or `onClick`, only one element can be selective for cycling to make sense.

```jsx
<CycleRaycast
  preventDefault={true} // Call event.preventDefault() (default: true)
  scroll={true} // Wheel events (default: true)
  keyCode={9} // Keyboard events (default: 9 [Tab])
  onChanged={(objects, cycle) => console.log(objects, cycle)} // Optional onChanged event
/>
```

#### Shadow

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/misc-shadow--shadow-st)

A cheap canvas-texture-based circular gradient.

```jsx
<Shadow
  color="black"
  colorStop={0}
  opacity={0.5}
  fog={false} // Reacts to fog (default=false)
/>
```

#### Stats

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/misc-stats--default-story)

Adds [stats](https://github.com/mrdoob/stats.js/) to document.body. It takes over the render-loop!

```jsx
<Stats showPanel={0} className="stats" {...props} />
```

You can choose to mount Stats to a different DOM Element - for example, for custom styling:

```jsx
const node = useRef(document.createElement('div'))

useEffect(() => {
  node.current.id = 'test'
  document.body.appendChild(node.current)

  return () => document.body.removeChild(node.current)
}, [])

return <Stats parent={parent} />
```

#### Center

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/misc-center--default-story)

Calculates a boundary box and centers its children accordingly. `alignTop` makes adjusts it so that it's sits flush on y=0.

```jsx
<Center alignTop>
  <mesh />
</Center>
```

#### DepthBuffer

Renders the scene into a depth-buffer. Often effects depend on it, in order to minimize performance impact you can use this component.

```jsx
function Foo() {
  const [depthBuffer, setDepthBuffer] = useState()
  return (
    <>
      <DepthBuffer ref={setDepthBuffer} size={256}>
      <SomethingThatNeedsADepthBuffer depthBuffer={depthBuffer} />
```

#### useFBO

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/misc-usefbo--use-fbo-st)

Creates a `THREE.WebGLRenderTarget` or `THREE.WebGLMultisampleRenderTarget`.

```jsx
const target = useFBO({
  multisample: true,
  stencilBuffer: false,
})
```

The rendertarget is automatically disposed when unmounted.

#### useCamera

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/misc-usecamera--use-camera-st)

A hook for the rare case when you are using non-default cameras for heads-up-displays or portals, and you need events/raytracing to function properly (raycasting uses the default camera otherwise).

```jsx
<mesh raycast={useCamera(customCamera)} />
```

#### useHelper

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/misc-usehelper--default-story)

A hook for a quick way to add helpers to existing nodes in the scene. It handles removal of the helper on unmount and auto-updates it by default.

```jsx
const mesh = useRef()
useHelper(mesh, BoxHelper, 'cyan')

<mesh ref={mesh} ... />
```

#### useDetectGPU

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.pmnd.rs/?path=/story/misc-usedetectgpu)

This hook uses [DetectGPU by @TimvanScherpenzeel](https://github.com/TimvanScherpenzeel/detect-gpu), wrapped into suspense, to determine what tier should be assigned to the user's GPU.

👉 This hook CAN be used outside the react-three-fiber `Canvas`.

```jsx
function App() {
  const GPUTier = useDetectGPU()
  // show a fallback for mobile or lowest tier GPUs
  return (
    {(GPUTier.tier === "0" || GPUTier.isMobile) ? <Fallback /> : <Canvas>...</Canvas>

<Suspense fallback={null}>
  <App />
```

#### useAspect

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/misc-useaspect--default-story)

This hook calculates aspect ratios (for now only what in css would be `image-size: cover` is supported). You can use it to make an image fill the screen. It is responsive and adapts to viewport resize. Just give the hook the image bounds in pixels. It returns an array: `[width, height, 1]`.

```jsx
const scale = useAspect(
  1024,                     // Pixel-width
  512,                      // Pixel-height
  1                         // Optional scaling factor
)
return (
  <mesh scale={scale}>
    <planeBufferGeometry />
    <meshBasicMaterial map={imageTexture} />
```

#### useCursor

A small hook that sets the css body cursor according to the hover state of a mesh, so that you can give the use visual feedback when the mouse enters a shape. Arguments 1 and 2 determine the style, the defaults are: onPointerOver = 'pointer', onPointerOut = 'auto'.

```jsx
const [hovered, set] = useState()
useCursor(hovered, /*'pointer', 'auto'*/)
return (
  <mesh onPointerOver={() => set(true)} onPointerOut={() => set(false)}>
```

# Modifiers

#### CurveModifier

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.pmnd.rs/?path=/story/modifiers-curvemodifier)

Given a curve will replace the children of this component with a mesh that move along said curve calling the property `moveAlongCurve` on the passed ref. Uses [three's Curve Modifier](https://threejs.org/examples/?q=curve#webgl_modifier_curve)

```jsx
const curveRef = useRef()

const curve = React.useMemo(() => new THREE.CatmullRomCurve3([...handlePos], true, 'centripetal'), [handlePos])

return (
  <CurveModifier ref={curveRef} curve={curve}>
    <mesh>
      <boxBufferGeometry args={[10, 10]} />
    </mesh>
  </CurveModifier>
)
```

#### useEdgeSplit

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.pmnd.rs/?path=/story/modifiers-useedgesplit)

This hook mutates a mesh geometry using [three's Edge Split modifier](https://threejs.org/examples/?q=modifier#webgl_modifier_edgesplit). The first parameter is the cut-off angle, and the second parameter is a `tryKeepNormals` flag (default `true`).

```jsx
const meshRef = useEdgeSplit(Math.PI / 2)

return (
  <mesh ref={meshRef}>
    <boxBufferGeometry args={[10, 10]} />
  </mesh>
)
```

#### useSimplification

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.pmnd.rs/?path=/story/modifiers-usesimplification)

This hook mutates a mesh geometry using [three's Simplification modifier](https://threejs.org/examples/webgl_modifier_simplifier.html).

👉 The simplification code is based on [this algorithm](http://www.melax.com/polychop/).

```jsx
const meshRef = useSimplification(0.5)

return (
  <mesh ref={meshRef}>
    <octahedronBufferGeometry args={[2, 5]} />
  </mesh>
)
```

#### useTessellation

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.pmnd.rs/?path=/story/modifiers-usetessellation)

This hook mutates a mesh geometry using [three's Tessellation modifier](https://threejs.org/examples/?q=tess#webgl_modifier_tessellation). It will break-up faces withe edge longer than the maxEdgeLength parameter.

```jsx
const meshRef = useTessellation(2, 8)

return (
  <mesh ref={meshRef}>
    <octahedronBufferGeometry args={[2, 2]} />
  </mesh>
)
```

# Loading

#### Loader

![](https://img.shields.io/badge/-Dom only-red)

A quick and easy loading overlay component that you can drop on top of your canvas. It's intended to "hide" the whole app, so if you have multiple suspense wrappers in your application, you should use multiple loaders. It will show an animated loadingbar and a percentage.

```jsx
<Canvas>
  <Suspense fallback={null}>
    <AsyncModels />
  </Suspense>
</Canvas>
<Loader />
```

You can override styles, too.

```jsx
<Loader
  containerStyles={...container} // Flex layout styles
  innerStyles={...inner} // Inner container styles
  barStyles={...bar} // Loading-bar styles
  dataStyles={...data} // Text styles
  dataInterpolation={(p) => `Loading ${p.toFixed(2)}%`} // Text
  initialState={(active) => active} // Initial black out state
>
```

#### useProgress

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/misc-useprogress--use-progress-scene-st)

A convenience hook that wraps `THREE.DefaultLoadingManager`'s progress status.

```jsx
function Loader() {
  const { active, progress, errors, item, loaded, total } = useProgress()
  return <Html center>{progress} % loaded</Html>
}

return (
  <Suspense fallback={<Loader />}>
    <AsyncModels />
  </Suspense>
)
```

If you don't want your progress component to re-render on all changes you can be specific as to what you need, for instance if the component is supposed to collect errors only. Look into [zustand](https://github.com/react-spring/zustand) for more info about selectors.

```jsx
const errors = useProgress((state) => state.errors)
```

👉 Note that your loading component does not have to be a suspense fallback. You can use it anywhere, even in your dom tree, for instance for overlays.

#### useGLTF

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.pmnd.rs/?path=/story/loaders-gltf)

A convenience hook that uses `useLoader` and `GLTFLoader`, it defaults to CDN loaded draco binaries (`https://www.gstatic.com/draco/v1/decoders/`) which are only loaded for compressed models.

```jsx
useGLTF(url)

useGLTF(url, '/draco-gltf')

useGLTF.preload(url)
```

#### useFBX

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.pmnd.rs/?path=/story/loaders-fbx)

A convenience hook that uses `useLoader` and `FBXLoader`:

```jsx
useFBX(url)

function SuzanneFBX() {
  let fbx = useFBX('suzanne/suzanne.fbx')
  return <primitive object={fbx} dispose={null} />
}
```

#### useTexture

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.pmnd.rs/?path=/story/loaders-texture)

A convenience hook that uses `useLoader` and `TextureLoader`

```jsx
const texture = useTexture(url)
const [texture1, texture2] = useTexture([texture1, texture2])
```

You can also use key: url objects:

```jsx
const props = useTexture({
  metalnessMap: url1,
  map: url2,
})
return <meshStandardMaterial {...props} />
```

#### useCubeTexture

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.pmnd.rs/?path=/story/loaders-cubetexture)

A convenience hook that uses `useLoader` and `CubeTextureLoader`

```jsx
const envMap = useCubeTexture(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'], { path: 'cube/' })
```

# Prototyping

#### useMatcapTexture

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.pmnd.rs/?path=/story/prototyping-usematcaptexture) ![](https://img.shields.io/badge/-suspense-brightgreen)

Loads matcap textures from this repository: https://github.com/emmelleppi/matcaps

(It is a fork of this repository: https://github.com/nidorx/matcaps)

```jsx
const [matcap, url] = useMatcapTexture(
 0, // index of the matcap texture https://github.com/emmelleppi/matcaps/blob/master/matcap-list.json
 1024 // size of the texture ( 64, 128, 256, 512, 1024 )
)

return (
 ...
 <meshMatcapMaterial matcap={matcap} />
 ...
)
```

👉 You can also use the exact name of the matcap texture, like so:

```jsx
const [matcap] = useMatcapTexture('3E2335_D36A1B_8E4A2E_2842A5')
```

👉 Use the `url` to download the texture when you are ready for production!

#### useNormalTexture

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.pmnd.rs/?path=/story/prototyping-usenormaltexture) ![](https://img.shields.io/badge/-suspense-brightgreen)

Loads normal textures from this repository: https://github.com/emmelleppi/normal-maps

```jsx
const [normalMap, url] = useNormalTexture(
  1, // index of the normal texture - https://github.com/emmelleppi/normal-maps/blob/master/normals.json
  // second argument is texture attributes
  {
    offset: [0, 0],
    repeat: [normRepeat, normRepeat],
    anisotropy: 8
  }
)

return (
  ...
  <meshStandardMaterial normalMap={normalMap} />
  ...
)

```

#### Stage

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.pmnd.rs/?path=/story/prototyping-stage--stage-st)

Creates a "stage" with proper studio lighting, content centered and planar, shadows and ground-contact shadows.

Make sure to set the `makeDefault` prop on your controls, in that case you do not need to provide `controls` via prop.

```jsx
<Stage contactShadow shadows adjustCamera intensity={1} environment="city" preset="rembrandt" controls={controlsRef}>
  <mesh />
</Stage>
```

# Performance

#### Instances

A wrapper around [THREE.InstancedMesh](https://threejs.org/docs/index.html?q=instan#api/en/objects/InstancedMesh). This allows you to define hundreds of thousands of objects in a single draw call, but declaratively!

```jsx
<Instances
  limit={1000} // Optional: max amount of items (for calculating buffer size)
  range={1000} // Optional: draw-range
>
  <boxGeometry />
  <meshStandardMaterial />
  <Instance
    color="red"
    scale={2}
    position={[1, 2, 3]}
    rotation={[Math.PI / 3, 0, 0]}
    onClick={onClick} ... />
  // As many as you want, make them conditional, mount/unmount them, lazy load them, etc ...
</Instances>
```

You can nest Instances and use relative coordinates!

```jsx
<group position={[1, 2, 3]} rotation={[Math.PI / 2, 0, 0]}>
  <Instance />
</group>
```

Instances can also receive non-instanced objects, for instance annotations!

```jsx
<Instance>
  <Html>hello from the dom</Html>
</Instance>
```

You can define events on them!

```jsx
<Instance onClick={...} onPointerOver={...} />
```

#### Merged

This creates instances for existing meshes and allows you to use them cheaply in the same scene graph. Each type will cost you exactly one draw call, no matter how many you use.

```jsx
<Merged meshes={[box, sphere]}>
  {(Box, Sphere) => (
    <>
      <Box position={[-2, -2, 0]} color="red" />
      <Box position={[-3, -3, 0]} color="tomato" />
      <Sphere scale={0.7} position={[2, 1, 0]} color="green" />
      <Sphere scale={0.7} position={[3, 2, 0]} color="teal" />
    </>
  )}
</Merged>
```

You may also use object notation, which is good for loaded models.

```jsx
function Model({ url }) {
  const { nodes } = useGLTF(url)
  return (
    <Merged meshes={nodes}>
      {({ Screw, Filter, Pipe }) => (
        <>
          <Screw />
          <Filter position={[1, 2, 3]} />
          <Pipe position={[4, 5, 6]} />
        </>
      )}
    </Merged>
  )
}
```

#### Points

A wrapper around [THREE.Points](https://threejs.org/docs/index.html?q=points#api/en/objects/Points). It has the same api and properties as Instances.

```jsx
<Points
  limit={1000} // Optional: max amount of items (for calculating buffer size)
  range={1000} // Optional: draw-range
>
  <pointsMaterial />
  <Point position={[1, 2, 3]} color="red" onClick={onClick} onPointerOver={onPointerOver} ... />
  // As many as you want, make them conditional, mount/unmount them, lazy load them, etc ...
</Points>
```

If you have a material that supports vertex colors (like drei/PointMaterial) you can have individual colors!

```jsx
<Points>
  <PointMaterial />
  <Point color="hotpink" />
```

Otherwise use any material you like:

```jsx
<Points>
  <pointsMaterial vertexColors size={10} />
```

#### Detailed

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/abstractions-detailed--detailed-st)

A wrapper around [THREE.LOD](https://threejs.org/docs/index.html#api/en/objects/LOD) (Level of detail).

```jsx
<Detailed distances={[0, 10, 20]} {...props}>
  <mesh geometry={highDetail} />
  <mesh geometry={mediumDetail} />
  <mesh geometry={lowDetail} />
</Detailed>
```

#### Preload

The WebGLRenderer will compile materials only when they hit the frustrum, which can cause jank. This component precompiles the scene using [gl.compile](https://threejs.org/docs/index.html#api/en/renderers/WebGLRenderer.compile) which makes sure that your app is responsive from the get go.

By default gl.compile will only preload visible objects, if you supply the `all` prop, it will circumvent that. With the `scene` and `camera` props you could also use it in portals.

```jsx
<Canvas>
  <Suspense fallback={null}>
    <Model />
    <Preload all />
```

#### BakeShadows

Sets `gl.shadowMap.autoUpdate` to `false` while mounted and requests a single `gl.shadowMap.needsUpdate = true` afterwards. This freezes all shadow maps the moment this component comes in, which makes shadows performant again (with the downside that they are now static). Mount this component in lock-step with your models, for instance by dropping it into the same suspense boundary of a model that loads.

```jsx
<Canvas>
  <Suspense fallback={null}>
    <Model />
    <BakeShadows />
```

#### meshBounds

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/misc-meshbounds--mesh-bounds-st)

A very fast, but often good-enough bounds-only raycast for meshes. You can use this if performance has precedence over pointer precision.

```jsx
<mesh raycast={meshBounds} />
```

#### AdaptiveDpr

Drop this component into your scene and it will cut the pixel-ratio on [regress](#) according to the canvases perrformance min/max settings. This allows you to temporarily reduce visuals for more performance, for instance when the camera moves (look into drei's controls `regress` flag). Optionally you can set the canvas to a pixelated filter, which would be even faster.

```jsx
<AdaptiveDpr pixelated />
```

#### AdaptiveEvents

Drop this component into your scene and it will switch off the raycaster while the system is in regress.

```jsx
<AdaptiveEvents />
```

#### useBVH

[![](https://img.shields.io/badge/-storybook-%23ff69b4)](https://drei.vercel.app/?path=/story/performance-usebvh--default-story)

A hook to speed up the default raycasting by using the [BVH Implementation by @gkjohnnson](https://github.com/gkjohnson/three-mesh-bvh).

```jsx
const mesh = useRef()
useBVH(mesh)

<mesh ref={mesh} ... />
```
