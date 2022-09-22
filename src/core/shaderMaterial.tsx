import * as THREE from 'three'

export function shaderMaterial(
  uniforms: {
    [name: string]:
      | THREE.CubeTexture
      | THREE.Texture
      | Int32Array
      | Float32Array
      | THREE.Matrix4
      | THREE.Matrix3
      | THREE.Quaternion
      | THREE.Vector4
      | THREE.Vector3
      | THREE.Vector2
      | THREE.Color
      | number
      | boolean
      | Array<any>
      | null
  },
  vertexShader: string,
  fragmentShader: string,
  onInit?: (material?: THREE.ShaderMaterial) => void
) {
  const material = class extends THREE.ShaderMaterial {
    public key: string = ''
    constructor(parameters = {}) {
      const entries = Object.entries(uniforms)
      // Create unforms and shaders
      super({
        uniforms: entries.reduce((acc, [name, value]) => {
          const uniform = THREE.UniformsUtils.clone({ [name]: { value } })
          return {
            ...acc,
            ...uniform,
          }
        }, {}),
        vertexShader,
        fragmentShader,
        ...parameters,
      })
      // Create getter/setters
      entries.forEach(([name]) =>
        Object.defineProperty(this, name, {
          get: () => this.uniforms[name].value,
          set: (v) => (this.uniforms[name].value = v),
        })
      )

      if (onInit) onInit(this)
    }
  } as unknown as typeof THREE.ShaderMaterial & { key: string }
  material.key = THREE.MathUtils.generateUUID()
  return material
}
