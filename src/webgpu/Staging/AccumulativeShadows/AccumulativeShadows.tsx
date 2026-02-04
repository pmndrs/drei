//* AccumulativeShadows - WebGPU TSL Implementation ==============================
// Based on "Progressive Light Map Accumulator", by [zalo](https://github.com/zalo/)
//
// TSL Conversion: This version uses TSL (Three Shading Language) for WebGPU compatibility
// - SoftShadowMaterial: Converted from GLSL shaderMaterial to TSL MeshBasicNodeMaterial
// - ProgressiveShadowMaterial: Replaces onBeforeCompile with TSL nodes
// - Uses platform-agnostic RenderTarget from #drei-platform

import * as THREE from 'three/webgpu'
import { MeshBasicNodeMaterial, MeshPhongNodeMaterial } from 'three/webgpu'
import { Fn, uniform, uniformTexture, texture, uv, vec4, vec3, vec2, float, max, mix, sub, output } from 'three/tsl'
import * as React from 'react'
import { ThreeElements, useFrame, useThree } from '@react-three/fiber'
import { RenderTarget } from '#drei-platform'
import { DiscardMaterial } from '@webgpu/Materials/DiscardMaterial'
import { ForwardRefComponent } from '@utils/ts-utils'

function isLight(object: any): object is THREE.Light {
  return object.isLight
}

function isGeometry(object: any): object is THREE.Mesh {
  return !!object.geometry
}

export type AccumulativeShadowsProps = Omit<ThreeElements['group'], 'ref'> & {
  /** How many frames it can render, more yields cleaner results but takes more time, 40 */
  frames?: number
  /** If frames === Infinity blend controls the refresh ratio, 100 */
  blend?: number
  /** Can limit the amount of frames rendered if frames === Infinity, usually to get some performance back once a movable scene has settled, Infinity */
  limit?: number
  /** Scale of the plane,  */
  scale?: number
  /** Temporal accumulates shadows over time which is more performant but has a visual regression over instant results, false  */
  temporal?: boolean
  /** Opacity of the plane, 1 */
  opacity?: number
  /** Discards alpha pixels, 0.65 */
  alphaTest?: number
  /** Shadow color, black */
  color?: string
  /** Colorblend, how much colors turn to black, 0 is black, 2 */
  colorBlend?: number
  /** Buffer resolution, 1024 */
  resolution?: number
  /** Texture tonemapping */
  toneMapped?: boolean
}

interface AccumulativeContext {
  lights: Map<any, any>
  temporal: boolean
  frames: number
  blend: number
  count: number
  /** Returns the plane geometry onto which the shadow is cast */
  getMesh: () => THREE.Mesh<THREE.PlaneGeometry, SoftShadowMaterialImpl>
  /** Resets the buffers, starting from scratch */
  reset: () => void
  /** Updates the lightmap for a number of frames accumulartively */
  update: (frames?: number) => void
}

interface AccumulativeLightContext {
  /** Jiggles the lights */
  update: () => void
}

export const accumulativeContext = /* @__PURE__ */ React.createContext<AccumulativeContext>(
  null as unknown as AccumulativeContext
)

//* SoftShadowMaterial - TSL Implementation ==============================
// Renders the shadow plane with texture sampling and alpha blending
// Original GLSL:
//   gl_FragColor = vec4(color * sampledDiffuseColor.r * blend,
//     max(0.0, (1.0 - (r + g + b) / alphaTest)) * opacity);

class SoftShadowMaterialImpl extends MeshBasicNodeMaterial {
  private _color: THREE.UniformNode<THREE.Color>
  private _blend: THREE.UniformNode<number>
  private _alphaTest: THREE.UniformNode<number>
  private _opacity: THREE.UniformNode<number>
  private _map: ReturnType<typeof uniformTexture>

  constructor() {
    super()

    this._color = uniform(new THREE.Color())
    this._blend = uniform(2.0)
    this._alphaTest = uniform(0.75)
    this._opacity = uniform(0)
    this._map = uniformTexture(new THREE.Texture())

    this.transparent = true
    this.depthWrite = false

    this._buildShader()
  }

  private _buildShader() {
    const colorUniform = this._color
    const blendUniform = this._blend
    const alphaTestUniform = this._alphaTest
    const opacityUniform = this._opacity
    const mapTex = this._map

    this.colorNode = Fn(() => {
      const texCoord = uv()
      const sampled = texture(mapTex, texCoord)

      // RGB output: color * red_channel * blend
      const rgb = colorUniform.mul(sampled.r).mul(blendUniform)

      // Alpha calculation: max(0, 1 - (r+g+b)/alphaTest) * opacity
      const sum = sampled.r.add(sampled.g).add(sampled.b)
      const alpha = max(float(0), float(1).sub(sum.div(alphaTestUniform))).mul(opacityUniform)

      return vec4(rgb, alpha)
    })()
  }

  get shadowColor() {
    return this._color.value
  }
  set shadowColor(v: THREE.ColorRepresentation) {
    if (v instanceof THREE.Color) {
      this._color.value.copy(v)
    } else {
      this._color.value.set(v)
    }
  }

  get blend() {
    return this._blend.value
  }
  set blend(v: number) {
    this._blend.value = v
  }

  get alphaTest() {
    return this._alphaTest.value
  }
  set alphaTest(v: number) {
    this._alphaTest.value = v
  }

  get opacity() {
    return this._opacity.value
  }
  set opacity(v: number) {
    this._opacity.value = v
  }

  get map() {
    return this._map.value as THREE.Texture
  }
  set map(v: THREE.Texture) {
    this._map.value = v
  }
}

//* ProgressiveShadowMaterial - TSL Implementation ==============================
// Material for UV-unwrapped shadow accumulation rendering
// Based on Three.js official ProgressiveLightMapGPU.js implementation
//
// Key techniques from official implementation:
// - vertexNode: outputs clip space directly via vec4(sub(uv, 0.5) * 2, 1, 1)
// - outputNode: blends previous shadow map with current shading via mix()
// - Uses 'output' node to access the material's computed shading result

class ProgressiveShadowMaterial extends MeshPhongNodeMaterial {
  private _previousShadowMap: ReturnType<typeof texture>
  private _averagingWindow: THREE.UniformNode<number>

  constructor(initialTexture: THREE.Texture) {
    super()

    // Create texture node for previous shadow map sampling
    this._previousShadowMap = texture(initialTexture)
    this._averagingWindow = uniform(100)

    this.fog = false

    this._buildShader()
  }

  private _buildShader() {
    const previousMapTex = this._previousShadowMap
    const averagingWindowUniform = this._averagingWindow

    // Vertex: Output clip space directly from UV coordinates
    // This is the official Three.js pattern for UV unwrapping in TSL
    // vertexNode outputs vec4 clip coordinates directly, bypassing MVP transform
    const uvNode = uv()
    this.vertexNode = vec4(sub(uvNode, vec2(0.5)).mul(2), 1, 1)

    // Fragment: Blend previous shadow map with current phong shading
    // 'output' is the built-in node representing the material's computed color
    // This pattern is from the official Three.js ProgressiveLightMapGPU.js
    this.outputNode = vec4(mix(previousMapTex.sample(uv()), output, float(1).div(averagingWindowUniform)))
  }

  get previousShadowMap() {
    return this._previousShadowMap.value as THREE.Texture
  }
  set previousShadowMap(v: THREE.Texture) {
    this._previousShadowMap.value = v
  }

  get averagingWindow() {
    return this._averagingWindow.value
  }
  set averagingWindow(v: number) {
    this._averagingWindow.value = v
  }
}

//* ProgressiveLightMap Class ==============================
// Manages progressive shadow accumulation with ping-pong buffers
// Based on Three.js official ProgressiveLightMapGPU.js pattern

class ProgressiveLightMap {
  renderer: THREE.WebGPURenderer
  res: number
  scene: THREE.Scene
  object: THREE.Mesh | null
  buffer1Active: boolean
  progressiveLightMap1: InstanceType<typeof RenderTarget>
  progressiveLightMap2: InstanceType<typeof RenderTarget>
  discardMat: typeof DiscardMaterial
  targetMat: ProgressiveShadowMaterial
  clearColor: THREE.Color
  clearAlpha: number
  lights: { object: THREE.Light; intensity: number }[]
  meshes: { object: THREE.Mesh; material: THREE.Material | THREE.Material[] }[]

  constructor(renderer: THREE.WebGPURenderer, scene: THREE.Scene, res: number = 1024) {
    this.renderer = renderer
    this.res = res
    this.scene = scene
    this.buffer1Active = false
    this.lights = []
    this.meshes = []
    this.object = null
    this.clearColor = new THREE.Color()
    this.clearAlpha = 0

    // Create the Progressive LightMap Texture using platform-agnostic RenderTarget
    const textureParams = {
      type: THREE.HalfFloatType,
      magFilter: THREE.NearestFilter,
      minFilter: THREE.NearestFilter,
    }
    this.progressiveLightMap1 = new RenderTarget(this.res, this.res, textureParams)
    this.progressiveLightMap2 = new RenderTarget(this.res, this.res, textureParams)

    // TSL materials - vertexNode outputs clip space directly, no special camera needed
    this.discardMat = DiscardMaterial
    this.targetMat = new ProgressiveShadowMaterial(this.progressiveLightMap1.texture as THREE.Texture)
  }

  clear() {
    // Save current clear color/alpha (use type assertion for WebGPU renderer compatibility)
    ;(this.renderer as any).getClearColor(this.clearColor)
    this.clearAlpha = this.renderer.getClearAlpha()
    this.renderer.setClearColor('black', 1)
    this.renderer.setRenderTarget(this.progressiveLightMap1 as THREE.RenderTarget)
    this.renderer.clear()
    this.renderer.setRenderTarget(this.progressiveLightMap2 as THREE.RenderTarget)
    this.renderer.clear()
    this.renderer.setRenderTarget(null)
    // Restore clear color
    ;(this.renderer as any).setClearColor(this.clearColor, this.clearAlpha)

    this.lights = []
    this.meshes = []
    this.scene.traverse((object) => {
      if (isGeometry(object)) {
        this.meshes.push({ object, material: object.material })
      } else if (isLight(object)) {
        this.lights.push({ object, intensity: object.intensity })
      }
    })
  }

  prepare() {
    this.lights.forEach((light) => (light.object.intensity = 0))
    this.meshes.forEach((mesh) => (mesh.object.material = this.discardMat))
  }

  finish() {
    this.lights.forEach((light) => (light.object.intensity = light.intensity))
    this.meshes.forEach((mesh) => (mesh.object.material = mesh.material))
  }

  configure(object: THREE.Mesh) {
    this.object = object
  }

  update(camera: THREE.Camera, blendWindow = 100) {
    if (!this.object) return

    // Set up the target material for UV-unwrapped rendering
    this.targetMat.averagingWindow = blendWindow
    const originalMaterial = this.object.material
    this.object.material = this.targetMat

    // Disable frustum culling temporarily (UV unwrapping may place vertices outside view)
    const oldFrustumCulled = this.object.frustumCulled
    this.object.frustumCulled = false

    // Ping-pong two surface buffers for reading/writing
    const activeMap = this.buffer1Active ? this.progressiveLightMap1 : this.progressiveLightMap2
    const inactiveMap = this.buffer1Active ? this.progressiveLightMap2 : this.progressiveLightMap1

    // Render the object's surface maps
    const oldBg = this.scene.background
    this.scene.background = null
    this.renderer.setRenderTarget(activeMap as THREE.RenderTarget)
    this.targetMat.previousShadowMap = inactiveMap.texture as THREE.Texture
    this.buffer1Active = !this.buffer1Active

    // Render with vertexNode outputting clip space directly from UVs
    // The camera is still used for lighting calculations but vertex positions come from UV coords
    this.renderer.render(this.scene, camera)

    this.renderer.setRenderTarget(null)
    this.scene.background = oldBg

    // Restore original material and frustum culling
    this.object.frustumCulled = oldFrustumCulled
    this.object.material = originalMaterial
  }
}

//* AccumulativeShadows Component ==============================

export const AccumulativeShadows: ForwardRefComponent<AccumulativeShadowsProps, AccumulativeContext> =
  /* @__PURE__ */ React.forwardRef(
    (
      {
        children,
        temporal,
        frames = 40,
        limit = Infinity,
        blend = 20,
        scale = 10,
        opacity = 1,
        alphaTest = 0.75,
        color = 'black',
        colorBlend = 2,
        resolution = 1024,
        toneMapped = true,
        ...props
      },
      forwardRef
    ) => {
      const gl = useThree((state) => state.gl) as unknown as THREE.WebGPURenderer
      const scene = useThree((state) => state.scene)
      const camera = useThree((state) => state.camera)
      const invalidate = useThree((state) => state.invalidate)
      const gPlane = React.useRef<THREE.Mesh<THREE.PlaneGeometry, SoftShadowMaterialImpl>>(null!)
      const gLights = React.useRef<THREE.Group>(null!)

      // Create TSL material for the shadow plane
      const [softShadowMat] = React.useState(() => new SoftShadowMaterialImpl())

      const [plm] = React.useState(() => new ProgressiveLightMap(gl, scene, resolution))
      React.useLayoutEffect(() => {
        plm.configure(gPlane.current)
      }, [plm])

      // Update material properties when props change
      React.useEffect(() => {
        softShadowMat.shadowColor = color
        softShadowMat.blend = colorBlend
        softShadowMat.map = plm.progressiveLightMap2.texture as THREE.Texture
        softShadowMat.toneMapped = toneMapped
      }, [softShadowMat, color, colorBlend, plm, toneMapped])

      const api = React.useMemo<AccumulativeContext>(
        () => ({
          lights: new Map(),
          temporal: !!temporal,
          frames: Math.max(2, frames),
          blend: Math.max(2, frames === Infinity ? blend : frames),
          count: 0,
          getMesh: () => gPlane.current,
          reset: () => {
            // Clear buffers, reset opacities, set frame count to 0
            plm.clear()
            softShadowMat.opacity = 0
            softShadowMat.alphaTest = 0
            api.count = 0
          },
          update: (frames = 1) => {
            // Adapt the opacity-blend ratio to the number of frames
            if (!api.temporal) {
              softShadowMat.opacity = opacity
              softShadowMat.alphaTest = alphaTest
            } else {
              softShadowMat.opacity = Math.min(opacity, softShadowMat.opacity + opacity / api.blend)
              softShadowMat.alphaTest = Math.min(alphaTest, softShadowMat.alphaTest + alphaTest / api.blend)
            }

            // Switch accumulative lights on
            gLights.current.visible = true
            // Collect scene lights and meshes
            plm.prepare()

            // Update the lightmap and the accumulative lights
            for (let i = 0; i < frames; i++) {
              api.lights.forEach((light) => light.update())
              plm.update(camera, api.blend)
            }
            // Switch lights off
            gLights.current.visible = false
            // Restore lights and meshes
            plm.finish()
          },
        }),
        [plm, camera, scene, temporal, frames, blend, opacity, alphaTest, softShadowMat]
      )

      React.useLayoutEffect(() => {
        // Reset internals, buffers, ...
        api.reset()
        // Update lightmap
        if (!api.temporal && api.frames !== Infinity) api.update(api.blend)
      })

      // Expose api, allow children to set itself as the main light source
      React.useImperativeHandle(forwardRef, () => api, [api])

      useFrame(() => {
        if ((api.temporal || api.frames === Infinity) && api.count < api.frames && api.count < limit) {
          invalidate()
          api.update()
          api.count++
        }
      })

      return (
        <group {...props}>
          <group traverse={() => null} ref={gLights}>
            <accumulativeContext.Provider value={api}>{children}</accumulativeContext.Provider>
          </group>
          <mesh receiveShadow ref={gPlane} scale={scale} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry />
            <primitive object={softShadowMat} attach="material" />
          </mesh>
        </group>
      )
    }
  )

//* RandomizedLight Component ==============================

export type RandomizedLightProps = Omit<ThreeElements['group'], 'ref'> & {
  /** How many frames it will jiggle the lights, 1.
   *  Frames is context aware, if a provider like AccumulativeShadows exists, frames will be taken from there!  */
  frames?: number
  /** Light position, [0, 0, 0] */
  position?: [x: number, y: number, z: number]
  /** Radius of the jiggle, higher values make softer light, 5 */
  radius?: number
  /** Amount of lights, 8 */
  amount?: number
  /** Light intensity, 1 */
  intensity?: number
  /** Ambient occlusion, lower values mean less AO, hight more, you can mix AO and directional light, 0.5 */
  ambient?: number
  /** If the lights cast shadows, this is true by default */
  castShadow?: boolean
  /** Default shadow bias, 0 */
  bias?: number
  /** Default map size, 512 */
  mapSize?: number
  /** Default size of the shadow camera, 10 */
  size?: number
  /** Default shadow camera near, 0.5 */
  near?: number
  /** Default shadow camera far, 500 */
  far?: number
}

export const RandomizedLight: ForwardRefComponent<RandomizedLightProps, AccumulativeLightContext> =
  /* @__PURE__ */ React.forwardRef(
    (
      {
        castShadow = true,
        bias = 0.001,
        mapSize = 512,
        size = 5,
        near = 0.5,
        far = 500,
        frames = 1,
        position = [0, 0, 0],
        radius = 1,
        amount = 8,
        intensity = Math.PI,
        ambient = 0.5,
        ...props
      },
      forwardRef
    ) => {
      const gLights = React.useRef<THREE.Group>(null!)
      const length = new THREE.Vector3(...position).length()
      const parent = React.useContext(accumulativeContext)

      const update = React.useCallback(() => {
        let light: THREE.Object3D | undefined
        if (gLights.current) {
          for (let l = 0; l < gLights.current.children.length; l++) {
            light = gLights.current.children[l]
            if (Math.random() > ambient) {
              light.position.set(
                position[0] + THREE.MathUtils.randFloatSpread(radius),
                position[1] + THREE.MathUtils.randFloatSpread(radius),
                position[2] + THREE.MathUtils.randFloatSpread(radius)
              )
            } else {
              let lambda = Math.acos(2 * Math.random() - 1) - Math.PI / 2.0
              let phi = 2 * Math.PI * Math.random()
              light.position.set(
                Math.cos(lambda) * Math.cos(phi) * length,
                Math.abs(Math.cos(lambda) * Math.sin(phi) * length),
                Math.sin(lambda) * length
              )
            }
          }
        }
      }, [radius, ambient, length, ...position])

      const api: AccumulativeLightContext = React.useMemo(() => ({ update }), [update])
      React.useImperativeHandle(forwardRef, () => api, [api])
      React.useLayoutEffect(() => {
        const group = gLights.current
        if (parent) parent.lights?.set(group.uuid, api)
        return () => void parent?.lights?.delete(group.uuid)
      }, [parent, api])

      return (
        <group ref={gLights} {...props}>
          {Array.from({ length: amount }, (_, index) => (
            <directionalLight
              key={index}
              castShadow={castShadow}
              shadow-bias={bias}
              shadow-mapSize={[mapSize, mapSize]}
              intensity={intensity / amount}
            >
              <orthographicCamera attach="shadow-camera" args={[-size, size, size, -size, near, far]} />
            </directionalLight>
          ))}
        </group>
      )
    }
  )
