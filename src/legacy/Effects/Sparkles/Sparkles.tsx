import * as React from 'react'
import * as THREE from '#three'
import { useThree, useFrame, extend, ThreeElement, ThreeElements } from '@react-three/fiber'
import { ForwardRefComponent } from '@utils/ts-utils'
import { SparklesMaterial } from '../../Materials/SparklesMaterial'

//* Legacy Sparkles Component (WebGL) ==============================
// Uses Points geometry with gl_PointSize and gl_PointCoord
// WebGPU cannot use this approach - see webgpu/Effects/Sparkles for the WebGPU version

//* Extend SparklesMaterial for JSX usage ==============================
declare module '@react-three/fiber' {
  interface ThreeElements {
    sparklesMaterial: ThreeElement<typeof SparklesMaterial>
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
export type SparklesProps = Omit<ThreeElements['points'], 'ref'> & {
  /** Number of particles (default: 100) */
  count?: number
  /** Speed of particles (default: 1) */
  speed?: number | Float32Array
  /** Opacity of particles (default: 1) */
  opacity?: number | Float32Array
  /** Color of particles (default: 100) */
  color?: THREE.ColorRepresentation | Float32Array
  /** Size of particles (default: randomized between 0 and 1) */
  size?: number | Float32Array
  /** The space the particles occupy (default: 1) */
  scale?: number | [number, number, number] | THREE.Vector3
  /** Movement factor (default: 1) */
  noise?: number | [number, number, number] | THREE.Vector3 | Float32Array
}

//* Sparkles Component ==============================
/**
 * Floating, glowing particles with customizable movement and appearance.
 * Uses Points geometry with gl_PointSize for efficient rendering.
 *
 * @example Basic usage
 * ```jsx
 * <Sparkles count={100} speed={1} opacity={1} color="white" size={1} />
 * ```
 *
 * @example Custom scale and noise
 * ```jsx
 * <Sparkles count={200} scale={[4, 2, 4]} noise={2} />
 * ```
 */
export const Sparkles: ForwardRefComponent<SparklesProps, THREE.Points> = /* @__PURE__ */ React.forwardRef<
  THREE.Points,
  SparklesProps
>(({ noise = 1, count = 100, speed = 1, opacity = 1, scale = 1, size, color, children, ...props }, forwardRef) => {
  React.useMemo(() => extend({ SparklesMaterial }), [])
  const ref = React.useRef<THREE.Points>(null!)
  const dpr = useThree((state) => state.viewport.dpr)

  const _scale = normalizeVector(scale)
  const positions = React.useMemo(
    () =>
      Float32Array.from(
        Array.from({ length: count }, () => _scale.map((s) => THREE.MathUtils.randFloatSpread(s))).flat()
      ),
    [count, ..._scale]
  )

  const sizes = usePropAsIsOrAsAttribute<number>(count, size, Math.random)
  const opacities = usePropAsIsOrAsAttribute<number>(count, opacity)
  const speeds = usePropAsIsOrAsAttribute<number>(count, speed)
  const noises = usePropAsIsOrAsAttribute<number>(count * 3, noise as number)
  const colors = usePropAsIsOrAsAttribute<THREE.ColorRepresentation>(
    color === undefined ? count * 3 : count,
    !isFloat32Array(color) ? new THREE.Color(color) : color,
    () => 1
  )

  useFrame((state) => {
    if (ref.current && ref.current.material) (ref.current.material as any).time = state.elapsed
  })

  React.useImperativeHandle(forwardRef, () => ref.current, [])

  return (
    <points key={`particle-${count}-${JSON.stringify(scale)}`} {...props} ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-opacity" args={[opacities, 1]} />
        <bufferAttribute attach="attributes-speed" args={[speeds, 1]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-noise" args={[noises, 3]} />
      </bufferGeometry>
      {/* @ts-ignore - transparent and depthWrite are inherited Material properties */}
      {children ? children : <sparklesMaterial pixelRatio={dpr} />}
    </points>
  )
})
