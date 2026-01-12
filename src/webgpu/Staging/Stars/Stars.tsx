import * as React from 'react'
import * as THREE from '#three'
import { useFrame, extend, ThreeElement, ThreeElements } from '@react-three/fiber'
import { ForwardRefComponent } from '@utils/ts-utils'
import { StarfieldMaterial } from '../../Materials/StarsMaterial'

//* WebGPU Stars Component ==============================
// Based on https://webgpufundamentals.org/webgpu/lessons/webgpu-points.html
//
// WebGPU only supports 1px point primitives, so we use instanced quads instead.
// Each star is a PlaneGeometry instance with SpriteNodeMaterial for billboarding.

//* Extend StarfieldMaterial for JSX usage ==============================
declare module '@react-three/fiber' {
  interface ThreeElements {
    webgpuStarfieldMaterial: ThreeElement<typeof StarfieldMaterial>
  }
}

export type StarsProps = Omit<ThreeElements['instancedMesh'], 'ref' | 'args'> & {
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
  return new THREE.Vector3().setFromSpherical(
    new THREE.Spherical(r, Math.acos(1 - Math.random() * 2), Math.random() * 2 * Math.PI)
  )
}

/**
 * Renders a starfield background effect using instanced billboarded quads.
 * WebGPU version using SpriteNodeMaterial for proper variable-size stars.
 *
 * @example Basic usage
 * ```jsx
 * <Stars radius={100} depth={50} count={5000} factor={4} fade />
 * ```
 */
export const Stars: ForwardRefComponent<StarsProps, THREE.InstancedMesh> = /* @__PURE__ */ React.forwardRef<
  THREE.InstancedMesh,
  StarsProps
>(
  (
    { radius = 100, depth = 50, count = 5000, saturation = 0, factor = 4, fade = false, speed = 1, children, ...props },
    forwardRef
  ) => {
    React.useMemo(() => extend({ WebgpuStarfieldMaterial: StarfieldMaterial }), [])
    const ref = React.useRef<THREE.InstancedMesh>(null!)

    //* Generate star positions, colors, and sizes ==============================
    const { positions, colors, sizes } = React.useMemo(() => {
      const positions = new Float32Array(count * 3)
      const colors = new Float32Array(count * 3)
      const sizes = new Float32Array(count)
      const color = new THREE.Color()
      let r = radius + depth
      const increment = depth / count

      for (let i = 0; i < count; i++) {
        // Generate star position
        r -= increment * Math.random()
        const pos = genStar(r)
        positions[i * 3] = pos.x
        positions[i * 3 + 1] = pos.y
        positions[i * 3 + 2] = pos.z

        // Generate star color with saturation
        color.setHSL(i / count, saturation, 0.9)
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b

        // Generate star size
        sizes[i] = (0.5 + 0.5 * Math.random()) * factor
      }

      return { positions, colors, sizes }
    }, [count, depth, factor, radius, saturation])

    //* Create base quad geometry with instanced attributes ==============================
    const geometry = React.useMemo(() => {
      // Simple 1x1 plane - SpriteNodeMaterial handles billboarding
      const geo = new THREE.PlaneGeometry(1, 1)

      // Remove normal attribute - sprites don't need it, and WebGPU has max 8 vertex buffers
      geo.deleteAttribute('normal')

      // Add instanced attributes for star data
      // These are read per-instance, not per-vertex
      geo.setAttribute('particlePosition', new THREE.InstancedBufferAttribute(positions, 3))
      geo.setAttribute('color', new THREE.InstancedBufferAttribute(colors, 3))
      geo.setAttribute('size', new THREE.InstancedBufferAttribute(sizes, 1))

      return geo
    }, [count, positions, colors, sizes])

    //* Update time uniform each frame ==============================
    useFrame((state) => {
      if (ref.current?.material) {
        const mat = ref.current.material as StarfieldMaterial
        mat.setTime(state.elapsed * speed)
      }
    })

    //* Update fade uniform when prop changes ==============================
    React.useEffect(() => {
      if (ref.current?.material) {
        const mat = ref.current.material as StarfieldMaterial
        mat.setFade(fade ? 1 : 0)
      }
    }, [fade])

    React.useImperativeHandle(forwardRef, () => ref.current, [])

    return (
      <instancedMesh
        key={`stars-${count}-${radius}-${depth}-${factor}-${saturation}`}
        ref={ref}
        args={[geometry, undefined, count]}
        {...props}
      >
        {/* @ts-ignore - custom material */}
        {children ? children : <webgpuStarfieldMaterial />}
      </instancedMesh>
    )
  }
)
