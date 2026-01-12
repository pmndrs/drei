import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import { Points, Vector3, Spherical, Color, AdditiveBlending } from '#three'
import { ForwardRefComponent } from '@utils/ts-utils'
import { StarfieldMaterial } from '../../Materials/StarsMaterial'

//* Legacy Stars Component (WebGL) ==============================
// Uses Points geometry with gl_PointSize for variable point sizes
// WebGPU cannot use this approach - see webgpu/Staging/Stars for the WebGPU version

export type StarsProps = {
  /** Radius of the inner sphere (default: 100) */
  radius?: number
  /** Depth of the starfield - stars distributed from radius to radius+depth (default: 50) */
  depth?: number
  /** Number of stars (default: 5000) */
  count?: number
  /** Size multiplier for stars (default: 4) */
  factor?: number
  /** Color saturation 0-1 (default: 0 = white) */
  saturation?: number
  /** Whether stars fade at edges (default: false) */
  fade?: boolean
  /** Animation speed multiplier (default: 1) */
  speed?: number
}

//* Star Position Generator ==============================
const genStar = (r: number) => {
  return new Vector3().setFromSpherical(new Spherical(r, Math.acos(1 - Math.random() * 2), Math.random() * 2 * Math.PI))
}

/**
 * Renders a starfield background effect using points.
 * Legacy WebGL version using gl_PointSize for variable point sizes.
 *
 * @example Basic usage
 * ```jsx
 * <Stars radius={100} depth={50} count={5000} factor={4} fade />
 * ```
 */
export const Stars: ForwardRefComponent<StarsProps, Points> = /* @__PURE__ */ React.forwardRef(
  ({ radius = 100, depth = 50, count = 5000, saturation = 0, factor = 4, fade = false, speed = 1 }, ref) => {
    const material = React.useRef<StarfieldMaterial>(null)

    //* Generate star positions, colors, and sizes ==============================
    const [position, color, size] = React.useMemo(() => {
      const positions: number[] = []
      const colors: number[] = []
      const sizes = Array.from({ length: count }, () => (0.5 + 0.5 * Math.random()) * factor)
      const color = new Color()
      let r = radius + depth
      const increment = depth / count

      for (let i = 0; i < count; i++) {
        r -= increment * Math.random()
        positions.push(...genStar(r).toArray())
        color.setHSL(i / count, saturation, 0.9)
        colors.push(color.r, color.g, color.b)
      }

      return [new Float32Array(positions), new Float32Array(colors), new Float32Array(sizes)]
    }, [count, depth, factor, radius, saturation])

    //* Animate time uniform ==============================
    useFrame((state) => {
      const starMat = material.current
      if (!starMat) return
      starMat.setTime(state.elapsed * speed)
    })

    //* Create material instance ==============================
    const [starfieldMaterial] = React.useState(() => new StarfieldMaterial())

    return (
      <points ref={ref as React.RefObject<Points>}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[position, 3]} />
          <bufferAttribute attach="attributes-color" args={[color, 3]} />
          <bufferAttribute attach="attributes-size" args={[size, 1]} />
        </bufferGeometry>
        <primitive
          ref={material}
          object={starfieldMaterial}
          attach="material"
          blending={AdditiveBlending}
          fadeUniform-value={fade}
          depthWrite={false}
          transparent
          vertexColors
        />
      </points>
    )
  }
)
