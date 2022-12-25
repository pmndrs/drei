// Author: N8Programs
// https://github.com/N8python/diamonds

import * as THREE from 'three'
import { shaderMaterial } from '../core/shaderMaterial'
import { MeshBVHUniformStruct, shaderStructs, shaderIntersectFunction } from 'three-mesh-bvh'

export const MeshRefractionMaterial = shaderMaterial(
  {
    envMap: null,
    bounces: 3,
    ior: 2.4,
    correctMips: true,
    aberrationStrength: 0.01,
    fresnel: 0,
    bvh: new MeshBVHUniformStruct(),
    color: new THREE.Color('white'),
    resolution: new THREE.Vector2(),
  },
  /*glsl*/ `
  #ifndef USE_COLOR
    uniform vec3 color;
  #endif
  varying vec3 vWorldPosition;  
  varying vec3 vNormal;
  varying mat4 projectionMatrixInv;
  varying mat4 viewMatrixInv;
  varying vec3 viewDirection;
  varying mat4 vInstanceMatrix;
  varying vec3 vColor;
  
  void main() {        
    vec4 transformedNormal = vec4(normal, 0.0);
    vec4 transformedPosition = vec4(position, 1.0);
    #ifdef USE_INSTANCING
      vInstanceMatrix = instanceMatrix;
      transformedNormal = instanceMatrix * transformedNormal;
      transformedPosition = instanceMatrix * transformedPosition;
    #else
      vInstanceMatrix = mat4(1.0);
    #endif

    vColor = color;
    #ifdef USE_INSTANCING_COLOR
      vColor *= instanceColor.rgb;
    #endif
  
    projectionMatrixInv = inverse(projectionMatrix);
    viewMatrixInv = inverse(viewMatrix);

    vWorldPosition = (modelMatrix * transformedPosition).xyz;
    vNormal = normalize((viewMatrixInv * vec4(normalMatrix * transformedNormal.xyz, 0.0)).xyz);
    viewDirection = normalize(vWorldPosition - cameraPosition);
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * transformedPosition;
  }`,
  /*glsl*/ `
  #define ENVMAP_TYPE_CUBE_UV
  precision highp isampler2D;
  precision highp usampler2D;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
    
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
    
  uniform float aberrationStrength;
  varying mat4 projectionMatrixInv;
  varying mat4 viewMatrixInv;
  varying vec3 viewDirection;  
  varying mat4 vInstanceMatrix;
  varying vec3 vColor;
  
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
    mat4 modelMatrixInverse = inverse(modelMatrix * vInstanceMatrix);
    vec2 uv = gl_FragCoord.xy / resolution;
    vec3 directionCamPerfect = (projectionMatrixInv * vec4(uv * 2.0 - 1.0, 0.0, 1.0)).xyz;
    directionCamPerfect = (viewMatrixInv * vec4(directionCamPerfect, 0.0)).xyz;
    directionCamPerfect = normalize(directionCamPerfect);
    vec3 normal = vNormal;
    vec3 rayOrigin = cameraPosition;
    vec3 rayDirection = normalize(vWorldPosition - cameraPosition);
    vec3 finalColor;
    #ifdef CHROMATIC_ABERRATIONS
      vec3 rayDirectionG = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior, 1.0), modelMatrixInverse);
      #ifdef FAST_CHROMA 
        vec3 rayDirectionR = normalize(rayDirectionG + 1.0 * vec3(aberrationStrength / 2.0));
        vec3 rayDirectionB = normalize(rayDirectionG - 1.0 * vec3(aberrationStrength / 2.0));
      #else
        vec3 rayDirectionR = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior * (1.0 - aberrationStrength), 1.0), modelMatrixInverse);
        vec3 rayDirectionB = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior * (1.0 + aberrationStrength), 1.0), modelMatrixInverse);
      #endif
      float finalColorR = textureGradient(envMap, rayDirectionR, directionCamPerfect).r;
      float finalColorG = textureGradient(envMap, rayDirectionG, directionCamPerfect).g;
      float finalColorB = textureGradient(envMap, rayDirectionB, directionCamPerfect).b;
      finalColor = vec3(finalColorR, finalColorG, finalColorB) * vColor;
    #else
      rayDirection = totalInternalReflection(rayOrigin, rayDirection, normal, max(ior, 1.0), modelMatrixInverse);
      finalColor = textureGradient(envMap, rayDirection, directionCamPerfect).rgb;    
      finalColor *= vColor;
    #endif
    float nFresnel = fresnelFunc(viewDirection, normal) * fresnel;
    gl_FragColor = vec4(mix(finalColor, vec3(1.0), nFresnel), 1.0);      
    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }`
)
