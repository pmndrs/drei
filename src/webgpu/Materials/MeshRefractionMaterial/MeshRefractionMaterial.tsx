//* MeshRefractionMaterial - TSL WebGPU Implementation ==============================
// Diamond/Crystal refraction material with chromatic aberration and fresnel
// Original Author: N8Programs https://github.com/N8python/diamonds
// TSL Conversion: drei webgpu migration - Dennis Smolek
//
// Approximates multiple refraction bounces for convex gem shapes.
// Concave geometry may be inaccurate because rays do not intersect the mesh.

import * as THREE from 'three/webgpu'
import { MeshPhysicalNodeMaterial, type Node } from 'three/webgpu'
import {
  Fn,
  uniform,
  vec3,
  vec4,
  float,
  int,
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
  equirectUV,
  Loop,
  materialReference,
  context,
  materialIOR,
  materialOpacity,
} from 'three/tsl'
import * as React from 'react'
import { extend, ThreeElements } from '@react-three/fiber'
import { ForwardRefComponent } from '@utils/ts-utils'
import { withUniforms } from '@utils/withUniforms'

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
  args?: [fastChroma?: boolean]
}

export type MeshRefractionMaterialProps = Omit<MeshRefractionMaterialType, 'ref'>

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshRefractionMaterial: MeshRefractionMaterialType
  }
}

//* TSL Helper Functions ==============================

// Fresnel effect - stronger at glancing angles
const fresnelEffect = /* @__PURE__ */ Fn(([viewDir, normal, power]: any[]) => {
  const NdotV = float(1.0).add(dot(viewDir, normal))
  return pow(NdotV, power)
})

// Simplified total internal reflection approximation
// Without BVH, we approximate multiple bounces using the surface normal
// and a distance-based estimation
const approximateRefraction = /* @__PURE__ */ Fn(([rayDir, normal, iorValue, bounceCount]: any[]) => {
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
  Loop({ start: 0, end: int(bounceCount), type: 'int' }, ({ i }) => {
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

class MeshRefractionMaterialImpl extends withUniforms(MeshPhysicalNodeMaterial, {
  /** Number of internal bounces, default: 3 */
  bounces: () => uniform(3),
  /** Fresnel intensity, default: 0 */
  fresnel: () => uniform(0),
  /** Chromatic aberration strength, default: 0.01 */
  aberrationStrength: () => uniform(0.01),
  /** Tint applied to the refracted environment, default: white */
  tintColor: () => uniform(new THREE.Color('white')),
}) {
  private _fastChroma: boolean

  /** Type flag for identification */
  readonly isMeshRefractionMaterial = true

  constructor(fastChroma = true) {
    super()

    this._fastChroma = fastChroma

    //* Base Material Properties --
    this.ior = 2.4 // Diamond IOR
    // A texture reference requires a placeholder until an environment is assigned.
    this.envMap = new THREE.Texture()
    // The custom output replaces three's lighting entirely. Skipping it also keeps
    // the placeholder envMap out of the PBR environment path.
    this.lights = false
    this.transparent = true
    this.side = THREE.FrontSide

    this._buildRefractionShader()
  }

  private _buildRefractionShader() {
    const { bounces, fresnel, aberrationStrength, tintColor } = this.uniforms
    const fastChroma = this._fastChroma
    // Each sample needs its own reference node: a texture node caches its UV per node
    const envSample = (uvNode: any) =>
      context(materialReference('envMap', 'texture', this), { getUV: () => uvNode }) as unknown as Node<'vec4'>

    //* Output Node - Custom refraction with chromatic aberration --
    this.outputNode = Fn(() => {
      const worldPos = positionWorld
      const worldNormal = normalize(normalWorld)

      // View direction (from camera to fragment)
      const viewDir = normalize(worldPos.sub(cameraPosition))

      // Base color with tint
      const baseColor = tintColor.toVar()

      //* Sample environment map with refraction --
      // Get refracted direction for green channel (base)
      const iorValue = max(materialIOR, 1.0)
      const refractedDirG = approximateRefraction(viewDir, worldNormal, iorValue, bounces)

      // Chromatic aberration - offset R and B channels
      const aberration = aberrationStrength
      const refractedDirR = vec3(0, 0, 0).toVar()
      const refractedDirB = vec3(0, 0, 0).toVar()

      // Fast chroma just offsets the direction vector
      // Accurate chroma recalculates refraction with different IOR
      if (fastChroma) {
        // Fast: offset direction
        refractedDirR.assign(normalize(refractedDirG.add(vec3(aberration.mul(0.5)))))
        refractedDirB.assign(normalize(refractedDirG.sub(vec3(aberration.mul(0.5)))))
      } else {
        // Accurate: different IOR per channel
        refractedDirR.assign(
          approximateRefraction(viewDir, worldNormal, max(materialIOR.mul(float(1.0).sub(aberration)), 1.0), bounces)
        )
        refractedDirB.assign(
          approximateRefraction(viewDir, worldNormal, max(materialIOR.mul(float(1.0).add(aberration)), 1.0), bounces)
        )
      }

      // Sample environment map for each channel using built-in equirectangular mapping
      const envColorR = envSample(equirectUV(refractedDirR)).r
      const envColorG = envSample(equirectUV(refractedDirG)).g
      const envColorB = envSample(equirectUV(refractedDirB)).b

      const envColor = vec3(envColorR, envColorG, envColorB)

      // Apply tint color
      const tintedColor = envColor.mul(baseColor)

      //* Fresnel effect --
      // Blend toward white at glancing angles
      const fresnelValue = fresnelEffect(viewDir, worldNormal, float(10.0)).mul(fresnel)
      const finalColor = mix(tintedColor, vec3(1.0), fresnelValue)

      return vec4(finalColor, materialOpacity)
    })()
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
