//* MeshRefractionMaterial - TSL WebGPU Implementation ==============================
// Diamond/Crystal refraction material with chromatic aberration and fresnel
// Original Author: N8Programs https://github.com/N8python/diamonds
// TSL Conversion: drei webgpu migration - Dennis Smolek
//
// NOTE: This is a simplified TSL implementation. The original GLSL version uses
// three-mesh-bvh for accurate ray-mesh intersection during total internal reflection.
// TSL support for BVH traversal is pending - see: https://github.com/gkjohnson/three-mesh-bvh
// This version uses an approximated multi-bounce refraction that works well for
// convex gem-like shapes but may not be as accurate for complex concave geometry.

import * as THREE from 'three/webgpu'
import { MeshPhysicalNodeMaterial } from 'three/webgpu'
import {
  Fn,
  uniform,
  uniformTexture,
  vec2,
  vec3,
  vec4,
  float,
  int,
  texture,
  positionWorld,
  normalWorld,
  normalize,
  dot,
  length,
  refract,
  reflect,
  max,
  mix,
  pow,
  select,
  cameraPosition,
  Loop,
} from 'three/tsl'
import * as React from 'react'
import { extend, ThreeElements, useThree } from '@react-three/fiber'
import { ForwardRefComponent } from '@utils/ts-utils'

//* Types ==============================

export type MeshRefractionMaterialType = Omit<ThreeElements['meshPhysicalMaterial'], 'args' | 'color'> & {
  /** Environment map for reflections/refractions */
  envMap?: THREE.CubeTexture | THREE.Texture | null
  /** Number of internal bounces, default: 3 */
  bounces?: number
  /** Index of refraction, default: 2.4 (diamond) */
  ior?: number
  /** Fresnel intensity, default: 0 */
  fresnel?: number
  /** Chromatic aberration strength, default: 0.01 */
  aberrationStrength?: number
  /** Use fast chromatic aberration (less accurate but faster), default: true */
  fastChroma?: boolean
  /** Tint color, default: white */
  tintColor?: THREE.ColorRepresentation
  /** Opacity, default: 1 */
  opacity?: number
}

export type MeshRefractionMaterialProps = Omit<MeshRefractionMaterialType, 'ref'>

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshRefractionMaterial: MeshRefractionMaterialType
  }
}

//* TSL Helper Functions ==============================

// Fresnel effect - stronger at glancing angles
const fresnelEffect = /* @__PURE__ */ Fn((inputs: any[]) => {
  const [viewDir, normal, power] = inputs
  const NdotV = float(1.0).add(dot(viewDir, normal))
  return pow(NdotV, power)
})

// Equirectangular UV mapping for HDR environment maps
const equirectUv = /* @__PURE__ */ Fn((inputs: any[]) => {
  const [direction] = inputs
  const dir = normalize(direction)
  // Convert direction to spherical coordinates
  const u = float(0.5).add(dir.z.atan2(dir.x).div(float(2.0).mul(Math.PI)))
  const v = float(0.5).sub(dir.y.asin().div(Math.PI))
  return vec2(u, v)
})

// Simplified total internal reflection approximation
// Without BVH, we approximate multiple bounces using the surface normal
// and a distance-based estimation
const approximateRefraction = /* @__PURE__ */ Fn((inputs: any[]) => {
  const [rayDir, normal, iorValue, bounceCount, thickness] = inputs
  // Initial refraction at surface entry
  const entryDir = refract(rayDir, normal, float(1.0).div(iorValue)).toVar()

  // Check for total internal reflection at entry
  const entryValid = length(entryDir).greaterThan(0.0)

  // Approximate internal path - for convex shapes, we estimate exit point
  // using the opposite normal and accumulated bounce direction
  const exitNormal = normal.negate().toVar()
  const currentDir = entryDir.toVar()

  // Simulate bounces by progressively perturbing the direction
  // This is an approximation - true accuracy requires BVH ray tracing
  Loop(int(bounceCount), ({ i }) => {
    const fi = float(i).add(1.0)

    // Try to refract out
    const exitDir = refract(currentDir, exitNormal, iorValue)
    const canExit = length(exitDir).greaterThan(0.0)

    // If we can exit, we're done
    // If not, reflect internally and continue
    const reflectedDir = reflect(currentDir, exitNormal)

    // Blend between exit and reflection based on whether exit is possible
    currentDir.assign(select(canExit, exitDir, reflectedDir))

    // Slightly rotate exit normal for next iteration (simulates curved surface)
    exitNormal.assign(normalize(exitNormal.add(reflectedDir.mul(0.1).div(fi))))
  })

  // Return entry direction if refraction failed, otherwise the computed exit direction
  return select(entryValid, currentDir, reflect(rayDir, normal))
})

//* MeshRefractionMaterial Implementation ==============================

class MeshRefractionMaterialImpl extends MeshPhysicalNodeMaterial {
  //* Private Uniform Nodes --
  private _envMap: THREE.TextureNode
  private _bounces: THREE.UniformNode<number>
  private _ior: THREE.UniformNode<number>
  private _fresnel: THREE.UniformNode<number>
  private _aberrationStrength: THREE.UniformNode<number>
  private _color: THREE.UniformNode<THREE.Color>
  private _opacityValue: THREE.UniformNode<number>
  private _resolution: THREE.UniformNode<THREE.Vector2>
  private _thickness: THREE.UniformNode<number>
  private _fastChroma: boolean

  /** Type flag for identification */
  readonly isMeshRefractionMaterial = true

  constructor(fastChroma = true) {
    super()

    this._fastChroma = fastChroma

    //* Initialize Uniforms --
    this._envMap = uniformTexture(new THREE.Texture())
    this._bounces = uniform(3)
    this._ior = uniform(2.4) // Diamond IOR
    this._fresnel = uniform(0)
    this._aberrationStrength = uniform(0.01)
    this._color = uniform(new THREE.Color('white'))
    this._opacityValue = uniform(1.0)
    this._resolution = uniform(new THREE.Vector2(1, 1))
    this._thickness = uniform(1.0) // Approximate thickness for refraction

    //* Base Material Properties --
    this.transparent = true
    this.side = THREE.FrontSide

    this._buildRefractionShader()
  }

  private _buildRefractionShader() {
    //* Capture uniforms for closure --
    const envMapTex = this._envMap
    const bouncesUniform = this._bounces
    const iorUniform = this._ior
    const fresnelUniform = this._fresnel
    const aberrationUniform = this._aberrationStrength
    const colorUniform = this._color
    const opacityUniform = this._opacityValue
    const thicknessUniform = this._thickness
    const fastChroma = this._fastChroma

    //* Output Node - Custom refraction with chromatic aberration --
    this.outputNode = Fn(() => {
      const worldPos = positionWorld
      const worldNormal = normalize(normalWorld)

      // View direction (from camera to fragment)
      const viewDir = normalize(worldPos.sub(cameraPosition))

      // Base color with tint
      const baseColor = colorUniform.toVar()

      //* Sample environment map with refraction --
      // Get refracted direction for green channel (base)
      const refractedDirG = approximateRefraction(
        viewDir,
        worldNormal,
        max(iorUniform, 1.0),
        bouncesUniform,
        thicknessUniform
      )

      // Chromatic aberration - offset R and B channels
      const aberration = aberrationUniform
      const refractedDirR = vec3(0, 0, 0).toVar()
      const refractedDirB = vec3(0, 0, 0).toVar()

      // Fast chroma just offsets the direction vector
      // Accurate chroma recalculates refraction with different IOR
      const useFastChroma = fastChroma

      if (useFastChroma) {
        // Fast: offset direction
        refractedDirR.assign(normalize(refractedDirG.add(vec3(aberration.mul(0.5)))))
        refractedDirB.assign(normalize(refractedDirG.sub(vec3(aberration.mul(0.5)))))
      } else {
        // Accurate: different IOR per channel
        refractedDirR.assign(
          approximateRefraction(
            viewDir,
            worldNormal,
            max(iorUniform.mul(float(1.0).sub(aberration)), 1.0),
            bouncesUniform,
            thicknessUniform
          )
        )
        refractedDirB.assign(
          approximateRefraction(
            viewDir,
            worldNormal,
            max(iorUniform.mul(float(1.0).add(aberration)), 1.0),
            bouncesUniform,
            thicknessUniform
          )
        )
      }

      // Sample environment map for each channel
      // Using equirectangular mapping for 2D textures
      const uvR = equirectUv(refractedDirR)
      const uvG = equirectUv(refractedDirG)
      const uvB = equirectUv(refractedDirB)

      const envColorR = texture(envMapTex, uvR).r
      const envColorG = texture(envMapTex, uvG).g
      const envColorB = texture(envMapTex, uvB).b

      const envColor = vec3(envColorR, envColorG, envColorB)

      // Apply tint color
      const tintedColor = envColor.mul(baseColor)

      //* Fresnel effect --
      // Blend toward white at glancing angles
      const fresnelValue = fresnelEffect(viewDir, worldNormal, float(10.0)).mul(fresnelUniform)
      const finalColor = mix(tintedColor, vec3(1.0), fresnelValue)

      return vec4(finalColor, opacityUniform)
    })()
  }

  //* Uniform Accessors ==============================

  /** Environment map texture */
  get envMap() {
    return this._envMap.value as THREE.Texture
  }
  set envMap(v: THREE.Texture | THREE.CubeTexture | null) {
    if (v) {
      this._envMap.value = v
      // Note: For full cubemap support, would need to rebuild shader
      // Currently using equirectangular mapping for simplicity
    }
  }

  /** Number of internal bounces, default: 3 */
  get bounces() {
    return this._bounces.value as number
  }
  set bounces(v: number) {
    this._bounces.value = v
  }

  /** Index of refraction, default: 2.4 (diamond) */
  get ior() {
    return this._ior.value as number
  }
  set ior(v: number) {
    this._ior.value = v
  }

  /** Fresnel intensity, default: 0 */
  get fresnel() {
    return this._fresnel.value as number
  }
  set fresnel(v: number) {
    this._fresnel.value = v
  }

  /** Chromatic aberration strength, default: 0.01 */
  get aberrationStrength() {
    return this._aberrationStrength.value as number
  }
  set aberrationStrength(v: number) {
    this._aberrationStrength.value = v
  }

  /** Tint color - use tintColor to avoid base class conflict */
  get tintColor(): THREE.Color {
    return this._color.value as THREE.Color
  }
  set tintColor(v: THREE.Color | THREE.ColorRepresentation) {
    if (v instanceof THREE.Color) this._color.value = v
    else this._color.value = new THREE.Color(v)
  }

  /** Opacity, default: 1 */
  get opacity() {
    return this._opacityValue.value as number
  }
  set opacity(v: number) {
    this._opacityValue.value = v
  }

  /** Resolution for screen-space calculations */
  get resolution() {
    return this._resolution.value as THREE.Vector2
  }
  set resolution(v: THREE.Vector2) {
    this._resolution.value = v
  }

  /** Approximate thickness for refraction calculations */
  get thickness() {
    return this._thickness.value as number
  }
  set thickness(v: number) {
    this._thickness.value = v
  }
}

//* React Component ==============================

export const MeshRefractionMaterial: ForwardRefComponent<MeshRefractionMaterialProps, MeshRefractionMaterialImpl> =
  /* @__PURE__ */ React.forwardRef(
    (
      {
        envMap,
        bounces = 3,
        ior = 2.4,
        fresnel = 0,
        aberrationStrength = 0.01,
        fastChroma = true,
        tintColor = 'white',
        opacity = 1,
        ...props
      }: MeshRefractionMaterialProps,
      fref
    ) => {
      extend({ MeshRefractionMaterial: MeshRefractionMaterialImpl })

      const ref = React.useRef<MeshRefractionMaterialImpl>(null!)
      const size = useThree((state) => state.size)

      // Update resolution when size changes
      React.useEffect(() => {
        if (ref.current) {
          ref.current.resolution = new THREE.Vector2(size.width, size.height)
        }
      }, [size])

      // Update material properties
      React.useEffect(() => {
        if (ref.current && envMap) {
          ref.current.envMap = envMap
        }
      }, [envMap])

      // Forward ref
      React.useImperativeHandle(fref, () => ref.current, [])

      return (
        <meshRefractionMaterial
          args={[fastChroma]}
          ref={ref as any}
          {...props}
          bounces={bounces}
          ior={ior}
          fresnel={fresnel}
          aberrationStrength={aberrationStrength}
          tintColor={tintColor instanceof THREE.Color ? tintColor : new THREE.Color(tintColor)}
          opacity={opacity}
        />
      )
    }
  )
