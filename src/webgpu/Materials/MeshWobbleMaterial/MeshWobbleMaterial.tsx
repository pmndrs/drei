import * as React from 'react'
import * as THREE from 'three/webgpu'
import { Fn, uniform, mat3, cos, sin, float, positionLocal, normalLocal } from 'three/tsl'
import { ThreeElements, useFrame } from '@react-three/fiber'
import { ForwardRefComponent } from '@utils/ts-utils'
import { withUniforms } from '@utils/withUniforms'

//* Wobble Material Implementation ==============================

class WobbleMaterialImpl extends withUniforms(THREE.MeshStandardNodeMaterial, {
  /** Animation time, advanced by the component each frame */
  time: () => uniform(0),
  /** Wobble strength */
  factor: () => uniform(1),
}) {
  constructor(parameters: THREE.MeshStandardMaterialParameters = {}) {
    super(parameters)
    const { time, factor } = this.uniforms

    // Position shader: Apply rotation based on time and position.y
    this.positionNode = Fn(() => {
      const pos = positionLocal.toVar()

      // Calculate rotation angle (theta)
      const theta = sin(time.add(pos.y)).div(2.0).mul(factor)
      const c = cos(theta)
      const s = sin(theta)

      // Create rotation matrix around Y-axis
      const rotMatrix = mat3(c, float(0), s, float(0), float(1), float(0), s.negate(), float(0), c)

      // Apply rotation to position
      return pos.mul(rotMatrix)
    })()

    // Normal shader: Apply same rotation to normals
    this.normalNode = Fn(() => {
      const pos = positionLocal.toVar()
      const norm = normalLocal.toVar()

      // Calculate same rotation angle
      const theta = sin(time.add(pos.y)).div(2.0).mul(factor)
      const c = cos(theta)
      const s = sin(theta)

      // Create same rotation matrix
      const rotMatrix = mat3(c, float(0), s, float(0), float(1), float(0), s.negate(), float(0), c)

      // Apply rotation to normal
      return norm.mul(rotMatrix)
    })()
  }
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    wobbleMaterialImpl: ThreeElements['meshStandardMaterial'] & {
      time?: number
      factor?: number
      speed?: number
    }
  }
}

export type WobbleMaterialProps = Omit<ThreeElements['meshStandardMaterial'], 'ref'> & {
  speed?: number
  factor?: number
}

export const MeshWobbleMaterial: ForwardRefComponent<WobbleMaterialProps, WobbleMaterialImpl> =
  /* @__PURE__ */ React.forwardRef(({ speed = 1, ...props }, ref) => {
    const [material] = React.useState(() => new WobbleMaterialImpl())
    useFrame((state) => material && (material.time = state.elapsed * speed))
    return <primitive object={material} ref={ref} attach="material" {...props} />
  })
