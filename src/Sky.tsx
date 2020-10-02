import React, { forwardRef, useMemo } from 'react'
import { ReactThreeFiber } from 'react-three-fiber'
import { Sky as SkyImpl } from 'three/examples/jsm/objects/Sky'
import { Vector3 } from 'three'

export type Sky = {
  distance?: number
  sunPosition?: ReactThreeFiber.Vector3
  inclination?: number
  azimuth?: number
  mieCoefficient?: number
  mieDirectionalG?: number
  rayleigh?: number
  turbidity?: number
} & ReactThreeFiber.Object3DNode<SkyImpl, typeof SkyImpl>

declare global {
  namespace JSX {
    interface IntrinsicElements {
      skyImpl: Sky
    }
  }
}

const theta = (inclination: number) => {
  return Math.PI * (inclination - 0.5)
}

const phi = (azimuth: number) => {
  return 2 * Math.PI * (azimuth - 0.5)
}

export const Sky = forwardRef<Sky>(
  (
    {
      inclination = 0,
      azimuth = 0.25,
      distance = 100,
      mieCoefficient = 0.005,
      mieDirectionalG = 0.8,
      rayleigh = 1,
      turbidity = 2,
      sunPosition = [
        Math.cos(phi(azimuth)),
        Math.sin(phi(azimuth)) * Math.sin(theta(inclination)),
        Math.sin(phi(azimuth)) * Math.cos(theta(inclination)),
      ],
      ...props
    }: Sky,
    ref
  ) => {
    const scale = useMemo(() => new Vector3().setScalar(distance), [distance])
    const sky = useMemo(() => new SkyImpl(), [])

    return (
      <primitive
        object={sky}
        ref={ref}
        material-uniforms-mieCoefficient-value={mieCoefficient}
        material-uniforms-mieDirectionalG-value={mieDirectionalG}
        material-uniforms-rayleigh-value={rayleigh}
        material-uniforms-sunPosition-value={sunPosition}
        material-uniforms-turbidity-value={turbidity}
        scale={scale}
        {...props}
      />
    )
  }
)
