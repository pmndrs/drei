import { extend } from '@react-three/fiber'
import { Material, REVISION } from '#three'

export function CloudMaterial(BaseMaterial: typeof Material) {
  return class extends BaseMaterial {
    constructor(...args: any[]) {
      super(...args)
      const opaque_fragment = parseInt(REVISION.replace(/\D+/g, '')) >= 154 ? 'opaque_fragment' : 'output_fragment'
      // @ts-ignore
      this.onBeforeCompile = (shader) => {
        shader.vertexShader =
          `attribute float cloudOpacity;
           varying float vOpacity;
          ` +
          shader.vertexShader.replace(
            '#include <fog_vertex>',
            `#include <fog_vertex>
             vOpacity = cloudOpacity;
            `
          )
        shader.fragmentShader =
          `varying float vOpacity;
          ` +
          shader.fragmentShader.replace(
            `#include <${opaque_fragment}>`,
            `#include <${opaque_fragment}>
             gl_FragColor = vec4(outgoingLight, diffuseColor.a * vOpacity);
            `
          )
      }
    }
  }
}
