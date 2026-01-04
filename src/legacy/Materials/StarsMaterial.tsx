import { ThreeElement } from '@react-three/fiber'
import { ShaderMaterial } from '#three'
import { version } from '@utils/constants'

export class StarfieldMaterial extends ShaderMaterial {
  declare uniforms: {
    time: { value: number }
    fade: { value: number }
  }

  constructor() {
    super({
      uniforms: { time: { value: 0.0 }, fade: { value: 1.0 } },
      vertexShader: /* glsl */ `
        uniform float time;
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 0.5);
          gl_PointSize = size * (30.0 / -mvPosition.z) * (3.0 + sin(time + 100.0));
          gl_Position = projectionMatrix * mvPosition;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D pointTexture;
        uniform float fade;
        varying vec3 vColor;
        void main() {
          float opacity = 1.0;
          if (fade == 1.0) {
            float d = distance(gl_PointCoord, vec2(0.5, 0.5));
            opacity = 1.0 / (1.0 + exp(16.0 * (d - 0.25)));
          }
          gl_FragColor = vec4(vColor, opacity);
  
          #include <tonemapping_fragment>
            #include <${version >= 154 ? 'colorspace_fragment' : 'encodings_fragment'}>
        }`,
    })
  }

  setTime(time: number) {
    this.uniforms.time.value = time
  }

  setFade(fade: number) {
    this.uniforms.fade.value = fade
  }
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    starfieldMaterial: ThreeElement<typeof StarfieldMaterial>
  }
}
