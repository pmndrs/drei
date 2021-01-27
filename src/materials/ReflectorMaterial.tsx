import { Matrix4, MeshStandardMaterial, Texture } from 'three'
import { extend } from 'react-three-fiber'

type UninitializedUniform<Value> = { value: Value | null }

export class MeshReflectorMaterial extends MeshStandardMaterial {
  private _tDiffuse: UninitializedUniform<Texture> = { value: null }
  private _textureMatrix: UninitializedUniform<Matrix4> = { value: null }
  private _mirror: { value: number } = { value: 0 }
  constructor(parameters = {}) {
    super(parameters)
    this.setValues(parameters)
  }
  onBeforeCompile(shader) {
    shader.uniforms.tDiffuse = this._tDiffuse
    shader.uniforms.textureMatrix = this._textureMatrix
    shader.uniforms.mirror = this._mirror
    shader.vertexShader = `
        uniform mat4 textureMatrix;
        varying vec4 my_vUv;     
      ${shader.vertexShader}`
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `#include <project_vertex>
        my_vUv = textureMatrix * vec4( position, 1.0 );
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );`
    )
    shader.fragmentShader = `
        uniform sampler2D tDiffuse;
        uniform float mirror;
        varying vec4 my_vUv;
        ${shader.fragmentShader}`
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
        vec4 base = texture2DProj(tDiffuse, my_vUv);
        vec4 tColor = base;
        diffuseColor.rgb = diffuseColor.rgb * (1.0 - mirror) + tColor.rgb;        
        diffuseColor = sRGBToLinear(diffuseColor);`
    )
  }
  get tDiffuse(): Texture | null {
    return this._tDiffuse.value
  }
  set tDiffuse(v: Texture | null) {
    this._tDiffuse.value = v
  }
  get textureMatrix(): Matrix4 | null {
    return this._textureMatrix.value
  }
  set textureMatrix(v: Matrix4 | null) {
    this._textureMatrix.value = v
  }
  get mirror(): boolean {
    return !!this._mirror.value
  }
  set mirror(v: boolean) {
    this._mirror.value = v ? 1 : 0
  }
}

export type MeshReflectorMaterialImpl = {} & JSX.IntrinsicElements['meshStandardMaterial']

declare global {
  namespace JSX {
    interface IntrinsicElements {
      meshReflectorMaterial: MeshReflectorMaterialImpl
    }
  }
}

extend({ MeshReflectorMaterial })
