import * as THREE from 'three'
import * as React from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'

// Based on "Progressive Light Map Accumulator", by [zalo](https://github.com/zalo/)
class ProgressiveLightMap {
  renderer: THREE.WebGLRenderer
  res: number
  scene: THREE.Scene
  buffer1Active: boolean
  progressiveLightMap1: THREE.WebGLRenderTarget
  progressiveLightMap2: THREE.WebGLRenderTarget
  uvMat: THREE.MeshPhongMaterial
  uniforms: { [key: string]: any }

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, res: number = 1024) {
    this.renderer = renderer
    this.res = res
    this.scene = scene
    this.scene.background = null
    this.buffer1Active = false

    // Create the Progressive LightMap Texture
    const format = /(Android|iPad|iPhone|iPod)/g.test(navigator.userAgent) ? THREE.HalfFloatType : THREE.FloatType
    this.progressiveLightMap1 = new THREE.WebGLRenderTarget(this.res, this.res, { type: format })
    this.progressiveLightMap2 = new THREE.WebGLRenderTarget(this.res, this.res, { type: format })

    // Inject some spicy new logic into a standard phong material
    this.uvMat = new THREE.MeshPhongMaterial({ shininess: 0, specular: new THREE.Color('black') })
    this.uniforms = {}
    this.uvMat.onBeforeCompile = (shader) => {
      // Vertex Shader: Set Vertex Positions to the Unwrapped UV Positions
      shader.vertexShader =
        '#define USE_LIGHTMAP\n' +
        shader.vertexShader.slice(0, -1) +
        '	gl_Position = vec4((uv2 - 0.5) * 2.0, 1.0, 1.0); }'

      // Fragment Shader: Set Pixels to average in the Previous frame's Shadows
      const bodyStart = shader.fragmentShader.indexOf('void main() {')
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <clipping_planes_pars_fragment>',
        '#include <clipping_planes_pars_fragment>\n#include <shadowmask_pars_fragment>\n'
      )
      shader.fragmentShader =
        'varying vec2 vUv2;\n' +
        shader.fragmentShader.slice(0, bodyStart) +
        '	uniform sampler2D previousShadowMap;\n	uniform float averagingWindow;\n' +
        shader.fragmentShader.slice(bodyStart - 1, -1) +
        `\nvec3 texelOld = texture2D(previousShadowMap, vUv2).rgb;
        gl_FragColor.rgb = mix(texelOld, gl_FragColor.rgb, 1.0/averagingWindow);
      }`

      // Set the Previous Frame's Texture Buffer and Averaging Window
      shader.uniforms.previousShadowMap = { value: this.progressiveLightMap1.texture }
      shader.uniforms.averagingWindow = { value: 100 }
      this.uniforms = shader.uniforms
    }
  }

  clear() {
    this.renderer.setRenderTarget(this.progressiveLightMap1)
    this.renderer.clear()
    this.renderer.setRenderTarget(this.progressiveLightMap2)
    this.renderer.clear()
  }

  configureObject(object) {
    const uv2 = object.geometry.getAttribute('uv').clone()
    object.geometry.setAttribute('uv2', uv2)
    object.geometry.getAttribute('uv2').needsUpdate = true
  }

  update(camera, blendWindow = 100) {
    // Set each object's material to the UV Unwrapped Surface Mapping Version
    this.uniforms.averagingWindow = { value: blendWindow }
    this.scene.overrideMaterial = this.uvMat

    // Ping-pong two surface buffers for reading/writing
    const activeMap = this.buffer1Active ? this.progressiveLightMap1 : this.progressiveLightMap2
    const inactiveMap = this.buffer1Active ? this.progressiveLightMap2 : this.progressiveLightMap1

    // Render the object's surface maps
    this.renderer.setRenderTarget(activeMap)
    this.uniforms.previousShadowMap = { value: inactiveMap.texture }
    this.buffer1Active = !this.buffer1Active
    this.renderer.render(this.scene, camera)

    this.scene.overrideMaterial = null
    this.renderer.setRenderTarget(null)
  }
}

type AccumulativeShadowsProps = JSX.IntrinsicElements['group'] & {
  /** How many frames it can render, more yields cleaner results but takes more time, 40 */
  frames?: number
  /** If frames === Infinity blend controls the refresh ratio, 100 */
  blend?: number
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
  /** Buffer resolution, 1024 */
  resolution?: number
}

function isLight(object: any): object is THREE.Light {
  return object.isLight
}

export const accumulativeContext = React.createContext<{
  refresh: (force?: boolean) => void
  count: React.MutableRefObject<number>
  frames: number
}>(null!)

export const AccumulativeShadows = React.forwardRef(
  (
    {
      children,
      blend,
      frames = 40,
      scale = 10,
      temporal = false,
      opacity = 1,
      alphaTest = 0.65,
      color = 'black',
      resolution = 1024,
      ...props
    }: AccumulativeShadowsProps,
    forwardRef
  ) => {
    const gl = useThree((state) => state.gl)
    const scene = useThree((state) => state.scene)
    const defaultCamera = useThree((state) => state.camera)
    const gPlane = React.useRef<THREE.Mesh>(null!)
    const gLights = React.useRef<THREE.Group>(null!)
    const count = React.useRef(0)

    const [plm] = React.useState(() => new ProgressiveLightMap(gl, scene, resolution))
    React.useLayoutEffect(() => {
      plm.configureObject(gPlane.current)
    }, [])

    const blendFrames = blend === undefined ? (frames === Infinity ? 100 : frames) : frames
    const material = React.useMemo(() => {
      const mat: THREE.MeshBasicMaterial & { uniforms: { [key: string]: any } } = Object.assign(
        new THREE.MeshBasicMaterial({
          opacity: 0,
          transparent: true,
          dithering: true,
          depthWrite: false,
          map: plm.progressiveLightMap2.texture,
        }),
        { uniforms: { ucolor: { value: new THREE.Color(color) }, alphaTest: { value: 0 } } }
      )

      mat.onBeforeCompile = (shader) => {
        mat.uniforms = shader.uniforms = { ...shader.uniforms, ...mat.uniforms }
        shader.fragmentShader = shader.fragmentShader.replace(
          `void main() {`,
          `uniform vec3 ucolor;
           uniform float alphaTest;
           void main() {`
        )
        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>
           gl_FragColor = vec4(ucolor * gl_FragColor.r * 2.0, max(0.0, (1.0 - gl_FragColor.r / alphaTest)) * opacity);`
        )
      }
      return mat
    }, [color])

    function prepare() {
      gLights.current.visible = true
      const intensities: { object: THREE.Light; intensity: number }[] = []
      scene.traverse((object) => {
        if (isLight(object)) {
          intensities.push({ object, intensity: object.intensity })
          object.intensity = 0
        }
      })
      return intensities
    }

    function finish(intensities: { object: THREE.Light; intensity: number }[]) {
      gLights.current.visible = false
      intensities.forEach(({ object, intensity }) => (object.intensity = intensity))
    }

    function refresh() {
      if (frames !== Infinity) {
        plm.clear()
        material.opacity = 0
        material.uniforms.alphaTest.value = 0
        count.current = 0
      }
    }

    React.useEffect(() => {
      if (!temporal) {
        material.opacity = opacity
        material.uniforms.alphaTest.value = alphaTest
        const intensities = prepare()
        for (let i = 0; i < blendFrames; i++) plm.update(defaultCamera, blendFrames)
        finish(intensities)
      }
    })

    useFrame(() => {
      if (temporal && count.current < frames) {
        material.opacity = Math.min(opacity, material.opacity + opacity / blendFrames)
        material.uniforms.alphaTest.value = Math.min(
          alphaTest,
          material.uniforms.alphaTest.value + alphaTest / blendFrames
        )
        const intensities = prepare()
        plm.update(defaultCamera, blendFrames)
        finish(intensities)
        count.current++
      }
    })

    // Expose refresh api
    const api = React.useMemo(() => ({ refresh, count, frames }), [frames])
    React.useImperativeHandle(forwardRef, () => api, [api])

    // Refresh on render
    React.useLayoutEffect(refresh)

    return (
      <group {...props}>
        <group traverse={() => null} ref={gLights}>
          <accumulativeContext.Provider value={api}>{children}</accumulativeContext.Provider>
        </group>
        <mesh receiveShadow ref={gPlane} material={material} scale={scale} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry />
        </mesh>
      </group>
    )
  }
)

type RandomizedLightProps = JSX.IntrinsicElements['group'] & {
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

export const RandomizedLight = React.forwardRef(
  (
    {
      castShadow = true,
      bias = 0,
      mapSize = 512,
      size = 5,
      near = 0.5,
      far = 500,
      frames = 1,
      position = [0, 0, 0],
      radius = 1,
      amount = 8,
      intensity = 1,
      ambient = 0.5,
      ...props
    }: RandomizedLightProps,
    forwardRef
  ) => {
    const gLights = React.useRef<THREE.Group>(null!)
    const length = new THREE.Vector3(...position).length()
    const parent = React.useContext(accumulativeContext)
    const count = React.useRef(0)
    const actualCount = parent ? parent.count : count
    const actualFrames = parent ? parent.frames : frames

    let light: THREE.Object3D | undefined
    useFrame(() => {
      if (actualCount.current < actualFrames) {
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
        // Do not count up if a perent exists
        if (!parent) actualCount.current++
      }
    })
    return (
      <group ref={mergeRefs([gLights, forwardRef])} {...props}>
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
