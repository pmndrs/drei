import * as THREE from 'three'
import * as React from 'react'
import { PrimitiveProps } from '@react-three/fiber'

type PointMaterialType = JSX.IntrinsicElements['pointsMaterial']

declare global {
  namespace JSX {
    interface IntrinsicElements {
      pointMaterialImpl: PointMaterialType
    }
  }
}

export class PointMaterialImpl extends THREE.PointsMaterial {
  constructor(props) {
    super(props)
    this.onBeforeCompile = (shader, renderer) => {
      const { isWebGL2 } = renderer.capabilities
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <output_fragment>',
        `
        ${
          !isWebGL2
            ? '#extension GL_OES_standard_derivatives : enable\n#include <output_fragment>'
            : '#include <output_fragment>'
        }
      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      float r = dot(cxy, cxy);
      float delta = fwidth(r);     
      float mask = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
      gl_FragColor = vec4(gl_FragColor.rgb, mask * gl_FragColor.a );
      `
      )
    }
  }
}

export const PointMaterial = React.forwardRef<PointMaterialImpl, Omit<PrimitiveProps, 'object' | 'attach'>>(
  (props, ref) => {
    const [material] = React.useState(() => new PointMaterialImpl(null))
    return <primitive {...props} object={material} ref={ref} attach="material" />
  }
)
