import * as React from 'react'
import * as THREE from 'three/webgpu'
import { Fn, uniform, positionLocal, mx_noise_vec3, pow, float } from 'three/tsl'
import { ThreeElements, useFrame } from '@react-three/fiber'
// @ts-ignore
import { ForwardRefComponent } from '@utils/ts-utils'

//* Distort Material Implementation ==============================

class DistortMaterialImplWebGPU extends THREE.MeshPhysicalNodeMaterial {
  timeUniform: ReturnType<typeof uniform>
  distortUniform: ReturnType<typeof uniform>
  radiusUniform: ReturnType<typeof uniform>

  constructor(parameters: THREE.MeshPhysicalMaterialParameters = {}) {
    super(parameters)
    this.setValues(parameters)
    
    // Create uniforms
    this.timeUniform = uniform(0)
    this.distortUniform = uniform(0.4)
    this.radiusUniform = uniform(1)
    
    // Position shader: Apply noise-based distortion
    this.positionNode = Fn(() => {
      const pos = positionLocal.toVar()
      
      // Calculate animated time factor
      const updateTime = this.timeUniform.div(50.0)
      
      // Calculate noise input: position / 2.0 + updateTime * 5.0
      const noiseInput = pos.div(2.0).add(updateTime.mul(5.0))
      
      // Get noise value using MaterialX noise function
      const noiseVec = mx_noise_vec3(noiseInput)
      const noise = noiseVec.x // Use x component as scalar noise
      
      // Apply distortion: position * (noise * pow(distort, 2) + radius)
      const distortFactor = noise.mul(pow(this.distortUniform, float(2.0))).add(this.radiusUniform)
      
      return pos.mul(distortFactor)
    })()
  }

  get time() {
    return this.timeUniform.value
  }

  set time(v) {
    this.timeUniform.value = v
  }

  get distort() {
    return this.distortUniform.value
  }

  set distort(v) {
    this.distortUniform.value = v
  }

  get radius() {
    return this.radiusUniform.value
  }

  set radius(v) {
    this.radiusUniform.value = v
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
