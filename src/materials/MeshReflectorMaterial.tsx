import { Matrix4, MeshStandardMaterial, Texture, Vector2 } from 'three'

type UninitializedUniform<Value> = { value: Value | null }

export class MeshReflectorMaterial extends MeshStandardMaterial {
  private _debug: { value: number } = { value: 0 }
  private _tDepth: UninitializedUniform<Texture> = { value: null }
  private _distortionMap: UninitializedUniform<Texture> = { value: null }
  private _tDiffuse: UninitializedUniform<Texture> = { value: null }
  private _u_mipmap_0: UninitializedUniform<Texture> = { value: null }
  private _u_mipmap_1: UninitializedUniform<Texture> = { value: null }
  private _u_mipmap_2: UninitializedUniform<Texture> = { value: null }
  private _u_mipmap_3: UninitializedUniform<Texture> = { value: null }
  private _u_mipmap_4: UninitializedUniform<Texture> = { value: null }
  private _u_mipmap_5: UninitializedUniform<Texture> = { value: null }
  private _u_mipmap_6: UninitializedUniform<Texture> = { value: null }
  private _u_mipmap_7: UninitializedUniform<Texture> = { value: null }
  private _u_mipmap_res_0: UninitializedUniform<Vector2> = { value: null }
  private _u_mipmap_res_1: UninitializedUniform<Vector2> = { value: null }
  private _u_mipmap_res_2: UninitializedUniform<Vector2> = { value: null }
  private _u_mipmap_res_3: UninitializedUniform<Vector2> = { value: null }
  private _u_mipmap_res_4: UninitializedUniform<Vector2> = { value: null }
  private _u_mipmap_res_5: UninitializedUniform<Vector2> = { value: null }
  private _u_mipmap_res_6: UninitializedUniform<Vector2> = { value: null }
  private _u_mipmap_res_7: UninitializedUniform<Vector2> = { value: null }
  private _textureMatrix: UninitializedUniform<Matrix4> = { value: null }
  private _hasBlur: { value: boolean } = { value: false }
  private _mirror: { value: number } = { value: 0.0 }
  private _mixBlur: { value: number } = { value: 0.0 }
  private _blurStrength: { value: number } = { value: 0.5 }
  private _minDepthThreshold: { value: number } = { value: 0.9 }
  private _maxDepthThreshold: { value: number } = { value: 1 }
  private _depthScale: { value: number } = { value: 0 }
  private _depthToBlurRatioBias: { value: number } = { value: 0.25 }
  private _distortion: { value: number } = { value: 1 }

  constructor(parameters = {}) {
    super(parameters)
    this.setValues(parameters)
  }
  onBeforeCompile(shader) {
    if (!shader.defines?.USE_UV) {
      shader.defines.USE_UV = ''
    }
    shader.uniforms.debug = this._debug
    shader.uniforms.hasBlur = this._hasBlur
    shader.uniforms.tDiffuse = this._tDiffuse
    shader.uniforms.tDepth = this._tDepth
    shader.uniforms.distortionMap = this._distortionMap
    shader.uniforms.u_mipmap_0 = this._u_mipmap_0
    shader.uniforms.u_mipmap_1 = this._u_mipmap_1
    shader.uniforms.u_mipmap_2 = this._u_mipmap_2
    shader.uniforms.u_mipmap_3 = this._u_mipmap_3
    shader.uniforms.u_mipmap_4 = this._u_mipmap_4
    shader.uniforms.u_mipmap_5 = this._u_mipmap_5
    shader.uniforms.u_mipmap_6 = this._u_mipmap_6
    shader.uniforms.u_mipmap_7 = this._u_mipmap_7
    shader.uniforms.u_mipmap_res_0 = this._u_mipmap_res_0
    shader.uniforms.u_mipmap_res_1 = this._u_mipmap_res_1
    shader.uniforms.u_mipmap_res_2 = this._u_mipmap_res_2
    shader.uniforms.u_mipmap_res_3 = this._u_mipmap_res_3
    shader.uniforms.u_mipmap_res_4 = this._u_mipmap_res_4
    shader.uniforms.u_mipmap_res_5 = this._u_mipmap_res_5
    shader.uniforms.u_mipmap_res_6 = this._u_mipmap_res_6
    shader.uniforms.u_mipmap_res_7 = this._u_mipmap_res_7
    shader.uniforms.textureMatrix = this._textureMatrix
    shader.uniforms.mirror = this._mirror
    shader.uniforms.mixBlur = this._mixBlur
    shader.uniforms.mixStrength = this._blurStrength
    shader.uniforms.minDepthThreshold = this._minDepthThreshold
    shader.uniforms.maxDepthThreshold = this._maxDepthThreshold
    shader.uniforms.depthScale = this._depthScale
    shader.uniforms.depthToBlurRatioBias = this._depthToBlurRatioBias
    shader.uniforms.distortion = this._distortion
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
        uniform int debug;
        uniform sampler2D tDiffuse;
        uniform sampler2D tDepth;
        uniform sampler2D distortionMap;
        uniform sampler2D u_mipmap_0;
        uniform sampler2D u_mipmap_1;
        uniform sampler2D u_mipmap_2;
        uniform sampler2D u_mipmap_3;
        uniform sampler2D u_mipmap_4;
        uniform sampler2D u_mipmap_5;
        uniform sampler2D u_mipmap_6;
        uniform sampler2D u_mipmap_7;
        uniform vec2 u_mipmap_res_0;
        uniform vec2 u_mipmap_res_1;
        uniform vec2 u_mipmap_res_2;
        uniform vec2 u_mipmap_res_3;
        uniform vec2 u_mipmap_res_4;
        uniform vec2 u_mipmap_res_5;
        uniform vec2 u_mipmap_res_6;
        uniform vec2 u_mipmap_res_7;
        uniform float distortion;
        uniform float cameraNear;
			  uniform float cameraFar;
        uniform bool hasBlur;
        uniform float mixBlur;
        uniform float mirror;
        uniform float mixStrength;
        uniform float minDepthThreshold;
        uniform float maxDepthThreshold;
        uniform float depthScale;
        uniform float depthToBlurRatioBias;
        varying vec4 my_vUv;  
        
        // from http://www.java-gaming.org/index.php?topic=35123.0
        vec4 cubic( float v ) {
          vec4 n = vec4( 1.0, 2.0, 3.0, 4.0 ) - v;
          vec4 s = n * n * n;
          float x = s.x;
          float y = s.y - 4.0 * s.x;
          float z = s.z - 4.0 * s.y + 6.0 * s.x;
          float w = 6.0 - x - y - z;
          return vec4( x, y, z, w ) * ( 1.0 / 6.0 );
        }
        
        vec4 textureBicubic( sampler2D sampler, vec2 texCoords, vec2 texSize ) {
          vec2 invTexSize = 1.0 / texSize;
          texCoords = texCoords * texSize - 0.5;
          vec2 fxy = fract( texCoords );
          texCoords -= fxy;

          vec4 xcubic = cubic( fxy.x );
          vec4 ycubic = cubic( fxy.y );
          vec4 c = texCoords.xxyy + vec2 ( - 0.5, + 1.5 ).xyxy;
          vec4 s = vec4( xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw );

          vec4 offset = c + vec4( xcubic.yw, ycubic.yw ) / s;
          offset *= invTexSize.xxyy;
        
          vec4 sample0 = texture2D( sampler, offset.xz);
          vec4 sample1 = texture2D( sampler, offset.yz);
          vec4 sample2 = texture2D( sampler, offset.xw);
          vec4 sample3 = texture2D( sampler, offset.yw);
        
          float sx = s.x / ( s.x + s.y );
          float sy = s.z / ( s.z + s.w );

          return mix(
            mix(
              sample3,
              sample2,
              sx
            ),
            mix(
              sample1,
              sample0,
              sx
            ),
            sy
          );
        }


        ${shader.fragmentShader}`
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
    
      float depthFactor = 0.0001;
      float blurFactor = 0.0;
      float distortionFactor = 0.0;
      vec3 my_normal = vec3(0.0);
      float reflectorRoughnessFactor = roughness;
      vec3 coord = my_vUv.xyz / my_vUv.w;

      #ifdef USE_DISTORTION
        distortionFactor = texture2D(distortionMap, vUv).r * distortion;
      #endif

      #ifdef USE_NORMALMAP
        vec4 normalColor = texture2D(normalMap, vUv * normalScale);
        my_normal = normalize( vec3( normalColor.r * 2.0 - 1.0, normalColor.b ,  normalColor.g * 2.0 - 1.0 ) );
      #endif

      #ifdef USE_ROUGHNESSMAP
        vec4 reflectorTexelRoughness = texture2D( roughnessMap, vUv );
        reflectorRoughnessFactor *= reflectorTexelRoughness.g;
      #endif

      vec2 proj_vUv = coord.xy + coord.z * my_normal.xz * 0.01;
      proj_vUv.x += distortionFactor;
      proj_vUv.y += distortionFactor;

      vec4 depth = texture2D(tDepth, proj_vUv);
      depthFactor = smoothstep(minDepthThreshold, maxDepthThreshold, 1.0-(depth.r * depth.a));
      depthFactor *= depthScale;
      depthFactor = max(0.0001, min(1.0, depthFactor));

      float lod = 1.0 - min(1.0, mixBlur * reflectorRoughnessFactor);
      vec4 baseColor = texture2D(tDiffuse, proj_vUv);
      vec4 mixedColor;

      if (lod < 1./8.) {
        vec4 one = textureBicubic(u_mipmap_7, proj_vUv, u_mipmap_res_7);
        vec4 two = textureBicubic(u_mipmap_6, proj_vUv, u_mipmap_res_6);
        mixedColor = mix(one, two, lod/(1./8.));
      } else if (lod < 2./8.) {
        vec4 one = textureBicubic(u_mipmap_6, proj_vUv, u_mipmap_res_6);
        vec4 two = textureBicubic(u_mipmap_5, proj_vUv, u_mipmap_res_5);
        mixedColor = mix(one, two, lod/(2./8.));
      } else if (lod < 3./8.) {
        vec4 one = textureBicubic(u_mipmap_5, proj_vUv, u_mipmap_res_5);
        vec4 two = textureBicubic(u_mipmap_4, proj_vUv, u_mipmap_res_4);
        mixedColor = mix(one, two, lod/(3./8.));
      } else if (lod < 4./8.) {
        vec4 one = textureBicubic(u_mipmap_4, proj_vUv, u_mipmap_res_4);
        vec4 two = textureBicubic(u_mipmap_3, proj_vUv, u_mipmap_res_3);
        mixedColor = mix(one, two, lod/(4./8.));
      } else if (lod < 5./8.) {
        vec4 one = textureBicubic(u_mipmap_3, proj_vUv, u_mipmap_res_3);
        vec4 two = textureBicubic(u_mipmap_2, proj_vUv, u_mipmap_res_2);
        mixedColor = mix(one, two, lod/(5./8.));
      } else if (lod < 6./8.) {
        vec4 one = textureBicubic(u_mipmap_2, proj_vUv, u_mipmap_res_2);
        vec4 two = textureBicubic(u_mipmap_1, proj_vUv, u_mipmap_res_1);
        mixedColor = mix(one, two, lod/(6./8.));
      } else if (lod < 7./8.) {
        vec4 one = textureBicubic(u_mipmap_1, proj_vUv, u_mipmap_res_1);
        vec4 two = textureBicubic(u_mipmap_0, proj_vUv, u_mipmap_res_0);
        mixedColor = mix(one, two, lod/(7./8.));
      } else {
        vec4 one = textureBicubic(u_mipmap_0, proj_vUv, u_mipmap_res_0);
        mixedColor = mix(one, baseColor, lod);
      }
      
      mixedColor *= min(1.0, depthFactor + depthToBlurRatioBias);
      //float mixFactor = min(1.0, mixBlur * reflectorRoughnessFactor);
      //mixedColor = mix(baseColor, mixedColor, mixFactor);

      diffuseColor.rgb = diffuseColor.rgb * ((1.0 - min(1.0, mirror)) + mixedColor.rgb * mixStrength);     
      diffuseColor = sRGBToLinear(diffuseColor);

      // if (debug == 1) {
      //   diffuseColor = sRGBToLinear(vec4(vec3(depthFactor), 1.0));
      // }
      // if (debug == 2) {
      //   diffuseColor = sRGBToLinear(vec4(vec3(blurFactor), 1.0));
      // }
      // if (debug == 3) {
      //   diffuseColor = sRGBToLinear(texture2DProj(tDiffuse, new_vUv));
      // }
      // if (debug == 4) {
      //   diffuseColor = sRGBToLinear(texture2DProj(tDiffuseBlur, new_vUv));
      // }
      `
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
  get distortionMap(): Texture | null {
    return this._distortionMap.value
  }
  set distortionMap(v: Texture | null) {
    this._distortionMap.value = v
  }
  get u_mipmap_0(): Texture | null {
    return this._u_mipmap_0.value
  }
  set u_mipmap_0(v: Texture | null) {
    this._u_mipmap_0.value = v
  }
  get u_mipmap_1(): Texture | null {
    return this._u_mipmap_1.value
  }
  set u_mipmap_1(v: Texture | null) {
    this._u_mipmap_1.value = v
  }
  get u_mipmap_2(): Texture | null {
    return this._u_mipmap_2.value
  }
  set u_mipmap_2(v: Texture | null) {
    this._u_mipmap_2.value = v
  }
  get u_mipmap_3(): Texture | null {
    return this._u_mipmap_3.value
  }
  set u_mipmap_3(v: Texture | null) {
    this._u_mipmap_3.value = v
  }
  get u_mipmap_4(): Texture | null {
    return this._u_mipmap_4.value
  }
  set u_mipmap_4(v: Texture | null) {
    this._u_mipmap_4.value = v
  }
  get u_mipmap_5(): Texture | null {
    return this._u_mipmap_5.value
  }
  set u_mipmap_5(v: Texture | null) {
    this._u_mipmap_5.value = v
  }
  get u_mipmap_6(): Texture | null {
    return this._u_mipmap_6.value
  }
  set u_mipmap_6(v: Texture | null) {
    this._u_mipmap_6.value = v
  }
  get u_mipmap_7(): Texture | null {
    return this._u_mipmap_7.value
  }
  set u_mipmap_7(v: Texture | null) {
    this._u_mipmap_7.value = v
  }
  get u_mipmap_res_0(): Vector2 | null {
    return this._u_mipmap_res_0.value
  }
  set u_mipmap_res_0(v: Vector2 | null) {
    this._u_mipmap_res_0.value = v
  }
  get u_mipmap_res_1(): Vector2 | null {
    return this._u_mipmap_res_1.value
  }
  set u_mipmap_res_1(v: Vector2 | null) {
    this._u_mipmap_res_1.value = v
  }
  get u_mipmap_res_2(): Vector2 | null {
    return this._u_mipmap_res_2.value
  }
  set u_mipmap_res_2(v: Vector2 | null) {
    this._u_mipmap_res_2.value = v
  }
  get u_mipmap_res_3(): Vector2 | null {
    return this._u_mipmap_res_3.value
  }
  set u_mipmap_res_3(v: Vector2 | null) {
    this._u_mipmap_res_3.value = v
  }
  get u_mipmap_res_4(): Vector2 | null {
    return this._u_mipmap_res_4.value
  }
  set u_mipmap_res_4(v: Vector2 | null) {
    this._u_mipmap_res_4.value = v
  }
  get u_mipmap_res_5(): Vector2 | null {
    return this._u_mipmap_res_5.value
  }
  set u_mipmap_res_5(v: Vector2 | null) {
    this._u_mipmap_res_5.value = v
  }
  get u_mipmap_res_6(): Vector2 | null {
    return this._u_mipmap_res_6.value
  }
  set u_mipmap_res_6(v: Vector2 | null) {
    this._u_mipmap_res_6.value = v
  }
  get u_mipmap_res_7(): Vector2 | null {
    return this._u_mipmap_res_7.value
  }
  set u_mipmap_res_7(v: Vector2 | null) {
    this._u_mipmap_res_7.value = v
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
  get debug(): number {
    return this._debug.value
  }
  set debug(v: number) {
    this._debug.value = v
  }
  get depthToBlurRatioBias(): number {
    return this._depthToBlurRatioBias.value
  }
  set depthToBlurRatioBias(v: number) {
    this._depthToBlurRatioBias.value = v
  }
  get distortion(): number {
    return this._distortion.value
  }
  set distortion(v: number) {
    this._distortion.value = v
  }
}

export type MeshReflectorMaterialImpl = {
  mixBlur: number
  mixStrength: number
  mirror: number
  textureMatrix: Matrix4
  tDiffuse: Texture
  distortionMap?: Texture
  u_mipmap_0?: Texture
  u_mipmap_1?: Texture
  u_mipmap_2?: Texture
  u_mipmap_3?: Texture
  u_mipmap_4?: Texture
  u_mipmap_5?: Texture
  u_mipmap_6?: Texture
  u_mipmap_7?: Texture
  u_mipmap_res_0?: Vector2
  u_mipmap_res_1?: Vector2
  u_mipmap_res_2?: Vector2
  u_mipmap_res_3?: Vector2
  u_mipmap_res_4?: Vector2
  u_mipmap_res_5?: Vector2
  u_mipmap_res_6?: Vector2
  u_mipmap_res_7?: Vector2
  hasBlur: boolean
  minDepthThreshold: number
  maxDepthThreshold: number
  depthScale: number
  depthToBlurRatioBias: number
  distortion: number
} & JSX.IntrinsicElements['meshStandardMaterial']
