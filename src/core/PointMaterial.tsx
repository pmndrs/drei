import * as THREE from 'three'
import * as React from 'react'

type PointMaterialType = JSX.IntrinsicElements['shaderMaterial'] & {
  scale?: number
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      pointMaterialImpl: PointMaterialType
    }
  }
}

export class PointMaterialImpl extends THREE.ShaderMaterial {
  constructor() {
    super({
      transparent: true,
      uniforms: { size: { value: 1 } },
      vertexShader: THREE.ShaderLib.points.vertexShader,
      fragmentShader: `
      varying vec3 vColor;
      void main() {
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        float r = dot(cxy, cxy);
        float delta = fwidth(r);
        vec3 color = vColor;
        #ifdef TONE_MAPPING
          color = toneMapping(color);
        #endif
        gl_FragColor = linearToOutputTexel(vec4(color, 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r)));
      }`,
      vertexColors: true,
    })
  }

  get scale() {
    return this.uniforms.size.value
  }

  set scale(v) {
    this.uniforms.size.value = v
  }
}

export const PointMaterial = React.forwardRef((props, ref) => {
  const [material] = React.useState(() => new PointMaterialImpl())
  return <primitive object={material} ref={ref} attach="material" {...props} />
})
