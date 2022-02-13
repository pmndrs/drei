import * as React from 'react'
import { Material, MeshPhysicalMaterial, MeshPhysicalMaterialParameters, MeshStandardMaterial, Shader } from 'three'
import { useFrame } from '@react-three/fiber'
// eslint-disable-next-line
// @ts-ignore
import distort from '../helpers/glsl/distort.vert.glsl'
// @ts-ignore
import recalcNormal from '../helpers/glsl/recalculateNormals.glsl'
import CustomShaderMaterial from 'three-custom-shader-material/vanilla'

type DistortMaterialType = JSX.IntrinsicElements['meshPhysicalMaterial'] &
  JSX.IntrinsicElements['meshStandardMaterial'] &
  JSX.IntrinsicElements['meshPhysicalMaterial'] &
  JSX.IntrinsicElements['meshLambertMaterial'] &
  JSX.IntrinsicElements['meshPhongMaterial'] &
  JSX.IntrinsicElements['meshToonMaterial'] &
  JSX.IntrinsicElements['meshDepthMaterial'] &
  JSX.IntrinsicElements['meshNormalMaterial'] & {
    time?: number
    distort?: number
    radius?: number
  }

type Props = DistortMaterialType & {
  from?: typeof Material
  speed?: number
  factor?: number
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      distortMaterialImpl: DistortMaterialType
    }
  }
}

interface Uniform<T> {
  value: T
}

class DistortMaterialImpl extends CustomShaderMaterial {
  constructor(baseMaterial: typeof Material, parameters: any = {}) {
    const vertexShader = `
    uniform float time;
    uniform float radius;
    uniform float distort;

    ${distort}

    vec3 displace(vec3 p) {
      float updateTime = time / 50.0;
      float noise = snoise(vec3(p / 2.0 + updateTime * 5.0));
      return vec3(p * (noise * pow(distort, 2.0) + radius));
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
        distort: {
          value: 0.4,
        },
        radius: {
          value: 1,
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

  get distort() {
    return this.uniforms.distort.value
  }

  set distort(v) {
    this.uniforms.distort.value = v
  }
  get radius() {
    return this.uniforms.radius.value
  }

  set radius(v) {
    this.uniforms.radius.value = v
  }
}

export const MeshDistortMaterial = React.forwardRef(
  ({ from = MeshStandardMaterial, speed = 1, ...props }: Props, ref) => {
    const material = React.useMemo(() => new DistortMaterialImpl(from), [from])
    useFrame((state) => material && (material.time = state.clock.getElapsedTime() * speed))
    return <primitive dispose={undefined} object={material} ref={ref} attach="material" {...props} />
  }
)
