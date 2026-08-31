/*
  PCSS (Percentage Closer Soft Shadows) for WebGPU

  Integration and compilation: @N8Programs
  Inspired by:
    https://github.com/mrdoob/three.js/blob/dev/examples/webgl_shadowmap_pcss.html
    https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-17-efficient-soft-edged-shadows-using
    https://developer.download.nvidia.com/whitepapers/2008/PCSS_Integration.pdf
  Concept:
    https://www.gamedev.net/tutorials/programming/graphics/contact-hardening-soft-shadows-made-fast-r4906/
  Vogel Disk Implementation:
    https://www.shadertoy.com/view/4l3yRM [ashalah]
*/

import * as React from 'react'
import { useThree } from '@react-three/fiber'
import { PCSSShadowNode } from './PCSSShadowNode'
import type { Light } from 'three'

export type SoftShadowsProps = {
  /** Size of the light source (the larger the softer the light), default: 25 */
  size?: number
  /** Number of samples (more samples less noise but more expensive), default: 10 */
  samples?: number
  /** Depth focus, use it to shift the focal point (where the shadow is the sharpest), default: 0 (the beginning) */
  focus?: number
}

/**
 * WebGPU SoftShadows component.
 *
 * Enables PCSS (Percentage Closer Soft Shadows) for all shadow-casting lights in the scene.
 * PCSS creates realistic soft shadows where the shadow edge softness varies based on the
 * distance between the occluder and the receiver surface.
 *
 * @example Basic usage
 * ```tsx
 * <Canvas shadows>
 *   <SoftShadows size={25} samples={10} focus={0} />
 *   <directionalLight castShadow position={[5, 5, 5]} />
 *   <mesh castShadow receiveShadow>
 *     <boxGeometry />
 *     <meshStandardMaterial />
 *   </mesh>
 * </Canvas>
 * ```
 *
 * @example Manual usage with PCSSShadowNode
 * ```tsx
 * import { PCSSShadowNode } from '@react-three/drei/webgpu'
 *
 * function Scene() {
 *   const lightRef = useRef<DirectionalLight>(null!)
 *
 *   useLayoutEffect(() => {
 *     lightRef.current.shadow.shadowNode = new PCSSShadowNode(lightRef.current, {
 *       size: 25,
 *       samples: 10
 *     })
 *   }, [])
 *
 *   return <directionalLight ref={lightRef} castShadow />
 * }
 * ```
 */
export function SoftShadows({ size = 25, samples = 10, focus = 0 }: SoftShadowsProps) {
  const scene = useThree((state) => state.scene)

  React.useLayoutEffect(() => {
    const originalShadowNodes = new Map<string, any>()

    scene.traverse((obj) => {
      const light = obj as Light & { isLight?: boolean; castShadow?: boolean; shadow?: any }
      if (light.isLight && light.castShadow && light.shadow) {
        originalShadowNodes.set(light.uuid, light.shadow.shadowNode)
        light.shadow.shadowNode = new PCSSShadowNode(light, { size, samples, focus })
      }
    })

    return () => {
      scene.traverse((obj) => {
        const light = obj as Light & { isLight?: boolean; shadow?: any }
        if (originalShadowNodes.has(light.uuid)) {
          light.shadow.shadowNode = originalShadowNodes.get(light.uuid)
        }
      })
    }
  }, [scene, size, samples, focus])

  return null
}

export { PCSSShadowNode } from './PCSSShadowNode'
export type { PCSSShadowNodeOptions } from './PCSSShadowNode'
