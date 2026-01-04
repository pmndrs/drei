import * as React from 'react'
import { applyProps, ReactThreeFiber, useThree } from '@react-three/fiber'
import { Sky as SkyImpl } from 'three/examples/jsm/objects/Sky.js'
// webgpu
import { SkyMesh } from 'three/examples/jsm/objects/SkyMesh.js'
import { Vector3 } from '#three'
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
    // detect if legacy or webgpu
    const { isLegacy } = useThree()

    const sky = React.useMemo(() => {
      if (isLegacy) {
        const skyInstance = new SkyImpl()
        skyInstance.scale.setScalar(distance)
        return skyInstance
      } else {
        const skyInstance = new SkyMesh()
        skyInstance.scale.setScalar(distance)
        return skyInstance
      }
    }, [isLegacy, distance])

    React.useLayoutEffect(() => {
      sky.scale.setScalar(distance)
    }, [sky, distance])

    // Apply sky uniforms ---------------------------------
    React.useLayoutEffect(() => {
      if (!sky) return

      if (isLegacy) {
        // Legacy: apply via material uniforms
        applyProps(sky.material, {
          mieCoefficient,
          mieDirectionalG,
          rayleigh,
          sunPosition,
          turbidity,
        })
      } else {
        // WebGPU: SkyMesh has uniforms as direct properties
        const webgpuSky = sky as SkyMesh
        webgpuSky.turbidity.value = turbidity
        webgpuSky.rayleigh.value = rayleigh
        webgpuSky.mieCoefficient.value = mieCoefficient
        webgpuSky.mieDirectionalG.value = mieDirectionalG

        // Handle sunPosition - convert from R3F Vector3 format to actual Vector3
        const sunVec = toVector3(sunPosition)
        webgpuSky.sunPosition.value.copy(sunVec)
      }
    }, [sky, isLegacy, turbidity, rayleigh, mieCoefficient, mieDirectionalG, sunPosition])

    // webgpu
    if (!isLegacy) return <primitive object={sky} ref={ref} {...props} />

    // legacy
    return (
      <primitive
        object={sky}
        ref={ref}
        material-uniforms-mieCoefficient-value={mieCoefficient}
        material-uniforms-mieDirectionalG-value={mieDirectionalG}
        material-uniforms-rayleigh-value={rayleigh}
        material-uniforms-sunPosition-value={sunPosition}
        material-uniforms-turbidity-value={turbidity}
        {...props}
      />
    )
  }
)
