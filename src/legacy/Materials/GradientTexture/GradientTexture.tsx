import * as React from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

export enum GradientType {
  Linear = 'linear',
  Radial = 'radial',
}

export type GradientTextureProps = {
  /** Array of color stops from 0 to 1 */
  stops: number[]
  /** Array of colors matching the stops */
  colors: string[]
  /** Size of the texture (height), default: 1024 */
  size?: number
  /** Width of the canvas producing the texture, default: 16 */
  width?: number
  /** The type of the gradient, default: GradientType.Linear */
  type?: GradientType
  /** The radius of the inner circle of the gradient, default: 0 */
  innerCircleRadius?: number
  /** The radius of the outer circle of the gradient, default: 'auto' */
  outerCircleRadius?: number | 'auto'
}

/**
 * A declarative THREE.Texture which attaches to "map" by default.
 * You can use this to create gradient backgrounds.
 *
 * @example Linear gradient
 * ```jsx
 * <mesh>
 *   <planeGeometry />
 *   <meshBasicMaterial>
 *     <GradientTexture
 *       stops={[0, 1]}
 *       colors={['aquamarine', 'hotpink']}
 *       size={1024}
 *     />
 *   </meshBasicMaterial>
 * </mesh>
 * ```
 *
 * @example Radial gradient
 * ```jsx
 * <mesh>
 *   <planeGeometry />
 *   <meshBasicMaterial>
 *     <GradientTexture
 *       stops={[0, 0.5, 1]}
 *       colors={['aquamarine', 'hotpink', 'yellow']}
 *       size={1024}
 *       width={1024}
 *       type={GradientType.Radial}
 *       innerCircleRadius={0}
 *       outerCircleRadius={'auto'}
 *     />
 *   </meshBasicMaterial>
 * </mesh>
 * ```
 */
export function GradientTexture({
  stops,
  colors,
  size = 1024,
  width = 16,
  type = GradientType.Linear,
  innerCircleRadius = 0,
  outerCircleRadius = 'auto',
  ...props
}: GradientTextureProps) {
  const gl = useThree((state: any) => state.gl)
  const canvas: HTMLCanvasElement = React.useMemo(() => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = width
    canvas.height = size
    let gradient
    if (type === GradientType.Linear) {
      gradient = context.createLinearGradient(0, 0, 0, size)
    } else {
      const canvasCenterX = canvas.width / 2
      const canvasCenterY = canvas.height / 2
      const radius =
        outerCircleRadius !== 'auto'
          ? Math.abs(Number(outerCircleRadius))
          : Math.sqrt(canvasCenterX ** 2 + canvasCenterY ** 2)
      gradient = context.createRadialGradient(
        canvasCenterX,
        canvasCenterY,
        Math.abs(innerCircleRadius),
        canvasCenterX,
        canvasCenterY,
        radius
      )
    }

    const tempColor = new THREE.Color() // reuse instance for performance
    let i = stops.length
    while (i--) {
      gradient.addColorStop(stops[i], tempColor.set(colors[i]).getStyle())
    }
    context.save()
    context.fillStyle = gradient
    context.fillRect(0, 0, width, size)
    context.restore()

    return canvas
  }, [stops])

  return <canvasTexture colorSpace={gl.outputColorSpace} args={[canvas]} attach="map" {...props} />
}
