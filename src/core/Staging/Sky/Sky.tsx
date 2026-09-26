import * as React from 'react'
import { ReactThreeFiber } from '@react-three/fiber'
import { Vector3 } from '#three'
// WebGL builds get three's `Sky`, WebGPU builds get `SkyMesh` (TSL). See src/utils/three-addons*.ts
import { Sky as SkyImpl } from '#three-addons'
import type { SkyMesh } from 'three/examples/jsm/objects/SkyMesh.js'
import { ForwardRefComponent } from '../../../utils/ts-utils'

export type SkyProps = {
  distance?: number
  sunPosition?: ReactThreeFiber.Vector3
  inclination?: number
  azimuth?: number
  mieCoefficient?: number
  mieDirectionalG?: number
  rayleigh?: number
  turbidity?: number
}

export function calcPosFromAngles(inclination: number, azimuth: number, vector: Vector3 = new Vector3()) {
  const theta = Math.PI * (inclination - 0.5)
  const phi = 2 * Math.PI * (azimuth - 0.5)

  vector.x = Math.cos(phi)
  vector.y = Math.sin(theta)
  vector.z = Math.sin(phi)

  return vector
}

//* Helper to convert R3F Vector3 prop to Vector3 instance ==============================
function toVector3(value: ReactThreeFiber.Vector3): Vector3 {
  if (value instanceof Vector3) return value
  if (Array.isArray(value)) return new Vector3(value[0], value[1], value[2])
  if (typeof value === 'number') return new Vector3(value, value, value)
  // Object with x, y, z properties
  return new Vector3((value as any).x, (value as any).y, (value as any).z)
}

/**
 * Adds a sky dome to your scene using THREE's Sky shader.
 *
 * Resolved per build: `@react-three/drei/webgpu` renders three's `SkyMesh` (TSL), every other entry
 * renders three's `Sky` (GLSL). For a physically based atmosphere on WebGPU, see @pmndrs/sky:
 * https://github.com/pmndrs/sky
 *
 * @example Basic usage
 * ```jsx
 * <Sky sunPosition={[0, 1, 0]} />
 * ```
 */
export const Sky: ForwardRefComponent<SkyProps, SkyImpl> = /* @__PURE__ */ React.forwardRef(
  (
    {
      inclination = 0.6,
      azimuth = 0.1,
      distance = 1000,
      mieCoefficient = 0.005,
      mieDirectionalG = 0.8,
      rayleigh = 0.5,
      turbidity = 10,
      sunPosition = calcPosFromAngles(inclination, azimuth),
      ...props
    }: SkyProps,
    ref
  ) => {
    const sky = React.useMemo(() => new SkyImpl(), [])

    React.useLayoutEffect(() => {
      sky.scale.setScalar(distance)
    }, [sky, distance])

    // Apply sky uniforms ---------------------------------
    React.useLayoutEffect(() => {
      // WebGPU's SkyMesh exposes its uniforms as nodes on the mesh; WebGL's Sky keeps them on its material
      const u = (sky as unknown as SkyMesh).isSkyMesh ? (sky as unknown as SkyMesh) : sky.material.uniforms
      u.turbidity.value = turbidity
      u.rayleigh.value = rayleigh
      u.mieCoefficient.value = mieCoefficient
      u.mieDirectionalG.value = mieDirectionalG
      u.sunPosition.value.copy(toVector3(sunPosition))
    }, [sky, turbidity, rayleigh, mieCoefficient, mieDirectionalG, sunPosition])

    return <primitive object={sky} ref={ref} {...props} />
  }
)
