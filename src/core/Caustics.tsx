/** Author: @N8Programs https://github.com/N8python
 *    https://github.com/N8python/caustics
 */

import * as THREE from 'three'
import * as React from 'react'
import { extend, ReactThreeFiber, useThree } from '@react-three/fiber'
import { useFBO } from './useFBO'
import { useHelper } from './useHelper'
import { shaderMaterial } from './shaderMaterial'
import { FullScreenQuad } from 'three-stdlib'

type CausticsMaterialType = THREE.ShaderMaterial & {
  cameraMatrixWorld?: THREE.Matrix4
  cameraProjectionMatrixInv?: THREE.Matrix4
  normalTexture?: THREE.Texture | null
  depthTexture?: THREE.Texture | null
  lightDir?: THREE.Vector3
  near?: number
  far?: number
  modelMatrix?: THREE.Matrix4
  worldRadius?: number
  ior?: number
  bounces?: number
  resolution?: number
  size?: number
  intensity?: number
}

type CausticsProjectionMaterialType = THREE.MeshNormalMaterial & {
  viewMatrix: { value?: THREE.Matrix4 }
  causticsTexture?: THREE.Texture
  causticsTextureB?: THREE.Texture
  lightProjMatrix?: THREE.Matrix4
  lightViewMatrix?: THREE.Matrix4
}

type CausticsProps = JSX.IntrinsicElements['group'] & {
  /** Enables visual cues to help you stage your scene, default: false */
  debug?: boolean
  /** Will display caustics only and skip the models, default: false */
  causticsOnly: boolean
  /** Will include back faces and enable the backfaceIor prop, default: false */
  backfaces: boolean
  /** The size of the camera frustum, default: 2 */
  frustum?: number
  /** The IOR refraction index, default: 1.1 */
  ior?: number
  /** The IOR refraction index for back faces (only available when backfaces is enabled), default: 1.1 */
  backfaceIor?: number
  /** The texel size, default: 0.3125 */
  worldRadius?: number
  /** Intensity of the prjected caustics, default: 0.05 */
  intensity?: number
  /** Buffer resolution, default: 2048 */
  resolution?: number
  /** Camera near, default: 0.1 */
  near?: number
  /** Camera far, default: 100 */
  far?: number
  /** Camera position, default: [5, 5, 5] */
  lightSource?: [x: number, y: number, z: number]
  /** Camera lookAt, default: [0, 0, 0] */
  focus?: [x: number, y: number, z: number]
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      causticsProjectionMaterial: ReactThreeFiber.MeshNormalMaterialProps & {
        viewMatrix?: { value: THREE.Matrix4 }
        causticsTexture?: THREE.Texture
        causticsTextureB?: THREE.Texture
        lightProjMatrix?: THREE.Matrix4
        lightViewMatrix?: THREE.Matrix4
      }
    }
  }
}

function createNormalMaterial(side = THREE.FrontSide) {
  const viewMatrix = { value: new THREE.Matrix4() }
  return Object.assign(new THREE.MeshNormalMaterial({ side }) as CausticsProjectionMaterialType, {
    viewMatrix,
    onBeforeCompile: (shader) => {
      shader.uniforms.viewMatrix = viewMatrix
      shader.fragmentShader =
        `vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
           return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
         }\n` +
        shader.fragmentShader.replace(
          '#include <normal_fragment_maps>',
          `#include <normal_fragment_maps>
           normal = inverseTransformDirection( normal, viewMatrix );\n`
        )
    },
  })
}

const CausticsProjectionMaterial = shaderMaterial(
  {
    causticsTexture: null,
    causticsTextureB: null,
    lightProjMatrix: new THREE.Matrix4(),
    lightViewMatrix: new THREE.Matrix4(),
  },
  `varying vec3 vWorldPosition;   
   void main() {
     gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
     vec4 worldPosition = modelMatrix * vec4(position, 1.);
     vWorldPosition = worldPosition.xyz;
   }`,
  `varying vec3 vWorldPosition;
  uniform sampler2D causticsTexture; 
  uniform sampler2D causticsTextureB; 
  uniform mat4 lightProjMatrix;
  uniform mat4 lightViewMatrix;
   void main() {
    // Apply caustics  
    vec4 lightSpacePos = lightProjMatrix * lightViewMatrix * vec4(vWorldPosition, 1.0);
    lightSpacePos.xyz /= lightSpacePos.w;
    lightSpacePos.xyz = lightSpacePos.xyz * 0.5 + 0.5; 
    vec3 front = texture2D(causticsTexture, lightSpacePos.xy).rgb;
    vec3 back = texture2D(causticsTextureB, lightSpacePos.xy).rgb;
    gl_FragColor = vec4(front + back, 1.0);
    #include <tonemapping_fragment>
    #include <encodings_fragment>
   }`
)

const CausticsMaterial = shaderMaterial(
  {
    cameraMatrixWorld: new THREE.Matrix4(),
    cameraProjectionMatrixInv: new THREE.Matrix4(),
    normalTexture: null,
    depthTexture: null,
    lightDir: new THREE.Vector3(0, 1, 0),
    near: 0.1,
    far: 100,
    modelMatrix: new THREE.Matrix4(),
    worldRadius: 1 / 40,
    ior: 1.1,
    bounces: 0,
    resolution: 1024,
    size: 10,
    intensity: 0.5,
  },
  /* glsl */ `
  varying vec2 vUv;
  void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`,
  /* glsl */ `  
  uniform mat4 cameraMatrixWorld;
  uniform mat4 cameraProjectionMatrixInv;
  uniform mat4 modelMatrix;
  uniform vec3 lightDir;
  uniform float near;
  uniform float far;
  uniform float time;
  uniform float worldRadius;
  uniform float resolution;
  uniform float size;
  uniform float intensity;
  uniform float ior;
  precision highp isampler2D;
  precision highp usampler2D;
  uniform sampler2D normalTexture;
  uniform sampler2D depthTexture;
  uniform float bounces;
  varying vec2 vUv;
  vec3 WorldPosFromDepth(float depth, vec2 coord) {
    float z = depth * 2.0 - 1.0;
    vec4 clipSpacePosition = vec4(coord * 2.0 - 1.0, z, 1.0);
    vec4 viewSpacePosition = cameraProjectionMatrixInv * clipSpacePosition;
    // Perspective division
    viewSpacePosition /= viewSpacePosition.w;
    vec4 worldSpacePosition = cameraMatrixWorld * viewSpacePosition;
    return worldSpacePosition.xyz;
  }                  
  float sdPlane( vec3 p, vec3 n, float h ) {
    // n must be normalized
    return dot(p,n) + h;
  }
  float planeIntersect( vec3 ro, vec3 rd, vec4 p ) {
    return -(dot(ro,p.xyz)+p.w)/dot(rd,p.xyz);
  }
  vec3 totalInternalReflection(vec3 ro, vec3 rd, vec3 pos, vec3 normal, float ior, mat4 modelMatrixInverse, out vec3 rayOrigin, out vec3 rayDirection) {
    rayOrigin = ro;
    rayDirection = rd;
    rayDirection = refract(rayDirection, normal, 1.0 / ior);
    rayOrigin = pos + rayDirection * 0.1;
    rayOrigin = (modelMatrixInverse * vec4(rayOrigin, 1.0)).xyz;    
    rayDirection = normalize((modelMatrixInverse * vec4(rayDirection, 0.0)).xyz);
    return rayDirection;
  }
  void main() {
    // Each sample consists of random offset in the x and y direction
    mat4 modelMatrixInverse = inverse(modelMatrix);
    float caustic = 0.0;
    float causticTexelSize = (1.0 / resolution) * size * 2.0;
    float texelsNeeded = worldRadius / causticTexelSize;
    float sampleRadius = texelsNeeded / resolution;
    float sum = 0.0;
    if (texture2D(depthTexture, vUv).x == 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }
    vec2 offset1 = vec2(-0.5, -0.5);//vec2(rand() - 0.5, rand() - 0.5);
    vec2 offset2 = vec2(-0.5, 0.5);//vec2(rand() - 0.5, rand() - 0.5);
    vec2 offset3 = vec2(0.5, 0.5);//vec2(rand() - 0.5, rand() - 0.5);
    vec2 offset4 = vec2(0.5, -0.5);//vec2(rand() - 0.5, rand() - 0.5);
    vec2 uv1 = vUv + offset1 * sampleRadius;
    vec2 uv2 = vUv + offset2 * sampleRadius;
    vec2 uv3 = vUv + offset3 * sampleRadius;
    vec2 uv4 = vUv + offset4 * sampleRadius;
    vec3 normal1 = texture2D(normalTexture, uv1, -10.0).rgb * 2.0 - 1.0;
    vec3 normal2 = texture2D(normalTexture, uv2, -10.0).rgb * 2.0 - 1.0;
    vec3 normal3 = texture2D(normalTexture, uv3, -10.0).rgb * 2.0 - 1.0;
    vec3 normal4 = texture2D(normalTexture, uv4, -10.0).rgb * 2.0 - 1.0;
    float depth1 = texture2D(depthTexture, uv1, -10.0).x;
    float depth2 = texture2D(depthTexture, uv2, -10.0).x;
    float depth3 = texture2D(depthTexture, uv3, -10.0).x;
    float depth4 = texture2D(depthTexture, uv4, -10.0).x;
    // Sanity check the depths
    if (depth1 == 1.0 || depth2 == 1.0 || depth3 == 1.0 || depth4 == 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }
    vec3 pos1 = WorldPosFromDepth(depth1, uv1);
    vec3 pos2 = WorldPosFromDepth(depth2, uv2);
    vec3 pos3 = WorldPosFromDepth(depth3, uv3);
    vec3 pos4 = WorldPosFromDepth(depth4, uv4);
    vec3 originPos1 = WorldPosFromDepth(0.0, uv1);
    vec3 originPos2 = WorldPosFromDepth(0.0, uv2);
    vec3 originPos3 = WorldPosFromDepth(0.0, uv3);
    vec3 originPos4 = WorldPosFromDepth(0.0, uv4);
    vec3 endPos1, endPos2, endPos3, endPos4;
    vec3 endDir1, endDir2, endDir3, endDir4;
    totalInternalReflection(originPos1, lightDir, pos1, normal1, ior, modelMatrixInverse, endPos1, endDir1);
    totalInternalReflection(originPos2, lightDir, pos2, normal2, ior, modelMatrixInverse, endPos2, endDir2);
    totalInternalReflection(originPos3, lightDir, pos3, normal3, ior, modelMatrixInverse, endPos3, endDir3);
    totalInternalReflection(originPos4, lightDir, pos4, normal4, ior, modelMatrixInverse, endPos4, endDir4);
    float lightPosArea = length(cross(originPos2 - originPos1, originPos3 - originPos1)) + length(cross(originPos3 - originPos1, originPos4 - originPos1));
    float t1 = planeIntersect(endPos1, endDir1, vec4(0.0, 1.0, 0.0, 0.0));
    float t2 = planeIntersect(endPos2, endDir2, vec4(0.0, 1.0, 0.0, 0.0));
    float t3 = planeIntersect(endPos3, endDir3, vec4(0.0, 1.0, 0.0, 0.0));
    float t4 = planeIntersect(endPos4, endDir4, vec4(0.0, 1.0, 0.0, 0.0));
    vec3 finalPos1 = endPos1 + endDir1 * t1;
    vec3 finalPos2 = endPos2 + endDir2 * t2;
    vec3 finalPos3 = endPos3 + endDir3 * t3;
    vec3 finalPos4 = endPos4 + endDir4 * t4;
    float finalArea = length(cross(finalPos2 - finalPos1, finalPos3 - finalPos1)) + length(cross(finalPos3 - finalPos1, finalPos4 - finalPos1));
    //gl_FragColor = vec4(lightPosArea, 0.0, 0.0, 1.0);
    //return;
    caustic += intensity * (lightPosArea / finalArea);
    // Calculate the area of the triangle in light spaces
    gl_FragColor = vec4(vec3(max(caustic, 0.0)), 1.0);
  }`
)

const NORMALPROPS = {
  depth: true,
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  encoding: THREE.LinearEncoding,
  type: THREE.UnsignedByteType,
}

const CAUSTICPROPS = {
  minFilter: THREE.LinearMipmapLinearFilter,
  magFilter: THREE.LinearFilter,
  encoding: THREE.LinearEncoding,
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
  generateMipmaps: true,
}

export const Caustics = React.forwardRef(
  (
    {
      debug,
      children,
      frustum = 2,
      ior = 1.1,
      causticsOnly = false,
      backfaces = false,
      backfaceIor = 1.1,
      worldRadius = 0.3125,
      intensity = 0.05,
      resolution = 2024,
      near = 0.1,
      far = 100,
      lightSource = [5, 5, 5],
      focus = [0, 0, 0],
      ...props
    }: CausticsProps,
    fref
  ) => {
    extend({ CausticsProjectionMaterial })

    const ref = React.useRef<THREE.Group>(null!)
    const camera = React.useRef<THREE.OrthographicCamera>(null!)
    const scene = React.useRef<THREE.Scene>(null!)
    const plane = React.useRef<THREE.Mesh<THREE.PlaneGeometry, CausticsProjectionMaterialType>>(null!)
    const gl = useThree((state) => state.gl)
    const helper = useHelper(debug && camera, THREE.CameraHelper)
    useHelper(debug && plane, THREE.BoxHelper)

    // Buffers for front and back faces
    const normalTarget = useFBO(resolution, resolution, NORMALPROPS)
    const normalTargetB = useFBO(resolution, resolution, NORMALPROPS)
    const causticsTarget = useFBO(resolution, resolution, CAUSTICPROPS)
    const causticsTargetB = useFBO(resolution, resolution, CAUSTICPROPS)
    // Normal materials for front and back faces
    const [normalMat] = React.useState(() => createNormalMaterial())
    const [normalMatB] = React.useState(() => createNormalMaterial(THREE.BackSide))
    // The quad that catches the caustics
    const [causticsMaterial] = React.useState(() => new CausticsMaterial() as CausticsMaterialType)
    const [causticsQuad] = React.useState(() => new FullScreenQuad(causticsMaterial))

    React.useLayoutEffect(() => {
      // Update matrix world and the camera
      ref.current.updateWorldMatrix(false, true)
      camera.current.position.set(...lightSource)
      camera.current.lookAt(...focus)
      camera.current.updateWorldMatrix(false, false)
      camera.current.updateProjectionMatrix()
      if (debug) helper.current?.update()

      // Inject uniforms
      normalMatB.viewMatrix.value = normalMat.viewMatrix.value = camera.current.matrixWorldInverse
      causticsMaterial.cameraMatrixWorld = camera.current.matrixWorld
      causticsMaterial.cameraProjectionMatrixInv = camera.current.projectionMatrixInverse
      causticsMaterial.lightDir = camera.current.position.clone().normalize().multiplyScalar(-1)
      causticsMaterial.near = camera.current.near
      causticsMaterial.far = camera.current.far
      causticsMaterial.modelMatrix = scene.current.matrixWorld
      causticsMaterial.resolution = resolution
      causticsMaterial.size = frustum
      causticsMaterial.intensity = intensity
      causticsMaterial.worldRadius = worldRadius

      // Switch the scene on
      scene.current.visible = true

      // Render front face normals
      gl.setRenderTarget(normalTarget)
      gl.clear()
      scene.current.overrideMaterial = normalMat
      gl.render(scene.current, camera.current)

      // Render back face normals, if enabled
      gl.setRenderTarget(normalTargetB)
      gl.clear()
      if (backfaces) {
        scene.current.overrideMaterial = normalMatB
        gl.render(scene.current, camera.current)
      }

      // Remove the override material
      scene.current.overrideMaterial = null

      // Render front face caustics
      causticsMaterial.ior = ior
      plane.current.material.lightProjMatrix = camera.current.projectionMatrix
      plane.current.material.lightViewMatrix = camera.current.matrixWorldInverse
      causticsMaterial.normalTexture = normalTarget.texture
      causticsMaterial.depthTexture = normalTarget.depthTexture
      gl.setRenderTarget(causticsTarget)
      gl.clear()
      causticsQuad.render(gl)

      // Render back face caustics, if enabled
      causticsMaterial.ior = backfaceIor
      causticsMaterial.normalTexture = normalTargetB.texture
      causticsMaterial.depthTexture = normalTargetB.depthTexture
      gl.setRenderTarget(causticsTargetB)
      gl.clear()
      if (backfaces) causticsQuad.render(gl)

      // Reset render target
      gl.setRenderTarget(null)

      // Switch the scene off if caustics is all that's wanted
      if (causticsOnly) scene.current.visible = false
    })

    return (
      <group ref={ref} {...props}>
        <orthographicCamera
          ref={camera}
          up={[0, 1, 0]}
          left={-frustum}
          right={frustum}
          top={frustum}
          bottom={-frustum}
          near={near}
          far={far}
        />
        <scene ref={scene}>{children}</scene>
        <mesh ref={plane} rotation-x={-Math.PI / 2} scale={frustum * 2}>
          <planeGeometry />
          <causticsProjectionMaterial
            transparent
            causticsTexture={causticsTarget.texture}
            causticsTextureB={causticsTargetB.texture}
            blending={THREE.CustomBlending}
            blendSrc={THREE.OneFactor}
            blendDst={THREE.SrcAlphaFactor}
            depthWrite={false}
          />
        </mesh>
      </group>
    )
  }
)
