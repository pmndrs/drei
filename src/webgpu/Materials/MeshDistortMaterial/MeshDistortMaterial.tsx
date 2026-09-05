import * as React from 'react'
import * as THREE from 'three/webgpu'
import { Fn, uniform, positionLocal, mx_noise_vec3, pow, float } from 'three/tsl'
import { ThreeElements, useFrame } from '@react-three/fiber'
// @ts-ignore
import { ForwardRefComponent } from '@utils/ts-utils'
import { withUniforms } from '@utils/withUniforms'

//* Distort Material Implementation ==============================

class DistortMaterialImplWebGPU extends withUniforms(THREE.MeshPhysicalNodeMaterial, {
  /** Animation time, advanced by the component each frame */
  time: () => uniform(0),
  /** Distortion intensity */
  distort: () => uniform(0.4),
  /** Base scale the distortion is added to */
  radius: () => uniform(1),
}) {
  constructor(parameters: THREE.MeshPhysicalMaterialParameters = {}) {
    super(parameters)
    const { time, distort, radius } = this.uniforms

    // Position shader: Apply noise-based distortion
    this.positionNode = Fn(() => {
      const pos = positionLocal.toVar()

      // Calculate animated time factor
      const updateTime = time.div(50.0)

      // Calculate noise input: position / 2.0 + updateTime * 5.0
      const noiseInput = pos.div(2.0).add(updateTime.mul(5.0))

      // Get noise value using MaterialX noise function
      const noiseVec = mx_noise_vec3(noiseInput)
      const noise = noiseVec.x // Use x component as scalar noise

      // Apply distortion: position * (noise * pow(distort, 2) + radius)
      const distortFactor = noise.mul(pow(distort, float(2.0))).add(radius)

      return pos.mul(distortFactor)
    })()
  }
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    distortMaterialImplWebGPU: ThreeElements['meshPhysicalMaterial'] & {
      time?: number
      distort?: number
      radius?: number
    }
  }
}

export type MeshDistortMaterialProps = Omit<ThreeElements['distortMaterialImplWebGPU'], 'ref'> & {
  /** Animation speed multiplier. @default 1 */
  speed?: number
  /** Distortion intensity. @default 0.4 */
  factor?: number
}

/**
 * WebGPU Material that distorts geometry using MaterialX noise.
 * Extends MeshPhysicalNodeMaterial with animated vertex displacement.
 *
 * @example
 * ```jsx
 * <mesh>
 *   <boxGeometry />
 *   <MeshDistortMaterial distort={1} speed={10} />
 * </mesh>
 * ```
 */
export const MeshDistortMaterial: ForwardRefComponent<MeshDistortMaterialProps, DistortMaterialImplWebGPU> =
  /* @__PURE__ */ React.forwardRef(({ speed = 1, ...props }, ref) => {
    const [material] = React.useState(() => new DistortMaterialImplWebGPU())
    useFrame(({ elapsed }) => material && (material.time = elapsed * speed))
    return <primitive object={material} ref={ref} attach="material" {...props} />
  })
