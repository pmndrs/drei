import * as React from 'react'
import * as THREE from '#three'
import { useThree, useFrame, extend, ThreeElement, ThreeElements } from '@react-three/fiber'
import { ForwardRefComponent } from '@utils/ts-utils'
import { SparklesMaterial } from '../../Materials/SparklesMaterial'

//* WebGPU Sparkles Component ==============================
// Based on https://webgpufundamentals.org/webgpu/lessons/webgpu-points.html
//
// WebGPU only supports 1px point primitives, so we use instanced quads instead.
// This component creates a PlaneGeometry and instances it for each particle.
// The SparklesMaterial (SpriteNodeMaterial-based) handles billboarding automatically.

//* Extend SparklesMaterial for JSX usage ==============================
declare module '@react-three/fiber' {
  interface ThreeElements {
    webgpuSparklesMaterial: ThreeElement<typeof SparklesMaterial>
  }
}

//* Utility Functions ==============================
const isFloat32Array = (def: any): def is Float32Array => def && (def as Float32Array).constructor === Float32Array

const expandColor = (v: THREE.Color) => [v.r, v.g, v.b]
const isVector = (v: any): v is THREE.Vector2 | THREE.Vector3 | THREE.Vector4 =>
  v instanceof THREE.Vector2 || v instanceof THREE.Vector3 || v instanceof THREE.Vector4

const normalizeVector = (v: any): number[] => {
  if (Array.isArray(v)) return v
  else if (isVector(v)) return v.toArray()
  return [v, v, v] as number[]
}

function usePropAsIsOrAsAttribute<T extends any>(
  count: number,
  prop?: T | Float32Array,
  setDefault?: (v: T) => number
) {
  return React.useMemo(() => {
    if (prop !== undefined) {
      if (isFloat32Array(prop)) {
        return prop as Float32Array
      } else {
        if (prop instanceof THREE.Color) {
          const a = Array.from({ length: count * 3 }, () => expandColor(prop)).flat()
          return Float32Array.from(a)
        } else if (isVector(prop) || Array.isArray(prop)) {
          const a = Array.from({ length: count * 3 }, () => normalizeVector(prop)).flat()
          return Float32Array.from(a)
        }
        return Float32Array.from({ length: count }, () => prop as number)
      }
    }
    return Float32Array.from({ length: count }, setDefault!)
  }, [prop])
}

//* Sparkles Props ==============================
export type SparklesProps = Omit<ThreeElements['mesh'], 'ref'> & {
  /** Number of particles (default: 100) */
  count?: number
  /** Speed of particles (default: 1) */
  speed?: number | Float32Array
  /** Opacity of particles (default: 1) */
  opacity?: number | Float32Array
  /** Color of particles (default: white) */
  color?: THREE.ColorRepresentation | Float32Array
  /** Size of particles (default: randomized between 0 and 1) */
  size?: number | Float32Array
  /** The space the particles occupy (default: 1) */
  scale?: number | [number, number, number] | THREE.Vector3
  /** Movement factor (default: 1) */
  noise?: number | [number, number, number] | THREE.Vector3 | Float32Array
}

//* WebGPU Sparkles Component ==============================
export const Sparkles: ForwardRefComponent<SparklesProps, THREE.InstancedMesh> = /* @__PURE__ */ React.forwardRef<
  THREE.InstancedMesh,
  SparklesProps
>(({ noise = 1, count = 100, speed = 1, opacity = 1, scale = 1, size, color, children, ...props }, forwardRef) => {
  React.useMemo(() => extend({ WebgpuSparklesMaterial: SparklesMaterial }), [])
  const ref = React.useRef<THREE.InstancedMesh>(null!)
  const dpr = useThree((state) => state.viewport.dpr)

  //* Generate particle data ==============================
  const _scale = normalizeVector(scale)
  const positions = React.useMemo(
    () => Float32Array.from(Array.from({ length: count }, () => _scale.map(THREE.MathUtils.randFloatSpread)).flat()),
    [count, ..._scale]
  )

  const sizes = usePropAsIsOrAsAttribute<number>(count, size, Math.random)
  const opacities = usePropAsIsOrAsAttribute<number>(count, opacity)
  const speeds = usePropAsIsOrAsAttribute<number>(count, speed)
  const noises = usePropAsIsOrAsAttribute<typeof noise>(count * 3, noise)
  const colors = usePropAsIsOrAsAttribute<THREE.ColorRepresentation>(
    color === undefined ? count * 3 : count,
    !isFloat32Array(color) ? new THREE.Color(color) : color,
    () => 1
  )

  //* Create base quad geometry with instanced attributes ==============================
  const geometry = React.useMemo(() => {
    // Simple 1x1 plane - SpriteNodeMaterial handles billboarding
    const geo = new THREE.PlaneGeometry(1, 1)

    // Remove normal attribute - sprites don't need it, and WebGPU has max 8 vertex buffers
    geo.deleteAttribute('normal')

    // Add instanced attributes for particle data
    // These are read per-instance, not per-vertex
    geo.setAttribute('particlePosition', new THREE.InstancedBufferAttribute(positions, 3))
    geo.setAttribute('size', new THREE.InstancedBufferAttribute(sizes, 1))
    geo.setAttribute('opacity', new THREE.InstancedBufferAttribute(opacities, 1))
    geo.setAttribute('speed', new THREE.InstancedBufferAttribute(speeds, 1))
    geo.setAttribute('color', new THREE.InstancedBufferAttribute(colors, 3))
    geo.setAttribute('noise', new THREE.InstancedBufferAttribute(noises, 3))

    return geo
  }, [count, positions, sizes, opacities, speeds, colors, noises])

  //* Update time uniform each frame ==============================
  useFrame((state) => {
    if (ref.current && ref.current.material) {
      (ref.current.material as any).time = state.elapsed
    }
  })

  React.useImperativeHandle(forwardRef, () => ref.current, [])

  return (
    <instancedMesh
      key={`sparkles-${count}-${JSON.stringify(scale)}`}
      ref={ref}
      args={[geometry, undefined, count]}
      {...props}
    >
      {/* @ts-ignore - custom material */}
      {children ? children : <webgpuSparklesMaterial pixelRatio={dpr} />}
    </instancedMesh>
  )
})

