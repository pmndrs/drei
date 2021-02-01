import { Matrix4, MeshStandardMaterial, Texture } from 'three'

type UninitializedUniform<Value> = { value: Value | null }

export class MeshReflectorMaterial extends MeshStandardMaterial {
  private _tDepth: UninitializedUniform<Texture> = { value: null }
  private _tDiffuse: UninitializedUniform<Texture> = { value: null }
  private _tDiffuseBlur: UninitializedUniform<Texture> = { value: null }
  private _textureMatrix: UninitializedUniform<Matrix4> = { value: null }
  private _hasBlur: { value: boolean } = { value: false }
  private _mirror: { value: number } = { value: 0.0 }
  private _mixBlur: { value: number } = { value: 0.0 }
  private _blurStrength: { value: number } = { value: 0.5 }
  private _minDepthThreshold: { value: number } = { value: 0.9 }
  private _maxDepthThreshold: { value: number } = { value: 1 }
  private _depthScale: { value: number } = { value: 0 }

  constructor(parameters = {}) {
    super(parameters)
    this.setValues(parameters)
  }
  onBeforeCompile(shader) {
    shader.uniforms.hasBlur = this._hasBlur
    shader.uniforms.tDiffuse = this._tDiffuse
    shader.uniforms.tDepth = this._tDepth
    shader.uniforms.tDiffuseBlur = this._tDiffuseBlur
    shader.uniforms.textureMatrix = this._textureMatrix
    shader.uniforms.mirror = this._mirror
    shader.uniforms.mixBlur = this._mixBlur
    shader.uniforms.mixStrength = this._blurStrength
    shader.uniforms.minDepthThreshold = this._minDepthThreshold
    shader.uniforms.maxDepthThreshold = this._maxDepthThreshold
    shader.uniforms.depthScale = this._depthScale
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
        uniform sampler2D tDepth;
        uniform float cameraNear;
			  uniform float cameraFar;
        uniform bool hasBlur;
        uniform float mixBlur;
        uniform float mirror;
        uniform float mixStrength;
        uniform float minDepthThreshold;
        uniform float maxDepthThreshold;
        uniform float depthScale;
        varying vec4 my_vUv;        
        ${shader.fragmentShader}`
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      
      vec4 depth = texture2DProj(tDepth, my_vUv );
      vec4 base = texture2DProj(tDiffuse, my_vUv);
      vec4 blur = texture2DProj(tDiffuseBlur, my_vUv);

      float depthFactor = smoothstep(minDepthThreshold, maxDepthThreshold, 1.0-(depth.r * depth.a));
      depthFactor *= depthScale;
      depthFactor = min(1.0, depthFactor);

      float reflectorRoughnessFactor = roughness;
      #ifdef USE_ROUGHNESSMAP
        vec4 reflectorTexelRoughness = texture2D( roughnessMap, vUv );
        reflectorRoughnessFactor *= reflectorTexelRoughness.g;
      #endif

      vec4 tColor = base;
      vec4 merge = tColor;
      if (hasBlur) {
        float blurFactor = min(1.0, mixBlur * reflectorRoughnessFactor);
        merge = mix(merge, blur, blurFactor);
      }
      merge += mix(merge, base, depthFactor);
      diffuseColor.rgb = diffuseColor.rgb * ((1.0 - min(1.0, mirror)) + merge.rgb * mixStrength);           
      diffuseColor = sRGBToLinear(diffuseColor);`
    )
  }
  get tDiffuse(): Texture | null {
    return this._tDiffuse.value
  }
  set tDiffuse(v: Texture | null) {
    this._tDiffuse.value = v
  }
  get tDepth(): Texture | null {
    return this._tDepth.value
  }
  set tDepth(v: Texture | null) {
    this._tDepth.value = v
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
  get minDepthThreshold(): number {
    return this._minDepthThreshold.value
  }
  set minDepthThreshold(v: number) {
    this._minDepthThreshold.value = v
  }
  get maxDepthThreshold(): number {
    return this._maxDepthThreshold.value
  }
  set maxDepthThreshold(v: number) {
    this._maxDepthThreshold.value = v
  }
  get depthScale(): number {
    return this._depthScale.value
  }
  set depthScale(v: number) {
    this._depthScale.value = v
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
  minDepthThreshold: number
  maxDepthThreshold: number
  depthScale: number
} & JSX.IntrinsicElements['meshStandardMaterial']
