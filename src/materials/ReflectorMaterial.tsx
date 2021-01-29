import { Matrix4, MeshStandardMaterial, Texture } from 'three'

type UninitializedUniform<Value> = { value: Value | null }

export class MeshReflectorMaterial extends MeshStandardMaterial {
  private _tDiffuse: UninitializedUniform<Texture> = { value: null }
  private _tDiffuseBlur: UninitializedUniform<Texture> = { value: null }
  private _textureMatrix: UninitializedUniform<Matrix4> = { value: null }
  private _hasBlur: { value: boolean } = { value: false }
  private _mirror: { value: number } = { value: 0.0 }
  private _mixBlur: { value: number } = { value: 0.0 }
  private _blurStrength: { value: number } = { value: 0.5 }

  constructor(parameters = {}) {
    super(parameters)
    this.setValues(parameters)
  }
  onBeforeCompile(shader) {
    shader.uniforms.hasBlur = this._hasBlur
    shader.uniforms.tDiffuse = this._tDiffuse
    shader.uniforms.tDiffuseBlur = this._tDiffuseBlur
    shader.uniforms.textureMatrix = this._textureMatrix
    shader.uniforms.mirror = this._mirror
    shader.uniforms.mixBlur = this._mixBlur
    shader.uniforms.mixStrength = this._blurStrength
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
        uniform sampler2D tDiffuseBlur;
        uniform bool hasBlur;
        uniform float mixBlur;
        uniform float mirror;
        uniform float mixStrength;
        varying vec4 my_vUv;
        ${shader.fragmentShader}`
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
        vec4 base = texture2DProj(tDiffuse, my_vUv);
        vec4 blur = texture2DProj(tDiffuseBlur, my_vUv);
        float reflectorRoughnessFactor = roughness;
        #ifdef USE_ROUGHNESSMAP
          vec4 reflectorTexelRoughness = texture2D( roughnessMap, vUv );
          reflectorRoughnessFactor *= reflectorTexelRoughness.g;
        #endif
        vec4 tColor = base;
        if (hasBlur) {
          float blurFactor = min(1.0, mixBlur * reflectorRoughnessFactor);
          tColor = mix(base, blur, blurFactor);
        }
        diffuseColor.rgb = diffuseColor.rgb * (1.0 - min(1.0, mirror)) + tColor.rgb * mixStrength;        
        diffuseColor = sRGBToLinear(diffuseColor);`
    )
  }
  get tDiffuse(): Texture | null {
    return this._tDiffuse.value
  }
  set tDiffuse(v: Texture | null) {
    this._tDiffuse.value = v
  }
  get tDiffuseBlur(): Texture | null {
    return this._tDiffuseBlur.value
  }
  set tDiffuseBlur(v: Texture | null) {
    this._tDiffuseBlur.value = v
  }
  get textureMatrix(): Matrix4 | null {
    return this._textureMatrix.value
  }
  set textureMatrix(v: Matrix4 | null) {
    this._textureMatrix.value = v
  }
  get hasBlur(): boolean {
    return this._hasBlur.value
  }
  set hasBlur(v: boolean) {
    this._hasBlur.value = v
  }
  get mirror(): number {
    return this._mirror.value
  }
  set mirror(v: number) {
    this._mirror.value = v
  }
  get mixBlur(): number {
    return this._mixBlur.value
  }
  set mixBlur(v: number) {
    this._mixBlur.value = v
  }
  get mixStrength(): number {
    return this._blurStrength.value
  }
  set mixStrength(v: number) {
    this._blurStrength.value = v
  }
}

export type MeshReflectorMaterialImpl = {
  mixBlur: number
  mixStrength: number
  mirror: number
  textureMatrix: Matrix4
  tDiffuse: Texture
  tDiffuseBlur: Texture
  hasBlur: boolean
} & JSX.IntrinsicElements['meshStandardMaterial']
