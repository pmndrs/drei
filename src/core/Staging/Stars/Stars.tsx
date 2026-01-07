import * as React from 'react'
import { ThreeElement, useFrame } from '@react-three/fiber'
import { Points, Vector3, Spherical, Color, AdditiveBlending, ShaderMaterial } from '#three'
import { ForwardRefComponent } from '../../../utils/ts-utils'
import { StarfieldMaterial } from '#drei-platform'
export type StarsProps = {
  radius?: number
  depth?: number
  count?: number
  factor?: number
  saturation?: number
  fade?: boolean
  speed?: number
}

const genStar = (r: number) => {
  return new Vector3().setFromSpherical(new Spherical(r, Math.acos(1 - Math.random() * 2), Math.random() * 2 * Math.PI))
}

/**
 * Renders a starfield background effect using points.
 *
 * @example Basic usage
 * ```jsx
 * <Stars radius={100} depth={50} count={5000} factor={4} fade />
 * ```
 */
export const Stars: ForwardRefComponent<StarsProps, Points> = /* @__PURE__ */ React.forwardRef(
  ({ radius = 100, depth = 50, count = 5000, saturation = 0, factor = 4, fade = false, speed = 1 }, ref) => {
    const material = React.useRef<StarfieldMaterial>(null)
    const [position, color, size] = React.useMemo(() => {
      const positions: any[] = []
      const colors: any[] = []
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
    useFrame((state) => {
      const starMat = material.current as StarfieldMaterial
      if (!starMat) return

      starMat.setTime(state.elapsed * speed)
    })

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
