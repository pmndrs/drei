import { createPortal, useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from '#three'
import { ColorRepresentation, Group, Object3D, Vector2, Vector3 } from '#three'
import { Line2, LineGeometry, LineMaterial } from '#three-addons'
import { Line2 as Line2WebGPU } from 'three/examples/jsm/lines/webgpu/Line2.js'
import { Line2NodeMaterial } from 'three/webgpu'
import { ForwardRefComponent } from '../../../utils/ts-utils'

//* Types & Settings ==============================

type Settings = {
  width: number
  length: number
  decay: number
  /**
   * Whether to use the target's world or local positions
   */
  local: boolean
  // Min distance between previous and current points
  stride: number
  // Number of frames to wait before next calculation
  interval: number
}

export type TrailProps = {
  color?: ColorRepresentation
  /**
   * Attenuation function for fading the trail.
   * Returns a value 0-1 that controls the alpha at each point along the trail.
   * Note: With Line2, this affects vertex color intensity rather than line width.
   */
  attenuation?: (t: number) => number
  target?: React.RefObject<Object3D>
} & Partial<Settings>

const defaults: Partial<Settings> = {
  width: 0.2,
  length: 1,
  decay: 1,
  local: false,
  stride: 0,
  interval: 1,
}

//* Utility Functions ==============================

/**
 * Shifts array elements left by `steps` positions and fills the end with the last known position.
 * Using the last position (instead of -Infinity) prevents shader NaN issues.
 */
const shiftLeft = (collection: Float32Array, steps = 1): Float32Array => {
  // Get the last position before shifting (will be used to fill the gap)
  const lastX = collection[collection.length - 3]
  const lastY = collection[collection.length - 2]
  const lastZ = collection[collection.length - 1]

  collection.set(collection.subarray(steps))

  // Fill with last known position instead of -Infinity
  const fillStart = collection.length - steps
  for (let i = fillStart; i < collection.length; i += 3) {
    collection[i] = lastX
    collection[i + 1] = lastY
    collection[i + 2] = lastZ
  }
  return collection
}

//* useTrail Hook ==============================

export function useTrail(target: Object3D, settings: Partial<Settings>, pointCount: number) {
  const { local, decay, interval, stride } = {
    ...defaults,
    ...settings,
  } as Settings

  const points = React.useRef<Float32Array>(null!)
  const [worldPosition] = React.useState(() => new Vector3())

  // Initialize points array when target is available
  React.useLayoutEffect(() => {
    if (target) {
      // Initialize all points to target's current position
      const pos = target.position
      points.current = Float32Array.from({ length: pointCount * 3 }, (_, i) => pos.getComponent(i % 3))
    }
  }, [pointCount, target])

  const prevPosition = React.useRef(new Vector3())
  const frameCount = React.useRef(0)

  useFrame(() => {
    if (!target) return
    if (!points.current) return

    if (frameCount.current === 0) {
      let newPosition: Vector3
      if (local) newPosition = target.position
      else {
        target.getWorldPosition(worldPosition)
        newPosition = worldPosition
      }

      const steps = 1 * decay
      for (let i = 0; i < steps; i++) {
        if (newPosition.distanceTo(prevPosition.current) < stride) continue

        shiftLeft(points.current, 3)
        points.current.set(newPosition.toArray(), points.current.length - 3)
      }
      prevPosition.current.copy(newPosition)
    }

    frameCount.current++
    frameCount.current = frameCount.current % interval
  })

  return points
}

//* Trail Component ==============================

export const Trail: ForwardRefComponent<React.PropsWithChildren<TrailProps>, Line2> = /* @__PURE__ */ React.forwardRef<
  Line2,
  React.PropsWithChildren<TrailProps>
>((props, forwardRef) => {
  const { children } = props
  const { width, length, decay, local, stride, interval } = {
    ...defaults,
    ...props,
  } as Settings

  const { color = 'hotpink', attenuation, target } = props

  const size = useThree((s) => s.size)
  const scene = useThree((s) => s.scene)
  const { isLegacy } = useThree()

  const ref = React.useRef<Group>(null!)
  const [anchor, setAnchor] = React.useState<Object3D>(null!)

  // Calculate point count from length setting (same as original: length * 10)
  const pointCount = length * 10

  const points = useTrail(anchor, { decay, local, stride, interval }, pointCount)

  // Track anchor target
  React.useEffect(() => {
    const t = target?.current || ref.current.children.find((o) => o instanceof Object3D)

    if (t) setAnchor(t)
  }, [points, target])

  // Create Line2 instance (WebGPU or legacy)
  const line = React.useMemo(() => (isLegacy ? new Line2() : new Line2WebGPU()), [isLegacy])

  // Create geometry with initial positions (required for WebGPU shader compilation)
  const geo = React.useMemo(() => {
    const geometry = new LineGeometry()
    // Initialize with at least 2 points at origin to allow shader to compile
    const initialPositions = new Float32Array(pointCount * 3).fill(0)
    const initialColors = new Float32Array(pointCount * 3).fill(1)
    geometry.setPositions(initialPositions as unknown as number[])
    geometry.setColors(initialColors as unknown as number[])
    return geometry
  }, [pointCount])

  const [resolution] = React.useState(() => new Vector2(size.width, size.height))

  // Pre-allocate colors array (RGB per vertex)
  const colorsRef = React.useRef<Float32Array>(new Float32Array(pointCount * 3))
  const baseColor = React.useMemo(() => new THREE.Color(color), [color])

  // Create material based on renderer type
  const mat = React.useMemo(() => {
    if (isLegacy) {
      return new LineMaterial({
        color: 0xffffff, // Use white since we're using vertex colors
        linewidth: width,
        vertexColors: true,
        resolution: new Vector2(size.width, size.height),
        transparent: true,
        alphaToCoverage: true,
      })
    }
    return new Line2NodeMaterial({
      color: 0xffffff,
      linewidth: width,
      worldUnits: false,
      vertexColors: true,
      transparent: true,
      alphaToCoverage: true,
    })
  }, [isLegacy, width, size])

  // Update resolution on size change
  React.useEffect(() => {
    resolution.set(size.width, size.height)
    if ('resolution' in mat) {
      ;(mat as LineMaterial).resolution.set(size.width, size.height)
    }
  }, [size, mat, resolution])

  // Update geometry each frame
  useFrame(() => {
    if (!points.current) return

    const count = points.current.length / 3
    const colors = colorsRef.current

    // Build vertex colors with attenuation applied as color fade
    for (let i = 0; i < count; i++) {
      // t goes from 0 (oldest point) to 1 (newest point)
      const t = i / (count - 1)
      // Apply attenuation function if provided, otherwise linear fade
      const alpha = attenuation ? attenuation(t) : t

      // Multiply base color by alpha to create fade effect
      colors[i * 3 + 0] = baseColor.r * alpha
      colors[i * 3 + 1] = baseColor.g * alpha
      colors[i * 3 + 2] = baseColor.b * alpha
    }

    // Update geometry with positions and colors
    geo.setPositions(points.current as unknown as number[])
    geo.setColors(colors as unknown as number[])
    line.computeLineDistances()
  })

  // Attach geometry and material to line
  React.useLayoutEffect(() => {
    line.geometry = geo
    line.material = mat
  }, [line, geo, mat])

  return (
    <group>
      {createPortal(<primitive object={line} ref={forwardRef} />, scene)}
      <group ref={ref}>{children}</group>
    </group>
  )
})
