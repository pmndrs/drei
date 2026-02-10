// Author: N8Programs
// https://github.com/N8python/diamonds

import * as THREE from '#three'
import * as React from 'react'
import { extend, ReactThreeFiber, useThree, useFrame, ThreeElements } from '@react-three/fiber'
import { shaderMaterial } from '@legacy/Materials/shaderMaterial'
import { MeshBVHUniformStruct, MeshBVH, SAH, shaderStructs, shaderIntersectFunction } from 'three-mesh-bvh'
import { version } from '@utils/constants'
import { ForwardRefComponent } from '@utils/ts-utils'

const MeshRefractionMaterial_ = /* @__PURE__ */ shaderMaterial(
  {
    envMap: null,
    bounces: 3,
    ior: 2.4,
    correctMips: true,
    aberrationStrength: 0.01,
    fresnel: 0,
    bvh: /* @__PURE__ */ new MeshBVHUniformStruct(),
    color: /* @__PURE__ */ new THREE.Color('white'),
    opacity: 1,
    resolution: /* @__PURE__ */ new THREE.Vector2(),
    viewMatrixInverse: /* @__PURE__ */ new THREE.Matrix4(),
    projectionMatrixInverse: /* @__PURE__ */ new THREE.Matrix4(),
  },
  /*glsl*/ `
  uniform mat4 viewMatrixInverse;

  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying mat4 vModelMatrixInverse;

  #include <color_pars_vertex>

  void main() {
    #include <color_vertex>

    vec4 transformedNormal = vec4(normal, 0.0);
    vec4 transformedPosition = vec4(position, 1.0);
    #ifdef USE_INSTANCING
      transformedNormal = instanceMatrix * transformedNormal;
      transformedPosition = instanceMatrix * transformedPosition;
    #endif

    #ifdef USE_INSTANCING
      vModelMatrixInverse = inverse(modelMatrix * instanceMatrix);
    #else
      vModelMatrixInverse = inverse(modelMatrix);
    #endif

    vWorldPosition = (modelMatrix * transformedPosition).xyz;
    vNormal = normalize((viewMatrixInverse * vec4(normalMatrix * transformedNormal.xyz, 0.0)).xyz);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * transformedPosition;
  }`,
  /*glsl*/ `
  #define ENVMAP_TYPE_CUBE_UV
  precision highp isampler2D;
  precision highp usampler2D;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying mat4 vModelMatrixInverse;

  #include <color_pars_fragment>

  #ifdef ENVMAP_TYPE_CUBEM
    uniform samplerCube envMap;
  #else
    uniform sampler2D envMap;
  #endif

  uniform float bounces;
  ${shaderStructs}
  ${shaderIntersectFunction}
  uniform BVH bvh;
  uniform float ior;
  uniform bool correctMips;
  uniform vec2 resolution;
  uniform float fresnel;
  uniform mat4 modelMatrix;
  uniform mat4 projectionMatrixInverse;
  uniform mat4 viewMatrixInverse;
  uniform float aberrationStrength;
  uniform vec3 color;
  uniform float opacity;

  float fresnelFunc(vec3 viewDirection, vec3 worldNormal) {
    return pow( 1.0 + dot( viewDirection, worldNormal), 10.0 );
  }

  vec3 totalInternalReflection(vec3 ro, vec3 rd, vec3 normal, float ior, mat4 modelMatrixInverse) {
    vec3 rayOrigin = ro;
    vec3 rayDirection = rd;
    rayDirection = refract(rayDirection, normal, 1.0 / ior);
    rayOrigin = vWorldPosition + rayDirection * 0.001;
    rayOrigin = (modelMatrixInverse * vec4(rayOrigin, 1.0)).xyz;
    rayDirection = normalize((modelMatrixInverse * vec4(rayDirection, 0.0)).xyz);
    for(float i = 0.0; i < bounces; i++) {
      uvec4 faceIndices = uvec4( 0u );
      vec3 faceNormal = vec3( 0.0, 0.0, 1.0 );
      vec3 barycoord = vec3( 0.0 );
      float side = 1.0;
      float dist = 0.0;
      bvhIntersectFirstHit( bvh, rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist );
      vec3 hitPos = rayOrigin + rayDirection * max(dist - 0.001, 0.0);
      vec3 tempDir = refract(rayDirection, faceNormal, ior);
      if (length(tempDir) != 0.0) {
        rayDirection = tempDir;
        break;
      }
      rayDirection = reflect(rayDirection, faceNormal);
      rayOrigin = hitPos + rayDirection * 0.01;
    }
    rayDirection = normalize((modelMatrix * vec4(rayDirection, 0.0)).xyz);
    return rayDirection;
  }

  #include <common>
  #include <cube_uv_reflection_fragment>

  #ifdef ENVMAP_TYPE_CUBEM
    vec4 textureGradient(samplerCube envMap, vec3 rayDirection, vec3 directionCamPerfect) {
      return textureGrad(envMap, rayDirection, dFdx(correctMips ? directionCamPerfect: rayDirection), dFdy(correctMips ? directionCamPerfect: rayDirection));
    }
  #else
    vec4 textureGradient(sampler2D envMap, vec3 rayDirection, vec3 directionCamPerfect) {
      vec2 uvv = equirectUv( rayDirection );
      vec2 smoothUv = equirectUv( directionCamPerfect );
      return textureGrad(envMap, uvv, dFdx(correctMips ? smoothUv : uvv), dFdy(correctMips ? smoothUv : uvv));
    }
  #endif

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec3 directionCamPerfect = (projectionMatrixInverse * vec4(uv * 2.0 - 1.0, 0.0, 1.0)).xyz;
    directionCamPerfect = (viewMatrixInverse * vec4(directionCamPerfect, 0.0)).xyz;
    directionCamPerfect = normalize(directionCamPerfect);
    vec3 normal = vNormal;
    vec3 rayOrigin = cameraPosition;
    vec3 rayDirection = normalize(vWorldPosition - cameraPosition);

    vec4 diffuseColor = vec4(color, opacity);
    #include <color_fragment>

    #ifdef CHROMATIC_ABERRATIONS
      vec3 rayDirectionG = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior, 1.0), vModelMatrixInverse);
      #ifdef FAST_CHROMA
        vec3 rayDirectionR = normalize(rayDirectionG + 1.0 * vec3(aberrationStrength / 2.0));
        vec3 rayDirectionB = normalize(rayDirectionG - 1.0 * vec3(aberrationStrength / 2.0));
      #else
        vec3 rayDirectionR = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior * (1.0 - aberrationStrength), 1.0), vModelMatrixInverse);
        vec3 rayDirectionB = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior * (1.0 + aberrationStrength), 1.0), vModelMatrixInverse);
      #endif
      float finalColorR = textureGradient(envMap, rayDirectionR, directionCamPerfect).r;
      float finalColorG = textureGradient(envMap, rayDirectionG, directionCamPerfect).g;
      float finalColorB = textureGradient(envMap, rayDirectionB, directionCamPerfect).b;
      diffuseColor.rgb *= vec3(finalColorR, finalColorG, finalColorB);
    #else
      rayDirection = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior, 1.0), vModelMatrixInverse);
      diffuseColor.rgb *= textureGradient(envMap, rayDirection, directionCamPerfect).rgb;
    #endif

    vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
    float nFresnel = fresnelFunc(viewDirection, normal) * fresnel;
    gl_FragColor = vec4(mix(diffuseColor.rgb, vec3(1.0), nFresnel), diffuseColor.a);

    #include <tonemapping_fragment>
    #include <${version >= 154 ? 'colorspace_fragment' : 'encodings_fragment'}>
  }`
)

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshRefractionMaterial_: ThreeElements['shaderMaterial'] & {
      envMap?: THREE.CubeTexture | THREE.Texture | null
      bounces?: number
      ior?: number
      correctMips?: boolean
      aberrationStrength?: number
      fresnel?: number
      bvh?: MeshBVHUniformStruct
      color?: ReactThreeFiber.Color
      opacity?: number
      resolution?: [number, number] | THREE.Vector2
      viewMatrixInverse?: THREE.Matrix4
      projectionMatrixInverse?: THREE.Matrix4
    }
  }
}

export type MeshRefractionMaterialProps = ThreeElements['shaderMaterial'] & {
  /** Environment map */
  envMap: THREE.CubeTexture | THREE.Texture
  /** Number of ray-cast bounces, it can be expensive to have too many. @default 2 */
  bounces?: number
  /** Refraction index. @default 2.4 */
  ior?: number
  /** Fresnel (strip light). @default 0 */
  fresnel?: number
  /** RGB shift intensity, can be expensive. @default 0 */
  aberrationStrength?: number
  /** Color. @default 'white' */
  color?: ReactThreeFiber.Color
  /** If this is on it uses fewer ray casts for the RGB shift sacrificing physical accuracy. @default true */
  fastChroma?: boolean
}

const isCubeTexture = (def: THREE.CubeTexture | THREE.Texture): def is THREE.CubeTexture =>
  def && (def as THREE.CubeTexture).isCubeTexture

/**
 * Material for realistic diamond/gem refraction using raytracing and BVH.
 * Supports chromatic aberration, IOR, and environment mapping.
 *
 * @example
 * ```jsx
 * <mesh>
 *   <dodecahedronGeometry />
 *   <MeshRefractionMaterial envMap={envMap} bounces={3} ior={2.4} />
 * </mesh>
 * ```
 */
export const MeshRefractionMaterial: ForwardRefComponent<
  MeshRefractionMaterialProps,
  InstanceType<typeof MeshRefractionMaterial_>
> = /* @__PURE__ */ React.forwardRef(
  ({ aberrationStrength = 0, fastChroma = true, envMap, ...props }: MeshRefractionMaterialProps, ref) => {
    extend({ MeshRefractionMaterial_: MeshRefractionMaterial_ })

    const material = React.useRef<InstanceType<typeof MeshRefractionMaterial_>>(null)
    const { size } = useThree()

    const defines = React.useMemo(() => {
      const temp = {} as { [key: string]: string }
      const isCubeMap = isCubeTexture(envMap)
      const w = (isCubeMap ? (envMap.image as any[])[0]?.width : (envMap.image as any).width) ?? 1024
      const cubeSize = w / 4
      const _lodMax = Math.floor(Math.log2(cubeSize))
      const _cubeSize = Math.pow(2, _lodMax)
      const width = 3 * Math.max(_cubeSize, 16 * 7)
      const height = 4 * _cubeSize
      if (isCubeMap) temp.ENVMAP_TYPE_CUBEM = ''
      temp.CUBEUV_TEXEL_WIDTH = `${1.0 / width}`
      temp.CUBEUV_TEXEL_HEIGHT = `${1.0 / height}`
      temp.CUBEUV_MAX_MIP = `${_lodMax}.0`
      if (aberrationStrength > 0) temp.CHROMATIC_ABERRATIONS = ''
      if (fastChroma) temp.FAST_CHROMA = ''
      return temp
    }, [aberrationStrength, fastChroma, envMap])

    React.useLayoutEffect(() => {
      const geometry = (material.current as any)?.__r3f?.parent?.object?.geometry
      if (geometry) {
        const geometryNi = geometry.index ? geometry.clone().toNonIndexed() : geometry.clone()
        ;(material.current as any).bvh = new MeshBVHUniformStruct()
        ;(material.current as any).bvh.updateFrom(new MeshBVH(geometryNi, { strategy: SAH }))
      }
    }, [])

    useFrame(({ camera }) => {
      ;(material.current as any)!.viewMatrixInverse = camera.matrixWorld
      ;(material.current as any)!.projectionMatrixInverse = camera.projectionMatrixInverse
    })

    React.useImperativeHandle(ref, () => material.current!, [])

    return (
      <meshRefractionMaterial_
        key={JSON.stringify(defines)}
        defines={defines}
        ref={material}
        resolution={[size.width, size.height]}
        aberrationStrength={aberrationStrength}
        envMap={envMap}
        {...props}
      />
    )
  }
)
