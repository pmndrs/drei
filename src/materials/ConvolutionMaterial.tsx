import { NoBlending, ShaderMaterial, Uniform, Vector2 } from 'three'

export class ConvolutionMaterial extends ShaderMaterial {
  readonly kernel: Float32Array
  constructor(texelSize = new Vector2()) {
    super({
      uniforms: {
        inputBuffer: new Uniform(null),
        texelSize: new Uniform(new Vector2()),
        halfTexelSize: new Uniform(new Vector2()),
        kernel: new Uniform(0.0),
        scale: new Uniform(1.0),
      },
      fragmentShader: `#include <common>
        #include <dithering_pars_fragment>      
        uniform sampler2D inputBuffer;
        varying vec2 vUv0;
        varying vec2 vUv1;
        varying vec2 vUv2;
        varying vec2 vUv3;
        void main() {
          vec4 sum = texture2D(inputBuffer, vUv0);
          sum += texture2D(inputBuffer, vUv1);
          sum += texture2D(inputBuffer, vUv2);
          sum += texture2D(inputBuffer, vUv3);
          gl_FragColor = sum * 0.25;
          #include <dithering_fragment>
        }`,
      vertexShader: `uniform vec2 texelSize;
        uniform vec2 halfTexelSize;
        uniform float kernel;
        uniform float scale;
        varying vec2 vUv0;
        varying vec2 vUv1;
        varying vec2 vUv2;
        varying vec2 vUv3;
        void main() {
          vec2 uv = position.xy * 0.5 + 0.5;
          vec2 dUv = (texelSize * vec2(kernel) + halfTexelSize) * scale;
          vUv0 = vec2(uv.x - dUv.x, uv.y + dUv.y);
          vUv1 = vec2(uv.x + dUv.x, uv.y + dUv.y);
          vUv2 = vec2(uv.x + dUv.x, uv.y - dUv.y);
          vUv3 = vec2(uv.x - dUv.x, uv.y - dUv.y);
          gl_Position = vec4(position.xy, 1.0, 1.0);
        }`,
      blending: NoBlending,
      depthWrite: false,
      depthTest: false,
    })

    this.toneMapped = false
    this.setTexelSize(texelSize.x, texelSize.y)
    this.kernel = new Float32Array([0.0, 1.0, 2.0, 2.0, 3.0])
  }

  setTexelSize(x: number, y: number) {
    this.uniforms.texelSize.value.set(x, y)
    this.uniforms.halfTexelSize.value.set(x, y).multiplyScalar(0.5)
  }
}
