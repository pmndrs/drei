//* AccumulativeShadows Stub - WebGPU Not Yet Supported ==============================
// This stub provides types and placeholder components for WebGPU builds.
// The full AccumulativeShadows implementation uses GLSL shaders via shaderMaterial
// which requires UniformsUtils (WebGL-only). When converted to TSL, this stub will
// be replaced with the full implementation.

import * as THREE from 'three/webgpu'
import * as React from 'react'
import { ThreeElements } from '@react-three/fiber'
import { ForwardRefComponent } from '@utils/ts-utils'

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
  getMesh: () => THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
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

let hasWarned = false
function warnOnce(message: string) {
  if (!hasWarned) {
    console.warn(message)
    hasWarned = true
  }
}

export const AccumulativeShadows: ForwardRefComponent<AccumulativeShadowsProps, AccumulativeContext> =
  /* @__PURE__ */ React.forwardRef((props, ref) => {
    warnOnce(
      'drei: AccumulativeShadows is not yet supported in WebGPU. ' +
        'It uses GLSL shaders that need to be converted to TSL. ' +
        'Consider using ContactShadows instead, or import from @react-three/drei/legacy for WebGL.'
    )
    return null
  })

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
  /* @__PURE__ */ React.forwardRef((props, ref) => {
    warnOnce(
      'drei: RandomizedLight is not yet supported in WebGPU. ' +
        'It requires AccumulativeShadows which uses GLSL shaders. ' +
        'Import from @react-three/drei/legacy for WebGL.'
    )
    return null
  })
