import * as React from 'react'
import * as THREE from 'three/webgpu'
import { useThree, useFrame, ThreeElements } from '@react-three/fiber'
import { MeshReflectorMaterial as MeshReflectorMaterialImpl } from './MeshReflectorMaterialClass'
import { ForwardRefComponent } from '@utils/ts-utils'

//* Type Declarations ==============================

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshReflectorMaterialWebGPU: ThreeElements['meshStandardMaterial'] & {
      mirror?: number
      mixBlur?: number
      mixStrength?: number
      minDepthThreshold?: number
      maxDepthThreshold?: number
      depthScale?: number
      depthToBlurRatioBias?: number
      distortion?: number
      mixContrast?: number
    }
  }
}

export type MeshReflectorMaterialProps = Omit<ThreeElements['meshStandardMaterial'], 'ref'> & {
  resolution?: number
  blur?: [number, number] | number
  reflectorOffset?: number
  mirror?: number
  mixBlur?: number
  mixStrength?: number
  minDepthThreshold?: number
  maxDepthThreshold?: number
  depthScale?: number
  depthToBlurRatioBias?: number
  distortion?: number
  mixContrast?: number
}

//* MeshReflectorMaterial Component ==============================

/**
 * WebGPU MeshReflectorMaterial - Renders planar reflections using TSL's built-in reflector() node.
 *
 * @example
 * ```tsx
 * <mesh rotation={[-Math.PI / 2, 0, 0]}>
 *   <planeGeometry args={[10, 10]} />
 *   <MeshReflectorMaterial
 *     blur={[300, 100]}
 *     resolution={1024}
 *     mixBlur={1}
 *     mixStrength={0.5}
 *     mirror={0.5}
 *   />
 * </mesh>
 * ```
 */
export const MeshReflectorMaterial: ForwardRefComponent<MeshReflectorMaterialProps, MeshReflectorMaterialImpl> =
  /* @__PURE__ */ React.forwardRef<MeshReflectorMaterialImpl, MeshReflectorMaterialProps>(
    (
      {
        mixBlur = 0,
        mixStrength = 1,
        resolution = 256,
        blur = [0, 0],
        minDepthThreshold = 0.9,
        maxDepthThreshold = 1,
        depthScale = 0,
        depthToBlurRatioBias = 0.25,
        mirror = 0,
        distortion = 1,
        mixContrast = 1,
        reflectorOffset = 0,
        ...props
      },
      ref
    ) => {
      const scene = useThree(({ scene }) => scene)

      // Normalize blur to array and compute blur radius
      const blurArray = Array.isArray(blur) ? blur : [blur, blur]
      const hasBlur = blurArray[0] + blurArray[1] > 0
      // Normalize blur values (typically 0-500) to 0-1 range for blurRadius
      const blurRadius = Math.min(1, (blurArray[0] + blurArray[1]) / 1000)

      //* Create Material Instance ----------------------------------------
      const [material] = React.useState(
        () =>
          new MeshReflectorMaterialImpl(
            {
              resolution,
              mixBlur,
              mixStrength,
              mirror,
              minDepthThreshold,
              maxDepthThreshold,
              depthScale,
              depthToBlurRatioBias,
              distortion,
              mixContrast,
              reflectorOffset,
            },
            props as THREE.MeshStandardMaterialParameters
          )
      )

      // Forward ref
      React.useImperativeHandle(ref, () => material, [material])

      // Ref to track parent mesh
      const parentMeshRef = React.useRef<THREE.Mesh | null>(null)

      //* Add Reflector Target to Scene ----------------------------------------
      // The reflector target needs to be added to the scene for the reflection to work
      React.useEffect(() => {
        const target = material.reflectorTarget
        if (target) {
          scene.add(target)
        }

        return () => {
          if (target) {
            scene.remove(target)
          }
        }
      }, [material, scene])

      //* Sync Reflector Target with Parent Mesh ----------------------------------------
      useFrame(() => {
        // Find parent mesh if not already found
        if (!parentMeshRef.current) {
          // The material is attached to a mesh via R3F's attach="material"
          // We need to find the parent mesh
          const traverse = (obj: THREE.Object3D): THREE.Mesh | null => {
            if (obj instanceof THREE.Mesh && obj.material === material) {
              return obj
            }
            for (const child of obj.children) {
              const found = traverse(child)
              if (found) return found
            }
            return null
          }
          parentMeshRef.current = traverse(scene)
        }

        // Sync reflector target transform with parent mesh
        const parentMesh = parentMeshRef.current
        const target = material.reflectorTarget
        if (parentMesh && target) {
          // Copy the parent mesh's world transform to the reflector target
          target.matrixAutoUpdate = false
          target.matrix.copy(parentMesh.matrixWorld)
        }
      })

      //* Update Uniforms When Props Change ----------------------------------------
      React.useEffect(() => {
        material.mirror = mirror
        material.mixBlur = mixBlur
        material.mixStrength = mixStrength
        material.minDepthThreshold = minDepthThreshold
        material.maxDepthThreshold = maxDepthThreshold
        material.depthScale = depthScale
        material.depthToBlurRatioBias = depthToBlurRatioBias
        material.distortion = distortion
        material.mixContrast = mixContrast
        material.blurRadius = blurRadius
      }, [
        material,
        mirror,
        mixBlur,
        mixStrength,
        minDepthThreshold,
        maxDepthThreshold,
        depthScale,
        depthToBlurRatioBias,
        distortion,
        mixContrast,
        blurRadius,
      ])

      return <primitive object={material} attach="material" {...props} />
    }
  )
