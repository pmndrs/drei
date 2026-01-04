import { ShaderMaterial, REVISION, Uniform } from '#three'

const version = parseInt(REVISION.replace(/\D+/g, ''))

//* SparklesMaterial - Legacy WebGL ShaderMaterial ==============================
// Custom point sprite material for sparkle particle effects
// Uses GLSL shaders with per-particle attributes for size, speed, opacity, noise, and color

export class SparklesMaterial extends ShaderMaterial {
  declare uniforms: {
    time: Uniform<number>
    pixelRatio: Uniform<number>
  }
  constructor() {
    super({
      transparent: true,
      depthWrite: false,
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: 1 },
      },
      vertexShader: /* glsl */ `
        uniform float pixelRatio;
        uniform float time;
        attribute float size;  
        attribute float speed;  
        attribute float opacity;
        attribute vec3 noise;
        attribute vec3 color;
        varying vec3 vColor;
        varying float vOpacity;

        void main() {
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);
          modelPosition.y += sin(time * speed + modelPosition.x * noise.x * 100.0) * 0.2;
          modelPosition.z += cos(time * speed + modelPosition.x * noise.y * 100.0) * 0.2;
          modelPosition.x += cos(time * speed + modelPosition.x * noise.z * 100.0) * 0.2;
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectionPostion = projectionMatrix * viewPosition;
          gl_Position = projectionPostion;
          gl_PointSize = size * 25. * pixelRatio;
          gl_PointSize *= (1.0 / - viewPosition.z);
          vColor = color;
          vOpacity = opacity;
        }
      `,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        varying float vOpacity;
        void main() {
          float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
          float strength = 0.05 / distanceToCenter - 0.1;
          gl_FragColor = vec4(vColor, strength * vOpacity);
          #include <tonemapping_fragment>
          #include <${version >= 154 ? 'colorspace_fragment' : 'encodings_fragment'}>
        }
      `,
    })
  }

  //* Uniform Accessors --------------------------------

  get time() {
    return this.uniforms.time.value as number
  }
  set time(value) {
    this.uniforms.time.value = value
  }

  get pixelRatio() {
    return this.uniforms.pixelRatio.value as number
  }
  set pixelRatio(value) {
    this.uniforms.pixelRatio.value = value
  }
}
