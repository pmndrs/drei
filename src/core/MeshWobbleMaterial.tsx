import * as React from 'react'
import { Material, MeshStandardMaterial } from 'three'
import { useFrame } from '@react-three/fiber'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'
// @ts-ignore
import recalcNormal from '../helpers/glsl/recalculateNormals.glsl'

type WobbleMaterialType = JSX.IntrinsicElements['meshStandardMaterial'] &
  JSX.IntrinsicElements['meshStandardMaterial'] &
  JSX.IntrinsicElements['meshPhysicalMaterial'] &
  JSX.IntrinsicElements['meshLambertMaterial'] &
  JSX.IntrinsicElements['meshPhongMaterial'] &
  JSX.IntrinsicElements['meshToonMaterial'] &
  JSX.IntrinsicElements['meshDepthMaterial'] &
  JSX.IntrinsicElements['meshNormalMaterial'] & {
    time?: number
    factor?: number
    speed?: number
  }

type Props = WobbleMaterialType & {
  from?: typeof Material
  speed?: number
  factor?: number
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      wobbleMaterialImpl: WobbleMaterialType
    }
  }
}

class WobbleMaterialImpl extends CustomShaderMaterial {
  constructor(baseMaterial: typeof Material, parameters: any = {}) {
    const vertexShader = `
    uniform float time;
    uniform float factor;

    vec3 displace(vec3 p) {
      float theta = sin( time + p.y ) / 2.0 * factor;
      float c = cos( theta );
      float s = sin( theta );
      mat3 m = mat3( c, 0, s, 0, 1, 0, -s, 0, c );
      return vec3(p) * m;
    }

    ${recalcNormal}

    void main() { 
      csm_Position = displace(position);
      csm_Normal = recalcNormals(csm_Position);
    }  

    `

    super(
      baseMaterial,
      undefined,
      vertexShader,
      {
        time: {
          value: 0,
        },
        factor: {
          value: 0,
        },
      },
      parameters
    )
  }

  get time() {
    return this.uniforms.time.value
  }

  set time(v) {
    this.uniforms.time.value = v
  }

  get factor() {
    return this.uniforms.factor.value
  }

  set factor(v) {
    this.uniforms.factor.value = v
  }
}

export const MeshWobbleMaterial = React.forwardRef(
  ({ from = MeshStandardMaterial, speed = 1, ...props }: Props, ref) => {
    const material = React.useMemo(() => new WobbleMaterialImpl(from), [from])
    useFrame((state) => material && (material.time = state.clock.getElapsedTime() * speed))
    return <primitive dispose={undefined} object={material} ref={ref} attach="material" {...props} />
  }
)
