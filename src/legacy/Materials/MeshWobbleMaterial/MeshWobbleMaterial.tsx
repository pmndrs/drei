import * as React from 'react'
import { IUniform, MeshStandardMaterial, MeshStandardMaterialParameters } from '#three'
import { ThreeElements, useFrame } from '@react-three/fiber'
import { ForwardRefComponent } from '@utils/ts-utils'

export interface Uniform<T> {
  value: T
}

class WobbleMaterialImpl extends MeshStandardMaterial {
  readonly timeUniform: Uniform<number>
  readonly factorUniform: Uniform<number>
  declare readonly isMeshStandardMaterial: true

  constructor(parameters: MeshStandardMaterialParameters = {}) {
    super(parameters)
    this.setValues(parameters)
    this.timeUniform = { value: 0 }
    this.factorUniform = { value: 1 }
  }

  // FIXME Use `THREE.WebGLProgramParametersWithUniforms` type when able to target @types/three@0.160.0
  onBeforeCompile(shader: { vertexShader: string; uniforms: { [uniform: string]: IUniform } }) {
    shader.uniforms.time = this.timeUniform
    shader.uniforms.factor = this.factorUniform

    shader.vertexShader = `
      uniform float time;
      uniform float factor;
      ${shader.vertexShader}
    `
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `float theta = sin( time + position.y ) / 2.0 * factor;
        float c = cos( theta );
        float s = sin( theta );
        mat3 m = mat3( c, 0, s, 0, 1, 0, -s, 0, c );
        vec3 transformed = vec3( position ) * m;
        vNormal = vNormal * m;`
    )
  }

  get time() {
    return this.timeUniform.value
  }

  set time(v) {
    this.timeUniform.value = v
  }

  get factor() {
    return this.factorUniform.value
  }

  set factor(v) {
    this.factorUniform.value = v
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
  /** Animation speed multiplier. @default 1 */
  speed?: number
  /** Wobble intensity. @default 1 */
  factor?: number
}

/**
 * Material that makes geometry wobble with a sine wave animation.
 * Extends MeshStandardMaterial with animated vertex displacement.
 *
 * @example
 * ```jsx
 * <mesh>
 *   <boxGeometry />
 *   <MeshWobbleMaterial factor={1} speed={10} />
 * </mesh>
 * ```
 */
export const MeshWobbleMaterial: ForwardRefComponent<WobbleMaterialProps, WobbleMaterialImpl> =
  /* @__PURE__ */ React.forwardRef(({ speed = 1, ...props }, ref) => {
    const [material] = React.useState(() => new WobbleMaterialImpl())
    useFrame((state) => material && (material.time = state.elapsed * speed))
    return <primitive object={material} ref={ref} attach="material" {...props} />
  })
